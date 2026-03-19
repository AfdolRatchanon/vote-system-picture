import React, { useEffect, useState } from "react";
import { subscribeToCandidates, sendReaction, cleanupOldReactions, subscribeToSystemConfig, sendSound, cleanupOldSounds } from "../services/voteService";
import pixelRabbit from "../assets/pixel_rabbit.png";
import partyRabbit from "../assets/party_rabbit.png";
import type { Candidate } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import QRCode from "react-qr-code";
import { Card } from "../components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";
import { ReactionOverlay } from "../components/ReactionOverlay";
import { Confetti } from "../components/Confetti";
import { Sparkles } from "../components/Sparkles";
import { CelebrationBanner } from "../components/CelebrationBanner";
import { Fireworks } from "../components/Fireworks";

export const DashboardPage: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [votingUrl, setVotingUrl] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [allowReactions, setAllowReactions] = useState(false);
    const [allowSounds, setAllowSounds] = useState(false);

    // Calculate total votes and max possible votes
    const totalVotes = candidates.reduce((acc, curr) => acc + curr.voteCount, 0);
    const maxVotes = candidates.length > 0 ? candidates.length * 2 : 100;

    useEffect(() => {
        setVotingUrl(window.location.origin);
        const unsubscribe = subscribeToCandidates((data) => setCandidates(data));
        const unsubscribeConfig = subscribeToSystemConfig((config) => {
            setShowResults(config.showResults);
            setAllowReactions(config.allowReactions);
            setAllowSounds(config.allowSounds);
        });
        const cleanupInterval = setInterval(() => {
            cleanupOldReactions();
            cleanupOldSounds();
        }, 30000);
        return () => {
            unsubscribe();
            unsubscribeConfig();
            clearInterval(cleanupInterval);
        };
    }, []);

    const leaders = [...candidates].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3);
    const COLORS = ['#38bdf8', '#4ade80', '#ef4444', '#facc15', '#a78bfa'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-white/10 p-4 rounded-lg shadow-xl">
                    <p className="font-bold text-white">{label}</p>
                    <p className="text-indigo-400">Votes: {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    // ... code ...

    const [reactionMessage, setReactionMessage] = useState("");

    const handleReaction = (type: string) => {
        sendReaction(type, reactionMessage);
        setReactionMessage("");
    };

    const handleSound = (soundId: string) => {
        sendSound(soundId);
    };

    const [showFullQr, setShowFullQr] = useState(false);

    return (
        <div className="min-h-screen p-4 md:p-8 pb-40 flex flex-col gap-8 relative overflow-hidden">
            {/* QR Code Overlay */}
            <AnimatePresence>
                {showFullQr && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFullQr(false)}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.5 }}
                            className="bg-white p-8 border-8 border-black shadow-2xl max-w-full max-h-full"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the QR itself
                        >
                            <QRCode value={votingUrl} size={800} className="w-full h-full max-w-[80vw] max-h-[80vh]" />
                            <p className="mt-4 text-center font-bold text-2xl font-pixel text-black">Scan to Vote</p>
                        </motion.div>
                        <button
                            onClick={() => setShowFullQr(false)}
                            className="absolute top-8 right-8 text-white hover:text-gray-300 mc-btn p-2 bg-[#4b4b4b]"
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Grid */}
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 z-10">
                {/* Left Side: Statistics & Mini-game */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6 md:gap-8 z-10">
                    {leaders.length > 0 && (
                        <Card className="relative overflow-hidden bg-[#c6c6c6] p-4 border-4 border-black order-1 lg:order-3">
                            {!showResults && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-md">
                                    <div className="bg-black p-4 border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform -rotate-2">
                                        <p className="text-white font-bold font-pixel text-xl animate-pulse">RESULTS HIDDEN</p>
                                    </div>
                                </div>
                            )}
                            <div className={`relative z-10 transition-all duration-500 ${!showResults ? "blur-lg opacity-50 pointer-events-none" : ""}`}>
                                <h3 className="text-lg font-bold text-black mb-4 border-b-4 border-black pb-2 font-pixel">Top 3 Leaders</h3>
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {leaders.map((leader, index) => (
                                            <motion.div
                                                key={leader.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                className="flex items-center gap-4 bg-white/5 p-2 rounded-lg"
                                            >
                                                <div className={` 
                                                    w-8 h-8 flex items-center justify-center font-bold text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                    ${index === 0 ? 'bg-[#ffd700]' : index === 1 ? 'bg-[#c0c0c0]' : 'bg-[#cd7f32]'}
                                                `}>
                                                    {index + 1}
                                                </div>
                                                <img
                                                    src={leader.imageUrl}
                                                    alt={leader.name}
                                                    className="w-10 h-10 md:w-12 md:h-12 border-2 border-black object-cover"
                                                    style={{ imageRendering: "pixelated" }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm md:text-base text-black truncate font-pixel">{leader.name}</p>
                                                    <p className="text-[#555] text-xs md:text-sm">{leader.voteCount} votes</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="p-6 bg-[var(--mc-card)] border-white/10">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider font-bold">Voting Progress</h3>
                                <span className="text-white font-bold font-pixel text-sm">
                                    {totalVotes}/{maxVotes} Votes
                                </span>
                            </div>

                            <div className="w-full h-8 bg-[#1a1a1a] border-2 border-[#555] relative overflow-hidden">
                                <motion.div
                                    className="h-full bg-[var(--mc-success)] relative"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.round((totalVotes / maxVotes) * 100))}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                >
                                    <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)", backgroundSize: "1rem 1rem" }} />
                                </motion.div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-white font-bold font-pixel text-sm drop-shadow-[1px_1px_0_#000]">
                                        {Math.min(100, Math.round((totalVotes / maxVotes) * 100))}%
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center font-mono">
                                Based on {candidates.length} Registered Users x 2 Votes
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Chart */}
                <div className="w-full lg:w-2/3 flex flex-col z-10">
                    <header className="mb-8 relative text-center">
                        <Sparkles className="inline-block mb-4">
                            <h1 className="text-5xl md:text-7xl font-bold sbac-text mb-2" style={{ letterSpacing: '0.1em' }}>30 YEARS SBAC</h1>
                        </Sparkles>
                        <h2 className="text-xl md:text-2xl font-bold text-white font-pixel tracking-wide mb-4">ANNIVERSARY CELEBRATION VOTE</h2>
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <img
                                src={partyRabbit}
                                alt="Party Rabbit"
                                className="w-12 h-auto md:w-16 md:h-auto pixel-art animate-bounce"
                                style={{ imageRendering: "pixelated" }}
                            />
                            <h3 className="text-2xl md:text-4xl font-bold text-white font-pixel tracking-wide">
                                Live Results
                            </h3>
                            <img
                                src={partyRabbit}
                                alt="Party Rabbit"
                                className="w-12 h-auto md:w-16 md:h-auto pixel-art animate-bounce"
                                style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
                            />
                        </div>
                    </header>

                    <Card className="flex-1 min-h-[400px] md:min-h-[500px] p-4 md:p-6 mb-8 flex flex-col bg-[var(--mc-card)] border-white/10 relative overflow-hidden">
                        {!showResults && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-md">
                                <div className="bg-black p-4 border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform rotate-2">
                                    <p className="text-white font-bold font-pixel text-xl animate-pulse">RESULTS HIDDEN</p>
                                </div>
                            </div>
                        )}
                        <div
                            className={`w-full relative transition-all duration-500 ${!showResults ? "blur-lg opacity-50 pointer-events-none" : ""}`}
                            style={{ height: Math.max(400, candidates.length * 60) }}
                        >
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[...candidates].sort((a, b) => b.voteCount - a.voteCount)} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            stroke="#e5e7eb"
                                            tick={{ fill: '#e5e7eb', fontSize: 12 }}
                                            className="text-xs md:text-sm"
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                                        <Bar dataKey="voteCount" radius={[0, 4, 4, 0]} barSize={30}>
                                            {candidates.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Black Hole Game Section - Full Width */}
            {/* <div className="w-full max-w-7xl mx-auto z-10 relative">
                <Card className="border-4 border-black bg-[#2C2C2C] p-4">
                    <h3 className="text-xl font-bold text-white mb-4 font-pixel">Black Hole Collector</h3>
                    <BlackHoleGame />
                </Card>
            </div> */}

            {/* Reaction Bar */}
            {(allowReactions || allowSounds) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full max-w-sm px-4">
                    {allowReactions && (
                        <div className="w-full bg-[#c6c6c6] border-4 border-black p-1.5 shadow-2xl flex gap-2">
                            <input
                                type="text"
                                value={reactionMessage}
                                onChange={(e) => setReactionMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-[#8b8b8b] border-2 border-[#373737] text-white placeholder-gray-300 px-4 focus:ring-0 text-sm font-minecraft h-10"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && reactionMessage) {
                                        handleReaction("💬");
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Sound Bar */}
                    {allowSounds && (
                        <div className="bg-[#c6c6c6] border-4 border-black p-2 flex gap-2 shadow-2xl overflow-x-auto max-w-full">
                            <button onClick={() => handleSound("clap")} className="flex-1 flex items-center justify-center p-2 mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90" title="Applause">
                                👏
                            </button>
                            <button onClick={() => handleSound("pop")} className="flex-1 flex items-center justify-center p-2 mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90" title="Pop">
                                🫧
                            </button>
                            <button onClick={() => handleSound("cheer")} className="flex-1 flex items-center justify-center p-2 mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90" title="Cheer">
                                📣
                            </button>
                            <button onClick={() => handleSound("click")} className="flex-1 flex items-center justify-center p-2 mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90" title="Click">
                                🖱️
                            </button>
                        </div>
                    )}

                    {allowReactions && (
                        <div className="bg-[#c6c6c6] border-4 border-black p-2 flex gap-2 shadow-2xl items-center">
                            <button
                                onClick={() => handleReaction("RABBIT")}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90"
                                title="Run Rabbit Run!"
                            >
                                <img src={pixelRabbit} alt="Rabbit" className="w-8 h-8 pixel-art" style={{ imageRendering: "pixelated" }} />
                            </button>
                            <div className="w-px h-8 bg-black/20 mx-1"></div>
                            {["❤️", "👍", "🔥", "🎉", "🚀"].map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xl md:text-2xl mc-btn bg-[#8b8b8b] hover:bg-white/20 active:scale-90"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <CelebrationBanner />
            <Fireworks />
            <Confetti />
            <ReactionOverlay />
        </div>
    );
};
