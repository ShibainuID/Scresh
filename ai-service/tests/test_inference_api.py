from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


class FakePipeline:
    def scan_bytes(self, image_bytes, commodity):
        return {
            "commodity": commodity,
            "summary": {"grade": "A", "object_count": 1},
            "objects": [],
            "overlay_media_type": "image/jpeg",
            "overlay_base64": "encoded",
        }


def build_client(tmp_path: Path) -> TestClient:
    return TestClient(
        create_app(
            model_dir=tmp_path,
            pipeline=FakePipeline(),
            service_token="test-secret",
        )
    )


def test_inference_requires_shared_secret(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/infer/freshness",
        data={"commodity": "chili"},
        files={"image": ("chili.jpg", b"image", "image/jpeg")},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid service token"


def test_inference_accepts_one_photo(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/infer/freshness",
        headers={"X-AI-Service-Token": "test-secret"},
        data={"commodity": "chili"},
        files={"image": ("chili.jpg", b"image", "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json()["summary"] == {"grade": "A", "object_count": 1}


def test_inference_rejects_unsupported_media_type(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/infer/freshness",
        headers={"X-AI-Service-Token": "test-secret"},
        data={"commodity": "chili"},
        files={"image": ("notes.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "Image must be JPEG, PNG, or WebP"


def test_inference_rejects_unsupported_commodity(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/infer/freshness",
        headers={"X-AI-Service-Token": "test-secret"},
        data={"commodity": "cucumber"},
        files={"image": ("crop.jpg", b"image", "image/jpeg")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Unsupported commodity: cucumber"


def test_inference_rejects_files_larger_than_ten_megabytes(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/infer/freshness",
        headers={"X-AI-Service-Token": "test-secret"},
        data={"commodity": "potato"},
        files={
            "image": (
                "large.jpg",
                b"x" * (10 * 1024 * 1024 + 1),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Image exceeds 10 MB limit"
