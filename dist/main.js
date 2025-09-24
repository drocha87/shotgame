var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { gameState, handleMouseClick, render, spawTarget } from "./game.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resizeCanvas(ctx) {
    const aspect = 16 / 9;
    let width = window.innerWidth;
    let height = window.innerHeight;
    // Adjust height to keep ratio
    if (width / height > aspect) {
        width = height * aspect;
    }
    else {
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
function renderGameOver(ctx) {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gameOverStr = `GAME OVER`;
    ctx.fillStyle = "black";
    ctx.font = "24px sans-serif";
    const metrics = ctx.measureText(gameOverStr);
    ctx.fillText(gameOverStr, (canvas.width - metrics.width) / 2, (canvas.height - 24) / 2);
}
function handleMouseMovement(event) {
    gameState.mousePosition.x += event.movementX;
    gameState.mousePosition.y += event.movementY;
}
function handleKeyDown(event) {
    // if (event.code === "Space") {
    //   spawTarget();
    // }
}
// Call once and on resize
window.addEventListener("resize", () => {
    resizeCanvas(ctx);
});
resizeCanvas(ctx);
canvas.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    if (!document.pointerLockElement) {
        yield canvas.requestPointerLock({
            unadjustedMovement: true,
        });
    }
}));
document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", handleMouseMovement);
        document.addEventListener("mousedown", handleMouseClick);
        document.addEventListener("keydown", handleKeyDown);
        gameState.paused = false;
    }
    else {
        document.removeEventListener("mousemove", handleMouseMovement);
        document.removeEventListener("mousedown", handleMouseClick);
        document.removeEventListener("keydown", handleKeyDown);
        gameState.paused = true;
    }
});
let previousTimestamp = 0;
function gameLoop(timestamp) {
    const delta = (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    if (gameState.availableShots <= 0) {
        renderGameOver(ctx);
        return;
    }
    if (!gameState.paused) {
        gameState.targets = gameState.targets.filter((x) => !x.remove);
        gameState.texts = gameState.texts.filter((x) => !x.remove);
        if (gameState.targets.length < 3 && gameState.lastSpawedDisc > 1) {
            spawTarget();
            gameState.lastSpawedDisc = 0;
        }
        else {
            gameState.lastSpawedDisc += delta;
        }
        render(ctx, delta);
    }
    requestAnimationFrame(gameLoop);
}
// skip the first frame so we can save the previousTimestamp correctly
requestAnimationFrame((timestamp) => {
    previousTimestamp = timestamp;
    requestAnimationFrame(gameLoop);
});
//# sourceMappingURL=main.js.map