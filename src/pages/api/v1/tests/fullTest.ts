import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<never, true, { id: string }> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET],

            requiredBodyProperties: [],
            requiredQueryProperties: ['id'],

            requiresAuthorization: true,
            requiresVerification: true,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 10,
                timeInterval: 30 * 1000,
                rateLimitInterval: 10 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: authorID } = this.authorization
        const { id: testID } = this.query.data

        const { test, internalError } = await TestService.getTest(testID)

        if (!internalError && !test) {
            return sendJSON({
                res: this.res,
                statusCode: 404,
                message: 'Test not found.',
                body: {}
            })
        }

        if (internalError) {
            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service error.',
                body: {}
            })
        }

        if (test?.author.id !== authorID) {
            return sendJSON({
                res: this.res,
                statusCode: 403,
                message: 'You don\'t have access to edit this test.',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 200,
            body: {
                test
            }
        })
    }
}

export default createHandler(new Handler())
