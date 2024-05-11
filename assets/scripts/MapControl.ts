import { _decorator, Camera, Component, EventMouse, EventTouch, Node, NodeEventType, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapControl')
export class MapControl extends Component {
  @property({type: Camera, displayName: 'tileMap摄像机'})
  mapCamera: Camera = null;

  @property({type: Number, displayName: '缩放最小比例'})
  minRatio: number = 0;

  @property({type: Number, displayName: '缩放最大比例'})
  maxRatio: number = 0;

  @property({type: Number, displayName: '双指缩放速率', max: 10, min: 0.01})
  fingerScalingRate: number = 0;

  @property({type: Number, displayName: '鼠标缩放速率', max: 10, min: 0.01})
  mouseScalingRate: number = 0;

  @property({type: Number, displayName: '缩放锚点修正速率'})
  scalingReviseRate: number = 0;

  private defHeight: number = 1; // 默认ORTHO高度
  private defPos: Vec3 = new Vec3(); // 默认摄像机位置
  private isMoving: boolean = false;
  // 保存触摸开始坐标
  private startPos_0: Vec2 = new Vec2();
  private startPos_1: Vec2 = new Vec2();
  // 保存点击触摸移动坐标
  private movePos_0: Vec2 = new Vec2();
  private movePos_1: Vec2 = new Vec2();
  private touchDis: number = 0;

  protected onLoad(): void {
    this.defHeight = this.mapCamera.orthoHeight;
    this.defPos = this.mapCamera.node.position;

    this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(NodeEventType.MOUSE_WHEEL, this.onMouseWheel, this)
  }
  
  private onTouchStart(e: EventTouch) {
    const touches = e.getAllTouches();
    if(touches.length == 1) {
      console.log('单指触摸');
    }
    else if(touches.length == 2) {
      console.log('双指触摸');
      this.startPos_0 = touches[0].getLocation();
      this.startPos_1 = touches[1].getLocation();
      this.touchDis = Vec2.distance(this.startPos_0, this.startPos_1);
    }
  }

  private onTouchMove(e: EventTouch) {
    let touches = e.getAllTouches();
    if(touches.length == 1) {
      const delta = e.getDelta();
      this.mapCamera.node.setPosition(this.mapCamera.node.position.subtract(new Vec3(delta.x, delta.y, 0)));
    }
    else if(touches.length == 2) {
      const touchPos_0 = touches[0].getLocation();
      const touchPos_1 = touches[1].getLocation();
      const newTouchDis = Vec2.distance(touchPos_0, touchPos_1);
      if(newTouchDis > this.touchDis) {
        // 放大
        if((this.defHeight / this.mapCamera.orthoHeight) > this.maxRatio) return;
        this.touchDis = newTouchDis;
        this.mapCamera.orthoHeight *= 1 - this.fingerScalingRate;

        // const centerPos = touchPos_0.add(touchPos_1).divide(v2(2, 2));
        // this.mapCamera.node.setPosition(this.mapCamera.node.position.subtract(v3(centerPos.x, centerPos.y, 0)).divide(v3(this.scalingReviseRate, this.scalingReviseRate, 0)));
      }else {
        // 缩小
        if((this.defHeight / this.mapCamera.orthoHeight) < this.minRatio) return;
        this.touchDis = newTouchDis;
        this.mapCamera.orthoHeight *= 1 + this.fingerScalingRate;

        // const centerPos = touchPos_0.add(touchPos_1).divide(v2(2, 2));
        // this.mapCamera.node.setPosition(this.mapCamera.node.position.subtract(v3(centerPos.x, centerPos.y, 0)).divide(v3(this.scalingReviseRate, this.scalingReviseRate, 0)));
      }
    }
  }

  private onMouseWheel(e: EventMouse) {
    const delta = e.getScrollY();
    if(delta > 0) {
      this.mapCamera.orthoHeight *= 1 - this.mouseScalingRate;
    }else {
      this.mapCamera.orthoHeight *= 1 + this.mouseScalingRate;
    }
  }
}


