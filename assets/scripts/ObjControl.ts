import { _decorator, Button, Camera, Component, EventTouch, instantiate, Node, NodeEventType, Prefab, Sprite, SpriteFrame, TiledMap, Touch, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { TileManager } from './TileManager';
import { tileObj } from './tileObj';
import { MapControl } from './MapControl';
import { Data } from './UserData';
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

  @property({type: Number, displayName: '取消选中误差'})
  cancelDis: number = 200;

  @property({type: Number, displayName: '长按选中时间(unit: ms)'})
  selectedTimer: number = 700;

  @property({type: Node, displayName: 'tileObj管理节点'})
  objManager: Node = null;

  // @property({type: Button, displayName: '确认按钮'})
  // confirmBtn: Button = null;

  // @property({type: Button, displayName: '取消按钮'})
  // cancelBtn: Button = null;

  public static ins: ObjControl = null;
  public canEdit: boolean = false;
  public movingObj: Node | null = null;
  public movingId: string = '';
  private movingPos: {x: number, y: number} | null = null;

  private startTimer: number = -1;

  protected onLoad(): void {
    ObjControl.ins = this;
    this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
  }

  public isMoving: boolean = false;
  private contains: Node[] = [];
  // private curObjPos: Vec2 = v2();
  private startPos: Vec2 = null; //world
  private touchOffset: Vec2 = v2(); //world
  private onTouchStart(e: EventTouch) {
    const pos = e.getLocation();
    const world_v3 = this.mapCamera.screenToWorld(v3(pos.x, pos.y));
    const world_v2 = v2(world_v3.x, world_v3.y);
    if(this.movingObj == null) {
      this.contains = this.objLayer.children.filter(child => child.getComponent(UITransform).getBoundingBoxToWorld().contains(world_v2));
      if(this.contains.length) {
        console.log('contains', this.contains);
        this.startTimer = Date.now();
        this.startPos = world_v2;
      }
    }
    if(this.movingObj != null && this.movingObj.getComponent(UITransform).getBoundingBoxToWorld().contains(world_v2)) {
      this.isMoving = true;
      this.touchOffset = this.getTouchOffset(world_v2);
    }
    // 根据tileMap上坐标确定点击优先级，继续长按选择下一优先级，暂取第一个
    // if(this.movingObj == null || this.movingObj != this.contains[0]) {
    //   this.startTimer = Date.now();
    //   console.log('haha');
    // }
  }

  private onTouchEnd(e: EventTouch) {
    this.startTimer = -1;
    this.isMoving = false;
  }

  private onTouchMove(e: EventTouch) {
    if(this.startPos != null) {
      const pos = e.getLocation();
      const world_v3 = this.mapCamera.screenToWorld(v3(pos.x, pos.y));
      const world_v2 = v2(world_v3.x, world_v3.y);

      const delta = this.startPos.subtract(world_v2).length();
      if(delta > this.cancelDis) {
        this.startPos = null;
        console.log('cancel select')
      }
    }
    if(!this.movingObj || !this.isMoving) {
      return;
    }
    const pos = e.getLocation();
    const world_v3 = this.mapCamera.screenToWorld(v3(pos.x, pos.y));
    const world_v2 = v2(world_v3.x, world_v3.y);
    // const zoomRatio = MapControl.ins.getCameraZoonRatio();
    // 自由拖拽
    // let newPos = this.movingObj.getPosition();
    // newPos = newPos.add(v3(delta.x, delta.y).divide3f(zoomRatio, zoomRatio, zoomRatio));
    // this.moveTo(v2(newPos.x, newPos.y), false);
    const tilePos = TileManager.ins.worldToTile(world_v2.subtract(this.touchOffset));
    const tileWorldPos = TileManager.ins.tileToWorld(tilePos);
    this.moveTo(tileWorldPos);
    this.updateMovingObjTilePos(tilePos.x, tilePos.y);
  }

  // 初始化时在tileMap坐标系(width/2, height/2)处生成 
  public createTileObj(idx: number, location?: Vec2, from?: Node) {
    const obj = instantiate(this.tileObj);
    obj.getComponentInChildren(Sprite).spriteFrame = this.spfArr[idx];
    this.movingId = obj.getComponent(tileObj).id = idx.toString();
    this.movingObj = obj;
    this.isMoving = true;

    const {width, height} = this.tileMap.getMapSize();
    const pos = TileManager.ins.tileToWorld(v2(Math.floor(width/2), Math.floor(height/2)));
    obj.setParent(this.objLayer);
    this.moveTo(pos);
    this.updateMovingObjTilePos(Math.floor(width/2), Math.floor(height/2));
    this.doSelect();
  }

  public moveTo(pos: Vec2, isWorld: boolean = true) {
    if(!this.movingObj) return;
    if(isWorld) {
      this.movingObj.setWorldPosition(v3(pos.x, pos.y, 0));
    }else {
      this.movingObj.setPosition(v3(pos.x, pos.y, 0));
    }
    this.updateObjManagerPos(); 
  }

  private doSelect() {
    console.log('do select');
    this.updateObjManagerPos();
    this.objManager.active = true;
  }

  private updateObjManagerPos() {
    this.objManager.setWorldPosition(this.movingObj.getWorldPosition());
  }

  private updateMovingObjTilePos(x: number, y: number) {
    this.movingPos = {x: x, y: y};
  }

  // 确认编辑变更
  private confirm() {
    this.objManager.active = false;
    this.objManager.setPosition(v3(99999, 99999));
    let id = this.movingId;
    let {x, y} = this.movingPos;
    Data.setTile({id: id, pos: {x: x, y: y}});
    this.movingId = '';
    this.movingPos = null;
    this.movingObj = null;
  }
  // 取消编辑变更
  private cancel() {
    this.objManager.active = false;
    this.objManager.setPosition(v3(99999, 99999));
    const tileData = Data.getTile(this.movingId);
    console.log('get tile', tileData);
    if(tileData) {
      const world = TileManager.ins.tileToWorld(v2(tileData.pos.x, tileData.pos.y));
      this.moveTo(world);
      console.log('cancel reset');
    }else {
      this.movingObj.destroy();
      console.log('cancel destroy');
    }
    this.movingId = '';
    this.movingPos = null;
    this.movingObj = null;
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

  // 计算当前触点与点击物品的偏移向量
  private getTouchOffset(pos: Vec2) {
    const objPos = this.movingObj.getWorldPosition();
    let offset = v3(pos.x, pos.y).subtract(objPos);
    return v2(offset.x, offset.y);
  }

  protected update(dt: number): void {
      if(this.startTimer < 0 || this.movingObj || !this.startPos) return;
      const now = Date.now();
      if(now - this.startTimer >= this.selectedTimer) {
        this.movingObj = this.contains[0];
        this.movingId = this.movingObj.getComponent(tileObj).id;
        // 更改为单个节点管理
        // this.movingObj.getComponent(tileObj).doSelected();
        this.doSelect();
        this.isMoving = true;
        this.touchOffset = this.getTouchOffset(this.startPos);
      }
  }
}

// oa-ob = -ao-ob = -(ao+ob) = -ab = ba;


