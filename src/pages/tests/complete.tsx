import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useEffect, useRef, useState } from 'react'
import nProgress from 'nprogress'

import Dialog from '@/components/Dialog'
import { DialogType } from '@/types/dialog.interface'

import { IResponceBody } from '@/lib/json'

import {
    ITest, QuestionType,
    Subjects, TestEndingReason,
    AnswersComparisonResult
} from '@/lib/classes/Test'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

import { subjectsStrings } from '@/lib/misc/constants'

import style from '@/styles/Form.module.css'
import completePageStyles from '@/styles/Complete.module.css'

const styles = {
    ...style,
    ...completePageStyles
} as Record<
    'container' | 'main' | 'button' |
    'input' | 'form' | 'test-info' | 'question' |
    'answer-option' | 'answer-text' | 'answers' |
    'danger-button',
    string
>

const Page: NextPage = () => {
    const testEndingReasonsStrings = {
        [TestEndingReason.NONE]: '',
        [TestEndingReason.COMPLETED]: 'Вы прошли тест',
        [TestEndingReason.TIMEOUT]: 'Время выполнения теста вышло',
        [TestEndingReason.EXITED]: 'Вы вышли из теста'
    }

    const router = useRouter()

    const [test, setTest] = useState<ITest | null>(null)
    const [isLoadingFinished, setIsLoadingFinished] = useState<boolean>(false)

    const [testResults, setTestResults] = useState<AnswersComparisonResult | null>(null)

    const [errorMessage, setErrorMessage] = useState<string>('')
    const [inputErrorMessage, setInputErrorMessage] = useState<string>('')

    const [startedCompleting, setStartedCompleting] = useState<boolean>(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)

    const [minutesLeft, setMinutesLeft] = useState<number | null>(null)
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

    const [elapsedTime, setElapsedTime] = useState<number>(0)

    const [username, setUsername] = useState<string>('')
    const [usernameInput, setUsernameInput] = useState<string>('')

    const [selectedCheckboxes, setSelectedCheckboxes] = useState<boolean[]>(Array(4).fill(false))
    const [selectedOption, setSingleChoiceSelectedOption] = useState<number | null>(null)

    const [savedAnswers, setSavedAnswers] = useState<(boolean | null)[][]>([])
    const [endingReason, setEndingReason] = useState<TestEndingReason>(TestEndingReason.NONE)

    const isFetchingTestStarted = useRef<boolean>(false)
    const isTestResultsFetchingStarted = useRef<boolean>(false)

    const fetchTest = async (): Promise<any> => {
        if (typeof window !== 'undefined') {
            const testID = new URLSearchParams(location.search).get('id')
            const responce = await fetch(`/api/v1/tests/test?id=${testID}&getQuestions=true`)

            if (!responce.ok) {
                switch (responce.status) {
                    case 429: {
                        return setErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    case 503: {
                        return setErrorMessage('Сервис управления тестами недоступен.')
                    }

                    default: {
                        return setErrorMessage('Не удалось получить информацию о тесте.')
                    }
                }
            }

            const result: IResponceBody<{ test: ITest }> = await responce.json()

            setTest(result.data.test)
            setIsLoadingFinished(true)
        }
    }

    useEffect(() => {
        if (!isFetchingTestStarted.current) {
            isFetchingTestStarted.current = true

            const username = localStorage.getItem('testsUsername')

            if (username) {
                setUsernameInput(username)
            }

            fetchTest().then(() => {
                nProgress.done()
            })
        }
    }, [])

    const calculateTimeRemaining = (): void => {
        if (test) {
            const totalTimeInSeconds = test.timeMinutes * 60
            const timeRemaining = Math.max(0, totalTimeInSeconds - elapsedTime)

            const minutes = Math.floor(timeRemaining / 60)
            const seconds = timeRemaining % 60

            setMinutesLeft(minutes)
            setSecondsLeft(seconds)

            if (timeRemaining == 0 && !endingReason) {
                endTest(TestEndingReason.TIMEOUT, savedAnswers)
            }
        }
    }

    const endTest = (endingReason: TestEndingReason, savedAnswers: (boolean | null)[][]): void => {
        nProgress.start()

        setSavedAnswers(savedAnswers)
        setEndingReason(endingReason)

        if (!isTestResultsFetchingStarted.current) {
            isTestResultsFetchingStarted.current = true

            if (typeof window !== 'undefined') {
                (async (): Promise<void> => {
                    const testID = new URLSearchParams(location.search).get('id')

                    const responce = await fetch('/api/v1/tests/compareAnswers', {
                        method: 'POST',
                        body: JSON.stringify({
                            id: testID,
                            inputAnswers: savedAnswers
                        })
                    })

                    if (!responce.ok) {
                        switch (responce.status) {
                            case 429: {
                                return setInputErrorMessage('Вы отправляете слишком много запросов.')
                            }

                            case 503: {
                                return setInputErrorMessage('Сервис управления тестами недоступен.')
                            }

                            default: {
                                return setInputErrorMessage('Не удалось получить результаты теста.')
                            }
                        }
                    }

                    const { data }: IResponceBody<{ results: AnswersComparisonResult }> = await responce.json()
                    return setTestResults(data.results)
                })().then(() => {
                    nProgress.done()
                })
            }
        }
    }

    useEffect(() => {
        if (startedCompleting) {
            const interval = setInterval(() => {
                setElapsedTime((prevElapsedTime) => prevElapsedTime + 1)
            }, 1000)

            calculateTimeRemaining()
            return () => clearInterval(interval)
        }
    }, [startedCompleting, elapsedTime])

    const handleRadioChange = (optionIndex: number): void => {
        setSingleChoiceSelectedOption(optionIndex)
    }

    const handleCheckboxesChange = (checkboxIndex: number): void => {
        setSelectedCheckboxes(prevCheckboxes => {
            const newCheckboxes = [...prevCheckboxes]
            newCheckboxes[checkboxIndex] = !newCheckboxes[checkboxIndex]

            return newCheckboxes
        })
    }

    /* eslint-disable max-len */
    return (
        <>
            <div className={styles.container}>
                <Navbar />

                {
                    isLoadingFinished &&
                    <main className={styles.main}>

                        {
                            startedCompleting
                                ? <>
                                    {
                                        endingReason
                                            ? <>
                                                <div className={styles['test-info']}>
                                                    <h1>
                                                        {test?.title} - {subjectsStrings[test?.subject as Subjects]}
                                                    </h1>

                                                    <h2>
                                                        {testEndingReasonsStrings[endingReason]}.
                                                    </h2><br />

                                                    {
                                                        testResults && (
                                                            <>
                                                                <p>
                                                                    Правильных ответов:{' '}
                                                                    <b>
                                                                        {testResults.correctAnswers}{' '}
                                                                        ({testResults.correctAnswersPercentage}%)
                                                                    </b><br />

                                                                    Неправильных ответов:{' '}
                                                                    <b>
                                                                        {testResults.incorrectAnswers}{' '}
                                                                        ({testResults.incorrectAnswersPercentage}%)
                                                                    </b>
                                                                </p>

                                                                <div style={{ marginTop: 40 }} onClick={(): void => location.reload()}>
                                                                    <a className={styles.button}>Пройти заново</a>
                                                                </div>
                                                            </>
                                                        )
                                                    }
                                                </div>
                                            </>
                                            : <>
                                                <h1>
                                                    {test?.title} - {subjectsStrings[test?.subject as Subjects]}
                                                </h1>

                                                <div className={styles['test-info']}>
                                                    <h2>
                                                        Вопрос <b>{currentQuestionIndex + 1}/{test?.totalQuestions}</b>
                                                    </h2>

                                                    <h2>
                                                        Время: <b>{minutesLeft !== null && secondsLeft !== null
                                                            ? `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft
                                                                .toString()
                                                                .padStart(2, '0')}`
                                                            : ''}</b>
                                                    </h2>
                                                </div>

                                                <div className={styles.question}>
                                                    <h3>{test?.questions?.[currentQuestionIndex]?.text}</h3>

                                                    <div className={styles.answers}>
                                                        {test?.questions?.[currentQuestionIndex]?.type == QuestionType.SINGLE_CHOICE && (
                                                            <>
                                                                {test?.questions?.[currentQuestionIndex]?.answers
                                                                    ?.map((answer, answerIndex) => {
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
                                                                                    className={styles['answer-text']}
                                                                                    htmlFor={`answer_${answerIndex}`}
                                                                                >
                                                                                    {answer}
                                                                                </label>
                                                                            </li>
                                                                        )
                                                                    })}
                                                            </>
                                                        )}

                                                        {test?.questions?.[currentQuestionIndex]?.type == QuestionType.MULTIPLE_CHOICE
                                                            && (
                                                                <>
                                                                    {test?.questions?.[currentQuestionIndex]?.answers
                                                                        ?.map((answer, answerIndex) => {
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
                                                                                        onChange={
                                                                                            (): void =>
                                                                                                handleCheckboxesChange(answerIndex)
                                                                                        }
                                                                                    />

                                                                                    <label
                                                                                        className={styles['answer-text']}
                                                                                        htmlFor={`answer_${answerIndex}`}
                                                                                    >
                                                                                        {answer}
                                                                                    </label>
                                                                                </li>
                                                                            )
                                                                        })
                                                                    }
                                                                </>
                                                            )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <a className={styles['danger-button']} onClick={(): void => {
                                                        setSavedAnswers(prevSavedAnswers => {
                                                            // fix incorrect input answers generating on answers skips
                                                            // and multiple choice answers - TODO

                                                            const updatedSavedAnswers = [...prevSavedAnswers]
                                                            updatedSavedAnswers.push(Array(4).fill(false))

                                                            setSingleChoiceSelectedOption(null)
                                                            setSelectedCheckboxes([])

                                                            return updatedSavedAnswers
                                                        })

                                                        setCurrentQuestionIndex(prevQuestionIndex => {
                                                            const nextQuestionIndex = prevQuestionIndex + 1

                                                            if (!test?.questions?.[nextQuestionIndex]) {
                                                                endTest(TestEndingReason.COMPLETED, savedAnswers)
                                                            }

                                                            return nextQuestionIndex
                                                        })
                                                    }}>
                                                        Пропустить
                                                    </a>

                                                    <a className={styles.button} onClick={(): void => {
                                                        setSavedAnswers(prevSavedAnswers => {
                                                            const updatedSavedAnswers = [...prevSavedAnswers]
                                                            const radios = Array(4).fill(false)

                                                            radios[selectedOption as number] = true

                                                            updatedSavedAnswers.push(
                                                                selectedOption
                                                                    ? radios
                                                                    : selectedCheckboxes
                                                                        .map(checkbox => checkbox || false)
                                                            )

                                                            setSavedAnswers(updatedSavedAnswers)

                                                            setCurrentQuestionIndex(prevQuestionIndex => {
                                                                const nextQuestionIndex = prevQuestionIndex + 1

                                                                if (!test?.questions?.[nextQuestionIndex]) {
                                                                    endTest(TestEndingReason.COMPLETED, updatedSavedAnswers)
                                                                }

                                                                return nextQuestionIndex
                                                            })

                                                            console.log({ updated_saved_answers: updatedSavedAnswers })
                                                            return updatedSavedAnswers
                                                        })

                                                        setSingleChoiceSelectedOption(null)
                                                        setSelectedCheckboxes([])
                                                    }}>
                                                        Ответить
                                                    </a>
                                                </div></>
                                    }
                                </>
                                : <>
                                    <h1>Выполнение теста "{test?.title}"</h1>

                                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                                        <p>
                                            Вам предстоит выполнить тест <b>"{test?.title}"</b>{' '}
                                            по предмету <b>{subjectsStrings[test?.subject as Subjects]}</b>.
                                        </p>

                                        <p>
                                            Работа будет состоять из <b>{test?.totalQuestions}</b> вопросов,{' '}
                                            а на её выполнение будет дано <b>{test?.timeMinutes}</b> минут.
                                        </p><br />

                                        <p>
                                            Дата создания: <b>{
                                                new Date(test?.createdAt as number).toLocaleString('ru')
                                            }</b>
                                        </p>

                                        <p>
                                            Автор: <b>{
                                                test?.author.firstName
                                                    ? `${test.author.firstName} ${test.author.lastName}`
                                                    : test?.author.username
                                            }</b>
                                        </p>

                                        <p>
                                            Прохождений: <b>{test?.userCompletions?.length}</b>
                                        </p><br />

                                        <b>Желаем успехов!</b>
                                    </div>

                                    <a
                                        className={styles.button}
                                        onClick={(): void => {
                                            setStartedCompleting(true)

                                            setMinutesLeft(test?.timeMinutes as number)
                                            setSecondsLeft(0)
                                        }}
                                    >
                                        Приступить
                                    </a>
                                </>
                        }
                    </main>
                }

                <Footer />
            </div>


            <Dialog
                opened={!username}
                title='Выполнение теста'
                description='Укажите имя, от которого вы будете выполнять тест.'
                dismissable={false}
                enableTogglingKeypresses={true}
                type={DialogType.SUBMIT}
                confirmButtonName='Сохранить'
                onClose={(): any => {
                    if (!usernameInput) {
                        setInputErrorMessage('Для выполнения работы вам необходимо указать имя.')
                        return false
                    }

                    if (usernameInput.length > 32) {
                        setInputErrorMessage('Длина имени не может быть больше 32 символов.')
                    }

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('testsUsername', usernameInput)
                    }

                    setUsername(usernameInput)
                }}
            >
                <div className={styles.form}>
                    <div>
                        <input
                            className={styles.input}
                            type="text"
                            onChange={(e): void => setUsernameInput(e.target.value)}
                            value={usernameInput}
                            placeholder='Имя'
                        />
                    </div>
                </div>
            </Dialog>


            {/* loading error */}

            <Dialog
                opened={!!errorMessage}
                title='Ошибка'
                description={errorMessage}
                dismissable={false}
                type={DialogType.INFO}
                onClose={(): any => {
                    router.push({
                        pathname: '/'
                    })
                }}
            />


            {/* loading dialog */}

            <Dialog
                opened={!isLoadingFinished}
                title='Один момент...'
                description="Загружаем тест..."
                dismissable={false}
                type={DialogType.NONE}
            />


            {/* results loading dialog */}

            <Dialog
                opened={!testResults && endingReason !== TestEndingReason.NONE}
                title='Один момент...'
                description="Получаем результаты теста..."
                dismissable={false}
                type={DialogType.NONE}
            />


            {/* username input error */}

            <Dialog
                opened={!!inputErrorMessage}
                title='Ошибка'
                description={inputErrorMessage}
                dismissable={false}
                type={DialogType.INFO}
                onClose={(): any => setInputErrorMessage('')}
            />
        </>
    )
}

export default Page
