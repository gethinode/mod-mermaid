const minScale = 4
const maxScale = 0.5
const step = 1.2
const zoomFactor = 0.02

let current, mouseX, mouseY, touchX, touchY

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
    const scale = wrapper.getAttribute('data-scale') || 1
    return scale
}

function setScale(wrapper, scale) {
    wrapper.setAttribute('data-scale', scale)
}

// Zoom and expand functions
function expand(wrapper) {
    wrapper.style.transformOrigin = ''
    updateTransform(wrapper, 0, 0, 1, true)
}

function zoomIn(wrapper) {
    const scale = Math.min(getScale(wrapper) * step, minScale)
    const c = getTranslateXY(wrapper)
    // wrapper.style.transformOrigin = ''
    updateTransform(wrapper, c.translateX, c.translateY, scale, true)
}

function zoomOut(wrapper) {
    const scale = Math.max(getScale(wrapper) / step, maxScale)
    const c = getTranslateXY(wrapper)
    // wrapper.style.transformOrigin = ''
    updateTransform(wrapper, c.translateX, c.translateY, scale, true)
}

// Event handlers
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

function handleWheel(wrapper, e) {
    e.preventDefault()
    
    // Get mouse position relative to the container
    const rect = wrapper.parentElement.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const currentScale = getScale(wrapper)
    const curr = getTranslateXY(wrapper)

    // Calculate zoom direction and new scale
    const zoomIn = e.deltaY < 0
    const factor = zoomIn ? (1 + zoomFactor) : (1 - zoomFactor)
    const newScale = Math.max(maxScale, Math.min(minScale, currentScale * factor))
    
    if (newScale !== currentScale) {
        // Calculate the zoom factor that was actually applied
        const actualFactor = newScale / currentScale
        
        // Adjust translation to zoom towards mouse position
        const currentTranslateX = clientX - (clientX - curr.translateX) * actualFactor
        const currentTranslateY = clientY - (clientY - curr.translateY) * actualFactor
        
        wrapper.style.transformOrigin = '0 0'
        updateTransform(wrapper, currentTranslateX, currentTranslateY, newScale)
    }
}

// Touch events for mobile
function handleTouchstart(wrapper, e) {
    if (e.touches.length === 1) {
        touchX = e.touches[0].clientX
        touchY = e.touches[0].clientY
        wrapper.parentElement.classList.add('grabbing')
    } else if (e.touches.length === 2) {
        e.preventDefault()
        wrapper.parentElement.classList.remove('grabbing')
        
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        
        initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        initialScale = scale
    }
}

function handleTouchmove(wrapper, e) {
    if (e.touches.length === 1) {
        if (!Array.from(wrapper.parentElement.classList).includes('grabbing')) return
        e.preventDefault()
        
        const deltaX = e.touches[0].clientX - (touchX || 0)
        const deltaY = e.touches[0].clientY - (touchY || 0)
        const c = getTranslateXY(wrapper)

        const translateX = c.translateX + deltaX
        const translateY = c.translateY + deltaY
                
        touchX = e.touches[0].clientX
        touchY = e.touches[0].clientY
        
        updateTransform(wrapper, translateX, translateY, getScale(wrapper))
    } else if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const c = getTranslateXY(wrapper)
        
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scale = Math.max(maxScale, Math.min(minScale, initialScale * (currentDistance / initialDistance)))
        updateTransform(wrapper, c.currentTranslateX, c.currentTranslateY, scale)
    }
}

function handleTouchend(wrapper, e) {
    wrapper.parentElement.classList.remove('grabbing')
}

document.querySelectorAll('.diagram-wrapper').forEach(wrapper => {
    const container = wrapper.parentElement
    const btnExpand = container.querySelector('.control-btn-expand')
    const btnZoomOut = container.querySelector('.control-btn-zoom-out')
    const btnZoomIn = container.querySelector('.control-btn-zoom-in')

    btnExpand.addEventListener('click', () => { expand(wrapper) })
    btnZoomOut.addEventListener('click', () => { zoomOut(wrapper) })
    btnZoomIn.addEventListener('click', () => { zoomIn(wrapper) })

    container.addEventListener('mousedown', (e) => { handleMousedown(wrapper, e) })
    container.addEventListener('mousemove', (e) => { handleMousemove(wrapper, e) })
    document.addEventListener('mouseup', (e) => { handleMouseup(wrapper, e) })
    container.addEventListener('touchstart', (e) => { handleTouchstart(wrapper, e) })
    container.addEventListener('touchmove', (e) => { handleTouchmove(wrapper, e) })
    container.addEventListener('touchend', (e) => { handleTouchend(wrapper, e) })
    container.addEventListener('wheel', (e) => { handleWheel(wrapper, e) })    
})
