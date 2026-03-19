import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./ui/Card";

const ORES = [
    { type: "Coal", color: "#2C2C2C", borderColor: "#1A1A1A", particle: "#000000", hp: 3, points: 1 },
    { type: "Iron", color: "#A19D94", borderColor: "#807C74", particle: "#E6E6E6", hp: 5, points: 5 },
    { type: "Gold", color: "#FDD017", borderColor: "#C9A000", particle: "#FFF7cc", hp: 8, points: 10 },
    { type: "Diamond", color: "#38bdf8", borderColor: "#0284c7", particle: "#bae6fd", hp: 12, points: 50 },
    { type: "Emerald", color: "#4ade80", borderColor: "#16a34a", particle: "#86efac", hp: 15, points: 100 },
];


interface MiningMinigameProps {
    currentVotes?: number;
    maxVotes?: number;
}

export const MiningMinigame: React.FC<MiningMinigameProps> = ({ currentVotes, maxVotes }) => {
    const [score, setScore] = useState(0);
    const [currentOre, setCurrentOre] = useState(ORES[0]);
    const [oreHealth, setOreHealth] = useState(ORES[0].hp);
    const [isShaking, setIsShaking] = useState(false);
    const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

    const votingProgress = (currentVotes !== undefined && maxVotes)
        ? Math.min(100, Math.round((currentVotes / maxVotes) * 100))
        : 0;

    const spawnOre = () => {
        // Randomly pick next ore, weighted towards common ones
        const rand = Math.random();
        let nextOre;
        if (rand < 0.5) nextOre = ORES[0]; // 50% Coal
        else if (rand < 0.75) nextOre = ORES[1]; // 25% Iron
        else if (rand < 0.9) nextOre = ORES[2]; // 15% Gold
        else if (rand < 0.98) nextOre = ORES[3]; // 8% Diamond
        else nextOre = ORES[4]; // 2% Emerald

        setCurrentOre(nextOre);
        setOreHealth(nextOre.hp);
    };

    const handleMine = (e: React.MouseEvent) => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 100);

        // Click effect
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newEffect = {
            id: Date.now(),
            x,
            y,
            text: "-1"
        };
        setClickEffects(prev => [...prev, newEffect]);
        setTimeout(() => {
            setClickEffects(prev => prev.filter(eff => eff.id !== newEffect.id));
        }, 1000);

        setOreHealth(prev => {
            const newHp = prev - 1;
            if (newHp <= 0) {
                // Ore broken!
                setScore(s => s + currentOre.points);
                // Add "Broken" effect
                const breakEffect = {
                    id: Date.now() + 1,
                    x: rect.width / 2,
                    y: rect.height / 2,
                    text: `+${currentOre.points}`
                };
                setClickEffects(prev => [...prev, breakEffect]);
                spawnOre();
                return currentOre.hp; // Reset happens in spawnOre effectively
            }
            return newHp;
        });
    };

    return (
        <Card className="h-full flex flex-col items-center justify-between p-6 bg-[#3a3a3a] border-4 border-black relative overflow-hidden">
            <div className="text-center w-full z-10">
                {currentVotes !== undefined && maxVotes ? (
                    <div className="flex flex-col gap-2 w-full">
                        <h3 className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-bold">Voting Progress</h3>
                        <div className="w-full h-8 bg-[#1a1a1a] border-2 border-[#555] relative overflow-hidden">
                            <motion.div
                                className="h-full bg-[var(--mc-success)] relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${votingProgress}%` }}
                                transition={{ type: "spring", stiffness: 50 }}
                            >
                                <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)", backgroundSize: "1rem 1rem" }} />
                            </motion.div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-white font-bold font-pixel text-xs md:text-sm drop-shadow-[1px_1px_0_#000]">
                                    {votingProgress}% ({currentVotes}/{maxVotes})
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Total Mined Value</h3>
                        <p className="text-4xl font-bold text-[#ffd700] font-pixel drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">${score}</p>
                    </>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center w-full py-8 relative">
                <motion.div
                    className="w-32 h-32 md:w-40 md:h-40 cursor-pointer relative"
                    animate={isShaking ? { x: [-2, 2, -2, 2, 0], y: [1, -1, 0] } : {}}
                    transition={{ duration: 0.1 }}
                    onClick={handleMine}
                >
                    <div
                        className="w-full h-full border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-colors duration-100"
                        style={{
                            backgroundColor: currentOre.color,
                            borderColor: "black"
                        }}
                    >
                        {/* Pixel Art Ore Texture Effect */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `
                                linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), 
                                linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)
                            `,
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 5px 5px'
                        }} />

                        {/* Inner Bevel */}
                        <div className="absolute inset-2 border-2 border-white/20" />
                    </div>

                    {/* Cracks based on health */}
                    <div className="absolute inset-0 pointer-events-none opacity-80">
                        {oreHealth <= currentOre.hp * 0.7 && (
                            <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0">
                                <path d="M20,20 L40,40 M60,20 L50,50" stroke="black" strokeWidth="2" />
                            </svg>
                        )}
                        {oreHealth <= currentOre.hp * 0.4 && (
                            <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0">
                                <path d="M20,80 L50,50 M80,80 L60,60" stroke="black" strokeWidth="2" />
                            </svg>
                        )}
                        {oreHealth <= currentOre.hp * 0.2 && (
                            <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0">
                                <path d="M10,50 L90,50 M50,10 L50,90" stroke="black" strokeWidth="2" />
                            </svg>
                        )}
                    </div>

                    <AnimatePresence>
                        {clickEffects.map(effect => (
                            <motion.div
                                key={effect.id}
                                initial={{ opacity: 1, y: effect.y, x: effect.x }}
                                animate={{ opacity: 0, y: effect.y - 50 }}
                                exit={{ opacity: 0 }}
                                className="absolute font-bold text-white text-xl font-pixel outline-2 pointer-events-none"
                                style={{ textShadow: '2px 2px 0 #000' }}
                            >
                                {effect.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="text-center z-10">
                <p className="text-gray-400 text-sm font-mono animate-pulse">Click to Mine!</p>
                <div className="mt-2 text-xs text-gray-500 font-bold">{currentOre.type} Ore</div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />
        </Card>
    );
};
