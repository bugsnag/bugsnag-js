import React from 'react'
import App, { Container } from 'next/app'
import Bugsnag from '../lib/bugsnag'
import Error from './_error'

const ErrorBoundary = Bugsnag.getPlugin('react')

export default class MyApp extends App {
  static async getInitialProps ({ Component, router, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  render () {
    const { Component, pageProps } = this.props

    return (
      <ErrorBoundary FallbackComponent={Error}>
        <Container>
          <Component {...pageProps} />
        </Container>
      </ErrorBoundary>
    )
  }
}
