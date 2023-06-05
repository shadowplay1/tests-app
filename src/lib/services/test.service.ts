import { AuthService } from './auth.service'

import { generateSequence } from '@/utils/generateKey.util'
import { handleError } from '@/utils/handleError.util'

import { TestModel } from '@/lib/models/Test.model'

import { User } from '@/lib/classes/User'

import {
    ITest, QuestionType, Subjects,
    TestDraft, AnswersComparisonResult
} from '@/lib/classes/Test'

import { EmptyServiceResult, Optional, ServiceResult } from '../misc/utilityTypes'

export class TestService {

    /**
     * Creates a test in database.
     * @param initialTestOptions Initial test data to set.
     * @returns Service result.
     */
    static async create(initialTestOptions: InitialTestOptions): Promise<ServiceResult<{ test: ITest | null }>> {
        const serviceResult = await handleError<ServiceResult<{ test: ITest | null }>>(async () => {
            const { title, description, authorID } = initialTestOptions
            const author = await AuthService.getUserWithoutPassword({ id: authorID })

            if (!author) {
                return {
                    status: false,
                    internalError: false,
                    reason: 'author not found',
                    test: null
                }
            }

            const initialTest: ITest = {
                id: generateSequence(16, {
                    useLetters: true
                }),
                draft: null,
                title,
                description,
                subject: Subjects.ENGLISH,
                timeMinutes: 10,
                author,
                published: false,
                questions: [{
                    id: 1,
                    text: 'Текст вопроса',
                    type: QuestionType.SINGLE_CHOICE,
                    answers: ['Ответ 1', 'Ответ 2', 'Ответ 3', 'Ответ 4'],
                    correctAnswers: [0]
                }],
                totalQuestions: 1,
                userCompletions: [],
                createdAt: Date.now(),
                lastEditedAt: Date.now(),
                publishedAt: null,
            }

            await TestModel.create(initialTest)

            return {
                status: true,
                internalError: false,
                test: initialTest
            }
        })


        if (serviceResult.error) {
            console.log(serviceResult.error)

            return {
                status: false,
                internalError: true,
                reason: 'internal error',
                test: null
            }
        }

        return serviceResult.result
    }

    /**
     * Gets a test by its ID.
     * @param testID Test ID.
     * @returns Service result.
     */
    static async getTest(testID: string): Promise<ServiceResult<{ test: ITest | null }>> {
        const serviceResult = await handleError<ServiceResult<{ test: ITest | null }>>(async () => {
            const fullTest = await TestModel.findOne({ id: testID })

            if (!fullTest) {
                return {
                    status: false,
                    internalError: false,
                    test: null
                }
            }

            const test = fullTest as { author: Partial<User> }

            delete test.author.email
            delete test.author.password
            delete test.author.passwordResetToken
            delete test.author.verifyToken

            return {
                status: true,
                internalError: false,
                test: test as ITest
            }
        })

        if (serviceResult.error) {
            console.log(serviceResult.error)

            return {
                status: false,
                internalError: true,
                reason: 'internal error',
                test: null
            }
        }

        return serviceResult.result
    }

    /**
     * Gets a test by its ID without correct answers.
     * @param testID Test ID.
     * @returns Service result.
     */
    static async getTestWithoutCorrectAnswers(testID: string): Promise<
        ServiceResult<{ test: ITest<any, true> | null }>
    > {
        const testResult = await this.getTest(testID)

        if (!testResult.status) {
            return testResult as any
        }

        const test = testResult.test as any

        for (const question of test.questions) {
            delete question.correctAnswers
        }

        return {
            status: true,
            internalError: false,
            test
        }
    }

    /**
     * Gets a test by its ID without questions.
     * @param testID Test ID.
     * @returns Service result.
     */
    static async getTestWithoutQuestions(testID: string): Promise<
        ServiceResult<{ test: Omit<ITest, 'questions'> | null }>
    > {
        const testResult = await this.getTest(testID)

        if (!testResult.status) {
            return testResult
        }

        const test = testResult.test as Optional<ITest, 'questions'>
        delete test.questions

        return {
            status: true,
            internalError: false,
            test
        }
    }

    /**
     * Saves the changes made to the test in database.
     * @param testID Test ID.
     * @param testDraft Test draft object to save.
     * @returns Empty service result.
     */
    static async saveDraft(testID: string, testDraft: TestDraft): Promise<EmptyServiceResult> {
        const serviceResult = await handleError<EmptyServiceResult>(async () => {
            const testResult = await this.getTest(testID)

            if (!testResult.status) {
                return testResult
            }

            await TestModel.updateOne({
                id: testID
            }, {
                draft: testDraft,
                lastEditedAt: Date.now()
            })

            console.log('qs', testDraft.questions)

            return {
                status: true,
                internalError: false
            }
        })


        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error'
            }
        }

        return serviceResult.result
    }

    /**
     * Saves the changes from draft to the test object and clears the draft object.
     * @param testID Test ID.
     * @returns Empty service result.
     */
    static async publish(testID: string): Promise<EmptyServiceResult> {
        const serviceResult = await handleError<EmptyServiceResult>(async () => {
            const testResult = await this.getTest(testID)

            if (!testResult.status) {
                return testResult
            }

            const { published, publishedAt, draft } = testResult.test as ITest

            await TestModel.updateOne({
                id: testID
            }, {
                draft: null as any,
                published: true,
                publishedAt: published ? publishedAt as number : Date.now(),
                ...draft
            })

            return {
                status: true,
                internalError: false
            }
        })


        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error'
            }
        }

        return serviceResult.result
    }

    /**
     * Deletes the test from database.
     * @param testID Test ID.
     * @returns Empty service result.
     */
    static async delete(testID: string): Promise<EmptyServiceResult> {
        const serviceResult = await handleError<EmptyServiceResult>(async () => {
            const testResult = await this.getTest(testID)

            if (!testResult.status) {
                return testResult
            }

            await TestModel.deleteOne({
                id: testID
            })

            return {
                status: true,
                internalError: false
            }
        })


        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error'
            }
        }

        return serviceResult.result
    }


    /**
     * Fetches all published tests in database.
     * @returns Public tests array.
     */
    static async getAllPublic(): Promise<ServiceResult<{ tests: ITest[] }>> {
        const serviceResult = await handleError<ServiceResult<{ tests: ITest[] }>>(async () => {
            const publicTests = await TestModel.find({
                published: true
            })

            for (const publicTest of publicTests) {
                const test = publicTest as { author: Partial<User> }

                delete test.author.email
                delete test.author.password
                delete test.author.passwordResetToken
                delete test.author.verifyToken
            }

            return {
                status: true,
                internalError: false,
                tests: publicTests
            }
        })

        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error',
                tests: []
            }
        }

        return serviceResult.result
    }

    /**
     * Fetches all tests by specified user ID in database.
     * @returns Service result of tests array created by specified user.
     */
    static async getCreatedBy(userID: string): Promise<ServiceResult<{ tests: ITest[] }>> {
        const serviceResult = await handleError<ServiceResult<{ tests: ITest[] }>>(async () => {
            const allTests = await TestModel.find({})
            const filteredTests = allTests.filter(test => test.author.id == userID)

            for (const filteredTest of filteredTests) {
                const test = filteredTest as { author: Partial<User> }

                delete test.author.email
                delete test.author.password
                delete test.author.passwordResetToken
                delete test.author.verifyToken
            }

            return {
                status: true,
                internalError: false,
                tests: filteredTests
            }
        })

        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error',
                tests: []
            }
        }

        return serviceResult.result
    }

    /**
     * Compares the input answers for the specified question with the question's correct answers.
     * @returns Service result of answers comparison result.
     */
    static async compareAnswers(
        testID: string, inputAnswers: (boolean | null)[][]
    ): Promise<ServiceResult<{ results: AnswersComparisonResult }>> {
        const serviceResult = await handleError<ServiceResult<{ results: AnswersComparisonResult }>>(async () => {
            const { test, internalError } = await this.getTest(testID)

            if (internalError) {
                return {
                    status: false,
                    internalError: true,
                    reason: 'service error.',
                    results: {} as any
                }
            }

            const totalQuestions = test?.totalQuestions as number
            let correctAnswers = 0

            const correctAnswersIndexes: number[][] = []

            for (const question of test?.questions || []) {
                correctAnswersIndexes.push(question.correctAnswers)
            }

            const answers = inputAnswers.map(inputAnswer => {
                return inputAnswer.reduce<number[]>((acc, answer, index) => {
                    if (answer) {
                        acc.push(index)
                    }

                    return acc
                }, [])
            })

            for (const answerKey in answers) {
                const answer = answers[answerKey]

                const isAnswerCorrect = answer
                    .every(answerIndex => correctAnswersIndexes[answerKey].includes(answerIndex))

                if (isAnswerCorrect) {
                    correctAnswers += 1
                }
            }

            console.log({ inputAnswers, correctAnswersIndexes, answers })

            return {
                status: true,
                internalError: false,

                results: {
                    correctAnswers,
                    incorrectAnswers: totalQuestions - correctAnswers,
                    correctAnswersPercentage: (correctAnswers / totalQuestions) * 100,
                    incorrectAnswersPercentage: ((totalQuestions - correctAnswers) / totalQuestions) * 100
                }
            }
        })

        if (serviceResult.error) {
            return {
                status: false,
                internalError: true,
                reason: 'internal error',
                results: {} as any
            }
        }

        return serviceResult.result
    }
}

type InitialTestOptions = Pick<
    ITest,
    'title' | 'description'
> & { authorID: string }
