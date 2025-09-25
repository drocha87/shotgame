import { clamp, renderCircle, renderText } from "./utils.js";
const shotSound = new Audio("lmg_fire01.flac");
const loseSound = new Audio("lose sound 2 - 2.flac");
export const gameState = {
    width: 0, // will be initialized on main.ts
    height: 0, // will be initialized on main.ts
    mousePosition: { x: 0, y: 0 },
    targets: [],
    paused: true,
    level: 1,
    availableShots: 2,
    shots: {
        missed: 0,
        good: 0,
        perfect: 0,
    },
    lastSpawedDisc: 0,
    accuracy: 0,
    texts: [],
    maxDiscRadius: 100,
    maxTargetDuration: 2,
};
var ShotAccuracy;
(function (ShotAccuracy) {
    ShotAccuracy[ShotAccuracy["Missed"] = 0] = "Missed";
    ShotAccuracy[ShotAccuracy["Touch"] = 1] = "Touch";
    ShotAccuracy[ShotAccuracy["Perfect"] = 2] = "Perfect";
})(ShotAccuracy || (ShotAccuracy = {}));
export function shot(a, b, tolerance = 1) {
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
export function renderAim(ctx) {
    if (gameState.level < 3) {
        ctx.strokeStyle = "#a1a1a155";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, gameState.mousePosition.y);
        ctx.lineTo(gameState.width, gameState.mousePosition.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gameState.mousePosition.x, 0);
        ctx.lineTo(gameState.mousePosition.x, gameState.height);
        ctx.stroke();
    }
    renderCircle(ctx, gameState.mousePosition, 3, "#181818");
    renderCircle(ctx, gameState.mousePosition, 1.5, "white");
}
export function renderStats(ctx) {
    renderText(ctx, {
        text: `Available Shots: ${gameState.availableShots}`,
        x: 20,
        y: 30,
        font: "18px sans-serif",
        color: "black",
    });
    const { good, missed, perfect } = gameState.shots;
    let accuracy = 0;
    if (good + perfect > 0) {
        accuracy = (good + perfect) / (missed + good + perfect);
    }
    renderText(ctx, {
        text: `Total Shots: ${good + perfect + missed}`,
        x: 20,
        y: 60,
        font: "18px sans-serif",
        color: "black",
    });
    renderText(ctx, {
        text: `Level: ${gameState.level}`,
        x: 20,
        y: 90,
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
export function handleMouseClick(_event) {
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
                let text = "Perferct shot!";
                if (gameState.level / gameState.shots.perfect <= 0.25) {
                    gameState.level += 1;
                    gameState.maxDiscRadius *= 0.95;
                    gameState.maxTargetDuration *= 0.95;
                    text = "Level up!";
                }
                gameState.texts.push({
                    text: {
                        text,
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
export function spawTarget() {
    const { width, height, maxDiscRadius: mr } = gameState;
    const pad = 100;
    const r = clamp(mr * Math.random(), mr / 5, mr);
    const x = clamp(width * Math.random(), r + pad, width - r - pad);
    const y = clamp(height * Math.random(), r + pad, height - r - pad);
    gameState.targets.push({
        x,
        y,
        radius: r,
        remove: false,
        duration: gameState.maxTargetDuration,
    });
}
export function renderTargets(ctx, targets, delta) {
    for (const target of targets) {
        ctx.strokeStyle = "#AD391F";
        const lineWidth = target.radius / 10;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const progress = target.duration / gameState.maxTargetDuration;
        ctx.arc(target.x, target.y, target.radius + 1, 0, 2 * Math.PI * progress, true);
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
export function render(ctx, delta) {
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
//# sourceMappingURL=game.js.map