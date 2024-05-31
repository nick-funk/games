import {
  AmbientLight,
  Color,
  ColorManagement,
  DirectionalLight,
  LinearDisplayP3ColorSpace,
  LinearSRGBColorSpace,
  PCFSoftShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass";

import { resizeToParent, wrapResizeFunc } from "../three/resize";
import { Grid } from "./grid";
import { InputManager } from "../three/inputManager";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GammaCorrectionShader } from "./gammaCorrectionShader";

export class PathingGame {
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
  gammaCorrectionPass: ShaderPass;

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
    this.camera.position.y = -0.5;
    this.camera.lookAt(new Vector3(0, 0, 0));

    this.scene = new Scene();

    this.grid = new Grid();
    this.grid.addToScene(this.scene);

    const ambientLight = new AmbientLight(new Color(1, 1, 1), 0.75);
    this.scene.add(ambientLight);

    const directionaLight = new DirectionalLight(new Color(1, 1, 1), 1.5);
    directionaLight.castShadow = true;
    directionaLight.position.set(1.0, 1.0, 1.0);
    this.scene.add(directionaLight);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(parentRect.width, parentRect.height);
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
  }

  public resize() {
    resizeToParent(
      this.parentElement,
      [this.camera],
      [this.renderer],
      [this.renderPass, this.gammaCorrectionPass],
      this.composer
    );
  }

  public animation(time: number) {
    this.input.update();

    this.grid.update(this.input, this.camera);
    if (this.input.isKeyDown("p")) {
      this.grid.traverse();
    }

    this.composer.render();
  }
}
