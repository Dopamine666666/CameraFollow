import { __private, _decorator, Component, gfx, js, Mat4, math, Node, Sprite, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
const _mat4_temp = new Mat4();
const _worldMatrix = new Mat4();
const _zeroMatrix = new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
const testPt = new Vec2();
const v2WorldPt = new Vec2();
const v3WorldPt = new Vec3();

@ccclass('HitTest')
export class HitTest extends Component {
  private textureBufferMap: WeakMap<__private._cocos_asset_assets_texture_base__TextureBase, Uint8Array> = new WeakMap();
  private spriteBufferMap: WeakMap<Sprite, Uint8Array> = new WeakMap();
  private nodeHitTestFnMap: WeakMap<UITransform, (screen: Vec2, windowId?: number) => boolean> = new WeakMap();

  enabledPixelHitTest(uiTrans: UITransform, enable: boolean = true) {
    if(!uiTrans) return;
    if(!enable) {
      const fn = this.nodeHitTestFnMap.get(uiTrans);
      if(fn) {
        uiTrans.hitTest = fn.bind(uiTrans);
      }
      return;
    }
    const node = uiTrans.node;

    this.enableSpriteFrameListener(node.getComponent(Sprite));
    let oldHitTest = uiTrans.hitTest;
    this.nodeHitTestFnMap.set(uiTrans, oldHitTest);
    uiTrans.hitTest = (screen: math.Vec2, windowId: number = 0) => {
      let hit = oldHitTest.call(uiTrans, screen, windowId);

      if(!hit) return false;
      if(!node.getComponent(Sprite)) return hit;
      
      let scene = uiTrans._sceneGetter?.() ?? node.scene.renderScene;
      for(let i = 0; i < scene.cameras.length; i++) {
        const camera = scene.cameras[i];
        if(!(camera.visibility & node.layer) || (camera.window && !camera.window.swapchain)) { continue;}
        if(camera.systemWindowId !== windowId) {
          continue;
        }
        Vec3.set(v3WorldPt, screen.x, screen.y, 0);
        camera.screenToWorld(v3WorldPt, v3WorldPt);
        Vec2.set(v2WorldPt, v3WorldPt.x, v3WorldPt.y);

        uiTrans.node.getWorldMatrix(_worldMatrix);
        Mat4.invert(_mat4_temp, _worldMatrix);
        if(Mat4.strictEquals(_mat4_temp, _zeroMatrix)) {
          continue;
        }
        Vec2.transformMat4(testPt, v2WorldPt, _mat4_temp);
        let checked = this._checkPixels(testPt, node.getComponent(Sprite));

        if(checked) {
          return true;
        }
      }
      return false;
    }
  }

  private enableSpriteFrameListener(sprite: Sprite) {
    if(!sprite) return;
    const _property = 'spriteFrame';
    const desc = js.getPropertyDescriptor(sprite, _property);
    if(!!desc.set) {
      Object.defineProperty(sprite, _property, {
        get: desc.get,
        set: (value) => {
          if(sprite.spriteFrame != value) {
            this.spriteBufferMap.delete(sprite);
          }
          desc.set.call(sprite, value);
        }
      });
      return;
    }
  }

  public readPixelsFromSprite(sprite: Sprite) {
    let buffer: Uint8Array = null;
    if(this.spriteBufferMap.has(sprite)) {
      buffer = this.spriteBufferMap.get(sprite);
    }

    if(!buffer) {
      let spriteFrame = sprite.spriteFrame;
      let texture = spriteFrame.texture;
      let tx = spriteFrame.rect.x;
      let ty = spriteFrame.rect.y;

      if(spriteFrame.packable && spriteFrame.original) {
        texture = spriteFrame.original._texture;
        tx = spriteFrame.original._x;
        ty = spriteFrame.original._y;
      }

      let width = spriteFrame.rect.width;
      let height = spriteFrame.rect.height;

      let gfxTexture = texture.getGFXTexture();
      let gfxDevice = texture['_getGFXDevice']();
      let bufferViews = [];
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

  private _checkPixels(pos: Vec2, sprite: Sprite) {
    let buffer = this.readPixelsFromSprite(sprite);
    let index = this._getBufferIndex(pos, sprite);
    return buffer[index + 3] > 0;
  }

  private _getBufferIndex(pos: Vec2, sprite: Sprite) {
    let spriteFrame = sprite.spriteFrame;
    const texWidth = spriteFrame.rect.width;
    const texHeight = spriteFrame.rect.height;
    const originSize = spriteFrame.originalSize;
    const uiTrans = sprite.node.getComponent(UITransform);

    const anchorX = uiTrans.anchorX;
    const anchorY = uiTrans.anchorY;

    const contentWidth = uiTrans.width;
    const contentHeight = uiTrans.height;

    let index = -1;

    if(sprite.trim) {
      let x = Math.floor(pos.x / (contentWidth / texWidth) + texWidth * anchorX);
      let y = Math.floor(texHeight - (pos.y / (contentHeight / texHeight) + texHeight * anchorY));
      index = (y * texWidth + x) * 4;
    }else {
      let scaleX = contentWidth / originSize.width;
      let scaleY = contentHeight / originSize.height;

      let leftPoint = pos.x + contentWidth * anchorX;
      let topPoint = Math.abs(pos.y + contentHeight * (anchorY - 1));

      let tx = spriteFrame.rect.x;
      let ty = spriteFrame.rect.y;
      if(spriteFrame.packable && spriteFrame.original) {
        tx = spriteFrame.original._x;
        ty = spriteFrame.original._y;
      }
      let x = Math.floor((leftPoint - tx * scaleX) / scaleX);
      let y = Math.floor((topPoint - ty * scaleY) / scaleY);
      index = (y * texWidth + x) * 4;
    }

    return index;
  }

  private readPixels(texture: __private._cocos_asset_assets_texture_base__TextureBase, flipY: boolean = true): Uint8Array {
    if(!texture) return null;
    if(this.textureBufferMap.has(texture)) {
      let buffer = this.textureBufferMap.get(texture);
      if(buffer) return buffer;
    }

    let {width, height} = texture;
    let gfxTexture = texture.getGFXTexture();
    let gfxDevice = texture['_getGFXDevice']();
    let bufferViews = [];
    let region = new gfx.BufferTextureCopy();
    let buffer = new Uint8Array(width * height * 4);

    region.texExtent.width = width;
    region.texExtent.height = height;
    bufferViews.push(buffer);
    gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, [region]);

    if(flipY) {
      let i = 0;
      let len1 = height / 2;
      let len2 = width * 4;
      let j: number;
      let idx0: number;
      let idx1: number;

      while(j < len1) {
        j = 0;
        while(j < len2) {
          idx0 = i * len2 + j;
          idx1 = (height - i - 1) * len2 + j++;
          [buffer[idx0], buffer[idx1]] = [buffer[idx1], buffer[idx0]];
        }
        i++;
      }
    }

    this.textureBufferMap.set(texture, buffer);
    return buffer;
  }
}


