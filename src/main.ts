const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const shotSound = new Audio("lmg_fire01.flac");
const loseSound = new Audio("lose sound 2 - 2.flac");

type Disc = {
  x: number;
  y: number;
  radius: number;
  velocity: number;
  remove: boolean;
  duration: number; // stay alive in seconds
};

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

type TText = {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
};

const gameState = {
  ctx: ctx!,
  mousePosition: { x: 0, y: 0 },
  discs: [] as Array<Disc>,
  paused: true,
  gameOver: false,
  availableShots: 10,
  shots: {
    missed: 0,
    good: 0,
    perfect: 0,
  },
  lastSpawedDisc: 0,
  accuracy: 0,
  texts: [] as Array<{ text: TText; duration: number; remove: boolean }>,
};

type GameState = typeof gameState;

function shot(a: Aim, b: Disc, tolerance: number = 1): ShotAccuracy {
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

function resizeCanvas(ctx: CanvasRenderingContext2D) {
  const aspect = 16 / 9;

  let width = window.innerWidth;
  let height = window.innerHeight;

  // Adjust height to keep ratio
  if (width / height > aspect) {
    width = height * aspect;
  } else {
    height = width / aspect;
  }

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // Set actual drawing buffer (high DPI support)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any scaling
  ctx.scale(dpr, dpr); // ensure drawings are sharp
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  radius: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, true);
  ctx.fill();
}

function renderCursor(ctx: CanvasRenderingContext2D) {
  renderCircle(ctx, gameState.mousePosition, 3, "#181818");
}

function renderDiscs(state: GameState, delta: number) {
  for (const disc of state.discs) {
    renderCircle(state.ctx, { x: disc.x, y: disc.y }, disc.radius, "#fe9a00");
    disc.duration -= delta;
    if (disc.duration < 0) {
      gameState.availableShots -= 1;
      disc.remove = true;

      gameState.texts.push({
        text: {
          text: "You missed!",
          x: disc.x - 20,
          y: disc.y + 20,
          font: "14px sans-serif",
          color: "red",
        },
        duration: 0.5,
        remove: false,
      });
      loseSound.currentTime = 0;
      loseSound.play();
    }
  }
}

function renderText(ctx: CanvasRenderingContext2D, text: TText) {
  ctx.fillStyle = text.color;
  ctx.font = text.font;
  ctx.fillText(text.text, text.x, text.y);
}

function renderStats(ctx: CanvasRenderingContext2D) {
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
    y: canvas.height - 20,
    font: "18px sans-serif",
    color: "black",
  });
}

function render(ctx: CanvasRenderingContext2D, delta: number) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderStats(ctx);
  renderDiscs(gameState, delta);

  for (const text of gameState.texts) {
    if (text.duration <= 0) {
      text.remove = true;
      continue;
    }

    renderText(ctx, text.text);
    text.duration -= delta;
  }

  renderCursor(ctx);
}

function renderGameOver(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gameOverStr = `GAME OVER`;

  ctx.fillStyle = "black";
  ctx.font = "24px sans-serif";
  const metrics = ctx.measureText(gameOverStr);

  ctx.fillText(
    gameOverStr,
    (canvas.width - metrics.width) / 2,
    (canvas.height - 24) / 2
  );
}

// Call once and on resize
window.addEventListener("resize", () => {
  resizeCanvas(ctx!);
});

resizeCanvas(ctx!);

function handleMouseMovement(event: MouseEvent) {
  gameState.mousePosition.x += event.movementX;
  gameState.mousePosition.y += event.movementY;
}

function handleMouseClick(_event: MouseEvent) {
  let accuracy = ShotAccuracy.Missed;

  shotSound.currentTime = 0;
  shotSound.play();

  const aim = {
    x: gameState.mousePosition.x,
    y: gameState.mousePosition.y,
    radius: 2,
  };

  for (const disc of gameState.discs) {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function spawDisc() {
  const rand = Math.random();

  const padding = 100;
  const radius = clamp(20 * rand, 5, 20);
  const x = clamp(
    canvas.width * rand,
    radius + padding,
    canvas.width - radius - padding
  );
  const y = clamp(
    canvas.height * rand,
    radius + padding,
    canvas.height - radius - padding
  );

  gameState.discs.push({
    x,
    y,
    radius,
    velocity: 200 * rand,
    remove: false,
    duration: 2,
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.code === "Space") {
    spawDisc();
  }
}

canvas.addEventListener("click", async () => {
  if (!document.pointerLockElement) {
    await canvas.requestPointerLock({
      unadjustedMovement: true,
    });
  }
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas) {
    document.addEventListener("mousemove", handleMouseMovement);
    document.addEventListener("mousedown", handleMouseClick);
    document.addEventListener("keydown", handleKeyDown);

    gameState.paused = false;
  } else {
    document.removeEventListener("mousemove", handleMouseMovement);
    document.removeEventListener("mousedown", handleMouseClick);
    document.removeEventListener("keydown", handleKeyDown);

    gameState.paused = true;
  }
});

let previousTimestamp: DOMHighResTimeStamp = 0;

function gameLoop(timestamp: DOMHighResTimeStamp) {
  const delta = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  if (gameState.gameOver) {
    renderGameOver(ctx!);
    return;
  }

  if (!gameState.paused) {
    gameState.discs = gameState.discs.filter((x) => !x.remove);
    gameState.texts = gameState.texts.filter((x) => !x.remove);

    if (gameState.discs.length < 3 && gameState.lastSpawedDisc > 1) {
      spawDisc();
      gameState.lastSpawedDisc = 0;
    } else {
      gameState.lastSpawedDisc += delta;
    }

    render(ctx!, delta);
  }

  requestAnimationFrame(gameLoop);
}

// skip the first frame so we can save the previousTimestamp correctly
requestAnimationFrame((timestamp) => {
  previousTimestamp = timestamp;
  requestAnimationFrame(gameLoop);
});
