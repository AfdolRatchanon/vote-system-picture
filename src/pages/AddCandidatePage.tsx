import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addCandidate, subscribeToSystemConfig } from "../services/voteService";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { Lock, Image as ImageIcon } from "lucide-react";
import { ROUTES } from "../routes";

export const AddCandidatePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signInAnonymously } = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAllowed, setIsAllowed] = useState(false);
    const [checkingConfig, setCheckingConfig] = useState(true);

    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!user) {
                await signInAnonymously();
            }
        };
        init();
    }, [user, signInAnonymously]);

    // Check for existing text
    useEffect(() => {
        const checkSubmission = async () => {
            if (user) {
                try {
                    const { getUserCandidate } = await import("../services/voteService");
                    const candidate = await getUserCandidate(user.uid);
                    if (candidate) {
                        setHasSubmitted(true);
                    } else {
                        setHasSubmitted(false);
                    }
                } catch (e) {
                    console.error("Error checking submission:", e);
                }
            }
        };

        checkSubmission();
    }, [user]);

    useEffect(() => {
        const unsubscribe = subscribeToSystemConfig((config) => {
            setIsAllowed(config.allowUserSubmission);
            setCheckingConfig(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            alert("Please enter a candidate name.");
            return;
        }

        if (!description) {
            alert("Please enter a description.");
            return;
        }

        if (!imageFile) {
            alert("Please upload an image for your candidate.");
            return;
        }

        setLoading(true);
        try {
            if (user) {
                await addCandidate(name, description, imageFile, user.uid);
            } else {
                throw new Error("User not authenticated");
            }
            alert("Your candidate has been submitted successfully!");
            navigate(ROUTES.HOME);
        } catch (error: any) {
            console.error("Error submitting candidate:", error);
            alert(error.message || "Failed to submit candidate. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-[var(--mc-primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center py-12">
                    <div className="bg-[var(--mc-danger)]/10 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-full border-2 border-[var(--mc-danger)]">
                        <Lock className="w-10 h-10 text-[var(--mc-danger)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 font-pixel">Submissions Closed</h1>
                    <p className="text-gray-400 mb-8">The admin has not enabled user submissions at this time.</p>
                    <Button onClick={() => navigate(ROUTES.DASHBOARD)} variant="secondary">
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (hasSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center py-12 border-2 border-[var(--mc-success)]">
                    <div className="bg-[var(--mc-success)]/10 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-full border-2 border-[var(--mc-success)]">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 font-pixel">Already Submitted</h1>
                    <p className="text-gray-400 mb-8">You have already submitted a candidate to the pool.</p>
                    <div className="flex flex-col gap-3">
                        <Button onClick={() => navigate(ROUTES.HOME)} variant="primary">
                            Go Vote
                        </Button>
                        <Button onClick={() => navigate(ROUTES.DASHBOARD)} variant="secondary">
                            View Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-lg border-2 border-[var(--mc-primary)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white font-pixel mb-2">Submit Candidate</h1>
                    <p className="text-gray-400">Add your own design to the voting pool!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Candidate Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-[var(--mc-primary)] outline-none transition-all placeholder:text-gray-500 hover:border-gray-500"
                            placeholder="e.g., My Awesome Design"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[var(--mc-primary)] focus:border-[var(--mc-primary)] outline-none transition-all h-32 placeholder:text-gray-500 hover:border-gray-500"
                            placeholder="Tell us about your design..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Image <span className="text-red-500">*</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer relative group ${imageFile ? "border-[var(--mc-success)] bg-[var(--mc-success)]/10" : "border-gray-600 hover:border-[var(--mc-primary)] bg-gray-900/50 hover:bg-gray-900"}`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                required
                            />
                            <div className="space-y-4 pointer-events-none flex flex-col items-center justify-center">
                                {imageFile ? (
                                    <>
                                        <div className="w-16 h-16 bg-[var(--mc-success)]/20 rounded-full flex items-center justify-center mb-2">
                                            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-[var(--mc-success)] font-bold text-lg">{imageFile.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-[var(--mc-primary)]/20">
                                            <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-[var(--mc-primary)]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg group-hover:text-[var(--mc-primary)]">Upload Image</p>
                                            <p className="text-sm text-gray-400 mt-1">Drag & drop or click to browse</p>
                                            <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB (Required)</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading} className="flex-1" disabled={!imageFile || !name || !description}>
                            Submit
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
