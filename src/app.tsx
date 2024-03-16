import {
  Button,
  Callout,
  IconButton,
  Select,
  Slider,
  TextField,
} from "@radix-ui/themes";
import {
  type ChangeEvent,
  type FC,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import classes from "./app.module.css";
import {
  type Cell,
  type Lifegame,
  aliveCellPoints,
  createCells,
  evelove,
  isAliveCell,
} from "./cell";
import { InlineErrorBoundary } from "./error-boundary";
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

  const [popoverOpen, setPopoverOpen] = useState<
    { open: true; id: string } | { open: false }
  >({ open: false });

  const handlePopoverClose = () => {
    setPopoverOpen({ open: false });
  };

  async function saveLifegame() {
    const lifegame: Lifegame = {
      width: size.width,
      height: size.height,
      aliveCells: aliveCellPoints(cells),
    };
    const res = await fetch("/api/lifegames", {
      method: "POST",
      body: JSON.stringify(lifegame),
    });
    if (!res.ok) {
      throw new Error(`${res.status} error`);
    }
    const id = res.headers.get("location");
    if (id === null) {
      throw new Error("location header not set");
    }
    setPopoverOpen({ open: true, id });
  }

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
          <Button
            type="button"
            onClick={handleRollback}
            disabled={editDisabled || rollback.current === undefined}
          >
            Roolback
          </Button>
          <InlineErrorBoundary>
            <form action={saveLifegame} className={classes.saveForm}>
              <SaveButton disabled={editDisabled} />
              {popoverOpen.open && (
                <SavedLifegamePopover
                  id={popoverOpen.id}
                  onClose={handlePopoverClose}
                />
              )}
            </form>
          </InlineErrorBoundary>
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

type SavedLifegamePopoverProps = {
  id: string;
  onClose: () => void;
};

const SavedLifegamePopover: FC<SavedLifegamePopoverProps> = (props) => {
  const url = `${window.location.protocol}//${window.location.host}${props.id}`;

  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    await navigator.clipboard.writeText(url);
    setMessage("Copied!");
  };

  const [message, setMessage] = useState<string>();
  useEffect(() => {
    if (message === undefined) {
      return;
    }
    const id = setTimeout(() => setMessage(undefined), 3000);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div className={classes.popoverContent}>
      <h3>Lifegame is saved!</h3>
      <Callout.Root className={classes.popoverCallout}>
        <Callout.Text>{url}</Callout.Text>
        <Callout.Icon className={classes.popoverCalloutIcon}>
          <IconButton size="1" variant="soft" onClick={handleClick}>
            <CopyIcon />
          </IconButton>
        </Callout.Icon>
        {message !== undefined && (
          <span className={classes.description}>{message}</span>
        )}
      </Callout.Root>
      <IconButton
        size="1"
        variant="ghost"
        onClick={props.onClose}
        className={classes.calloutCloseIcon}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
};

type IconProps = {
  className?: string;
};

const CopyIcon: FC<IconProps> = (props) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <title>Copy</title>
      <path
        d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H7V13H3.5C3.22386 13 3 12.7761 3 12.5V2.5C3 2.22386 3.22386 2 3.5 2H4V2.25C4 2.66421 4.33579 3 4.75 3H10.25C10.6642 3 11 2.66421 11 2.25V2H11.5C11.7761 2 12 2.22386 12 2.5V7H13V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM9 8.5C9 8.77614 8.77614 9 8.5 9C8.22386 9 8 8.77614 8 8.5C8 8.22386 8.22386 8 8.5 8C8.77614 8 9 8.22386 9 8.5ZM10.5 9C10.7761 9 11 8.77614 11 8.5C11 8.22386 10.7761 8 10.5 8C10.2239 8 10 8.22386 10 8.5C10 8.77614 10.2239 9 10.5 9ZM13 8.5C13 8.77614 12.7761 9 12.5 9C12.2239 9 12 8.77614 12 8.5C12 8.22386 12.2239 8 12.5 8C12.7761 8 13 8.22386 13 8.5ZM14.5 9C14.7761 9 15 8.77614 15 8.5C15 8.22386 14.7761 8 14.5 8C14.2239 8 14 8.22386 14 8.5C14 8.77614 14.2239 9 14.5 9ZM15 10.5C15 10.7761 14.7761 11 14.5 11C14.2239 11 14 10.7761 14 10.5C14 10.2239 14.2239 10 14.5 10C14.7761 10 15 10.2239 15 10.5ZM14.5 13C14.7761 13 15 12.7761 15 12.5C15 12.2239 14.7761 12 14.5 12C14.2239 12 14 12.2239 14 12.5C14 12.7761 14.2239 13 14.5 13ZM14.5 15C14.7761 15 15 14.7761 15 14.5C15 14.2239 14.7761 14 14.5 14C14.2239 14 14 14.2239 14 14.5C14 14.7761 14.2239 15 14.5 15ZM8.5 11C8.77614 11 9 10.7761 9 10.5C9 10.2239 8.77614 10 8.5 10C8.22386 10 8 10.2239 8 10.5C8 10.7761 8.22386 11 8.5 11ZM9 12.5C9 12.7761 8.77614 13 8.5 13C8.22386 13 8 12.7761 8 12.5C8 12.2239 8.22386 12 8.5 12C8.77614 12 9 12.2239 9 12.5ZM8.5 15C8.77614 15 9 14.7761 9 14.5C9 14.2239 8.77614 14 8.5 14C8.22386 14 8 14.2239 8 14.5C8 14.7761 8.22386 15 8.5 15ZM11 14.5C11 14.7761 10.7761 15 10.5 15C10.2239 15 10 14.7761 10 14.5C10 14.2239 10.2239 14 10.5 14C10.7761 14 11 14.2239 11 14.5ZM12.5 15C12.7761 15 13 14.7761 13 14.5C13 14.2239 12.7761 14 12.5 14C12.2239 14 12 14.2239 12 14.5C12 14.7761 12.2239 15 12.5 15Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
};

const CloseIcon: FC<IconProps> = (props) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <title>Close</title>
      <path
        d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
