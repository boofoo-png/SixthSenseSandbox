// Small, tested helpers for hand-written SVG charts (see docs/DECISIONS.md: charts as SVG).

const AXIS_STEPS = [1, 2, 2.5, 5, 10];

function clean(n: number): number {
  return Number(n.toFixed(10));
}

/**
 * A round tick step (1, 2, 2.5, or 5 times a power of ten) giving about
 * `target` intervals, and an axis maximum that is a whole number of steps.
 */
export function niceAxis(value: number, target = 4): { max: number; step: number } {
  const rough = (value > 0 ? value : 0.01) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = clean((AXIS_STEPS.find((s) => s >= rough / magnitude - 1e-9) ?? 10) * magnitude);
  const intervals = Math.max(1, Math.ceil(value / step - 1e-9));
  return { max: clean(intervals * step), step };
}

/** `count + 1` evenly spaced tick values from 0 to `max`. */
export function ticks(max: number, count: number): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max * i) / count);
}

/** Maps values from `domain` onto `range` linearly. */
export function linearScale(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number],
): (value: number) => number {
  return (value) => (d1 === d0 ? r0 : r0 + ((value - d0) * (r1 - r0)) / (d1 - d0));
}

export type Point = { x: number; y: number };

function round(n: number): number {
  return Number(n.toFixed(2));
}

/** SVG path data through the points; a null starts a new segment so gaps stay visible. */
export function linePath(points: readonly (Point | null)[]): string {
  let path = "";
  let drawing = false;
  for (const point of points) {
    if (point === null) {
      drawing = false;
      continue;
    }
    path += `${drawing ? "L" : "M"}${round(point.x)},${round(point.y)}`;
    drawing = true;
  }
  return path;
}

type Cluster = { indexes: number[]; center: number };

function clusterTop(cluster: Cluster, gap: number): number {
  return cluster.center - ((cluster.indexes.length - 1) * gap) / 2;
}

/**
 * Moves label positions apart so neighbours are at least `gap` apart.
 * Overlapping labels are spread evenly around their original midpoint, so
 * labels move as little as possible and keep their order. Results stay
 * within [min, max] when there is room.
 */
export function spreadLabels(
  positions: readonly number[],
  gap: number,
  min = -Infinity,
  max = Infinity,
): number[] {
  const order = positions.map((_, i) => i).sort((a, b) => positions[a] - positions[b]);
  const clusters: Cluster[] = [];

  for (const index of order) {
    let current: Cluster = { indexes: [index], center: positions[index] };
    while (clusters.length > 0) {
      const previous = clusters[clusters.length - 1];
      const previousBottom = clusterTop(previous, gap) + (previous.indexes.length - 1) * gap;
      if (clusterTop(current, gap) - previousBottom >= gap) {
        break;
      }
      clusters.pop();
      const indexes = [...previous.indexes, ...current.indexes];
      const center = indexes.reduce((sum, i) => sum + positions[i], 0) / indexes.length;
      current = { indexes, center };
    }
    clusters.push(current);
  }

  const placed = new Array<number>(positions.length);
  for (const cluster of clusters) {
    const height = (cluster.indexes.length - 1) * gap;
    let top = clusterTop(cluster, gap);
    if (top < min) {
      top = min;
    } else if (top + height > max) {
      top = Math.max(min, max - height);
    }
    cluster.indexes.forEach((index, i) => {
      placed[index] = round(top + i * gap);
    });
  }
  return placed;
}
