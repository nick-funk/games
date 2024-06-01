import { createRoot } from "react-dom/client";

import { PathingGame } from "./game";
import { UIRoot } from "./ui/root";
import { Vector2 } from "three";

document.addEventListener("DOMContentLoaded", async () => {
  const threeParent = document.getElementById("threeParent");
  if (!threeParent) {
    console.error("unable to find the three.js element");
    return;
  }

  const game = new PathingGame(threeParent);
  await game.init({
    width: 8,
    length: 8,
    start: new Vector2(0, 0),
    end: new Vector2(7, 7),
    placeableBlocks: 12,
    targets: [
      {
        position: new Vector2(0, 7),
        score: 5,
      },
    ],
  });

  const reactRoot = document.getElementById("reactRoot");
  if (!reactRoot) {
    console.error("unable to find the react root element");
    return;
  }

  const root = createRoot(reactRoot);
  root.render(<UIRoot game={game} />);
});
