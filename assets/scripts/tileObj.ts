import { _decorator, Component, EventTouch, Node, NodeEventType } from 'cc';
import { ObjControl } from './ObjControl';
const { ccclass, property } = _decorator;

@ccclass('tileObj')
export class tileObj extends Component {
  public id: string = '';

  protected onLoad(): void {

  }

  public doSelected() {
    console.log('selected it');
  }
}


