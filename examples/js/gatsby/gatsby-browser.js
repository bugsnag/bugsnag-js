import Bugsnag from "@bugsnag/js"
import React from "react"
import BugsnagPluginReact from '@bugsnag/plugin-react'

const bugsnagConfig = {
    // env vars prefixed with `GATSBY_` are made available to the browser
    apiKey: process.env.GATSBY_BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact()],
    appVersion: '1.2.3',
}

/**
 * With `gatsby develop` wrapRootElement is called before onClientEntry and then again afterwards.
 * However, `gatsby serve` onClientEntry is called, followed by wrapRootElement. So we need this 
 * extra state to deal with the difference in behavior.
 */
let bugsnagStarted = false

export const onClientEntry = () => {
    if (bugsnagStarted) {
        return
    }
    Bugsnag.start(bugsnagConfig)
    bugsnagStarted = true
}

export const wrapRootElement = ({ element }) => {
    if (!bugsnagStarted) {
        Bugsnag.start(bugsnagConfig)
        bugsnagStarted = true
    }

    const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)
    return (
        <ErrorBoundary FallbackComponent={FallbackComponent}>
            {element}
        </ErrorBoundary>
    )
}

const FallbackComponent = ({ clearError }) =>
  <div>
    <p>Inform users of an error in the component tree.
    Use clearError to reset ErrorBoundary state and re-render child tree.</p>
    <button onClick={clearError}>Reset</button>
  </div>