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

import Dialog from '@/components/Dialog'
import { DialogType } from '@/types/dialog.interface'

import { IResponceBody } from '@/lib/json'
import { IUserLoginPayload } from '@/types/payload.interface'

import style from '@/styles/Form.module.css'

const styles = style as Record<
    'container' | 'form' | 'title' |
    'input' | 'label' | 'button' |
    'link' | 'error' | 'main' |
    'notice' | 'checkbox-container' | 'checkboxes' |
    'processing', string
>

const Page: NextPage = () => {
    const router = useRouter()

    const [redirectTo, setRedirectTo] = useState<string>('')
    const [register, setRegister] = useState<boolean>(false)
    const [authCheckFailed, setAuthCheckFailed] = useState<boolean>(false)

    useEffect(() => {
        const { redirectTo, register, authCheckFailed } = router.query

        setRedirectTo(redirectTo as string || '')
        setRegister(register === 'true')
        setAuthCheckFailed(authCheckFailed === 'true')
    }, [router.query])

    const defaultInputBorderStyle = getBorderStyle(3, 'var(--default-input-border-color)')
    const errorInputBorderStyle = getBorderStyle(3, 'var(--error-color)')

    const [email, setEmail] = useState<string>('')
    const [isEmailErrored, setIsEmailErrored] = useState<boolean>(false)

    const [password, setPassword] = useState<string>('')
    const [isPasswordErrored, setIsPasswordErrored] = useState<boolean>(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)

    const [rememberMe, setRememberMe] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')

    const [notice, setNotice] = useState<string>('')
    const [noticeDisplayed, setNoticeDisplayed] = useState<boolean>(false)

    const [authCheckFailedMessageDisplayed, setAuthCheckFailedMessageDisplayed] = useState<boolean>(false)
    const [isLoginChecked, setIsLoginChecked] = useState<boolean>(false)

    const [isLoginProcessing, setIsLoginProcessing] = useState<boolean>(false)


    // fields
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value)
    }


    // checkboxes
    const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRememberMe(e.target.checked)
    }

    const handleShowPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setIsPasswordVisible(e.target.checked)
    }


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken')

            const handleRedirect = (): any => {
                if (redirectTo) {
                    if (redirectTo.includes('login')) {
                        return router.push({
                            pathname: '/login',
                        })
                    }

                    const query: {
                        [key: string]: string
                    } = {}

                    const queryParams = new URLSearchParams(new URL(location.origin + redirectTo).search)

                    for (const [key, value] of queryParams.entries()) {
                        query[key] = value
                    }

                    return router.push({
                        pathname: `/${redirectTo.split('?')[0]}`,
                        query
                    })
                }

                return router.push({
                    pathname: '/tests/manage',
                })
            }

            if (accessToken) {
                (async (): Promise<any> => {
                    const accessToken = localStorage.getItem('accessToken')
                    const authResponce = await fetch(`/api/v1/auth/verify?token=${accessToken}`)

                    setIsLoginChecked(true)

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
    }, [isLoginChecked])

    useEffect(() => {
        const wasNoticeDisplayed = localStorage.getItem('wasNoticeDisplayed')
        setNoticeDisplayed(register)

        if (register && noticeDisplayed && wasNoticeDisplayed !== 'true') {
            setNotice(
                'Аккаунт создан. Пожалуйста, активируйте аккаунт, пройдя по ссылке, ' +
                'отправленной вам в письме на указанную при регистрации электронную почту. ' +
                'Если письма нет, проверьте папку "Спам", а так же убедитесь в правильности ' +
                'написание адреса вашего почтового ящика. После активации вы сможете войти в свой аккаунт.'
            )

            localStorage.setItem('wasNoticeDisplayed', 'true')
        }
    }, [register, noticeDisplayed])

    useEffect(() => {
        if (redirectTo) {
            setNotice(
                'Вы будете автоматически перенаправлены на запрашиваемую страницу сразу после входа в свой аккаунт.'
            )
        }
    }, [redirectTo])

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
                handleLogin()
            }
        }

        document.addEventListener('keydown', handleEnterKeypress)

        return () => {
            document.removeEventListener('keydown', handleEnterKeypress)
        }
    })

    const handleLogin = (): void => {
        (async (): Promise<any> => {
            nProgress.start()
            setIsLoginProcessing(true)

            const passwordValidationOptions: IStringValidationOptions = {
                minLength: 6,
                maxLength: 32
            }

            const isEmailOk = validateEmail(email)
            const isPasswordOk = validateString(password, passwordValidationOptions)

            setNotice('')
            setErrorMessage('')
            setIsEmailErrored(false)
            setIsPasswordErrored(false)

            if (!email) {
                setErrorMessage('Укажите почту.')
                return setIsEmailErrored(true)
            }

            if (!isEmailOk) {
                setErrorMessage('Указана неправильная почта.')
                return setIsEmailErrored(true)
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

            const responce = await fetch('/api/v1/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            })

            if (!responce.ok) {
                setIsPasswordErrored(true)

                switch (responce.status) {
                    case 403: {
                        return setErrorMessage('Неверные данные для входа.')
                    }

                    case 406: {
                        return setErrorMessage('Аккаунт не активирован.')
                    }

                    case 429: {
                        return setErrorMessage('Вы отправляете слишком много запросов.')
                    }

                    default:
                        return setErrorMessage('Сервер авторизации недоступен.')
                }
            }

            const result: IResponceBody<{
                accessToken: string
                payload: IUserLoginPayload
            }> = await responce.json()

            localStorage.setItem('accessToken', result.data.accessToken)
            localStorage.setItem('user', JSON.stringify(result.data.payload))

            if (redirectTo) {
                const query: {
                    [key: string]: string
                } = {}

                const queryParams = new URLSearchParams(new URL(location.origin + redirectTo).search)

                for (const [key, value] of queryParams.entries()) {
                    query[key] = value
                }

                return router.push({
                    pathname: `${(redirectTo.startsWith('/') ? redirectTo : '/' + redirectTo).split('?')[0]}`,
                    query
                })
            }

            return router.push({
                pathname: '/tests/manage',
            })
        })().then(() => {
            setIsLoginProcessing(false)
            nProgress.done()
        })
    }

    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <h4 className={styles.title}>Вход в {APP_NAME}</h4>

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
                            color: isPasswordErrored ? 'var(--error-color)' : 'white'
                        }}>
                            Пароль
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
                                Показать пароль
                            </label>
                        </div>

                        <div className={styles['checkbox-container']}>
                            <input
                                type='checkbox'
                                name='remember'
                                id='remember'
                                checked={rememberMe}
                                onChange={handleRememberMeChange}
                            />

                            <label className={styles.label} htmlFor='remember'>
                                Запомнить меня
                            </label>
                        </div>
                    </div>

                    {notice && register && noticeDisplayed && (
                        <Dialog
                            title='Спасибо за регистрацию!'
                            description={notice}
                            opened={register && noticeDisplayed}
                            dismissable={false}
                            type={DialogType.INFO}
                        />
                    )}

                    <div
                        className={styles.notice}
                        style={{ display: notice ? 'block' : 'none' }}
                    >
                        <p style={{ marginTop: notice.length < 100 ? 15 : 0 }}>{notice}</p>
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
                                `${styles.button}${isLoginProcessing ? ' ' + styles.processing : ''}`
                            }
                            onClick={isLoginProcessing ? undefined : handleLogin}
                        >
                            {isLoginProcessing ? 'Входим...' : 'Вход'}
                        </a>
                    </Link>
                </div>

                <div style={{
                    textAlign: 'center'
                }}>
                    <Link href="/requestPasswordReset">
                        <a className={styles.link}>Забыли пароль?</a>
                    </Link><br />
                    Нет аккаунта?{' '}

                    <Link href="/register">
                        <a className={styles.link}>Зарегистрируйтесь</a>
                    </Link>.
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Page
