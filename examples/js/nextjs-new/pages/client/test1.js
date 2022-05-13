// next.js executes top-level code at build time. See https://github.com/vercel/next.js/discussions/16840 for further example
// So use NEXT_PHASE to avoid this failing at build time
if (process.env.NEXT_PHASE !== "phase-production-build") {
  const doAsyncWork = () => Promise.reject(new Error('Client Test 1'))
  doAsyncWork()
}

const Test1 = () => <h1>Client Test 1</h1>

export default Test1