import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<
    {
        id: string,
        inputAnswers: (boolean | null)[][]
    },
    false,
    never
> {
    constructor() {
        super({
            methods: [HTTPVerbs.POST],

            requiredBodyProperties: ['id', 'inputAnswers'],
            requiredQueryProperties: [],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 20,
                timeInterval: 30 * 1000,
                rateLimitInterval: 10 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: testID, inputAnswers } = this.body.data

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

        const answersComparisonResult = await TestService.compareAnswers(testID, inputAnswers)

        if (answersComparisonResult.internalError) {
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
            body: {
                results: answersComparisonResult.results
            }
        })
    }
}

export default createHandler(new Handler())
