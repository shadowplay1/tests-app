/* eslint-disable react-hooks/exhaustive-deps */

import { NextPage } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'

import React, { useEffect, useState } from 'react'
import nProgress from 'nprogress'

import { APP_NAME } from '@/lib/misc/constants'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

import { getBorderStyle } from '@/lib/misc/clientUtilityFunctions'

import {
    validateEmail,
    validateString,
    IStringValidationOptions
} from '@/lib/validators'

import { IResponceBody } from '@/lib/json'

import style from '@/styles/Form.module.css'

const styles = style as Record<
    'container' | 'form' | 'title' |
    'input' | 'label' | 'button' |
    'link' | 'error' | 'main' |
    'notice' | 'checkbox-container' | 'checkboxes' |
    'processing' | 'spaced-button', string
>

const Page: NextPage = () => {
    const router = useRouter()
    const rawQuery = router.query as Record<'register' | 'authCheckFailed', string>

    const query: {
        register: boolean
        authCheckFailed: boolean
    } = {} as any

    for (const key in rawQuery) {
        try {
            // getting literal number and boolean values
            (query as any)[key] = JSON.parse((rawQuery as any)[key])
        } catch {
            // if parse failed, then the value is string
            (query as any)[key] = (rawQuery as any)[key]
        }
    }

    const { authCheckFailed } = query

    const defaultInputBorderStyle = getBorderStyle(3, 'var(--default-input-border-color)')
    const errorInputBorderStyle = getBorderStyle(3, 'var(--error-color)')


    const [email, setEmail] = useState<string>('')
    const [isEmailErrored, setIsEmailErrored] = useState<boolean>(false)

    const [username, setUsername] = useState<string>('')
    const [isUsernameErrored, setIsUsernameErrored] = useState<boolean>(false)

    const [password, setPassword] = useState<string>('')
    const [isPasswordErrored, setIsPasswordErrored] = useState<boolean>(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)

    const [repeatedPassword, setRepeatedPassword] = useState<string>('')
    const [isRepeatedPasswordErrored, setIsRepeatedPasswordErrored] = useState<boolean>(false)

    const [isAcceptedDataProcessingErrored, setIsAcceptedDataProcessingErrored] = useState<boolean>(false)

    const [acceptedDataProcessingChange, setAcceptedDataProcessingChange] = useState<boolean>(false)
    const [authCheckFailedMessageDisplayed, setAuthCheckFailedMessageDisplayed] = useState<boolean>(false)

    const [errorMessage, setErrorMessage] = useState<string>('')

    const [isRegisterChecked, setIsRegisterChecked] = useState<boolean>(false)
    const [isRegisterProcessing, setIsRegisterProcessing] = useState<boolean>(false)


    // fields
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value)
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setUsername(e.target.value)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value)
    }

    const handleRepeatedPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRepeatedPassword(e.target.value)
    }

    // checkboxes
    const handleAcceptedDataProcessingChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setAcceptedDataProcessingChange(e.target.checked)
    }

    const handleShowPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setIsPasswordVisible(e.target.checked)
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken')

            const handleRedirect = (): any => {
                return router.push({
                    pathname: '/tests/manage',
                })
            }

            if (accessToken) {
                (async (): Promise<any> => {
                    const accessToken = localStorage.getItem('accessToken')
                    const authResponce = await fetch(`/api/v1/auth/verify?token=${accessToken}`)

                    setIsRegisterChecked(true)

                    if (!authResponce.ok) {
                        setIsPasswordErrored(true)
                        setErrorMessage('Не удалось проверить вход.')
                    } else {
                        const authResult: IResponceBody<Record<'verified', boolean>> =
                            await authResponce.json()

                        if (authResult.data.verified) {
                            handleRedirect()
                        }
                    }
                })()
            }
        }
    }, [isRegisterChecked])

    useEffect(() => {
        setAuthCheckFailedMessageDisplayed(authCheckFailed)

        if (authCheckFailed && authCheckFailedMessageDisplayed) {
            setIsPasswordErrored(true)
            setErrorMessage('Не удалось проверить вход.')
        }
    }, [authCheckFailed, authCheckFailedMessageDisplayed])

    useEffect(() => {
        const handleEnterKeypress = (e: KeyboardEvent): void => {
            if (e.key == 'Enter') {
                handleRegister()
            }
        }

        document.addEventListener('keydown', handleEnterKeypress)

        return () => {
            document.removeEventListener('keydown', handleEnterKeypress)
        }
    })

    const handleRegister = (): void => {
        (async (): Promise<any> => {
            nProgress.start()
            setIsRegisterProcessing(true)

            const passwordValidationOptions: IStringValidationOptions = {
                minLength: 6,
                maxLength: 32
            }

            const usernameValidationOptions: IStringValidationOptions = {
                minLength: 3,
                maxLength: 32
            }

            const isEmailOk = validateEmail(email)
            const isPasswordOk = validateString(password, passwordValidationOptions)
            const isUsernameOk = validateString(username, usernameValidationOptions)

            setErrorMessage('')
            setIsEmailErrored(false)
            setIsUsernameErrored(false)
            setIsPasswordErrored(false)
            setIsRepeatedPasswordErrored(false)

            if (!email) {
                setErrorMessage('Укажите почту.')
                return setIsEmailErrored(true)
            }

            if (!isEmailOk) {
                setErrorMessage('Указана неправильная почта.')
                return setIsEmailErrored(true)
            }

            if (!username) {
                setErrorMessage('Укажите имя пользователя.')
                return setIsUsernameErrored(true)
            }

            if (!isUsernameOk) {
                setErrorMessage(
                    `Имя пользователя должно быть от ${usernameValidationOptions.minLength} до ` +
                    `${usernameValidationOptions.maxLength} в длину.`
                )

                return setIsPasswordErrored(true)
            }

            if (!password) {
                setErrorMessage('Укажите пароль.')
                return setIsPasswordErrored(true)
            }

            if (!isPasswordOk) {
                setErrorMessage(
                    `Пароль должен быть от ${passwordValidationOptions.minLength} до ` +
                    `${passwordValidationOptions.maxLength} в длину.`
                )

                return setIsPasswordErrored(true)
            }

            if (!repeatedPassword) {
                setErrorMessage('Повторите пароль.')
                return setIsRepeatedPasswordErrored(true)
            }

            if (password !== repeatedPassword) {
                setErrorMessage('Пароли не совпадают.')

                setIsPasswordErrored(true)
                return setIsRepeatedPasswordErrored(true)
            }

            if (!acceptedDataProcessingChange) {
                setErrorMessage('Вам необходимо согласиться на обработку персональных данных.')
                return setIsAcceptedDataProcessingErrored(true)
            }

            const responce = await fetch('/api/v1/auth/register', {
                method: 'PUT',
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    locationOrigin: location.origin
                })
            })

            if (!responce.ok) {
                setIsPasswordErrored(true)

                switch (responce.status) {
                    case 409: {
                        return setErrorMessage('Пользователь с данной почтой уже зарегестрирован.')
                    }

                    case 429: {
                        return setErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    default: {
                        return setErrorMessage('Сервер авторизации недоступен.')
                    }
                }
            }

            return router.push({
                pathname: '/login',

                query: {
                    register: true
                }
            })
        })().then(() => {
            setIsRegisterProcessing(false)
            nProgress.done()
        })
    }

    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <h4 className={styles.title}>Регистрация в {APP_NAME}</h4>

                <div className={styles.form}>
                    <div>
                        <label className={styles.label} style={{
                            color: isEmailErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Электронная почта
                        </label>

                        <input
                            className={styles.input}
                            type="email"
                            onChange={handleEmailChange}
                            style={{
                                border: isEmailErrored ? errorInputBorderStyle : defaultInputBorderStyle
                            }}
                        />
                    </div>

                    <div>
                        <label className={styles.label} style={{
                            color: isUsernameErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Имя пользователя
                        </label>

                        <input
                            className={styles.input}
                            type="text"
                            onChange={handleUsernameChange}
                            style={{
                                border: isUsernameErrored ? errorInputBorderStyle : defaultInputBorderStyle
                            }}
                        />
                    </div>

                    <div>
                        <label className={styles.label} style={{
                            color: isPasswordErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Придумайте пароль
                        </label>

                        <input
                            className={styles.input}
                            type={isPasswordVisible ? 'text' : 'password'}
                            onChange={handlePasswordChange}
                            style={{
                                border: isPasswordErrored ? errorInputBorderStyle : defaultInputBorderStyle
                            }}
                        />
                    </div>

                    <div>
                        <label className={styles.label} style={{
                            color: isRepeatedPasswordErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Повторите пароль
                        </label>

                        <input
                            className={styles.input}
                            type={isPasswordVisible ? 'text' : 'password'}
                            onChange={handleRepeatedPasswordChange}
                            style={{
                                border: isRepeatedPasswordErrored ? errorInputBorderStyle : defaultInputBorderStyle
                            }}
                        />
                    </div>

                    <div className={styles.checkboxes}>
                        <div className={styles['checkbox-container']}>
                            <input
                                type='checkbox'
                                name='showPassword'
                                id='showPassword'
                                checked={isPasswordVisible}
                                onChange={handleShowPasswordChange}
                            />

                            <label className={styles.label} htmlFor='showPassword'>
                                Показать пароли
                            </label>
                        </div>

                        <div className={styles['checkbox-container']}>
                            <input
                                type='checkbox'
                                name='acceptedPersonalDataProcessing'
                                id='acceptedPersonalDataProcessing'
                                checked={acceptedDataProcessingChange}
                                onChange={handleAcceptedDataProcessingChange}
                            />

                            <label className={styles.label} htmlFor='acceptedPersonalDataProcessing' style={{
                                color: isAcceptedDataProcessingErrored ? 'var(--error-color)' : 'white'
                            }}>
                                Соглашаюсь на обработку персональных данных
                            </label>
                        </div>
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
                                `${isRegisterProcessing ? ' ' + styles.processing : ''}`
                            }
                            onClick={isRegisterProcessing ? undefined : handleRegister}
                        >
                            {isRegisterProcessing ? 'Регистрируемся...' : 'Регистрация'}
                        </a>
                    </Link>
                </div>

                <b style={{
                    textAlign: 'center'
                }}>
                    Создавая аккаунт, вы соглашаетесь на обработку<br />
                    персональных данных.
                </b>
            </main>

            <Footer />
        </div>
    )
}

export default Page
