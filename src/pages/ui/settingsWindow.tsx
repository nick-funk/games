import {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";

import "./settingsWindow.css";
import { GameManager } from "../gameManager";

interface Props {
  manager: GameManager;
}

export const SettingsWindow: FunctionComponent<Props> = ({ manager }) => {
  const [renderScale, setRenderScale] = useState(manager.getRenderScale());

  const onToggleRenderScale = useCallback(() => {
    if (renderScale === 1) {
      setRenderScale(0.5);
      manager.setRenderScale(0.5);
    }
    if (renderScale === 0.5) {
      setRenderScale(0.25);
      manager.setRenderScale(0.25);
    }
    if (renderScale === 0.25) {
      setRenderScale(1);
      manager.setRenderScale(1);
    }
  }, [renderScale, manager]);

  const renderFidelity = useMemo(() => {
    if (renderScale === 1) {
      return "High";
    }
    if (renderScale === 0.5) {
      return "Med";
    }
    if (renderScale === 0.25) {
      return "Low";
    }

    return "Unknown";
  }, [renderScale]);

  return (
    <div className="settingsWindow">
      <button onClick={onToggleRenderScale}>{renderFidelity}</button>
    </div>
  );
};
