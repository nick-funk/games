import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Texture,
  Vector3,
} from "three";

import { InputManager } from "../../three/inputManager";

export class Agent {
  private mesh: Mesh;

  private speed: number;

  constructor() {
    this.speed = 0.65;
  }

  public async init(texture: Texture) {
    const material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
    });
    const geometry = new PlaneGeometry(0.2, 0.2, 1, 1);

    this.mesh = new Mesh(geometry, material);
  }

  get position(): Vector3 {
    return this.mesh.position.clone();
  }

  set position(value: Vector3) {
    this.mesh.position.set(value.x, value.y, value.z);
  }

  public addToScene(scene: Scene) {
    scene.add(this.mesh);
  }

  public update(elapsed: number, input: InputManager) {
    if (input.isKeyDown("w")) {
      this.mesh.position.y += elapsed * this.speed;
    }
    if (input.isKeyDown("s")) {
      this.mesh.position.y -= elapsed * this.speed;
    }
    if (input.isKeyDown("a")) {
      this.mesh.position.x -= elapsed * this.speed;
    }
    if (input.isKeyDown("d")) {
      this.mesh.position.x += elapsed * this.speed;
    }
  }
}
