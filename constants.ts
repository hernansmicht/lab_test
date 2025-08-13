
import type { Case } from './types';
import { murderAtDock17 } from './cases/case-01-data';
import { case02 } from './cases/case-02-data';


export const CASES: Case[] = [
    case02,
    murderAtDock17,
    {
        id: 'case-03',
        title: 'Espresso Espionage',
        thumbnail: 'https://picsum.photos/seed/coffee/400/200',
        brief: '',
        locked: true,
        suspects: [],
        puzzles: [],
    },
];