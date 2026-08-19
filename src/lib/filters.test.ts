import { describe, expect, it } from "vitest";
import { dateRange } from "./filters";

describe("shared financial date filters", () => {
  const now = new Date("2026-08-19T12:00:00.000Z");

  it("includes the full current month", () => {
    const range = dateRange("this-month", now);
    expect(range.from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("uses the Indian business date after midnight in India", () => {
    const range = dateRange("this-month", new Date("2026-08-18T19:00:00.000Z"));
    expect(range.to.toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("uses the Indian April-March financial year", () => {
    const range = dateRange("this-fy", now);
    expect(range.from.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2027-03-31T00:00:00.000Z");
  });

  it("accepts an inclusive custom end date", () => {
    const range = dateRange("custom", now, "2025-01-02", "2025-02-03");
    expect(range.to.toISOString()).toBe("2025-02-03T00:00:00.000Z");
  });
});
