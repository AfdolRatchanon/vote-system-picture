import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Lock } from "lucide-react";
import { ROUTES } from "../routes";
import partyRabbit from "../assets/party_rabbit.png";
import { CelebrationBanner } from "../components/CelebrationBanner";
import { Fireworks } from "../components/Fireworks";
import { Confetti } from "../components/Confetti";
import { Sparkles } from "../components/Sparkles";

export const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { signInAdmin } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInAdmin(email, password);
            navigate(ROUTES.ADMIN_PANEL);
        } catch (err: any) {
            setError("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <div className="text-center mb-8 absolute top-8 left-0 right-0">
                <Sparkles className="inline-block mb-2">
                    <h1 className="text-4xl md:text-6xl font-bold sbac-text mb-1" style={{ letterSpacing: '0.1em' }}>30 YEARS SBAC</h1>
                </Sparkles>
                <h2 className="text-lg md:text-xl font-bold text-white font-pixel tracking-wide">ANNIVERSARY CELEBRATION VOTE</h2>
                <div className="flex items-center justify-center gap-3 mt-2">
                    <img
                        src={partyRabbit}
                        alt="Party Rabbit"
                        className="w-10 h-auto pixel-art animate-bounce"
                        style={{ imageRendering: "pixelated" }}
                    />
                    <h3 className="text-xl font-bold text-white font-pixel">Admin Login</h3>
                </div>
            </div>

            <Card className="w-full max-w-md p-6 md:p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-[var(--mc-primary)]/10 w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-[var(--mc-primary)]">
                        <Lock className="w-8 h-8 text-[var(--mc-primary)]" />
                    </div>
                    <p className="text-gray-400 font-sans">Please login to continue</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full mt-4" isLoading={loading}>
                        Login
                    </Button>
                </form>
            </Card>
            <CelebrationBanner />
            <Fireworks />
            <Confetti />
        </div>
    );
};
