import { NextPage } from 'next'
import Link from 'next/link'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

import { APP_NAME } from '@/lib/misc/constants'
import { FontAwesomeIcon } from '@/lib/misc/utilityTypes'

import style from '@/styles/Home.module.css'

const styles = style as Record<
    'container' | 'main' | 'upper' |
    'start-button' | 'feature' | 'features' |
    'bottom' | 'title' | 'upper-text' |
    'start-buttons', string
>

interface IAppFeature {
    icon: FontAwesomeIcon
    title: string
    description: string
}

const appFeatures: IAppFeature[] = [{
    icon: 'fas fa-user-graduate fa-3x',
    title: 'Кастомизация',
    description: 'С лёгкостью создавайте тесты, подходящие под ваши нужды: ' +
        'будь это вопросы с несколькими вариантами ответа, ' +
        'со множественным выбором или письменные вопросы.'
}, {
    icon: 'fas fa-laptop fa-3x',
    title: 'Легко использовать',
    description: `Платформа ${APP_NAME} была создана с упором на простоту в использовании. ` +
        'Вам не нужно быть техническим специалистом, ' +
        'чтобы использовать наш сервис.'
}, {
    icon: 'fas fa-clock fa-3x',
    title: 'Экономит время',
    description: 'С нашей платформой вы можете создавать и редактировать тесты ' +
        'в кратчайшие сроки по сравнению с традиционными методами.'
}]


const Page: NextPage = () => {
    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <div className={styles.upper}>
                    <div className={styles['upper-text']}>
                        <h1 className={styles.title}>
                            Работайте с тестами легко!
                        </h1>
                        <p>
                            Платформа {APP_NAME} была создана, чтобы помогать учителям
                            создавать любые тесты на любую тему легко и быстро!
                            <br />
                            Попробуйте наш сервис уже сегодня!
                        </p>
                    </div>

                    <div className={styles['start-buttons']}>
                        <Link href="/login?redirectTo=/tests/create">
                            <a className={styles['start-button']}>Приступить</a>
                        </Link>

                        <Link href="/tests/library">
                            <a className={styles['start-button']}>Библиотека тестов</a>
                        </Link>
                    </div>
                </div>

                <div className={styles.features}>
                    {appFeatures.map((appFeature, index) => (
                        <div className={styles.feature} key={index}>
                            <i className={appFeature.icon} />
                            <h3>{appFeature.title}</h3>
                            <p>{appFeature.description}</p>
                        </div>
                    ))}
                </div>

                <div className={styles.bottom}>
                    <h2>Готовы начинать?</h2>

                    <Link href="/login?redirectTo=/tests/create">
                        <a className={styles['start-button']}>Создать тест</a>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Page
