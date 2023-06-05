import mongoose, { connection } from 'mongoose'
import { DATABASE_CONNECTED_STATE } from './misc/constants'

const mongodbURI = process.env.MONGODB_URI as string

export async function databaseConnect(): Promise<void> {
    if (mongodbURI) {
        const [user, password] = mongodbURI.replace('mongodb://', '').split('@')[0].split(':')

        if (
            connection?.readyState !== undefined &&
            connection?.readyState !== DATABASE_CONNECTED_STATE
        ) {
            try {
                await mongoose.connect(mongodbURI as string, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,

                    auth: {
                        user,
                        password
                    }
                })

                console.log('Connected to MongoDB.')
            } catch (err) {
                console.error('Failed to connect to MongoDB:')
                console.error(err)
            }
        }
    }
}
