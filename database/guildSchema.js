import mongoose from 'mongoose'

const GuildSchema = mongoose.model("Guild", new mongoose.Schema({
    guildId: { type: String },
    createdAt: { type: Number, default: Date.now() },
    gameMode: { type: String, default: 'crimson' },
    dmTime: { type: Number, default: 45000 },
    voteTime: { type: Number, default: 35000 },
    talkTime: { type: Number, default: 45000 },
    categoryId: { type: String, default: '' },
    showDeadRole: { type: Boolean, default: false },
    anamoly: { type: Boolean, default: false },
    party: { type: Array, default: [] },
    wills: { type: Object, default: {} },
    currentGame: { type: Object, default: {} },
    data: {}
}));

export default GuildSchema;
