import {
  AmbientLight,
  Color,
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { InputManager } from "../../three/inputManager";
import {
  calculatePixelRatio,
  resizeToParent,
  wrapResizeFunc,
} from "../../three/resize";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass";

import { TileMap } from "./tileMap";
import townDefinition from "../../data/rpg/tilemaps/town.json";
import { Agent } from "./agent";
import { Textures } from "./textures/textures";
import { Vec3, World } from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

export interface State {}

export class RPGGame {
  public renderScale: number;

  private parentElement: HTMLElement;
  private animDelegate: (time: number) => void;
  private resizeDelegate: () => void;

  private lastTime: number;
  private isLoaded: boolean;

  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private input: InputManager;

  private composer: EffectComposer;
  private renderPass: SSAARenderPass;

  public state: State;

  private loader: TextureLoader;
  private textures: Textures;

  private player: Agent;
  private world: World;
  private cannonDebugger: any;

  constructor(parentElement: HTMLElement, renderScale: number) {
    this.lastTime = 0;
    this.renderScale = renderScale;

    this.parentElement = parentElement;
    this.animDelegate = this.animation.bind(this);
    this.resizeDelegate = wrapResizeFunc(this.resize.bind(this));
  }

  public async init() {
    if (this.isLoaded) {
      return;
    }

    this.state = {};

    const parentRect = this.parentElement.getBoundingClientRect();
    this.camera = new PerspectiveCamera(
      70,
      parentRect.width / parentRect.height,
      0.01,
      100
    );

    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(new Vector3(0, 0, 0));

    this.scene = new Scene();

    const ambientLight = new AmbientLight(new Color(1, 1, 1), 1.5);
    this.scene.add(ambientLight);

    const directionaLight = new DirectionalLight(new Color(1, 1, 1), 2);
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

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new SSAARenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.input = new InputManager(this.renderer.domElement);
    this.parentElement.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.resizeDelegate);

    this.world = new World({
      gravity: new Vec3(0, 0, 0),
    });
    this.cannonDebugger = CannonDebugger(this.scene, this.world);

    this.loader = new TextureLoader();
    this.textures = new Textures(this.loader);

    const tileMap = new TileMap(townDefinition);
    await tileMap.init(this.textures.tileMap);
    tileMap.addToScene(this.scene, this.world);

    this.player = new Agent(this.world);
    await this.player.init(await this.textures.agents.load("knight"));
    this.player.addToScene(this.scene);

    this.isLoaded = true;
  }

  public dispose() {
    if (!this.isLoaded) {
      return;
    }

    this.input.dispose();
    this.parentElement.removeChild(this.renderer.domElement);

    window.removeEventListener("resize", this.resizeDelegate);
  }

  public resize() {
    resizeToParent(
      this.parentElement,
      [this.camera],
      [this.renderer],
      this.renderScale,
      [this.renderPass],
      this.composer
    );
  }

  public animation(time: number) {
    if (!this.isLoaded) {
      return;
    }

    const elapsed = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.world.fixedStep();
    this.cannonDebugger.update()

    this.player.update(elapsed, this.input);
    this.updateCamera();

    this.composer.render();
  }

  private updateCamera() {
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y,
      this.player.position.z + 2
    );

    this.camera.lookAt(this.player.position);
  }
}
