
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
          <li>API has a top-of-module Promise that rejects, but its result is not
          awaited.</li>
          <li> API has a top-of-module exception.</li>
          <li>API has has an exception in its request handler.{' '}</li>
          <li>API uses a try/catch to handle an exception and records it.{' '}</li>
        </ol>
       </div>

      </div>
    </div>
  );
}
