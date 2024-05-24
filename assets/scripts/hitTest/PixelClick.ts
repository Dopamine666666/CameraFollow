import { Component, Mat4, Node, Sprite, SpriteFrame, UITransform, Vec2, Vec3, __private, gfx } from "cc";
const mat4_temp: Mat4 = new Mat4();
const worldMatrix: Mat4 = new Mat4();
const zeroMatrix: Mat4 = new Mat4();
const testPos: Vec2 = new Vec2();
const world_v2: Vec2 = new Vec2();
const world_v3: Vec3 = new Vec3();


export class PixelClick{
  private textureBufferMap: WeakMap<__private._cocos_asset_assets_texture_base__TextureBase, Uint8Array> = new WeakMap();
  private spriteBufferMap: WeakMap<Sprite, Uint8Array> = new WeakMap();
  private nodeHitTestFnMap: WeakMap<UITransform, (screen: Vec2, windowId?: number) => boolean> = new WeakMap();
  // 像素点击开启与关闭
  enableHitTest(node: Node, enable: boolean = true) {
    const uiTrans = node.getComponent(UITransform);
    if(!uiTrans) return;
    if(!enable) {
      const fn = this.nodeHitTestFnMap.get(uiTrans);
      if(fn) {
        uiTrans.hitTest = fn.bind(uiTrans);
      }
      return;
    }
    // this.enableSpriteFrameListener(node.getComponent(Sprite));
    let oldHitTest = uiTrans.hitTest;
    // 保存原始hitTest方法
    this.nodeHitTestFnMap.set(uiTrans, oldHitTest);
    uiTrans.hitTest = (screen: Vec2, windowId: number = 0) => {
      let hit = oldHitTest.call(uiTrans, screen, windowId);
      if(!hit) return false;
      // if(!node.getComponent(Sprite)) return hit;
      const scene = uiTrans._sceneGetter?.() ?? node.scene.renderScene;
      for(let i = 0; i < scene.cameras.length; i++) {
        const camera = scene.cameras[i];
        // 照相机不对该节点进行渲染则跳过
        if(!(camera.visibility & node.layer)) continue;
        if(camera.systemWindowId !== windowId) continue;
        // 将屏幕坐标转换为当前照相机下的世界坐标
        Vec3.set(world_v3, screen.x, screen.y, 0);
        camera.screenToWorld(world_v3, world_v3);
        Vec2.set(world_v2, world_v3.x, world_v3.y);
        // 将世界坐标转换为当前节点的本地坐标
        uiTrans.node.getWorldMatrix(worldMatrix);
        Mat4.invert(mat4_temp, worldMatrix);
        if(Mat4.strictEquals(mat4_temp, zeroMatrix)) continue;
        Vec2.transformMat4(testPos, world_v2, mat4_temp);

        const checked = this.checkPixels(testPos, node.getComponent(Sprite));
        if(checked) return true; //点击了透明像素
      }
      return false;
    }
  }

  checkPixels(pos: Vec2, sprite: Sprite) {
    const buffer = this.readPixelsFromSprite(sprite);
    const index = this.getBufferIndex(pos, sprite);
    return buffer[index + 3] > 0;
  }

  getBufferIndex(pos: Vec2, sprite: Sprite) {
    const spf = sprite.spriteFrame;
    const texWidth = spf.rect.width;
    const texHeight = spf.rect.height;
    const originSize = spf.originalSize;
    const uiTrans = sprite.node.getComponent(UITransform);

    const anchorX = uiTrans.anchorX;
    const anchorY = uiTrans.anchorY;

    const contentWidth = uiTrans.width;
    const contentHeight = uiTrans.height;

    let index = -1;

    if(sprite.trim) {
      let x = Math.floor(pos.x / (contentWidth / texWidth) + texWidth * anchorX);
      let y = Math.floor(texHeight - (pos.y / (contentHeight / texWidth) + texHeight * anchorY));
      index = (y * texWidth + x) * 4;
    }else {
      let scaleX = contentWidth / originSize.width;
      let scaleY = contentHeight / originSize.height;

      let leftPoint = pos.x + contentWidth * anchorX;
      let topPoint = pos.y + contentHeight * (anchorY - 1);

      let tx = spf.rect.x;
      let ty = spf.rect.y;
      if(spf.packable && spf.original) {
        tx = spf.original._x;
        ty = spf.original._y;
      }
      // 计算鼠标在图像像素上的位置
      let x = Math.floor((leftPoint - tx * scaleX) / scaleX);
      let y = Math.floor((topPoint - ty * scaleY) / scaleY);
      index = (y * texWidth + x) * 4;
    }
    return index;
  }

  readPixelsFromSprite(sprite: Sprite) {
    let buffer: Uint8Array = null;
    if(this.spriteBufferMap.has(sprite)) {
      buffer = this.spriteBufferMap.get(sprite);
    }

    if(!buffer) {
      let spf = sprite.spriteFrame;
      let texture = spf.texture;
      let tx = spf.rect.x;
      let ty = spf.rect.y;
      // 自动合图，且已参与自动合图，则获取原始参数
      if(spf.packable && spf.original) {
        texture = spf.original._texture;
        tx = spf.original._x;
        ty = spf.original._y;
      }
      let width = spf.rect.width;
      let height = spf.rect.height;

      let gfxTexture = texture.getGFXTexture();
      let gfxDevice = texture['_getGFXDevice']();
      let bufferViews: ArrayBufferView[] = [];
      let region = new gfx.BufferTextureCopy();
      buffer = new Uint8Array(width * height * 4);
      region.texOffset.x = tx;
      region.texOffset.y = ty;
      region.texExtent.width = width;
      region.texExtent.height = height;
      bufferViews.push(buffer);
      gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, [region]);
      this.spriteBufferMap.set(sprite, buffer);
    }
    return buffer;
  }
}