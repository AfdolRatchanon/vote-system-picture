import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    vx: number;
    vy: number;
    size: number;
    attracted: boolean;
}

const EMOJIS = ['❤️', '👍', '🔥', '🎉', '🚀', '⭐', '💎', '🦄'];

export const BlackHoleGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);

    // Game state refs to avoid re-renders impacting the loop
    const gameState = useRef({
        particles: [] as Particle[],
        mouse: { x: 0, y: 0 },
        isDragging: false,
        score: 0,
        combo: 0,
        comboTimer: null as ReturnType<typeof setTimeout> | null,
        lastTime: 0,
        blackHoleBaseSize: 60,
        blackHoleCurrentSize: 60
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            // Center black hole initially
            if (!gameState.current.isDragging) {
                gameState.current.mouse.x = canvas.width / 2;
                gameState.current.mouse.y = canvas.height / 2;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Input handlers
        const updatePos = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect();
            gameState.current.mouse.x = clientX - rect.left;
            gameState.current.mouse.y = clientY - rect.top;
            gameState.current.isDragging = true;
        };

        const handleMouseMove = (e: MouseEvent) => updatePos(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            updatePos(e.touches[0].clientX, e.touches[0].clientY);
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

        // Spawner
        const spawnInterval = setInterval(() => {
            if (document.hidden) return;
            const size = 24 + Math.random() * 20;
            const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

            // Spawn from edges
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -50 : canvas.width + 50;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? -50 : canvas.height + 50;
            }

            // Velocity towards center (roughly)
            const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
            const speed = 1 + Math.random() * 2;

            gameState.current.particles.push({
                id: Date.now() + Math.random(),
                x,
                y,
                emoji,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                attracted: false
            });
        }, 500);

        // Game Loop
        let animationFrameId: number;
        const loop = (timestamp: number) => {
            // const dt = (timestamp - gameState.current.lastTime) / 1000; // Unused
            gameState.current.lastTime = timestamp;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update Black Hole Size based on Combo
            const targetSize = gameState.current.blackHoleBaseSize + (gameState.current.combo * 5);
            gameState.current.blackHoleCurrentSize += (targetSize - gameState.current.blackHoleCurrentSize) * 0.1;
            // setBlackHoleSize(gameState.current.blackHoleCurrentSize); // Unused state update removed

            // Draw Black Hole Glow
            const bhX = gameState.current.mouse.x;
            const bhY = gameState.current.mouse.y;
            const bhRadius = gameState.current.blackHoleCurrentSize / 2;

            const gradient = ctx.createRadialGradient(bhX, bhY, bhRadius * 0.2, bhX, bhY, bhRadius * 2);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.5)'); // Indigo
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(bhX, bhY, bhRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw Black Hole Core
            ctx.beginPath();
            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.arc(bhX, bhY, bhRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Process Particles
            gameState.current.particles.forEach((p, index) => {
                // Physics
                p.x += p.vx;
                p.y += p.vy;

                // Attraction logic
                const dx = bhX - p.x;
                const dy = bhY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Gravity range
                if (dist < 200) {
                    p.attracted = true;
                    // Accelerate towards hole
                    p.vx += (dx / dist) * 0.2;
                    p.vy += (dy / dist) * 0.2;
                }

                // Collision Detection
                if (dist < bhRadius + p.size / 2) {
                    // Collected!
                    gameState.current.particles.splice(index, 1);
                    gameState.current.score += 10 + (gameState.current.combo * 5);
                    gameState.current.combo += 1;
                    setScore(gameState.current.score);
                    setCombo(gameState.current.combo);

                    // Reset combo timer
                    if (gameState.current.comboTimer) clearTimeout(gameState.current.comboTimer);
                    gameState.current.comboTimer = setTimeout(() => {
                        gameState.current.combo = 0;
                        setCombo(0);
                    }, 2000); // 2 seconds to keep combo
                }

                // Draw Particle
                ctx.font = `${p.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.emoji, p.x, p.y);
            });

            // Cleanup off-screen particles
            gameState.current.particles = gameState.current.particles.filter(p =>
                p.x > -100 && p.x < canvas.width + 100 &&
                p.y > -100 && p.y < canvas.height + 100
            );

            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            clearInterval(spawnInterval);
            cancelAnimationFrame(animationFrameId);
            if (gameState.current.comboTimer) clearTimeout(gameState.current.comboTimer);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[400px] md:h-[500px] bg-[#0a0a0a] rounded-xl overflow-hidden border-4 border-black shadow-[8px_8px_0_0_rgba(255,255,255,0.1)] cursor-none touch-none">
            {/* UI Layer */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/20">
                    <p className="text-gray-400 text-xs font-bold uppercase">Score</p>
                    <p className="text-2xl font-bold text-white font-pixel">{score.toLocaleString()}</p>
                </div>
            </div>

            {/* Combo Display */}
            <AnimatePresence>
                {combo > 1 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute top-4 right-4 z-10 pointer-events-none"
                    >
                        <div className="bg-[var(--mc-primary)]/20 backdrop-blur-md p-3 rounded-lg border border-[var(--mc-primary)]">
                            <p className="text-[var(--mc-primary)] text-xs font-bold uppercase">Combo</p>
                            <p className="text-3xl font-bold text-white font-pixel italic">x{combo}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="block w-full h-full" />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono pointer-events-none text-center">
                Drag the Black Hole to collect reactions! <br />
                Keep the combo going for massive points!
            </div>
        </div>
    );
};
