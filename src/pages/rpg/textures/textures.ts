import { TextureLoader } from "three";

// tile maps
import townTextureURL from "../../../data/rpg/textures/town-spaced.png";

// agents
import knightTextureURL from "../../../data/rpg/textures/knight.png";

export class Textures {
  public readonly tileMap: TextureLibrary;
  public readonly agents: TextureLibrary;

  constructor(loader: TextureLoader) {
    this.tileMap = new TileMapTextures(loader);
    this.agents = new AgentTextures(loader);
  }
}

export class TextureLibrary {
  public readonly textures: Map<string, string>;

  private loader: TextureLoader;

  constructor(loader: TextureLoader) {
    this.loader = loader;
    this.textures = new Map<string, string>;
  }

  public async load(key: string) {
    return await this.loader.loadAsync(this.textures.get(key));
  }
}

class TileMapTextures extends TextureLibrary {
  constructor(loader: TextureLoader) {
    super(loader);

    this.textures.set("town", townTextureURL);
  }
}

export class AgentTextures extends TextureLibrary {
  constructor(loader: TextureLoader) {
    super(loader);

    this.textures.set("knight", knightTextureURL);
  }
}

