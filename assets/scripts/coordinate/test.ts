import { _decorator, Component, EventTouch, Node, UI, UITransform, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test')
export class test extends Component {
    @property({type: Node, displayName: 'sprite'})
    spNode: Node = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchEnd(e: EventTouch) {
        const pos = e.getLocation();
        const UIPos = e.getUILocation();
        const worldPos = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(pos.x, pos.y, 0));
        console.log('Pos', pos);
        console.log('worldPos', worldPos);
        console.log('UIPos', UIPos);
        // this.spNode.setWorldPosition(v3(UIPos.x, UIPos.y, 0));
    }


}


