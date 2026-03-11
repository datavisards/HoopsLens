/**
 * rosterFit.ts
 * Roster-Fit Algorithm (Phase 3 of Roster-Fit roadmap).
 *
 * For each action with an `actionTag` in the current frame, this engine:
 *  1. Resolves the player on that action node
 *  2. Looks up their OffensiveRole's supply for that atomic action (0-100%)
 *  3. Compares against the league-best baseline (max supply across all roles)
 *  4. Emits a FitError when fitScore < MISMATCH_THRESHOLD
 *
 * Design note: Pure computation — no side-effects, no async calls.
 * Re-run on every frame or entity change via useMemo in TacticsBoard.
 */

import { Action, BoardEntity, FitError, Player } from '../types';
import { OFFENSIVE_ROLES } from '../config/playerRoles';

/** Score below this percentage triggers a FitError (30% = clearly wrong role). */
const MISMATCH_THRESHOLD = 30;

// Pre-compute league-max supply for each atomic action code once at module load.
const LEAGUE_MAX_SUPPLY: Record<string, number> = {};
for (const role of Object.values(OFFENSIVE_ROLES)) {
  for (const [code, pct] of Object.entries(role.playtype_supply)) {
    if ((pct as number) > (LEAGUE_MAX_SUPPLY[code] ?? 0)) {
      LEAGUE_MAX_SUPPLY[code] = pct as number;
    }
  }
}

/**
 * Compute all fit errors for the given set of actions + entities.
 *
 * @param actions   - Action[] from the current frame / view
 * @param entities  - BoardEntity[] from the current frame / view
 * @param frameIndex - Optional frame index to embed in the error object
 */
export function computeRosterFit(
  actions: Action[],
  entities: BoardEntity[],
  frameIndex?: number,
): FitError[] {
  const errors: FitError[] = [];

  for (const action of actions) {
    if (!action.actionTag) continue;

    const player = entities.find(
      (e) => e.id === action.playerId && e.type === 'player',
    ) as Player | undefined;
    if (!player?.playerTag) continue;

    const role = OFFENSIVE_ROLES[player.playerTag];
    if (!role) continue;

    const supplyRaw = (role.playtype_supply as Record<string, number>)[action.actionTag] ?? 0;
    const leagueMax  = LEAGUE_MAX_SUPPLY[action.actionTag] ?? 1; // avoid /0
    const fitScore   = Math.round((supplyRaw / leagueMax) * 100);

    if (fitScore < MISMATCH_THRESHOLD) {
      errors.push({
        playerId:    player.id,
        actionId:    action.id,
        actionTag:   action.actionTag,
        fitScore,
        currentRole: player.playerTag,
        frameIndex,
      });
    }
  }

  return errors;
}

/**
 * Returns the best alternative role code for a given actionTag
 * (i.e. the role with the highest supply for that action).
 */
export function suggestBetterRole(actionTag: string): string {
  let best = '';
  let bestSupply = -1;
  for (const [code, role] of Object.entries(OFFENSIVE_ROLES)) {
    const supply = (role.playtype_supply as Record<string, number>)[actionTag] ?? 0;
    if (supply > bestSupply) {
      bestSupply = supply;
      best = code;
    }
  }
  return best;
}

/** Aggregate supply for a lineup (5 players) across all atomic actions. */
export function aggregateLineupSupply(
  players: Player[],
): Record<string, number> {
  const agg: Record<string, number> = {};
  const tagged = players.filter((p) => p.playerTag);
  if (!tagged.length) return agg;

  for (const player of tagged) {
    const supply = OFFENSIVE_ROLES[player.playerTag!]?.playtype_supply ?? {};
    for (const [code, pct] of Object.entries(supply)) {
      agg[code] = ((agg[code] ?? 0) + (pct as number)) / (tagged.length); // running average
    }
  }
  // Re-normalise: recalculate as true mean
  const result: Record<string, number> = {};
  for (const [code] of Object.entries(LEAGUE_MAX_SUPPLY)) {
    let total = 0;
    let count = 0;
    for (const player of tagged) {
      const supply = (OFFENSIVE_ROLES[player.playerTag!]?.playtype_supply as Record<string, number>) ?? {};
      total += supply[code] ?? 0;
      count++;
    }
    result[code] = count ? Math.round(total / count) : 0;
  }
  return result;
}
