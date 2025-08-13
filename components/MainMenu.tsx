
import React from 'react';
import type { Case } from '../types';
import { LockIcon } from './icons';
import Tooltip from './ui/Tooltip';

interface MainMenuProps {
    cases: Case[];
    onSelectCase: (caseId: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ cases, onSelectCase }) => {
    return (
        <div className="p-4 bg-slate-950/50 min-h-screen">
            <header className="text-center my-8">
                <h1 className="font-teko text-6xl font-bold text-blue-400 tracking-wider uppercase">Crime Lab</h1>
                <p className="text-slate-400">Select a case file to begin your investigation.</p>
            </header>
            
            <div className="space-y-6">
                {cases.map((caseItem) => (
                    <div key={caseItem.id} className="relative group">
                        <button
                            onClick={() => onSelectCase(caseItem.id)}
                            disabled={caseItem.locked}
                            className="w-full text-left bg-slate-800/70 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:shadow-none"
                        >
                            <div className="relative">
                                <img src={caseItem.thumbnail} alt={caseItem.title} className="w-full h-32 object-cover" />
                                {caseItem.locked && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                        <LockIcon className="w-8 h-8 text-slate-400" />
                                        <span className="font-teko text-3xl text-slate-400 tracking-widest mt-1">COMING SOON</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="font-teko text-3xl font-semibold tracking-wide text-slate-100">{caseItem.title}</h2>
                            </div>
                        </button>
                        {caseItem.locked && (
                           <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Tooltip text="Case not available yet. Stay tuned!" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MainMenu;
