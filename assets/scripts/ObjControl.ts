import { _decorator, Component, instantiate, Node, Prefab, Sprite, SpriteFrame, v3, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjControl')
export class ObjControl extends Component {
  @property({type: Prefab, displayName: '对象层精灵预制体'})
  tileObj: Prefab = null; 

  @property({type: Node, displayName: '对象层节点'})
  objLayer: Node = null;

  @property({type: SpriteFrame, displayName: '精灵数组'})
  spfArr: SpriteFrame[] = [];

  public static ins: ObjControl = null;

  private movingObj: Node = null;

  protected onLoad(): void {
    ObjControl.ins = this;
  }

  public initTileObj(idx: number, pos: Vec2) {
    const obj = instantiate(this.tileObj);
    obj.getComponentInChildren(Sprite).spriteFrame = this.spfArr[idx];
    this.movingObj = obj;
    this.moveObj(pos);
    obj.setParent(this.objLayer);
  }

  public moveObj(pos: Vec2) {
    if(!this.movingObj) return;
    this.movingObj.setPosition(v3(pos.x, pos.y, 0));
  }
}


