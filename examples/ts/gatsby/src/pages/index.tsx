import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import '../styles/index.css'
import BadButtons from "../components/BadButtons"


Bugsnag.start({
  apiKey: 'a69bc1beea0f2e34bbb83c40f9775bc3',
  plugins: [new BugsnagPluginReact()],
})

const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React)
interface ErrorViewProps {
  clearError(): void;
}

const ErrorView = ({ clearError }: ErrorViewProps) =>
  <div>
    <h2>Custom error screen</h2>
    <p>Inform users of an error in the component tree.</p>
    <button onClick={clearError}>Reset</button>
  </div>


const IndexPage = () => {
  return (
    <main>
      <h1>Gatsby example app with BugSnag</h1>
      <p>Send some errors by clicking below. The render error will be caught by BugSnag's error boundary and display a custom error screen.</p>
      <div className="btn-group">
        <BadButtons/>
      </div>
    </main>
  )
}

export default () =>
  <ErrorBoundary FallbackComponent={ErrorView}>
    <IndexPage />
  </ErrorBoundary>


export const Head: HeadFC = () => <title>Home Page</title>
