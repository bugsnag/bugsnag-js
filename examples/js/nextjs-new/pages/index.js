import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bugsnag Next.js example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Bugsnag Next.js example
        </h1>
        <h2>Client errors</h2>

        <div className={styles.grid}>
          <a href="/client/error-on-click" className={styles.card}>
            <h3>Error on click &rarr;</h3>
            <p>Trigger an error on button click</p>
          </a>

          <a href="/client/error-on-mount" className={styles.card}>
            <h3>Error on mount &rarr;</h3>
            <p>This page throws an exception on React component mount</p>
          </a>

          <a href="/client/page-level-error" className={styles.card}>
            <h3>Page-level error &rarr;</h3>
            <p>This page triggers an error in the browser outside the React lifecycle</p>
          </a>
        </div>

        <h2>SSR errors</h2>

        <div className={styles.grid}>
          <a href="/ssr/error-in-get-server-side-props" className={styles.card}>
            <h3>Error in getServerSideProps &rarr;</h3>
            <p>Throws an exception in getServerSideProps during server side rendering</p>
          </a>

          <a href="/ssr/error-in-async-get-server-side-props" className={styles.card}>
            <h3>Error in async getServerSideProps &rarr;</h3>
            <p>Promise rejection in getServerSideProps during server side rendering</p>
          </a>
        </div>
      </main>
    </div>
  )
}
