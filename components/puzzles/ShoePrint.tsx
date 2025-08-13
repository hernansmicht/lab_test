import React from 'react';
import type { FootwearData } from '../../types';

// --- SVG Sub-components ---

const TreadPattern: React.FC<{ pattern: FootwearData['treadPattern'] }> = ({ pattern }) => {
    const common = { fill: 'none', stroke: '#4a5568', strokeWidth: 2 };
    switch (pattern) {
        case 'wave':
            return <g>
                {Array.from({length: 6}).map((_, i) => <path key={i} d={`M 0 ${10+i*15} Q 25 ${i*15}, 50 ${10+i*15} T 100 ${10+i*15}`} {...common} strokeWidth={3}/>)}
            </g>;
        case 'diamond':
            return <g>
                {Array.from({length: 10}).map((_, r) => (
                    Array.from({length: 5}).map((_, c) => (
                        <path key={`${r}-${c}`} d={`M ${c*20},${r*10} l 10,5 l -10,5 l -10,-5 Z`} {...common} strokeWidth={1.5} fill="#2d3748" />
                    ))
                ))}
            </g>;
        case 'lug':
        default:
            return <g>
                {Array.from({length: 5}).map((_, i) => <rect key={i} x={10} y={5 + i*18} width="30" height="12" rx="2" {...common} fill="#2d3748" />)}
                {Array.from({length: 5}).map((_, i) => <rect key={i} x={60} y={5 + i*18} width="30" height="12" rx="2" {...common} fill="#2d3748" />)}
            </g>;
    }
};

const PressureMapOverlay: React.FC<{ points: FootwearData['pressurePoints'], seed: string }> = ({ points, seed }) => (
    <g>
        {points.map(({ x, y, intensity }, i) => {
             const gradientId = `pressureGradient-${seed}-${i}`;
             return (
                <React.Fragment key={i}>
                    <defs>
                        <radialGradient id={gradientId}>
                            <stop offset="0%" stopColor="red" stopOpacity={intensity * 0.7} />
                            <stop offset="50%" stopColor="yellow" stopOpacity={intensity * 0.4} />
                            <stop offset="100%" stopColor="blue" stopOpacity={0} />
                        </radialGradient>
                    </defs>
                    <circle cx={x} cy={y} r={35} fill={`url(#${gradientId})`} />
                </React.Fragment>
             )
        })}
    </g>
);

const DamageOverlay: React.FC<{ data: FootwearData['damageMarks'] }> = ({ data }) => (
    <g>
        {data.map(({ type, x, y, rotation, size }, i) => {
            const common = { stroke: '#ef4444', strokeWidth: 1.5, fill: 'none', transform: `translate(${x} ${y}) rotate(${rotation})` };
            if (type === 'cut') {
                return <line key={i} x1={-size/2} y1="0" x2={size/2} y2="0" {...common} />;
            }
            // Gouge
            return <path key={i} d={`M ${-size/2} ${-size/4} Q 0 ${size/4}, ${size/2} ${-size/4}`} {...common} />;
        })}
    </g>
);


interface ShoePrintProps {
    data: FootwearData;
    rotation?: number;
    scale?: number;
    isPartial?: boolean;
    showPressure?: boolean;
    showDamage?: boolean;
}

const ShoePrint: React.FC<ShoePrintProps> = ({ data, rotation = 0, scale = 1, isPartial = false, showPressure = false, showDamage = false }) => {
    const uniqueClipId = `clip-${data.seed}`;
    const shoePathId = `shoePath-${data.seed}`;
    const shoePath = "M 25,2 H 75 C 90,2 98,10 98,25 V 75 C 98,95 85,98 70,98 H 30 C 15,98 2,95 2,80 V 40 C 2,20 10,2 25,2 Z";
    
    // This transform string ensures rotation and scaling happen from the visual center (50, 50) of the viewbox.
    const transform = `translate(50, 50) rotate(${rotation}) scale(${scale}) translate(-50, -50)`;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full bg-slate-800/50 rounded-lg border border-slate-700">
            <defs>
                 <path id={shoePathId} d={shoePath} />
                 {isPartial && (
                    <clipPath id={uniqueClipId}>
                        <rect x="20" y="30" width="60" height="40" />
                    </clipPath>
                 )}
            </defs>
            
            <g clipPath={isPartial ? `url(#${uniqueClipId})` : ''}>
                <g transform={transform}>
                    <use href={`#${shoePathId}`} fill="#1e293b" />
                    <g clipPath={`url(#${shoePathId})`}>
                        {/* Base Tread */}
                        <TreadPattern pattern={data.treadPattern} />
                        {/* Overlays */}
                        {showPressure && <PressureMapOverlay points={data.pressurePoints} seed={data.seed} />}
                        {showDamage && <DamageOverlay data={data.damageMarks} />}
                    </g>
                    <use href={`#${shoePathId}`} fill="none" stroke="#64748b" strokeWidth="1" />
                </g>
            </g>
        </svg>
    );
};

export default ShoePrint;
