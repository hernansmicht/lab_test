
import React, { useState, useMemo, useEffect } from 'react';
import type { Puzzle, Suspect, BallisticsData } from '../../types';
import BallisticsCasing from './BallisticsCasing';
import { CheckCircleIcon } from '../icons';

type AnalysisMode = 'firingPin' | 'breechFace' | 'ejectorMark';
const FIRING_PIN_SHAPES: BallisticsData['firingPinShape'][] = ['circle', 'oval', 'star'];
const CORRECT_BREECH_ROTATION = 135; // The correct angle to match

// A type for our findings, separating UI state from data
interface BallisticsFinding extends Partial<Omit<BallisticsData, 'breechSeed'>> {
    breechRotation?: number;
}

// Deterministic data generation
const generateBallisticsData = (seed: string, correctSuspectName: string, currentSuspectName: string): BallisticsData => {
    const isCorrect = correctSuspectName === currentSuspectName;
    const baseHash = (str: string) => str.split('').reduce((acc, char) => acc + char.charCodeAt(0) * 17, 0);
    
    // The correct suspect gets the true data derived from the puzzle ID
    const evidencePinIndex = baseHash(seed) % 3;
    const evidenceEjectorAngle = (baseHash(seed) * 23) % 360;
    
    if (isCorrect) {
        return {
            firingPinShape: FIRING_PIN_SHAPES[evidencePinIndex],
            breechSeed: seed, // Correct suspect has same breech marks as evidence
            ejectorAngle: evidenceEjectorAngle,
        };
    }

    // Decoys get altered data
    const decoyHash = baseHash(currentSuspectName);
    return {
        // Decoy 1 might have the right pin shape but wrong everything else
        firingPinShape: (currentSuspectName.length % 2 === 0) ? FIRING_PIN_SHAPES[evidencePinIndex] : FIRING_PIN_SHAPES[(decoyHash) % 3],
        // All decoys have different breech marks
        breechSeed: `${seed}-${currentSuspectName}`,
        // Decoy 2 might have the right ejector angle but wrong pin
        ejectorAngle: (currentSuspectName.length % 2 !== 0) ? evidenceEjectorAngle : (decoyHash * 19) % 360,
    };
};


interface BallisticsMatchGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
    suspects: Suspect[];
}

const BallisticsMatchGame: React.FC<BallisticsMatchGameProps> = ({ puzzle, onComplete, suspects }) => {
    const [mode, setMode] = useState<AnalysisMode>('breechFace');
    const [currentSuspectIndex, setCurrentSuspectIndex] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // State to hold player's findings for each suspect
    const [findings, setFindings] = useState<Record<string, BallisticsFinding>>({});
    
    const { evidenceData, suspectSamples } = useMemo(() => {
        const correctSuspect = suspects.find(s => puzzle.matchResult.includes(s.name));
        if (!correctSuspect) throw new Error("Puzzle misconfigured: no correct suspect.");

        const eData = generateBallisticsData(puzzle.id, correctSuspect.name, correctSuspect.name);
        const sSamples = suspects.map(s => ({
            suspect: s,
            data: generateBallisticsData(puzzle.id, correctSuspect.name, s.name)
        }));
        
        return { evidenceData: eData, suspectSamples: sSamples };
    }, [puzzle.id, puzzle.matchResult, suspects]);

    // This effect ensures that when a user views a suspect's sample for the first
    // time, its state is initialized to a neutral default, preventing UI "jumps".
    useEffect(() => {
        if (!suspectSamples[currentSuspectIndex]) return;

        const currentSuspectName = suspectSamples[currentSuspectIndex].suspect.name;
        if (!findings[currentSuspectName]) {
            setFindings(prev => ({
                ...prev,
                [currentSuspectName]: {
                    firingPinShape: FIRING_PIN_SHAPES[0], // A neutral default
                    breechRotation: 0,
                    ejectorAngle: 0,
                }
            }));
        }
    }, [currentSuspectIndex, suspectSamples, findings]);

    const currentSuspect = suspectSamples[currentSuspectIndex];
    // Use nullish coalescing for a safe default
    const currentFinding = findings[currentSuspect?.suspect.name] ?? {};

    const updateFinding = (key: keyof BallisticsFinding, value: any) => {
        if (!currentSuspect) return;
        setFindings(prev => ({
            ...prev,
            [currentSuspect.suspect.name]: {
                ...(prev[currentSuspect.suspect.name] ?? {}),
                [key]: value
            }
        }));
    };
    
    const handleConfirm = () => {
        if (!currentSuspect) return;
        const suspectName = currentSuspect.suspect.name;
        const finding = findings[suspectName] ?? {};
        
        const isCorrectSuspect = puzzle.matchResult.includes(suspectName);
        const pinMatch = finding.firingPinShape === evidenceData.firingPinShape;
        const breechMatch = Math.abs((finding.breechRotation ?? 0) - CORRECT_BREECH_ROTATION) <= 5;
        const ejectorMatch = Math.abs((finding.ejectorAngle ?? 0) - evidenceData.ejectorAngle) <= 5;

        if (isCorrectSuspect && pinMatch && breechMatch && ejectorMatch) {
            setMessage('MATCH CONFIRMED: All markings are consistent.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            const errorMessages: string[] = [];
            if (!isCorrectSuspect) {
                setMessage(`NO MATCH for ${suspectName}. Evidence is inconsistent.`);
            } else {
                // Correct suspect, but wrong details.
                if (!pinMatch) errorMessages.push('Firing pin shape is incorrect.');
                if (!breechMatch) errorMessages.push('Breech marks are not aligned.');
                if (!ejectorMatch) errorMessages.push('Ejector mark position is wrong.');
                setMessage(errorMessages.join(' '));
            }
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">BALLISTICS MATCH CONFIRMED</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }

    // This prevents errors on the very first render before useEffect runs
    if (!currentSuspect) {
        return <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">Loading...</div>;
    }

    const renderControls = () => {
        switch(mode) {
            case 'firingPin':
                const currentShape = currentFinding.firingPinShape ?? FIRING_PIN_SHAPES[0];
                const currentShapeIndex = FIRING_PIN_SHAPES.indexOf(currentShape);
                return <>
                    <p className="text-center text-sm text-slate-400 mb-2">Cycle through known firing pin types.</p>
                    <button onClick={() => updateFinding('firingPinShape', FIRING_PIN_SHAPES[(currentShapeIndex + 1) % FIRING_PIN_SHAPES.length])} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Shape: <span className="text-yellow-300 uppercase">{currentShape}</span>
                    </button>
                </>;
            case 'breechFace':
                const rotation = currentFinding.breechRotation ?? 0;
                return <>
                    <p className="text-center text-sm text-slate-400">Rotate to align breech face marks.</p>
                    <input type="range" min="0" max="360" value={rotation} onChange={e => updateFinding('breechRotation', parseInt(e.target.value))} className="w-full h-2 my-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    <p className="text-center font-mono font-bold text-lg text-white">{rotation}°</p>
                </>;
            case 'ejectorMark':
                const angle = currentFinding.ejectorAngle ?? 0;
                return <>
                    <p className="text-center text-sm text-slate-400">Adjust ejector mark position.</p>
                    <input type="range" min="0" max="360" value={angle} onChange={e => updateFinding('ejectorAngle', parseInt(e.target.value))} className="w-full h-2 my-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    <p className="text-center font-mono font-bold text-lg text-white">{angle}°</p>
                </>;
        }
    }
    
    // Construct the data for the sample casing using findings.
    // The breechSeed is the immutable part of the evidence.
    const sampleRenderData: BallisticsData = {
        breechSeed: currentSuspect.data.breechSeed,
        firingPinShape: currentFinding.firingPinShape ?? FIRING_PIN_SHAPES[0],
        ejectorAngle: currentFinding.ejectorAngle ?? 0,
    };

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-2">Ballistics Analysis</h3>
            
            <div className="grid grid-cols-3 gap-2 my-4">
                {(['breechFace', 'firingPin', 'ejectorMark'] as AnalysisMode[]).map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`py-1 px-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {m.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                ))}
            </div>

            {/* Viewers */}
            <div className="flex gap-2">
                <div className="w-1/2 text-center">
                    <p className="font-teko text-xl text-slate-400 tracking-wider">EVIDENCE</p>
                    <div className="aspect-square p-1 bg-slate-900 rounded-full border border-slate-600">
                        <BallisticsCasing data={evidenceData} rotation={CORRECT_BREECH_ROTATION} />
                    </div>
                </div>
                <div className="w-1/2 text-center">
                    <p className="font-teko text-xl text-slate-300 tracking-wider">SAMPLE</p>
                    <div className="aspect-square p-1 bg-slate-900 rounded-full border border-slate-600">
                        <BallisticsCasing data={sampleRenderData} rotation={currentFinding.breechRotation ?? 0} />
                    </div>
                </div>
            </div>

            {/* Suspect Selector */}
            <div className="flex justify-between items-center my-2 p-2 bg-slate-900/50 rounded-md">
                <button onClick={() => setCurrentSuspectIndex((i) => (i - 1 + suspects.length) % suspects.length)} className="px-2 py-1 bg-slate-700 rounded-md">{'<'}</button>
                <span className="font-bold text-slate-200">{currentSuspect.suspect.name}'s Firearm</span>
                <button onClick={() => setCurrentSuspectIndex((i) => (i + 1) % suspects.length)} className="px-2 py-1 bg-slate-700 rounded-md">{'>'}</button>
            </div>

            {/* Controls */}
            <div className="my-2">{renderControls()}</div>
            
            <div className="mt-4 text-center">
                <button
                    onClick={handleConfirm}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                    Declare Match for {currentSuspect.suspect.name}
                </button>
                <p className={`text-sm mt-2 h-5 transition-all font-semibold text-yellow-400`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default BallisticsMatchGame;
