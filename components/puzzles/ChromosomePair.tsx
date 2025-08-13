
import React from 'react';

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

interface Band {
    y: number;
    height: number;
    opacity: number;
}

// Generate unique banding patterns for X and Y chromosomes
const generateBands = (type: 'X' | 'Y', seed: string): Band[] => {
    const seedGen = xmur3(seed + type);
    const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
    const bands: Band[] = [];
    const totalHeight = (type === 'X') ? 30 : 15; // Y is shorter
    let currentY = 15;

    while (currentY < 15 + totalHeight) {
        const height = 2 + rand() * 4;
        bands.push({
            y: currentY,
            height: height,
            opacity: 0.6 + rand() * 0.4,
        });
        currentY += height + rand() * 3;
    }
    return bands;
}

const Chromosome: React.FC<{
    type: 'X' | 'Y';
    transform?: string;
    id: string;
    stainLevel?: number;
    degraded?: boolean;
}> = ({ type, transform, id, stainLevel = 0, degraded }) => {
    const commonProps: React.SVGProps<SVGPathElement> = {
        fill: '#a5b4fc', // indigo-300
        stroke: '#6366f1', // indigo-500
        strokeWidth: 4,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
    };

    const pathData = type === 'Y' 
        ? "M15 15 L30 30 M30 15 L15 30 M22.5 30 L22.5 45"
        : "M15 15 L45 45 M45 15 L15 45";
    
    const bands = generateBands(type, id);
    const clipPathId = `clip-${id}`;

    return (
        <g transform={transform}>
            <defs>
                <clipPath id={clipPathId}>
                     <path d={pathData} strokeWidth="4" />
                </clipPath>
            </defs>
            <path id={id} d={pathData} {...commonProps} />
            <g clipPath={`url(#${clipPathId})`}>
                {bands.map((band, i) => (
                    <rect 
                        key={i}
                        x="10"
                        y={band.y}
                        width="40"
                        height={band.height}
                        fill={i % 2 === 0 ? '#374151' : '#6b7280'} // gray-700 or gray-500
                        opacity={(degraded ? band.opacity * 0.4 : band.opacity) * stainLevel}
                    />
                ))}
            </g>
        </g>
    );
};

interface ChromosomePairProps {
    pair: ['X' | 'Y', 'X' | 'Y'];
    degraded?: boolean;
    seed: string;
    stainLevel?: number;
    rotation?: number;
}

const ChromosomePair: React.FC<ChromosomePairProps> = ({ pair, degraded = false, seed, stainLevel = 0, rotation = 0 }) => {
    const uniqueFilterId = `noise-${seed}`;
    
    const chromosome1 = pair[0];
    const chromosome2 = pair[1];

    // Determine horizontal shift to keep pair centered
    const getShift = (type: 'X' | 'Y') => (type === 'Y' ? -5 : 0);
    const shift1 = getShift(chromosome1);
    const shift2 = getShift(chromosome2);
    
    return (
        <svg viewBox="0 0 60 60" className="w-full h-full">
            {degraded && (
                <defs>
                    <filter id={uniqueFilterId}>
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
                        <feColorMatrix in="noise" type="saturate" values="0" result="desaturated" />
                        <feComponentTransfer in="desaturated" result="transfer">
                             <feFuncA type="linear" slope="0.15" />
                        </feComponentTransfer>
                        <feBlend in="SourceGraphic" in2="transfer" mode="multiply" />
                    </filter>
                </defs>
            )}
            <g transform={`rotate(${rotation}, 30, 30)`}>
                <g filter={degraded && stainLevel === 0 ? `url(#${uniqueFilterId})` : ''}>
                    <Chromosome type={chromosome1} id={`chr1-${seed}`} transform={`translate(${-10 + shift1}, 0)`} stainLevel={stainLevel} degraded={degraded} />
                    <Chromosome type={chromosome2} id={`chr2-${seed}`} transform={`translate(${10 + shift2}, 0)`} stainLevel={stainLevel} degraded={degraded} />
                </g>
            </g>
        </svg>
    );
};

export default ChromosomePair;
