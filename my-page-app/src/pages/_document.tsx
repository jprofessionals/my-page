import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Informasjon og verktøykasse for ansatte i JPro"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        {/*<link rel="manifest" href="/app.webmanifest" />*/}
        <link rel="manifest" href="manifest.json" />
      </Head>
      <body className="min-w-[375px]">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
