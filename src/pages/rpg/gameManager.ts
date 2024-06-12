import { RPGGame, State } from "./game";

export class GameManager {
  private currentGame: RPGGame | null;
  private parentElement: HTMLElement;

  private renderScale: number;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.currentGame = null;
    this.renderScale = 1;
  }

  public async loadGame() {
    if (this.currentGame) {
      this.currentGame.dispose();
    }

    this.currentGame = new RPGGame(this.parentElement, this.renderScale);
    await this.currentGame.init();
  }

  public getRenderScale(): number {
    return this.renderScale;
  }

  public setRenderScale(value: number) {
    this.renderScale = value;
    this.currentGame.renderScale = value;
    this.currentGame.resize();
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
