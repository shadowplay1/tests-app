import { sendJSON } from '@/lib/json'
import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { UserRole } from '@/lib/classes/User'

class Handler extends RouteHandler<
    Record<'newPassword' | 'passwordResetToken' | 'userAgent', string>,
    false,
    any
> {
    constructor() {
        super({
            methods: [HTTPVerbs.PATCH],

            requiredBodyProperties: ['newPassword', 'passwordResetToken', 'userAgent'],
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
        const { passwordResetToken, newPassword, userAgent } = this.body.data

        const { tokenInvalid, samePassword } = await AuthService.resetUserPassword(
            passwordResetToken as string,
            newPassword,
            this.ip,
            userAgent
        )

        if (tokenInvalid) {
            return sendJSON({
                res: this.res,
                statusCode: 400,
                message: 'Password reset token is either invalid or not provided.',
                body: {}
            })
        }

        if (samePassword) {
            return sendJSON({
                res: this.res,
                statusCode: 406,
                message: 'New password should be different from old password.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: 'Password changed!',
            body: {}
        })
    }
}

export default createHandler(new Handler())
