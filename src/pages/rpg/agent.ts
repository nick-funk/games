import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Texture,
  Vector3,
} from "three";

import { InputManager } from "../../three/inputManager";
import { Body, Box, Vec3, World } from "cannon-es";
import { CollisionGroup } from "./collision";

export class Agent {
  private mesh: Mesh;

  private speed: number;
  private world: World;
  private body: Body;

  constructor(world: World) {
    this.speed = 2.0;
    this.world = world;
  }

  public async init(texture: Texture) {
    const material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
    });
    const size = 0.2;

    const geometry = new PlaneGeometry(size, size, 1, 1);

    this.mesh = new Mesh(geometry, material);

    this.body = new Body({
      mass: 1,
      shape: new Box(new Vec3(size / 2, size / 2, 1)),
      linearDamping: 0.95,
      angularDamping: 0.95,
      angularFactor: new Vec3(0, 0, 0),
      linearFactor: new Vec3(1, 1, 0),
      collisionFilterGroup: CollisionGroup.Default,
      collisionFilterMask: CollisionGroup.Default,
    });
  }

  get position(): Vector3 {
    const v = this.body.position.clone();
    return new Vector3(v.x, v.y, v.z);
  }

  set position(value: Vector3) {
    this.body.position.set(value.x, value.y, value.z);
  }

  public addToScene(scene: Scene) {
    scene.add(this.mesh);
    this.world.addBody(this.body);
  }

  public update(elapsed: number, input: InputManager) {
    const appliedMovement = new Vector3();
    if (input.isKeyDown("w")) {
      appliedMovement.y += elapsed * this.speed;
    }
    if (input.isKeyDown("s")) {
      appliedMovement.y -= elapsed * this.speed;
    }
    if (input.isKeyDown("a")) {
      appliedMovement.x -= elapsed * this.speed;
    }
    if (input.isKeyDown("d")) {
      appliedMovement.x += elapsed * this.speed;
    }

    this.body.applyImpulse(
      new Vec3(appliedMovement.x, appliedMovement.y, appliedMovement.z)
    );

    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w
    );
  }
}
