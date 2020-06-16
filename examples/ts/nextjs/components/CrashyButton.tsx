import * as React from 'react'
import { useState } from 'react'

export function CrashyButton(props: { children: string }) {
  const [badState, setBadState ] = useState(false);

  const doSomethingBad = React.useCallback(() => {
    setBadState(true)
  }, []);

  return (
    <button onClick={doSomethingBad}>
      {badState ? <span>{(badState as any).non.existent.property}</span> : null}
      {props.children}
    </button>
  )
}
