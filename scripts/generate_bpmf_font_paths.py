"""Generate editable SVG center paths aligned to BpmfZihiOnly-R.ttf.

The font is rasterized only during generation. Runtime output remains Unicode,
SVG paths, and Canvas masks; no glyph bitmap is shipped to the browser.
"""

from __future__ import annotations

import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = ROOT / "src/assets/fonts/BpmfZihiOnly-R.ttf"
REFERENCE_PATH = ROOT / "src/data/zhuyinStrokePaths.js"
OUTPUT_PATH = ROOT / "src/data/zhuyinFontStrokePaths.js"
SIZE = 400
FONT_SIZE = 270
BASELINE = 292


def parse_reference() -> dict[str, list[str]]:
    source = REFERENCE_PATH.read_text(encoding="utf-8")
    result: dict[str, list[str]] = {}
    entry_pattern = re.compile(r"^  '\\u([0-9a-f]{4})': \[(.*?)\],$", re.MULTILINE)
    for match in entry_pattern.finditer(source):
        symbol = chr(int(match.group(1), 16))
        paths = re.findall(r"path: '([^']+)'", match.group(2))
        result[symbol] = paths
    if len(result) != 37:
        raise RuntimeError(f"Expected 37 reference glyphs, found {len(result)}")
    return result


def sample_path(path: str, spacing: float = 3.0) -> np.ndarray:
    tokens = re.findall(r"[MLQ]|-?\d+(?:\.\d+)?", path)
    points: list[tuple[float, float]] = []
    cursor = np.array([0.0, 0.0])
    index = 0
    command = ""
    while index < len(tokens):
        if tokens[index] in {"M", "L", "Q"}:
            command = tokens[index]
            index += 1
        if command == "M":
            cursor = np.array([float(tokens[index]), float(tokens[index + 1])])
            points.append(tuple(cursor))
            index += 2
            command = ""
        elif command == "L":
            target = np.array([float(tokens[index]), float(tokens[index + 1])])
            count = max(2, int(np.linalg.norm(target - cursor) / spacing) + 1)
            for step in np.linspace(0, 1, count)[1:]:
                points.append(tuple(cursor + (target - cursor) * step))
            cursor = target
            index += 2
            command = ""
        elif command == "Q":
            control = np.array([float(tokens[index]), float(tokens[index + 1])])
            target = np.array([float(tokens[index + 2]), float(tokens[index + 3])])
            length = np.linalg.norm(control - cursor) + np.linalg.norm(target - control)
            count = max(3, int(length / spacing) + 1)
            for step in np.linspace(0, 1, count)[1:]:
                point = (1 - step) ** 2 * cursor + 2 * (1 - step) * step * control + step**2 * target
                points.append(tuple(point))
            cursor = target
            index += 4
            command = ""
        else:
            raise RuntimeError(f"Unsupported path token near {tokens[index:index + 5]}")
    return np.asarray(points, dtype=float)


def render_mask(font: ImageFont.FreeTypeFont, symbol: str) -> np.ndarray:
    image = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(image)
    draw.text(
        (SIZE // 2, BASELINE),
        symbol,
        font=font,
        fill=255,
        stroke_width=7,
        stroke_fill=255,
        anchor="ms",
    )
    return np.asarray(image) > 64


def skeletonize(mask: np.ndarray) -> np.ndarray:
    image = mask.astype(np.uint8).copy()
    changed = True
    while changed:
        changed = False
        for phase in (0, 1):
            padded = np.pad(image, 1)
            p2 = padded[:-2, 1:-1]
            p3 = padded[:-2, 2:]
            p4 = padded[1:-1, 2:]
            p5 = padded[2:, 2:]
            p6 = padded[2:, 1:-1]
            p7 = padded[2:, :-2]
            p8 = padded[1:-1, :-2]
            p9 = padded[:-2, :-2]
            neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
            transitions = (
                ((p2 == 0) & (p3 == 1)).astype(np.uint8)
                + ((p3 == 0) & (p4 == 1)).astype(np.uint8)
                + ((p4 == 0) & (p5 == 1)).astype(np.uint8)
                + ((p5 == 0) & (p6 == 1)).astype(np.uint8)
                + ((p6 == 0) & (p7 == 1)).astype(np.uint8)
                + ((p7 == 0) & (p8 == 1)).astype(np.uint8)
                + ((p8 == 0) & (p9 == 1)).astype(np.uint8)
                + ((p9 == 0) & (p2 == 1)).astype(np.uint8)
            )
            if phase == 0:
                condition = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else:
                condition = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            removable = (image == 1) & (neighbors >= 2) & (neighbors <= 6) & (transitions == 1) & condition
            if np.any(removable):
                image[removable] = 0
                changed = True
    return image.astype(bool)


def normalize_reference(strokes: list[np.ndarray], mask: np.ndarray) -> list[np.ndarray]:
    all_points = np.concatenate(strokes)
    source_min = all_points.min(axis=0)
    source_max = all_points.max(axis=0)
    ys, xs = np.where(mask)
    target_min = np.array([xs.min(), ys.min()], dtype=float)
    target_max = np.array([xs.max(), ys.max()], dtype=float)
    source_size = np.maximum(source_max - source_min, 1)
    target_size = target_max - target_min
    return [target_min + (stroke - source_min) / source_size * target_size for stroke in strokes]


def assign_skeleton(skeleton: np.ndarray, strokes: list[np.ndarray]) -> dict[int, set[tuple[int, int]]]:
    ys, xs = np.where(skeleton)
    pixels = np.column_stack((xs, ys)).astype(float)
    distances = []
    for stroke in strokes:
        minimum = np.full(len(pixels), np.inf)
        for start in range(0, len(stroke), 96):
            sample = stroke[start:start + 96]
            squared = ((pixels[:, None, :] - sample[None, :, :]) ** 2).sum(axis=2)
            minimum = np.minimum(minimum, squared.min(axis=1))
        distances.append(minimum)
    labels = np.argmin(np.column_stack(distances), axis=1)
    return {
        index: {(int(y), int(x)) for (x, y), label in zip(pixels, labels) if label == index}
        for index in range(len(strokes))
    }


NEIGHBORS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def connected_components(pixels: set[tuple[int, int]]) -> list[set[tuple[int, int]]]:
    remaining = set(pixels)
    components = []
    while remaining:
        seed = remaining.pop()
        component = {seed}
        stack = [seed]
        while stack:
            y, x = stack.pop()
            for dy, dx in NEIGHBORS:
                neighbor = (y + dy, x + dx)
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    component.add(neighbor)
                    stack.append(neighbor)
        if len(component) >= 5:
            components.append(component)
    return components


def rdp(points: list[tuple[float, float]], epsilon: float = 2.2) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points
    start = np.asarray(points[0])
    end = np.asarray(points[-1])
    line = end - start
    if np.allclose(line, 0):
        distances = np.linalg.norm(np.asarray(points) - start, axis=1)
    else:
        vectors = np.asarray(points) - start
        distances = np.abs(np.cross(line, vectors) / np.linalg.norm(line))
    index = int(np.argmax(distances))
    if distances[index] <= epsilon:
        return [points[0], points[-1]]
    return rdp(points[: index + 1], epsilon)[:-1] + rdp(points[index:], epsilon)


def trace_component(component: set[tuple[int, int]]) -> list[list[tuple[float, float]]]:
    adjacency = {
        pixel: [
            (pixel[0] + dy, pixel[1] + dx)
            for dy, dx in NEIGHBORS
            if (pixel[0] + dy, pixel[1] + dx) in component
        ]
        for pixel in component
    }
    nodes = {pixel for pixel, neighbors in adjacency.items() if len(neighbors) != 2}
    if not nodes:
        nodes = {next(iter(component))}
    visited: set[frozenset[tuple[int, int]]] = set()
    lines = []
    for node in nodes:
        for neighbor in adjacency[node]:
            edge = frozenset((node, neighbor))
            if edge in visited:
                continue
            visited.add(edge)
            line = [node, neighbor]
            previous, current = node, neighbor
            while current not in nodes:
                candidates = [pixel for pixel in adjacency[current] if pixel != previous]
                if not candidates:
                    break
                following = candidates[0]
                next_edge = frozenset((current, following))
                if next_edge in visited:
                    break
                visited.add(next_edge)
                line.append(following)
                previous, current = current, following
            if len(line) >= 4:
                lines.append(rdp([(float(x), float(y)) for y, x in line]))
    return lines


def orient_and_sort(lines: list[list[tuple[float, float]]], start: np.ndarray) -> list[list[tuple[float, float]]]:
    if not lines:
        return []
    lines.sort(key=lambda line: min(np.linalg.norm(np.asarray(line[0]) - start), np.linalg.norm(np.asarray(line[-1]) - start)))
    first = lines[0]
    if np.linalg.norm(np.asarray(first[-1]) - start) < np.linalg.norm(np.asarray(first[0]) - start):
        lines[0] = list(reversed(first))
    return lines


def arrow_for(points: np.ndarray) -> str:
    delta = points[min(8, len(points) - 1)] - points[0]
    dx, dy = delta
    if abs(dx) > abs(dy) * 1.6:
        return "→" if dx > 0 else "←"
    if abs(dy) > abs(dx) * 1.6:
        return "↓" if dy > 0 else "↑"
    return "↘" if dx > 0 and dy > 0 else "↗" if dx > 0 else "↙" if dy > 0 else "↖"


def path_string(lines: list[list[tuple[float, float]]]) -> str:
    commands = []
    for line in lines:
        if len(line) < 2:
            continue
        commands.append(f"M {round(line[0][0])} {round(line[0][1])}")
        commands.extend(f"L {round(x)} {round(y)}" for x, y in line[1:])
    return " ".join(commands)


def project_reference_to_skeleton(
    reference: np.ndarray,
    pixels: set[tuple[int, int]],
) -> list[list[tuple[float, float]]]:
    candidates = np.asarray([(x, y) for y, x in pixels], dtype=float)
    if not len(candidates):
        return []
    projected = []
    for point in reference[::2]:
        nearest = candidates[np.argmin(((candidates - point) ** 2).sum(axis=1))]
        candidate = (float(nearest[0]), float(nearest[1]))
        if not projected or candidate != projected[-1]:
            projected.append(candidate)
    if len(projected) < 2:
        return []

    # Keep the official forward order while lightly smoothing pixel stair-steps.
    array = np.asarray(projected)
    if len(array) >= 5:
        padded = np.pad(array, ((2, 2), (0, 0)), mode="edge")
        array = np.asarray([padded[index:index + 5].mean(axis=0) for index in range(len(array))])
    simplified = rdp([tuple(point) for point in array], epsilon=2.0)
    return [simplified] if len(simplified) >= 2 else []


def main() -> None:
    reference = parse_reference()
    font = ImageFont.truetype(str(FONT_PATH), FONT_SIZE)
    output: dict[str, list[dict[str, object]]] = {}
    for symbol, raw_paths in reference.items():
        mask = render_mask(font, symbol)
        skeleton = skeletonize(mask)
        sampled = [sample_path(path) for path in raw_paths]
        normalized = normalize_reference(sampled, mask)
        assigned = assign_skeleton(skeleton, normalized)
        stroke_data = []
        for index, reference_stroke in enumerate(normalized):
            start = reference_stroke[0]
            lines = project_reference_to_skeleton(reference_stroke, assigned[index])
            path = path_string(lines)
            if not path:
                raise RuntimeError(f"No generated path for {symbol} stroke {index + 1}")
            nearest = min(assigned[index], key=lambda pixel: (pixel[1] - start[0]) ** 2 + (pixel[0] - start[1]) ** 2)
            marker_x = round(8 + nearest[1] / SIZE * 84)
            marker_y = round(9 + nearest[0] / SIZE * 79)
            stroke_data.append(
                {
                    "path": path,
                    "marker": {"x": marker_x, "y": marker_y},
                    "direction": arrow_for(reference_stroke),
                }
            )
        output[symbol] = stroke_data

    lines = [
        "// Generated from BpmfZihiOnly-R.ttf; runtime uses editable SVG center paths.",
        "// Regenerate with: python scripts/generate_bpmf_font_paths.py",
        "export const ZHUYIN_FONT_PATH_SOURCE = 'BpmfZihiOnly-R.ttf'",
        "export const ZHUYIN_FONT_STROKE_PATHS = {",
    ]
    for symbol, strokes in output.items():
        encoded = f"\\u{ord(symbol):04x}"
        items = []
        for stroke in strokes:
            marker = stroke["marker"]
            direction = f"\\u{ord(str(stroke['direction'])):04x}"
            items.append(
                "{ "
                f"path: '{stroke['path']}', "
                f"marker: {{ x: {marker['x']}, y: {marker['y']} }}, "
                f"direction: '{direction}' "
                "}"
            )
        lines.append(f"  '{encoded}': [{', '.join(items)}],")
    lines.append("}")
    OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Generated {len(output)} glyphs at {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
