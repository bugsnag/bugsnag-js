import React from "react";
import logo from "./bugsnag.png";
import BugSnagSmartBearLogo from "./bugsnag-small.png";
import "./App.css";
import Button from "./components/Button";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";

// Initialize Bugsnag
Bugsnag.start({
  apiKey: "b41bf3d543e903d17300f591c4843c44",
  appVersion: "1.3.0", // Update with your app version
  releaseStage: "dev", // Set the release stage
  plugins: [new BugsnagPluginReact()],
  onError: (event: any) => {
    // Customize error handling if needed
    console.error("Bugsnag error:", event);
  },
});

function App() {
  const [state, setState] = React.useState({ yeah: true });
  const [shouldCrash, setShouldCrash] = React.useState(false);

  // Component that will crash during render
  const CrashingComponent = () => {
    if (shouldCrash) {
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
      <div className="Bad-buttons">
        <Button
          onClick={() => {
            // Simulate an error for testing
            throw new Error("Test unhandled error for Bugsnag");
          }}
        >
          Test unhandled error
        </Button>
        <Button
          onClick={() => {
            // Simulate a handled error for testing
            try {
              throw new Error("Test handled error for Bugsnag");
            } catch (error: any) {
              Bugsnag.notify(error);
            }
          }}
        >
          Test handled error
        </Button>
        <Button onClick={() => setShouldCrash(true)}>Test render error</Button>
        <Button
          onClick={() => {
            // Simulate an unhandled rejected promise
            Promise.reject(
              new Error("Test unhandled rejected promise for Bugsnag")
            );
          }}
        >
          Test rejected promise error
        </Button>
      </div>
      <CrashingComponent />
    </div>
  );
}

export default App;
