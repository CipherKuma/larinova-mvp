/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Next 16 auto-injects `import "./.next/types/routes.d.ts";` into
// next-env.d.ts on every build. That import makes next-env.d.ts a module,
// which scopes its triple-slash reference directives and prevents DOM
// lib types from loading globally — so `window`, `document`, etc. become
// unknown in client components. This file restores them via a module-free
// .d.ts that DOES get treated as an ambient declaration.
