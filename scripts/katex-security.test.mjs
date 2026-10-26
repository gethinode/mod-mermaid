import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const dist = new URL('../dist/', import.meta.url);
const entries = await readdir(dist, { recursive: true });
const bundles = entries.filter((entry) => /^katex-.*\.mjs$/.test(path.basename(entry)));

// Exercise every shipped renderer, including chunks left behind by older installs.
test('the distribution contains a KaTeX renderer', () => {
  assert.ok(bundles.length > 0);
});

for (const bundle of bundles) {
  test(`${bundle} ignores inherited trust options`, async () => {
    const { default: katex } = await import(new URL(bundle, dist));
    assert.equal(typeof katex.renderToString, 'function');
    const options = Object.assign(Object.create({ trust: true }), { throwOnError: false });
    const html = katex.renderToString('\\href{javascript:alert(1)}{test}', options);
    assert.doesNotMatch(html, /href="javascript:/);
    assert.match(katex.renderToString('x + 1'), /class="katex"/);
  });
}
