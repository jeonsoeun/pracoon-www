export const drawBox = (
	canvas: HTMLCanvasElement,
	x: number,
	y: number,
	width: number,
	height: number,
	color: string
) => {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	ctx.fillStyle = color;
	ctx.fillRect(x, y, width, height);
};
