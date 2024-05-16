import { _decorator, Component, instantiate, Node, Prefab, Sprite, SpriteFrame, TiledMap, v2, v3, Vec2 } from 'cc';
import { TileManager } from './TileManager';
const { ccclass, property } = _decorator;

@ccclass('ObjControl')
export class ObjControl extends Component {
  @property({type: Prefab, displayName: '对象层精灵预制体'})
  tileObj: Prefab = null; 

  @property({type: TiledMap, displayName: 'tileMap'})
  tileMap: TiledMap = null;

  @property({type: Node, displayName: '对象层节点'})
  objLayer: Node = null;

  @property({type: SpriteFrame, displayName: '精灵数组'})
  spfArr: SpriteFrame[] = [];

  public static ins: ObjControl = null;

  public movingObj: Node = null;

  protected onLoad(): void {
    ObjControl.ins = this;
  }

  // 初始化时在tileMap坐标系(width/2, height/2)处生成
  public initTileObj(idx: number, location?: Vec2, from?: Node) {
    const obj = instantiate(this.tileObj);
    obj.getComponentInChildren(Sprite).spriteFrame = this.spfArr[idx];
    this.movingObj = obj;

    const {width, height} = this.tileMap.getMapSize();
    const pos = TileManager.ins.tileToScreen(v2(Math.floor((width-1)/2), Math.floor((height-1)/2)));
    this.moveTo(pos);
    obj.setParent(this.objLayer);
  }

  public test(idx: number, parent: Node, tilePos: Vec2) {
    const obj = instantiate(this.tileObj);
    obj.getComponentInChildren(Sprite).spriteFrame = this.spfArr[idx];
    const {width, height} = this.tileMap.getMapSize();
    const pos = TileManager.ins.tileToScreen(tilePos);
    obj.setWorldPosition(v3(pos.x, pos.y, 0));
    obj.setParent(parent);
  }

  public moveTo(pos: Vec2) {
    if(!this.movingObj) return;
    this.movingObj.setPosition(v3(pos.x, pos.y, 0));
  }

  public transUIPosToTilePos(pos: Vec2) {
    
  }
}


