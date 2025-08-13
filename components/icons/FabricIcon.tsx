
import React from 'react';

const FabricIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.56 10.44L13.56 3.44a2 2 0 0 0-2.82 0L3.44 10.88a2 2 0 0 0 0 2.82l7 7a2 2 0 0 0 2.82 0l7.29-7.29a2 2 0 0 0 0-2.97Z"/>
        <path d="m9.5 7.5 5 5"/>
        <path d="M14.5 7.5 9.5 12.5"/>
        <path d="m7 15 5 5"/>
        <path d="m12 15 5 5"/>
    </svg>
);
export default FabricIcon;
