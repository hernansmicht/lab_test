
import React from 'react';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div 
            className="w-full h-screen bg-cover bg-center flex flex-col justify-between p-8 text-center"
            style={{ backgroundImage: "url('https://picsum.photos/seed/crimelab/600/1000')" }}
        >
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-slate-950/70" />
            
            {/* Content */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center pt-20">
                <h1 className="font-teko text-8xl font-bold text-blue-300 tracking-wider uppercase animate-fade-in-slow">
                    Crime Lab
                </h1>
                <p className="mt-2 text-lg text-slate-300 max-w-xs animate-fade-in-slow" style={{ animationDelay: '0.5s' }}>
                    Analyze the evidence that rules out the most suspects to find the culprit.
                </p>
            </div>
            
            <div className="relative z-10 pb-10 animate-fade-in-slow" style={{ animationDelay: '1s' }}>
                <button
                    onClick={onStart}
                    className="w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-500 text-white font-teko text-3xl font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-blue-500/40 transform hover:scale-105"
                >
                    ACCESS CASE FILES
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
