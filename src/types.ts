export interface Candidate {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    voteCount: number;
    userId?: string;
}

export interface Reaction {
    id: string;
    type: string;
    timestamp: number;
    message?: string;
}

export interface Vote {
    userId: string;
    candidateId: string;
    timestamp: number;
}

export interface User {
    uid: string;
    hasVoted: boolean;
    votedCandidateId?: string;
}
