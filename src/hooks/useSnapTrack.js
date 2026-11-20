import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// How long the scrolling has to stand still before the photo in view is taken as the current one.
const SETTLE_MS = 100

// A horizontal scroll-snap track with one full-width slide per photo. The browser does the swiping; this keeps the
// index in step with it and lets arrows, thumbnails and keys move the track.
export function useSnapTrack(count, startIndex = 0) {
  const trackRef = useRef(null)
  const [rawIndex, setRawIndex] = useState(startIndex)
  const last = Math.max(count - 1, 0)
  const clamp = value => Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), last)
  const index = clamp(rawIndex)

  // The latest values for handlers that outlive a render (resize, scroll timers).
  const latest = useRef({ index, last })
  latest.current = { index, last }
  const timer = useRef(null)

  const scrollToIndex = useCallback((target, behavior) => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    if (behavior === 'instant') track.scrollLeft = target * track.clientWidth
    else track.scrollTo?.({ left: target * track.clientWidth, behavior })
  }, [])

  const goTo = useCallback((target, behavior = 'smooth') => {
    const next = Math.min(Math.max(Number.isFinite(target) ? target : 0, 0), latest.current.last)
    setRawIndex(next)
    scrollToIndex(next, behavior)
  }, [scrollToIndex])

  const next = useCallback(() => goTo(latest.current.index + 1), [goTo])
  const prev = useCallback(() => goTo(latest.current.index - 1), [goTo])

  const onScroll = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const track = trackRef.current
      if (!track || !track.clientWidth) return
      const settled = Math.round(track.scrollLeft / track.clientWidth)
      setRawIndex(Math.min(Math.max(settled, 0), latest.current.last))
    }, SETTLE_MS)
  }, [])

  // Open on the requested photo without animating, and whenever the number of photos changes (a different car, photos
  // gone and back) bring the stored index and the scroll position back in step with the index that is shown.
  useLayoutEffect(() => {
    setRawIndex(index)
    scrollToIndex(index, 'instant')
  }, [count]) // runs when the number of photos changes, not on every index change

  // A rotated phone or a resized window changes the slide width: keep the same photo aligned.
  useEffect(() => {
    const realign = () => scrollToIndex(latest.current.index, 'instant')
    window.addEventListener('resize', realign)
    return () => {
      window.removeEventListener('resize', realign)
      clearTimeout(timer.current)
    }
  }, [scrollToIndex])

  return { trackRef, index, goTo, next, prev, onScroll }
}
