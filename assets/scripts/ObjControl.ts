import { _decorator, Camera, Component, EventTouch, instantiate, Node, NodeEventType, Prefab, Sprite, SpriteFrame, TiledMap, Touch, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { TileManager } from './TileManager';
import { tileObj } from './tileObj';
import { MapControl } from './MapControl';
const { ccclass, property } = _decorator;

@ccclass('ObjControl')
export class ObjControl extends Component {
  @property({type: Prefab, displayName: '对象层精灵预制体'})
  tileObj: Prefab = null; 

  @property({type: TiledMap, displayName: 'tileMap'})
  tileMap: TiledMap = null;

  @property({type: Camera})
  mapCamera: Camera = null;

  @property({type: Node, displayName: '对象层节点'})
  objLayer: Node = null;

  @property({type: SpriteFrame, displayName: '精灵数组'})
  spfArr: SpriteFrame[] = [];

  @property({type: Number, displayName: '触摸误差'})
  deltaDis: number = 1;

  @property({type: Number, displayName: '长按选中时间(unit: ms)'})
  selectedTimer: number = 25;


  public static ins: ObjControl = null;
  public canEdit: boolean = false;
  public movingObj: Node = null;

  private startTimer: number = -1;

  protected onLoad(): void {
    ObjControl.ins = this;
    this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
  }

  public isMoving: boolean = false;
  private contains: Node[] = [];
  private onTouchStart(e: EventTouch) {
    const pos = e.getLocation();
    const world = this.mapCamera.screenToWorld(v3(pos.x, pos.y));
    this.contains = this.objLayer.children.filter(child => child.getComponent(UITransform).getBoundingBoxToWorld().contains(v2(world.x, world.y)));
    console.log('contains', this.contains);
    // 根据tileMap上坐标确定点击优先级，继续长安选择下一优先级，暂取第一个
    // if(this.movingObj == null || this.movingObj != this.contains[0]) {
    //   this.startTimer = Date.now();
    //   console.log('haha');
    // }
    if(this.movingObj == null) {
      this.startTimer = Date.now();
    }
  }

  private onTouchEnd(e: EventTouch) {
    this.startTimer = -1;
    this.isMoving = false;
  }

  private onTouchMove(e: EventTouch) {
    if(!this.movingObj) {
      return;
    }
    const pos = e.getLocation();
    const world_v3 = this.mapCamera.screenToWorld(v3(pos.x, pos.y));
    if(this.movingObj.getComponent(UITransform).getBoundingBoxToWorld().contains(v2(world_v3.x, world_v3.y))) {
      const delta = this.getDelta(e.touch);
      console.log(delta.length() > this.deltaDis);
      if(this.isMoving || delta.length() > this.deltaDis) {
        this.isMoving = true;
        const zoomRatio = MapControl.ins.getCameraZoonRatio();
        let newPos = this.movingObj.getPosition();
        newPos = newPos.add(v3(delta.x, delta.y).divide3f(zoomRatio, zoomRatio, zoomRatio));
        this.moveTo(v2(newPos.x, newPos.y), false);
      }
    }
  }

  // 初始化时在tileMap坐标系(width/2, height/2)处生成 
  public createTileObj(idx: number, location?: Vec2, from?: Node) {
    const obj = instantiate(this.tileObj);
    obj.getComponentInChildren(Sprite).spriteFrame = this.spfArr[idx];
    // this.movingObj = obj;

    const {width, height} = this.tileMap.getMapSize();
    // const pos = TileManager.ins.tileToWorld(v2(0, 0));
    obj.setParent(this.objLayer);
    this.moveTo(location);
    
  }

  public moveTo(pos: Vec2, isWorld: boolean = true) {
    if(!this.movingObj) return;
    if(isWorld) {
      this.movingObj.setWorldPosition(v3(pos.x, pos.y, 0));
    }else {
      this.movingObj.setPosition(v3(pos.x, pos.y, 0));
    }
  }

  private getDelta(touch: Touch) {
    const UITrans = this.node.getComponent(UITransform);
    if (UITrans) {
      let cur = touch.getUILocation();
      let prev = touch.getUIPreviousLocation();
      const cur_node = UITrans.convertToNodeSpaceAR(v3(cur.x, cur.y));
      const prev_node = UITrans.convertToNodeSpaceAR(v3(prev.x, prev.y));

      const delta = cur_node.subtract(prev_node);
      return delta;
    }
  }

  protected update(dt: number): void {
      if(this.startTimer < 0) return;
      const now = Date.now();
      if(now - this.startTimer >= this.selectedTimer) {
        this.movingObj = this.contains[0];
        this.movingObj.getComponent(tileObj).doSelected();
      }
  }
}


