import { FunctionComponent, useCallback } from "react";
import { PathingGame } from "../game";

import "./root.css";

interface Props {
  game: PathingGame;
}

export const UIRoot: FunctionComponent<Props> = ({ game }) => {
  const onPlay = useCallback(() => {
    game.state.play = true;
  }, [game]);

  const onReset = useCallback(() => {
    game.state.reset = true;
  }, [game]);

  return (
    <div className="uiRoot">
      <button onClick={onPlay}>
        Play
      </button>

      <button onClick={onReset}>
        Reset
      </button>
    </div>
  );
};
