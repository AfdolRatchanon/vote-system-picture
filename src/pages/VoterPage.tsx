import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitVote, subscribeToUserVote, subscribeToSystemConfig, subscribeToCandidates, updateCandidate } from "../services/voteService";
import type { Candidate } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Lock, Edit2, X } from "lucide-react";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";
import { ROUTES } from "../routes";
import partyRabbit from "../assets/party_rabbit.png";
import { Confetti } from "../components/Confetti";
import { Sparkles } from "../components/Sparkles";
import { CelebrationBanner } from "../components/CelebrationBanner";
import { Fireworks } from "../components/Fireworks";

export const VoterPage: React.FC = () => {
    const { user, signInAnonymously, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allowVoting, setAllowVoting] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Edit State
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editImageFile, setEditImageFile] = useState<File | null>(null);

    useEffect(() => {
        const init = async () => {
            if (!user) {
                await signInAnonymously();
            }
        };
        init();
    }, [user, signInAnonymously]);

    useEffect(() => {
        if (!user) return;

        let unsubscribeVote: () => void;
        let unsubscribeConfig: () => void;
        let unsubscribeCandidates: () => void;

        // Subscribe to candidates
        unsubscribeCandidates = subscribeToCandidates((data) => {
            setCandidates(data);
            setLoading(false);
        });

        // Subscribe to user's vote status
        unsubscribeVote = subscribeToUserVote(user.uid, (candidateIds) => {
            // candidateIds is now string[] | null
            if (candidateIds && candidateIds.length > 0) {
                setHasVoted(true);
                navigate(ROUTES.DASHBOARD);
            } else {
                setHasVoted(false);
            }
        });

        // Subscribe to system config
        unsubscribeConfig = subscribeToSystemConfig((config) => {
            setAllowVoting(config.allowVoting);
        });

        return () => {
            if (unsubscribeVote) unsubscribeVote();
            if (unsubscribeConfig) unsubscribeConfig();
            if (unsubscribeCandidates) unsubscribeCandidates();
        };
    }, [user, navigate]);

    const handleCandidateSelect = (candidateId: string, candidateUserId?: string) => {
        if (!allowVoting || !user) return;

        // Prevent voting for own candidate
        if (candidateUserId === user.uid) {
            return;
        }
        setError(null);

        setSelectedCandidates(prev => {
            if (prev.includes(candidateId)) {
                return prev.filter(id => id !== candidateId);
            }
            if (prev.length >= 2) {
                setError("You can only select up to 2 candidates.");
                return prev;
            }
            return [...prev, candidateId];
        });
    };

    const handleVote = async () => {
        if (selectedCandidates.length !== 2 || !user || !allowVoting) return;

        setSubmitting(true);
        setError(null);
        try {
            await submitVote(user.uid, selectedCandidates);

            // Trigger confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#38bdf8', '#4ade80', '#ef4444', '#facc15', '#a78bfa']
            });

            setHasVoted(true);

            // Delay navigation slightly to show confetti
            setTimeout(() => {
                navigate(ROUTES.DASHBOARD);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to submit vote");
        } finally {
            setSubmitting(false);
        }
    };

    const startEditing = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setEditName(candidate.name);
        setEditDescription(candidate.description);
        setEditImageFile(null);
    };

    const handleUpdateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCandidate) return;

        setSubmitting(true);
        try {
            await updateCandidate(editingCandidate.id, editName, editDescription, editImageFile);
            setEditingCandidate(null);
            alert("Candidate updated successfully!");
        } catch (error) {
            console.error("Error updating candidate:", error);
            alert("Failed to update candidate.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                <span className="ml-3 text-white">Redirecting to results...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 pb-40 md:pb-48 relative">
            <header className="mb-12 md:mb-16 text-center max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-4">
                    <img
                        src={partyRabbit}
                        alt="Party Rabbit"
                        className="w-16 h-auto md:w-24 md:h-auto pixel-art animate-bounce hidden md:block"
                        style={{ imageRendering: "pixelated" }}
                    />
                    <h1 className="text-4xl md:text-6xl font-bold text-white font-pixel tracking-wider text-center">
                        {allowVoting ? "CAST YOUR VOTE" : "VOTING CLOSED"}
                    </h1>
                    <img
                        src={partyRabbit}
                        alt="Party Rabbit"
                        className="w-16 h-auto md:w-24 md:h-auto pixel-art animate-bounce hidden md:block"
                        style={{ imageRendering: "pixelated", transform: "scaleX(-1)" }}
                    />
                </div>
                <Sparkles className="inline-block mb-4">
                    <h1 className="text-5xl md:text-7xl font-bold sbac-text mb-2" style={{ letterSpacing: '0.1em' }}>30 YEARS SBAC</h1>
                </Sparkles>
                <h2 className="text-xl md:text-2xl font-bold text-white font-pixel tracking-wide mb-6">ANNIVERSARY CELEBRATION VOTE</h2>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                    {allowVoting
                        ? "Select exactly 2 candidates to submit your vote."
                        : "Voting is currently closed. You can still view the candidates below."}
                </p>
                {!allowVoting && (
                    <div className="mt-6 inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full border border-red-500/50">
                        <Lock className="w-4 h-4" />
                        <span className="font-bold">Waiting for session to start</span>
                    </div>
                )}
            </header>

            {error && (
                <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setEditingCandidate(null)}>
                    <Card className="w-full max-w-lg border-2 border-[var(--mc-primary)] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white font-pixel">Edit Submission</h2>
                            <button onClick={() => setEditingCandidate(null)} className="text-gray-400 hover:text-white mc-btn p-1 bg-[#4b4b4b]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCandidate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all h-24"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditImageFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--mc-primary)] file:text-black hover:file:bg-[var(--mc-primary-dark)]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button type="button" variant="secondary" onClick={() => setEditingCandidate(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 relative z-10">
                {candidates.map((candidate) => {
                    const isSelected = selectedCandidates.includes(candidate.id);
                    const isOwnCandidate = user && candidate.userId === user.uid;

                    return (
                        <motion.div
                            key={candidate.id}
                            whileHover={{ y: -5 }}
                            whileTap={allowVoting && !isOwnCandidate ? { scale: 0.98 } : {}}
                            onClick={() => handleCandidateSelect(candidate.id, candidate.userId)}
                            className={cn(
                                "transition-all duration-300 h-full relative",
                                allowVoting ? (isOwnCandidate ? "cursor-not-allowed opacity-60" : "cursor-pointer") : "cursor-default",
                                isSelected ? "ring-4 ring-[var(--mc-primary)] scale-[1.02]" : ""
                            )}
                        >
                            {isOwnCandidate && (
                                <div className="absolute top-2 right-2 z-20 flex gap-2">
                                    <div className="bg-red-500/80 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                        Your Candidate
                                    </div>
                                    <button
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded shadow-lg transition-colors cursor-pointer pointer-events-auto"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(candidate);
                                        }}
                                        title="Edit Candidate"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <Card className={cn(
                                "overflow-hidden p-0 h-full flex flex-col border-0 group",
                                isSelected ? "bg-[#4b4b4b]" : "bg-[var(--mc-card)]"
                            )}>
                                <div className="h-48 md:h-56 bg-[#1a1a1a] flex items-center justify-center overflow-hidden relative border-b-4 border-black group">
                                    <img
                                        src={candidate.imageUrl}
                                        alt={candidate.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(candidate.imageUrl);
                                        }}
                                    />
                                    {/* Selection Overlay */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-[var(--mc-primary)]/20 z-10 flex items-center justify-center backdrop-blur-[2px] pointer-events-none">
                                            <CheckCircle2 className="w-16 h-16 text-[var(--mc-primary)] drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold mb-2 text-white font-pixel tracking-wide">{candidate.name}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed flex-1 font-sans">
                                        {candidate.description}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--mc-bg)] via-[var(--mc-bg)]/95 to-transparent backdrop-blur-sm z-40">
                <div className="max-w-lg mx-auto">
                    <Button
                        className="w-full text-lg py-4 shadow-xl"
                        disabled={selectedCandidates.length !== 2 || !allowVoting}
                        onClick={handleVote}
                        isLoading={submitting}
                        variant={allowVoting && selectedCandidates.length === 2 ? "primary" : "secondary"}
                    >
                        {allowVoting
                            ? (selectedCandidates.length === 2 ? "SUBMIT 2 VOTES" : `Select Exactly 2 Candidates (${selectedCandidates.length}/2)`)
                            : "Voting Closed"}
                    </Button>
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                        <img
                            src={selectedImage}
                            alt="Full View"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg border-4 border-white/20 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            <CelebrationBanner />
            <Fireworks />
            <Confetti />
        </div>
    );
};

