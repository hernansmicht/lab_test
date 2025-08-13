import React from 'react';
import type { Puzzle } from '../types';
import { PuzzleStatus } from '../types';
import { LockIcon, CheckCircleIcon } from './icons';

interface PuzzleItemProps {
    puzzle: Puzzle;
    status: PuzzleStatus;
    onPlay: (puzzleId: string) => void;
}

const PuzzleItem: React.FC<PuzzleItemProps> = ({ puzzle, status, onPlay }) => {
    const isLocked = status === PuzzleStatus.LOCKED;
    const isCompleted = status === PuzzleStatus.COMPLETED;
    const isInProgress = status === PuzzleStatus.IN_PROGRESS;
    const isMatch = puzzle.matchResult.toLowerCase().includes('match');

    const containerClasses = `flex items-center p-3 bg-slate-800 border border-slate-700 rounded-lg transition-all duration-300 ${isLocked ? 'opacity-50' : ''} ${isCompleted ? 'border-green-500/50 bg-green-900/20' : ''} ${isInProgress ? 'border-blue-500/50' : ''}`;

    return (
        <div className={containerClasses}>
            <img src={puzzle.img} alt={puzzle.name} className="w-16 h-16 rounded-md object-cover mr-4" />
            <div className="flex-grow">
                <div className="flex items-center">
                    {isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />}
                    <h3 className="font-bold text-slate-100">{puzzle.name}</h3>
                </div>
                 <p className="text-sm text-slate-400">
                    {isCompleted ? <span className={isMatch ? 'text-red-400 font-semibold' : 'text-slate-300'}>{puzzle.matchResult}</span> : puzzle.description}
                </p>
            </div>
            <div className="ml-4 w-28 text-center">
                {status === PuzzleStatus.UNLOCKED && (
                    <button
                        onClick={() => onPlay(puzzle.id)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-2 rounded-md transition-colors text-sm"
                    >
                        Start Analysis
                    </button>
                )}
                {isLocked && <LockIcon className="w-8 h-8 mx-auto text-slate-500" />}
                {isInProgress && <div className="text-sm text-blue-400 animate-pulse">Analyzing...</div>}
                {isCompleted && (
                    <div className="flex items-center justify-center text-green-400">
                        <span className="text-sm font-bold">Complete</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PuzzleItem;