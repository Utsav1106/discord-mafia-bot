import mongoose from 'mongoose'

const MemberSchema = mongoose.model("Member", new mongoose.Schema({
    id: { type: String },
    guild: { type: String },
}));

export default MemberSchema;
