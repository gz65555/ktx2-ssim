import {
  BackgroundMode,
  Camera,
  KTX2TargetFormat,
  Texture2D,
  TextureFormat,
  Vector3,
  WebGLEngine,
} from "@galacean/engine";
import ssim from "ssim.js";

async function loadKTX2(canvas: HTMLCanvasElement, url: string) {
  const engine = await WebGLEngine.create({
    canvas,
    graphicDeviceOptions: { preserveDrawingBuffer: true },
  });
  engine.canvas.resizeByClientSize();
  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity();

  const texture = await engine.resourceManager.load<Texture2D>({
    url: url,
    params: {
      // priorityFormats: [KTX2TargetFormat.PVRTC],
    },
  });
  canvas.width = texture.width;
  canvas.height = texture.height;
  const width = texture.width;
  const height = texture.height;

  console.log(
    `width: ${width}`,
    `height: ${height}`,
    `format: ${TextureFormat[texture.format]}`
  );

  // init camera
  const cameraEntity = rootEntity.createChild("camera");
  cameraEntity.addComponent(Camera);
  const pos = cameraEntity.transform.position;
  pos.set(10, 10, 10);
  cameraEntity.transform.position = pos;
  cameraEntity.transform.lookAt(new Vector3(0, 0, 0));

  // init light
  scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
  scene.ambientLight.diffuseIntensity = 1.2;
  scene.background.mode = BackgroundMode.Texture;
  scene.background.texture = texture;

  engine.run();

  function getImageData() {
    const gl = canvas.getContext("webgl2")!;
    const buf = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return new ImageData(buf, width, height);
  }

  return new Promise<ImageData>((resolve) => {
    setTimeout(() => {
      resolve(getImageData());
    }, 200);
  });
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const canvas1 = document.getElementById("canvas-1") as HTMLCanvasElement;

const imageName = "/test/test.png";
const imageName1 = "/test/test-etc1s.ktx2";

Promise.all([loadKTX2(canvas, imageName), loadKTX2(canvas1, imageName1)]).then(
  ([imageData, imageData1]) => {
    const result = ssim(imageData, imageData1, {
      windowSize: 20,
      k1: 0.01,
      k2: 0.025,
      ssim: "original",
    });
    console.log(
      `${imageName} vs ${imageName1}`,
      (result.mssim * 100).toFixed(4) + "%"
    );
  }
);
