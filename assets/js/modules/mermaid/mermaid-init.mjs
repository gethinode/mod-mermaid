/**
 * Solution to update mermaid color scheme during runtime is inspired by:
 * https://github.com/mermaid-js/mermaid/issues/1945#issuecomment-1661264708
 */

import mermaid from '/js/mermaid/mermaid.esm.min.mjs';

{{ if site.Params.modules.mermaid.elk -}}
import elkLayouts from '/js/mermaid-layout-elk/mermaid-layout-elk.esm.min.mjs';
{{- end }}

(function(window){
    'use strict'
    window.mermaid = mermaid
    const elementCode = '.mermaid'

    const getPreferedTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const forEachDiagram = (func) => {
        return new Promise((resolve, reject) => {
            try {
                var els = document.querySelectorAll(elementCode),
                    count = els.length;
                if (count === 0) { resolve(); return; }
                els.forEach(element => {
                    func(element)
                    count--
                    if(count == 0) {
                        resolve()
                    }
                });
            } catch (error) {
                reject(error)
            }
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
        // Re-run any static .mermaid elements still in the DOM (e.g. non-HTMX pages).
        // HTMX pages dispatch 'mermaid:initialized' so their own renderer can re-inject.
        const staticNodes = document.querySelectorAll(elementCode)
        if (staticNodes.length) {
            mermaid.run({ nodes: staticNodes })
        }
        document.dispatchEvent(new CustomEvent('mermaid:initialized', { detail: { dark } }))
    }

    const updateTheme = (theme) => {
        forEachDiagram(element => {
            // invalidate the diagrams and make sure to keep the content
            if (element.getAttribute('data-original-code') != null) {
                element.removeAttribute('data-processed')
                element.innerHTML = element.getAttribute('data-original-code')
            }
        }).then(() => {
            loadMermaid(theme === 'dark')
        })
        .catch(console.error)
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
        forEachDiagram(element => {
            element.setAttribute('data-original-code', element.innerHTML)
        })
        .catch( console.error)
        updateTheme(bsTheme)
    });

    document.body.addEventListener('htmx:afterSwap', (e) => {
        const target = e.detail.target || e.target
        const nodes = target.querySelectorAll(elementCode)
        if (nodes.length === 0) return
        nodes.forEach(element => {
            element.setAttribute('data-original-code', element.innerHTML)
        })
        mermaid.run({ nodes })
    })

    {{ if site.Params.modules.mermaid.elk -}}
    mermaid.registerLayoutLoaders(elkLayouts);
    {{- end }}
})(window);

