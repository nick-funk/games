import {
  Camera,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Raycaster,
  Scene,
} from "three";
import { InputManager } from "../three/inputManager";
import { nearest } from "../three/nearest";

interface GridMesh extends Mesh {
  isClickable: boolean;
  canTraverse: boolean;
  gridX: number;
  gridY: number;
  key: string;
  material: MeshBasicMaterial;
}

export class Grid {
  private group: Group;
  private rays: Raycaster;

  private leftMouseDown: boolean;

  private lookup: Map<string, GridMesh>;

  constructor() {
    this.rays = new Raycaster();
    this.lookup = new Map<string, GridMesh>();

    this.group = new Group();

    const width = 8;
    const height = 8;
    const offsetX = width / 2;
    const offsetY = height / 2;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const isStart = x == 0 && y == 0;
        const isEnd = x == width - 1 && y == height - 1;
        const isClickable = !isStart && !isEnd;

        const xTransl = (x - offsetX) * 0.11;
        const yTransl = (y - offsetY) * 0.11;

        const square = this.createGridSquare();
        square.key = this.computeKey(x, y);
        square.gridX = x;
        square.gridY = y;
        square.isClickable = isClickable;
        square.canTraverse = true;
        square.material.color.set(this.computeColor(isStart, isEnd));
        square.material.needsUpdate = true;
        
        square.translateX(xTransl);
        square.translateY(yTransl);

        this.group.add(square);
        this.lookup.set(square.key, square);
      }
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

  private createGridSquare() {
    const geometry = new PlaneGeometry(0.1, 0.1, 1, 1);
    const material = new MeshBasicMaterial({ color: new Color(1, 1, 1) });

    const mesh = new Mesh(geometry, material) as unknown as GridMesh;
    return mesh;
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

      if (!mesh.canTraverse) {
        material.color.set(new Color(1, 0, 0));
      } else {
        material.color.set(new Color(1, 1, 1));
      }

      material.needsUpdate = true;
    }
  }
}
