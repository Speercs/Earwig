"use strict";

let _roomStatus = {};

/**
 * See updateRoomMemory()
 */
class RoomIntel {

    constructor() {
        this._users = {
            [utils.getUsername()]: 1
            , 'Invader': 1
        }

        // Create memory objects if needed.
        if (typeof Memory.powerbanks === "undefined") Memory.powerbanks = {};
        if (typeof Memory.strongholds === "undefined") Memory.strongholds = {};
        if (typeof Memory.deposits === "undefined") Memory.deposits = {};
    }

    /**
     * For our active sectors, update room status memory.
     * To keep performance down, we only scan one room at a time in each sector.
     * Do NOT need visibility to set room status.
     */
    updateRoomsStatus() {
        // We only care about the active sectors (for now) for local pathing purposes.
        let activeSectors = GameManager.activeSectors;

        // Update one room per sector each tick.
        activeSectors.forEach(sector => {
            let rooms = Cartographer.getSectorControllerRooms(sector);
            let index = Game.time % rooms.length;
            let roomName = rooms[index];
            this.setRoomStatus(roomName);
        })
    }

    getRoomStatus(roomName) {
        // If the room status is already cached (will have a visitTime at least), then return it.
        if (_roomStatus[roomName]) {
            // When there is no value default to 'normal'.
            return _roomStatus[roomName].status || 'normal';
        }

        // Set and return the room status.
        return this.setRoomStatus(roomName);
    }

    setRoomStatus(roomName) {
        // If a room in this sector has not been visited, then update its current memory.
        delete _roomStatus[roomName];

        if (!_roomStatus[roomName]) _roomStatus[roomName] = {}

        _roomStatus[roomName][C.MEMORY_KEY_VISITED_STATUS] = Game.time;

        _roomStatus[roomName].status = Game.map.getRoomStatus(roomName).status;
        // On private server getRoomStatus does not work. This is a temporary workaround for it.
        // try {
        //     _roomStatus[roomName].status = Game.map.getRoomStatus(roomName).status;
        // } catch (error) {
        //     _roomStatus[roomName].status = 'normal';
        // }

        // If we can't see this room (handled by updateRoomMemory), avoid novice rooms, as they mess up with pathfinding too much.
        if (!Game.rooms[roomName] && _roomStatus[roomName].status !== 'normal') {
            this.setAvoid(roomName, Game.time);
        }

        let status = _roomStatus[roomName].status;
        return status;
    }

    cleanupMemory() {
        // Cleanup memory of dead room status.
        for (let name in _roomStatus) {
            // visitTime gets set in traveler.
            if (!_roomStatus[name][C.MEMORY_KEY_VISITED_STATUS] || (_roomStatus[name][C.MEMORY_KEY_VISITED_STATUS] < (Game.time - Config.params.CACHE_ROOM_TICKS))) {
                if (!Game.rooms[name]) {
                    utils.verboseLog('♻️ Clearing outdated roomStatus memory: ' + name);
                    delete _roomStatus[name];
                }
            }
        }

        // Cleanup old powerbanks data;
        this.cleanPowerBankData();

        // Cleanup old stronghold data.
        this.cleanStrongholdData();

        // Cleanup old deposit data.
        this.cleanDepositData();
    }

    /**
     * Update the intel for all rooms.
     * This is expected to run every tick.
     */
    updateRoomIntel() {
        this.updateVisibleRooms();
        this.updateRoomsStatus();
    }

    /**
     * For every visible room, update its memory of details about the room.
     */
    updateVisibleRooms() {
        Object.keys(Game.rooms).forEach(roomName => {
            let room = Game.rooms[roomName];

            // Attributes for all rooms.
            room.updateRoomMemory();
        })
    }

    getVisited(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_VISITED]) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_VISITED]) : null;
    }
    setVisited(roomName) {
        let value = Game.time;
        if (value) {
            if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
            Memory.rooms[roomName][C.MEMORY_KEY_VISITED] = packTime(value);
        } else {
            if (Memory.rooms[roomName]) delete Memory.rooms[roomName][C.MEMORY_KEY_VISITED];
        }
    }

    getUnvisitedByScout(roomName) {
        return Memory.rooms[roomName] ? (((this.getVisited(roomName) || -Config.params.SCOUT_ROOM_AGE_TICKS) + Config.params.SCOUT_ROOM_AGE_TICKS) < Game.time) : null;
    }

    getMineralType(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_MINERALS]) ? Object.values(Memory.rooms[roomName][C.MEMORY_KEY_MINERALS])[0][C.MEMORY_KEY_MINERAL_TYPE] : null;
    }
    getMineralId(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_MINERALS]) ? Object.keys(Memory.rooms[roomName][C.MEMORY_KEY_MINERALS])[0] : null;
    }
    getMineralAmount(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_MINERALS]) ? Object.values(Memory.rooms[roomName][C.MEMORY_KEY_MINERALS])[0][C.MEMORY_KEY_MINERAL_AMOUNT] : null;
    }
    getMineralNips(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_MINERALS]) ? Object.values(Memory.rooms[roomName][C.MEMORY_KEY_MINERALS])[0][C.MEMORY_KEY_MINERAL_NIPS] : null;
    }
    setMineral(room) {
        // Highways do not have minerals, everyone else does however.
        if (!room.isHighwayRoom) {
            // Just looking at the mineral will set all memory variables.
            // We only care to do this on every tick if this is my room or a center room for remote harvesting.
            if (
                (typeof Memory.rooms[room.name][C.MEMORY_KEY_MINERALS] === "undefined")
                || room.my
                || room.isCenterRoom
            ) {
                let mineral = room.mineral;
            }
        }
    }

    // getThoriumId(roomName) {
    //     return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_THORIUM_ID] : null;
    // }
    // getThoriumAmount(roomName) {
    //     return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_THORIUM_AMOUNT] : null;
    // }
    // getThoriumDensity(roomName) {
    //     return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_THORIUM_DENSITY] : null;
    // }
    // getThoriumNips(roomName) {
    //     return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_THORIUM_NIPS] : null;
    // }
    // setThorium(room) {
    //     // Controller rooms have thorium, everyone else does however.
    //     if (room.controller) {
    //         // 1. Note that thorium.id will be recorded automatically by the calls to thorium property below.

    //         // 2. Thorium will disappear once it is depleated.
    //         if (room.thorium) {
    //             room.memory[C.MEMORY_KEY_THORIUM_AMOUNT] = Math.ceil(room.thorium.mineralAmount);
    //             room.memory[C.MEMORY_KEY_THORIUM_DENSITY] = room.thorium.density;
    //             room.memory[C.MEMORY_KEY_THORIUM_NIPS] = room.thorium.nips.length;
    //         }
    //         else {
    //             delete room.memory[C.MEMORY_KEY_THORIUM_AMOUNT];
    //             delete room.memory[C.MEMORY_KEY_THORIUM_DENSITY];
    //             delete room.memory[C.MEMORY_KEY_THORIUM_NIPS];
    //         }
    //     }
    // }

    getMy(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_MY] : null;
    }
    setMy(room) {
        let value = room.my ? 1 : 0;
        if (value) {
            room.memory[C.MEMORY_KEY_MY] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_MY];
        }
    }
    getMyManagement(roomName) {
        // Fastest way is to check if room is my, otherwise is it in our reserved room hash.
        return (Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_MY] : null) || Memory.reservedRooms[roomName];
    }
    getMyProperty(roomName) {
        return this.getMy(roomName) || this.getReservedByMe(roomName)
    }

    getLevel(roomName) {
        return (typeof Memory.rooms[roomName] !== "undefined") ? Memory.rooms[roomName][C.MEMORY_KEY_LEVEL] : null;
    }
    setLevel(room) {
        let value = room.controller ? room.controller.level : null;
        if (value) {
            room.memory[C.MEMORY_KEY_LEVEL] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_LEVEL];
        }
    }

    getOwner(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_OWNER] : null;
    }
    setOwner(room) {
        let value = room.owner;
        if (value) {
            room.memory[C.MEMORY_KEY_OWNER] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_OWNER];
        }
    }

    getHostileSafeMode(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_SAFE_MODE_EXPIRES_TIME] : null;
    }
    setHostileSafeMode(room) {
        let value = room.hostileSafeModeExpiresTime;
        if (value) {
            room.memory[C.MEMORY_KEY_HOSTILE_SAFE_MODE_EXPIRES_TIME] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILE_SAFE_MODE_EXPIRES_TIME];
        }
    }

    getSafeModeCooldownExpiresTime(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_SAFE_MODE_COOLDOWN_EXPIRES_TIME] : null;
    }
    setSafeModeCooldownExpiresTime(room) {
        let value = room ? room.safeModeCooldownExpiresTime : null;
        if (value) {
            room.memory[C.MEMORY_KEY_SAFE_MODE_COOLDOWN_EXPIRES_TIME] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_SAFE_MODE_COOLDOWN_EXPIRES_TIME];
        }
    }

    getReservedBy(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_RESERVED_BY] : null;
    }
    setReservedBy(room) {
        let value = room.reservedBy;
        if (value) {
            room.memory[C.MEMORY_KEY_RESERVED_BY] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_RESERVED_BY];
        }
    }
    getReservedByMe(roomName) {
        return this.getReservedBy(roomName) === utils.getUsername();
    }
    getReservedByOtherPlayer(roomName) {
        let reservedBy = this.getReservedBy(roomName);
        return (reservedBy && !this._users[reservedBy]) ? reservedBy : false;
    }

    // What is the point of filtering on Invader here? Is this a real scenerio?
    getOwnedByOtherPlayer(roomName) {
        let ownedBy = this.getOwner(roomName);
        return (ownedBy && !this._users[ownedBy]) ? ownedBy : false;
    }

    getOtherPlayerManagement(roomName) {
        return this.getOwnedByOtherPlayer(roomName) || this.getReservedByOtherPlayer(roomName);
    }

    getAllyManagement(roomName) {
        return PlayerManager.isAlly(this.getOtherPlayerManagement(roomName))
    }

    getHostileManagement(roomName) {
        return this.getOtherPlayerManagement(roomName) ? !PlayerManager.isAlly(this.getOtherPlayerManagement(roomName)) : false;
    }

    getHostileOwner(roomName) {
        // Note that I am an ally of myself.
        return this.getOwner(roomName) ? !PlayerManager.isAlly(this.getOwner(roomName)) : false;
    }

    getAvoid(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_AVOID] : null;
    }
    setAvoid(roomName, value) {
        if (value) {
            if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
            Memory.rooms[roomName][C.MEMORY_KEY_AVOID] = value;
        } else {
            if (Memory.rooms[roomName]) delete Memory.rooms[roomName][C.MEMORY_KEY_AVOID];
        }
    }

    getHighwayNoviceWallsExist(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HIGHWAY_NOVICE_WALLS_EXIST] : null;
    }
    setHighwayNoviceWallsExist(room) {
        // Not necessary to spam this.
        if ((room.heap.setHighwayNoviceWallsExist || Game.time) > Game.time) return;

        let value = room.noviceWallsExist ? 1 : null;
        if (value) {
            room.memory[C.MEMORY_KEY_HIGHWAY_NOVICE_WALLS_EXIST] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_HIGHWAY_NOVICE_WALLS_EXIST];
        }

        // Record the next desired scan time.
        room.heap.setHighwayNoviceWallsExist = value ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
    }

    getHasStructuresToDismantle(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_STRUCTURES_TO_DISMANTLE] : null;
    }
    setHasStructuresToDismantle(room) {
        // Not necessary to spam this.
        if ((room.heap.setHasStructuresToDismantle || Game.time) > Game.time) return;

        let value = room.hasStructuresToDismantle ? 1 : null;

        if (value) {
            room.memory[C.MEMORY_KEY_STRUCTURES_TO_DISMANTLE] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_STRUCTURES_TO_DISMANTLE];
        }

        // Record the next desired scan time.
        room.heap.setHasStructuresToDismantle = value ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
    }

    /**
     * Returns the amount of energy in storage + terminals.
     */
    getHostileEnergy(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_ENERGY] : null;
    }
    setHostileEnergy(room) {
        let roomName = room.name;

        if (room.ownedByOther) {
            let energy = 0;
            energy += room.storage ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0;
            energy += room.terminal ? room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) : 0;
            // Note we want to store zero values here.
            if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
            Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_ENERGY] = energy;
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILE_ENERGY];
        }
    }

    getLastHostileAttack(roomName) {
        return Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] && (Memory.rooms[roomName][C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] + Config.params.LAST_HOSTILE_ATTACK_TICKS >= Game.time) ? Memory.rooms[roomName][C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] : null;
    }
    setLastHostileAttack(room) {
        // Clear this setting if it has expired.
        if (room.memory[C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] && (room.memory[C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] + Config.params.LAST_HOSTILE_ATTACK_TICKS < Game.time)) delete room.memory[C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL];

        // Do not care about attacks in my rooms...for now.
        // And obviously only care about when we have creeps in the room.
        if (!room.my && room.myCreeps.length && this.getLethalRoom(room.name) && room.myWounded.length) {  // && room.hasEventAttack) {
            room.memory[C.MEMORY_KEY_LAST_HOSTILE_ATTACK_TTL] = Game.time;
        }
    }

    getHostileSpawnCount(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_SPAWN_COUNT] : null;
    }
    setHostileSpawnCount(room) {
        let value = null;

        if (room.ownedByOther) {
            // Note that hostile rooms could be decaying levels and have fewer usable towers than constructed.
            value = Math.min(CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level], room.hostileSpawns.length);
        }
        else if (this.getStrongholdInvaderCoreHitsByRoomName(room.name)) {
            // As long as the stronghold has hits, it can possibly spawn.
            value = 1;
        }

        // Note we want to store zero values here, but exclude nulls.
        if (_.isNumber(value)) {
            room.memory[C.MEMORY_KEY_HOSTILE_SPAWN_COUNT] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILE_SPAWN_COUNT];
        }
    }

    getHostileTowerCount(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_TOWER_COUNT] : null;
    }
    setHostileTowerCount(room) {
        // Default to null so that it isn't stored if not applicable.
        let value = null;
        if (room.ownedByOther) {
            // Note that hostile rooms could be decaying levels and have fewer usable towers than constructed.
            value = Math.min(CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level], room.hostileTowersWithEnergy.length);
        }
        else if (this.getStrongholdInvaderCoreHitsByRoomName(room.name)) {
            // How many towers does this stronghold have up?
            value = room.hostileTowersWithEnergy.length;
        }

        // Note we want to store zero values here, but exclude nulls.
        if (_.isNumber(value)) {
            room.memory[C.MEMORY_KEY_HOSTILE_TOWER_COUNT] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILE_TOWER_COUNT];
        }
    }

    getHostileLabCount(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_LAB_COUNT] : null;
    }
    setHostileLabCount(room) {
        let value = 0;
        if (room.ownedByOther) value = Math.min(CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level], room.hostileLabs.length);
        // Note we want to store zero values here.
        if (_.isNumber(value)) {
            room.memory[C.MEMORY_KEY_HOSTILE_LAB_COUNT] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILE_LAB_COUNT];
        }
    }

    hasDangerousStructures(roomName) {
        return this.getHostileSpawnCount(roomName) || this.getHostileTowerCount(roomName)
    }

    getHostileAttackPower(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_ATTACK_POWER]) ? Number(Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_ATTACK_POWER] || 0) : null;
    }

    getHostileRangedAttackPower(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_RANGED_ATTACK_POWER]) ? Number(Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_RANGED_ATTACK_POWER] || 0) : null;
    }

    getHostileHealPower(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_HEAL_POWER]) ? Number(Memory.rooms[roomName][C.MEMORY_KEY_HOSTILE_HEAL_POWER] || 0) : null;
    }

    getHostileDamagePower(roomName) {
        return this.getHostileAttackPower(roomName) + this.getHostileRangedAttackPower(roomName);
    }

    getHostileCombatPower(roomName) {
        return this.getHostileAttackPower(roomName) + this.getHostileRangedAttackPower(roomName) + this.getHostileHealPower(roomName);
    }

    getHostileIncomingRangedAttackPower(roomName) {
        return ((this.getHostileTowerCount(roomName) || 0) * TOWER_POWER_ATTACK) + (this.getHostileRangedAttackPower(roomName) || 0);
    }

    getHostileIncomingHealPower(roomName) {
        return ((this.getHostileTowerCount(roomName) || 0) * TOWER_POWER_HEAL) + (this.getHostileHealPower(roomName) || 0);
    }

    getDangerousRoom(roomName) {
        return !!(
            this.getHostileSpawnCount(roomName)
            || this.getStrongholdInvaderCoreHitsByRoomName(roomName)
            || this.getHostileTowerCount(roomName)
            || this.getLethalHostilesTTL(roomName)
        );
    }

    getLethalRoom(roomName) {
        return !!(
            this.getStrongholdInvaderCoreHitsByRoomName(roomName)
            || this.getHostileTowerCount(roomName)
            || this.getLethalHostilesTTL(roomName)
        );
    }

    getInvaderCore(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_INVADER_CORE] : null;
    }
    setInvaderCore(room) {
        // Not necessary to spam this.
        if (!room.memory[C.MEMORY_KEY_INVADER_CORE] && ((room.heap.setInvaderCore || Game.time) > Game.time)) return;

        // We only care to look for invader cores in my reserved rooms.
        // Anything else is a waste of cpu.
        let invaderCore = room.myReserved ? room.invaderCore : null;

        if (invaderCore) {
            room.memory[C.MEMORY_KEY_INVADER_CORE] = invaderCore.id;
        } else {
            delete room.memory[C.MEMORY_KEY_INVADER_CORE];
        }

        // Record the next desired scan time.
        room.heap.setInvaderCore = invaderCore ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
    }

    getStrongholds() {
        return Object.values(Memory.strongholds).filter(f => (f.despawnTime > Game.time));
    }
    getStrongholdByRoomName(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.despawnTime > Game.time) && stronghold) || null;
    }
    getStrongholdInvaderStructureHitsByRoomName(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.deployTime <= Game.time) && (stronghold.despawnTime > Game.time)) ? stronghold.hits : 0;
    }
    getStrongholdInvaderCoreHitsByRoomName(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.deployTime <= Game.time) && (stronghold.despawnTime > Game.time)) ? stronghold.invaderCoreHits : 0;
    }
    getStrongholdInvaderMassAttackStructureHitsByRoomName(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.deployTime <= Game.time) && (stronghold.despawnTime > Game.time)) ? stronghold.massAttackhits : 0;
    }
    getStrongholdDespawnTimeByRoomName(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.despawnTime > Game.time)) ? stronghold.deployTime : 0;
    }
    getStrongholdWarning(roomName) {
        let stronghold = Memory.strongholds[roomName];
        // The stronghold hasn't deployed yet but is getting close (withing creep lifetime) and the core still has hits.
        return (stronghold && (stronghold.deployTime < Game.time + CREEP_LIFE_TIME) && stronghold.invaderCoreHits) ? stronghold.deployTime : 0;
    }
    getStrongholdAttackPositionsSorted(roomName) {
        let stronghold = Memory.strongholds[roomName];
        return (stronghold && (stronghold.despawnTime > Game.time)) ? unpackCoordListAsPosList(stronghold.attackPositions, roomName) : [];
    }
    setStronghold(room) {
        // Not necessary to spam this.
        if ((room.heap.setStronghold || Game.time) > Game.time) return;

        // Only applicable to SK rooms.
        if (!room.isSKRoom) return;

        // Need to get the raw structure, even when invulnerable.
        let stronghold = room.invaderStrongholdStructure;

        // Record the next desired scan time.
        room.heap.setStronghold = stronghold ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);

        // Get the sorted list of positions we can attack from.
        // Only do this if we have lancers spawed, since it is expensive.
        let id = Memory.strongholds[room.name] ? Memory.strongholds[room.name].id : null;
        let attackPositions = packCoordList(CreepManager.getLancersByFocusId(id).length ? room.strongholdAttackPositionsSorted : []);

        // Add in or refresh power banks currently in the room.
        if (stronghold) {
            Memory.strongholds[room.name] = {
                roomName: room.name
                , id: stronghold.id
                , level: stronghold.level
                , despawnTime: Game.time + (stronghold.effectTicksRemaining(EFFECT_COLLAPSE_TIMER) || STRONGHOLD_DECAY_TICKS)
                , attackPositions: attackPositions

                // Need three hit values because of containers.
                , hits: room.invaderStructureHits
                , invaderCoreHits: stronghold.hits
                , massAttackhits: room.massAttackInvaderStructureHits

                // deployTime will disappear and we won't know how old a stronghold is.
                // So retain the value once it is set.  The entire object will be deleted when the stronghold is killed.
                , deployTime: stronghold.isInvulnerableTicks ? (Game.time + (stronghold.isInvulnerableTicks || 0)) : (Memory.strongholds[room.name] ? (Memory.strongholds[room.name].deployTime || Game.time) : Game.time)
            };
        }

        if (room.isSKRoom && !stronghold && Memory.strongholds[room.name]) {
            // If there is no stronghold, but we have a memory of one, then update its hits value only until it hits zero.
            Memory.strongholds[room.name].hits = Memory.strongholds[room.name].hits ? room.invaderStructureHits : 0;
            // The invader core itself is now dead.
            Memory.strongholds[room.name].invaderCoreHits = 0;
            // If there is no stronghold, but we have a memory of one, then update its hits value only until it hits zero.
            Memory.strongholds[room.name].massAttackhits = Memory.strongholds[room.name].massAttackhits ? room.massAttackInvaderStructureHits : 0;
            // Save our list of attack positions always.
            Memory.strongholds[room.name].attackPositions = attackPositions
        }
    }
    cleanStrongholdData() {
        // Cleanup old strongholds that have surely expired.
        Object.keys(Memory.strongholds).forEach(roomName => {
            if (Memory.strongholds[roomName].despawnTime <= Game.time) delete Memory.strongholds[roomName];
        });
    }

    getSourceCount(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_SOURCE_COUNT] : null;
    }
    setSources(room) {
        // Highways do not have sources, everyone else does however.
        if (!room.isHighwayRoom) {
            // Source count never changes, so once its recorded no need to look it up again.
            if (typeof room.memory[C.MEMORY_KEY_SOURCE_COUNT] === "undefined") room.memory[C.MEMORY_KEY_SOURCE_COUNT] = room.find(FIND_SOURCES).length;
        }
    }

    getHasBarrierBelowThreshhold(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_ROOM_BARRIER_BELOW_THRESHHOLD] : null;
    }
    setHasBarrierBelowThreshhold(room) {
        // Not necessary to spam this.
        if ((room.heap.setHasBarrierBelowThreshhold || Game.time) > Game.time) return;

        // Find the weakest barrier and test it.
        let barrier = null;
        if (room.my && !room.isTemple) {
            // Test our existing barrier.
            if (!barrier) {
                barrier = Game.getObjectById(this.getHasBarrierBelowThreshhold(room.name));
                if (barrier) barrier = ((barrier.hits < room.barrierHits) && barrier.pos.inRange4Edge) ? barrier : null;
            }

            // Test the currently weakest barrier.
            if (!barrier) {
                barrier = room.perimeterBarriersSorted[0];
                if (barrier) barrier = (barrier.hits < room.barrierHits) ? barrier : null;
            }

            // Test if we have nuke barriers we need to repair.
            // Note that once this is picked up, it will get stuck as the specific id.
            if (!barrier) {
                barrier = room.nukeBarrierBelowRepairThreshhold;
            }
        }

        // We only care to look for invader cores in my reserved rooms.
        // Anything else is a waste of cpu.
        if (barrier) {
            room.memory[C.MEMORY_KEY_ROOM_BARRIER_BELOW_THRESHHOLD] = barrier.id;
        } else {
            delete room.memory[C.MEMORY_KEY_ROOM_BARRIER_BELOW_THRESHHOLD];
        }

        // Record the next desired scan time.
        room.heap.setHasBarrierBelowThreshhold = utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_BARRIER_TICKS);
    }

    getPlunderableAmount(roomName) {
        roomName = packRoomName(roomName);
        return (Memory.plunderables[roomName] && Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_AMOUNT]) ? Number(Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_AMOUNT] || 0) : 0;
    }
    getPlunderableValue(roomName) {
        roomName = packRoomName(roomName);
        return (Memory.plunderables[roomName] && Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_VALUE]) ? Number(Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_VALUE] || 0) : 0;
    }
    getPlunderableHash(roomName) {
        roomName = packRoomName(roomName);
        return Memory.plunderables[roomName] ? Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_HASH] : {};
    }
    getPlunderablePower(roomName) {
        return this.getPlunderableHash(roomName)[RESOURCE_POWER];
    }
    setPlunderables(room) {
        let roomName = packRoomName(room.name);

        // We want to always update the plunderable when it is non-zero (since we may have withdrawals)
        // or when an object is destroyed, or when our cache timer has expired.
        if (
            (!Memory.plunderables[roomName] || !Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_AMOUNT])
            && ((room.heap.setPlunderables || Game.time) > Game.time)
            //&& !room.hasEventObjectDestroyed

            // BUG in highway corners (correct criteria?) where ruins are not created after powerbank destroyed, directly to dropped resources.
            //&& !room.isHighwayCorner
        ) return;

        // Be smart about when to save values for plunderables for the purpose of rogues doing a visit.
        // This should be a subset of the actual plunderable rooms, since creeps will have PLUNDER task in a room we may exclude here.
        // Note that...
        // My rooms are cleaned up by Rooks.
        // My reserved rooms shouldn't have anything to loot normally, maybe random droppings hardly worth it.
        // SK rooms are picked up by Scavengers as long as they are reserved (but Center rooms are not).
        // Does anything interesting happen in center rooms? Usually big fights with invaders so we can look at them too.
        // SK strongholds we do attack and want to loot.
        // Can't really plunder hostile rooms safely.
        // Highway rooms will have screep tombstones that are not covered by anything else.
        // Empty rooms won't have any action in them normally, so ignore.
        let plunderableAmount = null;
        if (
            // My own rooms can have drops in them, usually picked up by llamas and rooks but still.
            (room.myManagement && !room.isSKRoom)
            // SK rooms will have drops but scavengers will take care of those if under our management.
            || (room.isSKRoom && !room.myManagement)
            // My rooms that are reserved but not under management will likely have containers.
            || room.myReservedNotManaged
            // Core rooms do not have scavengers and anything is fair game here.
            || room.isCoreRoom
            // Anyone highway room can have loot in it from battles or powerbanks or deposits.
            || room.isHighwayRoom
            // The room is not reserved by another player.
            || (room.controller && !room.reservedByOtherPlayer)
            // Do we care about plundering other hostile players? Their containers will have loot.
            || (FlagManager.plunderplayersFlag && room.reservedByOtherPlayer && !PlayerManager.isAlly(room.reservedByOtherPlayer))
        ) {
            plunderableAmount = room.plunderableAmount;
        }
        if (plunderableAmount) {
            if (typeof Memory.plunderables[roomName] === "undefined") Memory.plunderables[roomName] = {};
			Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_AMOUNT] = plunderableAmount.toFixed(0);
			Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_VALUE] = room.plunderableValue.toFixed(0);
			Memory.plunderables[roomName][C.MEMORY_KEY_PLUNDERABLE_HASH] = room.plunderableHash;
        } else {
            delete Memory.plunderables[roomName];
        }

        // Record the next desired scan time.
        room.heap.setPlunderables = plunderableAmount ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
    }

    _getNukeData(roomName) {
        let nukes = (Memory.nukes[roomName] && Memory.nukes[roomName].n) ? Object.values(Memory.nukes[roomName].n || {}) : [];
        return nukes.filter(f => f.t >= Game.time);
    }
    getNukePosList(roomName) {
        return Memory.nukes[roomName] ? this._getNukeData(roomName).map(m => unpackCoordAsPos(m.p, roomName)) : [];
    }
    getNukeLaunchRoomNameList(roomName) {
        return Memory.nukes[roomName] ? this._getNukeData(roomName).map(m => m.lrn) : [];
    }
    getNukeCount(roomName) {
        return this.getNukePosList(roomName).length;
    }
    getNukeTimeToLand(roomName) {
        // There could be multiple nukes incoming, get the one coming up next.
        // Be sure to filter out the ones that have already landed.
        let nukes = this._getNukeData(roomName).map(m => m.t);
        if (nukes.length) return Math.min(...nukes);
        return 0;
    }
    getNukedRoomsList() {
        return _.sortBy(Object.keys(Memory.nukes).filter(f => this.getNukeCount(f)), s => this.getNukeTimeToLand(s));
    }
    setNukes(room) {
        // Not necessary to spam this.
        if ((room.heap.setNukes || Game.time) > Game.time) return;

        // Bail out if we are still within our cache period.
        let roomName = room.name;
        //if (Memory.nukes[roomName] && Memory.nukes[roomName].t && (unpackTime(Memory.nukes[roomName].t) + Config.params.NUKE_CACHE_TICKS > Game.time)) return;

        // Record the next desired scan time.
        room.heap.setNukes = utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);

        // Only care to scan rooms that are owned or are SK rooms.
        if (room.owner || room.isSKRoom) {
            let nukes = room.nukes;
            Memory.nukes[roomName] = {};
            Memory.nukes[roomName].t = packTime(Game.time);

            if (nukes.length) {
                Memory.nukes[roomName].n = {};
                nukes.forEach(nuke => {
                    Memory.nukes[roomName].n[nuke.id] = {};
                    Memory.nukes[roomName].n[nuke.id].t = Game.time + nuke.timeToLand;
                    Memory.nukes[roomName].n[nuke.id].lrn = nuke.launchRoomName
                    Memory.nukes[roomName].n[nuke.id].p = packCoord(nuke.pos)
                });
            }
        }
        else {
            delete Memory.nukes[roomName];
        }
    }

    getSourceKeeperPosList(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_SOURCEKEEPER_POS_LIST]) ? unpackCoordListAsPosList(Memory.rooms[roomName][C.MEMORY_KEY_SOURCEKEEPER_POS_LIST], roomName) || [] : [];
    }
    getKeeperLairPosList(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_KEEPER_LAIR_POS_LIST]) ? unpackCoordListAsPosList(Memory.rooms[roomName][C.MEMORY_KEY_KEEPER_LAIR_POS_LIST], roomName) || [] : [];
    }
    setSK(room) {
        // Not necessary to spam this.
        if ((room.heap.setSK || Game.time) > Game.time) return;

        // Only need to set this once.
        // Sadly, this is not true: the position of the keeper CAN change and or be somewhat unpredictable.
        //if (typeof room.memory[C.MEMORY_KEY_KEEPER_LAIR_POS_LIST] !== "undefined") return;

        if (room.isSKRoom) {
            // This list is ~rarely changed but not static.
            room.memory[C.MEMORY_KEY_SOURCEKEEPER_POS_LIST] = packCoordList(room.resources.map(m => (m.keeperLair.sourceKeeper && m.keeperLair.sourceKeeper.pos.isNearTo(m)) ? m.keeperLair.sourceKeeper.pos : m.sourceKeeperPos)) || [];

            // This list is static, only need to find it once.
            if (!room.memory[C.MEMORY_KEY_KEEPER_LAIR_POS_LIST]) room.memory[C.MEMORY_KEY_KEEPER_LAIR_POS_LIST] = packCoordList(room.keeperLairs.map(m => m.pos)) || [];

            // Record the next desired scan time.
            room.heap.setSK = utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
        }
        else {
            delete room.memory[C.MEMORY_KEY_SOURCEKEEPER_POS_LIST];
            delete room.memory[C.MEMORY_KEY_KEEPER_LAIR_POS_LIST];
        }
    }

    getPortalPosList(roomName) {
        return (Memory.portals[roomName] && Memory.portals[roomName].p) ? unpackCoordListAsPosList(Memory.portals[roomName].p, roomName) || [] : [];
    }
    setPortals(room) {
        // Not necessary to spam this.
        if ((room.heap.setPortals || Game.time) > Game.time) return;

        let roomName = room.name;

        // Bail out if we are still within our cache period.
        //if (Memory.portals[roomName] && Memory.portals[roomName].t && (unpackTime(Memory.portals[roomName].t) + Config.params.PORTAL_CACHE_TICKS > Game.time)) return;

        // Only care to scan rooms that are owned or are SK rooms.
        if (room.isPortalRoom) {
            let portals = room.portals;

            // Record our room data and positions.
            Memory.portals[roomName] = {};
            Memory.portals[roomName].t = packTime(Game.time);
            Memory.portals[roomName].p = packCoordList(portals.map(m => m.pos)) || [];
        }
        else {
            delete Memory.portals[roomName];
        }

        // Record the next desired scan time.
        room.heap.setPortals = utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);
    }

    setHostiles(room) {
        // Not necessary to spam this.
        //if ((typeof room.memory[C.MEMORY_KEY_HOSTILES_TTL] === "undefined") && ((room.heap.setHostiles || Game.time) > Game.time) && !room.hasEventAttack) return;
        if ((typeof room.memory[C.MEMORY_KEY_HOSTILES_TTL] === "undefined") && ((room.heap.setHostiles || Game.time) > Game.time)) return;

        // Shortcuircit when possible.
        // Exclude rooms owned by others that we have no creeps in. Don't care about this.
        let hasHostiles = !(room.ownedByOther && !room.myCreeps.length) && room.hostiles.length;

        // Record the next desired scan time.
        room.heap.setHostiles = hasHostiles ? Game.time : (
            // The exception being if we are a highway room, and we have no creeps in the room, then we are trying to force a scan.
            (room.isHighwayRoom && !room.myCreeps.length) ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS)
        );

        // Record if there are dangerous hostiles in them.
        if (hasHostiles && room.nonSourceKeeperHostiles.length) {
            room.memory[C.MEMORY_KEY_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.nonSourceKeeperHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_HOSTILES_TTL];
        }

        // Record if there are lethal hostiles in them.
        if (hasHostiles && room.lethalHostiles.length) {
            room.memory[C.MEMORY_KEY_LETHAL_HOSTILES_TTL] = packTime(Game.time + room.lethalHostileTicksToLive);
            room.memory[C.MEMORY_KEY_HOSTILE_ATTACK_POWER] = room.hostileAttackPower;
            room.memory[C.MEMORY_KEY_HOSTILE_RANGED_ATTACK_POWER] = room.hostileRangedAttackPower;
            room.memory[C.MEMORY_KEY_HOSTILE_HEAL_POWER] = room.hostileHealPower;
        } else {
            delete room.memory[C.MEMORY_KEY_LETHAL_HOSTILES_TTL];
            delete room.memory[C.MEMORY_KEY_HOSTILE_ATTACK_POWER];
            delete room.memory[C.MEMORY_KEY_HOSTILE_RANGED_ATTACK_POWER];
            delete room.memory[C.MEMORY_KEY_HOSTILE_HEAL_POWER];
        }

        // Record if there are dangerous hostiles in them.
        if (hasHostiles && room.dangerousHostiles.length) {
            room.memory[C.MEMORY_KEY_DANGEROUS_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.dangerousHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_DANGEROUS_HOSTILES_TTL];
        }

        if (hasHostiles && room.dangerousPlayerHostiles.length) {
            room.memory[C.MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.dangerousPlayerHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL];
        }

        // Record if there are lethal boosted hostiles in them.
        if (hasHostiles && room.lethalBoostedHostiles.length) {
            room.memory[C.MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.lethalBoostedHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL];
        }

        // Record if there are lethal player hostiles in them.
        if (hasHostiles && room.lethalPlayerHostiles.length) {
            room.memory[C.MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.lethalPlayerHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL];
        }

        // Record if there are lethal boosted player hostiles in them.
        if (hasHostiles && room.lethalBoostedPlayerHostiles.length) {
            room.memory[C.MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL] = packTime(Game.time + Math.max.apply(Math, room.lethalBoostedPlayerHostiles.map(m => m.ticksToLive)));
        } else {
            delete room.memory[C.MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL];
        }

        // Record if there are lethal screeps with carry in them.
        if (hasHostiles && room.screeps.length) {
            if (!Memory.screeps[room.name]) Memory.screeps[room.name] = {};
            Memory.screeps[room.name][C.MEMORY_KEY_SCREEPS_TTL] = packTime(Game.time + Math.max.apply(Math, room.screeps.map(m => m.ticksToLive)));
        } else {
            delete Memory.screeps[room.name];
        }

        // Record if there are lethal screeps with carry in them.
        if (hasHostiles && room.screepsWithCarry.length) {
            if (!Memory.screeps[room.name]) Memory.screeps[room.name] = {};
            Memory.screeps[room.name][C.MEMORY_KEY_SCREEPS_WITH_CARRY_TTL] = packTime(Game.time + Math.max.apply(Math, room.screepsWithCarry.map(m => m.ticksToLive)));
        } else {
            delete Memory.screeps[room.name];
        }

        // Record the last position inside a friendly room.
        if (hasHostiles && room.playerHostiles.length) {
            // Don't save the very edge, but one space in.
            // NO-- save the edge position, so we can properly get range3 calculations.
            // This also saves when creeps walk OUT of a room, which is also good, as they may come back.
            let fixCoord = function(p) {
                switch (p) {
                    //case 0: return 1;
                    //case 49: return 48;
                    case 1: return 0;
                    case 48: return 49;
                    default: return p;
                }
            }

            // Record the last entry position of a hostile player in my room. This can help predict where they will enter next time.
            let hostile = room.playerHostiles.find(f => f.pos.isNearEdge);
            if (hostile) {
                //room.lastHostileEdgePos = new RoomPosition(fixCoord(hostile.pos.x), fixCoord(hostile.pos.y), room.name);
                room.heap[C.MEMORY_KEY_PLAYER_HOSTILE_LAST_EDGE_POS] = packCoord(utils.newCoord(fixCoord(hostile.pos.x), fixCoord(hostile.pos.y)));
            }
            // Update the time as long as they are anywhere in the room.
            if (room.playerHostiles.length) {
                //room.lastHostileTime = Game.time;
                room.heap[C.MEMORY_KEY_PLAYER_HOSTILE_LAST_TIME] = packTime(Game.time);
            }
        }

        // Record if there are invaders in them. Otherwise we don't care.
        if (hasHostiles && room.myManagement && room.invaders.length) {
            room.memory[C.MEMORY_KEY_INVADERS_TTL] = packTime(Game.time + room.invadersTicksToLive);
        }
        else {
            delete room.memory[C.MEMORY_KEY_INVADERS_TTL]
        }
    }

    getPlayerHostileLastTime(roomName) {
        return (Heap.rooms[roomName] && Heap.rooms[roomName][C.MEMORY_KEY_PLAYER_HOSTILE_LAST_TIME] && ((unpackTime(Heap.rooms[roomName][C.MEMORY_KEY_PLAYER_HOSTILE_LAST_TIME]) || 0) > Game.time - Config.params.LAST_HOSTILE_POS_TICKS)) ? unpackTime(Heap.rooms[roomName][C.MEMORY_KEY_PLAYER_HOSTILE_LAST_TIME]) : null;
    }
    getPlayerHostileLastEdgePos(roomName) {
        return (this.getPlayerHostileLastTime(roomName) && Heap.rooms[roomName] && Heap.rooms[roomName][C.MEMORY_KEY_PLAYER_HOSTILE_LAST_EDGE_POS]) ? unpackCoordAsPos(Heap.rooms[roomName][C.MEMORY_KEY_PLAYER_HOSTILE_LAST_EDGE_POS], roomName) : null;
    }

    getHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_HOSTILES_TTL]) : null;
    }
    getDangerousPlayerHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_PLAYER_HOSTILES_TTL]) : null;
    }
    getDangerousHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_DANGEROUS_HOSTILES_TTL]) : null;
    }
    getLethalHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_HOSTILES_TTL]) : null;
    }
    getLethalPlayerHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_PLAYER_HOSTILES_TTL]) : null;
    }
    getLethalBoostedHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_HOSTILES_TTL]) : null;
    }
    getLethalBoostedPlayerHostilesTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_LETHAL_BOOSTED_PLAYER_HOSTILES_TTL]) : null;
    }
    getInvadersTTL(roomName) {
        return (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_INVADERS_TTL] && ((unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_INVADERS_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.rooms[roomName][C.MEMORY_KEY_INVADERS_TTL]) : null;
    }
    getScreepsTTL(roomName) {
        return (Memory.screeps[roomName] && Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_TTL] && ((unpackTime(Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_TTL]) : null;
    }
    getScreepsWithCarryTTL(roomName) {
        return (Memory.screeps[roomName] && Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_WITH_CARRY_TTL] && ((unpackTime(Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_WITH_CARRY_TTL]) || Game.time) > Game.time)) ? unpackTime(Memory.screeps[roomName][C.MEMORY_KEY_SCREEPS_WITH_CARRY_TTL]) : null;
    }

    getScreepsData() {
        return Memory.screeps ? Memory.screeps : {};
    }

    getRoomCenterPos(roomName) {
        // Note the memory data is stored as xy coords not a full pos.
        let pos = (Memory.rooms[roomName] && Memory.rooms[roomName][C.MEMORY_KEY_CENTER_POSITION]) ? utils.posFromCoord(unpackCoord(Memory.rooms[roomName][C.MEMORY_KEY_CENTER_POSITION]), roomName) : null;

        if (!pos) {
            try {
                // Didn't have it in memory, if the room is visible go get the value.
                if (Game.rooms[roomName] && GameManager.isCpuAboveNormal) pos = Game.rooms[roomName].getCenterPos();
            } catch (e) {
                // Expensive operation, expect to fail from the time time.
            }

            // If we now have a value, save it.  We might not still, if room is not visible.
            if (pos) {
                if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
                Memory.rooms[roomName][C.MEMORY_KEY_CENTER_POSITION] = packCoord(pos.coord);
            }
            else {
                // For now return a generic 25, 25.
                try {
                    pos = new RoomPosition(25, 25, roomName);
                } catch (e) {
                    console.log('wtf cant make roomposition', roomName)
                }
            }
        }
        return pos;
    }
    updateRoomCenterPos(roomName) {
        if (GameManager.isCpuPegged) {
            let pos = this.getRoomCenterPos(roomName);
        }
    }

    getAutonukeFlags(roomName) {
        //return FlagManager.autonukeFlags.filter(f => f.flag.pos.roomName === roomName)
        return FlagManager.autonukeFlagsByRoomName(roomName);
    }

    getDestroyFlags(roomName) {
        //return FlagManager.destroyFlags.filter(f => f.flag.pos.roomName === roomName)
        return FlagManager.destroyFlagsByRoomName(roomName);
    }
    getDestroyFlagHits(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_DESTROY_FLAG_HITS] : null;
    }
    setDestroyFlagHits(roomName, value) {
        if (value) {
            if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
            Memory.rooms[roomName][C.MEMORY_KEY_DESTROY_FLAG_HITS] = value;
        } else {
            if (Memory.rooms[roomName]) delete Memory.rooms[roomName][C.MEMORY_KEY_DESTROY_FLAG_HITS];
        }
    }

    /**
     * Allows querying any room (visible or not) and determine if the room needs a defender.
     */
    getRoomNeedsDefender(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_ROOM_NEEDS_DEFENDER] : null;
    }
    setRoomNeedsDefender(room) {
        let value = room.roomNeedsDefender ? 1 : null;
        if (value) {
            room.memory[C.MEMORY_KEY_ROOM_NEEDS_DEFENDER] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_ROOM_NEEDS_DEFENDER];
        }
    }

    /**
     * Allows querying any room (visible or not) and determine if the room needs a boosted defender.
     */
    getRoomNeedsBoostedDefender(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_ROOM_NEEDS_BOOSTED_DEFENDER] : null;
    }
    setRoomNeedsBoostedDefender(room) {
        let value = room.roomNeedsBoostedDefender ? 1 : null;
        if (value) {
            room.memory[C.MEMORY_KEY_ROOM_NEEDS_BOOSTED_DEFENDER] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_ROOM_NEEDS_BOOSTED_DEFENDER];
        }
    }

    /**
     * Returns an array of powerbank objects in this room.
     * Old powerbanks will be filtered if they are beyond their despawn time.
     */
    getPowerBanks() {
        return Object.values(Memory.powerbanks).filter(f => (f.despawnTime >= Game.time));
    }
    /**
     * Returns an array of powerbank objects in this room.
     * Old powerbanks will be filtered if they are beyond their despawn time.
     */
    getPowerBanksByRoomName(roomName) {
        return this.getPowerBanks().filter(f => (f.roomName === roomName));
    }
    /**
     * Returns singular powerbank object for the given id.
     */
    getPowerBankById(id) {
        return Memory.powerbanks[id] ? Memory.powerbanks[id].hits : null;
    }
    setPowerBanks(room) {
        // Not necessary to spam this.
        if ((room.heap.setPowerBanks || Game.time) > Game.time) return;

        let powerbanks = room.powerbanks;

        // Record the next desired scan time.
        room.heap.setPowerBanks = powerbanks.length ? Game.time : utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);

        // Add in or refresh power banks currently in the room.
        powerbanks.forEach(powerbank => {
            Memory.powerbanks[powerbank.id] = {
                roomName: powerbank.room.name
                , id: powerbank.id
                , nips: powerbank.nips.length
                , power: powerbank.power
                , hits: powerbank.hits
                , despawnTime: Game.time + powerbank.ticksToDecay
            };
        });

        // Set hits to zero for any powerbanks in this room. who are not currently visible (aka destroyed).
        Object.values(Memory.powerbanks).filter(f => (f.roomName === room.name) && (f.hits > 0) && !powerbanks.map(m => m.id).includes(f.id)).forEach(powerbank => {
            Memory.powerbanks[powerbank.id].hits = 0;
        })
    }
    cleanPowerBankData() {
        // Cleanup old power banks that have surely expired.
        Object.keys(Memory.powerbanks).forEach(id => {
            if (Memory.powerbanks[id].despawnTime < Game.time) delete Memory.powerbanks[id];
        });
    }

    /**
     * Returns an array of deposit objects in this room.
     * Old deposits will be filtered if they are beyond their despawn time.
     */
    getDeposits() {
        return Object.values(Memory.deposits).filter(f => (f.despawnTime >= Game.time));
    }
    /**
     * Returns an array of powerbank objects in this room.
     * Old powerbanks will be filtered if they are beyond their despawn time.
     */
    getDepositsByRoomName(roomName) {
        return this.getDeposits().filter(f => (f.roomName === roomName));
    }
    /**
     * Returns singular powerbank object for the given id.
     */
    getDepositById(id) {
        return Memory.deposits[id] ? Memory.deposits[id] : null;
    }
    setDeposits(room) {
        // Not necessary to spam this.
        if ((room.heap.setDeposits || Game.time) > Game.time) return;

        let deposits = room.deposits;

        // Record the next desired scan time.
        room.heap.setDeposits = utils.roundToMultipleOf(Game.time + 1, Config.params.ROOMINTEL_CACHE_TICKS);

        // Add in or refresh power banks currently in the room.
        deposits.forEach(deposit => {
            if ((deposit.lastCooldown || 0) < Config.params.MAX_DEPOSIT_COOLDOWN) {
                Memory.deposits[deposit.id] = {
                    roomName: deposit.room.name
                    , id: deposit.id
                    , nips: deposit.nips.length
                    , depositType: deposit.depositType
                    , lastCooldown: deposit.lastCooldown || 0
                    , despawnTime: Game.time + deposit.ticksToDecay
                };
            }
            else {
                // Remove this dead deposit that we will no longer harvest from.
                delete Memory.deposits[deposit.id];
            }
        });
    }
    cleanDepositData() {
        // Cleanup old power banks that have surely expired.
        Object.keys(Memory.deposits).forEach(id => {
            if (Memory.deposits[id].despawnTime < Game.time) delete Memory.deposits[id];
        });
    }

    getMyReactor(roomName) {
        return Memory.rooms[roomName] ? Memory.rooms[roomName][C.MEMORY_KEY_MY_REACTOR] : null;
    }
    setReactor(room) {
        let value = (FlagManager.season5Flag && room.isCoreRoom && room.reactor && room.reactor.my) ? room.reactor.id : null;
        if (value) {
            room.memory[C.MEMORY_KEY_MY_REACTOR] = value;
        } else {
            delete room.memory[C.MEMORY_KEY_MY_REACTOR];
        }
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(RoomIntel, 'RoomIntel');

module.exports = RoomIntel;
