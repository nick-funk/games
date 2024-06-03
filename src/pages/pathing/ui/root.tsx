import { FunctionComponent } from "react";

import { GameStateContext, useLiveGameState } from "./gameState";
import { ControlWindow } from "./controlWindow";
import { GameManager } from "../gameManager";
import { ScoreWindow } from "./scoreWindow";
import { NavWindow } from "./navigationWindow";

interface Props {
  manager: GameManager;
}

export const UIRoot: FunctionComponent<Props> = ({ manager }) => {
  const stateVal = useLiveGameState(manager);

  return (
    <GameStateContext.Provider value={stateVal}>
      <>
        <NavWindow />
        <ControlWindow />
        {stateVal.state.score > 0 && <ScoreWindow manager={manager} />}
      </>
    </GameStateContext.Provider>
  );
};
