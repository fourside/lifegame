type DeadCell = "dead";
type AliveCell = "alive";
export type Cell = DeadCell | AliveCell;

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

export function deadOrAlive(target: Cell, around: Around8Cells): Cell {
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
      newCells[i][j] = original[i][j];
    });
  });
  return newCells;
}
