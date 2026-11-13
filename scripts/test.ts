// Runs every test file in parallel under `nsh test --trace` and lints the screens they lay out (overflowing text,
// views clipped or off screen, collapsed canvases). Usage: bun scripts/test.ts [test files...]; LAYOUT_TRACE=file lints a saved trace.

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Node {
  id: number;
  kind: string;
  parent: number | null;
  children: number[];
  frame: Rect;
  clips: boolean;
  scroll: "vertical" | "horizontal" | null;
  text: string | null;
  content: { w: number; h: number } | null;
  label: string | null;
  scaled: boolean;
}

interface Issue {
  rule: string;
  where: string;
  detail: string;
}

const tolerance = 0.5;
const minCanvas = 8;
/** A slider thumb overhangs its thin track by design. */
const maxTrack = 12;

class Screen {
  private readonly nodes = new Map<number, Node>();

  private node(id: number): Node {
    let n = this.nodes.get(id);
    if (n === undefined) {
      n = { id, kind: "?", parent: null, children: [], frame: { x: 0, y: 0, w: 0, h: 0 }, clips: false, scroll: null, text: null, content: null, label: null, scaled: false };
      this.nodes.set(id, n);
    }
    return n;
  }

  apply(item: string): void {
    const num = (key: string) => {
      const m = item.match(new RegExp(`\\b${key}: (-?[\\d.]+)`));
      return m === null ? Number.NaN : Number(m[1]);
    };
    const head = item.match(/^(\w+) \{ id: (\d+)/);
    const kind = item.match(/^(\w+) \{/)?.[1];
    switch (kind) {
      case "Create": {
        const n = this.node(num("id"));
        n.kind = item.match(/kind: (\w+)/)?.[1] ?? "?";
        return;
      }
      case "Insert": {
        const parent = this.node(num("parent"));
        const child = this.node(num("child"));
        if (child.parent !== null) this.detach(child);
        child.parent = parent.id;
        parent.children.push(child.id);
        return;
      }
      case "Remove":
        this.detach(this.node(num("id")));
        return;
      case "Delete":
        this.nodes.delete(num("id"));
        return;
      case "Frame": {
        const n = this.node(num("id"));
        n.frame = { x: num("x"), y: num("y"), w: num("w"), h: num("h") };
        return;
      }
      case "Text": {
        const n = this.node(num("id"));
        n.text = item.match(/text: "((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
        const c = item.match(/content: ([\d.]+)x([\d.]+)/);
        n.content = c === null ? null : { w: Number(c[1]), h: Number(c[2]) };
        return;
      }
      case "ViewStyle": {
        const n = this.node(num("id"));
        n.clips = /overflow_hidden: true/.test(item);
        n.scaled = /kind: Scale/.test(item);
        return;
      }
      case "ScrollConfig":
        this.node(num("id")).scroll = /horizontal: true/.test(item) ? "horizontal" : "vertical";
        return;
      case "ViewProps":
      case "AccessibilityLabel": {
        const label = item.match(/label: Some\("((?:[^"\\]|\\.)*)"\)/)?.[1];
        if (head !== null && label !== undefined) this.node(Number(head[2])).label = label;
        return;
      }
    }
  }

  private detach(child: Node): void {
    const parent = child.parent === null ? undefined : this.nodes.get(child.parent);
    if (parent !== undefined) parent.children = parent.children.filter((c) => c !== child.id);
    child.parent = null;
  }

  private absolute(n: Node): Rect {
    let x = n.frame.x;
    let y = n.frame.y;
    for (let p = n.parent === null ? undefined : this.nodes.get(n.parent); p !== undefined; ) {
      x += p.frame.x;
      y += p.frame.y;
      p = p.parent === null ? undefined : this.nodes.get(p.parent);
    }
    return { x, y, w: n.frame.w, h: n.frame.h };
  }

  private describe(n: Node): string {
    if (n.label) return `"${n.label}"`;
    if (n.text) return `"${n.text}"`;
    const stack = [...n.children];
    while (stack.length > 0) {
      const c = this.nodes.get(stack.shift() as number);
      if (c === undefined) continue;
      if (c.label) return `${n.kind} with "${c.label}"`;
      if (c.text) return `${n.kind} with "${c.text}"`;
      stack.push(...c.children);
    }
    return `${n.kind} #${n.id}`;
  }

  size(): string {
    const root = this.root();
    if (root === undefined) return "?";
    const { w, h } = this.viewport(root);
    return `${w}x${h}`;
  }

  /** Frames are laid out before transforms, so a scaled view and what is in it cannot be judged from them. */
  private underScale(n: Node): boolean {
    for (let p: Node | undefined = n; p !== undefined; p = p.parent === null ? undefined : this.nodes.get(p.parent)) {
      if (p.scaled) return true;
    }
    return false;
  }

  /** The screen's root: the parentless view with the most views under it. */
  private root(): Node | undefined {
    let best: Node | undefined;
    let bestSize = -1;
    for (const n of this.nodes.values()) {
      if (n.parent !== null) continue;
      const size = this.attached(n).length;
      if (size > bestSize) {
        best = n;
        bestSize = size;
      }
    }
    return best;
  }

  /** The screen's size: the largest frame among the root and the views just under it (the root may be frameless). */
  private viewport(root: Node): { w: number; h: number } {
    let best = root.frame;
    const near = root.children.flatMap((id) => [id, ...(this.nodes.get(id)?.children ?? [])]);
    for (const id of near) {
      const f = this.nodes.get(id)?.frame;
      if (f !== undefined && f.w * f.h > best.w * best.h) best = f;
    }
    return { w: best.w, h: best.h };
  }

  /** Views attached to the screen's root. */
  private attached(root: Node): Node[] {
    const out: Node[] = [];
    const stack = [root];
    while (stack.length > 0) {
      const n = stack.pop() as Node;
      out.push(n);
      for (const id of n.children) {
        const c = this.nodes.get(id);
        if (c !== undefined) stack.push(c);
      }
    }
    return out;
  }

  check(): Issue[] {
    const issues: Issue[] = [];
    const root = this.root();
    if (root === undefined) return issues;
    const { w, h } = this.viewport(root);
    const fmt = (r: Rect) => `${r.x.toFixed(0)},${r.y.toFixed(0)} ${r.w.toFixed(0)}x${r.h.toFixed(0)}`;
    for (const n of this.attached(root)) {
      if (this.underScale(n)) continue;
      const rect = this.absolute(n);
      if (rect.w <= 0 && rect.h <= 0) continue;
      if (n.content !== null && n.text && (n.content.w > n.frame.w + tolerance || n.content.h > n.frame.h + tolerance)) {
        issues.push({ rule: "text-overflow", where: this.describe(n), detail: `needs ${n.content.w}x${n.content.h}, has ${n.frame.w}x${n.frame.h}` });
      }
      if (n.kind === "Canvas" && (n.frame.w < minCanvas || n.frame.h < minCanvas)) {
        issues.push({ rule: "collapsed", where: this.describe(n), detail: `canvas is ${n.frame.w}x${n.frame.h}` });
      }
      const parent = n.parent === null ? undefined : this.nodes.get(n.parent);
      const thinTrack = parent !== undefined && parent.frame.h <= maxTrack;
      if (parent !== undefined && parent.scroll === null && !thinTrack && parent.frame.w > 0 && parent.frame.h > 0) {
        const f = n.frame;
        if (f.x < -tolerance || f.y < -tolerance || f.x + f.w > parent.frame.w + tolerance || f.y + f.h > parent.frame.h + tolerance) {
          issues.push({ rule: "spills-out", where: this.describe(n), detail: `${fmt(rect)} outside its parent ${this.describe(parent)} ${fmt(this.absolute(parent))}` });
        }
      }
      let inVerticalScroll = false;
      for (let p = n.parent === null ? undefined : this.nodes.get(n.parent); p !== undefined; ) {
        const pr = this.absolute(p);
        const vertical = p.scroll === "vertical";
        const horizontal = p.scroll === "horizontal";
        if (vertical) inVerticalScroll = true;
        if (p.clips || p.scroll !== null) {
          const outX = rect.x < pr.x - tolerance || rect.x + rect.w > pr.x + pr.w + tolerance;
          const outY = rect.y < pr.y - tolerance || rect.y + rect.h > pr.y + pr.h + tolerance;
          if ((outX && !horizontal) || (outY && !vertical && !inVerticalScroll)) {
            issues.push({ rule: "clipped", where: this.describe(n), detail: `${fmt(rect)} outside ${this.describe(p)} ${fmt(pr)}` });
            break;
          }
        }
        p = p.parent === null ? undefined : this.nodes.get(p.parent);
      }
      if (w > 0 && (rect.x < -tolerance || rect.x + rect.w > w + tolerance)) {
        issues.push({ rule: "off-screen-x", where: this.describe(n), detail: `${fmt(rect)} on a ${w}pt-wide screen` });
      }
      if (h > 0 && !inVerticalScroll && rect.y + rect.h > h + tolerance && rect.h > 0) {
        issues.push({ rule: "off-screen-y", where: this.describe(n), detail: `${fmt(rect)} on a ${h}pt-tall screen` });
      }
    }
    return issues;
  }
}

async function testFiles(): Promise<string[]> {
  const given = process.argv.slice(2);
  if (given.length > 0) return given;
  const found: string[] = [];
  for (const root of ["src", "tests"]) {
    found.push(...(await Array.fromAsync(new Bun.Glob(`${root}/**/*.test.{ts,tsx}`).scan("."))));
  }
  return found.sort();
}

/** Runs `work` over `items` with at most `limit` at a time, keeping the results in order. */
async function pool<T, R>(items: readonly T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await work(items[i]);
    }
  });
  await Promise.all(lanes);
  return results;
}

async function trace(file: string): Promise<{ output: string; ok: boolean }> {
  const proc = Bun.spawn(["mise", "exec", "--", "nsh", "test", file, "--trace"], { stdout: "pipe", stderr: "pipe" });
  const output = (await new Response(proc.stdout).text()) + (await new Response(proc.stderr).text());
  return { output, ok: (await proc.exited) === 0 };
}

/** Issues found in one trace, by test: the k-th app opened belongs to the k-th test reported. */
function lint(output: string): Map<string, Set<string>> {
  const blocks: { issues: Map<string, Set<string>> }[] = [];
  const names: string[] = [];
  let screen = new Screen();
  let step = "";
  const flush = () => {
    if (step === "" || blocks.length === 0) return;
    const current = blocks[blocks.length - 1].issues;
    for (const issue of screen.check()) {
      const key = `${issue.rule}: ${issue.where} (${issue.detail})`;
      if (!current.has(key)) current.set(key, new Set());
      (current.get(key) as Set<string>).add(`${screen.size()} :: ${step}`);
    }
  };
  for (const raw of output.split("\n")) {
    const header = raw.match(/^── (.*): \d+ items$/);
    if (header !== null) {
      flush();
      if (header[1].startsWith("open(") && header[1] !== step) {
        screen = new Screen();
        blocks.push({ issues: new Map() });
      }
      step = header[1];
      continue;
    }
    const result = raw.match(/^[✓✗] (\S+\.test\.tsx? › .+?) \(\d/);
    if (result !== null) {
      flush();
      step = "";
      names.push(result[1]);
      continue;
    }
    const item = raw.match(/^\s{3}([A-Z]\w+ \{.*)$/);
    if (item !== null && step !== "") screen.apply(item[1]);
  }
  flush();
  const found = new Map<string, Set<string>>();
  blocks.forEach((block, i) => {
    for (const [key, steps] of block.issues) {
      if (!found.has(key)) found.set(key, new Set());
      for (const where of steps) (found.get(key) as Set<string>).add(`${names[i] ?? "?"} :: ${where}`);
    }
  });
  return found;
}

const saved = process.env.LAYOUT_TRACE;
const runs = saved
  ? [{ file: saved, output: await Bun.file(saved).text(), ok: true }]
  : await pool(await testFiles(), Number(process.env.TEST_JOBS ?? navigator.hardwareConcurrency), async (file) => ({
      file,
      ...(await trace(file)),
    }));

let total = 0;
let failed = false;
for (const run of runs) {
  if (!run.ok) {
    failed = true;
    console.error(`${run.file}: nsh test failed; the layout below covers the steps that ran.`);
    const lines = run.output.split("\n");
    lines.forEach((line, i) => {
      if (line.startsWith("\u2717 ")) console.error(lines.slice(i, i + 4).join("\n"));
    });
  }
  const summary = run.output.split("\n").find((line) => / tests?: \d+ passed/.test(line));
  console.log(`${run.file}: ${summary?.replace(/^\S+ /, "") ?? "no summary"}`);
  const found = lint(run.output);
  total += found.size;
  for (const [key, wheres] of found) {
    console.log(`\n${key}`);
    for (const w of [...wheres].slice(0, 3)) console.log(`  at ${w}`);
    if (wheres.size > 3) console.log(`  ... and ${wheres.size - 3} more steps`);
  }
}
console.log(`\n${total} layout issue(s) in ${runs.length} test file(s)${failed ? "; some tests failed" : ""}`);
process.exit(total > 0 || failed ? 1 : 0);
