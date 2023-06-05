import { IUserModel } from '../models/User.model'

export class User {
    public id: string
    public username: string
    public firstName: string | null
    public lastName: string | null
    public email: string
    public password: string
    public role: UserRole
    public verified: boolean
    public verifyToken: string | null
    public passwordResetToken: string | null
    public createdAt: number

    constructor(user: IUserModel | RawUserData) {
        this.id = user.id
        this.username = user.username
        this.firstName = user.firstName
        this.lastName = user.lastName
        this.email = user.email
        this.password = user.password
        this.role = user.role
        this.verified = user.verified
        this.verifyToken = user.verifyToken
        this.passwordResetToken = user.passwordResetToken
        this.createdAt = user.createdAt
    }
}

export enum UserRole {
    USER = 0,
    TEACHER = 1,
    MODERATOR = 2,
    ADMIN = 3
}

export const userRoles = [
    'User', 'Teacher',
    'Moderator', 'Admin'
]

export const userRolesInRussian = [
    'Пользователь', 'Учитель',
    'Модератор', 'Админитратор'
]

export type RawUserData = Pick<
    User,
    'id' | 'username' | 'email' | 'password' | 'role' |
    'firstName' | 'lastName' | 'verified' | 'verifyToken' |
    'passwordResetToken' | 'createdAt'
>
