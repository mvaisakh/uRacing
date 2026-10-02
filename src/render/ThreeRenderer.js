import * as THREE from 'three';

export class ThreeRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(canvasWidth, canvasHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Inject canvas behind the 2D UI canvas
    this.domElement = this.renderer.domElement;
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.zIndex = '0';
    const container = document.getElementById('game-container');
    container.insertBefore(this.domElement, document.getElementById('game-canvas'));
    
    document.getElementById('game-canvas').style.position = 'absolute';
    document.getElementById('game-canvas').style.top = '0';
    document.getElementById('game-canvas').style.left = '0';
    document.getElementById('game-canvas').style.zIndex = '10';
    document.getElementById('game-canvas').style.pointerEvents = 'none';
    document.getElementById('game-canvas').style.backgroundColor = 'transparent';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); 
    
    this.camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 1, 10000);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(100, 300, 100);
    dir.castShadow = true;
    this.scene.add(dir);

    this.carMeshes = new Map();
    this.trackMeshes = [];
    this.garageMode = false;

    this.trackCurve = null;
    this.cameraLookAt = new THREE.Vector3();
    this.cameraAngle = 0;
  }

  resize(w, h) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }


  _buildThemeEnvironment(envKey) {
    // Each track theme gets a unique sky and ground surface, like a miniature diorama
    const themes = {
      kitchen: {
        sky: 0xFFF8E7,        // warm cream (kitchen lighting)
        ground: 0xC8960C,     // honey oak wood grain colour
        groundAlt: 0xB8820A,  // darker oak stripe (wood grain stripes)
        fogColor: 0xFFF8E7,
        fogNear: 800, fogFar: 3000,
        stripeTile: 80        // wood plank width
      },
      workshop: {
        sky: 0xD0D8E0,        // cold fluorescent workshop light
        ground: 0x6B4C2A,     // dark stained workbench wood
        groundAlt: 0x5A3E22,
        fogColor: 0xCCD4DC,
        fogNear: 600, fogFar: 2500,
        stripeTile: 100
      },
      garden: {
        sky: 0x7ECBE0,        // outdoor blue sky
        ground: 0x4A7C2F,     // grass green
        groundAlt: 0x3D6827,  // darker grass stripe
        fogColor: 0xA0D8EF,
        fogNear: 1000, fogFar: 4000,
        stripeTile: 120
      }
    };
    const t = themes[envKey] || themes.kitchen;

    // Sky
    this.scene.background = new THREE.Color(t.sky);
    this.scene.fog = new THREE.Fog(t.fogColor, t.fogNear, t.fogFar);

    // Ground plane (surface of table/bench/garden)
    const gGeo = new THREE.PlaneGeometry(8000, 8000);
    const gMat = new THREE.MeshLambertMaterial({ color: t.ground });
    const gMesh = new THREE.Mesh(gGeo, gMat);
    gMesh.rotation.x = -Math.PI / 2;
    gMesh.position.y = -3;
    this.scene.add(gMesh);
    this.trackMeshes.push(gMesh);

    // Decorative surface stripes (wood planks / grass rows)
    const stripeCount = Math.floor(8000 / t.stripeTile);
    const stripeMat = new THREE.MeshLambertMaterial({ color: t.groundAlt });
    for (let i = 0; i < stripeCount; i += 2) {
      const sGeo = new THREE.PlaneGeometry(8000, t.stripeTile * 0.9);
      const s = new THREE.Mesh(sGeo, stripeMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, -2.9, -4000 + i * t.stripeTile + t.stripeTile / 2);
      this.scene.add(s);
      this.trackMeshes.push(s);
    }

    // Decor props per theme
    if (envKey === 'kitchen') {
      this._addKitchenDecor();
    } else if (envKey === 'workshop') {
      this._addWorkshopDecor();
    } else if (envKey === 'garden') {
      this._addGardenDecor();
    }
  }

  _addKitchenDecor() {
    // Salt & pepper shakers (simple cylinders as giant landmarks)
    const shakerMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const lidMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    [[-1200, -900], [1500, 700], [-800, 1100]].forEach(([x, z]) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 200, 16), shakerMat);
      body.position.set(x, 100, z);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 20, 16), lidMat);
      lid.position.set(x, 210, z);
      this.scene.add(body); this.scene.add(lid);
      this.trackMeshes.push(body, lid);
    });
    // A large cutting board leaning in background
    const board = new THREE.Mesh(new THREE.BoxGeometry(600, 10, 400), new THREE.MeshLambertMaterial({ color: 0xA0522D }));
    board.position.set(1800, 200, -1200);
    board.rotation.z = 0.3;
    this.scene.add(board);
    this.trackMeshes.push(board);
  }

  _addWorkshopDecor() {
    // Nuts and bolts (torus + cylinder stacks)
    const metalMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    [[900, -800], [-1300, 600], [200, 1400]].forEach(([x, z]) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 100, 6), metalMat);
      bolt.position.set(x, 50, z);
      const nut = new THREE.Mesh(new THREE.TorusGeometry(35, 12, 6, 6), metalMat);
      nut.rotation.x = Math.PI / 2;
      nut.position.set(x, 110, z);
      this.scene.add(bolt); this.scene.add(nut);
      this.trackMeshes.push(bolt, nut);
    });
    // Tape roll lying on its side
    const tape = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 40, 32), new THREE.MeshLambertMaterial({ color: 0xffcc00 }));
    tape.rotation.z = Math.PI / 2;
    tape.position.set(-1600, 40, -800);
    this.scene.add(tape);
    this.trackMeshes.push(tape);
  }

  _addGardenDecor() {
    // Mushrooms (cylinder + sphere)
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
    const capMat = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
    [[-1100, -700], [1300, 800], [-500, 1300], [1800, -400]].forEach(([x, z]) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(18, 22, 90, 10), stemMat);
      stem.position.set(x, 45, z);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      cap.position.set(x, 100, z);
      this.scene.add(stem); this.scene.add(cap);
      this.trackMeshes.push(stem, cap);
    });
    // Pebble clusters (flattened spheres)
    const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
    for (let i = 0; i < 20; i++) {
      const r = 15 + Math.random() * 20;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), pebbleMat);
      p.scale.y = 0.5;
      p.position.set((Math.random() - 0.5) * 4000, 0, (Math.random() - 0.5) * 4000);
      this.scene.add(p);
      this.trackMeshes.push(p);
    }
  }

  buildEnvironment(trackConfig, splineSamples, trackBarriers, propManager) {
    this.trackMeshes.forEach(m => this.scene.remove(m));
    this.trackMeshes = [];

    // Themed toy-world environment
    this._buildThemeEnvironment(trackConfig.environment || 'kitchen');

    if (!splineSamples || splineSamples.length === 0) return;

    // Add jumps/elevation based on progress
    const totalLen = splineSamples.length;
    const pts = splineSamples.map((s, idx) => {
        const progress = idx / totalLen;
        // Add a jump in the middle of the track (progress 0.4 to 0.6)
        let elevation = 0;
        if (progress > 0.3 && progress < 0.7) {
            elevation = Math.sin((progress - 0.3) * Math.PI / 0.4) * 45; // 45 units high jump
        }
        return new THREE.Vector3(s.point.x, elevation, s.point.y);
    });
    
    const curve = new THREE.CatmullRomCurve3(pts, true);
    this.trackCurve = curve;
    
    const trackWidth = trackConfig.trackWidth || 140;
    
    // ExtrudeGeometry maps Shape X to World UP (Y), and Shape Y to World SIDE.
    // So X = thickness, Y = width across the track.
    const thickness = 4;
    const shape = new THREE.Shape();
    shape.moveTo(0, -trackWidth/2);
    shape.lineTo(0, trackWidth/2);
    shape.lineTo(-thickness, trackWidth/2);
    shape.lineTo(-thickness, -trackWidth/2);
    
    const extrudeSettings = { steps: 150, extrudePath: curve, bevelEnabled: false };
    const trackGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const trackMesh = new THREE.Mesh(trackGeom, trackMat);
    this.scene.add(trackMesh);
    this.trackMeshes.push(trackMesh);

    const edgeShapeLeft = new THREE.Shape();
    edgeShapeLeft.moveTo(12, -trackWidth/2 - 10);
    edgeShapeLeft.lineTo(0, -trackWidth/2 - 10);
    edgeShapeLeft.lineTo(0, -trackWidth/2);
    edgeShapeLeft.lineTo(12, -trackWidth/2);

    const edgeShapeRight = new THREE.Shape();
    edgeShapeRight.moveTo(12, trackWidth/2);
    edgeShapeRight.lineTo(0, trackWidth/2);
    edgeShapeRight.lineTo(0, trackWidth/2 + 10);
    edgeShapeRight.lineTo(12, trackWidth/2 + 10);

    const leftGeom = new THREE.ExtrudeGeometry(edgeShapeLeft, extrudeSettings);
    const rightGeom = new THREE.ExtrudeGeometry(edgeShapeRight, extrudeSettings);
    
    const edgeMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    const leftMesh = new THREE.Mesh(leftGeom, edgeMat);
    const rightMesh = new THREE.Mesh(rightGeom, edgeMat);
    this.scene.add(leftMesh);
    this.scene.add(rightMesh);
    this.trackMeshes.push(leftMesh, rightMesh);

    if (propManager) {
        for (const prop of propManager.props) {
            const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(prop.color) });
            let mesh;
            if (prop.type === 'cylinder') {
                const geom = new THREE.CylinderGeometry(prop.radius, prop.radius, prop.height3D, 16);
                mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(prop.position.x, prop.height3D / 2, prop.position.y);
            } else {
                const geom = new THREE.BoxGeometry(prop.width, prop.height3D, prop.height);
                mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(prop.position.x, prop.height3D / 2, prop.position.y);
            }
            this.scene.add(mesh);
            this.trackMeshes.push(mesh);
        }
    }
  }

  createCar(id, car) {
    if (this.carMeshes.has(id)) {
        this.scene.remove(this.carMeshes.get(id).group);
    }

    const group = new THREE.Group();
    
    const toyMaterialBody = new THREE.MeshPhysicalMaterial({
        color: car.spec.color,
        metalness: 0.1,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1
    });

    const toyGlass = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.8,
        roughness: 0.2
    });
    
    // Procedural Low Poly Chassis — dimensions driven by vehicle stats
    const stats = car.spec.stats;
    // topSpeed: 380–520, weight: 0.95–1.8 physics scale, driftFactor: 0.90–0.96
    const speedNorm = stats ? Math.min((stats.topSpeed - 380) / 140, 1) : 0.5;  // 0–1
    const weightNorm = stats ? Math.min((stats.weight - 0.9) / 0.9, 1) : 0.5;  // 0–1
    const driftNorm = stats ? 1 - Math.min((stats.driftFactor - 0.88) / 0.08, 1) : 0.5; // 0–1, higher = more drift

    // Fast cars are longer and lower. Heavy cars are wider and taller.
    const width = 14 + weightNorm * 10; // 14 to 24
    const length = 28 + speedNorm * 16; // 28 to 44
    const height = 7 + weightNorm * 7;  // 7 to 14
    
    const chassisGeo = new THREE.BoxGeometry(length, height, width);
    const chassis = new THREE.Mesh(chassisGeo, toyMaterialBody);
    chassis.position.y = height / 2 + 4;
    
    // Cabin size depends on drift and handling
    const cabinLength = length * 0.4;
    const cabinWidth = width - 4;
    const cabinHeight = height * 0.7;
    const cabinGeo = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    const cabin = new THREE.Mesh(cabinGeo, toyGlass);
    cabin.position.y = height + 4;
    
    // Position cabin based on engine layout (drift cars have longer front hoods)
    cabin.position.x = -(length * 0.1) + (driftNorm * length * 0.15);
    
    // Procedural Wheels
    const wheelGeo = new THREE.CylinderGeometry(4, 4, width + 2, 8);
    wheelGeo.rotateX(Math.PI / 2); // Rotate to align cylinder along Z axis
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    const frontWheels = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheels.position.set(length / 2 - 6, 4, 0);
    
    const backWheels = new THREE.Mesh(wheelGeo, wheelMat);
    backWheels.position.set(-length / 2 + 6, 4, 0);

    // Front headlights for detail
    const lightGeo = new THREE.BoxGeometry(2, 2, width - 6);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headlights = new THREE.Mesh(lightGeo, lightMat);
    headlights.position.set(length / 2, height/2 + 4, 0);

    group.add(chassis);
    group.add(cabin);
    group.add(frontWheels);
    group.add(backWheels);
    group.add(headlights);
    
    this.scene.add(group);
    this.carMeshes.set(id, { group });
  }

  updateCar(id, car) {
    let meshObj = this.carMeshes.get(id);
    if (!meshObj) {
        this.createCar(id, car);
        meshObj = this.carMeshes.get(id);
    }
    
    const group = meshObj.group;
    
    // Calculate elevation based on track curve raycast
    let elevation = 0;
    if (this.trackCurve && this.trackMeshes.length > 1) {
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(car.body.position.x, 500, car.body.position.y),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(this.trackMeshes[1]);
        if (intersects.length > 0) {
            elevation = intersects[0].point.y;
        }
    }
    
    // Lift car slightly to perfectly rest wheels on track
    group.position.set(car.body.position.x, elevation, car.body.position.y);
    group.rotation.y = -car.body.angle; 
  }

  setGarageMode(active, previewCar) {
    this.garageMode = active;
    
    if (!this.garagePedestal) {
        const pedGeo = new THREE.CylinderGeometry(25, 28, 5, 32);
        const pedMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        this.garagePedestal = new THREE.Mesh(pedGeo, pedMat);
        this.garagePedestal.position.y = -2.5;
        this.scene.add(this.garagePedestal);
        
        // Neon ring
        const ringGeo = new THREE.TorusGeometry(25, 0.5, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0;
        this.garagePedestal.add(ring);
    }
    
    if (active && previewCar) {
        this.scene.background = new THREE.Color(0x0f1318);
        this.trackMeshes.forEach(m => m.visible = false);
        this.carMeshes.forEach((mesh, id) => {
            if (id !== 'preview') mesh.group.visible = false;
        });
        
        if (this.currentPreviewId !== previewCar.spec.id) {
            this.createCar('preview', previewCar);
            this.currentPreviewId = previewCar.spec.id;
        }
        let pMesh = this.carMeshes.get('preview');
        pMesh.group.visible = true;
        
        // Put car at center, on pedestal
        pMesh.group.position.set(0, 0, 0);
        this.garagePedestal.visible = true;
        
        // Setup garage camera
        this.camera.position.set(40, 20, 50);
        this.camera.lookAt(0, 0, 0);
    } else {
        this.scene.background = new THREE.Color(0x87CEEB);
        this.trackMeshes.forEach(m => m.visible = true);
        this.carMeshes.forEach((mesh, id) => {
            if (id !== 'preview') mesh.group.visible = true;
        });
        if (this.carMeshes.has('preview')) {
            this.carMeshes.get('preview').group.visible = false;
        }
        this.garagePedestal.visible = false;
    }
  }

  updateCamera(car, dt) {
    if (this.garageMode) return;

    const chaseDist = 120;
    const height = 50;
    
    const carGroup = this.carMeshes.get('player')?.group;
    if (!carGroup) return;
    
    const carPos = carGroup.position.clone();
    let targetAngle = -car.body.angle;
    
    // Smooth angle interpolation — factor 0.8 means camera lazily chases the car's heading
    // so sharp turns don't whip the view. Increase toward 5.0 for tighter follow.
    let diff = targetAngle - this.cameraAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.cameraAngle += diff * (0.8 * dt);
    
    const dx = Math.cos(this.cameraAngle) * -chaseDist;
    const dz = Math.sin(this.cameraAngle) * -chaseDist;
    
    const idealPos = new THREE.Vector3(carPos.x + dx, carPos.y + height, carPos.z + dz);
    
    // Slower lerp for a much smoother, less aggressive follow
    this.camera.position.lerp(idealPos, 3.5 * dt);
    
    const lookAtPos = new THREE.Vector3(
        carPos.x + Math.cos(this.cameraAngle) * 50,
        carPos.y,
        carPos.z + Math.sin(this.cameraAngle) * 50
    );
    this.cameraLookAt.lerp(lookAtPos, 6.0 * dt);
    this.camera.lookAt(this.cameraLookAt);
  }
}
