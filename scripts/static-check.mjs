// Static checks that complement tsc and eslint by catching what they cannot:
// Next.js does not validate <Link> hrefs at compile time, so a link to a
// non-existent route builds cleanly and 404s in production. This also guards
// against stale brand strings and unescaped JSX entities.
//
// Run via: npm run check:static
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'src'

/**
 * Admin routes linked from the console but not yet built — Phase 2 of the
 * delivery plan in docs/PLATFORM_ARCHITECTURE.md.
 *
 * Listed explicitly rather than ignored so they stay visible. They do not break
 * the build (Next does not validate Link hrefs at compile time) but they do 404
 * for staff, so each must be removed from this list as the page ships.
 */
const KNOWN_MISSING_ROUTES = [
  '/admin/jobs/new',
  '/admin/jobs/[id]',
  '/admin/customers/new',
  '/admin/customers/[id]',
  '/admin/inventory/new',
  '/admin/inventory/[id]',
  '/admin/technicians/new',
  '/admin/technicians/[id]',
  '/admin/settings/users',
]
function isKnownMissing(href) {
  const clean = href.replace(/\$\{[^}]+\}/g, '[id]').replace(/\/$/, '')
  return KNOWN_MISSING_ROUTES.includes(clean)
}

let errors = 0
let warnings = 0
const err = (m) => { console.log('  ❌ ' + m); errors++ }
const warn = (m) => { console.log('  ⚠️  ' + m); warnings++ }

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p)
  }
  return acc
}
const files = walk(SRC)

// ---------------------------------------------------------------- 1. routes
console.log('\n=== 1. Internal Link hrefs resolve to real routes ===')
const pageFiles = files.filter((f) => /(^|[\\/])page\.tsx$/.test(f))
const routes = new Set(
  pageFiles.map((f) =>
    '/' +
    f
      .replace(/^src[\\/]app[\\/]?/, '')
      .replace(/[\\/]?page\.tsx$/, '')
      .split(path.sep)
      .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
      .join('/')
  )
)
routes.add('/')

function routeMatches(href) {
  const clean = href.split('?')[0].split('#')[0].replace(/\/$/, '') || '/'
  if (routes.has(clean)) return true
  for (const r of routes) {
    if (!r.includes('[')) continue
    const rx = new RegExp('^' + r.replace(/\[[^\]]+\]/g, '[^/]+') + '$')
    if (rx.test(clean)) return true
  }
  return false
}

const dynamicHrefRe = /href=\{`([^`]+)`\}/g
const staticHrefRe = /href="(\/[^"]*)"/g
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  for (const m of c.matchAll(staticHrefRe)) {
    if (routeMatches(m[1])) continue
    if (isKnownMissing(m[1])) { warn(`${f}: href="${m[1]}" — Phase 2, not built yet`); continue }
    err(`${f}: href="${m[1]}" has no matching route`)
  }
  for (const m of c.matchAll(dynamicHrefRe)) {
    const tmpl = m[1]
    if (!tmpl.startsWith('/')) continue
    const probe = tmpl.replace(/\$\{[^}]+\}/g, 'X')
    if (routeMatches(probe)) continue
    if (isKnownMissing(tmpl)) { warn(`${f}: href={\`${tmpl}\`} — Phase 2, not built yet`); continue }
    err(`${f}: href={\`${tmpl}\`} has no matching route`)
  }
}
console.log(`  routes found: ${[...routes].sort().join(', ')}`)

// ------------------------------------------------- 2. named imports exist
console.log('\n=== 2. Every named import exists as an export ===')
const exportCache = new Map()
function exportsOf(file) {
  if (exportCache.has(file)) return exportCache.get(file)
  const c = fs.readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of c.matchAll(
    /export\s+(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g
  )) names.add(m[1])
  // Must handle `export type { ... }` as well as `export { ... }`
  for (const m of c.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
    for (let part of m[1].split(',')) {
      part = part.trim().replace(/^type\s+/, '')
      if (!part) continue
      const as = part.split(/\s+as\s+/)
      names.add((as[1] || as[0]).trim())
    }
  }
  if (/export\s+\*\s+from/.test(c)) names.add('*STAR*')
  exportCache.set(file, names)
  return names
}
function resolveAlias(spec) {
  if (!spec.startsWith('@/')) return null
  const base = spec.replace('@/', 'src/')
  for (const cand of [base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx']) {
    if (fs.existsSync(cand)) return cand
  }
  return null
}
function resolveRelative(spec, fromFile) {
  const base = path.join(path.dirname(fromFile), spec)
  for (const cand of [base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx']) {
    if (fs.existsSync(cand)) return cand
  }
  return null
}
const importRe = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  for (const m of c.matchAll(importRe)) {
    const spec = m[2]
    if (!spec.startsWith('@/') && !spec.startsWith('.')) continue
    const target = spec.startsWith('@/') ? resolveAlias(spec) : resolveRelative(spec, f)
    if (!target) { err(`${f}: cannot resolve module '${spec}'`); continue }
    const avail = exportsOf(target)
    if (avail.has('*STAR*')) continue
    for (let part of m[1].split(',')) {
      part = part.trim().replace(/^type\s+/, '')
      if (!part) continue
      const name = part.split(/\s+as\s+/)[0].trim()
      if (!avail.has(name)) {
        err(`${f}: imports '${name}' from '${spec}' but it is not exported there`)
      }
    }
  }
}

// ----------------------------------------------------- 3. default imports
console.log('\n=== 3. Default imports resolve ===')
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  for (const m of c.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from\s+['"](@\/[^'"]+|\.[^'"]+)['"]/g)) {
    const target = m[2].startsWith('@/') ? resolveAlias(m[2]) : resolveRelative(m[2], f)
    if (!target) err(`${f}: cannot resolve '${m[2]}'`)
  }
}

// ------------------------------------------------------ 4. unused imports
console.log('\n=== 4. Unused imports (lint error: no-unused-vars) ===')
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  const lines = c.split('\n')
  const importLineIdx = new Set()
  let depth = 0
  lines.forEach((l, i) => {
    if (/^\s*import\b/.test(l)) { depth = 0 }
    if (/^\s*import\b/.test(l) || depth > 0) {
      importLineIdx.add(i)
      depth += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length
      if (depth < 0) depth = 0
      if (/from\s+['"][^'"]+['"]/.test(l)) depth = 0
    }
  })
  const body = lines.filter((_, i) => !importLineIdx.has(i)).join('\n')
  const names = new Set()
  for (const m of c.matchAll(importRe)) {
    for (let part of m[1].split(',')) {
      part = part.trim().replace(/^type\s+/, '')
      if (!part) continue
      const as = part.split(/\s+as\s+/)
      names.add((as[1] || as[0]).trim())
    }
  }
  for (const m of c.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) {
    if (m[1] !== 'type') names.add(m[1])
  }
  for (const n of names) {
    if (!new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b').test(body)) {
      err(`${f}: '${n}' imported but never used`)
    }
  }
}

// -------------------------------------------- 5. client directive vs hooks
console.log('\n=== 5. Hooks require \'use client\' ===')
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  const usesHook = /\b(useState|useEffect|useMemo|useCallback|useRef|useRouter|usePathname)\s*[(<]/.test(c)
  const hasDirective = /^\s*['"]use client['"]/.test(c)
  if (usesHook && !hasDirective) err(`${f}: uses React hooks without 'use client'`)
  const usesOnClick = /onClick=|onChange=|onSubmit=/.test(c)
  if (usesOnClick && !hasDirective) err(`${f}: has event handlers without 'use client'`)
}

// ---------------------------------------- 6. server actions need directive
console.log('\n=== 6. Server action files declare \'use server\' ===')
for (const f of files.filter((x) => x.includes('lib/actions'))) {
  const c = fs.readFileSync(f, 'utf8')
  if (!/^\s*['"]use server['"]/.test(c)) err(`${f}: missing 'use server'`)
}

// ------------------------------------------ 7. unescaped entities in JSX
console.log('\n=== 7. Unescaped apostrophes/quotes in JSX text ===')
for (const f of files.filter((x) => x.endsWith('.tsx'))) {
  const c = fs.readFileSync(f, 'utf8')
  c.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
    // JSX text between > and < on the same line
    for (const m of line.matchAll(/>([^<>{}\n]*[''"][^<>{}\n]*)</g)) {
      const text = m[1]
      if (/^\s*$/.test(text)) continue
      err(`${f}:${i + 1}: unescaped entity in JSX text -> ${text.trim().slice(0, 50)}`)
    }
  })
}

// --------------------------------------------------------- 8. code smells
console.log('\n=== 8. any / console.log / placeholders ===')
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  if (/:\s*any\b|<any>|as any\b/.test(c)) err(`${f}: explicit 'any'`)
  if (/console\.log\(/.test(c)) err(`${f}: console.log (lint: no-console)`)
  if (/919999999999|Exceller\s+(Computer|Infosolutions)/.test(c)) {
    if (!f.includes('constants')) err(`${f}: stale placeholder/brand string`)
  }
}

// -------------------------------------------- 9. Link import consistency
console.log('\n=== 9. Link usage vs import ===')
for (const f of files.filter((x) => x.endsWith('.tsx'))) {
  const c = fs.readFileSync(f, 'utf8')
  const uses = /<Link[\s>]/.test(c)
  const imports = /^import Link from 'next\/link'/m.test(c)
  if (uses !== imports) err(`${f}: <Link> used=${uses} imported=${imports}`)
}

// ------------------------------------------ 10. internal anchors must be Link
console.log('\n=== 10. No internal <a href="/"> ===')
for (const f of files.filter((x) => x.endsWith('.tsx'))) {
  const c = fs.readFileSync(f, 'utf8')
  for (const m of c.matchAll(/<a\s+[^>]*href="(\/[^"]*)"/g)) {
    err(`${f}: internal <a href="${m[1]}"> should be <Link>`)
  }
}

// --------------------------------------- 11. generateStaticParams coverage
console.log('\n=== 11. Dynamic routes have generateStaticParams ===')
for (const f of pageFiles.filter((x) => x.includes('['))) {
  const c = fs.readFileSync(f, 'utf8')
  if (!/generateStaticParams/.test(c)) warn(`${f}: no generateStaticParams (will render dynamically)`)
  if (!/params:\s*Promise</.test(c)) err(`${f}: params must be typed Promise<> in Next 15`)
}

console.log('\n' + '='.repeat(58))
console.log(errors === 0 ? `✅ PASSED — 0 errors, ${warnings} warning(s)` : `❌ ${errors} error(s), ${warnings} warning(s)`)
process.exit(errors === 0 ? 0 : 1)
