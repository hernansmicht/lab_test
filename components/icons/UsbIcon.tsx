
import React from 'react';

const UsbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-5"/>
        <path d="M9 17h6"/>
        <path d="M10 10v4"/>
        <path d="M14 10v4"/>
        <path d="M5 10v4h14v-4H5Z"/>
        <path d="M6 10V8c0-1.7 1.3-3 3-3h6c1.7 0 3 1.3 3 3v2"/>
    </svg>
);
export default UsbIcon;
