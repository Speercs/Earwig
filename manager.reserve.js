"use strict";

class ReserveManager {

    constructor() {
    }

    /**
     * This will clear and recalculate and store the reserved room hashes for both individual rooms and globally.
     * This is a key/value pair, where the key is the reserved room and the value is the spawn room reserving it.
     * A room can only be reserved by one spawn room of course.
     */
    setReservedRooms(options) {
        // Only run this once per tick.
        if (Memory.cpu.setreservedrooms && (Memory.cpu.setreservedrooms === Game.time)) return;

        GameManager.addProcess('setReservedRooms');

        // Don't mess with the original options object.
		let defaults = {
			debug: false
            , debugRoom: null
            // Use delta to force increase room count.
            , delta: FlagManager.deltaFlag ? C.COLOR_TO_NUMBER[FlagManager.deltaFlag.color] : 0
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Record the last time this method was run.
        Memory.cpu.setreservedrooms = Game.time;

        // Adjust our reserved room count if needed.
        let maxReservedRoomCount = Math.max(0, GameManager.empireReservedRoomsArray.length + (options.delta ? options.delta : CpuManager.getRecommendedDelta()));

        // Turn off any manual delta flag.
        if (FlagManager.deltaFlag) FlagManager.deltaFlag.setColor(COLOR_WHITE);

        // Clear out previous list of rooms, both individual and global.
        let reservedRooms = {};

        Object.keys(Memory.rooms).forEach(room => {
            //delete Memory.rooms[room].reservedRooms;
            delete Memory.rooms[room].reserveCpuCost;
            delete Memory.rooms[room].reserveCreeps;
        })

        let getSortedRooms = function(rooms) {
            // Sort the rooms by how many each can reach, prioritizing the ones that can reach the fewest to help balance.
            return _.sortByOrder(rooms, [
                // Prioritize rooms that do not have castle upgrade assistance, since they will be fending for themselves.
                //sortEmpireCastleAssistance => sortEmpireCastleAssistance.hasEmpireCastleAssistance ? 1 : 0
                // Highest to lowest room level, as higher rooms can farm better.
                // Lowest to highest room level, as lower rooms need constant resources to upgrade/build.
                sortLevel => sortLevel.level
                // Tiebreaker on level by progress remaining. If a room breaks into a new level, don't steal another rooms sources.
                , sortProgress => -sortProgress.controller.progress
                // We want all the SK accessible rooms to go first and often, and then highway access rooms last.
                , sortInnerRing => sortInnerRing.isSKAccessRoom ? 0 : (sortInnerRing.isHighwayAccessRoom ? 2 : 1)
                // Highest to lowest max possible capacity (as gained from PowerCreeps). This allows faster room spawning of reservists.
                , sortMaxReserveCapacity => -sortMaxReserveCapacity.maxReserveCreepCapacity
                // Lowest to highest current progress in reserving. How much has this room reserved so far? Try to balance this out between rooms.
                , sortReserveCost => sortReserveCost.reserveCpuCost
                // Lowest to highest reachable rooms able to be reserved by this room.
                , sortReachableRoomsCount => Object.keys(sortReachableRoomsCount.reachableRoomsToReserve).length
                // Tiebreaker (max level rooms).
                , sortName => sortName.name
            ]);
        }

        // A counter for rooms being reserved, thru all interations.
        let roomsReservedOverall = 0;

        // Bail out here if we aren't reserving at all.
        if (!FlagManager.noreserveFlag) {

            // PASS ONE: We want ring1 to CORE rooms to go first and reserve only core rooms.
            // These are the most valuable sources, and produce minerals.
            if (roomsReservedOverall < maxReservedRoomCount) {
                // Get our list of rooms that will be reserving.
                let spawnRooms = this.spawnRoomsReserving.filter(f => Cartographer.isSKAccessRoom(f.name)); // Allow any level room access to core room. && f.isCastle);
                if (options.debug) console.log('setReservedRooms in pass ONE: ' + spawnRooms.map(m => m.name).join());

                let distance = 1;
                doneLabel: while ((distance <= GameManager.reservedRoomDistance) && (roomsReservedOverall < maxReservedRoomCount)) {
                    let remainingRooms = getSortedRooms(spawnRooms);

                    // Each (remaining) room gets a chance to reserve one room at a time at this range.
                    let roomsReservedAtCurrentRange = 0;
                    for (let i=0; i<remainingRooms.length; i++) {
                        let currentSpawnRoom = remainingRooms[i];
                        let reserveOptions = _.defaults({}, _.clone(options), { centerRoomsOnly: true, sectorRoomsOnly: true });
                        let newRequestedReservedRoomName = currentSpawnRoom.getReservedRoomsSortedAutoIncremental(reservedRooms, distance, reserveOptions);

                        if (newRequestedReservedRoomName) {
                            if (options.debug && (options.debugRoom ? currentSpawnRoom.name === options.debugRoom : true)) console.log('setReservedRooms adding ' + currentSpawnRoom.name + ': ' + newRequestedReservedRoomName);

                            // Add to the global list at the end.
                            reservedRooms[newRequestedReservedRoomName] = currentSpawnRoom.name;

                            // Increment our room count.
                            roomsReservedOverall++;
                            roomsReservedAtCurrentRange++;

                            // Check to see if we have exceeded our limit globally for all rooms.
                            if (roomsReservedOverall >= maxReservedRoomCount) break doneLabel;
                        }
                    }

                    // No rooms left to reserve at this distance, proceed to higher distance.
                    if (!roomsReservedAtCurrentRange) distance++;
                }
            }

            // PASS TWO: Do rooms that are in claimed sectors.
            // This will fill up the sector and help prevent invaders.
            if (roomsReservedOverall < maxReservedRoomCount) {
                // Loop thru each sector based on population and do its rooms entirely before moving onto the next sector.
                let sectors = GameManager.empireSectorNames.filter(f => GameManager.isSectorClaimed(f)).sort((a, b) => GameManager.empireSectorPercentage[b] - GameManager.empireSectorPercentage[a]);
                sectors.forEach(sector => {
                    // Get our list of rooms that will be reserving.
                    let spawnRooms = this.spawnRoomsReserving.filter(f => f.sector === sector);
                    if (options.debug) console.log('setReservedRooms in pass TWO: ' + spawnRooms.map(m => m.name).join());

                    let distance = 1;
                    doneLabel: while ((distance <= GameManager.reservedRoomDistance) && (roomsReservedOverall < maxReservedRoomCount)) {
                        let remainingRooms = getSortedRooms(spawnRooms);

                        // Each (remaining) room gets a chance to reserve one room at a time at this distance.
                        let roomsReservedAtCurrentRange = 0;
                        for (let i=0; i<remainingRooms.length; i++) {
                            let currentSpawnRoom = remainingRooms[i];
                            let reserveOptions = _.defaults({}, _.clone(options), { sectorRoomsOnly: true });
                            let newRequestedReservedRoomName = currentSpawnRoom.getReservedRoomsSortedAutoIncremental(reservedRooms, distance, reserveOptions);

                            if (newRequestedReservedRoomName) {
                                if (options.debug && (options.debugRoom ? currentSpawnRoom.name === options.debugRoom : true)) console.log('setReservedRooms adding ' + currentSpawnRoom.name + ': ' + newRequestedReservedRoomName);

                                // Add to the global list at the end.
                                reservedRooms[newRequestedReservedRoomName] = currentSpawnRoom.name;

                                // Increment our room count.
                                roomsReservedOverall++;
                                roomsReservedAtCurrentRange++;

                                // Check to see if we have exceeded our limit globally for all rooms.
                                if (roomsReservedOverall >= maxReservedRoomCount) break doneLabel;
                            }
                        }

                        // No rooms left to reserve at this distance, proceed to higher distance.
                        if (!roomsReservedAtCurrentRange) distance++;
                    }
                });
            }

            // PASS THREE: Do whatever is left over for non-claimed sectors, non-highway access rooms.
            if (roomsReservedOverall < maxReservedRoomCount) {
                // Get our list of rooms that will be reserving.
                let spawnRooms = this.spawnRoomsReserving.filter(f => !f.isSectorClaimed && f.shouldCreateSourceTrails);
                if (options.debug) console.log('setReservedRooms in pass THREE: ' + spawnRooms.map(m => m.name).join());

                let distance = 1;
                doneLabel: while ((distance <= GameManager.reservedRoomDistance) && (roomsReservedOverall < maxReservedRoomCount)) {
                    let remainingRooms = getSortedRooms(spawnRooms);

                    // Each (remaining) room gets a chance to reserve one room at a time at this distance.
                    let roomsReservedAtCurrentRange = 0;
                    for (let i=0; i<remainingRooms.length; i++) {
                        let currentSpawnRoom = remainingRooms[i];
                        let reserveOptions = _.defaults({}, _.clone(options), {});
                        let newRequestedReservedRoomName = currentSpawnRoom.getReservedRoomsSortedAutoIncremental(reservedRooms, distance, reserveOptions);

                        if (newRequestedReservedRoomName) {
                            if (options.debug && (options.debugRoom ? currentSpawnRoom.name === options.debugRoom : true)) console.log('setReservedRooms adding ' + currentSpawnRoom.name + ': ' + newRequestedReservedRoomName);

                            // Add to the global list at the end.
                            reservedRooms[newRequestedReservedRoomName] = currentSpawnRoom.name;

                            // Increment our room count.
                            roomsReservedOverall++;
                            roomsReservedAtCurrentRange++;

                            // Check to see if we have exceeded our limit globally for all rooms.
                            if (roomsReservedOverall >= maxReservedRoomCount) break doneLabel;
                        }
                    }

                    // No rooms left to reserve at this distance, proceed to higher distance.
                    if (!roomsReservedAtCurrentRange) distance++;
                }
            }

            // PASS FOUR: Do whatever is left over for non-claimed sectors, highway access rooms.
            if (roomsReservedOverall < maxReservedRoomCount) {
                // Get our list of rooms that will be reserving.
                let spawnRooms = this.spawnRoomsReserving.filter(f => !f.isSectorClaimed && !f.shouldCreateSourceTrails);
                if (options.debug) console.log('setReservedRooms in pass FOUR: ' + spawnRooms.map(m => m.name).join());

                let distance = 1;
                doneLabel: while ((distance <= GameManager.reservedRoomDistance) && (roomsReservedOverall < maxReservedRoomCount)) {
                    let remainingRooms = getSortedRooms(spawnRooms);

                    // Each (remaining) room gets a chance to reserve one room at a time at this distance.
                    let roomsReservedAtCurrentRange = 0;
                    for (let i=0; i<remainingRooms.length; i++) {
                        let currentSpawnRoom = remainingRooms[i];
                        let reserveOptions = _.defaults({}, _.clone(options), {});
                        let newRequestedReservedRoomName = currentSpawnRoom.getReservedRoomsSortedAutoIncremental(reservedRooms, distance, reserveOptions);

                        if (newRequestedReservedRoomName) {
                            if (options.debug && (options.debugRoom ? currentSpawnRoom.name === options.debugRoom : true)) console.log('setReservedRooms adding ' + currentSpawnRoom.name + ': ' + newRequestedReservedRoomName);

                            // Add to the global list at the end.
                            reservedRooms[newRequestedReservedRoomName] = currentSpawnRoom.name;

                            // Increment our room count.
                            roomsReservedOverall++;
                            roomsReservedAtCurrentRange++;

                            // Check to see if we have exceeded our limit globally for all rooms.
                            if (roomsReservedOverall >= maxReservedRoomCount) break doneLabel;
                        }
                    }

                    // No rooms left to reserve at this distance, proceed to higher distance.
                    if (!roomsReservedAtCurrentRange) distance++;
                }
            }
        }

        // Save our results!
        // Doing this near the end, and not at the beginning, so that if the process times out we don't wipe out data and have rooms not reserving at all.
        Memory.reservedRooms = reservedRooms;

        // Initialize our reserved rooms hash for ALL spawn rooms.
        GameManager.empireSpawnRooms.forEach(room => {
            room.memory.reservedRooms = {};
        })

        // Save the reserved room names back to each room for quick access.
        Object.keys(Memory.reservedRooms).forEach(roomName => {
            Memory.rooms[Memory.reservedRooms[roomName]].reservedRooms[roomName] = Memory.reservedRooms[roomName]
        })

        // Clear out any cached paths for non-reserved rooms.
        Object.keys(Memory.cachedPath).forEach(packedRoomName => {
            let roomName = unpackRoomName(packedRoomName);
            if (!RoomIntel.getMyManagement(roomName)) {
                delete Memory.cachedPath[packedRoomName];
            }
        })

        // Now that reserved rooms are set, clear our stats for the next run.
        CpuManager.clear();

        // For each reserved room, save the path from the sapwn room to the reserved room.
        // This information is used in processing defense information.
        this.reportReservedRooms();
    }

    reportReservedRooms() {
        console.log(
            '🏙️ Reserved Rooms:', Object.keys(Memory.reservedRooms).length
            , ' Reserve Cost:', this.creepCpuReserveCost.toFixed(1)
            , ' Creep Cap:', this.empireReserveCreepCount.toFixed(1)
        )
        let rooms = _.sortByOrder(GameManager.empireSpawnRoomsActive, [s1 => -s1.reserveCpuCost, s2 => -s2.reservedRoomNames.length, s3 => s3.name]);
        rooms.forEach(room => {
            console.log('🏡', room.print, ' Max Creeps:', room.maxReserveCreepCapacity, ' Max Cpu:', room.maxReserveCpuCapacity, ' Used Cpu:', room.reserveCpuCost.toFixed(1), ' Rooms:', room.reservedRoomNames.length, '=>', room.reservedRoomNames.map(m => utils.getRoomHTML(m)))
        });
    }

    /**
     * All active spawn rooms. Exclude noreserve and temple flagged rooms.
     */
    get spawnRoomsReserving() {
        if (typeof this._spawnRoomsReserving === "undefined") {
            this._spawnRoomsReserving = GameManager.empireSpawnRoomsActive.filter(f =>
                // Room marked with no reserve flag.
                !f.noReserve

                // Room is a temple, they can't reserve.
                && !f.isTemple
            );
        }
        return this._spawnRoomsReserving;
    }

    get empireReserveCreepCount() {
        // Uncached as this will change in one tick.
        return _.sum(this.spawnRoomsReserving, s => s.reserveCreeps || 0);
    }

    get creepCpuReserveCost() {
        if (typeof this._creepCpuReserveCost === "undefined") {
            this._creepCpuReserveCost = Config.params.CREEP_CPU_RESERVE_COST;
            const markupIncrement = 0.05;
            if (FlagManager.creepcpureserveFlag) {
                this._creepCpuReserveCost = 0.2 + (C.COLOR_TO_NUMBER[FlagManager.creepcpureserveFlag.color] * markupIncrement);
            }
        }
        return this._creepCpuReserveCost;
    }

    /**
     * Note this is PLURAL rooms and will process all rooms we own.
     */
    createReservedRoomsSourceTrails(options) {
        // Get our list of rooms that will be reserving.
        let spawnRooms = this.spawnRoomsReserving;

        // Once all reserved rooms are defined, create source trails for them.
        // This may not do any good on freshly reserved rooms, but will help when reserved rooms are refreshed.
        // Also oxen have a step to create trails for the work room they are in, if it doesn't have one created yet.
        spawnRooms.forEach(room => {
            room.createReservedRoomSourceTrails(options);
        })
    }

    reservedRoomNeedsScout(reservedRoomName) {
        let reservedRoom = Game.rooms[reservedRoomName];

        return !!(
            // Non visible reserved room.
            !reservedRoom

            // Just need one scout in the room.
            && (CreepManager.getScoutsByWorkRoom(reservedRoomName).length < 1)
        );
    }

    reservedRoomNeedsPaladin(spawnRoomName, reservedRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];
        let reservedRoom = Game.rooms[reservedRoomName];

        return !!(
            // Valid spawn room.
            spawnRoom

            // Visible reserved room.
            && reservedRoom

            // Does the room need a paladin?
            && reservedRoom.roomNeedsPaladin
        );
    }

    reservedRoomNeedsExecutioner(spawnRoomName, reservedRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];

        return !!(
            // Valid spawn room.
            spawnRoom

            // Only applicable to SK rooms.
            && Cartographer.isSKRoom(reservedRoomName)

            // It is okay to send while invaders or other players hostile creeps are in room, but not invaderStrongholds.
            && !RoomIntel.getStrongholdInvaderCoreHitsByRoomName(reservedRoomName)

            // Does the room need a executioner?
            // We will stick one executioner per source, so they don't have to move.
            // Also if we are mining the room, then we need 1 more to guard the mineral.
            && (CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(reservedRoomName).length < 1)
        );
    }

    reservedRoomKeeperLairsNeedingExecutioner(spawnRoomName, reservedRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];
        if (!spawnRoom) return [];
        let reservedRoom = Game.rooms[reservedRoomName];
        if (!reservedRoom) return [];

        let executioners = CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(reservedRoomName);
        let lairs = [];
        if (FlagManager.skmFlags[reservedRoomName]) {
            lairs = reservedRoom.keeperLairs;
        } else {
            lairs = reservedRoom.keeperLairs.filter(f => f.resource.id !== f.room.mineral.id)
        }
        return lairs.filter(lair => !executioners.find(executioner => executioner.focusId && (executioner.focusId === lair.id)))
    }

    reservedRoomNeedsCollier(spawnRoomName, reservedRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];
        let reservedRoom = Game.rooms[reservedRoomName];

        return !!(
            // Valid spawn room.
            spawnRoom

            // Visible reserved room.
            && reservedRoom

            // Does the room need a paladin?
            && reservedRoom.roomNeedsCollier
        );
    }

    reservedRoomNeedsPreacher(spawnRoomName, reservedRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];
        let reservedRoom = Game.rooms[reservedRoomName];

        // No idea if we need a preacher, need to wait until we have visibility.
        if (!reservedRoom) return false;
        if (!reservedRoom.controller) return false;

        let preachers = CreepManager.getPreachersByFocusId(reservedRoom.controller.id).length;
        let preacherTicks = CreepManager.getPreacherTicksByFocusId(reservedRoom.controller.id);

        // Upper bound of 8 parts (600*8=4800) without potentially wasting ticks.
        let maxClaimParts = Math.min(spawnRoom.preacherClaimParts, 8);
        // Subtract one tick for natural decay.
        let claimTicks = maxClaimParts - 1;

        return !!(
            // Valid spawn room.
            spawnRoom

            // Visible reserved room.
            && reservedRoom
            && reservedRoom.controller
            && !reservedRoom.my

            && ((reservedRoom.controller.upgradeBlocked || 0) < CREEP_CLAIM_LIFE_TIME)  // Can't attack when this flag is up.

            // Minimum level to create preachers 3, but 4 is the level with any effect.
            // We will wait until 5 to start reserving tho to keep cpu down.
            && (spawnRoom.atSpawningEnergyCapacityForLevel(Config.params.RESERVE_PREACHER_LEVEL))

            // We can send more preachers at lower levels if needed.
            && (preachers < reservedRoom.controller.nipsFree.length)

            // Don't bother fighting with the invader core for reserved ticks.
            && !RoomIntel.getInvaderCore(reservedRoomName)

            // Is there danger in the room? Including spawns.
            && !RoomIntel.getLethalHostilesTTL(reservedRoomName)
            && !RoomIntel.hasDangerousStructures(reservedRoomName)

            && (
                // Reserving logic. Don't spawn more than what the reserve limit on the controller can hold.
                // Also if we have halted spawning, OR we have oxen still active in this room.
                (
                    !spawnRoom.haltSpawning
                    // Room is free and clean, reserve away!
                    && (reservedRoom.reservedByNobody || reservedRoom.reservedByMe)
                    // Want at least one preacher, and give them time to spawn and walk to the work room.
                    && (reservedRoom.reservedByMeTicksFree + 50 > preacherTicks + (CREEP_CLAIM_LIFE_TIME * claimTicks))
                )

                // Attacking logic.
                // https://screeps.com/forum/topic/3108/creep-upgradecontroller-ok
                // Claim creeps only live 600 ticks.
                // Attacking rooms owned by someone else can only be attacked once (on the same tick) every 1000 ticks.
                // So lets send as many preachers as there are nips around controller, then attack all at once. Then they can suicide.
                || (
                    reservedRoom.ownedByOther
                )
                || (
                    (preachers < 1)
                    && reservedRoom.reservedByOther
                )

                // Cleanup logic.
                || (
                    (preachers < 1)
                    && reservedRoom.canRoomBeClaimed
                )
            )
        );
    }

    reservedRoomNeedsFarmer(reservedRoomName) {
        return !!(
            // Visible reserved room.
            !RoomIntel.getHostileManagement(reservedRoomName)

            // Is there danger in the room?
            && !RoomIntel.getLethalRoom(reservedRoomName)

            // Do we have an executioner in the room?
            && (
                !Cartographer.isSKRoom(reservedRoomName)
                || CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(reservedRoomName).length
            )

            // Are the farmers in the room below the number of sources?
            // Farmers will harvest at a source even with no container. This will speed up building.
            && this.reservedRoomSourcesNeedingFarmer(reservedRoomName).length
        );
    }

    reservedRoomSourcesNeedingFarmer(reservedRoomName) {
        let reservedRoom = Game.rooms[reservedRoomName];
        if (!reservedRoom) return [];

        return reservedRoom.reachableSources.filter(source =>
            (_.sum(CreepManager.getFarmersNotNeedingReplacementByFocusId(source.id).map(m => m.harvestSourceBasePower)) < (source.energyCapacity / ENERGY_REGEN_TIME))
            && (CreepManager.getFarmersNotNeedingReplacementByFocusId(source.id).length < source.nips.length)
        );
    }

    reservedRoomNeedsScavenger(spawnRoomName, reservedRoomName) {
        return !!(
            // This is an SK only process of picking up all the scraps left over in the room.
            Cartographer.isSKRoom(reservedRoomName)

            // Is there danger in the room?
            && !RoomIntel.getLethalRoom(reservedRoomName)

            // 1 scavenger per room distance.
            && (CreepManager.getScavengersByWorkRoom(reservedRoomName).length < Cartographer.findRouteDistance(spawnRoomName, reservedRoomName))
        );
    }

    reservedRoomNeedsOx(spawnRoomName) {
        let spawnRoom = Game.rooms[spawnRoomName];
        //let reservedRoom = Game.rooms[reservedRoomName];

        return !!(
            // Valid spawn room.
            spawnRoom

            // Don't spawn multiple at a time, results in over-capacity.
            && !spawnRoom.isOxSpawning

            // Do we have any unassigned ox? If so, don't add any more.
            // These could be napping.
            && !spawnRoom.myIdleOxenSorted.length

            // Is there a room that needs an ox?
            && spawnRoom.reservedRoomSourceContainerData.length

            && (
                // Oxen is actually in this room right now, unloading or idle.
                !CreepManager.getOxenByWorkRoom(spawnRoomName)
                // We now have a queue of at least 2 containers.
                || spawnRoom.hasQueueForReservedRoomSources
            )
        );
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(ReserveManager, 'ReserveManager');

module.exports = ReserveManager;
