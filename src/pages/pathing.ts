import {
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { resizeToParent, wrapResizeFunc } from "../three/resize";

export class PathingGame {
  private parentElement: HTMLElement;
  private animDelegate: (time: number) => void;
  private resizeDelegate: () => void;

  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private mesh: Mesh;

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

    const geometry = new BoxGeometry(0.2, 0.2, 0.2);
    const material = new MeshNormalMaterial();

    this.mesh = new Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(parentRect.width, parentRect.height);
    this.renderer.setAnimationLoop(this.animDelegate);

    this.parentElement.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.resizeDelegate);
  }

  public resize() {
    resizeToParent(this.parentElement, [this.camera], [this.renderer]);
  }

  public animation(time: number) {
    this.mesh.rotation.x = time / 2000;
    this.mesh.rotation.y = time / 1000;

    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const threeParent = document.getElementById("threeParent");
  if (!threeParent) {
    console.error("unable to find the three.js element");
  }

  const game = new PathingGame(threeParent);
  await game.init();
});
