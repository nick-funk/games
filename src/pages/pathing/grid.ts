import {
  BoxGeometry,
  Camera,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
} from "three";
import { InputManager } from "../../three/inputManager";
import { nearest } from "../../three/nearest";
import {
  NodeResult,
  computePath,
} from "../../../node_modules/nf-pathfinder/dist/index";

interface GridMesh extends Mesh {
  isClickable: boolean;
  canTraverse: boolean;
  gridX: number;
  gridY: number;
  key: string;
  material: MeshBasicMaterial;
  pathMarked: boolean;
}

const START_COLOUR = new Color(0.05, 1, 0);
const END_COLOUR = new Color(1, 1, 0);
const UNCLICK_COLOUR = new Color(0.9, 0.9, 0.9);
const CLICKED_COLOUR = new Color(1, 0.05, 0.05);
const PATH_COLOUR = new Color(0.3, 0.3, 1);

const RAISE_AMOUNT = 0.1;

export interface GridTarget {
  position: Vector2;
  score: number;
}

export interface GridDefinition {
  width: number;
  length: number;
  start: Vector2;
  end: Vector2;
  placeableBlocks: number;
  targets: GridTarget[];
}

export interface PathScore {
  hitAllTargets: boolean;
  hitTargetCount: number;
  hitTargets: GridTarget[];
  targetCount: number;
  score: number;
  blocksUsed: number;
  blockCount: number;
}

export interface AnimatedPath {
  path: NodeResult[];
  index: number;
  timer: number;
  complete: boolean;
}

export class Grid {
  private gridGroup: Group;
  private targetGroup: Group;
  private rays: Raycaster;

  private leftMouseDown: boolean;

  private width: number;
  private length: number;

  private lookup: Map<string, GridMesh>;

  private start: Vector2;
  private end: Vector2;
  private targets: GridTarget[];

  public placeableBlocks: number;
  private initialPlaceableBlocks: number;

  public animatedPath: AnimatedPath | null;
  private animatedPathInterval: number = 0.25;

  constructor({
    width,
    length,
    start,
    end,
    placeableBlocks,
    targets,
  }: GridDefinition) {
    this.rays = new Raycaster();
    this.lookup = new Map<string, GridMesh>();
    this.gridGroup = new Group();
    this.targetGroup = new Group();
    this.animatedPath = null;

    this.width = width;
    this.length = length;
    this.initialPlaceableBlocks = placeableBlocks;
    this.placeableBlocks = placeableBlocks;
    this.start = start;
    this.end = end;
    this.targets = targets;

    const offsetX = width / 2;
    const offsetY = length / 2;
    const scaling = 0.11;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < length; y++) {
        const xTransl = (x - offsetX) * scaling + scaling / 2;
        const yTransl = (y - offsetY) * scaling + scaling / 2;

        const square = this.createGridSquare(x, y);
        square.translateX(xTransl);
        square.translateY(yTransl);

        this.gridGroup.add(square);
        this.lookup.set(square.key, square);
      }
    }

    for (const target of targets) {
      const xTransl = (target.position.x - offsetX) * scaling + scaling / 2;
      const yTransl = (target.position.y - offsetY) * scaling + scaling / 2;

      const mesh = this.createTarget(target.position.x, target.position.y);
      mesh.translateX(xTransl);
      mesh.translateY(yTransl);
      mesh.translateZ(0.1);

      this.targetGroup.add(mesh);
    }

    this.reset();
  }

  private isStart(x: number, y: number) {
    return x === this.start.x && y === this.start.y;
  }

  private isEnd(x: number, y: number) {
    return x === this.end.x && y === this.end.y;
  }

  public reset() {
    this.animatedPath = null;
    this.placeableBlocks = this.initialPlaceableBlocks;

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
        square.position.setZ(0);
      }
    }
  }

  public clearPath() {
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

  public traversalMapToString(traversal: number[][]) {
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

  public computePath() {
    const path = computePath(
      this.computeTraversalMap(),
      this.start,
      this.end,
      false
    );

    return path;
  }

  public renderPath(path: NodeResult[]) {
    for (const p of path) {
      const isStart = this.isStart(p.x, p.y);
      const isEnd = this.isEnd(p.x, p.y);

      const key = this.computeKey(p.x, p.y);
      const square = this.lookup.get(key);
      if (!square || isStart || isEnd) {
        continue;
      }

      square.pathMarked = true;
      square.material.color.set(PATH_COLOUR);
      square.material.needsUpdate = true;
    }
  }

  public computeScoreForPath(path: NodeResult[]): PathScore {
    const hitTargetSet = new Set<GridTarget>();

    for (const node of path) {
      for (const target of this.targets) {
        if (node.x === target.position.x && node.y === target.position.y) {
          hitTargetSet.add(target);
        }
      }
    }

    const hitAllTargets = hitTargetSet.size === this.targets.length;
    const hitTargets = [...hitTargetSet];

    let score = 0;
    for (const t of hitTargets) {
      score += t.score;
    }

    score += this.placeableBlocks;

    return {
      hitAllTargets,
      hitTargets,
      hitTargetCount: hitTargets.length,
      targetCount: this.targets.length,
      score,
      blocksUsed: this.initialPlaceableBlocks - this.placeableBlocks,
      blockCount: this.initialPlaceableBlocks,
    };
  }

  private computeColor(isStart: boolean, isEnd: boolean) {
    if (isStart) {
      return START_COLOUR;
    }
    if (isEnd) {
      return END_COLOUR;
    }

    return UNCLICK_COLOUR;
  }

  private computeKey(x: number, y: number) {
    return `${x}:${y}`;
  }

  private createTarget(x: number, y: number) {
    const geometry = new SphereGeometry(0.025, 8, 8);
    const material = new MeshStandardMaterial({ color: END_COLOUR });

    const target = new Mesh(geometry, material);
    target.receiveShadow = true;
    target.castShadow = true;

    target.material.needsUpdate = true;

    return target;
  }

  private createGridSquare(x: number, y: number) {
    const geometry = new BoxGeometry(0.1, 0.1, 0.1);
    const material = new MeshStandardMaterial({ color: UNCLICK_COLOUR });

    const square = new Mesh(geometry, material) as unknown as GridMesh;
    square.pathMarked = false;

    const isClickable = !this.isStart(x, y) && !this.isEnd(x, y);

    square.key = this.computeKey(x, y);
    square.gridX = x;
    square.gridY = y;
    square.isClickable = isClickable;
    square.canTraverse = true;

    square.receiveShadow = true;
    square.castShadow = true;

    square.material.needsUpdate = true;

    return square;
  }

  public addToScene(scene: Scene) {
    scene.add(this.gridGroup);
    scene.add(this.targetGroup);
  }

  public removeFromScene(scene: Scene) {
    scene.remove(this.gridGroup);
    scene.add(this.targetGroup);
  }

  public playTraversal(path: NodeResult[]) {
    this.animatedPath = {
      path,
      index: 0,
      timer: 0,
      complete: false,
    };
  }

  public update(input: InputManager, camera: Camera, elapsed: number) {
    this.updateClick(input, camera);
    this.updateSquareAnimations(elapsed);
    this.updateAnimatedPath(elapsed);
  }

  private updateAnimatedPath(elapsed: number) {
    if (
      !this.animatedPath ||
      this.animatedPath.index >= this.animatedPath.path.length ||
      this.animatedPath.complete
    ) {
      return;
    }

    // Update current index colour
    const p = this.animatedPath.path[this.animatedPath.index];
    const isStart = this.isStart(p.x, p.y);
    const isEnd = this.isEnd(p.x, p.y);

    const key = this.computeKey(p.x, p.y);
    const square = this.lookup.get(key);
    if (square && !isStart && !isEnd) {
      square.pathMarked = true;
      square.material.color.set(PATH_COLOUR);
      square.material.needsUpdate = true;
    }

    // Progress through path
    this.animatedPath.timer += elapsed;
    if (this.animatedPath.timer < this.animatedPathInterval) {
      return;
    }

    this.animatedPath.timer = 0;
    this.animatedPath.index += 1;
    this.animatedPath.complete =
      this.animatedPath.index >= this.animatedPath.path.length;
  }

  private updateSquareAnimations(elapsed: number) {
    const speed = 0.25;
    const diff = elapsed * speed;

    for (const key of this.lookup.keys()) {
      const item = this.lookup.get(key);
      if (!item) {
        continue;
      }

      const isStart = this.isStart(item.gridX, item.gridY);
      const isEnd = this.isEnd(item.gridX, item.gridY);
      if (isStart || isEnd) {
        continue;
      }

      if (item.pathMarked) {
        continue;
      }

      if (item.canTraverse) {
        item.position.setZ((item.position.z -= diff));

        if (item.position.z < 0) {
          item.position.z = 0;
        }

        const interp = item.position.z / RAISE_AMOUNT;
        const color = CLICKED_COLOUR.clone()
          .multiplyScalar(interp)
          .add(UNCLICK_COLOUR.clone().multiplyScalar(1 - interp));

        item.material.color = color;
      } else {
        item.position.setZ((item.position.z += diff));

        if (item.position.z > RAISE_AMOUNT) {
          item.position.z = RAISE_AMOUNT;
        }

        const interp = item.position.z / RAISE_AMOUNT;
        const color = UNCLICK_COLOUR.clone()
          .multiplyScalar(1 - interp)
          .add(CLICKED_COLOUR.clone().multiplyScalar(interp));

        item.material.color = color;
      }
    }
  }

  private updateClick(input: InputManager, camera: Camera) {
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
    const intersections = this.rays.intersectObjects([
      ...this.gridGroup.children,
    ]);
    const int = nearest(camera.position, intersections);

    if (int) {
      const mesh = int.object as GridMesh;
      if (!mesh || !mesh.isClickable) {
        return;
      }

      if (mesh.canTraverse && this.placeableBlocks > 0) {
        mesh.canTraverse = false;
        mesh.pathMarked = false;

        this.placeableBlocks--;
      } else if (!mesh.canTraverse) {
        mesh.canTraverse = true;
        mesh.pathMarked = false;

        this.placeableBlocks++;
      }
    }
  }
}
