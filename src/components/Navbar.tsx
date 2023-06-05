import { NextPage } from 'next'
import { useEffect, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { IUserLoginPayload } from '@/types/payload.interface'
import { handleError } from '@/utils/handleError.util'

import { ILink } from '@/types/link.interface'
import { APP_NAME } from '@/lib/misc/constants'

import style from '@/styles/Navbar.module.css'

const styles = style as Record<
    'header' | 'logo' | 'menu-toggle' |
    'nav' | 'nav-links' | 'logout-button' |
    'app-name' | 'active', string
>

const Navbar: NextPage = () => {
    const [showMenu, setShowMenu] = useState(false)

    const handleMenuToggle = (): void => {
        setShowMenu(!showMenu)
    }

    const hideMenu = (): void => {
        setShowMenu(false)
    }

    const [links, setLinks] = useState<ILink[]>([])

    useEffect(() => {
        (async (): Promise<any> => {
            const accessToken = localStorage.getItem('accessToken')

            const rawUser = await handleError<IUserLoginPayload>(
                () => JSON.parse(localStorage.getItem('user') as string)
            )

            const user = rawUser.result || {}

            if (accessToken) {
                setLinks(
                    [{
                        name: user.username,
                        href: '#',
                        icon: 'fas fa-user',
                        style: {
                            cursor: 'default'
                        }
                    }, {
                        name: 'Библиотека',
                        icon: 'fas fa-book',
                        href: '/tests/library'
                    }, {
                        name: 'Настройки аккаунта',
                        icon: 'fas fa-shield-alt',
                        href: '/account'
                    }, {
                        name: 'Управление тестами',
                        icon: 'fas fa-cog',
                        href: '/tests/manage'
                    }, {
                        name: 'Выход',
                        icon: 'fas fa-door-open',
                        href: '/logout',
                        className: styles['logout-button']
                    }]
                )
            } else {
                setLinks(
                    [{
                        name: 'Библиотека',
                        icon: 'fas fa-book',
                        href: '/tests/library'
                    }, {
                        name: 'Вход',
                        icon: 'fas fa-sign-in-alt',
                        href: '/login'
                    }, {
                        name: 'Регистрация',
                        icon: 'fas fa-user-plus',
                        href: '/register'
                    }]
                )
            }
        })()
    }, [])

    return (
        <header>
            <nav className={styles.nav}>
                <div className={styles.logo}>
                    <Link href="/">
                        <Image
                            src="/tester.svg"
                            alt="logo"
                            height={30}
                            width={30}
                        />
                    </Link>
                </div>

                <div className={styles['app-name']}>
                    <Link href="/">{APP_NAME}</Link>
                </div>

                <button className={styles['menu-toggle']} onClick={handleMenuToggle}>
                    <i className={showMenu ? 'fas fa-times' : 'fas fa-bars'} />
                </button>

                <div className={`${styles['nav-links']} ${showMenu ? styles.active : ''}`}>
                    <ul onClick={hideMenu}>
                        {links.map((link, index) =>
                            <li key={index}>
                                <Link href={link.href}>
                                    {link.className
                                        ? (
                                            <a className={link.className} style={link.style}>
                                                <i className={link.icon} />
                                                {link.name}
                                            </a>
                                        )
                                        : (
                                            <a style={link.style}>
                                                <i className={link.icon} />
                                                {link.name}
                                            </a>
                                        )
                                    }
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>
        </header>
    )
}

export default Navbar
