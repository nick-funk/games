import {
  FunctionComponent,
} from "react";

import "./root.css";
import { GameStateContext, useLiveGameState } from "./gameState";
import { ControlsMenu } from "./controlsMenu";
import { GameManager } from "../gameManager";

interface Props {
  manager: GameManager;
}

export const UIRoot: FunctionComponent<Props> = ({ manager }) => {
  const stateVal = useLiveGameState(manager);

  return (
    <div className="uiRoot">
      <GameStateContext.Provider value={stateVal}>
        <ControlsMenu />
      </GameStateContext.Provider>
    </div>
  );
};
