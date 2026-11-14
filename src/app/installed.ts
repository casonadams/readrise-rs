import { mixturesPack } from "../courses/mixtures-and-solutions/pack";
import { statesOfMatterPack } from "../courses/states-of-matter/pack";
import type { CoursePack } from "../ui/course-pack";

/** The installed courses, in learning order: the app and the tests both read this list. */
export const installedPacks: readonly CoursePack[] = [statesOfMatterPack, mixturesPack];
