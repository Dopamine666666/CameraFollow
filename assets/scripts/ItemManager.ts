import { _decorator, Component, EventTouch, Node, NodeEventType, SpriteFrame, Vec2 } from 'cc';
import { ObjControl } from './ObjControl';
const { ccclass, property } = _decorator;

@ccclass('ItemManager')
export class ItemManager extends Component {
  protected onLoad(): void {
    this.bindItemEvent();
  }

  private bindItemEvent() {
    this.node.getChildByName('item').children.forEach((child, idx) => {
      child.on(NodeEventType.TOUCH_START, (e: EventTouch) => this.onTouchItemStart(child, idx, e), this);
    });
    this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
  }

  private curItemIdx: number = -1;
  private onDragDelay: number = 100; //unit ms
  private beginTimer: number = -1;
  private startPos: Vec2 | null = null;
  private movePos: Vec2 | null = null;
  private canDrag: boolean = false;

  private onTouchItemStart(node: Node, idx: number, e: EventTouch) {
    console.log('touch item');
    // e.preventSwallow = true;
    this.curItemIdx = idx;
    this.startPos = e.getUILocation();
    this.beginTimer = Date.now();
  }

  private onTouchMove(e: EventTouch) {
    // e.preventSwallow = true;
    e.propagationStopped = false;
    if(!this.startPos) return;
    this.movePos = e.getUILocation();
    if(!this.canDrag) {
      if(Vec2.distance(this.startPos, this.movePos) > 10) {
        this.startPos = this.movePos = null;
      }
    }else {
      ObjControl.ins.moveObj(this.movePos);
    }
    
  }

  private onTouchEnd(e: EventTouch) {
    console.log('end item');
    // e.preventSwallow = true;
    e.propagationStopped = false;
    this.startPos = this.movePos = null;
    this.canDrag = false;
  }

  protected update(dt: number): void {
    this.calculateDragDelay(dt);
  }

  private calculateDragDelay(dt: number) {
    if(!this.startPos) return;
    const now = Date.now();
    if(now - this.beginTimer > this.onDragDelay) {
      this.canDrag = true;
      // 在当前位置this.movePos生成拖拽物体
      ObjControl.ins.initTileObj(this.curItemIdx, this.movePos);
    }
  }
}


