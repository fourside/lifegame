import {
  Button,
  IconButton,
  Select,
  Slider,
  TextField,
} from "@radix-ui/themes";
import {
  type ChangeEvent,
  type FC,
  Suspense,
  use,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import classes from "./app.module.css";
import {
  type Cell,
  createCells,
  createCellsFromLifegame,
  evelove,
} from "./cell";
import { CopyPopover } from "./copy-popover";
import { FormErrorBoundary } from "./error-boundary";
import { getLifegame, postLifegame } from "./fetch-client";
import { MoonIcon, SunIcon } from "./icons";
import { Lifegame, getDefaultLifegame } from "./lifegame";
import { PRESETS } from "./presets";
import { ThemeContext } from "./theme-provider";

function App() {
  const id = window.location.pathname;
  if (id === "/") {
    return <LifegameComponent lifegame={getDefaultLifegame()} />;
  }
  return (
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <Suspense fallback={<PageLoader />}>
        <FetchLifegameComponent lifegame={getLifegame(id)} />
      </Suspense>
    </ErrorBoundary>
  );
}

const ErrorPage: FC = () => {
  return (
    <div>
      <h2>Error</h2>
    </div>
  );
};

type FetchLifegameComponentProps = {
  lifegame: Promise<Lifegame>;
};

const FetchLifegameComponent: FC<FetchLifegameComponentProps> = (props) => {
  const lifegame = use(props.lifegame);
  return <LifegameComponent lifegame={lifegame} />;
};

type Mode = "edit" | "progress";

type LifegameComponentProps = {
  lifegame: Lifegame;
};

const LifegameComponent: FC<LifegameComponentProps> = (props) => {
  const [width, setWidth] = useState(props.lifegame.width.toString());
  const [height, setHeight] = useState(props.lifegame.height.toString());

  const [cells, setCells] = useState<Cell[][]>(
    createCellsFromLifegame(props.lifegame),
  );

  const handleWidthChange = (value: string) => {
    setWidth(value);
  };

  const isValidWidth = useMemo(() => {
    return /^\d+$/.test(width);
  }, [width]);

  const handleHeightChange = (value: string) => {
    setHeight(value);
  };

  const isValidHeight = useMemo(() => {
    return /^\d+$/.test(height);
  }, [height]);

  const cellSizeChange = () => {
    if (isValidWidth && isValidHeight) {
      setCells(
        createCells(Number.parseInt(width), Number.parseInt(height), cells),
      );
    }
  };

  const [mode, setMode] = useState<Mode>("edit");
  const editDisabled = mode === "progress";
  const rollback = useRef<Cell[][]>();

  const handleModeChange = () => {
    if (mode === "edit") {
      rollback.current = cells;
    }
    setMode((prev) => (prev === "edit" ? "progress" : "edit"));
  };

  const handleRollback = () => {
    if (rollback.current === undefined) {
      return;
    }
    setCells(rollback.current);
    rollback.current = undefined;
  };

  const [presetName, setPresetName] = useState("");
  const handlePresetsChange = (value: string) => {
    const found = PRESETS.find((it) => it.name === value);
    if (found === undefined) {
      throw new Error(`not found ${value} in presets`);
    }
    setPresetName(found.name);
    setCells(found.cells);
    setHeight(found.cells.length.toString());
    setWidth(found.cells[0].length.toString());
  };

  const handleCellChange = (newCells: Cell[][]) => {
    setCells(newCells);
  };

  const handleClearClick = () => {
    setPresetName("");
    const w = isValidWidth ? Number.parseInt(width) : props.lifegame.width;
    const h = isValidHeight ? Number.parseInt(height) : props.lifegame.height;
    setCells(createCells(w, h));
    setSpeed(1);
  };

  const [speed, setSpeed] = useState(1);
  const handleSpeedChange = (speed: number) => {
    setSpeed(speed);
  };

  const [popoverOpen, setPopoverOpen] = useState<
    { open: true; id: string } | { open: false }
  >({ open: false });

  const handlePopoverClose = () => {
    setPopoverOpen({ open: false });
  };

  const saveLifegameAction = async () => {
    if (!isValidWidth || !isValidHeight) {
      return;
    }
    const id = await postLifegame(
      Number.parseInt(width),
      Number.parseInt(height),
      cells,
    );
    setPopoverOpen({ open: true, id });
  };

  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <main className={classes.container}>
      <h1>Lifegame</h1>
      <div className={classes.sidemenu}>
        <div className={classes.inputs}>
          <label>
            width
            <TextInput
              value={width}
              onChange={handleWidthChange}
              onBlur={cellSizeChange}
              isError={!isValidWidth}
              disabled={editDisabled}
            />
            {!isValidWidth && (
              <span className={classes.errorMessage}>invalid width</span>
            )}
          </label>
          <label>
            height
            <TextInput
              value={height}
              onChange={handleHeightChange}
              onBlur={cellSizeChange}
              isError={!isValidHeight}
              disabled={editDisabled}
            />
            {!isValidHeight && (
              <span className={classes.errorMessage}>invalid height</span>
            )}
          </label>
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
        <SpeedSlider
          speed={speed}
          disabled={editDisabled}
          onChange={handleSpeedChange}
        />
        <div className={classes.buttons}>
          <Button
            type="button"
            onClick={handleModeChange}
            disabled={!isValidWidth || !isValidHeight}
          >
            {mode === "edit" ? "Start" : "Stop"}
          </Button>
          <Button
            type="button"
            onClick={handleClearClick}
            disabled={editDisabled}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleRollback}
            disabled={editDisabled || rollback.current === undefined}
          >
            Roolback
          </Button>
          <FormErrorBoundary>
            <form action={saveLifegameAction} className={classes.saveForm}>
              <SaveButton disabled={editDisabled} />
              {popoverOpen.open && (
                <div className={classes.popoverContainer}>
                  <CopyPopover
                    title="Lifegame is saved!"
                    text={createUrl(popoverOpen.id)}
                    onClose={handlePopoverClose}
                  />
                </div>
              )}
            </form>
          </FormErrorBoundary>
        </div>
        <div>
          <IconButton size="2" variant="ghost" onClick={toggleDarkMode}>
            {darkMode === "light" ? <SunIcon /> : <MoonIcon />}
          </IconButton>
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
};

type SpeedSliderProps = {
  speed: number;
  disabled: boolean;
  onChange: (speed: number) => void;
};

const SpeedSlider: FC<SpeedSliderProps> = (props) => {
  const [speed, setSpeed] = useState(props.speed);

  const handleChange = (speeds: number[]) => {
    setSpeed(speeds[0]);
  };

  const handleCommit = (speeds: number[]) => {
    props.onChange(speeds[0]);
  };

  return (
    <div>
      <label>
        speed
        <Slider
          defaultValue={[2]}
          min={0.5}
          max={4}
          step={0.5}
          disabled={props.disabled}
          onValueChange={handleChange}
          onValueCommit={handleCommit}
        />
      </label>
      x{speed}
    </div>
  );
};

type SaveButtonProps = {
  disabled: boolean;
};

const SaveButton: FC<SaveButtonProps> = (props) => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={props.disabled}
      className={classes.saveButton}
    >
      {pending && <Loader />}
      Save
    </Button>
  );
};

const Loader: FC = () => {
  return <div className={classes.loader} />;
};

const PageLoader: FC = () => {
  return (
    <div className={classes.pageLoader}>
      <div />
    </div>
  );
};

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
  3.5: 100,
  4: 75,
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
            data-state={column}
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
  isError: boolean;
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
        className={classes.textInput}
        data-is-error={props.isError}
      />
    </TextField.Root>
  );
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createUrl(path: string): string {
  return `${window.location.protocol}//${window.location.host}${path}`;
}
