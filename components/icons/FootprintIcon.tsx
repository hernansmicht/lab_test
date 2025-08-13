
import React from 'react';

const FootprintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16.5A3.5 3.5 0 0 1 7.5 13H17a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 1-2.5 2.5H12a2 2 0 0 1-2-2V18"/>
        <path d="M7 13v-3.5A3.5 3.5 0 0 1 10.5 6H13a1 1 0 0 1 1 1v2"/>
        <path d="M17 13h-3.5a1.5 1.5 0 0 1 0-3H15a1 1 0 0 1 1 1v2"/>
        <path d="M4.5 10.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1v-1Z"/>
        <path d="M15.5 5.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H16.5a1 1 0 0 1-1-1v-1Z"/>
        <path d="M10.5 4.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H11.5a1 1 0 0 1-1-1v-1Z"/>
    </svg>
);
export default FootprintIcon;
