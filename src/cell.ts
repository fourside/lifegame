export type Cell = "dead" | "alive";

type AroundCell = Cell | undefined;
type Around8Cells = [
  AroundCell,
  AroundCell,
  AroundCell,
  AroundCell,
  AroundCell,
  AroundCell,
  AroundCell,
  AroundCell,
];

export function isAliveCell(cell: Cell | undefined): boolean {
  return cell === "alive";
}

function deadOrAlive(target: Cell, around: Around8Cells): Cell {
  const aliveSize = around.filter(isAliveCell).length;
  if (isAliveCell(target)) {
    if (aliveSize === 2 || aliveSize === 3) {
      return "alive";
    }
    return "dead";
  }
  return aliveSize === 3 ? "alive" : "dead";
}

export function createCells(
  width: number,
  height: number,
  original?: Cell[][],
): Cell[][] {
  const newCells: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "dead" as const),
  );
  if (original === undefined) {
    return newCells;
  }

  newCells.forEach((row, i) => {
    row.forEach((_, j) => {
      newCells[i][j] = original[i]?.[j] ?? "dead";
    });
  });
  return newCells;
}

export function evelove(cells: Cell[][]): Cell[][] {
  const newCells = cells.map((row) => [...row]);
  for (let i = 0; i < newCells.length; i++) {
    for (let j = 0; j < newCells[i].length; j++) {
      const newCell = deadOrAlive(cells[i][j], [
        cells[i - 1]?.[j - 1],
        cells[i - 1]?.[j],
        cells[i - 1]?.[j + 1],
        cells[i][j - 1],
        cells[i][j + 1],
        cells[i + 1]?.[j - 1],
        cells[i + 1]?.[j],
        cells[i + 1]?.[j + 1],
      ]);
      newCells[i][j] = newCell;
    }
  }
  return newCells;
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

export function createCellsFromLifegame(lifegame: Lifegame): Cell[][] {
  const cells = createCells(lifegame.width, lifegame.height);
  for (const { i, j } of lifegame.aliveCells) {
    cells[i][j] = "alive" as const;
  }
  return cells;
}

type Point = { i: number; j: number };

export type Lifegame = {
  width: number;
  height: number;
  aliveCells: Point[];
};

export function getDefaultLifegame(): Lifegame {
  return {
    width: 30,
    height: 30,
    aliveCells: [],
  };
}
