
import React, { useState } from 'react';
import { CASES } from './constants';
import MainMenu from './components/MainMenu';
import CaseView from './components/CaseView';
import LandingPage from './components/LandingPage';

type AppState = 
    | { screen: 'landing' }
    | { screen: 'mainMenu' }
    | { screen: 'caseView', caseId: string };

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>({ screen: 'landing' });

    const renderScreen = () => {
        switch (appState.screen) {
            case 'landing':
                return <LandingPage onStart={() => setAppState({ screen: 'mainMenu' })} />;
            
            case 'mainMenu':
                return (
                    <MainMenu 
                        cases={CASES} 
                        onSelectCase={(caseId) => {
                            const caseData = CASES.find(c => c.id === caseId);
                            if (caseData && !caseData.locked) {
                                setAppState({ screen: 'caseView', caseId });
                            }
                        }} 
                    />
                );

            case 'caseView':
                const currentCase = CASES.find(c => c.id === appState.caseId);
                // This is a fallback. If the caseId is somehow invalid, go back to the menu.
                if (!currentCase) {
                    setAppState({ screen: 'mainMenu' });
                    return null; 
                }
                return (
                    <CaseView 
                        caseData={currentCase} 
                        onExit={() => setAppState({ screen: 'mainMenu' })} 
                    />
                );

            default:
                // Fallback to the landing page if state is unknown
                return <LandingPage onStart={() => setAppState({ screen: 'mainMenu' })} />;
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-900 text-slate-200">
            <div className="max-w-md mx-auto bg-slate-950 min-h-screen shadow-2xl shadow-blue-500/10">
                {renderScreen()}
            </div>
        </div>
    );
};

export default App;
