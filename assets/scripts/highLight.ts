import { _decorator, Component, Node, Sprite, SpriteFrame, v3, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('highLight')
export class highLight extends Component {
  @property({type: SpriteFrame, displayName: '高亮图'})
  highLightSpfArr: SpriteFrame[] = [];

  private x: number = null;
  private y: number = null;

  private unuse() {

  }

  private reuse() {
    
  }

  /** 0可用，1位置冲突 */
  public setHighLightSpf(state: 0 | 1) {
    this.node.getComponentInChildren(Sprite).spriteFrame = this.highLightSpfArr[state];
  }

  public setHighLightPos(pos: Vec2) {
    this.node.setWorldPosition(v3(pos.x, pos.y));
  }

  public updateXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // public checkXY(x: number, y: number) {
  //   if(this.x != x || this.y != y) return false;
  //   return true;
  // } 
}


