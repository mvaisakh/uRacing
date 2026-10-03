# μRacing (Micro Racing)

A high-octane 3D miniature tabletop racing game channeling the die-cast toy aesthetic and fluid arcade mechanics of classic micro racers.

Built with Three.js WebGL and Vanilla ES Modules, deployable directly to **GitHub Pages** or any static web host.

---

## 🏎️ Vehicle Roster (16 Varieties)

All vehicles are built from authentic low-poly 3D models with unique dimensions, handling kinematics, colorways, and custom accessories:

### ⚡ Flagship Hyper-Muscle
| Vehicle | Class / Style | Top Speed | Price | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apex Muscle SS (Camaro)** | American V8 Muscle Coupe | **540** | **3,500** | Balanced (1.20) | High-displacement twin-supercharged V8 delivering peerless top-end velocity and thundering torque. |

### 🏎️ Sports Coupes & Competition Racers
| Vehicle | Class / Style | Top Speed | Price | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Monaco Aero GT** | Featherweight Track Spec | 495 | 3,000 | Ultra-Light (0.98) | Competition GT fitted with carbon rear wing, extreme downforce, and razor cornering grip. |
| **Apex GT Racer** | Grand Touring Sports | 485 | 1,400 | Ultra-Light (1.05) | Track-ready competition GT with wide stance, razor agility, and blistering acceleration. |
| **Clubman Speedster** | Super-Low Wedge Sport | 475 | 1,750 | Featherweight (1.02) | Ultra-low drag competition wedge built for technical cornering and high apex speed. |
| **Baja Storm Rally GT** | Desert Rally Spec Coupe | 465 | 2,300 | Agile (1.10) | Coupe-based rally machine with high-downforce rear wing and ultra-responsive slide recovery. |
| **Midnight Drift Coupe** | AWD Wedge Aero Sport | 465 | 1,100 | Agile (1.10) | Low-slung sports coupe with aerodynamic profile, tuned for sustained high-speed drifts. |

### 🚗 Sedans, Saloons & Classics
| Vehicle | Class / Style | Top Speed | Price | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **State Police Cruiser** | Highway Pursuit Police Sedan | 475 | 1,600 | Sturdy (1.48) | Highway patrol cruiser fitted with emergency roof lightbar and high-speed pursuit tune. |
| **Crown Executive Sedan** | Luxury Touring Saloon | 460 | 850 | Heavy (1.45) | Long-wheelbase luxury sedan with smooth high-speed highway stability and power. |
| **Tokyo Urban Sedan** | Compact City Saloon | 440 | 400 | Light (1.20) | Agile 4-door street sedan with quick turn-in, rapid acceleration, and tight handling. |
| **Anglia Vintage Racer** | Classic English Notchback | 440 | 1,200 | Light (1.05) | Charming retro saloon with reverse-raked rear glass and nimble technical cornering. |
| **Metro Yellow Cab** | City Checker Taxi Sedan | 435 | 600 | Balanced (1.35) | Classic yellow city cab with illuminated rooftop taxi sign and quick stop-and-go burst. |
| **Bavarian Classic Sedan** | Classic 4-Door Saloon | 430 | Free | Balanced (1.35) | Solid mid-size saloon with balanced handling, good top speed, and starter reliability. |

### 🚙 4x4, Hauler & Commercial Utility
| Vehicle | Class / Style | Top Speed | Price | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overland 4x4 (Fortuner)** | Heavy Adventure 4WD SUV | 445 | 1,050 | Heavy (1.65) | High-riding rugged all-terrain SUV engineered with high ground clearance and rock-steady stability. |
| **Express Service Van** | Fleet Utility Van | 435 | 1,600 | Heavy (1.60) | Reinforced delivery van with high pushing power and durable commercial suspension. |
| **Titan 6x6 Military Hauler** | Heavy Armored Tactical Hauler | 430 | 1,400 | Massive (2.25) | Massive military cargo transport with indestructible chassis, towering wheelbase, and relentless ramming force. |
| **Continental Coach Bus** | Long-Distance Touring Coach | 425 | 1,850 | Massive (2.20) | Long touring coach with unstoppable highway momentum and rock-solid high-speed stability. |

---

## 🏁 Miniature Diorama Circuits (10 Tracks)

1. **Kitchen Countertop GP** - Race across varnished oak countertops between soda cans, coffee mugs, and cooking utensils.
2. **Workshop Workbench Derby** - Drift through a carpenter's workshop around paint cans, motor oil canisters, and bolts.
3. **Garden Patio Sprint** - Outdoor patio garden course weaving past terracotta flower pots, river stone clusters, and garden vegetables.
4. **Playroom Carpet Speedway** - Nursery carpet track bordered by giant wooden building blocks, crayons, and toys.
5. **Breakfast Table Oval** - High-speed banked oval circuit on a dining table lined with tableware and breakfast items.
6. **Architect Desk Loop** - Technical drafting circuit navigating around anglepoise lamps, sticky note stacks, pencil cups, and sharpeners.
7. **μRacing 360 Inversion Speedway** - High-stakes stunt track featuring a **full vertical 360° inversion loop** with neon pre-boost acceleration strip.
8. **μRacing Skyway & Canyon Jump** - Elevated industrial skyway bridge with kicker launch ramp spanning a **deep canyon gap**, equipped with auto-boost recovery on missed jumps.
9. **Sandbox Quarry Dunes (Off-Road)** - Sandy desert quarry terrain with sand dunes, plastic dig buckets, and rock quarries. High off-road clearance and torque allow SUVs to blast through dunes while low-slung supercars suffer reduced traction.
10. **Mud Trench Forest Derby (Off-Road)** - Heavy muddy garden trench circuit with damp soil trenches, deep ruts, and slippery mud pits. High-torque 4WD trucks power through mud while supercars bog down.

---

## 💥 Arcade Power-Ups & Weapons

Engage in intense combat racing using trackside crystal pickups, random roulette selection, and tactical weapon deployment:

* **🚀 Bottle Rocket:** Fires a forward-thrusting homing missile that detonates on impact, causing structural damage and blast spinout.
* **🛢️ Mineral Oil Slick:** Drops a slick puddle behind your vehicle that causes pursuing rivals to lose all grip and spin out in a 360° skid.
* **⚡ EMP Shockwave:** Emits an electromagnetic pulse wave that knocks out rival engines within a 200px radius.
* **🛡️ Kinetic Barrier Shield:** Generates an impenetrable spherical energy dome that protects against missiles, shocks, and collisions.
* **🔥 Turbo Capacitor Boost:** Overcharges propulsion thrusters for 3.0s of hyper-speed acceleration.
* **🧲 Tractor Magnet:** Locks onto the car ahead, violently pulling your vehicle forward into their draft slipstream.

---

## 🎮 Controls & Interface

### ⌨️ Keyboard & Desktop
* **Accelerate:** `W` or `Up Arrow`
* **Brake / Reverse:** `S` or `Down Arrow`
* **Steer:** `A` / `D` or `Left` / `Right Arrow`
* **Handbrake / Drift:** `Space`
* **Nitrous Boost:** `Shift`
* **Use Power-Up / Item:** `Key E`
* **Quick Restart:** `R`
* **Garage / Showroom:** `Escape`
* **Showroom Carousel:** `A` / `D` or `Left` / `Right Arrow` (or click carousel buttons / node pills)
* **Confirm / Buy / Start Race:** `Enter`

### 📱 Touch & Mobile Friendly
* **On-Screen Virtual Controls:** Virtual steering buttons, throttle, brake, drift, boost, and a dedicated **[✨ USE ITEM]** button.
* **Touch-Enabled UI:** Clickable and touch-navigable showroom cards, carousel chevrons, track selector cards, and action buttons.

---

## ⚙️ Physics, AI & Engine Features

* **Real-Time 3D Mesh Denting Deformation:** High-speed impacts against barriers, props, or opponents dynamically deform the vehicle's 3D mesh vertices toward the car's centroid.
* **Vehicle Structural Health & Armor Ratings:** Each vehicle starts with 100 HP. Heavier vehicles, 4WD SUVs, and haulers feature superior armor mitigation. Damaged vehicles emit progressive engine smoke (< 50% HP) and sparks (< 25% HP).
* **Off-Road Surfaces & Torque Hauling:** Dynamic surface friction evaluation (asphalt, sand, mud, dirt). High-torque 4x4s power through mud and rough sand dunes with pulling force multipliers.
* **Autonomous Combat AI:** Smart AI drivers collect power-up pods and autonomously deploy rockets, shields, and oil slicks against player and rival cars.
* **3D Seamless Ribbon Track:** Closed-loop ribbon geometry with continuous Frenet frames, start-finish checker gantries, and zero mesh seam discontinuity.
* **Inversion Stunts & Gap Jumps:** Loop physics with centrifugal adhesion, pre-boost pads, and safety recovery checkpoints with auto-boost respawn.
* **Studio Garage Showroom:** 3-point studio lighting, PCF soft shadow mapping, rotating showcase turntable, and LED stat gauges calibrated for all vehicle tiers.
* **Web Audio Sound Synthesizer:** Real-time FM engine revs, dynamic drift tire screech, nitrous whoosh, and die-cast metal impact crashes.

---

## 📖 Developer Architecture & Contributing

Interested in contributing or learning how μRacing works under the hood?

Check out our comprehensive **[Architecture & Contributor Guide](docs/CONTRIBUTING.md)** covering:
- **System Architecture**: Flow of game loops, state orchestration, and WebGL/Canvas synchronization.
- **Physics Engine**: Bicycle kinematics, tire lateral slip, and dual-circle collision resolution.
- **Track Geometry**: Catmull-Rom spline sampling, 3D ribbon generation, and 360° inversion loops.
- **Autonomous AI**: Path prediction, peer separation forces, and stuck detection.
- **How-To Guides**: Step-by-step instructions for adding new vehicles and circuits.
