#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../assets/planner-core.js');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/render-plan.mjs plan.json output.html');
  process.exit(1);
}
const data = JSON.parse(readFileSync(input, 'utf8'));
core.validate(data.plan || data);
if (data.scenario) core.validate(data.scenario);
const json = JSON.stringify(data, null, 2)
  .replaceAll('<', '\\u003c')
  .replaceAll('&', '\\u0026')
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029');
let html = readFileSync(resolve(root, 'assets/plan-template.html'), 'utf8');
html = html
  .replace('/*__PLANNER_CORE__*/', () =>
    readFileSync(resolve(root, 'assets/planner-core.js'), 'utf8')
  )
  .replace('/*__PLANNER_UI__*/', () =>
    readFileSync(resolve(root, 'assets/planner-ui.js'), 'utf8')
  )
  .replace('__PLAN_DATA__', () => json);
mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(output, html);
console.log(resolve(output));
