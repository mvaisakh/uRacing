import { Vec2 } from '../math/Vec2.js';

/**
 * NitroFlames: Renders blue and orange exhaust flame jets during nitro acceleration.
 */
export class NitroFlames {
  static render(ctx, car) {
    const heading = Vec2.fromAngle(car.body.angle);
    const rearPos = car.body.position.clone().sub(heading.clone().scale(car.length * 0.52));
    const right = new Vec2(-heading.y, heading.x);

    const pipes = [
      rearPos.clone().add(right.clone().scale(-car.width * 0.28)),
      rearPos.clone().add(right.clone().scale(car.width * 0.28))
    ];

    ctx.save();
    for (const pipe of pipes) {
      const flameLength = 12 + Math.random() * 18;
      const flameTip = pipe.clone().sub(heading.clone().scale(flameLength));
      const flameSide1 = pipe.clone().add(right.clone().scale(3.5));
      const flameSide2 = pipe.clone().sub(right.clone().scale(3.5));

      // Outer cyan flame
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.moveTo(flameSide1.x, flameSide1.y);
      ctx.lineTo(flameTip.x, flameTip.y);
      ctx.lineTo(flameSide2.x, flameSide2.y);
      ctx.closePath();
      ctx.fill();

      // Inner intense core
      ctx.fillStyle = '#ffffff';
      const innerTip = pipe.clone().sub(heading.clone().scale(flameLength * 0.5));
      ctx.beginPath();
      ctx.moveTo(pipe.x - 1.5, pipe.y);
      ctx.lineTo(innerTip.x, innerTip.y);
      ctx.lineTo(pipe.x + 1.5, pipe.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
