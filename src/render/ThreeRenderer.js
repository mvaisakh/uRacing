import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';

export class ThreeRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    document.getElementById('game-canvas').style.zIndex = '10';
    document.getElementById('game-canvas').style.pointerEvents = 'none';

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
    
    // Setup Post-Processing (2000s vibes: Bloom + subtle film grain/scanlines)
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom (Early 2000s games loved excessive bloom)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvasWidth, canvasHeight), 0.8, 0.4, 0.85);
    this.composer.addPass(bloomPass);
    
    // FilmPass (Subtle scanlines and grain for that retro monitor feel)
    // noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale
    const filmPass = new FilmPass(0.35, 0.25, 480, false);
    this.composer.addPass(filmPass);
    
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
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
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
    
    const extrudeSettings = { steps: 150, extrudePath: curve, bevelEnabled: false };
    const trackGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    trackGeom.rotateX(Math.PI / 2);
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
    leftGeom.rotateX(Math.PI / 2);
    const rightGeom = new THREE.ExtrudeGeometry(edgeShapeRight, extrudeSettings);
    rightGeom.rotateX(Math.PI / 2);
    
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
    
    // Tint the body if the model supports it
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.material.name && child.material.name.toLowerCase().includes('body')) {
                // clone material to not affect others
                child.material = child.material.clone();
                child.material.color.set(car.spec.color);
            }
        }
    });

    model.rotation.y = Math.PI / 2;
    
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
    this.composer.render();
  }
}
