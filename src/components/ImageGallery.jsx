import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import VehicleImage from './VehicleImage.jsx'
import ImageLightbox from './ImageLightbox.jsx'
import { clampIndex, useSnapTrack } from '../hooks/useSnapTrack.js'

const arrowClass = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-800 hover:bg-white aria-disabled:opacity-40 aria-disabled:cursor-not-allowed'

// The photos of one car: swipeable big photo, arrows, counter and thumbnails. Returns a fragment so each page keeps its
// own card around it; anything passed as children (for example the save and share buttons) is laid over the photo.
// The arrows stay in the tab order at the ends (aria-disabled, not disabled) so keyboard focus is never dropped.
export default function ImageGallery({ images, alt, children }) {
  const photos = (images || []).filter(Boolean)
  const count = photos.length
  const { trackRef, index, goTo, next, prev, onScroll } = useSnapTrack(count)
  const [viewerIndex, setViewerIndex] = useState(null)
  const openers = useRef([])
  const restoreFocusRef = useRef(null)

  // Closing the zoom view leaves the page gallery on the photo it ended on and returns focus to that photo's button.
  const closeViewer = shownIndex => {
    restoreFocusRef.current = openers.current[shownIndex] || null
    goTo(shownIndex, 'instant')
    setViewerIndex(null)
  }

  // The arrow keys act on the photo that has focus (its button), and focus follows to the photo that comes into view.
  // With Alt, Ctrl or Meta held they keep their browser meaning (Alt+Left is Back).
  const onPhotoKeyDown = event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const target = clampIndex(index + step, count - 1)
    goTo(target)
    openers.current[target]?.focus({ preventScroll: true })
  }

  const carouselProps = count > 0 ? { role: 'group', 'aria-roledescription': 'carousel', 'aria-label': 'Photo gallery' } : {}

  return (
    <>
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden" {...carouselProps}>
        {count === 0 ? (
          <VehicleImage alt={`${alt} view 1`} className="w-full h-full object-cover" fallbackClassName="w-full h-full" />
        ) : (
          <div
            ref={trackRef}
            data-photo-track
            onScroll={onScroll}
            className="flex h-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((src, i) => (
              <div key={`${i}-${src}`} className="w-full h-full shrink-0 snap-center snap-always">
                <button
                  type="button"
                  ref={element => { openers.current[i] = element }}
                  onClick={() => setViewerIndex(i)}
                  onKeyDown={onPhotoKeyDown}
                  tabIndex={i === index ? 0 : -1}
                  aria-label={`Open photo ${i + 1} of ${count}`}
                  className="block w-full h-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-600"
                >
                  <VehicleImage src={src} alt={`${alt} view ${i + 1}`} className="w-full h-full object-cover" fallbackClassName="w-full h-full" />
                </button>
              </div>
            ))}
          </div>
        )}
        {count > 1 && (
          <>
            <button type="button" onClick={prev} aria-disabled={index === 0} aria-label="Previous photo" className={`${arrowClass} left-3`}><ChevronLeft className="w-5 h-5" /></button>
            <button type="button" onClick={next} aria-disabled={index === count - 1} aria-label="Next photo" className={`${arrowClass} right-3`}><ChevronRight className="w-5 h-5" /></button>
            <span aria-live="polite" className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-xs font-bold px-3 py-1">{`${index + 1} / ${count}`}</span>
          </>
        )}
        {children}
      </div>
      {viewerIndex !== null && <ImageLightbox images={photos} alt={alt} startIndex={viewerIndex} onClose={closeViewer} restoreFocusRef={restoreFocusRef} />}
      {count > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {photos.map((src, i) => (
            <button
              type="button"
              key={`${i}-${src}`}
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`w-20 h-14 rounded-md overflow-hidden border-2 shrink-0 ${i === index ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <VehicleImage src={src} alt="" className="w-full h-full object-cover" fallbackClassName="w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
