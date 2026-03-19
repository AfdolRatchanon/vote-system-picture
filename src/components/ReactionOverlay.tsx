import React, { useEffect, useRef } from "react";
import { subscribeToReactions, subscribeToSounds, subscribeToSystemConfig } from "../services/voteService";
import pixelRabbitSrc from "../assets/pixel_rabbit.png";


interface Particle {
    id: string;
    x: number;
    y: number;
    text: string; // This is the emoji
    velocityY: number;
    velocityR: number; // No longer used for rotation but kept for structure if needed
    scale: number;
    opacity: number;
    createdAt: number;
    isMessage: boolean;
    message?: string; // Separate message content
}

export const ReactionOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number | undefined>(undefined);

    const activeAudios = useRef<HTMLAudioElement[]>([]);
    const rabbitImageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = pixelRabbitSrc;
        rabbitImageRef.current = img;
    }, []);

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


        // Actually, simpler logic: 
        // Always subscribe to reactions but only render if allowed? No, safer to not subscribe to save bandwidth.
        // But the requirement says "Toggle Open/Close". 
        // Let's implement a clean subscription manager inside this effect.

        const unsubs: (() => void)[] = [];

        const startSubscriptions = (allowReactions: boolean, allowSounds: boolean) => {
            // Clear old subs first
            unsubs.forEach(Fn => Fn());
            unsubs.length = 0;

            if (allowReactions) {
                const unsub = subscribeToReactions((newReaction) => {
                    if (Date.now() - newReaction.timestamp < 2000) {
                        const isMessage = !!newReaction.message;
                        const particle: Particle = {
                            id: newReaction.id,
                            x: Math.random() * (canvas.width - 100) + 50,
                            y: canvas.height + 50,
                            text: newReaction.type,
                            velocityY: 2 + Math.random() * 3,
                            velocityR: 0,
                            scale: 1,
                            opacity: 1,
                            createdAt: Date.now(),
                            isMessage: isMessage,
                            message: newReaction.message
                        };
                        particles.current.push(particle);
                    }
                });
                unsubs.push(unsub);
            }

            if (allowSounds) {
                const unsub = subscribeToSounds((newSound) => {
                    const soundMap: Record<string, string> = {
                        'clap': '/sounds/applause-383901.mp3',
                        'pop': '/sounds/bubble-pop-424583.mp3',
                        'click': '/sounds/mouse-click-290204.mp3',
                        'cheer': '/sounds/losing-horn-313723.mp3'
                    };

                    const file = soundMap[newSound.soundId];
                    if (file) {
                        const audio = new Audio(file);
                        activeAudios.current.push(audio);
                        audio.onended = () => {
                            activeAudios.current = activeAudios.current.filter(a => a !== audio);
                        };
                        audio.play().catch(e => console.error("Error playing sound:", e));
                    }
                });
                unsubs.push(unsub);
            }
        };

        // Initial check and subscribe
        const configUnsub = subscribeToSystemConfig((config) => {
            startSubscriptions(config.allowReactions, config.allowSounds);
            // If reactions are disabled, clear existing particles immediately
            if (!config.allowReactions) {
                particles.current = [];
            }
            // If sounds are disabled, stop all currently playing sounds
            if (!config.allowSounds) {
                activeAudios.current.forEach(audio => {
                    audio.pause();
                    audio.currentTime = 0;
                });
                activeAudios.current = [];
            }
        });

        const loop = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const topFadeThreshold = canvas.height * 0.4;

            particles.current.forEach((p) => {
                p.y -= p.velocityY;
                if (p.y < topFadeThreshold) {
                    p.opacity = p.y / topFadeThreshold;
                } else {
                    p.opacity = 1;
                }

                if (p.y < -100 || p.opacity <= 0.01) {
                    p.opacity = 0;
                }

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.scale(p.scale, p.scale);

                // Draw Content
                if (p.isMessage && p.message) {
                    // Draw Message Only (Minecraft Style Box)
                    ctx.save();
                    ctx.font = "bold 20px 'Minecraft', Arial, sans-serif";
                    const metrics = ctx.measureText(p.message);
                    const padding = 16;
                    const bgWidth = metrics.width + (padding * 2);
                    const bgHeight = 44;
                    const bgX = -bgWidth / 2;
                    const bgY = -bgHeight / 2;

                    // Shadow
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(bgX + 4, bgY + 4, bgWidth, bgHeight);

                    // Background
                    ctx.fillStyle = "white";
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 4;

                    ctx.beginPath();
                    ctx.rect(bgX, bgY, bgWidth, bgHeight);
                    ctx.fill();
                    ctx.stroke();

                    // Text
                    ctx.fillStyle = "black";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.message, 0, 0);

                    ctx.restore();
                } else if (p.text === 'RABBIT' && rabbitImageRef.current) {
                    // Draw Rabbit Image
                    const size = window.innerWidth > 768 ? 64 : 48;
                    const halfSize = size / 2;
                    // Apply pixel art styling if needed, but canvas usually handles it if we don't scale too weirdly
                    // Or set imageSmoothingEnabled = false on ctx
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(rabbitImageRef.current, -halfSize, -halfSize, size, size);
                } else {
                    // Draw Emoji Only
                    ctx.font = "48px Arial";
                    if (window.innerWidth > 768) ctx.font = "64px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.text, 0, 0);
                }

                ctx.restore();
            });

            particles.current = particles.current.filter(p => p.opacity > 0.01);
            animationFrameId.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('resize', resize);
            configUnsub();
            unsubs.forEach(Fn => Fn());
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[60]"
        />
    );
};
