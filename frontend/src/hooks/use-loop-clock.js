import { useEffect, useRef, useState } from 'react'

const REDUCE_MOTION = '(prefers-reduced-motion: reduce)'

// Seconds of animation time for a looping animation, and a ref for the
// element it plays in. The clock runs only while that element is on
// screen and the tab is visible, so the page doesn't spend battery on an
// animation nobody sees. When the person has asked their device for less
// motion, it never runs and `reducedMotion` is true: show a still picture.
//   seconds        the time to draw
//   reducedMotion  true when the person prefers less motion
//   ref            put it on the animation's outer element
export function useLoopClock() {
  const ref = useRef(null)
  const [seconds, setSeconds] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.(REDUCE_MOTION).matches ?? false,
  )
  const [isOnScreen, setIsOnScreen] = useState(false)
  const [isTabVisible, setIsTabVisible] = useState(
    () => document.visibilityState === 'visible',
  )

  // Follow the reduced-motion setting if it changes while the page is open.
  useEffect(() => {
    const query = window.matchMedia?.(REDUCE_MOTION)
    if (!query) return undefined
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) {
      setIsOnScreen(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) =>
      setIsOnScreen(entry.isIntersecting),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const update = () => setIsTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const isPlaying = isOnScreen && isTabVisible && !reducedMotion

  useEffect(() => {
    if (!isPlaying) return undefined
    let frame
    let last = performance.now()
    const tick = (now) => {
      // A long gap (the tab was asleep) shouldn't make the bus jump ahead.
      const step = Math.min((now - last) / 1000, 0.1)
      last = now
      setSeconds((value) => value + step)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying])

  return { ref, seconds, reducedMotion }
}
