# μRacing (Micro Racing)

A high-octane, client-side browser racing game channeling the die-cast miniature aesthetic and fluid mechanics of classic micro racers.

Built with 100% static HTML5 Canvas and Vanilla ES Modules, zero external runtime dependencies, deployable directly to **GitHub Pages**.

---

## 🏎️ Vehicle Roster

| Vehicle | Era Inspiration | Top Speed | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Detroit Bruiser** | 1969 American Muscle | High | Heavy (1.4) | Heavy muscle oversteer, straight-line power |
| **Stuttgart Arrow** | 1980s Rear-Engine Classic | Fast | Light (1.05) | Snappy lift-off oversteer, apex agility |
| **Tokyo Drift-King** | 1990s AWD Turbo Legend | Very Fast | Balanced (1.15) | AWD traction, smooth controllable drifting |
| **Maranello Rosso** | 1980s Wedge Supercar | Extreme | Ultra-Light (1.0) | Highest top speed, low ground clearance |
| **Group B Monster** | 1980s Rally Homologation | Instant Boost | Agile (0.95) | Explosive acceleration, maximum grip |

---

## 🏁 Miniature Circuits

1. **Kitchen Countertop Grand Prix** - Weave between soda cans, coffee mugs, and sponge boxes.
2. **Workshop Workbench Derby** - Drift around paint cans, motor oil canisters, and duct tape spools.
3. **Office Desk Sprint** - High-speed sprints around coffee mugs, sticky pads, and stationery.

---

## 🎮 Controls

* **Accelerate:** `W` or `Up Arrow`
* **Brake / Reverse:** `S` or `Down Arrow`
* **Steer:** `A` / `D` or `Left` / `Right Arrow`
* **Handbrake / Drift:** `Space`
* **Nitrous Boost:** `Shift`
* **Quick Restart:** `R`
* **Garage / Menu:** `Escape`
* **Touchscreen:** Full on-screen virtual d-pad & action triggers for mobile devices.

---

## ⚙️ Architecture Highlights

* **Fixed Timestep Loop:** 60Hz delta-time accumulator with alpha frame interpolation.
* **Physics & Kinematics:** Semi-implicit Euler integration, tire slip friction vectors, and dual-sphere barrier restitution.
* **Procedural Die-Cast Graphics:** Metallic enamel sheen, drop shadows, dynamic tire skidmarks, and nitro exhaust flames.
* **Sound Synthesizer:** Real-time Web Audio API frequency-modulated engine revs, tire screech, and impact crashes.
* **Persistence:** Namespaced `localStorage` save state for player credits, vehicle unlocks, and lap records.

## 🙏 Credits & Attribution
* **Vehicle Designs & Inspiration**: The low-poly 3D isometric vehicle aesthetics are heavily inspired by the incredible open-source and CC0 assets provided by the community, especially [Kenney.nl](https://kenney.nl) and [Quaternius](https://quaternius.com/). Huge thanks to these creators for providing excellent public domain references that guided our custom procedural canvas models!
