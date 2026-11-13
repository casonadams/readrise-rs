import { type Signal, signal, Storage } from "nsh";
import { emptyProgress, parseProgress, type Progress, progressStorageKey } from "../core/progress";

/** The learner's progress, loaded from the device and saved after every change. */
export interface ProgressStore {
  readonly progress: Signal<Progress>;
  readonly loaded: Promise<void>;
  save(next: Progress): Promise<void>;
}

export function createProgressStore(): ProgressStore {
  const progress = signal(emptyProgress);
  return {
    progress,
    loaded: Storage.getItem(progressStorageKey).then((saved) => progress.set(parseProgress(saved))),
    async save(next) {
      progress.set(next);
      await Storage.setItem(progressStorageKey, JSON.stringify(next));
    },
  };
}
