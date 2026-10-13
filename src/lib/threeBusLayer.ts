import * as THREE from 'three';
import { CustomLayerInterface, Map as MapLibreMap, MercatorCoordinate } from 'maplibre-gl';
import { ActiveBus } from './types';

export const CAMPUS_CENTER_LNG = 103.7745;
export const CAMPUS_CENTER_LAT = 1.2970;

function createBusMesh(): THREE.Group {
  const busGroup = new THREE.Group();

  // NUS Shuttle Bus scaled 2.5x in local meters
  // Length: 28m (along Y), Width: 6.2m (along X), Height: 7.2m (along Z)

  // 1. Lower Chassis (Crisp White)
  const chassisGeo = new THREE.BoxGeometry(6.2, 28, 4.2);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.set(0, 0, 2.8);
  busGroup.add(chassis);

  // 2. Window Strip (Dark Glass / Glossy Tint)
  const windowGeo = new THREE.BoxGeometry(6.25, 23, 2.0);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const windows = new THREE.Mesh(windowGeo, windowMat);
  windows.position.set(0, -0.5, 4.2);
  busGroup.add(windows);

  // 3. Iconic NUS Vibrant Orange Roof (#FF7200) - Self-Illuminating
  const roofGeo = new THREE.BoxGeometry(6.1, 27.6, 1.4);
  const roofMat = new THREE.MeshBasicMaterial({ color: 0xff7200 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 0, 5.7);
  busGroup.add(roof);

  // 4. Warm White Glowing LED Headlights
  const headlightGeo = new THREE.BoxGeometry(1.2, 0.4, 0.7);
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });

  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  leftHeadlight.position.set(-2.0, 14.1, 2.4);
  busGroup.add(leftHeadlight);

  const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  rightHeadlight.position.set(2.0, 14.1, 2.4);
  busGroup.add(rightHeadlight);

  // 5. Red LED Taillights
  const taillightGeo = new THREE.BoxGeometry(1.2, 0.4, 0.7);
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
  leftTaillight.position.set(-2.0, -14.1, 2.6);
  busGroup.add(leftTaillight);

  const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
  rightTaillight.position.set(2.0, -14.1, 2.6);
  busGroup.add(rightTaillight);

  // 6. Rubber Wheels (Dark)
  const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.7, 12);
  const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [-3.0, 8.5, 1.2],
    [3.0, 8.5, 1.2],
    [-3.0, -8.5, 1.2],
    [3.0, -8.5, 1.2],
  ];

  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    busGroup.add(wheel);
  }

  return busGroup;
}

export class ThreeBusLayer implements CustomLayerInterface {
  id = 'nus-shuttle-bus-3d';
  type = 'custom' as const;
  renderingMode = '3d' as const;

  map!: MapLibreMap;
  camera!: THREE.Camera;
  scene!: THREE.Scene;
  renderer!: THREE.WebGLRenderer;

  private busMeshMap: Map<string, THREE.Group> = new Map();
  private pendingBuses: ActiveBus[] = [];

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    // Lighting setup for realistic 3D appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    sunLight.position.set(500, 500, 1000);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.8);
    fillLight.position.set(-500, -500, 500);
    this.scene.add(fillLight);

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    if (this.pendingBuses.length > 0) {
      this.updateBuses(this.pendingBuses);
    }
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, options: any) {
    // Extract camera projection matrix from options
    let matrixArray: number[] | Float64Array | Float32Array | undefined;
    if (options && options.defaultProjectionData && options.defaultProjectionData.mainMatrix) {
      matrixArray = options.defaultProjectionData.mainMatrix;
    } else if (Array.isArray(options) || options instanceof Float64Array || options instanceof Float32Array) {
      matrixArray = options;
    } else if (options && options.matrix) {
      matrixArray = options.matrix;
    }

    if (!matrixArray) {
      return;
    }

    // Double-precision projection anchor:
    // Anchor camera projection to Kent Ridge center [103.7745, 1.2970]
    const centerCoord = MercatorCoordinate.fromLngLat(
      [CAMPUS_CENTER_LNG, CAMPUS_CENTER_LAT],
      0
    );
    const scale = centerCoord.meterInMercatorCoordinateUnits();

    // Matrix 'm' is MapLibre's Mercator matrix
    const m = new THREE.Matrix4().fromArray(matrixArray as any);

    // Matrix 'l' transforms from local campus meters (dx East, dy North, dz Up) into Mercator space
    const l = new THREE.Matrix4()
      .makeTranslation(centerCoord.x, centerCoord.y, centerCoord.z)
      .scale(new THREE.Vector3(scale, -scale, scale));

    // camera.projectionMatrix = m * l
    this.camera.projectionMatrix = m.multiply(l);

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }

  updateBuses(buses: ActiveBus[]) {
    this.pendingBuses = buses;
    if (!this.scene) return;

    const currentIds = new Set<string>();

    for (const bus of buses) {
      currentIds.add(bus.id);

      // Local meters relative to Kent Ridge Campus Center [103.7745, 1.2970]
      const dx =
        (bus.lng - CAMPUS_CENTER_LNG) *
        111320 *
        Math.cos((CAMPUS_CENTER_LAT * Math.PI) / 180);
      const dy = (bus.lat - CAMPUS_CENTER_LAT) * 111320;
      const dz = 0.5;

      let mesh = this.busMeshMap.get(bus.id);
      if (!mesh) {
        mesh = createBusMesh();
        this.scene.add(mesh);
        this.busMeshMap.set(bus.id, mesh);
      }

      mesh.position.set(dx, dy, dz);
      // Bearing: degrees clockwise from North.
      // In local coordinates (+Y North, +X East), rotation around Z is -bearing.
      mesh.rotation.z = -((bus.bearing || 0) * Math.PI) / 180;
      mesh.userData = { bus };
    }

    // Remove departed buses
    for (const [id, mesh] of this.busMeshMap.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.busMeshMap.delete(id);
      }
    }

    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  onRemove() {
    for (const mesh of this.busMeshMap.values()) {
      this.scene.remove(mesh);
    }
    this.busMeshMap.clear();
  }
}
