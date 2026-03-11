export interface OffensiveRoleMeta {
  name: string;
  description: string;
  example_players: string[];
  playtype_supply: Record<string, number>;
}

export const OFFENSIVE_ROLES: Record<string, OffensiveRoleMeta> = {
  STB: {
    name: 'Stretch Big',
    description: 'Big men who play as screeners but prefer catch-and-shoot opportunities.',
    example_players: ['Brook Lopez', 'Jaren Jackson Jr.'],
    playtype_supply: {
      Spot_Up: 27,
      PnR_RM: 19,
      Post_Up: 15,
      Cut: 10,
      Putback: 10,
      Transition: 9,
      PnR_BH: 0,
      Isolation: 0,
      Off_Screen: 0,
      Hand_Off: 0,
    },
  },
  ISA: {
    name: 'Isolation Attacker',
    description: 'Players who prefer isolation offense and often carry a central offensive role.',
    example_players: ['LeBron James', 'Kawhi Leonard'],
    playtype_supply: {
      Isolation: 14,
      PnR_BH: 25,
      Spot_Up: 18,
      Transition: 15,
      Post_Up: 10,
      Cut: 8,
      Off_Screen: 5,
      PnR_RM: 0,
      Putback: 0,
      Hand_Off: 0,
    },
  },
  PUB: {
    name: 'Post-up Big',
    description: 'Players who prefer post play.',
    example_players: ['Anthony Davis', 'James Wiseman'],
    playtype_supply: {
      Post_Up: 26,
      PnR_RM: 18,
      Putback: 15,
      Cut: 15,
      Transition: 10,
      Spot_Up: 5,
      PnR_BH: 0,
      Isolation: 0,
      Off_Screen: 0,
      Hand_Off: 0,
    },
  },
  SBH: {
    name: 'Secondary Ball-Handler',
    description: 'Ball-handlers with more spot-up possessions than primary handlers.',
    example_players: ['Malcolm Brogdon', 'Dennis Schroder'],
    playtype_supply: {
      PnR_BH: 36,
      Spot_Up: 23,
      Transition: 15,
      Isolation: 10,
      Cut: 6,
      Off_Screen: 5,
      PnR_RM: 0,
      Putback: 0,
      Post_Up: 0,
      Hand_Off: 0,
    },
  },
  TRA: {
    name: 'Transition Attacker',
    description: 'Players who thrive in transition and also contribute from spot-up actions.',
    example_players: ['Caleb Martin', 'Alex Caruso'],
    playtype_supply: {
      Spot_Up: 33,
      Transition: 23,
      Cut: 15,
      PnR_BH: 10,
      Putback: 5,
      Off_Screen: 5,
      Isolation: 5,
      PnR_RM: 0,
      Post_Up: 0,
      Hand_Off: 0,
    },
  },
  PBH: {
    name: 'Primary Ball-Handler',
    description: 'Ball-handlers who often use on-ball screens and initiate the offense.',
    example_players: ['LaMelo Ball', 'Tyrese Haliburton'],
    playtype_supply: {
      PnR_BH: 46,
      Isolation: 15,
      Transition: 15,
      Spot_Up: 12,
      Off_Screen: 5,
      Cut: 3,
      PnR_RM: 0,
      Putback: 0,
      Post_Up: 0,
      Hand_Off: 0,
    },
  },
  SUS: {
    name: 'Spot-up Shooter',
    description: 'Shooters who prefer to finish possessions from spot-up opportunities.',
    example_players: ['Yuta Watanabe', 'P.J. Tucker'],
    playtype_supply: {
      Spot_Up: 47,
      Transition: 20,
      Off_Screen: 10,
      Cut: 10,
      PnR_BH: 5,
      Isolation: 0,
      PnR_RM: 0,
      Putback: 0,
      Post_Up: 0,
      Hand_Off: 0,
    },
  },
  RCB: {
    name: 'Roll & Cut Big',
    description: 'Players who pressure the rim via dives and cuts and add putback value.',
    example_players: ['Clint Capela', 'Rudy Gobert'],
    playtype_supply: {
      Cut: 26,
      PnR_RM: 23,
      Putback: 20,
      Post_Up: 15,
      Transition: 10,
      PnR_BH: 0,
      Spot_Up: 0,
      Isolation: 0,
      Off_Screen: 0,
      Hand_Off: 0,
    },
  },
  OSS: {
    name: 'Off-screen Shooter',
    description: 'Players who use hand-offs and off-screen actions to create shots.',
    example_players: ['Kevin Huerter', 'Duncan Robinson'],
    playtype_supply: {
      Spot_Up: 28,
      Off_Screen: 20,
      Transition: 15,
      Hand_Off: 14,
      PnR_BH: 10,
      Cut: 8,
      Isolation: 0,
      PnR_RM: 0,
      Putback: 0,
      Post_Up: 0,
    },
  },
  WWH: {
    name: 'Wing with Handle',
    description: 'Players who blend driving and shooting, between handler and shooter profiles.',
    example_players: ['Kyle Kuzma', 'Seth Curry'],
    playtype_supply: {
      Spot_Up: 29,
      PnR_BH: 22,
      Transition: 15,
      Isolation: 12,
      Cut: 10,
      Off_Screen: 8,
      PnR_RM: 0,
      Putback: 0,
      Post_Up: 0,
      Hand_Off: 0,
    },
  },
};

export const OFFENSIVE_ROLE_TAG_OPTIONS: Array<{ label: string; value: string }> = Object.entries(OFFENSIVE_ROLES).map(
  ([code, meta]) => ({ value: code, label: `${meta.name} (${code})` })
);

export const getOffensiveRoleLabel = (code: string | undefined): string => {
  if (!code) return 'Unknown';
  const meta = OFFENSIVE_ROLES[code];
  return meta ? `${meta.name} (${code})` : code;
};

export const formatOffensiveRoleForAi = (code: string | undefined): string => {
  if (!code) return 'Unknown';
  const meta = OFFENSIVE_ROLES[code];
  if (!meta) return code;
  return `${code} - ${meta.name}: ${meta.description}`;
};
