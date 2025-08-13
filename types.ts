
import type React from 'react';

export interface Suspect {
    name: string;
    description: string;
    img: string;
    bloodType?: string;
    shoeSize?: number;
    height?: string;
    weight?: string;
    gunOwner?: boolean;
    toneOfVoice?: string;
    connectionToScene?: string;
    financialStanding?: 'Low' | 'Medium' | 'High';
}

export interface FiberData {
    weave: number[];
    colors: string[];
    spectrum: number[];
    uvReactive: boolean;
}

export interface BallisticsData {
    firingPinShape: 'circle' | 'oval' | 'star';
    breechSeed: string; // Used to generate unique scratch patterns
    ejectorAngle: number;
}

export interface FootwearData {
    seed: string; // Unique seed for generation
    treadPattern: 'lug' | 'wave' | 'diamond';
    shoeType: 'Boot' | 'Sneaker' | 'Loafer';
    size: number; // e.g., 9, 10, 11
    pressurePoints: {
        x: number; // 0-100 coordinate
        y: number; // 0-100 coordinate
        intensity: number; // 0 to 1
    }[];
    damageMarks: {
        type: 'cut' | 'gouge';
        x: number; // position
        y: number;
        rotation: number;
        size: number;
    }[];
}

export interface GeneticMarker {
  locus: string; // e.g., 'D3S1358'
  allele: number; // Represents the specific variant, determines X position
  frequency: number; // Represents prevalence, determines Y height
}

export interface AncestryData {
  population: 'European' | 'East Asian' | 'African';
  markers: GeneticMarker[];
}

export interface Puzzle {
    id: string;
    name: string;
    puzzleType: 'DNA_MATCH' | 'BALLISTICS' | 'FIBER_ANALYSIS' | 'FOOTWEAR_IMPRESSION' | 'PLACEHOLDER' | 'DNA_GENDER' | 'DNA_ANCESTRY' | 'BLOOD_TYPE_ANALYSIS' | 'CCTV_RECONSTRUCTION' | 'BALLISTICS_V2' | 'FIBER_ANALYSIS_V2';
    description: string;
    img: string;
    icon: React.FC<{ className?: string }>;
    matchResult: string; // The correct result, e.g., name of suspect or finding
}

export interface Case {
    id: string;
    title: string;
    thumbnail: string;
    brief: string;
    locked: boolean;
    puzzleUnlockStrategy?: 'sequential' | 'all';
    analysisLimit?: number;
    suspects: Suspect[];
    puzzles: Puzzle[];
    culprit?: string;
}

export enum PuzzleStatus {
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

export interface PuzzleResult {
    puzzleId: string;
    result: string;
    isMatch: boolean;
}

export type Verdict = 'innocent' | 'accomplice' | 'guilty' | 'undecided';

export interface Verdicts {
    [suspectName: string]: Verdict;
}