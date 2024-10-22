import React from "react";
import Link from "next/link";

// This component demonstrates how to manually capture an error with Bugsnag.
// The useBugsnag hook is used to capture an error when the component mounts.

export default function Home() {
  return (
    <div className="bg-inherit">
      <div className="px-20 pt-20">
        <h1 className="text-slate-600 text-3xl">BugSnag Next.js Example</h1>
        <p className="text-slate-600 py-5">
          This example demonstrates how to record exceptions in your code with
          Bugsnag. There are several scenario pages below that result in various
          kinds of unhandled and handled exceptions.
        </p>
        <div className="text-slate-600">
          <h5 className="text-2xl">API route exceptions</h5>
          <ol>
            <li>
              API has a top-of-module Promise that rejects, but its result is
              not awaited.
            </li>
            <li> API has a top-of-module exception.</li>
            <li>API has has an exception in its request handler. </li>
            <li>
              API uses a try/catch to handle an exception and records it.{" "}
            </li>
          </ol>
          <h5 className="text-2xl">SSR exceptions</h5>
          <ol>
            <li>
              SSR has a top-of-module Promise that rejects, but its result is
              not awaited.
            </li>
            <li>getServerSideProps throws an Error.</li>
            <li>getServerSideProps returns a Promise that rejects..</li>
            <li>
              getServerSideProps calls a Promise that rejects, but does not
              handle the rejection or await its result (returning
              synchronously).
            </li>
            <li>
              {" "}
              getServerSideProps manually captures an exception from a
              try/catch.{" "}
            </li>
          </ol>
          <h5 className="text-2xl">Client exceptions</h5>
          <ol>
            <li>
              There is a top-of-module Promise that rejects, but its result is
              not awaited.
            </li>
            <li>
              There is a top-of-module exception. _error.js should render.
            </li>
            <li>
              There is an exception during React lifecycle that is caught by
              Next.js's React Error Boundary. In this case, when the component
              mounts. This should cause _error.js to render.
            </li>
            <li>
              There is an unhandled Promise rejection during React lifecycle. In
              this case, when the component mounts.
            </li>
            <li>An Error is thrown from an event handler.</li>
          </ol>


          
        </div>
      </div>
    </div>
  );
}
