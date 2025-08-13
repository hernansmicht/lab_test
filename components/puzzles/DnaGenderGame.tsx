import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Puzzle } from '../../types';
import { CheckCircleIcon } from '../icons';

// --- Types and Constants ---
type ChromosomeArmType = 'long' | 'short';
interface ChromosomePart {
  id: string;
  type: ChromosomeArmType;
  x: number;
  y: number;
  rotation: number;
  isBanked: boolean;
}

interface AssembledChromosome {
  id:string;
  type: 'X' | 'Y';
  x: number;
  y: number;
  rotation: number;
  partIds: [string, string];
}

const ARM_LENGTH = 50;
const SHORT_ARM_LENGTH = 20;
const SNAP_DISTANCE = 15;

// --- Helper Components ---
const SVGChromosomePart: React.FC<{ part: ChromosomePart; isSelected: boolean }> = ({ part, isSelected }) => {
    const isShort = part.type === 'short';
    const height = isShort ? SHORT_ARM_LENGTH : ARM_LENGTH;
    const path = `M 0 ${-height/2} L 0 ${height/2}`;
    
    return (
        <g transform={`translate(${part.x}, ${part.y}) rotate(${part.rotation})`}>
            <path d={path} strokeWidth="12" strokeLinecap="round" stroke="#6b7280" />
            <path d={path} strokeWidth="8" strokeLinecap="round" stroke="#a7b3d6" />
            {isSelected && (
                 <path d={path} strokeWidth="16" strokeLinecap="round" stroke="#facc15" strokeOpacity="0.7" />
            )}
        </g>
    );
};

const SVGAssembledChromosome: React.FC<{ chromosome: AssembledChromosome; isSelected: boolean }> = ({ chromosome, isSelected }) => {
    const isY = chromosome.type === 'Y';
    // Center the drawing at 0,0 for easier rotation
    const path = isY 
        ? `M 0 ${-ARM_LENGTH/2} L 0 ${ARM_LENGTH/2} M ${-SHORT_ARM_LENGTH/2} 0 L ${SHORT_ARM_LENGTH/2} 0`
        : `M ${-ARM_LENGTH/2} ${-ARM_LENGTH/2} L ${ARM_LENGTH/2} ${ARM_LENGTH/2} M ${-ARM_LENGTH/2} ${ARM_LENGTH/2} L ${ARM_LENGTH/2} ${-ARM_LENGTH/2}`;

    return (
        <g transform={`translate(${chromosome.x}, ${chromosome.y}) rotate(${chromosome.rotation})`}>
             <path d={path} strokeWidth="12" strokeLinecap="round" stroke="#6b7280" />
             <path d={path} strokeWidth="8" strokeLinecap="round" stroke="#a7b3d6" />
              {isSelected && (
                 <path d={path} strokeWidth="16" strokeLinecap="round" stroke="#facc15" strokeOpacity="0.7" />
            )}
        </g>
    );
}

const EvidenceKaryotype: React.FC<{ type: 'XX' | 'XY', rotations: [number, number] }> = ({ type, rotations }) => {
    const isY1 = type[0] === 'Y';
    const path1 = isY1 
        ? `M 0 ${-ARM_LENGTH/2} L 0 ${ARM_LENGTH/2} M ${-SHORT_ARM_LENGTH/2} 0 L ${SHORT_ARM_LENGTH/2} 0`
        : `M ${-ARM_LENGTH/2} ${-ARM_LENGTH/2} L ${ARM_LENGTH/2} ${ARM_LENGTH/2} M ${-ARM_LENGTH/2} ${ARM_LENGTH/2} L ${ARM_LENGTH/2} ${-ARM_LENGTH/2}`;

    const isY2 = type[1] === 'Y';
    const path2 = isY2
        ? `M 0 ${-ARM_LENGTH/2} L 0 ${ARM_LENGTH/2} M ${-SHORT_ARM_LENGTH/2} 0 L ${SHORT_ARM_LENGTH/2} 0`
        : `M ${-ARM_LENGTH/2} ${-ARM_LENGTH/2} L ${ARM_LENGTH/2} ${ARM_LENGTH/2} M ${-ARM_LENGTH/2} ${ARM_LENGTH/2} L ${ARM_LENGTH/2} ${-ARM_LENGTH/2}`;

    return (
        <svg viewBox="0 0 200 150" className="w-full h-full">
            <defs>
                <filter id="evidence-blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" />
                </filter>
            </defs>
            <g filter="url(#evidence-blur)" opacity="0.3">
                <g transform={`translate(60, 75) rotate(${rotations[0]})`}>
                    <path d={path1} strokeWidth="12" strokeLinecap="round" stroke="#e0e7ff" />
                </g>
                <g transform={`translate(140, 75) rotate(${rotations[1]})`}>
                    <path d={path2} strokeWidth="12" strokeLinecap="round" stroke="#e0e7ff" />
                </g>
            </g>
        </svg>
    )
}

// --- Main Game Component ---
const DnaGenderGame: React.FC<{ puzzle: Puzzle; onComplete: (puzzleId: string, resultText: string) => void; }> = ({ puzzle, onComplete }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const mousePosRef = useRef({clientX: 0, clientY: 0});
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Randomization ---
    const evidenceRotations = useMemo<[number, number]>(() => [
        Math.floor(Math.random() * 8) * 45,
        Math.floor(Math.random() * 8) * 45
    ], []);
    
    const initialParts: ChromosomePart[] = useMemo(() => {
        const randAngle = () => Math.floor(Math.random() * 8) * 45;
        return [
            { id: 'l1', type: 'long', x: 0, y: 0, rotation: randAngle(), isBanked: true },
            { id: 'l2', type: 'long', x: 0, y: 0, rotation: randAngle(), isBanked: true },
            { id: 'l3', type: 'long', x: 0, y: 0, rotation: randAngle(), isBanked: true },
            { id: 'l4', type: 'long', x: 0, y: 0, rotation: randAngle(), isBanked: true },
            { id: 's1', type: 'short', x: 0, y: 0, rotation: randAngle(), isBanked: true },
        ];
    }, []);

    const [parts, setParts] = useState<ChromosomePart[]>(initialParts);
    const [assembled, setAssembled] = useState<AssembledChromosome[]>([]);
    
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'part' | 'assembled', offsetX: number, offsetY: number} | null>(null);
    const [pendingBankDrag, setPendingBankDrag] = useState<{ partId: string; clientX: number; clientY: number } | null>(null);

    const evidenceType = useMemo<'XX' | 'XY'>(() => puzzle.matchResult.toLowerCase().includes('male') ? 'XY' : 'XX', [puzzle.matchResult]);

    const getSVGPoint = (e: { clientX: number, clientY: number }) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        return screenCTM ? pt.matrixTransform(screenCTM.inverse()) : pt;
    };

    useEffect(() => {
        if (!pendingBankDrag) return;
        const { partId, clientX, clientY } = pendingBankDrag;
        const svgPoint = getSVGPoint({ clientX, clientY });
        setParts(prevParts =>
            prevParts.map(p =>
                p.id === partId ? { ...p, isBanked: false, x: svgPoint.x, y: svgPoint.y } : p
            )
        );
        setDraggedItem({ id: partId, type: 'part', offsetX: 0, offsetY: 0 });
        setPendingBankDrag(null);
    }, [pendingBankDrag]);

    const handleMouseDown = (e: React.MouseEvent, id: string, type: 'part' | 'assembled') => {
        e.preventDefault();
        setSelectedId(id);

        const partInBank = type === 'part' && parts.find(p => p.id === id)?.isBanked;
        if (partInBank) {
            setPendingBankDrag({ partId: id, clientX: e.clientX, clientY: e.clientY });
            return;
        }

        const point = getSVGPoint(e);
        const item = type === 'part' ? parts.find(p => p.id === id) : assembled.find(a => a.id === id);
        if (!item) return;

        setDraggedItem({ id, type, offsetX: point.x - item.x, offsetY: point.y - item.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        mousePosRef.current = {clientX: e.clientX, clientY: e.clientY};
        if (!draggedItem) return;
        const point = getSVGPoint(e);
        const { id, type, offsetX, offsetY } = draggedItem;
        const newX = point.x - offsetX;
        const newY = point.y - offsetY;

        if (type === 'part') {
             setParts(prev => prev.map(p => p.id === id ? { ...p, x: newX, y: newY } : p));
        } else {
             setAssembled(prev => prev.map(a => a.id === id ? { ...a, x: newX, y: newY } : a));
        }
    };
    
    const checkForAssembly = (movedPart: ChromosomePart) => {
        if (movedPart.isBanked) return;

        for (const otherPart of parts) {
            if (movedPart.id === otherPart.id || otherPart.isBanked) continue;
            
            const dist = Math.hypot(movedPart.x - otherPart.x, movedPart.y - otherPart.y);
            const rotDiff = Math.abs(movedPart.rotation - otherPart.rotation) % 180;
            const isPerpendicular = rotDiff > 85 && rotDiff < 95;

            if (dist > SNAP_DISTANCE || !isPerpendicular) continue;

            if (movedPart.type === 'long' && otherPart.type === 'long') {
                const newRotation = movedPart.rotation; // Inherit rotation from moving part
                setAssembled(prev => [...prev, { id: `${movedPart.id}-${otherPart.id}`, type: 'X', x: movedPart.x, y: movedPart.y, rotation: newRotation, partIds: [movedPart.id, otherPart.id] }]);
                setParts(prev => prev.filter(p => p.id !== movedPart.id && p.id !== otherPart.id));
                setSelectedId(null);
                return;
            }

            const isYCombo = (movedPart.type === 'long' && otherPart.type === 'short') || (movedPart.type === 'short' && otherPart.type === 'long');
            if (isYCombo) {
                const longPart = movedPart.type === 'long' ? movedPart : otherPart;
                const newRotation = longPart.rotation;
                setAssembled(prev => [...prev, { id: `${movedPart.id}-${otherPart.id}`, type: 'Y', x: movedPart.x, y: movedPart.y, rotation: newRotation, partIds: [movedPart.id, otherPart.id] }]);
                setParts(prev => prev.filter(p => p.id !== movedPart.id && p.id !== otherPart.id));
                setSelectedId(null);
                return;
            }
        }
    };

    const handleReturnPartToBank = (partId: string) => {
        setParts(prev => prev.map(p => (p.id === partId ? { ...p, isBanked: true } : p)));
        if (selectedId === partId) {
            setSelectedId(null);
        }
    };

    const handleMouseUp = () => {
        if (!draggedItem) return;
        const { id, type } = draggedItem;

        if (type === 'part') {
            const { y } = getSVGPoint(mousePosRef.current);
            // Check if dropped in the "Return to Bank" zone (y > 125 in SVG coords)
            if (y > 125) {
                handleReturnPartToBank(id);
            } else {
                const movedPart = parts.find(p => p.id === id);
                if (movedPart) checkForAssembly(movedPart);
            }
        }
        setDraggedItem(null);
    };

    const handleDisassemble = (chromosomeId: string) => {
        const chromosome = assembled.find(a => a.id === chromosomeId);
        if (!chromosome) return;

        const partsToRestore = chromosome.partIds.map(partId => {
            const original = initialParts.find(p => p.id === partId);
            if (!original) return null;
            return {
                ...original,
                isBanked: false,
                x: chromosome.x + (Math.random() - 0.5) * 40,
                y: chromosome.y + (Math.random() - 0.5) * 40,
                rotation: Math.floor(Math.random() * 8) * 45,
            };
        }).filter((p): p is ChromosomePart => p !== null);

        setAssembled(prev => prev.filter(a => a.id !== chromosomeId));
        setParts(prev => [...prev, ...partsToRestore]);
        setSelectedId(null);
    };
    
    const handleConfirm = () => {
        if (assembled.length !== 2) {
            setMessage('You must assemble two chromosomes.');
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        const symmetricAngleDiff = (rot1: number, rot2: number, type: 'X' | 'Y') => {
            if (type === 'X') {
                const r1_mod = rot1 % 90;
                const r2_mod = rot2 % 90;
                const diff = Math.abs(r1_mod - r2_mod);
                return Math.min(diff, 90 - diff);
            }
            // 'Y' has 180-degree symmetry
            const r1_mod = rot1 % 180;
            const r2_mod = rot2 % 180;
            const diff = Math.abs(r1_mod - r2_mod);
            return Math.min(diff, 180 - diff);
        };

        const evidenceChromosomes = [
            { type: evidenceType[0] as 'X' | 'Y', rotation: evidenceRotations[0] },
            { type: evidenceType[1] as 'X' | 'Y', rotation: evidenceRotations[1] }
        ];

        const playerChromosomes = [
            { type: assembled[0].type, rotation: assembled[0].rotation },
            { type: assembled[1].type, rotation: assembled[1].rotation }
        ];
        
        const isMatch = (c1: { type: 'X' | 'Y', rotation: number}, c2: { type: 'X' | 'Y', rotation: number }) => 
            c1.type === c2.type && symmetricAngleDiff(c1.rotation, c2.rotation, c1.type) <= 5;

        // Check both possible pairings
        const scenario1 = isMatch(playerChromosomes[0], evidenceChromosomes[0]) && isMatch(playerChromosomes[1], evidenceChromosomes[1]);
        const scenario2 = isMatch(playerChromosomes[0], evidenceChromosomes[1]) && isMatch(playerChromosomes[1], evidenceChromosomes[0]);

        if (scenario1 || scenario2) {
            setMessage('MATCH CONFIRMED: Analysis is consistent.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            setMessage('NO MATCH: Karyotype or rotation is inconsistent with evidence.');
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleRotate = (angleDelta: number) => {
        if (!selectedId) return;
        const rotate = (currentAngle: number) => (currentAngle + angleDelta + 360) % 360;
        setParts(prev => prev.map(p => p.id === selectedId ? {...p, rotation: rotate(p.rotation) } : p));
        setAssembled(prev => prev.map(a => a.id === selectedId ? {...a, rotation: rotate(a.rotation) } : a));
    };
    
     if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">GENDER ANALYSIS COMPLETE</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    const bankedParts = parts.filter(p => p.isBanked);
    const selectedItem = (parts.find(p => p.id === selectedId) || assembled.find(a => a.id === selectedId));
    const currentRotation = selectedItem ? selectedItem.rotation : 0;

    return (
        <div className="p-2 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">
            <h3 className="font-teko text-3xl text-center text-blue-300">Chromosome Assembler</h3>
            <p className="text-center text-slate-400 text-xs mb-2">Reconstruct the chromosome pair to match the evidence.</p>

            <div className="grid grid-cols-2 gap-2 h-48">
                 <div className="text-center">
                    <p className="font-teko text-lg text-slate-400 tracking-wider">EVIDENCE</p>
                    <div className="h-full bg-slate-900/50 rounded-lg border border-slate-700">
                        <EvidenceKaryotype type={evidenceType} rotations={evidenceRotations} />
                    </div>
                </div>
                 <div className="text-center">
                    <p className="font-teko text-lg text-slate-300 tracking-wider">YOUR ASSEMBLY</p>
                    <div className="h-full bg-slate-900 rounded-lg border border-slate-700">
                        <svg ref={svgRef} className="w-full h-full" viewBox="0 0 200 150" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                            {/* Return to Bank Zone */}
                            <rect x="0" y="125" width="200" height="25" fill="#475569" className="transition-colors" fillOpacity={draggedItem?.type === 'part' ? '0.3' : '0.1'} />
                            <text x="100" y="142" textAnchor="middle" fill="#94a3b8" fontSize="10" className="pointer-events-none select-none">Return Part to Bank</text>
                            
                            {parts.filter(p => !p.isBanked).map(part => (
                                <g key={part.id} onMouseDown={(e) => handleMouseDown(e, part.id, 'part')} className="cursor-grab active:cursor-grabbing">
                                    <SVGChromosomePart part={part} isSelected={part.id === selectedId} />
                                </g>
                            ))}
                            {assembled.map(chromosome => (
                                <g key={chromosome.id} onMouseDown={(e) => handleMouseDown(e, chromosome.id, 'assembled')} onDoubleClick={() => handleDisassemble(chromosome.id)} className="cursor-grab active:cursor-grabbing">
                                    <SVGAssembledChromosome chromosome={chromosome} isSelected={chromosome.id === selectedId}/>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex gap-4">
                <div className="w-1/3 bg-slate-900/50 p-2 rounded-lg text-center">
                    <h4 className="font-teko text-lg text-slate-400">Parts Bank</h4>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                        {bankedParts.map((part) => (
                             <div key={part.id} onMouseDown={(e) => handleMouseDown(e, part.id, 'part')} className="cursor-grab active:cursor-grabbing bg-slate-800 p-1 rounded-md h-16 flex items-center justify-center">
                                 <svg viewBox="-20 -30 40 60" className="h-full">
                                      <SVGChromosomePart part={{...part, x:0, y:0}} isSelected={false}/>
                                 </svg>
                             </div>
                        ))}
                        {bankedParts.length === 0 && <p className="text-xs text-slate-500 col-span-2">No parts remaining.</p>}
                    </div>
                </div>

                <div className="w-2/3 flex flex-col justify-between">
                     <div className="text-center">
                         <p className="text-sm text-slate-300 mb-2">Rotation Controls</p>
                         <div className="flex justify-center items-center gap-4">
                            <button onClick={() => handleRotate(-45)} disabled={!selectedId} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                            </button>
                            <div className="font-mono text-3xl text-slate-200 w-16 text-center leading-loose">{currentRotation}°</div>
                            <button onClick={() => handleRotate(45)} disabled={!selectedId} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                         </div>
                    </div>

                    <div className="text-center mt-2">
                        <button onClick={handleConfirm} disabled={assembled.length !== 2} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                          Confirm Analysis
                        </button>
                        <p className={`text-sm mt-1 h-5 transition-all font-semibold text-yellow-400`}>
                            {message || ' '}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DnaGenderGame;