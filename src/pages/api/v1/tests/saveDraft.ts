import { HTTPVerbs, RouteHandler, createHandler } from '@/lib/handlers/RouteHandler'
import { sendJSON } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { TestDraft } from '@/lib/classes/Test'

import { TestService } from '@/lib/services/test.service'

class Handler extends RouteHandler<TestDraft & { id: string }, true, never> {
    constructor() {
        super({
            methods: [HTTPVerbs.PATCH],

            requiredBodyProperties: ['id', 'description', 'questions', 'totalQuestions', 'subject', 'title'],
            requiredQueryProperties: [],

            requiresAuthorization: true,
            requiresVerification: true,
            requiredRole: UserRole.USER,

            rateLimit: {
                allowedRequestsAmount: 15,
                timeInterval: 30 * 1000,
                rateLimitInterval: 10 * 1000
            }
        })
    }

    async handle(): Promise<void> {
        const { id: authorID } = this.authorization

        const {
            id, title, description,
            questions, totalQuestions, subject,
            settings
        } = this.body.data

        const testResult = await TestService.getTest(id)

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

        for (const question of questions) {
            question.text = question.text.toString().trim()

            for (const answerIndex in question.answers) {
                question.answers[answerIndex] =
                    question.answers[answerIndex].toString().trim()
            }
        }

        const draftSaveResult = await TestService.saveDraft(id, {
            title: title.toString().trim(),
            description: description.toString().trim(),
            questions,
            totalQuestions,
            subject,
            settings
        })

        if (draftSaveResult.internalError) {
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
            message: 'Draft saved.',
            body: {}
        })
    }
}

export default createHandler(new Handler())
