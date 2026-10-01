import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

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
    
    this.carModelTemplate = null;
    const loader = new GLTFLoader();

    // Setup Draco loader for compressed GLBs
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.128.0/examples/js/libs/draco/gltf/');
    loader.setDRACOLoader(dracoLoader);

    loader.load('public/models/sedan.glb', (gltf) => {
      this.carModelTemplate = gltf.scene;
      const box = new THREE.Box3().setFromObject(this.carModelTemplate);
      const size = box.getSize(new THREE.Vector3());
      const scale = 34 / size.z;
      this.carModelTemplate.scale.set(scale, scale, scale);
      
      const center = box.getCenter(new THREE.Vector3());
      this.carModelTemplate.children.forEach(c => {
        c.position.sub(center);
        c.position.y += size.y / 2;
      });
      
      for (const [id, carData] of this.carMeshes.entries()) {
         if (carData.isPlaceholder) {
            this.createCar(id, carData.carRef);
         }
      }
    }, undefined, (e) => console.error("Failed to load car model:", e));
  }

  resize(w, h) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ... (unchanged methods) ...

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  buildEnvironment(trackConfig, splineSamples, trackBarriers, propManager) {
    this.trackMeshes.forEach(m => this.scene.remove(m));
    this.trackMeshes = [];

    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    this.scene.add(ground);
    this.trackMeshes.push(ground);

    if (!splineSamples || splineSamples.length === 0) return;

    const pts = splineSamples.map(s => new THREE.Vector3(s.point.x, 0, s.point.y));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    
    const trackWidth = trackConfig.trackWidth || 140;
    const shape = new THREE.Shape();
    shape.moveTo(-trackWidth/2, 0);
    shape.lineTo(trackWidth/2, 0);
    shape.lineTo(trackWidth/2, -4);
    shape.lineTo(-trackWidth/2, -4);
    
    const extrudeSettings = { steps: 150, extrudePath: curve, bevelEnabled: false };
    const trackGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const trackMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const trackMesh = new THREE.Mesh(trackGeom, trackMat);
    this.scene.add(trackMesh);
    this.trackMeshes.push(trackMesh);

    const edgeShapeLeft = new THREE.Shape();
    edgeShapeLeft.moveTo(-trackWidth/2 - 10, 0);
    edgeShapeLeft.lineTo(-trackWidth/2, 0);
    edgeShapeLeft.lineTo(-trackWidth/2, 12);
    edgeShapeLeft.lineTo(-trackWidth/2 - 10, 12);

    const edgeShapeRight = new THREE.Shape();
    edgeShapeRight.moveTo(trackWidth/2, 0);
    edgeShapeRight.lineTo(trackWidth/2 + 10, 0);
    edgeShapeRight.lineTo(trackWidth/2 + 10, 12);
    edgeShapeRight.lineTo(trackWidth/2, 12);

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
        if (!this.carMeshes.get(id).isPlaceholder) return;
        this.scene.remove(this.carMeshes.get(id).group);
    }

    if (!this.carModelTemplate) {
        const group = new THREE.Group();
        const geom = new THREE.BoxGeometry(car.width, 10, car.length);
        const mat = new THREE.MeshLambertMaterial({ color: car.spec.color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.y = 5;
        group.add(mesh);
        this.scene.add(group);
        this.carMeshes.set(id, { group, isPlaceholder: true, carRef: car });
        return;
    }

    const group = new THREE.Group();
    const model = this.carModelTemplate.clone();
    
    const toyMaterialBody = new THREE.MeshPhysicalMaterial({
        color: car.spec.color,
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const toyGlass = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
    });

    // Make it look like a glossy die-cast toy
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.material.name && child.material.name.toLowerCase().includes('body')) {
                child.material = toyMaterialBody;
            } else if (child.material.name && child.material.name.toLowerCase().includes('glass')) {
                child.material = toyGlass;
            } else if (child.material) {
                // Make all other parts look like cheap plastic
                child.material.roughness = 0.8;
                child.material.metalness = 0.1;
            }
        }
    });

    // Fix backwards orientation (was Math.PI / 2)
    model.rotation.y = -Math.PI / 2;
    
    group.add(model);
    this.scene.add(group);
    this.carMeshes.set(id, { group, isPlaceholder: false });
  }

  updateCar(id, car) {
    let meshObj = this.carMeshes.get(id);
    if (!meshObj) {
        this.createCar(id, car);
        meshObj = this.carMeshes.get(id);
    }
    
    const group = meshObj.group;
    group.position.set(car.body.position.x, 0, car.body.position.y);
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
        
        this.updateCar('preview', previewCar);
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
    
    const carPos = new THREE.Vector3(car.body.position.x, 0, car.body.position.y);
    const angle = -car.body.angle;
    
    const dx = Math.cos(angle) * -chaseDist;
    const dz = Math.sin(angle) * -chaseDist;
    
    const idealPos = new THREE.Vector3(carPos.x + dx, height, carPos.z + dz);
    
    this.camera.position.lerp(idealPos, 5.0 * dt);
    
    const lookAtPos = new THREE.Vector3(
        carPos.x + Math.cos(angle) * 50,
        0,
        carPos.z + Math.sin(angle) * 50
    );
    this.camera.lookAt(lookAtPos);
  }

  render() {
    // 2000s games often jitter the camera or we can just render the composer
    this.renderer.render(this.scene, this.camera);
  }
}
