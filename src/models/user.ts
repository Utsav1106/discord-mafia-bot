import { Schema, model } from 'mongoose'
import { IUser } from '@/types/user';

const userSchema = new Schema <IUser> ({
    id: { type: String },
    registeredAt: { type: Number, default: Date.now() },
})
const userModel = model <IUser> ('User', userSchema)

export default userModel