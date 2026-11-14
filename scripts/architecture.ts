// Import rules between layers. Run by scripts/test.ts; `bun scripts/architecture.ts` runs it alone.
import { dirname, join, normalize } from "node:path";

type Layer = "core" | "ui" | "kit" | "course" | "app" | "tests";

interface Module {
  readonly path: string;
  readonly layer: Layer;
  /** The kit or course folder, e.g. `src/science` or `src/courses/states-of-matter`. */
  readonly home: string;
  readonly test: boolean;
  /** Relative imports, resolved to repo paths. */
  readonly local: readonly string[];
  /** Bare imports that are not type-only, e.g. `nsh`. */
  readonly packages: readonly string[];
}

const importPattern = /^\s*(?:import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/gm;

function placeOf(path: string): { layer: Layer; home: string } {
  if (path === "App.tsx" || path.startsWith("src/app/")) return { layer: "app", home: "" };
  if (path.startsWith("tests/")) return { layer: "tests", home: "tests" };
  if (path.startsWith("src/core/")) return { layer: "core", home: "src/core" };
  if (path.startsWith("src/ui/")) return { layer: "ui", home: "src/ui" };
  const course = path.match(/^src\/courses\/[^/]+/);
  if (course !== null) return { layer: "course", home: course[0] };
  const kit = path.match(/^src\/[^/]+/);
  if (kit !== null) return { layer: "kit", home: kit[0] };
  throw new Error(`${path} is in no layer`);
}

async function resolve(from: string, spec: string): Promise<string> {
  const base = normalize(join(dirname(from), spec));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (candidate.endsWith(".ts") || candidate.endsWith(".tsx")) {
      if (await Bun.file(candidate).exists()) return candidate;
    }
  }
  throw new Error(`${from}: cannot resolve ${spec}`);
}

async function load(path: string): Promise<Module> {
  const source = await Bun.file(path).text();
  const local: string[] = [];
  const packages: string[] = [];
  for (const match of source.matchAll(importPattern)) {
    const [, typeOnly, spec] = match;
    if (spec.startsWith(".")) local.push(await resolve(path, spec));
    else if (typeOnly === undefined) packages.push(spec);
  }
  return { path, ...placeOf(path), test: /\.test\.tsx?$/.test(path), local, packages };
}

function allowed(from: Module, to: Module): boolean {
  if (to.layer === "tests") return from.layer === "tests";
  switch (from.layer) {
    case "core":
      return to.layer === "core";
    case "ui":
      return to.layer === "core" || to.layer === "ui";
    case "kit":
      return to.layer === "core" || to.layer === "ui" || to.home === from.home;
    case "course":
      return to.layer === "core" || to.layer === "ui" || to.layer === "kit" || to.home === from.home;
    case "app":
    case "tests":
      return true;
  }
}

function allowedPackage(from: Module, name: string): boolean {
  if (from.layer === "core") return from.test && name === "nsh/test";
  return name === "nsh" || name.startsWith("nsh/") || from.layer === "tests";
}

/** Every broken rule, as `file: problem`; empty when the layers hold. */
export async function architectureIssues(): Promise<string[]> {
  const paths = [
    "App.tsx",
    ...(await Array.fromAsync(new Bun.Glob("{src,tests}/**/*.{ts,tsx}").scan("."))),
  ].sort();
  const modules = new Map<string, Module>();
  for (const path of paths) modules.set(path, await load(path));
  const issues: string[] = [];
  for (const from of modules.values()) {
    for (const target of from.local) {
      const to = modules.get(target);
      if (to === undefined) continue;
      if (!allowed(from, to)) issues.push(`${from.path}: a ${from.layer} may not import ${to.path} (${to.layer})`);
    }
    for (const name of from.packages) {
      if (!allowedPackage(from, name)) issues.push(`${from.path}: a ${from.layer} may not import ${name}`);
    }
  }
  // A course's content loads without nsh, so scripts can read its lessons and ids.
  for (const course of paths.filter((p) => /^src\/courses\/[^/]+\/course\.ts$/.test(p))) {
    const seen = new Set<string>();
    const queue = [course];
    while (queue.length > 0) {
      const module = modules.get(queue.pop() as string) as Module;
      if (seen.has(module.path)) continue;
      seen.add(module.path);
      if (module.packages.length > 0) {
        issues.push(`${course}: its content reaches ${module.path}, which imports ${module.packages.join(", ")}`);
      }
      queue.push(...module.local);
    }
  }
  return issues;
}

if (import.meta.main) {
  const issues = await architectureIssues();
  for (const issue of issues) console.error(issue);
  console.log(`${issues.length} architecture issue(s)`);
  process.exit(issues.length > 0 ? 1 : 0);
}
