from collections import deque
from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Component:
    area: int
    bbox_xyxy: tuple[int, int, int, int]


def extract_components(
    mask: np.ndarray,
    *,
    min_area: int,
    max_objects: int,
    padding: int,
) -> list[Component]:
    binary = np.asarray(mask, dtype=bool)
    if binary.ndim != 2:
        raise ValueError("Segmentation mask must be two-dimensional")

    height, width = binary.shape
    visited = np.zeros_like(binary, dtype=bool)
    components: list[Component] = []

    for start_y, start_x in zip(*np.nonzero(binary & ~visited), strict=True):
        if visited[start_y, start_x]:
            continue

        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        area = 0
        min_x = max_x = int(start_x)
        min_y = max_y = int(start_y)

        while queue:
            y, x = queue.popleft()
            area += 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)

            for next_y, next_x in (
                (y - 1, x),
                (y + 1, x),
                (y, x - 1),
                (y, x + 1),
            ):
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and binary[next_y, next_x]
                    and not visited[next_y, next_x]
                ):
                    visited[next_y, next_x] = True
                    queue.append((next_y, next_x))

        if area >= min_area:
            components.append(
                Component(
                    area=area,
                    bbox_xyxy=(
                        max(0, min_x - padding),
                        max(0, min_y - padding),
                        min(width, max_x + 1 + padding),
                        min(height, max_y + 1 + padding),
                    ),
                )
            )

    components.sort(key=lambda component: component.area, reverse=True)
    return components[:max_objects]
