import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Protocol

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.services.grading import SUPPORTED_COMMODITIES

MODEL_ARTIFACTS = (
    "scresh_dinov3_frozen_decoder_best.pt",
    "scresh_dinov3_frozen_decoder_metadata.json",
    "scresh_freshness_efficientnet_b0_best.pt",
    "scresh_freshness_metadata.json",
)
MAX_IMAGE_BYTES = 10 * 1024 * 1024
SUPPORTED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ScanPipeline(Protocol):
    def scan_bytes(self, image_bytes: bytes, commodity: str) -> dict[str, object]: ...


def create_app(
    model_dir: Path | None = None,
    pipeline: ScanPipeline | None = None,
    service_token: str | None = None,
) -> FastAPI:
    artifact_dir = model_dir or Path(os.getenv("MODEL_DIR", "/app/models"))
    configured_token = service_token or os.getenv("AI_SERVICE_TOKEN")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.pipeline = pipeline
        if app.state.pipeline is None:
            from app.services.runtime import build_pipeline

            app.state.pipeline = await run_in_threadpool(
                build_pipeline,
                artifact_dir,
            )
        yield

    app = FastAPI(
        title="Scresh AI Service",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.state.pipeline = pipeline

    @app.get("/health")
    def health() -> dict[str, object]:
        missing = [
            filename
            for filename in MODEL_ARTIFACTS
            if not (artifact_dir / filename).is_file()
        ]
        if missing:
            raise HTTPException(
                status_code=503,
                detail={
                    "status": "unavailable",
                    "missing_model_artifacts": missing,
                },
            )
        return {
            "status": "ready",
            "model_artifacts": len(MODEL_ARTIFACTS),
        }

    @app.post("/infer/freshness")
    async def infer_freshness(
        image: UploadFile = File(...),
        commodity: str = Form(...),
        x_ai_service_token: str | None = Header(default=None),
    ) -> dict[str, object]:
        if (
            not configured_token
            or not x_ai_service_token
            or not secrets.compare_digest(
                configured_token,
                x_ai_service_token,
            )
        ):
            raise HTTPException(status_code=401, detail="Invalid service token")

        normalized_commodity = commodity.strip().lower()
        if normalized_commodity not in SUPPORTED_COMMODITIES:
            raise HTTPException(
                status_code=422,
                detail=f"Unsupported commodity: {commodity}",
            )
        if image.content_type not in SUPPORTED_MEDIA_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Image must be JPEG, PNG, or WebP",
            )

        image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Image exceeds 10 MB limit",
            )

        active_pipeline = app.state.pipeline
        if active_pipeline is None:
            raise HTTPException(status_code=503, detail="Model is not ready")

        try:
            return await run_in_threadpool(
                active_pipeline.scan_bytes,
                image_bytes,
                normalized_commodity,
            )
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

    return app


app = create_app()
