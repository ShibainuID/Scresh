from collections.abc import Mapping, Sequence

SUPPORTED_COMMODITIES = ("lettuce", "chili", "potato", "onion", "tomato")
FRESHNESS_CLASSES = ("fresh", "medium", "rotten")

SHELF_LIFE = {
    "lettuce": {"A": 5, "B": 3, "C": 1, "D": 0},
    "chili": {"A": 7, "B": 4, "C": 2, "D": 0},
    "potato": {"A": 14, "B": 7, "C": 3, "D": 0},
    "onion": {"A": 14, "B": 7, "C": 3, "D": 0},
    "tomato": {"A": 5, "B": 3, "C": 1, "D": 0},
}


def _normalize_probabilities(
    probabilities: Mapping[str, float],
) -> dict[str, float]:
    values = {
        name: max(0.0, float(probabilities.get(name, 0.0)))
        for name in FRESHNESS_CLASSES
    }
    total = sum(values.values())
    if total <= 0:
        raise ValueError("Freshness probabilities must have a positive sum")
    return {name: value / total for name, value in values.items()}


def map_probabilities_to_grade(probabilities: Mapping[str, float]) -> str:
    probability = _normalize_probabilities(probabilities)
    fresh_p = probability["fresh"]
    medium_p = probability["medium"]
    rotten_p = probability["rotten"]

    if rotten_p >= 0.70:
        return "D"
    if fresh_p >= 0.85:
        return "A"
    if fresh_p >= 0.45:
        return "B"
    if medium_p >= 0.45 and rotten_p < 0.30:
        return "B"
    if medium_p >= 0.50:
        return "C"
    if rotten_p >= 0.40:
        return "C"
    return "B"


def _recommendation(grade: str, shelf_life_days: int) -> str:
    if grade == "A":
        return (
            f"Excellent freshness. Safe to store up to {shelf_life_days} days."
        )
    if grade == "B":
        return (
            "Good freshness. Prioritize distribution within "
            f"{shelf_life_days} days."
        )
    if grade == "C":
        unit = "day" if shelf_life_days == 1 else "days"
        return (
            f"At-risk batch. Distribute or process within "
            f"{shelf_life_days} {unit}."
        )
    return "Reject or mark as waste. Do not distribute."


def build_freshness_result(
    commodity: str,
    probabilities: Mapping[str, float],
) -> dict[str, object]:
    normalized_commodity = commodity.strip().lower()
    if normalized_commodity not in SUPPORTED_COMMODITIES:
        raise ValueError(f"Unsupported commodity: {commodity}")

    normalized = _normalize_probabilities(probabilities)
    grade = map_probabilities_to_grade(normalized)
    shelf_life_days = SHELF_LIFE[normalized_commodity][grade]
    freshness_class = max(normalized, key=normalized.get)

    return {
        "freshness_class": freshness_class,
        "confidence": round(normalized[freshness_class], 6),
        "probabilities": {
            name: round(normalized[name], 6) for name in FRESHNESS_CLASSES
        },
        "grade": grade,
        "shelf_life_days": shelf_life_days,
        "recommendation": _recommendation(grade, shelf_life_days),
    }


def aggregate_batch(
    commodity: str,
    object_probabilities: Sequence[Mapping[str, float]],
) -> dict[str, object]:
    if not object_probabilities:
        raise ValueError("No produce objects detected")

    normalized = [
        _normalize_probabilities(probabilities)
        for probabilities in object_probabilities
    ]
    average = {
        name: sum(item[name] for item in normalized) / len(normalized)
        for name in FRESHNESS_CLASSES
    }
    result = build_freshness_result(commodity, average)

    if max(item["rotten"] for item in normalized) >= 0.80:
        result = build_freshness_result(
            commodity,
            {"fresh": 0.0, "medium": 0.0, "rotten": 1.0},
        )

    return {**result, "object_count": len(normalized)}
