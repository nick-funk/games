import { createRoot } from "react-dom/client";

import { PathingGame } from "./game";
import { UIRoot } from "./ui/root";

document.addEventListener("DOMContentLoaded", async () => {
  const threeParent = document.getElementById("threeParent");
  if (!threeParent) {
    console.error("unable to find the three.js element");
    return;
  }

  const game = new PathingGame(threeParent);
  await game.init();

  const reactRoot = document.getElementById("reactRoot");
  if (!reactRoot) {
    console.error("unable to find the react root element");
    return;
  }

  const root = createRoot(reactRoot);
  root.render(<UIRoot game={game} />);
});
