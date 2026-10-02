import * as THREE from 'three';
import { CAR_MODELS_DATA } from '../vehicles/CarModelsData.js';

export class ThreeRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
    this.modelGeometries = new Map();
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

    this.trackSurface = null;   // the actual orange track mesh for raycasting
    this.groundMesh   = null;   // fallback flat ground for out-of-track raycasts
    this.trackCurve   = null;
    this.cameraLookAt = new THREE.Vector3();
    this.cameraAngle  = 0;
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

    const pts = splineSamples.map((s, idx) => {
        const progress = idx / totalLen;
        return new THREE.Vector3(s.point.x, elevFn(progress), s.point.y);
    });
    
    const curve = new THREE.CatmullRomCurve3(pts, true);
    this.trackCurve = curve;
    
    const trackWidth = trackConfig.trackWidth || 140;
    
    // ExtrudeGeometry maps Shape X to World UP (Y), and Shape Y to World SIDE.
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
    this.trackSurface = trackMesh; // dedicated ref used by raycast in updateCar
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

    // Detailed miniature tabletop props (soda cans with pull-tabs, coffee mugs, oil containers)
    if (propManager) {
        for (const prop of propManager.props) {
            const propMeshGroup = this._buildDetailedProp(prop);
            this.scene.add(propMeshGroup);
            this.trackMeshes.push(propMeshGroup);
        }
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
    if (!modelData || !modelData.texture) return null;

    const tex = this.textureLoader.load(modelData.texture);
    tex.flipY = true;
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
      
      const mat = new THREE.MeshLambertMaterial({
        map: texture,
        color: new THREE.Color(0xffffff)
      });
      const carMesh = new THREE.Mesh(geom, mat);
      carMesh.castShadow = true;
      carMesh.receiveShadow = true;
      group.add(carMesh);

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
    
    // Raycast downward to find the track surface (or ground as fallback).
    let surfaceY = 3; // default: track base height
    const origin = new THREE.Vector3(car.body.position.x, 500, car.body.position.y);
    const down   = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(origin, down);
    
    if (this.trackSurface) {
        const hits = raycaster.intersectObject(this.trackSurface);
        if (hits.length > 0) {
            surfaceY = hits[0].point.y;
        } else if (this.groundMesh) {
            const gHits = raycaster.intersectObject(this.groundMesh);
            if (gHits.length > 0) surfaceY = gHits[0].point.y;
        }
    }
    
    // Gravity: accelerate downward while airborne, clamp to surface on landing.
    const GRAVITY = 500; // units/s² — tuned for toy-car scale
    meshObj.velY -= GRAVITY * dt;
    let newY = group.position.y + meshObj.velY * dt;
    if (newY <= surfaceY) {
        newY = surfaceY;
        meshObj.velY = 0; // zero velocity on landing (no bounce)
    }
    
    group.position.set(car.body.position.x, newY, car.body.position.y);
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
        this.scene.fog = null; // track's _buildThemeEnvironment will reset fog
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
