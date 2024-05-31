import {
  FunctionComponent,
} from "react";
import { PathingGame } from "../game";

import "./root.css";
import { GameStateContext, useLiveGameState } from "./gameState";
import { ControlsMenu } from "./controlsMenu";

interface Props {
  game: PathingGame;
}

export const UIRoot: FunctionComponent<Props> = ({ game }) => {
  const stateVal = useLiveGameState(game);

  return (
    <div className="uiRoot">
      <GameStateContext.Provider value={stateVal}>
        <ControlsMenu />
      </GameStateContext.Provider>
    </div>
  );
};
