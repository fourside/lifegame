import { ChangeEvent, useEffect, useState } from "react";
import classes from "./App.module.css";

type Mode = "edit" | "progress";
type DeadCell = "dead";
type AliveCell = "alive";
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

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAliveCell(cell: Cell | undefined): boolean {
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

function createCells(
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
    const newCell = cells[i][j] === "dead" ? "alive" : "dead";
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

  const handlePresetsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const found = presets.find((it) => it.name === event.target.value);
    if (found === undefined) {
      throw new Error(`not found ${event.target.value} in presets`);
    }
    setCells(found.cells);
  };

  const handleClearClick = () => {
    setCells(createCells(size.width, size.height));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: cells[i][j]
  useEffect(() => {
    if (mode === "edit") {
      return;
    }
    (async () => {
      await sleep(500);
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
      setCells(newCells);
    })();
  }, [mode, size, cells]);

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
          <label>
            presets
            <br />
            <select
              onChange={handlePresetsChange}
              disabled={mode === "progress"}
            >
              {presets.map((it) => (
                <option value={it.name}>{it.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button type="button" onClick={handleModeChange}>
            {mode === "edit" ? "Start" : "Stop"}
          </button>
          <button
            type="button"
            onClick={handleClearClick}
            disabled={mode === "progress"}
          >
            Clear
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
                  backgroundColor: isAliveCell(column) ? "gray" : "white",
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

const blinker = {
  name: "Blinker",
  cells: `\
     
  x  
  x  
  x  
     
`,
};

const beacon = {
  name: "Beacon",
  cells: `\
        
  xx    
  xx    
    xx  
    xx  
        
`,
};

const presets = [blinker, beacon].map((it) => ({
  ...it,
  cells: parsePresetAsCells(it.cells),
}));

function parsePresetAsCells(preset: string): Cell[][] {
  return preset.split("\n").map((line) => {
    return line.split("").map((char) => {
      if (char === " ") {
        return "dead" as const;
      }
      if (char === "x") {
        return "alive" as const;
      }
      throw new Error(`invalid char: ${char}`);
    });
  });
}
