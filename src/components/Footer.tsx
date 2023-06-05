import { NextPage } from 'next'
import Link from 'next/link'

import { APP_DESCRIPTION, APP_NAME } from '@/lib/misc/constants'
import { ILink } from '@/types/link.interface'

import style from '@/styles/Footer.module.css'
const styles = style as Record<'footer' | 'container' | 'column' | 'bottom', string>

interface IFooterColumn {
    title: string
    text?: string
    links?: Omit<ILink, 'icon'>[]
}

const footerColumns: IFooterColumn[] = [{
    title: 'О нас',
    text: APP_DESCRIPTION
}, {
    title: 'Контакты',
    links: [{
        name: 'Электронная почта',
        href: 'mailto:georgy.botov@yandex.ru'
    }]
}, {
    title: 'Сервисы',
    links: [{
        name: 'Создать тест',
        href: '/tests/create'
    }, {
        name: 'Управлять тестами',
        href: '/tests/manage'
    }, {
        name: 'Библиотека тестов',
        href: '/tests/library'
    }]
}]

const Footer: NextPage = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {footerColumns.map((footerColumn, index) => (
                    <div className={styles.column} key={index}>
                        <h3>{footerColumn.title}</h3>

                        {footerColumn.text
                            ? <p>{footerColumn.text}</p>
                            : null}

                        {footerColumn.links ? (
                            <ul>
                                {footerColumn.links.map((link, index) => (
                                    <li key={index}>
                                        <Link href={link.href}>
                                            {link.className
                                                ? <a className={link.className}>{link.name}</a>
                                                : <a>{link.name}</a>
                                            }
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )
                            : null}
                    </div>
                ))}
            </div>

            <div className={styles.bottom}>
                <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
                <p>Все права защищены.</p>
            </div>
        </footer>
    )
}

export default Footer
