import React, { type ReactNode } from 'react';

export const Sparkles: React.FC<{ className?: string; children?: ReactNode }> = ({ className = '', children }) => {
    return (
        <div className={`relative inline-block ${className}`}>
            {/* Sparkle decorations around text */}
            <span className="absolute -top-2 -left-2 text-2xl animate-pulse" style={{ animationDelay: '0s' }}>✨</span>
            <span className="absolute -top-2 -right-2 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</span>
            <span className="absolute -bottom-2 -left-2 text-xl animate-pulse" style={{ animationDelay: '1s' }}>💫</span>
            <span className="absolute -bottom-2 -right-2 text-xl animate-pulse" style={{ animationDelay: '1.5s' }}>✨</span>
            <span className="absolute top-1/2 -left-4 text-lg animate-pulse" style={{ animationDelay: '0.75s' }}>⭐</span>
            <span className="absolute top-1/2 -right-4 text-lg animate-pulse" style={{ animationDelay: '1.25s' }}>💫</span>
            {children}
        </div>
    );
};
