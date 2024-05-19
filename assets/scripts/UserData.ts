type Tile = {id: string, pos: {x: number, y: number}};
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


