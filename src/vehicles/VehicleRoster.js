/**
 * Vehicle Roster definitions:
 * Fictional names representing iconic automotive eras with specialized micro-racer characteristics.
 */
export const VEHICLE_ROSTER = {
  detroit_bruiser: {
    id: 'detroit_bruiser',
    name: 'Bavarian Sedan',
    era: 'Dark Green Executive',
    description: 'High top speed, heavy curb weight, and classic sedan styling.',
    cost: 0, // Starter car
    color: '#1b3e34', // Dark green sedan
    accentColor: '#ffffff',
    stripeColor: null,
    stats: {
      topSpeed: 420,
      acceleration: 380,
      braking: 450,
      weight: 1.4,
      steerRate: 2.8,
      grip: 0.82,
      driftFactor: 0.94
    }
  },

  stuttgart_arrow: {
    id: 'stuttgart_arrow',
    name: 'Britania Grand Tourer',
    era: 'Sleek Grey Sports Car',
    description: 'Front-engine weight bias, snappy lift-off oversteer and razor agility.',
    cost: 500,
    color: '#8b9bad', // Grey sports car
    accentColor: '#0984e3',
    stripeColor: null,
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
    name: 'Midnight Hatchback',
    era: 'Dark Blue Compact',
    description: 'Balanced AWD handling, immense turbo acceleration and controllable slides.',
    cost: 850,
    color: '#283c63', // Dark blue
    accentColor: '#00cec9',
    stripeColor: null,
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
    name: 'Alpine SUV',
    era: 'Modern White Utility',
    description: 'A heavy luxury SUV with extreme top speed but slow turning.',
    cost: 1200,
    color: '#f1f2f6', // White SUV
    accentColor: '#fbc531',
    stripeColor: '#2f3640',
    stats: {
      topSpeed: 480,
      acceleration: 440,
      braking: 540,
      weight: 1.8,
      steerRate: 2.1,
      grip: 0.87,
      driftFactor: 0.93
    }
  },

  group_b_monster: {
    id: 'group_b_monster',
    name: 'City Commuter',
    era: 'Light Blue Mini',
    description: 'Explosive boost, supreme all-terrain grip, and nimble micro-chassis.',
    cost: 1500,
    color: '#85a7bd', // Light blue hatch
    accentColor: '#e1b12c',
    stripeColor: null,
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
