
import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-400">Case Progress</span>
                <span className="text-sm font-medium text-blue-400">{Math.round(clampedProgress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${clampedProgress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;
