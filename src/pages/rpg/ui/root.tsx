import { FunctionComponent } from "react";

import { GameManager } from "../gameManager";
import { GameStateContext, useLiveGameState } from "./gameState";

interface Props {
  manager: GameManager;
}

export const UIRoot: FunctionComponent<Props> = ({ manager }) => {
  const stateVal = useLiveGameState(manager);

  return (
    <GameStateContext.Provider value={stateVal}>
      <>
        UI
      </>
    </GameStateContext.Provider>
  );
};
