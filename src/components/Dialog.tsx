import { Fragment, useEffect, useState } from 'react'

import { DialogType, IDialogInput } from '@/types/dialog.interface'

import style from '@/styles/Dialog.module.css'

const styles = style as Record<
    'dialog' | 'content' | 'actions' |
    'overlay' | 'dialog-info' | 'submit-button' |
    'cancel-button' | 'processing', string
>

const Dialog = ({
    title, description, opened,
    dismissable, type, inputs,
    enableTogglingKeypresses,
    confirmButtonName,
    cancelButtonName,
    className,
    onClose, children
}: IDialogProps): JSX.Element => {
    const [isOpen, setIsOpen] = useState<boolean>(opened)

    useEffect(() => {
        setIsOpen(opened)

        opened
            ? document.body.classList.add('dialog-opened')
            : document.body.classList.remove('dialog-opened')

        const handleKeypress = (e: KeyboardEvent): void => {
            if (enableTogglingKeypresses) {
                if (e.key == 'Enter') {
                    handleClose(true, inputs)
                }

                if (e.key == 'Escape') {
                    handleClose(false, {})
                }

                document.addEventListener('keydown', handleKeypress)
            }
        }


        if (enableTogglingKeypresses) {
            return () => {
                document.removeEventListener('keydown', handleKeypress)
            }
        }
    }, [opened])

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

    const descriptionLines = description.split('\n')

    const descriptionWithLineBreaks = descriptionLines
        .map((line, index) =>
            <Fragment key={index}>
                {parseMarkdown([<>{line}</>])}
                <br />
            </Fragment>
        )


    const getConfirmationButtons = (): JSX.Element => {
        switch (type) {
            case DialogType.INFO:
                return (
                    <a className={styles['submit-button']} onClick={(): void => handleClose(true, inputs)}>
                        {cancelButtonName || 'ОК'}
                    </a>
                )

            case DialogType.QUESTION:
                return (
                    <>
                        <a className={styles['submit-button']} onClick={(): void => handleClose(true, inputs)}>
                            {confirmButtonName || 'Да'}
                        </a>
                        <a className={styles['cancel-button']} onClick={(): void => handleClose(false, {})}>
                            {cancelButtonName || 'Нет'}
                        </a>
                    </>
                )

            case DialogType.SUBMIT:
                return (
                    <a className={styles['submit-button']} onClick={(): void => handleClose(true, inputs)}>
                        {confirmButtonName || 'Отправить'}
                    </a>
                )

            case DialogType.SUBMIT_WITH_CANCEL:
                return (
                    <>
                        <a className={styles['submit-button']} onClick={(): void => handleClose(true, inputs)}>
                            {confirmButtonName || 'Отправить'}
                        </a>

                        <a className={styles['cancel-button']} onClick={(): void => handleClose(false, {})}>
                            {cancelButtonName || 'Отмена'}
                        </a>
                    </>
                )

            case DialogType.NONE:
                return (
                    <></>
                )
        }
    }

    const handleClose = (confirmed: boolean, inputs?: IDialogInput): void => {
        if (onClose) {
            const handlingResult = onClose(confirmed, inputs || {})
            const result = handlingResult == undefined ? true : handlingResult

            if (result || !confirmed) {
                setIsOpen(false)
            }
        } else {
            setIsOpen(false)
        }
    }

    return (
        <>
            {isOpen && (
                <div className={`${styles.dialog}${className ? ' ' + className : ''}`}>
                    <div className={styles.content}>
                        <div className={styles['dialog-info']}>
                            <div>
                                <h2>{title}</h2>
                                {description ? <p>{descriptionWithLineBreaks}</p> : <></>}
                            </div>
                        </div>

                        {children}

                        <div className={styles.actions}>
                            {getConfirmationButtons()}
                        </div>
                    </div>

                    <div className={styles.overlay} onClick={
                        dismissable ? (): void => handleClose(false, {}) : undefined
                    } />
                </div>
            )}
        </>
    )
}

export default Dialog

interface IDialogProps {
    title: string
    description: string
    opened: boolean
    dismissable: boolean
    type: DialogType
    enableTogglingKeypresses?: boolean
    className?: string
    confirmButtonName?: string
    cancelButtonName?: string
    inputs?: IDialogInput
    onClose?: (confirmed: boolean, dialogUserInput: IDialogInput) => boolean
    children?: React.ReactNode
}
