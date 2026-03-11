/**
 * actionTagging.ts
 * Translation State Machine (Phase 1.2 of Roster-Fit roadmap).
 *
 * Converts a completed draw gesture into an atomic action code (actionTag)
 * based on FIVE inputs: action type, ball possession, start zone, and end zone.
 *
 * Court zone reference (full-court canvas at SCALE=45):
 *   COURT_WIDTH  ≈ 1289 px  (left = attacking baseline / frontcourt)
 *   COURT_HEIGHT ≈  686 px
 *   Paint (left):   x < 22%W, |y - center| < 18%H
 *   Perimeter:      x > 35%W  OR  |y - center| > 42%H
 *   Mid-range:      between paint and perimeter
 *   Backcourt:      x > 50%W  (defensive half)
 *
 * Mapping table (source: research paper Table 1 Playtype descriptions):
 *  pass  + hasBall + start=Perimeter       → PnR_BH   (perimeter initiator)
 *  pass  + hasBall + start=Paint/Mid       → Post_Up  (low-post kick-out)
 *  pass  + hasBall + very short (< 8%W)    → Hand_Off (hand-off to cutter nearby)
 *  dribble/move + hasBall + backcourt→front → Transition (fast break push)
 *  dribble/move + hasBall + Perimeter→Paint → Isolation (drive into paint)
 *  dribble/move + hasBall + Paint/Mid       → Post_Up  (post footwork)
 *  dribble/move + hasBall + Perimeter→Perim → PnR_BH  (perimeter ball-handler)
 *  shoot + hasBall + end=Paint + very short → Putback  (offensive rebound tip)
 *  shoot + hasBall + end=Perimeter          → Spot_Up
 *  shoot + hasBall + end=Paint              → Post_Up
 *  shoot + hasBall + end=Mid                → Isolation
 *  screen (any)                             → PnR_RM
 *  move  + !hasBall + end=Paint             → Cut
 *  move  + !hasBall + start=Paint/Mid→Perim → Off_Screen
 *  move  + !hasBall + Perimeter→Perimeter   → Spot_Up
 *
 * NOTE: Misc is intentionally NOT produced here — it is available only as a
 * manual label in the save-tactic dialog (atomicActions.ts) and is excluded
 * from TAG_CAPABILITY because it carries no defined supply semantics.
 */

import { ActionType } from '../types';
import { COURT_HEIGHT, COURT_WIDTH } from './constants';

// ─── Zone Helpers ────────────────────────────────────────────────────────────

/** Returns true when the point is inside the left paint (attacking basket area). */
export function isPaintArea(x: number, y: number): boolean {
  const rimY = COURT_HEIGHT / 2;
  return x < COURT_WIDTH * 0.22 && Math.abs(y - rimY) < COURT_HEIGHT * 0.18;
}

/** Returns true when the point is in 3-point territory (perimeter / deep). */
export function isPerimeter(x: number, y: number): boolean {
  const rimY = COURT_HEIGHT / 2;
  return x > COURT_WIDTH * 0.35 || Math.abs(y - rimY) > COURT_HEIGHT * 0.42;
}

/** Returns true when the point is in mid-range (between paint and perimeter). */
export function isMidRange(x: number, y: number): boolean {
  return !isPaintArea(x, y) && !isPerimeter(x, y);
}

/** Returns true when the point is in the defensive half (backcourt). */
export function isBackcourt(x: number, y: number): boolean {
  return x > COURT_WIDTH * 0.50;
}

// ─── State Machine ────────────────────────────────────────────────────────────

/**
 * Derive an atomic action code from a completed draw gesture.
 *
 * @param actionType  - The canvas action type the user selected/drew
 * @param hasBall     - Whether the acting player currently holds the ball
 * @param startX/Y    - Canvas coords of the action start point
 * @param endX/Y      - Canvas coords of the action end point
 * @returns An atomic action code string, or undefined if not classifiable
 */
export function deriveActionTag(
  actionType: ActionType,
  hasBall: boolean,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): string | undefined {
  switch (actionType) {
    case 'pass': {
      if (!hasBall) return undefined;
      // Very short pass in paint area = hand-off (passer and receiver standing close together)
      const dist = Math.hypot(endX - startX, endY - startY);
      if (dist < COURT_WIDTH * 0.08 && isPaintArea(startX, startY)) return 'Hand_Off';
      // From Paint/Mid → low-post kick-out → Post_Up
      // From Perimeter → perimeter initiator → PnR_BH
      return (isPaintArea(startX, startY) || isMidRange(startX, startY))
        ? 'Post_Up'
        : 'PnR_BH';
    }

    case 'dribble':
    case 'move': {
      if (hasBall) {
        // Cross-court push: backcourt start → frontcourt end → Transition
        if (isBackcourt(startX, startY) && !isBackcourt(endX, endY)) return 'Transition';
        // Drive from perimeter into paint → Isolation (1-on-1 drive)
        if (isPerimeter(startX, startY) && isPaintArea(endX, endY)) return 'Isolation';
        // Short move within Paint / Mid-range → Post_Up (post footwork)
        if (!isPerimeter(startX, startY) && !isBackcourt(startX, startY)) return 'Post_Up';
        // Default: perimeter ball-handler → PnR_BH
        return 'PnR_BH';
      }
      // Without ball:
      if (isPaintArea(endX, endY)) return 'Cut'; // Cut to the basket
      // From interior toward perimeter → off-ball screen usage
      if ((isPaintArea(startX, startY) || isMidRange(startX, startY)) && isPerimeter(endX, endY))
        return 'Off_Screen';
      return 'Spot_Up'; // Perimeter drift / spot-up positioning
    }

    case 'shoot': {
      if (!hasBall) return undefined;
      // Very short shoot gesture entirely inside paint = putback (offensive rebound tip)
      const shotDist = Math.hypot(endX - startX, endY - startY);
      if (isPaintArea(startX, startY) && isPaintArea(endX, endY) && shotDist < COURT_WIDTH * 0.06)
        return 'Putback';
      if (isPerimeter(endX, endY)) return 'Spot_Up';
      if (isPaintArea(endX, endY))  return 'Post_Up';
      return 'Isolation'; // mid-range pull-up
    }

    case 'screen':
      return 'PnR_RM'; // Screener / roll-man

    default:
      return undefined;
  }
}
