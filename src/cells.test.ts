import { describe, expect, test } from "vitest";
import {
  type Cell,
  createCells,
  createCellsFromLifegame,
  evelove,
  isAliveCell,
} from "./cell";
import { Lifegame } from "./lifegame";

describe(isAliveCell.name, () => {
  test("alive cell return true", () => {
    // arrange
    const cell: Cell = "alive";
    // act
    const result = isAliveCell(cell);
    // assert
    expect(result).toBe(true);
  });

  test("dead cell return false", () => {
    // arrange
    const cell: Cell = "dead";
    // act
    const result = isAliveCell(cell);
    // assert
    expect(result).toBe(false);
  });

  test("undefined return false", () => {
    // arrange
    const cell = undefined;
    // act
    const result = isAliveCell(cell);
    // assert
    expect(result).toBe(false);
  });
});

describe(createCells.name, () => {
  test("create cells by width and height", () => {
    // arrange
    const width = 3;
    const height = 2;
    // act
    const result = createCells(width, height);
    // assert
    expect(result).toStrictEqual([
      ["dead", "dead", "dead"],
      ["dead", "dead", "dead"],
    ]);
  });

  test("copy from original cells", () => {
    // arrange
    const width = 3;
    const height = 3;
    const original: Cell[][] = [["dead", "alive", "dead"], ["alive"]];
    // act
    const result = createCells(width, height, original);
    // assert
    expect(result).toStrictEqual([
      ["dead", "alive", "dead"],
      ["alive", "dead", "dead"],
      ["dead", "dead", "dead"],
    ]);
  });
});

describe(evelove.name, () => {
  test("evolve cells", () => {
    // arrange
    const cells: Cell[][] = [
      ["dead", "alive", "dead"],
      ["dead", "alive", "dead"],
      ["dead", "alive", "dead"],
    ];
    // act
    const result = evelove(cells);
    // assert
    expect(result).toStrictEqual([
      ["dead", "dead", "dead"],
      ["alive", "alive", "alive"],
      ["dead", "dead", "dead"],
    ]);
  });
});

describe(createCellsFromLifegame.name, () => {
  test("create cells", () => {
    // arrange
    const lifegame: Lifegame = {
      width: 3,
      height: 2,
      speed: 2,
      aliveCells: [
        { i: 0, j: 2 },
        { i: 1, j: 0 },
        { i: 2, j: 3 },
      ],
    };
    // act
    const result = createCellsFromLifegame(lifegame);
    // assert
    expect(result).toStrictEqual([
      ["dead", "dead", "alive"],
      ["alive", "dead", "dead"],
    ]);
  });
});
