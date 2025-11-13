import React from "react";
import Bugsnag from "@bugsnag/js";
import Button from "./Button";

type ErrorActionButtonsProps = {
  onTriggerRenderError: () => void;
};

const ErrorActionButtons: React.FC<ErrorActionButtonsProps> = ({
  onTriggerRenderError,
}) => {
  return (
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
      <Button onClick={onTriggerRenderError}>Test render error</Button>
      <Button
        onClick={() => {
          const rejectionError = new Error(
            "Test unhandled rejected promise for Bugsnag"
          );

          // Keep the rejection unhandled to surface it in Bugsnag
          Promise.reject(rejectionError);
        }}
      >
        Test rejected promise error
      </Button>
    </div>
  );
};

export default ErrorActionButtons;
