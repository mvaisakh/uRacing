/**
 * Vehicle Roster definitions:
 * Accurately categorized and named according to extracted 3D models:
 * - car_01, car_02, car_03: Sedans / Saloons
 * - car_04, car_05, car_06: Sports Cars / Coupes
 * - car_07, car_08, car_09: Commercial Utility Vans
 * - car_10, car_11, car_12: City Transit & Coach Buses
 * - car_13: Metro Yellow Cab (Sedan with rooftop Taxi sign)
 * - car_14: State Police Cruiser (Sedan with emergency roof lightbar)
 * - car_15: Baja Storm Rally GT (Sports coupe with high-downforce rally wing)
 * - car_16: Monaco Aero GT (Sports coupe with competition rear wing)
 */
export const VEHICLE_ROSTER = {
  // --- SEDANS / SALOONS ---
  "detroit_bruiser": {
    "id": "detroit_bruiser",
    "name": "Bavarian Classic Sedan",
    "era": "Classic 4-Door Saloon",
    "description": "Solid mid-size saloon with balanced handling, good top speed, and classic styling.",
    "modelId": "car_01",
    "cost": 0,
    "color": "#27ae60",
    "accentColor": "#ffffff",
    "stripeColor": null,
    "stats": {
      "topSpeed": 430,
      "acceleration": 400,
      "braking": 460,
      "weight": 1.35,
      "steerRate": 3.0,
      "grip": 0.86,
      "driftFactor": 0.93,
      "offroad": 0.5,
      "torque": 410
    }
  },
  "city_compact": {
    "id": "city_compact",
    "name": "Tokyo Urban Sedan",
    "era": "Compact City Saloon",
    "description": "Agile 4-door street sedan with quick turn-in, rapid acceleration, and tight handling.",
    "modelId": "car_02",
    "cost": 400,
    "color": "#2980b9",
    "accentColor": "#00cec9",
    "stripeColor": null,
    "stats": {
      "topSpeed": 440,
      "acceleration": 460,
      "braking": 490,
      "weight": 1.20,
      "steerRate": 3.3,
      "grip": 0.90,
      "driftFactor": 0.94,
      "offroad": 0.4,
      "torque": 380
    }
  },
  "phantom_coupe": {
    "id": "phantom_coupe",
    "name": "Crown Executive Sedan",
    "era": "Luxury Touring Saloon",
    "description": "Long-wheelbase luxury sedan with smooth high-speed stability and highway power.",
    "modelId": "car_03",
    "cost": 850,
    "color": "#34495e",
    "accentColor": "#ecf0f1",
    "stripeColor": null,
    "stats": {
      "topSpeed": 460,
      "acceleration": 430,
      "braking": 500,
      "weight": 1.45,
      "steerRate": 2.8,
      "grip": 0.88,
      "driftFactor": 0.92,
      "offroad": 0.45,
      "torque": 440
    }
  },

  // --- SPORTS CARS & COUPES ---
  "tokyo_drift_king": {
    "id": "tokyo_drift_king",
    "name": "Midnight Drift Coupe",
    "era": "AWD Wedge Aero Sport",
    "description": "Low-slung sports coupe with aerodynamic profile, tuned for sustained high-speed drifts.",
    "modelId": "car_04",
    "cost": 1100,
    "color": "#e74c3c",
    "accentColor": "#0984e3",
    "stripeColor": null,
    "stats": {
      "topSpeed": 465,
      "acceleration": 490,
      "braking": 520,
      "weight": 1.10,
      "steerRate": 3.5,
      "grip": 0.92,
      "driftFactor": 0.96,
      "offroad": 0.35,
      "torque": 390
    }
  },
  "blaze_gt": {
    "id": "blaze_gt",
    "name": "Apex GT Racer",
    "era": "Grand Touring Sports",
    "description": "Track-ready competition GT with wide stance, razor agility, and blistering acceleration.",
    "modelId": "car_05",
    "cost": 1400,
    "color": "#d35400",
    "accentColor": "#f39c12",
    "stripeColor": null,
    "stats": {
      "topSpeed": 485,
      "acceleration": 520,
      "braking": 560,
      "weight": 1.05,
      "steerRate": 3.6,
      "grip": 0.95,
      "driftFactor": 0.97,
      "offroad": 0.3,
      "torque": 420
    }
  },
  "clubman_hatch": {
    "id": "clubman_hatch",
    "name": "Clubman Speedster",
    "era": "Super-Low Wedge Sport",
    "description": "Ultra-low drag competition wedge built for technical cornering and high apex speed.",
    "modelId": "car_06",
    "cost": 1750,
    "color": "#c0392b",
    "accentColor": "#ffffff",
    "stripeColor": null,
    "stats": {
      "topSpeed": 475,
      "acceleration": 505,
      "braking": 540,
      "weight": 1.02,
      "steerRate": 3.7,
      "grip": 0.94,
      "driftFactor": 0.95,
      "offroad": 0.3,
      "torque": 400
    }
  },

  // --- HIGH-PERFORMANCE MUSCLE & UTILITY ---
  "maranello_rosso": {
    "id": "maranello_rosso",
    "name": "Apex Muscle SS (Camaro)",
    "era": "American V8 Muscle Coupe",
    "description": "The ultimate flagship hyper-muscle machine. High-displacement twin-supercharged V8 delivering peerless top-end velocity and thundering torque.",
    "modelId": "camaro_muscle",
    "cost": 3500,
    "color": "#1e3799",
    "accentColor": "#ffffff",
    "stripeColor": "#ffffff",
    "stats": {
      "topSpeed": 540,
      "acceleration": 560,
      "braking": 580,
      "weight": 1.20,
      "steerRate": 3.7,
      "grip": 0.96,
      "driftFactor": 0.98,
      "offroad": 0.35,
      "torque": 460
    }
  },
  "metro_cruiser": {
    "id": "metro_cruiser",
    "name": "Overland 4x4 (Fortuner)",
    "era": "Heavy Adventure 4WD SUV",
    "description": "High-riding rugged all-terrain SUV engineered with high ground clearance, heavy mass, and rock-steady stability.",
    "modelId": "fortuner_suv",
    "cost": 1050,
    "color": "#2c3e50",
    "accentColor": "#e74c3c",
    "stripeColor": null,
    "stats": {
      "topSpeed": 445,
      "acceleration": 460,
      "braking": 540,
      "weight": 1.65,
      "steerRate": 2.7,
      "grip": 0.94,
      "driftFactor": 0.91,
      "offroad": 0.92,
      "torque": 540
    }
  },
  "vanguard_suv": {
    "id": "vanguard_suv",
    "name": "Titan 6x6 Military Hauler",
    "era": "Heavy Armored Tactical Hauler",
    "description": "Massive military cargo transport with indestructible chassis, towering wheelbase, and relentless ramming force.",
    "modelId": "military_truck",
    "cost": 1400,
    "color": "#4b6584",
    "accentColor": "#2d98da",
    "stripeColor": null,
    "stats": {
      "topSpeed": 430,
      "acceleration": 450,
      "braking": 580,
      "weight": 2.25,
      "steerRate": 2.1,
      "grip": 0.95,
      "driftFactor": 0.88,
      "offroad": 0.98,
      "torque": 620
    }
  },

  // --- TRANSIT & SPECIAL RACERS ---
  "stuttgart_arrow": {
    "id": "stuttgart_arrow",
    "name": "Anglia Vintage Racer",
    "era": "Classic English Notchback",
    "description": "Charming retro saloon with reverse-raked rear glass, lightweight nimble cornering, and rapid acceleration.",
    "modelId": "ford_anglia",
    "cost": 1200,
    "color": "#38ada9",
    "accentColor": "#f8c291",
    "stripeColor": null,
    "stats": {
      "topSpeed": 440,
      "acceleration": 480,
      "braking": 500,
      "weight": 1.05,
      "steerRate": 3.6,
      "grip": 0.92,
      "driftFactor": 0.95,
      "offroad": 0.45,
      "torque": 370
    }
  },
  "group_b_monster": {
    "id": "group_b_monster",
    "name": "Continental Coach Bus",
    "era": "Long-Distance Touring Coach",
    "description": "Long touring coach with unstoppable highway momentum and rock-solid high-speed stability.",
    "modelId": "car_11",
    "cost": 1850,
    "color": "#f39c12",
    "accentColor": "#e1b12c",
    "stripeColor": null,
    "stats": {
      "topSpeed": 425,
      "acceleration": 380,
      "braking": 590,
      "weight": 2.20,
      "steerRate": 1.8,
      "grip": 0.92,
      "driftFactor": 0.85,
      "offroad": 0.65,
      "torque": 580
    }
  },
  "monaco_spyder": {
    "id": "monaco_spyder",
    "name": "Express Service Van",
    "era": "Fleet Utility Van",
    "description": "Reinforced delivery van with high pushing power and durable commercial suspension.",
    "modelId": "car_08",
    "cost": 1600,
    "color": "#8e44ad",
    "accentColor": "#9b59b6",
    "stripeColor": null,
    "stats": {
      "topSpeed": 435,
      "acceleration": 430,
      "braking": 540,
      "weight": 1.60,
      "steerRate": 2.5,
      "grip": 0.90,
      "driftFactor": 0.90,
      "offroad": 0.7,
      "torque": 490
    }
  },

  // --- SPECIAL PURPOSE & TUNED SPEC VEHICLES ---
  "taxi_yellow": {
    "id": "taxi_yellow",
    "name": "Metro Yellow Cab",
    "era": "City Checker Taxi Sedan",
    "description": "Classic yellow city cab with illuminated rooftop taxi sign and quick stop-and-go burst.",
    "modelId": "car_13",
    "cost": 600,
    "color": "#f1c40f",
    "accentColor": "#2c3e50",
    "stripeColor": null,
    "stats": {
      "topSpeed": 435,
      "acceleration": 470,
      "braking": 510,
      "weight": 1.35,
      "steerRate": 3.1,
      "grip": 0.88,
      "driftFactor": 0.93,
      "offroad": 0.48,
      "torque": 420
    }
  },
  "police_enforcer": {
    "id": "police_enforcer",
    "name": "State Police Cruiser",
    "era": "Highway Pursuit Police Sedan",
    "description": "Sedan-based highway patrol cruiser fitted with emergency roof lightbar and high-speed pursuit tune.",
    "modelId": "car_14",
    "cost": 1600,
    "color": "#1e272e",
    "accentColor": "#ffffff",
    "stripeColor": null,
    "stats": {
      "topSpeed": 475,
      "acceleration": 480,
      "braking": 560,
      "weight": 1.48,
      "steerRate": 3.2,
      "grip": 0.93,
      "driftFactor": 0.94,
      "offroad": 0.5,
      "torque": 450
    }
  },
  "rally_monster": {
    "id": "rally_monster",
    "name": "Baja Storm Rally GT",
    "era": "Desert Rally Spec Coupe",
    "description": "Coupe-based rally machine with high-downforce rear wing and ultra-responsive slide recovery.",
    "modelId": "car_15",
    "cost": 2300,
    "color": "#e67e22",
    "accentColor": "#2ecc71",
    "stripeColor": null,
    "stats": {
      "topSpeed": 465,
      "acceleration": 530,
      "braking": 570,
      "weight": 1.10,
      "steerRate": 3.6,
      "grip": 0.96,
      "driftFactor": 0.96,
      "offroad": 0.78,
      "torque": 510
    }
  },
  "samara_gt": {
    "id": "samara_gt",
    "name": "Monaco Aero GT",
    "era": "Featherweight Track Spec",
    "description": "Competition GT fitted with carbon rear wing, extreme downforce, and razor cornering grip.",
    "modelId": "car_16",
    "cost": 3000,
    "color": "#9b59b6",
    "accentColor": "#f1c40f",
    "stripeColor": null,
    "stats": {
      "topSpeed": 495,
      "acceleration": 520,
      "braking": 580,
      "weight": 0.98,
      "steerRate": 3.8,
      "grip": 0.97,
      "driftFactor": 0.98,
      "offroad": 0.28,
      "torque": 390
    }
  }
};
