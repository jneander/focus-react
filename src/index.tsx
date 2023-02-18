import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {Focus, RegionOptions} from '@jneander/focus-dom'

import {FocusRegion} from './focus-region'

const focusContext = createContext<Focus>(null)
const {Provider} = focusContext

export function FocusProvider({children}: {children: ReactNode}) {
  const [focus] = useState(() => new Focus())

  return <Provider value={focus}>{children}</Provider>
}

export function useFocusRegion(options?: RegionOptions) {
  const focus = useContext(focusContext)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const focusRegion = useMemo(() => new FocusRegion(focus, options), [])

  /*
   * Use layout effect so that removal occurs before refs are updated.
   */
  useLayoutEffect(() => {
    return () => {
      focusRegion.remove()
    }
  }, [focusRegion])

  /*
   * Use effect after complete render so that all refs have propagated.
   */
  useEffect(() => {
    focusRegion.reconcile()
  })

  return focusRegion
}
