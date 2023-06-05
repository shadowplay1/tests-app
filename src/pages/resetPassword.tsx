import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useState, useEffect, useRef } from 'react'
import nProgress from 'nprogress'

import Dialog from '@/components/Dialog'
import { DialogType } from '@/types/dialog.interface'

import { IResponceBody } from '@/lib/json'

import style from '@/styles/Form.module.css'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { getBorderStyle } from '@/lib/misc/clientUtilityFunctions'
import Link from 'next/link'
import { IStringValidationOptions, validateString } from '@/lib/validators'

const styles = style as Record<
    'container' | 'form' | 'title' |
    'input' | 'label' | 'button' |
    'link' | 'error' | 'main' |
    'notice' | 'checkbox-container' | 'checkboxes' |
    'processing', string
>

const Page: NextPage = () => {
    const router = useRouter()

    const defaultInputBorderStyle = getBorderStyle(3, 'var(--default-input-border-color)')
    const errorInputBorderStyle = getBorderStyle(3, 'var(--error-color)')

    const [token, setToken] = useState<string | null>(null)
    const [isTokenCheckLoading, setIsTokenCheckLoading] = useState<boolean | null>(null)

    const [tokenCheckResult, setTokenCheckResult] = useState<boolean | null>(null)
    const [isTokenCheckErrored, setIsTokenCheckErrored] = useState<boolean>(false)

    const [password, setPassword] = useState<string>('')
    const [isPasswordErrored, setIsPasswordErrored] = useState<boolean>(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)

    const [repeatedPassword, setRepeatedPassword] = useState<string>('')
    const [isRepeatedPasswordErrored, setIsRepeatedPasswordErrored] = useState<boolean>(false)

    const [errorMessage, setErrorMessage] = useState<string>('')
    const [isPasswordResetProcessing, setIsPasswordResetProcessing] = useState<boolean>(false)

    const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
    const isVerifyProcessStarted = useRef<boolean>(false)


    // fields
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value)
    }

    const handleRepeatedPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRepeatedPassword(e.target.value)
    }


    // checkboxes
    const handleShowPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setIsPasswordVisible(e.target.checked)
    }

    useEffect(() => {
        const handleEnterKeypress = (e: KeyboardEvent): void => {
            if (e.key == 'Enter') {
                handlePasswordReset()
            }
        }

        document.addEventListener('keydown', handleEnterKeypress)

        return () => {
            document.removeEventListener('keydown', handleEnterKeypress)
        }
    })



    const handeVerifyPasswordReset = async (token: string): Promise<any> => {
        try {
            nProgress.start()
            setIsTokenCheckLoading(true)

            const response = await fetch(`/api/v1/auth/verification/verifyPasswordReset?token=${token}`)

            if (!response.ok && response.status >= 500) {
                return setIsTokenCheckErrored(true)
            }

            const result: IResponceBody<any> = await response.json()
            setTokenCheckResult(result.status)
        } catch (err: any) {
            setIsTokenCheckErrored(true)
            console.warn(`Failed to request the account verification:\n\n${err}`)
        } finally {
            setIsTokenCheckLoading(false)
            nProgress.done()
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!isVerifyProcessStarted.current) {
                const token = new URLSearchParams(location.search).get('token')

                setToken(token)

                isVerifyProcessStarted.current = true
                handeVerifyPasswordReset(token as string)
            }
        }
    }, [])

    const resetPassword = async (): Promise<any> => {
        nProgress.start()
        setIsPasswordResetProcessing(true)

        setErrorMessage('')
        setIsPasswordErrored(false)
        setIsRepeatedPasswordErrored(false)

        const passwordValidationOptions: IStringValidationOptions = {
            minLength: 6,
            maxLength: 32
        }

        const isPasswordOk = validateString(password, passwordValidationOptions)

        if (!password) {
            setErrorMessage('Укажите новый пароль.')
            return setIsPasswordErrored(true)
        }

        if (!isPasswordOk) {
            setErrorMessage(
                `Новый пароль должен быть от ${passwordValidationOptions.minLength} до ` +
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
            return setIsRepeatedPasswordErrored(true)
        }

        setIsPasswordResetProcessing(true)

        const verifyTokenResponse = await fetch(`/api/v1/auth/verification/verifyPasswordReset?token=${token}`)

        if (!verifyTokenResponse.ok && verifyTokenResponse.status >= 500) {
            return setIsTokenCheckErrored(true)
        }

        const verifyTokenResult: IResponceBody<any> = await verifyTokenResponse.json()

        if (!verifyTokenResult.status) {
            return setTokenCheckResult(false)
        }

        const responce = await fetch('api/v1/auth/password/reset', {
            method: 'PATCH',
            body: JSON.stringify({
                newPassword: password,
                passwordResetToken: token,
                userAgent: navigator.userAgent
            })
        })

        if (!responce.ok) {
            setIsRepeatedPasswordErrored(true)

            switch (responce.status) {
                case 406: {
                    return setErrorMessage('Новый пароль должен отличаться от старого.')
                }

                case 429: {
                    return setErrorMessage('Вы отправляете слишком много запросов.')
                }

                default: {
                    return setErrorMessage('Не удалось выполнить сброс пароля.')
                }
            }
        }

        return setIsSubmitted(true)
    }

    const handlePasswordReset = (): any => {
        resetPassword().then(() => {
            setIsPasswordResetProcessing(false)
            nProgress.done()
        })
    }

    return (
        <>
            {!isTokenCheckLoading && tokenCheckResult && !isTokenCheckErrored &&
                <div className={styles.container}>
                    <Navbar />

                    <main className={styles.main}>
                        <h4 className={styles.title}>Сброс пароля</h4>

                        <div>
                            <label className={styles.label} style={{
                                color: isPasswordErrored ? 'var(--error-color)' : 'white'
                            }}>
                                Новый пароль
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
                                    `${styles.button}${isPasswordResetProcessing ? ' ' + styles.processing : ''}`
                                }
                                onClick={isPasswordResetProcessing ? undefined : handlePasswordReset}
                            >
                                {isPasswordResetProcessing ? 'Выполняем сброс...' : 'Сбросить пароль'}
                            </a>
                        </Link>
                    </main>

                    <Footer />
                </div>
            }

            {/* if token check failed */}
            <Dialog
                opened={!isTokenCheckLoading && (tokenCheckResult == false || isTokenCheckErrored)}
                title='Ошибка'
                description={
                    isTokenCheckErrored
                        ? 'Не удалось проверить ссылку сброса пароля.'
                        : tokenCheckResult ? 'ok' : 'Недействительная ссылка сброса пароля.'
                }
                dismissable={false}
                type={DialogType.INFO}
                onClose={(): any => {
                    router.push({
                        pathname: '/login'
                    })
                }}
            />

            {/* if password reset submitted */}
            <Dialog
                opened={isSubmitted}
                title='Сброс пароля'
                description={
                    'Пароль был успешно изменён! Теперь вы можете выполнить вход в свой аккаунт, ' +
                    'используя новый пароль.'
                }
                dismissable={false}
                type={DialogType.INFO}
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
