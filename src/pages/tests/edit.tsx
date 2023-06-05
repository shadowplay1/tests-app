import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { Fragment, useEffect, useRef, useState } from 'react'

import nProgress from 'nprogress'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

import Dialog from '@/components/Dialog'
import Authenticated from '@/components/Authenticated'
import DropdownList from '@/components/DropdownList'

import { IQuestion, ITest, QuestionType, TestDraft } from '@/lib/classes/Test'

import { DialogType, IDialogInput } from '@/types/dialog.interface'
import { UserRole } from '@/lib/classes/User'

import { toStartLowerCase, toStartUpperCase } from '@/utils/strings.util'
import { IResponceBody } from '@/lib/json'

import { subjectsStrings as subjects } from '@/lib/misc/constants'

import style from '@/styles/Library.module.css'
import editorStyle from '@/styles/Editor.module.css'

const styles = {
    ...style, ...editorStyle
} as Record<
    'container' | 'main' | 'button' | 'question' |
    'questions' | 'question-text' | 'answers' |
    'correct-answer' | 'answer-option' | 'answer-text' |
    'list-multiple-choice' | 'question-settings' | 'question-setting' |
    'editor-answers' | 'editor-single-choice' | 'save-buttons' |
    'save-button' | 'question-text-input' | 'question-editor' |
    'test-info' | 'test-info-entry' | 'editor-question-text' |
    'questions-title-text',
    string
>

const Page: NextPage = (): JSX.Element => {
    const router = useRouter()

    const questionTypes = {
        [QuestionType.SINGLE_CHOICE]: 'Единственный выбор',
        [QuestionType.MULTIPLE_CHOICE]: 'Множественный выбор'
    }

    const states: { [key: string]: string } = {
        published: 'Опубликован',
        unpublished: 'Не опубликован',
        edited: 'Изменён',
        updated: 'Обновлён',
        created: 'Создан'
    }


    const fullInfoKeyStrings = {
        title: 'название теста',
        description: 'описание теста',
        subject: 'предмет',
        timeMinutes: 'время выполнения теста (в минутах)',
    }

    const breakNewLines = (input: string): JSX.Element[] => {
        const inputLines = input.split('\n')

        const inputWithLineBreaks = inputLines.length > 1 ? inputLines
            .map((line, index) =>
                <Fragment key={index}>
                    {line}
                    <br />
                </Fragment>
            ) : [<>{input}</>]

        return inputWithLineBreaks
    }

    const parseMarkdownString = (input: string): string => {
        const boldRegex = /\*\*(.*?)\*\*/g
        const italicRegex = /\*(.*?)\*/g
        const underlineRegex = /__(.*?)__/g

        const result = input
            .replaceAll(boldRegex, '<b>$1</b>')
            .replaceAll(italicRegex, '<i>$1</i>')
            .replaceAll(underlineRegex, '<u>$1</u>')

        return result
    }

    const parseMarkdown = (input: JSX.Element[]): JSX.Element => {
        const joinedString = input.map(element => element.props.children).join('')
        const result = parseMarkdownString(joinedString)

        return <a dangerouslySetInnerHTML={{ __html: result }} />
    }

    const [test, setTest] = useState<ITest>({} as any)
    const [loadingMessage, setLoadingMessage] = useState<string>('Загружаем тест...')

    const [testState, setTestState] = useState<Exclude<TestState, 'published' | 'unpublished'> | null>('created')

    const [testPublishedState, setTestPublishedState] =
        useState<Exclude<TestState, 'created' | 'updated' | 'edited'>>('unpublished')

    const [loadingErrorMessage, setLoadingErrorMessage] = useState<string>('')
    const [inputErrorMessage, setInputErrorMessage] = useState<string>('')

    const [questions, setQuestions] = useState<IQuestion[]>([])
    const [displayQuestions, setDisplayQuestions] = useState<IQuestion[]>([])

    const [editorSelectedQuestionType, setEditorSelectedQuestionType] = useState<QuestionType | null>(null)
    const [editorQuestionType, setEditorQuestionType] = useState<QuestionType | null>(null)

    const [selectedInfoKey, setSelectedInfoKey] = useState<EditableInfoKeys>('' as EditableInfoKeys)
    const [editedTestInfoValue, setEditedTestInfoValue] = useState<string>('')

    const [isTestInfoEditingDialogOpened, setIsTestInfoEditingDialogOpened] = useState<boolean>(false)

    const [isPublishConfirmationDialogOpened, setIsPublishConfirmationDialogOpened] = useState<boolean>(false)

    const [isPublishSuccessfulDialogOpened, setIsPublishSuccessfulDialogOpened] = useState<boolean>(false)
    const [isDeleteConfirmationDialogOpened, setIsDeleteConfirmationDialogOpened] = useState<boolean>(false)

    const [textEditDialogOpened, setTextEditDialogOpened] = useState<boolean>(false)
    const [answerTextEditDialogOpened, setAnswerTextEditDialogOpened] = useState<boolean>(false)

    const [editingQuestionText, setEditingQuestionText] = useState<string>('')
    const [questionText, setQuestionText] = useState<string>('')

    const [editingAnswerText, setEditingAnswerText] = useState<string>('')
    const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null)

    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)

    const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null)
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)

    const [selectedCheckboxes, setSelectedCheckboxes] = useState<boolean[]>(Array(4).fill(false))
    const [selectedOption, setSingleChoiceSelectedOption] = useState<number | null>(null)

    const [isQuestionTypeEditing, setIsQuestionTypeEditing] = useState<boolean | null>(false)
    const [changesMade, setChangesMade] = useState<boolean>(false)

    const isQuestionFetchingStarted = useRef<boolean>(false)
    const isDraftSavingStarted = useRef<boolean>(false)

    const fetchQuestions = async (): Promise<void> => {
        if (typeof window !== 'undefined') {
            (async (): Promise<any> => {
                const testID = new URLSearchParams(location.search).get('id')
                const accessToken = localStorage.getItem('accessToken')

                const responce = await fetch(`/api/v1/tests/fullTest?id=${testID}`, {
                    method: 'GET',
                    headers: new URLSearchParams({
                        authorization: accessToken as string
                    })
                })

                if (!responce.ok) {
                    switch (responce.status) {
                        case 404: {
                            return setLoadingErrorMessage('Тест не найден.')
                        }

                        case 403: {
                            return setLoadingErrorMessage('У вас нет прав на редактирование этого теста.')
                        }

                        case 429: {
                            return setLoadingErrorMessage('Вы отправляете слишком много запросов.')
                        }

                        case 503: {
                            return setLoadingErrorMessage('Сервис управления тестами недоступен.')
                        }

                        default: {
                            return setLoadingErrorMessage('Не удалось получить информацию о тесте.')
                        }
                    }
                }

                const result: IResponceBody<{ test: ITest }> = await responce.json()
                const { test } = result.data

                setTestPublishedState(test.published ? 'published' : 'unpublished')

                if (test.draft) {
                    for (const key in test.draft) {
                        (test as any)[key] = (test.draft as any)[key]
                    }

                    setChangesMade(true)
                    setTestState('edited')
                } else {
                    setTestState(test.published ? 'updated' : 'created')
                }


                setTest(test)

                setQuestions([...test.questions])
                setDisplayQuestions([...test.questions])

                setLoadingMessage('')
            })()
        }
    }

    useEffect(() => {
        if (!isQuestionFetchingStarted.current) {
            isQuestionFetchingStarted.current = true
            fetchQuestions()
        }
    })

    const openEditDialog = (question: IQuestion, questionIndex: number): void => {
        setSelectedQuestion(question)
        setSelectedQuestionIndex(questionIndex)

        setDisplayQuestions(structuredClone(questions))

        setEditDialogOpen(true)
        setSingleChoiceSelectedOption(question.correctAnswers[0])

        setSelectedCheckboxes(
            question.answers
                .map((_, answerIndex) =>
                    question.correctAnswers.includes(answerIndex)
                )
        )
    }

    const openDeleteDialog = (question: IQuestion, questionIndex: number): void => {
        setSelectedQuestion(question)
        setSelectedQuestionIndex(questionIndex)

        setIsDeleteConfirmationDialogOpened(true)
    }

    const handleQuestionEditDialogClose = (confirmed: boolean): any => {
        if (confirmed) {
            if (!editingQuestionText) {
                setInputErrorMessage('Для сохранения необходимо указать текст вопроса.')
                return false
            }

            if (editingQuestionText.length > 400) {
                setInputErrorMessage('Длина вопроса не должна превышать 400 символов.')
                return false
            }

            if (editingQuestionText.split('\n').length > 5) {
                setInputErrorMessage('Вопрос не должен быть больше 5 строк.')
                return false
            }

            setTextEditDialogOpened(false)
            setQuestionText(editingQuestionText)

            setQuestions(prevQuestions => {
                const updatedQuestions = [...prevQuestions]
                updatedQuestions[selectedQuestionIndex as number].text = editingQuestionText

                return updatedQuestions
            })
        } else {
            setEditingQuestionText(selectedQuestion?.text as string)
            setTextEditDialogOpened(false)
        }
    }

    const handleEditDialogClose = (confirmed: boolean, dialogUserInput: IDialogInput): any => {
        const selectedCheckboxes = dialogUserInput.checkboxes?.map(x => x.checked)

        setQuestionText('')

        if (confirmed) {
            if (isQuestionTypeEditing) {
                setInputErrorMessage('Вы не сохранили тип вопроса.')
                return false
            }

            if (!dialogUserInput.selects?.length && !selectedCheckboxes?.some(checkbox => checkbox)) {
                setInputErrorMessage('Вопрос не может быть сохранён без правильных ответов.')
                return false
            }

            nProgress.start()

            setQuestions(prevQuestions => {
                const updatedQuestions = [...prevQuestions]

                if (dialogUserInput.selects?.length) {
                    updatedQuestions[selectedQuestionIndex as number].correctAnswers =
                        [dialogUserInput.selects?.[0].selected]
                } else {
                    updatedQuestions[selectedQuestionIndex as number].correctAnswers =
                        selectedCheckboxes
                            ?.map((checkboxChecked, checkboxCheckedIndex) => {
                                if (checkboxChecked) {
                                    return checkboxCheckedIndex
                                }
                            })
                            ?.filter(checkbox => checkbox !== undefined) as number[]
                }

                setTest(prevTest => {
                    const updatedTest = { ...prevTest }

                    updatedTest.questions = updatedQuestions
                    updatedTest.totalQuestions = updatedQuestions.length

                    updatedTest.lastEditedAt = Date.now()

                    if (typeof window !== 'undefined' && !isDraftSavingStarted.current) {
                        saveDraft(updatedTest).then(() => {
                            isDraftSavingStarted.current = false
                            handleEditDialogCancel()

                            nProgress.done()
                        })
                    }

                    return updatedTest
                })

                setDisplayQuestions(structuredClone(updatedQuestions))
                return updatedQuestions
            })
        } else {
            handleEditDialogCancel()
            setQuestions(displayQuestions)

            if (displayQuestions[selectedQuestionIndex as number]) {
                setEditingQuestionText(displayQuestions[selectedQuestionIndex as number].text)

                setQuestions(prevQuestions => {
                    const updatedQuestions = [...prevQuestions]

                    updatedQuestions[selectedQuestionIndex as number].text =
                        displayQuestions[selectedQuestionIndex as number].text

                    setDisplayQuestions(structuredClone(updatedQuestions))

                    return updatedQuestions
                })
            }

            setSelectedQuestionIndex(null)
        }
    }

    const handleTestInfoChange = (confirmed: boolean): any => {
        if (confirmed) {
            if (
                editedTestInfoValue == null ||
                editedTestInfoValue == undefined ||
                (editedTestInfoValue as any) == -1
            ) {
                setInputErrorMessage(`Для сохранения необходимо указать ${fullInfoKeyStrings[selectedInfoKey]}.`)
                return false
            }

            nProgress.start()
            setIsTestInfoEditingDialogOpened(false)

            setTest(prevTest => {
                const updatedTest = { ...prevTest } as any

                updatedTest[selectedInfoKey] = editedTestInfoValue
                updatedTest.lastEditedAt = Date.now()

                if (!isDraftSavingStarted.current) {
                    saveDraft(updatedTest).then(() => {
                        isDraftSavingStarted.current = false
                        handleEditDialogCancel()

                        nProgress.done()
                    })
                }

                return updatedTest
            })

            setEditedTestInfoValue('')
            setSelectedInfoKey('' as any)

            nProgress.done()
        } else {
            setIsTestInfoEditingDialogOpened(false)
        }
    }

    const handleEditDialogCancel = (): void => {
        setEditDialogOpen(false)
        setSelectedQuestion(null)
        setSelectedQuestionIndex(null)
        setQuestionText('')
        setSingleChoiceSelectedOption(null)
    }

    const handlePublishButtonClicked = (): void => {
        if (!changesMade) {
            return setInputErrorMessage('Вы не сделали ни одного изменения в тесте.')
        }

        if (!displayQuestions.length) {
            return setInputErrorMessage('Тест не может быть опубликован без вопросов.')
        }

        setIsPublishConfirmationDialogOpened(true)
    }

    const publish = async (): Promise<any> => {
        nProgress.start()

        setChangesMade(false)
        setLoadingMessage('Публикуем тест...')

        if (typeof window !== 'undefined') {
            const testID = new URLSearchParams(location.search).get('id')
            const accessToken = localStorage.getItem('accessToken')

            const responce = await fetch('/api/v1/tests/publish', {
                method: 'PATCH',
                body: JSON.stringify({
                    id: testID
                }),
                headers: new URLSearchParams({
                    authorization: accessToken as string
                })
            })

            if (!responce.ok) {
                switch (responce.status) {
                    case 404: {
                        return setInputErrorMessage('Тест не найден.')
                    }

                    case 403: {
                        return setInputErrorMessage('У вас нет прав на редактирование этого теста.')
                    }

                    case 429: {
                        return setInputErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    case 503: {
                        return setInputErrorMessage('Сервис управления тестами недоступен.')
                    }

                    default: {
                        return setInputErrorMessage('Не удалось опубликовать тест.')
                    }
                }
            }

            setTest(prevTest => {
                const updatedTest = { ...prevTest }

                updatedTest.questions = displayQuestions
                updatedTest.totalQuestions = displayQuestions.length

                if (!updatedTest.published) {
                    updatedTest.published = true
                    updatedTest.publishedAt = Date.now()

                    setTestState(null)
                    setTestPublishedState('published')
                }

                setTestState('updated')
                setIsPublishSuccessfulDialogOpened(true)

                setLoadingMessage('')
                return updatedTest
            })

            nProgress.done()
        }
    }

    const saveDraft = async (updatedTest: ITest): Promise<any> => {
        isDraftSavingStarted.current = true

        const testID = new URLSearchParams(location.search).get('id')
        const accessToken = localStorage.getItem('accessToken')

        const draftBody: TestDraft & { id: string } = {
            id: testID as string,
            title: updatedTest.title,
            description: updatedTest.description,
            subject: updatedTest.subject,
            questions: updatedTest.questions,
            totalQuestions: updatedTest.totalQuestions,
            settings: updatedTest.settings
        }

        updatedTest.draft = draftBody

        const responce = await fetch('/api/v1/tests/saveDraft', {
            method: 'PATCH',
            body: JSON.stringify(draftBody),
            headers: new URLSearchParams({
                authorization: accessToken as string
            })
        })

        if (!responce.ok) {
            switch (responce.status) {
                case 404: {
                    return setInputErrorMessage('Тест не найден.')
                }

                case 403: {
                    return setInputErrorMessage('У вас нет прав на редактирование этого теста.')
                }

                case 429: {
                    return setInputErrorMessage('Вы отправляете слишком много запросов.')
                }

                case 503: {
                    return setInputErrorMessage('Сервис управления тестами недоступен.')
                }

                default: {
                    return setInputErrorMessage('Не удалось сохранить черновик.')
                }
            }
        }

        setTestState('edited')
        setEditDialogOpen(false)

        setChangesMade(true)
    }

    const handlePublish = (confirmed: boolean): any => {
        setIsPublishConfirmationDialogOpened(false)

        if (confirmed) {
            publish()
        }
    }

    const handleDelete = (confirmed: boolean): any => {
        if (confirmed) {
            setIsDeleteConfirmationDialogOpened(false)

            setQuestions(prevQuestions => {
                const updatedQuestions = [...prevQuestions]
                updatedQuestions.splice(selectedQuestionIndex as number, 1)

                setDisplayQuestions(updatedQuestions)

                setTest(prevTest => {
                    const updatedTest = { ...prevTest }

                    updatedTest.questions = updatedQuestions
                    updatedTest.totalQuestions = updatedQuestions.length

                    updatedTest.lastEditedAt = Date.now()

                    if (typeof window !== 'undefined' && !isDraftSavingStarted.current) {
                        saveDraft(updatedTest).then(() => {
                            isDraftSavingStarted.current = false
                            handleEditDialogCancel()

                            nProgress.done()
                        })
                    }

                    return updatedTest
                })

                setTestState('edited')
                setChangesMade(true)

                return updatedQuestions
            })

            setSelectedQuestion(null)
            setSelectedQuestionIndex(null)
        } else {
            setIsDeleteConfirmationDialogOpened(false)
        }
    }

    const handleCheckboxesChange = (checkboxIndex: number): void => {
        setSelectedCheckboxes(prevCheckboxes => {
            const newCheckboxes = [...prevCheckboxes]
            newCheckboxes[checkboxIndex] = !newCheckboxes[checkboxIndex]

            return newCheckboxes
        })
    }

    const handleRadioChange = (optionIndex: number): void => {
        setSingleChoiceSelectedOption(optionIndex)
    }

    const handleAnswerEditDialogOpen = (answerText: string, answerIndex: number): any => {
        setEditingAnswerText(answerText)
        setEditingAnswerIndex(answerIndex)

        setAnswerTextEditDialogOpened(true)
    }

    const handleQuestionTypeEditing = (
        questionType?: QuestionType,
        questionIndex?: number
    ): void => {
        if (questionIndex !== undefined && questionType !== undefined) {
            setQuestions(prevQuestions => {
                const updatedQuestions = [...prevQuestions]
                updatedQuestions[questionIndex].type = questionType

                return updatedQuestions
            })

            setEditorQuestionType(questionType as any)
        }

        setIsQuestionTypeEditing(isQuestionTypeEditing => !isQuestionTypeEditing)
    }

    const handleEditableInfoEditClick = (editableInfoKey: EditableInfoKeys): any => {
        const testToEdit = test as any
        setIsTestInfoEditingDialogOpened(true)

        setEditedTestInfoValue(testToEdit[editableInfoKey])
        setSelectedInfoKey(editableInfoKey)
    }

    const handleCreateQuestionButtonClick = (): any => {
        setQuestions(prevQuestions => {
            const updatedQuestions = [...prevQuestions]
            const newQuestionID = (prevQuestions.at(-1)?.id as number) + 1

            updatedQuestions.push({
                id: newQuestionID,
                text: 'Текст вопроса',
                type: QuestionType.SINGLE_CHOICE,
                answers: ['Ответ 1', 'Ответ 2', 'Ответ 3', 'Ответ 4'],
                correctAnswers: [0]
            })

            openEditDialog(updatedQuestions.at(-1) as IQuestion, updatedQuestions.length - 1)
            return updatedQuestions
        })
    }

    return (
        <>
            <Authenticated requiredRole={UserRole.USER}>
                <div className={styles.container}>
                    <Navbar />

                    <main className={styles.main}>
                        <h1>Информация о тесте</h1>

                        <div className={styles['test-info']}>
                            {Object.entries(test).map(([key, value], entryIndex) => {
                                const keyStrings: { [key: string]: any } = {
                                    title: 'Название',
                                    description: 'Описание',
                                    subject: 'Предмет',
                                    timeMinutes: 'Минут на выполнение',
                                    userCompletions: 'Прохождений',
                                    createdAt: 'Создан',
                                    lastEditedAt: 'Последний раз изменён',
                                    publishedAt: 'Опубликован'
                                }

                                const editableInfoKeys = ['title', 'description', 'subject', 'timeMinutes']

                                if (key == 'subject') {
                                    const subject = value
                                    value = subjects[subject]
                                }

                                if (key == 'userCompletions') {
                                    const userCompletions = value
                                    value = userCompletions.length
                                }

                                if (key == 'publishedAt') {
                                    const timestamp = value as number
                                    value = timestamp == 0 ? null : new Date(timestamp).toLocaleString('ru')
                                }

                                if (key == 'createdAt' || key == 'lastEditedAt' || key == 'publishedAt') {
                                    const timestamp = value as number

                                    if (typeof value == 'string') {
                                        value = timestamp
                                    }

                                    else if (value !== 0 && value !== null && value !== undefined) {
                                        value = new Date(timestamp).toLocaleString('ru')
                                    }
                                }

                                const isValueBad = (
                                    value !== null &&
                                    value !== undefined &&
                                    value !== '01.01.1970, 03:00:00'
                                )

                                return (
                                    <>
                                        {keyStrings[key] && isValueBad ? (
                                            <div className={styles['test-info-entry']} key={entryIndex}>
                                                {keyStrings[key]}: <b>{value}</b> {' '}

                                                {editableInfoKeys.find(editableKey => key == editableKey) ? <>
                                                    <i
                                                        className="fas fa-pencil-alt"
                                                        onClick={
                                                            (): any => handleEditableInfoEditClick(key as EditableInfoKeys)
                                                        }
                                                    />
                                                </> : null}
                                            </div>
                                        ) : null}
                                    </>
                                )
                            })}

                            <div className={styles['test-info-entry']}>
                                Состояние: <b>
                                    {states[testState as TestState]
                                        ? `${states[testState as TestState]}, ` +
                                        `${toStartLowerCase(states[testPublishedState])}`

                                        : states[testPublishedState]}
                                </b>
                            </div>

                        </div>

                        <div
                            style={{ marginTop: 20, marginBottom: 40 }}
                            onClick={(): any => open(`/tests/complete?id=${new URLSearchParams(location.search).get('id')}`)}
                        >
                            <a className={styles.button}>Открыть страницу теста</a>
                        </div>


                        <h1 className={styles['questions-title-text']} onClick={handleCreateQuestionButtonClick}>
                            Вопросы ({displayQuestions.length}) {' '}
                            <i className="fas fa-plus-square" />
                        </h1>

                        <div className={styles.questions}>
                            {displayQuestions.map((question, questionIndex) => (
                                <div className={styles.question} key={questionIndex}>
                                    <p className={`${styles['question-text']} ${styles['editor-question-text']}`}>
                                        <b>{questionIndex + 1}.</b> {' '}
                                        {parseMarkdown(breakNewLines(question.text))}{' '}

                                        <i className="fas fa-pencil-alt" onClick={
                                            (): any => openEditDialog(question, questionIndex)
                                        } /> {' '}

                                        <i style={{ transform: 'translateX(5px)' }} className="fas fa-trash-alt" onClick={
                                            (): any => openDeleteDialog(question, questionIndex)
                                        } />

                                        <ul className={`${styles.answers}` +
                                            `${question.type == QuestionType.MULTIPLE_CHOICE
                                                ? ' ' + styles['list-multiple-choice']
                                                : ''}`
                                        }>
                                            {question.answers.map((answer, answerIndex) => (
                                                <li
                                                    className={
                                                        question.correctAnswers.includes(answerIndex)
                                                            ? styles['correct-answer']
                                                            : ''
                                                    }
                                                    key={answerIndex}
                                                >
                                                    {answer}
                                                </li>
                                            ))}
                                        </ul>
                                    </p>
                                </div>
                            ))}
                        </div>

                        <a className={styles.button} onClick={handlePublishButtonClicked}>
                            Опубликовать {test.published ? 'изменения' : ''}
                        </a>

                        <a style={{ textAlign: 'center' }}>
                            Все изменения сохранятся на вашем аккаунте автоматически.<br />

                            Чтобы опубликовать все изменения и сделать их видимыми для всех,{' '}
                            нажмите кнопку публикации теста.
                        </a>
                    </main>

                    <Footer />
                </div>


                {/* main question editing dialog */}

                <Dialog
                    opened={editDialogOpen}
                    dismissable={false}
                    title='Редактирование вопроса'
                    description=""
                    className={styles['question-editor']}
                    type={DialogType.SUBMIT_WITH_CANCEL}
                    confirmButtonName='Сохранить'
                    onClose={handleEditDialogClose}

                    inputs={{
                        checkboxes: selectedQuestion
                            ? selectedQuestion.answers.map((_, answerIndex) => ({
                                name: `checkbox_${answerIndex}`,
                                checked: selectedCheckboxes[answerIndex] || false,
                            }))
                            : [],

                        selects: selectedQuestion?.type == QuestionType.SINGLE_CHOICE
                            ? [{
                                name: 'selected',
                                selected: selectedOption as number,
                            }]
                            : [],
                    }}
                >
                    {selectedQuestion && (
                        <>
                            <div className={styles['question-settings']}>
                                <div className={styles['question-setting']}>
                                    Тип вопроса: {isQuestionTypeEditing ? (
                                        <>
                                            <DropdownList
                                                onSelect={(selectedQuestionType: any): void => {
                                                    setEditorSelectedQuestionType(selectedQuestionType)
                                                }}

                                                getSelectedIndex={true}
                                                selectedOption={editorSelectedQuestionType as QuestionType}

                                                options={Object.entries(questionTypes).map(
                                                    ([questionTypeNumber, questionTypeText]) => {
                                                        return {
                                                            text: questionTypeText,
                                                            value: questionTypeNumber,
                                                        }
                                                    }
                                                )}
                                            /> {' '}

                                            <div className={styles['save-buttons']}>
                                                <div className={styles['save-button']}>
                                                    <i
                                                        className="fas fa-save"
                                                        onClick={(): void => {
                                                            if (editorSelectedQuestionType == null) {
                                                                return setInputErrorMessage('Укажите тип вопроса.')
                                                            }

                                                            handleQuestionTypeEditing(
                                                                editorSelectedQuestionType as QuestionType,
                                                                selectedQuestionIndex as number
                                                            )
                                                        }}
                                                    /> {' '}
                                                </div>

                                                <div className={styles['save-button']}>
                                                    <i
                                                        className="fas fa-times"
                                                        onClick={(): void => {
                                                            handleQuestionTypeEditing()
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <b>{
                                                questionTypes[editorSelectedQuestionType as QuestionType] ??
                                                questionTypes[selectedQuestion.type]
                                            }</b>{' '}

                                            <i
                                                className="fas fa-pencil-alt"
                                                onClick={(): void => handleQuestionTypeEditing()}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <ul className={styles['editor-answers']}>
                                <p className={styles['editor-question-text']}>
                                    {parseMarkdown(breakNewLines(questionText || selectedQuestion.text))}

                                    <i className="fas fa-pencil-alt" onClick={
                                        (): void => {
                                            setEditingQuestionText(editingQuestionText || selectedQuestion.text)
                                            setTextEditDialogOpened(true)
                                        }
                                    } />
                                </p>

                                {(editorQuestionType ?? selectedQuestion.type) == QuestionType.SINGLE_CHOICE && (
                                    <>
                                        {selectedQuestion.answers.map((answer, answerIndex) => {
                                            return (
                                                <li
                                                    className={styles['answer-option']}
                                                    key={answerIndex}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`answer_${answerIndex}`}
                                                        id={`answer_${answerIndex}`}
                                                        value={answer}
                                                        onChange={(): void => handleRadioChange(answerIndex)}
                                                        checked={selectedOption == answerIndex}
                                                    />

                                                    <label
                                                        className={`${styles['answer-text']} ` +
                                                            `${(
                                                                editorQuestionType ?? selectedQuestion.type
                                                            ) == QuestionType.SINGLE_CHOICE
                                                                ? styles['editor-single-choice']
                                                                : ''}`
                                                        }

                                                        htmlFor={`answer_${answerIndex}`}
                                                    >
                                                        {answer}
                                                    </label>

                                                    <i className="fas fa-pencil-alt" onClick={
                                                        (): any => {
                                                            handleAnswerEditDialogOpen(answer, answerIndex)
                                                        }
                                                    } />
                                                </li>
                                            )
                                        })}
                                    </>
                                )}

                                {(editorQuestionType ?? selectedQuestion.type) == QuestionType.MULTIPLE_CHOICE && (
                                    <>
                                        {selectedQuestion.answers.map((answer, answerIndex) => {
                                            return (
                                                <li
                                                    className={styles['answer-option']}
                                                    key={answerIndex}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name={`answer_${answerIndex}`}
                                                        id={`answer_${answerIndex}`}
                                                        value={answer}
                                                        onChange={(): void => handleCheckboxesChange(answerIndex)}
                                                        checked={selectedCheckboxes[answerIndex]}
                                                    />

                                                    <label
                                                        className={styles['answer-text']}
                                                        htmlFor={`answer_${answerIndex}`}
                                                    >
                                                        {answer}
                                                    </label>

                                                    <i className="fas fa-pencil-alt" onClick={
                                                        (): any => {
                                                            handleAnswerEditDialogOpen(answer, answerIndex)
                                                        }
                                                    } />
                                                </li>
                                            )
                                        })
                                        }
                                    </>
                                )}
                            </ul>
                        </>
                    )}
                </Dialog >


                {/* question text editing dialog */}

                <Dialog
                    title="Редактирование вопроса"
                    description="Введите изменённый текст вопроса поле ниже:"
                    className={styles['question-text-input']}
                    opened={textEditDialogOpened}
                    dismissable={false}
                    confirmButtonName='Сохранить'
                    inputs={{
                        fields: [
                            {
                                name: 'testInput',
                                value: questionText,
                            },
                        ],
                    }}
                    type={DialogType.SUBMIT_WITH_CANCEL}
                    onClose={handleQuestionEditDialogClose}
                >
                    <>
                        <textarea
                            onChange={(e): any => setEditingQuestionText(e.target.value)}
                            value={editingQuestionText}
                            placeholder='Текст вопроса'
                        />
                    </>
                </Dialog>


                {/* answer text editing dialog */}

                <Dialog
                    opened={answerTextEditDialogOpened}
                    dismissable={false}
                    title='Редактирование ответа'
                    description="Введите изменённый текст ответа в поле ниже:"
                    className={styles['question-text-input']}
                    confirmButtonName='Сохранить'
                    type={DialogType.SUBMIT_WITH_CANCEL}
                    onClose={(confirmed): any => {
                        if (confirmed) {
                            if (!editingAnswerText) {
                                setInputErrorMessage('Для сохранения необходимо указать текст ответа.')
                                return false
                            }

                            if (editingAnswerText.length > 80) {
                                setInputErrorMessage('Длина ответа не должна превышать 80 символов.')
                                return false
                            }

                            if (selectedQuestion) {
                                selectedQuestion.answers[editingAnswerIndex as number] = editingAnswerText
                            }

                            setAnswerTextEditDialogOpened(false)

                            setQuestions(prevQuestions => {
                                const updatedQuestions = [...prevQuestions]

                                updatedQuestions[selectedQuestionIndex as number]
                                    .answers[editingAnswerIndex as number] = editingAnswerText

                                return updatedQuestions
                            })
                        } else {
                            setAnswerTextEditDialogOpened(false)
                        }
                    }}
                >
                    <>
                        <input
                            type='text'
                            onChange={(e): any => setEditingAnswerText(e.target.value)}
                            value={editingAnswerText}
                            placeholder='Текст ответа'
                        />
                    </>
                </Dialog>


                {/* test info editing dialog */}

                <Dialog
                    opened={isTestInfoEditingDialogOpened}
                    dismissable={false}
                    className={styles['question-text-input']}
                    title='Изменение информации'
                    description={fullInfoKeyStrings[selectedInfoKey] == 'предмет'
                        ? 'Укажите предмет, по которому ваш тест будет создан, используя выпадающий список ниже:'
                        : `Введите изменённое ${fullInfoKeyStrings[selectedInfoKey]} в поле ниже:`
                    }
                    confirmButtonName='Сохранить'
                    type={DialogType.SUBMIT_WITH_CANCEL}
                    onClose={handleTestInfoChange}
                >
                    {fullInfoKeyStrings[selectedInfoKey] == 'предмет'
                        ? <>
                            <DropdownList
                                onSelect={(selectedQuestionType: any): void => {
                                    setEditedTestInfoValue(selectedQuestionType)
                                }}

                                getSelectedIndex={true}
                                selectedOption={editedTestInfoValue as any}

                                initialOptionText='Выберите предмет'
                                options={Object.entries(subjects).map(
                                    ([subjectNumber, subjectText]) => {
                                        return {
                                            text: subjectText,
                                            value: subjectNumber,
                                        }
                                    }
                                )}
                            />
                        </>
                        : <input
                            type={selectedInfoKey == 'timeMinutes' ? 'number' : 'text'}
                            onChange={(e): any => setEditedTestInfoValue(e.target.value)}
                            value={editedTestInfoValue}
                            placeholder={toStartUpperCase(fullInfoKeyStrings[selectedInfoKey])}
                            min={selectedInfoKey == 'timeMinutes' ? 1 : undefined}
                        />
                    }
                </Dialog>


                {/* question deletion confirmation dialog */}

                <Dialog
                    opened={isDeleteConfirmationDialogOpened}
                    title='Удаление вопроса'
                    description=""
                    dismissable={false}
                    type={DialogType.QUESTION}
                    onClose={handleDelete}
                >
                    Вы действительно хотите удалить {selectedQuestionIndex as number + 1}-й вопрос:

                    <a>
                        <b>
                            "{parseMarkdown(breakNewLines(selectedQuestion?.text || '' as string))}"
                        </b>?
                    </a>
                </Dialog>


                {/* publishing confirmation dialog */}

                <Dialog
                    opened={isPublishConfirmationDialogOpened}
                    title='Опубликовать'
                    description={`Вы действительно хотите опубликовать ${test.published ? 'изменения в тесте' : 'тест'}?`}
                    dismissable={false}
                    type={DialogType.QUESTION}
                    onClose={handlePublish}
                />


                {/* successful publishing dialog */}

                <Dialog
                    opened={isPublishSuccessfulDialogOpened}
                    title='Опубликовать'
                    description="Тест опубликован успешно!"
                    dismissable={false}
                    type={DialogType.INFO}
                    onClose={(): any => setIsPublishSuccessfulDialogOpened(false)}
                />


                {/* error dialog */}

                <Dialog
                    opened={!!inputErrorMessage}
                    dismissable={false}
                    title='Ошибка'
                    description={inputErrorMessage}
                    type={DialogType.INFO}
                    onClose={(): any => setInputErrorMessage('')}
                />


                {/* loading dialog */}

                <Dialog
                    opened={!!loadingMessage}
                    dismissable={false}
                    title='Один момент...'
                    description={loadingMessage}
                    type={DialogType.NONE}
                />


                {/* loading error dialog */}

                <Dialog
                    opened={!!loadingErrorMessage}
                    dismissable={false}
                    title='Ошибка загрузки'
                    description={loadingErrorMessage}
                    type={DialogType.INFO}
                    onClose={(): any => {
                        setLoadingErrorMessage('')

                        router.push({
                            pathname: '/tests/manage'
                        })
                    }}
                />
            </Authenticated>
        </>
    )
}

export default Page

type EditableInfoKeys = 'title' | 'description' | 'subject' | 'timeMinutes'
type TestState = 'published' | 'unpublished' | 'edited' | 'updated' | 'created'
