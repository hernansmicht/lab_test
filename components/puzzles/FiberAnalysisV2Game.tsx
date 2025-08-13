

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Puzzle } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Constants & Types ---
// The parameters for the target evidence waveform
const EVIDENCE_WAVEFORM = { alpha: 75, beta: 25, gamma: 60 };

// --- Helper Functions & Components ---
const generateWaveformPath = (params: { alpha: number; beta: number; gamma: number }) => {
    const points = [];
    for (let i = 0; i <= 100; i += 2) {
        const y = 25 +
            Math.sin(i * 0.1 + params.alpha / 10) * (100 - params.alpha) * 0.1 +
            Math.sin(i * 0.3 + params.beta / 10) * (params.beta) * 0.15 +
            Math.sin(i * 0.05 + params.gamma / 10) * (50 - Math.abs(50 - params.gamma)) * 0.2;
        points.push(`${i},${y}`);
    }
    return `M ${points.join(' L ')}`;
};

const SpectrometerGraph: React.FC<{ evidencePath: string; referencePath: string; isMatched: boolean }> = ({ evidencePath, referencePath, isMatched }) => (
    <div className="w-full h-24 bg-slate-900 rounded-lg p-2">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none">
            <path d={evidencePath} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
            <path d={referencePath} fill="none" stroke={isMatched ? '#4ade80' : '#2dd4bf'} strokeWidth="1.5" className="transition-colors duration-300" />
        </svg>
    </div>
);

// --- Main Game Component ---
interface FiberAnalysisV2GameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
}

const FiberAnalysisV2Game: React.FC<FiberAnalysisV2GameProps> = ({ puzzle, onComplete }) => {
    const [equalizer, setEqualizer] = useState({ alpha: 50, beta: 50, gamma: 50 });
    const hasWonRef = useRef(false);

    const evidenceSpectrometerPath = useMemo(() => generateWaveformPath(EVIDENCE_WAVEFORM), []);
    const referenceSpectrometerPath = useMemo(() => generateWaveformPath(equalizer), [equalizer]);

    const isMatched = useMemo(() => {
        if (hasWonRef.current) return true; // Keep green state after winning
        const alphaDiff = Math.abs(equalizer.alpha - EVIDENCE_WAVEFORM.alpha);
        const betaDiff = Math.abs(equalizer.beta - EVIDENCE_WAVEFORM.beta);
        const gammaDiff = Math.abs(equalizer.gamma - EVIDENCE_WAVEFORM.gamma);
        return alphaDiff <= 5 && betaDiff <= 5 && gammaDiff <= 5;
    }, [equalizer]);
    
    useEffect(() => {
        if (isMatched && !hasWonRef.current) {
            hasWonRef.current = true;
            const timer = setTimeout(() => {
                onComplete(puzzle.id, puzzle.matchResult);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isMatched, onComplete, puzzle.id, puzzle.matchResult]);

    const message = isMatched 
        ? 'Match Found! Hidden Dye Signature: Green' 
        : 'Match the reference waveform to the evidence signal.';

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[450px] flex flex-col space-y-3">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-0">Spectrometer Calibration</h3>

            <div className="text-center">
                <p className="font-teko text-lg text-slate-400 tracking-wider">EVIDENCE SAMPLE</p>
                <div className={`w-32 h-16 mx-auto rounded-lg border-2 border-slate-600 transition-colors duration-500 ${isMatched ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>
            
            {/* THIS IS THE KEY LAYOUT FIX: Separating graph from controls */}
            <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <SpectrometerGraph evidencePath={evidenceSpectrometerPath} referencePath={referenceSpectrometerPath} isMatched={isMatched} />
            </div>

            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
                <p className="text-center font-bold text-slate-300">Signal Equalizers</p>
                <div className="text-xs space-y-2 text-slate-300">
                     <label>Alpha: <input type="range" min="0" max="100" value={equalizer.alpha} onChange={e => setEqualizer(p => ({...p, alpha: +e.target.value}))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" /></label>
                     <label>Beta: <input type="range" min="0" max="100" value={equalizer.beta} onChange={e => setEqualizer(p => ({...p, beta: +e.target.value}))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" /></label>
                     <label>Gamma: <input type="range" min="0" max="100" value={equalizer.gamma} onChange={e => setEqualizer(p => ({...p, gamma: +e.target.value}))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" /></label>
                </div>
            </div>
            
            <div className="mt-auto pt-2 text-center">
                 <p className={`text-sm mt-1 h-5 transition-all font-semibold ${isMatched ? 'text-green-400' : 'text-yellow-400'}`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default FiberAnalysisV2Game;