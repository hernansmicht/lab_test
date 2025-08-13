
import React from 'react';

const DnaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.01s3.73-4.01 3.73-4.01M16.27 3.99s3.73 4 3.73 4" />
        <path d="M10.45 7.5s3.73-4 3.73-4" />
        <path d="M4 3.99s3.73 4.01 3.73 4.01" />
        <path d="M20 14.01s-3.73-4-3.73-4" />
        <path d="M13.55 16.5s-3.73 4-3.73 4" />
        <path d="M10.5 10.5c.38.38.38 1 0 1.38s-1 .38-1.38 0a1 1 0 1 1 1.38-1.38z" />
        <path d="M13.5 13.5c.38.38.38 1 0 1.38s-1 .38-1.38 0a1 1 0 1 1 1.38-1.38z" />
    </svg>
);
export default DnaIcon;
