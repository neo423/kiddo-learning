import { useEffect, useId, useRef, useState } from 'react'
import {
  getRequiredTraceDistance,
  hasEnoughTraceProgress,
  isShortDotStroke,
} from '../utils/traceProgress'

const TRACE_GUIDE = {
  left: 0.08,
  top: 0.09,
  right: 0.08,
  bottom: 0.12,
  viewBoxSize: 400,
  glyphX: 200,
  glyphY: 292,
  glyphFontSize: 270,
  pathWidth: 52,
}

const TRACE_PATH_CACHE = new Map()
const TRACE_LENGTH_CACHE = new Map()
const MAX_TRACE_SEGMENT_DISTANCE = 36

function getTracePath(path) {
  if (!TRACE_PATH_CACHE.has(path)) TRACE_PATH_CACHE.set(path, new Path2D(path))
  return TRACE_PATH_CACHE.get(path)
}

function getTracePathLength(path) {
  if (!TRACE_LENGTH_CACHE.has(path)) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    element.setAttribute('d', path)
    TRACE_LENGTH_CACHE.set(path, element.getTotalLength())
  }
  return TRACE_LENGTH_CACHE.get(path)
}

function getTraceLayout(rect) {
  const layerLeft = rect.width * TRACE_GUIDE.left
  const layerTop = rect.height * TRACE_GUIDE.top
  const layerWidth = rect.width * (1 - TRACE_GUIDE.left - TRACE_GUIDE.right)
  const layerHeight = rect.height * (1 - TRACE_GUIDE.top - TRACE_GUIDE.bottom)
  const scale = Math.min(
    layerWidth / TRACE_GUIDE.viewBoxSize,
    layerHeight / TRACE_GUIDE.viewBoxSize,
  )

  return {
    scale,
    contentLeft: layerLeft + (layerWidth - TRACE_GUIDE.viewBoxSize * scale) / 2,
    contentTop: layerTop + (layerHeight - TRACE_GUIDE.viewBoxSize * scale) / 2,
  }
}

function fillPreciseStrokePaths(context, strokes, layout, lineWidth) {
  context.save()
  context.translate(layout.contentLeft, layout.contentTop)
  context.scale(layout.scale, layout.scale)
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'
  strokes.forEach((stroke) => context.stroke(getTracePath(stroke.path)))
  context.restore()
}

function applyTraceMask(
  context,
  canvas,
  glyph,
  strokes,
  displayCanvas = canvas,
  constrainToGlyph = false,
  pathWidth = TRACE_GUIDE.pathWidth,
) {
  const rect = displayCanvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const { scale, contentLeft, contentTop } = getTraceLayout(rect)
  const hasPrecisePaths = strokes?.length && strokes.every((stroke) => Boolean(stroke.path))

  context.save()
  context.globalCompositeOperation = 'destination-in'
  context.fillStyle = '#000'
  context.strokeStyle = '#000'
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (hasPrecisePaths && typeof Path2D !== 'undefined') {
    context.save()
    context.translate(contentLeft, contentTop)
    context.scale(scale, scale)
    context.lineWidth = pathWidth
    strokes.forEach((stroke) => context.stroke(getTracePath(stroke.path)))
    context.restore()
  }

  if (!hasPrecisePaths || constrainToGlyph) {
    context.font = `400 ${TRACE_GUIDE.glyphFontSize * scale}px "Bpmf Zihi Only", "Noto Sans TC", "Microsoft JhengHei", sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'
    context.lineWidth = 24 * scale
    context.strokeStyle = '#000'
    context.strokeText(
      glyph,
      contentLeft + TRACE_GUIDE.glyphX * scale,
      contentTop + TRACE_GUIDE.glyphY * scale,
    )
    // 字形遮罩必須同時包含實心內部；只用 strokeText 會在寬筆畫中留下白色缺口。
    context.fillText(
      glyph,
      contentLeft + TRACE_GUIDE.glyphX * scale,
      contentTop + TRACE_GUIDE.glyphY * scale,
    )
  }

  context.restore()
}

function DrawingCanvas({
  color,
  clearSignal,
  glyph,
  strokes,
  strokeStep,
  useGlyphMask,
  onStrokeStart,
  onStrokeComplete,
  onStrokeIncomplete,
}) {
  const canvasRef = useRef(null)
  const strokeLayerRef = useRef(null)
  const activePointerRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const pendingPointsRef = useRef([])
  const animationFrameRef = useRef(null)
  const canvasRectRef = useRef(null)
  const validDistanceRef = useRef(0)
  const requiredDistanceRef = useRef(1)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()
    if (strokeLayerRef.current) {
      strokeLayerRef.current.getContext('2d').clearRect(0, 0, strokeLayerRef.current.width, strokeLayerRef.current.height)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      canvasRectRef.current = rect

      const ratio = Math.max(1, window.devicePixelRatio || 1)
      const nextWidth = Math.round(rect.width * ratio)
      const nextHeight = Math.round(rect.height * ratio)
      if (canvas.width === nextWidth && canvas.height === nextHeight) return

      const snapshot = document.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      if (canvas.width && canvas.height) {
        snapshot.getContext('2d').drawImage(canvas, 0, 0)
      }

      canvas.width = nextWidth
      canvas.height = nextHeight
      if (!strokeLayerRef.current) strokeLayerRef.current = document.createElement('canvas')
      strokeLayerRef.current.width = nextWidth
      strokeLayerRef.current.height = nextHeight
      const context = canvas.getContext('2d')
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.lineCap = 'round'
      context.lineJoin = 'round'

      if (snapshot.width && snapshot.height) {
        context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, rect.width, rect.height)
        applyTraceMask(context, canvas, glyph, strokes, canvas, useGlyphMask)
      }
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [glyph, strokes, useGlyphMask])

  useEffect(() => {
    clearCanvas()
    validDistanceRef.current = 0
    requiredDistanceRef.current = 1
  }, [clearSignal])

  useEffect(() => {
    validDistanceRef.current = 0
    requiredDistanceRef.current = 1
  }, [glyph, strokeStep])

  const pointFromEvent = (event) => {
    const rect = canvasRectRef.current ?? canvasRef.current.getBoundingClientRect()
    const referenceSize = Math.min(rect.width, rect.height)
    // 描寫模式使用比一般畫筆更寬的「填色頭」。筆跡仍跟著孩子移動，
    // 但經過字形遮罩後會填滿整個筆畫通道，不會留下細細的自由畫線。
    const fixedWidth = Math.min(104, Math.max(52, referenceSize * 0.145))
    const pressure = event.pointerType === 'pen' && event.pressure > 0
      ? Math.min(112, Math.max(50, fixedWidth * (0.9 + event.pressure * 0.22)))
      : fixedWidth

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: pressure,
    }
  }

  const prepareContext = (lineWidth) => {
    const layer = strokeLayerRef.current
    const context = layer.getContext('2d')
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, layer.width / ratio, layer.height / ratio)
    context.globalCompositeOperation = 'source-over'
    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = lineWidth
    context.lineCap = 'round'
    context.lineJoin = 'round'
    canvasRef.current.dataset.lastLineWidth = String(lineWidth)
    return context
  }

  const activeStrokeForStep = () => strokes?.[Math.min(strokeStep, strokes.length - 1)]

  const refreshRequiredDistance = () => {
    const rect = canvasRectRef.current ?? canvasRef.current.getBoundingClientRect()
    const activeStroke = activeStrokeForStep()
    const { scale } = getTraceLayout(rect)
    requiredDistanceRef.current = activeStroke?.path
      ? getRequiredTraceDistance(getTracePathLength(activeStroke.path), scale)
      : Math.max(48, Math.min(rect.width, rect.height) * 0.22)
  }

  const isPointOnActiveStroke = (point) => {
    const activeStroke = activeStrokeForStep()
    if (!activeStroke?.path || !strokeLayerRef.current) return true

    const rect = canvasRectRef.current ?? canvasRef.current.getBoundingClientRect()
    const { scale, contentLeft, contentTop } = getTraceLayout(rect)
    const guideX = (point.x - contentLeft) / scale
    const guideY = (point.y - contentTop) / scale
    const context = strokeLayerRef.current.getContext('2d')
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.lineWidth = TRACE_GUIDE.pathWidth + 12
    context.lineCap = 'round'
    context.lineJoin = 'round'
    const inside = context.isPointInStroke(getTracePath(activeStroke.path), guideX, guideY)
    context.restore()
    return inside
  }

  const isPointNearStrokeMarker = (point) => {
    const activeStroke = activeStrokeForStep()
    const rect = canvasRectRef.current ?? canvasRef.current.getBoundingClientRect()
    if (!activeStroke?.marker) return false
    const markerX = rect.width * activeStroke.marker.x / 100
    const markerY = rect.height * activeStroke.marker.y / 100
    const tolerance = Math.max(34, Math.min(rect.width, rect.height) * 0.07)
    return Math.hypot(point.x - markerX, point.y - markerY) <= tolerance
  }

  const recordValidProgress = (points) => {
    let previous = lastPointRef.current
    points.forEach((point) => {
      if (previous) {
        const midpoint = {
          x: (previous.x + point.x) / 2,
          y: (previous.y + point.y) / 2,
        }
        if (
          isPointOnActiveStroke(previous)
          && isPointOnActiveStroke(midpoint)
          && isPointOnActiveStroke(point)
        ) {
          const segmentDistance = Math.hypot(point.x - previous.x, point.y - previous.y)
          validDistanceRef.current += Math.min(segmentDistance, MAX_TRACE_SEGMENT_DISTANCE)
        }
      }
      previous = point
    })
    canvasRef.current.dataset.traceProgress = String(validDistanceRef.current)
    canvasRef.current.dataset.traceRequired = String(requiredDistanceRef.current)
  }

  const mergeActiveStroke = (context) => {
    const activeStroke = strokes?.[Math.min(strokeStep, strokes.length - 1)]
    applyTraceMask(
      context,
      strokeLayerRef.current,
      glyph,
      activeStroke?.path ? [activeStroke] : strokes,
      canvasRef.current,
      useGlyphMask,
      TRACE_GUIDE.pathWidth + 12,
    )
    compositeStrokeLayer()
  }

  const compositeStrokeLayer = () => {
    const canvas = canvasRef.current
    const target = canvas.getContext('2d')
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    target.save()
    target.setTransform(1, 0, 0, 1, 0, 0)
    target.drawImage(strokeLayerRef.current, 0, 0)
    target.restore()
    target.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  const completeActiveStrokeFill = () => {
    const activeStroke = strokes?.[Math.min(strokeStep, strokes.length - 1)]
    const canvas = canvasRef.current
    if (!activeStroke?.path || !canvas || !strokeLayerRef.current) return

    const rect = canvasRectRef.current ?? canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const layout = getTraceLayout(rect)
    const { scale, contentLeft, contentTop } = layout
    const context = prepareContext((TRACE_GUIDE.pathWidth + 18) * scale)

    if (strokeStep >= strokes.length - 1) {
      if (useGlyphMask) {
        context.font = `400 ${TRACE_GUIDE.glyphFontSize * scale}px "Bpmf Zihi Only", "Noto Sans TC", "Microsoft JhengHei", sans-serif`
        context.textAlign = 'center'
        context.textBaseline = 'alphabetic'
        context.fillText(
          glyph,
          contentLeft + TRACE_GUIDE.glyphX * scale,
          contentTop + TRACE_GUIDE.glyphY * scale,
        )
        applyTraceMask(context, strokeLayerRef.current, glyph, [], canvas, true)
      } else {
        fillPreciseStrokePaths(context, strokes, layout, TRACE_GUIDE.pathWidth + 18)
        applyTraceMask(
          context,
          strokeLayerRef.current,
          glyph,
          strokes,
          canvas,
          false,
          TRACE_GUIDE.pathWidth + 12,
        )
      }
      compositeStrokeLayer()
      return
    }

    fillPreciseStrokePaths(context, [activeStroke], layout, TRACE_GUIDE.pathWidth + 18)
    mergeActiveStroke(context)
  }

  const drawDot = (point) => {
    const context = prepareContext(point.width)
    context.beginPath()
    context.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2)
    context.fill()
    mergeActiveStroke(context)
  }

  const drawSegments = (points) => {
    const lastPoint = lastPointRef.current
    if (!lastPoint || !points.length) return
    recordValidProgress(points)
    const lineWidth = points.reduce((sum, point) => sum + point.width, lastPoint.width) / (points.length + 1)
    const context = prepareContext(lineWidth)
    context.beginPath()
    context.moveTo(lastPoint.x, lastPoint.y)
    points.forEach((point) => context.lineTo(point.x, point.y))
    context.stroke()
    mergeActiveStroke(context)
    lastPointRef.current = points[points.length - 1]
  }

  const flushPendingPoints = () => {
    animationFrameRef.current = null
    if (!pendingPointsRef.current.length) return
    const points = pendingPointsRef.current.splice(0)
    drawSegments(points)
  }

  const scheduleDraw = () => {
    if (animationFrameRef.current) return
    animationFrameRef.current = requestAnimationFrame(flushPendingPoints)
  }

  const handlePointerDown = (event) => {
    event.preventDefault()
    if (isDrawingRef.current) return
    const canvas = canvasRef.current
    try {
      canvas.setPointerCapture?.(event.pointerId)
    } catch {
      // Synthetic PointerEvent tests may not register an active platform pointer.
    }
    activePointerRef.current = event.pointerId
    isDrawingRef.current = true
    canvasRectRef.current = canvas.getBoundingClientRect()
    pendingPointsRef.current = []
    lastPointRef.current = pointFromEvent(event.nativeEvent)
    refreshRequiredDistance()
    const activeStroke = activeStrokeForStep()
    if (
      activeStroke?.path
      && isShortDotStroke(getTracePathLength(activeStroke.path))
      && (isPointOnActiveStroke(lastPointRef.current) || isPointNearStrokeMarker(lastPointRef.current))
    ) {
      validDistanceRef.current = requiredDistanceRef.current
    }
    canvas.dataset.traceProgress = String(validDistanceRef.current)
    canvas.dataset.traceRequired = String(requiredDistanceRef.current)
    canvas.dataset.inputType = event.pointerType === 'pen' ? 'pen' : event.pointerType
    onStrokeStart?.(event.pointerType === 'pen' ? 'pen' : event.pointerType)
    drawDot(lastPointRef.current)
  }

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current || event.pointerId !== activePointerRef.current) return
    event.preventDefault()
    const coalescedEvents = event.nativeEvent.getCoalescedEvents?.()
    const nativeEvents = coalescedEvents?.length ? coalescedEvents : [event.nativeEvent]
    pendingPointsRef.current.push(...nativeEvents.map((nativeEvent) => pointFromEvent(nativeEvent)))
    scheduleDraw()
  }

  const finishDrawing = (event) => {
    if (event.pointerId !== activePointerRef.current) return
    event.preventDefault()
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    flushPendingPoints()
    const canvas = canvasRef.current
    try {
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    } catch {
      // The browser may already have released capture on pointercancel.
    }
    activePointerRef.current = null
    isDrawingRef.current = false
    lastPointRef.current = null
    if (
      event.type === 'pointerup'
      && hasEnoughTraceProgress(validDistanceRef.current, requiredDistanceRef.current)
    ) {
      completeActiveStrokeFill()
      validDistanceRef.current = 0
      onStrokeComplete?.()
    } else if (event.type === 'pointerup') {
      onStrokeIncomplete?.()
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      role="application"
      tabIndex={0}
      aria-label={`${glyph} 書寫畫布`}
      data-input-type="none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrawing}
      onPointerCancel={finishDrawing}
    />
  )
}

export default function TraceWritingArea({ item, strokeStep, clearSignal, onAdvance, type = 'zhuyin' }) {
  const guideId = useId().replace(/:/g, '')
  const [needsMoreTracing, setNeedsMoreTracing] = useState(false)
  const glyph = item.symbol ?? item.number
  const totalStrokes = item.strokes.length
  const completed = strokeStep >= totalStrokes
  const activeStroke = item.strokes[Math.min(strokeStep, totalStrokes - 1)]
  const hasPrecisePaths = item.strokes.every((stroke) => Boolean(stroke.path))
  const useBpmfGuide = type === 'zhuyin'

  useEffect(() => {
    setNeedsMoreTracing(false)
  }, [clearSignal, glyph, strokeStep])

  const stateFor = (index) => {
    if (index < strokeStep || completed) return 'complete'
    if (index === strokeStep) return 'active'
    return 'pending'
  }

  return (
    <div
      className={`practice-card guide-lines stroke-practice-card ${completed ? 'stroke-practice-complete' : ''}`}
    >
      <svg
        className="trace-guide-svg"
        viewBox="0 0 400 400"
        role="img"
        aria-label={`${glyph} 空心描寫輪廓，共 ${totalStrokes} 畫`}
      >
        {useBpmfGuide ? (
          <>
            <defs>
              <mask id={`${guideId}-bpmf-mask`}>
                <rect width="400" height="400" fill="black" />
                <text x="200" y="292" textAnchor="middle" className="trace-guide-mask-text trace-guide-bpmf-text">{glyph}</text>
              </mask>
              <filter id={`${guideId}-bpmf-outline`} x="-20%" y="-20%" width="140%" height="140%">
                <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="expanded" />
                <feComposite in="expanded" in2="SourceAlpha" operator="out" result="outline" />
                <feFlood floodColor="#d8dce4" result="outlineColor" />
                <feComposite in="outlineColor" in2="outline" operator="in" />
              </filter>
            </defs>
            <text
              x="200"
              y="292"
              textAnchor="middle"
              className="trace-guide-mask-text trace-guide-bpmf-text"
              filter={`url(#${guideId}-bpmf-outline)`}
            >
              {glyph}
            </text>
            <g mask={`url(#${guideId}-bpmf-mask)`}>
              <rect width="400" height="400" className="trace-guide-channel" />
              {item.strokes.map((stroke) => (
                <path key={`dash-${stroke.id}`} className="trace-path-dash" d={stroke.path} />
              ))}
            </g>
          </>
        ) : hasPrecisePaths ? (
          <>
            {item.strokes.map((stroke) => (
              <path key={stroke.id} className="trace-path-outline" d={stroke.path} />
            ))}
            {item.strokes.map((stroke) => (
              <path key={`channel-${stroke.id}`} className="trace-path-channel" d={stroke.path} />
            ))}
            {item.strokes.map((stroke) => (
              <path key={`dash-${stroke.id}`} className="trace-path-dash" d={stroke.path} />
            ))}
          </>
        ) : (
          <>
            <defs>
              <mask id={`${guideId}-glyph-mask`}>
                <rect width="400" height="400" fill="black" />
                <text x="200" y="292" textAnchor="middle" className="trace-guide-mask-text">{glyph}</text>
              </mask>
              <filter id={`${guideId}-glyph-outline`} x="-20%" y="-20%" width="140%" height="140%">
                <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="expanded" />
                <feComposite in="expanded" in2="SourceAlpha" operator="out" result="outline" />
                <feFlood floodColor="#d8dce4" result="outlineColor" />
                <feComposite in="outlineColor" in2="outline" operator="in" />
              </filter>
              <pattern id={`${guideId}-dash-pattern`} width="28" height="28" patternUnits="userSpaceOnUse">
                <path className="trace-guide-pattern-mark" d="M5 14 H18" />
              </pattern>
            </defs>
            <text
              x="200"
              y="292"
              textAnchor="middle"
              className="trace-guide-mask-text"
              filter={`url(#${guideId}-glyph-outline)`}
            >
              {glyph}
            </text>
            <g mask={`url(#${guideId}-glyph-mask)`}>
              <rect width="400" height="400" className="trace-guide-channel" />
              <rect width="400" height="400" fill={`url(#${guideId}-dash-pattern)`} />
            </g>
          </>
        )}
      </svg>

      {item.strokes.map((stroke, index) => {
        const state = stateFor(index)
        return (
          <span
            key={`marker-${stroke.id}`}
            className="stroke-hint-group"
            style={{
              left: `${stroke.marker.x}%`,
              top: `${stroke.marker.y}%`,
              '--stroke-color': stroke.color,
            }}
          >
            <span className={`stroke-start-dot stroke-start-${state}`}>{stroke.label}</span>
            {state === 'active' && <span className="stroke-direction-arrow">{stroke.direction}</span>}
          </span>
        )
      })}

      <DrawingCanvas
        key={`${type}-${item.id ?? item.number}`}
        color={item.color}
        clearSignal={clearSignal}
        glyph={glyph}
        strokes={item.strokes}
        strokeStep={strokeStep}
        useGlyphMask={useBpmfGuide}
        onStrokeStart={() => setNeedsMoreTracing(false)}
        onStrokeComplete={() => {
          setNeedsMoreTracing(false)
          onAdvance()
        }}
        onStrokeIncomplete={() => setNeedsMoreTracing(true)}
      />

      <div className={`stroke-instruction ${completed ? 'stroke-instruction-complete' : ''}`}>
        {needsMoreTracing
          ? '再沿著虛線多寫一點'
          : completed
          ? '描寫完成！可以再寫一次'
          : `第 ${activeStroke.label} 畫・沿著虛線慢慢寫`}
      </div>
    </div>
  )
}
