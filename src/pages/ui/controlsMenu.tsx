import { FunctionComponent, useCallback, useContext } from "react";
import { GameStateContext } from "./gameState";

export const ControlsMenu: FunctionComponent = () => {
  const { state, setState } = useContext(GameStateContext);

  const onPlay = useCallback(() => {
    setState({
      play: true,
    });
  }, [setState]);

  const onReset = useCallback(() => {
    setState({
      reset: true,
    });
  }, [setState]);

  return (
    <>
      <button onClick={onPlay}>Play</button>
      <button onClick={onReset}>Reset</button>

      <div>Blocks: {state.blocks} / {state.totalBlocks}</div>
      <div>Targets: {state.hitTargetCount} / {state.targetCount}</div>
      <div>Score: {state.score}</div>
    </>
  );
};
