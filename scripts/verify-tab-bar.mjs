#!/usr/bin/env node
/**
 * Fails if tab bar / root layout drift from MotusTots standards.
 * Run: npm run check:tab-bar
 * Hook: npm run preflight (merge main + verify)
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const tabsLayout = join(repoRoot, 'app/(tabs)/_layout.tsx');
const rootLayout = join(repoRoot, 'app/_layout.tsx');

function fail(msg) {
  console.error(`check:tab-bar — ${msg}`);
  process.exit(1);
}

for (const p of [tabsLayout, rootLayout]) {
  if (!existsSync(p)) fail(`missing ${p}`);
}

const tabs = readFileSync(tabsLayout, 'utf8');
const rootFile = readFileSync(rootLayout, 'utf8');

if (!tabs.includes('006A60')) {
  fail('app/(tabs)/_layout.tsx must use brand active tint #006A60 (not default purple).');
}
if (!tabs.includes('MaterialCommunityIcons')) {
  fail('app/(tabs)/_layout.tsx must use MaterialCommunityIcons (not emoji tab icons).');
}
if (!tabs.includes('useSafeAreaInsets')) {
  fail('app/(tabs)/_layout.tsx must use useSafeAreaInsets for tab bar padding.');
}
if (!tabs.includes('name="activities"')) {
  fail('app/(tabs)/_layout.tsx must register a tab screen name="activities".');
}
const pos = (needle) => tabs.indexOf(needle);
const home = pos('name="index"');
const edu = pos('name="education"');
const rem = pos('name="reminders"');
const act = pos('name="activities"');
const more = pos('name="profile"');
if (home < 0 || edu < 0 || rem < 0 || act < 0 || more < 0) {
  fail('app/(tabs)/_layout.tsx must define all tab screens (index, education, reminders, activities, profile).');
}
if (!(home < edu && edu < rem && rem < act && act < more)) {
  fail('Tab order must be: Home, Education, Reminders, Activities, More (profile last).');
}
if (!rootFile.includes('SafeAreaProvider')) {
  fail('app/_layout.tsx must wrap the app in SafeAreaProvider.');
}

console.log('check:tab-bar — OK');
