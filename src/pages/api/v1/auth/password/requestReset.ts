import { sendJSON } from '@/lib/json'
import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { UserRole } from '@/lib/classes/User'

class Handler extends RouteHandler<Record<'email' | 'locationOrigin', string>, false, never> {
    constructor() {
        super({
            methods: [HTTPVerbs.POST],

            requiredBodyProperties: ['email', 'locationOrigin'],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 15,
                timeInterval: 60 * 1000,
                rateLimitInterval: 1200 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { email, locationOrigin } = this.body.data

        const { passwordResetToken, requestAlreadySent } = await AuthService.requestPasswordReset({
            email,
            locationOrigin
        })

        if (!passwordResetToken) {
            return sendJSON({
                res: this.res,
                statusCode: 404,
                message: 'Cannot reset password for non-existing user.',
                body: {
                    token: null
                }
            })
        }

        if (requestAlreadySent) {
            return sendJSON({
                res: this.res,
                statusCode: 409,
                message: 'The user has already made a password reset request.',
                body: {
                    token: passwordResetToken
                }
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: 'Password reset token was generated successfully.',
            body: {
                token: passwordResetToken
            }
        })
    }
}

export default createHandler(new Handler())
