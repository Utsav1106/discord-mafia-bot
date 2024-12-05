import { Schema, model } from 'mongoose';
import { IGuild } from '@/types/guild';

const guildSchema = new Schema<IGuild>({
    guildId: { type: String },
    createdAt: { type: Number, default: Date.now() },
    gameMode: { type: String, default: 'crimson' },
    dmTime: { type: Number, default: 45000 },
    voteTime: { type: Number, default: 35000 },
    talkTime: { type: Number, default: 45000 },
    categoryId: { type: String, default: '' },
    showDeadRole: { type: Boolean, default: false },
    anamoly: { type: Boolean, default: false },
    party: { type: Schema.Types.Mixed, default: [] },
    wills: { type: Object, default: {} },
    currentGame: { type: Object, default: {} },
    data: { type: Object, default: {} }
});

const guildModel = model<IGuild>('Guild', guildSchema);
export default guildModel;