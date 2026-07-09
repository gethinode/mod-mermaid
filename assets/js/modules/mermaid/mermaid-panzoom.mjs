const minScale = 4
const maxScale = 0.5
const step = 1.2
const zoomFactor = 0.02

let current, mouseX, mouseY, touchX, touchY
let initialDistance, initialScale

// Update transform
function updateTransform(wrapper, translateX, translateY, scale, ease) {
    setScale(wrapper, scale)

    if (ease) {
        wrapper.style.transition = 'all 0.3s ease-in-out'
    } else {
        wrapper.style.transition = ''
    }
    wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
}

function getTranslateXY(element) {
    const style = window.getComputedStyle(element)
    const matrix = new DOMMatrixReadOnly(style.transform)
    return {
        translateX: matrix.m41,
        translateY: matrix.m42
    }
}

function getScale(wrapper) {
    return wrapper.getAttribute('data-scale') || 1
}

function setScale(wrapper, scale) {
    wrapper.setAttribute('data-scale', scale)
}

// Zoom and reset helpers
function expand(wrapper) {
    wrapper.style.transformOrigin = ''
    updateTransform(wrapper, 0, 0, 1, true)
}

// Fit the whole diagram (contain) within its container and centre it. Used in
// fullscreen/dialog mode, where the intent is to see the entire bounding box
// rather than fill the width and scroll vertically.
function fit(wrapper) {
    const container = wrapper.parentElement
    const cw = container.clientWidth
    const ch = container.clientHeight
    const ww = wrapper.offsetWidth
    const wh = wrapper.offsetHeight
    if (!cw || !ch || !ww || !wh) { expand(wrapper); return }
    const padX = 24
    const padTop = 48
    const padBottom = 24
    const availW = Math.max(1, cw - 2 * padX)
    const availH = Math.max(1, ch - padTop - padBottom)
    const scale = Math.min(availW / ww, availH / wh, minScale)
    const left = padX + (availW - ww * scale) / 2
    const top = padTop + (availH - wh * scale) / 2
    wrapper.style.transformOrigin = '0 0'
    updateTransform(wrapper, left - wrapper.offsetLeft, top - wrapper.offsetTop, scale, true)
}

// A dialog is laid out asynchronously after showModal(), so its container has
// no size yet when the clone is first observed. Poll a few frames until it
// does, then fit once.
function fitWhenReady(wrapper, tries = 0) {
    const container = wrapper.parentElement
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        fit(wrapper)
    } else if (tries < 30) {
        requestAnimationFrame(() => fitWhenReady(wrapper, tries + 1))
    }
}

function zoomIn(wrapper) {
    const scale = Math.min(getScale(wrapper) * step, minScale)
    const c = getTranslateXY(wrapper)
    updateTransform(wrapper, c.translateX, c.translateY, scale, true)
}

function zoomOut(wrapper) {
    const scale = Math.max(getScale(wrapper) / step, maxScale)
    const c = getTranslateXY(wrapper)
    updateTransform(wrapper, c.translateX, c.translateY, scale, true)
}

// Mouse drag (pan) — bound only where gestures are active.
function handleMousedown(wrapper, e) {
    e.preventDefault()
    wrapper.parentElement.classList.add('grabbing')
    current = getTranslateXY(wrapper)
    mouseX = e.clientX
    mouseY = e.clientY
}

function handleMousemove(wrapper, e) {
    if (Array.from(wrapper.parentElement.classList).includes('grabbing')) {
        e.preventDefault()
        const deltaX = current.translateX + e.clientX - mouseX
        const deltaY = current.translateY + e.clientY - mouseY
        updateTransform(wrapper, deltaX, deltaY, getScale(wrapper))
    }
}

function handleMouseup(wrapper, e) {
    e.preventDefault()
    wrapper.parentElement.classList.remove('grabbing')
    mouseX = null
    mouseY = null
    current = null
}

// Wheel zoom. Gated by requireModifier so plain wheel scrolls the page inline;
// the dialog is modal (nothing scrolls behind it) so it passes false.
function handleWheel(wrapper, e, requireModifier) {
    if (requireModifier && !(e.ctrlKey || e.metaKey)) return
    e.preventDefault()

    const rect = wrapper.parentElement.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const currentScale = getScale(wrapper)
    const curr = getTranslateXY(wrapper)

    const zoomingIn = e.deltaY < 0
    const factor = zoomingIn ? (1 + zoomFactor) : (1 - zoomFactor)
    const newScale = Math.max(maxScale, Math.min(minScale, currentScale * factor))

    if (newScale !== currentScale) {
        const actualFactor = newScale / currentScale
        const currentTranslateX = clientX - (clientX - curr.translateX) * actualFactor
        const currentTranslateY = clientY - (clientY - curr.translateY) * actualFactor
        wrapper.style.transformOrigin = '0 0'
        updateTransform(wrapper, currentTranslateX, currentTranslateY, newScale)
    }
}

// Touch. oneFingerPan=false (INLINE-A) lets a single-finger drag scroll the
// page; two fingers always pan/pinch.
function handleTouchstart(wrapper, e, oneFingerPan) {
    if (e.touches.length === 1) {
        if (!oneFingerPan) return
        touchX = e.touches[0].clientX
        touchY = e.touches[0].clientY
        wrapper.parentElement.classList.add('grabbing')
    } else if (e.touches.length === 2) {
        e.preventDefault()
        wrapper.parentElement.classList.remove('grabbing')
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        initialDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        initialScale = Number(getScale(wrapper))
    }
}

function handleTouchmove(wrapper, e, oneFingerPan) {
    if (e.touches.length === 1) {
        if (!oneFingerPan) return
        if (!Array.from(wrapper.parentElement.classList).includes('grabbing')) return
        e.preventDefault()
        const deltaX = e.touches[0].clientX - (touchX || 0)
        const deltaY = e.touches[0].clientY - (touchY || 0)
        const c = getTranslateXY(wrapper)
        touchX = e.touches[0].clientX
        touchY = e.touches[0].clientY
        updateTransform(wrapper, c.translateX + deltaX, c.translateY + deltaY, getScale(wrapper))
    } else if (e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const c = getTranslateXY(wrapper)
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scale = Math.max(maxScale, Math.min(minScale, initialScale * (currentDistance / initialDistance)))
        updateTransform(wrapper, c.translateX, c.translateY, scale)
    }
}

function handleTouchend(wrapper) {
    wrapper.parentElement.classList.remove('grabbing')
}

// Bind interactive gestures (drag + wheel + touch) to a wrapper's container.
function bindGestures(wrapper, container, { requireModifier, oneFingerPan }) {
    container.addEventListener('mousedown', (e) => handleMousedown(wrapper, e))
    container.addEventListener('mousemove', (e) => handleMousemove(wrapper, e))
    document.addEventListener('mouseup', (e) => handleMouseup(wrapper, e))
    container.addEventListener('touchstart', (e) => handleTouchstart(wrapper, e, oneFingerPan))
    container.addEventListener('touchmove', (e) => handleTouchmove(wrapper, e, oneFingerPan), { passive: false })
    container.addEventListener('touchend', () => handleTouchend(wrapper))
    container.addEventListener('wheel', (e) => handleWheel(wrapper, e, requireModifier), { passive: false })
}

// INLINE-B: passive preview with a fullscreen button. Clicking anywhere on the
// diagram (except a control) opens the dialog by delegating to the accessible
// fullscreen button — no extra data-lightbox-trigger on the container.
function makeClickToOpen(container) {
    const trigger = container.querySelector('.control-btn-fullscreen')
    if (!trigger) return
    container.classList.add('diagram-clickable')
    container.addEventListener('click', (e) => {
        if (e.target.closest('.control-btn')) return
        trigger.click()
    })
}

function initWrapper(wrapper) {
    if (wrapper.dataset.panzoomInit) return
    wrapper.dataset.panzoomInit = 'true'

    const container = wrapper.parentElement
    const inDialog = !!wrapper.closest('dialog')
    const hasFullscreen = !!container.querySelector('.control-btn-fullscreen')

    // Reset control: fit the whole diagram in the dialog, else reset transform.
    const reset = inDialog ? () => fit(wrapper) : () => expand(wrapper)
    const btnExpand = container.querySelector('.control-btn-expand')
    const btnZoomOut = container.querySelector('.control-btn-zoom-out')
    const btnZoomIn = container.querySelector('.control-btn-zoom-in')
    if (btnExpand) btnExpand.addEventListener('click', reset)
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => zoomOut(wrapper))
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => zoomIn(wrapper))

    if (inDialog) {
        // Modal: pan/zoom own the viewport, wheel needs no modifier.
        bindGestures(wrapper, container, { requireModifier: false, oneFingerPan: true })
        fitWhenReady(wrapper)
    } else if (hasFullscreen) {
        // INLINE-B: passive preview; the whole diagram opens the dialog.
        makeClickToOpen(container)
    } else {
        // INLINE-A: no dialog to escape to — cooperative inline gestures.
        container.classList.add('diagram-interactive')
        bindGestures(wrapper, container, { requireModifier: true, oneFingerPan: false })
    }
}

document.querySelectorAll('.diagram-wrapper').forEach(wrapper => initWrapper(wrapper))

new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return
            if (node.classList.contains('diagram-wrapper')) {
                initWrapper(node)
            }
            node.querySelectorAll('.diagram-wrapper').forEach(wrapper => initWrapper(wrapper))
        })
    })
}).observe(document.body, { childList: true, subtree: true })
