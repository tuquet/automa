// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useDraggableDialog } from '../src/hooks/useDraggableDialog'

describe('@automa/ui - useDraggableDialog', () => {
  it('initializes with zero delta and idle dragging state', () => {
    const targetRef = ref<HTMLElement | null>(null)
    const { deltaX, deltaY, isDragging } = useDraggableDialog(targetRef)

    expect(deltaX.value).toBe(0)
    expect(deltaY.value).toBe(0)
    expect(isDragging.value).toBe(false)
  })

  it('initiates drag and updates delta coordinates during pointer move', () => {
    const container = document.createElement('div')
    const header = document.createElement('div')
    header.setAttribute('data-dialog-handle', 'true')
    container.appendChild(header)
    document.body.appendChild(container)

    const targetRef = ref<HTMLElement | null>(container)
    const { deltaX, deltaY, isDragging, onPointerDown, resetPosition } =
      useDraggableDialog(targetRef)

    // Simulate pointer down on header handle
    const pointerDownEvent = new MouseEvent('pointerdown', {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    }) as PointerEvent
    Object.defineProperty(pointerDownEvent, 'target', { value: header })
    Object.defineProperty(pointerDownEvent, 'pointerId', { value: 1 })

    onPointerDown(pointerDownEvent)
    expect(isDragging.value).toBe(true)

    // Simulate pointer move
    const pointerMoveEvent = new MouseEvent('pointermove', {
      clientX: 150,
      clientY: 180,
      bubbles: true,
    }) as PointerEvent
    window.dispatchEvent(pointerMoveEvent)

    expect(deltaX.value).toBe(50)
    expect(deltaY.value).toBe(80)

    // Simulate pointer up
    const pointerUpEvent = new MouseEvent('pointerup', {
      bubbles: true,
    }) as PointerEvent
    Object.defineProperty(pointerUpEvent, 'pointerId', { value: 1 })
    window.dispatchEvent(pointerUpEvent)
    expect(isDragging.value).toBe(false)

    // Reset position
    resetPosition()
    expect(deltaX.value).toBe(0)
    expect(deltaY.value).toBe(0)

    document.body.removeChild(container)
  })

  it('ignores pointer down on interactive child elements like buttons', () => {
    const container = document.createElement('div')
    const header = document.createElement('div')
    header.setAttribute('data-dialog-handle', 'true')
    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Close'
    header.appendChild(closeBtn)
    container.appendChild(header)
    document.body.appendChild(container)

    const targetRef = ref<HTMLElement | null>(container)
    const { isDragging, onPointerDown } = useDraggableDialog(targetRef)

    const pointerDownEvent = new MouseEvent('pointerdown', {
      clientX: 50,
      clientY: 50,
      bubbles: true,
    }) as PointerEvent
    Object.defineProperty(pointerDownEvent, 'target', { value: closeBtn })

    onPointerDown(pointerDownEvent)
    expect(isDragging.value).toBe(false)

    document.body.removeChild(container)
  })

  it('resets position on double-click on dialog handle', () => {
    const container = document.createElement('div')
    const header = document.createElement('div')
    header.setAttribute('data-dialog-handle', 'true')
    container.appendChild(header)
    document.body.appendChild(container)

    const targetRef = ref<HTMLElement | null>(container)
    const { deltaX, deltaY, onDoubleClick } = useDraggableDialog(targetRef)

    deltaX.value = 120
    deltaY.value = 90

    const dblClickEvent = new MouseEvent('dblclick', { bubbles: true })
    Object.defineProperty(dblClickEvent, 'target', { value: header })

    onDoubleClick(dblClickEvent)
    expect(deltaX.value).toBe(0)
    expect(deltaY.value).toBe(0)

    document.body.removeChild(container)
  })
})
