import bcrypt from 'bcryptjs'
import { FilterQuery } from 'mongoose'

import { IUserModel, UserModel } from '../models/User.model'

import { User, UserRole } from '../classes/User'
import { IUserLoginPayload } from '../../types/payload.interface'

import { generateSequence } from '@/utils/generateKey.util'
import { generateToken } from '../auth'

import { MailerService } from './mailer.service'
import { Optional } from '../misc/utilityTypes'

const mailer = new MailerService()


export class AuthService {

    /**
     * Creates a User instance in database.
     * @param email User email.
     * @param password User password.
     * @returns User instance.
     */
    static async register({
        email, password, username,
        firstName, lastName,
        locationOrigin
    }: AccountRegisterOptions): Promise<User> {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(`${password}`, salt)

        const userID = generateSequence(24, {
            useLetters: true
        })

        const verifyToken = await this.generateVerifyToken(email)

        const user = await UserModel.create({
            id: userID,
            username,
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            password: hashedPassword,
            role: UserRole.USER,
            verified: false,
            verifyToken,
            passwordResetToken: null,
            createdAt: Date.now()
        })

        mailer.send(email, {
            subject: `Активация аккаунта ${username} [${email}]`,
            text: 'Для подтверждения аккаунта следуйте инструкциям в письме.',
            html: `<h1>Активация аккаунта</h1><br>
                <p>Вы указали данный адрес электронной почты при регистрации аккаунта ` +
                `<b>${username} [${email}]</b> на сайте <a href="${locationOrigin}">${locationOrigin}</a>.</p><br><br>

                <p>Чтобы активировать ваш аккаунт, перейдите по ссылке ниже:</p><br>

                <b><a href="${locationOrigin}/verifyEmail?token=${verifyToken}">
                    ${locationOrigin}/verifyEmail?token=${verifyToken}
                </a></b><br><br>

                <footer style="font-size: 8px">
                    Если вы не регистрировали аккаунт на данном сайте, то просто проигнорируйте это письмо.
                </footer>`,
        })

        user.save()
        return new User(user)
    }

    /**
     * Searches for user by specified username, checks the password and generates the access token.
     * @param email User email.
     * @param password User password.
     * @returns Login result object.
     */
    static async login(email: string, password: string, rememberMe: boolean): Promise<ILoginResult> {
        try {
            const user = await this.getUser({ email }) as User
            const hashedPassword = user?.password as string

            const isPasswordCorrect = await bcrypt.compare(`${password}`, hashedPassword || '')

            if (!user || !isPasswordCorrect) {
                return {
                    status: false,
                    errored: false,
                    token: null,
                    payload: null
                }
            }

            const payload: IUserLoginPayload = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                verified: user.verified
            }

            const token = generateToken(payload, rememberMe)

            return {
                status: true,
                errored: false,
                token,
                payload
            }
        } catch (err) {
            console.error(err)

            return {
                status: false,
                errored: true,
                token: null,
                payload: null
            }
        }
    }

    /**
     * Gets the user by email.
     * @param email Email to search for.
     * @returns User object.
     */
    static async getUser(userOptions: FilterQuery<IUserModel>): Promise<User | null> {
        const userDocument = await UserModel.findOne(userOptions) as IUserModel

        if (!userDocument) {
            return null
        }

        const user = new User(userDocument)
        return user
    }

    /**
     * Gets the user by email with removed 'password' property.
     * @param email Email to search for.
     * @returns User object.
     */
    static async getUserWithoutPassword(userOptions: FilterQuery<IUserModel>): Promise<Omit<User, 'password'> | null> {
        const user: Optional<User, 'password'> = (await this.getUser(userOptions)) as User

        if (!user) {
            return null
        }

        delete user.password
        return user as Omit<User, 'password'>
    }

    /**
     * Generates a verify token for the user and sets it in database.
     * @returns Generated verify token.
     */
    static async generateVerifyToken(email: string): Promise<string> {
        const verifyToken = generateSequence(64, {
            useLetters: true
        })

        await UserModel.updateOne({
            email
        }, {
            verifyToken
        })

        return verifyToken
    }

    /**
     * Generates a password reset token for the user and sets it in database.
     * @returns Generated password reset token.
     */
    static async generatePasswordResetToken(email: string): Promise<string | null> {
        const user = await UserModel.findOne({
            email
        })

        const passwordResetToken = generateSequence(64, {
            useLetters: true
        })

        if (!user) {
            return null
        }

        if (user.passwordResetToken) {
            return user.passwordResetToken
        }

        await user.updateOne({
            passwordResetToken
        })

        return passwordResetToken
    }

    /**
     * Resets the user password by password reset token.
     * @param passwordResetToken Password reset token.
     * @param newPassword New password to change to.
     * @param ip IP address that reset the password.
     * @returns Whether the password reset was successful.
     */
    static async resetUserPassword(
        passwordResetToken: string,
        newPassword: string,
        ip: string,
        userAgent: string
    ): Promise<{
        status: boolean
        tokenInvalid: boolean
        samePassword: boolean
    }> {
        const passwordResetRequester = await UserModel.findOne({
            passwordResetToken
        })

        const salt = await bcrypt.genSalt(10)
        const newHashedPassword = await bcrypt.hash(`${newPassword}`, salt)

        if (passwordResetRequester) {
            const { username, email } = passwordResetRequester

            if (passwordResetRequester.password == newHashedPassword) {
                return {
                    status: false,
                    tokenInvalid: false,
                    samePassword: true
                }
            }

            await passwordResetRequester.updateOne({
                password: newHashedPassword,
                passwordResetToken: null
            })

            mailer.send(email, {
                subject: `Сброс пароля аккаунта ${username} [${email}]`,
                text: 'Уведомление о сбросе пароля аккаунта.',
                html: `<h1>Пароль изменён</h1><br>
                    <p>Хотим вам сообщить, что пароль от аккаунта <b>${username} [${email}]</b> ` +
                    `был <b>сброшен</b>.</p><br><br>


                    <p>
                        IP: <b>${ip}</b><br><br>
                        User Agent: <b>${userAgent}</b>
                    </p><br><br>

                    <p>
                        Теперь вы можете использовать новый пароль для входа в систему.
                    </p><br><br>

                    <footer style="font-size: 8px">
                        Это письмо было отправлено автоматически. На него отвечать не нужно.
                    </footer>`,
            })

            return {
                status: true,
                tokenInvalid: false,
                samePassword: false,
            }
        }

        return {
            status: false,
            tokenInvalid: true,
            samePassword: false
        }
    }

    /**
     * Verified the user by verifiation token.
     * @param verifyToken Verifiation token.
     * @param locationOrigin Location origin.
     * @returns Whether the verification was successful.
     */
    static async verifyUser(verifyToken: string, locationOrigin: string): Promise<boolean> {
        const verifyUserDocument = await UserModel.findOne({ verifyToken })

        if (verifyUserDocument) {
            await verifyUserDocument.updateOne({
                verified: true,
                verifyToken: null
            })

            const { username, email } = verifyUserDocument || {}

            mailer.send(email as string, {
                subject: `Аккаунт ${username} [${email}] активирован!`,
                text: 'Уведомление об успешной активации аккаунта.',
                html: `<h1>Аккаунт активирован!</h1><br>
                    <p>Спасибо за активацию вашего аккаунта <b>${username} [${email}]</b> ` +
                    `на сайте <b>${locationOrigin}</b>.</p><br><br>

                    <p>
                        Теперь вы можете <a href="${locationOrigin}/login">выполнить вход</a> и пользоваться
                        всеми сервисами нашей платформы.
                    </p><br><br>

                    <footer style="font-size: 8px">
                        Это письмо было отправлено автоматически. На него отвечать не нужно.
                    </footer>`,
            })

            return true
        }

        return false
    }

    /**
     * Sends an email to a specified user.
     * @param receiverEmail Email to send the message to.
     * @param contentOptions Email data.
     * @returns Password request status. False returned if the user already requested a password reset.
     */
    static async requestPasswordReset({
        email, locationOrigin
    }: Omit<AccountRegisterOptions, 'password' | 'username'>): Promise<{
        status: boolean
        passwordResetToken: string | null
        requestAlreadySent: boolean | null
    }> {
        const userToResetPassword = await UserModel.findOne({ email }) as IUserModel

        if (!userToResetPassword) {
            return {
                status: false,
                passwordResetToken: null,
                requestAlreadySent: false
            }
        }

        if (userToResetPassword.passwordResetToken) {
            return {
                status: false,
                passwordResetToken: userToResetPassword.passwordResetToken,
                requestAlreadySent: true
            }
        }

        const passwordResetToken = await this.generatePasswordResetToken(email)

        mailer.send(email, {
            subject: `Сброс пароля аккаунта ${userToResetPassword?.username} [${email}]`,
            text: 'Для сброса пароля аккаунта следуйте инструкциям в письме.',
            html: `<h1>Сброс пароля аккаунта</h1><br>
                <p>Вы указали данный адрес электронной почты для сброса пароля аккаунта ` +
                `<b>${userToResetPassword?.username} [${email}]</b> ` +
                `на сайте <a href="${locationOrigin}">${locationOrigin}</a>.</p><br><br>

                <p>Чтобы начать процедуру сброса пароля, перейдите по ссылке ниже:</p><br>

                <b><a href="${locationOrigin}/resetPassword?token=${passwordResetToken}">
                    ${locationOrigin}/resetPassword?token=${passwordResetToken}
                </a></b><br><br>

                <footer style="font-size: 8px">
                    Если вы не запрашивали сброс пароля аккаунта на данном сайте, то просто проигнорируйте это письмо.
                </footer>`,
        })

        return {
            status: true,
            passwordResetToken,
            requestAlreadySent: false
        }
    }
}

export interface ILoginResult {

    /**
     * Whether the login was successful.
     */
    status: boolean

    /**
     * Whether the login errored.
     */
    errored: boolean

    /**
     * User's JWT token.
     */
    token: string | null

    /**
     * User access token payload.
     */
    payload: IUserLoginPayload | null
}

export type AccountRegisterOptions = Optional<
    Pick<
        IUserModel,
        'email' | 'username' | 'password' | 'firstName' | 'lastName'
    >,
    'firstName' | 'lastName'
> & {
    locationOrigin: string
}
