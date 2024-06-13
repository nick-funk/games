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

export class TileMap {
  private mesh: Mesh;

  public async init(loader: TextureLoader) {
    const townTexture = await loader.loadAsync(texture);

    const tileMap = [
      [0, 1, 2],
      [12, 13, 14],
      [24, 25, 26],
      [36, 37, 38],
    ];

    const tileSizePx = 16;
    const tileVertSize = 0.2;
    const tilesetWidth = 12;
    const tilesetHeight = 11;
    const gapSizePx = 1;
    const tileVertGap = 0;

    const geometry = this.createGeometry(
      tileMap,
      tilesetWidth,
      tilesetHeight,
      townTexture.image.width,
      townTexture.image.height,
      tileSizePx,
      tileVertSize,
      gapSizePx,
      tileVertGap,
    );

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

  public addToScene(scene: Scene) {
    scene.add(this.mesh);
  }
}
