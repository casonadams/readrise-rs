// Ids in learners' saved progress must never disappear: ids.lock and items.lock list every one that has shipped.
// Run by scripts/test.ts; `bun scripts/locks.ts` runs it alone.
import { type Course, courseQuestions } from "../src/core/course";

function isCourse(value: unknown): value is Course {
  return typeof value === "object" && value !== null && "lessons" in value && "requires" in value && "id" in value;
}

/** Every course in `src/courses`, read from its content alone (which loads without nsh). */
async function courses(): Promise<Course[]> {
  const found: Course[] = [];
  for await (const path of new Bun.Glob("src/courses/*/course.ts").scan(".")) {
    // The course modules are found at run time, so they cannot be imported statically.
    const module: Record<string, unknown> = await import(`../${path}`);
    found.push(...Object.values(module).filter(isCourse));
  }
  return found;
}

async function lockIssues(file: string, installed: ReadonlySet<string>): Promise<string[]> {
  const lines = (await Bun.file(file).text()).split("\n").map((line) => line.trim());
  const locked = new Set(lines.filter((line) => line !== "" && !line.startsWith("#")));
  return [
    ...[...locked].filter((id) => !installed.has(id)).map((id) => `${file}: ${id} has shipped; never rename or remove it`),
    ...[...installed].filter((id) => !locked.has(id)).map((id) => `${file}: ${id} is new; add it in sorted order`),
  ];
}

/** Every locked id that is gone and every id not yet locked; empty when the locks match the courses. */
export async function lockFileIssues(): Promise<string[]> {
  const all = await courses();
  const ids = all.flatMap((c) => [c.id, ...c.lessons.map((l) => `${c.id}/${l.id}`)]);
  const items = all.flatMap((c) => courseQuestions(c).map((q) => `${c.id}/${q.id}`));
  return [...(await lockIssues("ids.lock", new Set(ids))), ...(await lockIssues("items.lock", new Set(items)))];
}

if (import.meta.main) {
  const issues = await lockFileIssues();
  for (const issue of issues) console.error(issue);
  console.log(`${issues.length} lock issue(s)`);
  process.exit(issues.length > 0 ? 1 : 0);
}
