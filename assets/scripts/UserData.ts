type Tile = {
    id: string,
    pos: {x: number, y: number},
    // grids?: {x: number, y: number}[],
    direction: 1 | -1,
};
export class UserData {
    private static _ins: UserData = null;
    static ins() {
        if(!this._ins) this._ins = new UserData();
        return this._ins;
    }

    private _tileData: Tile[] = [];

    public getTileData() {
        return this._tileData;
    }

    public setTile(data: Tile) {
        const tileData = this.getTile(data.id);
        if(tileData) {
            console.log('change tile data');
            tileData.pos.x = data.pos.x;
            tileData.pos.y = data.pos.y;
            tileData.direction = data.direction;
        }else {
            console.log('set new tile');
            this._tileData.push(data);
        }
    }

    public getTile(id: string) {
        console.log('data', this._tileData);
        return this._tileData.find(data => data.id == id);
    }
}

export const Data = UserData.ins();

type TileCfg = {[id: string]: {size: {width: number, height: number}}};

type GameCfg = {
    tileCfg: TileCfg,
}

export const GameData: GameCfg = {
    tileCfg: {
        ['0']: {size: {width: 3, height: 2}},
        ['1']: {size: {width: 3, height: 2}},
        ['2']: {size: {width: 3, height: 2}},
        ['3']: {size: {width: 3, height: 2}},
    }
}


