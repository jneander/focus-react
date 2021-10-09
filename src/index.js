import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from 'react'
import {Focus} from '@jneander/focus-dom'

import FocusRegion from './FocusRegion'

const focusContext = createContext()
const {Provider} = focusContext

export function FocusProvider({children}) {
  const [focus] = useState(() => new Focus())

  return <Provider value={focus}>{children}</Provider>
}

export function useFocusRegion(options) {
  const focus = useContext(focusContext)
  /* eslint-disable react-hooks/exhaustive-deps */
  const focusRegion = useMemo(() => new FocusRegion(focus, options), [])

  /*
   * Use layout effect so that removal occurs before refs are updated.
   */
  useLayoutEffect(() => {
    return () => {
      focusRegion.remove()
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  /*
   * Use effect after complete render so that all refs have propagated.
   */
  useEffect(() => {
    focusRegion.reconcile()
  })

  return focusRegion
}
