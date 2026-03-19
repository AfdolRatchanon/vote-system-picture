import React, { useState, useEffect } from "react";
import { subscribeToCandidates } from "../services/voteService";
import type { Candidate } from "../types";
import { Card } from "../components/ui/Card";
import partyRabbit from "../assets/party_rabbit.png";
import { ReactionOverlay } from "../components/ReactionOverlay";
import { Confetti } from "../components/Confetti";
import { Sparkles } from "../components/Sparkles";
import { CelebrationBanner } from "../components/CelebrationBanner";
import { Fireworks } from "../components/Fireworks";

export const ResultsPage: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToCandidates((data) => {
            setCandidates(data);
        });
        return () => unsubscribe();
    }, []);

    const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
    const top3 = sortedCandidates.slice(0, 3);

    return (
        <div className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-[var(--mc-bg)]">
            {/* Reaction Overlay is ONLY here now */}
            <ReactionOverlay />

            <div className="relative z-10">
                <div className="flex flex-col items-center justify-center mb-12 relative text-center">
                    <Sparkles className="inline-block mb-4">
                        <h1 className="text-5xl md:text-7xl font-bold sbac-text mb-2" style={{ letterSpacing: '0.1em' }}>30 YEARS SBAC</h1>
                    </Sparkles>
                    <h2 className="text-xl md:text-2xl font-bold text-white font-pixel tracking-wide mb-4">ANNIVERSARY CELEBRATION VOTE</h2>
                    <div className="flex items-center gap-4 mb-2">
                        <img
                            src={partyRabbit}
                            alt="Party Rabbit"
                            className="w-16 h-auto md:w-20 md:h-auto pixel-art animate-bounce"
                            style={{ imageRendering: "pixelated" }}
                        />
                        <h3 className="text-3xl md:text-5xl font-bold text-center text-white font-pixel">RESULTS</h3>
                        <img
                            src={partyRabbit}
                            alt="Party Rabbit"
                            className="w-16 h-auto md:w-20 md:h-auto pixel-art animate-bounce"
                            style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-6 md:h-[500px] mb-12 px-4">
                    {top3.map((candidate, index) => {
                        let cardStyle = "border-2 border-white/20 bg-[#1e1e1e]";
                        let badgeStyle = "bg-[var(--mc-primary)] text-black";
                        let textColor = "text-white";
                        let voteColor = "text-[var(--mc-primary)]";
                        let voteLabelColor = "text-gray-400";
                        let layoutClasses = "w-full md:w-1/3";

                        if (index === 0) {
                            // Rank 1
                            cardStyle = "border-4 border-black bg-[#ffd700] shadow-[0_0_50px_rgba(255,215,0,0.4)]";
                            badgeStyle = "bg-black text-[#ffd700]";
                            textColor = "text-black";
                            voteColor = "text-black";
                            voteLabelColor = "text-black/60";
                            layoutClasses = "w-full md:w-[32%] order-1 md:order-2 md:-translate-y-16 md:scale-110 z-30";
                        } else if (index === 1) {
                            // Rank 2
                            cardStyle = "border-4 border-black bg-[#c0c0c0] shadow-xl";
                            badgeStyle = "bg-black text-[#c0c0c0]";
                            textColor = "text-black";
                            voteColor = "text-black";
                            voteLabelColor = "text-black/60";
                            layoutClasses = "w-full md:w-[28%] order-2 md:order-1 md:-translate-y-4 z-20";
                        } else if (index === 2) {
                            // Rank 3
                            cardStyle = "border-4 border-black bg-[#cd7f32] shadow-lg";
                            badgeStyle = "bg-black text-[#cd7f32]";
                            textColor = "text-black";
                            voteColor = "text-black";
                            voteLabelColor = "text-black/60";
                            layoutClasses = "w-full md:w-[28%] order-3 md:order-3 z-10 transform md:scale-95";
                        }

                        return (
                            <Card key={candidate.id} className={`relative overflow-hidden transition-all duration-500 ${cardStyle} ${layoutClasses}`}>
                                <div className={`absolute top-0 left-0 ${badgeStyle} font-bold px-4 py-2 rounded-br-xl font-pixel z-10 shadow-lg border-b-2 border-r-2 border-black`}>
                                    #{index + 1}
                                </div>
                                <div className="h-48 mb-4 rounded-lg overflow-hidden bg-gray-800 border-2 border-black relative">
                                    <img
                                        src={candidate.imageUrl}
                                        alt={candidate.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 font-pixel truncate ${textColor}`}>{candidate.name}</h3>
                                <div className={`text-3xl font-bold font-pixel ${voteColor}`}>
                                    {candidate.voteCount} <span className={`text-sm font-sans ${voteLabelColor}`}>votes</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="max-w-4xl mx-auto">
                    <Card>
                        <h3 className="text-xl font-bold text-white mb-6 font-pixel">Leaderboard</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-white/10">
                                        <th className="p-4 text-gray-400 font-pixel">Rank</th>
                                        <th className="p-4 text-gray-400 font-pixel">Candidate</th>
                                        <th className="p-4 text-gray-400 font-pixel text-right">Votes</th>
                                        <th className="p-4 text-gray-400 font-pixel text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCandidates.map((candidate, index) => {
                                        const totalVotes = candidates.reduce((acc, c) => acc + c.voteCount, 0);
                                        const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";

                                        return (
                                            <tr key={candidate.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-white font-mono">#{index + 1}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={candidate.imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-white/20" />
                                                        <span className="text-white font-bold">{candidate.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-[var(--mc-primary)] font-mono">{candidate.voteCount}</td>
                                                <td className="p-4 text-right text-gray-400 font-mono">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
            <CelebrationBanner />
            <Fireworks />
            <Confetti />
        </div>
    );
};
