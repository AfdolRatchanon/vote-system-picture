import React, { createContext, useContext, useEffect, useState } from "react";
import {
    type User,
    signInAnonymously as firebaseSignInAnonymously,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInAnonymously: () => Promise<void>;
    signInAdmin: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // Simple check: if user has email, assume admin (since anon users don't have email)
            // In a real app, check custom claims or a specific admin list.
            setIsAdmin(!!currentUser?.email);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInAnonymously = async () => {
        try {
            await firebaseSignInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in anonymously:", error);
        }
    };

    const signInAdmin = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInAnonymously, signInAdmin, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
