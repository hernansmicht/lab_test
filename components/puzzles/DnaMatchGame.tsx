
import React, { useState, useMemo, useEffect } from 'react';
import type { Puzzle } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Game Configuration ---
const EVIDENCE_SEQUENCE = ['GCTAG', 'TCAGA', 'ATCCG', 'GGTAC'];
const DECOY_FRAGMENTS = ['AAAAA', 'GCGCG', 'CCTAG', 'AGTGA'];

const basePairMap: { [key: string]: string } = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
const getComplement = (sequence: string): string => {
    return sequence.split('').map(base => basePairMap[base]).join('');
};

const CORRECT_FRAGMENTS = EVIDENCE_SEQUENCE.map(getComplement);
const ALL_FRAGMENTS = [...CORRECT_FRAGMENTS, ...DECOY_FRAGMENTS].sort(() => Math.random() - 0.5);

const DnaBase: React.FC<{ base: string }> = ({ base }) => {
    const baseColors: { [key: string]: string } = {
        'A': 'bg-blue-500 border-blue-400',
        'T': 'bg-sky-500 border-sky-400',
        'G': 'bg-green-500 border-green-400',
        'C': 'bg-emerald-500 border-emerald-400',
    };
    return (
        <div className={`w-6 h-6 flex items-center justify-center font-mono font-bold text-white text-base rounded-sm border-b-2 ${baseColors[base] || 'bg-slate-600'}`}>
            {base}
        </div>
    );
};

const DnaFragment: React.FC<{ sequence: string; isDraggable?: boolean; onDragStart?: () => void }> = ({ sequence, isDraggable = false, onDragStart }) => (
    <div
        draggable={isDraggable}
        onDragStart={onDragStart}
        className={`flex gap-1 p-1 rounded-md bg-slate-900/70 border border-slate-600/50 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
        {sequence.split('').map((base, i) => <DnaBase key={i} base={base} />)}
    </div>
);

interface DnaMatchGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
}

const DnaMatchGame: React.FC<DnaMatchGameProps> = ({ puzzle, onComplete }) => {
    const [slots, setSlots] = useState<Array<string | null>>(Array(EVIDENCE_SEQUENCE.length).fill(null));
    const [fragmentBank, setFragmentBank] = useState<string[]>(ALL_FRAGMENTS);
    const [draggedItem, setDraggedItem] = useState<{ value: string; from: 'bank' | number } | null>(null);
    const [errorIndex, setErrorIndex] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const isBoardFull = slots.every(slot => slot !== null);
        if (isBoardFull) {
            // Wait 1 second before showing the success popup to let player see the result
            const successTimer = setTimeout(() => {
                setIsSuccess(true);
                // Then wait another 2 seconds before closing the modal
                const completionTimer = setTimeout(() => {
                    onComplete(puzzle.id, puzzle.matchResult);
                }, 2000);
                // Clear completion timer if component unmounts
                return () => clearTimeout(completionTimer);
            }, 1000);
            
            // Clear success timer if component unmounts
            return () => clearTimeout(successTimer);
        }
    }, [slots, onComplete, puzzle.id, puzzle.matchResult]);

    const handleDragStart = (value: string, from: 'bank' | number) => {
        setDraggedItem({ value, from });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDropOnSlot = (toIndex: number) => {
        if (!draggedItem || slots[toIndex] !== null) return;

        const requiredFragment = CORRECT_FRAGMENTS[toIndex];
        const droppedFragment = draggedItem.value;

        if (droppedFragment === requiredFragment) {
            const newSlots = [...slots];
            newSlots[toIndex] = droppedFragment;
            setSlots(newSlots);

            if (draggedItem.from === 'bank') {
                setFragmentBank(bank => bank.filter(f => f !== droppedFragment));
            } else {
                newSlots[draggedItem.from] = null;
            }
        } else {
            setErrorIndex(toIndex);
            setTimeout(() => setErrorIndex(null), 600);
        }
        setDraggedItem(null);
    };

    const handleDropOnBank = () => {
        if (!draggedItem || draggedItem.from === 'bank') return;

        const newSlots = [...slots];
        newSlots[draggedItem.from] = null;
        setSlots(newSlots);

        setFragmentBank(bank => [...bank, draggedItem.value]);
        setDraggedItem(null);
    };

    if (isSuccess) {
        return (
            <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center h-[420px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">SEQUENCE MATCH FOUND</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-1">DNA Base-Pair Matching</h3>
            <p className="text-center text-slate-400 text-xs mb-4">Match fragments to their complement. <span className="text-blue-400">A</span>↔<span className="text-sky-400">T</span>, <span className="text-green-400">G</span>↔<span className="text-emerald-400">C</span></p>
            
            <div className="bg-slate-900 rounded-lg p-3 space-y-4">
                {/* Reference Strand */}
                <div>
                    <p className="font-teko text-xl text-slate-400 tracking-wider mb-2">REFERENCE SAMPLE</p>
                    <div className="grid grid-cols-2 justify-items-center gap-4">
                        {EVIDENCE_SEQUENCE.map((seq, i) => <DnaFragment key={i} sequence={seq} />)}
                    </div>
                </div>

                {/* Lab Sequence (Drop Area) */}
                <div>
                    <p className="font-teko text-xl text-slate-300 tracking-wider mb-2">LAB SEQUENCE</p>
                    <div className="grid grid-cols-2 justify-items-center gap-4">
                        {slots.map((fragment, index) => {
                            const isError = errorIndex === index;
                            const animationClass = isError ? 'animate-shake border-red-500' : 'border-slate-600';
                            return (
                                <div
                                    key={index}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDropOnSlot(index)}
                                    className={`w-full h-10 rounded-md border-2 border-dashed transition-colors flex items-center justify-center ${animationClass} ${fragment ? 'p-1 bg-green-500/10 border-green-500' : 'bg-slate-800/50'}`}
                                >
                                    {fragment && (
                                        <div
                                            onDragStart={() => handleDragStart(fragment, index)}
                                            draggable
                                        >
                                            <DnaFragment sequence={fragment} isDraggable={true}/>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Fragment Bank */}
            <div className="mt-4">
                 <p className="font-teko text-xl text-slate-400 tracking-wider mb-2 text-center">FRAGMENT BANK</p>
                <div 
                    className="min-h-24 bg-slate-900/50 p-3 rounded-lg flex flex-wrap justify-center items-center gap-2"
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnBank}
                >
                    {fragmentBank.map((fragment) => (
                        <DnaFragment key={fragment} sequence={fragment} isDraggable={true} onDragStart={() => handleDragStart(fragment, 'bank')} />
                    ))}
                    {fragmentBank.length === 0 && <p className="text-slate-500 italic">All fragments used.</p>}
                </div>
            </div>
        </div>
    );
};

export default DnaMatchGame;
