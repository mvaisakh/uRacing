/**
 * Vehicle Roster definitions:
 * Fictional names representing iconic automotive eras with specialized micro-racer characteristics.
 */
export const VEHICLE_ROSTER = {
  detroit_bruiser: {
    id: 'detroit_bruiser',
    name: 'Detroit Bruiser',
    era: '1969 American Muscle',
    description: 'High top speed, heavy curb weight, and prone to muscle oversteer.',
    cost: 0, // Starter car
    color: '#d63031',
    accentColor: '#ffffff',
    stripeColor: '#2d3436',
    stats: {
      topSpeed: 420,       // Max forward velocity
      acceleration: 380,   // Engine drive force
      braking: 450,        // Brake force
      weight: 1.4,         // Heavy feel
      steerRate: 2.8,      // Turn responsiveness
      grip: 0.82,          // Lateral tire friction
      driftFactor: 0.94    // Lateral sliding retention
    }
  },

  stuttgart_arrow: {
    id: 'stuttgart_arrow',
    name: 'Stuttgart Arrow',
    era: '1980s Rear-Engine Classic',
    description: 'Rear-engine weight bias, snappy lift-off oversteer and razor agility.',
    cost: 500,
    color: '#dfe6e9',
    accentColor: '#0984e3',
    stripeColor: '#d63031',
    stats: {
      topSpeed: 440,
      acceleration: 420,
      braking: 520,
      weight: 1.05,
      steerRate: 3.4,
      grip: 0.88,
      driftFactor: 0.96
    }
  },

  tokyo_drift_king: {
    id: 'tokyo_drift_king',
    name: 'Tokyo Drift-King',
    era: '1990s AWD Turbo Legend',
    description: 'Balanced AWD handling, immense turbo acceleration and controllable slides.',
    cost: 850,
    color: '#0984e3',
    accentColor: '#00cec9',
    stripeColor: '#ffffff',
    stats: {
      topSpeed: 430,
      acceleration: 480,
      braking: 500,
      weight: 1.15,
      steerRate: 3.2,
      grip: 0.91,
      driftFactor: 0.92
    }
  },

  maranello_rosso: {
    id: 'maranello_rosso',
    name: 'Maranello Rosso',
    era: '1980s Wedge Supercar',
    description: 'Wedge-shaped aerodynamic icon with extreme top speed and low clearance.',
    cost: 1200,
    color: '#e84118',
    accentColor: '#fbc531',
    stripeColor: '#2f3640',
    stats: {
      topSpeed: 480,
      acceleration: 440,
      braking: 540,
      weight: 1.0,
      steerRate: 3.1,
      grip: 0.87,
      driftFactor: 0.93
    }
  },

  group_b_monster: {
    id: 'group_b_monster',
    name: 'Group B Monster',
    era: '1980s Rally Homologation',
    description: 'Explosive boost, supreme all-terrain grip, and aggressive micro-chassis.',
    cost: 1500,
    color: '#f5f6fa',
    accentColor: '#e1b12c',
    stripeColor: '#44bd32',
    stats: {
      topSpeed: 435,
      acceleration: 520,
      braking: 580,
      weight: 0.95,
      steerRate: 3.6,
      grip: 0.96,
      driftFactor: 0.90
    }
  }
};
