import {
  Mesh,
  Scene,
  ShaderMaterial,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
} from "three";
import { TextureLibrary } from "./textures/textures";
import { BODY_TYPES, Body, Box, Vec3, World } from "cannon-es";
import { CollisionGroup } from "./collision";

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

interface TileMapDefinition {
  texture: string;
  layers: TileMapLayer[];
  walk: number[][];
}

export class TileMap {
  private definition: TileMapDefinition;

  private layerMeshes: Mesh[];
  private bodies: Body[];

  constructor(definition: TileMapDefinition) {
    this.definition = definition;

    this.layerMeshes = [];
  }

  public async init(textures: TextureLibrary) {
    const texture = await textures.load(this.definition.texture);

    const tileSizePx = 16;
    const tileVertSize = 0.2;
    const tilesetWidth = 12;
    const tilesetHeight = 11;
    const gapSizePx = 1;
    const tileVertGap = 0;

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
        tilesetWidth,
        tilesetHeight,
        texture.image.width,
        texture.image.height,
        tileSizePx,
        tileVertSize,
        gapSizePx,
        tileVertGap,
      );

      const mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.layerMeshes.push(mesh);
    }

    this.bodies = this.computeBodies(this.definition.walk, tileVertSize, tileVertGap);
  }

  public addToScene(scene: Scene, world: World) {
    for (const mesh of this.layerMeshes) {
      scene.add(mesh);
    }

    console.log(this.bodies);

    for (const body of this.bodies) {
      world.addBody(body);
    }
  }

  private createGeometry(
    tileMap: number[][],
    z: number,
    width,
    height,
    imageWidth: number,
    imageHeight: number,
    tileSizePx = 16,
    tileVertSize = 0.1,
    gapSizePx = 1,
    tileVertGap = 0,
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
      ...this.computeUvs(width, height, imageWidth, imageHeight, tileSizePx),
    ]);

    const { offsets, uvOffsets } = this.computeTiles(
      tileMap,
      tileVertSize,
      tileVertGap,
      width,
      height,
      imageWidth,
      imageHeight,
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
    tileVertGap: number,
  ) {
    const bodies: Body[] = [];

    console.log(walkMap);

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
          shape: new Box(new Vec3(tileVertSize / 2, tileVertSize / 2, tileVertSize / 2)),
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
    gapSizePx: number,
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

    const tileSizeX = (tileSizePx / imageWidth) - gapX;
    const tileSizeY = (tileSizePx / imageHeight) - gapY;
    const uvs = [gapX, gapY, tileSizeX, gapY, tileSizeX, tileSizeY, gapX, tileSizeY];

    return uvs;
  }
}
