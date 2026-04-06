/**
 * MatchaSequence.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-driven HTML5 Canvas image sequence for the MATON hero section.
 *
 * Architecture:
 *  • Preloads all 30 frames before any scroll interaction begins
 *  • Maps scroll progress → frame index via Framer Motion useScroll/useTransform
 *  • Renders frames to <canvas> via requestAnimationFrame (no <img> swapping)
 *  • Outer container is 300vh tall; sticky inner keeps canvas pinned for
 *    the full scroll travel — giving a heavy, deliberate, ceremonial feel
 *  • Canvas resolution adapts to devicePixelRatio for crisp rendering
 *  • Gracefully degrades on prefers-reduced-motion devices
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from 'react'
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

// ─── Config ──────────────────────────────────────────────────────────────────

const TOTAL_FRAMES = 30

/** How many viewport-heights the pinned scroll section occupies.
 *  300vh = 200vh of actual scroll travel, giving a slow, deliberate pace. */
const SCROLL_HEIGHT_VH = 300

/** Build the array of frame URLs. */
const buildFrameUrls = (): string[] =>
  Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    const n = String(i + 1).padStart(3, '0')
    return `/macha-pics/ezgif-frame-${n}.jpg`
  })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ─── Component ───────────────────────────────────────────────────────────────

function MatchaSequenceFn() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const framesRef    = useRef<HTMLImageElement[]>([])
  const rafRef       = useRef<number | null>(null)
  const currentFrameRef = useRef<number>(0)

  const [loadedCount, setLoadedCount] = useState(0)
  const [allLoaded, setAllLoaded]     = useState(false)
  const [reducedMotion]               = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // ── Preload all frames ──────────────────────────────────────────────────
  useEffect(() => {
    const urls   = buildFrameUrls()
    const images = urls.map((url, idx) => {
      const img = new Image()
      
      img.onload = () => {
        setLoadedCount((c) => {
          const next = c + 1
          if (next === TOTAL_FRAMES) setAllLoaded(true)
          return next
        })
        framesRef.current[idx] = img
      }

      img.onerror = () => {
        // Still increment so we don't hang forever
        setLoadedCount((c) => {
          const next = c + 1
          if (next === TOTAL_FRAMES) setAllLoaded(true)
          return next
        })
      }

      // Assign src AFTER handlers to prevent cached image race conditions
      img.src = url

      return img
    })
    return () => {
      // Abort loading on unmount
      images.forEach((img) => { img.src = '' })
    }
  }, [])

  // ── Draw frame to canvas ────────────────────────────────────────────────
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    const img    = framesRef.current[index]
    if (!canvas || !img?.complete || !img.naturalWidth) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const logW = canvas.offsetWidth
    const logH = canvas.offsetHeight

    // Only resize backing store when dimensions actually change
    if (canvas.width !== Math.round(logW * dpr) || canvas.height !== Math.round(logH * dpr)) {
      canvas.width  = Math.round(logW * dpr)
      canvas.height = Math.round(logH * dpr)
      ctx.scale(dpr, dpr)
    }

    // Cover-fit: maintain aspect ratio, fill the canvas
    const imgAspect    = img.naturalWidth  / img.naturalHeight
    const canvasAspect = logW / logH

    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight

    if (imgAspect > canvasAspect) {
      // Image is wider than canvas: crop sides
      sw = img.naturalHeight * canvasAspect
      sx = (img.naturalWidth - sw) / 2
    } else {
      // Image is taller than canvas: crop top/bottom
      sh = img.naturalWidth / canvasAspect
      sy = (img.naturalHeight - sh) / 2
    }

    ctx.clearRect(0, 0, logW, logH)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, logW, logH)
  }, [])

  // Schedule draw via rAF to avoid queuing draws faster than 60fps
  const scheduleFrame = useCallback((index: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      drawFrame(index)
      rafRef.current = null
    })
  }, [drawFrame])

  // ── Draw frame 0 once loaded (initial state) ────────────────────────────
  useEffect(() => {
    if (allLoaded) {
      scheduleFrame(0)
    }
  }, [allLoaded, scheduleFrame])

  // ── Handle window resize ────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      // Reset backing store so scale is recalculated on next draw
      canvas.width  = 0
      canvas.height = 0
      scheduleFrame(currentFrameRef.current)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [scheduleFrame])

  // ── Scroll tracking ─────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Map progress [0, 1] → frame index [0, TOTAL_FRAMES - 1]
  const rawFrameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, TOTAL_FRAMES - 1]
  )

  useMotionValueEvent(rawFrameIndex, 'change', (latest) => {
    if (!allLoaded || reducedMotion) return
    const idx = clamp(Math.round(latest), 0, TOTAL_FRAMES - 1)
    if (idx !== currentFrameRef.current) {
      currentFrameRef.current = idx
      scheduleFrame(idx)
    }
  })

  // Cleanup rAF on unmount
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────

  const loadPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100)

  return (
    /**
     * Outer container: tall enough to give scroll travel.
     * 300vh → once user scrolls 200vh past the section start,
     * the sequence completes and the sticky element un-pins naturally.
     */
    <div
      ref={containerRef}
      className="matcha-seq-outer"
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
    >
      {/* Sticky inner — stays fixed in viewport while user scrolls outer */}
      <div className="matcha-seq-sticky">

        {/* Loading overlay — fades out once all frames are ready */}
        {!allLoaded && (
          <div className="matcha-seq-loader" aria-live="polite">
            <div className="matcha-seq-loader__bar">
              <div
                className="matcha-seq-loader__fill"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
            <span className="matcha-seq-loader__label">
              Preparing ceremony… {loadPercent}%
            </span>
          </div>
        )}

        {/* The canvas — frames drawn here by drawFrame() */}
        <canvas
          ref={canvasRef}
          className="matcha-seq-canvas"
          aria-label="Animated matcha preparation sequence"
          role="img"
        />

        {/* Vignette overlay — blends edges into the hero dark background */}
        <div className="matcha-seq-vignette" aria-hidden="true" />
      </div>
    </div>
  )
}

// Memoize: this component only needs to re-render for load state changes
const MatchaSequence = memo(MatchaSequenceFn)
export default MatchaSequence
