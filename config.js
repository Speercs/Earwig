"use strict";

const roles = {
    'KING'              : 'king'
    , 'QUEEN'           : 'queen'
    , 'JESTER'           : 'jester'

    , 'PEON'            : 'peon'
    , 'ROOK'            : 'rook'
    , 'PEASANT'         : 'peasant'
    , 'PAGE'            : 'page'

    , 'MINER'           : 'miner'
    , 'CLERK'           : 'clerk'
    , 'GNOME'           : 'gnome'
    , 'FENCER'          : 'fencer'

    , 'PREACHER'        : 'preacher'
    , 'FARMER'          : 'farmer'
    , 'OX'              : 'ox'
    , 'EXECUTIONER'     : 'executioner'
    , 'SCAVENGER'       : 'scavenger'

    , 'DREDGER'         : 'dredger'
    , 'JACKASS'         : 'jackass'

    , 'SCOUT'           : 'scout'

    , 'LLAMA'           : 'llama'
    , 'DONKEY'          : 'donkey'
    , 'BURRO'           : 'burro'
    , 'HORSE'           : 'horse'
    , 'MULE'            : 'mule'

    , 'ROGUE'           : 'rogue'

    , 'CRIER'           : 'crier'
    , 'PROPHET'         : 'prophet'
    , 'BELLMAN'         : 'bellman'
    , 'HERALD'          : 'herald'
    , 'DIVINER'         : 'diviner'
    , 'ORACLE'          : 'oracle'

    , 'CARPENTER'       : 'carpenter'
    , 'MASON'           : 'mason'

    , 'PALADIN'         : 'paladin'
    , 'COLLIER'         : 'collier'

    , 'STRIKER'         : 'striker'
    , 'CARDINAL'        : 'cardinal'
    , 'BLACKSMITH'      : 'blacksmith'
    , 'BISHOP'          : 'bishop'

    , 'PROSPECTOR'      : 'prospector'

    , 'ARCHER'          : 'archer'
    , 'RANGER'          : 'ranger'
    , 'HOUND'           : 'hound'

    , 'CROSSBOWMAN'     : 'crossbowman'
    , 'PIKEMAN'         : 'pikeman'

    , 'WATCHMAN'        : 'watchman'
    , 'DEACON'          : 'deacon'
    , 'KNIGHT'          : 'knight'

    , 'LANCER1'         : 'lancer1'
    , 'LANCER2'         : 'lancer2'
    , 'LANCER3'         : 'lancer3'
    , 'LANCER4'         : 'lancer4'
    , 'LANCER5'         : 'lancer5'

    , 'SAPPER'          : 'sapper'

    , 'SWORDSMAN'       : 'swordsman'
    , 'PRIEST'          : 'priest'
    , 'CLERIC'          : 'cleric'

    // Seasonal
    , 'ENGINEER'        : 'engineer'
};

const roleGroups = {
    'EVACUATE': {
        [roles.PEON]: true
        , [roles.ROOK]: true
        , [roles.LLAMA]: true

        , [roles.PEASANT]: true

        // To rebuild rooms after a nuke attack.
        , [roles.CARPENTER]: true
        , [roles.MASON]: true

        // Very early level criers may want to bail out.
        , [roles.CRIER]: true

        , [roles.OX]: true

        , [roles.HORSE]: true
        , [roles.MULE]: true
    }
    , 'TEMPLE_UPGRADE_CONTROLLER': [
        roles.DIVINER
        , roles.ORACLE
    ]
    , 'UPGRADE_CONTROLLER': [
        roles.CRIER
        , roles.PROPHET
        , roles.BELLMAN
        , roles.HERALD
        , roles.DIVINER
        , roles.ORACLE
        , roles.GNOME
    ]
    , 'GENERAL_UPGRADE_CONTROLLER': [
        roles.CRIER
        , roles.PROPHET
        , roles.BELLMAN
        , roles.HERALD
        , roles.DIVINER
        , roles.ORACLE
        , roles.GNOME

        // Include Peons in this classification.
        , roles.PEON
    ]
    , 'EXTRACT': [
        roles.MINER
        , roles.DREDGER
    ]
    , 'LANCER': [
        roles.LANCER1
        , roles.LANCER2
        , roles.LANCER3
        , roles.LANCER4
        , roles.LANCER5
    ]
    , 'CONSTRUCTOR': [
        roles.PEON
        , roles.CARPENTER
        , roles.MASON
    ]
    , 'BUILDER': [
        roles.CARPENTER
        , roles.MASON
    ]
    , 'POWERWORKER': [
        roles.STRIKER
        , roles.BLACKSMITH
    ]
    , 'DISMANTLER': [
        roles.COLLIER
        , roles.SAPPER
    ]
    , 'GUARDIAN': [
        roles.WATCHMAN
        , roles.KNIGHT
        , roles.DEACON
        , roles.PRIEST
    ]
    , 'DEFENDER': [
        roles.ARCHER
        , roles.RANGER
        , roles.HOUND
    ]
    , 'COMBAT': {
        [roles.ARCHER]: true
        , [roles.RANGER]: true
        , [roles.HOUND]: true

        , [roles.CROSSBOWMAN]: true
        , [roles.PIKEMAN]: true

        , [roles.WATCHMAN]: true
        , [roles.DEACON]: true
        , [roles.KNIGHT]: true

        , [roles.LANCER1]: true
        , [roles.LANCER2]: true
        , [roles.LANCER3]: true
        , [roles.LANCER4]: true
        , [roles.LANCER5]: true

        , [roles.SAPPER]: true
    }
}

const tasks = {
    'BOOTSTRAP'                     : 'BOOTSTRAP'

    , 'RECYCLE'                     : 'RECYCLE'
    , 'RECYCLE_STOP'                : 'RECYCLE_STOP'
    , 'RECYCLE_WORKER'              : 'RECYCLE_WORKER'
    , 'RECYCLE_UNBOOSTED'           : 'RECYCLE_UNBOOSTED'
    , 'RENEW'                       : 'RENEW'
    , 'RENEW2'                      : 'RENEW2'
    , 'RENEW_TOPOFF'                : 'RENEW_TOPOFF'

    , 'CLEAR_WORKROOM'              : 'CLEAR_WORKROOM'
    , 'CLEAR_FOCUS'                 : 'CLEAR_FOCUS'
    , 'UPDATE_WORKROOM_OX'          : 'UPDATE_WORKROOM_OX'
    , 'UPDATE_WORKROOM_ROGUE'       : 'UPDATE_WORKROOM_ROGUE'
    , 'UPDATE_WORKROOM_BUILDER'     : 'UPDATE_WORKROOM_BUILDER'

    , 'MOVE_TO_SPAWNROOM'               : 'MOVE_TO_SPAWNROOM'
    , 'MOVE_TO_WORKROOM'                : 'MOVE_TO_WORKROOM'
    , 'MOVE_TO_WORKROOM_CACHED'         : 'MOVE_TO_WORKROOM_CACHED'
    , 'MOVE_TO_WORKROOM_NOTEMPTY'       : 'MOVE_TO_WORKROOM_NOTEMPTY'
    , 'MOVE_TO_WORKROOM_ROGUE'          : 'MOVE_TO_WORKROOM_ROGUE'
    , 'MOVE_TO_ASSIGNEDROOM'            : 'MOVE_TO_ASSIGNEDROOM'
    , 'MOVE_TO_ASSIGNEDROOM_NOTEMPTY'   : 'MOVE_TO_ASSIGNEDROOM_NOTEMPTY'
    , 'MOVE_TO_ASSIGNEDROOM_CACHED'     : 'MOVE_TO_ASSIGNEDROOM_CACHED'

    , 'BUNKER'                          : 'BUNKER'
    , 'PULL'                            : 'PULL'
    , 'CLAIM'                           : 'CLAIM'
    , 'PORTAL'                          : 'PORTAL'

    , 'WAIT_POWERBANK_DESTROYED'            : 'WAIT_POWERBANK_DESTROYED'
    , 'GATHER_MOST_VALUABLE'                : 'GATHER_MOST_VALUABLE'
    , 'GATHER_ENERGY'                       : 'GATHER_ENERGY'
    , 'FORAGE'                              : 'FORAGE'
    , 'PLUNDER'                             : 'PLUNDER'
    , 'PLUNDER2'                            : 'PLUNDER2'
    , 'PLUNDER_ROOK'                        : 'PLUNDER_ROOK'
    , 'PLUNDER_NOTEMPTY'                    : 'PLUNDER_NOTEMPTY'
    , 'PLUNDER_NOTFULL'                     : 'PLUNDER_NOTFULL'
    , 'PICKUP_RESOURCE'                     : 'PICKUP_RESOURCE'

    , 'WITHDRAW_PROSPECTOR'                 : 'WITHDRAW_PROSPECTOR'
    , 'WITHDRAW_PROSPECTOR_HALT'            : 'WITHDRAW_PROSPECTOR_HALT'
    , 'WITHDRAW_DREDGER'                    : 'WITHDRAW_DREDGER' // Not used.
    , 'WITHDRAW_DREDGER_HALT'               : 'WITHDRAW_DREDGER_HALT'

    , 'WITHDRAW_CONTAINER_SOURCE'           : 'WITHDRAW_CONTAINER_SOURCE'
    , 'WITHDRAW_CONTAINER_OX'               : 'WITHDRAW_CONTAINER_OX'
    , 'WITHDRAW_CONTAINER_PEON'             : 'WITHDRAW_CONTAINER_PEON'

    , 'WITHDRAW_ALWAYS'                     : 'WITHDRAW_ALWAYS'
    , 'WITHDRAW_PEON'                       : 'WITHDRAW_PEON'
    , 'WITHDRAW_ROOK'                       : 'WITHDRAW_ROOK'
    , 'WITHDRAW_LLAMA'                      : 'WITHDRAW_LLAMA'
    , 'WITHDRAW_PAGE'                       : 'WITHDRAW_PAGE'
    , 'WITHDRAW_GHODIUM'                    : 'WITHDRAW_GHODIUM'

    , 'DEPOSIT'                             : 'DEPOSIT'
    , 'HARVEST_PEON'                        : 'HARVEST_PEON'
    , 'HARVEST_PEASANT'                     : 'HARVEST_PEASANT'
    , 'HARVEST_FARMER'                      : 'HARVEST_FARMER'

    , 'TRANSFER_SPAWN'                      : 'TRANSFER_SPAWN'
    , 'TRANSFER_SPAWN_ROOK'                 : 'TRANSFER_SPAWN_ROOK'
    , 'TRANSFER_TOWER'                      : 'TRANSFER_TOWER'
    , 'TRANSFER_LAB'                        : 'TRANSFER_LAB'
    , 'TRANSFER_POWERSPAWN'                 : 'TRANSFER_POWERSPAWN'
    , 'TRANSFER_COLONY_CONTAINER'           : 'TRANSFER_COLONY_CONTAINER'
    , 'TRANSFER_CONTROLLER_CONTAINER'       : 'TRANSFER_CONTROLLER_CONTAINER'
    , 'TRANSFER_CONTROLLER_CONTAINER_PAGE'  : 'TRANSFER_CONTROLLER_CONTAINER_PAGE'
    , 'TRANSFER_DROPOFF'                    : 'TRANSFER_DROPOFF'
    , 'TRANSFER_DROPOFF_PEON'               : 'TRANSFER_DROPOFF_PEON'
    , 'TRANSFER_DROPOFF_ROOK'               : 'TRANSFER_DROPOFF_ROOK'
    , 'TRANSFER_FOCUS_TRANSPORTER'          : 'TRANSFER_FOCUS_TRANSPORTER'
    , 'TRANSFER_DROP'                       : 'TRANSFER_DROP'

    , 'REPAIR'                              : 'REPAIR'
    , 'REPAIR_WALL_PEON'                    : 'REPAIR_WALL_PEON'
    , 'REPAIR_WALL_MAX'                     : 'REPAIR_WALL_MAX'
    , 'REPAIR_WALL_ALWAYS'                  : 'REPAIR_WALL_ALWAYS'
    , 'BUILD'                               : 'BUILD'
    , 'BUILD2'                              : 'BUILD2'
    , 'CREATE_SOURCE_TRAIL'                 : 'CREATE_SOURCE_TRAIL'

    , 'UPGRADE'                             : 'UPGRADE'
    , 'UPGRADE_ALWAYS'                      : 'UPGRADE_ALWAYS'
    , 'UPGRADE_OX'                          : 'UPGRADE_OX'
    , 'UPGRADE_CRIER'                       : 'UPGRADE_CRIER'
    , 'UPGRADE_PROPHET'                     : 'UPGRADE_PROPHET'
    , 'UPGRADE_TEMPLE'                     : 'UPGRADE_TEMPLE'

    , 'BOOST'                               : 'BOOST'
    , 'UNBOOST'                             : 'UNBOOST'
    , 'UNBOOST_WORKER'                      : 'UNBOOST_WORKER'
    , 'UNBOOST_PROPHET'                     : 'UNBOOST_PROPHET'
    , 'UNBOOST_TRANSPORTER'                 : 'UNBOOST_TRANSPORTER'

    , 'LABWORK'                             : 'LABWORK'
    , 'ATTACK'                              : 'ATTACK'
    , 'GENERATE_SAFE_MODE'                  : 'GENERATE_SAFE_MODE'

    , 'EXTRACT_CHECK'                       : 'EXTRACT_CHECK'
    , 'EXTRACT_REMOTEROOM'                  : 'EXTRACT_REMOTEROOM'
    , 'EXTRACT_MYROOM'                      : 'EXTRACT_MYROOM'

    , 'DELIVER'                             : 'DELIVER'

    , 'STOMP_HOSTILE_CONSTRUCTION_SITES'    : 'STOMP_HOSTILE_CONSTRUCTION_SITES'
    , 'VISIT_CONTROLLER'                    : 'VISIT_CONTROLLER'
    , 'BLOCK_CONTROLLER'                    : 'BLOCK_CONTROLLER'
    , 'IDLE'                                : 'IDLE'
    , 'SUICIDE'                             : 'SUICIDE'
    , 'SUICIDE_MINER'                       : 'SUICIDE_MINER'
    , 'SUICIDE_UPGRADER'                    : 'SUICIDE_UPGRADER'
    , 'SUICIDE_BURRO'                       : 'SUICIDE_BURRO'
    , 'SUICIDE_DONKEY'                      : 'SUICIDE_DONKEY'
    , 'SUICIDE_HORSE'                       : 'SUICIDE_HORSE'
    , 'SUICIDE_RESERVEDROOM'                : 'SUICIDE_RESERVEDROOM'

    , 'DISMANTLE'                           : 'DISMANTLE'
    , 'ATTACK_POWERBANK'                    : 'ATTACK_POWERBANK'
    , 'HEAL_POWERBANK'                      : 'HEAL_POWERBANK'
    , 'ATTACK_SOURCEKEEPER'                 : 'ATTACK_SOURCEKEEPER'
    , 'ATTACK_INVADERSTRUCTURES'            : 'ATTACK_INVADERSTRUCTURES'
    , 'ATTACK_STRONGHOLD'                   : 'ATTACK_STRONGHOLD'

    , 'COMBAT'                              : 'COMBAT'

    // Seasonal.
    , 'WITHDRAW_THORIUM'                    : 'WITHDRAW_THORIUM'
    , 'CLAIM_REACTOR'                       : 'CLAIM_REACTOR'
    , 'TRANSFER_REACTOR'                    : 'TRANSFER_REACTOR'
};

const params = {
    // Visuals.
      'DISPLAY_TICKS'               : 10
    , 'VISUALS_TICKS'               : 100
    , 'VISUALS_CACHE_TICKS'         : 10
    , 'MOVING_AVERAGE_SAMPLE_SIZE'  : 100
    , 'MOVING_AVERAGE_REFRESH_TICKS': 100

    // Cartographer options.
    , 'CARTOGRAPHER_CACHE_RECENT_TICKS' : 10
    , 'CARTOGRAPHER_CACHE_MEMORY_TICKS' : 10000

    // How many CPU must be aquired for each farm source.
    , 'GAME_CPU_PER_FARM'           : 40
    , 'CPU_PER_COLONY'              : 10
    , 'CPU_PER_COLONY_MAX_RATIO'    : 2

    , 'CPU_MAX'                     : 10000 // Is this not a constant somewhere?
    , 'CPU_MAX_BUFFER'              : 9900  // Every task runs above this number, including cache refreshes.
    , 'CPU_NEARMAX_ABSOLUTE'        : 9700  // Near max amount. Allow for some spikes for reserving rooms or colony builds.
    , 'CPU_NORMAL_ABSOLUTE'         : 9600  // Goldilocks zone
    , 'CPU_PROCESSPOWER_ABSOLUTE'   : 9500  // Power processing which keeps Kings busy. Stop when CPU is in trouble.
    , 'CPU_FARMING_ABSOLUTE'        : 4000  // Powerbanks and deposits
    , 'CPU_FOCUS_ABSOLUTE'          : 4000  // Low level rooms, and rooms with large build amounts, upgraders and builders.
    , 'CPU_SPAWN_ABSOLUTE'          : 4000  // Reserved workers and focus creeps like mules, donkeys, pages, critical peons.
    , 'CPU_RENEW_ABSOLUTE'          : 4000  // Oxen mostly.
    , 'CPU_SUPPORTING_ABSOLUTE'     : 3000  // Guards, pages, executioners.
    , 'CPU_DEFEND_ABSOLUTE'         : 1000
    , 'CPU_STOP_ABSOLUTE'           : 500
    , 'CPU_SHUTDOWN_ABSOLUTE'       : 100

    , 'CPU_DELTA_REFRESH_POSITIVE'  : 3
    , 'CPU_DELTA_REFRESH_NEGATIVE'  : -1

    , 'CPU_RESERVE_ROOM_COOLDOWN'           : 10
    , 'SET_RESERVED_ROOMS_MULTIPLIER'       : 50
    , 'SET_RESERVED_ROOMS_MOD'              : 3

    // Portal settings.

    // Nuke settings.
    , 'NUKER_SATURATION_COOLDOWN'   : NUKER_COOLDOWN - CREEP_LIFE_TIME

    // Reserved room logic.
    , 'CLAIM_ROOM_MAX_DISTANCE'                 : 13
    , 'CLAIM_ROOM_MAX_DEFEND'                   : 15
    , 'MAX_DEACONS_PER_DEFEND'                  : 4
    , 'MAX_DEACONS_PER_ASSAULT'                 : 4
    , 'MAX_WATCHMEN_PER_DEFEND'                 : 1
    , 'MAX_WATCHMEN_PER_ENEMY'                  : 8
    , 'MAX_KNIGHTS_PER_DEFEND'                  : 1
    , 'MAX_KNIGHTS_PER_ENEMY'                   : 1
    , 'MAX_PRIESTS_PER_DEFEND'                  : 1
    , 'MAX_PRIESTS_PER_ENEMY'                   : 2
    , 'MAX_CLERICS_PER_DEFEND'                  : 1
    , 'RESERVE_ROOM_DISTANCE'                   : 3
    , 'SET_RESERVED_ROOMS_TICKS'                : 300
    , 'RESERVE_PREACHER_LEVEL'                  : 4
    , 'DEFEND_EMPIRE_SPAWN_LEVEL'               : 5
    , 'OPERATE_SPAWN_BONUS_MULTIPLIER'          : 0.75
    , 'RESERVE_CREEP_ASSIST_PERCENT'            : 0.4  // How much spawn time in a room are we using for reserve creeps? This fights with kings/rooks/miners/peasents/etc.
    , 'RESERVE_CREEP_MAXLEVEL_PERCENT'          : 0.8  // How much spawn time in a room are we using for reserve creeps? This fights with kings/rooks/miners/peasents/etc.
    , 'CREEP_CPU_RESERVE_COST'                  : 0.45  // How much CPU per creep? Kinda general, about half-cpu per.
    , 'CONTROLLER_CONTAINER_UPGRADER_PERCENT'   : 0.90
    , 'SOURCE_TRAIL_COOLDOWN'                   : 1500
    , 'ROAD_REPAIR_TICKS'                       : 5    // Number of ticks spent repairing before reaching peak hit points.
    , 'MINERAL_TRAIL_TICKS'                     : 750  // Number of ticks before mineral is regenerated. Get a head start on building roads.
    , 'OX_CAPACITY_FUDGE_PERCENT'               : 0.65
    , 'OX_UPDATE_WORKROOM_MOD'                  : 10

    // Claim room logic.
    , 'CLAIM_ROOM_FACTOR_TYPE_SEASON'           : 0
    , 'CLAIM_ROOM_FACTOR_TYPE_CORE'             : 2
    , 'CLAIM_ROOM_FACTOR_TYPE_SK'               : 4
    , 'CLAIM_ROOM_FACTOR_TYPE_EQUATOR'          : 4
    , 'CLAIM_ROOM_FACTOR_TYPE_DUAL_HIGHWAY'     : 4
    , 'CLAIM_ROOM_FACTOR_TYPE_HIGHWAY'          : 6
    , 'CLAIM_ROOM_FACTOR_TYPE_RARE_MINERAL'     : 8
    , 'CLAIM_ROOM_FACTOR_TYPE_CONTROLLER'       : 10
    , 'CLAIM_ROOM_FACTOR_TYPE_UNCLAIMED_MINERAL': 12
    , 'CLAIM_ROOM_FACTOR_TYPE_POWERCREEP'       : 20
    , 'CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING'  : 100
    , 'CLAIM_ROOM_FACTOR_SECTOR_NOT_INTERESTING': 50
    , 'CLAIM_ROOM_FACTOR_SECTOR_AVOID'          : 1000
    , 'CLAIM_ROOM_FACTOR_SOURCE_COUNT'          : 30
    , 'CLAIM_ROOM_VISUALIZE_COUNT'              : 30

    // Signs
    , 'MY_SIGN_OWNED'                           : '🤴All heil Earwig, King of the North!'
    , 'MY_SIGN_RESERVED'                        : '⚠️Warning:🛡️this room is protected;⚔️trespassers will be shot,☠️survivors will be shot again.'
    , 'MY_SIGN_VISIT'                           : '🤴Lord Earwig has graced these lands.'
    , 'MY_SIGN_BURN'                            : '💥Burn them all and salt the Earth!'
    , 'SIGN_SCOUT_COOLDOWN'                     : 60000
    , 'SIGN_CACHE_TICKS'                        : 1500

    // Creep count maximums
    , 'MAX_PEONS_PER_WORKROOM'                  : 10
    , 'MAX_PALADIN_PER_WORKROOM'                : 3
    , 'MAX_COLLIER_PER_WORKROOM'                : 1
    , 'MAX_SAPPER_PER_WORKROOM'                 : 1
    , 'MAX_HORSES_PER_DISTANCE'                 : 15
    , 'MAX_HORSES_PER_WORKROOM'                 : 60
    , 'MAX_MULES_PER_WORKROOM'                  : 1
    , 'MAX_ROOKS_PER_WORKROOM'                  : 3
    , 'MAX_ARCHERS'                             : 1
    , 'MAX_ARCHERS_PER_ASSIGNEDROOM'            : 1
    , 'MAX_HOUNDS'                              : 1
    , 'MAX_HOUNDS_PER_ASSIGNEDROOM'             : 1
    , 'MAX_RANGERS'                             : 1
    , 'MAX_RANGERS_PER_ASSIGNEDROOM'            : 1
    , 'MAX_WATCHMEN_PER_WORKROOM'               : 3
    , 'MAX_WATCHMEN_PER_FOCUSROOM'              : 2
    , 'MAX_WATCHMEN_PER_TEMPLEROOM'             : 1
    , 'MAX_DEACONS_PER_FOCUS'                   : 1
    , 'MAX_PIKEMAN_PER_WORKROOM'                : 1
    , 'MAX_HOUND_PER_WORKROOM'                  : 3
    , 'MAX_CROSSBOWMAN_PER_WORKROOM'            : 2
    , 'MAX_BUILDERS_PER_WORKROOM'               : 50
    , 'MAX_BUILDERS_PER_TARGET_EARLY'           : 8
    , 'MAX_BUILDERS_PER_TARGET'                 : 4
    , 'MAX_BUILDERS_PER_TARGET_NEAR_COLONYFLAG' : 1
    , 'MAX_BUILDERS_PER_NUKE'                   : 2
    , 'MAX_SCAVENGER_PER_WORKROOM'              : 2

    // Peon options
    , 'REPAIR_WORKER_THRESHHOLD_PERCENT'        : 0.2   // For walls at level 8, this is just over 5 million, the nuke splash damage amount.
    , 'REPAIR_NONEMPIRE_THRESHHOLD_PERCENT'     : 0.02
    , 'MIN_WORKER_USABLE_TICKS'                 : 30
    , 'PEON_BUILD_MULTIPLIER'                   : 0.9
    , 'PEON_UPGRADE_MULTIPLIER'                 : 0.3

    , 'RENEW_TICKS'                             : 1300
    , 'RENEW_TICKS_SMALL_COUNCIL'               : 1400
    , 'RENEW_TICKS_ROOK'                        : 1000
    , 'RENEW_TICKS_POWERCREEP'                  : 500
    , 'RENEW_TICKS_POWERCREEP_MIN'              : 100
    , 'RENEW_TICKS_POWERCREEP_TRAVEL'           : 2500

    , 'CREEP_STOP_WITHDRAW_TICKS'               : 20
    , 'BUILDER_WORK_EFFICIENCY_PERCENT'         : 0.5

    // Colony build options
    , 'COLONY_SOURCE_CONTAINER_LEVEL'           : 2
    , 'COLONY_ROAD_LEVEL'                       : 0
    , 'COLONY_PERIMETER_LEVEL'                  : 4
    , 'EMPIRE_GCL_THRESHHOLD'                   : 10

    // Room options
    , 'CHURCH_LEVEL'                            : 3
    , 'CHURCH_ASSIST_DISTANCE'                  : 16
    , 'FOCUS_ASSIST_DISTANCE'                   : 8
    , 'FOCUS_ASSIST_HERALD_DISTANCE'            : 6
    , 'PAGE_OFFSET_NORMAL_PERCENT'              : 0.8
    , 'EMPIRE_CASTLE_ROOM_ASSISTANCE_COUNT'     : 3

    // Temple options
    , 'TEMPLE_PEONS'                            : 1
    , 'TEMPLE_PAGES'                            : 1
    , 'INITIAL_UPGRADER_TTL'                    : 500
    , 'TEMPLE_BOOSTED_UPGRADER_PERCENT'         : 0.05

    // Queen options
    , 'QUEEN_TOWER_ENERGY_TARGET'               : 850

    // Defend options
    , 'NUKE_IMMINENT_TICKS'                     : 75
    , 'NUKE_HALT_SPAWNING_TICKS'                : 200
    , 'NUKE_SPAWN_BUILDERS_TICKS'               : 750
    , 'LAST_HOSTILE_POS_TICKS'                  : 10
    , 'ATTACK_RETARGET_MOD'                     : 10
    , 'UPDATE_DESTROY_FLAG_TICKS'               : 1500
    , 'HOSTILE_DISENGAGE_RANGE'                 : 9
    , 'AUTOASSAULT_ROOM_DISTANCE'               : 4
    , 'AUTOASSAULT_LONG_RANGE_DISTANCE'         : 10
    , 'MAX_DEFEND_RANGE'                        : 4  // 6
    , 'MAX_SCREEP_RANGE'                        : 8  // Should correspond roughly to rogue range.
    , 'DEFEND_ROOM_FRIENDLY_MULTIPLIER'         : 0.75
    , 'MAX_WATCHMEN_DURING_SAFEMODE'            : 8

    // Attack settings
    , 'LAST_HOSTILE_ATTACK_TICKS'               : 1500
    , 'AUTOASSAULT_DESTROY_FLAG_HITS'           : NUKE_DAMAGE[0]
    , 'WATCHMEN_HOSTILE_MULTIPLIER'             : 3
    , 'HOSTILE_CLOSEBY_RANGE'                   : 8

    // Energy options.
    , 'ENERGY_MINIMAL_PERCENT'                  : 0.01
    , 'ENERGY_NORMAL_PERCENT'                   : 0.10
    , 'ENERGY_CONTROLLER_LINK_UPGRADE_PERCENT'  : 0.30
    , 'ENERGY_FARM_PERCENT'                     : 0.32
    , 'ENERGY_ABUNDANT_PERCENT'                 : 0.35
    , 'ENERGY_BATTERY_PERCENT'                  : 0.69
    , 'ENERGY_POWER_PERCENT'                    : 0.70 //0.80
    , 'ENERGY_DUMP_PERCENT'                     : 0.79 //0.89
    , 'ENERGY_TEMPLE_PERCENT'                   : 0.98 //0.87
    , 'STORAGE_STORE_MAX_PERCENT'               : 0.88 //0.98
    , 'STRUCTURE_STORE_MAX_PERCENT'             : 0.98
    , 'TERMINAL_SELL_ENERGY_PERCENT'            : 0.83

    // Colony options
    , 'BARRIER_HITS_MULTIPLIER'         : 400  // This magic number is part of the formula for scaling wall size up to max level 8. See google spreadsheet.
    , 'BARRIER_HITS_POW'                : 4
    , 'CREEP_FRIENDLY_FLEE_RANGE'       : 3
    , 'CREEP_IN_DANGER_RANGE'           : 8
    , 'SOURCE_LINK_RANGE'               : 2
    , 'KING_TOWER_TARGET'               : 850
    , 'MAX_SCOUT_RANGE'                 : 10

    // Empire options
    , 'GCL_GPL_RATIO'                   : 5

    // Powercreep options
    , 'POWERCREEP_OPERATE_EXTENSION_MIN'        : 0.1  // Level 1 is 20% refill. But use this liberally starting at 10%.
    , 'POWERCREEP_OPERATE_EXTENSION_MIN_LEVEL'  : 1
    , 'POWERCREEP_OPERATE_SPAWN_MIN_LEVEL'      : 3
    , 'POWERCREEP_OPERATE_STORAGE_MIN_LEVEL'    : 2
    , 'POWERCREEP_OPERATE_TERMINAL_MIN_LEVEL'   : 5
    , 'POWERCREEP_OPERATE_LAB_MIN_LEVEL'        : 2
    , 'POWERCREEP_OPERATE_POWER_MIN_LEVEL'      : 4
    , 'POWERCREEP_OPERATE_SOURCE_TICKS'         : 30
    , 'POWERCREEP_TICK_MOD'                     : 10

    // CPU settings.
    , 'CACHE_OBJECT_TICKS'              : 300
    , 'CACHE_ROOM_TICKS'                : 30000
    , 'SCOUT_ROOM_AGE_TICKS'            : 20000
    , 'OBSERVE_ROOM_AGE_TICKS'          : 21*21  // 441 ticks for one observer to scan range 10 rooms. (10 in all directions, plus 0,0 row/column)
    , 'OBSERVE_CORNER_ROOM_AGE_TICKS'   : 25     // Enough ticks to observe screep trains leaving the station.
    , 'ROOMINTEL_CACHE_TICKS'           : 20     // Extremely important number
    , 'ROOMINTEL_BARRIER_TICKS'         : 1500
    , 'CREATE_COLONY_TICK_MOD'          : 750
    , 'REMOVE_COLONY_TICK_MY'           : 6000
    , 'REMOVE_COLONY_TICK_OTHER'        : 3000
    , 'KING_TICK_MOD'                   : 2
    , 'KING_TICK_MOD_FACTORY'           : 4
    , 'QUEEN_TICK_MOD'                  : 3
    , 'SPAWN_TICK_MOD'                  : 20
    , 'TERMINAL_TICK_MOD'               : 20
    , 'FACTORY_TICK_MOD'                : 20
    , 'LAB_TICK_MOD'                    : 20
    , 'DEFENSE_TICK_MOD'                : 20
    , 'CREEP_NAP_TICKS'                 : 10
    , 'CREEP_NAP_LONG'                  : 20
    , 'UPDATE_CLAIM_ROOM_DATA_TICK_MOD' : 1500
    , 'CPU_PER_BUILDER_CREEP'           : 5
    , 'SMART_UPGRADE_TICK_MOD'          : 15

    // Highway settings.
    , 'HIGHWAY_DEFEND_RANGE'                : 8
    , 'HIGHWAY_DEFEND_RANGE_WORKERS'        : 3
    , 'HIGHWAY_DEFEND_RANGE_WORKERS_SOLO'   : 6

    // Mineral settings.
    , 'MAX_DREDGERS_PER_MINERAL'        : 8
    , 'MIN_DREDGER_ROOM_LEVEL'          : 7
    , 'MAX_DREDGER_RANGE'               : 7

    // Deposit settings.
    , 'MAX_DEPOSIT_RANGE'               : 4
    , 'MAX_PROSPECTORS_PER_DEPOSIT'     : 8
    , 'MIN_DEPOSIT_COOLDOWN'            : 5
    , 'MAX_DEPOSIT_COOLDOWN'            : 60
    , 'MAX_DONKEYS_PER_DEPOSIT'         : 2
    , 'MAX_DEACON_DEPOSIT_COOLDOWN'     : 20
    , 'MAX_WATCHMAN_DEPOSIT_COOLDOWN'   : 40
    , 'DEPOSIT_PERCENT_MARKUP'          : 100.0 // Markup percent should be at least double, otherwise waste of cpu.

    // PowerBank settings.
    , 'MAX_POWERBANK_RANGE'                     : 5
    , 'MAX_BLACKSMITH_NIPS'                     : 1
    , 'POWERBANK_DECAY_FUDGE'                   : 0.25
    , 'POWERBANK_TRANSPORT_TRIGGER'             : POWER_BANK_HITS * 0.8 // Sent out donkeys once some damage has bene done. Our pug might have been intercepted on way there.
    , 'POWERBANK_WORKER_MARKUP'                 : 1.5
    , 'POWERBANK_BLACKSMITH_MARKUP'             : 3
    , 'POWERBANK_RUSH_HITS'                     : 50000
    , 'POWERBANK_PREP_HITS'                     : 80000
    , 'BEST_POWERBANK_COUNT'                    : 2

    // Factory settings.
    , 'FACTORY_STORE_TARGET'                    : 1500

    // Storage options.
    , 'STORAGE_STORE_TARGET'                    : 10000

    // Terminal settings.
    , 'TERMINAL_STORE_TARGET_ENERGY_PERCENT'    : 1
    , 'TERMINAL_TARGET_ENERGY'                  : STORAGE_CAPACITY * (1 / 100)
    , 'TERMINAL_FUNGIBLE_TARGET'                : 9000  // TERMINAL_STORE_TARGET * 3
    , 'TERMINAL_MINERAL_SELL'                   : MINERAL_DENSITY[1] * 1.0  // 15000
    , 'TERMINAL_MINERAL_MAX'                    : MINERAL_DENSITY[1] * 1.1  // 16500
    , 'TERMINAL_THORIUM_TARGET'                 : MINERAL_DENSITY[3]        // 70000
    , 'TERMINAL_STORE_BALANCE_ENERGY_PERCENT'   : 3
    , 'TERMINAL_STORE_TARGET'                   : 3000  // Rook carry * 4 at max level
    , 'TERMINAL_STORE_MAX'                      : 6000  // TERMINAL_STORE_TARGET * 2
    , 'TERMINAL_STORE_SELL'                     : 9000  // Needs to be a bit more than max
    , 'TERMINAL_MIN_TRANSFER_AMOUNT'            : 800
    , 'TERMINAL_BUY_CRITICAL_MULTIPLIER'        : 3

    // Market settings.
    , 'MARKET_CHAIN_CREDIT_CUTOFF'      : 1000
    , 'MARKUP_ORDER_BUY_AMOUNT'         : 10
    , 'MARKUP_ORDER_BUY_MARKUP_PERCENT' : 0.20
    , 'MARKET_SELL_BAR_PERCENT'         : 20

    // Credit settings as a percent of credits for new room.
    , 'CREDIT_FOR_BUY_PERCENT'          : 1.9
    , 'CREDIT_FOR_NEW_ROOM_PERCENT'     : 2.0
    , 'CREDIT_FOR_TEMPLE_ROOM_PERCENT'  : 2.1
    , 'CREDIT_MAX_PERCENT'              : 5.0

    // Tower settings.
    , 'TOWER_REPAIR_CACHE_MOD'          : 3

    // Keeper lair settings.
    , 'FLEE_LAIR_TICKS'                 : 12
    , 'MAX_LANCERS_RANGE'               : 4

    // Rogue settings.
    , 'MAX_ROGUE_RANGE'                 : 9 // 3 // 14 //8

    // General unboosting.
    , 'UNBOOST_MIN_TTL'                 : 50

    , 'DUO_ROLES': {
        sword_and_board: [
            roles.KNIGHT
            , roles.PRIEST
        ]
        , sword_and_board_boosted: [
            roles.SWORDSMAN
            , roles.CLERIC
        ]
        // , nightswatch: [
        //     roles.WATCHMAN
        //     , roles.WATCHMAN
        // ]
    }

    , 'GROUP_ROLES': {
        sword_and_board_boosted: [
            roles.SWORDSMAN
            , roles.CLERIC
        ]

        , sword_and_board: [
            roles.KNIGHT
            , roles.PRIEST
        ]

        , nightswatch: [
            , roles.WATCHMAN
            , roles.WATCHMAN
        ]
        , seekers: [
            roles.KNIGHT
            , roles.PRIEST
        ]

        , sk: [
            roles.PRIEST
        ]
        , powerbank: [
            roles.BISHOP
            , roles.BLACKSMITH
            , roles.DEACON
        ]
    }

    , 'CREEP_ROLE_TASKS': {
        [roles.PREACHER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.PORTAL
            , tasks.VISIT_CONTROLLER
            , tasks.CLAIM
            , tasks.SUICIDE
        ]
        , [roles.CARPENTER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.GATHER_ENERGY
            , tasks.WITHDRAW_ALWAYS
            , tasks.UPDATE_WORKROOM_BUILDER
            , tasks.MOVE_TO_WORKROOM_NOTEMPTY
            , tasks.BUILD
            , tasks.REPAIR_WALL_ALWAYS
            , tasks.CLEAR_WORKROOM
        ]
        , [roles.MASON]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.GATHER_ENERGY
            , tasks.WITHDRAW_ALWAYS
            , tasks.UPDATE_WORKROOM_BUILDER
            , tasks.MOVE_TO_WORKROOM_NOTEMPTY
            , tasks.BUILD
            , tasks.REPAIR_WALL_ALWAYS
            , tasks.CLEAR_WORKROOM
            , tasks.UNBOOST_WORKER
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE_WORKER
        ]

        , [roles.CRIER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_CRIER
            , tasks.UPGRADE_ALWAYS
        ]
        , [roles.PROPHET]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_PROPHET
            , tasks.UNBOOST_PROPHET
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.BELLMAN]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_ALWAYS
            , tasks.SUICIDE_UPGRADER
        ]
        , [roles.HERALD]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_ALWAYS
            , tasks.SUICIDE_UPGRADER
        ]
        , [roles.DIVINER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_TEMPLE
            , tasks.MOVE_TO_SPAWNROOM
            , tasks.TRANSFER_DROPOFF
            , tasks.RECYCLE
        ]
        , [roles.ORACLE]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_TEMPLE
            , tasks.MOVE_TO_SPAWNROOM
            , tasks.TRANSFER_DROPOFF
            , tasks.UNBOOST
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        , [roles.SCOUT]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.STOMP_HOSTILE_CONSTRUCTION_SITES
            , tasks.IDLE
        ]
        , [roles.CLERK]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.WITHDRAW_GHODIUM
            , tasks.GENERATE_SAFE_MODE
            , tasks.RECYCLE
        ]
        , [roles.GNOME]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.UPGRADE_ALWAYS
        ]
        , [roles.FENCER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.VISIT_CONTROLLER
            , tasks.BLOCK_CONTROLLER
        ]
        , [roles.LLAMA]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.WITHDRAW_CONTAINER_SOURCE
            , tasks.GATHER_MOST_VALUABLE
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.DELIVER
            , tasks.TRANSFER_TOWER
            , tasks.TRANSFER_SPAWN
            , tasks.TRANSFER_COLONY_CONTAINER
            , tasks.TRANSFER_CONTROLLER_CONTAINER
            , tasks.TRANSFER_DROPOFF
        ]
        , [roles.BURRO]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.WAIT_POWERBANK_DESTROYED
            , tasks.PLUNDER_NOTEMPTY
            , tasks.MOVE_TO_ASSIGNEDROOM_NOTEMPTY
            , tasks.DELIVER
            , tasks.TRANSFER_DROPOFF
            , tasks.SUICIDE_BURRO
        ]
        , [roles.DONKEY]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.WITHDRAW_PROSPECTOR
            , tasks.PLUNDER
            , tasks.WITHDRAW_PROSPECTOR_HALT
            , tasks.PLUNDER2
            , tasks.MOVE_TO_ASSIGNEDROOM_NOTEMPTY
            , tasks.DELIVER
            , tasks.TRANSFER_DROPOFF
            , tasks.SUICIDE_DONKEY
            , tasks.RENEW
        ]
        , [roles.HORSE]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.RENEW
            , tasks.WITHDRAW_ALWAYS
            , tasks.MOVE_TO_WORKROOM_NOTEMPTY
            , tasks.TRANSFER_DROPOFF
            , tasks.TRANSFER_FOCUS_TRANSPORTER
            , tasks.SUICIDE_HORSE
        ]
        , [roles.MULE]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.UNBOOST_TRANSPORTER
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE_UNBOOSTED
            , tasks.WITHDRAW_ALWAYS
            , tasks.MOVE_TO_WORKROOM_NOTEMPTY
            , tasks.TRANSFER_DROPOFF
            , tasks.TRANSFER_FOCUS_TRANSPORTER
            , tasks.TRANSFER_DROP
        ]
        , [roles.FARMER]: [
            tasks.BOOTSTRAP
            , tasks.BUNKER
            , tasks.MOVE_TO_WORKROOM
            , tasks.CREATE_SOURCE_TRAIL
            , tasks.HARVEST_FARMER
        ]
        , [roles.OX]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM_CACHED
            , tasks.CREATE_SOURCE_TRAIL
            , tasks.WITHDRAW_CONTAINER_OX
            , tasks.BUILD
            , tasks.CLEAR_WORKROOM
            , tasks.MOVE_TO_ASSIGNEDROOM_CACHED
            , tasks.CLEAR_FOCUS
            , tasks.DELIVER
            , tasks.TRANSFER_COLONY_CONTAINER
            , tasks.TRANSFER_SPAWN
            , tasks.TRANSFER_CONTROLLER_CONTAINER
            , tasks.TRANSFER_DROPOFF
            , tasks.BUILD2
            , tasks.UPGRADE_OX
            , tasks.TRANSFER_FOCUS_TRANSPORTER
            , tasks.RECYCLE_STOP
            , tasks.UPDATE_WORKROOM_OX
            , tasks.RENEW_TOPOFF
        ]
        , [roles.SCAVENGER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.PLUNDER_NOTEMPTY
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.DELIVER
            , tasks.TRANSFER_CONTROLLER_CONTAINER
            , tasks.TRANSFER_DROPOFF
            , tasks.SUICIDE_RESERVEDROOM
            , tasks.BUNKER
            , tasks.RENEW_TOPOFF
        ]
        , [roles.ROGUE]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM_ROGUE
            , tasks.PLUNDER
            , tasks.CLEAR_WORKROOM
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.DELIVER
            , tasks.TRANSFER_CONTROLLER_CONTAINER
            , tasks.TRANSFER_DROPOFF
            , tasks.UPDATE_WORKROOM_ROGUE
            , tasks.RENEW_TOPOFF
        ]
        , [roles.PEON]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.PORTAL
            , tasks.RECYCLE_STOP
            , tasks.FORAGE
            , tasks.DELIVER
            , tasks.WITHDRAW_CONTAINER_PEON
            , tasks.WITHDRAW_PEON
            , tasks.HARVEST_PEON
            , tasks.TRANSFER_TOWER
            , tasks.TRANSFER_SPAWN
            , tasks.BUILD
            , tasks.REPAIR
            , tasks.REPAIR_WALL_PEON
            , tasks.UPGRADE
            , tasks.REPAIR_WALL_MAX
            , tasks.UPGRADE_ALWAYS
            , tasks.TRANSFER_DROPOFF_PEON
            , tasks.REPAIR_WALL_ALWAYS
        ]
        , [roles.ROOK]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.RENEW
            , tasks.LABWORK
            , tasks.PLUNDER_ROOK
            , tasks.DELIVER
            , tasks.WITHDRAW_ROOK
            , tasks.TRANSFER_LAB
            , tasks.TRANSFER_TOWER
            , tasks.TRANSFER_SPAWN_ROOK
            , tasks.TRANSFER_DROPOFF_ROOK
        ]
        , [roles.PAGE]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.GATHER_ENERGY
            , tasks.WITHDRAW_PAGE
            , tasks.TRANSFER_CONTROLLER_CONTAINER_PAGE
            , tasks.SUICIDE_UPGRADER
        ]
        , [roles.PEASANT]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.HARVEST_PEASANT
        ]
        , [roles.MINER]: [
            tasks.BOOTSTRAP
            , tasks.DELIVER
            , tasks.EXTRACT_CHECK
            , tasks.MOVE_TO_WORKROOM
            , tasks.EXTRACT_MYROOM
            , tasks.MOVE_TO_ASSIGNEDROOM
        ]
        , [roles.DREDGER]: [
            tasks.BOOTSTRAP
            , tasks.DELIVER
            , tasks.EXTRACT_CHECK
            , tasks.RENEW
            , tasks.BUNKER
            , tasks.RENEW2
            , tasks.MOVE_TO_WORKROOM
            , tasks.EXTRACT_REMOTEROOM
            , tasks.MOVE_TO_ASSIGNEDROOM
        ]
        , [roles.JACKASS]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.WITHDRAW_DREDGER_HALT
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.DELIVER
            , tasks.TRANSFER_DROPOFF
            , tasks.EXTRACT_CHECK
            , tasks.RENEW
            , tasks.BUNKER
            , tasks.RENEW2
        ]
        , [roles.PROSPECTOR]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.DEPOSIT
            , tasks.BUNKER
        ]

        , [roles.STRIKER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_POWERBANK
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.RECYCLE
        ]
        , [roles.CARDINAL]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.HEAL_POWERBANK
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.RECYCLE
        ]

        , [roles.BLACKSMITH]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_POWERBANK
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.BISHOP]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.MOVE_TO_WORKROOM
            , tasks.HEAL_POWERBANK
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        , [roles.PALADIN]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_INVADERSTRUCTURES
            , tasks.MOVE_TO_ASSIGNEDROOM
            , tasks.RECYCLE
        ]
        , [roles.EXECUTIONER]: [
            tasks.BOOTSTRAP
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_SOURCEKEEPER
        ]
        , [roles.COLLIER]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]

        // Generic combat roles.
        , [roles.PIKEMAN]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.HOUND]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]

        , [roles.ARCHER]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]
        , [roles.RANGER]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.CROSSBOWMAN]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        , [roles.KNIGHT]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]
        , [roles.WATCHMAN]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]
        , [roles.DEACON]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        , [roles.SWORDSMAN]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.CLERIC]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        , [roles.LANCER1]: [
            tasks.BOOTSTRAP
            , tasks.RENEW
            , tasks.BOOST

            //, tasks.COMBAT
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_STRONGHOLD
            , tasks.MOVE_TO_ASSIGNEDROOM

            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.LANCER2]: [
            tasks.BOOTSTRAP
            , tasks.RENEW
            , tasks.BOOST

            //, tasks.COMBAT
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_STRONGHOLD
            , tasks.MOVE_TO_ASSIGNEDROOM

            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.LANCER3]: [
            tasks.BOOTSTRAP
            , tasks.RENEW
            , tasks.BOOST

            //, tasks.COMBAT
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_STRONGHOLD
            , tasks.MOVE_TO_ASSIGNEDROOM

            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.LANCER4]: [
            tasks.BOOTSTRAP
            , tasks.RENEW
            , tasks.BOOST

            //, tasks.COMBAT
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_STRONGHOLD
            , tasks.MOVE_TO_ASSIGNEDROOM

            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
        , [roles.LANCER5]: [
            tasks.BOOTSTRAP
            , tasks.RENEW
            , tasks.BOOST

            //, tasks.COMBAT
            , tasks.MOVE_TO_WORKROOM
            , tasks.ATTACK_STRONGHOLD
            , tasks.MOVE_TO_ASSIGNEDROOM

            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]

        // Seasonal
        , [roles.ENGINEER]: [
            tasks.BOOTSTRAP
            , tasks.WITHDRAW_THORIUM
            , tasks.MOVE_TO_WORKROOM_NOTEMPTY
            , tasks.CLAIM_REACTOR
            , tasks.TRANSFER_REACTOR
            , tasks.SUICIDE
        ]

        , [roles.PRIEST]: [
            tasks.BOOTSTRAP
            , tasks.COMBAT
        ]

        , [roles.SAPPER]: [
            tasks.BOOTSTRAP
            , tasks.BOOST
            , tasks.COMBAT
            , tasks.UNBOOST
            // Note that creeps needs carry to pickup/deliver.
            , tasks.PICKUP_RESOURCE
            , tasks.DELIVER
            , tasks.RECYCLE
        ]
    }

    , 'CREEP_ROLE_BOOSTS' : {
        [roles.PROPHET]: [
            C.BOOST_UPGRADECONTROLLER
        ]
        , [roles.HERALD]: [
            C.BOOST_FATIGUE
            , C.BOOST_UPGRADECONTROLLER
            , C.BOOST_CAPACITY
        ]
        , [roles.ORACLE]: [
            C.BOOST_UPGRADECONTROLLER
        ]
        , [roles.MASON]: [
            C.BOOST_CONSTRUCTION
            , C.BOOST_CAPACITY
        ]
        , [roles.PIKEMAN]: [
            C.BOOST_REDUCEDAMAGE
            , C.BOOST_ATTACK
            , C.BOOST_FATIGUE
        ]
        , [roles.CROSSBOWMAN]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.RANGER]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]

        , [roles.LANCER1]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.LANCER2]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.LANCER3]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.LANCER4]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.LANCER5]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]

        , [roles.SAPPER]: [
            C.BOOST_FATIGUE
            , C.BOOST_DISMANTLE
        ]
        , [roles.BLACKSMITH]: [
            C.BOOST_REDUCEDAMAGE
            , C.BOOST_ATTACK
        ]
        , [roles.BISHOP]: [
            C.BOOST_HEAL
        ]
        , [roles.MULE]: [
            C.BOOST_FATIGUE
            , C.BOOST_CAPACITY
        ]
        , [roles.DEACON]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_RANGEDATTACK
            , C.BOOST_HEAL
        ]
        , [roles.SWORDSMAN]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_ATTACK
        ]
        , [roles.CLERIC]: [
            C.BOOST_FATIGUE
            , C.BOOST_REDUCEDAMAGE
            , C.BOOST_HEAL
            , C.BOOST_RANGEDATTACK
        ]
    }

    // The array of GPL and the operations to perform.
    // These are based around creating our f1-f5 factories in the most optimal order.
    // After these 6 are created and completed, then powercreeps are created in a repeating fashion.
    , 'POWERCREEP_GPL' : [

        // Create f1 powercreep
          { name:'f1', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }          // 1
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 2
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 3
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 4

        // Create f2 powercreep
        , { name:'f2', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }          // 5
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 6
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 7
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 8
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 9

        // Create f3 powercreep
        , { name:'f3', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }          // 10
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 11
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 12
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 13
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 14
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 15
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 16
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 17
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 18
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 19

        // Create f4 powercreep
        , { name:'f4', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }          // 20
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 21
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 22
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 23
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 24
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 25
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 26
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 27
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 28
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 29
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 30
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 31
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 32
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 33
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 34
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 35
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 36
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 37
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 38
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 39
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 40
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 41
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 42
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 43
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 44
        , { name:'f4', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 45

        // Create f5 powercreep
        , { name:'f5', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }          // 46
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 47
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 48
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 49
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 50
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 51
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 52
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 53
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 54
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 55
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 56
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 57
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 58
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 59
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 60
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 61
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 62
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 63
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 64
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 65
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 66
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 67
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 68
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_FACTORY }          // 69
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 70
        , { name:'f5', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 71

        // Create golddigger powercreep
        , { name:'g', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }           // 72
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }              // 73
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }         // 74
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }              // 75
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }               // 76
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }               // 77
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }             // 78
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }             // 79
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }              // 80
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }               // 81
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }             // 82
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }              // 83
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }              // 84
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }              // 85
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }             // 86
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }              // 87
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }              // 88
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }               // 89
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }             // 90
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }             // 91
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }             // 92
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }             // 93
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }         // 94
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }              // 95
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }              // 96
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }             // 97

        // Complete f3 powercreep
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 98
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 99
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 100
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 101
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 102
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 103
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 104
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 105
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 106
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 107
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 108
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 109
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 110
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 111
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 112
        , { name:'f3', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 113

        // Complete f1 powercreep
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 114
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 115
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 116
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_STORAGE }          // 117
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 118
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 119
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_STORAGE }          // 120
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 121
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 122
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 123
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 124
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 125
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 126
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 127
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 128
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_TERMINAL }         // 129
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_TERMINAL }         // 130
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_TERMINAL }         // 131
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_TERMINAL }         // 132
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_TERMINAL }         // 133
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 134
        , { name:'f1', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 135

        // Complete f2 powercreep
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }        // 136
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 137
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 138
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 139
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 140
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 141
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 142
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 143
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 144
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 145
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 146
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 147
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }              // 148
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 149
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 150
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 151
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 152
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }            // 153
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }             // 154
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }             // 155
        , { name:'f2', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }            // 156

    ]

    // The array of GPL and the operations to perform.
    // These are based around creating our f1-f5 factories in the most optimal order.
    // After these 6 are created and completed, then powercreeps are created in a repeating fashion.
    , 'GOLDDIGGER_GPL' : [
        // Create golddigger powercreep
          { name:'g', shard:'shard2', action: 'create', arg: POWER_CLASS.OPERATOR }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_LAB }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_SPAWN }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_OPERATE_EXTENSION }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_GENERATE_OPS }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_SOURCE }
        , { name:'g', shard:'shard2', action: 'upgrade', arg: PWR_REGEN_MINERAL }
    ]

};

module.exports = {
    params
    , roles
    , roleGroups
    , tasks
}

