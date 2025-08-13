import React from 'react';
import type { GeneticMarker } from '../../types';

// Helper to create a Gaussian-like peak path
const createPeakPath = (x: number, y: number, width: number, baseline: number): string => {
    const height = y;
    return `M ${x - width} ${baseline} C ${x - width / 2} ${baseline - height}, ${x + width / 2} ${baseline - height}, ${x + width} ${baseline} Z`;
};

interface AncestryGraphProps {
    evidenceMarkers: GeneticMarker[];
    referenceMarkers: GeneticMarker[];
    seed: string;
    alleleRange: { min: number; max: number };
    alleleShift?: number;
    signalGain?: number;
}

const AncestryGraph: React.FC<AncestryGraphProps> = ({ evidenceMarkers, referenceMarkers, seed, alleleRange, alleleShift = 0, signalGain = 1 }) => {
    const uniqueFilterId = `noise-filter-${seed}`;
    const viewBoxWidth = 1000;
    const viewBoxHeight = 200;

    // Map allele value to x-coordinate, spreading it across the available width based on the dynamic range.
    const getX = (allele: number) => {
        const alleleSpan = alleleRange.max - alleleRange.min;
        if (alleleSpan <= 0) return viewBoxWidth / 2; // Avoid division by zero
        const padding = 50;
        const availableWidth = viewBoxWidth - (2 * padding);
        const normalizedAllele = (allele - alleleRange.min) / alleleSpan;
        return padding + (normalizedAllele * availableWidth);
    };
    const getY = (frequency: number) => frequency * 1.8;

    return (
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-full">
            <defs>
                <filter id={uniqueFilterId}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
                    <feGaussianBlur in="noise" stdDeviation="1.2" result="blurredNoise" />
                    <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>

            {/* Evidence Peaks (Degraded) */}
            <g filter={`url(#${uniqueFilterId})`}>
                {evidenceMarkers.map((marker, i) => (
                    <path
                        key={`evidence-${i}`}
                        d={createPeakPath(getX(marker.allele), getY(marker.frequency), 15, viewBoxHeight)}
                        fill="#64748b" // slate-500
                        opacity="0.5"
                    />
                ))}
            </g>

            {/* Reference Peaks (Clean, with adjustments) */}
            <g>
                {referenceMarkers.map((marker, i) => (
                    <path
                        key={`ref-${i}`}
                        d={createPeakPath(getX(marker.allele + alleleShift), getY(marker.frequency * signalGain), 15, viewBoxHeight)}
                        fill="none"
                        stroke="#2dd4bf" // teal-400
                        strokeWidth="1.5"
                    />
                ))}
            </g>

            {/* X-axis line */}
            <line x1="0" y1={viewBoxHeight} x2={viewBoxWidth} y2={viewBoxHeight} stroke="#475569" strokeWidth="0.5" />
        </svg>
    );
};

export default AncestryGraph;