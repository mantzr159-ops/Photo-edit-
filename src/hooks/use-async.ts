"use client";
import * as React from "react";

/** Run an async loader whenever deps change; exposes data/loading/error and a reload function. */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = React.useState<{ data: T | undefined; loading: boolean; error: Error | null }>({ data: undefined, loading: true, error: null });
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: undefined, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload, setData: (d: T) => setState((s) => ({ ...s, data: d })) };
}
