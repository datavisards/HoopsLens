export interface AtomicActionMeta {
  name: string;
  description: string;
}

export const ATOMIC_ACTIONS: Record<string, AtomicActionMeta> = {
  PnR_BH: {
    name: 'Pick-and-roll ball-handler',
    description: 'Possessions where the player uses an on-ball screen (including reject action).',
  },
  PnR_RM: {
    name: 'Pick-and-roll roll man',
    description: 'Possessions where the player makes a pick and then rolls, pops, slips, etc.',
  },
  Transition: {
    name: 'Transition',
    description: 'Possessions where the player attacks when defense is not set.',
  },
  Off_Screen: {
    name: 'Off-screen',
    description: 'Possessions where the player uses an off-ball screen.',
  },
  Spot_Up: {
    name: 'Spot-up',
    description: 'Possessions where the player stands still or moves without using an off-ball screen.',
  },
  Isolation: {
    name: 'Isolation',
    description: 'Possessions where the player performs 1on1.',
  },
  Hand_Off: {
    name: 'Hand-off',
    description: 'Possessions where the player receives the ball in a hand-off.',
  },
  Cut: {
    name: 'Cut',
    description: 'Possessions where the player cuts without a screen (including UCLA, flex, etc.).',
  },
  Putback: {
    name: 'Putback',
    description: 'Possessions where the player shoots immediately after an offensive rebound.',
  },
  Post_Up: {
    name: 'Post-up',
    description: 'Possessions where the player performs post-play.',
  },
  // NOTE: Misc (Miscellaneous) is intentionally omitted.
  // It has no defined supply semantics in TAG_CAPABILITY and contributes 0
  // to Fit Score, so exposing it as a selectable option would be misleading.
};

export const ATOMIC_ACTION_TAG_OPTIONS: Array<{ label: string; value: string }> = Object.entries(ATOMIC_ACTIONS).map(
  ([code, meta]) => ({ value: code, label: `${meta.name} (${code})` })
);
