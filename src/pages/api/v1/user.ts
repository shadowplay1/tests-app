import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { AuthService } from '@/lib/services/auth.service'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'

class Handler extends RouteHandler<never, false, Record<'email' | 'id', string>> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET],

            requiredBodyProperties: [],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            validateQuery({ email, id }) {
                if (!email && !id) {
                    return {
                        message: 'Either "email" or "id" search query params should be specified',
                        failed: 'any'
                    }
                }
            },

            rateLimit: {
                allowedRequestsAmount: 100,
                timeInterval: 3600 * 1000,
                rateLimitInterval: 1800 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const user = await AuthService.getUserWithoutPassword(this.query.data)

        if (!user) {
            return sendJSON({
                res: this.res,
                statusCode: 404,
                message: 'Specified user does not exist in database.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,

            body: {
                user
            }
        })
    }
}

export default createHandler(new Handler())
