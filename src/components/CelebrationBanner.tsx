import React from 'react';

export const CelebrationBanner: React.FC = () => {
    return (
        <div className="absolute top-0 left-0 right-0 z-[100] pointer-events-none">
            {/* Top banner string */}
            <svg className="w-full h-24" viewBox="0 0 1000 100" preserveAspectRatio="none">
                {/* String/rope */}
                <path
                    d="M 0,20 Q 50,15 100,20 T 200,20 T 300,20 T 400,20 T 500,20 T 600,20 T 700,20 T 800,20 T 900,20 T 1000,20"
                    stroke="#8B4513"
                    strokeWidth="2"
                    fill="none"
                />
            </svg>

            {/* Triangular flags */}
            <div className="absolute top-0 left-0 right-0 flex justify-around px-4">
                {[
                    { color: '#dc143c', delay: '0s' },
                    { color: '#1e88e5', delay: '0.1s' },
                    { color: '#ffd700', delay: '0.2s' },
                    { color: '#4ade80', delay: '0.3s' },
                    { color: '#c0c0c0', delay: '0.4s' },
                    { color: '#ff1744', delay: '0.5s' },
                    { color: '#00e5ff', delay: '0.6s' },
                    { color: '#ffed4e', delay: '0.7s' },
                ].map((flag, i) => (
                    <div
                        key={i}
                        className="relative animate-swing"
                        style={{ animationDelay: flag.delay }}
                    >
                        <svg width="40" height="60" viewBox="0 0 40 60">
                            <polygon
                                points="0,0 40,0 20,50"
                                fill={flag.color}
                                stroke="#000"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
};
