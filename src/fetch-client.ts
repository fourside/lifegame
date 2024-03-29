import { validate } from "superstruct";
import { type Cell } from "./cell";
import { type Lifegame, LifegameSchema, aliveCellPoints } from "./lifegame";

export async function getLifegame(id: string): Promise<Lifegame> {
  const res = await fetch(`/api/lifegames${id}`);
  if (!res.ok) {
    throw new Error(`${res.status} error`);
  }
  const json = await res.json();
  const [err, lifegame] = validate(json, LifegameSchema);
  if (err !== undefined) {
    console.error(err);
    throw new Error(err.message);
  }
  return lifegame;
}

export async function postLifegame(
  cells: Cell[][],
  speed: number,
): Promise<string> {
  const lifegame: Lifegame = {
    width: cells[0].length,
    height: cells.length,
    speed,
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
  return id;
}
