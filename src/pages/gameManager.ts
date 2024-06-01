import { Vector2 } from "three";
import { PathingGame, State } from "./game";
import { GridDefinition } from "./grid";

export class GameManager {
  private currentGame: PathingGame | null;
  private gameDefinitions: Map<string, GridDefinition>;
  private parentElement: HTMLElement;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.currentGame = null;

    this.gameDefinitions = new Map<string, GridDefinition>();
    this.gameDefinitions.set("1", {
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
  }

  public async loadGame(id: string) {
    const def = this.gameDefinitions.get(id);
    if (!def) {
      return;
    }

    if (this.currentGame) {
      this.currentGame.dispose();
    }

    this.currentGame = new PathingGame(this.parentElement);
    await this.currentGame.init(def);
  }

  public setState(state: State) {
    this.currentGame.state = state;
  }

  public getState(): State {
    if (!this.currentGame) {
      return GameManager.emptyState();
    }

    return this.currentGame.state;
  }

  public static emptyState(): State {
    return {
      play: false,
      reset: false,
      blocks: 0,
      totalBlocks: 0,
      score: 0,
      hitTargetCount: 0,
      targetCount: 0,
    };
  }
}
