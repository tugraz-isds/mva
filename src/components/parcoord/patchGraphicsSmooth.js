//*** Source: https://codesandbox.io/s/pixi-graphics-line-intersect-gw46lb?file=/src/index.js:174-196 ***/
import { Rectangle, Matrix, Point } from '@pixi/math';
import { SmoothGraphics, SmoothGraphicsGeometry, LINE_SCALE_MODE } from '@pixi/graphics-smooth';

function geomIntersectsRect(rect, transform = Matrix.IDENTITY) {
	const { graphicsData } = this;
	let tempMat = null;
	const tRect = new Rectangle();
	const tCenter = new Point();
	let lastMat = null;
	for (let i = 0; i < graphicsData.length; i++) {
		const smd = graphicsData[i];
		const { points } = smd;
		let mat = transform;

		if (points.length === 0) continue;
		if (smd.matrix) {
			tempMat = tempMat || new Matrix();
			mat = tempMat.copyFrom(transform).append(smd.matrix);
		}

		let xEnd = mat.a * points[0] + mat.c * points[1] + mat.tx;
		let yEnd = mat.b * points[0] + mat.d * points[1] + mat.ty;
		let len = points.length;

		if (rect.contains(xEnd, yEnd)) {
			return i;
		}

		if (smd.closeStroke || smd.fillStyle.visible) {
			len += 2;
		}

		tRect.copyFrom(rect);
		if (smd.lineStyle.visible) {
			let lw = smd.lineStyle.width;

			lw *= 0.5 * (1.0 + Math.abs(smd.lineStyle.alignment));
			if (smd.lineStyle.scaleMode === LINE_SCALE_MODE.NORMAL) {
				lw *= Math.sqrt(mat.a * mat.a + mat.b * mat.b);
			}
			tRect.pad(lw);
		}

		for (let i = 2; i < len; i += 2) {
			const xBegin = xEnd;
			const yBegin = yEnd;
			const ii = i % len;
			let t;

			xEnd = mat.a * points[ii] + mat.c * points[ii + 1] + mat.tx;
			yEnd = mat.b * points[ii] + mat.d * points[ii + 1] + mat.ty;
			if (tRect.contains(xEnd, yEnd)) {
				return i;
			}
			let x1 = xBegin;
			let x2 = xEnd;
			let y1 = yBegin;
			let y2 = yEnd;

			if (y1 > y2) {
				t = x1;
				x1 = x2;
				x2 = t;
				t = y1;
				y1 = y2;
				y2 = t;
			}
			if (Math.max(y1, tRect.y) > Math.min(y2, tRect.y + tRect.height)) {
				continue;
			}
			const dx = x2 - x1;

			if (y1 < tRect.y) {
				t = (tRect.y - y1) / (y2 - y1);
				x1 += t * dx;
			}
			if (y2 > tRect.y + tRect.height) {
				t = (y2 - tRect.y - tRect.height) / (y2 - y1);
				x2 -= t * dx;
			}
			if (x1 > x2) {
				t = x2;
				x2 = x1;
				x1 = t;
			}

			if (Math.max(x1, tRect.x) <= Math.min(x2, tRect.x + tRect.width)) {
				return i;
			}
		}

		if (smd.fillStyle.visible) {
			if (i === 0 || lastMat !== smd.matrix) {
				lastMat = smd.matrix;
				tCenter.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
				mat.applyInverse(tCenter, tCenter);
			}
			if (smd.shape.contains(tCenter.x, tCenter.y)) {
				return i;
			}
		}
	}

	return -1;
}

const tempRect2 = new Rectangle();

function graphicsIntersectsRect(rect, isLocal = false) {
	this.geometry.bounds.getRectangle(tempRect2);
	if (!rect.intersects(tempRect2, isLocal ? null : this.transform.worldTransform)) {
		return -1;
	}

	return this.geometry.intersectsRect(
		rect,
		isLocal ? Matrix.IDENTITY : this.transform.worldTransform
	);
}

let tempRect = new Rectangle(0, 0, 1, 1);
function graphicsContainsPoint(point) {
	tempRect.x = point.x;
	tempRect.y = point.y;
	return this.intersectsRect(tempRect) >= 0;
}

export function patchGraphicsSmooth() {
	SmoothGraphicsGeometry.prototype.intersectsRect = geomIntersectsRect;
	SmoothGraphics.prototype.intersectsRect = graphicsIntersectsRect;
	SmoothGraphics.prototype.containsPoint = graphicsContainsPoint;
}
