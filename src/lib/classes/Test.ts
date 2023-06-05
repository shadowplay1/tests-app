import { If } from '../misc/utilityTypes'
import { User } from './User'

export class Test<Answer = number> implements ITest<Answer> {
    public rawTest: ITest<Answer>

    public id: string // string id
    public draft: TestDraft | null
    public title: string
    public description: string
    public subject: Subjects
    public timeMinutes: number
    public author: Omit<User, 'password' | 'email' | 'passwordResetToken' | 'verifyToken'>
    public published: boolean
    public questions: IQuestion<Answer>[]
    public totalQuestions: number
    public userCompletions: IUserCompletion[]
    public createdAt: number
    public lastEditedAt: number
    public publishedAt: number | null
    public settings?: TestSettings

    constructor(rawTest: ITest<Answer>) {
        this.rawTest = rawTest

        this.id = rawTest.id
        this.draft = (rawTest.draft || {}) as any
        this.title = rawTest.title
        this.description = rawTest.description
        this.subject = rawTest.subject
        this.timeMinutes = rawTest.timeMinutes
        this.author = rawTest.author
        this.published = rawTest.published
        this.questions = rawTest.questions
        this.totalQuestions = rawTest.totalQuestions
        this.createdAt = rawTest.createdAt
        this.lastEditedAt = rawTest.lastEditedAt
        this.publishedAt = rawTest.publishedAt
        this.userCompletions = rawTest.userCompletions
        this.settings = rawTest.settings
    }
}

export class Question<Answer = number> implements IQuestion<Answer> {
    public id: number // numeric id
    public text: string
    public type: QuestionType
    public answers: string[]
    public correctAnswers: Answer[]
    public rawQuestion: IQuestion<Answer>

    constructor(rawQuestion: IQuestion<Answer>) {
        this.rawQuestion = rawQuestion
        this.id = rawQuestion.id
        this.text = rawQuestion.text
        this.type = rawQuestion.type
        this.answers = rawQuestion.answers
        this.correctAnswers = rawQuestion.correctAnswers
    }
}


export interface ITest<Answer = number, OmitCorrectAnswers extends boolean = false> {
    id: string // random string id
    draft: TestDraft | null
    title: string
    description: string
    subject: Subjects
    timeMinutes: number
    published: boolean
    author: Omit<User, 'password' | 'email' | 'passwordResetToken' | 'verifyToken'>
    questions: If<
        OmitCorrectAnswers,
        Omit<IQuestion<Answer>, 'correctAnswers'>,
        IQuestion<Answer>
    >[]
    totalQuestions: number
    createdAt: number
    userCompletions: IUserCompletion[]
    lastEditedAt: number
    publishedAt: number | null
    settings?: TestSettings
}

export interface IQuestion<Answer = number> {
    id: number // numeric id
    text: string
    type: QuestionType
    answers: string[]
    correctAnswers: Answer[]
}

export interface IUserCompletion {
    username: string
    attempts: ITestAttempt[]
}

export interface ITestAttempt {

    /**
     * Whether the user finished completing the test.
     */
    finished: boolean

    /**
     * Timestamp of when the user started completing the test.
     */
    startedAt: number

    /**
     * Timestamp of when the user finished completing the test.
     */
    finishedAt: number

    /**
     * How much time taken to complete the test (in seconds).
     */
    timeTaken: number

    /**
     * Number of answered questions.
     */
    answered: number

    /**
     * Test completion results.
     */
    results: AnswersComparisonResult | null
}

export type AnswersComparisonResult = Record<
    'correctAnswers' | 'incorrectAnswers' |
    'correctAnswersPercentage' | 'incorrectAnswersPercentage',
    number
>

export type TestDraft = Pick<
    ITest,
    'title' | 'description' | 'subject' |
    'questions' | 'totalQuestions' | 'settings'
>

export type TestSettings = Record<
    'displayAnswers' | 'displayCorrectAnswers' | 'randomizeQuestion' |
    'randomizeAnswers' | 'singleAttempt' | 'requireLogin',
    boolean
>

export enum QuestionType {
    SINGLE_CHOICE = 0,
    MULTIPLE_CHOICE = 1,
    // TEXT = 2,
    // ORDER = 3,
    // MATCH = 4
}

export enum TestEndingReason {
    NONE = 0,
    COMPLETED = 1,
    EXITED = 2,
    TIMEOUT = 3
}

export enum Subjects {
    ENGLISH = 0,
    ALGEBRA = 1,
    BIOLOGY = 2,
    GEOMETRY = 3,
    GEOGRAPHY = 4,
    HISTORY = 5,
    INFORMATICS = 6,
    MATHS = 7,
    SOCIALS = 8,
    RUSSIAN = 9,
    PHYSICS = 10,
    CHEMISTRY = 11,
    OTHER = 12
}
