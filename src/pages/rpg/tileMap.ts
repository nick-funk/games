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

    const geometry = this.createGeometry();

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

  private createGeometry(width = 12, height = 11, tileSizePx = 16) {
    const geometry = new InstancedBufferGeometry();

    const tileVertSize = 0.25;
    const vertices = new Float32Array([
      -tileVertSize,
      -tileVertSize,
      0.0, // v0
      tileVertSize,
      -tileVertSize,
      0.0, // v1
      tileVertSize,
      tileVertSize,
      0.0, // v2
      -tileVertSize,
      tileVertSize,
      0.0, // v3
    ]);

    const indices: number[] = [0, 1, 2, 2, 3, 0];
    const uvs = new Float32Array([
      ...this.computeUvs(width, height, tileSizePx),
    ]);

    const offsets = new Float32Array([0.0, 0.0, 0.0, 1.0, 0.0, 0.0]);
    const uvOffsets = new Float32Array([
      ...this.computeUVOffset(15, width, height, tileSizePx),
      ...this.computeUVOffset(119, width, height, tileSizePx),
    ])

    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    geometry.setAttribute("aUv", new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("aOffset", new InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aUvOffset", new InstancedBufferAttribute(uvOffsets, 2))

    return geometry;
  }

  private computeUVOffset(tileNum: number, width: number, height: number, tileSizePx: number) {
    const imageWidth = width * tileSizePx;
    const imageHeight = height * tileSizePx;

    const tX = tileNum % width;
    const tY = Math.floor((tileNum - tX) / width);

    const x = tX;
    const y = height - tY - 1;

    const pX = x * tileSizePx;
    const pY = y * tileSizePx;

    const uvX = pX / imageWidth;
    const uvY = pY / imageHeight;

    const offset = [
      uvX,
      uvY
    ];

    return offset;
  }

  private computeUvs(width: number, height: number, tileSizePx: number) {
    const imageWidth = width * tileSizePx;
    const imageHeight = height * tileSizePx;

    const tileSizeX = tileSizePx / imageWidth;
    const tileSizeY = tileSizePx / imageHeight;
    const uvs = [
      0,
      0,
      tileSizeX,
      0,
      tileSizeX,
      tileSizeY,
      0,
      tileSizeY,
    ];

    return uvs;
  }

  public addToScene(scene: Scene) {
    scene.add(this.mesh);
  }
}
