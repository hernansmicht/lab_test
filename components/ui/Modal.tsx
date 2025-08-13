import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in-fast"
            // Don't close on backdrop click, as minigames can be complex.
            // onClick={onClose} 
        >
            <div 
                className="bg-slate-900 border border-blue-500/30 rounded-xl shadow-lg shadow-blue-500/20 w-full max-w-md m-4 p-2"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
