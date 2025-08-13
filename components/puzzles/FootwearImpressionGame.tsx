import React, { useState, useMemo } from 'react';
import type { Puzzle, FootwearData } from '../../types';
import { CheckCircleIcon } from '../icons';
import ShoePrint from './ShoePrint';

const SHOE_TYPES: FootwearData['shoeType'][] = ['Boot', 'Sneaker', 'Loafer'];
const SIZES = [7, 8, 9, 10, 11, 12];
const TREAD_MAP: Record<FootwearData['shoeType'], FootwearData['treadPattern']> = {
    'Boot': 'lug',
    'Sneaker': 'wave',
    'Loafer': 'diamond',
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

// Generates pressure points based on shoe type
const getPressurePointsForType = (shoeType: FootwearData['shoeType']): FootwearData['pressurePoints'] => {
    switch(shoeType) {
        case 'Boot':
            return [{ x: 50, y: 85, intensity: 0.9 }, { x: 60, y: 35, intensity: 0.4 }];
        case 'Sneaker':
            return [{ x: 55, y: 80, intensity: 0.6 }, { x: 60, y: 35, intensity: 0.8 }];
        case 'Loafer':
            return [{ x: 50, y: 85, intensity: 0.5 }, { x: 60, y: 40, intensity: 0.5 }];
        default:
            return [];
    }
};

const getEvidenceDataFromPuzzle = (puzzle: Puzzle): FootwearData => {
    const resultString = puzzle.matchResult;
    const sizeMatch = resultString.match(/Size (\d+)/);
    const typeMatch = resultString.match(/Size \d+ ([\w\s]+)/);

    const size = sizeMatch ? parseInt(sizeMatch[1], 10) : SIZES[Math.floor(SIZES.length / 2)];
    let shoeType: FootwearData['shoeType'] = 'Sneaker';
    if (typeMatch) {
        const typeStr = typeMatch[1].toLowerCase();
        if (typeStr.includes('boot')) shoeType = 'Boot';
        else if (typeStr.includes('sneaker')) shoeType = 'Sneaker';
        else if (typeStr.includes('loafer')) shoeType = 'Loafer';
    }

    const seedGen = xmur3(puzzle.id);
    const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());

    return {
        seed: puzzle.id,
        shoeType: shoeType,
        treadPattern: TREAD_MAP[shoeType],
        size: size,
        pressurePoints: getPressurePointsForType(shoeType),
        damageMarks: Array.from({ length: 3 }).map(() => ({
            type: rand() > 0.5 ? 'cut' : 'gouge',
            x: 20 + rand() * 60,
            y: 20 + rand() * 60,
            rotation: rand() * 360,
            size: 5 + rand() * 5,
        })),
    };
};

const EVIDENCE_ROTATION = 15;

interface FootwearImpressionGameProps {
    puzzle: Puzzle;
    onComplete: (puzzleId: string, resultText: string) => void;
}

const FootwearImpressionGame: React.FC<FootwearImpressionGameProps> = ({ puzzle, onComplete }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const evidenceData = useMemo(() => getEvidenceDataFromPuzzle(puzzle), [puzzle]);
    
    const [referenceConfig, setReferenceConfig] = useState({
        shoeType: SHOE_TYPES[0],
        size: SIZES[2],
        rotation: 0,
    });

    const referenceData = useMemo((): FootwearData => {
        const seed = `ref-${referenceConfig.shoeType}-${referenceConfig.size}`;
        return {
            seed: seed,
            shoeType: referenceConfig.shoeType,
            treadPattern: TREAD_MAP[referenceConfig.shoeType],
            size: referenceConfig.size,
            pressurePoints: getPressurePointsForType(referenceConfig.shoeType),
            damageMarks: [],
        };
    }, [referenceConfig]);

    const updateReference = <K extends keyof typeof referenceConfig>(key: K, value: (typeof referenceConfig)[K]) => {
        setReferenceConfig(prev => ({...prev, [key]: value}));
    };

    const handleConfirm = () => {
        const typeMatch = referenceConfig.shoeType === evidenceData.shoeType;
        const sizeMatch = referenceConfig.size === evidenceData.size;
        const rotationMatch = Math.abs(referenceConfig.rotation - EVIDENCE_ROTATION) <= 5;

        if (typeMatch && sizeMatch && rotationMatch) {
            setMessage('ANALYSIS CONFIRMED: All details are consistent.');
            setIsSuccess(true);
            setTimeout(() => onComplete(puzzle.id, puzzle.matchResult), 2000);
        } else {
            const errors = [];
            if (!typeMatch) errors.push('Shoe type is incorrect.');
            if (!sizeMatch) errors.push('Shoe size is incorrect.');
            if (!rotationMatch) errors.push('Rotation is incorrect.');
            setMessage(`Re-evaluate your findings. ${errors.join(' ')}`);
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    if (isSuccess) {
        return (
             <div className="p-6 bg-slate-800 rounded-lg text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircleIcon className="w-20 h-20 text-green-400 animate-pulse" />
                <h3 className="font-teko text-3xl text-green-300 mt-3">FOOTWEAR ANALYSIS COMPLETE</h3>
                <p className="text-slate-300">{puzzle.matchResult}</p>
            </div>
        );
    }
    
    const referenceScale = 0.8 + ((referenceConfig.size - SIZES[0]) / (SIZES.length - 1)) * 0.4;

    return (
        <div className="p-4 bg-slate-800 rounded-lg border-2 border-slate-700 min-h-[500px]">
            <h3 className="font-teko text-3xl text-center text-blue-300 mb-1">Footwear Impression Analysis</h3>
            <p className="text-center text-slate-400 text-xs mb-3">Adjust the reference sample to match the evidence print.</p>

            <div className="grid grid-cols-2 gap-2 h-48">
                 <div className="text-center">
                    <p className="font-teko text-lg text-slate-400 tracking-wider">EVIDENCE (PARTIAL)</p>
                    <div className="h-full p-1 bg-slate-900/50 rounded-lg">
                        <ShoePrint data={evidenceData} rotation={EVIDENCE_ROTATION} isPartial showPressure showDamage />
                    </div>
                </div>
                 <div className="text-center">
                    <p className="font-teko text-lg text-slate-300 tracking-wider">REFERENCE SAMPLE</p>
                    <div className="h-full p-1 bg-slate-900/50 rounded-lg">
                        <ShoePrint data={referenceData} rotation={referenceConfig.rotation} scale={referenceScale} showPressure />
                    </div>
                </div>
            </div>
            
            <div className="mt-4 space-y-3">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Shoe Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {SHOE_TYPES.map(type => (
                            <button key={type} onClick={() => updateReference('shoeType', type)} className={`py-2 px-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${referenceConfig.shoeType === type ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="size-select" className="block text-sm font-bold text-slate-300 mb-1">Shoe Size</label>
                        <select id="size-select" value={referenceConfig.size} onChange={(e) => updateReference('size', Number(e.target.value))} className="w-full bg-slate-700 text-white py-2 px-3 rounded-md border-slate-600 border h-[40px]">
                            {SIZES.map(size => <option key={size} value={size}>US {size}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="rotation-range" className="block text-sm font-bold text-slate-300 mb-1">Rotation ({referenceConfig.rotation}°)</label>
                        <input id="rotation-range" type="range" min="0" max="360" value={referenceConfig.rotation} onChange={e => updateReference('rotation', parseInt(e.target.value))} className="w-full h-2 mt-[12px] bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            </div>
            
            <div className="mt-6 text-center">
                <button
                    onClick={handleConfirm}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Confirm Analysis
                </button>
                <p className={`text-sm mt-2 h-5 transition-all font-semibold text-yellow-400`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default FootwearImpressionGame;
