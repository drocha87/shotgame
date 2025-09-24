export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function renderCircle(ctx, position, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, true);
    ctx.fill();
}
export function renderText(ctx, text) {
    ctx.fillStyle = text.color;
    ctx.font = text.font;
    ctx.fillText(text.text, text.x, text.y);
}
//# sourceMappingURL=utils.js.map