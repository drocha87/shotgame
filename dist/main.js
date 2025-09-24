"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const shotSound = new Audio("lmg_fire01.flac");
const loseSound = new Audio("lose sound 2 - 2.flac");
var ShotAccuracy;
(function (ShotAccuracy) {
    ShotAccuracy[ShotAccuracy["Missed"] = 0] = "Missed";
    ShotAccuracy[ShotAccuracy["Touch"] = 1] = "Touch";
    ShotAccuracy[ShotAccuracy["Perfect"] = 2] = "Perfect";
})(ShotAccuracy || (ShotAccuracy = {}));
const gameState = {
    ctx: ctx,
    mousePosition: { x: 0, y: 0 },
    discs: [],
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
    texts: [],
};
function shot(a, b, tolerance = 1) {
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
    if (distanceSquared >= radiusDiffSquared &&
        distanceSquared <= radiusSumSquared) {
        return ShotAccuracy.Touch;
    }
    return ShotAccuracy.Perfect;
}
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
    // Set actual drawing buffer (high DPI support)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any scaling
    ctx.scale(dpr, dpr); // ensure drawings are sharp
}
function renderCircle(ctx, position, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, true);
    ctx.fill();
}
function renderCursor(ctx) {
    renderCircle(ctx, gameState.mousePosition, 3, "#181818");
}
function renderDiscs(state, delta) {
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
function renderText(ctx, text) {
    ctx.fillStyle = text.color;
    ctx.font = text.font;
    ctx.fillText(text.text, text.x, text.y);
}
function renderStats(ctx) {
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
function render(ctx, delta) {
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
function renderGameOver(ctx) {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gameOverStr = `GAME OVER`;
    ctx.fillStyle = "black";
    ctx.font = "24px sans-serif";
    const metrics = ctx.measureText(gameOverStr);
    ctx.fillText(gameOverStr, (canvas.width - metrics.width) / 2, (canvas.height - 24) / 2);
}
// Call once and on resize
window.addEventListener("resize", () => {
    resizeCanvas(ctx);
});
resizeCanvas(ctx);
function handleMouseMovement(event) {
    gameState.mousePosition.x += event.movementX;
    gameState.mousePosition.y += event.movementY;
}
function handleMouseClick(_event) {
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
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function spawDisc() {
    const rand = Math.random();
    const padding = 100;
    const radius = clamp(20 * rand, 5, 20);
    const x = clamp(canvas.width * rand, radius + padding, canvas.width - radius - padding);
    const y = clamp(canvas.height * rand, radius + padding, canvas.height - radius - padding);
    gameState.discs.push({
        x,
        y,
        radius,
        velocity: 200 * rand,
        remove: false,
        duration: 2,
    });
}
function handleKeyDown(event) {
    if (event.code === "Space") {
        spawDisc();
    }
}
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
    if (gameState.gameOver) {
        renderGameOver(ctx);
        return;
    }
    if (!gameState.paused) {
        gameState.discs = gameState.discs.filter((x) => !x.remove);
        gameState.texts = gameState.texts.filter((x) => !x.remove);
        if (gameState.discs.length < 3 && gameState.lastSpawedDisc > 1) {
            spawDisc();
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