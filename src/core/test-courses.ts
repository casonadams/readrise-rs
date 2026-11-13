import type { Course, Lesson, Subject } from "./course";

export type Plain = { readonly kind: "plain" };

const plain: Plain = { kind: "plain" };

export const reading: Subject = { id: "reading", title: "Reading", emoji: "R", color: "#FF7A2F" };
export const maths: Subject = { id: "maths", title: "Maths", emoji: "M", color: "#43A047" };

export function lesson(id: string): Lesson<Plain> {
  return { id, title: id.toUpperCase(), activities: [plain] };
}

export function course(
  id: string,
  lessonIds: readonly string[],
  options: { subject?: Subject; requires?: readonly string[] } = {},
): Course<Plain> {
  return {
    id,
    title: id,
    grade: "grade1",
    subject: options.subject ?? reading,
    requires: options.requires ?? [],
    lessons: lessonIds.map(lesson),
  };
}
