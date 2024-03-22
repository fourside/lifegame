import { describe, expect, test } from "vitest";
import { compress, decompress } from "./gzip";

describe("compress and decompress", () => {
  test("become the same value", async () => {
    // arrange
    const value = "abcde".repeat(100);
    // act
    const compressed = await compress(value);
    const decompressed = await decompress(compressed);
    // assert
    expect(decompressed).toBe(value);
  });
});
