
import React, { useMemo } from 'react';
import type { Puzzle } from '../types';
import { PuzzleStatus } from '../types';
import PuzzleItem from './PuzzleItem';

interface PuzzleListProps {
    puzzles: Puzzle[];
    statuses: Record<string, PuzzleStatus>;
    onPlayPuzzle: (puzzleId: string) => void;
    analysisLimit?: number;
}

const PuzzleList: React.FC<PuzzleListProps> = ({ puzzles, statuses, onPlayPuzzle, analysisLimit }) => {
    
    const completedCount = useMemo(() => {
        return Object.values(statuses).filter(s => s === PuzzleStatus.COMPLETED).length;
    }, [statuses]);

    const limit = analysisLimit || puzzles.length;
    
    return (
        <div className="space-y-3">
            <div className="sticky top-0 bg-slate-950 py-3 z-10 border-b border-slate-800 mb-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-teko text-2xl text-slate-200 uppercase tracking-wider">Analyze Evidence</h2>
                        {analysisLimit && (
                             <p className="text-xs text-slate-400">You have only {analysisLimit} permitted analyses.</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="font-teko text-4xl text-blue-400 leading-none">{completedCount}/{limit}</p>
                        <p className="text-xs text-slate-400 -mt-1">Analyses Used</p>
                    </div>
                </div>
            </div>
            {puzzles.map(puzzle => (
                <PuzzleItem
                    key={puzzle.id}
                    puzzle={puzzle}
                    status={statuses[puzzle.id] || PuzzleStatus.LOCKED}
                    onPlay={onPlayPuzzle}
                />
            ))}
        </div>
    );
};

export default PuzzleList;