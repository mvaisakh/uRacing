# μRacing (Micro Racing)

A high-octane 3D miniature tabletop racing game channeling the die-cast toy aesthetic and fluid arcade mechanics of classic micro racers.

Built with Three.js WebGL and Vanilla ES Modules, deployable directly to **GitHub Pages** or any static host.

---

## 🏎️ Vehicle Roster (16 Varieties)

All vehicles are built from authentic low-poly 3D models with unique dimensions, handling kinematics, colorways, and custom accessories:

### 🚗 Sedans & Saloons
| Vehicle | Class / Style | Top Speed | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Bavarian Classic Sedan** | Classic 4-Door Saloon | 430 | Balanced (1.35) | Solid all-around handling, reliable cruising speed |
| **Tokyo Urban Sedan** | Compact City Saloon | 440 | Light (1.20) | Rapid turn-in, quick stop-and-go acceleration |
| **Crown Executive Sedan** | Luxury Touring Saloon | 460 | Heavy (1.45) | Long wheelbase, smooth high-speed highway stability |
| **Metro Yellow Cab** | City Checker Taxi | 435 | Balanced (1.35) | Rooftop taxi sign, responsive stop-and-go torque |
| **State Police Cruiser** | Highway Pursuit Police | 475 | Sturdy (1.48) | Emergency roof lightbar, high-speed interception tune |

### 🏎️ Sports Coupes & Racers
| Vehicle | Class / Style | Top Speed | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Midnight Drift Coupe** | AWD Wedge Aero Sport | 465 | Agile (1.10) | Low-slung profile, tuned for sustained slides |
| **Apex GT Racer** | Grand Touring Sports | 485 | Ultra-Light (1.05) | Wide stance, razor agility, and blistering acceleration |
| **Clubman Speedster** | Super-Low Wedge Sport | 475 | Featherweight (1.02) | Ultra-low drag, technical cornering apex speed |
| **Baja Storm Rally GT** | Desert Rally Spec | 465 | Balanced (1.10) | High-downforce rear rally wing, sharp slide recovery |
| **Monaco Aero GT** | Featherweight Track Spec | 495 | Ultra-Light (0.98) | Full competition rear GT wing, extreme downforce |

### 🚐 Commercial Utility Vans
| Vehicle | Class / Style | Top Speed | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Metro Delivery Van** | Urban Commercial Van | 420 | Heavy (1.70) | High-roof steel chassis, high pushing momentum |
| **Express Cargo Van** | Commercial Panel Van | 425 | Heavy (1.65) | Heavy-duty utility transport, strong pulling torque |
| **Rapid Service Van** | Emergency Service Van | 435 | Heavy (1.75) | High-clearance fleet van, stable highway tracking |

### 🚌 City Transit & Coach Buses
| Vehicle | Class / Style | Top Speed | Weight | Key Dynamic Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Metro Transit Bus** | City Commuter Transit Bus | 405 | Massive (2.10) | Massive multi-passenger bus, sweeps opponents aside |
| **Continental Coach Bus** | Long-Distance Touring Coach | 425 | Massive (2.20) | Long touring coach, unstoppable highway momentum |
| **Express Shuttle Bus** | Airport Express Shuttle | 415 | Massive (2.05) | Iron fortress chassis, high ramming resistance |

---

## 🏁 Miniature Diorama Circuits

1. **Kitchen Countertop GP** - Race across varnished oak countertops between soda cans, coffee mugs, and cooking utensils.
2. **Workshop Workbench Derby** - Drift through a carpenter's workshop around paint cans, motor oil canisters, and bolts.
3. **Garden Path Sprint** - Outdoor garden course weaving past terracotta flower pots, trowels, and scattered vegetables.
4. **Kids Bedroom Raceway** - Nursery carpet track bordered by giant building blocks, toy trains, and crayons.
5. **Dining Table Speed Bowl** - Oval speedway on a grand dining table lined with dinner plates, silverware, and condiment shakers.
6. **Study Desk Circuit** - Technical circuit navigating around spiral notebooks, coffee cups, giant pencils, and erasers.

---

## 🎮 Controls

* **Accelerate:** `W` or `Up Arrow`
* **Brake / Reverse:** `S` or `Down Arrow`
* **Steer:** `A` / `D` or `Left` / `Right Arrow`
* **Handbrake / Drift:** `Space`
* **Nitrous Boost:** `Shift`
* **Quick Restart:** `R`
* **Garage / Showroom:** `Escape`
* **Cycle Garage Cars:** `A` / `D` or `Left` / `Right Arrow`
* **Confirm Selection:** `Enter`

---

## ⚙️ Visuals & Physics Engine

* **3D Seamless Ribbon Track:** Closed-loop ribbon geometry with zero Frenet twist or start-finish seam discontinuity.
* **Studio Garage Showroom:** 3-point studio lighting with PCF soft shadow mapping and rotating showcase turntable.
* **Responsive 3D Particles:** Billowy 3D tire drift smoke puffs and real-time fading rubber skidmark ribbons.
* **Capsule Car Collisions:** 2-circle capsule collision detection preventing clipping with momentum separation and angular torque transfer.
* **Web Audio Sound Synthesizer:** Real-time FM engine revs, dynamic drift tire screech, and die-cast metal impact crashes.
