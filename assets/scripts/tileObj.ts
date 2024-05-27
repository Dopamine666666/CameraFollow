import { _decorator, Component, EventTouch, Node, NodeEventType } from 'cc';
import { ObjControl } from './ObjControl';
import { HitTest } from './HitTest';
const { ccclass, property } = _decorator;

@ccclass('tileObj')
export class tileObj extends Component {
  public id: string = '';
  public zIndex: number = -1;
  // protected onLoad(): void {
  //   HitTest.ins().enablePixelHitTest(this.node);
  //   this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
  //   console.log('init');
  // }

  // private onTouchStart(e: EventTouch) {
  //   console.log(e.target);
    
  // }

  // public doSelected() {
  //   console.log('selected it');
  // }
}


