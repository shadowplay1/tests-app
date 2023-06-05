import { sendJSON } from '@/lib/json'
import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { UserRole } from '@/lib/classes/User'

class Handler extends RouteHandler<never, false, Record<'token', string>> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET],

            requiredBodyProperties: [],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 10,
                timeInterval: 100 * 1000,
                rateLimitInterval: 1200 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { token } = this.query.data

        const user = await AuthService.getUser({
            passwordResetToken: token
        })

        if (!user || !token) {
            return sendJSON({
                res: this.res,
                statusCode: 404,
                message: 'Password reset token is either invalid or not provided.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            body: {}
        })
    }
}

export default createHandler(new Handler())
