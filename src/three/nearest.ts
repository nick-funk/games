import {
  Intersection,
  Vector3,
} from "three";

export const nearest = (
  position: Vector3,
  intersections: Intersection[]
): Intersection | null => {
  let minObj: Intersection | null = null;
  let minDistance: number = Number.MAX_VALUE;

  for (const int of intersections) {
    const dist = position.distanceTo(int.point);
    if (dist < minDistance) {
      minDistance = dist;
      minObj = int;
    }
  }

  return minObj;
}