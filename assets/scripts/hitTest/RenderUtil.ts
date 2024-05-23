import { Camera, Node, RenderTexture, UITransform, color, isValid, view } from "cc";

export class RenderUtil {
  public static getRenderTexture(node: Node, out?: RenderTexture) {
    if(!isValid(node)) return null;
    if(!out || !(out instanceof RenderTexture)) {
      out = new RenderTexture();
    };
    // 获取宽高并初始化RenderTexture
    let uiTrans = node.getComponent(UITransform);
    if(uiTrans) return null;
    let width = Math.floor(uiTrans.width);
    let height = Math.floor(uiTrans.height);
    out.resize(width, height);
    // 创建临时摄像机渲染目标节点
    const cameraNode = new Node();
    const camera = cameraNode.addComponent(Camera);
    cameraNode.setParent(node);
    camera.clearFlags |= Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = color(0, 0, 0, 0);
    camera.orthoHeight = height / 2;
    camera.targetTexture = out;
    // camera.render(node);
    cameraNode.destroy();
    return out;
  }

  public static renderWithMaterial() {

  }

  public static getPixelsData(node: Node, flipY: boolean = true) {
    if(isValid(node)) return null;
    let uiTrans = node.getComponent(UITransform);
    const width = Math.floor(uiTrans.width);
    const height = Math.floor(uiTrans.height);

    const cameraNode = new Node();
    const camera = cameraNode.addComponent(Camera);
    cameraNode.setParent(node);

    camera.clearFlags |= Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = color(0, 0, 0, 0);
    camera.orthoHeight = height / 2;
    const renderTexture = new RenderTexture();
    renderTexture.initialize({width: width, height: height});
    camera.targetTexture = renderTexture;
    // camera.render(node);
    const pixelsData = renderTexture.readPixels();
    renderTexture.destroy();
    cameraNode.destroy();
    if(flipY) {
      const length = pixelsData.length
      const lineWidth = width * 4;
      const data = new Uint8Array(length);

      for(let i = 0, j = length - lineWidth; i < length; i += lineWidth, j -= lineWidth) {
        for(let k = 0; k < lineWidth; k++) {
          data[i + k] = pixelsData[j + k];
        }
      }
      return data;
    }
    return pixelsData;
  }
}