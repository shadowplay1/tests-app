import { NextPage } from 'next'

import { useRouter } from 'next/router'
import Link from 'next/link'

import { useEffect, useRef, useState } from 'react'
import nProgress from 'nprogress'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

import Dialog from '@/components/Dialog'
import Authenticated from '@/components/Authenticated'

import { User, UserRole } from '@/lib/classes/User'
import { ITest } from '@/lib/classes/Test'

import { DialogType } from '@/types/dialog.interface'
import { IResponceBody } from '@/lib/json'

import { subjectsStrings } from '@/lib/misc/constants'

import style from '@/styles/Library.module.css'

const styles = style as Record<
    'container' | 'filters' | 'sort' |
    'search' | 'search-input' | 'search-button' |
    'tests' | 'test' | 'test-title' |
    'test-description' | 'test-questions' |
    'main' | 'button' | 'filter-selector' | 'test-subject',
    string
>

const Page: NextPage = () => {
    const router = useRouter()

    const keyStrings: { [key: string]: any } = {
        title: 'Название',
        description: 'Описание',
        subject: 'Предмет',
        timeMinutes: 'Минут на выполнение',
        totalQuestions: 'Вопросов',
        userCompletions: 'Прохождений',
        createdAt: 'Создан',
        lastEditedAt: 'Последний раз изменён',
        publishedAt: 'Опубликован',
        author: 'Автор'
    }

    const [library, setLibrary] = useState<TestWithoutQuestions[]>([])

    const [loadingMessage, setLoadingMessage] = useState<string>('Загружаем ваши тесты...')
    const [isLoadingFinished, setIsLoadingFinished] = useState<boolean>(false)

    const [errorMessage, setErrorMessage] = useState<string>('')

    const [searchQuery, setSearchQuery] = useState('')
    const [filteredTestsLength, setFilteredTestsLength] = useState<number | null>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>('creationDate')

    const [selectedTest, setSelectedTest] = useState<TestWithoutQuestions | null>(null)
    const [isTestDialogOpened, setIsTestDialogOpened] = useState<boolean>(false)

    const isLibraryFetchingStarted = useRef<boolean>(false)

    const filterLibrary = (library: TestWithoutQuestions[]): TestWithoutQuestions[] => {
        return library.filter(item => {
            const lowerCaseSearchQuery = searchQuery.toLowerCase()

            const matchesName = item.title.toLowerCase()
                .includes(lowerCaseSearchQuery)

            const matchesDescription = item.description.toLowerCase()
                .includes(lowerCaseSearchQuery)

            return matchesName || matchesDescription
        })
    }

    const fetchLibrary = async (): Promise<any> => {
        nProgress.start()
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken')

            const responce = await fetch('/api/v1/tests/created', {
                headers: new URLSearchParams({
                    authorization: accessToken as string
                })
            })

            if (!responce.ok) {
                switch (responce.status) {
                    case 429: {
                        return setErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    case 503: {
                        return setErrorMessage('Сервис управления тестами недоступен.')
                    }

                    default: {
                        return setErrorMessage('Не удалось загрузить библиотеку тестов.')
                    }
                }
            }

            const test: IResponceBody<{ tests: ITest[] }> = await responce.json()

            setLoadingMessage('')
            setIsLoadingFinished(true)

            return setLibrary(test.data.tests)
        }
    }

    useEffect(() => {
        if (!isLibraryFetchingStarted.current) {
            isLibraryFetchingStarted.current = true

            fetchLibrary().then(() => {
                nProgress.done()
            })
        }
    }, [])

    const filteredData = filterLibrary(library)

    const sortedData = [...filteredData].sort((a, b) => {
        if (sortOrder == 'creationDate') {
            return b.createdAt - a.createdAt
        } else {
            return a.title.localeCompare(b.title)
        }
    })

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setSortOrder(e.target.value as SortOrder)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const input = e.target.value

        setSearchQuery(input)

        setFilteredTestsLength(() => {
            if (!input) {
                return null
            }

            const filteredData = filterLibrary(library)
            return filteredData.length
        })
    }

    return (
        <>
            <Authenticated requiredRole={UserRole.USER}>
                <div className={styles.container}>
                    <Navbar />

                    <main className={styles.main}>
                        <h1 style={{ marginBottom: 40 }}>
                            Ваши тесты{' '}

                            <Link href="/tests/create">
                                <i className="fas fa-plus-square" />
                            </Link>
                        </h1>

                        <div className={styles.filters}>
                            <div className={styles.search}>
                                <input
                                    type="text"
                                    className={styles['search-input']}
                                    placeholder="Поиск в созданных тестах..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                            </div>

                            <div className={styles.sort}>
                                Сортировать по:

                                <select
                                    className={styles['filter-selector']}
                                    value={sortOrder}
                                    onChange={handleSortChange}
                                >
                                    <option value="creationDate">Дате создания</option>
                                    <option value="name">Названию</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: 5 }}>
                            Найдено тестов: <b>{library.length}</b>.
                        </div>

                        {
                            filteredTestsLength !== null && searchQuery && (
                                <div>
                                    Найдено результатов: <b>{filteredTestsLength}</b>.
                                </div>
                            )
                        }

                        <div className={styles.tests}>
                            {sortedData.map(item => (
                                <div key={item.id} className={styles.test}>
                                    <div className={styles['test-subject']}>
                                        {subjectsStrings[item.subject]}
                                    </div>

                                    <div className={styles['test-title']}>
                                        {item.title}
                                    </div>

                                    <div className={styles['test-description']}>
                                        {item.description}
                                    </div>

                                    <div className={styles['test-questions']}>
                                        Вопросов: {item.totalQuestions || 0}<br />
                                        Прохождений: {item.userCompletions.length}
                                    </div>

                                    <a
                                        className={styles.button}
                                        onClick={(): void => {
                                            setIsTestDialogOpened(true)
                                            setSelectedTest(item)
                                        }}
                                    >Открыть</a>
                                </div>
                            ))}
                        </div>

                        <Link href="/tests/create">
                            <a className={styles.button}>Создать тест</a>
                        </Link>
                    </main>

                    <Footer />
                </div>
            </Authenticated>


            {/* no tests dialog */}

            <Dialog
                opened={isLoadingFinished && library.length == 0}
                title='Управление тестами'
                description='У вас не создано ни одного теста. Создать?'
                dismissable={false}
                type={DialogType.QUESTION}
                onClose={(confirmed): any => {
                    if (confirmed) {
                        return router.push({
                            pathname: '/tests/create'
                        })
                    }

                    return router.push({
                        pathname: '/'
                    })
                }}
            />

            {/* test info dialog */}

            <Dialog
                opened={isTestDialogOpened}
                dismissable={true}
                title={`Информация о тесте "${selectedTest?.title}"`}
                description={
                    Object.entries((selectedTest || {}) as TestWithoutQuestions)
                        .map(([key, value]) => {
                            if (keyStrings[key]) {
                                if (key == 'author') {
                                    const author = value as User
                                    value = author.firstName
                                        ? `${author.firstName} ${author.lastName}`
                                        : author.username
                                }

                                if (key == 'subject') {
                                    const subject = value as number
                                    value = subjectsStrings[subject]
                                }

                                if (key == 'userCompletions') {
                                    const userCompletions = value as any[]
                                    value = userCompletions?.length
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

                                return `${keyStrings[key]}: **${value}**`
                            }
                        })
                        .filter(line => line?.length)
                        .join('\n')
                }
                type={DialogType.QUESTION}
                confirmButtonName='Редактировать'
                cancelButtonName='Закрыть'
                onClose={(confirmed): any => {
                    if (confirmed) {
                        setIsTestDialogOpened(false)

                        router.push({
                            pathname: '/tests/edit',
                            query: {
                                id: selectedTest?.id
                            }
                        })
                    } else {
                        setIsTestDialogOpened(false)
                    }
                }}
            />

            {/* loading dialog */}

            <Dialog
                opened={!!loadingMessage}
                dismissable={false}
                title='Один момент...'
                description={loadingMessage}
                type={DialogType.NONE}
            />


            {/* error dialog */}

            <Dialog
                opened={!!errorMessage}
                dismissable={false}
                title='Ошибка'
                description={errorMessage}
                type={DialogType.INFO}
                onClose={(): any => {
                    setErrorMessage('')

                    router.push({
                        pathname: '/'
                    })
                }}
            />
        </>

    )
}

export default Page

type SortOrder = 'creationDate' | 'name'
type TestWithoutQuestions = Omit<ITest, 'questions'>
