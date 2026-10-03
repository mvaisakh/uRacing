# μRacing Architecture & Contributor Guide

Welcome to the **μRacing** developer documentation! This guide explains how the engine, physics, rendering, tracks, vehicles, and AI work together so contributors can understand the codebase and build new features with confidence.

---

## 🏗️ High-Level System Architecture

μRacing is written in modern **Vanilla JavaScript (ES Modules)** with **Three.js (WebGL)** for 3D world rendering and a synchronized **2D Canvas** layer for arcade HUD overlays, UI menus, and touch controls.

```
                      +-----------------------------+
                      |           main.js           |
                      |  (Bootloader & Game Loop)   |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
+--------v--------+         +--------v--------+         +--------v--------+
|  Game State &   |         | Physics & Sim   |         | Rendering & UI  |
|  Progression    |         | 60Hz Tick       |         | Hybrid WebGL/2D |
+-----------------+         +-----------------+         +-----------------+
| - GameState     |         | - RigidBody2D   |         | - ThreeRenderer |
| - VehicleRoster |         | - Colliders     |         | - Camera3D      |
| - TrackRoster   |         | - CarVsCar      |         | - ParticleSystem|
| - StorageService|         | - Checkpoints   |         | - SpeedometerHUD|
| - LapTimer      |         | - AIController  |         | - GarageUI      |
| - SoundSystem   |         | - RubberBanding |         | - TrackSelectUI |
+-----------------+         +-----------------+         +-----------------+
```

---

## 📂 Directory Layout

```
src/
├── ai/                     # AI Driver decision-making, unstick logic & rubber-banding
│   ├── AIController.js     # Path prediction, stuck detection & dynamic steering
│   └── RubberBanding.js    # Adaptive difficulty & field compression
├── audio/                  # Web Audio API procedural sound synthesizers
│   ├── SoundSystem.js      # FM synthesis, engine revs, screech & BGM sequencing
│   └── AudioSFXManager.js  # Audio event hooks (crashes, boosts, checkpoints)
├── core/                   # State orchestration, loop timing & diagnostics
│   ├── GameLoop.js         # RequestAnimationFrame loop with fixed delta clamping
│   ├── GameState.js        # Save profile, coin balances & unlocked vehicles
│   ├── RaceManager.js      # Grid positions, race start countdown & lap tracking
│   ├── Diagnostics.js      # Automated self-tests & integrity assertion suite
│   └── PerformanceMonitor.js # Frame timing & performance profiling
├── fs/                     # Local persistence layer
│   └── StorageService.js   # LocalStorage JSON serializer with key isolation
├── input/                  # Unified input polling
│   └── InputHandler.js     # Keyboard state mapping & event buffering
├── math/                   # Geometric utilities
│   └── Vec2.js             # 2D vector algebra (dot, cross, len, normalize, dist)
├── physics/                # 2D Rigid body kinematics & collision response
│   ├── RigidBody2D.js      # Velocity, angular inertia, friction & lateral drag
│   ├── Colliders.js        # Circle & capsule collider geometries
│   ├── CollisionSystem.js  # Environment prop & boundary collisions
│   ├── CarVsCarCollision.js# Dual-circle vehicle vs vehicle elastic impulse response
│   ├── DamageSystem.js     # Health points, armor mitigation, deformation & limp penalty
│   └── SpatialHashGrid.js  # Broad-phase spatial partitioning
├── powerups/               # Arcade combat weapons & power-up pickup management
│   ├── PowerUpTypes.js     # Weapon definitions (rockets, slicks, EMP, shields, boosts)
│   └── PowerUpManager.js   # Spawner pods, roulette timer, projectile physics & blast radii
├── render/                 # Three.js 3D WebGL scenes & 2D HUD overlays
│   ├── ThreeRenderer.js    # Main 3D pipeline (track ribbons, props, lighting, cars)
│   ├── Camera3D.js         # Smooth 3D chase camera with pitch/yaw & velocity tilt
│   ├── CameraShake.js      # Impact trauma & boost shudder generator
│   ├── ParticleSystem.js   # 3D drift tire smoke, spark bursts & boost trails
│   ├── SpeedometerHUD.js   # Arcade glowing digital speedometer & tachometer
│   ├── Minimap.js          # Live circuit radar with color-coded vehicle markers
│   └── PropTextureGenerator.js # Procedural canvas textures for tabletop items
├── track/                  # Spline mathematics, surface materials & circuits
│   ├── Spline.js           # Catmull-Rom closed splines with uniform sampling
│   ├── TrackRibbon.js      # Seamless 3D mesh ribbon generator
│   ├── TrackBarriers.js    # Curbs, collision rails & track barrier definitions
│   ├── SurfaceManager.js   # Friction modifiers (tarmac, curbs, off-track rugs)
│   ├── CheckpointSystem.js # Direction-aware gate progress & wrong-way detection
│   ├── LapTimer.js         # Lap splits, personal bests & delta times
│   └── TrackRoster.js      # 8 track layouts, waypoints & diorama environments
├── ui/                     # Menus, garage showroom & virtual touch controls
│   ├── GarageUI.js         # 3D showroom turntable, glassmorphic cards & LED gauges
│   ├── TrackSelectUI.js    # Visual circuit selector carousel with minimap cards
│   ├── TouchControls.js    # Mobile virtual joystick, throttle & action buttons
│   └── ControlsOverlay.js  # Keyboard binding cheat-sheet overlay
├── vehicles/               # Vehicle definitions, kinematics & 3D mesh datasets
│   ├── Car.js              # Drive dynamics, steering angle & slip angles
│   ├── CarModelsData.js    # Extracted low-poly geometry, vertex colors & UVs
│   ├── VehicleRoster.js    # 16 vehicle catalog, stats, costs & colorways
│   └── NitroSystem.js      # Boost tank capacity, recharge rate & speed multipliers
├── world/                  # Tabletop environment props & physics colliders
│   ├── PropManager.js      # Soda cans, coffee mugs, oil containers & books
│   └── WorldProp.js        # Prop positions, radii, and bounce properties
└── main.js                 # Application entry point, canvas setup & state switching
```

---

## 🏎️ Vehicle Physics Model

Vehicle dynamics live in [`src/vehicles/Car.js`](file:///Users/mvaisakh/Projects/uRacing/src/vehicles/Car.js) and [`src/physics/RigidBody2D.js`](file:///Users/mvaisakh/Projects/uRacing/src/physics/RigidBody2D.js):

1. **Bicycle Kinematic Model**:
   - The car resolves driving force along its heading vector $\vec{h} = (\cos\theta, \sin\theta)$.
   - Steering acts upon the front wheel virtual axle, rotating the heading based on vehicle speed and `steerRate`.
2. **Lateral Friction & Drifting**:
   - Velocity is decomposed into longitudinal (forward/back) and lateral (sideways) components.
   - Lateral velocity is dampened by the tire grip coefficient (`stats.grip`).
   - When the handbrake (`Space`) is triggered or lateral force exceeds tire adhesion, the grip factor drops by `driftFactor`, allowing realistic power-slides.
3. **Vehicle-vs-Vehicle Collisions**:
   - Cars are represented as **two overlapping circles** (front and rear bumper discs) in [`src/physics/CarVsCarCollision.js`](file:///Users/mvaisakh/Projects/uRacing/src/physics/CarVsCarCollision.js).
   - Collisions resolve positional overlap immediately and impart an elastic angular torque and linear impulse based on relative mass ratios.

---

## 🛤️ Track Generation & Stunts

Tracks in [`src/track/TrackRoster.js`](file:///Users/mvaisakh/Projects/uRacing/src/track/TrackRoster.js) define ordered 2D waypoints that are interpolated by [`src/track/Spline.js`](file:///Users/mvaisakh/Projects/uRacing/src/track/Spline.js) using **Catmull-Rom** spline mathematics into equidistant samples:

- **3D Ribbon Meshing** ([`src/render/ThreeRenderer.js`](file:///Users/mvaisakh/Projects/uRacing/src/render/ThreeRenderer.js)):
  - Samples are projected outward along track normals $\vec{n} = (-t_y, t_x)$ to form left and right track edge ribbons, curbs, and colored barriers.
- **Vertical Inversion Loops**:
  - For loop tracks (e.g., `uracing_inversion_loop`), an elevation function $Y(p)$ and bank rotation $\phi(p)$ smoothly lift the track into a full 360° vertical loop.
  - Centrifugal force calculation prevents cars from falling when speed exceeds critical velocity $v \ge \sqrt{g \cdot R}$.
- **Gap Jumps & Auto-Boost Recovery**:
  - Tracks like `twin_bridge_skyway` incorporate elevated launch ramps spanning missing floor gaps.
  - Checkpoint tracking identifies failed jump landings and automatically respawns the car on the entry bridge with a nitro burst to clear the hazard.

---

## 🤖 AI Controller Architecture

AI opponents in [`src/ai/AIController.js`](file:///Users/mvaisakh/Projects/uRacing/src/ai/AIController.js) navigate circuits autonomously:

1. **Spline Waypoint Tracking**: Looks ahead along the Catmull-Rom spline by an adaptive distance proportional to current speed.
2. **Peer Separation Forces**: Detects nearby player and AI cars and applies lateral separation offsets to prevent pile-ups and encourage clean overtakes.
3. **Stuck Detection & Unsticking**:
   - Monitors movement over rolling 1.2-second windows. If forward velocity remains near zero despite full throttle, the AI enters an automatic unstick state:
   - Full reverse throttle with counter-steer for 1.0s, followed by resumption of the forward racing line.
4. **Adaptive Rubber-Banding** ([`src/ai/RubberBanding.js`](file:///Users/mvaisakh/Projects/uRacing/src/ai/RubberBanding.js)):
   - Slightly modulates AI top speed and acceleration based on relative track distance to the player to ensure close, dramatic race finishes.

---

## 🎨 Tabletop Diorama Rendering

The environment features micro-world diorama visuals rendered by Three.js:
- **Procedural Flat Props**: Billboards generated via Canvas ([`PropTextureGenerator.js`](file:///Users/mvaisakh/Projects/uRacing/src/render/PropTextureGenerator.js)) scattered along track margins (vegetables, utensils, paint cans, erasers).
- **Detailed 3D Props**: Procedural 3D meshes (soda cans with pull-tabs, ceramic coffee mugs with liquid, steel toolboxes, terracotta pots).
- **Boundary Clearance**: All props are placed at guaranteed offsets outside the track ribbon curbs to ensure obstruction-free racing lines.
- **Lighting & Shadows**: Directional sun lights paired with ambient fills and PCF soft shadow maps provide authentic miniature depth.

---

## 🛠️ Adding New Content

### Adding a New Vehicle
1. Open [`src/vehicles/VehicleRoster.js`](file:///Users/mvaisakh/Projects/uRacing/src/vehicles/VehicleRoster.js).
2. Add a new configuration entry:
```javascript
"my_car_id": {
  "id": "my_car_id",
  "name": "Super Micro Coupe",
  "era": "Modern Aero Spec",
  "description": "Short bio and dynamic characteristics.",
  "modelId": "car_05", // Matches an entry in CarModelsData.js
  "cost": 1500,
  "color": "#e74c3c",
  "accentColor": "#ffffff",
  "stripeColor": null,
  "stats": {
    "topSpeed": 480,
    "acceleration": 520,
    "braking": 540,
    "weight": 1.10,
    "steerRate": 3.5,
    "grip": 0.94,
    "driftFactor": 0.96
  }
}
```
3. If using a new 3D model, append its vertex buffer data into [`src/vehicles/CarModelsData.js`](file:///Users/mvaisakh/Projects/uRacing/src/vehicles/CarModelsData.js).

### Adding a New Track
1. Open [`src/track/TrackRoster.js`](file:///Users/mvaisakh/Projects/uRacing/src/track/TrackRoster.js).
2. Define a closed loop waypoint array (minimum 6-8 waypoints):
```javascript
"living_room_rug": {
  "id": "living_room_rug",
  "name": "Living Room Rug GP",
  "environment": "playroom", // 'kitchen' | 'workshop' | 'garden' | 'playroom' | 'office'
  "bgColor": "#2c3e50",
  "laps": 3,
  "trackWidth": 140,
  "startPosition": { "x": 0, "y": -400 },
  "startAngle": 0,
  "waypoints": [
    { "x": 0, "y": -400 },
    { "x": 500, "y": -400 },
    { "x": 700, "y": 0 },
    { "x": 500, "y": 400 },
    { "x": -500, "y": 400 },
    { "x": -700, "y": 0 },
    { "x": -500, "y": -400 }
  ]
}
```
3. The track will automatically render in the track selector, ribbon generator, minimap, and checkpoint system!

---

## 💥 Combat Power-Ups & Weapons Engine

Power-up systems live in [`src/powerups/`](file:///Users/mvaisakh/Projects/uRacing/src/powerups/):
1. **PowerUpManager**:
   - Spawns rotating 3D octahedron crystal pickup orbs along circuit checkpoints.
   - Triggers an arcade slot machine roulette animation (`rouletteTimer = 1.2s`) upon car collision.
   - Manages active homing missiles, dropped mineral oil slicks, expanding EMP waves, and kinetic spherical force shields.
2. **Autonomous Combat AI**:
   - `AIController.js` periodically checks held items and opportunistically launches rockets, deploys shields, or drops oil slicks based on proximity to rivals.
3. **Controls**:
   - Activated via `Key E` on desktop or the on-screen virtual `[✨ USE ITEM]` button on mobile touch devices.

---

## 💥 Vehicle Damage Physics & 3D Mesh Denting

Damage mechanics live in [`src/physics/DamageSystem.js`](file:///Users/mvaisakh/Projects/uRacing/src/physics/DamageSystem.js) and [`src/render/ThreeRenderer.js`](file:///Users/mvaisakh/Projects/uRacing/src/render/ThreeRenderer.js):
1. **Structural Health (HP)**:
   - Every vehicle starts with 100 HP.
   - Impacts above 75 units/s deal damage inversely scaled by the vehicle's `weight` (armor rating). Heavier trucks and SUVs take significantly less damage than lightweight open-wheel cars.
   - Below 50% HP, vehicles emit continuous engine smoke; below 25% HP, intense spark bursts appear.
   - Severely damaged vehicles enter a limp-home mode with up to 30% reduction in top speed and acceleration.
2. **Real-Time 3D Mesh Vertex Denting**:
   - Each vehicle's original vertex buffer is cached upon creation in `ThreeRenderer.js`.
   - On impact against barriers, props, or opponents, world contact coordinates are mapped to car local space.
   - Vertices within the impact radius are displaced inward toward the vehicle centroid with localized crumple jitter, and vertex normals are recomputed via `geom.computeVertexNormals()`.

---

## 🧪 Testing & Validation

μRacing includes a built-in automated test suite in [`src/core/Diagnostics.js`](file:///Users/mvaisakh/Projects/uRacing/src/core/Diagnostics.js).
- When the game boots, `runSelfTest()` validates vehicle roster counts, speed sanity checks, spline closures, waypoint minimums, and math primitives.
- You can run or inspect diagnostic logs at any time in the browser developer tools console (`window.__DIAG_REPORT__`).

---

## 🤝 Contribution Guidelines

- **Atomic Commits**: Keep git commits focused and descriptive, following conventional commit formats (`feat(...)`, `fix(...)`, `docs(...)`).
- **No Heavy Bundlers Required**: The project runs directly in any modern browser via ES Modules without build steps. A simple static server (`python3 -m http.server 8000` or VS Code Live Server) is all you need to start developing.
- **Naming Conventions**: Use μRacing branding in documentation and assets.
