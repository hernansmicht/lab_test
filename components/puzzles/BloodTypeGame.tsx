
import React, { useState, useMemo } from 'react';
import type { Puzzle } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Types and Constants ---
type WellState = 'empty' | 'no-clump' | 'clump';
type FindingState = WellState | 'unknown';
type TestType = 'Anti-A' | 'Anti-B' | 'Anti-D';
const TEST_TYPES: TestType[] = ['Anti-A', 'Anti-B', 'Anti-D'];
const ALL_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// --- Logic ---
const getReaction = (bloodType: string, reagent: TestType): WellState => {
    const hasA = bloodType.includes('A');
    const hasB = bloodType.includes('B');
    const isPositive = bloodType.includes('+');

    switch (reagent) {
        case 'Anti-A': return hasA ? 'clump' : 'no-clump';
        case 'Anti-B': return hasB ? 'clump' : 'no-clump';
        case 'Anti-D': return isPositive ? 'clump' : 'no-clump';
    }
};

const doesFindingEliminateType = (bloodType: string, test: TestType, finding: WellState): boolean => {
    const reaction = getReaction(bloodType, test);
    return reaction !== finding;
};


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

// --- Sub-components ---
const MicroscopeViewer: React.FC<{ reaction: WellState, seed: string }> = ({ reaction, seed }) => {
    const cells = useMemo(() => {
        const seedGen = xmur3(seed + reaction);
        const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
        const cellCount = 50;
        
        if (reaction === 'clump') {
            const clumps = [{x: 50, y: 50}, {x: 120, y: 80}, {x: 80, y: 130}];
            return Array.from({ length: cellCount }).map(() => {
                const clump = clumps[Math.floor(rand() * clumps.length)];
                const angle = rand() * Math.PI * 2;
                const radius = rand() * 25;
                return { x: clump.x + Math.cos(angle) * radius, y: clump.y + Math.sin(angle) * radius };
            });
        }
        
        // No-clump
        return Array.from({ length: cellCount }).map(() => ({
            x: 20 + rand() * 160,
            y: 20 + rand() * 160,
        }));
    }, [reaction, seed]);

    return (
        <div className="w-full aspect-square bg-slate-900 rounded-full border-4 border-slate-700 p-2">
            <svg viewBox="0 0 200 200" className="w-full h-full bg-red-900/50 rounded-full">
                {reaction === 'empty' ? (
                     <text x="100" y="105" textAnchor="middle" fill="#64748b" className="font-bold text-lg">Select a test to examine</text>
                ) : (
                    cells.map((cell, i) => (
                        <circle key={i} cx={cell.x} cy={cell.y} r="5" fill="#dc2626" opacity="0.8" />
                    ))
                )}
            </svg>
        </div>
    );
};

const BloodTypingGuide: React.FC<{ findings: Record<TestType, FindingState> }> = ({ findings }) => {
    const guideData = [
        { type: 'A+', antiA: 'Clump', antiB: '—', antiD: 'Clump' },
        { type: 'A-', antiA: 'Clump', antiB: '—', antiD: '—' },
        { type: 'B+', antiA: '—', antiB: 'Clump', antiD: 'Clump' },
        { type: 'B-', antiA: '—', antiB: 'Clump', antiD: '—' },
        { type: 'AB+', antiA: 'Clump', antiB: 'Clump', antiD: 'Clump' },
        { type: 'AB-', antiA: 'Clump', antiB: 'Clump', antiD: '—' },
        { type: 'O+', antiA: '—', antiB: '—', antiD: 'Clump' },
        { type: 'O-', antiA: '—', antiB: '—', antiD: '—' },
    ];

    const eliminatedTypes = useMemo(() => {
        const eliminated = new Set<string>();
        for (const bloodType of ALL_BLOOD_TYPES) {
            for (const test of TEST_TYPES) {
                const finding = findings[test];
                if (finding !== 'unknown' && finding !== 'empty') {
                    if (doesFindingEliminateType(bloodType, test, finding as WellState)) {
                        eliminated.add(bloodType);
                        break;
                    }
                }
            }
        }
        return eliminated;
    }, [findings]);

    return (
        <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
            <div className="grid grid-cols-4 text-center gap-y-1">
                <div className="font-bold text-slate-200">Type</div>
                <div className="font-bold text-slate-200">Anti-A</div>
                <div className="font-bold text-slate-200">Anti-B</div>
                <div className="font-bold text-slate-200">Anti-D</div>
                {guideData.map(row => (
                    <React.Fragment key={row.type}>
                        <div className={`font-bold text-green-400 transition-all duration-300 ${eliminatedTypes.has(row.type) ? 'opacity-30 line-through' : ''}`}>{row.type}</div>
                        <div className={`transition-all duration-300 ${eliminatedTypes.has(row.type) ? 'opacity-30 line-through' : ''}`}>{row.antiA}</div>
                        <div className={`transition-all duration-300 ${eliminatedTypes.has(row.type) ? 'opacity-30 line-through' : ''}`}>{row.antiB}</div>
                        <div className={`transition-all duration-300 ${eliminatedTypes.has(row.type) ? 'opacity-30 line-through' : ''}`}>{row.antiD}</div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

// --- Main Game Component ---
const BloodTypeGame: React.FC<{ puzzle: Puzzle; onComplete: (puzzleId: string, resultText: string) => void; }> = ({ puzzle, onComplete }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [viewingWell, setViewingWell] = useState<TestType | null>(null);
    const [findings, setFindings] = useState<Record<TestType, FindingState>>({
        'Anti-A': 'unknown',
        'Anti-B': 'unknown',
        'Anti-D': 'unknown',
    });

    const correctBloodType = useMemo(() => {
        const match = puzzle.matchResult.match(/(A|B|AB|O)[+-]/);
        return match ? match[0] : 'A+';
    }, [puzzle.matchResult]);

    const evidenceReactions = useMemo(() => ({
        'Anti-A': getReaction(correctBloodType, 'Anti-A'),
        'Anti-B': getReaction(correctBloodType, 'Anti-B'),
        'Anti-D': getReaction(correctBloodType, 'Anti-D'),
    }), [correctBloodType]);
    
    const possibleBloodTypes = useMemo(() => {
        return ALL_BLOOD_TYPES.filter(bloodType => {
            return TEST_TYPES.every(test => {
                const finding = findings[test];
                if (finding === 'unknown' || finding === 'empty') return true;
                return !doesFindingEliminateType(bloodType, test, finding as WellState);
            });
        });
    }, [findings]);

    const handleRecordFinding = (testType: TestType, result: WellState) => {
        setFindings(prev => ({...prev, [testType]: result}));
    };

    const handleConfirm = () => {
        if (possibleBloodTypes.length !== 1) return;

        if (possibleBloodTypes[0] === correctBloodType) {
            setMessage('MATCH CONFIRMED: Analysis is correct.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            setMessage('ERROR: Inconsistent finding. Review your analysis.');
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[550px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">BLOOD TYPE ANALYSIS COMPLETE</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }

    const AnalysisControl: React.FC<{testType: TestType}> = ({testType}) => {
        const hasExamined = viewingWell === testType;
        const finding = findings[testType];

        return (
            <div className="bg-slate-800 p-2 rounded-md space-y-2 flex flex-col">
                <p className="font-bold text-center text-slate-300">{testType}</p>
                <button onClick={() => setViewingWell(testType)} className={`w-full py-1 text-sm rounded transition-colors ${viewingWell === testType ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Examine</button>
                <div className="grid grid-cols-2 gap-1 mt-auto">
                    <button
                        onClick={() => handleRecordFinding(testType, 'clump')}
                        disabled={!hasExamined}
                        className="py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 data-[active=true]:bg-yellow-500 data-[active=true]:text-slate-900 font-semibold"
                        data-active={finding === 'clump'}
                    >
                        Clump
                    </button>
                    <button
                        onClick={() => handleRecordFinding(testType, 'no-clump')}
                        disabled={!hasExamined}
                        className="py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed bg-slate-600 hover:bg-slate-500 data-[active=true]:bg-yellow-500 data-[active=true]:text-slate-900 font-semibold"
                        data-active={finding === 'no-clump'}
                    >
                        No Clump
                    </button>
                </div>
            </div>
        );
    };
    
    return (
        <div className="p-2 bg-slate-800 rounded-lg border-2 border-slate-700 flex flex-col space-y-2">
             <h3 className="font-teko text-3xl text-center text-blue-300">Blood Type Analysis</h3>

            {/* Top Section: Microscope */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700">
                 <div className="w-2/3 mx-auto py-2">
                    <MicroscopeViewer 
                        reaction={viewingWell ? evidenceReactions[viewingWell] : 'empty'} 
                        seed={puzzle.id} 
                    />
                </div>
            </div>
            
            {/* Analysis Panel */}
             <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    {TEST_TYPES.map(type => <AnalysisControl key={type} testType={type} />)}
                </div>
            </div>
            
            <BloodTypingGuide findings={findings} />
            
             <div className="text-center bg-slate-900 p-2 rounded-lg">
                <button
                    onClick={handleConfirm}
                    disabled={possibleBloodTypes.length !== 1}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {possibleBloodTypes.length === 1 ? `Confirm Analysis: ${possibleBloodTypes[0]}` : 'Complete All Tests'}
                </button>
                 <p className={`text-sm mt-1 h-5 transition-all font-semibold text-yellow-400`}>
                    {message || ' '}
                </p>
            </div>
        </div>
    );
};

export default BloodTypeGame;
