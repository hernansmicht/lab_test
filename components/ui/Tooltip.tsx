
import React from 'react';

interface TooltipProps {
    text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
    return (
        <span className="z-10 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-md border border-slate-700">
            {text}
        </span>
    );
};

export default Tooltip;
