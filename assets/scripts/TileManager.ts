import { _decorator, Component, Event, EventTouch, Node, NodeEventType, sys, TiledMap, UITransform, v2, Vec2, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TileManager')
export class TileManager extends Component {
    @property({type: TiledMap})
    tileMap: TiledMap = null;

    protected onLoad(): void {
        this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    }

    bindEvent() {
        this.node.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
    }

    /** 由tileMap坐标转换成对应tile的左上顶点坐标 */ 
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

    /** 由屏幕坐标转换成tileMap坐标 */
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

    private onTouchStart(e: EventTouch) {
        const UIPos = e.getUILocation();
        // console.log('UIPos', UIPos);
        const tilePos = this.screenToTile(UIPos);

        // console.log('tilePos', tilePos);
    }

    private log() {
        // for(let i = 0; i < 5; i++) {
            // console.log('0,0', this.tileMap.getLayer('view').getPositionAt(i, 0));
        // }
        // const tile0_0 = this.tileMap.getLayer('view');
        // console.log('0,0', tile0_0.getTiledTileAt(0, 0, true).node.active = false);
        // console.log('0,0', this.tileMap.getLayer('view').getPositionAt(0, 0));



    }
}


