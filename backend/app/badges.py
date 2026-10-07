"""Map a document's review status to its compliance badges.

Badges are status-flag driven only (no date math): the badge is derived
directly from the ``review_status`` frontmatter field.
"""
from __future__ import annotations

from .models import Badge, BadgeSeverity, ReviewStatus

# One badge per status. ``current`` yields a neutral "Current" badge; the two
# warning statuses yield the visible compliance alerts.
_STATUS_BADGES: dict[ReviewStatus, Badge] = {
    ReviewStatus.NEEDS_REVIEW: Badge(
        label="⚠️ Needs Review", severity=BadgeSeverity.WARNING
    ),
    ReviewStatus.OUTDATED_CLAUSE: Badge(
        label="Outdated Clause", severity=BadgeSeverity.WARNING
    ),
    ReviewStatus.CURRENT: Badge(label="Current", severity=BadgeSeverity.NONE),
}


def badges_for(review_status: ReviewStatus) -> list[Badge]:
    """Return the badge list for a given review status."""
    return [_STATUS_BADGES[review_status]]
