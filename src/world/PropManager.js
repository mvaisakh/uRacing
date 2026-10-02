import { WorldProp } from './WorldProp.js';

/**
 * PropManager: Populates track infield/outfield with micro desktop props
 */
export class PropManager {
  constructor(environment = 'kitchen') {
    this.props = [];
    this._populate(environment);
  }

  _populate(env) {
    if (env === 'kitchen') {
      // Soda Cans, Salt Shakers, Coffee Mugs, Sponge, Fruit
      this.props.push(new WorldProp({ id: 'cola_1', type: 'cylinder', x: 200, y: 100, radius: 32, height3D: 65, color: '#c0392b' }));
      this.props.push(new WorldProp({ id: 'sparkling_water', type: 'cylinder', x: -50, y: 150, radius: 30, height3D: 70, color: '#2980b9' }));
      this.props.push(new WorldProp({ id: 'coffee_mug', type: 'cylinder', x: -350, y: 100, radius: 40, height3D: 55, color: '#ecf0f1' }));
      this.props.push(new WorldProp({ id: 'battery_1', type: 'cylinder', x: 300, y: -150, radius: 16, height3D: 45, color: '#f39c12' }));
      this.props.push(new WorldProp({ id: 'sponge_box', type: 'box', x: 50, y: -200, width: 80, height: 50, height3D: 25, color: '#27ae60' }));
    } else if (env === 'workshop') {
      // Paint cans, motor oil bottles, tape rolls, metal toolboxes
      this.props.push(new WorldProp({ id: 'paint_can', type: 'cylinder', x: 250, y: 50, radius: 45, height3D: 60, color: '#d35400' }));
      this.props.push(new WorldProp({ id: 'motor_oil', type: 'box', x: -100, y: 120, width: 65, height: 45, height3D: 75, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'tape_roll', type: 'cylinder', x: -300, y: -50, radius: 38, height3D: 40, color: '#34495e' }));
      this.props.push(new WorldProp({ id: 'spray_can', type: 'cylinder', x: 100, y: -250, radius: 24, height3D: 80, color: '#2980b9' }));
    } else if (env === 'garden') {
      // Terracotta flower pots, garden stones, garden gnome
      this.props.push(new WorldProp({ id: 'flower_pot_1', type: 'cylinder', x: 150, y: 120, radius: 42, height3D: 55, color: '#d35400' }));
      this.props.push(new WorldProp({ id: 'flower_pot_2', type: 'cylinder', x: -200, y: -100, radius: 36, height3D: 50, color: '#ba4a00' }));
      this.props.push(new WorldProp({ id: 'watering_can', type: 'cylinder', x: -100, y: 220, radius: 35, height3D: 60, color: '#27ae60' }));
    } else if (env === 'playroom') {
      // Toy building blocks, dice, cardboard box
      this.props.push(new WorldProp({ id: 'toy_block_red', type: 'box', x: 120, y: 80, width: 55, height: 55, height3D: 55, color: '#e74c3c' }));
      this.props.push(new WorldProp({ id: 'toy_block_blue', type: 'box', x: -150, y: 100, width: 60, height: 60, height3D: 60, color: '#3498db' }));
      this.props.push(new WorldProp({ id: 'toy_drum', type: 'cylinder', x: 220, y: -180, radius: 44, height3D: 45, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'cardboard_crate', type: 'box', x: -280, y: -150, width: 90, height: 70, height3D: 50, color: '#b9770e' }));
    } else {
      // Office desk: pencil cup, stapler, coffee mug, paper ream
      this.props.push(new WorldProp({ id: 'mug', type: 'cylinder', x: 120, y: 60, radius: 38, height3D: 50, color: '#2c3e50' }));
      this.props.push(new WorldProp({ id: 'pencil_cup', type: 'cylinder', x: -180, y: 180, radius: 28, height3D: 65, color: '#16a085' }));
      this.props.push(new WorldProp({ id: 'paper_stack', type: 'box', x: 200, y: -150, width: 90, height: 65, height3D: 30, color: '#ffffff' }));
      this.props.push(new WorldProp({ id: 'stapler_box', type: 'box', x: -120, y: -180, width: 70, height: 35, height3D: 25, color: '#7f8c8d' }));
    }
  }

  resolveCollisions(car) {
    let collided = false;
    for (const prop of this.props) {
      if (prop.resolveCollision(car)) {
        collided = true;
      }
    }
    return collided;
  }

  render(ctx) {
    for (const prop of this.props) {
      prop.render(ctx);
    }
  }
}
