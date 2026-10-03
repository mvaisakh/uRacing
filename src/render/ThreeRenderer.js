import * as THREE from 'three';
import { CAR_MODELS_DATA } from '../vehicles/CarModelsData.js';
import { PropTextureGenerator } from './PropTextureGenerator.js';

export class ThreeRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.propTexGen = new PropTextureGenerator();
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
    this.modelGeometries = new Map();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(canvasWidth, canvasHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
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
    
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(100, 300, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 1500;
    this.dirLight.shadow.camera.left = -600;
    this.dirLight.shadow.camera.right = 600;
    this.dirLight.shadow.camera.top = 600;
    this.dirLight.shadow.camera.bottom = -600;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Dedicated Garage Studio Lighting Group
    this.garageLights = new THREE.Group();
    const garageKey = new THREE.DirectionalLight(0xfff5ea, 1.25);
    garageKey.position.set(50, 75, 60);
    garageKey.castShadow = true;
    garageKey.shadow.mapSize.width = 1024;
    garageKey.shadow.mapSize.height = 1024;
    garageKey.shadow.camera.near = 10;
    garageKey.shadow.camera.far = 250;
    garageKey.shadow.camera.left = -40;
    garageKey.shadow.camera.right = 40;
    garageKey.shadow.camera.top = 40;
    garageKey.shadow.camera.bottom = -40;
    garageKey.shadow.bias = -0.0005;
    this.garageLights.add(garageKey);

    const garageFill = new THREE.DirectionalLight(0x9fc5e8, 0.7);
    garageFill.position.set(-60, 45, 30);
    this.garageLights.add(garageFill);

    const garageRim = new THREE.DirectionalLight(0xffffff, 0.95);
    garageRim.position.set(0, 50, -60);
    this.garageLights.add(garageRim);

    const garageSpot = new THREE.PointLight(0x00f2fe, 1.2, 80);
    garageSpot.position.set(0, 3, 0);
    this.garageLights.add(garageSpot);

    this.garageLights.visible = false;
    this.scene.add(this.garageLights);

    this.carMeshes = new Map();
    this.trackMeshes = [];
    this.garageMode = false;

    this.trackSurface = null;   // the actual orange track mesh for raycasting
    this.groundMesh   = null;   // fallback flat ground for out-of-track raycasts
    this.trackCurve   = null;
    this.cameraLookAt = new THREE.Vector3();
    this.cameraAngle  = 0;

    // 3D Tire Smoke Particles
    this.smokePool = [];
    this.maxSmoke = 120;
    this.smokeGroup = new THREE.Group();
    const smokeGeo = new THREE.DodecahedronGeometry(1.6, 0);
    const smokeMat = new THREE.MeshLambertMaterial({
      color: 0xd8dde4,
      transparent: true,
      opacity: 0.4
    });
    for (let i = 0; i < this.maxSmoke; i++) {
      const sm = new THREE.Mesh(smokeGeo, smokeMat.clone());
      sm.visible = false;
      this.smokeGroup.add(sm);
      this.smokePool.push({
        mesh: sm,
        life: 0,
        maxLife: 1,
        vel: new THREE.Vector3(),
        rotSpeed: 0
      });
    }
    this.scene.add(this.smokeGroup);

    // 3D Tire Skidmarks (quad ribbons along track surface)
    this.maxSkidSegments = 400;
    this.skidIndex = 0;
    this.skidPositions = new Float32Array(this.maxSkidSegments * 6 * 3);
    this.skidAlphas = new Float32Array(this.maxSkidSegments * 6);
    this.skidGeo = new THREE.BufferGeometry();
    this.skidPosAttr = new THREE.BufferAttribute(this.skidPositions, 3);
    this.skidAlphaAttr = new THREE.BufferAttribute(this.skidAlphas, 1);
    this.skidGeo.setAttribute('position', this.skidPosAttr);
    this.skidGeo.setAttribute('alpha', this.skidAlphaAttr);
    this.skidMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(0.12, 0.12, 0.15, vAlpha * 0.55);
        }
      `
    });
    this.skidMesh = new THREE.Mesh(this.skidGeo, this.skidMat);
    this.scene.add(this.skidMesh);
    this.lastWheels = new Map();
  }

  resize(w, h) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(dt = 0.016) {
    if (!this.garageMode) {
      this._updateSmoke(dt);
      this._fadeSkidmarks(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _emitSmoke(x, y, z, baseVelX, baseVelZ) {
    for (const p of this.smokePool) {
      if (p.life <= 0) {
        p.life = 0.45 + Math.random() * 0.3;
        p.maxLife = p.life;
        p.mesh.position.set(
          x + (Math.random() - 0.5) * 2,
          y + 0.8 + Math.random() * 1.2,
          z + (Math.random() - 0.5) * 2
        );
        p.mesh.scale.setScalar(0.7 + Math.random() * 0.5);
        p.mesh.visible = true;
        p.vel.set(
          baseVelX * 0.06 + (Math.random() - 0.5) * 12,
          8 + Math.random() * 12,
          baseVelZ * 0.06 + (Math.random() - 0.5) * 12
        );
        p.rotSpeed = (Math.random() - 0.5) * 4;
        break;
      }
    }
  }

  _updateSmoke(dt) {
    for (const p of this.smokePool) {
      if (p.life > 0) {
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mesh.rotation.y += p.rotSpeed * dt;
          const progress = 1 - (p.life / p.maxLife);
          const s = 0.8 + progress * 2.2;
          p.mesh.scale.set(s, s * 0.8, s);
          p.mesh.material.opacity = (p.life / p.maxLife) * 0.4;
        }
      }
    }
  }

  _addSkidQuad(p1, p2, width = 2.4, alpha = 0.75) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    if (dir.lengthSq() < 0.1) return;

    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(width / 2);

    const v0 = new THREE.Vector3().addVectors(p1, perp);
    const v1 = new THREE.Vector3().subVectors(p1, perp);
    const v2 = new THREE.Vector3().subVectors(p2, perp);
    const v3 = new THREE.Vector3().addVectors(p2, perp);

    const base = this.skidIndex * 18;
    const aBase = this.skidIndex * 6;

    const pos = this.skidPositions;
    pos[base + 0] = v0.x; pos[base + 1] = v0.y; pos[base + 2] = v0.z;
    pos[base + 3] = v1.x; pos[base + 4] = v1.y; pos[base + 5] = v1.z;
    pos[base + 6] = v2.x; pos[base + 7] = v2.y; pos[base + 8] = v2.z;

    pos[base + 9]  = v0.x; pos[base + 10] = v0.y; pos[base + 11] = v0.z;
    pos[base + 12] = v2.x; pos[base + 13] = v2.y; pos[base + 14] = v2.z;
    pos[base + 15] = v3.x; pos[base + 16] = v3.y; pos[base + 17] = v3.z;

    const al = this.skidAlphas;
    for (let k = 0; k < 6; k++) {
      al[aBase + k] = alpha;
    }

    this.skidPosAttr.needsUpdate = true;
    this.skidAlphaAttr.needsUpdate = true;
    this.skidIndex = (this.skidIndex + 1) % this.maxSkidSegments;
  }

  _fadeSkidmarks(dt) {
    let updated = false;
    for (let i = 0; i < this.skidAlphas.length; i++) {
      if (this.skidAlphas[i] > 0) {
        this.skidAlphas[i] = Math.max(0, this.skidAlphas[i] - 0.02 * dt * 60);
        updated = true;
      }
    }
    if (updated) this.skidAlphaAttr.needsUpdate = true;
  }

  clearParticles() {
    for (const p of this.smokePool) {
      p.life = 0;
      p.mesh.visible = false;
    }
    this.skidAlphas.fill(0);
    this.skidAlphaAttr.needsUpdate = true;
    this.lastWheels.clear();
  }

  clearCars(keepPreview = true) {
    this.carMeshes.forEach((meshObj, id) => {
      if (keepPreview && id === 'preview') return;
      this.scene.remove(meshObj.group);
    });
    if (keepPreview) {
      const prev = this.carMeshes.get('preview');
      this.carMeshes.clear();
      if (prev) this.carMeshes.set('preview', prev);
    } else {
      this.carMeshes.clear();
    }
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
      },
      playroom: {
        sky: 0x93b7be,        // soft nursery blue
        ground: 0x3d5a80,     // patterned carpet floor
        groundAlt: 0x293241,  // carpet weave pattern
        fogColor: 0x93b7be,
        fogNear: 700, fogFar: 2800,
        stripeTile: 120
      },
      office: {
        sky: 0xe0e1dd,        // clean indoor studio light
        ground: 0x415a77,     // cutting mat / drafting board
        groundAlt: 0x1b263b,  // drafting grid lines
        fogColor: 0xe0e1dd,
        fogNear: 800, fogFar: 3200,
        stripeTile: 60
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
    this.groundMesh = gMesh; // keep a dedicated ref for fallback raycast
    this.trackMeshes.push(gMesh);

    // Decorative surface stripes (wood planks / grid / tiles)
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
    } else if (envKey === 'playroom') {
      this._addPlayroomDecor();
    } else {
      this._addOfficeDecor();
    }
  }

  _addKitchenDecor() {
    // Ceramic Coffee Mugs with handles
    const mugMat = new THREE.MeshLambertMaterial({ color: 0xfdfbf7 });
    const coffeeMat = new THREE.MeshLambertMaterial({ color: 0x3d2314 });
    [[-900, -800], [1300, 600]].forEach(([x, z]) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(55, 50, 110, 20), mugMat);
      mug.position.set(x, 55, z);
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(51, 51, 6, 20), coffeeMat);
      liquid.position.set(x, 102, z);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(32, 8, 8, 16), mugMat);
      handle.position.set(x + 55, 55, z);
      handle.rotation.y = Math.PI / 2;
      this.scene.add(mug); this.scene.add(liquid); this.scene.add(handle);
      this.trackMeshes.push(mug, liquid, handle);
    });

    // Soda cans with aluminum pull tabs
    const canMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const silverMat = new THREE.MeshLambertMaterial({ color: 0xdcdde1 });
    [[-1300, 400], [700, -950]].forEach(([x, z]) => {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(38, 38, 125, 20), canMat);
      can.position.set(x, 62.5, z);
      const topRim = new THREE.Mesh(new THREE.CylinderGeometry(36, 38, 10, 20), silverMat);
      topRim.position.set(x, 120, z);
      this.scene.add(can); this.scene.add(topRim);
      this.trackMeshes.push(can, topRim);
    });

    // Kitchen Cutting Board
    const board = new THREE.Mesh(new THREE.BoxGeometry(650, 18, 420), new THREE.MeshLambertMaterial({ color: 0xc49a6c }));
    board.position.set(1600, 9, -1100);
    this.scene.add(board);
    this.trackMeshes.push(board);
  }

  _addWorkshopDecor() {
    // Metal nuts and bolts
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x8a95a5 });
    [[900, -800], [-1300, 600], [200, 1400]].forEach(([x, z]) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 110, 6), metalMat);
      bolt.position.set(x, 55, z);
      const nut = new THREE.Mesh(new THREE.TorusGeometry(38, 14, 6, 6), metalMat);
      nut.rotation.x = Math.PI / 2;
      nut.position.set(x, 115, z);
      this.scene.add(bolt); this.scene.add(nut);
      this.trackMeshes.push(bolt, nut);
    });
    // Paint can with handle
    const paintMat = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    const paint = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 120, 24), paintMat);
    paint.position.set(-1500, 60, -700);
    this.scene.add(paint);
    this.trackMeshes.push(paint);
  }

  _addGardenDecor() {
    // Terracotta Flower Pots
    const terraMat = new THREE.MeshLambertMaterial({ color: 0xc05621 });
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x271c16 });
    [[-1100, -700], [1300, 800], [-600, 1300]].forEach(([x, z]) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(60, 42, 100, 18), terraMat);
      pot.position.set(x, 50, z);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, 10, 18), soilMat);
      soil.position.set(x, 96, z);
      this.scene.add(pot); this.scene.add(soil);
      this.trackMeshes.push(pot, soil);
    });
    // River Pebbles
    const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x718096 });
    for (let i = 0; i < 24; i++) {
      const r = 20 + (i % 5) * 6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), pebbleMat);
      p.scale.set(1.4, 0.45, 1.1);
      const angle = (i / 24) * Math.PI * 2;
      p.position.set(Math.cos(angle) * 1600 + (i % 3) * 100, 8, Math.sin(angle) * 1600 + (i % 4) * 80);
      this.scene.add(p);
      this.trackMeshes.push(p);
    }
  }

  _addPlayroomDecor() {
    // Wooden Toy Building Blocks (cubes & pyramids)
    const colors = [0xe53e3e, 0x3182ce, 0xd69e2e, 0x38a169];
    [[-1000, -800], [-850, -800], [1200, 700], [1350, 700], [500, -1300]].forEach(([x, z], idx) => {
      const mat = new THREE.MeshLambertMaterial({ color: colors[idx % colors.length] });
      const block = new THREE.Mesh(new THREE.BoxGeometry(90, 90, 90), mat);
      block.position.set(x, 45, z);
      this.scene.add(block);
      this.trackMeshes.push(block);
    });
  }

  _addOfficeDecor() {
    // Pencil cup with colored pencils
    const cupMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 110, 20), cupMat);
    cup.position.set(-1100, 55, -900);
    this.scene.add(cup);
    this.trackMeshes.push(cup);

    // Sticky Note Pad stacks
    const padMat = new THREE.MeshLambertMaterial({ color: 0xf6e05e });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(110, 35, 110), padMat);
    pad.position.set(1200, 17.5, 600);
    this.scene.add(pad);
    this.trackMeshes.push(pad);
  }

  _buildDetailedProp(prop) {
    const group = new THREE.Group();
    const mainMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(prop.color) });
    const silverMat = new THREE.MeshLambertMaterial({ color: 0xdcdde1 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2f3640 });

    if (prop.type === 'cylinder') {
      const r = prop.radius;
      const h = prop.height3D;
      
      // Main can/bottle body
      const bodyGeo = new THREE.CylinderGeometry(r, r, h, 20);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = h / 2;
      group.add(body);

      // Top silver rim / cap
      const rimGeo = new THREE.CylinderGeometry(r * 0.94, r, h * 0.08, 20);
      const rim = new THREE.Mesh(rimGeo, silverMat);
      rim.position.y = h * 0.96;
      group.add(rim);

      // Bottom rim
      const botRim = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h * 0.06, 20), silverMat);
      botRim.position.y = h * 0.03;
      group.add(botRim);
    } else {
      // Box prop: e.g. motor oil, battery pack, sponge, paper ream
      const w = prop.width;
      const d = prop.height; // depth
      const h = prop.height3D;

      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.y = h / 2;
      group.add(body);

      // Top lid / label accent
      const lidGeo = new THREE.BoxGeometry(w * 0.96, h * 0.12, d * 0.96);
      const lid = new THREE.Mesh(lidGeo, darkMat);
      lid.position.y = h * 0.94;
      group.add(lid);
    }

    group.position.set(prop.position.x, 0, prop.position.y);
    return group;
  }

  _buildTrackRibbon(splineSamples, trackWidth, elevFn) {
    const N = splineSamples.length;
    const halfW = trackWidth / 2;
    const thickness = 4;
    const edgeW = 8;
    const edgeH = 10;

    const trackPositions = [];
    const trackUvs = [];
    const trackIndices = [];

    const leftPositions = [];
    const leftIndices = [];
    const rightPositions = [];
    const rightIndices = [];

    for (let i = 0; i < N; i++) {
      const s = splineSamples[i];
      const p = i / N;
      const y = elevFn(p);
      const nx = s.normal.x;
      const nz = s.normal.y;

      const tlX = s.point.x - nx * halfW;
      const tlZ = s.point.y - nz * halfW;
      const trX = s.point.x + nx * halfW;
      const trZ = s.point.y + nz * halfW;

      trackPositions.push(
        tlX, y, tlZ,
        trX, y, trZ,
        tlX, y - thickness, tlZ,
        trX, y - thickness, trZ
      );
      trackUvs.push(0, p, 1, p, 0, p, 1, p);

      const outLeftX = s.point.x - nx * (halfW + edgeW);
      const outLeftZ = s.point.y - nz * (halfW + edgeW);
      leftPositions.push(
        tlX, y, tlZ,
        tlX, y + edgeH, tlZ,
        outLeftX, y + edgeH, outLeftZ,
        outLeftX, y, outLeftZ
      );

      const outRightX = s.point.x + nx * (halfW + edgeW);
      const outRightZ = s.point.y + nz * (halfW + edgeW);
      rightPositions.push(
        trX, y, trZ,
        trX, y + edgeH, trZ,
        outRightX, y + edgeH, outRightZ,
        outRightX, y, outRightZ
      );

      const next = (i + 1) % N;
      const curV = i * 4;
      const nextV = next * 4;

      trackIndices.push(
        curV, curV + 1, nextV + 1,
        curV, nextV + 1, nextV
      );
      trackIndices.push(
        curV + 2, nextV + 3, curV + 3,
        curV + 2, nextV + 2, nextV + 3
      );
      trackIndices.push(
        curV, nextV, nextV + 2,
        curV, nextV + 2, curV + 2
      );
      trackIndices.push(
        curV + 1, curV + 3, nextV + 3,
        curV + 1, nextV + 3, nextV + 1
      );

      leftIndices.push(
        curV, nextV + 1, curV + 1,
        curV, nextV, nextV + 1
      );
      leftIndices.push(
        curV + 1, nextV + 2, curV + 2,
        curV + 1, nextV + 1, nextV + 2
      );
      leftIndices.push(
        curV + 2, nextV + 3, curV + 3,
        curV + 2, nextV + 2, nextV + 3
      );

      rightIndices.push(
        curV, curV + 1, nextV + 1,
        curV, nextV + 1, nextV
      );
      rightIndices.push(
        curV + 1, curV + 2, nextV + 2,
        curV + 1, nextV + 2, nextV + 1
      );
      rightIndices.push(
        curV + 2, curV + 3, nextV + 3,
        curV + 2, nextV + 3, nextV + 2
      );
    }

    const trackGeom = new THREE.BufferGeometry();
    trackGeom.setAttribute('position', new THREE.Float32BufferAttribute(trackPositions, 3));
    trackGeom.setAttribute('uv', new THREE.Float32BufferAttribute(trackUvs, 2));
    trackGeom.setIndex(trackIndices);
    trackGeom.computeVertexNormals();

    const leftGeom = new THREE.BufferGeometry();
    leftGeom.setAttribute('position', new THREE.Float32BufferAttribute(leftPositions, 3));
    leftGeom.setIndex(leftIndices);
    leftGeom.computeVertexNormals();

    const rightGeom = new THREE.BufferGeometry();
    rightGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightPositions, 3));
    rightGeom.setIndex(rightIndices);
    rightGeom.computeVertexNormals();

    return { trackGeom, leftGeom, rightGeom };
  }

  buildEnvironment(trackConfig, splineSamples, trackBarriers, propManager) {
    this.trackMeshes.forEach(m => this.scene.remove(m));
    this.trackMeshes = [];

    // Themed toy-world environment
    this._buildThemeEnvironment(trackConfig.environment || 'kitchen');

    if (!splineSamples || splineSamples.length === 0) return;

    // Lift the whole track 3 units above the ground plane (which is at Y=-3).
    const trackBaseY = 3;
    const totalLen = splineSamples.length;

    // Trackmania-style elevation profile — smooth sin() easing between sections.
    const elevFn = (p) => {
        const ease = (t) => (1 - Math.cos(t * Math.PI)) / 2;

        if (p < 0.10)                    return trackBaseY;                        // flat start straight
        if (p < 0.20) { const t = (p - 0.10) / 0.10; return trackBaseY + ease(t) * 20; } // rise
        if (p < 0.28)                    return trackBaseY + 20;                   // elevated plateau
        if (p < 0.36) { const t = (p - 0.28) / 0.08; return trackBaseY + 20 + ease(t) * 30; } // launch ramp
        if (p < 0.40)                    return trackBaseY + 50;                   // ramp lip (airtime zone)
        if (p < 0.48) { const t = (p - 0.40) / 0.08; return trackBaseY + 50 - ease(t) * 55; } // drop
        if (p < 0.55)                    return trackBaseY - 5;                    // valley floor
        if (p < 0.62) { const t = (p - 0.55) / 0.07; return trackBaseY - 5 + ease(t) * 35; } // second ramp
        if (p < 0.68)                    return trackBaseY + 30;                   // second peak
        if (p < 0.80) { const t = (p - 0.68) / 0.12; return trackBaseY + 30 - ease(t) * 30; } // descent
        if (p < 0.90)                    return trackBaseY;                        // flat approach
        if (p < 1.00) { const t = (p - 0.90) / 0.10; return trackBaseY; }        // smooth close
        return trackBaseY;
    };

    const trackWidth = trackConfig.trackWidth || 140;
    const { trackGeom, leftGeom, rightGeom } = this._buildTrackRibbon(splineSamples, trackWidth, elevFn);

    const trackMat = new THREE.MeshLambertMaterial({ color: 0xff6600, side: THREE.DoubleSide });
    const trackMesh = new THREE.Mesh(trackGeom, trackMat);
    trackMesh.receiveShadow = true;
    this.trackSurface = trackMesh; // dedicated ref used by raycast in updateCar
    this.scene.add(trackMesh);
    this.trackMeshes.push(trackMesh);

    const edgeMat = new THREE.MeshLambertMaterial({ color: 0xcc0000, side: THREE.DoubleSide });
    const leftMesh = new THREE.Mesh(leftGeom, edgeMat);
    const rightMesh = new THREE.Mesh(rightGeom, edgeMat);
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    this.scene.add(leftMesh);
    this.scene.add(rightMesh);
    this.trackMeshes.push(leftMesh, rightMesh);

    // Detailed miniature tabletop props (soda cans with pull-tabs, coffee mugs, oil containers)
    if (propManager) {
        for (const prop of propManager.props) {
            const propMeshGroup = this._buildDetailedProp(prop);
            this.scene.add(propMeshGroup);
            this.trackMeshes.push(propMeshGroup);
        }
    }

    // Start / Finish Line Ground Markings & Overhead Gantry Arch
    this._buildStartFinishArch(splineSamples, trackWidth, elevFn);

    // Procedural Road-Rash style dense roadside item scattering (pencils, erasers, sharpeners, paints, utensils, vegetables)
    this._scatterProceduralFlatProps(splineSamples, trackWidth, trackConfig.environment || 'kitchen');
  }

  _buildStartFinishArch(splineSamples, trackWidth, elevFn) {
    if (!splineSamples || splineSamples.length === 0) return;

    const s0 = splineSamples[0];
    const pt = s0.point;
    const norm = s0.normal;
    const tan = s0.tangent;
    const baseElev = elevFn ? elevFn(0) : 3;

    const halfW = trackWidth / 2;
    const archH = 75;
    const postRadius = 4.2;
    const spanW = trackWidth + 18;

    const archGroup = new THREE.Group();

    // 1. Checkered Start/Finish Ground Decal Ribbon
    const checkCanvas = document.createElement('canvas');
    checkCanvas.width = 128;
    checkCanvas.height = 32;
    const cctx = checkCanvas.getContext('2d');
    const cols = 8;
    const rows = 2;
    const cellW = 128 / cols;
    const cellH = 32 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cctx.fillStyle = ((r + c) % 2 === 0) ? '#ffffff' : '#111111';
        cctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
    // Red/White start accent stripes on front and back
    cctx.fillStyle = '#ff0000';
    cctx.fillRect(0, 0, 128, 3);
    cctx.fillRect(0, 29, 128, 3);

    const checkTex = new THREE.CanvasTexture(checkCanvas);
    checkTex.wrapS = THREE.RepeatWrapping;
    checkTex.wrapT = THREE.RepeatWrapping;
    checkTex.repeat.set(4, 1);

    const checkMat = new THREE.MeshLambertMaterial({
      map: checkTex,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    const groundMarkingGeo = new THREE.PlaneGeometry(trackWidth * 0.98, 22);
    const groundMarking = new THREE.Mesh(groundMarkingGeo, checkMat);
    groundMarking.rotation.x = -Math.PI / 2;
    groundMarking.position.set(0, 0.4, 0); // slightly above track surface
    archGroup.add(groundMarking);

    // 2. Metal Truss Support Pillars on Left & Right Margins
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x3d4451,
      metalness: 0.85,
      roughness: 0.25
    });
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x1e272e,
      metalness: 0.7,
      roughness: 0.3
    });
    const padMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f }); // yellow hazard base pads

    [-1, 1].forEach((side) => {
      const px = side * (halfW + 9);

      // Heavy hazard base pedestal
      const padGeo = new THREE.BoxGeometry(16, 8, 16);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, 4, 0);
      pad.castShadow = true;
      pad.receiveShadow = true;
      archGroup.add(pad);

      // Main vertical upright column
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, archH, 16);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, archH / 2 + 6, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      archGroup.add(post);

      // Secondary structural truss rod
      const strutGeo = new THREE.CylinderGeometry(postRadius * 0.55, postRadius * 0.55, archH * 0.92, 10);
      const strut = new THREE.Mesh(strutGeo, trussMat);
      strut.position.set(px - side * 4, archH / 2 + 6, -5);
      strut.castShadow = true;
      archGroup.add(strut);
    });

    // 3. Horizontal Overhead Crossbar Truss
    const barGeo = new THREE.BoxGeometry(spanW, 8, 12);
    const bar = new THREE.Mesh(barGeo, trussMat);
    bar.position.set(0, archH + 6, 0);
    bar.castShadow = true;
    archGroup.add(bar);

    // 4. Overhead Gantry Signboard (Double-sided START / FINISH)
    const signW = Math.min(180, trackWidth * 0.88);
    const signH = 26;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');

    // Sign background with checkered header strip
    sctx.fillStyle = '#0f172a';
    sctx.fillRect(0, 0, 512, 128);

    // Top checkered strip
    const signCols = 16;
    const scw = 512 / signCols;
    for (let c = 0; c < signCols; c++) {
      sctx.fillStyle = (c % 2 === 0) ? '#ffffff' : '#e74c3c';
      sctx.fillRect(c * scw, 0, scw, 14);
      sctx.fillRect(c * scw, 114, scw, 14);
    }

    // Neon START / FINISH letters
    sctx.fillStyle = '#00f2fe';
    sctx.font = 'bold 54px "Impact", sans-serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.shadowColor = '#00f2fe';
    sctx.shadowBlur = 18;
    sctx.fillText('START  🏁  FINISH', 256, 64);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.3,
      metalness: 0.2
    });

    const signGeo = new THREE.BoxGeometry(signW, signH, 4);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, archH + 6, 0);
    signMesh.castShadow = true;
    archGroup.add(signMesh);

    // 5. Overhead Floodlights & Starting Lights (Green & Amber & Red pods)
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 }); // bright racing green
    const lampHousingMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const podW = 50;
    const podH = 12;
    const podGeo = new THREE.BoxGeometry(podW, podH, 8);
    const pod = new THREE.Mesh(podGeo, lampHousingMat);
    pod.position.set(0, archH - 12, 0);
    archGroup.add(pod);

    [-18, -6, 6, 18].forEach((lx) => {
      const bulbGeo = new THREE.SphereGeometry(3.5, 12, 8);
      const bulb = new THREE.Mesh(bulbGeo, lampMat);
      bulb.position.set(lx, archH - 12, 4);
      archGroup.add(bulb);
    });

    // Orient arch group to match track heading at sample 0
    const angle = Math.atan2(tan.y, tan.x);
    archGroup.position.set(pt.x, baseElev, pt.y);
    archGroup.rotation.y = -angle + Math.PI / 2;

    this.scene.add(archGroup);
    this.trackMeshes.push(archGroup);
  }

  _scatterProceduralFlatProps(splineSamples, trackWidth, env) {
    if (!splineSamples || splineSamples.length === 0) return;

    // Pick prop families based on environment
    let propPool = [];
    if (env === 'kitchen') {
      propPool = [
        { type: 'utensil', variants: [0, 1, 2], w: 32, h: 32 },
        { type: 'vegetable', variants: [0, 1, 2], w: 30, h: 30 },
        { type: 'pencil', variants: [0, 1], w: 28, h: 28 }
      ];
    } else if (env === 'workshop') {
      propPool = [
        { type: 'paint', variants: [0, 1, 2], w: 30, h: 30 },
        { type: 'pencil', variants: [0, 1, 2], w: 28, h: 28 },
        { type: 'eraser', variants: [0, 1], w: 26, h: 26 }
      ];
    } else if (env === 'playroom') {
      propPool = [
        { type: 'pencil', variants: [0, 1, 2], w: 30, h: 30 },
        { type: 'sharpener', variants: [0, 1, 2], w: 26, h: 26 },
        { type: 'eraser', variants: [0, 1, 2], w: 26, h: 26 }
      ];
    } else if (env === 'office') {
      propPool = [
        { type: 'pencil', variants: [0, 1, 2], w: 30, h: 30 },
        { type: 'eraser', variants: [0, 1, 2], w: 26, h: 26 },
        { type: 'sharpener', variants: [0, 1, 2], w: 26, h: 26 }
      ];
    } else { // garden
      propPool = [
        { type: 'vegetable', variants: [0, 1, 2], w: 32, h: 32 },
        { type: 'utensil', variants: [0, 1], w: 28, h: 28 },
        { type: 'pencil', variants: [0, 2], w: 28, h: 28 }
      ];
    }

    // Deterministic pseudo-random number generator from index
    const pseudoRand = (seed) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const halfTrack = trackWidth / 2;
    const numSamples = splineSamples.length;
    // Step along the spline track in increments of ~4-5 samples
    const step = 4;

    for (let i = 0; i < numSamples; i += step) {
      const s = splineSamples[i];
      const p = s.point;
      const n = s.normal; // perpendicular 2D vector

      // Scatter on left and right borders of track
      [-1, 1].forEach((side) => {
        const seed = i * 7 + (side > 0 ? 1000 : 2000);
        // Random probability to spawn: ~65% chance per node for dense Road-Rash feel
        if (pseudoRand(seed) > 0.65) return;

        // Mathematical offset from track border: between +25 and +110 units outward
        const distOutward = halfTrack + 25 + pseudoRand(seed + 1) * 90;
        const posX = p.x + n.x * side * distOutward;
        const posZ = p.y + n.y * side * distOutward;

        // Tangent jitter so items aren't in a rigid straight line
        const jitterTan = (pseudoRand(seed + 2) - 0.5) * 35;
        const finalX = posX + s.tangent.x * jitterTan;
        const finalZ = posZ + s.tangent.y * jitterTan;

        // Raycast elevation from track surface / ground
        let elev = 0;
        const raycaster = new THREE.Raycaster(
          new THREE.Vector3(finalX, 300, finalZ),
          new THREE.Vector3(0, -1, 0)
        );
        if (this.trackSurface) {
          const hits = raycaster.intersectObject(this.trackSurface);
          if (hits.length > 0) elev = hits[0].point.y;
          else if (this.groundMesh) {
            const gHits = raycaster.intersectObject(this.groundMesh);
            if (gHits.length > 0) elev = gHits[0].point.y;
          }
        }

        // Pick prop definition & variant
        const propChoice = propPool[Math.floor(pseudoRand(seed + 3) * propPool.length)];
        const variant = propChoice.variants[Math.floor(pseudoRand(seed + 4) * propChoice.variants.length)];
        const texture = this.propTexGen.getTexture(propChoice.type, variant);

        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMat);
        
        const scale = 0.85 + pseudoRand(seed + 5) * 0.35;
        const w = propChoice.w * scale;
        const h = propChoice.h * scale;
        sprite.scale.set(w, h, 1);
        sprite.position.set(finalX, elev + h / 2, finalZ);

        this.scene.add(sprite);
        this.trackMeshes.push(sprite);
      });
    }
  }

  _buildCarBody(group, style, L, W, H, bodyMat, darkTrimMat, glassMat, tireMat, rimMat, lightMat, amberMat, tailMat) {
    const box = (lx, ly, lz, x, y, z, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      return m;
    };

    // Four separate wheel assemblies with tires + silver hubcaps
    const addWheel = (x, y, z) => {
      const tireGeo = new THREE.CylinderGeometry(4.2, 4.2, 3.2, 12);
      tireGeo.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(x, y, z);

      const rimGeo = new THREE.CylinderGeometry(2.4, 2.4, 3.4, 10);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      tire.add(rim);

      group.add(tire);
    };

    const wY = 4.2; // Wheel center height
    const wheelOffsetZ = W / 2 + 1;
    const addFourWheels = (frontX, rearX) => {
      addWheel(frontX, wY, wheelOffsetZ);
      addWheel(frontX, wY, -wheelOffsetZ);
      addWheel(rearX, wY, wheelOffsetZ);
      addWheel(rearX, wY, -wheelOffsetZ);
    };

    // Standard low-poly detailing: side mirrors
    const addMirrors = (mX, mY, mW) => {
      box(1.5, 1.2, 1.8, mX, mY, mW / 2 + 1.2, darkTrimMat);
      box(1.5, 1.2, 1.8, mX, mY, -(mW / 2 + 1.2), darkTrimMat);
    };

    if (style === 'sedan') {
      // Reference-grade 90s low-poly sedan / executive car
      // 1. Dark bottom bumper & skirt running all around
      box(L + 1, H * 0.35, W, 0, H * 0.175 + 1.5, 0, darkTrimMat);
      // Front lower grille slit
      box(0.5, H * 0.15, W * 0.6, L / 2 + 0.6, H * 0.15 + 1.5, 0, new THREE.MeshBasicMaterial({ color: 0x050505 }));
      
      // 2. Main body hood & trunk
      box(L, H * 0.45, W, 0, H * 0.55 + 1.5, 0, bodyMat);
      
      // 3. Cabin (tapered roof with pillar framing)
      const cabL = L * 0.45;
      const cabW = W * 0.88;
      const cabH = H * 0.65;
      const cabY = H * 0.85 + cabH / 2 + 1.5;
      const cabX = -L * 0.05;
      // Glass core
      box(cabL, cabH, cabW, cabX, cabY, 0, glassMat);
      // Colored roof plate
      box(cabL + 0.5, 1, cabW + 0.5, cabX, cabY + cabH / 2 + 0.5, 0, bodyMat);
      // Window pillar trim
      box(1, cabH, cabW + 0.6, cabX + cabL / 2, cabY, 0, darkTrimMat); // A-pillar
      box(1, cabH, cabW + 0.6, cabX - cabL / 2, cabY, 0, darkTrimMat); // C-pillar

      // 4. Lights & Mirrors
      // Headlights + Amber turn signals
      box(1, H * 0.2, W * 0.25, L / 2 + 0.2, H * 0.55 + 1.5, W * 0.28, lightMat);
      box(1, H * 0.2, W * 0.25, L / 2 + 0.2, H * 0.55 + 1.5, -W * 0.28, lightMat);
      box(1.2, H * 0.2, W * 0.1, L / 2 + 0.1, H * 0.55 + 1.5, W * 0.42, amberMat);
      box(1.2, H * 0.2, W * 0.1, L / 2 + 0.1, H * 0.55 + 1.5, -W * 0.42, amberMat);
      // Taillights
      box(0.8, H * 0.2, W * 0.35, -L / 2 - 0.2, H * 0.6 + 1.5, W * 0.28, tailMat);
      box(0.8, H * 0.2, W * 0.35, -L / 2 - 0.2, H * 0.6 + 1.5, -W * 0.28, tailMat);
      
      addMirrors(cabX + cabL / 2 + 1, cabY - cabH * 0.3, W);
      addFourWheels(L / 2 - 6, -L / 2 + 6);

    } else if (style === 'sports') {
      // Exotic low-poly wedge sports car / GT
      const sH = H * 0.75;
      // Low aero splitter
      box(L + 2, sH * 0.25, W * 1.05, 0, sH * 0.12 + 1.5, 0, darkTrimMat);
      // Wedge body
      box(L, sH * 0.5, W, 0, sH * 0.45 + 1.5, 0, bodyMat);
      // Aerodynamic sloping cockpit
      const cabL = L * 0.38;
      const cabW = W * 0.82;
      const cabH = sH * 0.7;
      const cabY = sH * 0.7 + cabH / 2 + 1.5;
      const cabX = -L * 0.12;
      box(cabL, cabH, cabW, cabX, cabY, 0, glassMat);
      box(cabL, 0.8, cabW, cabX, cabY + cabH / 2 + 0.4, 0, bodyMat);
      
      // Sport rear wing spoiler
      box(3, 1, W + 2, -L / 2 + 2, cabY + 1, 0, darkTrimMat);
      box(1.5, cabY - sH * 0.5, 1, -L / 2 + 2, (cabY + sH * 0.5) / 2 + 1, W * 0.4, darkTrimMat);
      box(1.5, cabY - sH * 0.5, 1, -L / 2 + 2, (cabY + sH * 0.5) / 2 + 1, -W * 0.4, darkTrimMat);

      // Sleek slit headlights
      box(1.5, sH * 0.15, W * 0.3, L / 2 - 1, sH * 0.65 + 1.5, W * 0.25, lightMat);
      box(1.5, sH * 0.15, W * 0.3, L / 2 - 1, sH * 0.65 + 1.5, -W * 0.25, lightMat);
      // Dual rear exhaust & taillight bar
      box(0.6, sH * 0.12, W * 0.8, -L / 2 - 0.2, sH * 0.55 + 1.5, 0, tailMat);
      box(1.5, 1.2, 1.2, -L / 2 - 0.5, 2.5, W * 0.25, darkTrimMat);
      box(1.5, 1.2, 1.2, -L / 2 - 0.5, 2.5, -W * 0.25, darkTrimMat);

      addMirrors(cabX + cabL / 2, cabY - cabH * 0.2, W);
      addFourWheels(L / 2 - 6, -L / 2 + 6);

    } else if (style === 'hatchback') {
      // 90s Japanese Compact / Hot Hatch (green car in reference image 1)
      box(L + 1, H * 0.4, W, 0, H * 0.2 + 1.5, 0, darkTrimMat); // Dark bumper / skirts
      box(L, H * 0.45, W, 0, H * 0.6 + 1.5, 0, bodyMat); // Mid body
      
      // Tall hatchback cabin extending all the way to rear
      const cabL = L * 0.54;
      const cabW = W * 0.88;
      const cabH = H * 0.75;
      const cabY = H * 0.85 + cabH / 2 + 1.5;
      const cabX = -L * 0.12;
      box(cabL, cabH, cabW, cabX, cabY, 0, glassMat);
      box(cabL + 0.6, 1, cabW + 0.6, cabX, cabY + cabH / 2 + 0.5, 0, bodyMat);
      // Window frame pillars
      box(1, cabH, cabW + 0.6, cabX + cabL / 2, cabY, 0, darkTrimMat); // A-pillar
      box(1, cabH, cabW + 0.6, cabX - 1, cabY, 0, darkTrimMat); // B-pillar
      box(1.5, cabH, cabW + 0.6, cabX - cabL / 2, cabY, 0, bodyMat); // Thick C-pillar

      // Front headlights with side amber wraparounds
      box(1, H * 0.22, W * 0.25, L / 2 + 0.2, H * 0.62 + 1.5, W * 0.26, lightMat);
      box(1, H * 0.22, W * 0.25, L / 2 + 0.2, H * 0.62 + 1.5, -W * 0.26, lightMat);
      box(1.2, H * 0.22, W * 0.1, L / 2 + 0.1, H * 0.62 + 1.5, W * 0.42, amberMat);
      box(1.2, H * 0.22, W * 0.1, L / 2 + 0.1, H * 0.62 + 1.5, -W * 0.42, amberMat);
      // Vertical tail lamp clusters on rear corners
      box(0.8, H * 0.4, 2, -L / 2 - 0.2, H * 0.8 + 1.5, W * 0.42, tailMat);
      box(0.8, H * 0.4, 2, -L / 2 - 0.2, H * 0.8 + 1.5, -W * 0.42, tailMat);

      addMirrors(cabX + cabL / 2 + 1, cabY - cabH * 0.3, W);
      addFourWheels(L / 2 - 5, -L / 2 + 5);

    } else if (style === 'suv') {
      // Rugged low-poly 4x4 Utility SUV
      const sH = H * 1.25;
      const sW = W * 1.15;
      // Heavy dark cladding & bull-bar front
      box(L + 2, sH * 0.35, sW, 0, sH * 0.175 + 1.8, 0, darkTrimMat);
      box(1.2, sH * 0.45, sW * 0.6, L / 2 + 1.3, sH * 0.3 + 1.8, 0, darkTrimMat); // Front push guard
      
      // Main blocky body
      box(L, sH * 0.45, sW, 0, sH * 0.55 + 1.8, 0, bodyMat);
      
      // Tall rectangular wagon cabin
      const cabL = L * 0.58;
      const cabW = sW * 0.88;
      const cabH = sH * 0.65;
      const cabY = sH * 0.8 + cabH / 2 + 1.8;
      const cabX = -L * 0.08;
      box(cabL, cabH, cabW, cabX, cabY, 0, glassMat);
      box(cabL + 0.6, 1.2, cabW + 0.6, cabX, cabY + cabH / 2 + 0.6, 0, bodyMat); // Roof
      // Roof rack rails & crossbars
      box(cabL * 0.8, 1, 1, cabX, cabY + cabH / 2 + 1.8, cabW / 2 - 1, darkTrimMat);
      box(cabL * 0.8, 1, 1, cabX, cabY + cabH / 2 + 1.8, -cabW / 2 + 1, darkTrimMat);
      box(1, 1, cabW - 2, cabX + cabL * 0.25, cabY + cabH / 2 + 1.8, 0, darkTrimMat);
      box(1, 1, cabW - 2, cabX - cabL * 0.25, cabY + cabH / 2 + 1.8, 0, darkTrimMat);

      // Round / rectangular rugged headlights
      box(1.2, sH * 0.22, sW * 0.22, L / 2 + 0.2, sH * 0.55 + 1.8, sW * 0.3, lightMat);
      box(1.2, sH * 0.22, sW * 0.22, L / 2 + 0.2, sH * 0.55 + 1.8, -sW * 0.3, lightMat);
      box(0.8, sH * 0.3, sW * 0.25, -L / 2 - 0.2, sH * 0.65 + 1.8, sW * 0.3, tailMat);
      box(0.8, sH * 0.3, sW * 0.25, -L / 2 - 0.2, sH * 0.65 + 1.8, -sW * 0.3, tailMat);

      addMirrors(cabX + cabL / 2 + 1, cabY - cabH * 0.2, sW);
      addFourWheels(L / 2 - 6, -L / 2 + 6);

    } else {
      // Micro / Mini Commuter (chunky urban toy)
      const mL = L * 0.78;
      const mW = W * 0.92;
      const mH = H * 1.05;
      box(mL + 1, mH * 0.35, mW, 0, mH * 0.175 + 1.5, 0, darkTrimMat);
      box(mL, mH * 0.45, mW, 0, mH * 0.55 + 1.5, 0, bodyMat);
      
      const cabL = mL * 0.65;
      const cabW = mW * 0.86;
      const cabH = mH * 0.75;
      const cabY = mH * 0.8 + cabH / 2 + 1.5;
      box(cabL, cabH, cabW, 0, cabY, 0, glassMat);
      box(cabL + 0.5, 1, cabW + 0.5, 0, cabY + cabH / 2 + 0.5, 0, bodyMat);

      box(1, mH * 0.25, mW * 0.26, mL / 2 + 0.2, mH * 0.55 + 1.5, mW * 0.26, lightMat);
      box(1, mH * 0.25, mW * 0.26, mL / 2 + 0.2, mH * 0.55 + 1.5, -mW * 0.26, lightMat);
      box(0.8, mH * 0.25, mW * 0.26, -mL / 2 - 0.2, mH * 0.55 + 1.5, mW * 0.26, tailMat);
      box(0.8, mH * 0.25, mW * 0.26, -mL / 2 - 0.2, mH * 0.55 + 1.5, -mW * 0.26, tailMat);

      addMirrors(cabL / 2, cabY - cabH * 0.3, mW);
      addFourWheels(mL / 2 - 4.5, -mL / 2 + 4.5);
    }
  }

  _getModelGeometry(modelId) {
    if (this.modelGeometries.has(modelId)) {
      return this.modelGeometries.get(modelId);
    }
    const modelData = CAR_MODELS_DATA[modelId];
    if (!modelData) return null;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(modelData.mesh.positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(modelData.mesh.uvs, 2));
    if (modelData.mesh.normals && modelData.mesh.normals.length > 0) {
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(modelData.mesh.normals, 3));
    } else {
      geom.computeVertexNormals();
    }
    this.modelGeometries.set(modelId, geom);
    return geom;
  }

  _getModelTexture(modelId) {
    if (this.loadedTextures.has(modelId)) {
      return this.loadedTextures.get(modelId);
    }
    const modelData = CAR_MODELS_DATA[modelId];
    if (!modelData) return null;

    const src = modelData.textureDataUri || modelData.texture;
    if (!src) return null;

    const tex = this.textureLoader.load(src, (t) => {
      t.needsUpdate = true;
    });
    tex.flipY = true;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    this.loadedTextures.set(modelId, tex);
    return tex;
  }

  createCar(id, car) {
    if (this.carMeshes.has(id)) {
        this.scene.remove(this.carMeshes.get(id).group);
    }

    const group = new THREE.Group();
    const modelId = car.spec.modelId;

    if (modelId && CAR_MODELS_DATA[modelId]) {
      // Load and render low poly car mesh extracted from game archives
      const geom = this._getModelGeometry(modelId);
      const texture = this._getModelTexture(modelId);
      
      // Use neutral white when diffuse texture map is provided so windows, grills, lights, and livery are pristine
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: texture ? 0xffffff : new THREE.Color(car.spec.color || 0xffffff),
        roughness: 0.35,
        metalness: 0.25
      });
      const carMesh = new THREE.Mesh(geom, mat);
      carMesh.castShadow = true;
      carMesh.receiveShadow = true;
      group.add(carMesh);

      // Model-specific accessories / details
      const extra = CAR_MODELS_DATA[modelId].extra;
      if (extra === 'taxi') {
        const signGeo = new THREE.BoxGeometry(4, 2, 7);
        const signMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(-1, 14.5, 0);
        group.add(signMesh);
      } else if (extra === 'police') {
        const barGeo = new THREE.BoxGeometry(3, 1.5, 14);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(-2, 14.5, 0);
        const redGeo = new THREE.BoxGeometry(3.2, 1.6, 6);
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
        const redLight = new THREE.Mesh(redGeo, redMat);
        redLight.position.set(0, 0, 3.5);
        bar.add(redLight);
        const blueGeo = new THREE.BoxGeometry(3.2, 1.6, 6);
        const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
        const blueLight = new THREE.Mesh(blueGeo, blueMat);
        blueLight.position.set(0, 0, -3.5);
        bar.add(blueLight);
        group.add(bar);
      } else if (extra === 'rally') {
        const wingGeo = new THREE.BoxGeometry(2.5, 0.8, 18);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(-15, 13.5, 0);
        const postL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1), wingMat);
        postL.position.set(0, -2, 6);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1), wingMat);
        postR.position.set(0, -2, -6);
        wing.add(postL);
        wing.add(postR);
        group.add(wing);
      } else if (extra === 'spoiler') {
        const wingGeo = new THREE.BoxGeometry(2.8, 0.8, 20);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(-16, 12.5, 0);
        const postL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), wingMat);
        postL.position.set(0, -1.8, 7);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), wingMat);
        postR.position.set(0, -1.8, -7);
        wing.add(postL);
        wing.add(postR);
        group.add(wing);
      }

      // Add miniature toy underbody shadow plate
      const shadowGeo = new THREE.PlaneGeometry(36, 17);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.5;
      group.add(shadow);
    } else {
      // Fallback procedural detailed body
      const bodyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(car.spec.color) });
      const darkTrimMat = new THREE.MeshLambertMaterial({ color: 0x24272c });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x3d4b58 });
      const tireMat = new THREE.MeshLambertMaterial({ color: 0x181a1d });
      const rimMat = new THREE.MeshLambertMaterial({ color: 0xc8ced6 });
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const amberMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xd62828 });

      const stats = car.spec.stats;
      const speedNorm  = stats ? Math.min((stats.topSpeed  - 380) / 140, 1) : 0.5;
      const weightNorm = stats ? Math.min((stats.weight    - 0.9)  / 0.9, 1) : 0.5;
      const W = 15 + weightNorm * 7;
      const L = 29 + speedNorm  * 13;
      const H = 7.5 + weightNorm * 5;

      const style = car.spec.bodyStyle || 'sedan';
      this._buildCarBody(group, style, L, W, H, bodyMat, darkTrimMat, glassMat, tireMat, rimMat, lightMat, amberMat, tailMat);
    }

    this.scene.add(group);
    this.carMeshes.set(id, { group, velY: 0 });
  }

  updateCar(id, car, dt = 0.016) {
    let meshObj = this.carMeshes.get(id);
    if (!meshObj) {
        this.createCar(id, car);
        meshObj = this.carMeshes.get(id);
    }
    
    const group = meshObj.group;
    
    // 1. Raycast probing to find track surface elevation & tilt under front/rear wheels
    const angle = car.body.angle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const fwdX = cosA;
    const fwdZ = sinA;

    const probeDown = (px, pz) => {
      const ray = new THREE.Raycaster(new THREE.Vector3(px, 500, pz), new THREE.Vector3(0, -1, 0));
      if (this.trackSurface) {
        const hits = ray.intersectObject(this.trackSurface);
        if (hits.length > 0) {
          const norm = hits[0].face ? hits[0].face.normal.clone() : new THREE.Vector3(0, 1, 0);
          return { y: hits[0].point.y, normal: norm };
        }
      }
      if (this.groundMesh) {
        const gHits = ray.intersectObject(this.groundMesh);
        if (gHits.length > 0) return { y: gHits[0].point.y, normal: new THREE.Vector3(0, 1, 0) };
      }
      return { y: 3, normal: new THREE.Vector3(0, 1, 0) };
    };

    const posX = car.body.position.x;
    const posZ = car.body.position.y;

    const centerProbe = probeDown(posX, posZ);
    let surfaceY = centerProbe.y;

    // Probe front and rear to compute pitch slope along vehicle wheelbase
    const halfL = Math.min(14, (car.length || 34) * 0.35);
    const frontProbe = probeDown(posX + fwdX * halfL, posZ + fwdZ * halfL);
    const rearProbe  = probeDown(posX - fwdX * halfL, posZ - fwdZ * halfL);

    // Gravity: accelerate downward while airborne, clamp to surface on landing.
    const GRAVITY = 500; // units/s² — tuned for toy-car scale
    meshObj.velY -= GRAVITY * dt;
    let newY = group.position.y + meshObj.velY * dt;
    const isGrounded = newY <= surfaceY;
    if (isGrounded) {
        newY = surfaceY;
        meshObj.velY = 0; // zero velocity on landing (no bounce)
    }
    
    group.position.set(posX, newY, posZ);

    // 2. Full 3D Track Slope & Camber Alignment (Pitch & Roll)
    // Vehicle Forward Vector along track surface
    const slopeDy = (frontProbe.y - rearProbe.y) / (halfL * 2);
    const F = new THREE.Vector3(fwdX, slopeDy, fwdZ).normalize();
    
    // Average normal from center/front/rear
    let U = centerProbe.normal.clone().add(frontProbe.normal).add(rearProbe.normal).normalize();
    if (U.y < 0.2) U.set(0, 1, 0); // fallback protection

    // Orthonormal basis: F (forward), U (up), R (right)
    const R = new THREE.Vector3().crossVectors(F, U).normalize();
    U.crossVectors(R, F).normalize();

    const rotMat = new THREE.Matrix4().makeBasis(F, U, R);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

    if (isGrounded) {
      group.quaternion.slerp(targetQuat, Math.min(1, 16 * dt));
    } else {
      group.quaternion.slerp(targetQuat, Math.min(1, 6 * dt));
    }

    // 3D Smoke and Skidmarks for tire drift & slip
    if (!this.garageMode) {
      const angle = car.body.angle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const backX = -cosA * 10;
      const backZ = -sinA * 10;
      const latX = -sinA * 6.5;
      const latZ = cosA * 6.5;

      const wlPos = new THREE.Vector3(
        car.body.position.x + backX - latX,
        newY + 0.12,
        car.body.position.y + backZ - latZ
      );
      const wrPos = new THREE.Vector3(
        car.body.position.x + backX + latX,
        newY + 0.12,
        car.body.position.y + backZ + latZ
      );

      const isSlipping = car.isDrifting || Math.abs(car.lateralVelocity || 0) > 65;
      if (isSlipping) {
        this._emitSmoke(wlPos.x, wlPos.y, wlPos.z, car.body.velocity.x, car.body.velocity.y);
        this._emitSmoke(wrPos.x, wrPos.y, wrPos.z, car.body.velocity.x, car.body.velocity.y);

        const last = this.lastWheels.get(id);
        if (last) {
          this._addSkidQuad(last.wl, wlPos, 2.2, 0.75);
          this._addSkidQuad(last.wr, wrPos, 2.2, 0.75);
        }
      }
      this.lastWheels.set(id, { wl: wlPos, wr: wrPos });
    }
  }

  setGarageMode(active, previewCar) {
    this.garageMode = active;
    
    if (!this.garagePedestal) {
        const pedGeo = new THREE.CylinderGeometry(25, 28, 5, 32);
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.35, metalness: 0.5 });
        this.garagePedestal = new THREE.Mesh(pedGeo, pedMat);
        this.garagePedestal.position.y = -2.5;
        this.garagePedestal.receiveShadow = true;
        this.scene.add(this.garagePedestal);
        
        // Neon ring around pedestal base
        const ringGeo = new THREE.TorusGeometry(25, 0.6, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0;
        this.garagePedestal.add(ring);
    }
    
    if (active && previewCar) {
        this.scene.background = new THREE.Color(0x0f1318);
        this.scene.fog = null;
        if (this.dirLight) this.dirLight.visible = false;
        if (this.garageLights) this.garageLights.visible = true;
        if (this.ambientLight) this.ambientLight.intensity = 0.35;

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
        
        // Put car on rotating pedestal
        const rotY = -(previewCar.body.angle || 0);
        pMesh.group.position.set(0, 0, 0);
        pMesh.group.rotation.set(0, rotY, 0);
        this.garagePedestal.rotation.y = rotY;
        this.garagePedestal.visible = true;
        
        // Studio camera framing
        this.camera.position.set(40, 22, 50);
        this.camera.lookAt(0, 2, 0);
    } else {
        if (this.dirLight) this.dirLight.visible = true;
        if (this.garageLights) this.garageLights.visible = false;
        if (this.ambientLight) this.ambientLight.intensity = 0.6;

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
    // targetAngle must NOT be negated: cos(-θ)=cos(θ) so X is fine,
    // but sin(-θ)=-sin(θ) flips Z which puts camera in front of the car!
    let targetAngle = car.body.angle;
    
    // Lerp the camera's own angle to smoothly chase the car heading.
    // Factor 3.0 * dt ≈ 0.05/frame — responsive without snapping.
    let diff = targetAngle - this.cameraAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.cameraAngle += diff * (3.0 * dt);
    
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
