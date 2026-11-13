import type { Course, Lesson, Subject } from "./course";
import { isCourseComplete, type Progress, starsOf } from "./progress";

export interface LessonRef<A = unknown> {
  readonly course: Course<A>;
  readonly lesson: Lesson<A>;
}

/** The installed courses, in learning order; throws when they are inconsistent. */
export class Catalog<A = unknown> {
  readonly courses: readonly Course<A>[];

  constructor(courses: readonly Course<A>[]) {
    const seen = new Set<string>();
    const subjects = new Map<string, Subject>();
    for (const course of courses) {
      if (seen.has(course.id)) throw new Error(`duplicate course ${course.id}`);
      seen.add(course.id);
      for (const required of course.requires) {
        if (!seen.has(required) || required === course.id) {
          throw new Error(`course ${course.id} requires ${required}, which is not installed before it`);
        }
      }
      const known = subjects.get(course.subject.id);
      if (known !== undefined && known.title !== course.subject.title) {
        throw new Error(
          `course ${course.id} declares subject ${course.subject.id} as "${course.subject.title}" ` +
            `but "${known.title}" was already registered`,
        );
      }
      subjects.set(course.subject.id, course.subject);
      if (course.lessons.length === 0) throw new Error(`course ${course.id} has no lessons`);
      const lessonIds = new Set<string>();
      for (const lesson of course.lessons) {
        if (lessonIds.has(lesson.id)) throw new Error(`duplicate lesson ${course.id}/${lesson.id}`);
        lessonIds.add(lesson.id);
        if (lesson.activities.length === 0) throw new Error(`lesson ${course.id}/${lesson.id} has no activities`);
      }
    }
    this.courses = courses;
  }

  course(id: string): Course<A> {
    const course = this.courses.find((c) => c.id === id);
    if (course === undefined) throw new Error(`unknown course ${id}`);
    return course;
  }

  lesson(courseId: string, lessonId: string): LessonRef<A> {
    const course = this.course(courseId);
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson === undefined) throw new Error(`unknown lesson ${courseId}/${lessonId}`);
    return { course, lesson };
  }

  isCourseUnlocked(progress: Progress, course: Course<A>): boolean {
    return course.requires.every((id) => isCourseComplete(progress, this.course(id)));
  }

  /** Open when its course is open and the previous lesson has a star. */
  isLessonUnlocked(progress: Progress, course: Course<A>, lesson: Lesson<A>): boolean {
    if (!this.isCourseUnlocked(progress, course)) return false;
    const i = course.lessons.indexOf(lesson);
    return i === 0 || starsOf(progress, course, course.lessons[i - 1]) > 0;
  }

  /** The first open lesson without a star, within `subjectId` or anywhere. */
  nextUp(progress: Progress, subjectId?: string): LessonRef<A> | null {
    return this.firstOpen(
      progress,
      this.courses.filter((c) => subjectId === undefined || c.subject.id === subjectId),
    );
  }

  /** Where "Continue" leads: the next lesson in the subject last practised, else the next open one anywhere. */
  continueTarget(progress: Progress, closed: ReadonlySet<string> = new Set()): LessonRef<A> | null {
    const courseId = progress.lastLesson?.split("/")[0];
    const last = this.courses.find((c) => c.id === courseId && !closed.has(c.subject.id));
    const inSubject = last === undefined ? null : this.nextUp(progress, last.subject.id);
    return inSubject ?? this.firstOpen(progress, this.courses.filter((c) => !closed.has(c.subject.id)));
  }

  private firstOpen(progress: Progress, courses: readonly Course<A>[]): LessonRef<A> | null {
    for (const course of courses) {
      for (const lesson of course.lessons) {
        if (starsOf(progress, course, lesson) === 0 && this.isLessonUnlocked(progress, course, lesson)) {
          return { course, lesson };
        }
      }
    }
    return null;
  }
}

export interface SubjectSummary<A = unknown> {
  readonly subject: Subject;
  readonly courses: readonly Course<A>[];
  readonly lessonsDone: number;
  readonly lessonsTotal: number;
  readonly next: LessonRef<A> | null;
  /** False for a subject listed but not available yet. */
  readonly open: boolean;
}

/** One summary per subject, in the order subjects first appear. */
export function summarizeSubjects<A>(
  catalog: Catalog<A>,
  progress: Progress,
  closed: ReadonlySet<string> = new Set(),
): SubjectSummary<A>[] {
  const bySubject = new Map<string, Course<A>[]>();
  for (const course of catalog.courses) {
    const list = bySubject.get(course.subject.id) ?? [];
    list.push(course);
    bySubject.set(course.subject.id, list);
  }
  return [...bySubject.values()].map((courses) => ({
    subject: courses[0].subject,
    courses,
    lessonsDone: courses.reduce((n, c) => n + c.lessons.filter((l) => starsOf(progress, c, l) > 0).length, 0),
    lessonsTotal: courses.reduce((n, c) => n + c.lessons.length, 0),
    next: catalog.nextUp(progress, courses[0].subject.id),
    open: !closed.has(courses[0].subject.id),
  }));
}
