import { computed, type MaybeRefOrGetter, onUnmounted, type Ref, ref, toValue } from 'vue'

export interface UseDraggableDialogOptions {
  enabled?: MaybeRefOrGetter<boolean>
  handleSelector?: string
}

export type DraggableTarget = HTMLElement | { $el: HTMLElement | null } | null

export function useDraggableDialog(
  targetRef: Ref<DraggableTarget>,
  options: UseDraggableDialogOptions = {},
) {
  const deltaX = ref(0)
  const deltaY = ref(0)
  const isDragging = ref(false)

  const isEnabled = computed(() =>
    options.enabled !== undefined ? Boolean(toValue(options.enabled)) : true,
  )

  let startPointerX = 0
  let startPointerY = 0
  let initialDeltaX = 0
  let initialDeltaY = 0
  let activeHandle: HTMLElement | null = null

  function getTargetElement(): HTMLElement | null {
    if (!targetRef.value) return null
    if (targetRef.value instanceof HTMLElement) return targetRef.value
    if ('$el' in targetRef.value && targetRef.value.$el instanceof HTMLElement) {
      return targetRef.value.$el
    }
    return null
  }

  function onPointerMove(e: PointerEvent) {
    const targetEl = getTargetElement()
    if (!isDragging.value || !targetEl) return

    const moveX = e.clientX - startPointerX
    const moveY = e.clientY - startPointerY

    // Viewport Clamping: keep dialog within viewport bounds
    const rect = targetEl.getBoundingClientRect()
    const minDeltaX = -(window.innerWidth / 2 - 30)
    const maxDeltaX = window.innerWidth / 2 - 30
    const minDeltaY = -(window.innerHeight / 2 - 30)
    const maxDeltaY = window.innerHeight / 2 - 30

    deltaX.value = Math.max(minDeltaX, Math.min(maxDeltaX, initialDeltaX + moveX))
    deltaY.value = Math.max(minDeltaY, Math.min(maxDeltaY, initialDeltaY + moveY))
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging.value) return
    isDragging.value = false

    if (activeHandle) {
      try {
        activeHandle.releasePointerCapture(e.pointerId)
      } catch {
        // Ignored if pointer capture already lost
      }
      activeHandle = null
    }

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  function onPointerDown(event: PointerEvent) {
    if (!isEnabled.value) return
    const target = event.target as HTMLElement | null
    if (!target) return

    // Do not initiate drag on interactive elements
    if (target.closest('button, input, textarea, select, a, [role="button"], [data-no-drag]')) {
      return
    }

    const handleSelector = options.handleSelector || '[data-dialog-handle], .dialog-header, header'
    const handleEl = target.closest(handleSelector) as HTMLElement | null
    const targetEl = getTargetElement()
    if (!handleEl || !targetEl) return

    event.preventDefault()
    isDragging.value = true
    startPointerX = event.clientX
    startPointerY = event.clientY
    initialDeltaX = deltaX.value
    initialDeltaY = deltaY.value
    activeHandle = handleEl

    try {
      handleEl.setPointerCapture(event.pointerId)
    } catch {
      // Ignored if pointer capture is unsupported on element
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  function onDoubleClick(event: MouseEvent) {
    if (!isEnabled.value) return
    const target = event.target as HTMLElement | null
    if (!target) return

    const handleSelector = options.handleSelector || '[data-dialog-handle], .dialog-header, header'
    if (target.closest(handleSelector)) {
      resetPosition()
    }
  }

  function resetPosition() {
    deltaX.value = 0
    deltaY.value = 0
    isDragging.value = false
  }

  onUnmounted(() => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  })

  return {
    deltaX,
    deltaY,
    isDragging,
    onPointerDown,
    onDoubleClick,
    resetPosition,
  }
}
