import React from "react";
import logo from "./bugsnag.png";
import BugSnagSmartBearLogo from "./bugsnag-small.png";
import "./App.css";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import ErrorActionButtons from "./components/ErrorActionButtons";

// Initialize Bugsnag
Bugsnag.start({
  apiKey: "your-api-key-here", // Replace with your Bugsnag API key
  appVersion: "1.0.0", // Update with your app version
  releaseStage: "dev", // Set the release stage
  plugins: [new BugsnagPluginReact()],
  onError: (event: any) => {
    // Customize error handling if needed
    console.error("Bugsnag error:", event);
  },
});

const ErrorBoundary = Bugsnag.getPlugin("react")!.createErrorBoundary(React);

function App() {
  const [shouldCrash, setShouldCrash] = React.useState(false);

  const ErrorFallback: React.FC<{
    error: Error;
    clearError: () => void;
  }> = ({ error, clearError }) => (
    <div className="Error-fallback">
      <p>Something went wrong while rendering the crash demo component.</p>
      <pre className="Error-fallback__message">{error.message}</pre>
      <button
        type="button"
        onClick={() => {
          setShouldCrash(false);
          clearError();
        }}
      >
        Try again
      </button>
    </div>
  );

  // Component that will crash during render
  const CrashingComponent = () => {
    if (shouldCrash) {
      Bugsnag.leaveBreadcrumb("CrashingComponent is about to crash");
      // This will cause a render error
      throw new Error("Intentional render error for Bugsnag testing");
    }
    return (
      <div>
        <p>Example component for render error testing is working fine</p>
        <img
          src={BugSnagSmartBearLogo}
          className="App-logo"
          alt="logo"
          style={{ height: 50 }}
        />
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="BugSnag app logo" />
        <p>BugSnag React example app.</p>
        <a
          className="App-link"
          href="https://docs.bugsnag.com/platforms/javascript/react/"
          target="_blank"
          rel="noopener noreferrer"
        >
          React integration documentation
        </a>
      </header>
      <ErrorActionButtons onTriggerRenderError={() => setShouldCrash(true)} />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <CrashingComponent />
      </ErrorBoundary>
    </div>
  );
}

export default App;
