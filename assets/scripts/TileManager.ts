import { _decorator, Camera, Component, Event, EventTouch, Node, NodeEventType, sys, TiledMap, UITransform, v2, v3, Vec2, view } from 'cc';
import { ObjControl } from './ObjControl';
const { ccclass, property } = _decorator;

@ccclass('TileManager')
export class TileManager extends Component {
    @property({type: TiledMap})
    tileMap: TiledMap = null;

    @property({type: Camera})
    mapCamera: Camera = null;

    public static ins: TileManager = null;

    protected onLoad(): void {
        TileManager.ins = this;
        // this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
        this.initTileMap();
    }

    // 使用示例 
    private onTouchStart(e: EventTouch) {
        const pos = e.getLocation();
        const world = this.mapCamera.screenToWorld(v3(pos.x, pos.y, 0));
        const tilePos = this.worldToTile(v2(world.x, world.y));
    }

    /** 由tileMap坐标转换成对应tile的左上顶点坐标, 基准为UI坐标系 */ 
    public tileToScreen(tilePos: Vec2, out?: Vec2) {
        let mapSize = this.tileMap.getMapSize();
        let tileSize = this.tileMap.getTileSize();

        let tileWidth = tileSize.width;
        let tileHeight = tileSize.height;
        let tileWidthHalf = tileWidth / 2;
        let tileHeightHalf = tileHeight / 2;

        let mapWidth = mapSize.width * tileWidth;
        let mapHeight = mapSize.height * tileHeight;
        
        // 偏移量计算仅考虑锚点都为0的情况
        let offsetX = (view.getVisibleSize().width - mapWidth)/2;
        let offsetY = (view.getVisibleSize().height - mapHeight)/2;

        offsetX += mapWidth/2;
        offsetY += mapHeight;
        // 计算过程为向量计算，略
        let screenX = offsetX + (tilePos.x - tilePos.y) * tileWidthHalf;
        let screenY = offsetY  - (tilePos.x + tilePos.y) * tileHeightHalf;
       
        if(!out) out = new Vec2();
        out.set(screenX, screenY);
        return out; 
    }

    /** 由UI坐标转换成tileMap坐标 */
    public screenToTile(screenPos: Vec2, out?: Vec2) {
        let mapSize = this.tileMap.getMapSize();
        let tileSize = this.tileMap.getTileSize();

        let tileWidth = tileSize.width;
        let tileHeight = tileSize.height;
        // let tileWidthHalf = tileWidth / 2;
        // let tileHeightHalf = tileHeight / 2;

        let mapWidth = mapSize.width * tileWidth;
        let mapHeight = mapSize.height * tileHeight;

        // 偏移量计算仅考虑锚点都为0的情况
        let offsetX = (view.getVisibleSize().width - mapWidth) / 2;
        let offsetY = (view.getVisibleSize().height - mapHeight) / 2;

        offsetX += mapWidth/2;
        offsetY += mapHeight;
        // 由tileToScreen公式推导而来
        let tileX = (screenPos.x - offsetX) / tileWidth - (screenPos.y - offsetY) / tileHeight;
        let tileY = -(screenPos.x - offsetX) / tileWidth - (screenPos.y - offsetY) / tileHeight;

        if(!out) out = new Vec2();
        out.set(Math.trunc(tileX), Math.trunc(tileY));
        return out;
    }

    /** tileMap坐标转换为世界坐标 */
    public tileToWorld(tilePos: Vec2) {
        const localPos = this.tileToScreen(tilePos);
        const worldPos = this.node.getComponent(UITransform).convertToWorldSpaceAR(v3(localPos.x, localPos.y, 0));
        return v2(worldPos.x, worldPos.y);
    } 

    /** 世界坐标转换tileMap坐标 */
    public worldToTile(world: Vec2) {
        // 锚点(0,0)，则原点都为左下角，localPos等同于screenPos
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(world.x, world.y, 0));
        return this.screenToTile(v2(localPos.x, localPos.y));
    }

    private initTileMap() {
        // 使用摄像机需将自动裁剪关闭
        this.tileMap.enableCulling = false;
        this.setAnchorPointZero(this.node);
        this.tileMap.node.children.forEach(child => {
            console.log('layer', child.name);
            const UITrans = this.node.getComponent(UITransform);
            if(!UITrans) {
                console.log('No UITransform Component')
            }
            const x = UITrans.width / 2;
            const y = UITrans.height / 2;
            child.setPosition(x, y);   
        })

    }

    /** 当前转换方法需将锚点设为左下角，与UI坐标系统一 */
    private setAnchorPointZero(node: Node) {
        const UITrans = node.getComponent(UITransform);
        if(!UITrans) {
            console.log('No UITransform Component')
        }
        UITrans.setAnchorPoint(v2(0, 0));
        const x = -UITrans.width / 2;
        const y = -UITrans.height / 2;
        node.setPosition(x, y);
    }
}


