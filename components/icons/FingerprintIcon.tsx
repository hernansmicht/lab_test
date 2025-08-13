
import React from 'react';

const FingerprintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
        <path d="M5 19.5A8.5 8.5 0 0 1 12 11a8.5 8.5 0 0 1 7 8.5"/>
        <path d="M12 11a4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5"/>
        <path d="M2 16.5c0-1.66 1.34-3 3-3s3 1.34 3 3"/>
        <path d="M22 12c0 5.5-4.5 10-10 10-1.66 0-3.23-.4-4.65-1.12"/>
        <path d="M15.5 19.5c0-2.49-2.01-4.5-4.5-4.5S6.5 17.01 6.5 19.5"/>
        <path d="M18.5 16.5c0-1.66-1.34-3-3-3s-3 1.34-3 3"/>
    </svg>
);
export default FingerprintIcon;
