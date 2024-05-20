import { _decorator, Button, Camera, Component, EventTouch, instantiate, Node, NodeEventType, NodePool, Prefab, Sprite, SpriteFrame, TiledMap, Touch, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { TileManager } from './TileManager';
import { tileObj } from './tileObj';
import { MapControl } from './MapControl';
import { Data, GameData, UserData } from './UserData';
import { PoolManager } from './PoolManager';
import { highLight } from './highLight';
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
  private movingDir: 1 | -1 = 1;
  private movingGrids: {x: number, y: number}[] = [];

  private startTimer: number = -1;
  
  private enabledGid: number = 0;
  private disabledGid: number = 0;

  private highLightPool: NodePool = null;

  protected onLoad(): void {
    ObjControl.ins = this;
    this.loadGid();
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
    let tilePos = TileManager.ins.worldToTile(world_v2.subtract(this.touchOffset));
    tilePos = this.dealTileLimit(tilePos);
    const tileWorldPos = TileManager.ins.tileToWorld(tilePos);
    this.moveTo(tileWorldPos);
    this.updateMovingObjTilePos(tilePos.x, tilePos.y);

    const lastPos = e.getPreviousLocation();
    const last_world_v3 = this.mapCamera.screenToWorld(v3(lastPos.x, lastPos.y));
    const last_world_v2 = v2(last_world_v3.x, last_world_v3.y);
    const lastTilePos =  TileManager.ins.worldToTile(last_world_v2.subtract(this.touchOffset));
    // 仅当坐标变化时更新
    if(lastTilePos.x != tilePos.x || lastTilePos.y != tilePos.y) {
      this.updateGrids();
    }
    console.log('pos', tilePos.x, tilePos.y);
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
    this.initGrids();
    this.updateGrids();
  }

  private updateObjManagerPos() {
    this.objManager.setWorldPosition(this.movingObj.getWorldPosition());
  }

  private updateMovingObjTilePos(x: number, y: number) {
    this.movingPos = {x: x, y: y};
  }

  private gridsNode: Node[] = [];
  private initGrids() {
    // 通过tileMap tile层高亮所占区块(性能问题，暂不采用)
    // const layer = this.tileMap.getComponent(TiledMap).getLayer('view2');
    // this.movingGrids.forEach(grid => layer.setTileGIDAt(0, grid.x, grid.y));
    // this.movingGrids.length = 0;
    // const {width, height} = GameData.tileCfg[this.movingId].size;
    // // const {id, pos, direction} = Data.getTile(this.movingId);
    // let w = this.movingDir == 1 ? width : height;
    // let h = this.movingDir == 1 ?  height : width;
    // for(let i = 0; i < w; i++) {
    //   for(let j = 0; j < h; j++) {
    //     let newPos = {x: this.movingPos.x - i, y: this.movingPos.y - j};
    //     this.movingGrids.push(newPos);
    //     layer.getTiledTileAt(newPos.x, newPos.y, true).grid = this.enabledGid;
    //   }
    // }
    this.movingGrids.length = 0;
    this.gridsNode.length = 0;
    const {width, height} = GameData.tileCfg[this.movingId].size;
    let w = this.movingDir == 1 ? width : height;
    let h = this.movingDir == 1 ?  height : width;
    const poolMgr = PoolManager.ins;
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        let newPos = { x: this.movingPos.x - i, y: this.movingPos.y - j };
        this.movingGrids.push(newPos);
        const world = TileManager.ins.tileToWorld(v2(newPos.x, newPos.y));
        const node = poolMgr.getHighLight();
        node.setParent(this.objManager);
        this.gridsNode.push(node);
        const script = node.getComponent(highLight);
        script.setHighLightSpf(0);
        script.setHighLightPos(world);
        script.updateXY(newPos.x, newPos.y);
      }
    }
  }

  private updateGrids() {
    const tiles = Data.getTileData();
    let probably: string[] = [];
    const curW = GameData.tileCfg[this.movingId].size.width;
    const curH = GameData.tileCfg[this.movingId].size.height;
    const r_0 = Math.max(curW, curH);
    const pos_0 = this.movingPos;
    // 更新高亮块坐标
    this.movingGrids.length = 0;
    for (let i = 0; i < curW; i++) {
      for (let j = 0; j < curH; j++) {
        let newPos = { x: this.movingPos.x - i, y: this.movingPos.y - j };
        this.movingGrids.push(newPos);
        this.gridsNode[this.movingGrids.length - 1].getComponent(highLight).setHighLightSpf(0);
      }
    }
    // 处理冲突块
    tiles.forEach(tile => {
      const {width, height} = GameData.tileCfg[tile.id].size;
      const r_1 = Math.max(width, height);
      const pos_1 = tile.pos;
      if(Math.abs(pos_0.x - pos_1.x) < r_0 + r_1 || Math.abs(pos_0.y - pos_1.y) < r_0 + r_1) {
        probably.push(tile.id);
      }
    });
    console.log(probably);
    console.log(this.movingId);
    this.movingGrids.forEach((curGrid, idx) => {
      probably.forEach(id => {
        const grids = Data.getTile(id).grids;
        grids.forEach(otherGrid => {
          if(curGrid.x == otherGrid.x && curGrid.y == otherGrid.y) {
            this.gridsNode[idx].getComponent(highLight).setHighLightSpf(1);
          }
        })
      })
    })
  }

  // 确认编辑变更
  private confirm() {
    this.objManager.active = false;
    this.objManager.setPosition(v3(99999, 99999));
    let id = this.movingId;
    let {x, y} = this.movingPos;
    Data.setTile({id: id, pos: {x: x, y: y}, direction: this.movingDir, grids: this.movingGrids});
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

  private dealTileLimit(pos: Vec2) {
    const {width, height} = GameData.tileCfg[this.movingId].size;
    const mapW = this.tileMap.getMapSize().width;
    const mapH = this.tileMap.getMapSize().height;

    let w = this.movingDir == 1 ? width : height;
    let h = this.movingDir == 1 ?  height : width;

    let x = pos.x - (w-1) <= 0 ?  w - 1 : pos.x >= mapW - 1 ? mapW - 1 : pos.x; 
    let y = pos.y - (h-1) <= 0 ?  h - 1 : pos.y >= mapH - 1 ? mapH - 1 : pos.y;
    
    return v2(x, y);
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
        const tileData = Data.getTile(this.movingId);
        if(tileData) {
          this.movingPos.x = tileData.pos.x;
          this.movingPos.y = tileData.pos.y;
        }
        // 更改为单个节点管理
        // this.movingObj.getComponent(tileObj).doSelected();
        this.doSelect();
        this.isMoving = true;
        this.touchOffset = this.getTouchOffset(this.startPos);
      }
  }

  private loadGid() {
    const tiledMap = this.tileMap.getComponent(TiledMap);
    const view2 = tiledMap.getLayer('view2');
    this.enabledGid = view2.getTileGIDAt(0, 0);
    this.disabledGid = view2.getTileGIDAt(1, 0);

    const {width, height} = tiledMap.getTileSize();
    view2.setTilesGIDAt(new Array(width * height).fill(0), 0, 0, width);
  }
}