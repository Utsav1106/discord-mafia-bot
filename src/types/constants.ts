import { StringSelectMenuBuilder, User } from "discord.js";

export interface GameMode {
    name: string;
    id: string;
    minPlayer: number;
    roles: Array<{
        roleId: string;
        maxNumberOfPlayers?: number;
        guaranteed?: boolean;
    }>;
    choiceOptions: Array<{
        numberOfPlayers: number;
        guaranteed: { roles: string[] };
        random?: Array<{
            players: number | 'remaining';
            roles: string[];
            maybe?: boolean;
        }>;
    }>;
    data: Record<string, any>;
}

interface GameGuild {
    party: PartyMember[];
    markModified: (path: string) => void;
    save: () => Promise<this>;
}

export interface PartyMember {
    username: string;
    displayName: string;
    userId: string;
    side: string;
    lastTarget?: string;
    revealed?: boolean;
    bombs?: Array<any>
    distractedLastTime?: boolean;
    distracted?: boolean
    fakeRole?: string;
    fakeSide?: string
    potion?: string;
    hoarded: number;
    kills: number;
    target?: string;
    dead?: boolean;
    infected?: boolean;
    user?: User
    plagueVote?: boolean;
    lynched?: boolean;
    role: string
}

export interface Role {
    name: string;
    id: string;
    description: string;
    whatToDo: string[];
    visitType: "Active" | "Passive" | "None";
    side: ("Village" | "Mafia" | "Neutral")[];
    goal: string;
    instructions: string[];
    data: {
        action: {
            embedTitle?: string;
            embedDescription?: string;
            getTargets?: (party: PartyMember[], user: PartyMember, guild?: GameGuild) => Promise<StringSelectMenuBuilder>;
            noAction?: boolean;
        };
    };
}


export interface AlchemistPotion {
    name: string;
    id: string;
    description: string;
    info: string;
}