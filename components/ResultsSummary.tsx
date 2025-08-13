
import React, { useState, useMemo } from 'react';
import type { Suspect, PuzzleResult, Verdicts, Verdict } from '../types';

interface ResultsSummaryProps {
    suspects: Suspect[];
    puzzleResults: PuzzleResult[];
    totalTime: string;
    onRestart: () => void;
}

const getVerdictColor = (verdict: Verdict) => {
    switch (verdict) {
        case 'guilty': return 'bg-red-500 border-red-400';
        case 'accomplice': return 'bg-yellow-500 border-yellow-400';
        case 'innocent': return 'bg-green-500 border-green-400';
        default: return 'bg-slate-600 border-slate-500';
    }
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ suspects, puzzleResults, totalTime, onRestart }) => {
    const [verdicts, setVerdicts] = useState<Verdicts>(() => {
        const initial: Verdicts = {};
        suspects.forEach(s => { initial[s.name] = 'undecided' });
        return initial;
    });

    const resultsBySuspect = useMemo(() => {
        const bySuspect: Record<string, string[]> = {};
        suspects.forEach(s => { bySuspect[s.name] = [] });

        puzzleResults.forEach(r => {
            if (r.isMatch) {
                const matchingSuspect = suspects.find(s => r.result.includes(s.name));
                if (matchingSuspect) {
                    bySuspect[matchingSuspect.name].push(r.result);
                }
            }
        });
        return bySuspect;
    }, [puzzleResults, suspects]);
    
    const setVerdict = (name: string, verdict: Verdict) => {
        setVerdicts(prev => ({...prev, [name]: verdict}));
    };

    return (
        <div className="animate-fade-in">
            <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h2 className="font-teko text-4xl text-green-400">ALL ANALYSES COMPLETE</h2>
                <p className="text-slate-300">Total Investigation Time: <span className="font-bold text-white">{totalTime}</span></p>
            </div>

            <h3 className="font-teko text-3xl text-slate-200 mt-6 mb-3">Lab Results Summary</h3>
            
            <div className="space-y-4">
                {suspects.map(suspect => (
                    <div key={suspect.name} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-start">
                            <img src={suspect.img} alt={suspect.name} className="w-20 h-20 rounded-full border-2 border-slate-600 mr-4" />
                            <div className="flex-grow">
                                <h4 className="text-xl font-bold text-slate-100">{suspect.name}</h4>
                                <p className="text-sm text-slate-400 mb-2">{suspect.description}</p>
                                <div className="mt-2 text-sm">
                                    <h5 className="font-semibold text-red-400">Matching Evidence:</h5>
                                    {resultsBySuspect[suspect.name].length > 0 ? (
                                        <ul className="list-disc list-inside text-slate-300">
                                            {resultsBySuspect[suspect.name].map((res, i) => <li key={i}>{res}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-500 italic">No direct evidence matches.</p>
                                    )}
                                </div>
                            </div>
                            <div className={`ml-2 px-3 py-1 text-sm rounded-full border text-white font-bold transition-colors ${getVerdictColor(verdicts[suspect.name])}`}>
                                {verdicts[suspect.name].toUpperCase()}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                             <button onClick={() => setVerdict(suspect.name, 'innocent')} className="bg-green-600/50 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">Innocent</button>
                             <button onClick={() => setVerdict(suspect.name, 'accomplice')} className="bg-yellow-600/50 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">Accomplice</button>
                             <button onClick={() => setVerdict(suspect.name, 'guilty')} className="bg-red-600/50 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">Guilty</button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="mt-8 text-center">
                <button onClick={onRestart} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                    Close Case File
                </button>
            </div>
        </div>
    );
};

export default ResultsSummary;
