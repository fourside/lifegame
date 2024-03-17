import { type Describe, array, number, object } from "superstruct";
import type { Lifegame } from "./cell";

export const LifegameSchema: Describe<Lifegame> = object({
  width: number(),
  height: number(),
  aliveCells: array(
    object({
      i: number(),
      j: number(),
    }),
  ),
});
