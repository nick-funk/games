import { FunctionComponent, useCallback, useContext, useMemo } from "react";
import { GameStateContext } from "./gameState";

import "./scoreWindow.css";
import { GameManager } from "../gameManager";

interface Props {
  manager: GameManager;
}

export const ScoreWindow: FunctionComponent<Props> = ({ manager }) => {
  const { state } = useContext(GameStateContext);

  const complete = useMemo(() => {
    return state.hitTargetCount === state.targetCount;
  }, [state]);

  const onGoToNextGame = useCallback(async () => {
    await manager.loadGame(manager.currentLevelID() + 1);
  }, [manager]);

  const onTryAgain = useCallback(async () => {
    await manager.loadGame(manager.currentLevelID());
  }, [manager]);

  return (
    <div className="scoreWindow">
      <>
        {complete ? (
          <>
            <div className="title">Congrats!</div>
            <div className="message">You hit all the targets!</div>
          </>
        ) : (
          <>
            <div className="title">Oh no!</div>
            <div className="message">You failed to hit all the targets...</div>
          </>
        )}
      </>
      {complete && (
        <>
          <div className="score">Score: {state.score}</div>
          <button onClick={onGoToNextGame}>Next Level</button>
        </>
      )}
      {!complete && (
        <>
          <button onClick={onTryAgain}>Try Again</button>
        </>
      )}
    </div>
  );
};
