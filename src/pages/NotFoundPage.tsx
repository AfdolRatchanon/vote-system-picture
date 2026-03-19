import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../routes';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 font-sans text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="z-10 bg-[#1e1e1e] border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
                <h1 className="text-6xl font-bold text-[var(--mc-danger)] mb-4 font-pixel tracking-wider shadow-black drop-shadow-md">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-white mb-6 font-pixel">
                    Chunk Not Loaded
                </h2>
                <p className="text-gray-400 mb-8 font-mono">
                    You've wandered into the far lands. The page you are looking for does not exist or has surprisingly vanished.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={() => navigate(ROUTES.HOME)}
                        className="w-full justify-center py-3 text-lg"
                    >
                        Return to Spawn (Home)
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="w-full justify-center"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};
