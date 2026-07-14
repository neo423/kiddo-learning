from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "src" / "assets" / "images" / "home"

EXPECTATIONS = {
    "rainbow-home-background.webp": {"min_size": (1600, 900), "alpha": False},
    "rainbow-home-title.webp": {"min_size": (700, 180), "alpha": True},
    "rainbow-home-bear.webp": {"min_size": (300, 300), "alpha": True},
    "rainbow-home-rabbit.webp": {"min_size": (300, 300), "alpha": True},
    "card-zhuyin.webp": {"min_size": (280, 280), "alpha": True},
    "card-number.webp": {"min_size": (280, 280), "alpha": True},
    "card-english.webp": {"min_size": (280, 280), "alpha": True},
    "card-shape.webp": {"min_size": (280, 280), "alpha": True},
    "card-logic.webp": {"min_size": (280, 280), "alpha": True},
}


for name, expected in EXPECTATIONS.items():
    path = ASSET_DIR / name
    assert path.exists(), f"missing asset: {path}"
    assert path.stat().st_size > 8_000, f"asset too small: {path}"

    with Image.open(path) as image:
        width, height = image.size
        min_width, min_height = expected["min_size"]
        assert width >= min_width and height >= min_height, (
            f"{name}: expected at least {min_width}x{min_height}, "
            f"got {width}x{height}"
        )

        has_alpha = "A" in image.getbands()
        assert has_alpha is expected["alpha"], (
            f"{name}: expected alpha={expected['alpha']}, "
            f"got bands={image.getbands()}"
        )


print(f"validated {len(EXPECTATIONS)} rainbow home assets")
