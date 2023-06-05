import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useState, useEffect, useRef } from 'react'
import nProgress from 'nprogress'

import Dialog from '@/components/Dialog'
import { DialogType } from '@/types/dialog.interface'

import { IResponceBody } from '@/lib/json'


const Page: NextPage = () => {
    const router = useRouter()

    const [dialogTitle, setDialogTitle] = useState<string>('')
    const [dialogDescription, setDialogDescription] = useState<string>('')

    const [isLoading, setIsLoading] = useState<boolean | null>(null)
    const [isErrored, setIsErrored] = useState<boolean>(false)

    const isVerificationProcessStarted = useRef<boolean>(false)


    const handleClose = (): any => {
        router.push({
            pathname: '/login'
        })
    }

    const verifyAccount = async (): Promise<any> => {
        try {
            const token = new URLSearchParams(location.search).get('token')

            nProgress.start()
            setIsLoading(true)

            const response = await fetch(
                '/api/v1/auth/verification/verifyEmail' +
                `?token=${token}&locationOrigin=${encodeURIComponent(location.origin)}`
            )

            if (!response.ok) {
                setIsErrored(true)
                setDialogTitle('Ошибка')
            }

            const data: IResponceBody<any> = await response.json()

            if (!dialogTitle) {
                data.status
                    ? setDialogTitle('Активация аккаунта')
                    : setDialogTitle('Ошибка')
            }

            if (!isErrored) {
                isErrored
                    ? setDialogDescription('Не удалось активировать аккаунт.')
                    : data.status
                        ? setDialogDescription('Аккаунт успешно активирован!')
                        : setDialogDescription('Недействительная ссылка активации аккаунта.')
            }

        } catch (err: any) {
            setIsErrored(true)
            console.warn(`Failed to request the account verification:\n\n${err}`)
        } finally {
            setIsLoading(false)
            nProgress.done()
        }
    }

    useEffect(() => {
        if (!isVerificationProcessStarted.current) {
            isVerificationProcessStarted.current = true
            verifyAccount()
        }
    }, [])

    return (
        <>
            <Dialog
                opened={true}
                title={isLoading ? 'Один момент...' : dialogTitle}
                description={isLoading ? 'Активируем ваш аккаунт...' : dialogDescription}
                dismissable={false}
                type={isLoading ? DialogType.NONE : DialogType.INFO}
                onClose={handleClose}
            />
        </>
    )
}

export default Page
