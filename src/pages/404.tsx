import { NextPage } from 'next'
import Link from 'next/link'

import style from '@/styles/404.module.css'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const styles = style as Record<
    'container' | 'main' | 'button' | 'error-message', string
>

const Page: NextPage = () => {
    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <h1>404</h1>
                <p className={styles['error-message']}>Данная страница не существует или была удалена.</p>

                <Link href={'/'}>
                    <a className={styles.button}>Вернуться на главную</a>
                </Link>
            </main>

            <Footer />
        </div>
    )
}

export default Page
