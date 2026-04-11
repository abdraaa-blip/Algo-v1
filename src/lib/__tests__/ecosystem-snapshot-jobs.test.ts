import { describe, expect, it } from "vitest";
import { parseSnapshotCronRegions } from "@/lib/ecosystem/snapshot-jobs";

describe("parseSnapshotCronRegions", () => {
  it("defaults to ALL FR US", () => {
    expect(parseSnapshotCronRegions(undefined)).toEqual([null, "FR", "US"]);
    expect(parseSnapshotCronRegions("")).toEqual([null, "FR", "US"]);
  });

  it("parses ALL and country codes", () => {
    expect(parseSnapshotCronRegions("ALL,FR")).toEqual([null, "FR"]);
    expect(parseSnapshotCronRegions("DE, all , US")).toEqual([
      "DE",
      null,
      "US",
    ]);
  });
});
