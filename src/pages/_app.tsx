import Head from 'next/head'
import Script from 'next/script'

import Router from 'next/router'
import NProgress from 'nprogress'

import { AppProps } from 'next/app'

import { databaseConnect } from '@/lib/db'

import 'nprogress/nprogress.css'
import '@/styles/globals.css'

import { APP_DESCRIPTION, APP_KEYWORDS, APP_NAME } from '@/lib/misc/constants'
import { useEffect } from 'react'


function App({ Component, pageProps }: AppProps): JSX.Element {
    databaseConnect()

    useEffect(() => {
        const startProgressBar = (): any => NProgress.start()
        const stopProgressBar = (): any => NProgress.done()

        Router.events.on('routeChangeStart', startProgressBar)
        Router.events.on('routeChangeComplete', stopProgressBar)
        Router.events.on('routeChangeError', stopProgressBar)

        return () => {
            Router.events.off('routeChangeStart', startProgressBar)
            Router.events.off('routeChangeComplete', stopProgressBar)
            Router.events.off('routeChangeError', stopProgressBar)
        }
    }, [])

    return (
        <>
            <Head>
                <title>{APP_NAME}</title>

                <link rel="icon" href="/favicon.ico" />
                <link rel="shortcut icon" href="/favicon.ico" />

                <meta name="description" content={APP_DESCRIPTION} />

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                    charSet="UTF-8"
                />

                <meta httpEquiv="Content-Type" content="text/html charset=UTF-8" />

                <meta property="og:title" content={APP_NAME} />
                <meta property="og:description" content={APP_DESCRIPTION} />
                <meta property="og:image" content="/tester.svg" />

                <meta name="keywords" content={APP_KEYWORDS.join(', ')} />
                <meta name="theme-color" content="#34eb43" />
            </Head>

            <noscript>
                <b>
                    Для полноценной работы данного сайта необходим включенный JavaScript.<br />
                    Пожалуйста, включите его в настройках своего браузера и обновите страницу.
                </b>
            </noscript>

            <Script src="https://unpkg.com/nprogress@0.2.0/nprogress.js" />
            <Component {...pageProps} />
        </>
    )
}

export default App
