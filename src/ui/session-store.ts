import { Storage } from "nsh";
import { type LessonSession, parseSession, sessionStorageKey } from "../core/session";

/** The one lesson in progress, saved on the device. */
export const sessionStore = {
  load: async (): Promise<LessonSession | null> => parseSession(await Storage.getItem(sessionStorageKey)),
  save: (session: LessonSession): Promise<void> => Storage.setItem(sessionStorageKey, JSON.stringify(session)),
  /** Forgets the saved session if it belongs to `lesson` (a `lessonKey`). */
  async clear(lesson: string): Promise<void> {
    if ((await this.load())?.lesson === lesson) await Storage.removeItem(sessionStorageKey);
  },
};
