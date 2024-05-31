import { Vector2 } from "three";

export interface MousePosition {
  position: {
    default: Vector2;
    relative: Vector2;
  };
  buttons: {
    left: {
      down: boolean;
      clicked: boolean;
    };
    right: {
      down: boolean;
      clicked: boolean;
    };
  };
  wheel: {
    deltaX: number;
    deltaY: number;
    deltaZ: number;
  }
}

export class InputManager {
  private _keys: Map<string, boolean>;
  private _mouse: MousePosition;

  private canvas: HTMLCanvasElement;

  private onKeyPressDelegate: (event: KeyboardEvent) => void;
  private onKeyUpDelegate: (event: KeyboardEvent) => void;
  private onKeyDownDelegate: (event: KeyboardEvent) => void;
  private onMouseMoveDelegate: (event: MouseEvent) => void;
  private onMouseDownDelegate: (event: MouseEvent) => void;
  private onMouseUpDelegate: (event: MouseEvent) => void;
  private onMouseClickDelegate: (event: MouseEvent) => void;
  private onMouseWheelDelegate: (event: WheelEvent) => void;
  private onMouseLeaveDelegate: (event: MouseEvent) => void;;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this._keys = new Map<string, boolean>();

    // this.onKeyPressDelegate = this.onKeyPress.bind(this);
    this.onKeyUpDelegate = this.onKeyUp.bind(this);
    this.onKeyDownDelegate = this.onKeyDown.bind(this);
    document.addEventListener("keypress", this.onKeyPressDelegate, false);
    document.addEventListener("keyup", this.onKeyUpDelegate, false);
    document.addEventListener("keydown", this.onKeyDownDelegate, false);

    this._mouse = {
      buttons: {
        left: {
          down: false,
          clicked: false,
        },
        right: {
          down: false,
          clicked: false,
        },
      },
      position: {
        default: new Vector2(0, 0),
        relative: new Vector2(0, 0),
      },
      wheel: {
        deltaX: 0,
        deltaY: 0,
        deltaZ: 0,
      }
    };

    this.onMouseMoveDelegate = this.onMouseMove.bind(this);
    this.onMouseDownDelegate = this.onMouseDown.bind(this);
    this.onMouseUpDelegate = this.onMouseUp.bind(this);
    this.onMouseClickDelegate = this.onMouseClick.bind(this);
    this.onMouseWheelDelegate = this.onMouseWheel.bind(this);
    this.onMouseLeaveDelegate = this.onMouseLeave.bind(this);

    canvas.addEventListener("pointermove", this.onMouseMoveDelegate);
    canvas.addEventListener("mousedown", this.onMouseDownDelegate);
    canvas.addEventListener("mouseup", this.onMouseUpDelegate);
    canvas.addEventListener("click", this.onMouseClickDelegate);
    canvas.addEventListener("wheel", this.onMouseWheelDelegate);
    canvas.addEventListener("mouseleave", this.onMouseLeaveDelegate);
  }

  public update() {
    this._mouse.buttons.left.clicked = false;
    this._mouse.buttons.right.clicked = false;

    this._mouse.wheel.deltaX = 0;
    this._mouse.wheel.deltaY = 0;
    this._mouse.wheel.deltaZ = 0;
  }

  private onMouseLeave(event: MouseEvent) {
    this._mouse.buttons.left.clicked = false;
    this._mouse.buttons.right.clicked = false;
    this._mouse.buttons.left.down = false;
    this._mouse.buttons.right.down = false;

    this._mouse.wheel.deltaX = 0;
    this._mouse.wheel.deltaY = 0;
    this._mouse.wheel.deltaZ = 0;
  }

  private onMouseWheel(event: WheelEvent) {
    this._mouse.wheel.deltaX = event.deltaX;
    this._mouse.wheel.deltaY = event.deltaY;
    this._mouse.wheel.deltaZ = event.deltaZ;
  }

  private onMouseMove(event: MouseEvent) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - canvasRect.left;
    const canvasY = event.clientY - canvasRect.top;

    const relX = (canvasX / canvasRect.width) * 2 - 1;
    const relY = -(canvasY / canvasRect.height) * 2 + 1;

    const x = event.clientX;
    const y = event.clientY;

    this._mouse.position = {
      default: new Vector2(x, y),
      relative: new Vector2(relX, relY),
    };

    this._keys.set("ctrl", event.ctrlKey);
    this._keys.set("alt", event.altKey);
    this._keys.set("shift", event.shiftKey);
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      this._mouse.buttons.left.down = true;
    }
    if (event.button === 2) {
      this._mouse.buttons.right.down = true;
    }
  }

  private onMouseUp(event: MouseEvent) {
    const rightClicked = this._mouse.buttons.right.down && event.button === 2;

    if (event.button === 0) {
      this._mouse.buttons.left.down = false;
    }
    if (event.button === 2) {
      this._mouse.buttons.right.down = false;
    }

    this._mouse.buttons.right.clicked = rightClicked;
  }

  private onMouseClick(event: MouseEvent) {
    if (event.button === 0) {
      this._mouse.buttons.left.clicked = true;
    }
    if (event.button === 2) {
      this._mouse.buttons.right.clicked = true;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    const { key } = event;

    this._keys.set(key.toLowerCase(), false);

    this._keys.set("ctrl", event.ctrlKey);
    this._keys.set("alt", event.altKey);
    this._keys.set("shift", event.shiftKey);
  }

  private onKeyDown(event: KeyboardEvent) {
    const { key } = event;

    this._keys.set(key.toLowerCase(), true);

    this._keys.set("ctrl", event.ctrlKey);
    this._keys.set("alt", event.altKey);
    this._keys.set("shift", event.shiftKey);
  }

  public isKeyDown(key: string): boolean {
    const lower = key.toLowerCase();
    const value = this._keys.has(lower) ? this._keys.get(lower) : false;

    return value;
  }

  public mouse(): MousePosition {
    return this._mouse;
  }
}
