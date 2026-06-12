declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import { Loader } from 'three';
  export class GLTFLoader extends Loader {
    load(url: string, onLoad: (gltf: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
    parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: any) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

declare module 'three/examples/jsm/exporters/GLTFExporter.js' {
  import { Object3D } from 'three';
  export class GLTFExporter {
    parse(input: Object3D | Object3D[], onCompleted: (gltf: any) => void, onError?: (error: ErrorEvent) => void, options?: { binary?: boolean }): void;
  }
}
