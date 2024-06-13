import {
  TextureLoader,
  Mesh,
  Scene,
  ShaderMaterial,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
} from "three";

import townTextureURL from "../../data/rpg/textures/town-spaced.png";

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

interface TileMapDefinition {
  texture: string;
  map: number[][];
  walk: number[][];
}

export class TileMapTextures {
  public readonly textures: Map<string, string>;
  
  private loader: TextureLoader;

  constructor(loader: TextureLoader) {
    this.loader = loader;
    this.textures = new Map<string, string>;

    this.textures.set("town", townTextureURL);
  }

  public async load(key: string) {
    return await this.loader.loadAsync(this.textures.get(key));
  }
}

export class TileMap {
  private mesh: Mesh;
  private textures: TileMapTextures;
  private definition: TileMapDefinition;

  constructor(loader: TextureLoader, definition: TileMapDefinition) {
    this.textures = new TileMapTextures(loader);
    this.definition = definition;
  }

  public async init() {
    const texture = await this.textures.load(this.definition.texture);

    const tileSizePx = 16;
    const tileVertSize = 0.2;
    const tilesetWidth = 12;
    const tilesetHeight = 11;
    const gapSizePx = 1;
    const tileVertGap = 0;

    const geometry = this.createGeometry(
      this.definition.map,
      tilesetWidth,
      tilesetHeight,
      texture.image.width,
      texture.image.height,
      tileSizePx,
      tileVertSize,
      gapSizePx,
      tileVertGap,
    );

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
