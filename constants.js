"use strict";

Object.assign(exports, {
    MEMORY_KEY_VISITED: 'v'
    , MEMORY_KEY_VISITED_STATUS: 'vs'
    , MEMORY_KEY_AVOID: 'a'

    , MEMORY_KEY_MY: 'y'
    , MEMORY_KEY_OWNER: 'o'
    , MEMORY_KEY_LEVEL: 'le'
    , MEMORY_KEY_ROOM_COLONY_BUILD_LEVEL: 'cle'
    , MEMORY_KEY_ROOM_COLONY_CREATE_TIME: 'cct'
    , MEMORY_KEY_RESERVED_BY: 'rb'

    , MEMORY_KEY_SOURCES: 's'
    , MEMORY_KEY_SOURCES_HARVEST_POS: 'h'            // harvestPos
    , MEMORY_KEY_SOURCES_CONTAINER: 'c'              // sourceContainer
    , MEMORY_KEY_SOURCES_CONTAINER_ROAD: 'r'         // sourceContainerRoadPos
    , MEMORY_KEY_SOURCES_PATH_LENGTH: 'l'            // sourcePathLength
    , MEMORY_KEY_SOURCES_LINK: 'k'                   // sourceLink
    , MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS: 'b'   // anyPerimeterBarrierCoords

    , MEMORY_KEY_SOURCE_COUNT: 'sc'

    , MEMORY_KEY_MINERALS: 'm'
    , MEMORY_KEY_MINERAL_TYPE: 't'
    , MEMORY_KEY_MINERAL_AMOUNT: 'a'
    , MEMORY_KEY_MINERAL_DENSITY: 'd'
    , MEMORY_KEY_MINERAL_NIPS: 'n'

    , MEMORY_KEY_MINERAL_HARVEST_POSITION: 'mhp'

    , MEMORY_KEY_THORIUM_ID: 'ti'
    , MEMORY_KEY_THORIUM_AMOUNT: 'ta'
    , MEMORY_KEY_THORIUM_DENSITY: 'td'
    , MEMORY_KEY_THORIUM_NIPS: 'tn'

    , MEMORY_KEY_CENTER_POSITION: 'p'

    , MEMORY_KEY_PLUNDERABLE_AMOUNT: 'pa'
    , MEMORY_KEY_PLUNDERABLE_VALUE: 'pv'
    , MEMORY_KEY_PLUNDERABLE_HASH: 'ph'

    , MEMORY_KEY_PLAYER_HOSTILE_LAST_TIME: 'hlt'                // lastHostileTime
    , MEMORY_KEY_PLAYER_HOSTILE_LAST_EDGE_POS: 'hlp'            // lastHostileEdgePos
    , MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL: 'lhattl'              // lastHostileAttackTimeToLive

    , MEMORY_KEY_HOSTILES_TTL: 'httl'                           // hostileTimeToLive
    , MEMORY_KEY_DANGEROUS_HOSTILES_TTL: 'dhttl'                // dangerousHostilesTimeToLive
    , MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL: 'dphttl'        // dangerousPlayerHostilesTimeToLive
    , MEMORY_KEY_LETHAL_HOSTILES_TTL: 'lhttl'                   // lethalHostilesTimeToLive
    , MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL: 'lphttl'           // lethalPlayerHostilesTimeToLive
    , MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL: 'lbhttl'          // lethalBoostedHostilesTimeToLive
    , MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL: 'lbphttl'  // lethalBoostedPlayerHostilesTimeToLive

    , MEMORY_KEY_HOSTILE_ATTACK_POWER: 'hap'                    // hostileAttackPower
    , MEMORY_KEY_HOSTILE_RANGED_ATTACK_POWER: 'hrap'            // hostileRangedAttackPower
    , MEMORY_KEY_HOSTILE_HEAL_POWER: 'hhp'                      // hostileHealPower

    , MEMORY_KEY_KEEPER_LAIRS: 'kl'                             // keeperLairs
    , MEMORY_KEY_KEEPER_LAIR_POS_LIST: 'kp'                     // getKeeperLairPosList
    , MEMORY_KEY_SOURCEKEEPER_POS_LIST: 'sk'                    // sourceKeeperPos

    , MEMORY_KEY_HIGHWAY_NOVICE_WALLS_EXIST: 'hnwe'             // highwayNoviceWallExist

    , MEMORY_KEY_STRUCTURES_TO_DISMANTLE: 't'                   // hasStructuresToDismantle

    , MEMORY_KEY_HOSTILE_SPAWN_COUNT: 'hs'                      // spawns
    , MEMORY_KEY_HOSTILE_TOWER_COUNT: 'ht'                      // towers
    , MEMORY_KEY_HOSTILE_LAB_COUNT: 'hl'                        // labs
    , MEMORY_KEY_HOSTILE_ENERGY: 'he'                           // hostileEnergy
    , MEMORY_KEY_DESTROY_FLAG_HITS: 'df'                        // destroyFlagHits

    , MEMORY_KEY_SCREEPS_WITH_CARRY_TTL: 'swcttl'               // getScreepsWithCarryTTL
    , MEMORY_KEY_SCREEPS_TTL: 'sttl'                            // getScreepsTTL

    , MEMORY_KEY_ROOM_BARRIER_BELOW_THRESHHOLD: 'bt'                // hasBarrierBelowThreshhold
    , MEMORY_KEY_ROOM_NEEDS_DEFENDER: 'nd'                          // roomNeedsDefender
    , MEMORY_KEY_ROOM_NEEDS_BOOSTED_DEFENDER: 'nbd'                 // roomNeedsBoostedDefender
    , MEMORY_KEY_ROOM_COLONY_BREACHED_BY_PLAYER: 'cbp'              // colonyBreachedByPlayerTime

    , MEMORY_KEY_HOSTILE_SAFE_MODE_EXPIRES_TIME: 'hsmet'            // hostileSafeModeExpiresTime
    , MEMORY_KEY_SAFE_MODE_COOLDOWN_EXPIRES_TIME: 'smcet'           // safeModeCooldownExpiresTime

    , MEMORY_KEY_INVADER_CORE: 'ic'                                 // invaderCore

    , MEMORY_KEY_INVADERS_TTL: 'ittl'                               // invadersTimeToLive

    // Creep memory variables.
    , MEMORY_KEY_CREEP_ROLE: 'r'                                    // role
    , MEMORY_KEY_CREEP_TASK: 'k'                                    // task (traveler has taken t)
    , MEMORY_KEY_CREEP_EXIT_TO_CLOSEST_SAFE_CONTROLLER_ROOM: 'es'   // exitToClosestSafeControllerRoom
    , MEMORY_KEY_CREEP_MOVE_TO_ROOM_POS: 'rp'                       // moveToRoomPos
    , MEMORY_KEY_CREEP_USED_CAPACITY: 'uc'                          // usedCapacity
    , MEMORY_KEY_CREEP_SPAWN_ENERGY_CAPACITY_AVAILABLE: 'se'        // creepSpawnEnergyCapacityAvailable
    , MEMORY_KEY_CREEP_FOCUS_ID: 'focusId'                          // focusId
    , MEMORY_KEY_CREEP_MOVETO_ID: 'moveToId'                        // moveToId
    , MEMORY_KEY_CREEP_MOVETO_POS: 'moveToPos'                      // moveToPos
    , MEMORY_KEY_CREEP_HARVEST_ID: 'harvestId'                      // harvestId
    , MEMORY_KEY_CREEP_HEALER_ID: 'healerId'                        // healerId
    , MEMORY_KEY_CREEP_RESERVE_ONLY: 'ro'                           // reserveOnly

    , MEMORY_KEY_CREEP_NAP_TIME: 'nt'                               // napTime
    , MEMORY_KEY_CREEP_NAP_POS: 'np'                                // napPos

    , MEMORY_KEY_CREEP_SPAWN_ROOM: 'sr'                             // spawnRoom
    , MEMORY_KEY_CREEP_WORK_ROOM: 'wr'                              // workRoom
    , MEMORY_KEY_CREEP_ASSIGNED_ROOM: 'dr'                           // assignedRoom
    , MEMORY_KEY_CREEP_LAST_ROOM: 'lr'                              // lastRoom
    , MEMORY_KEY_CREEP_PREVIOUS_ROOM: 'pr'                          // previousRoom

    // Seasonal.
    , MEMORY_KEY_MY_REACTOR: 'ri'

})

// Season 5 constants.
Object.assign(exports, {
    RESOURCE_THORIUM: 'T'
    , FIND_REACTORS: 10051
});

// Empire obectives
Object.assign(exports, {
    OBJECTIVE_GCL: 'C'
    , OBJECTIVE_GPL: 'P'
    , OBJECTIVE_CREDITS: 'E'
    , OBJECTIVE_FOCUS: 'F'
});

Object.assign(exports, {

	TERMINAL_MINERALS_COMPOUNDS_HASH: {
        [RESOURCE_HYDROGEN]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_UTRIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
        , [RESOURCE_CATALYST]: true

        , [RESOURCE_HYDROXIDE]: true
        , [RESOURCE_ZYNTHIUM_KEANITE]: true
        , [RESOURCE_UTRIUM_LEMERGITE]: true
        , [RESOURCE_GHODIUM]: true

        , [RESOURCE_UTRIUM_HYDRIDE]: true
        , [RESOURCE_UTRIUM_OXIDE]: true
        , [RESOURCE_KEANIUM_HYDRIDE]: true
        , [RESOURCE_KEANIUM_OXIDE]: true
        , [RESOURCE_LEMERGIUM_HYDRIDE]: true
        , [RESOURCE_LEMERGIUM_OXIDE]: true
        , [RESOURCE_ZYNTHIUM_HYDRIDE]: true
        , [RESOURCE_ZYNTHIUM_OXIDE]: true
        , [RESOURCE_GHODIUM_HYDRIDE]: true
        , [RESOURCE_GHODIUM_OXIDE]: true

        , [RESOURCE_UTRIUM_ACID]: true
        , [RESOURCE_UTRIUM_ALKALIDE]: true
        , [RESOURCE_KEANIUM_ACID]: true
        , [RESOURCE_KEANIUM_ALKALIDE]: true
        , [RESOURCE_LEMERGIUM_ACID]: true
        , [RESOURCE_LEMERGIUM_ALKALIDE]: true
        , [RESOURCE_ZYNTHIUM_ACID]: true
        , [RESOURCE_ZYNTHIUM_ALKALIDE]: true
        , [RESOURCE_GHODIUM_ACID]: true
        , [RESOURCE_GHODIUM_ALKALIDE]: true

        , [RESOURCE_CATALYZED_UTRIUM_ACID]: true
        , [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_KEANIUM_ACID]: true
        , [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_LEMERGIUM_ACID]: true
        , [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: true
        , [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_GHODIUM_ACID]: true
        , [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: true
    }

	, TERMINAL_MINERALS_RAW_BASE_HASH: {
        [RESOURCE_HYDROGEN]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_UTRIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
    }

	, TERMINAL_MINERALS_RAW_HASH: {
        [RESOURCE_HYDROGEN]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_UTRIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
        , [RESOURCE_CATALYST]: true
    }

	, TERMINAL_COMPOUNDS_BASE_HASH: {
        [RESOURCE_HYDROXIDE]: true
        , [RESOURCE_ZYNTHIUM_KEANITE]: true
        , [RESOURCE_UTRIUM_LEMERGITE]: true
        , [RESOURCE_GHODIUM]: true
    }

	, TERMINAL_COMPOUNDS_TIER1_HASH: {
        [RESOURCE_UTRIUM_HYDRIDE]: true
        , [RESOURCE_UTRIUM_OXIDE]: true
        , [RESOURCE_KEANIUM_HYDRIDE]: true
        , [RESOURCE_KEANIUM_OXIDE]: true
        , [RESOURCE_LEMERGIUM_HYDRIDE]: true
        , [RESOURCE_LEMERGIUM_OXIDE]: true
        , [RESOURCE_ZYNTHIUM_HYDRIDE]: true
        , [RESOURCE_ZYNTHIUM_OXIDE]: true
        , [RESOURCE_GHODIUM_HYDRIDE]: true
        , [RESOURCE_GHODIUM_OXIDE]: true
    }

	, TERMINAL_COMPOUNDS_TIER2_HASH: {
        [RESOURCE_UTRIUM_ACID]: true
        , [RESOURCE_UTRIUM_ALKALIDE]: true
        , [RESOURCE_KEANIUM_ACID]: true
        , [RESOURCE_KEANIUM_ALKALIDE]: true
        , [RESOURCE_LEMERGIUM_ACID]: true
        , [RESOURCE_LEMERGIUM_ALKALIDE]: true
        , [RESOURCE_ZYNTHIUM_ACID]: true
        , [RESOURCE_ZYNTHIUM_ALKALIDE]: true
        , [RESOURCE_GHODIUM_ACID]: true
        , [RESOURCE_GHODIUM_ALKALIDE]: true
    }

	, TERMINAL_COMPOUNDS_TIER3_HASH: {
        [RESOURCE_CATALYZED_UTRIUM_ACID]: true
        , [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_KEANIUM_ACID]: true
        , [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_LEMERGIUM_ACID]: true
        , [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: true
        , [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: true
        , [RESOURCE_CATALYZED_GHODIUM_ACID]: true
        , [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: true
    }

	, TERMINAL_COMPOUNDS_UPGRADE_CONTROLLER_HASH: {
        [RESOURCE_HYDROXIDE]: true
        , [RESOURCE_ZYNTHIUM_KEANITE]: true
        , [RESOURCE_UTRIUM_LEMERGITE]: true
        , [RESOURCE_GHODIUM]: true

        , [RESOURCE_GHODIUM_HYDRIDE]: true

        , [RESOURCE_GHODIUM_ACID]: true

        , [RESOURCE_CATALYZED_GHODIUM_ACID]: true
    }

	, TERMINAL_BOOSTS_UPGRADE_CONTROLLER_HASH: {
        [RESOURCE_GHODIUM_HYDRIDE]: true
        , [RESOURCE_GHODIUM_ACID]: true
        , [RESOURCE_CATALYZED_GHODIUM_ACID]: true
    }

	, FACTORY_RESOURCES_HASH: {
        [RESOURCE_ENERGY]: true
        , [RESOURCE_HYDROGEN]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_UTRIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
        , [RESOURCE_CATALYST]: true
        , [RESOURCE_GHODIUM]: true
    }

	, FACTORY_COMMODITIES_RAW_HASH: {
        [RESOURCE_METAL]: true
        , [RESOURCE_BIOMASS]: true
        , [RESOURCE_SILICON]: true
        , [RESOURCE_MIST]: true
    }

	, FACTORY_COMMODITIES_COMPRESSING_HASH: {
        [RESOURCE_UTRIUM_BAR]: true
        , [RESOURCE_LEMERGIUM_BAR]: true
        , [RESOURCE_ZYNTHIUM_BAR]: true
        , [RESOURCE_KEANIUM_BAR]: true
        , [RESOURCE_GHODIUM_MELT]: true
        , [RESOURCE_OXIDANT]: true
        , [RESOURCE_REDUCTANT]: true
        , [RESOURCE_PURIFIER]: true
        , [RESOURCE_BATTERY]: true
    }

	, FACTORY_COMMODITIES_COMPRESSING_MINERAL_HASH: {
        [RESOURCE_UTRIUM_BAR]: RESOURCE_UTRIUM
        , [RESOURCE_LEMERGIUM_BAR]: RESOURCE_LEMERGIUM
        , [RESOURCE_ZYNTHIUM_BAR]: RESOURCE_ZYNTHIUM
        , [RESOURCE_KEANIUM_BAR]: RESOURCE_KEANIUM
        , [RESOURCE_GHODIUM_MELT]: RESOURCE_GHODIUM
        , [RESOURCE_OXIDANT]: RESOURCE_OXYGEN
        , [RESOURCE_REDUCTANT]: RESOURCE_HYDROGEN
        , [RESOURCE_PURIFIER]: RESOURCE_CATALYST
        //, [RESOURCE_BATTERY]: RESOURCE_ENERGY
    }

	, FACTORY_COMMODITIES_DECOMPRESSING_HASH: {
        [RESOURCE_UTRIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_GHODIUM]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_HYDROGEN]: true
        , [RESOURCE_CATALYST]: true
        , [RESOURCE_ENERGY]: true
    }

	, FACTORY_COMMODITIES_DECOMPRESSING_MINERAL_HASH: {
        [RESOURCE_UTRIUM]: RESOURCE_UTRIUM_BAR
        , [RESOURCE_LEMERGIUM]: RESOURCE_LEMERGIUM_BAR
        , [RESOURCE_ZYNTHIUM]: RESOURCE_ZYNTHIUM_BAR
        , [RESOURCE_KEANIUM]: RESOURCE_KEANIUM_BAR
        , [RESOURCE_GHODIUM]: RESOURCE_GHODIUM_MELT
        , [RESOURCE_OXYGEN]: RESOURCE_OXIDANT
        , [RESOURCE_HYDROGEN]: RESOURCE_REDUCTANT
        , [RESOURCE_CATALYST]: RESOURCE_PURIFIER
        //, [RESOURCE_ENERGY]: RESOURCE_BATTERY
    }

	, FACTORY_COMMODITIES_BASIC_HASH: {
        [RESOURCE_WIRE]: true
        , [RESOURCE_CELL]: true
        , [RESOURCE_ALLOY]: true
        , [RESOURCE_CONDENSATE]: true
    }

	, FACTORY_COMMODITIES_LEVEL1_HASH: {
        [RESOURCE_COMPOSITE]: true

        , [RESOURCE_TUBE]: true
        , [RESOURCE_PHLEGM]: true
        , [RESOURCE_SWITCH]: true
        , [RESOURCE_CONCENTRATE]: true
    }

	, FACTORY_COMMODITIES_LEVEL1_CHAIN_HASH: {
        [RESOURCE_TUBE]: true
        , [RESOURCE_PHLEGM]: true
        , [RESOURCE_SWITCH]: true
        , [RESOURCE_CONCENTRATE]: true
    }

	, FACTORY_COMMODITIES_LEVEL2_HASH: {
        [RESOURCE_CRYSTAL]: true

        , [RESOURCE_FIXTURES]: true
        , [RESOURCE_TISSUE]: true
        , [RESOURCE_TRANSISTOR]: true
        , [RESOURCE_EXTRACT]: true
    }

	, FACTORY_COMMODITIES_LEVEL2_CHAIN_HASH: {
        [RESOURCE_FIXTURES]: true
        , [RESOURCE_TISSUE]: true
        , [RESOURCE_TRANSISTOR]: true
        , [RESOURCE_EXTRACT]: true
    }

	, FACTORY_COMMODITIES_LEVEL3_HASH: {
        [RESOURCE_LIQUID]: true

        , [RESOURCE_FRAME]: true
        , [RESOURCE_MUSCLE]: true
        , [RESOURCE_MICROCHIP]: true
        , [RESOURCE_SPIRIT]: true
    }

	, FACTORY_COMMODITIES_LEVEL3_CHAIN_HASH: {
        [RESOURCE_FRAME]: true
        , [RESOURCE_MUSCLE]: true
        , [RESOURCE_MICROCHIP]: true
        , [RESOURCE_SPIRIT]: true
    }

	, FACTORY_COMMODITIES_LEVEL4_HASH: {
        [RESOURCE_HYDRAULICS]: true
        , [RESOURCE_ORGANOID]: true
        , [RESOURCE_CIRCUIT]: true
        , [RESOURCE_EMANATION]: true
    }

	, FACTORY_COMMODITIES_LEVEL4_CHAIN_HASH: {
        [RESOURCE_HYDRAULICS]: true
        , [RESOURCE_ORGANOID]: true
        , [RESOURCE_CIRCUIT]: true
        , [RESOURCE_EMANATION]: true
    }

	, FACTORY_COMMODITIES_LEVEL5_HASH: {
        [RESOURCE_MACHINE]: true
        , [RESOURCE_ORGANISM]: true
        , [RESOURCE_DEVICE]: true
        , [RESOURCE_ESSENCE]: true
    }

	, FACTORY_COMMODITIES_LEVEL5_CHAIN_HASH: {
        [RESOURCE_MACHINE]: true
        , [RESOURCE_ORGANISM]: true
        , [RESOURCE_DEVICE]: true
        , [RESOURCE_ESSENCE]: true
    }

	, FACTORY_COMMODITIES_MECHANICAL_CHAIN_HASH: {
        [RESOURCE_METAL]: true
        , [RESOURCE_ALLOY]: true
        , [RESOURCE_TUBE]: true
        , [RESOURCE_FIXTURES]: true
        , [RESOURCE_FRAME]: true
        , [RESOURCE_HYDRAULICS]: true
        , [RESOURCE_MACHINE]: true
    }

	, FACTORY_COMMODITIES_BIOLOGICAL_CHAIN_HASH: {
        [RESOURCE_BIOMASS]: true
        , [RESOURCE_CELL]: true
        , [RESOURCE_PHLEGM]: true
        , [RESOURCE_TISSUE]: true
        , [RESOURCE_MUSCLE]: true
        , [RESOURCE_ORGANOID]: true
        , [RESOURCE_ORGANISM]: true
    }

	, FACTORY_COMMODITIES_ELECTRONICAL_CHAIN_HASH: {
        [RESOURCE_SILICON]: true
        , [RESOURCE_WIRE]: true
        , [RESOURCE_SWITCH]: true
        , [RESOURCE_TRANSISTOR]: true
        , [RESOURCE_MICROCHIP]: true
        , [RESOURCE_CIRCUIT]: true
        , [RESOURCE_DEVICE]: true
    }

	, FACTORY_COMMODITIES_MYSTICAL_CHAIN_HASH: {
        [RESOURCE_MIST]: true
        , [RESOURCE_CONDENSATE]: true
        , [RESOURCE_CONCENTRATE]: true
        , [RESOURCE_EXTRACT]: true
        , [RESOURCE_SPIRIT]: true
        , [RESOURCE_EMANATION]: true
        , [RESOURCE_ESSENCE]: true
    }

	, FACTORY_COMMODITIES_NEVER_SELL_HASH: {
        [RESOURCE_BATTERY]: true
    }

	, HARVEST_RESOURCES_HASH: {
        [RESOURCE_ENERGY]: true

        , [RESOURCE_HYDROGEN]: true
        , [RESOURCE_OXYGEN]: true
        , [RESOURCE_UTRIUM]: true
        , [RESOURCE_KEANIUM]: true
        , [RESOURCE_LEMERGIUM]: true
        , [RESOURCE_ZYNTHIUM]: true
        , [RESOURCE_CATALYST]: true

        , [RESOURCE_METAL]: true
        , [RESOURCE_BIOMASS]: true
        , [RESOURCE_SILICON]: true
        , [RESOURCE_MIST]: true

        , [RESOURCE_POWER]: true
    }

})

Object.assign(exports, {
    TERMINAL_COMPOUNDS_HASH: {
        ...exports.TERMINAL_COMPOUNDS_BASE_HASH
        , ...exports.TERMINAL_COMPOUNDS_TIER1_HASH
        , ...exports.TERMINAL_COMPOUNDS_TIER2_HASH
        , ...exports.TERMINAL_COMPOUNDS_TIER3_HASH
    }
})

Object.assign(exports, {
    TERMINAL_MINERALS_TARGET_HASH: {
        ...exports.TERMINAL_MINERALS_COMPOUNDS_HASH
        , [RESOURCE_POWER]: true
    }
})

Object.assign(exports, {
    TERMINAL_FUNGIBLES_HASH: {
        ...exports.TERMINAL_MINERALS_RAW_HASH
        , [RESOURCE_POWER]: true
        , [RESOURCE_CATALYZED_GHODIUM_ACID]: true
        , [RESOURCE_GHODIUM_ACID]: true
        , [RESOURCE_GHODIUM_HYDRIDE]: true
        , [RESOURCE_GHODIUM]: true
        , [RESOURCE_BATTERY]: true
    }
})

Object.assign(exports, {
    FACTORY_RESOURCES_RAW_HASH: {
        ...exports.FACTORY_RESOURCES_HASH
        , ...exports.FACTORY_COMMODITIES_RAW_HASH
    }
})

Object.assign(exports, {
    FACTORY_COMMODITIES_LEVEL0_HASH: {
        ...exports.FACTORY_COMMODITIES_COMPRESSING_HASH
        , ...exports.FACTORY_COMMODITIES_BASIC_HASH
    }
})

Object.assign(exports, {
    FACTORY_COMMODITIES_LEVEL0_CHAIN_HASH: {
        ...exports.FACTORY_COMMODITIES_BASIC_HASH
    }
})

/**
 * This is the "everything" list of anything the factory uses or produces.
 */
Object.assign(exports, {
    FACTORY_COMMODITIES_HASH: {
        ...exports.FACTORY_COMMODITIES_RAW_HASH
        , ...exports.FACTORY_COMMODITIES_COMPRESSING_HASH
        , ...exports.FACTORY_COMMODITIES_BASIC_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL1_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL2_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL3_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL4_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL5_HASH
    }
})

/**
 * The commodities we wish to sell when overubundant. Should contain only things produced, including components to higher levels.
 */
Object.assign(exports, {
    FACTORY_COMMODITIES_SELL_HASH: {
        ...exports.FACTORY_COMMODITIES_LEVEL0_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL1_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL2_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL3_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL4_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL5_HASH
    }
})

/**
 * The commodities we wish to sell when just under room target.
 * This allows us to not be blocked by upper factory chain cooldowns when we have plenty
 * of lower valuable materials on hand.
 */
 Object.assign(exports, {
    FACTORY_COMMODITIES_CHAIN_SELL_HASH: {
        ...exports.FACTORY_COMMODITIES_LEVEL0_CHAIN_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL1_CHAIN_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL2_CHAIN_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL3_CHAIN_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL4_CHAIN_HASH
        , ...exports.FACTORY_COMMODITIES_LEVEL5_CHAIN_HASH
    }
})

Object.assign(exports, {
    TERMINAL_MINERALS_COMPOUNDS: Object.keys(exports.TERMINAL_MINERALS_COMPOUNDS_HASH)
    , TERMINAL_MINERALS_RAW_BASE: Object.keys(exports.TERMINAL_MINERALS_RAW_BASE_HASH)
    , TERMINAL_MINERALS_RAW: Object.keys(exports.TERMINAL_MINERALS_RAW_HASH)
    , TERMINAL_COMPOUNDS_BASE: Object.keys(exports.TERMINAL_COMPOUNDS_BASE_HASH)
    , TERMINAL_COMPOUNDS_TIER1: Object.keys(exports.TERMINAL_COMPOUNDS_TIER1_HASH)
    , TERMINAL_COMPOUNDS_TIER2: Object.keys(exports.TERMINAL_COMPOUNDS_TIER2_HASH)
    , TERMINAL_COMPOUNDS_TIER3: Object.keys(exports.TERMINAL_COMPOUNDS_TIER3_HASH)
    , TERMINAL_COMPOUNDS: Object.keys(exports.TERMINAL_COMPOUNDS_HASH)

    , TERMINAL_BOOSTS_UPGRADE_CONTROLLER: Object.keys(exports.TERMINAL_BOOSTS_UPGRADE_CONTROLLER_HASH)
    , TERMINAL_COMPOUNDS_UPGRADE_CONTROLLER: Object.keys(exports.TERMINAL_COMPOUNDS_UPGRADE_CONTROLLER_HASH)
    , TERMINAL_MINERALS_TARGET: Object.keys(exports.TERMINAL_MINERALS_TARGET_HASH)
    , TERMINAL_FUNGIBLES: Object.keys(exports.TERMINAL_FUNGIBLES_HASH)

    , FACTORY_RESOURCES: Object.keys(exports.FACTORY_RESOURCES_HASH)
    , FACTORY_COMMODITIES_RAW: Object.keys(exports.FACTORY_COMMODITIES_RAW_HASH)
    , FACTORY_COMMODITIES_COMPRESSING: Object.keys(exports.FACTORY_COMMODITIES_COMPRESSING_HASH)
    , FACTORY_COMMODITIES_COMPRESSING_MINERAL: Object.keys(exports.FACTORY_COMMODITIES_COMPRESSING_MINERAL_HASH)
    , FACTORY_COMMODITIES_DECOMPRESSING: Object.keys(exports.FACTORY_COMMODITIES_DECOMPRESSING_HASH)
    , FACTORY_COMMODITIES_DECOMPRESSING_MINERAL: Object.keys(exports.FACTORY_COMMODITIES_DECOMPRESSING_MINERAL_HASH)
    , FACTORY_COMMODITIES_BASIC: Object.keys(exports.FACTORY_COMMODITIES_BASIC_HASH)

    , FACTORY_RESOURCES_RAW: Object.keys(exports.FACTORY_RESOURCES_RAW_HASH)
    , FACTORY_COMMODITIES_LEVEL0: Object.keys(exports.FACTORY_COMMODITIES_LEVEL0_HASH)

    , FACTORY_COMMODITIES_LEVEL1: Object.keys(exports.FACTORY_COMMODITIES_LEVEL1_HASH)
    , FACTORY_COMMODITIES_LEVEL2: Object.keys(exports.FACTORY_COMMODITIES_LEVEL2_HASH)
    , FACTORY_COMMODITIES_LEVEL3: Object.keys(exports.FACTORY_COMMODITIES_LEVEL3_HASH)
    , FACTORY_COMMODITIES_LEVEL4: Object.keys(exports.FACTORY_COMMODITIES_LEVEL4_HASH)
    , FACTORY_COMMODITIES_LEVEL5: Object.keys(exports.FACTORY_COMMODITIES_LEVEL5_HASH)

    // These exclude the common higher level commodities used as components in the chains themselves.
    , FACTORY_COMMODITIES_LEVEL0_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL0_CHAIN_HASH)
    , FACTORY_COMMODITIES_LEVEL1_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL1_CHAIN_HASH)
    , FACTORY_COMMODITIES_LEVEL2_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL2_CHAIN_HASH)
    , FACTORY_COMMODITIES_LEVEL3_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL3_CHAIN_HASH)
    , FACTORY_COMMODITIES_LEVEL4_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL4_CHAIN_HASH)
    , FACTORY_COMMODITIES_LEVEL5_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_LEVEL5_CHAIN_HASH)

    , FACTORY_COMMODITIES_MECHANICAL_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_MECHANICAL_CHAIN_HASH)
    , FACTORY_COMMODITIES_BIOLOGICAL_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_BIOLOGICAL_CHAIN_HASH)
    , FACTORY_COMMODITIES_ELECTRONICAL_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_ELECTRONICAL_CHAIN_HASH)
    , FACTORY_COMMODITIES_MYSTICAL_CHAIN: Object.keys(exports.FACTORY_COMMODITIES_MYSTICAL_CHAIN_HASH)

    , FACTORY_COMMODITIES: Object.keys(exports.FACTORY_COMMODITIES_HASH)

    // These are the ones we are okay to sell when overstocked.
    , FACTORY_COMMODITIES_SELL: Object.keys(exports.FACTORY_COMMODITIES_SELL_HASH)
    , FACTORY_COMMODITIES_CHAIN_SELL: Object.keys(exports.FACTORY_COMMODITIES_CHAIN_SELL_HASH)
    , FACTORY_COMMODITIES_NEVER_SELL: Object.keys(exports.FACTORY_COMMODITIES_NEVER_SELL_HASH)

    // Every basic harvestable resource in the game.
    , HARVEST_RESOURCES: Object.keys(exports.HARVEST_RESOURCES_HASH)
})

/**
 * [exports.RESOURCE_CONDENSATE]: {
 *     amount: 20,
 *     cooldown: 8,
 *     components: {
 *         [exports.RESOURCE_KEANIUM_BAR]: 20,
 *         [exports.RESOURCE_MIST]: 100,
 *         [exports.RESOURCE_ENERGY]: 40
 *     }
 * }
 */
function getFactoryComponents(commodities) {
    let components = {};
    for (let commodity of commodities) {
        for (let component in COMMODITIES[commodity]["components"]) {
            components[component] = COMMODITIES[commodity]["components"][component]
        }
    }
	return components;
}

Object.assign(exports, {
    COMPONENTS_COMPRESSING_HASH: getFactoryComponents(exports.FACTORY_COMMODITIES_COMPRESSING)
})

/**
 * Note if making changes to this function, also refer to utils.getMaxComponentAmountForFactoryLevel()
 */
function factoryComponentsNeeded(factoryLevel) {
    let data = [];

    // Factories will only produce commodities that their level can make, strictly.
    let commodities = Object.keys(COMMODITIES).filter(f => ((COMMODITIES[f].level || 0) === factoryLevel));
    let components = commodities.map(m => Object.keys(COMMODITIES[m].components))
    data = data.concat(...components);

    // Tack on OPS so all our factories get pre-loaded with ops overflow.
    if (factoryLevel > 0) data.push(RESOURCE_OPS);

    // Tack on BATTERY so our factories can generate energy that we buy.
    data.push(RESOURCE_BATTERY);

    // Reduce the array into a hash for better performance, and save to our local variable.
    data = data.reduce((map, obj) => (map[obj] = obj, map), {});
    return data;
}

function factoryCommoditiesByLevel(factoryLevel) {
    return Object.keys(COMMODITIES).filter(f => (COMMODITIES[f].level || 0) === factoryLevel);
}

Object.assign(exports, {
    FACTORY_COMPONENTS_BY_LEVEL_HASH: {
        0: factoryComponentsNeeded(0)
        , 1: factoryComponentsNeeded(1)
        , 2: factoryComponentsNeeded(2)
        , 3: factoryComponentsNeeded(3)
        , 4: factoryComponentsNeeded(4)
        , 5: factoryComponentsNeeded(5)
    }
})

Object.assign(exports, {
    FACTORY_COMMODITIES_BY_LEVEL_HASH: {
        0: factoryCommoditiesByLevel(0)
        , 1: factoryCommoditiesByLevel(1)
        , 2: factoryCommoditiesByLevel(2)
        , 3: factoryCommoditiesByLevel(3)
        , 4: factoryCommoditiesByLevel(4)
        , 5: factoryCommoditiesByLevel(5)
    }
})

function getSpawningEnergyCapacityForLevel(level) {
    let spawnEnergyCapacity = SPAWN_ENERGY_CAPACITY * CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level];
    let extensionEnergyCapacity = EXTENSION_ENERGY_CAPACITY[level] * CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level];
    return spawnEnergyCapacity + extensionEnergyCapacity;
};

Object.assign(exports, {
    SPAWNING_ENERGY_CAPACITY: {
        0: 0
        , 1: getSpawningEnergyCapacityForLevel(1)
        , 2: getSpawningEnergyCapacityForLevel(2)
        , 3: getSpawningEnergyCapacityForLevel(3)
        , 4: getSpawningEnergyCapacityForLevel(4)
        , 5: getSpawningEnergyCapacityForLevel(5)
        , 6: getSpawningEnergyCapacityForLevel(6)
        , 7: getSpawningEnergyCapacityForLevel(7)
        , 8: getSpawningEnergyCapacityForLevel(8)
    }
})

function getUniqueReactions() {
    let retval = [];
    for (let compound1 in REACTIONS) {
        for (let compound2 in REACTIONS[compound1]) {
            let result = REACTIONS[compound1][compound2];
            // All reactions are duplicated by ingredients. Only need to add one.
            if (compound1 < compound2) retval.push({compound1: compound1, compound2: compound2, result: result});
        }
    }
    return retval;
}

Object.assign(exports, {
    REACTIONS_UNIQUE: getUniqueReactions()
})

function getTerminalResourceTier(resource) {
    if (exports.TERMINAL_COMPOUNDS_TIER1_HASH[resource]) return 1;
    if (exports.TERMINAL_COMPOUNDS_TIER2_HASH[resource]) return 2;
    if (exports.TERMINAL_COMPOUNDS_TIER3_HASH[resource]) return 3;
    return 0;
}

Object.assign(exports, {
    REACTIONS_HASH: Object.assign(...exports.REACTIONS_UNIQUE.map(m => ({
        [m.result]: {
            amount: 1
            , level: getTerminalResourceTier(m.result)
            , components: {
                [m.compound1]: 1
                , [m.compound2]: 1
            }
        }
    })))
})

Object.assign(exports, {
    RESOURCE_COMPONENTS_HASH: Object.assign(COMMODITIES, exports.REACTIONS_HASH)
})

Object.assign(exports, {
    CHAIN_MECHANICAL: 'mechanical'
    , CHAIN_BIOLOGICAL: 'biological'
    , CHAIN_ELECTRONICAL: 'electronical'
    , CHAIN_MYSTICAL: 'mystical'
})

function getCommodityChain() {
    let chain = {};

    exports.FACTORY_COMMODITIES.forEach(commodity => {
        if (exports.FACTORY_COMMODITIES_MECHANICAL_CHAIN_HASH[commodity]) chain[commodity] = exports.CHAIN_MECHANICAL;
        if (exports.FACTORY_COMMODITIES_BIOLOGICAL_CHAIN_HASH[commodity]) chain[commodity] = exports.CHAIN_BIOLOGICAL;
        if (exports.FACTORY_COMMODITIES_ELECTRONICAL_CHAIN_HASH[commodity]) chain[commodity] = exports.CHAIN_ELECTRONICAL;
        if (exports.FACTORY_COMMODITIES_MYSTICAL_CHAIN_HASH[commodity]) chain[commodity] = exports.CHAIN_MYSTICAL;
    })

    return chain;
}

Object.assign(exports, {
    COMMODITY_CHAIN: getCommodityChain()
})

function getCommodityChainMembers() {
    let chain = {};

    chain[exports.CHAIN_MECHANICAL] = exports.FACTORY_COMMODITIES_MECHANICAL_CHAIN;
    chain[exports.CHAIN_BIOLOGICAL] = exports.FACTORY_COMMODITIES_BIOLOGICAL_CHAIN;
    chain[exports.CHAIN_ELECTRONICAL] = exports.FACTORY_COMMODITIES_ELECTRONICAL_CHAIN;
    chain[exports.CHAIN_MYSTICAL] = exports.FACTORY_COMMODITIES_MYSTICAL_CHAIN;

    return chain;
}

Object.assign(exports, {
    COMMODITY_CHAIN_MEMBERS_HASH: getCommodityChainMembers()
})

function getObstacleObjectTypesHash() {
    // https://screeps.com/forum/topic/876/roomposition-iswalkable/8
    return _.transform(OBSTACLE_OBJECT_TYPES, (o, type) => { o[type] = true; }, {});
}

Object.assign(exports, {
    OBSTACLE_OBJECT_TYPES_HASH: getObstacleObjectTypesHash()
})

Object.assign(exports, {
    BOOST_HARVEST: 'harvest'
    , BOOST_BUILD: 'build'
    , BOOST_REPAIR: 'repair'
    , BOOST_CONSTRUCTION: 'repair'
    , BOOST_DISMANTLE: 'dismantle'
    , BOOST_UPGRADECONTROLLER: 'upgradeController'
    , BOOST_ATTACK: 'attack'
    , BOOST_RANGEDATTACK: 'rangedAttack'
    //, BOOST_RANGEDMASSATTACK: 'rangedMassAttack'
    , BOOST_HEAL: 'heal'
    //, BOOST_RANGEDHEAL: 'rangedHeal'
    , BOOST_CAPACITY: 'capacity'
    , BOOST_FATIGUE: 'fatigue'
    , BOOST_REDUCEDAMAGE: 'damage'
})

Object.assign(exports, {
    BOOST_TYPES: {
        [WORK]: [
            exports.BOOST_HARVEST
            , exports.BOOST_CONSTRUCTION
            , exports.BOOST_DISMANTLE
            , exports.BOOST_UPGRADECONTROLLER
        ]
        , [ATTACK]: [
            exports.BOOST_ATTACK
        ]
        , [RANGED_ATTACK]: [
            exports.BOOST_RANGEDATTACK
        ]
        , [HEAL]: [
            exports.BOOST_HEAL
        ]
        , [CARRY]: [
            exports.BOOST_CAPACITY
        ]
        , [MOVE]: [
            exports.BOOST_FATIGUE
        ]
        , [TOUGH]: [
            exports.BOOST_REDUCEDAMAGE
        ]
    }
})

Object.assign(exports, {
    BODY_PART_BY_BOOST_TYPES: {
        [exports.BOOST_HARVEST]: WORK
        , [exports.BOOST_CONSTRUCTION]: WORK
        , [exports.BOOST_DISMANTLE]: WORK
        , [exports.BOOST_UPGRADECONTROLLER]: WORK
        , [exports.BOOST_ATTACK]: ATTACK
        , [exports.BOOST_RANGEDATTACK]: RANGED_ATTACK
        , [exports.BOOST_HEAL]: HEAL
        , [exports.BOOST_CAPACITY]: CARRY
        , [exports.BOOST_FATIGUE]: MOVE
        , [exports.BOOST_REDUCEDAMAGE]: TOUGH
    }
})

// It might be possible to dynamically look these up in a function. But for now, hard code.
Object.assign(exports, {
    BOOST_COMPOUNDS: {
        [exports.BOOST_HARVEST]: RESOURCE_CATALYZED_UTRIUM_ALKALIDE

        , [exports.BOOST_BUILD]: RESOURCE_CATALYZED_LEMERGIUM_ACID
        , [exports.BOOST_REPAIR]: RESOURCE_CATALYZED_LEMERGIUM_ACID
        , [exports.BOOST_CONSTRUCTION]: RESOURCE_CATALYZED_LEMERGIUM_ACID

        , [exports.BOOST_DISMANTLE]: RESOURCE_CATALYZED_ZYNTHIUM_ACID
        , [exports.BOOST_UPGRADECONTROLLER]: RESOURCE_CATALYZED_GHODIUM_ACID
        , [exports.BOOST_ATTACK]: RESOURCE_CATALYZED_UTRIUM_ACID
        , [exports.BOOST_RANGEDATTACK]: RESOURCE_CATALYZED_KEANIUM_ALKALIDE
        , [exports.BOOST_HEAL]: RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE
        , [exports.BOOST_CAPACITY]: RESOURCE_CATALYZED_KEANIUM_ACID
        , [exports.BOOST_FATIGUE]: RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE
        , [exports.BOOST_REDUCEDAMAGE]: RESOURCE_CATALYZED_GHODIUM_ALKALIDE
    }
})

Object.assign(exports, {
    MAX_BOOST_HARVEST: BOOSTS[WORK][exports.BOOST_COMPOUNDS[exports.BOOST_HARVEST]][exports.BOOST_HARVEST]
    , MAX_BOOST_BUILD: BOOSTS[WORK][exports.BOOST_COMPOUNDS[exports.BOOST_BUILD]][exports.BOOST_BUILD]
    , MAX_BOOST_REPAIR: BOOSTS[WORK][exports.BOOST_COMPOUNDS[exports.BOOST_REPAIR]][exports.BOOST_REPAIR]
    //, MAX_BOOST_CONSTRUCTION: 'repair'
    , MAX_BOOST_DISMANTLE: BOOSTS[WORK][exports.BOOST_COMPOUNDS[exports.BOOST_DISMANTLE]][exports.BOOST_DISMANTLE]
    , MAX_BOOST_UPGRADECONTROLLER: BOOSTS[WORK][exports.BOOST_COMPOUNDS[exports.BOOST_UPGRADECONTROLLER]][exports.BOOST_UPGRADECONTROLLER]
    , MAX_BOOST_ATTACK: BOOSTS[ATTACK][exports.BOOST_COMPOUNDS[exports.BOOST_ATTACK]][exports.BOOST_ATTACK]
    , MAX_BOOST_RANGEDATTACK: BOOSTS[RANGED_ATTACK][exports.BOOST_COMPOUNDS[exports.BOOST_RANGEDATTACK]][exports.BOOST_RANGEDATTACK]
    //, BOOST_RANGEDMASSATTACK: 'rangedMassAttack'
    , MAX_BOOST_HEAL: BOOSTS[HEAL][exports.BOOST_COMPOUNDS[exports.BOOST_HEAL]][exports.BOOST_HEAL]
    //, BOOST_RANGEDHEAL: 'rangedHeal'
    , MAX_BOOST_CAPACITY: BOOSTS[CARRY][exports.BOOST_COMPOUNDS[exports.BOOST_CAPACITY]][exports.BOOST_CAPACITY]
    , MAX_BOOST_FATIGUE: BOOSTS[MOVE][exports.BOOST_COMPOUNDS[exports.BOOST_FATIGUE]][exports.BOOST_FATIGUE]
    , MAX_BOOST_REDUCEDAMAGE: BOOSTS[TOUGH][exports.BOOST_COMPOUNDS[exports.BOOST_REDUCEDAMAGE]][exports.BOOST_REDUCEDAMAGE]
})

Object.assign(exports, {
    COLOR_TO_NUMBER: {
		[COLOR_RED]: 1
		, [COLOR_PURPLE]: 2
        , [COLOR_BLUE]: 3
        , [COLOR_CYAN]: 4
        , [COLOR_GREEN]: 5
        , [COLOR_YELLOW]: 6
        , [COLOR_ORANGE]: 7
        , [COLOR_BROWN]: 8
        , [COLOR_GREY]: 9
        , [COLOR_WHITE]: 0
    }
    , NUMBER_TO_COLOR: {
		1: COLOR_RED
		, 2: COLOR_PURPLE
		, 3: COLOR_BLUE
		, 4: COLOR_CYAN
		, 5: COLOR_GREEN
		, 6: COLOR_YELLOW
		, 7: COLOR_ORANGE
		, 8: COLOR_BROWN
		, 9: COLOR_GREY
		, 0: COLOR_WHITE
    }
})

Object.assign(exports, {
    PWR_GENERATE_OPS_MAX_EFFECT: POWER_INFO[PWR_GENERATE_OPS].effect.last()
})

Object.assign(exports, {
    BOOST_CAPACITY_MAX: BOOSTS[CARRY][RESOURCE_CATALYZED_KEANIUM_ACID].capacity
})

Object.assign(exports, {
    CONTROLLER_LEVELS_SUM: _.sum(CONTROLLER_LEVELS)
})

Object.assign(exports, {
    DESTROY_FLAG_CONTROLLER: 'con'
    , DESTROY_FLAG_CONTROLLER_NIP: 'cnp'
    , DESTROY_FLAG_SPAWN: 'spn'
    , DESTROY_FLAG_SOURCE: 'src'
})

Object.assign(exports, {
    MAX_STRONGHOLD_RANGE_BY_LEVEL: {
		1: 1
		, 2: 1
        , 3: 2
        , 4: 2
        , 5: 3
    }
})
