import { _decorator, Component, instantiate, Node, NodePool, Prefab, Sprite, SpriteFrame, v3, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PoolManager')
export class PoolManager extends Component {
  @property({type: Prefab, displayName: '高亮预制体'})
  highLightPrefab: Prefab = null;



  static ins: PoolManager = null;
  private highLightPool: NodePool = null;
  protected onLoad(): void {
    PoolManager.ins = this;
    this.initPool();
  }

  private initPool() {
    this.highLightPool = new NodePool('highLight');
  }

  public getHighLight() {
    const size = this.highLightPool.size();
    if(size <= 0) {
      const node = instantiate(this.highLightPrefab);
      this.highLightPool.put(node);
    }
    return this.highLightPool.get();
  }

  public putHighLight(node: Node) {
    this.highLightPool.put(node);
  }


}


