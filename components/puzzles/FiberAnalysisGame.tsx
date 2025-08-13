import React, { useState, useMemo } from 'react';
import type { Puzzle, Suspect, FiberData } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Helper Functions & Components ---

// Deterministic data generation based on a seed
const generateFiberData = (seed: string, isVisuallySimilarDecoy = false): FiberData => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0) * 13, 0);
    const colors = [
        `hsl(${(hash * 30) % 360}, 70%, 50%)`,
        `hsl(${(hash * 55) % 360}, 65%, 45%)`,
    ];
    const weave = Array.from({ length: 12 }, (_, i) => (hash + i * 3) % 2);
    
    // The spectrum data will be different for the decoy
    const spectrumSeed = isVisuallySimilarDecoy ? hash + 1 : hash;
    const spectrum = Array.from({ length: 10 }, (_, i) => 
        (Math.sin((spectrumSeed + i) * 0.5) * 20 + 50) + (isVisuallySimilarDecoy ? 15 : 0)
    );
    
    // UV reactivity will be different for the decoy
    const uvReactive = isVisuallySimilarDecoy ? ((hash + 1) % 4 === 0) : (hash % 4 === 0);

    return { colors, weave, spectrum, uvReactive };
};

const FiberWeave: React.FC<{ pattern: FiberData }> = ({ pattern }) => (
    <div className="flex w-full h-12 bg-slate-800 rounded-md overflow-hidden border border-slate-700/50">
        {pattern.weave.map((colorIndex, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: pattern.colors[colorIndex] }} />
        ))}
    </div>
);

const SpectrometerGraph: React.FC<{ data: number[] }> = ({ data }) => {
    const points = data.map((d, i) => `${i * (100 / 9)},${100 - d}`).join(' ');
    return (
        <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
            <polyline fill="none" stroke="#2dd4bf" strokeWidth="2" points={points} />
        </svg>
    );
};

const UVView: React.FC<{ isReactive: boolean }> = ({ isReactive }) => (
    <div className={`w-full h-12 flex items-center justify-center rounded-md border border-slate-700/50 ${isReactive ? 'bg-purple-900' : 'bg-slate-800'}`}>
        {isReactive && <div className="w-5/6 h-3/4 bg-purple-400 rounded-full blur-xl animate-pulse" />}
        {!isReactive && <p className="text-xs text-slate-500">No Reaction</p>}
    </div>
);

const AnalysisView: React.FC<{ mode: string, data: FiberData }> = ({ mode, data }) => {
    switch (mode) {
        case 'visual': return <FiberWeave pattern={data} />;
        case 'spectrometer': return <SpectrometerGraph data={data.spectrum} />;
        case 'uv': return <UVView isReactive={data.uvReactive} />;
        default: return null;
    }
};

// --- Main Component ---

interface FiberAnalysisGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
    suspects: Suspect[];
}

const FiberAnalysisGame: React.FC<FiberAnalysisGameProps> = ({ puzzle, onComplete, suspects }) => {
    const [mode, setMode] = useState('visual');
    const [currentSuspectIndex, setCurrentSuspectIndex] = useState(0);
    const [selectedSuspectName, setSelectedSuspectName] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { evidenceData, suspectData } = useMemo(() => {
        const correctSuspect = suspects.find(s => puzzle.matchResult.includes(s.name));
        if (!correctSuspect) throw new Error("Puzzle is misconfigured: No correct suspect found in matchResult.");

        const eData = generateFiberData(puzzle.id);
        const decoyToMakeSimilar = suspects.find(s => s.name !== correctSuspect.name);

        const sData = suspects.map(suspect => {
            if (suspect.name === correctSuspect.name) {
                return { suspect, data: eData };
            }
            const isSimilar = suspect.name === decoyToMakeSimilar?.name;
            // Make the similar decoy use the evidence's visual seed but flag it to change other properties
            const seed = isSimilar ? puzzle.id : `${puzzle.id}-${suspect.name}`;
            return { suspect, data: generateFiberData(seed, isSimilar) };
        });

        return { evidenceData: eData, suspectData: sData };
    }, [puzzle.id, puzzle.matchResult, suspects]);

    const handleConfirm = () => {
        if (!selectedSuspectName) {
            setMessage('Please select a suspect to confirm.');
            setTimeout(() => setMessage(null), 2000);
            return;
        }
        
        const isMatch = puzzle.matchResult.includes(selectedSuspectName);

        if (isMatch) {
            setMessage('MATCH CONFIRMED: All fiber properties are consistent.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            setMessage('NO MATCH. Re-examine the samples using all modes.');
            setTimeout(() => setMessage(null), 2000);
        }
    };
    
    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">FIBER MATCH CONFIRMED</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    const currentSuspect = suspectData[currentSuspectIndex];

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-2">Fiber Analysis</h3>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2 my-4">
                {['visual', 'spectrometer', 'uv'].map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`py-1 px-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {m}
                    </button>
                ))}
            </div>

            {/* Evidence View */}
            <div className="mb-4">
                <p className="font-teko text-xl text-slate-400 tracking-wider text-center mb-1">EVIDENCE FIBER</p>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-600">
                    <AnalysisView mode={mode} data={evidenceData} />
                </div>
            </div>

            {/* Suspect Sample View */}
            <div className="mb-4">
                <p className="font-teko text-xl text-slate-300 tracking-wider text-center mb-1">SUSPECT SAMPLE</p>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-center mb-2">
                        <button onClick={() => setCurrentSuspectIndex((i) => (i - 1 + suspects.length) % suspects.length)} className="px-2 py-1 bg-slate-700 rounded-md">{'<'}</button>
                        <span className="font-bold text-slate-200">{currentSuspect.suspect.name}'s Jacket</span>
                        <button onClick={() => setCurrentSuspectIndex((i) => (i + 1) % suspects.length)} className="px-2 py-1 bg-slate-700 rounded-md">{'>'}</button>
                    </div>
                    <AnalysisView mode={mode} data={currentSuspect.data} />
                </div>
            </div>
            
            {/* Confirmation */}
            <div className="mt-4 text-center">
                 <div className="flex items-center gap-3">
                    <select 
                        value={selectedSuspectName || ''}
                        onChange={(e) => setSelectedSuspectName(e.target.value)}
                        className="w-full bg-slate-700 text-white p-3 rounded-md border-slate-600 border"
                    >
                        <option value="" disabled>Select suspect to accuse...</option>
                        {suspects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedSuspectName}
                    className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Confirm Match
                </button>
                 <p className={`text-sm mt-2 h-5 transition-all font-semibold text-yellow-400`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default FiberAnalysisGame;