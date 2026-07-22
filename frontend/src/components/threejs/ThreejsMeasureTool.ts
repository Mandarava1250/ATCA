// ============================================
// 筑见山河 - 测量工具
// 负责3D场景中的距离测量功能
// ============================================

import * as THREE from 'three';

export class MeasureTool {
  private scene: THREE.Scene;
  private measurePoints: THREE.Vector3[] = [];
  private measureLines: (THREE.Line | THREE.Mesh)[] = [];
  private measureLabels: THREE.Sprite[] = [];
  private isMeasuring = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  startMeasure(): void {
    this.isMeasuring = true;
    this.measurePoints = [];
  }

  stopMeasure(): void {
    this.isMeasuring = false;
    this.clearMeasurements();
  }

  isMeasureMode(): boolean {
    return this.isMeasuring;
  }

  addMeasurePoint(worldPoint: THREE.Vector3): number {
    this.measurePoints.push(worldPoint.clone());
    const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(worldPoint);
    this.scene.add(dot);
    this.measureLines.push(dot as any);

    const count = this.measurePoints.length;
    if (count >= 2) {
      const p1 = this.measurePoints[count - 2];
      const p2 = this.measurePoints[count - 1];

      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      this.scene.add(line);
      this.measureLines.push(line as any);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 0.3;
      const distance = p1.distanceTo(p2);
      this.createMeasureLabel(`${distance.toFixed(2)}m`, mid);
      return distance;
    }
    return 0;
  }

  private createMeasureLabel(text: string, position: THREE.Vector3): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(139, 37, 0, 0.9)';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 64, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.scale.set(1.5, 0.75, 1);
    this.scene.add(sprite);
    this.measureLabels.push(sprite);
  }

  clearMeasurements(): void {
    this.measureLines.forEach((obj) => this.scene.remove(obj as THREE.Object3D));
    this.measureLabels.forEach((obj) => this.scene.remove(obj));
    this.measureLines = [];
    this.measureLabels = [];
    this.measurePoints = [];
  }
}