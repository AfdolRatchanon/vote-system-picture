import React, { useEffect, useRef } from 'react';

interface Firework {
    x: number;
    y: number;
    particles: Particle[];
    color: string;
}

interface Particle {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    life: number;
    maxLife: number;
}

export const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fireworks = useRef<Firework[]>([]);
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

        const colors = ['#ffd700', '#1e88e5', '#dc143c', '#4ade80', '#ff1744', '#00e5ff'];

        const createFirework = () => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height * 0.5); // Top half only
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particles: Particle[] = [];

            // Create burst of particles
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                const speed = 2 + Math.random() * 3;
                particles.push({
                    x,
                    y,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed,
                    life: 1,
                    maxLife: 60 + Math.random() * 40,
                });
            }

            fireworks.current.push({ x, y, particles, color });
        };

        // Create fireworks periodically
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                createFirework();
            }
        }, 500);

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            fireworks.current.forEach((firework, fIndex) => {
                firework.particles.forEach((particle, pIndex) => {
                    particle.x += particle.velocityX;
                    particle.y += particle.velocityY;
                    particle.velocityY += 0.1; // Gravity
                    particle.life++;

                    const opacity = 1 - particle.life / particle.maxLife;

                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = firework.color;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // Remove dead particles
                    if (particle.life >= particle.maxLife) {
                        firework.particles.splice(pIndex, 1);
                    }
                });

                // Remove empty fireworks
                if (firework.particles.length === 0) {
                    fireworks.current.splice(fIndex, 1);
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            clearInterval(interval);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[10]"
            style={{ opacity: 0.8 }}
        />
    );
};
