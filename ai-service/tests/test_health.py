from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_reports_ready_when_all_model_artifacts_exist(tmp_path: Path):
    for filename in (
        "scresh_dinov3_frozen_decoder_best.pt",
        "scresh_dinov3_frozen_decoder_metadata.json",
        "scresh_freshness_efficientnet_b0_best.pt",
        "scresh_freshness_metadata.json",
    ):
        (tmp_path / filename).touch()

    client = TestClient(create_app(model_dir=tmp_path))

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "model_artifacts": 4,
    }


def test_health_reports_unavailable_when_model_artifact_is_missing(
    tmp_path: Path,
):
    client = TestClient(create_app(model_dir=tmp_path))

    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["detail"] == {
        "status": "unavailable",
        "missing_model_artifacts": [
            "scresh_dinov3_frozen_decoder_best.pt",
            "scresh_dinov3_frozen_decoder_metadata.json",
            "scresh_freshness_efficientnet_b0_best.pt",
            "scresh_freshness_metadata.json",
        ],
    }
