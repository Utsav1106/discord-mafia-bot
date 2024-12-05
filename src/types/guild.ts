import { PartyMember } from "./constants";

export interface IGuild {
    guildId: string;
    createdAt: number;
    gameMode: string;
    dmTime: number;
    voteTime: number;
    talkTime: number;
    categoryId: string;
    showDeadRole: boolean;
    anamoly: boolean;
    party: PartyMember[];
    wills: Record<string, string[]>;
    currentGame: Record<string, any>;
    data: Record<string, any>;
}