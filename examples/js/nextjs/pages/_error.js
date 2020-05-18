import React from 'react'
import ErrorPage from 'next/error'
import Bugsnag from '../lib/bugsnag'

export default class Page extends React.Component {
  static async getInitialProps (ctx) {
    if (ctx.err) Bugsnag.notify(ctx.err)
    return ErrorPage.getInitialProps(ctx)
  }
  render () {
    return <ErrorPage statusCode={this.props.statusCode || '¯\\_(ツ)_/¯'} />
  }
}
