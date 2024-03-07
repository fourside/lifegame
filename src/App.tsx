import { ChangeEvent, useState } from "react";
import classes from "./App.module.css";

type Mode = "edit" | "progress";
type DeadCell = "x";
type AliveCell = "-";
type Cell = DeadCell | AliveCell;

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

function isAliveCell(cell: Cell | undefined): boolean {
  return cell === "-";
}

function deadOrAlive(target: Cell, around: Around8Cells): Cell {
  const aliveSize = around.filter(isAliveCell).length;
  if (isAliveCell(target)) {
    if (aliveSize === 2 || aliveSize === 3) {
      return "x";
    }
    return "-";
  }
  return aliveSize === 3 ? "-" : "x";
}

function createCells(
  width: number,
  height: number,
  original?: Cell[][],
): Cell[][] {
  const newCells: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "-" as const),
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

function App() {
  const [size, setSize] = useState({ width: 30, height: 30 });

  const [cells, setCells] = useState<Cell[][]>(
    createCells(size.width, size.height),
  );

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value);
    const width = Number.isNaN(value) ? 0 : value;
    setSize((prev) => ({ ...prev, width }));
  };

  const cellSizeChange = () => {
    setCells(createCells(size.width, size.height, cells));
  };

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value);
    const height = Number.isNaN(value) ? 0 : value;
    setSize((prev) => ({ ...prev, height }));
  };

  const [mode, setMode] = useState<Mode>("edit");

  const handleModeChange = () => {
    setMode((prev) => (prev === "edit" ? "progress" : "edit"));
  };

  const handleCellClick = (i: number, j: number) => {
    const newCell = cells[i][j] === "x" ? "-" : "x";
    const newCells = cells.map((row, index1) => {
      if (index1 === i) {
        return row.map((column, index2) => {
          return index2 === j ? newCell : column;
        });
      }
      return row;
    });
    setCells(newCells);
  };

  return (
    <main className={classes.container}>
      <div className={classes.sidemenu}>
        <h1>Lifegame</h1>
        <div>
          <label>
            width
            <input
              value={size.width}
              onChange={handleWidthChange}
              onBlur={cellSizeChange}
            />
          </label>
          <label>
            height
            <input
              value={size.height}
              onChange={handleHeightChange}
              onBlur={cellSizeChange}
            />
          </label>
        </div>
        <div>
          <button type="button" onClick={handleModeChange}>
            {mode === "edit" ? "Start" : "Edit"}
          </button>
        </div>
      </div>
      <div className={classes.board}>
        <div
          className={classes.cells}
          style={{
            gridTemplateRows: `repeat(${cells.length}, 1fr)`,
            gridTemplateColumns: `repeat(${cells[0].length}, 1fr)`,
          }}
        >
          {cells.map((row, i) =>
            row.map((column, j) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                key={`${i}_${j}`}
                type="button"
                className={classes.cell}
                style={{
                  backgroundColor: isAliveCell(column) ? "white" : "gray",
                }}
                onClick={() => handleCellClick(i, j)}
                disabled={mode === "progress"}
              />
            )),
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
