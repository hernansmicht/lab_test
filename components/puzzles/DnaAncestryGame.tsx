
import React, { useState, useMemo } from 'react';
import type { Puzzle, GeneticMarker, AncestryData } from '../../types';
import { CheckCircleIcon } from '../icons';
import AncestryGraph from './AncestryGraph';

// --- Types and Constants ---
type AncestryType = AncestryData['population'];
const ANCESTRIES: AncestryType[] = ['European', 'East Asian', 'African'];
const LOCI = ['D3S1358', 'vWA', 'FGA', 'D8S1179', 'D21S11', 'D18S51', 'D5S818', 'D13S317'];

// --- PRNG for deterministic "randomness" ---
const sfc32 = (a: number, b: number, c: number, d: number) => {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
        let t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}


// --- Data Generation ---
const generateAncestryData = (seed: string, population: AncestryType): AncestryData => {
    const seedGen = xmur3(seed + population);
    const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
    
    const markers = LOCI.map((locus, i) => {
        // Base values vary by population for distinction
        let alleleBase = 100 + (Math.sin(i * 0.5 + population.length) * 20);
        let freqBase = 60 + (Math.cos(i * 0.8 + population.length) * 30);

        return {
            locus,
            allele: Math.round(alleleBase + (rand() - 0.5) * 10),
            frequency: Math.round(freqBase + (rand() - 0.5) * 20),
        };
    });
    return { population, markers };
};

const applyDegradation = (markers: GeneticMarker[], seed: string): GeneticMarker[] => {
    const seedGen = xmur3(seed + "-degraded");
    const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
    return markers.map(marker => ({
        ...marker,
        frequency: marker.frequency * (0.8 + rand() * 0.3), // Noisy height
        allele: marker.allele + (rand() - 0.5) * 2, // Noisy position
    }));
}

// --- Main Component ---
interface DnaAncestryGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
}

const DnaAncestryGame: React.FC<DnaAncestryGameProps> = ({ puzzle, onComplete }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Player state
    const [selectedPopulation, setSelectedPopulation] = useState<AncestryType>('European');
    const [alleleShift, setAlleleShift] = useState(-20);
    const [signalGain, setSignalGain] = useState(0.5);
    
    const { evidenceData, evidencePopulationType, referenceDataMap, alleleRange, correctAlleleShift, correctSignalGain } = useMemo(() => {
        let correctPop: AncestryType = 'European';
        const matchResultLower = puzzle.matchResult.toLowerCase();
        if (matchResultLower.includes('east asian')) correctPop = 'East Asian';
        else if (matchResultLower.includes('african')) correctPop = 'African';
        
        const cleanEvidence = generateAncestryData(puzzle.id, correctPop);
        const degradedEvidence = { ...cleanEvidence, markers: applyDegradation(cleanEvidence.markers, puzzle.id) };

        const refMap: Record<AncestryType, AncestryData> = {
            'European': generateAncestryData('ref', 'European'),
            'East Asian': generateAncestryData('ref', 'East Asian'),
            'African': generateAncestryData('ref', 'African'),
        };

        const allAlleles = [...cleanEvidence.markers.map(m => m.allele), ...refMap[correctPop].markers.map(m => m.allele)];
        const range = {
            min: Math.floor(Math.min(...allAlleles) - 15),
            max: Math.ceil(Math.max(...allAlleles) + 15),
        };

        // Calculate the correct offset and gain needed to match the reference to the evidence
        const avgEvidenceAllele = cleanEvidence.markers.reduce((sum, m) => sum + m.allele, 0) / cleanEvidence.markers.length;
        const avgRefAllele = refMap[correctPop].markers.reduce((sum, m) => sum + m.allele, 0) / refMap[correctPop].markers.length;
        const shift = avgEvidenceAllele - avgRefAllele;

        const avgEvidenceFreq = cleanEvidence.markers.reduce((sum, m) => sum + m.frequency, 0) / cleanEvidence.markers.length;
        const avgRefFreq = refMap[correctPop].markers.reduce((sum, m) => sum + m.frequency, 0) / refMap[correctPop].markers.length;
        const gain = avgRefFreq > 0 ? avgEvidenceFreq / avgRefFreq : 1;

        return { 
            evidenceData: degradedEvidence, 
            evidencePopulationType: correctPop, 
            referenceDataMap: refMap, 
            alleleRange: range,
            correctAlleleShift: shift,
            correctSignalGain: gain,
        };
    }, [puzzle.id, puzzle.matchResult]);


    const handleConfirm = () => {
        const populationMatch = selectedPopulation === evidencePopulationType;
        const shiftMatch = Math.abs(alleleShift - correctAlleleShift) <= 2;
        const gainMatch = Math.abs(signalGain - correctSignalGain) <= 0.05;

        if (populationMatch && shiftMatch && gainMatch) {
            setMessage('MATCH CONFIRMED: Profile is consistent with evidence.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            const errors = [];
            if (!populationMatch) errors.push('The population profile pattern is incorrect.');
            if (!shiftMatch) errors.push('The allele shift is not aligned.');
            if (!gainMatch) errors.push('The signal gain is not calibrated.');
            setMessage(`NO MATCH: ${errors[0]}`); // Show first error
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center h-[85vh] max-h-[800px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">ANCESTRY PROFILE COMPLETE</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 h-[85vh] max-h-[800px] flex flex-col">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-1">Genetic Ancestry Profiling</h3>
            <p className="text-center text-slate-400 text-xs mb-3">Align the reference profile to match the evidence.</p>

            <div className="flex-grow p-1 bg-slate-900/50 rounded-lg border border-slate-700 min-h-0">
                <AncestryGraph 
                    evidenceMarkers={evidenceData.markers}
                    referenceMarkers={referenceDataMap[selectedPopulation].markers}
                    seed={puzzle.id}
                    alleleRange={alleleRange}
                    alleleShift={alleleShift}
                    signalGain={signalGain}
                />
            </div>
            
            <div className="mt-4 space-y-4">
                {/* Population Selector */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Reference Population</label>
                    <div className="grid grid-cols-3 gap-2">
                        {ANCESTRIES.map(type => (
                            <button key={type} onClick={() => setSelectedPopulation(type)} className={`py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${selectedPopulation === type ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Tuning Controls */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="allele-shift-range" className="block text-sm font-bold text-slate-300 mb-1">Allele Shift ({alleleShift.toFixed(1)})</label>
                        <input id="allele-shift-range" type="range" 
                            min="-20" max="20" step="0.5"
                            value={alleleShift} 
                            onChange={e => setAlleleShift(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                        <label htmlFor="gain-range" className="block text-sm font-bold text-slate-300 mb-1">Signal Gain ({signalGain.toFixed(2)}x)</label>
                        <input id="gain-range" type="range" 
                            min="0.5" max="1.5" step="0.01"
                            value={signalGain} 
                            onChange={e => setSignalGain(parseFloat(e.target.value))} 
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            </div>
            
            <div className="mt-auto pt-4 text-center">
                <button
                    onClick={handleConfirm}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                    Confirm Analysis
                </button>
                <p className={`text-sm mt-2 h-5 transition-all font-semibold text-yellow-400`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default DnaAncestryGame;
