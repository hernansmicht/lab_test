
import React from 'react';

const FlaskIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.31"/>
        <path d="M14 9.31V2"/>
        <path d="M4 14h16"/>
        <path d="M5.89 14 9 22h6l3.11-8"/>
        <path d="M10 9.31a2.33 2.33 0 0 1-2.2-1.3L7 6"/>
        <path d="M14 9.31a2.33 2.33 0 0 0 2.2-1.3L17 6"/>
    </svg>
);
export default FlaskIcon;
