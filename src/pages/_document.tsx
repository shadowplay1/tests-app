import { NextPage } from 'next'
import { Html, Head, Main, NextScript } from 'next/document'

const Document: NextPage = () => {
    return (
        <Html>
            <Head>
                <link
                    href="https://use.fontawesome.com/releases/v5.0.13/css/all.css"
                    rel="stylesheet"
                />

                <link
                    href="https://unpkg.com/nprogress@0.2.0/nprogress.css"
                    rel="stylesheet"
                />

            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}

export default Document
