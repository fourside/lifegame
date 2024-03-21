import { type Describe, array, number, object } from "superstruct";
import { Cell, isAliveCell } from "./cell";

type Point = { i: number; j: number };

export type Lifegame = {
  width: number;
  height: number;
  speed: number;
  aliveCells: Point[];
};

export function getDefaultLifegame(): Lifegame {
  return {
    width: 30,
    height: 30,
    speed: 2,
    aliveCells: [],
  };
}

export function aliveCellPoints(cells: Cell[][]): Point[] {
  return cells.flatMap((row, i) => {
    return row.flatMap((cell, j) => {
      if (isAliveCell(cell)) {
        return { i, j };
      }
      return [];
    });
  });
}

export const LifegameSchema: Describe<Lifegame> = object({
  width: number(),
  height: number(),
  speed: number(),
  aliveCells: array(
    object({
      i: number(),
      j: number(),
    }),
  ),
});
