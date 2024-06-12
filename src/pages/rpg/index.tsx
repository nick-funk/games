import { createRoot } from "react-dom/client";
import { GameManager } from "./gameManager";
import { UIRoot } from "./ui/root";

document.addEventListener("DOMContentLoaded", async () => {
  const threeParent = document.getElementById("threeParent");
  if (!threeParent) {
    console.error("unable to find the three.js element");
    return;
  }

  const manager = new GameManager(threeParent);
  await manager.loadGame();

  const reactRoot = document.getElementById("reactRoot");
  if (!reactRoot) {
    console.error("unable to find the react root element");
    return;
  }

  const root = createRoot(reactRoot);
  root.render(<UIRoot manager={manager} />);
});
