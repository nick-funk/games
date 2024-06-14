import { NodeResult } from "nf-pathfinder";
import { BufferGeometry, Color, Line, LineBasicMaterial, Scene, Vector3 } from "three";
import { TileMap } from "./tileMap";

export class PathDebugger {
  private scene: Scene;

  private lines: Map<string, Line>;
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.lines = new Map<string, Line>();
  }

  public debugPath(id: string, path: NodeResult[], tileMap: TileMap) {
    const material = new LineBasicMaterial( { color: new Color(1.0, 0, 0) } );

    const points = [];
    for (const node of path) {
      points.push(tileMap.tilePosToVec(node.x, node.y));
    }

    const geometry = new BufferGeometry().setFromPoints( points );
    const line = new Line(geometry, material);

    if (this.lines.has(id)) {
      this.scene.remove(this.lines.get(id));
    }

    this.lines.set(id, line);
    this.scene.add(line);
  }

  public clear(id?: string) {
    if (id) {
      const line = this.lines.get(id);
      if (line) {
        this.scene.remove(line);
        this.lines.delete(id);
      }
    } else {
      for (const id of this.lines.keys()) {
        const line = this.lines.get(id);
        this.scene.remove(line);
        this.lines.delete(id);
      }
    }
  }
}