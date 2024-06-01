import { FunctionComponent } from "react";

import { GameStateContext, useLiveGameState } from "./gameState";
import { ControlWindow } from "./controlWindow";
import { GameManager } from "../gameManager";
import { ScoreWindow } from "./scoreWindow";
import { SettingsWindow } from "./settingsWindow";

interface Props {
  manager: GameManager;
}

export const UIRoot: FunctionComponent<Props> = ({ manager }) => {
  const stateVal = useLiveGameState(manager);

  return (
    <GameStateContext.Provider value={stateVal}>
      <>
        <ControlWindow />
        {stateVal.state.score > 0 && <ScoreWindow manager={manager} />}
        <SettingsWindow manager={manager} />
      </>
    </GameStateContext.Provider>
  );
};
