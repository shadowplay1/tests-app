import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { IStringValidationOptions, validateEmail, validateString } from '@/lib/validators'

class Handler extends RouteHandler<
    Record<'email' | 'password', string> & {
        rememberMe: boolean
    },
    false,
    any
> {
    constructor() {
        super({
            methods: [HTTPVerbs.POST],

            requiredBodyProperties: ['email', 'password', 'rememberMe'],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 10,
                timeInterval: 300 * 1000,
                rateLimitInterval: 100 * 1000
            },

            validateBodyProps({ email, password }) {
                const passwordValidationOptions: IStringValidationOptions = {
                    minLength: 6,
                    maxLength: 32
                }

                const isEmailOk = validateEmail(email)
                const isPasswordOk = validateString(password, passwordValidationOptions)

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
            }
        })
    }

    async handle(): Promise<void> {
        const { email, password, rememberMe } = this.body.data
        const loginResult = await AuthService.login(email, password, rememberMe)

        if (loginResult.errored) {
            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service error.',
                body: {}
            })
        }

        if (!loginResult.status && !loginResult.errored) {
            return sendJSON({
                res: this.res,
                statusCode: 403,
                message: 'Invalid username or password.',
                body: {}
            })
        }

        if (!loginResult.payload?.verified) {
            return sendJSON({
                res: this.res,
                statusCode: 406,
                message: 'Account must be verified to perform the login.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: `Logged in as "${email}".`,
            body: {
                accessToken: loginResult.token,
                payload: loginResult.payload
            }
        })
    }
}

export default createHandler(new Handler())
