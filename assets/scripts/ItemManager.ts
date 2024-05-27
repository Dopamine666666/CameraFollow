import { _decorator, Component, EventTouch, Node, NodeEventType, SpriteFrame, Vec2 } from 'cc';
import { ObjControl } from './ObjControl';
import { Data } from './UserData';
const { ccclass, property } = _decorator;

@ccclass('ItemManager')
export class ItemManager extends Component {
  protected onLoad(): void {
    this.bindItemEvent();
  };

  private bindItemEvent() {
    this.node.getChildByName('btn').children.forEach((child, idx) => {
      child.on(NodeEventType.TOUCH_START, (e: EventTouch) => this.onTouchItemStart(child, idx, e), this);
    });
  };

  private onTouchItemStart(node: Node, idx: number, e: EventTouch) {
    let ctrl = ObjControl.ins;
    if(ctrl.movingObj) {
      console.log('操作中，无法生成');
      return;
    }
    if(Data.getTile(idx.toString())) {
      console.log('已放置，无法生成');
      return;
    }
    ctrl.createTileObj(idx);
  };
}


