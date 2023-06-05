import { sendJSON } from '@/lib/json'

import { TestModel } from '@/lib/models/Test.model'
import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { UserRole } from '@/lib/classes/User'

class Handler extends RouteHandler<never, false, never> {
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
                timeInterval: 300 * 1000,
                rateLimitInterval: 100 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        TestModel.deleteMany({}, err => {
            if (err) {
                console.error(err)
            } else {
                console.log('All test were cleared.')
            }
        })

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: 'Cleared tests successfully.',
            body: {}
        })
    }
}

export default createHandler(new Handler())
