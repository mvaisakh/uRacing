/**
 * PowerUpTypes: Definitions of micro toy combat power-ups.
 */
export const POWERUP_TYPES = {
  ROCKET: {
    id: 'ROCKET',
    name: 'Bottle Rocket',
    icon: '🚀',
    color: '#e74c3c',
    description: 'Fires a high-velocity forward homing micro missile that detonates on impact.'
  },
  OIL_SLICK: {
    id: 'OIL_SLICK',
    name: 'Mineral Oil Slick',
    icon: '🛢️',
    color: '#2c3e50',
    description: 'Drops a slick oil puddle behind that sends pursuers into an uncontrollable 360 spin.'
  },
  EMP_SHOCK: {
    id: 'EMP_SHOCK',
    name: 'EMP Shockwave',
    icon: '⚡',
    color: '#00f2fe',
    description: 'Emits a 360-degree electromagnetic blast temporarily neutralizing nearby rival engines.'
  },
  FORCE_SHIELD: {
    id: 'FORCE_SHIELD',
    name: 'Kinetic Barrier Shield',
    icon: '🛡️',
    color: '#3498db',
    description: 'Forms an impenetrable spherical energy dome that absorbs all incoming impacts and attacks.'
  },
  HYPER_BOOST: {
    id: 'HYPER_BOOST',
    name: 'Turbo Capacitor Boost',
    icon: '🔥',
    color: '#f39c12',
    description: 'Supercharges propulsion thrusters with extreme forward thrust for 3.0 seconds.'
  },
  MAGNET: {
    id: 'MAGNET',
    name: 'Tractor Magnet',
    icon: '🧲',
    color: '#9b59b6',
    description: 'Locks onto the car ahead, violently hauling your racer forward into their draft slipstream.'
  }
};

export const POWERUP_LIST = Object.keys(POWERUP_TYPES);
