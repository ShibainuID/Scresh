import pytest

from app.services.grading import (
    aggregate_batch,
    build_freshness_result,
    map_probabilities_to_grade,
)


@pytest.mark.parametrize(
    ("probabilities", "expected"),
    [
        ({"fresh": 0.90, "medium": 0.08, "rotten": 0.02}, "A"),
        ({"fresh": 0.60, "medium": 0.30, "rotten": 0.10}, "B"),
        ({"fresh": 0.10, "medium": 0.55, "rotten": 0.35}, "C"),
        ({"fresh": 0.10, "medium": 0.15, "rotten": 0.75}, "D"),
    ],
)
def test_maps_probabilities_to_grade(probabilities, expected):
    assert map_probabilities_to_grade(probabilities) == expected


def test_builds_commodity_specific_freshness_result():
    result = build_freshness_result(
        "potato",
        {"fresh": 0.91, "medium": 0.07, "rotten": 0.02},
    )

    assert result == {
        "freshness_class": "fresh",
        "confidence": 0.91,
        "probabilities": {
            "fresh": 0.91,
            "medium": 0.07,
            "rotten": 0.02,
        },
        "grade": "A",
        "shelf_life_days": 14,
        "recommendation": "Excellent freshness. Safe to store up to 14 days.",
    }


def test_rejects_unsupported_commodity():
    with pytest.raises(ValueError, match="Unsupported commodity"):
        build_freshness_result(
            "cucumber",
            {"fresh": 0.8, "medium": 0.1, "rotten": 0.1},
        )


def test_batch_uses_average_probabilities_and_worst_object_guard():
    objects = [
        {"fresh": 0.95, "medium": 0.04, "rotten": 0.01},
        {"fresh": 0.05, "medium": 0.05, "rotten": 0.90},
    ]

    result = aggregate_batch("chili", objects)

    assert result["grade"] == "D"
    assert result["freshness_class"] == "rotten"
    assert result["object_count"] == 2
    assert result["shelf_life_days"] == 0


def test_batch_requires_at_least_one_detected_object():
    with pytest.raises(ValueError, match="No produce objects detected"):
        aggregate_batch("tomato", [])
