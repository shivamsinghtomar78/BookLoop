import { createContext, useContext, useSyncExternalStore } from 'react'

// Static stages settle motion parts too, even without an OS preference.
export const StillContext = createContext(false)

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const snapshot = () => window.matchMedia(QUERY).matches
const serverSnapshot = () => false

/** Whether the viewer asked for reduced motion. A stage shows its still; parts skip their tweens. */
export function useReducedMotion() {
  const still = useContext(StillContext)
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  return still || reduced
}
