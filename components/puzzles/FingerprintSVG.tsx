
import React, { useMemo } from 'react';

// Using the same PRNGs from other components for consistency
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

interface FingerprintSVGProps {
    seed: string;
    isPartial?: boolean;
    className?: string;
    strokeColor?: string;
}

const FingerprintSVG: React.FC<FingerprintSVGProps> = ({ seed, isPartial = false, className, strokeColor = 'text-slate-300' }) => {
    const uniqueClipId = `fp-clip-${seed}`;

    const paths = useMemo(() => {
        const seedGen = xmur3(seed);
        const rand = sfc32(seedGen(), seedGen(), seedGen(), seedGen());
        const pathData: string[] = [];
        
        const coreX = 50 + (rand() - 0.5) * 10;
        const coreY = 40 + (rand() - 0.5) * 10;
        const numLines = 15;

        for (let i = 0; i < numLines; i++) {
            const radius = 10 + i * 4;
            const startAngle = Math.PI + (rand() - 0.5) * 0.5;
            const endAngle = 2 * Math.PI - (rand() - 0.5) * 0.5;
            
            const x1 = coreX + radius * Math.cos(startAngle);
            const y1 = coreY + radius * Math.sin(startAngle);
            const x2 = coreX + radius * Math.cos(endAngle);
            const y2 = coreY + radius * Math.sin(endAngle);

            // Add some "bifurcations" or line endings
            if (i > 3 && rand() > 0.7) {
                 const midAngle = (startAngle + endAngle) / 2;
                 const breakAngle = midAngle + (rand() - 0.5) * 0.8;
                 const xB = coreX + radius * Math.cos(breakAngle);
                 const yB = coreY + radius * Math.sin(breakAngle);
                 pathData.push(`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${xB} ${yB}`);
                 pathData.push(`M ${x2} ${y2} A ${radius} ${radius} 0 0 0 ${xB + (rand() - 0.5)} ${yB + (rand() - 0.5)}`);
            } else {
                 pathData.push(`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`);
            }
        }

        return pathData;
    }, [seed]);

    return (
        <svg viewBox="0 0 100 100" className={className}>
            {isPartial && (
                <defs>
                    <clipPath id={uniqueClipId}>
                        <rect x="25" y="30" width="50" height="40" rx="5" />
                    </clipPath>
                </defs>
            )}
            <g clipPath={isPartial ? `url(#${uniqueClipId})` : ''}>
                {paths.map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        stroke="currentColor"
                        className={strokeColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                ))}
            </g>
        </svg>
    );
};

export default FingerprintSVG;
