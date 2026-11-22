/**
 * Solution to update mermaid color scheme during runtime is inspired by:
 * https://github.com/mermaid-js/mermaid/issues/1945#issuecomment-1661264708
 */

import mermaid from '/js/mermaid/mermaid.esm.min.mjs';

(function(window){
    'use strict'
    window.mermaid = mermaid
    const elementCode = '.mermaid'

    const getPreferedTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    // The module owns every diagram id. mermaid.run() derives ids from Date.now(),
    // or from a counter that restarts on each call, so two passes in the same
    // millisecond share an id and one diagram draws into the other's container
    // (#418). The prefix also differs from Mermaid's own `mermaid-<n>` ids, so a
    // page that calls mermaid.run() itself cannot collide with the module.
    let diagramSeq = 0
    const nextDiagramId = () => `mermaid-mod-${++diagramSeq}`

    // Strip the indentation shared by every line after the first, like the
    // dedent mermaid.run() applies before rendering.
    const dedent = (text) => {
        const lines = text.split('\n')
        const indent = (line) => line.match(/^[\t ]*/)[0].length
        const widths = lines.slice(1).filter(line => line.trim() !== '').map(indent)
        const strip = widths.length ? Math.min(...widths) : 0
        if (!strip) return text
        return [lines[0], ...lines.slice(1).map(line => line.slice(Math.min(strip, indent(line))))].join('\n')
    }

    // Turn a diagram's markup into plain-text source the way mermaid.run() does:
    // entities are decoded, and markup such as <br/> is kept as text.
    const decodeSource = (html) => {
        const decoder = document.createElement('textarea')
        decoder.innerHTML = html
        return dedent(decoder.value).trim().replace(/<br\s*\/?>/gi, '<br/>')
    }

    // The diagram's plain-text source. `data-diagram-source` is the documented
    // contract for pages that render diagrams themselves (#420);
    // `data-original-code` (innerHTML-encoded) is still read for older markup.
    const sourceOf = (element) => {
        const source = element.getAttribute('data-diagram-source')
        if (source != null) return source
        const legacy = element.getAttribute('data-original-code')
        return legacy != null ? decodeSource(legacy) : null
    }

    // Record the source of a diagram that has not been rendered yet, before its
    // content is replaced by an svg.
    const captureSource = (element) => {
        if (element.getAttribute('data-processed') || sourceOf(element) != null) return
        element.setAttribute('data-diagram-source', decodeSource(element.innerHTML))
    }

    const renderDiagram = async (element) => {
        const source = sourceOf(element)
        if (source == null) return
        // Mark the node before the render is queued, so an overlapping swap or a
        // page's own mermaid.run() does not render it a second time.
        element.setAttribute('data-processed', 'true')
        try {
            const { svg, bindFunctions } = await mermaid.render(nextDiagramId(), source, element)
            element.innerHTML = svg
            if (bindFunctions) bindFunctions(element)
        } catch (error) {
            console.error(error)
        }
    }

    // Render every node that has not been rendered yet.
    const renderDiagrams = (nodes) => {
        nodes.forEach(element => {
            captureSource(element)
            if (!element.getAttribute('data-processed')) renderDiagram(element)
        })
    }

    const getStyles = (theme) => {
        const themeElement = document.getElementById(`mermaid-${theme}-theme`);
        return getComputedStyle(themeElement)
    }

    const kebabToCamel = (str) => {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    const removeQuotes = (str) => {
        return str.replace(/['"]/g, '');
    }

    const getMermaidStyle = (cssStyles) => {
        const mermaidThemeVariables = [
            "--mermaid-dark-mode",
            "--mermaid-background",
            "--mermaid-font-family",
            "--mermaid-font-size",
            "--mermaid-primary-color",
            "--mermaid-primary-text-color",
            "--mermaid-secondary-color",
            "--mermaid-primary-border-color",
            "--mermaid-secondary-border-color",
            "--mermaid-secondary-text-color",
            "--mermaid-tertiary-color",
            "--mermaid-tertiary-border-color",
            "--mermaid-tertiary-text-color",
            "--mermaid-note-bkg-color",
            "--mermaid-note-text-color",
            "--mermaid-note-border-color",
            "--mermaid-line-color",
            "--mermaid-text-color",
            "--mermaid-main-bkg",
            "--mermaid-error-bkg-color",
            "--mermaid-error-text-color",
            "--mermaid-node-border",
            "--mermaid-cluster-bkg",
            "--mermaid-cluster-border",
            "--mermaid-default-link-color",
            "--mermaid-title-color",
            "--mermaid-edge-label-background",
            "--mermaid-node-text-color",
            "--mermaid-actor-bkg",
            "--mermaid-actor-border",
            "--mermaid-actor-text-color",
            "--mermaid-actor-line-color",
            "--mermaid-signal-color",
            "--mermaid-signal-text-color",
            "--mermaid-label-box-bkg-color",
            "--mermaid-label-box-border-color",
            "--mermaid-label-text-color",
            "--mermaid-loop-text-color",
            "--mermaid-activation-border-color",
            "--mermaid-activation-bkg-color",
            "--mermaid-sequence-number-color",
            "--mermaid-pie1",
            "--mermaid-pie2",
            "--mermaid-pie3",
            "--mermaid-pie4",
            "--mermaid-pie5",
            "--mermaid-pie6",
            "--mermaid-pie7",
            "--mermaid-pie8",
            "--mermaid-pie9",
            "--mermaid-pie10",
            "--mermaid-pie11",
            "--mermaid-pie12",
            "--mermaid-pie-title-text-size",
            "--mermaid-pie-title-text-color",
            "--mermaid-pie-section-text-size",
            "--mermaid-pie-section-text-color",
            "--mermaid-pie-legend-text-size",
            "--mermaid-pie-legend-text-color",
            "--mermaid-pie-stroke-color",
            "--mermaid-pie-stroke-width",
            "--mermaid-pie-outer-stroke-width",
            "--mermaid-pie-outer-stroke-color",
            "--mermaid-pie-opacity",
            "--mermaid-label-color",
            "--mermaid-alt-background",
            "--mermaid-class-text",
            "--mermaid-fill-type0",
            "--mermaid-fill-type1",
            "--mermaid-fill-type2",
            "--mermaid-fill-type3",
            "--mermaid-fill-type4",
            "--mermaid-fill-type5",
            "--mermaid-fill-type6",
            "--mermaid-fill-type7"
        ];
        var themeVariables = {}
        mermaidThemeVariables.forEach(themeProp => {
            const value = cssStyles.getPropertyValue(themeProp).trim();
            if (value) {
                const originalVariableName = kebabToCamel(themeProp.replace("--mermaid-", ""));
                themeVariables[originalVariableName] = value;
            }
        });
        return themeVariables
    }

    const loadMermaid = (dark) => {
        const style = getStyles(dark ? 'dark' : 'light')
        const mermaidTheme = removeQuotes(style.getPropertyValue('--mermaid-theme'))
        const mermaidStyle = getMermaidStyle(style)

        const params = {
            'theme': mermaidTheme,
            'themeVariables': mermaidStyle,
            startOnLoad: false,
            layout: '{{ site.Params.modules.mermaid.layout | default "dagre" }}',
            look: '{{ site.Params.modules.mermaid.look | default "classic" }}',
        }
        mermaid.initialize(params)
        // Render any .mermaid elements still in the DOM that are not rendered yet.
        // Pages that render diagrams themselves listen for 'mermaid:initialized'.
        renderDiagrams(document.querySelectorAll(elementCode))
        document.dispatchEvent(new CustomEvent('mermaid:initialized', { detail: { dark } }))
    }

    const updateTheme = (theme) => {
        // Invalidate every diagram whose source is known, including diagrams a
        // page rendered itself, so that loadMermaid() renders them in the new theme.
        document.querySelectorAll(elementCode).forEach(element => {
            captureSource(element)
            if (sourceOf(element) != null) element.removeAttribute('data-processed')
        })
        loadMermaid(theme === 'dark')
    }

    // Bootstrap data-bs-theme attribute changed — covers all toggle sources
    new MutationObserver(() => {
        const theme = document.documentElement.getAttribute('data-bs-theme') || 'light'
        updateTheme(theme === 'auto' ? getPreferedTheme() : theme)
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })

    // OS-level preference changed while Bootstrap theme is set to 'auto'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (document.documentElement.getAttribute('data-bs-theme') === 'auto') {
            updateTheme(getPreferedTheme())
        }
    })

    // As we cannot listen to changes in the CSS variables, we need to read them from a hidden element.
    const createPseudoStyledElements = () => {
        const themes = ['light', 'dark'];
        themes.forEach(theme => {
          const themeElement = document.createElement('div');
          themeElement.id = `mermaid-${theme}-theme`;
          themeElement.setAttribute('data-bs-theme', theme);
          themeElement.setAttribute('data-mermaid-theme', theme);
          themeElement.style.display = 'none';
          document.body.appendChild(themeElement);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        createPseudoStyledElements()
        const bsTheme = document.documentElement.getAttribute('data-bs-theme')
        updateTheme(bsTheme)
    });

    // htmx 2 fires htmx:afterSwap; htmx 4 renamed it to htmx:after:swap (#419).
    // data-processed stops a page that fires both from rendering a diagram twice.
    const onSwap = (e) => {
        const target = (e.detail && e.detail.target) || e.target
        if (!target || !target.querySelectorAll) return
        renderDiagrams(target.querySelectorAll(elementCode))
    }
    for (const evt of ['htmx:afterSwap', 'htmx:after:swap']) {
        document.body.addEventListener(evt, onSwap)
    }

})(window);

