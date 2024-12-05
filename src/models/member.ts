import { Schema, model } from 'mongoose'
import { IMember } from '@/types/member';

const memberSchema = new Schema <IMember> ({
    id: { type: String },
    guild: { type: String },
})
const memberModel = model <IMember> ('Member', memberSchema)

export default memberModel