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
const gameState = {
    ctx: ctx,
    mousePosition: { x: 0, y: 0 },
    discs: [],
    paused: true,
    bullets: 10,
};
var ShotAccuracy;
(function (ShotAccuracy) {
    ShotAccuracy[ShotAccuracy["Missed"] = 0] = "Missed";
    ShotAccuracy[ShotAccuracy["Touch"] = 1] = "Touch";
    ShotAccuracy[ShotAccuracy["Perfect"] = 2] = "Perfect";
})(ShotAccuracy || (ShotAccuracy = {}));
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
        return ShotAccuracy.Perfect;
    }
    return ShotAccuracy.Touch;
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
        renderCircle(state.ctx, { x: disc.x, y: disc.y }, disc.radius, "red");
        disc.x += delta * disc.velocity;
        if (disc.x > canvas.width) {
            // @todo: you missed this one handle it properly
            disc.remove = true;
        }
    }
}
function renderStats(ctx) {
    ctx.fillStyle = "black";
    ctx.font = "18px sans-serif";
    ctx.fillText(`Bullets: ${gameState.bullets}`, 20, 30);
}
function render(ctx, delta) {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    renderStats(ctx);
    renderDiscs(gameState, delta);
    renderCursor(ctx);
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
    for (const disc of gameState.discs) {
        accuracy = shot({
            x: gameState.mousePosition.x,
            y: gameState.mousePosition.y,
            radius: 2,
        }, disc);
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
function handleKeyDown(event) {
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
    if (!gameState.paused) {
        gameState.discs = gameState.discs.filter((x) => !x.remove);
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