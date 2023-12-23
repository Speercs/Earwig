"use strict";

module.exports = function() {

    Room.prototype.manageSpawn = function() {
        // Shorthand.
        let room = this;

        // Flag for indicating that a spawn was OK and no more spawn processing should occur.
        let creepSpawned = false;

        // Scouts are made for several reasons, but only need 1 per room.
        // We need to keep track of them so more than one isn't created in the loop.
        let scoutRooms = {};
        let peonRooms = {};
        let executionerRooms = {};
        let paladinRooms = {};
        let preacherRooms = {};

        // The master break out label; if a required creep is needed to spawn but doesnt, then break creepSpawnedLabel
        creepSpawnedLabel: {

            // Master bailout switch.  Bad juju!
            if (GameManager.haltShutdown) {
                room.logRoom('halting shutdown')
                break creepSpawnedLabel;
            }

            // No colony flag, don't spawn anything else the directions will be all screwed up.
            if (!room.colonyFlag && !room.templeFlag) {
                room.logRoom('halting no colony or temple flag')
                break creepSpawnedLabel;
            }

            // Unclaim room switch, to allow graceful unclaiming.
            if (room.unclaimFlag) {
                room.logRoom('halting unclaim')
                break creepSpawnedLabel;
            }

            // Nuke inbound, don't bother making any more creeps or they just get radiated in utero.
            if (room.haltSpawningNukeImminent) {
                room.logRoom('halting nuke imminent', '🍄')
                break creepSpawnedLabel;
            }

            // Temples need jesters to keep everyone happy!
            if (room.colonySpawn1 && room.colonyNeedsJester) {
                room.logRoom('needs home jester')
                // Other creeps could be standing on our position (at least temporarily).
                let jesterPos = room.colonyJesterPositions.find(f => !f.lookForCreep() || (f.lookForCreep().role !== Config.roles.JESTER));
                if (jesterPos) {
                    creepSpawned = (room.colonySpawn1.createCreepJester(room.controller.id, jesterPos) === OK);
                    if (creepSpawned) break creepSpawnedLabel;
                }
            }

            if (room.isTemple) {
                // DO NOT SPAWN ANYTHING PAST THIS POINT WHEN A TEMPLE!!!
                break creepSpawnedLabel
            }

            // Can only spawn kings from the primary colony spawn spot.
            if (room.colonySpawn1 && !room.colonySpawn1.spawning && room.colonyNeedsKing) {
                room.logRoom('needs home king');
                let emergencySpawn = !room.myStorage || !room.myStorage.store.getUsedCapacity(RESOURCE_ENERGY);
                creepSpawned = (room.colonySpawn1.createCreepKing(room.controller.id, emergencySpawn) === OK);
                //break creepSpawnedLabel;
                if (creepSpawned) break creepSpawnedLabel;
            }

            // Queens only spawn from the 2nd spawn, so do them outside of the main loop.
            if (room.colonySpawn2 && !room.colonySpawn2.spawning && room.colonyNeedsQueen) {
                room.logRoom('needs home queen');
                creepSpawned = (room.colonySpawn2.createCreepQueen(room.controller.id) === OK);
                //break creepSpawnedLabel;
                if (creepSpawned) break creepSpawnedLabel;
            }

            // Emergency cancel spawn flag.
            if (FlagManager.cancelspawn && (FlagManager.cancelspawn.pos.roomName === room.name)) {
                room.spawns.filter(f => f.spawning).forEach(spawn => {
                    spawn.spawning.cancel();
                })
                room.logRoom('cancelspawn flag present');
                break creepSpawnedLabel;
            }

            // Find the first spawn that isn't busy. We only need one, as we can only spawn one creep per tick anyway.
            // Sort by their power creep spawn effect remaining time, so the quicker spawns run more often.
            let spawns = room.spawnsNotSpawning;
            spawns = _.sortByOrder(spawns, [
                // First is to see if any spawn has been powered up.
                sortBoostedSpawn => sortBoostedSpawn.operateSpawnTicksRemaining ? -sortBoostedSpawn.operateSpawnTicksRemaining : 0
                // Secondly prefer NOT colonySpawn1, as the King can only renew from colonySpawn1.
                // The Queen will renew from either colonySpawn2 or colonySpawn3.
                , sortSpawnNumber => (room.colonySpawn1 && (room.colonySpawn1.id === sortSpawnNumber.id)) ? 1 : 0
            ]);
            let spawn = null;

            let getNextSpawn = function() {
                if (!spawns.length) return false;
                spawn = spawns[0];
                spawns.splice(0, 1);
                return true;
            }

            let getFreeSpawns = function() {
                return spawns.length;
            }

            // Initialize our spawn variable.
            if (!getNextSpawn()) {
                room.logRoom('all spawns busy');
                break creepSpawnedLabel;
            }

            // Main spawn loops for creating new spawns.

            if (room.colonyNeedsGnome) {
                room.logRoom('needs home gnome')
                creepSpawned = (spawn.createCreepGnome(room.name, room.controller.id) === OK);
                if (creepSpawned) break creepSpawnedLabel;
            }

            if (room.colonyNeedsFencer) {
                room.logRoom('needs home fencer')
                creepSpawned = (spawn.createCreepFencer(room.name, room.controller.id) === OK);
                if (creepSpawned) break creepSpawnedLabel;
            }

            if (room.roomNeedsRook) {
                room.logRoom('needs home rook');
                let emergencySpawn = !CreepManager.getLlamasByFocusId(room.controller.id).length && !CreepManager.getPeonsByFocusId(room.controller.id).length
                if (room.nonKingEnergyFull || emergencySpawn) {
                    creepSpawned = (spawn.createCreepRook(room.controller.id, emergencySpawn) == OK);
                }
                break creepSpawnedLabel;
            }

            if (room.roomNeedsPeon) {
                room.logRoom('needs home peon');
                let emergencySpawn = !CreepManager.getPeonsByFocusId(room.controller.id).length;
                creepSpawned = (spawn.createCreepPeon(room.name, room.name, room.controller.id, emergencySpawn) == OK);
                if (creepSpawned) peonRooms[room.name] = true;
                break creepSpawnedLabel;
            }

            if (GameManager.haltStop) {
                // DO NOT SPAWN ANYTHING PAST THIS POINT WHEN HALTING!!!
                room.logRoom("halting stop");
                break creepSpawnedLabel;
            }

            if (room.roomNeedsPikeman) {
                room.logRoom('needs pikeman')
                // Spawn defender in this room if we have local hostiles.
                creepSpawned = (spawn.createCreepPikeman(room.name) === OK);
                break creepSpawnedLabel;
            }

            if (room.roomNeedsCrossbowman) {
                room.logRoom('needs crossbowman')
                // Spawn defender in this room if we have local hostiles.
                creepSpawned = (spawn.createCreepCrossbowman(room.name) === OK);
                break creepSpawnedLabel;
            }

            if (room.roomNeedsArcher) {
                room.logRoom('needs home archer')
                // Spawn defender in this room if we have local hostiles.
                creepSpawned = (spawn.createCreepArcher(room.name, room.name, room.controller.id) === OK);
                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
            }

            if (room.roomNeedsHound) {
                room.logRoom('needs home hound')
                // Spawn defender in this room if we have local hostiles.
                creepSpawned = (spawn.createCreepHound(room.name, room.name, room.controller.id) === OK);
                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
            }

            if (room.roomNeedsDefender) {
                // DO NOT SPAWN ANYTHING PAST THIS POINT WHEN DEFENDING!!!
                room.logRoom("defending room");
                break creepSpawnedLabel;
            }

            if (room.colonyNeedsLlamaBalance) {
                room.logRoom('needs home balance llama');
                creepSpawned = (spawn.createCreepLlama(room.name, room.controller.id) === OK);
                break creepSpawnedLabel;
            }

            if (room.roomNeedsPeasant) {
                room.logRoom('needs home peasant');
                creepSpawned = (spawn.createCreepPeasant(room.controller.id) === OK);
                break creepSpawnedLabel;
            }

            if (room.colonyNeedsLlamaPower) {
                room.logRoom('needs home power llama');
                creepSpawned = (spawn.createCreepLlama(room.name, room.controller.id) === OK);
                break creepSpawnedLabel;
            }

            // Test to see if our empire needs a new defender for nearby room.
            // We have both ranged and melee class here, both should spawn if needed.
            let defendRoomNameRanger = room.colonyNeedsRanger;
            if (defendRoomNameRanger) {
                room.logRoom('needs empire ranger for ' + utils.getRoomHTML(defendRoomNameRanger));
                //let incomingDamage = RoomIntel.getHostileIncomingRangedAttackPower(defendRoomNameRanger);
                // Spawn defender in this room if we have hostiles in nearby reserved rooms of our empire.
                creepSpawned = (spawn.createCreepRanger(defendRoomNameRanger) === OK);
                break creepSpawnedLabel;
            }

            let defendRoomNameArcher = room.colonyNeedsArcher;
            if (defendRoomNameArcher) {
                room.logRoom('needs empire archer for ' + utils.getRoomHTML(defendRoomNameArcher));
                // Spawn defender in this room if we have hostiles in nearby reserved rooms of our empire.
                creepSpawned = (spawn.createCreepArcher(defendRoomNameArcher, room.name, room.controller.id) === OK);
                break creepSpawnedLabel;
            }

            let defendRoomNameHound = room.colonyNeedsHound;
            if (defendRoomNameHound) {
                room.logRoom('needs empire hound for ' + utils.getRoomHTML(defendRoomNameHound));
                // Spawn defender in this room if we have hostiles in nearby reserved rooms of our empire.
                creepSpawned = (spawn.createCreepHound(defendRoomNameHound, room.name, room.controller.id) === OK);
                break creepSpawnedLabel;
            }

            if (room.colonyAllSpawnsSpawningOrRenewing) {
                // DO NOT SPAWN ANYTHING PAST THIS POINT WHEN RENEWING!!!
                room.logRoom('all spawns busy or renewing');
                break creepSpawnedLabel;
            }

            if (!room.haltSpawning && room.roomNeedsPage) {
                room.logRoom('needs home page');
                creepSpawned = (spawn.createCreepPage(room.name, room.name, room.controller.id) == OK);
                if (creepSpawned) break creepSpawnedLabel;
            }

            if (!room.haltSpawning && !room.colonyUnsafe && room.colonyNeedsMineralMiner) {
                room.logRoom('needs home mineral miner')
                creepSpawned = (spawn.createCreepMiner(room.mineral.id) === OK);
                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
            }

            if (room.okToSpawnAuxiliaryCreep && room.colonyNeedsClerk) {
                room.logRoom('needs home clerk')
                creepSpawned = (spawn.createCreepClerk(room.name, room.controller.id) === OK);
                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
            }

            // SCOUT (FLAG)
            // Spawn scout creeps for specified room.
            if (
                !room.haltSpawning
                && !room.colonyUnsafe
                && room.okToSpawnAuxiliaryCreep
            ) {
                let flags = FlagManager.scoutFlags;
                for (let flag in flags) {
                    let workRoomName = flags[flag].workRoom;

                    if (
                        !scoutRooms[workRoomName]
                        && !CreepManager.getScoutsByWorkRoom(workRoomName).length
                        && room.isClosestAndBestToRoom(workRoomName, { maxDistance:Config.params.CLAIM_ROOM_MAX_DEFEND })
                    ) {
                        room.logRoom('needs scout for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepScout(workRoomName) == OK);
                        if (creepSpawned) scoutRooms[workRoomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // GUARD (FLAG)
            // Spawn watchman creeps for specified room.
            // Color of the flag indicates how many watchment to send.
            if (
                !GameManager.haltSupporting
            ) {
                let flags = FlagManager.guardFlags;
                for (let flag in flags) {
                    let workRoomName = flags[flag].workRoom;

                    if (
                        (CreepManager.getWatchmenByWorkRoom(workRoomName).length < flags[flag].count)
                        && room.isClosestAndBestToRoom(workRoomName, { maxDistance:Config.params.CLAIM_ROOM_MAX_DEFEND })
                    ) {
                        room.logRoom('needs watchman for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepWatchman(workRoomName) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // FOCUS PEON
            // Send a good peon creep to all lower level colonies that need one.
            // Don't make peons if we aren't at our peak controller level, that will effect the quality of the peon.
            if (
                !room.colonyUnsafe
                && room.storageEnergy
                && (room.isBestRoom || room.isChurch)
            ) {

                // Get list of focus rooms including temples, and iterate throught them.
                let rooms = GameManager.empireFocusRooms.filter(f =>
                    // Don't create any of these creeps for ourselves, let others do it.
                    // Any needs this room has are done outside of this block.
                    (f.name !== room.name)
                    // Has to be in focus assist range.
                    && Cartographer.isInRouteDistance(room.name, f.name, Config.params.CHURCH_ASSIST_DISTANCE)
                );
                // Just in case we have multiple rooms at once, which is a bad idea in general.
                rooms = _.sortByOrder(rooms, [
                    sortLevel => sortLevel.level
                    , sortDistance => Cartographer.findRouteDistance(room.name, sortDistance.name)
                ]);

                for (let i = 0; i < rooms.length; i++) {
                    // Set the controller we are working on.
                    let focusRoom = rooms[i];

                    // Check to see if it is safe to send non-combat creeps to this focus room.
                    // This includes to the focus room itself; it doens't have to even be breached.
                    if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, focusRoom.name)) continue;

                    // PEON: Need at least one all purpose peon per room.
                    if (
                        // Spawning used instead of Focus as we need our critical peons to be up.
                        !peonRooms[focusRoom.name]
                        && !room.haltSpawning
                        && room.storageEnergy
                        && (focusRoom.energyCapacityAvailable < room.energyCapacityAvailable)
                        && (
                            focusRoom.roomNeedsPeon
                            || focusRoom.roomNeedsPeonBuilder
                        )
                    ) {
                        room.logRoom('needs focus peon for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepPeon(focusRoom.name, focusRoom.name, focusRoom.controller.id, false) === OK);
                        if (creepSpawned) peonRooms[focusRoom.name] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                }
            }


            // STRONGHOLD
            // Create a flag for nearby stronghold.
            // Level 8 peons only. Needs to be boosted to be effective.
            // Stronghold creeps do not take reflect damage (!?!).
            // Cores will refill energy in towers, and spawn new creeps.
            // Towers will attack closest creep, so retreating does help.
            // Creeps won't leave the ramparts, but will move around under them if room allows.
            // Once core is dead, towers do not appear to fire anymore.
            // Rogues will pickup loot.
            if (
                !room.noStronghold
                && !room.haltSpawning
                && !room.colonyUnsafe
                && room.isCastle
                && room.isSKAccessRoom
                && !room.isTemple
            ) {

                let strongholdRooms = RoomIntel.getStrongholds().filter(f =>
                    // Stronghold needs to be in the same sector as this room.
                    (Cartographer.getSector(f.roomName) === Cartographer.getSector(room.name))
                    // Don't spawn too early, seems to be a glitch where the core deploys a tick before the rest of the stronghold structures.
                    && RoomIntel.getVisited(f.roomName)
                    // Not valid unless we have visited/scanned after its been deployed.
                    && ((f.deployTime + 10) < RoomIntel.getVisited(f.roomName))
                    // We are in walking range to send lancers.
                    && Cartographer.isInRouteDistance(room.name, f.roomName, Config.params.MAX_LANCERS_RANGE)
                    // No hostiles are in this room.
                    && !RoomIntel.getLethalHostilesTTL(f.roomname)
                );

                for (let i=0; i<strongholdRooms.length; i++) {
                    let strongholdRoom = strongholdRooms[i];

                    // Bail out once we stop spawning, or if we already have lancers attacking.
                    if (
                        room.haltSpawning
                        && !CreepManager.getLancersByFocusId(strongholdRoom.id).length
                    ) continue;

                    // For level 4, wait till the stronghold has been nuked down.
                    if (
                        (strongholdRoom.level === 4)
                        && RoomIntel.getStrongholdInvaderCoreHitsByRoomName(strongholdRoom.roomName)
                        && (RoomIntel.getHostileTowerCount(strongholdRoom.roomName) > 0)
                    ) {
                        room.logRoom('invader stronghold ' + utils.getRoomHTML(strongholdRoom.roomName) + ' has too many towers')
                        continue;
                    }

                    // For level 5, wait till the stronghold has been nuked down.
                    if (
                        (strongholdRoom.level === 5)
                        && RoomIntel.getStrongholdInvaderCoreHitsByRoomName(strongholdRoom.roomName)
                        && (RoomIntel.getHostileTowerCount(strongholdRoom.roomName) > 0)
                    ) {
                        room.logRoom('invader stronghold ' + utils.getRoomHTML(strongholdRoom.roomName) + ' has too many towers')
                        continue;
                    }

                    // COLLIER
                    if (
                        Game.rooms[strongholdRoom.roomName]
                        && Game.rooms[strongholdRoom.roomName].roomNeedsCollier
                    ) {
                        room.logRoom('stronghold collier for ' +  utils.getRoomHTML(strongholdRoom.roomName));
                        creepSpawned = (spawn.createCreepCollier(strongholdRoom.roomName) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    else if (
                        // Do not exceed overall count of farming.
                        // Always allowed to have at least one of this type.
                        // But once we started, continue spawning.
                        (
                            CreepManager.getLancersByFocusId(strongholdRoom.id).length
                            || !GameManager.activeStrongholdRoomNames.length
                            || GameManager.farmCountBelowMax
                        )
                        // Lets assume that our lancers can do double damage since they are doing AOE mostly.
                        && (RoomIntel.getStrongholdInvaderMassAttackStructureHitsByRoomName(strongholdRoom.roomName) > (CreepManager.getLancerRangedAttackPowerTTLByFocusId(strongholdRoom.id) * 2))
                    ) {
                        // Bail out if we can't boost a lancer at this level.
                        if (!room.canBoostBodyLancerByLevel(strongholdRoom.level)) continue;

                        room.logRoom('needs lancer' + strongholdRoom.level + ' for ' +  utils.getRoomHTML(strongholdRoom.roomName));
                        switch (strongholdRoom.level) {
                            case 1:
                                creepSpawned = (spawn.createCreepLancer1(strongholdRoom.roomName, strongholdRoom.id) === OK);
                                break;
                            case 2:
                                creepSpawned = (spawn.createCreepLancer2(strongholdRoom.roomName, strongholdRoom.id) === OK);
                                break;
                            case 3:
                                creepSpawned = (spawn.createCreepLancer3(strongholdRoom.roomName, strongholdRoom.id) === OK);
                                break;
                            case 4:
                                creepSpawned = (spawn.createCreepLancer4(strongholdRoom.roomName, strongholdRoom.id) === OK);
                                break;
                            case 5:
                                creepSpawned = (spawn.createCreepLancer5(strongholdRoom.roomName, strongholdRoom.id) === OK);
                                break;
                        }
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // RESERVE SCOUTS (COLONY)
            // Spawn scout creeps for all rooms in range of this room, if they have not been visited recently.
            if (
                !room.haltSpawning
                && !room.colonyUnsafe
                && !room.colonyObserver
                && room.isRoomReadyToReserve
            ) {
                let roomNames = room.getReachableRoomsUnvisited();
                for (let roomName in roomNames) {
                    // Check that the room isn't visible (aka purpose for the scout) and we only need 1 scout.
                    if (
                        !scoutRooms[roomName]
                        && !CreepManager.getScoutsByWorkRoom(roomName).length
                        // We are not purposely avoiding this room.
                        && !FlagManager.avoidFlags[roomName]
                    ) {
                        room.logRoom('needs reserved scout for ' +  utils.getRoomHTML(roomName));
                        creepSpawned = (spawn.createCreepScout(roomName) === OK);
                        if (creepSpawned) scoutRooms[roomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // CRITICAL PEON (FOCUS)
            // Remote focus room needs peon, and we are the closest.
            if (
                !room.haltSpawning
                && !room.colonyUnsafe
                && room.storageEnergy
            ) {

                // Get list of controllers I own, and iterate throught them.
                let rooms = GameManager.empireFocusRooms;

                // Add in any rooms that we have claim flags in but are not yet claimed.
                rooms = rooms.concat(GameManager.empireRoomsToClaimThatAreUnclaimedAndVisible);

                rooms = rooms.filter(focusRoom =>
                    (focusRoom.energyCapacityAvailable < room.energyCapacityAvailable)
                    && !peonRooms[focusRoom.name]
                    && !focusRoom.colonyBreached
                    && focusRoom.roomNeedsPeon
                    && room.isClosestAndBestToRoom(focusRoom.name, { minLevel: 3, bestOf: false, maxDistance: Config.params.FOCUS_ASSIST_DISTANCE })
                );

                // Just in case we have multiple focus rooms at once, which is a bad idea in general.
                rooms = _.sortBy(rooms, s => Cartographer.findRouteDistance(room.name, s.name));

                for (let i = 0; i < rooms.length; i++) {
                    // Set the controller we are working on.
                    let focusRoom = rooms[i];

                    room.logRoom('needs critical peon for ' +  utils.getRoomHTML(focusRoom.name));
                    creepSpawned = (spawn.createCreepPeon(focusRoom.name, focusRoom.name, focusRoom.controller.id, false) === OK);
                    if (creepSpawned) peonRooms[focusRoom.name] = true;
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }

            }


            // BUILDER CREEP - CRITICAL (COLONY)
            // Ensure at least one construction worker for local room repair and construction.
            if (
                !room.haltSpawning
                && !CreepManager.getBuildersByFocusId(room.controller.id).length
            ) {
                // MASON creeps.
                if (
                    room.roomNeedsMason
					// Is this room capable of boosting, and do we have ample enough in the colony to do this?
					&& room.hasBoostStructures
					&& room.canBoostBodyMason()
                ) {
                    room.logRoom('needs critical mason')
                    creepSpawned = (spawn.createCreepMason(room.name, room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
                // CARPENTER creeps.
                else if (
                    room.roomNeedsCarpenter
                ) {
                    room.logRoom('needs critical carpenter')
                    creepSpawned = (spawn.createCreepCarpenter(room.name, room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
            }


            // CONTROLLER UPGRADERS (COLONY)
            // Any type of controller upgrade for this colony's use.
            if (
                !room.haltSpawning
                && !room.colonyUnsafe
            ) {
                // PROPHET creeps.
                if (room.roomNeedsProphet) {
                    room.logRoom('needs home prophet')
                    creepSpawned = (spawn.createCreepProphet(room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
                // CRIER creeps.
                else if (room.roomNeedsCrier) {
                    room.logRoom('needs home crier')
                    creepSpawned = (spawn.createCreepCrier(room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
            }


            // CLAIM/ASSAULT (REMOTE)
            // Spawn small claim creeps for specified room.
            // Assault/defend/dismantle rooms as needed.
            if (
                !room.noAssault
                && !room.haltSpawning
                && !room.isTemple
            ) {
                // Get all rooms we want to poentially assault from this room.
                let workRoomNames = GameManager.getRoomsToAssault(room.name);

                for (let workRoomName of workRoomNames) {
                    // Shorthand.
                    let workRoom = Game.rooms[workRoomName];

                    // SCOUTS FIRST
                    if (
                        // Do we have no visibility into this room?
                        !workRoom
                        // Don't get blown out by towers.
                        && !RoomIntel.getHostileTowerCount(workRoomName)
                        // Already have a scout for this room for other reasons.
                        && !scoutRooms[workRoomName]
                        // Creep limit per room.
                        && !CreepManager.getScoutsByWorkRoom(workRoomName).length
                        // Best room check.
                        && room.isClosestAndBestToRoom(workRoomName, { minLevel:3, maxDistance:Config.params.CLAIM_ROOM_MAX_DISTANCE, bestOf:false, atSpawningEnergyCapacityForCurrentLevel:false })
                        //&& Cartographer.isInRouteDistance(room.name, workRoomName, Config.params.CLAIM_ROOM_MAX_DISTANCE)
                    ) {
                        room.logRoom('needs assault scout for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepScout(workRoomName) == OK);
                        if (creepSpawned) scoutRooms[workRoomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // Check to see if it is safe to send non-combat creeps to this focus room.
                    let hasHostilesInRouteCombatPower = GameManager.doesRoomHaveLethalPlayerHostilesInRoute(room.name, workRoomName);

                    // DEACON
                    let incomingDamage = RoomIntel.getHostileIncomingRangedAttackPower(workRoomName);
                    if (
                        room.isCastle
                        && (
                            // Boosted hostiles in the room is bad news! Hunt them down.
                            RoomIntel.getLethalBoostedPlayerHostilesTTL(workRoomName)
                            // We are sending a deacon if there are hostile towers in the room.
                            || RoomIntel.getHostileTowerCount(workRoomName)
                            // The enemy has tons of healing.
                            || (
                                CreepManager.getWatchmenByWorkRoom(workRoomName).length
                                //&& (CreepManager.getGuardianCombatPowerByWorkRoom(workRoomName) < hasHostilesInRouteCombatPower)
                                && (hasHostilesInRouteCombatPower > (15 * 10 * 10))
                            )
                            || (RoomIntel.getMy(workRoomName) && !workRoom.isTemple)
                        )
                        // Deacon can handle towers.
                        && (
                            // Defend my rooms.
                            (
                                RoomIntel.getMy(workRoomName)
                                // To ensure script doesn't break.
                                && workRoom
                                && !workRoom.safeMode
                            )
                            // Or total incoming attack is <= 6 towers, we can handle it.
                            || (incomingDamage <= (TOWER_POWER_ATTACK * 6))
                        )
                        // Creep limit per room.
                        && (
                            (
                                // Attacking other room. Allow several deacons to deal with towers.
                                !RoomIntel.getMyManagement(workRoomName)
                                // Max out at towers/spawn count. No spawns or towers, then you get no deacon.
                                && (CreepManager.getDeaconsByWorkRoom(workRoomName).length < Math.min(Config.params.MAX_DEACONS_PER_ASSAULT, Math.max((RoomIntel.getHostileTowerCount(workRoomName) || 0), (RoomIntel.getHostileSpawnCount(workRoomName) || 0), ((RoomIntel.getLevel(workRoomName) >= 6) ? 1 : 0))))
                            )
                            || (
                                // Defending one of our rooms. Should only need one.
                                RoomIntel.getMyManagement(workRoomName)
                                && RoomIntel.getLethalBoostedPlayerHostilesTTL(workRoomName)
                                && !CreepManager.getDeaconsByWorkRoom(workRoomName).length
                            )
                            || (
                                // Critical defend situation, colony has been breached; try to recover with more deacons.
                                RoomIntel.getMy(workRoomName)
                                // To ensure script doesn't break.
                                && workRoom
                                && workRoom.colonyBreached
                                && (CreepManager.getDeaconsByWorkRoom(workRoomName).length < Config.params.MAX_DEACONS_PER_DEFEND)
                            )
                            || (
                                // Always have a boosted deacon in a room that is on safemode cooldown. Something bad had happened.
                                RoomIntel.getMy(workRoomName)
                                // To ensure script doesn't break.
                                && workRoom
                                && !workRoom.safeMode
                                && workRoom.colonyBreachedByPlayerTime
                                && !CreepManager.getDeaconsByWorkRoom(workRoomName).length
                            )
                        )
                        // Can this room actually boost a deacon?
                        && room.canBoostBodyDeacon({ incomingDamage: RoomIntel.getMy(workRoomName) ? 0 : incomingDamage })
                        && room.isClosestAndBestToRoom(workRoomName, { minLevel:8, includeSpawning:true, maxDistance:Config.params.CLAIM_ROOM_MAX_DEFEND, boostRole:Config.roles.DEACON, boostRoleIncomingDamage:incomingDamage })
                    ) {
                        room.logRoom('needs assault deacon for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepDeacon(workRoomName, { incomingDamage: RoomIntel.getMy(workRoomName) ? 0 : incomingDamage }) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // Determine if we are the closest room. This will be used over and over below.
                    let isClosestAndBestToRoom = room.isClosestAndBestToRoom(workRoomName, { minLevel:8, maxDistance:Config.params.CLAIM_ROOM_MAX_DISTANCE })

                    // SWORDSMAN/CLERIC
                    if (
                        room.isCastle
                        // Room is not ours, so watchman will not roam.
                        && RoomIntel.getMy(workRoomName)
                        // To ensure script doesn't break.
                        && workRoom
                        // Is our room on safe mode cooldown?
                        && !workRoom.safeMode
                        && workRoom.colonyBreachedByPlayerTime
                        // Must have a deacon already in play.
                        && CreepManager.getDeaconsByWorkRoom(workRoomName).length
                        // This is a duo priest/knight.
                        && !CreepManager.getSwordsmenByWorkRoom(workRoomName).length
                        // These are big creeps that take a long time to spawn. Get closest room will help.
                        && isClosestAndBestToRoom
                        // Can we boost this group?
                        && room.canBoostGroup('sword_and_board_boosted')
                    ) {
                        room.logRoom('needs assault swordsman for ' +  utils.getRoomHTML(workRoomName));
                        room.logRoom('needs assault cleric for ' +  utils.getRoomHTML(workRoomName));
                        if ((getFreeSpawns() < 2) || !room.nonKingEnergyFull) break creepSpawnedLabel;

                        creepSpawned = (spawn.createCreepSwordsman(workRoomName) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                        creepSpawned = (spawn.createCreepCleric(workRoomName) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                        // Break out of this one just so more creeps don't try to spawn.
                        break creepSpawnedLabel;
                    }

                    // WATCHMEN
                    if (
                        room.isCastle
                        // Room is not ours, so watchman will not roam.
                        // Is room under control of other player or are there dangerous hostiles in room?
                        && (
                            (RoomIntel.getMy(workRoomName) && !workRoom.isTemple)
                            || RoomIntel.getOtherPlayerManagement(workRoomName)
                            || (
                                !RoomIntel.getMy(workRoomName)
                                && RoomIntel.getDangerousHostilesTTL(workRoomName)
                            )
                        )
                        // Don't get blown out by towers. Unless all spawns are down.
                        && (
                            !RoomIntel.getHostileTowerCount(workRoomName)
                            || !RoomIntel.getHostileSpawnCount(workRoomName)
                        )
                        // Creep limit per room. 1 per normal room, more if current property of other player or if there are roadblocks along the way.
                        && (
                            (
                                !RoomIntel.getMy(workRoomName)
                                && !CreepManager.getWatchmenByWorkRoom(workRoomName).length
                            )
                            || (
                                RoomIntel.getOtherPlayerManagement(workRoomName)
                                && (CreepManager.getGuardianRangedAttackPowerByWorkRoom(workRoomName) <= RoomIntel.getHostileIncomingHealPower(workRoomName))
                            )
                            || (CreepManager.getGuardianCombatPowerByWorkRoom(workRoomName) < (hasHostilesInRouteCombatPower * Config.params.WATCHMEN_HOSTILE_MULTIPLIER))

                            // Always have lots of watchmen in a room that is on safemode cooldown. Something bad had happened.
                            || (
                                RoomIntel.getMy(workRoomName)
                                // To ensure script doesn't break.
                                && workRoom
                                && !workRoom.safeMode
                                && workRoom.colonyBreachedByPlayerTime
                                && RoomIntel.getSafeModeCooldownExpiresTime(workRoomName)
                                && (CreepManager.getWatchmenByWorkRoom(workRoomName).length < Config.params.MAX_WATCHMEN_DURING_SAFEMODE)
                            )
                        )
                        // These are big creeps that take a long time to spawn. Get closest room will help.
                        && isClosestAndBestToRoom
                    ) {
                        room.logRoom('needs assault watchman for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepWatchman(workRoomName) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // KNIGHT/PRIEST
                    if (
                        room.isCastle
                        // Room is not ours, so creeps will not roam.
                        && !RoomIntel.getMy(workRoomName)
                        // Are there dangerous hostiles in room?
                        && (
                            RoomIntel.getDangerousHostilesTTL(workRoomName)
                            || hasHostilesInRouteCombatPower
                        )
                        // Don't get blown out by towers. Unless all spawns are down.
                        && (
                            !RoomIntel.getHostileTowerCount(workRoomName)
                            || !RoomIntel.getHostileSpawnCount(workRoomName)
                        )
                        // Creep limit per room. 1 per normal room, 1 if current property of other player.
                        && (
                            !CreepManager.getKnightsByWorkRoom(workRoomName).length
                            || (
                                RoomIntel.getOtherPlayerManagement(workRoomName)
                                && (CreepManager.getKnightsByWorkRoom(workRoomName).length < ((hasHostilesInRouteCombatPower || PlayerManager.isEnemy(RoomIntel.getOwner(workRoomName))) ? Config.params.MAX_KNIGHTS_PER_ENEMY : Config.params.MAX_KNIGHTS_PER_DEFEND))
                            )
                        )
                        // These are big creeps that take a long time to spawn. Get closest room will help.
                        && isClosestAndBestToRoom
                    ) {
                        room.logRoom('needs assault knight for ' +  utils.getRoomHTML(workRoomName));
                        room.logRoom('needs assault priest for ' +  utils.getRoomHTML(workRoomName));

                        // Bail out if we are trying to boost a swordsman and a cleric at same time.
                        if ((getFreeSpawns() < 2) || !room.nonKingEnergyFull) break creepSpawnedLabel;

                        creepSpawned = (spawn.createCreepKnight(workRoomName) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                        creepSpawned = (spawn.createCreepPriest(workRoomName) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                        // Break out of this one just so more creeps don't try to spawn.
                        break creepSpawnedLabel;
                    }

                    // ARCHERS
                    if (
                        room.isCastle
                        // Room has to be ours to get an archer.
                        && RoomIntel.getMy(workRoomName)
                        // To ensure script doesn't break.
                        && workRoom
                        // But cannot be a temple (don't need any defense on temples by defition).
                        && !workRoom.isTempleCandidate
                        // Once room has a terminal, it should no longer need defense.
                        && !workRoom.myTerminal
                        // Creep limit per room.
                        && (CreepManager.getArchersByFocusId(workRoom.controller.id).length < Config.params.MAX_ARCHERS_PER_ASSIGNEDROOM)
                        // These are big creeps that take a long time to spawn. Get closest room will help.
                        && isClosestAndBestToRoom
                    ) {
                        room.logRoom('needs defend archer for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepArcher(workRoomName, workRoomName, workRoom.controller.id) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // HOUND
                    if (
                        room.isCastle
                        // Room has to be ours to get an archer.
                        && (RoomIntel.getMy(workRoomName) && !workRoom.isTemple)
                        // Once room has a terminal, it should no longer need defense.
                        && workRoom
                        && !workRoom.myTerminal
                        // Only send supplementary hound if we actually have creeps in the room.
                        && RoomIntel.getDangerousHostilesTTL(workRoomName)
                        // Creep limit per room.
                        && (CreepManager.getHoundsByFocusId(workRoom.controller.id).length < Config.params.MAX_HOUNDS_PER_ASSIGNEDROOM)
                        // These are big creeps that take a long time to spawn. Get closest room will help.
                        && isClosestAndBestToRoom
                    ) {
                        room.logRoom('needs defend hound for ' +  utils.getRoomHTML(workRoomName));
                        creepSpawned = (spawn.createCreepHound(workRoomName, workRoomName, workRoom.controller.id) === OK);
                        if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // Check to see if it is safe to send non-combat creeps to this focus room.
                    if (hasHostilesInRouteCombatPower) continue;

                    // SAPPER/COLLIER
                    if (
                        room.isCastle
                        // Is the room invisible and not owned by me?
                        && workRoom
                        && !RoomIntel.getMy(workRoomName)
                        && !RoomIntel.getLastHostileAttack(workRoomName)
                        // Note that this should be the closest max room, as autonuke flags on barriers are setup in the direction.
                        && isClosestAndBestToRoom
                    ) {
                        // And finally do the check to see that a boosted creep is actually needed.
                        if (
                            workRoom.roomNeedsSapper
					        // Do we have the boosts for this creep?
                            && room.canBoostBodySapper()
                        ) {
                            room.logRoom('needs claim sapper for ' +  utils.getRoomHTML(workRoomName));
                            creepSpawned = (spawn.createCreepSapper(workRoomName) === OK);
                            if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;

                        // And finally do the check to see that a normal creep is actually needed.
                        } else if (
                            workRoom.roomNeedsCollier
                        ) {
                            room.logRoom('needs claim collier for ' +  utils.getRoomHTML(workRoomName));
                            creepSpawned = (spawn.createCreepCollier(workRoomName) === OK);
                            if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                        }
                    }

                    // PALADIN
                    if (
                        room.isChurch
                        // Is the room invisible and not owned by me?
                        && workRoom
                        // Note that this should be the closest max room, as autonuke flags on barriers are setup in the direction.
                        && isClosestAndBestToRoom
                        // Does the room need a paladin?
                        && workRoom.roomNeedsPaladin
                    ) {
                        room.logRoom('needs assault paladin for ' +  utils.getRoomHTML(workRoomName));
                        // If there is an invader core, send paladin to destroy it (can't be dismantled).
                        let invaderCoreId = RoomIntel.getInvaderCore(workRoomName);
                        creepSpawned = (spawn.createCreepPaladin(workRoomName, invaderCoreId) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // PREACHERS
                    if (
                        // Only one preacher per room per tick.
                        !preacherRooms[workRoomName]

                        // Is the room invisible and not owned by me?
                        && workRoom
                        && workRoom.controller
                        && !workRoom.controller.my
                        // Is this room fortified before we start sending out expensive preachers?
                        && room.isFortified
                        && (room.controller.level >= 3)
                        && ((workRoom.controller.upgradeBlocked || 0) < CREEP_CLAIM_LIFE_TIME)
                        && (
                            // Need to have some protection in room if its dangerous.
                            !workRoom.isDangerousRoom
                            || CreepManager.getGuardiansByWorkRoom(workRoomName).length
                        )
                        && (
                            // We send preachers to attack controllers owned by others (not when owned by no-one),
                            // or when we want to claim the room for ourselves,
                            // or when the room has hostile structures in it and we want to do the claim/destroy/unclaim process.
                            workRoom.ownedByOther
                            || workRoom.doClaimRoom
                            || workRoom.canRoomBeClaimed // includes shouldRoomBeClaimedToClean
                        )
                        && (
                            !RoomIntel.getLastHostileAttack(workRoomName)
                            || (
                                !RoomIntel.getLethalHostilesTTL(workRoomName)
                                && CreepManager.getGuardiansByWorkRoom(workRoomName).length
                            )
                        )
                        && !workRoom.destroyFlagsController.length
                        // Preachers only live 600 ticks, so be smart about who when send.
                        // A weak preacher is fine if room isn't owned by hostiles.
                    ) {
                        // Determine how many claim parts we want. If it is unowned, then we only need 1 part to claim it.
                        let claimParts = (workRoom.myProperty || !workRoom.otherManagement) && (!workRoom.claimFlag || workRoom.isTempleCandidate) ? 1 : MAX_CREEP_SIZE;
                        let maxPreachers = workRoom.otherManagement ? workRoom.controller.nipsWalkable.length : 1;

                        let isClosestRoom = false;
                        if (CreepManager.getPreachersByFocusId(workRoom.controller.id).length < maxPreachers) {
                            // Determine if the last (or only) spot is reserved for the closest room.
                            if (CreepManager.getPreachersByFocusId(workRoom.controller.id).length < maxPreachers - 1) {
                                isClosestRoom = Cartographer.isInRouteDistance(room.name, workRoomName, Config.params.CLAIM_ROOM_MAX_DISTANCE);
                            }
                            else {
                                isClosestRoom = room.isClosestAndBestToRoom(workRoomName, { minLevel:3, includeSpawning:false, maxDistance:Config.params.CLAIM_ROOM_MAX_DISTANCE, bestOf:Game.rooms[workRoomName].otherManagement })
                            }

                            if (isClosestRoom) {
                                room.logRoom('needs assault preacher for ' +  utils.getRoomHTML(workRoomName));
                                let focusId = workRoom.controller.id;
                                let options = { claimParts: claimParts }
                                creepSpawned = (spawn.createCreepPreacher(workRoomName, focusId, options) === OK);
                                if (creepSpawned) preacherRooms[workRoomName] = true;
                                if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;
                            }
                        }
                    }

                }
            }


            // RESERVED ROOMS (COLONY).
            // The money makers of our operation.
            if (
                !room.colonyUnsafe
                && room.isRoomReadyToReserve
            ) {

                // Get a sorted list of rooms that this room have reserve flags for.
                let reservedRooms = room.reservedRoomNames;

                // RESERVE oxen.  As these are managed as a group, put the test after the rest of the dedicated creeps.
                // Only one at a time will spawn to not overspawn.
                // Any hostiles in reserved rooms will not spawn additional oxen until threat is eliminated.
                // workRoom is set to be spawn room until this creep is re-assigned in the engine loop after it is spawned.
                if (
                    !room.haltSpawning
                    && !room.lethalHostilesInReservedRooms.length
                    && ReserveManager.reservedRoomNeedsOx(room.name)
                ) {
                    room.logRoom('needs reserve ox for ' +  utils.getRoomHTML(room.name));
                    // Our carry/road repair haulers. Start with workroom as spawnroom, this will get updated.
                    creepSpawned = (spawn.createCreepOx() === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }

                // Only allow one ox per tick to be spawned. Issues with assignment and overspawning otherwise.
                reservedLabel: for (let i=0; i<reservedRooms.length; i++) {
                    // Shorthand.
                    let reservedRoomName = reservedRooms[i];

                    // GUARDS BEFORE ALL
                    if (!room.haltSpawning) {
                        if (RoomIntel.getDangerousPlayerHostilesTTL(reservedRoomName)) {
                            if (!CreepManager.getWatchmenByWorkRoom(reservedRoomName).length) {
                                room.logRoom('needs reserve watchman for ' +  utils.getRoomHTML(reservedRoomName));
                                creepSpawned = (spawn.createCreepWatchman(reservedRoomName) === OK);
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }
                        }
                    }

                    // Bail out if there are lethal hostiles on path to reserved room.
                    if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, reservedRoomName)) continue;

                    // SCOUTS
                    // Several of the roles below rely on visibility into room.
                    // If we don't have obsevers/scouts able to do this, then need scouts.
                    if (
                        !room.haltSpawning
                        && !scoutRooms[reservedRoomName]
                        && !room.colonyObserver
                        && ReserveManager.reservedRoomNeedsScout(reservedRoomName)
                    ) {
                        room.logRoom('needs reserve scout for ' +  utils.getRoomHTML(reservedRoomName));
                        creepSpawned = (spawn.createCreepScout(reservedRoomName) === OK);
                        if (creepSpawned) scoutRooms[reservedRoomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // PALADIN
                    // If there is an invader core, send paladin to destroy it (can't be dismantled).
                    // If a strongholder is blocking our normally reserved SK room, we will walk around it.
                    // In that case, we send one to any room in the route, since we want to build roads.
                    if (
                        !room.haltSpawning
                    ) {
                        let routeRoomNames = Cartographer.findRouteRooms(room.name, reservedRoomName);
                        for (let j=0; j<routeRoomNames.length; j++) {
                            let routeRoomName = routeRoomNames[j];
                            let routeRoom = Game.rooms[routeRoomName];
                            if (
                                routeRoom
                                && !paladinRooms[routeRoomName]
                                && routeRoom.roomNeedsPaladin
                            ) {
                                room.logRoom('needs reserve paladin for ' +  utils.getRoomHTML(routeRoomName));
                                creepSpawned = (spawn.createCreepPaladin(routeRoomName, routeRoom.invaderCore.id) === OK);
                                if (creepSpawned) paladinRooms[routeRoomName] = true;
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }
                        }
                    }

                    // EXECUTIONER
                    if (
                        !GameManager.haltSupporting
                        && !executionerRooms[reservedRoomName]
                        && ReserveManager.reservedRoomNeedsExecutioner(room.name, reservedRoomName)
                    ) {
                        room.logRoom('needs reserve executioner for ' +  utils.getRoomHTML(reservedRoomName));
                        creepSpawned = (spawn.createCreepExecutioner(reservedRoomName) === OK);
                        if (creepSpawned) executionerRooms[reservedRoomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;

                        // Executioners are mandatory; spawn no others until these are done.
                        break reservedLabel;
                    }

                    // PREACHERS
                    if (
                        !room.haltSpawning
                        && !preacherRooms[reservedRoomName]
                        && ReserveManager.reservedRoomNeedsPreacher(room.name, reservedRoomName)
                    ) {
                        // Upper bound of 8 parts (600*8=4800) without potentially wasting ticks.
                        let claimParts = RoomIntel.getHostileManagement(reservedRoomName) ? MAX_CREEP_SIZE : Math.min(room.preacherClaimParts, 8)
                        let reservedRoom = Game.rooms[reservedRoomName];
                        // These preachers will not attempt to attack spawn, only reserve it.
                        let options = { reserveOnly: 1, claimParts: claimParts };

                        room.logRoom('needs reserve preacher for ' +  utils.getRoomHTML(reservedRoomName));
                        let focusId = reservedRoom ? reservedRoom.controller.id : null;
                        creepSpawned = (spawn.createCreepPreacher(reservedRoomName, focusId, options) === OK);
                        if (creepSpawned) preacherRooms[reservedRoomName] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // FARMERS
                    if (
                        !room.haltSpawning
                        && ReserveManager.reservedRoomNeedsFarmer(reservedRoomName)
                    ) {
                        room.logRoom('needs reserve farmer for ' +  utils.getRoomHTML(reservedRoomName));
                        // Our source harvesters for reserved rooms.
                        // Going thru the trouble of finding a specific source so that the farmer can move to it directly.
                        let source = ReserveManager.reservedRoomSourcesNeedingFarmer(reservedRoomName).find(f => f !== undefined);
                        let focusId = source ? source.id : null;
                        let options = {
                            needsContainer: (source && source.sourceContainer) ? false : true
                        }
                        creepSpawned = (spawn.createCreepFarmer(room.name, reservedRoomName, focusId, options) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // SCAVENGER
                    if (
                        !room.haltSpawning
                        && ReserveManager.reservedRoomNeedsScavenger(room.name, reservedRoomName)
                    ) {
                        room.logRoom('needs reserve scavenger for ' +  utils.getRoomHTML(reservedRoomName));
                        creepSpawned = (spawn.createCreepScavenger(reservedRoomName) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                }

            }


            // BUILDER CREEPS - SECONDARY (COLONY)
            // Need at least one existing to even do this check.
            // Any number of local builders for room repair and construction work.
            if (
                !GameManager.haltSupporting
                && CreepManager.getBuildersByFocusId(room.controller.id).length
            ) {
                // MASON creeps.
                if (
                    room.roomNeedsMason
					// Is this room capable of boosting, and do we have ample enough in the colony to do this?
					&& room.hasBoostStructures
					&& room.canBoostBodyMason()
                ) {
                    room.logRoom('needs mason')
                    creepSpawned = (spawn.createCreepMason(room.name, room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
                // CARPENTER creeps.
                else if (
                    room.roomNeedsCarpenter
                ) {
                    room.logRoom('needs carpenter')
                    creepSpawned = (spawn.createCreepCarpenter(room.name, room.name, room.controller.id) === OK);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
            }


            // FOCUS/CHARITY (FOCUS)
            // Send over peons, builders, defenders, upgraders, transports.
            if (
                !room.colonyUnsafe
                && room.isStorageEnergyMinimal
            ) {

                // Get list of controllers I own, and iterate throught them.
                let rooms = GameManager.empireFocusRooms.filter(f =>
                    // Don't create any of these creeps for ourselves, let others do it.
                    // Any needs this room has are done outside of this block.
                    (f.name !== room.name)
                );

                // Add in any rooms that we have claim flags in but are not yet claimed.
                rooms = rooms.concat(GameManager.empireRoomsToClaimThatAreUnclaimedAndVisible);

                // Just in case we have multiple rooms at once, which is a bad idea in general.
                rooms = _.sortByOrder(rooms, [
                    sortDistance => Cartographer.findRouteDistance(room.name, sortDistance.name)
                    , sortLevel => sortLevel.controller.level
                ]);

                for (let i = 0; i < rooms.length; i++) {
                    // Set the controller we are working on.
                    let focusRoom = rooms[i];

                    // Find the closest terminal room to the focus room that we can send horses too.
                    let assistingRoomName = GameManager.getClosestNonTempleTerminalRoomNameTo(focusRoom.name) || room.name;
                    let assistingRoom = Game.rooms[assistingRoomName];

                    // Check the distance from us->assisting room and assisting room->focus room.
                    if (!Cartographer.isInRouteDistance(room.name, assistingRoomName, Config.params.FOCUS_ASSIST_DISTANCE)) continue;
                    if (!Cartographer.isInRouteDistance(assistingRoomName, focusRoom.name, Config.params.FOCUS_ASSIST_DISTANCE)) continue;

                    if (
                        !GameManager.haltSupporting
                        && room.isBestRoom
                        && room.isStorageEnergyMinimal
                    ) {
                        // Avoid check maybe redundant with findRouteRooms but just to be sure.
                        let routeRoomNames = Cartographer.findRouteRooms(assistingRoomName, focusRoom.name).filter(f => !RoomIntel.getAvoid(f));

                        for (let i=0; i<routeRoomNames.length; i++) {
                            let routeRoomName = routeRoomNames[i];

                            // WATCHMEN: Send a watchmen to each room on the path.  General defense situation.
                            if (
                                // Don't send to rooms that are owned by myself or another player.
                                RoomIntel.getDangerousPlayerHostilesTTL(routeRoomName)
                                && !RoomIntel.getOwner(routeRoomName)
                                && !Cartographer.isSKRoom(routeRoomName)
                                // Don't send to rooms that are reserved by allies, it may trigger them.
                                && (!RoomIntel.getReservedByMe(routeRoomName) && !PlayerManager.isAlly(RoomIntel.getReservedBy(routeRoomName)))
                                && !CreepManager.getWatchmenByWorkRoom(routeRoomName).length
                            ) {
                                room.logRoom('needs charity watchman for ' + utils.getRoomHTML(routeRoomName) + ' on route from ' + utils.getRoomHTML(assistingRoomName) + ' to focus room ' + utils.getRoomHTML(focusRoom.name));
                                creepSpawned = (spawn.createCreepWatchman(routeRoomName) === OK);
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }

                        }
                    }

                    // Check to see if it is safe to send non-combat creeps to this focus room.
                    // This includes to the focus room itself; it doens't have to even be breached.
                    if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, focusRoom.name)) continue;

                    // PAGE: Need our pages to run energy.
                    if (
                        // Supporting used instead of Focus as we don't want upgraders to starve.
                        !GameManager.haltSupporting
                        && room.isCastle
                        && room.isStorageEnergyNormal
                        && (focusRoom.energyCapacityAvailable < room.energyCapacityAvailable)
                        && focusRoom.roomNeedsPage
                    ) {
                        room.logRoom('needs charity page for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepPage(focusRoom.name, focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // MULES: Our moving piggy bank.
                    if (
                        // Spawning used instead of Focus as we need our room to have energy.
                        !room.haltSpawning
                        && room.isCastle
                        && room.isStorageEnergyNormal
                        && assistingRoom.isStorageEnergyNormal
                        && !focusRoom.myTerminal
                        && (
                            // Don't have storage at all, need a transporter.
                            !focusRoom.storage
                            // Use up anything in the leftover storage
                            || !focusRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY)
                            // Once storage is up, fill until abundant.
                            || (focusRoom.myStorage && !focusRoom.isStorageEnergyAbundant)
                        )
                        && !focusRoom.atMaxLevel
                        // Don't send mule until we actually have work parts in the room. Too expensive to send early.
                        && focusRoom.myCreepsAtWorkWorkParts
                        && room.canBoostBodyMule()
                        && (CreepManager.getMulesByFocusId(focusRoom.controller.id).length < Config.params.MAX_MULES_PER_WORKROOM)
                        && room.isClosestAndBestToRoom(focusRoom.name, { maxDistance: Config.params.FOCUS_ASSIST_DISTANCE })
                    ) {
                        // This room may not be the best room, only the room that was free to be able to spawn this creep.
                        // But we want to set the work room to the closest room, as it will have a terminal and could be closer.
                        room.logRoom('needs charity mule for ' + utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepMule(assistingRoomName, focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // HORSES: The bread and butter movers.
                    if (
                        // Spawning used instead of Focus as we need our room to have energy.
                        !room.haltSpawning
                        && room.isCastle
                        && room.isStorageEnergyNormal
                        && assistingRoom.isStorageEnergyNormal
                        // Don't send mule until we actually have work parts in the room. Too expensive to send early.
                        //&& focusRoom.myCreepsAtWorkWorkParts
                        && focusRoom.colonyNeedsHorse
                    ) {
                        // This room may not be the best room, only the room that was free to be able to spawn this creep.
                        // But we want to set the work room to the closest room, as it will have a terminal and could be closer.
                        let longRange = (Cartographer.findRouteDistance(assistingRoomName, focusRoom.name) > 1);
                        room.logRoom('needs charity horse for ' + utils.getRoomHTML(focusRoom.name));
                        let options = { offroad: longRange };
                        creepSpawned = (spawn.createCreepHorse(assistingRoomName, focusRoom.name, focusRoom.controller.id, options) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // HERALD: Spawn a herald if we can, they are insanely powerfully upgraders and takes the load off the focus room.
                    if (
                        // Focus used instead of Spawning to keep CPU down.
                        !GameManager.haltFocus
                        && room.isStorageEnergyAbundant
                        && room.isCastle
                        && !focusRoom.isTemple
                        && focusRoom.roomNeedsCharityUpgrader
                        && room.canBoostBodyHerald()
                        && Cartographer.isInRouteDistance(room.name, focusRoom.name, Config.params.FOCUS_ASSIST_HERALD_DISTANCE)
                    ) {
                        room.logRoom('needs charity herald for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepHerald(focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                    // BELLMAN: If not herald, give charity to weaker rooms only.
                    else if (
                        // Focus used instead of Spawning to keep CPU down.
                        !GameManager.haltFocus
                        && room.isStorageEnergyAbundant
                        && room.isCastle
                        && !focusRoom.isTemple
                        // Only send bellmen at level 7 or lower (unless focusRoom is too busy).
                        // Prophets/Criers can be made by the focus room which are much more efficient.
                        // A level 7 room can make 49 part Prophet, ~150 ticks each. With 2 spawns it could make a max of ~20 upgraders.
                        && ((focusRoom.controller.level < 7) || focusRoom.colonyAllSpawnsSpawningOrRenewing)
                        && focusRoom.roomNeedsCharityUpgrader
                        // Max distance is already part of the focus room loop.
                    ) {
                        room.logRoom('needs charity bellman for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepBellman(focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // PEON: Need at least one all purpose peon per room.
                    if (
                        // Focus used instead of Spawning to keep CPU down.
                        !peonRooms[focusRoom.name]
                        && !GameManager.haltFocus
                        && room.isStorageEnergyMinimal
                        && (focusRoom.energyCapacityAvailable < room.energyCapacityAvailable)
                        && focusRoom.roomNeedsPeonBonus
                    ) {
                        room.logRoom('needs charity peon for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepPeon(focusRoom.name, focusRoom.name, focusRoom.controller.id, false) === OK);
                        if (creepSpawned) peonRooms[focusRoom.name] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // MASON: Give charity mason to rooms in need. Could be same level (aka level 8).
                    if (
                        // Focus used instead of Spawning to keep CPU down.
                        !GameManager.haltFocus
                        && room.isCastle
                        && room.isStorageEnergyDump
                        && (focusRoom.energyCapacityAvailable <= room.energyCapacityAvailable)
                        && (
                            focusRoom.roomNeedsMason
                            || (room.isCastle && focusRoom.colonyNeedsMason)
                        )
                        // Is this room capable of boosting, and do we have ample enough in the colony to do this?
                        && room.hasBoostStructures
                        && room.canBoostBodyMason()
                        && room.isClosestAndBestToRoom(focusRoom.name, { maxDistance: Config.params.FOCUS_ASSIST_DISTANCE })
                    ) {
                        room.logRoom('needs charity mason for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepMason(focusRoom.name, focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                    // CARPENTER: Give charity carpenter to rooms in need. Could be same level (aka level 8).
                    // Let the spawn room make at least 1 of their own so simple road builds can be taken care of locally.
                    else if (
                        // Focus used instead of Spawning to keep CPU down.
                        !GameManager.haltFocus
                        && room.isBestRoom
                        && room.isStorageEnergyDump
                        && (focusRoom.energyCapacityAvailable <= room.energyCapacityAvailable)
                        && (
                            focusRoom.roomNeedsCarpenter
                            // We are a castle, and would be sending focusRoom energy anyway, so keep a carpenter going in this low level room.
                            || (room.isBestRoom && focusRoom.colonyNeedsCarpenter)
                        )
                    ) {
                        room.logRoom('needs charity carpenter for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepCarpenter(focusRoom.name, focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // TEMPLE ROOMS
            // Send over peons, builders, upgraders, transports.
            if (
                !room.noTemple
                && !room.colonyUnsafe
                && !room.haltSpawning
                && room.isCastle
                && room.isStorageEnergyNormal
            ) {

                // Get list of non-maxed temple rooms.
                let rooms = GameManager.empireNonMaxTempleRooms.filter(f =>
                    // We are right next door to the temple room, its our responsibility.
                    room.hasExitToRoom(f.name)
                );

                for (let i = 0; i < rooms.length; i++) {
                    // Set the controller we are working on.
                    let focusRoom = rooms[i];

                    // PEONS: Need to harvest from source and maintain room.
                    if (
                        !peonRooms[focusRoom.name]
                        && focusRoom.roomNeedsPeon
                    ) {
                        room.logRoom('needs temple peon for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepPeon(focusRoom.name, focusRoom.name, focusRoom.controller.id, false) === OK);
                        if (creepSpawned) peonRooms[focusRoom.name] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // MULES: Our moving piggy bank.
                    if (
                        !focusRoom.myTerminal
                        && (
                            // Don't have storage at all, need a transporter.
                            !focusRoom.storage
                            // Use up anything in the leftover storage
                            || !focusRoom.storage.store.getUsedCapacity(RESOURCE_ENERGY)
                            // Once storage is up, fill until abundant.
                            || (focusRoom.myStorage && !focusRoom.isStorageEnergyAbundant)
                        )
                        // Don't send mule until we actually have work parts in the room. Too expensive to send early.
                        && focusRoom.myCreepsAtWorkWorkParts
                        && room.canBoostBodyMule()
                        && (CreepManager.getMulesByFocusId(focusRoom.controller.id).length < Config.params.MAX_MULES_PER_WORKROOM)
                    ) {
                        // This room may not be the best room, only the room that was free to be able to spawn this creep.
                        // But we want to set the work room to the closest room, as it will have a terminal and could be closer.
                        room.logRoom('needs temple mule for ' + utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepMule(room.name, focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // HORSES: The bread and butter movers.
                    if (
                        // Don't send mule until we actually have work parts in the room. Too expensive to send early.
                        focusRoom.myCreepsAtWorkWorkParts
                        // Basic check.
                        && focusRoom.colonyNeedsHorse
                    ) {
                        // This room may not be the best room, only the room that was free to be able to spawn this creep.
                        // But we want to set the work room to the closest room, as it will have a terminal and could be closer.
                        let longRange = false;
                        room.logRoom('needs temple horse for ' + utils.getRoomHTML(focusRoom.name));
                        let options = { offroad: longRange };
                        creepSpawned = (spawn.createCreepHorse(room.name, focusRoom.name, focusRoom.controller.id, options) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // ORACLE: Boosted temple upgrader creep.
                    if (
                        // Focus used instead of Spawning to keep CPU down.
                        room.canBoostBodyOracle()
                        && focusRoom.colonyNeedsOracle
                    ) {
                        room.logRoom('needs temple oracle for ' + utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepOracle(focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                    // DIVINER: Unboosted temple upgrader creep.
                    else if (
                        focusRoom.colonyNeedsDiviner
                    ) {
                        room.logRoom('needs temple diviner for ' + utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepDiviner(focusRoom.name, focusRoom.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }

                    // PEON: Need at least one all purpose peon per room.
                    if (
                        // Focus used instead of Spawning to keep CPU down.
                        !peonRooms[focusRoom.name]
                        && focusRoom.roomNeedsPeonBonus
                    ) {
                        room.logRoom('needs temple peon for ' +  utils.getRoomHTML(focusRoom.name));
                        creepSpawned = (spawn.createCreepPeon(focusRoom.name, focusRoom.name, focusRoom.controller.id, false) === OK);
                        if (creepSpawned) peonRooms[focusRoom.name] = true;
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                    }
                }
            }


            // POWERBANKS
            // Create blacksmith, bishop, mules, burro, watchmans and deacons.
            if (
                !room.noPowerbank
                && !room.colonyUnsafe
                && room.isCastle
                && room.isHighwayAccessRoom
                && room.isStorageEnergyNormal
                && !room.isInRouteDistanceToFocusRoomToAssist
            ) {

                // Logic for determining a "good" powerbank room (amount, time, etc) is inside data.
                let powerbankRooms = RoomIntel.getPowerBanks().filter(f =>
                    (f.hits > 0)
                    && !RoomIntel.getAvoid(f.roomName)
                    && !RoomIntel.getHighwayNoviceWallsExist(f.roomName)
                    // Need to meet basic requirements of having workers already or being the best in range of the empire.
                    && (
                        CreepManager.getPowerWorkersByFocusId(f.id).length
                        || GameManager.empireBestPowerBanks[f.id]
                    )
                    && Cartographer.isInRouteDistance(room.name, f.roomName, Config.params.MAX_POWERBANK_RANGE)
                );
                powerbankRooms = _.sortByOrder(powerbankRooms, [
                    sortHits => -sortHits.hits
                    , sortPower => -sortPower.power
                ]);

                for (let i=0; i<powerbankRooms.length; i++) {
                    let powerbankRoom = powerbankRooms[i];
                    const group = 'powerbank'

                    // Don't bother if there are boosted hostiles in room.
                    if (RoomIntel.getLethalBoostedHostilesTTL(powerbankRoom.roomName)) continue;

                    // Determine if we can/should send a blacksmith to the powerbank room.
                    if (
                        // Spawning for this powerbank has already started, so keep it going.
                        CreepManager.getPowerWorkersByFocusId(powerbankRoom.id).length

                        // Bootstrap spawning criteria.
                        || (
                            !GameManager.haltFarming

                            // Are we at the required energy level?
                            && room.isStorageEnergyFarm

                            // For new rooms, make this this one is the best one the empire can reach.
                            && GameManager.empireBestPowerBanks[powerbankRoom.id]

                            // We have less than our minimum amount in the actual terminal. Excess amounts should be transfered or sold.
                            // NOTE: This is not technically accurate -- the assigned room is really what this check should be against, but that doesn't happen until later.
                            && (room.myTerminal.store.getUsedCapacity(RESOURCE_POWER) < GameManager.getTerminalResourceTargetAmount(RESOURCE_POWER, powerbankRoom.power))

                            // Do not exceed overall count of farming.
                            // Always allowed to have at least one of this type.
                            && (
                                (GameManager.activePowerBanks.length < 1)
                                // Going to allow max powerbank farming up to farm cap as a priority over other types of farming.
                                || (GameManager.activePowerBanks.length < GameManager.maxFarmCount)
                                || room.isStorageEnergySell
                                || GameManager.farmCountBelowMax
                            )

                            // We aren't focusing on another room (cpu, energy).
                            // But, we are going to allow a limited version of this, as long as they are out of range of assisting.
                            && !room.isInRouteDistanceToFocusRoomToAssist

                            // Do we have the boosts for this group?
                            && (
                                // More than one nip can be done by regular strikers.
                                (powerbankRoom.nips > 1)
                                // But only 1 nip can be done realistically by a boosted creep.
                                // These are only made if we are pushing Gpl as they are expensive.
                                || (
                                    GameManager.isEmpireObjectiveGpl
                                    && room.canBoostGroup(group)
                                    && room.areBoostsAtNeededAmountForBlacksmith
                                    && room.areBoostsAtNeededAmountForBishop
                                )
                            )
                        )
                    ) {

                        // Get the closest room that we will deliver/unboost/recycle to.
                        let assignedRoomName = GameManager.getClosestCastleRoomTo(powerbankRoom.roomName) || room.name;

                        if (
                            // Important roles so make sure we are the closest possible room.
                            room.isClosestAndBestToRoom(powerbankRoom.roomName, { minLevel:8, excludeNoPowerbank:true, maxDistance: Config.params.MAX_POWERBANK_RANGE })
                        ) {
                            let incomingDamage = RoomIntel.getHostileIncomingRangedAttackPower(powerbankRoom.roomName);
                            // Create a boosted deacon for the room. Can be from any room.
                            if (
                                RoomIntel.getLethalBoostedPlayerHostilesTTL(powerbankRoom.roomName)
                                && (CreepManager.getDeaconByFocusId(powerbankRoom.id).length < Config.params.MAX_DEACONS_PER_FOCUS)
                                && room.canBoostBodyDeacon({ incomingDamage: incomingDamage })
                            ) {
                                room.logRoom('needs powerbank deacon for ' + utils.getRoomHTML(powerbankRoom.roomName));
                                creepSpawned = (spawn.createCreepDeacon(powerbankRoom.roomName, { focusId: powerbankRoom.id, incomingDamage: incomingDamage }) === OK);
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }

                            // Create at least one watchman for the room. Can be from any room.
                            // Create a watchman in room if lethal players are there.
                            if (
                                RoomIntel.getLethalHostilesTTL(powerbankRoom.roomName)
                                && (
                                    !CreepManager.getWatchmanByFocusId(powerbankRoom.id).length
                                    || (
                                        (CreepManager.getWatchmanByFocusId(powerbankRoom.id).length < Config.params.MAX_WATCHMEN_PER_WORKROOM)
                                        && GameManager.lethalHostilesOverpoweringGuardiansByFocusId(powerbankRoom.id, powerbankRoom.roomName)
                                    )
                                )
                            ) {
                                room.logRoom('needs powerbank watchman for ' + utils.getRoomHTML(powerbankRoom.roomName));
                                creepSpawned = (spawn.createCreepWatchman(powerbankRoom.roomName, powerbankRoom.id) === OK);
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }

                            // Don't send anyone else while we have lethals in room.
                            if (RoomIntel.getLethalHostilesTTL(powerbankRoom.roomName)) continue;

                            // Create a striker for the room.
                            // Intentially done last, as all support creeps are dependent on blacksmith being spawned.
                            if (
                                // We can't do just 1 nip and finish on time.
                                (powerbankRoom.nips > Config.params.MAX_BLACKSMITH_NIPS)

                                // Strikers for as many spots as we need up to max nips.
                                && (CreepManager.getStrikersByFocusId(powerbankRoom.id).length < powerbankRoom.nips)

                                // Do we need another creep to finish the job on this powerbank?
                                && (CreepManager.getPowerWorkerByFocusIdAttackPowerTTL(powerbankRoom.id) < powerbankRoom.hits)
                            ) {
                                room.logRoom('needs powerbank striker for ' +  utils.getRoomHTML(powerbankRoom.roomName));
                                room.logRoom('needs powerbank cardinal for ' +  utils.getRoomHTML(powerbankRoom.roomName));
                                if ((getFreeSpawns() < 2) || !room.nonKingEnergyFull) break creepSpawnedLabel;

                                creepSpawned = (spawn.createCreepStriker(powerbankRoom.roomName, assignedRoomName, powerbankRoom.id) === OK);
                                if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                                creepSpawned = (spawn.createCreepCardinal(powerbankRoom.roomName, assignedRoomName, powerbankRoom.id) === OK);
                                if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                                // Break out of this one just so more creeps don't try to spawn.
                                break creepSpawnedLabel;

                            }

                            // Create a blacksmith for the room.
                            // Intentially done last, as all support creeps are dependent on blacksmith being spawned.
                            if (
                                (powerbankRoom.nips <= Config.params.MAX_BLACKSMITH_NIPS)

                                // Only need one blacksmith per powerbank.
                                && !CreepManager.getBlacksmithsByFocusId(powerbankRoom.id).length

                                // Do we need another creep to finish the job on this powerbank?
                                && (CreepManager.getPowerWorkerByFocusIdAttackPowerTTL(powerbankRoom.id) < powerbankRoom.hits)
                            ) {
                                room.logRoom('needs powerbank blacksmith for ' +  utils.getRoomHTML(powerbankRoom.roomName));
                                room.logRoom('needs powerbank bishop for ' +  utils.getRoomHTML(powerbankRoom.roomName));
                                if ((getFreeSpawns() < 2) || !room.nonKingEnergyFull) break creepSpawnedLabel;

                                creepSpawned = (spawn.createCreepBlacksmith(powerbankRoom.roomName, assignedRoomName, powerbankRoom.id) === OK);
                                if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                                creepSpawned = (spawn.createCreepBishop(powerbankRoom.roomName, assignedRoomName, powerbankRoom.id) === OK);
                                if (!creepSpawned || !getNextSpawn()) break creepSpawnedLabel;

                                // Break out of this one just so more creeps don't try to spawn.
                                break creepSpawnedLabel;
                            }
                        }

                        // Burros do NOT need to come from the best room, only to the room in distance.

                        // Figure out how many burros we need. 0, 1, or 2, etc.
                        let burrosNeeded = 0;
                        let powerAmount = powerbankRoom.power;

                        // Calc burro needs. Be careful of divide by zero.
                        if (room.burroCarryCapacity) burrosNeeded = Math.ceil(powerAmount / room.burroCarryCapacity);

                        // Create burros for the room. Can be from any nearby room.
                        if (
                            // Need room visibility to send burros.
                            Game.rooms[powerbankRoom.roomName]

                            // Our powerbank has to go below the trigger threshhold for spawning burros.
                            // Except if we have boosted blacksmiths, which finish so fast that we need to start spawning immediately.
                            && (
                                (powerbankRoom.hits < Config.params.POWERBANK_TRANSPORT_TRIGGER)
                                || CreepManager.getBlacksmithsByFocusId(powerbankRoom.id).length
                            )

                            // There is enough damage output to kill the powerbank.
                            && (CreepManager.getPowerWorkerByFocusIdAttackPowerTTL(powerbankRoom.id) >= powerbankRoom.hits)

                            // Only make as many donkies as is needed.
                            && (CreepManager.getBurrosByFocusId(powerbankRoom.id).length < burrosNeeded)
                        ) {
                            room.logRoom('needs powerbank burro for ' + utils.getRoomHTML(powerbankRoom.roomName));
                            creepSpawned = (spawn.createCreepBurro(powerbankRoom.roomName, assignedRoomName, powerbankRoom.id) === OK);
                            if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                        }

                    }
                }

            }


            // DEPOSITS
            // Create prospector, donkey, watchmans and deasons.
            if (
                !room.noDeposit
                && !room.colonyUnsafe
                && room.isCastle
                && room.isHighwayAccessRoom
                && room.isStorageEnergyNormal
                && !room.isInRouteDistanceToFocusRoomToAssist
            ) {

                let depositRooms = RoomIntel.getDeposits().filter(f =>
                    !RoomIntel.getAvoid(f)
                    && !RoomIntel.getHighwayNoviceWallsExist(f)
                    && Cartographer.isInRouteDistance(room.name, f.roomName, Config.params.MAX_DEPOSIT_RANGE)
                );
                depositRooms = _.sortByOrder(depositRooms, [
                    sortDistance => Cartographer.findRouteDistance(room.name, sortDistance.roomName)
                ]);

                for (let i=0; i<depositRooms.length; i++) {
                    let depositRoom = depositRooms[i];

                    // Don't bother if there are boosted hostiles in deposit room.
                    // Plenty of other deposits to go around.
                    if (RoomIntel.getLethalBoostedHostilesTTL(depositRoom.roomName)) continue;

                    // We must be the best room for this deposit.
                    if (!room.isClosestAndBestToRoom(depositRoom.roomName, { minLevel:8, excludeNoDeposit:true, maxDistance: Config.params.MAX_DEPOSIT_RANGE })) continue;

                    if (
                        // Spawning for this deposit has already started, so keep it going.
                        CreepManager.getProspectorsByFocusId(depositRoom.id).length

                        // Bootstrap spawning criteria.
                        || (
                            // Is this deposit worth anything to us?
                            !GameManager.haltFarming
                            && (depositRoom.lastCooldown < Config.params.MAX_DEPOSIT_COOLDOWN)
                            && (depositRoom.despawnTime > Game.time + CREEP_LIFE_TIME)

                            // Are we at the required energy level?
                            && room.isStorageEnergyFarm

                            // Is this a prophitable deposit type, somewhere in the chain?
                            // TODO: this is broken, need better algorithm.
                            //&& GameManager.isDepositTypeProfitable(depositRoom.depositType)

                            // We aren't focusing on another room (cpu, energy).
                            // But, we are going to allow a limited version of this, as long as they are out of range of assisting.
                            && !room.isInRouteDistanceToFocusRoomToAssist

                            // If we already are full up on the output of this type, don't bother getting more.
                            // This means we can't upgrade it fast enough, and NPC's aren't buying it.
                            && GameManager.isDepositTypeNeeded(depositRoom.depositType)

                        )
                    ) {
                        // Create a watchman if room has hostiles in it. Spawn more if needed.
                        if (
                            // Room has other dangerous players.
                            RoomIntel.getDangerousPlayerHostilesTTL(depositRoom.roomName)

                            // We have at least one prospector spawned (duh).
                            && CreepManager.getProspectorsByFocusId(depositRoom.id).length

                            // Estimate how many watchmen we need.
                            && (
                                !CreepManager.getWatchmanByFocusId(depositRoom.id).length
                                || (
                                    (CreepManager.getWatchmanByFocusId(depositRoom.id).length < Config.params.MAX_WATCHMEN_PER_WORKROOM)
                                    && GameManager.lethalHostilesOverpoweringGuardiansByFocusId(depositRoom.id, depositRoom.roomName)
                                )
                            )
                        ) {
                            room.logRoom('needs deposit watchman for ' +  utils.getRoomHTML(depositRoom.roomName));
                            creepSpawned = (spawn.createCreepWatchman(depositRoom.roomName, depositRoom.id) === OK);
                            if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                        }

                        // Bail out if there are lethal hostiles on path to workroom from either here or the assigned room.
                        if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, depositRoom.roomName)) continue;

                        // Create donkeys. Create after the first prospector, and when all prospectors are spawned.
                        if (
                            // Room is safe from other dangerous players.
                            !RoomIntel.getLethalHostilesTTL(depositRoom.roomName)

                            // We have at least one prospector spawned (duh).
                            && CreepManager.getProspectorsByFocusId(depositRoom.id).length
                        ) {
                            // Determine how many ticks the donkey takes to move to deposit to storage.
                            // Calculate how many ticks before the prospector fills up its store with resources, given the cooldown on the deposit.
                            let assignedRoomName = GameManager.getClosestCastleRoomTo(depositRoom.roomName) || room.name;

                            // Bail out if there are lethal hostiles on path to workroom from either here or the assigned room.
                            if (GameManager.doesRoomHaveLethalHostilesInRoute(depositRoom.roomName, assignedRoomName)) continue;

                            let distance = GameManager.estimatedTravelTicks(assignedRoomName, depositRoom.roomName) * 2;
                            let prospectors = CreepManager.getProspectorsByFocusId(depositRoom.id);
                            let prospectorCapacity = _.sum(prospectors, s => s.store.getCapacity());
                            let ticksToFill = prospectors[0].harvestDepositTicksToFillCapacity * (depositRoom.lastCooldown || 1);
                            let capacityMultiplier = Math.ceil(prospectorCapacity / room.donkeyCarryCapacity);
                            let donkeysNeeded = Math.min(Math.ceil(distance / ticksToFill) * capacityMultiplier, Config.params.MAX_DONKEYS_PER_DEPOSIT);
                            let donkeys = CreepManager.getDonkeysByFocusId(depositRoom.id).length;

                            // At least one donkey has to have cargo for us to spawn another.
                            let donkeyWithCargo = !!CreepManager.getDonkeysByFocusId(depositRoom.id).find(f => f.store.getUsedCapacity());

                            if (!donkeys || ((donkeys < donkeysNeeded) && donkeyWithCargo)) {
                                room.logRoom('needs deposit donkey (' + donkeys + '/' + donkeysNeeded + ') for ' +  utils.getRoomHTML(depositRoom.roomName));
                                creepSpawned = (spawn.createCreepDonkey(depositRoom.roomName, assignedRoomName, depositRoom.id) === OK);
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }
                        }

                        // Now create a prospector. The bread and butter.
                        // Intentially done last, as all support creeps are dependent on prospector being spawned.
                        if (
                            // This is the trigger to stop the whole process.
                            GameManager.isDepositActive(depositRoom.id, false)

                            // Room is safe from other dangerous players.
                            && !RoomIntel.getLethalHostilesTTL(depositRoom.roomName)

                            // Make as many prospectors as can fit.
                            && (CreepManager.getProspectorsByFocusId(depositRoom.id).length < Math.min(depositRoom.nips, Config.params.MAX_PROSPECTORS_PER_DEPOSIT))
                        ) {
                            room.logRoom('needs deposit prospector for ' +  utils.getRoomHTML(depositRoom.roomName));
                            let assignedRoomName = GameManager.getClosestCastleRoomTo(depositRoom.roomName) || room.name;
                            creepSpawned = (spawn.createCreepProspector(depositRoom.roomName, assignedRoomName, depositRoom.id) === OK);
                            if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                        }
                    }

                }
            }


            // CENTER/TEMPLE MINERALS
            // Create executioner, dredger, jackass roles.
            // SK access rooms and temple access rooms can spawn dredgers.
            if (
                !room.noMineral
                && !room.colonyUnsafe
                && room.isFort
                && room.isStorageEnergyNormal
                && room.isDredgerSpawnRoom
            ) {
                // Any center room in range 4 that isn't a reserved rooms already and its mineral type is known and its amount not zero.
                let workRoomNames = room.potentialMineralRoomNames.filter(f =>
                    // Do we have an Id for this mineral? Need this for basic logic below.
                    RoomIntel.getMineralId(f)
                    // Do we need this type?
                    && RoomIntel.getMineralType(f)
                    // Are there any minerals in this room?
                    && (RoomIntel.getMineralAmount(f) > 0)
                    // Don't bother if there are hostiles in work room.
                    && !RoomIntel.getLethalHostilesTTL(f)
                    // Room has dangerous players.
                    && !RoomIntel.getDangerousPlayerHostilesTTL(f)
                    // Make sure we aren't avoiding this room.
                    && !RoomIntel.getAvoid(f)
                );
                workRoomNames = _.sortByOrder(workRoomNames, [
                    // If the room was reserved, then it will have a "free" executioner.
                    sortReserved => room.reservedRoomNamesHash[sortReserved] ? 0 : 1
                    // Sort by minerals that we are low on, in order.
                    , sortAmount => GameManager.empireFungiblesBelowMinSortedHash[RoomIntel.getMineralType(sortAmount)] || Infinity
                    // Closer the better.
                    , sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
                ]);

                dredgerLabel: for (let i=0; i<workRoomNames.length; i++) {
                    let workRoomName = workRoomNames[i];
                    let workRoom = Game.rooms[workRoomName];
                    let mineralId = RoomIntel.getMineralId(workRoomName)
                    let minerSpawned = false;

                    if (
                        // We must be the best room for this workroom.
                        room.isClosestAndBestToRoom(workRoomName, { minLevel:Config.params.MIN_DREDGER_ROOM_LEVEL, excludeNoMineral:true, maxDistance: Config.params.MAX_DREDGER_RANGE })
                    ) {
                        let assignedRoomName = room.name;
                        // Temples can have multiple assisting rooms, so check all of them.
                        // For normal center rooms, we just care about the closest one.
                        if (!workRoom || !workRoom.isTemple) {
                            assignedRoomName = GameManager.getClosestNonTempleTerminalRoomNameTo(workRoomName) || room.name;
                        }
                        let assignedRoom = Game.rooms[assignedRoomName];

                        // Bail out if there are lethal hostiles on path to workroom from either here or the assigned room.
                        if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, workRoomName)) continue;
                        if ((room.name !== assignedRoomName) && GameManager.doesRoomHaveLethalHostilesInRoute(assignedRoomName, workRoomName)) continue;

                        // Bail out if we hit some sort of cap for this room.
                        // This effects all roles, but dredgers are smart enough to come home on their own when full.
                        if (!assignedRoom.doesColonyNeedMineralMinerForRoomName(workRoomName)) continue;

                        // Determine if we can/should send a dredger to the sk room.
                        if (
                            // Spawning for this mineral has already started, so keep it going until depleted.
                            CreepManager.getDredgersByFocusId(mineralId).length

                            // Or it is already a reserved room, so will have executioner and protection there already.
                            || GameManager.empireReservedRoomsHash[workRoomName]

                            // Bootstrap spawning criteria.
                            || (
                                // Don't spawn any more miners after the first room.
                                !minerSpawned

                                && !GameManager.haltFarming

                                // Are we at the required energy level?
                                && room.isStorageEnergyFarm

                                // Don't start on a new mineral until our local miners are done.
                                && !CreepManager.getMinersByFocusId(RoomIntel.getMineralId(room.name)).length

                                // Do not exceed overall count of farming.
                                // Always allowed to have at least one of this type.
                                && (
                                    (GameManager.activeMinerals.length < 1)
                                    || room.isStorageEnergySell
                                    || GameManager.farmCountBelowMax
                                )
                            )
                        ) {

                            // Create executioner. Create one per room. Core room won't need any, nice.
                            if (
                                // We have visibility into this room.
                                !GameManager.haltSupporting
                                && !executionerRooms[workRoomName]
                                && room.isCastle
                                && Cartographer.isSKRoom(workRoomName)
                                && !CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(workRoomName).length
                            ) {
                                // Determine if the executioner should focus only on the mineral or not.
                                //let focusId = GameManager.empireReservedRoomsHash[workRoomName] ? null : mineralId;
                                room.logRoom('needs mineral executioner for ' +  utils.getRoomHTML(workRoomName));
                                creepSpawned = (spawn.createCreepExecutioner(workRoomName) === OK);
                                if (creepSpawned) minerSpawned = true;
                                if (creepSpawned) executionerRooms[workRoomName] = true;
                                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                            }

                            // Create jackass for the room.
                            if (
                                (
                                    // Core rooms do not need executioners.
                                    !Cartographer.isSKRoom(workRoomName)
                                    || CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(workRoomName).length
                                )
                                && CreepManager.getDredgersByFocusId(mineralId).length
                            ) {
                                let distance = Cartographer.findRouteDistance(workRoomName, assignedRoomName);
                                let nips = RoomIntel.getMineralNips(workRoomName) || 1;
                                //let movers = 2 + ((nips + distance > 6) ? 1 : 0);
                                let movers = 1 + ((nips + distance > 3) ? 1 : 0) + ((nips + distance > 6) ? 1 : 0);

                                if (CreepManager.getJackassByFocusId(mineralId).length < movers) {
                                    room.logRoom('needs mineral jackass for ' +  utils.getRoomHTML(workRoomName));
                                    creepSpawned = (spawn.createCreepJackass(workRoomName, assignedRoomName, mineralId) === OK);
                                    if (creepSpawned) minerSpawned = true;
                                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                                }
                            }

                            // Now create dredgers. The bread and butter.
                            // Intentionally done last, as all support creeps are dependent on dredger being spawned.
                            if (
                                // Need to inspect the nips, only reason this is here.
                                workRoom
                                && workRoom.mineral

                                && (
                                    // Core rooms do not need executioners.
                                    !Cartographer.isSKRoom(workRoomName)
                                    || CreepManager.getExecutionersNotNeedingReplacementByWorkRoom(workRoomName).length
                                )
                            ) {
                                // Make as many prospectors as can fit.
                                if (CreepManager.getDredgersByFocusId(mineralId).length < Math.min(workRoom.mineral.nips.length, Config.params.MAX_DREDGERS_PER_MINERAL)) {
                                    room.logRoom('needs mineral dredger for ' +  utils.getRoomHTML(workRoomName));
                                    creepSpawned = (spawn.createCreepDredger(workRoomName, assignedRoomName, mineralId) === OK);
                                    if (creepSpawned) minerSpawned = true;
                                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                                }
                            }
                        }

                    }

                }
            }


            // ROGUES (COLONY)
            // Send rogue to any room with free loot.
            if (
                !room.haltSpawning
                && room.isCastle
                && !room.colonyUnsafe
                && room.isStorageEnergyNormal
                && !room.isStorageFull

                // Obey the room creep count. (Should be 1 or 0).
                && (CreepManager.getRoguesByFocusId(room.controller.id).length < room.maxRogues)

                // Only allow spawning of one rogue at a time in the entire empire.
                && !GameManager.empireHasRogueSpawning

                // Do not make new rogues if we have updated one on this tick.
                && !GameManager.hasRogueWorkRoomBeenSet
            ) {
                let rooms = [];
                if (RoomIntel.getPlunderableAmount(room.name)) {
                    rooms = [room.name];
                }
                else {
                    // Get a list of potential rooms we can reach.
                    // This list is already sorted by value in the room, so the first room found by the filter is the best room.
                    rooms = GameManager.roomsWithPlunderables.filter(f =>
                        // Make sure we can reach this room.
                        Cartographer.isInRouteDistance(room.name, f, Config.params.MAX_ROGUE_RANGE)
                    )
                }

                // Now sort to get closest rooms. Will prioritize rooms with non-energy in them.
                rooms = _.sortByOrder(rooms, [
                    sortHash => Object.keys(RoomIntel.getPlunderableHash(sortHash) || {}).find(f => f !== RESOURCE_ENERGY) ? 0 : 1
                    , sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
                ]);
                let roomRogueCarryCapacity = room.rogueCarryCapacity;

                for (let i=0; i<rooms.length; i++) {
                    let workRoom = rooms[i];

                    // Bail out if there are lethal hostiles on path to reserved room.
                    if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, workRoom)) continue;

                    // We are aiming for at least two trips for this rogue to pay for itself.
                    if (
                        (
                            // Is the amount in the room (after those assigne dto it already) more than what a brand new rogue could carry?
                            (RoomIntel.getPlunderableAmount(workRoom) - CreepManager.getRogueCarryCapacityByWorkRoom(workRoom) - CreepManager.getBurroCarryCapacityByWorkRoom(workRoom) > roomRogueCarryCapacity)

                            // And we have something valuable in this room. Go investigate!
                            || !CreepManager.getRogueCarryCapacityByWorkRoom(workRoom)
                        )

                        // Do we have any idle, unassigned rogues in any room nearby? If so, don't add any more, they can do the pickup.
                        && !GameManager.empireSpawnRoomsWithUnassignedRogues.find(f => Cartographer.isInRouteDistance(f.name, workRoom, Config.params.MAX_ROGUE_RANGE))
                    ) {
                        room.logRoom('needs rogue for ' +  utils.getRoomHTML(workRoom) + ' which contains ' + RoomIntel.getPlunderableAmount(workRoom) + ' loot valued at ' + RoomIntel.getPlunderableValue(workRoom));
                        creepSpawned = (spawn.createCreepRogue(room.controller.id) === OK);
                        if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;

                        // Break out of the rogue loop, we can only build one rogue at a time.
                        break;
                    }
                }
            }


            // BONUS PEONS (COLONY)
            // Storage check is in roomNeedsPeonBonus method.
            // Only build bonus peons here if we are the best room, otherwise charity will kick in and send us some.
            if (
                peonRooms[room.name]
                && !room.colonyUnsafe
                && room.okToSpawnAuxiliaryCreep
                && room.canBuildBestPeons
                && room.roomNeedsPeonBonus
            ) {
                room.logRoom('needs bonus home peon');
                creepSpawned = (spawn.createCreepPeon(room.name, room.name, room.controller.id, false) == OK);
                if (creepSpawned) peonRooms[room.name] = true;
                if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
            }


            // EARLY SCOUTS (COLONY)
            // Send scouts to rooms we have never been to.
            // Don't bother if we have our own observer, or if there is an observer in this sector.
            if (
                !room.colonyUnsafe
                && !room.colonyObserver
                && room.okToSpawnAuxiliaryCreep
                && room.isStorageEnergyNormal
                && !room.isTemple
                && !GameManager.empireCastleRooms.find(f => f.sector === room.sector)
            ) {
                // Get a list of potential rooms we can reach.
                // This list is already sorted by value in the room, so the first room found by the filter is the best room.
                let rooms = Cartographer.getSectorRooms(room.name).filter(f =>
                    // Multiple actions here will send scouts, don't send more than 1.
                    !scoutRooms[f]
                    // We are not purposely avoiding this room.
                    && !FlagManager.avoidFlags[f]
                    // Don't send scouts too often, as it might be impossible to get to the location.
                    && !RoomIntel.getVisited(f)
                    // We don't have a scout for this room already.
                    && !CreepManager.getScoutsByWorkRoom(f).length
                    // Its in range to us.
                    && Cartographer.isInRouteDistance(room.name, f, Config.params.MAX_SCOUT_RANGE)
                )

                // Now sort to get closest rooms.
                rooms = _.sortByOrder(rooms, [
                    sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
                ]);

                for (let i=0; i<rooms.length; i++) {
                    let workRoom = rooms[i];

                    room.logRoom('needs early scout for ' +  utils.getRoomHTML(workRoom))
                    creepSpawned = (spawn.createCreepScout(workRoom) == OK);
                    if (creepSpawned) scoutRooms[workRoom] = true;
                    if (creepSpawned) delete SignManager.removeSign(room.name);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
            }


            // SIGN SCOUTS
            // Send scouts to rooms found to have the wrong sign.
            if (
                !FlagManager.throttleFlag
                && !room.colonyUnsafe
                && room.okToSpawnAuxiliaryCreep
                && room.isStorageEnergyNormal
                && !room.isTemple
                && room.isCastle
            ) {
                // Get a list of potential rooms we can reach.
                // This list is already sorted by value in the room, so the first room found by the filter is the best room.
                let signs = SignManager.getSignHash();
                let rooms = Object.keys(signs).filter(f =>
                    // Multiple actions here will send scouts, don't send more than 1.
                    !scoutRooms[f]
                    // We are not purposely avoiding this room.
                    && !FlagManager.avoidFlags[f]
                    // There are no destroy flags in this room.
                    && !FlagManager.destroyFlagsByRoomName(f).length
                    // Don't send scouts too often, as it might be impossible to get to the location.
                    && (signs[f] + Config.params.SIGN_SCOUT_COOLDOWN < Game.time)
                    // We don't have a scout for this room already.
                    && !CreepManager.getScoutsByWorkRoom(f).length
                    // Its in range to us.
                    && Cartographer.isInRouteDistance(room.name, f, Config.params.MAX_SCOUT_RANGE)
                )

                // Now sort to get closest rooms.
                rooms = _.sortByOrder(rooms, [
                    sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
                ]);

                for (let i=0; i<rooms.length; i++) {
                    let workRoom = rooms[i];

                    room.logRoom('needs sign scout for ' +  utils.getRoomHTML(workRoom))
                    creepSpawned = (spawn.createCreepScout(workRoom) == OK);
                    if (creepSpawned) scoutRooms[workRoom] = true;
                    if (creepSpawned) delete SignManager.removeSign(room.name);
                    if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
                }
            }


        }

        // Return success if a creep was actually spawned or if anything is currently being spawned.
        return creepSpawned || !!room.spawns.find(f => f.spawning);
    };

};
