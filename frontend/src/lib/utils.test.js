import { cn } from "./utils";

describe("cn utility", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class name unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple class names with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("handles conditional classes via objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge resolves conflicts: p-4 should win over p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conflicting text colour classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles mixed string, object and array inputs", () => {
    expect(cn("base", { active: true }, ["extra"])).toBe("base active extra");
  });
});
