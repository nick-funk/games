import {
  AmbientLight,
  Color,
  DirectionalLight,
  LinearSRGBColorSpace,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass";

import { calculatePixelRatio, resizeToParent, wrapResizeFunc } from "../three/resize";
import { Grid, GridDefinition } from "./grid";
import { InputManager } from "../three/inputManager";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GammaCorrectionShader } from "./gammaCorrectionShader";
import { isSmallScreen } from "../three/screen";

export interface State {
  play: boolean;
  reset: boolean;
  blocks: number;
  totalBlocks: number;
  score: number;
  hitTargetCount: number;
  targetCount: number;
}

export class PathingGame {
  public readonly id: number;
  public renderScale: number;

  private parentElement: HTMLElement;
  private animDelegate: (time: number) => void;
  private resizeDelegate: () => void;

  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private input: InputManager;
  private grid: Grid;
  private composer: EffectComposer;
  private renderPass: SSAARenderPass;
  private gammaCorrectionPass: ShaderPass;
  private lastTime: number;
  private isLoaded: boolean;

  public state: State;

  constructor(id: number, parentElement: HTMLElement, renderScale: number) {
    this.id = id;
    this.lastTime = 0;
    this.renderScale = renderScale;

    this.parentElement = parentElement;
    this.animDelegate = this.animation.bind(this);
    this.resizeDelegate = wrapResizeFunc(this.resize.bind(this));
  }

  public dispose() {
    if (!this.isLoaded) {
      return;
    }

    this.input.dispose();
    this.parentElement.removeChild(this.renderer.domElement);

    window.removeEventListener("resize", this.resizeDelegate);
  }

  public async init(grid: GridDefinition) {
    if (this.isLoaded) {
      return;
    }

    this.resetState();
    this.state.blocks = 0;
    this.state.totalBlocks = grid.placeableBlocks;
    this.state.score = 0;
    this.state.hitTargetCount = 0;
    this.state.targetCount = grid.targets.length;

    const parentRect = this.parentElement.getBoundingClientRect();
    this.camera = new PerspectiveCamera(
      70,
      parentRect.width / parentRect.height,
      0.01,
      100
    );

    if (isSmallScreen()) {
      this.camera.position.z = 1.55;
      this.camera.position.y = -0.85;
    } else {
      this.camera.position.z = 1;
      this.camera.position.y = -0.5;
    }

    this.camera.lookAt(new Vector3(0, 0, 0));

    this.scene = new Scene();

    this.grid = new Grid(grid);
    this.grid.addToScene(this.scene);

    const ambientLight = new AmbientLight(new Color(1, 1, 1), 0.75);
    this.scene.add(ambientLight);

    const directionaLight = new DirectionalLight(new Color(1, 1, 1), 3);
    directionaLight.castShadow = true;
    directionaLight.shadow.mapSize = new Vector2(2048, 2048);
    directionaLight.position.set(0.7, 0.65, 2.0);
    this.scene.add(directionaLight);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(parentRect.width, parentRect.height);
    this.renderer.setPixelRatio(calculatePixelRatio(this.renderScale));
    this.renderer.setAnimationLoop(this.animDelegate);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.outputColorSpace = LinearSRGBColorSpace;

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new SSAARenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(this.gammaCorrectionPass);

    this.input = new InputManager(this.renderer.domElement);
    this.parentElement.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.resizeDelegate);

    this.isLoaded = true;
  }

  private resetState() {
    this.state = {
      ...this.state,
      play: false,
      reset: false,
    };

    return this.state;
  }

  public resize() {
    resizeToParent(
      this.parentElement,
      [this.camera],
      [this.renderer],
      this.renderScale,
      [this.renderPass, this.gammaCorrectionPass],
      this.composer
    );
  }

  public animation(time: number) {
    const elapsed = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (!this.isLoaded) {
      return;
    }

    this.input.update();

    this.grid.update(this.input, this.camera, elapsed);
    this.state.blocks = this.grid.placeableBlocks;

    if (this.input.isKeyDown("p") || this.state.play) {
      this.grid.clearPath();
      const path = this.grid.computePath();

      this.grid.playTraversal(path);
    }
    if (this.input.isKeyDown("r") || this.state.reset) {
      this.grid.reset();
      this.state.score = 0;
      this.state.hitTargetCount = 0;
    }

    if (this.grid.animatedPath?.complete) {
      const result = this.grid.computeScoreForPath(this.grid.animatedPath.path);
      this.state.score = result.score;
      this.state.hitTargetCount = result.hitTargetCount;
    }

    this.resetState();

    this.composer.render();
  }
}
