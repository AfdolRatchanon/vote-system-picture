import React, { useEffect, useRef } from 'react';

interface ConfettiPiece {
    x: number;
    y: number;
    rotation: number;
    rotationSpeed: number;
    velocityX: number;
    velocityY: number;
    color: string;
    size: number;
    shape: 'rect' | 'circle';
}

export const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiPieces = useRef<ConfettiPiece[]>([]);
    const animationFrameId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create confetti pieces
        const colors = ['#ffd700', '#1e88e5', '#dc143c', '#c0c0c0', '#ffed4e'];
        for (let i = 0; i < 50; i++) {
            confettiPieces.current.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 4,
                velocityX: (Math.random() - 0.5) * 2,
                velocityY: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
            });
        }

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confettiPieces.current.forEach((piece) => {
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate((piece.rotation * Math.PI) / 180);
                ctx.fillStyle = piece.color;

                if (piece.shape === 'rect') {
                    ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();

                // Update position
                piece.y += piece.velocityY;
                piece.x += piece.velocityX;
                piece.rotation += piece.rotationSpeed;

                // Reset if off screen
                if (piece.y > canvas.height + 20) {
                    piece.y = -20;
                    piece.x = Math.random() * canvas.width;
                }
                if (piece.x < -20) piece.x = canvas.width + 20;
                if (piece.x > canvas.width + 20) piece.x = -20;
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ opacity: 0.6 }}
        />
    );
};
