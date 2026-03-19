import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    runTransaction,
    query,
    orderBy,
    writeBatch,
    getDoc,
    addDoc,
    deleteDoc,
    limit,
    where
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { db, storage } from "../firebase";
import type { Candidate, Reaction } from "../types";

const CANDIDATES_COLLECTION = "candidates";
const VOTES_COLLECTION = "votes";

export const getCandidates = async (): Promise<Candidate[]> => {
    const q = query(collection(db, CANDIDATES_COLLECTION));
    const snapshot = await getDocs(q);
    const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
    return candidates.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
};

export const subscribeToCandidates = (callback: (candidates: Candidate[]) => void) => {
    const q = query(collection(db, CANDIDATES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        const sortedCandidates = candidates.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        callback(sortedCandidates);
    });
};

export const submitVote = async (userId: string, candidateIds: string[]) => {
    if (candidateIds.length === 0 || candidateIds.length > 2) {
        throw new Error("You must select 1 or 2 candidates.");
    }

    const voteRef = doc(db, VOTES_COLLECTION, userId);

    await runTransaction(db, async (transaction) => {
        // 1. READ ALL DATA FIRST
        const voteDocPromise = transaction.get(voteRef);
        const candidateRefs = candidateIds.map(cid => doc(db, CANDIDATES_COLLECTION, cid));
        const candidateDocsPromise = Promise.all(candidateRefs.map(ref => transaction.get(ref)));

        const [voteDoc, candidateDocs] = await Promise.all([voteDocPromise, candidateDocsPromise]);

        // 2. PERFORM CHECKS
        if (voteDoc.exists()) {
            throw new Error("You have already voted.");
        }

        for (let i = 0; i < candidateDocs.length; i++) {
            const docSnapshot = candidateDocs[i];
            const cid = candidateIds[i];

            if (!docSnapshot.exists()) {
                throw new Error(`Candidate ${cid} does not exist.`);
            }

            if (docSnapshot.data().userId === userId) {
                throw new Error("You cannot vote for your own submission.");
            }
        }

        // 3. PERFORM WRITES
        // Increment counts
        for (let i = 0; i < candidateDocs.length; i++) {
            const docSnapshot = candidateDocs[i];
            const ref = candidateRefs[i];

            const newVoteCount = (docSnapshot.data()?.voteCount || 0) + 1;
            transaction.update(ref, { voteCount: newVoteCount });
        }

        // Create vote record
        transaction.set(voteRef, {
            candidateIds,
            timestamp: Date.now(),
            userId
        });
    });
};

export const checkHasVoted = async (userId: string): Promise<string[] | null> => {
    const voteRef = doc(db, VOTES_COLLECTION, userId);
    const voteDoc = await getDoc(voteRef);
    if (voteDoc.exists()) {
        return voteDoc.data().candidateIds || (voteDoc.data().candidateId ? [voteDoc.data().candidateId] : null);
    }
    return null;
};

export const subscribeToUserVote = (userId: string, callback: (candidateIds: string[] | null) => void) => {
    const voteRef = doc(db, VOTES_COLLECTION, userId);
    return onSnapshot(voteRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            // Handle backward compatibility with single vote
            const ids = data.candidateIds || (data.candidateId ? [data.candidateId] : []);
            callback(ids.length > 0 ? ids : null);
        } else {
            callback(null);
        }
    });
};

const HISTORY_COLLECTION = "history";

export const archiveSession = async () => {
    const candidatesSnapshot = await getDocs(collection(db, CANDIDATES_COLLECTION));
    if (candidatesSnapshot.empty) return;

    const sessionData = {
        timestamp: Date.now(),
        results: candidatesSnapshot.docs.map(doc => ({
            name: doc.data().name,
            voteCount: doc.data().voteCount,
            imageUrl: doc.data().imageUrl
        }))
    };

    await addDoc(collection(db, HISTORY_COLLECTION), sessionData);
};

export const resetAllVotes = async (shouldArchive: boolean = false) => {
    if (shouldArchive) {
        await archiveSession();
    }

    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    // 1. Reset all candidates voteCount to 0
    const candidatesSnapshot = await getDocs(collection(db, CANDIDATES_COLLECTION));
    for (const doc of candidatesSnapshot.docs) {
        batch.update(doc.ref, { voteCount: 0 });
        operationCount++;
        if (operationCount >= BATCH_SIZE) await commitBatch();
    }

    // 2. Delete all votes
    const votesSnapshot = await getDocs(collection(db, VOTES_COLLECTION));
    for (const doc of votesSnapshot.docs) {
        batch.delete(doc.ref);
        operationCount++;
        if (operationCount >= BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
        await batch.commit();
    }
};

export const deleteAllCandidates = async () => {
    const candidatesSnapshot = await getDocs(collection(db, CANDIDATES_COLLECTION));

    // Delete images from storage first (best effort)
    const deleteImagePromises = candidatesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (data.imageUrl && data.imageUrl.includes("firebasestorage")) {
            try {
                const imageRef = ref(storage, data.imageUrl);
                await deleteObject(imageRef);
            } catch (e) {
                console.error("Failed to delete image", e);
            }
        }
    });

    await Promise.all(deleteImagePromises);

    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async () => {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const doc of candidatesSnapshot.docs) {
        batch.delete(doc.ref);
        operationCount++;
        if (operationCount >= BATCH_SIZE) await commitBatch();
    }

    if (operationCount > 0) {
        await batch.commit();
    }
};

// Helper to seed initial data if empty
export const seedCandidates = async () => {
    const snapshot = await getDocs(collection(db, CANDIDATES_COLLECTION));
    if (!snapshot.empty) return;

    const initialCandidates = [
        {
            name: "Design 1: Minimalist",
            description: "Clean lines, ample whitespace, and focus on typography.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+1",
            voteCount: 0
        },
        {
            name: "Design 2: Brutalist",
            description: "Bold, raw, and rugged. High contrast and monospaced fonts.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+2",
            voteCount: 0
        },
        {
            name: "Design 3: Glassmorphism",
            description: "Translucent layers, blur effects, and vivid background colors.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+3",
            voteCount: 0
        },
        {
            name: "Design 4: Neumorphism",
            description: "Soft shadows and low contrast to mimic physical objects.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+4",
            voteCount: 0
        },
        {
            name: "Design 5: Retro Wave",
            description: "80s inspired aesthetics with neon colors and grid lines.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+5",
            voteCount: 0
        },
        {
            name: "Design 6: Cyberpunk",
            description: "High tech, low life. Neon lights, dark backgrounds, and glitch effects.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+6",
            voteCount: 0
        },
        {
            name: "Design 7: Material Design",
            description: "Google's design language. Grid-based layouts, responsive animations.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+7",
            voteCount: 0
        },
        {
            name: "Design 8: Flat Design",
            description: "Minimalist UI design style that uses simple, two-dimensional elements.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+8",
            voteCount: 0
        },
        {
            name: "Design 9: Isometric",
            description: "3D representation of 2D objects. Adds depth and perspective.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+9",
            voteCount: 0
        },
        {
            name: "Design 10: Abstract",
            description: "Non-representational art. Focuses on shapes, colors, and textures.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+10",
            voteCount: 0
        },
        {
            name: "Design 11: Grunge",
            description: "Dirty, messy, and chaotic. Textures like paper, wood, and metal.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+11",
            voteCount: 0
        },
        {
            name: "Design 12: Corporate",
            description: "Professional, clean, and trustworthy. Blue tones and standard fonts.",
            imageUrl: "https://placehold.co/600x400/png?text=Design+12",
            voteCount: 0
        }
    ];

    const batch = writeBatch(db);
    initialCandidates.forEach(c => {
        const docRef = doc(collection(db, CANDIDATES_COLLECTION));
        batch.set(docRef, c);
    });
    await batch.commit();
};

export const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `candidates/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
};

export const getUserCandidate = async (userId: string): Promise<Candidate | null> => {
    const q = query(
        collection(db, CANDIDATES_COLLECTION),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Candidate;
    }
    return null;
};

export const addCandidate = async (name: string, description: string, imageFile: File | null, userId: string) => {
    // Check if user has already submitted (skip for admin)
    if (userId !== "admin") {
        const existingCandidate = await getUserCandidate(userId);
        if (existingCandidate) {
            throw new Error("You have already submitted a candidate.");
        }
    }

    let imageUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`;

    if (imageFile) {
        imageUrl = await uploadImage(imageFile);
    }

    // Add candidate to Firestore
    await addDoc(collection(db, CANDIDATES_COLLECTION), {
        name,
        description,
        imageUrl,
        voteCount: 0,
        userId
    });
};

export const updateCandidate = async (id: string, name: string, description: string, imageFile: File | null) => {
    // 1. Upload new image first if provided
    let newImageUrl: string | null = null;
    if (imageFile) {
        newImageUrl = await uploadImage(imageFile);
    }

    const candidateRef = doc(db, CANDIDATES_COLLECTION, id);
    let oldImageUrl: string | null = null;

    await runTransaction(db, async (transaction) => {
        const candidateDoc = await transaction.get(candidateRef);
        if (!candidateDoc.exists()) {
            throw new Error("Candidate does not exist.");
        }

        const data = candidateDoc.data();
        oldImageUrl = data.imageUrl; // Store old URL for deletion later

        let imageUrl = data.imageUrl;

        if (newImageUrl) {
            imageUrl = newImageUrl;
        } else if (name !== data.name && imageUrl.includes("placehold.co")) {
            // Update image URL if name changes to keep it consistent with placeholder ONLY if it's currently a placeholder
            imageUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`;
        }

        transaction.update(candidateRef, {
            name,
            description,
            imageUrl
        });
    });

    // 3. Post-transaction: Delete old image if replaced and it was a storage image
    if (newImageUrl && oldImageUrl && (oldImageUrl as string).includes("firebasestorage")) {
        try {
            const imageRef = ref(storage, oldImageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Error deleting old image:", error);
            // Non-blocking error
        }
    }
};

export const deleteCandidate = async (candidateId: string) => {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    const candidateDoc = await getDoc(candidateRef);

    if (candidateDoc.exists()) {
        const candidateData = candidateDoc.data();
        const imageUrl = candidateData.imageUrl;

        // Delete image from storage if it's a Firebase Storage URL
        if (imageUrl && imageUrl.includes("firebasestorage")) {
            try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Error deleting image from storage:", error);
                // Continue to delete candidate even if image deletion fails
            }
        }
    }

    await deleteDoc(candidateRef);
};

const REACTIONS_COLLECTION = "reactions";

export const sendReaction = async (type: string, message?: string) => {
    await addDoc(collection(db, REACTIONS_COLLECTION), {
        type,
        timestamp: Date.now(),
        ...(message && { message })
    });
};

export const subscribeToReactions = (callback: (reaction: Reaction) => void) => {
    // Listen to new reactions added after subscription starts
    const q = query(
        collection(db, REACTIONS_COLLECTION),
        orderBy("timestamp", "desc"),
        limit(1)
    );

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                callback({ id: change.doc.id, ...change.doc.data() } as Reaction);
            }
        });
    });
};

const SETTINGS_COLLECTION = "settings";
const CONFIG_DOC_ID = "config";

export const toggleUserSubmission = async (isEnabled: boolean) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { allowUserSubmission: isEnabled });
        } else {
            transaction.update(configRef, { allowUserSubmission: isEnabled });
        }
    });
};

export const toggleVoting = async (isEnabled: boolean) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { allowVoting: isEnabled });
        } else {
            transaction.update(configRef, { allowVoting: isEnabled });
        }
    });
};

export const toggleShowResults = async (isVisible: boolean) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { showResults: isVisible });
        } else {
            transaction.update(configRef, { showResults: isVisible });
        }
    });
};

export const toggleReactions = async (isEnabled: boolean) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { allowReactions: isEnabled });
        } else {
            transaction.update(configRef, { allowReactions: isEnabled });
        }
    });
};

export const toggleSounds = async (isEnabled: boolean) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { allowSounds: isEnabled });
        } else {
            transaction.update(configRef, { allowSounds: isEnabled });
        }
    });
};

export const setTotalEligibleVoters = async (count: number) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await runTransaction(db, async (transaction) => {
        const configDoc = await transaction.get(configRef);
        if (!configDoc.exists()) {
            transaction.set(configRef, { totalEligibleVoters: count });
        } else {
            transaction.update(configRef, { totalEligibleVoters: count });
        }
    });
};

export const subscribeToSystemConfig = (callback: (config: { allowUserSubmission: boolean; allowVoting: boolean; showResults: boolean; totalEligibleVoters: number; allowReactions: boolean; allowSounds: boolean }) => void) => {
    const configRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    return onSnapshot(configRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            callback({
                allowUserSubmission: data.allowUserSubmission ?? false,
                allowVoting: data.allowVoting ?? true,
                showResults: data.showResults ?? false,
                totalEligibleVoters: data.totalEligibleVoters ?? 100, // Default to 100 if not set
                allowReactions: data.allowReactions ?? true,
                allowSounds: data.allowSounds ?? true
            });
        } else {
            callback({ allowUserSubmission: false, allowVoting: true, showResults: false, totalEligibleVoters: 100, allowReactions: true, allowSounds: true });
        }
    });
};

export const subscribeToVoterCount = (callback: (count: number) => void) => {
    const q = query(collection(db, VOTES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    });
};

export const cleanupOldReactions = async () => {
    try {
        const thirtySecondsAgo = Date.now() - 30000;
        // console.log("Running cleanup... checking for reactions older than:", new Date(thirtySecondsAgo).toISOString());

        const q = query(collection(db, REACTIONS_COLLECTION), where("timestamp", "<", thirtySecondsAgo));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // console.log("No old reactions to delete.");
            return;
        }

        console.log(`Found ${snapshot.size} old reactions to delete.`);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("Cleanup complete.");
    } catch (error) {
        console.error("Error cleaning up reactions:", error);
    }
};

export const editVote = async (userId: string, newCandidateId: string) => {
    const voteRef = doc(db, VOTES_COLLECTION, userId);
    const newCandidateRef = doc(db, CANDIDATES_COLLECTION, newCandidateId);

    await runTransaction(db, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        if (!voteDoc.exists()) {
            throw new Error("Vote does not exist.");
        }

        const oldCandidateId = voteDoc.data().candidateId;
        if (oldCandidateId === newCandidateId) {
            return;
        }

        const oldCandidateRef = doc(db, CANDIDATES_COLLECTION, oldCandidateId);
        const oldCandidateDoc = await transaction.get(oldCandidateRef);
        const newCandidateDoc = await transaction.get(newCandidateRef);

        if (!newCandidateDoc.exists()) {
            throw new Error("New candidate does not exist.");
        }

        if (oldCandidateDoc.exists()) {
            const oldVoteCount = Math.max((oldCandidateDoc.data().voteCount || 0) - 1, 0);
            transaction.update(oldCandidateRef, { voteCount: oldVoteCount });
        }

        const newVoteCount = (newCandidateDoc.data().voteCount || 0) + 1;
        transaction.update(newCandidateRef, { voteCount: newVoteCount });

        transaction.update(voteRef, { candidateId: newCandidateId });
    });
};

export interface SoundEvent {
    id: string;
    soundId: string;
    timestamp: number;
}

export const sendSound = async (soundId: string) => {
    try {
        const soundsRef = collection(db, "sounds");
        await addDoc(soundsRef, {
            soundId,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Error sending sound:", error);
    }
};

export const subscribeToSounds = (callback: (sound: SoundEvent) => void) => {
    const soundsRef = collection(db, "sounds");
    // Listen to sounds from the last 5 seconds to avoid playing old history
    const q = query(
        soundsRef,
        where("timestamp", ">", Date.now() - 5000),
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                callback({
                    id: change.doc.id,
                    soundId: data.soundId,
                    timestamp: data.timestamp
                });
            }
        });
    });
};

export const cleanupOldSounds = async () => {
    const soundsRef = collection(db, "sounds");
    const cutoff = Date.now() - 30000; // Keep 30 seconds
    const q = query(soundsRef, where("timestamp", "<", cutoff));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};