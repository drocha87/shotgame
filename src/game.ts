import { clamp, renderCircle, renderText, type TText } from "./utils.js";

const shotSound = new Audio("lmg_fire01.flac");
const loseSound = new Audio("lose sound 2 - 2.flac");

export const gameState = {
  width: 0, // will be initialized on main.ts
  height: 0, // will be initialized on main.ts
  mousePosition: { x: 0, y: 0 },
  targets: [] as Array<TTarget>,
  paused: true,
  gameOver: false,
  availableShots: 2,
  shots: {
    missed: 0,
    good: 0,
    perfect: 0,
  },
  lastSpawedDisc: 0,
  accuracy: 0,
  texts: [] as Array<{ text: TText; duration: number; remove: boolean }>,
  maxDiscRadius: 100,
};

export type GameState = typeof gameState;

type Aim = {
  x: number;
  y: number;
  radius: number;
};

enum ShotAccuracy {
  Missed,
  Touch,
  Perfect,
}

export function shot(a: Aim, b: TTarget, tolerance: number = 1): ShotAccuracy {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius + tolerance;
  const radiusSumSquared = radiusSum * radiusSum;
  const radiusDiff = Math.abs(a.radius - b.radius) - tolerance;
  const radiusDiffSquared = radiusDiff * radiusDiff;

  if (distanceSquared > radiusSumSquared) {
    return ShotAccuracy.Missed;
  }

  if (
    distanceSquared >= radiusDiffSquared &&
    distanceSquared <= radiusSumSquared
  ) {
    return ShotAccuracy.Touch;
  }

  return ShotAccuracy.Perfect;
}

export function renderAim(ctx: CanvasRenderingContext2D) {
  renderCircle(ctx, gameState.mousePosition, 3, "#181818");
}

export function renderStats(ctx: CanvasRenderingContext2D) {
  renderText(ctx, {
    text: `Available Shots: ${gameState.availableShots}`,
    x: 20,
    y: 30,
    font: "18px sans-serif",
    color: "black",
  });

  const { good, missed, perfect } = gameState.shots;
  const accuracy = (good + perfect) / (missed + good + perfect);

  renderText(ctx, {
    text: `Total Shots: ${good + perfect + missed}`,
    x: 20,
    y: 60,
    font: "18px sans-serif",
    color: "black",
  });

  renderText(ctx, {
    text: `Accuracy: ${Math.floor(accuracy * 100)}%`,
    x: 20,
    y: gameState.height - 20,
    font: "18px sans-serif",
    color: "black",
  });
}

export function handleMouseClick(_event: MouseEvent) {
  let accuracy = ShotAccuracy.Missed;

  shotSound.currentTime = 0;
  shotSound.play();

  const aim = {
    x: gameState.mousePosition.x,
    y: gameState.mousePosition.y,
    radius: 2,
  };

  for (const disc of gameState.targets) {
    accuracy = shot(aim, disc);
    if (accuracy === ShotAccuracy.Touch || accuracy === ShotAccuracy.Perfect) {
      disc.remove = true;
      break;
    }
  }

  switch (accuracy) {
    case ShotAccuracy.Missed:
      {
        gameState.availableShots -= 1;
        gameState.shots.missed += 1;

        gameState.texts.push({
          text: {
            text: "You missed!",
            x: aim.x - 20,
            y: aim.y + 20,
            font: "14px sans-serif",
            color: "black",
          },
          duration: 0.5,
          remove: false,
        });
      }
      break;

    case ShotAccuracy.Touch:
      {
        gameState.shots.good += 1;
        gameState.texts.push({
          text: {
            text: "Good shot!",
            x: aim.x - 20,
            y: aim.y + 20,
            font: "14px sans-serif",
            color: "black",
          },
          duration: 0.5,
          remove: false,
        });
      }
      break;

    case ShotAccuracy.Perfect:
      {
        gameState.shots.perfect += 1;
        gameState.availableShots += 1;

        gameState.texts.push({
          text: {
            text: "Perfect shot!",
            x: aim.x - 20,
            y: aim.y + 20,
            font: "14px sans-serif",
            color: "black",
          },
          duration: 0.5,
          remove: false,
        });
      }
      break;
  }
}

export type TTarget = {
  x: number;
  y: number;
  radius: number;
  velocity: number;
  remove: boolean;
  duration: number; // stay alive in seconds
  maxDuration: number;
};

export function spawTarget() {
  const rand = Math.random();

  const padding = 100;
  const radius = clamp(
    gameState.maxDiscRadius * rand,
    gameState.maxDiscRadius / 5,
    gameState.maxDiscRadius
  );
  const x = clamp(
    gameState.width * rand,
    radius + padding,
    gameState.width - radius - padding
  );
  const y = clamp(
    gameState.height * rand,
    radius + padding,
    gameState.height - radius - padding
  );

  gameState.targets.push({
    x,
    y,
    radius,
    velocity: 200 * rand,
    remove: false,
    duration: 2,
    maxDuration: 2,
  });
}

export function renderTargets(
  ctx: CanvasRenderingContext2D,
  targets: Array<TTarget>,
  delta: number
) {
  for (const target of targets) {
    ctx.strokeStyle = "#AD391F";

    const lineWidth = target.radius / 10;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    const progress = target.duration / target.maxDuration;
    ctx.arc(
      target.x,
      target.y,
      target.radius + 1,
      0,
      2 * Math.PI * progress,
      true
    );
    ctx.stroke();

    renderCircle(ctx, { x: target.x, y: target.y }, target.radius, "#F54927");

    target.duration -= delta;
    if (target.duration < 0) {
      gameState.availableShots -= 1;

      gameState.texts.push({
        text: {
          text: "You missed!",
          x: target.x - 20,
          y: target.y + 20,
          font: "14px sans-serif",
          color: "red",
        },
        duration: 0.5,
        remove: false,
      });
      target.remove = true;

      loseSound.currentTime = 0;
      loseSound.play();
    }
  }
}

export function render(ctx: CanvasRenderingContext2D, delta: number) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, gameState.width, gameState.height);

  renderStats(ctx);
  renderTargets(ctx, gameState.targets, delta);

  for (const text of gameState.texts) {
    if (text.duration <= 0) {
      text.remove = true;
      continue;
    }

    renderText(ctx, text.text);
    text.duration -= delta;
  }

  renderAim(ctx);
}
