
import React, { useState, useMemo, useEffect } from 'react';
import type { Puzzle } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Game Configuration ---
const GRID_SIZE = 3;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

interface JigsawPiece {
    id: number; // 0-8, corresponds to correct position
    rotation: number; // 0, 90, 180, 270
}

interface PieceState extends JigsawPiece {
    location: 'bank' | number; // 'bank' or grid index (0-8)
}

// --- Helper Functions ---
const createInitialPieces = (): PieceState[] => {
    return Array.from({ length: TILE_COUNT }, (_, i) => ({
        id: i,
        rotation: Math.floor(Math.random() * 4) * 90,
        location: 'bank',
    }));
};

// --- Main Component ---
interface CctvReconstructionGameProps {
  puzzle: Puzzle;
  onComplete: (puzzleId: string, resultText: string) => void;
}

const CctvReconstructionGame: React.FC<CctvReconstructionGameProps> = ({ puzzle, onComplete }) => {
    const [pieces, setPieces] = useState<PieceState[]>(() => createInitialPieces().sort(() => Math.random() - 0.5));
    const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
    const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isSuccess) return;

        const gridPieces = pieces.filter(p => p.location !== 'bank');
        if (gridPieces.length !== TILE_COUNT) return;

        const isSolved = gridPieces.every(p => p.location === p.id && p.rotation === 0);
        
        if (isSolved) {
            setIsSuccess(true);
            setTimeout(() => {
                onComplete(puzzle.id, puzzle.matchResult);
            }, 2000);
        }
    }, [pieces, isSuccess, onComplete, puzzle.id, puzzle.matchResult]);

    const handleDragStart = (pieceId: number) => {
        setDraggedPieceId(pieceId);
        setSelectedPieceId(pieceId); // Also select it for rotation
    };

    const handleDrop = (targetLocation: 'bank' | number) => {
        if (draggedPieceId === null) return;

        const draggedPiece = pieces.find(p => p.id === draggedPieceId);
        if (!draggedPiece) return;

        const pieceAtTarget = pieces.find(p => p.location === targetLocation);

        setPieces(currentPieces => {
            return currentPieces.map(p => {
                if (p.id === draggedPieceId) {
                    return { ...p, location: targetLocation };
                }
                if (pieceAtTarget && p.id === pieceAtTarget.id) {
                    return { ...p, location: draggedPiece.location };
                }
                return p;
            });
        });

        setDraggedPieceId(null);
    };

    const handleRotate = (angleDelta: number) => {
        if (selectedPieceId === null) return;
        setPieces(currentPieces =>
            currentPieces.map(p =>
                p.id === selectedPieceId
                    ? { ...p, rotation: (p.rotation + angleDelta + 360) % 360 }
                    : p
            )
        );
    };

    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[600px] animate-fade-in">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">IMAGE RECONSTRUCTED</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    const JigsawTile: React.FC<{ piece: PieceState }> = ({ piece }) => {
        const x = piece.id % GRID_SIZE;
        const y = Math.floor(piece.id / GRID_SIZE);
        const isSelected = selectedPieceId === piece.id;

        return (
            <div
                draggable
                onDragStart={() => handleDragStart(piece.id)}
                onClick={() => setSelectedPieceId(piece.id)}
                className={`w-full h-full bg-cover bg-no-repeat cursor-grab active:cursor-grabbing transition-all duration-200 ease-in-out ${isSelected ? 'ring-2 ring-yellow-400' : 'ring-1 ring-blue-500/20'}`}
                style={{
                    backgroundImage: `url(${puzzle.img})`,
                    backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
                    backgroundPosition: `${x * 100 / (GRID_SIZE - 1)}% ${y * 100 / (GRID_SIZE - 1)}%`,
                    transform: `rotate(${piece.rotation}deg)`,
                }}
            />
        );
    };

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[600px]">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-1">CCTV Jigsaw Reconstruction</h3>
            <p className="text-center text-slate-400 text-xs mb-3">
                Drag, drop, and rotate pieces to reassemble the image.
            </p>

            <div className={`relative w-full aspect-square max-w-[300px] mx-auto bg-slate-900 border-2 border-slate-700 rounded-md overflow-hidden grid grid-cols-3 gap-1 p-1`}>
                {Array.from({ length: TILE_COUNT }).map((_, i) => {
                    const pieceInSlot = pieces.find(p => p.location === i);
                    return (
                        <div
                            key={i}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(i)}
                            className="w-full h-full bg-slate-800/50 border border-dashed border-slate-700 rounded-sm flex items-center justify-center"
                        >
                            {pieceInSlot && <JigsawTile piece={pieceInSlot} />}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-4 space-y-4">
                {/* Rotation Controls */}
                <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                    <p className="text-sm text-slate-300 mb-1">Rotation</p>
                    <div className="flex justify-center items-center gap-4">
                        <button onClick={() => handleRotate(-90)} disabled={selectedPieceId === null} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        </button>
                        <button onClick={() => handleRotate(90)} disabled={selectedPieceId === null} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/></svg>
                        </button>
                    </div>
                </div>
                {/* Parts Bank */}
                <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                    <h4 className="font-teko text-lg text-slate-400">Parts Bank</h4>
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop('bank')}
                        className="grid grid-cols-5 gap-1 mt-1 min-h-[50px]">
                        {pieces.filter(p => p.location === 'bank').map(piece => (
                            <div key={piece.id} className="aspect-square">
                                <JigsawTile piece={piece} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CctvReconstructionGame;