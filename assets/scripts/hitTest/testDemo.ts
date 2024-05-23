import { Component, Sprite, UITransform, Vec2, Vec3, _decorator, v3 } from "cc";
import { HitTest } from "./HitTest";
import { PixelClick } from "./PixelClick";
const {ccclass, property} = _decorator;

@ccclass('testDemo')
export class testDemo extends Component {
  

  private hitTest = new PixelClick();

  protected onLoad(): void {
      this.onEnterTransitionStart();
  }

  // useTransparencyCheck() {
  //   this.node.getComponent(UITransform).hitTest = this.hitTest.bind(this);
  // }

  // hitTest(point: Vec2) {
  //   const uiTrans = this.node.getComponent(UITransform);
  //   const {width, height} = uiTrans.contentSize;
  //   let hitPos = uiTrans.convertToNodeSpaceAR(v3(point.x, point.y));
  //   if(!uiTrans.getBoundingBox().contains(point)) {
  //     return false;
  //   };
  //   const sprite = this.node.getComponent(Sprite);
  //   if(!sprite) return false;
  //   const texture = sprite.spriteFrame.getGFXTexture();
  //   if(this.isTransparency(texture, hitPos.x, height - hitPos.y)) {
  //     return true;
  //   }else {
  //     return false
  //   }
  // }

  // isTransparency() {
    
  // }

  onEnterTransitionStart() {
    this.node.children.forEach(child => {
      this.hitTest.enableHitTest(child);
    })
  }

  // changeHitTest() {
  //   this.node.children.forEach(child => {
  //     const uiTrans = child.getComponent(UITransform);
  //     uiTrans.hitTest = this.newHit.bind(child);
  //   })
  // }

  // newHit(screen: Vec2, worldId?: number): boolean {

  // }
}