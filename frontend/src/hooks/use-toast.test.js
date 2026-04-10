import { reducer } from "./use-toast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeToast = (overrides = {}) => ({
  id: "1",
  title: "Test toast",
  open: true,
  ...overrides,
});

const stateWith = (...toasts) => ({ toasts });

// ---------------------------------------------------------------------------
// ADD_TOAST
// ---------------------------------------------------------------------------
describe("reducer – ADD_TOAST", () => {
  it("adds a toast to an empty list", () => {
    const toast = makeToast();
    const state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast });
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toEqual(toast);
  });

  it("prepends the new toast so it is first", () => {
    const existing = makeToast({ id: "existing" });
    const newToast = makeToast({ id: "new" });
    const state = reducer(stateWith(existing), { type: "ADD_TOAST", toast: newToast });
    expect(state.toasts[0].id).toBe("new");
  });

  it("enforces TOAST_LIMIT of 1 (drops older toasts)", () => {
    const first = makeToast({ id: "first" });
    const second = makeToast({ id: "second" });
    const state = reducer(stateWith(first), { type: "ADD_TOAST", toast: second });
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// UPDATE_TOAST
// ---------------------------------------------------------------------------
describe("reducer – UPDATE_TOAST", () => {
  it("updates a matching toast by id", () => {
    const toast = makeToast({ title: "original" });
    const state = reducer(
      stateWith(toast),
      { type: "UPDATE_TOAST", toast: { id: "1", title: "updated" } },
    );
    expect(state.toasts[0].title).toBe("updated");
  });

  it("preserves toasts whose id does not match", () => {
    const a = makeToast({ id: "a", title: "A" });
    const b = makeToast({ id: "b", title: "B" });
    const state = reducer(
      stateWith(a, b),
      { type: "UPDATE_TOAST", toast: { id: "a", title: "A-updated" } },
    );
    expect(state.toasts.find((t) => t.id === "b").title).toBe("B");
  });
});

// ---------------------------------------------------------------------------
// DISMISS_TOAST
// ---------------------------------------------------------------------------
describe("reducer – DISMISS_TOAST", () => {
  it("sets open=false for the specified toastId", () => {
    const toast = makeToast({ open: true });
    const state = reducer(stateWith(toast), { type: "DISMISS_TOAST", toastId: "1" });
    expect(state.toasts[0].open).toBe(false);
  });

  it("sets open=false for ALL toasts when toastId is undefined", () => {
    const a = makeToast({ id: "a", open: true });
    const b = makeToast({ id: "b", open: true });
    const state = reducer(stateWith(a, b), { type: "DISMISS_TOAST" });
    state.toasts.forEach((t) => expect(t.open).toBe(false));
  });

  it("does not affect toasts with a different id", () => {
    const a = makeToast({ id: "a", open: true });
    const b = makeToast({ id: "b", open: true });
    const state = reducer(stateWith(a, b), { type: "DISMISS_TOAST", toastId: "a" });
    expect(state.toasts.find((t) => t.id === "b").open).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REMOVE_TOAST
// ---------------------------------------------------------------------------
describe("reducer – REMOVE_TOAST", () => {
  it("removes the toast with the specified id", () => {
    const toast = makeToast();
    const state = reducer(stateWith(toast), { type: "REMOVE_TOAST", toastId: "1" });
    expect(state.toasts).toHaveLength(0);
  });

  it("clears ALL toasts when toastId is undefined", () => {
    const a = makeToast({ id: "a" });
    const b = makeToast({ id: "b" });
    const state = reducer(stateWith(a, b), { type: "REMOVE_TOAST", toastId: undefined });
    expect(state.toasts).toHaveLength(0);
  });

  it("leaves other toasts intact when removing by specific id", () => {
    const a = makeToast({ id: "a" });
    const b = makeToast({ id: "b" });
    const state = reducer(stateWith(a, b), { type: "REMOVE_TOAST", toastId: "a" });
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe("b");
  });

  it("returns unchanged state when toastId does not match any toast", () => {
    const toast = makeToast({ id: "keep" });
    const state = reducer(stateWith(toast), { type: "REMOVE_TOAST", toastId: "gone" });
    expect(state.toasts).toHaveLength(1);
  });
});
