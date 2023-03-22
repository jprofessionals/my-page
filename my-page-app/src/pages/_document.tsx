import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
          <link rel="icon" href="%PUBLIC_URL%/Favicon.png"/>
          <meta name="theme-color" content="#000000"/>
          <meta
              name="description"
              content="Informasjon og verktøykasse for ansatte i JPro"
          />
          <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png"/>
          <link rel="manifest" href="%PUBLIC_URL%/manifest.json"/>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
