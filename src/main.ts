import { gameState, handleMouseClick, render, spawTarget } from "./game.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

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
  gameState.width = width;
  gameState.height = height;

  // Set actual drawing buffer (high DPI support)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any scaling
  ctx.scale(dpr, dpr); // ensure drawings are sharp
}

function renderGameOver(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gameOverStr = "GAME OVER";

  ctx.fillStyle = "black";
  ctx.font = "24px sans-serif";
  const metrics = ctx.measureText(gameOverStr);

  let x = (canvas.width - metrics.width) / 2;
  let y = (canvas.height - 24) / 2;
  ctx.fillText(gameOverStr, x, y);

  const { good, missed, perfect } = gameState.shots;
  let accuracy = 0;
  if (good + perfect > 0) {
    accuracy = (good + perfect) / (missed + good + perfect);
  }

  x += 25;
  y += 35;
  ctx.font = "14px sans-serif";
  ctx.fillText(`Total Shots: ${good + perfect + missed}`, x, y);

  y += 25;
  ctx.fillText(`Accuracy: ${Math.floor(accuracy * 100)}%`, x, y);

  y += 25;
  ctx.fillText(`Level: ${gameState.level}`, x, y);
}

function handleMouseMovement(event: MouseEvent) {
  gameState.mousePosition.x += event.movementX;
  gameState.mousePosition.y += event.movementY;
}

function handleKeyDown(event: KeyboardEvent) {
  // if (event.code === "Space") {
  //   spawTarget();
  // }
}

// Call once and on resize
window.addEventListener("resize", () => {
  resizeCanvas(ctx!);
});

resizeCanvas(ctx!);

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

  if (gameState.availableShots <= 0) {
    renderGameOver(ctx!);
    return;
  }

  if (!gameState.paused) {
    gameState.targets = gameState.targets.filter((x) => !x.remove);
    gameState.texts = gameState.texts.filter((x) => !x.remove);

    if (gameState.targets.length < 3 && gameState.lastSpawedDisc > 1) {
      spawTarget();
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
