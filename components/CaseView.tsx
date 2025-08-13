
import React, { useState, useMemo, useEffect } from 'react';
import type { Case, Puzzle, PuzzleResult, Suspect } from '../types';
import { PuzzleStatus } from '../types';
import PuzzleList from './PuzzleList';
import ResultsSummary from './ResultsSummary';
import Modal from './ui/Modal';
import DnaMatchGame from './puzzles/DnaMatchGame';
import BallisticsMatchGame from './puzzles/BallisticsMatchGame';
import FiberAnalysisGame from './puzzles/FiberAnalysisGame';
import FootwearImpressionGame from './puzzles/FootwearImpressionGame';
import DnaGenderGame from './puzzles/DnaGenderGame';
import DnaAncestryGame from './puzzles/DnaAncestryGame';
import BloodTypeGame from './puzzles/BloodTypeGame';
import CctvReconstructionGame from './puzzles/CctvReconstructionGame';
import BallisticsV2MatchGame from './puzzles/BallisticsV2MatchGame';
import FiberAnalysisV2Game from './puzzles/FiberAnalysisV2Game';

type CaseViewTab = 'evidence' | 'suspects';

interface CaseViewProps {
    caseData: Case;
    onExit: () => void;
}

const CaseView: React.FC<CaseViewProps> = ({ caseData, onExit }) => {
    const [activeTab, setActiveTab] = useState<CaseViewTab>('evidence');
    const [allPuzzlesCompleted, setAllPuzzlesCompleted] = useState(false);
    const [puzzleResults, setPuzzleResults] = useState<PuzzleResult[]>([]);
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState<number | null>(null);
    const [statuses, setStatuses] = useState<Record<string, PuzzleStatus>>({});
    const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
    const [eliminatedSuspects, setEliminatedSuspects] = useState<Set<string>>(new Set());
    const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
    const [accusationResult, setAccusationResult] = useState<'win' | 'loss' | null>(null);

     useEffect(() => {
        const initialStatuses: Record<string, PuzzleStatus> = {};
        if (caseData.puzzleUnlockStrategy === 'all') {
            caseData.puzzles.forEach(p => {
                initialStatuses[p.id] = PuzzleStatus.UNLOCKED;
            });
        } else {
            caseData.puzzles.forEach((p, index) => {
                initialStatuses[p.id] = index === 0 ? PuzzleStatus.UNLOCKED : PuzzleStatus.LOCKED;
            });
        }
        setStatuses(initialStatuses);
    }, [caseData]);

    const handlePuzzleComplete = (puzzleId: string, resultText: string) => {
        const puzzleIndex = caseData.puzzles.findIndex(p => p.id === puzzleId);
        if (puzzleIndex === -1) return;

        const newResult: PuzzleResult = {
            puzzleId,
            result: resultText,
            isMatch: resultText.toLowerCase().includes('match') || resultText.toLowerCase().includes('analysis') || resultText.toLowerCase().includes('positive'),
        };
        const updatedResults = [...puzzleResults, newResult];
        setPuzzleResults(updatedResults);

        setStatuses(prev => ({ ...prev, [puzzleId]: PuzzleStatus.COMPLETED }));
        setActivePuzzle(null);

        if (caseData.puzzleUnlockStrategy !== 'all') {
            const nextPuzzleIndex = puzzleIndex + 1;
            if (nextPuzzleIndex < caseData.puzzles.length) {
                const nextPuzzleId = caseData.puzzles[nextPuzzleIndex].id;
                if (statuses[nextPuzzleId] === PuzzleStatus.LOCKED) {
                    setTimeout(() => {
                         setStatuses(prev => ({ ...prev, [nextPuzzleId]: PuzzleStatus.UNLOCKED }));
                    }, 300);
                }
            }
        }
        
        const allCompleted = caseData.puzzles.every(p => 
            updatedResults.some(r => r.puzzleId === p.id)
        );

        if (allCompleted) {
            setEndTime(Date.now());
            setTimeout(() => {
                setAllPuzzlesCompleted(true)
            }, 1000);
        }
    };
    
    const handlePlayPuzzle = (puzzleId: string) => {
        const puzzleToPlay = caseData.puzzles.find(p => p.id === puzzleId);
        if (puzzleToPlay) {
            if (puzzleToPlay.puzzleType === 'PLACEHOLDER') {
                console.log(`Auto-completing placeholder puzzle: ${puzzleToPlay.name}`);
                handlePuzzleComplete(puzzleId, puzzleToPlay.matchResult);
            } else {
                 setStatuses(prev => ({ ...prev, [puzzleId]: PuzzleStatus.IN_PROGRESS }));
                 setActivePuzzle(puzzleToPlay);
            }
        }
    };

    const handleEliminateSuspect = (suspectName: string) => {
        setAnimatingOut(prev => new Set(prev).add(suspectName));
        setTimeout(() => {
            setEliminatedSuspects(prev => new Set(prev).add(suspectName));
            setAnimatingOut(prev => {
                const newSet = new Set(prev);
                newSet.delete(suspectName);
                return newSet;
            });
        }, 500); // Animation duration
    };
    
    const handleAccuseSuspect = (suspectName: string) => {
        if (caseData.culprit && suspectName === caseData.culprit) {
            setAccusationResult('win');
        } else {
            setAccusationResult('loss');
        }
    };

    const totalTime = useMemo(() => {
        if (startTime && endTime) {
            const diff = (endTime - startTime) / 1000;
            const minutes = Math.floor(diff / 60);
            const seconds = Math.floor(diff % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return '00:00';
    }, [startTime, endTime]);

    const renderMinigame = () => {
        if (!activePuzzle) return null;

        switch (activePuzzle.puzzleType) {
            case 'DNA_MATCH':
                return <DnaMatchGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'BALLISTICS':
                return <BallisticsMatchGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} suspects={caseData.suspects} />;
            case 'BALLISTICS_V2':
                return <BallisticsV2MatchGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'FIBER_ANALYSIS':
                return <FiberAnalysisGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} suspects={caseData.suspects} />;
            case 'FIBER_ANALYSIS_V2':
                return <FiberAnalysisV2Game puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'FOOTWEAR_IMPRESSION':
                return <FootwearImpressionGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'DNA_GENDER':
                return <DnaGenderGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'DNA_ANCESTRY':
                return <DnaAncestryGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'BLOOD_TYPE_ANALYSIS':
                return <BloodTypeGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            case 'CCTV_RECONSTRUCTION':
                return <CctvReconstructionGame puzzle={activePuzzle} onComplete={handlePuzzleComplete} />;
            default:
                setActivePuzzle(null); 
                return null;
        }
    };

    const TabButton: React.FC<{ tab: CaseViewTab, children: React.ReactNode }> = ({ tab, children }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 font-teko text-2xl tracking-wider uppercase transition-colors ${activeTab === tab ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'bg-transparent text-slate-400 hover:bg-slate-800/50'}`}
        >
            {children}
        </button>
    );

    const SuspectsView: React.FC<{ 
        suspects: Suspect[],
        onEliminate: (name: string) => void;
        onAccuse: (name: string) => void;
        eliminated: Set<string>;
        animating: Set<string>;
    }> = ({ suspects, onEliminate, onAccuse, eliminated, animating }) => (
        <div className="space-y-4 animate-fade-in-fast">
            {suspects
                .filter(suspect => !eliminated.has(suspect.name))
                .map(suspect => (
                    <div 
                        key={suspect.name} 
                        className={`flex flex-col sm:flex-row items-start p-4 bg-slate-800 border border-slate-700 rounded-lg gap-4 transition-all duration-500 ${animating.has(suspect.name) ? 'animate-shrink-out' : ''}`}
                    >
                        <img src={suspect.img} alt={suspect.name} className="w-full sm:w-32 h-48 sm:h-auto object-cover rounded-md border-2 border-slate-600 shrink-0" />
                        <div className="flex-grow">
                            <h3 className="font-teko text-3xl text-slate-100">{suspect.name}</h3>
                            <p className="text-sm text-slate-400 mb-3 italic">"{suspect.connectionToScene || suspect.description}"</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                {suspect.height && <div><span className="font-bold text-slate-300">Height:</span> <span className="text-slate-400">{suspect.height}</span></div>}
                                {suspect.weight && <div><span className="font-bold text-slate-300">Weight:</span> <span className="text-slate-400">{suspect.weight}</span></div>}
                                {suspect.shoeSize && <div><span className="font-bold text-slate-300">Shoe Size:</span> <span className="text-slate-400">{suspect.shoeSize}</span></div>}
                                {suspect.bloodType && <div><span className="font-bold text-slate-300">Blood Type:</span> <span className="text-slate-400">{suspect.bloodType}</span></div>}
                                {suspect.toneOfVoice && <div><span className="font-bold text-slate-300">Voice:</span> <span className="text-slate-400">{suspect.toneOfVoice}</span></div>}
                                {suspect.gunOwner !== undefined && <div><span className="font-bold text-slate-300">Gun Owner:</span> <span className="text-slate-400">{suspect.gunOwner ? 'Yes' : 'No'}</span></div>}
                                {suspect.financialStanding && <div><span className="font-bold text-slate-300">Finances:</span> <span className="text-slate-400">{suspect.financialStanding}</span></div>}
                            </div>

                             <div className="mt-4 flex justify-end gap-2">
                                <button 
                                    onClick={() => onAccuse(suspect.name)}
                                    className="bg-green-700/80 hover:bg-green-600 text-green-200 text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                                >
                                    Accuse
                                </button>
                                <button 
                                    onClick={() => onEliminate(suspect.name)}
                                    className="bg-red-800/70 hover:bg-red-700 text-red-200 text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                                >
                                    Eliminate
                                </button>
                            </div>
                        </div>
                    </div>
            ))}
        </div>
    );
    
     const FinalScreen = () => {
        if (!accusationResult) return null;
        const isWin = accusationResult === 'win';
        const title = isWin ? "CASE CLOSED" : "WRONG ACCUSATION";
        const message = isWin 
            ? `You correctly identified ${caseData.culprit} as the culprit.` 
            : "The evidence doesn't support this. The real culprit got away.";

        return (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-start pt-20 p-8 text-center animate-fade-in z-20">
                <h2 className={`font-teko text-6xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>{title}</h2>
                <p className="text-slate-300 mt-2 mb-8">{message}</p>
                <button 
                    onClick={onExit}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                    Return to Main Menu
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 relative">
             <FinalScreen />

            <header className="flex items-center justify-between mb-4">
                <h1 className="font-teko text-4xl font-bold text-blue-400 uppercase tracking-wide">{caseData.title}</h1>
                <button onClick={onExit} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">Main Menu</button>
            </header>

            {allPuzzlesCompleted ? (
                <ResultsSummary 
                    suspects={caseData.suspects} 
                    puzzleResults={puzzleResults} 
                    totalTime={totalTime}
                    onRestart={onExit}
                />
            ) : (
                <>
                    <div className="mb-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                        <h2 className="font-teko text-2xl text-slate-300 border-b border-slate-700 pb-1 mb-2">Case Brief</h2>
                        <p className="text-slate-400">{caseData.brief}</p>
                    </div>

                    <div className="border-b border-slate-700 flex mb-4">
                        <TabButton tab="evidence">Evidence</TabButton>
                        <TabButton tab="suspects">Suspects</TabButton>
                    </div>

                    <div>
                        {activeTab === 'evidence' ? (
                            <PuzzleList 
                                puzzles={caseData.puzzles} 
                                statuses={statuses}
                                onPlayPuzzle={handlePlayPuzzle}
                                analysisLimit={caseData.analysisLimit} 
                            />
                        ) : (
                            <SuspectsView 
                                suspects={caseData.suspects} 
                                onEliminate={handleEliminateSuspect}
                                onAccuse={handleAccuseSuspect}
                                eliminated={eliminatedSuspects}
                                animating={animatingOut}
                            />
                        )}
                    </div>
                </>
            )}
             <Modal isOpen={!!activePuzzle} onClose={() => setActivePuzzle(null)}>
                {renderMinigame()}
            </Modal>
        </div>
    );
};

export default CaseView;