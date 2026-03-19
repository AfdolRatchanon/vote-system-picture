import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
    getCandidates,
    resetAllVotes,
    deleteCandidate,
    seedCandidates,
    toggleUserSubmission,
    subscribeToSystemConfig,
    addCandidate,
    updateCandidate,
    toggleVoting,
    deleteAllCandidates,
    subscribeToCandidates,
    toggleShowResults,
    toggleReactions,
    toggleSounds,
} from "../services/voteService";
import type { Candidate } from "../types";
import { Button } from "../components/ui/Button";
import { MinecraftToggle } from "../components/ui/MinecraftToggle";
import { Card } from "../components/ui/Card";
import { Trash2, Edit2, X } from "lucide-react";
import QRCode from "react-qr-code";
import { ROUTES } from "../routes";
import partyRabbit from "../assets/party_rabbit.png";
import { Sparkles } from "../components/Sparkles";
import { CelebrationBanner } from "../components/CelebrationBanner";

export const AdminPanelPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [allowUserSubmission, setAllowUserSubmission] = useState(false);
    const [allowVoting, setAllowVoting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [allowReactions, setAllowReactions] = useState(false);
    const [allowSounds, setAllowSounds] = useState(false);
    const [showFullQRCode, setShowFullQRCode] = useState(false);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const submissionUrl = `${window.location.origin}${ROUTES.ADD_CANDIDATE}`;

    useEffect(() => {
        if (isAdmin) {
            // Subscribe to candidates for real-time updates
            const unsubscribeCandidates = subscribeToCandidates((data) => {
                setCandidates(data);
            });

            const unsubscribeConfig = subscribeToSystemConfig((config) => {
                setAllowUserSubmission(config.allowUserSubmission);
                setAllowVoting(config.allowVoting);
                setShowResults(config.showResults);
                setAllowReactions(config.allowReactions);
                setAllowSounds(config.allowSounds);
            });

            return () => {
                unsubscribeCandidates();
                unsubscribeConfig();
            };
        }
    }, [isAdmin]);

    const fetchCandidates = async () => {
        // Kept for manual refresh if needed, but subscription handles updates
        const data = await getCandidates();
        setCandidates(data);
    };

    const handleResetVotes = async () => {
        if (window.confirm("Are you sure you want to reset all votes? This cannot be undone.")) {
            setLoading(true);
            try {
                await resetAllVotes();
                await fetchCandidates();
                alert("All votes have been reset.");
            } catch (error) {
                console.error("Error resetting votes:", error);
                alert("Failed to reset votes.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm("Are you sure you want to DELETE ALL CANDIDATES? This action cannot be undone.")) {
            setLoading(true);
            try {
                await resetAllVotes(); // Also reset votes as requested
                await deleteAllCandidates();
                await fetchCandidates();
                alert("All candidates deleted and votes reset.");
            } catch (error) {
                console.error("Error deleting all candidates:", error);
                alert("Failed to delete all candidates.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this candidate?")) {
            setLoading(true);
            try {
                await deleteCandidate(id);
                await fetchCandidates();
            } catch (error) {
                console.error("Error deleting candidate:", error);
                alert("Failed to delete candidate.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSeedData = async () => {
        if (window.confirm("This will clear existing candidates and add seed data. Continue?")) {
            setLoading(true);
            try {
                await seedCandidates();
                await fetchCandidates();
                alert("Data seeded successfully.");
            } catch (error) {
                console.error("Error seeding data:", error);
                alert("Failed to seed data.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleSubmission = async () => {
        setLoading(true);
        try {
            await toggleUserSubmission(!allowUserSubmission);
        } catch (error) {
            console.error("Error toggling submission:", error);
            alert("Failed to toggle submission status.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVoting = async () => {
        setLoading(true);
        try {
            await toggleVoting(!allowVoting);
        } catch (error) {
            console.error("Error toggling voting:", error);
            alert("Failed to toggle voting status.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleShowResults = async () => {
        setLoading(true);
        try {
            await toggleShowResults(!showResults);
        } catch (error) {
            console.error("Error toggling results visibility:", error);
            alert("Failed to toggle results visibility.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReactions = async () => {
        setLoading(true);
        try {
            await toggleReactions(!allowReactions);
        } catch (error) {
            console.error("Error toggling reactions:", error);
            alert("Failed to toggle reactions.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSounds = async () => {
        setLoading(true);
        try {
            await toggleSounds(!allowSounds);
        } catch (error) {
            console.error("Error toggling sounds:", error);
            alert("Failed to toggle sounds.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Admin candidates don't have a specific userId owner
            await addCandidate(newName, newDescription, imageFile, "admin");
            setNewName("");
            setNewDescription("");
            setImageFile(null);
            setShowAddForm(false);
            await fetchCandidates();
            alert("Candidate added successfully!");
        } catch (error) {
            console.error("Error adding candidate:", error);
            alert("Failed to add candidate.");
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setEditName(candidate.name);
        setEditDescription(candidate.description);
        setImageFile(null);
    };

    const handleUpdateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCandidate) return;

        setLoading(true);
        try {
            await updateCandidate(editingCandidate.id, editName, editDescription, imageFile);
            setEditingCandidate(null);
            await fetchCandidates();
            alert("Candidate updated successfully!");
        } catch (error) {
            console.error("Error updating candidate:", error);
            alert("Failed to update candidate.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>Access Denied. Admins only.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="text-center flex-1">
                    <Sparkles className="inline-block mb-2">
                        <h1 className="text-4xl md:text-6xl font-bold sbac-text mb-1" style={{ letterSpacing: '0.1em' }}>30 YEARS SBAC</h1>
                    </Sparkles>
                    <h2 className="text-lg md:text-xl font-bold text-white font-pixel tracking-wide mb-2">ANNIVERSARY CELEBRATION VOTE</h2>
                    <div className="flex items-center justify-center gap-3">
                        <img
                            src={partyRabbit}
                            alt="Party Rabbit"
                            className="w-10 h-auto pixel-art animate-bounce"
                            style={{ imageRendering: "pixelated" }}
                        />
                        <h3 className="text-2xl md:text-3xl font-bold text-white font-pixel">Admin Panel</h3>
                    </div>
                </div>
                <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => window.open(ROUTES.RESULTS, "_blank")}
                        className="px-4 py-2 text-sm font-bold transition-all mc-btn bg-[var(--mc-primary)] text-black hover:bg-white"
                    >
                        Open Results Dashboard ↗
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
                <Card className="flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2 font-pixel">System Controls</h3>
                        <p className="text-gray-400 text-sm mb-4 font-sans">Manage voting data and system state</p>
                    </div>
                    <div className="flex flex-col gap-8">
                        {/* 1. Controller Zone (Switches) */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-8 bg-[var(--mc-primary)] border-2 border-black"></div>
                                <h3 className="text-xl font-bold text-white font-pixel">System Controllers</h3>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <MinecraftToggle
                                    label="Voting"
                                    checked={allowVoting}
                                    onChange={handleToggleVoting}
                                    isLoading={loading}
                                />
                                <MinecraftToggle
                                    label="Results"
                                    checked={showResults}
                                    onChange={handleToggleShowResults}
                                    isLoading={loading}
                                    onLabel="SHOWN"
                                    offLabel="HIDDEN"
                                />
                                <MinecraftToggle
                                    label="Reactions"
                                    checked={allowReactions}
                                    onChange={handleToggleReactions}
                                    isLoading={loading}
                                />
                                <MinecraftToggle
                                    label="Sounds"
                                    checked={allowSounds}
                                    onChange={handleToggleSounds}
                                    isLoading={loading}
                                />
                                <MinecraftToggle
                                    label="Submissions"
                                    checked={allowUserSubmission}
                                    onChange={handleToggleSubmission}
                                    isLoading={loading}
                                    onLabel="OPEN"
                                    offLabel="CLOSED"
                                />
                            </div>

                            {allowUserSubmission && (
                                <div
                                    className="mt-4 flex items-center gap-4 bg-white p-4 rounded-lg border-4 border-black cursor-pointer hover:bg-gray-50 transition-colors max-w-md"
                                    onClick={() => setShowFullQRCode(true)}
                                >
                                    <QRCode value={submissionUrl} size={60} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-black font-bold text-sm mb-1 font-pixel">Submission Link</p>
                                        <p className="text-gray-600 text-xs truncate font-mono">{submissionUrl}</p>
                                    </div>
                                    <span className="font-bold text-[var(--mc-bg)]">🔎</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Action Zone (Buttons) */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-8 bg-[var(--mc-danger)] border-2 border-black"></div>
                                <h3 className="text-xl font-bold text-white font-pixel">Data Actions</h3>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowAddForm(!showAddForm);
                                        setEditingCandidate(null);
                                        setNewName("");
                                        setNewDescription("");
                                        setImageFile(null);
                                    }}
                                    className="h-20 text-lg"
                                >
                                    {showAddForm ? "Cancel Add" : "+ Add Candidate"}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={handleSeedData}
                                    isLoading={loading}
                                    className="h-20 text-lg"
                                >
                                    🌱 Seed Data
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={handleResetVotes}
                                    isLoading={loading}
                                    className="h-20 text-lg"
                                >
                                    ⚠️ Reset Votes
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={handleDeleteAll}
                                    isLoading={loading}
                                    className="h-20 text-lg"
                                >
                                    🗑️ Delete All
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Full Screen QR Code Modal */}
            {
                showFullQRCode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowFullQRCode(false)}>
                        <div className="bg-white p-8 rounded-2xl max-w-3xl w-full text-center animate-in fade-in zoom-in duration-200 overflow-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-black mb-6 font-pixel">Scan to Add Candidate</h2>
                            <div className="bg-white p-4 rounded-xl border-4 border-black inline-block mb-6">
                                <QRCode value={submissionUrl} size={550} />
                            </div>
                            <p className="text-gray-600 font-mono text-sm break-all mb-6 bg-gray-100 p-3 rounded">{submissionUrl}</p>
                        </div>
                    </div>
                )
            }

            {
                showAddForm && (
                    <Card className="mb-8 border-2 border-[var(--mc-primary)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white font-pixel">Add New Candidate</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white mc-btn p-1 bg-[#4b4b4b]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCandidate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all"
                                    placeholder="Candidate Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all h-24"
                                    placeholder="Candidate Description"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--mc-primary)] file:text-black hover:file:bg-[var(--mc-primary-dark)]"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={loading}>
                                    Add Candidate
                                </Button>
                            </div>
                        </form>
                    </Card>
                )
            }

            {
                editingCandidate && (
                    <Card className="mb-8 border-2 border-[var(--mc-primary)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white font-pixel">Edit Candidate</h2>
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
                                    placeholder="Candidate Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all h-24"
                                    placeholder="Candidate Description"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--mc-primary)] file:text-black hover:file:bg-[var(--mc-primary-dark)]"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setEditingCandidate(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={loading}>
                                    Update Candidate
                                </Button>
                            </div>
                        </form>
                    </Card>
                )
            }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {candidates.map((candidate) => (
                    <Card key={candidate.id} className="flex flex-col h-full">
                        <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gray-800 border-2 border-black">
                            <img
                                src={candidate.imageUrl}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Vote count hidden in management tab */}
                        </div>
                        <div className="flex-1 mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 font-pixel">{candidate.name}</h3>
                            <p className="text-gray-400 text-sm font-sans">{candidate.description}</p>
                        </div>
                        <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                            <Button
                                variant="secondary"
                                onClick={() => startEditing(candidate)}
                                className="flex-1 py-2 text-sm"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleDelete(candidate.id)}
                                className="flex-1 py-2 text-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <Card>
                    <h3 className="text-lg font-bold text-white mb-4 font-pixel">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#2C2C2C] p-4 border-2 border-black">
                            <p className="text-gray-400 text-xs uppercase font-bold">Total Votes</p>
                            <p className="text-2xl font-bold text-[var(--mc-primary)] font-pixel">
                                {candidates.reduce((acc, c) => acc + c.voteCount, 0)}
                            </p>
                        </div>
                        <div className="bg-[#2C2C2C] p-4 border-2 border-black">
                            <p className="text-gray-400 text-xs uppercase font-bold">Candidates</p>
                            <p className="text-2xl font-bold text-white font-pixel">{candidates.length}</p>
                        </div>
                    </div>
                </Card>
            </div>
            <CelebrationBanner />
        </div>
    );
};
