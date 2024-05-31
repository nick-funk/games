import {
  BoxGeometry,
  Camera,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from "three";
import { InputManager } from "../three/inputManager";
import { nearest } from "../three/nearest";
import { computePath } from "../../node_modules/nf-pathfinder/dist/index";

interface GridMesh extends Mesh {
  isClickable: boolean;
  canTraverse: boolean;
  gridX: number;
  gridY: number;
  key: string;
  material: MeshBasicMaterial;
  pathMarked: boolean;
}

export class Grid {
  private group: Group;
  private rays: Raycaster;

  private leftMouseDown: boolean;

  private width: number;
  private length: number;

  private lookup: Map<string, GridMesh>;

  private start: Vector2;
  private end: Vector2;

  constructor(width = 8, length = 8) {
    this.rays = new Raycaster();
    this.lookup = new Map<string, GridMesh>();

    this.group = new Group();

    this.width = width;
    this.length = length;

    this.start = new Vector2(0, 0);
    this.end = new Vector2(width - 1, length - 1);

    const offsetX = width / 2;
    const offsetY = length / 2;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < length; y++) {
        const xTransl = (x - offsetX) * 0.11;
        const yTransl = (y - offsetY) * 0.11;

        const square = this.createGridSquare(x, y);
        square.translateX(xTransl);
        square.translateY(yTransl);

        this.group.add(square);
        this.lookup.set(square.key, square);
      }
    }

    this.reset();
  }

  private isStart(x: number, y: number) {
    return x === this.start.x && y === this.start.y;
  }

  private isEnd(x: number, y: number) {
    return x === this.end.x && y === this.end.y;
  }

  private reset() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        const isStart = this.isStart(x, y);
        const isEnd = this.isEnd(x, y);

        const key = this.computeKey(x, y);
        const square = this.lookup.get(key);
        if (!square) {
          continue;
        }

        square.canTraverse = true;
        square.material.color.set(this.computeColor(isStart, isEnd));
        square.material.needsUpdate = true;
      }
    }
  }

  private clearPath() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        const isStart = this.isStart(x, y);
        const isEnd = this.isEnd(x, y);

        const key = this.computeKey(x, y);
        const square = this.lookup.get(key);
        if (!square) {
          continue;
        }

        if (square.pathMarked) {
          square.material.color.set(this.computeColor(isStart, isEnd));
          square.material.needsUpdate = true;

          square.pathMarked = false;
        }
      }
    }
  }

  public computeTraversalMap() {
    const traversalMap: number[][] = [];

    for (let x = 0; x < this.width; x++) {
      traversalMap.push([]);

      for (let y = 0; y < this.length; y++) {
        traversalMap[0].push(1);
      }
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        const key = this.computeKey(x, y);
        const square = this.lookup.get(key);
        if (!square) {
          console.warn(`unable to find square for key ${key}`);
          continue;
        }

        traversalMap[x][y] = square.canTraverse ? 1 : 0;
      }
    }

    return traversalMap;
  }

  public traversalToString(traversal: number[][]) {
    let output = "";

    for (let x = 0; x < this.width; x++) {
      const vals: number[] = [];
      for (let y = 0; y < this.length; y++) {
        const value = traversal[x][y];
        vals.push(value);
      }

      output += `${vals.join(",")}\n`;
    }

    return output;
  }

  public traverse() {
    this.clearPath();

    const path = computePath(
      this.computeTraversalMap(),
      new Vector2(0, 0),
      new Vector3(this.width - 1, this.length - 1),
      false
    );

    for (const p of path) {
      const isStart = this.isStart(p.x, p.y);
      const isEnd = this.isEnd(p.x, p.y);

      const key = this.computeKey(p.x, p.y);
      const square = this.lookup.get(key);
      if (!square || isStart || isEnd) {
        continue;
      }

      square.pathMarked = true;
      square.material.color.set(new Color(0, 0, 1));
      square.material.needsUpdate = true;
    }
  }

  private computeColor(isStart: boolean, isEnd: boolean) {
    if (isStart) {
      return new Color(0, 1, 0);
    }
    if (isEnd) {
      return new Color(1, 1, 0);
    }

    return new Color(1, 1, 1);
  }

  private computeKey(x: number, y: number) {
    return `${x}:${y}`;
  }

  private createGridSquare(x: number, y: number) {
    const geometry = new BoxGeometry(0.1, 0.1, 0.1);
    const material = new MeshStandardMaterial({ color: new Color(1, 1, 1) });

    const square = new Mesh(geometry, material) as unknown as GridMesh;
    square.pathMarked = false;

    const isClickable = !this.isStart(x, y) && !this.isEnd(x, y);

    square.key = this.computeKey(x, y);
    square.gridX = x;
    square.gridY = y;
    square.isClickable = isClickable;
    square.canTraverse = true;

    square.material.needsUpdate = true;

    return square;
  }

  public addToScene(scene: Scene) {
    scene.add(this.group);
  }

  public removeFromScene(scene: Scene) {
    scene.remove(this.group);
  }

  public update(input: InputManager, camera: Camera) {
    if (!this.leftMouseDown && input.mouse().buttons.left.down) {
      this.clickGrid(input, camera);
      this.leftMouseDown = true;
    }

    if (!input.mouse().buttons.left.down) {
      this.leftMouseDown = false;
    }
  }

  private clickGrid(input: InputManager, camera: Camera) {
    this.rays.setFromCamera(input.mouse().position.relative, camera);
    const intersections = this.rays.intersectObjects([...this.group.children]);
    const int = nearest(camera.position, intersections);

    if (int) {
      const mesh = int.object as GridMesh;
      if (!mesh || !mesh.isClickable) {
        return;
      }

      const material = mesh.material as MeshBasicMaterial;
      mesh.canTraverse = !mesh.canTraverse;
      mesh.pathMarked = false;

      if (!mesh.canTraverse) {
        material.color.set(new Color(1, 0, 0));
        mesh.position.setZ(0.1);
      } else {
        material.color.set(new Color(1, 1, 1));
        mesh.position.setZ(0);
      }

      material.needsUpdate = true;
    }
  }
}
