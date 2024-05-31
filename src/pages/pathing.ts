import { InputManager } from "../three/inputManager";
import { PathingGame } from "./game";

document.addEventListener("DOMContentLoaded", async () => {
  const threeParent = document.getElementById("threeParent");
  if (!threeParent) {
    console.error("unable to find the three.js element");
  }

  const game = new PathingGame(threeParent);
  await game.init();
});
