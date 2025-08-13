import React, { useMemo } from 'react';
import type { BallisticsData } from '../../types';

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

// --- SVG Components for Casing Features ---

const FiringPin: React.FC<{ shape: BallisticsData['firingPinShape'] }> = ({ shape }) => {
    const commonProps = {
        fill: "#6b7280",
        stroke: "#4b5563",
        strokeWidth: "0.8",
        opacity: "0.7",
    };
    switch(shape) {
        case 'oval':
            return <ellipse cx="50" cy="50" rx="6" ry="8" {...commonProps} />;
        case 'star':
            return <path d="M50,42 L52.5,47.5 L58,47.5 L54,51.5 L55.5,57 L50,53.5 L44.5,57 L46,51.5 L42,47.5 L47.5,47.5 Z" {...commonProps} />;
        case 'circle':
        default:
            return <circle cx="50" cy="50" r="7" {...commonProps} />;
    }
};

const EjectorMark: React.FC<{ angle: number }> = ({ angle }) => {
    return (
        <g transform={`rotate(${angle}, 50, 50)`}>
            {/* A more prominent, triangular gouge mark */}
            <path 
                d="M 48 6 L 52 6 L 50 11 Z"
                fill="#452f0a"
                stroke="#271c0a"
                strokeWidth="0.5"
            />
        </g>
    );
};

// --- Main Casing Component ---

interface BallisticsCasingProps {
    data: BallisticsData;
    rotation?: number; // Main rotation for the entire casing
}

const BallisticsCasing: React.FC<BallisticsCasingProps> = ({ data, rotation = 0 }) => {
    const scratches = useMemo(() => {
        const seedGen = xmur3(data.breechSeed);
        const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
        
        return Array.from({ length: 15 }).map(() => ({
            angle: rand() * 360,
            length: 28 + rand() * 20,
            width: 2.2,
            opacity: 0.7 + rand() * 0.1,
        }));
    }, [data.breechSeed]);

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
                <radialGradient id="brassGradient">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="60%" stopColor="#ca8a04" />
                    <stop offset="100%" stopColor="#a16207" />
                </radialGradient>
            </defs>
            
            <circle cx="50" cy="50" r="48" fill="url(#brassGradient)" stroke="#854d0e" strokeWidth="1.5"/>
            
            {/* This group now rotates all casing features together */}
            <g transform={`rotate(${rotation}, 50, 50)`}>
                {/* Breech Face Marks */}
                <g>
                    {scratches.map((s, i) => (
                        <line 
                            key={i} 
                            x1="50" y1={50 - s.length / 2}
                            x2="50" y2={50 + s.length / 2}
                            stroke="#452f0a"
                            strokeWidth={s.width}
                            opacity={s.opacity}
                            transform={`rotate(${s.angle}, 50, 50)`}
                            strokeLinecap="round"
                        />
                    ))}
                </g>
                
                {/* Ejector Mark */}
                <EjectorMark angle={data.ejectorAngle} />
            </g>

            {/* Firing Pin (fixed position in the center) */}
            <FiringPin shape={data.firingPinShape} />
            
            <circle cx="50" cy="50" r="16" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.6"/>
        </svg>
    );
}

export default BallisticsCasing;