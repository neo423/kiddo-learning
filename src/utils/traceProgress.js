export const TRACE_PROGRESS_RATIO = 0.45
export const SHORT_DOT_PATH_LENGTH = 18

export function isShortDotStroke(pathLength) {
  return pathLength <= SHORT_DOT_PATH_LENGTH
}

export function getRequiredTraceDistance(pathLength, scale) {
  const scaledLength = pathLength * scale
  if (isShortDotStroke(pathLength)) return Math.max(1, scaledLength * 0.2)
  return Math.max(
    4,
    Math.min(
      Math.max(48, scaledLength * TRACE_PROGRESS_RATIO),
      scaledLength * 0.7,
    ),
  )
}

export function hasEnoughTraceProgress(validDistance, requiredDistance) {
  return validDistance >= requiredDistance
}
