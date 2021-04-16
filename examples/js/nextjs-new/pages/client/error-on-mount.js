import { useEffect } from 'react'

const ErrorOnMount = () => {
  useEffect(() => {
    throw new Error('Error in useEffect hook on mount')
  }, [])

  return (
    <section>
      <h1>Error on mount</h1>
      <p>Error thrown in a useEffect hook on mount</p>
    </section>
    );
}

export default ErrorOnMount
