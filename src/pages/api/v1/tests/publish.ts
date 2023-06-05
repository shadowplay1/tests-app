import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'

import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<{ id: string }, true, never> {
    constructor() {
        super({
            methods: [HTTPVerbs.PATCH],

            requiredBodyProperties: ['id'],
            requiredQueryProperties: [],

            requiresAuthorization: true,
            requiresVerification: true,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 5,
                timeInterval: 30 * 1000,
                rateLimitInterval: 10 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: authorID } = this.authorization
        const { id: testID } = this.body.data

        const testResult = await TestService.getTest(testID)

        if (testResult.internalError) {
            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service error.',
                body: {}
            })
        }


        if (!testResult.test && !testResult.internalError) {
            return sendJSON({
                res: this.res,
                statusCode: 404,
                message: 'Test not found.',
                body: {}
            })
        }

        if (testResult.test?.author.id !== authorID) {
            return sendJSON({
                res: this.res,
                statusCode: 403,
                message: 'You don\'t have access to edit this test.',
                body: {}
            })
        }

        const publishingResult = await TestService.publish(testID)

        if (publishingResult.internalError) {
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
            message: 'Test published.',
            body: {}
        })
    }
}

export default createHandler(new Handler())
