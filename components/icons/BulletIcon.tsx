
import React from 'react';

const BulletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 8.5V6.02c0-1.07 1.1-2.02 2.16-2.02h1.69c1.06 0 2.15.95 2.15 2.02V8.5" />
        <path d="M9 8.5h8" />
        <path d="M9 18v-6.5h8V18a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2Z" />
    </svg>
);
export default BulletIcon;
