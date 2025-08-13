
import React from 'react';

const GunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8.5L22 5V2L19.5 4"/>
        <path d="M3 14a2 2 0 0 0 2 2h3"/>
        <path d="M5 16V9.5A1.5 1.5 0 0 1 6.5 8H12"/>
        <path d="m12 8 4 4"/>
        <path d="m16 8-4 4"/>
        <path d="M7 11h2"/>
        <path d="M13 15v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3"/>
    </svg>
);
export default GunIcon;
