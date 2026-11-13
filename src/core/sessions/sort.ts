import { defaultMaxXp, type SortActivity } from "../course";
import { scoreXp, type Step } from "../scoring";

export interface SortFeedback {
  readonly kind: "correct" | "wrong" | "hint";
  readonly title: string;
  readonly message: string;
}

export interface SortState {
  /** Index of the item to place next; equal to the item count when all are placed. */
  readonly next: number;
  /** Indices of the placed items, per bin. */
  readonly placed: readonly (readonly number[])[];
  readonly currentMissed: boolean;
  readonly hintShown: boolean;
  readonly feedback: SortFeedback | null;
  readonly firstTry: number;
  readonly recovered: number;
  readonly mistakes: number;
}

export function sortStart(sort: SortActivity): SortState {
  return {
    next: 0,
    placed: sort.bins.map(() => []),
    currentMissed: false,
    hintShown: false,
    feedback: null,
    firstTry: 0,
    recovered: 0,
    mistakes: 0,
  };
}

export function showSortHint(sort: SortActivity, s: SortState): SortState {
  if (sort.hint === undefined) return s;
  return { ...s, hintShown: true, currentMissed: true, feedback: { kind: "hint", title: "Hint", message: sort.hint } };
}

export function drop(sort: SortActivity, s: SortState, bin: number): SortState {
  if (s.next === sort.items.length) return s;
  const item = sort.items[s.next];
  if (item.bin !== bin) {
    return {
      ...s,
      mistakes: s.mistakes + 1,
      currentMissed: true,
      hintShown: s.hintShown || sort.hint !== undefined,
      feedback: { kind: "wrong", title: "Not quite!", message: sort.hint ?? "Try another box." },
    };
  }
  return {
    ...s,
    next: s.next + 1,
    placed: s.placed.map((items, i) => (i === bin ? [...items, s.next] : items)),
    currentMissed: false,
    firstTry: s.currentMissed ? s.firstTry : s.firstTry + 1,
    recovered: s.currentMissed ? s.recovered + 1 : s.recovered,
    feedback: { kind: "correct", title: `${item.label}: ${sort.bins[bin]}`, message: item.why ?? "Nice sorting!" },
  };
}

export function finishSort(sort: SortActivity, s: SortState): Step<SortState> {
  if (s.next < sort.items.length) return { state: s };
  const xp = scoreXp(s.firstTry, s.recovered, sort.items.length, sort.maxXp ?? defaultMaxXp);
  return { result: { xp, mistakes: s.mistakes } };
}
