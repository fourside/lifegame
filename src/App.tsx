import { Button, Select, Slider, TextField } from "@radix-ui/themes";
import { ChangeEvent, FC, useEffect, useState, useTransition } from "react";
import classes from "./App.module.css";
import { type Cell, createCells, evelove, isAliveCell } from "./cell";
import { PRESETS } from "./presets";

type Mode = "edit" | "progress";

function App() {
  const [size, setSize] = useState({ width: 30, height: 30 });

  const [cells, setCells] = useState<Cell[][]>(
    createCells(size.width, size.height),
  );

  const handleWidthChange = (str: string) => {
    const value = Number.parseInt(str);
    const width = Number.isNaN(value) ? 0 : value;
    setSize((prev) => ({ ...prev, width }));
  };

  const cellSizeChange = () => {
    setCells(createCells(size.width, size.height, cells));
  };

  const handleHeightChange = (str: string) => {
    const value = Number.parseInt(str);
    const height = Number.isNaN(value) ? 0 : value;
    setSize((prev) => ({ ...prev, height }));
  };

  const [mode, setMode] = useState<Mode>("edit");
  const editDisabled = mode === "progress";

  const handleModeChange = () => {
    setMode((prev) => (prev === "edit" ? "progress" : "edit"));
  };

  const [presetName, setPresetName] = useState("");
  const handlePresetsChange = (value: string) => {
    const found = PRESETS.find((it) => it.name === value);
    if (found === undefined) {
      throw new Error(`not found ${value} in presets`);
    }
    setPresetName(found.name);
    setCells(found.cells);
    setSize({ width: found.cells[0].length, height: found.cells.length });
  };

  const handleCellChange = (newCells: Cell[][]) => {
    setCells(newCells);
  };

  const handleClearClick = () => {
    setPresetName("");
    setCells(createCells(size.width, size.height));
    setSpeed(1);
  };

  const [speed, setSpeed] = useState(1);
  const handleSpeedChange = (speed: number[]) => {
    setSpeed(speed[0]);
  };

  return (
    <main className={classes.container}>
      <div className={classes.sidemenu}>
        <h1>Lifegame</h1>
        <div className={classes.size}>
          <label>
            width
            <TextInput
              value={size.width}
              onChange={handleWidthChange}
              onBlur={cellSizeChange}
              disabled={editDisabled}
            />
          </label>
          <label>
            height
            <TextInput
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
            <Select.Root
              value={presetName}
              onValueChange={handlePresetsChange}
              disabled={editDisabled}
            >
              <Select.Trigger placeholder="select a preset" />
              <Select.Content position="popper">
                {PRESETS.map((it) => (
                  <Select.Item key={it.name} value={it.name}>
                    {it.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
        </div>
        <div>
          <label>
            speed
            <Slider
              defaultValue={[1]}
              min={0.5}
              max={3}
              step={0.5}
              disabled={editDisabled}
              onValueCommit={handleSpeedChange}
            />
          </label>
          x{speed}
        </div>
        <div className={classes.buttons}>
          <Button type="button" onClick={handleModeChange}>
            {mode === "edit" ? "Start" : "Stop"}
          </Button>
          <Button
            type="button"
            onClick={handleClearClick}
            disabled={editDisabled}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className={classes.board}>
        {mode === "edit" ? (
          <EditableCellBoard cells={cells} onChange={handleCellChange} />
        ) : (
          <EvolvingCellBoard
            cells={cells}
            speed={speed}
            onChange={handleCellChange}
          />
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

const SPEEDS_TO_MS: Record<number, number> = {
  0.5: 1000,
  1: 500,
  1.5: 350,
  2: 250,
  2.5: 200,
  3: 150,
};

type EvolvingCellBoardProps = {
  cells: Cell[][];
  speed: number;
  onChange: (cells: Cell[][]) => void;
};

const EvolvingCellBoard: FC<EvolvingCellBoardProps> = (props) => {
  const [_, startTransition] = useTransition();
  const ms = SPEEDS_TO_MS[props.speed];

  useEffect(() => {
    (async () => {
      await sleep(ms);
      startTransition(() => {
        const newCells = evelove(props.cells);
        props.onChange(newCells);
      });
    })();
  }, [props.cells, props.onChange, ms]);

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

type TextInputProps = {
  value: string | number;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
};

const TextInput: FC<TextInputProps> = (props) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    props.onChange(event.target.value);
  };

  const handleBlur = () => {
    props.onBlur();
  };

  return (
    <TextField.Root>
      <TextField.Input
        value={props.value}
        disabled={props.disabled}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </TextField.Root>
  );
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
