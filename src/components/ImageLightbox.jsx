import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import VehicleImage from './VehicleImage.jsx'
import { useDialogLifecycle } from './ui/Overlays.jsx'
import { useSnapTrack } from '../hooks/useSnapTrack.js'

const arrowClass = 'absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed'

// Full-screen view of the photos of a car: swipe, arrows and the arrow keys move between them. onClose receives the
// index being shown so the page gallery can stay on the same photo.
export default function ImageLightbox({ images, alt, startIndex = 0, onClose, restoreFocusRef }) {
  const photos = (images || []).filter(Boolean)
  const count = photos.length
  const { trackRef, index, next, prev, onScroll } = useSnapTrack(count, startIndex)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useDialogLifecycle(true, () => onClose(index), dialogRef, closeRef, restoreFocusRef)

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev])

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Photo viewer" tabIndex={-1} className="relative w-full h-full">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex h-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((src, i) => (
            <div key={`${i}-${src}`} className="w-full h-full shrink-0 snap-center snap-always flex items-center justify-center p-2 sm:p-8">
              <VehicleImage src={src} alt={`${alt} view ${i + 1}`} className="max-w-full max-h-full object-contain" fallbackClassName="w-full h-full text-slate-600" />
            </div>
          ))}
        </div>
        <button ref={closeRef} type="button" onClick={() => onClose(index)} aria-label="Close photo viewer" className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
        {count > 1 && (
          <>
            <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous photo" className={`${arrowClass} left-3 sm:left-6`}><ChevronLeft className="w-6 h-6" /></button>
            <button type="button" onClick={next} disabled={index === count - 1} aria-label="Next photo" className={`${arrowClass} right-3 sm:right-6`}><ChevronRight className="w-6 h-6" /></button>
            <span aria-live="polite" className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 text-white text-sm font-bold px-4 py-1.5">{`${index + 1} / ${count}`}</span>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
