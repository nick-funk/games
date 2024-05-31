import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { resizeToParent, wrapResizeFunc } from "../three/resize";
import { Grid } from "./grid";
import { InputManager } from "../three/inputManager";

export class PathingGame {
  private parentElement: HTMLElement;
  private animDelegate: (time: number) => void;
  private resizeDelegate: () => void;

  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private input: InputManager;
  private grid: Grid;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.animDelegate = this.animation.bind(this);
    this.resizeDelegate = wrapResizeFunc(this.resize.bind(this));
  }

  public async init() {
    const parentRect = this.parentElement.getBoundingClientRect();
    this.camera = new PerspectiveCamera(
      70,
      parentRect.width / parentRect.height,
      0.01,
      100
    );
    this.camera.position.z = 1;

    this.scene = new Scene();

    this.grid = new Grid();
    this.grid.addToScene(this.scene);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(parentRect.width, parentRect.height);
    this.renderer.setAnimationLoop(this.animDelegate);

    this.input = new InputManager(this.renderer.domElement);
    this.parentElement.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.resizeDelegate);
  }

  public resize() {
    resizeToParent(this.parentElement, [this.camera], [this.renderer]);
  }

  public animation(time: number) {
    this.input.update();

    this.grid.update(this.input, this.camera);

    this.renderer.render(this.scene, this.camera);
  }
}