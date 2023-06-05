import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'

import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<never, true, never> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET],

            requiredBodyProperties: [],
            requiredQueryProperties: [],

            requiresAuthorization: true,
            requiresVerification: true,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 10,
                timeInterval: 30 * 1000,
                rateLimitInterval: 15 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: authorID } = this.authorization
        const { internalError, tests } = await TestService.getCreatedBy(authorID)

        if (internalError) {
            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service error.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: `Found ${tests.length} entries.`,
            body: {
                tests
            }
        })
    }
}

export default createHandler(new Handler())
