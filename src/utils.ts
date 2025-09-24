export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type TText = {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
};

export function renderCircle(
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

export function renderText(ctx: CanvasRenderingContext2D, text: TText) {
  ctx.fillStyle = text.color;
  ctx.font = text.font;
  ctx.fillText(text.text, text.x, text.y);
}
