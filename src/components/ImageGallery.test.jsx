import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImageGallery from './ImageGallery.jsx'

const photos = ['/a.jpg', '/b.jpg', '/c.jpg']
const gallery = (images = photos, extra = null) => <ImageGallery images={images} alt="Honda Civic">{extra}</ImageGallery>
const trackOf = () => screen.getByRole('group', { name: 'Photo gallery' })
const withWidth = (track, width = 400) => Object.defineProperty(track, 'clientWidth', { configurable: true, value: width })

afterEach(() => vi.useRealTimers())

describe('ImageGallery page gallery', () => {
  it('steps through the photos with the arrows and stops at both ends', () => {
    render(gallery())
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeDisabled()
  })

  it('never leaves the range when the arrow is hammered', () => {
    render(gallery())
    for (let press = 0; press < 6; press += 1) fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('follows a real swipe: the index is taken from the scroll position once the scrolling settles', () => {
    vi.useFakeTimers()
    render(gallery())
    const track = withWidth(trackOf())
    track.scrollLeft = 800
    fireEvent.scroll(track)
    act(() => { vi.advanceTimersByTime(100) })
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('scrolls the track to the chosen photo', () => {
    render(gallery())
    const track = withWidth(trackOf())
    track.scrollTo = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(track.scrollTo).toHaveBeenCalledWith({ left: 400, behavior: 'smooth' })
  })

  it('keeps the same photo in view when the window is resized', () => {
    render(gallery())
    const track = withWidth(trackOf(), 400)
    track.scrollTo = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    withWidth(track, 300)
    fireEvent(window, new Event('resize'))
    expect(track.scrollLeft).toBe(300)
  })

  it('selects a photo from its thumbnail', () => {
    render(gallery())
    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View image 3' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'View image 1' })).not.toHaveAttribute('aria-current')
  })

  it('answers the arrow keys on the photo that has focus and moves focus along', () => {
    render(gallery())
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open photo 1 of 3' }), { key: 'ArrowRight' })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open photo 2 of 3' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open photo 2 of 3' }), { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open photo 1 of 3' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open photo 1 of 3' }), { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('stays valid when the car changes to one with fewer photos or none', () => {
    const { rerender } = render(gallery())
    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }))
    rerender(gallery(['/a.jpg', '/b.jpg']))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    rerender(gallery([]))
    expect(screen.getByRole('img', { name: 'Honda Civic view 1 image unavailable' })).toBeInTheDocument()
    expect(screen.queryByText(/ \/ /)).not.toBeInTheDocument()
  })

  it('is valid again when the photos come back after being gone, without a remount', () => {
    const { rerender } = render(gallery())
    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    rerender(gallery([]))
    rerender(gallery(['/x.jpg', '/y.jpg', '/z.jpg']))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'View image 1' })).toHaveAttribute('aria-current', 'true')
  })

  it('shows a focus indicator inside the photo, where the clipped outline would be invisible', () => {
    render(gallery())
    expect(screen.getByRole('button', { name: 'Open photo 1 of 3' }).className).toMatch(/focus-visible:ring-inset/)
  })

  it('keeps a trackpad swipe past the first or last photo from navigating the browser back', () => {
    render(gallery())
    expect(trackOf()).toHaveClass('overscroll-x-contain')
    fireEvent.click(screen.getByRole('button', { name: 'Open photo 1 of 3' }))
    expect(screen.getByRole('dialog', { name: 'Photo viewer' }).querySelector('.snap-x')).toHaveClass('overscroll-x-contain')
  })

  it('shows one photo without arrows, counter or thumbnails', () => {
    render(gallery(['/a.jpg']))
    expect(screen.getByRole('img', { name: 'Honda Civic view 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /View image/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/ \/ /)).not.toBeInTheDocument()
  })

  it('falls back for a photo that fails to load and still navigates', () => {
    render(gallery())
    fireEvent.error(screen.getByRole('img', { name: 'Honda Civic view 1' }))
    expect(screen.getByRole('img', { name: 'Honda Civic view 1 image unavailable' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('renders what the page puts on top of the photo, such as the save button', () => {
    render(gallery(photos, <button type="button">Save car</button>))
    expect(screen.getByRole('button', { name: 'Save car' })).toBeInTheDocument()
  })
})

describe('ImageGallery zoom view', () => {
  const openPhoto = (number, total = 3) => fireEvent.click(screen.getByRole('button', { name: `Open photo ${number} of ${total}` }))
  const viewer = () => screen.getByRole('dialog', { name: 'Photo viewer' })

  it('opens full screen on the photo that was clicked', () => {
    render(gallery())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    openPhoto(1)
    expect(within(viewer()).getByText('1 / 3')).toBeInTheDocument()
    expect(viewer()).toHaveAttribute('aria-modal', 'true')
  })

  it('opens on the photo chosen in the page', () => {
    render(gallery())
    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }))
    openPhoto(3)
    expect(within(viewer()).getByText('3 / 3')).toBeInTheDocument()
  })

  it('moves with the arrow keys and the buttons, and stays inside the range', () => {
    render(gallery())
    openPhoto(1)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(within(viewer()).getByText('2 / 3')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(within(viewer()).getByText('1 / 3')).toBeInTheDocument()
    for (let press = 0; press < 6; press += 1) fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(within(viewer()).getByText('3 / 3')).toBeInTheDocument()
    fireEvent.click(within(viewer()).getByRole('button', { name: 'Previous photo' }))
    expect(within(viewer()).getByText('2 / 3')).toBeInTheDocument()
  })

  it('closes with Escape and with the close button, keeps the photo it ended on, and returns focus to it', async () => {
    render(gallery())
    openPhoto(1)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open photo 2 of 3' })).toHaveFocus())

    openPhoto(2)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.click(within(viewer()).getByRole('button', { name: 'Close photo viewer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('releases the page scroll lock on close and can be opened again', () => {
    render(gallery())
    openPhoto(1)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
    openPhoto(1)
    expect(viewer()).toBeInTheDocument()
  })

  it('opens for a single photo without arrows or counter', () => {
    render(gallery(['/a.jpg']))
    openPhoto(1, 1)
    expect(within(viewer()).queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument()
    expect(within(viewer()).queryByText(/ \/ /)).not.toBeInTheDocument()
  })

  it('has nothing to open without photos', () => {
    render(gallery([]))
    expect(screen.queryByRole('button', { name: /Open photo/ })).not.toBeInTheDocument()
  })
})
