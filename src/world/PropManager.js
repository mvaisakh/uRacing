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
      // Soda Cans, Salt Shakers, Coffee Mugs
      this.props.push(new WorldProp({ id: 'cola_1', type: 'cylinder', x: 200, y: 100, radius: 36, color: '#c0392b' }));
      this.props.push(new WorldProp({ id: 'sparkling_water', type: 'cylinder', x: -50, y: 150, radius: 32, color: '#2980b9' }));
      this.props.push(new WorldProp({ id: 'coffee_mug', type: 'cylinder', x: -400, y: 100, radius: 45, color: '#ecf0f1' }));
      this.props.push(new WorldProp({ id: 'battery_1', type: 'cylinder', x: 350, y: -150, radius: 18, color: '#f39c12' }));
      this.props.push(new WorldProp({ id: 'sponge_box', type: 'box', x: 50, y: -200, width: 80, height: 50, color: '#27ae60' }));
    } else if (env === 'workshop') {
      // Paint cans, bolts, toolboxes
      this.props.push(new WorldProp({ id: 'paint_can', type: 'cylinder', x: 300, y: 50, radius: 50, color: '#e67e22' }));
      this.props.push(new WorldProp({ id: 'motor_oil', type: 'box', x: -100, y: 120, width: 70, height: 45, color: '#f1c40f' }));
      this.props.push(new WorldProp({ id: 'tape_roll', type: 'cylinder', x: -350, y: -50, radius: 40, color: '#7f8c8d' }));
    } else {
      // Office desk: stapler, coffee mug, sticky notes
      this.props.push(new WorldProp({ id: 'mug', type: 'cylinder', x: 100, y: 50, radius: 42, color: '#34495e' }));
      this.props.push(new WorldProp({ id: 'sticky_note', type: 'box', x: -200, y: 200, width: 60, height: 60, color: '#f1c40f' }));
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
