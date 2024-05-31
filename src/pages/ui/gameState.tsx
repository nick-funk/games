import { createContext, useCallback, useEffect, useState } from "react";
import { PathingGame, State } from "../game";

export const useLiveGameState = (game: PathingGame) => {
  const [state, _setState] = useState<State>(game.state);
  useEffect(() => {
    const interval = setInterval(() => {
      _setState(game.state);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [game]);

  const setState = useCallback(
    (value: any) => {
      game.state = {
        ...game.state,
        ...value,
      };

      _setState(game.state);

      return game.state;
    },
    [_setState, state]
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
  state: {
    play: false,
    reset: false,
    blocks: 0,
  },
  setState: emptySet,
});
