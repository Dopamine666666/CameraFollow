import { _decorator, Camera, Component, Event, EventMouse, EventTouch, math, misc, Node, NodeEventType, size, Touch, UITransform, v2, v3, Vec2, Vec3, view } from 'cc';
import { TileManager } from './TileManager';
import { ObjControl } from './ObjControl';
const { ccclass, property } = _decorator;

@ccclass('MapControl')
export class MapControl extends Component {
  @property({type: Camera, displayName: 'tileMap摄像机'})
  mapCamera: Camera = null;

  @property({type: Node, displayName: 'tileMap'})
  tileMap: Node = null;

  @property({type: Number, displayName: '缩放最小比例'})
  minRatio: number = 0.5;

  @property({type: Number, displayName: '缩放最大比例'})
  maxRatio: number = 2;

  // @property({type: Number, displayName: '双指缩放速率', max: 10, min: 0.01})
  // fingerScalingRate: number = 0;

  @property({type: Number, displayName: '鼠标缩放速率'})
  mouseScalingRate: number = 10000;

  // @property({type: Number, displayName: '缩放锚点修正速率'})
  // scalingReviseRate: number = 0;

  @property({type: Number, displayName: '触摸误差'})
  moveDelta: number = 5;
  private isMoving: boolean = false;
  private beginPos: Vec3 = new Vec3();
  static ins: MapControl = null;
  protected onLoad(): void {
    MapControl.ins = this;
    this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(NodeEventType.MOUSE_WHEEL, this.onMouseWheel, this);
  };

  private onTouchStart(e: EventTouch) {
    const touches = e.getAllTouches();
    if(touches.length == 1) {
      this.beginPos = this.mapCamera.node.position;
      

    }
    else if(touches.length == 2) {

    }
  }

  private onTouchMove(e: EventTouch) {
    if(ObjControl.ins.isMoving) return;
    let touches = e.getAllTouches();
    if(touches.length == 1) {
      const delta = this.getDelta(e.touch);
      if(this.isMoving || touches[0].getDelta().length() > this.moveDelta) {
        this.isMoving = true;
        const zoomRatio = this.getCameraZoonRatio();
        this.beginPos = this.beginPos.subtract(v3(delta.x, delta.y, 0).divide3f(zoomRatio, zoomRatio, zoomRatio));
        this.beginPos = this.dealCameraLimit(this.beginPos, zoomRatio);
        this.mapCamera.node.setPosition(this.beginPos);
      }
    }
    else if(touches.length == 2) {
      this.isMoving = true;
      const touch0 = touches[0];
      const touch1 = touches[1];

      const delta0 = touch0.getDelta();
      const delta1 = touch1.getDelta();

      const touchPoint0 = touch0.getUILocation();
      const touchPoint1 = touch1.getUILocation();

      const zoomRatio = this.getCameraZoonRatio();
      const distance = touchPoint0.subtract(touchPoint1);
      const delta = delta0.subtract(delta1);

      let targetScale: number;
      // 根据水平或垂直分量大小确定目标缩放比（对应分量上的缩放比）
      if(Math.abs(distance.x) > Math.abs(distance.y)) {
        targetScale = (distance.x + delta.x) / distance.x * zoomRatio;
      }else {
        targetScale = (distance.y + delta.y) / distance.y * zoomRatio;
      }

      // 使用第一根手指作为缩放锚点
      let location = e.getUIStartLocation();
      const realPos: Vec3 = this.mapCamera.screenToWorld(v3(location.x, location.y, 0));
      const targetPos = this.mapCamera.node.parent.getComponent(UITransform).convertToNodeSpaceAR(realPos);
      this.smooth(targetPos, targetScale);
    }
  }

  private onMouseWheel(e: EventMouse) {
    const scale = this.getCameraZoonRatio() - e.getScrollY() / this.mouseScalingRate * -1;
    // const location = e.getUILocation();
    const location = e.getLocation();
    const realPos: Vec3 = this.mapCamera.screenToWorld(v3(location.x, location.y, 0));
    const targetPos = this.mapCamera.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(realPos.x, realPos.y, 0));
    // const targetPos = this.mapCamera.node.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    this.smooth(targetPos, scale);
  }

  private smooth(targetPos: Vec3, targetScale: number) {
    if(targetScale > this.maxRatio || targetScale < this.minRatio) return;
    let uiTouchPos: Vec3 = targetPos.clone().subtract(this.mapCamera.node.position.clone()).multiplyScalar(this.getCameraZoonRatio());
    let mapPos: Vec3 = targetPos.clone().subtract(uiTouchPos.divide3f(targetScale, targetScale, targetScale));
    mapPos = this.dealCameraLimit(mapPos, targetScale);
    this.setCameraZoonRatio(targetScale);
    this.mapCamera.node.position = mapPos;
  }

  private getDelta(touch: Touch) {
    const UITrans = this.node.getComponent(UITransform);
    if(UITrans) {
      let cur = touch.getUILocation();
      let prev = touch.getUIPreviousLocation();
      const cur_node = UITrans.convertToNodeSpaceAR(v3(cur.x, cur.y));
      const prev_node = UITrans.convertToNodeSpaceAR(v3(prev.x, prev.y));

      const delta = cur_node.subtract(prev_node);
      return delta;
    }
  }

  private dealCameraLimit(targetPos: Vec3, zoomRatio: number) {
    const {width, height} = this.tileMap.getComponent(UITransform);
    const size = view.getVisibleSize();

    const maxX = (width - size.width / zoomRatio)/2;
    const maxY = (height - size.height / zoomRatio)/2;

    targetPos.x = misc.clampf(targetPos.x, -maxX, maxX);
    targetPos.y = misc.clampf(targetPos.y, -maxY, maxY);

    return targetPos;
  }

  public getCameraZoonRatio() {
    return view.getVisibleSize().height * 0.5 / this.mapCamera.orthoHeight;
  }

  private setCameraZoonRatio(val: number) {
    this.mapCamera.orthoHeight = view.getVisibleSize().height * 0.5 / val;
  }

  protected onDestroy(): void {
    this.node.off(NodeEventType.TOUCH_START, this.onTouchStart);
    this.node.off(NodeEventType.TOUCH_MOVE, this.onTouchMove);
    this.node.off(NodeEventType.MOUSE_WHEEL, this.onMouseWheel);
  }
}


