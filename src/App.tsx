import { ChangeEvent, useState } from "react";
import classes from "./App.module.css";

type Mode = "edit" | "progress";
type Cell = "-" | "x";

function createCells(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "-"),
  );
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
    setCells(createCells(width, size.height));
  };

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value);
    const height = Number.isNaN(value) ? 0 : value;
    setSize((prev) => ({ ...prev, height }));
    setCells(createCells(size.width, height));
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
            <input value={size.width} onChange={handleWidthChange} />
          </label>
          <label>
            height
            <input value={size.height} onChange={handleHeightChange} />
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
            gridTemplateRows: `repeat(${size.height}, 1fr)`,
            gridTemplateColumns: `repeat(${size.width}, 1fr)`,
          }}
        >
          {cells.map((row, i) =>
            row.map((column, j) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                key={`${i}_${j}`}
                type="button"
                className={classes.cell}
                style={{ backgroundColor: column === "x" ? "gray" : "white" }}
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
