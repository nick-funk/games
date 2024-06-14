import {
  Mesh,
  Scene,
  ShaderMaterial,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Vector3,
  Vector2,
} from "three";
import { TextureLibrary } from "./textures/textures";
import { BODY_TYPES, Body, Box, Sphere, Vec3, World } from "cannon-es";
import { CollisionGroup } from "./collision";
import { Agent } from "./agent";
import { clamp } from "./math";
import { PathDebugger } from "./pathDebugger";
import { Grid, manhattan, search } from "nf-pathfinder";

const vertexShader = `
  precision highp float;

  attribute vec2 aUv;
  attribute vec3 aOffset;
  attribute vec2 aUvOffset;

  varying vec2 vUv;
  varying vec2 vUvOffset;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position + aOffset, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vUv = aUv;
    vUvOffset = aUvOffset;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D diffuseTexture;

  varying vec2 vUv;
  varying vec2 vUvOffset;

  void main() {
    gl_FragColor = texture2D(diffuseTexture, vUv + vUvOffset);
  }
`;

interface TileMapLayer {
  z: number;
  map: number[][];
}

interface TileMapPoI {
  name: string;
  x: number;
  y: number;
}

interface TileMapDefinition {
  texture: string;
  layers: TileMapLayer[];
  walk: number[][];
  poi: TileMapPoI[];

  tileVertSize: number;
  tileVertGap: number;
  tilesetWidth: number;
  tilesetHeight: number;
  tileSizePx: number;
  gapSizePx: number;
}

export class TileMap {
  private definition: TileMapDefinition;

  private layerMeshes: Mesh[];
  private bodies: Body[];
  private tilesetWidth: number;
  private tilesetHeight: number;
  private tileVertSize: number;
  private tileVertGap: number;
  private tileSizePx: number;
  private gapSizePx: number;
  private poi: TileMapPoI[];

  public readonly walkSize: Vector2;

  constructor(definition: TileMapDefinition) {
    this.definition = definition;

    this.tileVertSize = definition.tileVertSize;
    this.tileVertGap = definition.tileVertGap;
    this.tilesetWidth = definition.tilesetWidth;
    this.tilesetHeight = definition.tilesetHeight;
    this.tileSizePx = definition.tileSizePx;
    this.gapSizePx = definition.gapSizePx;
    this.poi = definition.poi;

    this.walkSize = this.computeWalkSize(definition.walk);

    this.layerMeshes = [];
  }

  private computeWalkSize(walk?: number[][]) {
    if (!walk) {
      return new Vector2(0, 0);
    }

    if (walk.length === 0) {
      return new Vector2(0, 0);
    }

    return new Vector2(walk[0].length, walk.length);
  }

  get walk(): number[][] {
    return this.definition.walk;
  }

  public async init(textures: TextureLibrary) {
    const texture = await textures.load(this.definition.texture);

    const uniforms = {
      diffuseTexture: {
        value: texture,
      },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    for (const layer of this.definition.layers) {
      const geometry = this.createGeometry(
        layer.map,
        layer.z,
        this.tilesetWidth,
        this.tilesetHeight,
        texture.image.width,
        texture.image.height,
        this.tileSizePx,
        this.tileVertSize,
        this.gapSizePx,
        this.tileVertGap
      );

      const mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      this.layerMeshes.push(mesh);
    }

    this.bodies = this.computeBodies(
      this.definition.walk,
      this.tileVertSize,
      this.tileVertGap
    );
  }

  public addToScene(scene: Scene, world: World) {
    for (const mesh of this.layerMeshes) {
      scene.add(mesh);
    }

    for (const body of this.bodies) {
      world.addBody(body);
    }
  }

  private createGeometry(
    tileMap: number[][],
    z: number,
    width: number,
    height: number,
    textureWidthPx: number,
    textureHeightPx: number,
    tileSizePx = 16,
    tileVertSize = 0.1,
    gapSizePx = 1,
    tileVertGap = 0
  ) {
    const geometry = new InstancedBufferGeometry();

    const halfTileVertSize = tileVertSize / 2;
    const vertices = new Float32Array([
      -halfTileVertSize,
      -halfTileVertSize,
      z, // v0
      halfTileVertSize,
      -halfTileVertSize,
      z, // v1
      halfTileVertSize,
      halfTileVertSize,
      z, // v2
      -halfTileVertSize,
      halfTileVertSize,
      z, // v3
    ]);

    const indices: number[] = [0, 1, 2, 2, 3, 0];
    const uvs = new Float32Array([
      ...this.computeUvs(
        width,
        height,
        textureWidthPx,
        textureHeightPx,
        tileSizePx
      ),
    ]);

    const { offsets, uvOffsets } = this.computeTiles(
      tileMap,
      tileVertSize,
      tileVertGap,
      width,
      height,
      textureWidthPx,
      textureHeightPx,
      tileSizePx,
      gapSizePx
    );

    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    geometry.setAttribute("aUv", new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("aOffset", new InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute(
      "aUvOffset",
      new InstancedBufferAttribute(uvOffsets, 2)
    );

    return geometry;
  }

  private computeBodies(
    walkMap: number[][],
    tileVertSize: number,
    tileVertGap: number
  ) {
    const bodies: Body[] = [];

    for (let j = 0; j < walkMap.length; j++) {
      for (let i = 0; i < walkMap[j].length; i++) {
        const value = walkMap[j][i];
        if (value !== 0) {
          continue;
        }

        const x = i * (tileVertSize + tileVertGap);
        const y = -j * (tileVertSize + tileVertGap);

        const body = new Body({
          mass: 1,
          shape: new Sphere(tileVertSize / 2),
          type: BODY_TYPES.STATIC,
          angularFactor: new Vec3(0, 0, 0),
          linearFactor: new Vec3(0, 0, 0),
          collisionFilterGroup: CollisionGroup.Default,
          collisionFilterMask: CollisionGroup.Default,
        });

        body.position.set(x, y, 0);
        bodies.push(body);
      }
    }

    return bodies;
  }

  private computeTiles(
    tileMap: number[][],
    tileVertSize: number,
    tileVertGap: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    tileSizePx: number,
    gapSizePx: number
  ) {
    const offsets: number[] = [];
    const uvOffsets: number[] = [];

    for (let j = 0; j < tileMap.length; j++) {
      for (let i = 0; i < tileMap[j].length; i++) {
        const tileNum = tileMap[j][i];
        if (tileNum < 0) {
          continue;
        }

        const x = i * (tileVertSize + tileVertGap);
        const y = -j * (tileVertSize + tileVertGap);

        offsets.push(x);
        offsets.push(y);
        offsets.push(0.0);

        uvOffsets.push(
          ...this.computeUVOffset(
            tileNum,
            width,
            height,
            imageWidth,
            imageHeight,
            tileSizePx,
            gapSizePx
          )
        );
      }
    }

    return {
      offsets: new Float32Array(offsets),
      uvOffsets: new Float32Array(uvOffsets),
    };
  }

  private computeUVOffset(
    tileNum: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    tileSizePx: number,
    gapSizePx: number
  ) {
    const tX = tileNum % width;
    const tY = Math.floor((tileNum - tX) / width);

    const x = tX;
    const y = height - tY - 1;

    const pX = x * tileSizePx + x * gapSizePx;
    const pY = y * tileSizePx + y * gapSizePx;

    const uvX = pX / imageWidth;
    const uvY = pY / imageHeight;

    const offset = [uvX, uvY];

    return offset;
  }

  private computeUvs(
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number,
    tileSizePx: number,
    gapSizePx: number = 1
  ) {
    const gapX = gapSizePx / imageWidth / 2;
    const gapY = gapSizePx / imageHeight / 2;

    const tileSizeX = tileSizePx / imageWidth - gapX;
    const tileSizeY = tileSizePx / imageHeight - gapY;
    const uvs = [
      gapX,
      gapY,
      tileSizeX,
      gapY,
      tileSizeX,
      tileSizeY,
      gapX,
      tileSizeY,
    ];

    return uvs;
  }

  public tilePosToVec(xTile: number, yTile: number) {
    const scalar = this.tileVertSize + this.tileVertGap;

    return new Vector3(xTile * scalar, -yTile * scalar, 0.0);
  }

  public worldPosToTilePos(position: Vector3) {
    const relPos = position.clone().sub(this.layerMeshes[0].position.clone());
    const x = Math.floor(relPos.x / this.tileVertSize);
    const y = Math.floor(relPos.y / this.tileVertSize);

    const cX = clamp(x, 0, this.tilesetWidth - 1);
    const cY = clamp(-y, 0, this.tilesetHeight - 1);

    return new Vector2(cX, cY);
  }

  public moveTo(agent: Agent, name: string) {
    const poi = this.poi.find((p) => p.name === name);
    if (!poi) {
      return;
    }

    const p = this.tilePosToVec(poi.x, poi.y);
    agent.position = new Vector3(
      p.x + agent.size.x / 2,
      p.y - agent.size.y / 2,
      p.z
    );
  }

  public computePath(
    startWorldPos: Vector3,
    endWorldPos: Vector3,
    pathDebugger?: PathDebugger,
    debugID?: string,
  ) {
    const start = this.worldPosToTilePos(startWorldPos);
    const end = this.worldPosToTilePos(endWorldPos);

    const sX = clamp(start.x, 0, this.walkSize.x - 1);
    const sY = clamp(start.y, 0, this.walkSize.y - 1);
    const eX = clamp(end.x, 0, this.walkSize.x - 1);
    const eY = clamp(end.y, 0, this.walkSize.y - 1);

    const graph = new Grid(this.walk, { diagonal: false });

    const gridStart = graph.grid[sY][sX];
    const gridEnd = graph.grid[eY][eX];

    const nodes = search(graph, gridStart, gridEnd, {
      closest: true,
      heuristic: manhattan,
    });

    pathDebugger?.debugPath(debugID ?? "", nodes, this);

    return nodes;
  }
}
