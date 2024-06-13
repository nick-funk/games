import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  Texture,
  Vector2,
  Vector3,
} from "three";

import { InputManager } from "../../three/inputManager";
import { Body, Box, Vec3, World } from "cannon-es";
import { CollisionGroup } from "./collision";

export class Agent {
  protected mesh: Mesh;

  protected _speed: number;
  protected _size: Vector2;

  protected world: World;
  protected body: Body;

  constructor(world: World, texture: Texture) {
    this.world = world;

    this._speed = 2.0;
    this._size = new Vector2(0.2, 0.2);

    const material = new MeshStandardMaterial({
      map: texture,
      transparent: true,
    });
    const geometry = new PlaneGeometry(this._size.x, this._size.y, 1, 1);

    this.mesh = new Mesh(geometry, material);

    this.body = new Body({
      mass: 1,
      shape: new Box(new Vec3(this._size.x / 2, this._size.y / 2, 0.025)),
      linearDamping: 0.95,
      angularDamping: 0.95,
      angularFactor: new Vec3(0, 0, 0),
      linearFactor: new Vec3(1, 1, 0),
      collisionFilterGroup: CollisionGroup.Default,
      collisionFilterMask: CollisionGroup.Default,
    });
  }

  get size(): Vector2 {
    return this._size.clone();
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

  public syncPosition() {
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

export class PlayerAgent extends Agent {
  public update(elapsed: number, input: InputManager) {
    const dir = new Vector3(0, 0, 0);
    if (input.isKeyDown("w")) {
      dir.y = 1;
    }
    if (input.isKeyDown("s")) {
      dir.y = -1;
    }
    if (input.isKeyDown("a")) {
      dir.x = -1;
    }
    if (input.isKeyDown("d")) {
      dir.x = 1;
    }

    const diff = dir
      .clone()
      .normalize()
      .multiplyScalar(elapsed * this._speed);
    this.body.applyImpulse(new Vec3(diff.x, diff.y, diff.z));

    this.syncPosition();
  }
}

export class MobAgent extends Agent {
  private aggroRadius: number;
  private aggroed: boolean;

  constructor(world: World, texture: Texture, aggroRadius: number) {
    super(world, texture);

    this.aggroRadius = aggroRadius;
    this.aggroed = false;
    this._speed = 0.25;
  }

  public update(elapsed: number, player: PlayerAgent) {
    this.aggroed = this.isAggroed(player.position);

    if (this.aggroed) {
      const dir = player.position.sub(this.position).normalize();
      const imp = dir.multiplyScalar(elapsed * this._speed);
      this.body.applyImpulse(new Vec3(imp.x, imp.y, imp.z));
    }

    this.syncPosition();
  }

  private isAggroed(playerPosition: Vector3): boolean {
    const diff = this.position.distanceTo(playerPosition);
    return diff <= this.aggroRadius;
  }
}
