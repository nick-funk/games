import {
  TextureLoader,
  Mesh,
  Scene,
  BufferGeometry,
  ShaderMaterial,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
} from "three";

import texture from "../../data/rpg/town-spaced.png";

const vertexShader = `
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
  uniform sampler2D diffuseTexture;

  varying vec2 vUv;
  varying vec2 vUvOffset;

  void main() {
    gl_FragColor = texture2D(diffuseTexture, vUv + vUvOffset);
  }
`;

export class TileMap {
  private mesh: Mesh;

  constructor(loader: TextureLoader) {
    const townTexture = loader.load(texture);

    const tileMap = [
      [0, 1, 2],
      [12, 13, 14],
      [24, 25, 26],
    ];
    const geometry = this.createGeometry(tileMap);

    const uniforms = {
      diffuseTexture: {
        value: townTexture,
      },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    this.mesh = new Mesh(geometry, material);
  }

  private createGeometry(
    tileMap: number[][],
    width = 12,
    height = 11,
    tileSizePx = 16
  ) {
    const geometry = new InstancedBufferGeometry();

    const halfTileVertSize = 0.25;
    const vertices = new Float32Array([
      -halfTileVertSize,
      -halfTileVertSize,
      0.0, // v0
      halfTileVertSize,
      -halfTileVertSize,
      0.0, // v1
      halfTileVertSize,
      halfTileVertSize,
      0.0, // v2
      -halfTileVertSize,
      halfTileVertSize,
      0.0, // v3
    ]);

    const indices: number[] = [0, 1, 2, 2, 3, 0];
    const uvs = new Float32Array([
      ...this.computeUvs(width, height, tileSizePx),
    ]);

    const { offsets, uvOffsets } = this.computeTiles(
      tileMap,
      halfTileVertSize * 2,
      width,
      height,
      tileSizePx
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

  private computeTiles(
    tileMap: number[][],
    tileVertSize: number,
    width: number,
    height: number,
    tileSizePx: number
  ) {
    const offsets: number[] = [];
    const uvOffsets: number[] = [];

    for (let j = 0; j < tileMap.length; j++) {
      for (let i = 0; i < tileMap[j].length; i++) {
        const tileNum = tileMap[j][i];

        const x = i * tileVertSize;
        const y = -j * tileVertSize;

        offsets.push(x);
        offsets.push(y);
        offsets.push(0.0);

        uvOffsets.push(
          ...this.computeUVOffset(tileNum, width, height, tileSizePx)
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
    tileSizePx: number,
    gapSizePx: number = 1,
  ) {
    const imageWidth = width * tileSizePx + gapSizePx * (width - 1);
    const imageHeight = height * tileSizePx + gapSizePx * (height - 1);

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

  private computeUvs(width: number, height: number, tileSizePx: number, gapSizePx: number = 1) {
    const imageWidth = width * tileSizePx + gapSizePx * (width - 1);
    const imageHeight = height * tileSizePx + gapSizePx * (height - 1);

    const tileSizeX = tileSizePx / imageWidth;
    const tileSizeY = tileSizePx / imageHeight;
    const uvs = [0, 0, tileSizeX, 0, tileSizeX, tileSizeY, 0, tileSizeY];

    return uvs;
  }

  public addToScene(scene: Scene) {
    scene.add(this.mesh);
  }
}
