
import React, { useState, useMemo } from 'react';
import type { Puzzle, BallisticsData } from '../../types';
import BallisticsCasing from './BallisticsCasing';
import { CheckCircleIcon } from '../icons';

const SAMPLES_COUNT = 3;

// Deterministic data generation
const generateBallisticsData = (seed: string, isEvidence: boolean, sampleIndex?: number): BallisticsData => {
    const baseHash = (str: string) => str.split('').reduce((acc, char) => acc + char.charCodeAt(0) * 17, 0);
    const seedString = isEvidence ? seed : `${seed}-sample-${sampleIndex}`;
    
    return {
        firingPinShape: 'circle', // Not relevant for this puzzle, keep it simple
        breechSeed: seedString, // This ensures evidence is unique from samples
        ejectorAngle: (baseHash(seedString) * 23) % 360,
    };
};

interface BallisticsV2MatchGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
}

const BallisticsV2MatchGame: React.FC<BallisticsV2MatchGameProps> = ({ puzzle, onComplete }) => {
    const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
    const [checkedSamples, setCheckedSamples] = useState<boolean[]>(Array(SAMPLES_COUNT).fill(false));
    const [rotation, setRotation] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { evidenceData, sampleData } = useMemo(() => {
        const eData = generateBallisticsData(puzzle.id, true);
        const sData = Array.from({ length: SAMPLES_COUNT }, (_, i) => generateBallisticsData(puzzle.id, false, i));
        return { evidenceData: eData, sampleData: sData };
    }, [puzzle.id]);

    const allSamplesChecked = useMemo(() => checkedSamples.every(Boolean), [checkedSamples]);
    
    const handleDeclareSampleMatch = (isMatch: boolean) => {
        // In this version, the correct answer is always "No Match"
        if (!isMatch) {
            setMessage(`CORRECT: Sample ${currentSampleIndex + 1} does not match.`);
             setCheckedSamples(prev => {
                const newChecked = [...prev];
                newChecked[currentSampleIndex] = true;
                return newChecked;
            });
        } else {
             setMessage(`INCORRECT: Re-examine the markings for Sample ${currentSampleIndex + 1}.`);
        }
        setTimeout(() => setMessage(null), 2500);
    };

    const handleDeclareFinal = (declaration: 'registered' | 'unregistered') => {
        const isCorrect = declaration === 'unregistered'; // The win condition for this puzzle

        if (isCorrect) {
            setMessage('CORRECT: Analysis confirmed the firearm is not in the database.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            setMessage('INCORRECT: The evidence does not match any registered sample.');
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    if (isSuccess) {
        return (
            <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">ANALYSIS COMPLETE</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    const currentSample = sampleData[currentSampleIndex];

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-2">Ballistics Analysis V2</h3>
             <p className="text-center text-sm text-slate-400 mb-4">Compare evidence to registered samples.</p>

            {/* Viewers */}
            <div className="flex gap-2">
                <div className="w-1/2 text-center">
                    <p className="font-teko text-xl text-slate-400 tracking-wider">EVIDENCE</p>
                    <div className="aspect-square p-1 bg-slate-900 rounded-full border border-slate-600">
                        <BallisticsCasing data={evidenceData} rotation={rotation} />
                    </div>
                </div>
                <div className="w-1/2 text-center">
                    <p className="font-teko text-xl text-slate-300 tracking-wider">DATABASE SAMPLE</p>
                    <div className="aspect-square p-1 bg-slate-900 rounded-full border border-slate-600">
                        <BallisticsCasing data={currentSample} />
                    </div>
                </div>
            </div>

             {/* Rotation Controls */}
            <div className="my-4">
                <p className="text-center text-sm text-slate-400">Rotate evidence casing to compare marks.</p>
                <input type="range" min="0" max="360" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full h-2 my-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                <p className="text-center font-mono font-bold text-lg text-white">{rotation}°</p>
            </div>

            {/* Sample Selector */}
            <div className="flex justify-between items-center my-2 p-2 bg-slate-900/50 rounded-md">
                <button onClick={() => setCurrentSampleIndex((i) => (i - 1 + SAMPLES_COUNT) % SAMPLES_COUNT)} className="px-2 py-1 bg-slate-700 rounded-md">{'<'}</button>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">Sample {currentSampleIndex + 1}</span>
                    {checkedSamples[currentSampleIndex] && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                </div>
                <button onClick={() => setCurrentSampleIndex((i) => (i + 1) % SAMPLES_COUNT)} className="px-2 py-1 bg-slate-700 rounded-md">{'>'}</button>
            </div>
            
            <div className="mt-4 text-center">
                {allSamplesChecked ? (
                    <div className="space-y-2">
                        <p className="text-sm text-slate-300 font-bold">All samples compared. Make your conclusion.</p>
                         <button
                            onClick={() => handleDeclareFinal('registered')}
                            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                            Declare Gun Registered
                        </button>
                        <button
                            onClick={() => handleDeclareFinal('unregistered')}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors mt-2"
                        >
                            Declare Gun Unregistered
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleDeclareSampleMatch(false)}
                            disabled={checkedSamples[currentSampleIndex]}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            No Match
                        </button>
                         <button
                            onClick={() => handleDeclareSampleMatch(true)}
                            disabled={checkedSamples[currentSampleIndex]}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            Match
                        </button>
                    </div>
                )}
                <p className={`text-sm mt-2 h-5 transition-all font-semibold text-yellow-400`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default BallisticsV2MatchGame;
