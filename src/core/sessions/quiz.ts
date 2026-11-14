import { type ChoiceQuestion, defaultMaxXp, type QuizActivity } from "../course";
import type { Answer } from "../item-stats";
import { scoreXp, type Step } from "../scoring";

/** Wrong picks after which a question's hint shows on its own. */
export const hintAfterMisses = 2;

export interface QuizState {
  readonly index: number;
  readonly wrong: readonly number[];
  readonly wrongReasons: readonly number[];
  readonly hintShown: boolean;
  readonly answered: boolean;
  readonly reasoned: boolean;
  /** One per settled question. */
  readonly answers: readonly Answer[];
  readonly mistakes: number;
}

export const quizStart: QuizState = {
  index: 0,
  wrong: [],
  wrongReasons: [],
  hintShown: false,
  answered: false,
  reasoned: false,
  answers: [],
  mistakes: 0,
};

export function currentQuestion<V>(quiz: QuizActivity<V>, s: QuizState): ChoiceQuestion<V> {
  return quiz.questions[s.index];
}

/** Settled once the answer is right and, when asked, the reason too. */
export function isSettled(quiz: QuizActivity<unknown>, s: QuizState): boolean {
  return s.answered && (currentQuestion(quiz, s).reason === undefined || s.reasoned);
}

/** A settled question is answered on the first try without a miss or a hint: full credit, otherwise half. */
function settle(quiz: QuizActivity<unknown>, s: QuizState): QuizState {
  const firstTry = s.wrong.length === 0 && s.wrongReasons.length === 0 && !s.hintShown;
  return { ...s, answers: [...s.answers, { item: currentQuestion(quiz, s).id, firstTry }] };
}

export function showHint(s: QuizState): QuizState {
  return { ...s, hintShown: true };
}

export function pickAnswer(quiz: QuizActivity<unknown>, s: QuizState, option: number): QuizState {
  if (s.answered || s.wrong.includes(option)) return s;
  const question = currentQuestion(quiz, s);
  if (question.choices[option].right) {
    const answered = { ...s, answered: true };
    return question.reason === undefined ? settle(quiz, answered) : answered;
  }
  const wrong = [...s.wrong, option];
  const hintShown = s.hintShown || (wrong.length >= hintAfterMisses && question.hint !== undefined);
  return { ...s, wrong, hintShown, mistakes: s.mistakes + 1 };
}

export function pickReason(quiz: QuizActivity<unknown>, s: QuizState, option: number): QuizState {
  const reason = currentQuestion(quiz, s).reason;
  if (reason === undefined || !s.answered || s.reasoned || s.wrongReasons.includes(option)) return s;
  if (reason.choices[option].right) return settle(quiz, { ...s, reasoned: true });
  return { ...s, wrongReasons: [...s.wrongReasons, option], mistakes: s.mistakes + 1 };
}

/** Moves to the next question, or finishes with the result after the last one. */
export function nextQuestion(quiz: QuizActivity<unknown>, s: QuizState): Step<QuizState> {
  if (!isSettled(quiz, s)) throw new Error("the question is not settled yet");
  if (s.index + 1 === quiz.questions.length) {
    const firstTries = s.answers.filter((a) => a.firstTry).length;
    const xp = scoreXp(firstTries, s.answers.length - firstTries, quiz.questions.length, quiz.maxXp ?? defaultMaxXp);
    return { result: { xp, mistakes: s.mistakes, answers: s.answers } };
  }
  const next = { ...quizStart, index: s.index + 1, answers: s.answers, mistakes: s.mistakes };
  return { state: next };
}
