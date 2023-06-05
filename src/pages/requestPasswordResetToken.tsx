/* eslint-disable react-hooks/exhaustive-deps */

import { NextPage } from 'next'
import { useRouter } from 'next/router'

import Link from 'next/link'

import { useState, useEffect } from 'react'
import nProgress from 'nprogress'

import Dialog from '@/components/Dialog'
import { DialogType } from '@/types/dialog.interface'

import { validateEmail } from '@/lib/validators'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

import style from '@/styles/Form.module.css'
import { getBorderStyle } from '@/lib/misc/clientUtilityFunctions'
import { IResponceBody } from '@/lib/json'

const styles = style as Record<
    'container' | 'form' | 'title' |
    'input' | 'label' | 'button' |
    'link' | 'error' | 'main' |
    'notice' | 'checkbox-container' | 'checkboxes' |
    'processing' | 'spaced-button', string
>

const Page: NextPage = () => {
    const router = useRouter()

    const defaultInputBorderStyle = getBorderStyle(3, 'var(--default-input-border-color)')
    const errorInputBorderStyle = getBorderStyle(3, 'var(--error-color)')

    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

    const [result, setResult] = useState<boolean>(false)
    const [isErrored, setIsErrored] = useState<boolean>(false)

    const [email, setEmail] = useState<string>('')
    const [isEmailErrored, setIsEmailErrored] = useState<boolean>(false)

    const [errorMessage, setErrorMessage] = useState<string>('')
    const [isPasswordResetRequestProcessing, setIsPasswordResetRequestProcessing] = useState<boolean>(false)

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value)
    }

    useEffect(() => {
        const handleEnterKeypress = (e: KeyboardEvent): void => {
            if (e.key == 'Enter') {
                handlePasswordResetRequest()
            }
        }

        document.addEventListener('keydown', handleEnterKeypress)

        return () => {
            document.removeEventListener('keydown', handleEnterKeypress)
        }
    })

    const handlePasswordResetRequest = (): any => {
        (async (): Promise<any> => {
            nProgress.start()
            const isEmailOk = validateEmail(email)

            setErrorMessage('')
            setIsEmailErrored(false)

            if (!email) {
                setErrorMessage('Укажите почту.')
                return setIsEmailErrored(true)
            }

            if (!isEmailOk) {
                setErrorMessage('Указана неправильная почта.')
                return setIsEmailErrored(true)
            }

            setIsPasswordResetRequestProcessing(true)

            const responce = await fetch('/api/v1/auth/password/requestReset', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    locationHref: location.href
                })
            })

            const result: IResponceBody<any> = await responce.json()

            if (!responce.ok) {
                setIsErrored(true)

                switch (responce.status) {
                    case 404: {
                        return setErrorMessage('Данная почта не зарегистрирована.')
                    }

                    case 409: {
                        return setErrorMessage('Данный пользователь уже сделал запрос на сброс пароля.')
                    }

                    case 429: {
                        return setErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    default: {
                        return setErrorMessage('Не удалось отправить запрос на сброс пароля.')
                    }
                }
            }

            setIsSubmitted(true)
            return setResult(result.status)
        })().then(() => {
            nProgress.done()
            setIsPasswordResetRequestProcessing(false)
        })
    }

    return (
        <>
            <div className={styles.container}>
                <Navbar />

                <main className={styles.main}>
                    <h4 className={styles.title}>Сброс пароля</h4>

                    <div>
                        <label className={styles.label} style={{
                            color: isEmailErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Электронная почта
                        </label>

                        <input
                            className={styles.input}
                            type='text'
                            onChange={handleEmailChange}
                            style={{
                                border: isEmailErrored ? errorInputBorderStyle : defaultInputBorderStyle
                            }}
                        />
                    </div>

                    <div
                        className={styles.error}
                        style={{ display: errorMessage ? 'block' : 'none' }}
                    >
                        <p>{errorMessage}</p>
                    </div>

                    <Link href='#'>
                        <a
                            className={
                                `${styles.button} ${styles['spaced-button']}` +
                                `${isPasswordResetRequestProcessing ? ' ' + styles.processing : ''}`
                            }
                            onClick={isPasswordResetRequestProcessing ? undefined : handlePasswordResetRequest}
                        >
                            {isPasswordResetRequestProcessing ? 'Запрашиваем сброс...' : 'Запросить сброс'}
                        </a>
                    </Link>
                </main>

                <Footer />
            </div>

            <Dialog
                opened={!isErrored && isSubmitted && result}
                dismissable={false}
                type={DialogType.INFO}
                title='Сброс пароля'
                description={
                    'Запрос на сброс пароля отправлен успешно! ' +
                    `Ссылка для выполнения процедуры смены пароля была отправлена на почту "${email}". ` +
                    'Если письма нет, убедитесь в правильности написания адреса почтового ящика, а так же ' +
                    'проверьте папку "Спам".'
                }
                onClose={(): any => {
                    router.push({
                        pathname: '/login'
                    })
                }}
            />
        </>
    )
}

export default Page
