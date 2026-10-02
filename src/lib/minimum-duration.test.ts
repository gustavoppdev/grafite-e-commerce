import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withMinimumDuration } from "./minimum-duration";

// Relógio falso; `settled` prova que a promessa não terminou antes do piso.
describe("withMinimumDuration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function track<T>(promise: Promise<T>) {
    const state = { settled: false };
    promise.then(
      () => {
        state.settled = true;
      },
      () => {
        state.settled = true;
      },
    );
    return state;
  }

  it("holds a fast result until the minimum has passed", async () => {
    const promise = withMinimumDuration(async () => "ok", 800);
    const state = track(promise);

    await vi.advanceTimersByTimeAsync(799);
    expect(state.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.settled).toBe(true);
    await expect(promise).resolves.toBe("ok");
  });

  it("holds a fast failure too, so errors are not faster than successes", async () => {
    const promise = withMinimumDuration(async () => {
      throw new Error("falhou");
    }, 800);
    const state = track(promise);

    await vi.advanceTimersByTimeAsync(799);
    expect(state.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).rejects.toThrow("falhou");
  });

  it("adds no delay when the work is already slower than the minimum", async () => {
    const promise = withMinimumDuration(
      () => new Promise((resolve) => setTimeout(() => resolve("lento"), 1000)),
      800,
    );
    const state = track(promise);

    await vi.advanceTimersByTimeAsync(1000);
    expect(state.settled).toBe(true);
    await expect(promise).resolves.toBe("lento");
  });
});
