import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

// Inspect the shipped artifact, not just the source configuration. Both Pages
// (/Labora-/) and Capacitor (/) must include the same local utility stylesheet.
const root = path.resolve(process.argv[2] || 'dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(!/cdn\.tailwindcss\.com|@tailwindcss\/browser|tailwind\.config/.test(html),
  'The shipped app must not require a browser Tailwind compiler.');
const stylesheets = [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]
  .map((match) => match[1]).filter((href) => !/^https?:\/\//.test(href));
assert(stylesheets.length > 0, 'The app must link a bundled stylesheet.');
const css = stylesheets.map((href) => {
  const assetPath = href.replace(/^.*?(?=assets\/)/, '');
  const resolved = path.resolve(root, assetPath);
  assert(resolved.startsWith(root + path.sep), 'Stylesheet must be inside the app bundle.');
  return fs.readFileSync(resolved, 'utf8');
}).join('\n');
assert(!/@tailwind\s/.test(css), 'Tailwind directives must be compiled before shipping.');

const rules = [];
postcss.parse(css).walkRules((rule) => rules.push(rule));
// These critical layout/state utilities are used across login, role shells,
// MoneyHub, documents and dialogs, including lazy screens and shared services.
const required = [
  'flex', 'hidden', 'grid-cols-2', 'sm:flex', 'lg:hidden', 'lg:static',
  'h-[100dvh]', 'max-h-[100dvh]', 'min-w-0', 'overflow-x-hidden',
  'overflow-y-auto', 'min-h-11', 'disabled:opacity-60', 'font-sans',
  'rounded-xl', 'text-sm', 'bg-[var(--labora-surface)]',
  'focus-visible:outline-2', 'safe-area-bottom', 'labora-card',
];
for (const name of required) {
  const selector = '.' + name.replace(/[^\w-]/g, (character) => '\\' + character);
  assert(rules.some((rule) => rule.selector.split(',').some((part) =>
    part.trim() === selector || part.trim().startsWith(selector + ':'))),
  `Missing shipped screen style: ${name}`);
}
const mediaRules = rules.filter((rule) => rule.parent.type === 'atrule' && rule.parent.name === 'media');
for (const width of [640, 768, 1024]) {
  assert(mediaRules.some((rule) => rule.parent.params.includes(`${width}px`)),
    `Missing responsive breakpoint: ${width}px`);
}
assert(css.includes('--labora-') && css.includes('--ghibli-'), 'Keep the existing appearance tokens.');
console.log(`PASS: bundled styles, ${required.length} critical classes and 3 responsive breakpoints (${Buffer.byteLength(css)} bytes).`);
console.log('This artifact check does not replace authenticated visual or physical-device UAT.');
