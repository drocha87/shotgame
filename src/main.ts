const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const shotSound = new Audio("lmg_fire01.flac");

type Disc = {
  x: number;
  y: number;
  radius: number;
  velocity: number;
  remove: boolean;
};

const gameState = {
  ctx: ctx!,
  mousePosition: { x: 0, y: 0 },
  discs: [] as Array<Disc>,
  paused: true,
  bullets: 10,
};

type GameState = typeof gameState;

enum ShotAccuracy {
  Missed,
  Touch,
  Perfect,
}

function shot(
  a: Pick<Disc, "x" | "y" | "radius">,
  b: Disc,
  tolerance: number = 1
): ShotAccuracy {
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
    return ShotAccuracy.Perfect;
  }

  return ShotAccuracy.Touch;
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
    renderCircle(state.ctx, { x: disc.x, y: disc.y }, disc.radius, "red");
    disc.x += delta * disc.velocity;
    if (disc.x > canvas.width) {
      // @todo: you missed this one handle it properly
      disc.remove = true;
    }
  }
}

function renderStats(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "black";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Bullets: ${gameState.bullets}`, 20, 30);
}

function render(ctx: CanvasRenderingContext2D, delta: number) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderStats(ctx);
  renderDiscs(gameState, delta);
  renderCursor(ctx);
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

  for (const disc of gameState.discs) {
    accuracy = shot(
      {
        x: gameState.mousePosition.x,
        y: gameState.mousePosition.y,
        radius: 2,
      },
      disc
    );

    if (accuracy === ShotAccuracy.Touch || accuracy === ShotAccuracy.Perfect) {
      disc.remove = true;
      break;
    }
  }

  switch (accuracy) {
    case ShotAccuracy.Missed:
      {
        gameState.bullets -= 1;
      }
      break;

    case ShotAccuracy.Touch:
      {
      }
      break;

    case ShotAccuracy.Perfect:
      {
        gameState.bullets += 1;
      }
      break;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.code === "Space") {
    const rand = Math.random();
    gameState.discs.push({
      x: 0,
      y: canvas.height * rand,
      radius: 10,
      velocity: 200 * rand,
      remove: false,
    });
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

  if (!gameState.paused) {
    gameState.discs = gameState.discs.filter((x) => !x.remove);

    render(ctx!, delta);
  }

  requestAnimationFrame(gameLoop);
}

// skip the first frame so we can save the previousTimestamp correctly
requestAnimationFrame((timestamp) => {
  previousTimestamp = timestamp;
  requestAnimationFrame(gameLoop);
});
