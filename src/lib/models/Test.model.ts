import { Document, Model, Schema, model, models } from 'mongoose'

import { IQuestion, IUserCompletion, Subjects, TestDraft } from '../classes/Test'
import { User } from '../classes/User'

export interface ITestModel extends Document {
    id: string
    draft: TestDraft
    title: string
    description: string
    subject: Subjects
    timeMinutes: number
    published: boolean
    author: Omit<User, 'password'>
    questions: IQuestion[]
    totalQuestions: number
    userCompletions: IUserCompletion[]
    createdAt: number
    lastEditedAt: number
    publishedAt: number
}

const testSchema = new Schema<ITestModel>({
    id: {
        type: String,
        required: true
    },

    draft: {
        type: Schema.Types.Mixed,
        required: false
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    timeMinutes: {
        type: Number,
        required: true
    },

    subject: {
        type: Number,
        required: true
    },


    published: {
        type: Boolean,
        required: true
    },

    author: {
        type: Schema.Types.Mixed,
        required: true
    },

    questions: {
        type: Schema.Types.Mixed,
        required: true
    },

    totalQuestions: {
        type: Number,
        required: true
    },

    userCompletions: {
        type: Schema.Types.Mixed,
        required: true
    },

    createdAt: {
        type: Number,
        required: true
    },

    lastEditedAt: {
        type: Number,
        required: true
    },

    publishedAt: {
        type: Number,
        required: false
    }
})

const testsModel = models.Test || model<ITestModel>('Test', testSchema)
export const TestModel: Model<ITestModel> = testsModel
