import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import { useCallback, useEffect, useState } from "react"
import Bugsnag, { NotifiableError } from "@bugsnag/js"

const IndexPage: React.FC<PageProps> = () => {

  useEffect(() => {
    const test = () => {
      try {
        // @ts-expect-error
        console.clog('test');
      } catch (e) {
        Bugsnag.notify(e as NotifiableError);
      }
    }; 
  
    test();
  }, []);

  const handleBadButton = useCallback(() => {
    throw new Error("bad button")
  }, [])

  const [renderBadComponent, setRenderBadComponent] = useState(false)
  const handleRenderBadComponent = useCallback(() => {
    setRenderBadComponent(true)
  }, [])

  return (
    <main>
      <button onClick={handleBadButton}>Bad button handler</button>
      <button onClick={handleRenderBadComponent}>Bad button</button>
      {renderBadComponent && <BadComponent />}
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>

function BadComponent() {
  throw new Error('this component threw an error in render')
  return <div />
}