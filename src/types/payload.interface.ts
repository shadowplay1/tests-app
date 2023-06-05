import { User } from '../lib/classes/User'

export type IUserLoginPayload = Pick<
    User,
    'id' | 'username' | 'email' | 'role' | 'verified'
>
