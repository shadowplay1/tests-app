import { sendJSON } from '@/lib/json'

import { User, UserRole } from '@/lib/classes/User'

import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'

import { Optional } from '@/lib/misc/utilityTypes'
import { handleError } from '@/utils/handleError.util'

import { IStringValidationOptions, validateEmail, validateString } from '@/lib/validators'


class Handler extends RouteHandler<
    Optional<
        Record<
            'email' | 'username' | 'password' | 'locationOrigin' | 'firstName' | 'lastName',
            string
        >,
        'firstName' | 'lastName'
    >,
    false,
    any
> {
    constructor() {
        super({
            methods: [HTTPVerbs.PUT],

            requiredBodyProperties: ['email', 'username', 'password', 'locationOrigin'],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 10,
                timeInterval: 120 * 1000,
                rateLimitInterval: 1800 * 1000
            },

            validateBodyProps({ email, username, password }) {
                const passwordValidationOptions: IStringValidationOptions = {
                    minLength: 6,
                    maxLength: 32
                }

                const usernameValidationOptions: IStringValidationOptions = {
                    minLength: 3,
                    maxLength: 32
                }

                const isEmailOk = validateEmail(email)
                const isPasswordOk = validateString(password, passwordValidationOptions)
                const isUsernameOk = validateString(username, usernameValidationOptions)

                if (!isEmailOk) {
                    return {
                        message: 'Incorrect email was specified.',
                        failed: 'email'
                    }
                }

                if (!isPasswordOk) {
                    return {
                        message: `Password length should be between ${passwordValidationOptions.minLength}` +
                            `and ${passwordValidationOptions.maxLength} in length.`,

                        failed: 'password'
                    }
                }

                if (!isUsernameOk) {
                    return {
                        message: `Username length should be between ${usernameValidationOptions.minLength}` +
                            `and ${usernameValidationOptions.maxLength} in length.`,

                        failed: 'username'
                    }
                }
            }
        })
    }

    async handle(): Promise<void> {
        const accountProps = this.body.data
        const { email } = accountProps

        const userResult = await handleError<User>(() => AuthService.getUser({ email }))

        if (userResult.error) {
            console.error(userResult.error)

            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service error.',
                body: {}
            })
        }

        const user = userResult.result

        if (user) {
            return sendJSON({
                res: this.res,
                statusCode: 409,
                message: 'User with that email already exists.',
                body: {}
            })
        }

        const newUser: Optional<User, 'password'> =
            await AuthService.register(accountProps)

        delete newUser.password

        return sendJSON({
            res: this.res,
            statusCode: 201,

            body: {
                user: newUser
            }
        })
    }
}

export default createHandler(new Handler())
