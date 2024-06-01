import { Vector2 } from "three";
import { PathingGame, State } from "./game";
import { GridDefinition } from "./grid";

export class GameManager {
  private currentGame: PathingGame | null;
  private gameDefinitions: Map<number, GridDefinition>;
  private parentElement: HTMLElement;

  private renderScale: number;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.currentGame = null;
    this.renderScale = 1;

    this.gameDefinitions = new Map<number, GridDefinition>();
    this.gameDefinitions.set(1, {
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
    this.gameDefinitions.set(2, {
      width: 8,
      length: 8,
      start: new Vector2(3, 2),
      end: new Vector2(3, 5),
      placeableBlocks: 12,
      targets: [
        {
          position: new Vector2(3, 1),
          score: 5,
        },
      ],
    });
  }

  public async loadGame(id: number) {
    const def = this.gameDefinitions.get(id);
    if (!def) {
      return;
    }

    if (this.currentGame) {
      this.currentGame.dispose();
    }

    this.currentGame = new PathingGame(id, this.parentElement, this.renderScale);
    await this.currentGame.init(def);
  }

  public getRenderScale(): number {
    return this.renderScale;
  }

  public setRenderScale(value: number) {
    this.renderScale = value;
    this.currentGame.renderScale = value;
    this.currentGame.resize();
  }

  public currentLevelID(): number {
    return this.currentGame ? this.currentGame.id : 0;
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
