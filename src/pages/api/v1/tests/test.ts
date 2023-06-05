import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<never, false, { id: string, getQuestions?: boolean }> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET, HTTPVerbs.DELETE],

            requiredBodyProperties: [],
            requiredQueryProperties: ['id'],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 20,
                timeInterval: 30 * 1000,
                rateLimitInterval: 30 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: testID, getQuestions } = this.query.data

        const testGettingResult = getQuestions
            ? await TestService.getTestWithoutCorrectAnswers(testID)
            : await TestService.getTestWithoutQuestions(testID)

        const { test, internalError } = testGettingResult

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

        if (this.req.method == HTTPVerbs.GET) {
            return sendJSON({
                res: this.res,
                statusCode: 200,
                body: {
                    test
                }
            })
        }

        if (this.req.method == HTTPVerbs.DELETE) {
            const deletingResult = await TestService.delete(testID)

            if (deletingResult.internalError) {
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
                message: 'Test deleted.',
                body: {
                    test
                }
            })
        }
    }
}

export default createHandler(new Handler())
