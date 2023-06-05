import { sendJSON } from '@/lib/json'
import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { UserRole } from '@/lib/classes/User'
import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<Record<'title' | 'description', string>, true, never> {
    constructor() {
        super({
            methods: [HTTPVerbs.PUT],

            requiredBodyProperties: ['title', 'description'],
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
        const { title, description } = this.body.data
        const { id: authorID } = this.authorization

        const { internalError, test } = await TestService.create({
            title: title.toString().trim(),
            description: description.toString().trim(),
            authorID
        })

        if (internalError) {
            return sendJSON({
                res: this.res,
                statusCode: 503,
                message: 'service unavailable',
                body: {}
            })
        }

        return sendJSON({
            res: this.res,
            statusCode: 201,
            body: {
                test
            }
        })
    }
}

export default createHandler(new Handler())
