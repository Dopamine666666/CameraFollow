import { Mat4, Node, Sprite, UITransform, Vec2, Vec3, gfx } from "cc";
const mat4_temp: Mat4 = new Mat4();
const worldMatrix: Mat4 = new Mat4();
const zeroMatrix: Mat4 = new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
const testPt: Vec2 = new Vec2();
const world_v2: Vec2 = new Vec2();
const world_v3: Vec3 = new Vec3();


export class HitTest {
  private nodeHItTestFnMap: WeakMap<UITransform, (screen: Vec2, windowId?: number) => boolean> = new WeakMap();

  enablePixelHitTest(node: Node, enable: boolean = true) {
    const uiTrans = node.getComponent(UITransform);
    if(!uiTrans) return;
    if(!enable) {
      let fn = this.nodeHItTestFnMap.get(uiTrans);
      if(fn) {
        uiTrans.hitTest = fn.bind(uiTrans);
      }
      return;
    }
    
    // this.enableSpriteFrameListener(node.getComponent(Sprite));
    const oldHitTest = uiTrans.hitTest;
    this.nodeHItTestFnMap.set(uiTrans, oldHitTest);
    uiTrans.hitTest = (screen: Vec2, windowId: number = 0): boolean => {
      let hit = oldHitTest.call(uiTrans, screen, windowId);
      if(!hit) return false; 

      let scene = uiTrans._sceneGetter() ?? node.scene.renderScene;
      for(let i = 0; i < scene.cameras.length; i++) {
        const camera = scene.cameras[i];
        if(!(camera.visibility & node.layer) || (camera.window && !camera.window.swapchain)) continue;
        if(camera.systemWindowId !== windowId) continue;

        Vec3.set(world_v3, screen.x, screen.y, 0);
        camera.screenToWorld(world_v3, world_v3); 
        Vec2.set(world_v2, world_v3.x, world_v3.y);
        // 世界坐标转换节点坐标(世界矩阵转换为逆矩阵，再乘以节点世界坐标向量得到节点坐标向量)
        node.getWorldMatrix(worldMatrix);
        Mat4.invert(mat4_temp, worldMatrix);
        if(Mat4.strictEquals(mat4_temp, zeroMatrix)) continue;
        Vec2.transformMat4(testPt, world_v2, mat4_temp);
        
        let checked = this.checkPixels(testPt, node.getComponent(Sprite));
        if(checked) return true;
      }
      return false;
    }
  }

  // 监听spriteFrame变化，删除缓存的像素数据，暂不考虑
  // enableSpriteFrameListener(sprite: Sprite) {

  // }

  checkPixels(pos: Vec2, sprite: Sprite): boolean {
    let buffer = this.readPixelsFromSprite(sprite);
    let idx = this.getBufferIdx(pos, sprite);
    return buffer[3] > 0;
  }

  readPixelsFromSprite(sprite: Sprite) {
    let buffer: Uint8Array = null;
    let spf = sprite.spriteFrame;
    let texture = spf.texture;

    let tx = spf.rect.x;
    let ty = spf.rect.y;
    let width = spf.rect.width;
    let height = spf.rect.height;

    
    let gfxTexture = texture.getGFXTexture();
    let gfxDevice = texture['_getGFXDevice']();
    let region = new gfx.BufferTextureCopy();

    region.texOffset.x = tx;
    region.texOffset.y = ty;
    region.texExtent.width = width;
    region.texExtent.height = height;
    buffer = new Uint8Array(width * height * 4);
    
    gfxDevice.copyTextureToBuffers(gfxTexture, [buffer], [region]);
    return buffer;
  }


  getBufferIdx(pos: Vec2, sprite: Sprite) {
    let spf = sprite.spriteFrame;
    const texWidth = spf.rect.width;
    const texHeight = spf.rect.height;
    const originSize = spf.originalSize;
    
    const uiTrans = sprite.node.getComponent(UITransform);
    const anchorX = uiTrans.anchorX;
    const anchorY = uiTrans.anchorY;
    const contentWidth = uiTrans.width;
    const contentHeight = uiTrans.height;

    let idx = -1;

    if(sprite.trim) {
      let x = Math.floor(pos.x / (contentWidth / texWidth) + texWidth * anchorX);
      let y = Math.floor(texHeight - (pos.y / (contentHeight / texHeight) + texHeight * anchorY));
      idx = (y * texWidth + x) * 4;
    }else {
      let scaleX = contentWidth / originSize.width;
      let scaleY = contentHeight / originSize.height;
  
      let leftPoint = pos.x + contentWidth * anchorX;
      let topPoint = Math.abs(pos.y + contentHeight * (anchorY - 1));

      let tx = spf.rect.x;
      let ty = spf.rect.y;
      // 开启自动合图，并且已合图
      if(spf.packable && spf.original) {
        tx = spf.original._x;
        ty = spf.original._y;
      }
      // 计算鼠标在图像像素上的位置
      let x = Math.floor((leftPoint - tx * scaleX) / scaleX);
      let y = Math.floor((topPoint - ty * scaleY) / scaleY);
      idx = (y * texWidth + x) * 4;
    }
    return idx;
  }
}