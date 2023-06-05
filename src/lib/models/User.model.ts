import { Document, Model, Schema, model, models } from 'mongoose'
import { UserRole } from '../classes/User'

export interface IUserModel extends Document {
    username: string
    email: string
    password: string
    firstName: string | null
    lastName: string | null
    role: UserRole
    verified: boolean
    verifyToken: string | null,
    passwordResetToken: string | null
    createdAt: number
}

const userSchema = new Schema<IUserModel>({
    id: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true
    },

    firstName: {
        type: String,
        required: false
    },

    lastName: {
        type: String,
        required: false
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: Number,
        required: true
    },

    verified: {
        type: Boolean,
        required: true
    },

    verifyToken: {
        type: String,
        required: false
    },

    passwordResetToken: {
        type: String,
        required: false
    },

    createdAt: {
        type: Number,
        required: true
    },
})

const userModel = models.User || model<IUserModel>('User', userSchema)
export const UserModel: Model<IUserModel> = userModel
