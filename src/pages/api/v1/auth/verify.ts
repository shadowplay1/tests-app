import { sendJSON } from '@/lib/json'
import { UserRole } from '@/lib/classes/User'

import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'

import { handleError } from '@/utils/handleError.util'
import { verifyToken } from '@/lib/auth'

import { IUserLoginPayload } from '@/types/payload.interface'

class Handler extends RouteHandler<never, false, Record<'token', string>> {
    constructor() {
        super({
            methods: [HTTPVerbs.GET],

            requiredBodyProperties: [],
            requiredQueryProperties: ['token'],

            requiresAuthorization: false,
            requiresVerification: false,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 20,
                timeInterval: 300 * 1000,
                rateLimitInterval: 30 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { token } = this.query.data

        const tokenVerifyingResult = await handleError<IUserLoginPayload>(
            () => verifyToken(token)
        )

        const payload = tokenVerifyingResult.result
        const isVerified = !!payload

        return sendJSON({
            res: this.res,
            statusCode: 200,
            message: `Specified token is ${isVerified ? 'valid' : 'invalid'}.`,
            body: {
                verified: isVerified,
                payload
            }
        })
    }
}

export default createHandler(new Handler())
