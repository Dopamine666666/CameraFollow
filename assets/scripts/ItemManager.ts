import { _decorator, Component, EventTouch, Node, NodeEventType, SpriteFrame, Vec2 } from 'cc';
import { ObjControl } from './ObjControl';
const { ccclass, property } = _decorator;

@ccclass('ItemManager')
export class ItemManager extends Component {
  protected onLoad(): void {
    this.bindItemEvent();
  }

  private bindItemEvent() {
    this.node.getChildByName('btn').children.forEach((child, idx) => {
      child.on(NodeEventType.TOUCH_START, (e: EventTouch) => this.onTouchItemStart(child, idx, e), this);
    });
    // this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
    // this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
  }

  // private curItemIdx: number = -1;
  // private onDragDelay: number = 100; //unit ms
  // private beginTimer: number = -1;
  // private startPos: Vec2 | null = null;
  // private movePos: Vec2 | null = null;
  // private startOffset: Vec2 = new Vec2(5, 5);
  // private canDrag: boolean = false;

  private onTouchItemStart(node: Node, idx: number, e: EventTouch) {
    // this.curItemIdx = idx;
    // this.startPos = e.getUILocation();
    // this.beginTimer = Date.now();
    const ctrl = ObjControl.ins;
    if(ctrl.movingObj) return;
    ctrl.createTileObj(idx);
  }

  // 更改拖拽逻辑，改为点击直接在对应节点生成，触摸移动事件绑定在生成的物体上
  // private onTouchMove(e: EventTouch) {
  //   if(!this.startPos) return;
  //   this.movePos = e.getUILocation();
  //   if(!this.canDrag) {
  //     if(Vec2.distance(this.startPos, this.movePos) > 10) {
  //       console.log('have moved')
  //       this.startPos = this.movePos = null;
  //     }
  //   }else {
  //     ObjControl.ins.moveObj(this.movePos);
  //   }
  // }

  // private onTouchEnd(e: EventTouch) {
  //   this.startPos = this.movePos = null;
  //   this.canDrag = false;
  // }

  // protected update(dt: number): void {
  //   this.calculateDragDelay(dt);
  // }

  // private calculateDragDelay(dt: number) {
  //   if(!this.startPos || this.beginTimer < 0) return;
  //   const now = Date.now();
  //   if(now - this.beginTimer > this.onDragDelay) {
  //     ObjControl.ins.initTileObj(this.curItemIdx, this.movePos ?? this.startPos.add(this.startOffset));
  //     this.canDrag = true;
  //     this.beginTimer = -1;
  //     // 在当前位置this.movePos生成拖拽物
  //   }
  // }
}


