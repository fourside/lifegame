import { ChangeEvent, FC, useEffect, useState, useTransition } from "react";
import classes from "./App.module.css";
import { type Cell, createCells, deadOrAlive, isAliveCell } from "./cell";
import { PRESETS } from "./presets";

type Mode = "edit" | "progress";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const editDisabled = mode === "progress";

  const handleModeChange = () => {
    setMode((prev) => (prev === "edit" ? "progress" : "edit"));
  };

  const handlePresetsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const found = PRESETS.find((it) => it.name === event.target.value);
    if (found === undefined) {
      throw new Error(`not found ${event.target.value} in presets`);
    }
    setCells(found.cells);
  };

  const handleCellChange = (newCells: Cell[][]) => {
    setCells(newCells);
  };

  const handleClearClick = () => {
    setCells(createCells(size.width, size.height));
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
              disabled={editDisabled}
            />
          </label>
          <label>
            height
            <input
              value={size.height}
              onChange={handleHeightChange}
              onBlur={cellSizeChange}
              disabled={editDisabled}
            />
          </label>
        </div>
        <div>
          <label>
            presets
            <br />
            <select onChange={handlePresetsChange} disabled={editDisabled}>
              {PRESETS.map((it) => (
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
            disabled={editDisabled}
          >
            Clear
          </button>
        </div>
      </div>
      <div className={classes.board}>
        {mode === "progress" ? (
          <EvolvingCellBoard cells={cells} onChange={handleCellChange} />
        ) : (
          <EditableCellBoard cells={cells} onChange={handleCellChange} />
        )}
      </div>
    </main>
  );
}

export default App;

type EditableCellBoardProps = {
  cells: Cell[][];
  onChange: (cells: Cell[][]) => void;
};

const EditableCellBoard: FC<EditableCellBoardProps> = (props) => {
  const handleCellClick = (i: number, j: number) => {
    const newCell = props.cells[i][j] === "dead" ? "alive" : "dead";
    const newCells = props.cells.map((row, index1) => {
      if (index1 === i) {
        return row.map((column, index2) => {
          return index2 === j ? newCell : column;
        });
      }
      return row;
    });
    props.onChange(newCells);
  };

  return <CellBoard cells={props.cells} onClick={handleCellClick} />;
};

type EvolvingCellBoardProps = {
  cells: Cell[][];
  onChange: (cells: Cell[][]) => void;
};

const EvolvingCellBoard: FC<EvolvingCellBoardProps> = (props) => {
  const [_, startTransition] = useTransition();

  // biome-ignore lint/correctness/useExhaustiveDependencies: cells[i][j]
  useEffect(() => {
    (async () => {
      await sleep(500);
      const newCells = props.cells.map((row) => [...row]);
      for (let i = 0; i < newCells.length; i++) {
        for (let j = 0; j < newCells[i].length; j++) {
          const newCell = deadOrAlive(props.cells[i][j], [
            props.cells[i - 1]?.[j - 1],
            props.cells[i - 1]?.[j],
            props.cells[i - 1]?.[j + 1],
            props.cells[i][j - 1],
            props.cells[i][j + 1],
            props.cells[i + 1]?.[j - 1],
            props.cells[i + 1]?.[j],
            props.cells[i + 1]?.[j + 1],
          ]);
          newCells[i][j] = newCell;
        }
      }
      startTransition(() => {
        props.onChange(newCells);
      });
    })();
  }, [props.cells, props.onChange]);

  return <CellBoard cells={props.cells} />;
};

type CellBoardProps = {
  cells: Cell[][];
  onClick?: (i: number, j: number) => void;
};

const CellBoard: FC<CellBoardProps> = (props) => {
  const onClick = props.onClick;
  const disabled = onClick === undefined;
  return (
    <div
      className={classes.cells}
      style={{
        gridTemplateRows: `repeat(${props.cells.length}, 1fr)`,
        gridTemplateColumns: `repeat(${props.cells[0].length}, 1fr)`,
      }}
    >
      {props.cells.map((row, i) =>
        row.map((column, j) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={`${i}_${j}`}
            type="button"
            className={classes.cell}
            style={{
              backgroundColor: isAliveCell(column) ? "gray" : "white",
            }}
            onClick={disabled ? undefined : () => onClick(i, j)}
            disabled={disabled}
          />
        )),
      )}
    </div>
  );
};
