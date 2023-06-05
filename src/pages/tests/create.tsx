import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useState } from 'react'
import nProgress from 'nprogress'

import Dialog from '@/components/Dialog'
import Authenticated from '@/components/Authenticated'
import { DialogType } from '@/types/dialog.interface'

import { IResponceBody } from '@/lib/json'

import { ITest } from '@/lib/classes/Test'
import { UserRole } from '@/lib/classes/User'

import style from '@/styles/Form.module.css'

const styles = style as Record<'label' | 'input' | 'form', string>

const Page: NextPage = () => {
    const router = useRouter()

    const [testCreationError, setTestCreationError] = useState<string>('')

    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setTitle(e.target.value)
    }

    const handleDescriptionInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setDescription(e.target.value)
    }


    const handleClose = (): any => {
        (async (): Promise<any> => {
            if (typeof window !== 'undefined') {
                const accessToken = localStorage.getItem('accessToken')
                nProgress.start()

                const responce = await fetch('/api/v1/tests/create', {
                    method: 'PUT',

                    body: JSON.stringify({
                        title,
                        description
                    }),

                    headers: {
                        authorization: accessToken as any
                    }
                })

                if (!responce.ok) {
                    switch (responce.status) {
                        case 401: {
                            return setTestCreationError('Войдите в систему для выполнения данного действия.')
                        }

                        case 403: {
                            return setTestCreationError('У вас нет прав на это действие.')
                        }

                        case 429: {
                            return setTestCreationError('Вы отправляете слишком много запросов.')
                        }

                        default: {
                            return setTestCreationError('Не удалось создать тест.')
                        }
                    }
                }

                const result: IResponceBody<{ test: ITest }> = await responce.json()

                return router.push({
                    pathname: '/tests/edit',
                    query: {
                        id: `${result.data.test.id}`
                    }
                })
            }
        })().then(() => {
            nProgress.done()
        })
    }

    const handleErrorDialogClose = (): any => {
        return router.push({
            pathname: '/tests/manage'
        })
    }

    return (
        <>
            <Authenticated requiredRole={UserRole.USER}>
                <Dialog
                    opened={true}
                    title='Создание теста'
                    description='Укажите первоначальную информацию о вашем будущем тесте.'
                    dismissable={false}
                    type={DialogType.SUBMIT}
                    onClose={handleClose}
                >
                    <div className={styles.form}>
                        <div>
                            <label className={styles.label}>
                                Название теста
                            </label>

                            <input
                                className={styles.input}
                                type="text"
                                onChange={handleTitleInputChange}
                                placeholder='Название теста'
                            />
                        </div>

                        <div>
                            <label className={styles.label}>
                                Описание
                            </label>

                            <input
                                className={styles.input}
                                type='text'
                                onChange={handleDescriptionInputChange}
                                placeholder='Описание теста'
                            />
                        </div>
                    </div>
                </Dialog>


                <Dialog
                    opened={!!testCreationError}
                    title='Ошибка'
                    description={testCreationError}
                    dismissable={false}
                    type={DialogType.INFO}
                    onClose={handleErrorDialogClose}
                />
            </Authenticated>
        </>
    )
}

export default Page
