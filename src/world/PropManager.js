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
      this.props.push(new WorldProp({ id: 'cola_1', type: 'cylinder', x: 220, y: 120, radius: 46, height3D: 140, color: '#c0392b' }));
      this.props.push(new WorldProp({ id: 'sparkling_water', type: 'cylinder', x: -60, y: 180, radius: 44, height3D: 150, color: '#2980b9' }));
      this.props.push(new WorldProp({ id: 'coffee_mug', type: 'cylinder', x: -320, y: 80, radius: 52, height3D: 110, color: '#ecf0f1' }));
      this.props.push(new WorldProp({ id: 'sponge_box', type: 'box', x: 40, y: -160, width: 110, height: 70, height3D: 45, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'cola_2', type: 'cylinder', x: 380, y: -80, radius: 42, height3D: 130, color: '#27ae60' }));
    } else if (env === 'workshop') {
      // Paint cans, motor oil bottles, tape rolls, metal toolboxes
      this.props.push(new WorldProp({ id: 'paint_can', type: 'cylinder', x: 240, y: 60, radius: 58, height3D: 130, color: '#d35400' }));
      this.props.push(new WorldProp({ id: 'motor_oil', type: 'box', x: -120, y: 140, width: 95, height: 60, height3D: 125, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'tape_roll', type: 'cylinder', x: -280, y: -40, radius: 48, height3D: 65, color: '#34495e' }));
      this.props.push(new WorldProp({ id: 'spray_can', type: 'cylinder', x: 120, y: -200, radius: 36, height3D: 145, color: '#2980b9' }));
    } else if (env === 'garden') {
      // Terracotta flower pots, garden stones, garden gnome
      this.props.push(new WorldProp({ id: 'flower_pot_1', type: 'cylinder', x: 180, y: 140, radius: 58, height3D: 120, color: '#d35400' }));
      this.props.push(new WorldProp({ id: 'flower_pot_2', type: 'cylinder', x: -220, y: -80, radius: 50, height3D: 110, color: '#ba4a00' }));
      this.props.push(new WorldProp({ id: 'watering_can', type: 'cylinder', x: -80, y: 200, radius: 48, height3D: 115, color: '#27ae60' }));
    } else if (env === 'playroom') {
      // Toy building blocks, dice, cardboard box
      this.props.push(new WorldProp({ id: 'toy_block_red', type: 'box', x: 140, y: 70, width: 85, height: 85, height3D: 85, color: '#e74c3c' }));
      this.props.push(new WorldProp({ id: 'toy_block_blue', type: 'box', x: -160, y: 90, width: 90, height: 90, height3D: 90, color: '#3498db' }));
      this.props.push(new WorldProp({ id: 'toy_drum', type: 'cylinder', x: 240, y: -150, radius: 60, height3D: 85, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'cardboard_crate', type: 'box', x: -260, y: -130, width: 120, height: 95, height3D: 80, color: '#b9770e' }));
    } else {
      // Office desk: pencil cup, stapler, coffee mug, paper ream
      this.props.push(new WorldProp({ id: 'mug', type: 'cylinder', x: 140, y: 70, radius: 50, height3D: 105, color: '#2c3e50' }));
      this.props.push(new WorldProp({ id: 'pencil_cup', type: 'cylinder', x: -160, y: 160, radius: 42, height3D: 130, color: '#16a085' }));
      this.props.push(new WorldProp({ id: 'paper_stack', type: 'box', x: 220, y: -120, width: 130, height: 95, height3D: 55, color: '#ffffff' }));
      this.props.push(new WorldProp({ id: 'stapler_box', type: 'box', x: -100, y: -150, width: 105, height: 50, height3D: 45, color: '#7f8c8d' }));
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
