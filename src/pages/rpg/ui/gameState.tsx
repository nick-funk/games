import { createContext, useCallback, useEffect, useState } from "react";
import { GameManager } from "../gameManager";
import { State } from "../game";

export const useLiveGameState = (manager: GameManager) => {
  const [state, _setState] = useState<State>(manager.getState());
  useEffect(() => {
    const interval = setInterval(() => {
      _setState(manager.getState());
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [manager]);

  const setState = useCallback(
    (value: any) => {
      manager.setState({
        ...manager.getState(),
        ...value,
      });

      const st = manager.getState();
      _setState(st);

      return st;
    },
    [_setState, state, manager]
  );

  return { state, setState };
};

interface ContextStateValue {
  state: State;
  setState: (value: any) => State;
}

const emptySet = (value: any) => {
  return value;
};

export const GameStateContext = createContext<ContextStateValue>({
  state: GameManager.emptyState(),
  setState: emptySet,
});
