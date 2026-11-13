import { defaultWhoIsRightXp, type WhoIsRightActivity } from "../course";
import { type ActivityResult, scoreXp } from "../scoring";

export interface WhoIsRightState {
  readonly wrong: readonly number[];
  readonly solved: boolean;
}

export const whoIsRightStart: WhoIsRightState = { wrong: [], solved: false };

export function pickClaim(activity: WhoIsRightActivity, s: WhoIsRightState, claim: number): WhoIsRightState {
  if (s.solved || s.wrong.includes(claim)) return s;
  return claim === activity.answer ? { ...s, solved: true } : { ...s, wrong: [...s.wrong, claim] };
}

export function whoIsRightResult(activity: WhoIsRightActivity, s: WhoIsRightState): ActivityResult {
  if (!s.solved) throw new Error("no claim is chosen yet");
  const clean = s.wrong.length === 0;
  const xp = scoreXp(clean ? 1 : 0, clean ? 0 : 1, 1, activity.maxXp ?? defaultWhoIsRightXp);
  return { xp, mistakes: s.wrong.length };
}
