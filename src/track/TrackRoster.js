/**
 * Track Roster: Miniature, die-cast thematic circuits
 */
export const TRACK_ROSTER = {
  kitchen_countertop: {
    id: 'kitchen_countertop',
    name: 'Kitchen Countertop Grand Prix',
    environment: 'kitchen',
    bgColor: '#966F33', // Oak wood
    laps: 3,
    trackWidth: 140,
    startPosition: { x: 0, y: -450 },
    startAngle: 0, // Facing east
    waypoints: [
      { x: 0, y: -450 },
      { x: 500, y: -450 },
      { x: 800, y: -200 },
      { x: 850, y: 250 },
      { x: 600, y: 500 },
      { x: 100, y: 350 },
      { x: -200, y: 550 },
      { x: -650, y: 400 },
      { x: -750, y: -100 },
      { x: -450, y: -450 }
    ]
  },

  workshop_bench: {
    id: 'workshop_bench',
    name: 'Workshop Workbench Derby',
    environment: 'workshop',
    bgColor: '#8B5A2B', // Darker wood
    laps: 3,
    trackWidth: 150,
    startPosition: { x: 0, y: -500 },
    startAngle: 0,
    waypoints: [
      { x: 0, y: -500 },
      { x: 600, y: -500 },
      { x: 900, y: -100 },
      { x: 600, y: 200 },
      { x: 200, y: -50 },
      { x: -200, y: 300 },
      { x: 300, y: 600 },
      { x: -400, y: 700 },
      { x: -800, y: 300 },
      { x: -700, y: -300 }
    ]
  },

  garden_path: {
    id: 'garden_path',
    name: 'Garden Path Sprint',
    environment: 'garden',
    bgColor: '#4A7C2F',
    laps: 3,
    trackWidth: 130,
    startPosition: { x: -300, y: -400 },
    startAngle: 0.2,
    waypoints: [
      { x: -300, y: -400 },
      { x: 350, y: -420 },
      { x: 700, y: -150 },
      { x: 500, y: 300 },
      { x: -100, y: 100 },
      { x: -400, y: 450 },
      { x: -800, y: 150 },
      { x: -600, y: -250 }
    ]
  }
};
