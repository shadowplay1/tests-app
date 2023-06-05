import { sendJSON } from '@/lib/json'

import { UserModel } from '@/lib/models/User.model'
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
        UserModel.deleteMany({}, err => {
            if (err) {
                console.error(err)
            } else {
                console.log('All users were cleared.')
            }
        })

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: 'Cleared users successfully.',
            body: {}
        })
    }
}

export default createHandler(new Handler())
