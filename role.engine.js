"use strict";

module.exports = function() {

    Creep.prototype.switchToTask = function(task) {
        //If the task we are on is the same as the one requested, bail out.
        if (this.task && this.task === task) return;

        // Set the new task.
        this.task = task;

        // Reset targets that are only relevant to that task.
        delete this.memory.stickyTargetId;
        delete this.memory.stickyMoveToPos;
        delete this.memory.harvestId;
    }

    /**
     * Peons do four things:
     * 1. Fill up extensions.
     * 2. Build all structures.
     * 3. Repair walls, to a threshold.
     * 4. Upgrade controller, unless at level 8
     */
    Object.defineProperty(Room.prototype, 'shouldPeonWithdrawEnergyFromStorage', {
		get() {
            if (typeof this._shouldPeonWithdrawEnergyFromStorage === "undefined") {
                // Shorthand.
                let room = this;
                let result = false;

                do {
                    // If there is no storage, then yes pull by any and all storage containers.
                    if (!room.storage) { result = true; break; }

                    // If there is no king, then yes pull by any and all storage containers.
                    if (!room.isTemple && !room.king) { result = true; break; }

                    // Something bad happened to our primary spawn!
                    if (!room.colonySpawn1) { result = true; break; }

                    // Peons will pull from storage when having immediate need of ...
                    if (room.isStorageEnergyMinimal) {
                        // Refilling spawns.
                        if (!room.isTemple &&!room.nonKingEnergyFull && !room.rook) { result = true; break; }

                        // Hostiles are in our room. Can always upgrade walls or fill spawns.
                        if (room.colonyUnsafe) { result = true; break; }

                        // We are building.
                        if (room.myConstructionSites.length) { result = true; break; }
                    }

                    // End game upgrading.
                    // Multiple peons should not bother upgrading at level 8.
                    // Either let gnomes do it, or let upgraders do it better than peons.
                    // if (
                    //     room.atMaxLevel
                    //     && room.isStorageEnergyDump
                    //     && !room.creepsUpgradingWorkParts
                    //     && !CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(room.controller.id).length
                    // ) { result = true; break; }

                    // Early game upgrading.
                    // As long as we have energy, use it.
                    if (
                        !room.atMaxLevel
                        && room.storage
                        && room.isStorageEnergyNormal
                        && !CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(room.controller.id).length
                    ) { result = true; break; }

                    // Walls up to peon level (bare minimum).
                    // Upgrade our walls while we have energy to do so.
                    // Masons will take care of end game walls.
                    if (
                        room.isStorageEnergyAbundant
                        && room.hasBarrierBelowWorkerRepairThreshhold
                    ) { result = true; break; }

                // This is a fake while loop; only using for break feature above.
                } while (false);

                this._shouldPeonWithdrawEnergyFromStorage = result;
            }
			return this._shouldPeonWithdrawEnergyFromStorage;
		},
		configurable: true, enumerable: true,
    });

    /**
     * Peons do four things:
     * 1. Fill up extensions.
     * 2. Build all structures.
     * 3. Repair walls, to a threshold.
     * 4. Upgrade controller, unless at level 8
     */
    Object.defineProperty(Room.prototype, 'shouldLlamaWithdrawEnergyFromStorage', {
		get() {
            if (typeof this._shouldLlamaWithdrawEnergyFromStorage === "undefined") {
                // Shorthand.
                let room = this;
                let result = false;

                do {
                    // If there is no storage, then yes pull by any and all storage containers.
                    if (!room.storage) { result = true; break; }

                    // If there is no king, then yes pull by any and all storage containers.
                    if (!room.king) { result = true; break; }

                    // Something bad happened to our primary spawn!
                    if (!room.colonySpawn1) { result = true; break; }

                    // Peons will pull from storage when having immediate need of ...
                    if (room.isStorageEnergyMinimal) {
                        // Refilling spawns.
                        if (!room.nonKingEnergyFull) { result = true; break; }

                        // Need to fill towers.
                        if (room.colonyTowersNeedsEnergy) { result = true; break; }

                        // Need to fill labs.
                        if (room.labNeedsEnergy) { result = true; break; }

                        // Need to fill the controller containers.
                        if (room.controllerContainerNeedsEnergy) { result = true; break; }
                    }

                    // Peons will use while storage is abudant and there aren't dropped resources on the map.
                    // Careful there could be only minerals in these structures.
                    if ((CreepManager.getPeonsByFocusId(room.controller.id).length === 1) && (room.droppedEnergy.length || room.decayables.length)) { result = false; break; }

                // This is a fake while loop; only using for break feature above.
                } while (false);

                this._shouldLlamaWithdrawEnergyFromStorage = result;
            }
			return this._shouldLlamaWithdrawEnergyFromStorage;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldConsumeEnergyStrict', {
		get() {
            if (typeof this._shouldConsumeEnergyStrict === "undefined") {
                // Shorthand.
                let creep = this;
                let room = creep.room;

                // Default is true for loose; false for strict.
                let result = false;

                do {
                    // No king, do whatever we want!
                    if (!room.king) { result = true; break; }

                    // Need bare minimum energy for spawning.
                    if (!room.isStorageEnergyMinimal) { result = false; break; }

                    // These roles can consume all day long!
                    if (creep.isUseEnergyCreep) { result = true; break; }

                    // If this is a low level room (highway, sk, or reserved room) then build away always.
                    if (!room.controller || room.controller.level <= 1) { result = true; break; }

                    if (!room.myStorage) { result = true; break; }

                    // Energy that may be around. Updated to exclude drops as they may be unreachable.
                    if (room.isStorageEnergyDump) { result = true; break; }

                    // Strick vs loose.
                    if (room.isStorageEnergyAbundant || !room.hasBarrierBelowWorkerRepairThreshhold) { result = true; break; }

                    // This is a fake while loop; only using for break feature above.
                } while (false);

                this._shouldConsumeEnergyStrict = result;
            }
			return this._shouldConsumeEnergyStrict;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldConsumeEnergyLoose', {
		get() {
            if (typeof this._shouldConsumeEnergyLoose === "undefined") {
                // Shorthand.
                let creep = this;
                let room = creep.room;

                // Default is true for loose; false for strict.
                let result = true;

                do {
                    // These roles can consume all day long!
                    if (creep.isUseEnergyCreep) { result = true; break; }

                    // Temples should not hold back.
                    if (room.isTemple) { result = true; break; }

                    // Need bare minimum energy for spawning.
                    if (!room.isStorageEnergyMinimal) { result = false; break; }

                    // Strick vs loose.
                    if (room.isStorageEnergyAbundant) { result = true; break; }

                    // This is a fake while loop; only using for break feature above.
                } while (false);

                this._shouldConsumeEnergyLoose = result;
            }
			return this._shouldConsumeEnergyLoose;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'stickyTarget', {
		get() {
            return Game.getObjectById(this.memory.stickyTargetId);
        },
        set(value) {
            delete this.memory.stickyTargetId;
            if (value && value.id) {
                this.memory.stickyTargetId = value.id;
            }
        },
        configurable: true, enumerable: true,
    });

	Creep.prototype.getStickyMoveToPos = function() {
        // Our sticky target is the same, so return the position we have saved.
        if (
            this.memory.stickyTargetId
            && this.memory.stickyMoveToPos
            && (this.memory.stickyMoveToPos.id === this.memory.stickyTargetId)
        ) {
            return new RoomPosition(this.memory.stickyMoveToPos.x, this.memory.stickyMoveToPos.y, this.memory.stickyMoveToPos.roomName);
        }

        return null;
    };

	Creep.prototype.saveStickyMoveToPos = function(target) {
        delete this.memory.stickyMoveToPos;
        // We have to have a sticky target to remember where we were going.
        if (this.memory.stickyTargetId && target) {
            let pos = utils.normalizePos(target);
            if (pos) {
                this.memory.stickyMoveToPos = {};
                this.memory.stickyMoveToPos.id = this.memory.stickyTargetId;
                this.memory.stickyMoveToPos.x = pos.x;
                this.memory.stickyMoveToPos.y = pos.y;
                this.memory.stickyMoveToPos.roomName = pos.roomName;
            }
        }
    };

	Object.defineProperty(Creep.prototype, 'stickyTargetPos', {
		get() {
            if (this.memory.stickyTargetPos) {
                return utils.posFromName(this.memory.stickyTargetPos);
            }
            return null;
        },
        set(value) {
            this.memory.stickyTargetPos = value ? utils.normalizePos(value).name : null;
        },
        configurable: true, enumerable: true,
    });

    Creep.prototype.clearStickyTarget = function() {
        delete this.memory.stickyTargetId;
        delete this.memory.stickyTargetPos;
    }

	Object.defineProperty(Creep.prototype, 'meleeAttackPos', {
		get() {
            if (this.memory.meleeAttackPos) {
                return utils.posFromName(this.memory.meleeAttackPos);
            }
            return null;
        },
        set(value) {
            this.memory.meleeAttackPos = value ? utils.normalizePos(value).name : null;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'rangedAttackPos', {
		get() {
            if (this.memory.rangedAttackPos) {
                return utils.posFromName(this.memory.rangedAttackPos);
            }
            return null;
        },
        set(value) {
            this.memory.rangedAttackPos = value ? utils.normalizePos(value).name : null;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'farmerOnFocusTarget', {
		get() {
            if (typeof this._farmerOnFocusTarget === undefined) {
                this._farmerOnFocusTarget = null;
                let focusTarget = this.focusTarget;
                if (focusTarget) {
                    let creep = focusTarget.pos.lookForCreep();
                    if (creep) {
                        this._farmerOnFocusTarget = creep.isFarmer;
                    }
                }
            }
            return this._farmerOnFocusTarget;
        },
        configurable: true, enumerable: true,
    });

    Creep.prototype.getStickyTargetFreeCapacity = function(resourceType) {
        // Shorthand.
        let creep = this;

        if (!creep.stickyTarget) return;
        if (!creep.stickyTarget.store) return;

        return creep.stickyTarget.store.getFreeCapacity(resourceType);
    };

    Creep.prototype.task_initialize = function() {
        // Make sure we have a valid task. If not, set to first task in our loop.
        if (!Config.tasks[this.task]) this.switchToTask(Config.tasks.BOOTSTRAP);

        // Check to see if we need to bail out of this room.
        // This is VERY expensive operation; not really worth the CPU since we go very long stretches without being attacked/nuked.
        //if (Config.roleGroups.EVACUATE[this.role] && this.evacuateRoom()) return true;

        // Everything looks good, indicate we don't have any work in this step.
        return false;
    }

    Creep.prototype.task_boost_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.storeEmpty
            || creep.isProperlyBoosted
            || !room.hasBoostStructures
        );
    }

    Creep.prototype.task_boost = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.isProperlyBoosted) return false;
        if (!room.hasBoostStructures) return false;

        // Try to boost/unboost the creep if hostiles, lab & materials present.
        if (creep.boosting()) return true;

        // Stay in this task until exit criteria is met. Take a nap while we wait.
        creep.nap();
        return true;
    }

    Creep.prototype.task_unboost_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.isBoosted
        );
    }

    Creep.prototype.task_unboost_prophet_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.isBoosted
            || (creep.ticksToLive > Config.params.UNBOOST_MIN_TTL)
        );
    }

    Creep.prototype.task_unboost_worker_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.isBoosted
            || (creep.ticksToLive > Config.params.UNBOOST_MIN_TTL)
            || !room.colonyLabs.length
        );
    }

    Creep.prototype.task_unboost_transporter_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.isBoosted
            || !Game.rooms[creep.workRoom]
            || !Game.rooms[creep.workRoom].terminal
        );
    }

    Creep.prototype.task_unboost = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.isBoosted) return false;

        // Find our unboost lab.  Its possible we won't have one (all on cooldown), in which case bail out.
        let target = room.unboostLab;
        if (!target) {
            // Stay in this task until a lab frees up.
            creep.nap();
            return true;
        }

        // Try to unboost the creep.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartUnboost(target))) return true;

        // Stay in this task until exit criteria is met. Take a nap while we wait.
        creep.nap();
        return true;
    }

    Creep.prototype.task_recycle_stop_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.storeEmpty
            || !GameManager.haltStop
        );
    }

    Creep.prototype.task_recycle_stop = function() {
        // Shorthand.
        let creep = this;

        // We do have a chance to bail out of death if our CPU recovers before we actually die.
        if (!GameManager.haltStop) return false;

        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_recycle_criteria = function() {
        return (
            !this.room.my
        );
    }

    Creep.prototype.task_recycle_worker_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.storeEmpty
            || (creep.ticksToLive > Config.params.UNBOOST_MIN_TTL)
        );
    }

    Creep.prototype.task_recycle_unboosted_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.isBoosted
        );
    }

    Creep.prototype.task_recycle = function() {
        // Shorthand.
        let creep = this;

        // No exit criteria, just death. Haha...

        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_renew_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Note that the creep testing entry into this step is already IN this step.
        // So the creeps renewing will be at least 1.
        return (
            !room.my
            || creep.doNotRenew
        );
    }

    Creep.prototype.task_renew = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!room.colonyRenewPos) return false;

        // If i'm not dieing and not already on the renew spot, and someone else is waiting in queue (because they are deing) or spawns are busy, then give up our spot.
        if (
            !creep.needsReplacement
            && creep.canMakeWorkRoomRoundTrip
            && !creep.renewAvailableOrInProgress
        ) {
            return false;
        }

        // Spawns are sucked dry, and there is no storage to pull from. Bail out.
        if (room.energyAvailable < creep.renewCost) {
            return false;
        }

        // I'm not at the renew spot, but someone is on it for whatever reason. Just nap for a bit.
        if (!creep.isOnColonyRenewPos && room.isCreepOnColonyRenewPos) {
            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.nap();
            return true;
        }

        // Renew me, and make sure it gets done.
        let result = creep.smartRenew();
        if ([OK, ERR_NOT_IN_RANGE, ERR_BUSY].includes(result)) return true;

        // If we have no energy and but there is immediate help available, then hold tight.
        if ([ERR_NOT_ENOUGH_ENERGY].includes(result) && room.storage && room.storage.store[RESOURCE_ENERGY] && room.king) return true;

        // Creep is full or can't renew anymore, we are done.
        return false;
    }

    Creep.prototype.task_renew_topoff_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Note that the creep testing entry into this step is already IN this step.
        // So the creeps renewing will be at least 1.
        return (
            !room.my
            || creep.doNotRenew
        );
    }

    Creep.prototype.task_renew_topoff = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!room.colonyRenewPos) return false;

        // Do I have enough life to make the round trip?
        if (
            creep.canMakeWorkRoomRoundTrip
            && !creep.renewAvailableOrInProgress
        ) return false;

        // Spawns are sucked dry, and there is no storage to pull from. Bail out.
        if (room.energyAvailable < creep.renewCost) {
            return false;
        }

        // I'm not at the renew spot, but someone is on it for whatever reason. Just nap for a bit.
        if (!creep.isOnColonyRenewPos && room.isCreepOnColonyRenewPos) {
            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.nap();
            return true;
        }

        // Renew me, and make sure it gets done.
        let result = creep.smartRenew();
        if ([OK, ERR_NOT_IN_RANGE, ERR_BUSY].includes(result)) return true;

        // If we have no energy and but there is immediate help available, then hold tight.
        if ([ERR_NOT_ENOUGH_ENERGY].includes(result) && room.storage && room.storage.store[RESOURCE_ENERGY] && room.king) return true;

        // Creep is full or can't renew anymore, we are done.
        return false;
    }

    Creep.prototype.task_clear_workRoom_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            (creep.energyEmpty && creep.shouldDisengageFromCurrentRoom)
        );
    }

    Creep.prototype.task_clear_workRoom = function() {
        // Shorthand.
        let creep = this;

        // Reset the work room to be our assigned room.
        creep.workRoom = creep.assignedRoom || creep.spawnRoom;
        return false;
    }

    Creep.prototype.task_clear_focus_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.focusId
        );
    }

    Creep.prototype.task_clear_focus = function() {
        // Shorthand.
        let creep = this;

        // Reset the focus.
        creep.focusId = null;
        return false;
    }

    Creep.prototype.task_update_workRoom_rogue_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.store.getUsedCapacity()
        );
    }

    Creep.prototype.task_update_workRoom_rogue = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Reset the work room to be our spawn room so it doesn't get picked up in carry amounts.
        let assignedRoom = creep.assignedRoom;
        creep.workRoom = assignedRoom;

        // Manually check our own room first for loose change.
        if (RoomIntel.getPlunderableAmount(assignedRoom)) return false;

        // We are changing work rooms, but we are hauling something, just return to spawn and dump.
        if (creep.store.getUsedCapacity()) return false;

        // Another rogue has been updated; stand down until next tick.
        if (GameManager.hasRogueWorkRoomBeenSet) {
            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.nap();
            return true;
        }

        // Get a list of potential rooms we can reach.
        let rooms = GameManager.roomsWithPlunderables.filter(f =>
            // Make sure we can reach this room.
            Cartographer.isInRouteDistance(assignedRoom, f, Config.params.MAX_ROGUE_RANGE)
        );

        // Now sort to find non-energy loot, and then by closest room.
        rooms = _.sortByOrder(rooms, [
            sortHash => Object.keys(RoomIntel.getPlunderableHash(sortHash) || {}).find(f => f !== RESOURCE_ENERGY) ? 0 : 1
            , sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
        ]);

        for (let i=0; i<rooms.length; i++) {
            let workRoom = rooms[i];

            // Stay away from hostiles!
            if (GameManager.doesRoomHaveLethalHostilesInRoute(room.name, workRoom)) continue;

            if (
                // Pickup anything in our room.
                (workRoom === assignedRoom)

                // Is the amount in the room (after those assigned to it already) more than what they can carry?
                || (RoomIntel.getPlunderableAmount(workRoom) - CreepManager.getRogueCarryCapacityByWorkRoom(workRoom) - CreepManager.getBurroCarryCapacityByWorkRoom(workRoom) > this.store.getCapacity())

                // And we have something valuable in this room. Go investigate!
                || !CreepManager.getRogueCarryCapacityByWorkRoom(workRoom)
            ) {
                // Make an empire wide note that a rogue was assigned on this tick, to stop other rogues from being assigned in a race condition.
                GameManager.hasRogueWorkRoomBeenSet = true;

                // A work room was found, set it and return.
                creep.workRoom = workRoom;
                room.logRoom('sending rogue to ' +  utils.getRoomHTML(workRoom) + ' which contains ' + RoomIntel.getPlunderableAmount(workRoom) + ' loot valued at ' + RoomIntel.getPlunderableValue(workRoom));
                return false;
            }
        }

        // If we are our assigned room, just stay here and nap.
        if (creep.inAssignedRoom) {
            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.nap();
            return true;
        }

        // Reset our workroom to go home, if it isn't already.
        return false;
    }

    Creep.prototype.task_update_workRoom_builder_criteria = function() {
        // Shorthand.
        let creep = this;

        // Always enter so that the room can be reset if nothing else.
        return (
            false
        );
    }

    Creep.prototype.task_update_workRoom_builder = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Reset the work room to be our assigned room as a baseline.
        creep.workRoom = creep.assignedRoom;

        // If our assigned room isn't visible, we can't possibly choose new work rooms.
        let assignedRoom = Game.rooms[creep.assignedRoom];
        if (!assignedRoom) return false;
        if (assignedRoom.myConstructionSites.length) return false;
        if (!assignedRoom.shouldCreateSourceTrails) return false;

        // Get a list of potential rooms we can reach.
        let rooms = assignedRoom.reservedRoomNamesWithConstructionSites;

        // Now sort to get closest rooms.
        rooms = _.sortBy(rooms,
            sortDistance => Cartographer.findRouteDistance(room.name, sortDistance)
        );

        for (let i=0; i<rooms.length; i++) {
            let workRoom = rooms[i];

            if (
                !GameManager.doesRoomHaveLethalHostilesInRoute(room.name, workRoom)
            ) {
                // A work room was found, set it and return.
                creep.workRoom = workRoom;
                room.logRoom('sending constructor ' + creep.name + ' to ' +  utils.getRoomHTML(workRoom));
                return false;
            }
        }

        // Reset our workroom to go home, if it isn't already.
        return false;
    }

    Creep.prototype.task_move_to_workRoom_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inWorkRoom
            || !creep.storeEmpty
        );
    }

    Creep.prototype.task_move_to_workRoom_notempty_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inWorkRoom
        );
    }

    Creep.prototype.task_move_to_workRoom = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.inWorkRoom) return false;

        // Move towards the assigned room.  Assume we are going to the storage.
        let target = null;
        let targetRoom = creep.workRoom;
        if (targetRoom && Game.rooms[targetRoom]) {
            if (creep.hasMinerals && Game.rooms[targetRoom].terminal) {
                target = Game.rooms[targetRoom].terminal;
            } else if (Game.rooms[targetRoom].storage) {
                target = Game.rooms[targetRoom].storage;
            }
        }

        // Move towards the work room.
        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let result = this.moveToWorkRoom(target);
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToWorkRoom:', creep.name, creep.room.print, result);

            // In the event ERR_INVALID_ARGS was returned, just return to spawn room.
            if (creep.canResetWorkRoom) {
                creep.workRoom = creep.assignedRoom;
            }
        }
        return true;
    }

    Creep.prototype.task_move_to_workRoom_cached = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.inWorkRoom) return false;

        // Move towards the assigned room.  Assume we are going to the storage.
        let target = null;
        let targetRoom = creep.workRoom;
        if (targetRoom && Game.rooms[targetRoom]) {
            if (creep.hasMinerals && Game.rooms[targetRoom].terminal) {
                target = Game.rooms[targetRoom].terminal;
            } else if (Game.rooms[targetRoom].storage) {
                target = Game.rooms[targetRoom].storage;
            }
        }

        // Move towards the work room.
        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let options = { useCachedPath: true }
        let result = this.moveToWorkRoom(target, options);
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToWorkRoom:', creep.name, creep.room.print, result);

            // In the event ERR_INVALID_ARGS was returned, just return to spawn room.
            if (creep.canResetWorkRoom) {
                creep.workRoom = creep.assignedRoom;
            }
        }

        return true;
    }


    Creep.prototype.task_update_workRoom_ox_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inAssignedRoom
        );
    }

    Creep.prototype.task_update_workRoom_ox = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.inAssignedRoom) return false;

        // Reset the work room to be our spawn room so it doesn't get picked up in carry amounts.
        creep.workRoom = creep.assignedRoom;
        creep.focusId = null;
        creep.moveToPos = null;

        // Bail out if we have mats in our store for some reason.
        if (creep.store.getUsedCapacity()) return false;

        // Don't attempt to set this every tick.
        if ((Game.time % Config.params.OX_UPDATE_WORKROOM_MOD !== 0) && !GameManager.isCpuMaxed) {
            creep.nap({talk:'⏳'});
            return true;
        }

        // Only the youngest idle creep can update their work room. This allows the old to die off if not needed.
        if (!creep.isYoungestIdleOx) {
            creep.nap({talk:'⏳'});
            return true;
        }

        // Find data for first reserved room that needs a hauler.
        let workRoomData = room.reservedRoomSourceContainerData[0];
        if (workRoomData) {
            creep.workRoom = workRoomData.roomName;
            creep.focusId = workRoomData.id;
            creep.moveToPos = workRoomData.moveToPos;
            return false;
        }

        // No reserved room needs us, so just sit tight.
        // Stay in this task until exit criteria is met. Take a nap while we wait.
        creep.nap();
        return true;
    }

    Creep.prototype.task_move_to_workRoom_rogue_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.workRoom
            || creep.inWorkRoom
            || !creep.storeEmpty  // WHY WAS THIS COMMENTED OUT?
            || !RoomIntel.getPlunderableAmount(creep.workRoom)
        );
    }

    Creep.prototype.task_move_to_workRoom_rogue = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.workRoom) return false;
        if (creep.inWorkRoom) return false;
        if (!creep.storeEmpty) return false;  // WHY WAS THIS COMMENTED OUT?
        if (!RoomIntel.getPlunderableAmount(creep.workRoom)) return false;

        // Move towards the work room.
        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let result = this.moveToWorkRoom();
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToWorkRoom:', creep.name, creep.room.print, result);

            // In the event ERR_INVALID_ARGS was returned, just return to spawn room.
            if (creep.canResetWorkRoom) {
                creep.workRoom = creep.spawnRoom;
            }
        }
        return true;
    }

    Creep.prototype.task_move_to_assignedRoom_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inAssignedRoom
        );
    }

    Creep.prototype.task_move_to_assignedRoom_notempty_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inAssignedRoom
            || (creep.storeEmpty && !creep.shouldDisengageFromCurrentRoom)
        );
    }

    Creep.prototype.task_move_to_assignedRoom = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.inAssignedRoom) return false;

        // Move towards the assigned room.  Assume we are going to the storage.
        let target = null;
        let targetRoom = creep.assignedRoom;
        if (targetRoom && Game.rooms[targetRoom]) {
            if (creep.hasMinerals && Game.rooms[targetRoom].terminal) {
                target = Game.rooms[targetRoom].terminal;
            } else if (Game.rooms[targetRoom].storage) {
                target = Game.rooms[targetRoom].storage;
            }
        }

        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let result = this.moveToAssignedRoom(target);
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToAssignedRoom:', creep.name, creep.room.print, result);
        }
        return true;
    }

    Creep.prototype.task_move_to_assignedRoom_cached_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inAssignedRoom
            || (creep.storeEmpty && !creep.shouldDisengageFromCurrentRoom)
        );
    }

    Creep.prototype.task_move_to_assignedRoom_cached = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.inAssignedRoom) return false;
        // Once we take a hit while empty, leave the battlefield for repairs.
        if (creep.storeEmpty && !creep.shouldDisengageFromCurrentRoom) return false;

        // Move towards the assigned room.  Assume we are going to the storage.
        let target = null;
        let targetRoom = creep.assignedRoom;
        if (targetRoom && Game.rooms[targetRoom]) {
            if (creep.hasMinerals && Game.rooms[targetRoom].terminal) {
                target = Game.rooms[targetRoom].terminal;
            } else if (Game.rooms[targetRoom].storage) {
                target = Game.rooms[targetRoom].storage;
            }
        }

        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let options = { useCachedPath: true };
        let result = this.moveToAssignedRoom(target, options);
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToAssignedRoom:', creep.name, creep.room.print, result);
        }
        return true;
    }

    Creep.prototype.task_move_to_spawnRoom_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.inSpawnRoom
        );
    }

    Creep.prototype.task_move_to_spawnRoom = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.inSpawnRoom) return false;

        // Move towards the spawn room.
        // Its possible that we are picking a 25,25 pos on a wall, and can't get to it.
        let result = this.moveToSpawnRoom();
        if (![OK, ERR_TIRED, ERR_NO_PATH].includes(result)) {
            console.log('ALERT! problem with moveToSpawnRoom:', creep.name, creep.room.print, result);
        }
        return true;
    }

    Creep.prototype.task_bunker_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.shouldBunkerInAssignedRoom
        );
    }

    Creep.prototype.task_bunker = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.shouldBunkerInAssignedRoom) return false;

        // Return to the assigned room, and then take a nap!
        if (creep.inAssignedRoom) {
            this.nap();
        }
        else {
            this.moveToAssignedRoom();
        }

        // Always return true as we are busy moving/napping until exit criteria is met.
        return true;
    }

    Creep.prototype.task_labwork_criteria = function() {
        // Get the count of creeps working in this room already doing LABWORK.
        // Or the lab has been processed and found lacking/empty, so don't need to process it again this tick by other peons.
        return (
            false
            //(room.myCreepsDoingLabwork.length > 1)
        );
    }

    Creep.prototype.task_labwork = function() {
        // Shorthand.
        let creep = this;

        // Ener the lab and start mixing shit up!
        if (creep.manageLab()) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_portal_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Have to have a portal entry.
        return (
            !creep.focusTarget
            || !room.targetIsPortal(creep.focusTarget)
        );
    }

    Creep.prototype.task_portal = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        if (!creep.focusTarget) return false;
        if (!room.targetIsPortal(creep.focusTarget)) return false;

        let target = creep.focusTarget;

        if (target) {
            creep.talk('🧿');
            creep.smartMove(target);
            return true;
        }

        return false;
    }

    Creep.prototype.task_claim_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    Creep.prototype.task_claim = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;
        let result = null;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!room.controller) return false;

        if (room.my) {
            // Once room is owned and isn't a temple and we have a colony flag up, then bail out.
            if (!room.isTemple && room.colonyFlag) return false;
            // Our room, not a temple, and the room level is greater than one.
            // While it is only level one, we are likely cleaning the room of hostile structures.
            if (!room.isTemple && (room.controller.level > 1)) return false;
            // Our room, is a temple, and the room level is one, bail out now.
            if (room.isTemple && (room.controller.level === 1)) return false;

            // Do nothing, just chill out here for a bit.
            creep.nap();
            return true;
        }

        // If we are reserving only..just do that. Save those cpu cycles...
        if (creep.reserveOnly && (room.reservedByMe || room.reservedByNobody)) {
            result = creep.smartReserveController(room.controller);

        // Attack the controller if its owned or reserved by someone else.
        } else if (room.reservedByOther) {
            result = creep.smartAttackController(room.controller, false);

        // Attack the controller if its owned by someone else, wait to attack until
        // all nips are filled with preachers so we can attack at once.
        } else if (room.ownedByOther) {

            // Not enough life left to do anything. I am useless, kill myself.
            if (creep.ticksToLive < (room.controller.upgradeBlocked || 0)) {
                return false;
            }

            let attackNow = room.shouldAttackControllerNow;
            result = creep.smartAttackController(room.controller, !attackNow);

        // Claim the controller if it is not owned, or its a reserved room that needs to be cleaned out.
        } else if (room.doClaimRoom || room.canRoomBeClaimed) {
            result = creep.smartClaimController(room.controller);
            if (result === OK) {
                if (room.claimFlag && room.colonyFlag) {
                    room.logRoom('room claimed -- congrats and good luck!!!');
                }
                else {
                    room.logRoom('room claimed');
                }
            }

            // May not have the GCL, so just reserve it.
            if (result === ERR_GCL_NOT_ENOUGH) {
                room.logRoom('room cannot be claimed due to GCL');
                result = creep.smartReserveController(room.controller);
            }

        // Reserve the controller so noone else can get it.
        } else {
            result = creep.smartReserveController(room.controller);

        }

        // Stay in this task until exit criteria bails us out.
        return true;
    }

    Creep.prototype.task_wait_powerbank_destroyed_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.focusTarget
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_wait_powerbank_destroyed = function() {
        // Shorthand.
        let creep = this;
        let focusTarget = creep.focusTarget;
        let pos = null;

        // Exit criteria.
        if (!focusTarget) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        // Determine the best place to be as the powerbank is about to be destroyed.
        if ((focusTarget.hits < Config.params.POWERBANK_RUSH_HITS) && CreepManager.getPowerWorkersByFocusId(focusTarget.id).find(f => f.pos.isNearTo(focusTarget))) {
            // Try to get right up next to the target.
            if (!pos && !creep.pos.isNearTo(focusTarget)) {
                pos = creep.pos.findClosestByDistance(focusTarget.nipsFree);
            }

            if (!pos) {
                // Sorted list of 2nd and 3rd desirable positions.
                let positions = focusTarget.posOfRange1OfNips.concat(focusTarget.posOfRange2OfNips);
                // Find the first position that is better than ours and we are next to it.
                pos = positions.find(f =>
                    creep.pos.isEqualTo(f)
                    || (creep.pos.isNearTo(f) && (f.getRangeTo(focusTarget) < creep.pos.getRangeTo(focusTarget)) && !f.lookForCreep())
                );
            }

            // if (!pos && !focusTarget.posNameOfRange1OfNipsHash[creep.pos.name]) {
            //     pos = creep.pos.findClosestByDistance(focusTarget.posOfRange1OfNips.filter(f => !f.lookForCreep()));
            // }
            // if (!pos && !focusTarget.posNameOfRange2OfNipsHash[creep.pos.name]) {
            //     pos = creep.pos.findClosestByDistance(focusTarget.posOfRange2OfNips.filter(f => !f.lookForCreep()));
            // }

            if (!pos) pos = focusTarget;
        }
        else if (focusTarget.hits < Config.params.POWERBANK_PREP_HITS) {
            if (!focusTarget.posNameOfRange2OfNipsHash[creep.pos.name]) {
                pos = creep.pos.findClosestByDistance(focusTarget.posOfRange2OfNips.filter(f => !f.lookForCreep()));
            }
        }
        else {
            if (!focusTarget.posNameOfRange3OfNipsHash[creep.pos.name]) {
                pos = creep.pos.findClosestByDistance(focusTarget.posOfRange3OfNips.filter(f => !f.lookForCreep()));
            }
        }

        // Make our move if needed.
        if (pos) {
            this.talk('🚛');
            creep.smartMove(pos);
        }
        else {
            this.talk('🚬');
        }

        // Waiting until the focus is destroyed.
        return true;
    }

	Object.defineProperty(Creep.prototype, 'mostValuableDrops', {
		get() {
			if (typeof this._mostValuableDrops === "undefined") {
                let drops = [];
                if (this.shouldCollectMinerals) {
                    // Get the best resource type in the room.
                    let resourceType = _.sortBy(this.room.droppedResources, s => GameManager.resourceTypeValueSort(s.resourceType)).map(m => m.resourceType).find(x => x !== undefined);

                    // Then get that types value, and filter on all drops with that same level of value. Could be multiple at this level.
                    let resourceValue = GameManager.resourceTypeValueSort(resourceType);
                    drops = this.room.droppedResources.filter(f => GameManager.resourceTypeValueSort(f.resourceType) === resourceValue);
                }
                else {
                    // Only filter on energy.
                    drops = this.room.droppedResources.filter(f => f.resourceType === RESOURCE_ENERGY);
                }
                this._mostValuableDrops = drops;
			}
			return this._mostValuableDrops;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.task_forage_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || room.colonyUnsafe
            || room.myTransporterCreepsIdle.length
        );
    }

    /**
     * Lots of potential pitfalls in this logic.
     * Multiple creeps could head to the same store, only to have it be used up.
     * We don't reserve specific resources in the store for creeps.
     */
    Creep.prototype.task_forage = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        if (creep.storeFull) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.value
                //&& !creep.shouldFleeFromLair(object)
            )
        }
        let taskFilterPartial = function(object) {
            return (
                taskFilterBase(object)
                && (
                    creep.pos.isNearTo(object)
                    || (object.store && (object.store.getUsedCapacity() >= creep.getReservedCapacity(object.id)))
                    || (object.amount && (object.amount >= creep.getReservedCapacity(object.id)))
                )
                //&& !object.pos.hasHostileRampartHits
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            //let objects = room.foragables;
            //let typeCount = room.foragableTypes.length;

            let objects = creep.shouldCollectMinerals ? room.foragables : room.foragableEnergy;
            let typeCount = creep.shouldCollectMinerals ? room.foragableTypes.length : (room.foragableEnergy.length ? 1 : 0);

            // If there are multiple types, then goto the location that has the highest value.
            if (typeCount > 1) {
                // Find the most valueable object to gather from.
                // This algorithm goes to the average value per unit object.
                target = room.foragablesSorted.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));

            }
            // All resources are of same type (likely energy).
            else if (typeCount === 1) {

                if (room.myConstructionSites.length) {
                    // If there are construction sites out, get the drops nearest to them.
                    let closest = _.sortByOrder(objects, [
                        sortRangeToSite => sortRangeToSite.pos.getRangeTo(sortRangeToSite.pos.findClosestByRange(room.myConstructionSites))
                        , sortRangeToCreep => creep.pos.getRangeTo(sortRangeToCreep)
                    ]);
                    target = closest.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));
                }

                if (!target) {
                    // Just find the closest.
                    target = creep.pos.findClosestByPath(objects, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterPartial(f)
                    });
                }

            }

        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If we have a store object, then withdraw from it.
            if (target.store) {
                if (!target.store[RESOURCE_ENERGY] && !creep.shouldCollectMinerals) {
                    // Its possible someone comes and steals our energy!
                    creep.clearStickyTarget();
                } else {
                    // Don't bother figuring out the resourceType to gather until we get next to the target.
                    let resourceType = creep.pos.isNearTo(target) ? target.storeMostValuableResource : Object.keys(target.store)[0];
                    creep.smartGather(target, creep.shouldCollectMinerals ? resourceType : RESOURCE_ENERGY);
                }
            }
            // Otherwise we have a dropped resource, pick it up.
            else if (target.amount) {
                // Pickup this drop.
                creep.smartPickup(target);
            }

            // Still working...
            return true;
        }

        // Nothing left to gather, bail out.
        return false;
    }

    Creep.prototype.task_pickup_resource_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.storeFull
        );
    }

    /**
     * Pickup anything directly under us, until we are out of room or nothing is left.
     */
    Creep.prototype.task_pickup_resource = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        if (creep.storeFull) return false;

        // Pickup success? Ok and try again next tick.
        if (creep.optimisticPickupResource() === OK) return true;

        return false;
    }


    Room.prototype.inWorkingZone = function(object) {
        if (!this.controller) return false;
        if (!this.my || this.atMaxLevel) return false;
        if (!CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(this.controller.id).length) return false;
        if (this.sources.find(f => f.harvestPos.isEqualTo(object))) return false;
        return this.controller.pos.inRange3(object);
    }

    Creep.prototype.task_gather_most_valuable_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || room.colonyUnsafe
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    /**
     * Lots of potential pitfalls in this logic.
     * Multiple creeps could head to the same store, only to have it be used up.
     * We don't reserve specific resources in the store for creeps.
     */
    Creep.prototype.task_gather_most_valuable = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        if (creep.storeFull) return false;
        if (room.colonyUnsafe) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        // This stuff is so deadly that who cares what else may be on the ground, we need to get it assigneded.
        if (creep.store.getUsedCapacity(C.RESOURCE_THORIUM)) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.value
                && !creep.shouldFleeFromLair(object)
            )
        }
        let taskFilterPartial = function(object) {
            return (
                taskFilterBase(object)
                && (
                    creep.pos.isNearTo(object)
                    || (object.store && (object.store.getUsedCapacity() >= creep.getReservedCapacity(object.id)))
                    || (object.amount && (object.amount >= creep.getReservedCapacity(object.id)))
                )
                && !object.pos.hasHostileRampartHits
                && !room.inWorkingZone(object)
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            let objects = creep.shouldCollectMinerals ? room.gatherables : room.gatherableEnergyAny;
            let typeCount = creep.shouldCollectMinerals ? room.gatherableTypes.length : (room.gatherableEnergyAny.length ? 1 : 0);

            // If there are multiple types, then goto the location that has the highest value.
            if (typeCount > 1) {
                // Find the most valueable object to gather from.
                // This algorithm goes to the average value per unit object.
                target = room.gatherablesSorted.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));

            }
            // All resources are of same type (likely energy).
            else if (typeCount === 1) {

                if (room.myConstructionSites.length) {
                    // If there are construction sites out, get the drops nearest to them.
                    let closest = _.sortBy(objects, s => s.pos.getRangeTo(s.pos.findClosestByRange(room.myConstructionSites)))
                    target = closest.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));
                }

                if (!target) {
                    // Just find the closest.
                    target = creep.pos.findClosestByPath(objects, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterPartial(f)
                    });
                }

            }

        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If we have a store object, then withdraw from it.
            if (target.store) {
                // Don't bother figuring out the resourceType to gather until we get next to the target.
                let resourceType = creep.pos.isNearTo(target) ? target.storeMostValuableResource : Object.keys(target.store)[0];
                creep.smartGather(target, creep.shouldCollectMinerals ? resourceType : RESOURCE_ENERGY);
            }
            // Otherwise we have a dropped resource, pick it up.
            else if (target.amount) {
                // Pickup this drop.
                creep.smartPickup(target);
            }

            // Still working...
            return true;
        }

        // Nothing left to gather, bail out.
        return false;
    }

    Creep.prototype.task_gather_energy_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || room.colonyUnsafe
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    /**
     * Lots of potential pitfalls in this logic.
     * Multiple creeps could head to the same store, only to have it be used up.
     * We don't reserve specific resources in the store for creeps.
     */
    Creep.prototype.task_gather_energy = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        if (creep.storeFull) return false;
        if (room.colonyUnsafe) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.value
                && (!object.store || object.store.getUsedCapacity(RESOURCE_ENERGY))
            )
        }
        let taskFilterPartial = function(object) {
            return (
                taskFilterBase(object)
                && (
                    creep.pos.isNearTo(object)
                    || (object.store && (object.store.getUsedCapacity() >= creep.getReservedCapacity(object.id)))
                    || (object.amount && (object.amount >= creep.getReservedCapacity(object.id)))
                )
                && !object.pos.hasHostileRampartHits
                && !room.inWorkingZone(object)
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            let objects = room.gatherableEnergy;

            if (room.myConstructionSites.length) {
                // If there are construction sites out, get the drops nearest to them.
                let closest = _.sortBy(objects, s => s.pos.getRangeTo(s.pos.findClosestByRange(room.myConstructionSites)))
                target = closest.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));
            }

            if (!target) {
                // Just find the closest.
                target = creep.pos.findClosestByPath(objects, {
                    ignoreCreeps: true
                    , filter: (f) => taskFilterPartial(f)
                });
            }

        }

        if (target) {
            // Remember this target.
            creep.memory.stickyTargetId = target.id;

            // If we have a store object, then withdraw from it.
            if (target.store) {
                creep.smartGather(target, RESOURCE_ENERGY);
            }
            // Otherwise we have a dropped resource, pick it up.
            else if (target.amount) {
                // Pickup this drop.
                creep.smartPickup(target);
            }

            // Still working...
            return true;
        }

        // Nothing left to gather, bail out.
        return false;
    }

    Creep.prototype.task_plunder_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_plunder_rook_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || !room.controller
            // Don't plunder if we have llamas in the room, they are doing the gathering.
            || CreepManager.getLlamasByFocusId(room.controller.id).length
        );
    }

    /**
     * Lots of potential pitfalls in this logic.
     * Multiple creeps could head to the same store, only to have it be used up.
     * We don't reserve specific resources in the store for creeps.
     */
    Creep.prototype.task_plunder = function(storeState) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (creep.storeFull) return false;
        if (!room.my && creep.isQuarterDamaged) return false;

        // This stuff is so deadly that who cares what else may be on the ground, we need to get it assigneded.
        //if (creep.store.getUsedCapacity(C.RESOURCE_THORIUM)) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (
                    object.value
                    || (
                        // If there is a hostile worker over our target (container) which is next to a resource, then they are probably harvesting it.
                        // We can just wait here until they put something in the container haha.
                        !room.myManagement
                        && room.resources.find(f => f.pos.isNearTo(object))
                        && object.pos.lookForHostileWorker()
                    )
                )
            )
        }
        let taskFilterPartial = function(object) {
            return (
                taskFilterBase(object)
                && (
                    creep.pos.isNearTo(object)
                    || (object.store && (object.store.getUsedCapacity() >= creep.getReservedCapacity(object.id)))
                    || (object.amount && (object.amount >= creep.getReservedCapacity(object.id)))
                )
            )
        }
        let taskFilterContainer = function(object) {
            return (
                taskFilterBase(object)
                && object.pos.lookForHostileWorker()
                && !object.pos.hasHostileRampartHits
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            let objects = room.plunderables;
            let typeCount = Object.keys(room.plunderableHash).length;

            // If there are multiple types, then goto the location that has the highest value.
            if (typeCount > 1) {
                // Find the most valueable object to gather from.
                // This algorithm goes to the average value per unit object.
                target = room.plunderablesSorted.find(f => taskFilterPartial(f) && creep.pos.findClosestByPath([f]));

            }
            // All resources are of same type (likely energy).
            else if (typeCount === 1) {

                if (!target) {
                    // Just find the closest.
                    target = creep.pos.findClosestByPath(objects, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterPartial(f)
                    });
                }

            }
            // No plunderables currently in this room anymore.
            else {
                // Find a container that has a hostile worker nearby that we can steal from.
                if (!room.myManagement && !room.isHighwayRoom) {
                    target = creep.pos.findClosestByPath(room.containers, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterContainer(f)
                    })
                }
            }

        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If we have a store object, then withdraw from it.
            if (target.store) {
                // Don't bother figuring out the resourceType to gather until we get next to the target.
                let resourceType = creep.pos.isNearTo(target) ? target.storeMostValuableResource : Object.keys(target.store)[0];
                creep.smartGather(target, resourceType);
            }
            // Otherwise we have a dropped resource, pick it up.
            else if (target.amount) {
                // Pickup this drop.
                creep.smartPickup(target);
            }

            // Still working...
            return true;
        }

        // Store is not empty (PLUNDER_NOTEMPTY),  stay in this task.
        if ((storeState === 1) && !creep.store.getUsedCapacity()) {
            creep.nap();
            creep.logCreep('task_plunder.storeState(' + storeState + ') napping...')
            return true;
        }

        // Store has capacity (PLUNDER_NOTFULL),  stay in this task.
        if ((storeState === 2) && !creep.storeFull) {
            creep.nap();
            creep.logCreep('task_plunder.storeState(' + storeState + ') napping...')
            return true;
        }

        // Nothing left to gather, stay in this task.
        // Once creep is full or otherwise has something, exit criteria above will bail us out.
        creep.logCreep('task_plunder.storeState(' + storeState + '); bailing out...')
        return false;
    }

	Object.defineProperty(RoomObject.prototype, 'isExhausted', {
		get() {
            if (typeof this._isExhausted === "undefined") {
                this._isExhausted = !!(
                    // For minerals, once the ticksToRegeneration property is visible, it is no longer a viable mine.
                    this.ticksToRegeneration

                    // For deposits, once we go over our last cooldown max, then it is no longer viable.
                    || (this.lastCooldown >= Config.params.MAX_DEPOSIT_COOLDOWN)
                )
            }
            return this._isExhausted;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.task_withdraw_worker_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            creep.storeFull
            || !creep.focusTarget
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_withdraw_worker = function(workerRole, wait = true) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.storeFull) return false;
        if (!creep.focusTarget) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        // If this is a mineral, it will regenerate after a long wait once it has been emptied.
        // No point at all to stand around here, all workers will be moving home to recycle.
        if (creep.focusTarget.ticksToRegeneration) return false;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getUsedCapacity() > 0)
                && object.pos.isNearTo(creep.focusTarget)
            )
        }
        let taskFilterUsedCapacity = function(object) {
            return (
                object
                && (object.store.getUsedCapacity() > 0)
            )
        }
        let taskFilterNearBy = function(object) {
            return (
                object
                && object.pos.isNearTo(creep.focusTarget)
            )
        }

        // Allow deposit miner to fill up movers with used capacity, and then oldest movers first.
        let isBestMover = function(mover) {
            // Once a mover has capacity, then it wins.
            let movers = CreepManager.getCreepsByRoleAndFocusId(creep.role, creep.focusId).filter(f => f.pos.inSameRoom(creep.focusTarget) && f.store.getFreeCapacity());
            let bestMover = _.sortByOrder(movers, [
                sortUsedCapacity => -sortUsedCapacity.store.getUsedCapacity()
                , sortTicksToLive => sortTicksToLive.ticksToLive
            ]).find(x => x !== undefined);
            return bestMover && (bestMover.id === mover.id);
        }

        // We will have different roles of creeps, so this is a generic list based on our focusId and work/carry parts.
        let workersByFocusId = CreepManager.getCreepsByRoleAndFocusId(workerRole, creep.focusId);
        // Need to find the best mover every tick.
        let isBestMoverCreep = isBestMover(creep);

        if (isBestMoverCreep) {
            let worker = null;

            if (taskFilterUsedCapacity(creep.stickyTarget)) {
                // If we have a cached target and its still there, gather it.
                worker = creep.stickyTarget;

            } else {
                // Find the workers who are near the target and have something in their store.
                worker = creep.pos.findClosestByRange(workersByFocusId.filter(f => taskFilterBase(f)));
                if (!worker) {
                    // Find any workers (perhaps napping) that have something in their store.
                    worker = creep.pos.findClosestByRange(workersByFocusId.filter(f => taskFilterUsedCapacity(f)));
                }
                if (!worker) {
                    // Find any workers that are near the target.
                    worker = creep.pos.findClosestByRange(workersByFocusId.filter(f => taskFilterNearBy(f)));
                }
            }

            if (worker) {
                // Remember this target.
                creep.stickyTarget = worker;
            }

            // If we have a worker and it has capacity, then grab its goods as it is primary objective.
            if (worker && worker.store.getUsedCapacity()) {
                // Special case we don't want to ignore creeps as we are likely to have many around the deposit.
                let options = { ignoreCreeps: false }
                creep.smartHandoff(worker, _.findKey(worker.store), undefined, options);
                return true;
            }
        }

        // If we have no workers, and we having something in our store, then go drop it off.
        if (!workersByFocusId.length && creep.store.getUsedCapacity()) return false;

        // If we have no workers, and our focus is exhausted, then we can bail out.
        if (!workersByFocusId.length && creep.focusTarget.isExhausted) return false;

        // At this point, there is nobody left to handoff from, and we are close to dieing so bail out.
        if (creep.store.getUsedCapacity() && !creep.willLiveToAssignedRoom) return false;

        // For SK rooms we need to back away if the keeper lair is about to spawn.
        // Note this is done AFTER looking for handoff, so that we can grab and go even if workers are napping.
        if (creep.shouldFleeFromLairByResource(creep.focusTarget)) {
            if (creep.storeNearFull) return false;
            creep.napSK(creep.focusTarget);
            return true;
        }

        // Have mats in store and workers still around, hang out till we get more.
        if (isBestMoverCreep && creep.stickyTarget && creep.stickyTarget.pos.isNearTo(creep.focusTarget)) {
            if (creep.pos.isRange2(creep.focusTarget)) {
                this.talk('🚬');
            } else if (creep.pos.inRange1(creep.focusTarget)) {
                // Back away from target.
                creep.nap();
            } else {
                creep.smartMove(creep.focusTarget);
                this.talk('🚛');
            }
        }

        // No mats, so get closer to focus target (but out of the way) and wait our turn.
        else {
            if (room.isSKRoom) {
                // SK rooms will be harder to move around and will have source keepers spawning.
                creep.napSK(creep.focusTarget);
            } else if (creep.pos.isRange3(creep.focusTarget) && !creep.pos.inRange2Edge) {
                this.talk('🚬');
            } else if (creep.pos.inRange2(creep.focusTarget)) {
                creep.nap();
            } else {
                creep.smartMove(creep.focusTarget);
                this.talk('🚛');
            }
        }

        // No workers for us to gather from, not waiting, bail out (if wait).
        // This allows prospectors to gather from workers, bail out, plunder, then come back to workers if still not full.
        return wait;
    }

    Creep.prototype.task_withdraw_container_ox_criteria = function() {
        return (
            this.storeFull
            || !this.inWorkRoom
            || this.shouldDisengageFromCurrentRoom
        );
    }


    Creep.prototype.task_withdraw_container_ox = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.storeFull) return false;
        if (creep.isQuarterDamaged) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
            )
        }

        if (creep.focusTarget && taskFilterBase(creep.focusTarget)) {
            // If we have a focus target and its still there, gather it.
            target = creep.focusTarget;
        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // Really bad situation, nothing in container, nothing in my store, and no farmer. Nap and get out of the way.
            if (target.store && !target.store.getUsedCapacity() && !creep.store.getUsedCapacity() && !creep.farmerOnFocusTarget) {
                creep.nap();
                return true;
            }

            // Low level rooms can have multiple farmers per source.
            // There really is no moveToPos for these situations.
            if (!creep.moveToPos && room.targetIsContainer(target)) {
                let source = target.pos.findClosestByRange(room.sources);
                if (source) {
                    let sourceContainerRoadPos = source.sourceContainerRoadPos;
                    creep.moveToPos = sourceContainerRoadPos;
                }
            }

            if (creep.moveToPos && room.targetIsContainer(target)) {
                if (!creep.pos.isEqualTo(creep.moveToPos)) {
                    // We have a specific target (road) to move to, so go there.
                    creep.smartMove(creep.moveToPos);
                    creep.talk('🚸');
                    return true;
                }
            }
            else {
                if (!creep.pos.isNearTo(target)) {
                    creep.smartMove(target);
                    creep.talk('🧭');
                    return true;
                }
            }

            // Once we are near, pickup drops, then decayables, then container.
            // A farmer will continue to drop on a full container, so don't get stuck waiting around.
            if (creep.pos.isNearTo(target) && !creep.store.getUsedCapacity()) {
                let nearByTarget = target.pos.lookForEnergy();
                if (nearByTarget) {
                    // Pickup this drop.
                    creep.smartPickup(nearByTarget);
                    return true;
                }
            }

            if (target.store && target.store.getUsedCapacity() >= creep.store.getFreeCapacity()) {
                // We have a full load in the container, withdraw from it.
                // Don't bother figuring out the resourceType to gather until we get next to the target.
                let resourceType = creep.pos.isNearTo(target) ? target.storeMostValuableResource : Object.keys(target.store)[0];
                creep.smartWithdraw(target, resourceType);
                return true;
            }
            if (target.store && target.store.getUsedCapacity() && (!creep.farmerOnFocusTarget || creep.shouldFleeFromLair(creep))) {
                // We have something in the container, and there is no farmer on it or we gotta flee, then withdraw partial from it.
                // Don't bother figuring out the resourceType to gather until we get next to the target.
                let resourceType = creep.pos.isNearTo(target) ? target.storeMostValuableResource : Object.keys(target.store)[0];
                creep.smartWithdraw(target, resourceType);
                return true;
            }
            if (target.store && !target.store.getUsedCapacity() && creep.store.getUsedCapacity() && (!creep.farmerOnFocusTarget || creep.shouldFleeFromLair(creep))) {
                // Nothing in the target, and noone is farming, but I have something in my store so return home with it.
                return false;
            }

            // Just sit around and wait till we can withdraw.
            creep.talk('🚬');
            return true;
        }

        // Bail out once there is nothing left in this container.
        return false;
    }

    Creep.prototype.task_withdraw_container_source_criteria = function() {
        return (
            this.storeFull
            || !this.inWorkRoom
        );
    }

    Creep.prototype.task_withdraw_container_peon_criteria = function() {
        return (
            this.storeFull
            || !this.inWorkRoom
            || CreepManager.getLlamasByFocusId(this.room.controller.id).length
        );
    }

    Creep.prototype.task_withdraw_container_source = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.storeFull) return false;

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.store.getUsedCapacity(RESOURCE_ENERGY)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getFreeCapacity() + creep.getReservedCapacity(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a sticky target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            target = creep.pos.findClosestByRange(room.sourceContainers, {
                filter: f => taskFilterFind(f)
            });
        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // Once we are near, pickup drops, then decayables, then container.
            // A farmer will continue to drop on a full container, so don't get stuck waiting around.
            if (creep.pos.isNearTo(target) && !creep.store.getUsedCapacity()) {
                let nearByTarget = target.pos.lookForEnergy();
                if (nearByTarget) {
                    // Pickup this drop.
                    creep.smartPickup(nearByTarget);
                    return true;
                }
            }

            // Withour the energy from the container.
            creep.smartWithdraw(target, RESOURCE_ENERGY);
            return true;
        }

        // Nothing left in this store.
        return false;
    }

    Creep.prototype.task_withdraw_always_criteria = function() {
        return (
            this.storeFull
            || this.hasMinerals
            || !this.inAssignedRoom
            || !this.freeWorkCapacity
        );
    }

    Creep.prototype.task_withdraw_page_criteria = function() {
        return (
            this.storeFull
            || this.hasMinerals
            || !this.inAssignedRoom
            || (this.room.storageEnergy <= (this.room.energyCapacityAvailable - this.room.energyAvailable))
            || (this.room.colonyContainer && this.room.colonyContainer.store.getFreeCapacity())
        );
    }

    Creep.prototype.task_withdraw_always = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        // This is because gathering from controller link will not fill the carry capacity of a full sized creep.
        if (creep.storeNearFull || !creep.freeWorkCapacity) return false;

        let target = null;
        let amount = creep.freeWorkCapacity;

        // Bail out if we don't have capacity. This can change per tick as creep gets older.
        if (!amount) return false;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (
                    (((object instanceof StructureLink) || (object instanceof Creep)) && (object.store.getUsedCapacity(RESOURCE_ENERGY) > creep.getReservedCapacity(object.id)))
                    || (object.store.getUsedCapacity(RESOURCE_ENERGY) >= (amount + creep.getReservedCapacity(object.id)))
                )
            )
        }
        let taskFilterFindPartial = function(object) {
            return (
                taskFilterBase(object)
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) > creep.getReservedCapacity(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            // Do not ignore creeps as mason's can often block our first path to storage.
            if (!target) {
                target = creep.pos.findClosestByRange(room.colonyStoragePickups, {
                    ignoreCreeps: false
                    , filter: f => taskFilterFind(f)
                });
            }

            if (!target) {
                target = creep.pos.findClosestByRange(room.colonyStoragePickups, {
                    ignoreCreeps: false
                    , filter: f => taskFilterFindPartial(f)
                });
            }
        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If there is a path to a store with energy, move to it and withdraw.
            amount = Math.min(amount, target.store.getUsedCapacity(RESOURCE_ENERGY));
            creep.smartWithdraw(target, RESOURCE_ENERGY, amount);
            return true;
        }

        // We have something at least, go work.
        if (creep.store.getUsedCapacity()) return false;

        // Don't leave this task until we have something.
        creep.nap();
        return true;
    }

    Creep.prototype.task_withdraw_rook_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.hasMinerals
            || !creep.inWorkRoom
            // Rooks will withdraw unless there are plunderables in the room with no hostiles in sight.
            || (
                RoomIntel.getPlunderableAmount(room.name)
                && !RoomIntel.getHostilesTTL(room.name)
                && !CreepManager.getLlamasByFocusId(room.controller.id).length
            )
        );
    }

    Creep.prototype.task_withdraw_rook = function() {
        // Shorthand.
        let creep = this;

        let target = null;
        let amount = creep.store.getFreeCapacity();

        // Bail out if we don't have capacity.
        if (!amount) return false;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity())
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (
                    (((object instanceof StructureLink) || (object instanceof Creep)) && (object.store.getUsedCapacity(RESOURCE_ENERGY) > creep.getReservedCapacity(object.id)))
                    || (object.store.getUsedCapacity(RESOURCE_ENERGY) >= (amount + creep.getReservedCapacity(object.id)))
                )
            )
        }
        let taskFilterFindPartial = function(object) {
            return (
                taskFilterBase(object)
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) > creep.getReservedCapacity(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            // Start with containers unless we are allowed to pull elsewhere.
            let pickups = null;
            pickups = creep.room.colonyStoragePickups;

            // Do not ignore creeps as mason's can often block our first path to storage.
            target = creep.pos.findClosestByRange(pickups, {
                ignoreCreeps: false
                , filter: (f) => taskFilterFind(f)
            });

            if (!target) {
                target = creep.pos.findClosestByRange(pickups, {
                    ignoreCreeps: false
                    , filter: (f) => taskFilterFindPartial(f)
                });
            }
        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If there is a path to a container with energy, move to it and withdraw.
            amount = Math.min(amount, target.store.getUsedCapacity(RESOURCE_ENERGY));
            creep.smartWithdraw(target, RESOURCE_ENERGY, amount);
            return true;
        }

        return false;
    }

    Creep.prototype.task_withdraw_peon_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeNearFull
            || creep.hasMinerals
            || !creep.inWorkRoom
            || !room.shouldPeonWithdrawEnergyFromStorage
            || !creep.freeWorkCapacity
        );
    }


    Creep.prototype.task_withdraw_peon = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria. Note that we simply have to have some energy, not full energy.
        // This is because gathering from controller link will not fill the carry capacity of a full sized creep.
        if (creep.storeNearFull || !creep.freeWorkCapacity) return false;

        let target = null;
        let amount = creep.freeWorkCapacity;

        // Bail out if we don't have capacity.
        if (!amount) return false;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store[RESOURCE_ENERGY] > 0)
                && (!(object instanceof Creep) || object.isOnParkingSpot)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (
                    ((object instanceof StructureLink) && (object.store[RESOURCE_ENERGY] > creep.getReservedCapacity(object.id)))
                    || (object instanceof Creep)
                    || (object.store[RESOURCE_ENERGY] >= (amount + creep.getReservedCapacity(object.id)))
                )
            )
        }
        let taskFilterFindPartial = function(object) {
            return (
                taskFilterBase(object)
                && (object.store[RESOURCE_ENERGY] > creep.getReservedCapacity(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            // Start with containers unless we are allowed to pull elsewhere.
            let pickups = null;
            pickups = room.colonyStoragePeon;

            // Do not ignore creeps as mason's can often block our first path to storage.
            target = creep.pos.findClosestByRange(pickups, {
                ignoreCreeps: false
                , filter: (f) => taskFilterFind(f)
            });

            if (!target) {
                target = creep.pos.findClosestByRange(pickups, {
                    ignoreCreeps: false
                    , filter: (f) => taskFilterFindPartial(f)
                });
            }
        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;

            // If there is a path to a container with energy, move to it and withdraw.
            amount = Math.min(amount, target.store.getUsedCapacity(RESOURCE_ENERGY));
            creep.smartWithdraw(target, RESOURCE_ENERGY, amount);
            return true;
        }

        return false;
    }

    Creep.prototype.task_withdraw_llama_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeNearFull
            || creep.hasMinerals
            || !creep.inWorkRoom
            || !room.shouldLlamaWithdrawEnergyFromStorage
        );
    }

    Creep.prototype.task_withdraw_llama = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.storeFull) return false;

        let container = null;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store[RESOURCE_ENERGY] > 0)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (object.store[RESOURCE_ENERGY] >= (creep.store.getFreeCapacity() + creep.getReservedCapacity(object.id)))
            )
        }
        let taskFilterFindPartial = function(object) {
            return (
                taskFilterBase(object)
                && (object.store[RESOURCE_ENERGY] > creep.getReservedCapacity(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            container = creep.stickyTarget;

        } else {
            // Start with containers unless we are allowed to pull elsewhere.
            let structures = null;
            structures = room.colonyStoragePickups;

            // Do not ignore creeps as mason's can often block our first path to storage.
            container = creep.pos.findClosestByRange(structures, {
                ignoreCreeps: false
                , filter: (f) => taskFilterFind(f)
            });

            if (!container) {
                container = creep.pos.findClosestByRange(structures, {
                    ignoreCreeps: false
                    , filter: (f) => taskFilterFindPartial(f)
                });
            }
        }

        if (container) {
            // Remember this target.
            creep.memory.stickyTargetId = container.id;

            // If there is a path to a container with energy, move to it and withdraw.
            creep.smartWithdraw(container, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Creep.prototype.task_withdraw_ghodium_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeFull
            || !creep.inWorkRoom
            || !room.terminal
            || room.hasMaxSafeModesAvailable
        );
    }

    Creep.prototype.task_withdraw_ghodium = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.storeFull) return false;

        let container = null;

        let taskFilterBase = function(object) {
            return (
                object
                && (object.store[RESOURCE_GHODIUM] >= creep.store.getFreeCapacity())
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            container = creep.stickyTarget;

        } else {
            container = [room.terminal].find(f => taskFilterBase(f));

        }

        if (container) {
            // Remember this target.
            creep.memory.stickyTargetId = container.id;
            creep.smartWithdraw(container, RESOURCE_GHODIUM);
            return true;
        }

        return false;
    }

    Creep.prototype.task_withdraw_thorium_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.store.getUsedCapacity(C.RESOURCE_THORIUM)
            || !room.terminal
        );
    }

    Creep.prototype.task_withdraw_thorium = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.store.getUsedCapacity(C.RESOURCE_THORIUM)) return false;

        let target = null;

        let taskFilterBase = function(object) {
            return (
                object
                && object.store[C.RESOURCE_THORIUM]
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            target = creep.stickyTarget;

        } else {
            target = [room.terminal].find(f => taskFilterBase(f));

        }

        if (target) {
            // Remember this target.
            creep.stickyTarget = target;
            creep.smartWithdraw(target, C.RESOURCE_THORIUM);
            return true;
        }

        return false;
    }

    Creep.prototype.task_extract_check_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inAssignedRoom
        );
    }

    Creep.prototype.task_extract_check = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.inAssignedRoom) return false;

        // Are we checking minerals? Miners could be hunting thorium as well.
        if (creep.focusId === RoomIntel.getMineralId(creep.workRoom)) {
            // Once the mine goes dry, no need to stick around.
            if (!RoomIntel.getMineralAmount(creep.workRoom)) {
                if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
                    return true;
                }
            }

        }
        // else if (creep.focusId === RoomIntel.getThoriumId(creep.workRoom)) {
        //     // Once the mine goes dry, no need to stick around.
        //     if (!RoomIntel.getThoriumAmount(creep.workRoom)) {
        //         if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
        //             return true;
        //         }
        //     }

        // }

        return false;
    }

    Creep.prototype.task_extract_remoteroom_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.inWorkRoom
            || !room.mineral
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_worker_handoff = function(transporter) {
        // Shorthand.
        let creep = this;
        let target = creep.focusTarget;

        // Give our loot to the oldest miner so he can leave quicker and renew.
        if (
            creep.store.getUsedCapacity()
            && creep.pos.isNearTo(target)
            && (
                // Our transporter is nearby.
                (transporter && transporter.pos.inRange3(target))
                // Or we have a little space but not enough to perform another harvest.
                || (creep.store.getFreeCapacity() && (creep.store.getFreeCapacity() < creep.harvestMineralPower))
            )
        ) {

            let workersByFocusId = CreepManager.getCreepsByRoleAndFocusId(creep.role, creep.focusId);
            let giveToWorker = _.sortBy(workersByFocusId.filter(f => f.pos.isNearTo(target)),
                s => s.ticksToLive
            ).find(x => x !== undefined);

            // Don't bother if I'M the oldest creep, ha!
            if (giveToWorker && (giveToWorker.id !== creep.id) && giveToWorker.store.getFreeCapacity()) {

                // Closest miner could actually also be the oldest miner.
                let closestWorker = _.sortByOrder(workersByFocusId.filter(f =>
                    (f.id !== creep.id)
                    && f.store.getFreeCapacity()
                    && f.pos.isNearTo(target)
                    && (f.pos.getDistanceTo(giveToWorker) < creep.pos.getDistanceTo(giveToWorker))
                ), [
                    s1 => s1.pos.getDistanceTo(creep)
                    , s2 => s2.pos.getDistanceTo(giveToWorker)
                ]).find(x => x !== undefined);

                // Only give if closest miner is next to us to prevent us from having to move (potentially far in worst case).
                if (closestWorker && (closestWorker.id !== creep.id) && creep.pos.isNearTo(closestWorker) && closestWorker.store.getFreeCapacity()) {
                    // Special case we don't want to ignore creeps as we are likely to have many around the mineral.
                    let options = { ignoreCreeps: false }
                    creep.smartGive(closestWorker, _.findKey(creep.store), undefined, options);
                    return true;
                }
            }
        }

        // Nothing to hand off.
        return false;
    }

    Creep.prototype.task_extract_remoteroom = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Need to have visibility to target for this to work.
        let target = creep.focusTarget
        if (!target) return false;
        if (!target.mineralAmount) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        // Die off once we are dry and the mineral is regenerating.
        if (!creep.store.getUsedCapacity() && (creep.ticksToLive < (room.mineral.ticksToRegeneration || 0))) {
            creep.commitHaraKiri();
            return true;
        }

        // For peformance reasons, we will use the simple harvestMineralPower which will not look for active or boosted parts.
        // Bail out and walk home ourselves if we are full and there is no jackass with space coming for us.
        if (
            !creep.store.getFreeCapacity()
            && !room.mineral.transporter
        ) return false;

        // For SK rooms we need to back away if the keeper lair is about to spawn.
        if (creep.shouldFleeFromLairByResource(target)) {
            creep.napSK(target);
            return true;
        }

        // Extractor could have been destroyed.
        if (!creep.stickyTarget) {
            let extractor = room.mineralExtractor;
            if (!extractor) return false;
            creep.stickyTarget = extractor;
        }

        // Get our list of other workers who are extracting in this room.
        let creepsExtracting = target.room.myCreepsExtracting;

        // I am empty, look for older creeps to take my spot.
        if (!creep.store.getUsedCapacity()) {
            // We have more miners than nips, so the youngest one should nap.
            if (creepsExtracting.length > target.nips.length) {
                // Exclude anyone with minerals already on them. Likely the oldest creep anyway.
                let chosenMiners = creepsExtracting;
                chosenMiners = _.sortByOrder(chosenMiners, [
                    s => s.ticksToLive
                ]).map(m => m.id).slice(0, target.nips.length);

                // I'm the youngest miner, so sit this one out.
                if (!chosenMiners.includes(creep.id)) {
                    creep.nap();
                    return true;
                }
            }
        }

        // I may be the oldest but I'm not currently next to the mineral and no spots currently open.
        //if (!creep.pos.isNearTo(room.mineral) && !room.mineral.nipsFree.length) {
        if (!creep.pos.isNearTo(target) && (creepsExtracting.filter(f => f.pos.isNearTo(target)).length === target.nips.length)) {
            creep.nap();
            return true;
        }

        // Do the handoff, and bail out if it was successful to stay in this task.
        if (creep.task_worker_handoff(room.mineral.transporter)) return true;

        // For peformance reasons, we will use the simple harvestMineralPower which will not look for active or boosted parts.
        // Bail out and walk home ourselves if we are full and there is no jackass with space coming for us.
        if (
            (creep.store.getFreeCapacity() < creep.harvestMineralPower)
            && !room.mineral.transporter
        ) return false;

        // Harvest this mineral if we have room.
        if (creep.store.getFreeCapacity() >= creep.harvestMineralPower) {
            let result = creep.smartExtract(target, creep.stickyTarget);
            // In the event that we are mining a temple room, the room level may drop and which case just bail out.
            if (result === ERR_RCL_NOT_ENOUGH) return false;
        }
        else {
            creep.smartMove(target);
            creep.talk('🤑');
        }

        // We aren't ever leaving this step until we are full or dead.
        return true;
    }

    Creep.prototype.task_extract_myroom_criteria = function() {
        // Shorthand.
        let creep = this;

        // Always get that sweet deposit.
        return (
            !creep.inWorkRoom
            || !creep.focusTarget
        );
    }

    Creep.prototype.task_extract_myroom = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // The mineral (thorium) could deplete and disappear.
        if (!creep.focusTarget) return false;

        // Exit criteria.
        if (creep.focusId === RoomIntel.getMineralId(creep.workRoom)) {
            if (!room.mineral) return false;
            if (!room.mineral.mineralAmount) return false;
            // For peformance reasons, we will use the simple harvestMineralPower which will not look for active or boosted parts.
            if (creep.store.getFreeCapacity() < creep.harvestMineralPower) return false;

            // Extractor could have been destroyed.
            if (!creep.stickyTarget) {
                let extractor = room.mineralExtractor;
                if (!extractor) return false;
                creep.stickyTarget = extractor;
            }

        }
        // else if (creep.focusId === RoomIntel.getThoriumId(creep.workRoom)) {
        //     if (!room.thorium) return false;
        //     if (!room.thorium.mineralAmount) return false;
        //     // For peformance reasons, we will use the simple harvestMineralPower which will not look for active or boosted parts.
        //     if (creep.store.getFreeCapacity() < creep.harvestMineralPower) return false;

        //     // Bail out once we get low on life.
        //     if (creep.ticksToLive < 100) return false;

        //     // Extractor could have been destroyed.
        //     if (!creep.stickyTarget) {
        //         let extractor = room.thoriumExtractor;
        //         if (!extractor) return false;
        //         creep.stickyTarget = extractor;
        //     }

        // }

        // Get that sweet mineral!
        creep.smartExtract(creep.focusTarget, creep.stickyTarget);

        // We aren't ever leaving this step.
        return true;
    }

    Creep.prototype.task_deposit_criteria = function() {
        // Shorthand.
        let creep = this;

        // Always get that sweet deposit.
        return (
            !creep.inWorkRoom
            || !creep.focusTarget
        );
    }

    Creep.prototype.task_deposit = function() {
        // Shorthand.
        let creep = this;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!creep.focusTarget) return false;

        // This is the deposit assigned to us.
        let deposit = creep.focusTarget;

        // Check to see if the lair won't respawn before we die of old age.
        // In which case just die quickly so we can get a new one spawned quicker.
        if (!creep.store.getUsedCapacity() && (creep.ticksToLive < (deposit.cooldown || 0))) {
            // Oft yourself.
            creep.commitHaraKiri();
            return true;
        }

        // Something bad is in this room, drop and run!
        if (creep.shouldDisengageFromCurrentRoom) {
            // Tough decision to drop what we currently have or run with it and be slowed.
            //if (creep.store.getUsedCapacity()) creep.smartDrop();
            return false;
        }

        // Do the handoff, and bail out if it was successful to stay in this task.
        if (creep.task_worker_handoff(deposit.transporter)) return true;

        // Get that sweet deposit!  Only if we have space, otherwise save the cooldown and don't drop anything.
        // Given that we don't want to drop anything, our work parts should be close to a multiple of our storage capacity.
        // For peformance reasons, we will use the simple harvestDepositPower which will not look for active or boosted parts.
        if (creep.store.getFreeCapacity() >= creep.harvestDepositPower) {
            creep.smartDeposit(deposit);
        }
        else {
            creep.smartMove(deposit);
            creep.talk('🤑');
        }

        // We aren't ever leaving this step.
        return true;
    }

    Creep.prototype.task_harvest_peon_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeNearFull
            || !creep.inWorkRoom
            // For temples, do not harvest while we have energy in our store.
            || (room.isTemple && creep.store.getUsedCapacity(RESOURCE_ENERGY))
        );
    }

    Creep.prototype.task_harvest_peon = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (creep.store.getFreeCapacity() < creep.harvestSourcePower) return false;

        let source = null;

        let energyOnArrival = function(source) {
            return ((source.ticksToRegeneration || ENERGY_REGEN_TIME) <= source.pos.getRangeTo(creep) + 15) ? source.energyCapacity : source.energy;
        }

        let taskFilterBase = function(object) {
            return (
                object
                && (
                    (object.energy > 0)
                    || energyOnArrival(object)
                )
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                // Homebase peons should not move to any source that has a peasant working on it.
                && !creep.otherCreepsHarvesting(object)
                && (object.nips.length > creep.stickyTargetCount(object))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, gather it.
            source = creep.stickyTarget;
        }

        if (!source) {

            // Filter will include sources that have no peasants and have a free nip.
            source = room.reachableSources.filter(f => taskFilterFind(f));

            // Now we find the best source by sorting based on our priorities.
            source = _.sortByOrder(source, [
                s1=>(energyOnArrival(s1) >= (creep.getReservedCapacity(s1) + creep.store.getFreeCapacity())) ? 0 : 1
                , s2=>(s2.nips.length===1) ? s2.pos.getRangeTo(creep) : 50
                , s4=>s4.pos.getRangeTo(creep)
                , s5=>s5.ticksToRegeneration || ENERGY_REGEN_TIME
            ]);
            source = source.find(x => x !== undefined);
        }

        if (source) {
            // Remember this target.
            creep.stickyTarget = source;

            // Get that sweet energy!
            let result = creep.smartHarvest(source);

            // If the source is dry and we have some energy and there are construction sites around, bail out to use up the energy we have.
            if ((result === ERR_NOT_ENOUGH_ENERGY) && creep.store.getUsedCapacity(RESOURCE_ENERGY) && room.myConstructionSites.length) return false;

            // If we cant get to the target, start over.
            if (result === ERR_NO_PATH) creep.switchToTask(Config.tasks.BOOTSTRAP);

            return true;
        }

        // No resources and no nips to even go to. So just give up and go on vacation.
        // For reserve peons, this is a SINK, and execution of entire peon loop can STOP here waiting for resources.
        // We don't want to go home unless we are full of juice.
        if (creep.store.getUsedCapacity() == 0) {
            creep.switchToTask(Config.tasks.BOOTSTRAP);

            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.nap();
            return true;
        }

        return false;
    }

    Creep.prototype.task_deliver_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.hasMinerals
        );
    }

    Creep.prototype.task_deliver = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.hasMinerals) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getFreeCapacity())
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;
        }

        if (!transfer) {
            // Everything goes into the terminal. This is the main distributin point.
            if (!transfer && room.myTerminal && room.myTerminal.store.getFreeCapacity()) {
                transfer = room.myTerminal;
            }

            // Anything else goes in storage for now.
            if (!transfer && room.myStorage && room.myStorage.store.getFreeCapacity()) {
                transfer = room.myStorage;
            }
        }

        if (transfer) {
            // Remember this target.
            creep.stickyTarget = transfer;
            let resourceType = _.findKey(_.omit(creep.store, RESOURCE_ENERGY));
            creep.smartAssigned(transfer, resourceType);
            return true;
        }

        // No valid transfer was found, so we must drop our minerals or get stuck holding them forever.
        if (room.my && creep.smartDrop(_.findKey(_.omit(creep.store, RESOURCE_ENERGY))) === OK) return true;

        // Nothing else to assigned, bail out.
        return false;
    }

    Creep.prototype.task_transfer_spawn_rook_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || room.nonKingEnergyFull
        );
    }

    Creep.prototype.task_transfer_spawn_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || room.nonKingEnergyFull
            || (room.rook && !room.rook.spawning && room.storageEnergy)
        );
    }

    Creep.prototype.task_transfer_spawn = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        // Get a list of structures that need energy, only if the room is not at full capacity.
        let transfer = null
        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
            );
        }
        let taskFilterFind = function(object) {
            return (
                creep.stickyTarget
                && (object.id != creep.stickyTarget.id)
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;
        }
        else {
            // If no smart target can be found, then pick the next best target.
            // This NEEDS to be Path not Range, as we are now doing normal finds of structures.
            // transfer = creep.pos.findClosestByPath(room.colonyFirstExtensionNeedingEnergy, {
            //     ignoreCreeps: true
            // });
            transfer = creep.pos.findClosestByPath(room.colonyNonKingSpawnStructuresNotFull, {
                ignoreCreeps: true
            });
        }

        if (transfer) {
            // Repeat through this loop only if the transfer will be successful, and we will have leftover energy.
            if (creep.smartTransfer(transfer, RESOURCE_ENERGY, undefined, false) === OK) {
                // We are next to our target, and have more energy than it will need.
                // Pick a new moveto target.
                if (creep.pos.isNearTo(transfer) && (creep.store.getUsedCapacity(RESOURCE_ENERGY) > transfer.store.getFreeCapacity(RESOURCE_ENERGY))) {
                    transfer = creep.pos.findClosestByRange(room.colonyNonKingSpawnStructuresNotFull, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterFind(f)
                    }) || null;

                    // Now move to the new target immediately, if found.
                    if (transfer) {
                        creep.smartTransfer(transfer, RESOURCE_ENERGY, undefined, true)
                    }
                    else {
                        // No more transfers left.
                        return false;
                    }

                }
            }

            // Remember this target.
            // Note could be existing target, or the newly found target we are only moving to.
            creep.stickyTarget = transfer;

            // Stick working.
            return true;
        }

        // Nothing found, bail out.
        return false;
    }

    Creep.prototype.task_transfer_tower_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.colonyTowersNeedsEnergy
        );
    }

    Creep.prototype.task_transfer_tower = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > TOWER_ENERGY_COST)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.getReservedEnergy(object.id))
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            transfer = creep.pos.findClosestByPath(room.colonyTowersUnmanned, {
                ignoreCreeps: true
                , filter: (f) => taskFilterFind(f)
            });
        }

        if (transfer) {
            creep.memory.stickyTargetId = transfer.id;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Creep.prototype.task_transfer_lab_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.labNeedsEnergy
        );
    }

    Creep.prototype.task_transfer_lab = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            // Does not matter which one, just find one.
            transfer = room.labNeedsEnergy;

        }

        if (transfer) {
            creep.stickyTarget = transfer;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Creep.prototype.task_transfer_powerspawn_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.colonyPowerSpawn
        );
    }

    Creep.prototype.task_transfer_powerspawn = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;
        if (!room.colonyPowerSpawn) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                // Only fill powerspawn if its really empty.
                && (object.store.getUsedCapacity(RESOURCE_ENERGY) <= object.store.getCapacity())
            )
        }

        // See if the target is valid.
        if (taskFilterBase(room.colonyPowerSpawn)) {
            // Only one target, our power spawn.
            transfer = room.colonyPowerSpawn;
        }

        if (transfer) {
            creep.memory.stickyTargetId = transfer.id;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Creep.prototype.task_claim_reactor_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.reactor
            || room.reactor.my
            || !creep.claimParts
        );
    }

    Creep.prototype.task_claim_reactor = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!room.reactor) return false;
        if (room.reactor.my) return false;

        creep.smartClaimReactor(room.reactor);
        return true;
    }

    Creep.prototype.task_transfer_reactor_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.store.getUsedCapacity(C.RESOURCE_THORIUM)
            || !room.reactor
            || !room.reactor.my
        );
    }

    Creep.prototype.task_transfer_reactor = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.store.getUsedCapacity(C.RESOURCE_THORIUM)) return false;
        if (!room.reactor) return false;
        if (!room.reactor.my) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
            )
        }

        // See if the target is valid.
        if (taskFilterBase(room.reactor)) {
            // Only one target, our power spawn.
            transfer = room.reactor;
        }

        if (transfer) {
            creep.smartTransfer(transfer, C.RESOURCE_THORIUM);
            return true;
        }

        // Stay here until we are dry.
        return true;
    }

    Creep.prototype.task_transfer_colonyContainer_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.colonyContainer
        );
    }

    Creep.prototype.task_transfer_colonyContainer = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;
        if (!room.colonyContainer) return false;

        let transfer = null;
        let taskFilterFind = function(object) {
            let reservedEnergy = creep.getReservedEnergy(object.id);
            return (
                (object.store.getFreeCapacity(RESOURCE_ENERGY) > reservedEnergy)
                || (object.store.getFreeCapacity(RESOURCE_ENERGY) && !reservedEnergy)
            );
        }

        // See if the target is valid.
        if (taskFilterFind(room.colonyContainer)) {
            // Only one target, our power spawn.
            transfer = room.colonyContainer;
        }

        if (transfer) {
            creep.memory.stickyTargetId = transfer.id;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Room.prototype.buildSort = function(structureType) {
        // If we are in any reserved room or trail, everything is simply 1 to find nearest.
        if (!this.my) return 1;

        // When we are level one, build anything you are close to. Likely need roads setup.
        // Otherwise build in the order specified below.
        switch (structureType) {
            case STRUCTURE_SPAWN:
                return 1;

            case STRUCTURE_ROAD:
                // Roads are highest priority at start of game to get source roads up.
                // Then they don't matter again until we start mining, in which case extractor is priority 9.
                // Compare against energy capacity so that wiped rooms can recover by building roads first.
                return (!this.controller || (this.energyCapacityAvailable <= C.SPAWNING_ENERGY_CAPACITY[2]) && (GameManager.empireRooms.length > 1)) ? 2 : 10;

            case STRUCTURE_EXTENSION:
                return 4;

            case STRUCTURE_STORAGE:
                return 5;

            case STRUCTURE_LINK:
                return 6;

            case STRUCTURE_TERMINAL:
                return 7;

            case STRUCTURE_TOWER:
                return 8;

            case STRUCTURE_CONTAINER:
                return 9;

            case STRUCTURE_EXTRACTOR:
                return 11;

            case STRUCTURE_WALL:
            case STRUCTURE_RAMPART:
                // Barriers get extra priority boost if we are in cooldown, to keep hostiles from walking in.
                return this.safeModeCooldown ? -1 : 12;

            case STRUCTURE_LAB:
                return 13;

            case STRUCTURE_OBSERVER:
                return 14;

            // Big expensive structure.
            case STRUCTURE_NUKER:
                return 15;

            // Factory goes REALLY last.
            case STRUCTURE_FACTORY:
                return 100;
        }

        // Anything else that might have fallen through.
        return 101;
    }

    Creep.prototype.task_build_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Note that build does NOT have to be in the designated work room.
        // Can happen in highways or reserved rooms pathing back.
        return (
            creep.energyEmpty
            || !room.myConstructionSites.length
            || !creep.workPartsActive
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_build = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;
        if (!creep.workPartsActive) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        let site = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (object instanceof ConstructionSite)
                && !creep.shouldFleeFromLair(object)
            );
        }
        const DEFENSTIVE_STRUCTURE = {
            [STRUCTURE_ROAD]: true
            , [STRUCTURE_CONTAINER]: true
            , [STRUCTURE_WALL]: true
            , [STRUCTURE_RAMPART]: true
            , [STRUCTURE_TOWER]: true
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)

                // We only want one builder for new barriers as it only takes one hit to make them, and they are far away usually.
                && (!room.constructionSiteIsBarrier(object) || !creep.stickyTargetCount(object))

                // Limit of 1 builder per site when near the colony when at higher levels. This keeps creeps moving and not blocked.
                // If there are fewer construction sites than max allowed per site, then allow up to max for the remaining.
                && (
                    // Not in my room or a room we are claiming, so mostly likely a highway or reserved room. No restrictions.
                    !room.my
                    || !room.claimFlag
                    // Temples do not have colony flags.
                    || !room.colonyFlag
                    // When we are without storage or terminal, then we are low level and space shouldn't be an issue.
                    || !room.storage
                    || !room.terminal
                    // Once we get down to a few construction sites, everyone is allowed.
                    || (room.myConstructionSites.length < Config.params.MAX_BUILDERS_PER_TARGET)
                    // If we are not near the colony, everyone is allowed. Source links and containers most likely.
                    || !room.colonyFlag.pos.inRange5(object)
                    // At this point we ARE within colony bounds, so limit our count...to 1 builder.
                    || (creep.stickyTargetCount(object) < Config.params.MAX_BUILDERS_PER_TARGET_NEAR_COLONYFLAG)
                )

                // Overall max for any target.
                && (creep.stickyTargetCount(object) < (room.storage ? Config.params.MAX_BUILDERS_PER_TARGET : Config.params.MAX_BUILDERS_PER_TARGET_EARLY))

                // Bad juju...do NOT bild this object if we are in a bad state early on and it isn't a defensive structure.
                && (
                    room.safeMode
                    || !room.colonyBreachedByPlayerTime
                    || room.atMaxLevel
                    || DEFENSTIVE_STRUCTURE[object.structureType]
                )
            );
        }

        if (taskFilterBase(creep.stickyTarget) ) {
            // If we have a cached site and its still there, build it.
            site = creep.stickyTarget;

        } else {
            // Sort all our construction sites by type,
            // then group them by their type,
            // then searching each type one type at a time, find the closest one that is passing our filter (aka builder count, etc)
            let sites = _.sortBy(room.myConstructionSites, s => room.buildSort(s.structureType));
            if (sites) {
                let sitesByType = utils.groupBy(sites, 'structureType');
                for (let i=0; i<Object.keys(sitesByType).length; i++) {
                    let type = Object.keys(sitesByType)[i];
                    site = creep.pos.findClosestByPath(sitesByType[type], {
                        ignoreCreeps: true
                        , filter: f => taskFilterFind(f)
                    });
                    if (site) break;
                };
            }

        }

        if (site) {
            creep.memory.stickyTargetId = site.id;

            // Get best position to work from.
            let getClose = true;
            let moveTo = creep.getStickyMoveToPos();
            if (!moveTo || (!creep.pos.isEqualTo(moveTo) && !moveTo.isEnterable)) {
                moveTo = creep.moveToColonyBuildPos(site);
                if (moveTo || room.colonyUnsafe) {
                    getClose = false;
                } else {
                    moveTo = site;
                }
            }
            creep.saveStickyMoveToPos(moveTo);

            if (moveTo) {
                let result = creep.smartBuild(site, getClose, moveTo);
                if ((result === OK) && room.constructionSiteIsBarrier(site) && creep.isConstructorCreep) {
                    // In the case of a new wall/barrier, repair it immediately after creating it.
                    creep.switchToTask(Config.tasks.REPAIR_WALL_ALWAYS);
                    return true;
                }

                return true;
            }
        }

        return false;
    }

    Creep.prototype.task_repair_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.storeNearEmpty
            || !creep.shouldConsumeEnergyStrict
        );
    }

    Creep.prototype.task_repair = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        let repair = null;
        let threshhold = Config.params.REPAIR_WORKER_THRESHHOLD_PERCENT;

        // Testing to see if we should continue repairing this structure.
        let taskFilterBase = function(object) {
            return (
                object
                && object.hitsMax
                && (object.hits < object.hitsMax)
            );
        }
        // Test to find structures that we should even walk to begin with.
        let taskFilterFind = function(object) {
            return (
                (object.hits <= (object.hitsMax * threshhold))
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target repair it fully.
            repair = creep.stickyTarget;

        } else {
            repair = room.infrastructureRepairSorted.find(f => taskFilterFind(f));

        }

        if (repair) {
            creep.stickyTarget = repair;

            // Get best position to work from.
            let getClose = true;
            let moveTo = creep.getStickyMoveToPos();
            if (!moveTo || (!creep.pos.isEqualTo(moveTo) && !moveTo.isEnterable)) {
                moveTo = creep.moveToColonyBuildPos(repair);
                if (moveTo || room.colonyUnsafe) {
                    getClose = false;
                } else {
                    moveTo = repair;
                }
            }
            creep.saveStickyMoveToPos(moveTo);

            if (moveTo) {
                creep.smartRepair(repair, getClose, moveTo);
                return true;
            }
        }

        return false;
    }

    Creep.prototype.task_repair_wallPeon_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.storeNearEmpty
            || !creep.shouldConsumeEnergyStrict
            || creep.isBodyPartDestroyed
            || !room.hasUnreservedBarriersBelowWorkerRepairThreshhold
            || room.isTemple
        );
    }

    Creep.prototype.task_repair_wallMax_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.storeNearEmpty
            || !creep.shouldConsumeEnergyLoose
            || !room.hasBarrierBelowRepairThreshhold
            || creep.isBodyPartDestroyed
            || room.isTemple
        );
    }

    Creep.prototype.task_repair_wallAlways_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.energyEmpty
            || creep.isBodyPartDestroyed
            || room.isTemple
        );
    }

    Creep.prototype.task_repair_wall = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;
        if (creep.isBodyPartDestroyed) return false;

        let repair = null;

        // Testing to see if we should continue repairing this structure.
        let taskFilterBase = function(object) {
            return (
                object
                && (object.hitsMax)  // Newbie walls will have hits but no hitsMax.
                && (object.hits < object.hitsMax)
            );
        }
        // Testing to see if we should continue repairing this structure.
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && creep.noStickyTarget(object)
            );
        }

        // Testing to see if we should continue repairing this structure.
        let taskFilterNukeFind = function(object) {
            return (
                object
                && (creep.stickyTargetCount(object) < Config.params.MAX_BUILDERS_PER_NUKE)
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target repair it fully.
            repair = creep.stickyTarget;

        }
        else {
            // Find closest 1 hit wall that was just created from a build action.
            if (!repair) {
                repair = creep.pos.findClosestByPath(room.barriersOneHit, {
                    ignoreCreeps: false
                    , filter: f => taskFilterFind(f)
                });
                if (repair) creep.logCreep('task_repair_wall -- room.barriersOneHit: ' + repair.pos)
            }

            // If we are in our own room and there are hostiles, switch to repair as they could be attacking walls.
            if (!repair) {
                repair = room.dangerousPlayerBarriersSorted.find(f => taskFilterFind(f));
                if (repair) creep.logCreep('task_repair_wall -- room.dangerousPlayerBarriersSorted: ' + repair.pos)
            }

            // Get nuke drop sites first.
            if (!repair) {
                repair = creep.pos.findClosestByPath(room.nukeBarriersBelowRepairThreshhold, {
                    ignoreCreeps: true
                    , filter: f => taskFilterNukeFind(f)
                })
                if (repair) creep.logCreep('task_repair_wall -- room.nukeBarriersBelowRepairThreshhold: ' + repair.pos)
            }

            // Only repair barriers, not structures. The weakest barrier first.
            if (!repair) {
                if (room.hasBarrierBelowRepairThreshhold) {
                    repair = room.perimeterBarriersSorted.find(f => taskFilterFind(f));
                }
                if (repair) creep.logCreep('task_repair_wall -- room.perimeterBarriersSorted: ' + repair.pos)
            }

            // Only repair ramparts. The weakest rampart first.
            // This step here is to buff our ramparts which naturally decay, instead of pumping all walls past their intended target.
            if (!repair) {
                repair = room.perimeterRampartsSorted.find(f => taskFilterFind(f));
                if (repair) creep.logCreep('task_repair_wall -- room.perimeterRampartsSorted: ' + repair.pos)
            }

            // Any wall. This is a catchall step to spend our energy.
            if (!repair) {
                repair = room.perimeterBarriersSorted.find(f => taskFilterFind(f));
                if (repair) creep.logCreep('task_repair_wall -- room.perimeterBarriersSorted: ' + repair.pos)
            }
        }

        if (repair) {
            creep.stickyTarget = repair;

            // Get best position to work from.
            let getClose = false;   // True is causing creeps to bounce back and forth when two builders are next to each other.
            let moveTo = creep.getStickyMoveToPos();
            if (!moveTo || (!creep.pos.isEqualTo(moveTo) && !moveTo.isEnterable) || room.colonyUnsafe) {
                moveTo = creep.moveToColonyBuildPos(repair);
                if (moveTo || room.colonyUnsafe) {
                    getClose = false;
                } else {
                    moveTo = repair;
                }
            }
            creep.logCreep('getClose:' + getClose + ' moveTo:' + moveTo + ' repair:' + repair)
            creep.saveStickyMoveToPos(moveTo);

            if (moveTo) {
                let result = creep.smartRepair(repair, getClose, moveTo);
                if (result === ERR_NOT_IN_RANGE) {
                    creep.barrierRepair();
                }
                return true;
            }
        }

        return false;
    }

    Creep.prototype.barrierRepair = function() {
        let creep = this;
        let room = this.room;

        if (creep.inWorkRoom && creep.pos.isRange1Edge) {
            let pos = null;
            let wall = null;

            if (creep.pos.x === 1) {
                pos = new RoomPosition(creep.pos.x + 1, creep.pos.y, creep.pos.roomName);
            }
            else if (creep.pos.x === 48) {
                pos = new RoomPosition(creep.pos.x - 1, creep.pos.y, creep.pos.roomName);
            }
            else if (creep.pos.y === 1) {
                pos = new RoomPosition(creep.pos.x, creep.pos.y + 1, creep.pos.roomName);
            }
            else if (creep.pos.y === 48) {
                pos = new RoomPosition(creep.pos.x, creep.pos.y - 1, creep.pos.roomName);
            }

            if (pos) {
                // Get the barrier structure, if any, at the adjacent positino.
                wall = pos.hasBarrierStructure;

                if (
                    wall
                    && (
                        (wall.hits < room.barrierHits)
                        || (room.myTerminal && (wall.hits < room.barrierHitsMaxLevel))
                    )
                ) {
                    // Perform a standard repair on this barrier.
                    creep.repair(wall);
                    return true;
                }
            }
            else {
                // TODO: remove this check once done debugging.
                console.log(creep.name, creep.pos, creep.pos.isRange1Edge, 'FAILED???', pos)
            }
        }

        return false;
    }

    Creep.prototype.task_createSourceTrail_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            room.my
            || !creep.inWorkRoom
        );
    }

    Creep.prototype.task_createSourceTrail = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Create the source trails. This method has lots of condition checking.
        room.createSourceTrails();

        // This is a one and done task.
        return false;
    }

    Creep.prototype.task_transfer_controllerContainer_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || room.atMaxLevel
            || creep.energyEmpty
            // This step is after transfer to colony container, but before transfering to storage.
            // Don't do it if our storage is completely empty however. Early game condition.
            || (room.myStorage && !room.myStorage.store.getUsedCapacity(RESOURCE_ENERGY))
            || CreepManager.getPagesAtWorkByFocusId(room.controller.id).length
        );
    }

    Creep.prototype.task_transfer_controllerContainer = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                // If our target is empty then stay on it.
                // As upgraders are pulling from it, we could get stuck here if they are just nibbling.
                object
                && (
                    (object.store.getFreeCapacity(RESOURCE_ENERGY) > (object.store.getCapacity(RESOURCE_ENERGY) * 0.1))
                    || (object.store.getFreeCapacity(RESOURCE_ENERGY) && !object.findNearByGeneralUpgradeControllerCreeps.length)
                )
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                // This will allow one extra creep over capacity to target this container.
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > creep.getReservedEnergy(object.id))
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            let containers = room.controllerContainers;
            transfer = creep.pos.findClosestByPath(containers, {
                ignoreCreeps: true
                , filter: (f) => taskFilterFind(f)
            });

        }

        if (transfer) {
            creep.memory.stickyTargetId = transfer.id;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);
            return true;
        }

        return false;
    }

    Creep.prototype.task_transfer_controllerContainer_page_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || room.atMaxLevel
            || creep.energyEmpty
        );
    }

    Creep.prototype.task_transfer_controllerContainer_page = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;
        if (room.atMaxLevel) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (
                    // If our target is MOSTLY empty then stay on it.
                    (object.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    || (
                        // Room is not a temple and we have upgraders nearby who will soon pull from this store.
                        // Temples are excluded since upgraders should be pulling every tick,
                        // and if its full then they are getting energy elsewhere.
                        !room.isTemple
                        && object.findNearByGeneralUpgradeControllerCreeps.length
                    )
                )
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                // This will allow one extra creep over capacity to target this container.
                // Don't overload if near a wall however, as other creeps will get stuck moving by.
                //&& ((object.pos.inRange2Edge ? object.store.getFreeCapacity(RESOURCE_ENERGY) : object.store.getCapacity(RESOURCE_ENERGY)) > creep.getReservedEnergy(object.id))
                //&& (object.store.getCapacity(RESOURCE_ENERGY) > creep.getReservedEnergy(object.id))

                // This will put 3 max sized pages on a container.
                && (Math.max(object.store.getCapacity(RESOURCE_ENERGY), creep.store.getCapacity(RESOURCE_ENERGY) * 2) > creep.getReservedEnergy(object.id))
            );
        }
        let taskFilterFindMax = function(object) {
            return (
                taskFilterBase(object)
                // This will allow one extra creep over capacity to target this container.
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > creep.getReservedEnergy(object.id))
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            let containers = room.controllerContainers;

            // Algo 1: find least full container.
            // containers = _.sortBy(containers, s => s.store.getUsedCapacity());
            // transfer = containers.find(f => taskFilterFind(f))

            // // Algo 2: find closest container.
            // transfer = creep.pos.findClosestByPath(containers, {
            //     ignoreCreeps: true
            //     , filter: (f) => taskFilterFind(f)
            // });

            // Algo 3: find least reserved container.
            // containers = _.sortBy(containers, s => s.store.getUsedCapacity() + creep.getReservedEnergy(s.id));
            // transfer = containers.find(f => taskFilterFind(f))

            // Algo 4: at max level, find any container that is not full. But at lower levels, do the wait thing.
            if (room.atMaxLevel) {
                transfer = creep.pos.findClosestByPath(containers, {
                    ignoreCreeps: true
                    , filter: (f) => taskFilterFindMax(f)
                });
            }
            else {
                containers = _.sortBy(containers, s => s.store.getUsedCapacity() + creep.getReservedEnergy(s.id));
                transfer = containers.find(f => taskFilterFind(f));
            }

        }

        if (transfer) {
            creep.memory.stickyTargetId = transfer.id;

            // Only do the actual transfer if we can get rid of all of our energy at once.
            // This is easy way to prevent multiple creeps from fighting over the container, and drawing out their time spent next to the container.
            if (
                creep.pos.isNearTo(transfer)
                && transfer.store.getFreeCapacity()
                && (
                    creep.store.getFreeCapacity()
                    || (transfer.store.getFreeCapacity() >= creep.store.getUsedCapacity())
                    || room.atMaxLevel
                    || room.controllerContainerEmpty
                    || !transfer.findNearByGeneralUpgradeControllerCreeps.length
                    || (CreepManager.getPagesByFocusId(room.controller.id).length < room.controllerContainers.length)
                )
            ) {
                creep.smartTransfer(transfer, RESOURCE_ENERGY);
            } else {
                // Move to the tranfer structure but do not put anything into it.
                creep.smartTransfer(transfer, RESOURCE_ENERGY, 0, true);
            }

            // Align ourselves with the target.
            if (creep.pos.isNearTo(transfer)) creep.alignToAnchorBehindTarget(transfer, room.controller);
            return true;
        }

        // Stay in this task until exit criteria is met. Take a nap while we wait.
        creep.nap();
        return true;
    }


    Creep.prototype.task_transfer_drop_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.store.getUsedCapacity()
        );
    }

    Creep.prototype.task_transfer_drop = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.store.getUsedCapacity()) return false;

        // Move off the edge.
        if (creep.pos.isEdge) {
            creep.inchForward(GameManager.getRoomMoveToPos(room.name), 1);
            return true;
        }

        // Simply drop whatever we have.
        creep.drop(_.findKey(creep.store));

        // Stay in this until everthing is dropped.
        return true;
    }

    Creep.prototype.task_transfer_dropoff_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.colonyStorageDropoffs.length
        );
    }

    Creep.prototype.task_transfer_dropoff_rook_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || creep.energyEmpty
            || !room.colonyStorageDropoffs.length
            // Rooks want to hang onto their energy as long as there are no plunderables in room.
            || !RoomIntel.getPlunderableAmount(room.name)
            || RoomIntel.getHostilesTTL(room.name)
            || CreepManager.getLlamasByFocusId(room.controller.id).length
        );
    }

    Creep.prototype.task_transfer_dropoff_peon_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.energyEmpty
            || !room.colonyStorageDropoffs.length
            || !room.my
        );
    }

    Creep.prototype.task_transfer_dropoff = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.energyEmpty) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && (object.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && object.store.getFreeCapacity() > creep.getReservedEnergy(object.id)
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            let storage = room.colonyStorageDropoffs;
            transfer = creep.pos.findClosestByPath(storage, {
                ignoreCreeps: true
                , filter: (f) => taskFilterFind(f)
            });
        }

        if (transfer) {
            creep.stickyTarget = transfer;
            creep.smartTransfer(transfer, RESOURCE_ENERGY);

            return true;
        }

        return false;
    }

    Creep.prototype.task_transfer_focus_transporter_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeEmpty
            || !creep.inWorkRoom
            || room.myStorage
        );
    }

    Creep.prototype.task_transfer_focus_transporter = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (creep.storeEmpty) return false;
        if (room.myStorage) return false;

        let transfer = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.store.getFreeCapacity()
                && object.isOnParkingSpot
            )
        }
        let taskFilterFind = function(object) {
            return (
                taskFilterBase(object)
                && (object.store.getFreeCapacity() > creep.getReservedEnergy(object.id))
            );
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            transfer = creep.stickyTarget;

        } else {
            // Resetting our target.
            creep.stickyTarget = null;

            // Get the rooms focus transporter, and if it isn't me then transfer what I have to him.
            // Note that I need to actually sit down first, as I may be the new transporter.
            if (creep.isOnParkingSpot) {
                // Attempt to get the main transporter first usually the mule.
                let transporter = room.colonyStorageTransporter;
                if (transporter && (transporter.id !== creep.id) && taskFilterFind(transporter)) {
                    transfer = transporter;
                }

                // At this point, its possible we have a container that we can drop off into.
                if (!transporter) {
                    let storage = room.colonyStorageDropoffs;
                    transfer = creep.pos.findClosestByPath(storage, {
                        ignoreCreeps: true
                        , filter: (f) => taskFilterFind(f)
                    });
                }
            }
        }

        if (transfer) {
            creep.stickyTarget = transfer;
            creep.smartGive(transfer, _.findKey(creep.store));
            return true;
        }

        // Stay in this task until empty.
        creep.nap();
        return true;
    }

    Creep.prototype.task_upgrade_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || room.controller.upgradeBlocked
            || creep.energyEmpty
            || !creep.inAssignedRoom
            || !creep.shouldConsumeEnergyStrict

            // Can only do 15 work parts at level 8 apparently.
            // Multiple peons should not bother upgrading at level 8.
            // Either let gnomes do it, or let upgraders do it better than peons.
            || (
                room.atMaxLevel
                //&& (room.creepsUpgradingWorkParts >= room.controllerMaxUpgradePerTick)
                //&& !creep.isBoosted
                //&& (
                    && !creep.isUpgradeControllerCreep
                    //&& CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(room.controller.id).length
                //)
            )

            // Once temples have storage, then peons will not upgrade them.
            || (
                room.isTemple
                && room.storage
                && (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
                && !creep.isUpgradeControllerCreep
            )
        );
    }

    Creep.prototype.task_upgrade_ox_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || room.controller.upgradeBlocked
            || creep.energyEmpty
            || !creep.inAssignedRoom
            || room.atMaxLevel
            || room.myStorage
            || room.colonyContainer
        );
    }

    Creep.prototype.task_upgrade_always_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || room.controller.upgradeBlocked
            || (creep.energyEmpty && !creep.isUpgradeControllerCreep)
            || !creep.inWorkRoom
            || !creep.shouldConsumeEnergyLoose

            // Can only do 15 work parts at level 8 apparently.
            // Multiple peons should not bother upgrading at level 8.
            // Either let gnomes do it, or let upgraders do it better than peons.
            || (
                room.atMaxLevel
                //&& (room.creepsUpgradingWorkParts >= room.controllerMaxUpgradePerTick)
                //&& !creep.isBoosted

                // Non-controller upgrade creeps should let all upgrade creeps take their spots.
                && (
                    !creep.isUpgradeControllerCreep
                    //&& CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(room.controller.id).find(f => !f.spawning && !f.pos.inRange3(room.controller))
                )
            )

            // Once temples have storage, then peons will not upgrade them.
            || (
                room.isTemple
                && room.storage
                && (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
                && !creep.isUpgradeControllerCreep
            )
        );
    }

    Creep.prototype.task_upgrade = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (room.controller.upgradeBlocked && !creep.isUpgradeControllerCreep) return false;

        // Upgrade! This will move us to the best position, but may fail due to no energy.
        creep.smartUpgrade();

        // If I have free space, and nearby a drop or link or container, then fill up.
        // Low level oxen are not general controller upgraders, so they should spend what they have and go harvest more.
        if (
            creep.store.getFreeCapacity()
            && creep.isUpgradeControllerCreep
            && creep.pos.inRange3(room.controller)
            && (creep.isUpgradeControllerCreep || !room.myConstructionSites.length)
        ) {

            // New rooms will constantly be dieing off and will have lots of mats laying around from dead upgraders.
            if (!room.atMaxLevel) {
                // Check for nearby dropped energy.
                let dropsNearTo = room.droppedEnergy.find(f => creep.pos.isNearTo(f));
                if (dropsNearTo) {
                    creep.smartPickup(dropsNearTo);
                    // These actions to gather energy can be done simultaneously, but we can easily overload.
                    return true;
                }

                // Check for nearby tombstones with energy.
                let tombstoneNearTo = room.tombstones.find(f => f.store[RESOURCE_ENERGY] && creep.pos.isNearTo(f));
                if (tombstoneNearTo) {
                    creep.smartWithdraw(tombstoneNearTo, RESOURCE_ENERGY);
                    return true;
                }

                // Peons should not be auto-withdrawing, but everyone else should pull from whatever is closest.
                // workParts * 2 is to check to see if we have energy NEXT tick for a full upgrade command.
                if (creep.isUpgradeControllerCreep && (!room.isTemple || (creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.workParts * 2))) {
                    // Check for the nearest controller store (link or container) with energy.
                    // KMP: Expensive to try to get the stores and sort them. Falling back to finding the first one with energy.
                    let container = room.controllerStoresWithEnergySorted.find(f => f.pos.isNearTo(creep));
                    if (container) {
                        creep.smartWithdraw(container, RESOURCE_ENERGY);
                        return true;
                    }
                }
            }

            // Peons should not be auto-withdrawing, but everyone else should pull from link only.
            if (
                room.atMaxLevel
                && creep.isUpgradeControllerCreep
                // There is a cap of how much we can upgrade in one tick at max level.
                // Pull when we are less than 2 actions from empty (including this one), so on next tick we can have full energy and full upgrade potential.
                && (creep.store.getUsedCapacity(RESOURCE_ENERGY) < (CONTROLLER_MAX_UPGRADE_PER_TICK * 2 ))
                && room.myControllerLink
                && creep.pos.isNearTo(room.myControllerLink)
            ) {
                creep.smartWithdraw(room.myControllerLink, RESOURCE_ENERGY);
                return true;
            }

        }

        // If there is someone closer to us with free capacity, give them our energy so they can continue.
        // This should prevent shuffling around as creeps run out of energy.
        if (
            !room.atMaxLevel
            && !room.isTemple
            && creep.isUpgradeControllerCreep
            && creep.pos.inRange3(room.controller)
            && !creep.energyOverHalf
            && (creep.isUpgradeControllerCreep || !room.myConstructionSites.length)
        ) {
            // Any creep that is upgrade, or if they are a dedicated upgrader creep, gets free energy from us!
            // Include oxen that may be around us at low levels.
            let creeps = room.upgradeEnergyCreeps;

            let transfer = null;
            let amount = 0;
            const PERCENT_TRANSFER = 1/5;

            // First pass, take ALL from non-upgrade creep.
            if (!transfer) {
                transfer = creeps.find(f =>
                    // Not a dedicated upgrade controller creep.
                    !f.isUpgradeControllerCreep
                    // Need to be next to me.
                    && creep.pos.isNearTo(f)
                    // They need to have some energy.
                    && f.store.getUsedCapacity(RESOURCE_ENERGY)
                );

                if (transfer) amount = transfer.store.getUsedCapacity(RESOURCE_ENERGY);
            }

            // Second pass, take 1/5 from creep further away from controller than us who has more energy than we do.
            if (!transfer) {
                transfer = creeps.find(f =>
                    // Need to be next to me.
                    creep.pos.isNearTo(f)
                    // Creep needs to be further away from controller than us.
                    && (f.pos.getRangeTo(room.controller) > creep.pos.getRangeTo(room.controller))
                    // If we are lower than quarter capacity, then we can take from others outside of range3 to controller (pages walking by).
                    && (!creep.energyOverQuarter || (f.pos.getRangeTo(room.controller) <= 3))
                    // They need to have more energy than us. This will exclude pulling from ourself.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getUsedCapacity(RESOURCE_ENERGY))
                    // They won't use it all in the current cycle anyway.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > f.workParts)
                );

                if (transfer) amount = (transfer.store.getUsedCapacity(RESOURCE_ENERGY) - transfer.workParts) * (creep.isUpgradeControllerCreep && !transfer.isUpgradeControllerCreep ? 1 : PERCENT_TRANSFER)
            }

            // Third pass, take 1/5 from creeps same distance to controller than us.
            if (!transfer) {
                transfer = creeps.find(f =>
                    // Need to be next to me.
                    creep.pos.isNearTo(f)
                    // Creep needs to be equal distance to the controller as us.
                    && (f.pos.getRangeTo(room.controller) === creep.pos.getRangeTo(room.controller))
                    // They need to have more energy than us. This will exclude pulling from ourself.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getUsedCapacity(RESOURCE_ENERGY))
                    // They won't use it all in the current cycle anyway.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > f.workParts)
                );

                if (transfer) amount = (transfer.store.getUsedCapacity(RESOURCE_ENERGY) - transfer.workParts) * (creep.isUpgradeControllerCreep && !transfer.isUpgradeControllerCreep ? 1 : PERCENT_TRANSFER)
            }

            // Fourth pass, take 1/5 from creeps anywhere near us once we are dry.
            if (!transfer && creep.energyEmpty) {
                transfer = creeps.find(f =>
                    // Need to be next to me.
                    creep.pos.isNearTo(f)
                    // They need to have more energy than us. This will exclude pulling from ourself.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getUsedCapacity(RESOURCE_ENERGY))
                    // They won't use it all in the current cycle anyway.
                    && (f.store.getUsedCapacity(RESOURCE_ENERGY) > f.workParts)
                );

                if (transfer) amount = (transfer.store.getUsedCapacity(RESOURCE_ENERGY) - transfer.workParts) * (creep.isUpgradeControllerCreep && !transfer.isUpgradeControllerCreep ? 1 : PERCENT_TRANSFER)
            }

            if (transfer) {
                // We found another creep to share energy with, so do the transfer.
                amount = Math.min(amount, creep.store.getFreeCapacity());
                transfer.smartGive(creep, RESOURCE_ENERGY, amount);
                return true;
            }

        }

        // If we have fallen all the way to here and we aren't a dedicated upgrader, then bail out if we have no more energy.
        // Will find more in storage or switch tasks.
        if (!creep.store.getUsedCapacity(RESOURCE_ENERGY) && !creep.isUpgradeControllerCreep) return false;

        // Stay on this task.
        return true;
    }

    Creep.prototype.task_upgrade_crier_criteria = function() {
        return (
            !this.room.my
            || !this.room.atMaxLevel
        );
    }

    Creep.prototype.task_upgrade_crier = function() {
        // This is a special max level routine. If low level upgrading, then perform the standard upgrade process.
        if (!this.room.atMaxLevel) return this.task_upgrade();

        // Upgrade! This will move us to the best position, but may fail due to no energy.
        this.smartUpgrade();

        if (
            // There is a cap of how much we can upgrade in one tick at max level.
            // Pull when we are less than 2 actions from empty (including this one), so on next tick we can have full energy and full upgrade potential.
            (this.store.getUsedCapacity(RESOURCE_ENERGY) < (CONTROLLER_MAX_UPGRADE_PER_TICK * 2 ))
        ) {
            // Cache our controller link, as we will be looking for it often.
            if (!this.stickyTarget) {
                this.stickyTarget = this.room.myControllerLink;
            }

            let target = this.stickyTarget;
            if (
                target
                && this.pos.isNearTo(target)
                && target.store.getUsedCapacity(RESOURCE_ENERGY)
            ) {
                // Only withdraw as much as we can use before we need to unboost.
                let amount = Math.min(this.ticksToLiveUpgradeControllerEnergy, target.store.getUsedCapacity(RESOURCE_ENERGY));
                this.smartWithdraw(target, RESOURCE_ENERGY, amount);
                return true;
            }
        }

        // Stay on this task.
        return true;
    }

    Creep.prototype.task_upgrade_prophet_criteria = function() {
        return (
            !this.room.my
        );
    }

    Creep.prototype.task_upgrade_prophet = function() {
        // This is a special max level routine. If low level upgrading, then perform the standard upgrade process.
        if (!this.room.atMaxLevel) return this.task_upgrade();

        // Once we are nearing death, and have no energy left, then bail out so we can unboost.
        let nearDeath = this.isInUnboostTicksToLive;
        if (
            nearDeath
            && (this.store.getUsedCapacity() === 0)
        ) {
            return false;
        }

        // Upgrade! This will move us to the best position, but may fail due to no energy.
        this.smartUpgrade();

        if (
            // There is a cap of how much we can upgrade in one tick at max level.
            // Pull when we are less than 2 actions from empty (including this one), so on next tick we can have full energy and full upgrade potential.
            (this.store.getUsedCapacity(RESOURCE_ENERGY) < (CONTROLLER_MAX_UPGRADE_PER_TICK * 2 ))
            // We may not actually have a lab to unboost on; if not continue to pull energy and keep upgrading for another round.
            && (!nearDeath || !this.room.atMaxLevel)
        ) {
            // Cache our controller link, as we will be looking for it often.
            if (!this.stickyTarget) {
                this.stickyTarget = this.room.myControllerLink;
            }

            let target = this.stickyTarget;
            if (
                target
                && this.pos.isNearTo(target)
                && target.store.getUsedCapacity(RESOURCE_ENERGY)
            ) {
                // Only withdraw as much as we can use before we need to unboost.
                let amount = Math.min(target.store.getUsedCapacity(RESOURCE_ENERGY), this.store.getFreeCapacity(), this.ticksToLiveBoostUpgradeControllerCapacity);
                this.smartWithdraw(target, RESOURCE_ENERGY, amount);
                return true;
            }
            else if (
                !this.room.atMaxLevel
            ) {
                // Edge case for temples where the controller link will go away on recycle.
                let container = this.room.controllerStoresWithEnergySorted.find(f => f.pos.isNearTo(this));
                if (container) {
                    this.smartWithdraw(container, RESOURCE_ENERGY);
                    return true;
                }
            }
        }

        // Stay on this task.
        return true;
    }

    Creep.prototype.task_upgrade_temple_criteria = function() {
        return (
            !this.room.my
        );
    }

    Creep.prototype.task_upgrade_temple = function() {
        // Getting bounced out of room due to pathing issues near edge?
        if (this.moveToTaskWorkRoom()) return true;

        // Once room is at max level, bail out.
        if (this.room.atMaxLevel) return false;

        // Upgrade! This will move us to the best position, but may fail due to no energy.
        this.smartUpgrade();

        if (
            // There is a cap of how much we can upgrade in one tick at max level.
            // Pull when we are less than 2 actions from empty (including this one), so on next tick we can have full energy and full upgrade potential.
            (this.store.getUsedCapacity(RESOURCE_ENERGY) < (CONTROLLER_MAX_UPGRADE_PER_TICK * 2 ))
            && ((this.ticksToLive - 2) > (this.store.getCapacity() / this.workParts))
        ) {
            let target = this.room.controllerStoresWithEnergySorted.find(f => f.pos.isNearTo(this));
            if (target) {
                // Only withdraw as much as we can use before we die.
                let amount = Math.min(this.ticksToLiveUpgradeControllerEnergy, target.store.getUsedCapacity(RESOURCE_ENERGY));
                this.smartWithdraw(target, RESOURCE_ENERGY, amount);
                return true;
            }
        }

        // Stay on this task.
        return true;
    }

    Creep.prototype.task_generate_safeMode_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            creep.storeEmpty
            || room.hasMaxSafeModesAvailable
        );
    }

    Creep.prototype.task_generate_safeMode = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (creep.storeEmpty) return false;

        // We need moar safe mode!
        creep.smartGenerateSafeMode();

        // Always busy...exit criteria only way out.
        return true;
    }

    Creep.prototype.task_stomp_hostileConstructionSites_criteria = function() {
        // Shorthand.
        let room = this.room;

        return (
            !room.hostileConstructionSites.length
        );
    }

    Creep.prototype.task_stomp_hostileConstructionSites = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!room.hostileConstructionSites.length) return false;

        let site = null;
        if (creep.stickyTarget) {
            // If we have a cached site and its still there, build it.
            site = creep.stickyTarget;

        } else {
            if (!site) {
                // Find the closest consruction site in progress and move on top of it to delete it.
                site = creep.pos.findClosestByPath(room.hostileConstructionSitesWithProgress, {
                    filter: f => !creep.pos.isEqualTo(f) && !f.pos.isTerrainWall
                });
            }

            if (!site) {
                // We are in a reserved room, find the closest construction site and move on top of it to delete it.
                // Any construction site can be blocking us from making containers/roads.
                if (GameManager.empireReservedRoomsHash[room.name]) {
                    site = creep.pos.findClosestByPath(room.hostileConstructionSites, {
                        filter: f => !creep.pos.isEqualTo(f) && !f.pos.isTerrainWall
                    });
                }
            }
        }

        if (site) {
            creep.stickyTarget = site;
            creep.talk('😈');
            creep.smartMove(site.pos);
            return true;
        }

        return false;
    }

    Creep.prototype.task_visit_controller_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.storeEmpty
            || !creep.inWorkRoom
            || !room.controller
        );
    }

    Creep.prototype.task_visit_controller = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!creep.storeEmpty) return false;
        if (!room.controller) return false;

        // If we are passing thru a room and the controller doesn't have the right sign, fix it ;)
        if ([ERR_NOT_IN_RANGE, ERR_TIRED].includes(creep.smartVisitController())) return true;

        return false;
    }

    Creep.prototype.task_blockController_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !room.my
            || !creep.inWorkRoom
        );
    }

    Creep.prototype.task_blockController = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!room.my) return false;

        // Just move to the controller.
        if (!creep.pos.isNearTo(room.controller)) creep.smartMove(room.controller);

        // We can perform basic attack just don't move.
        if (RoomIntel.getDangerousHostilesTTL(room.name)) {
            let hostile = creep.hostilesNearBy[0];
            if (hostile) {
                creep.smartAttack(hostile, false);
            }
        }

        // We will never leave this task.
        return true;
    }

    Creep.prototype.task_idle_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    Creep.prototype.task_idle = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Moved to a room without a controller or one I already own? LOL.
        // Also may be recently claimed in this lifetime.
        if (room.my) {
            creep.commitHaraKiri();
            return true;
        }

        if (room.myManagement) {
            // For rooms simply reseved by me, stick around and just nap;
            // This gives us potentially longer visibililty into the room.
            creep.nap();
            return true;
        }

        // If there are destroy flags then we need to just stay put off edge.
        if (room.destroyFlags.length) {
            if (creep.pos.isEdge) creep.inchForward(GameManager.getRoomMoveToPos(room.name), 1);
            return true;
        }

        // We are in an unknown room, run away from hostiles.
        if ((creep.nap({fleeHostiles: true}) !== OK) && creep.pos.isEdge) creep.inchForward(GameManager.getRoomMoveToPos(room.name), 1);

        // This step is a sink; stay here forever.
        return true;
    }

    Creep.prototype.task_suicide_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.storeEmpty
            || !(creep.inAssignedRoom || creep.inWorkRoom)
            || creep.pos.isEdge
        );
    }

    Creep.prototype.task_suicide = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.storeEmpty) return false;
        if (!(creep.inAssignedRoom || creep.inWorkRoom)) return false;
        if (creep.pos.isEdge) return false;

        // Oft yourself.
        creep.commitHaraKiri();
        return true;
    }

    Creep.prototype.task_suicide_miner_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.storeEmpty
            || !creep.inSpawnRoom
            || (!Game.rooms[creep.workRoom] || !Game.rooms[creep.workRoom].mineral || Game.rooms[creep.workRoom].mineral.mineralAmount)
        );
    }

    Creep.prototype.task_suicide_miner = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (!creep.storeEmpty) return false;
        if (!creep.inSpawnRoom) return false;
        if (!Game.rooms[creep.workRoom] || !Game.rooms[creep.workRoom].mineral || Game.rooms[creep.workRoom].mineral.mineralAmount) return false;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_suicide_upgrader_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.inWorkRoom
            || !room.atMaxLevel
        );
    }

    Creep.prototype.task_suicide_upgrader = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!room.atMaxLevel) return false;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_suicide_horse_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            !creep.inWorkRoom
            || !GameManager.getSpawnsByRoomName(room.name).length
            || !(
                room.myTerminal
                || !creep.canMakeAssignedRoomRoundTrip
                || (room.myStorage && room.myStorage.storeFull)
            )
        );
    }

    Creep.prototype.task_suicide_horse = function() {
        // Shorthand.
        let creep = this;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return false;
    }

    Creep.prototype.task_suicide_burro_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.storeEmpty
            || RoomIntel.getPowerBankById(creep.focusId)
            || RoomIntel.getPlunderablePower(creep.workRoom)
        );
    }

    Creep.prototype.task_suicide_burro = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.storeEmpty) return false;
        if (RoomIntel.getPowerBankById(creep.focusId)) return false;
        if (RoomIntel.getPlunderablePower(creep.workRoom)) return false;

        // Return to spawn room so at least the body can be recycled.
        if (creep.moveToAssignedRoom() === OK) return true;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return true;
    }

    Creep.prototype.task_suicide_donkey_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.storeEmpty
            || GameManager.isDepositActive(creep.focusId, true)
        );
    }

    Creep.prototype.task_suicide_donkey = function() {
        // Shorthand.
        let creep = this;

        // Return to assigned room so at least the body can be recycled.
        if (creep.moveToAssignedRoom() === OK) return true;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return true;
    }

    Creep.prototype.task_suicide_reservedRoom_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.storeEmpty
            || GameManager.empireReservedRoomsHash[creep.workRoom]
        );
    }

    Creep.prototype.task_suicide_reservedRoom = function() {
        // Shorthand.
        let creep = this;

        // Exit criteria.
        if (!creep.storeEmpty) return false;
        if (GameManager.empireReservedRoomsHash[creep.workRoom]) return false;

        // Return to spawn room so at least the body can be recycled.
        if (creep.moveToAssignedRoom() === OK) return true;

        // Oft yourself.
        if ([OK, ERR_NOT_IN_RANGE].includes(creep.smartRecycle())) {
            return true;
        }

        return true;
    }

    Creep.prototype.task_attack_powerbank_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
            || (creep.inWorkRoom && !creep.focusTarget)
        );
    }

    Creep.prototype.task_attack_powerbank = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.inWorkRoom && !creep.focusTarget) return false;

        // Getting bounced out of room due to pathing issues near edge?
        if (!creep.inWorkRoom && creep.focusTarget) {
            creep.smartMove(creep.focusTarget);
            return true;
        }
        if (!creep.inWorkRoom) {
            creep.moveToWorkRoom();
            return true;
        }

        let target = null;
        let hostiles = RoomIntel.getDangerousPlayerHostilesTTL(room.name) ? room.hostiles : [];
        if (hostiles.length) {
            let guardians = CreepManager.getGuardiansByFocusId(creep.focusId).filter(f => f.inWorkRoom);
            let range = guardians.length ? Config.params.HIGHWAY_DEFEND_RANGE_WORKERS : Config.params.HIGHWAY_DEFEND_RANGE_WORKERS_SOLO;
            hostiles = room.hostiles.filter(f => f.pos.inRangeTo(creep.focusTarget, range) || f.pos.isNearTo(creep));
        }
        let moveTo = true;

        if (hostiles.length) {
            // If we have hostiles too close to us, then they are by our focus target and need to be destroyed.
            target = _.sortBy(hostiles, s => s.pos.getRangeTo(creep))[0];
            moveTo = true;

        }
        else {
            // This is the powerbank assigned to us.
            target = creep.focusTarget;
            moveTo = !creep.pos.isNearTo(target) && ((target.nips.length === 1) || target.nipsFree.length);
        }

        // If we have a blacksmith single-nip powerbank, then just kill whoever is standing on it.
        if (target && (target instanceof StructurePowerBank) && (target.nips.length === 1)) {
            let creep = target.nips[0].lookForCreep();
            if (creep && !creep.my) target = creep;
        }

        if (target) {
            creep.stickyTarget = target;

            // This task can get caught on the edge.
            if (creep.pos.inRange2Edge) {
                creep.smartMove(creep.focusTarget);
                return true;
            }

            // Make sure we have our healer in the room.
            if (!creep.isBodyPartDestroyed) {
                // Finally, make our attack.
                creep.smartAttack(target, moveTo);
            }
            else if (moveTo) {
                creep.smartMove(target);
            }

            // We have moved and/or attacked, good enough.
            return true;
        }

        // Stay in this task until exit criteria is met.
        return true;
    }

    Creep.prototype.task_heal_powerbank_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
            || (creep.inWorkRoom && !creep.focusTarget)
        );
    }

    Creep.prototype.task_heal_powerbank = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Exit criteria.
        if (creep.inWorkRoom && !creep.focusTarget) return false;

        // Getting bounced out of room due to pathing issues near edge?
        if (!creep.inWorkRoom && creep.focusTarget) {
            creep.smartMove(creep.focusTarget);
            return true;
        }
        if (!creep.inWorkRoom) {
            creep.moveToWorkRoom();
            return true;
        }

        let target = null;
        let taskFilterBase = function(object) {
            return (
                object
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            target = creep.stickyTarget;

        } else {
            // Workers will be Strikers if healer is Cardinal, or Blacksmiths if healer is Bishop.
            let workers = creep.isCardinal ? CreepManager.getStrikersByFocusId(creep.focusId) : CreepManager.getBlacksmithsByFocusId(creep.focusId);

            // Find a metalworker who has the same focus target as me, but does not have a healer assigned.
            let worker = workers.find(f =>
                taskFilterBase(f)
                && f.inWorkRoom
                && !f.healer
            );

            if (worker) {
                target = worker;
                // Perminately assign this healer to this creep.
                target.healerId = creep.id;
            }
        }

        // Save our sticky target.
        if (target) {
            creep.stickyTarget = target;
        }

        // This task can get caught on the edge.
        // Also our worker may have died but other workers are in the room, backup so new ones can get in.
        if (creep.pos.isNearEdge && !creep.stickyTarget) {
            creep.smartMove(creep.focusTarget);
            return true;

        } else if (!target && creep.focusTarget && creep.pos.inRange3(creep.focusTarget)) {
            // Odd scenerio. Back away from the power bank if we are too close.
            creep.nap();
            return true;
        }

        else if (target) {
            // If someone is attacking us, heal self as priority.
            if (creep.isDamaged) {
                creep.smartHeal(creep, target);
            }
            // Our partner is not near the focus, perhaps attacking something else, follow him always.
            else if (!target.pos.isNearTo(creep.focusTarget)) {
                creep.smartHeal(target, target);
            }
            // Our target has aquired a target to attack, move to the opposite side of it.
            else if (target.stickyTarget && target.pos.isNearTo(target.stickyTarget)) {
                let moveTo = ![OK, ERR_NOT_IN_RANGE].includes(creep.alignToAnchorBehindTarget(target, target.stickyTarget));
                creep.smartHeal(target, moveTo);
            }
            // Heal/move to target as base action.
            else {
                creep.smartMove(target);
            }

        }
        // Heal yourself if we are damaged and just sitting here waiting.
        else if (creep.isDamaged) {
            creep.smartHeal(creep);

        }

        // Stay in this task until exit criteria is met.
        return true;
    }

    Creep.prototype.task_dismantle_criteria = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        return (
            room.my
            || !creep.inWorkRoom
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_dismantle = function() {
        // Shorthand.
        let creep = this;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (creep.my) return false;
        if (creep.shouldDisengageFromCurrentRoom) return false;

        let structure = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.hits
                && !creep.shouldFleeFromLair(object)
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            structure = creep.stickyTarget;

        } else {
            if (!structure) {
                // Find any leftover containers (from stronghold or player) that aren't our source containers.
                // Only 5 containers per room are allowed, and these are annoying.
                structure = creep.pos.findClosestByPath(room.nonSourceContainers, {
                    ignoreCreeps: true
                    , filter: f => taskFilterBase(f)
                });
            }
        }

        if (structure) {
            creep.memory.stickyTargetId = structure.id;

            // Finally, make our attack.
            creep.smartDismantle(structure);

            return true;
        }

        return false;
    }

    Creep.prototype.task_attack_invaderStructures_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    Creep.prototype.task_attack_invaderStructures = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!room.invaderStructures.length) return false;

        let structure = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.hits
                && !object.isInvulnerableTicks
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached site and its still there, build it.
            structure = creep.stickyTarget;

        } else {
            // Find any invader structures in the room.
            structure = creep.pos.findClosestByPath(room.invaderStructures, {
                ignoreCreeps: true
                , filter: f => taskFilterBase(f)
            });
        }

        if (structure) {
            // Finally, make our attack.
            let moveTo = !this.pos.isNearTo(structure);
            creep.smartAttack(structure, moveTo);
            return true;
        }

        // Stay in this task until exit criteria is met.
        return true;
    }

	RoomPosition.prototype.getRangedMassAttackScore = function(objects, power = 1) {
		function scoreFilter(pos, target) {
			let score = 0;
			switch(pos.getRangeTo(target)) {
				case 3:
					score = 1 * power;
					break;
				case 2:
					score = 4 * power;
					break;
				case 1:
                case 0:
					score = 10 * power;
					break;
			}
			return score;
		}

		// Filter objects that are in range.
		objects = objects.filter(f => this.getRangeTo(f) <= 3);

		// Return final result. Note this is negative so that better scores are lower.
		return -_.sum(objects, object => scoreFilter(this, object));
	}

	Object.defineProperty(Room.prototype, 'strongholdAttackPositionsSorted', {
		get() {
			if (typeof this._strongholdAttackPositionsSorted === "undefined") {
				this._strongholdAttackPositionsSorted = [];

                // Our invader core stronghold.
                let invaderStronghold = this.invaderStronghold;

                // Determine the idea range, depending on stronghold conditions.
                let range = 1;
                if (!invaderStronghold) {
                    // No stronghold means towers and invader creeps are disabled.
                    range = 1;
                }
                else if (invaderStronghold.level <= 1) {
                    // Level 1 will never spawn melee hostiles.
                    range = 1;
                }
                else if (invaderStronghold.spawning && (invaderStronghold.spawning.remainingTime <= (Config.params.ROOMINTEL_CACHE_TICKS * 2))) {
                    // Back up out of range of any POTENTIAL spawning spot of a melee hostile.
                    range = 3;
                }
                else if (this.invadersWithAttack.length) {
                    // Melees are spawned, don't get close.
                    // We will include these to the list of targets below.
                    range = 2;
                }

                // We don't do damage to targets UNDER ramparts, so exclude them from the list of potential targets.
                let targets = this.invaderStructures.filter(f => f.owner && (f.isRampart || !f.pos.hasRampartHits));

                // Add on our invaders that are outside of ramparts.
                let invaders = this.invadersWithAttack.filter(f => !f.pos.hasRampartHits);
                if (invaders) targets = targets.concat(invaders);

                // Get all positions that are at the specified range from any target in the list (and not closer to another).
                // For each object, get the positions around it. Flatten the array.
                let positions = targets.map(m => m.pos.posOfRangeDNotBlockedByObject(range)).flatten();

                // Stringify the array values, then get unique values, then remap back to RoomPosition.
                positions = utils.unique(positions.map(m => m.name)).map(m => utils.posFromName(m));

                // Filter out positions that are less than desired range to any other target.
                positions = positions.filter(f => !targets.find(i => f.getRangeTo(i) < range));

                // Sort by range to stronghold (it is priority kill so that we can move closer), then by splash damage done.
                // We expect to be a max boosted creep (x4 multiplier).
                const boostMultiplier = 4;
                if (invaderStronghold) {
                    this._strongholdAttackPositionsSorted = _.sortByOrder(positions, [
                        sortRange => sortRange.getRangeTo(invaderStronghold)
                        , sortDistance => sortDistance.getDistanceTo(invaderStronghold)
                        , sortDamage => sortDamage.getRangedMassAttackScore(targets, boostMultiplier)
                    ]);
                }
                else {
                    this._strongholdAttackPositionsSorted = _.sortBy(positions,
                        sortDamage => sortDamage.getRangedMassAttackScore(targets, boostMultiplier)
                    );
                }

			}
			return this._strongholdAttackPositionsSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'strongholdPosFindNearBy', {
		get() {
			if (typeof this._strongholdPosFindNearBy === "undefined") {
				this._strongholdPosFindNearBy = RoomIntel.getStrongholdAttackPositionsSorted(this.room.name).find(f =>
                    this.pos.inRange1(f)
                    && (this.pos.isEqualTo(f) || !f.lookForCreep())
                ) || null;
			}
			return this._strongholdPosFindNearBy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'strongholdPosFindFirst', {
		get() {
			if (typeof this._strongholdPosFindFirst === "undefined") {
                 // This structure is such that there should be a walkable ring around the entire stronghold, so just find the first position we can get to.
                this._strongholdPosFindFirst = this.pos.findClosestByPath(RoomIntel.getStrongholdAttackPositionsSorted(this.room.name)) || null;
			}
			return this._strongholdPosFindFirst;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.task_attack_stronghold_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    /**
     * Move our creep to the focus target, or work room, if we are not currently in it.
     * Used to ensure task is being done in the correct room.
     */
    Creep.prototype.moveToTaskWorkRoom = function() {
        if (this.inWorkRoom) return false;

        if (this.stickyTarget && (this.stickyTarget.pos.roomName === this.workRoom)) {
            this.smartMove(this.stickyTarget);
            return true;
        }
        if (this.focusTarget && (this.focusTarget.pos.roomName === this.workRoom)) {
            this.smartMove(this.focusTarget);
            return true;
        }
        this.moveToWorkRoom();
        return true;
    }

    Creep.prototype.task_attack_stronghold = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Exit criteria.
        if (!RoomIntel.getStrongholdInvaderMassAttackStructureHitsByRoomName(room.name)) return false;

        // Find the best location we can get to and move there for attack.
        let moveTo = creep.strongholdPosFindNearBy || creep.strongholdPosFindFirst || room.invaderStronghold || creep.pos;
        if (!creep.pos.isEqualTo(moveTo)) creep.smartMove(moveTo);

        // Heal only if we need it.
        if (RoomIntel.getStrongholdInvaderCoreHitsByRoomName(room.name) || creep.isDamaged) creep.heal(creep);

        // Make are ranged attack.
        creep.rangedMassAttack();

        // Stay in this task until exit criteria is met.
        return true;
    }

    Creep.prototype.task_attack_sourceKeeper_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    Creep.prototype.task_attack_sourceKeeper = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Getting bounced out of room due to pathing issues near edge?
        if (creep.moveToTaskWorkRoom()) return true;

        // Are we only concerned about the mineral target?
        let focusResources = function() {
            return room.myManagement ? room.resources : [room.mineral];
        }

        let sourcekeeper = null;
        let taskFilterBase = function(object) {
            return (
                object
                && object.id
                && (object.pos.roomName === creep.pos.roomName)
            )
        }

        if (taskFilterBase(creep.stickyTarget)) {
            // If we have a cached target and its still there, target it.
            sourcekeeper = creep.stickyTarget;

        }
        else {
            if (!sourcekeeper) {
                // Find any lethal hostiles in the room.  Don't care about anyone else, let archers deal with them.
                if (RoomIntel.getLethalHostilesTTL(room.name)) {
                    sourcekeeper = creep.pos.findClosestByPath(room.lethalHostiles.filter(f => !f.pos.isEdge), {
                        ignoreCreeps: true
                    });
                }
            }

            if (!sourcekeeper) {
                if (creep.moveToTarget) {
                    // The keeper associated with the moveToTarget (lair).
                    sourcekeeper = creep.moveToTarget.sourceKeeper;
                    creep.stickyTarget = sourcekeeper;
                }
            }

        }

        if (sourcekeeper) {
            // Heal/preemptive if we are not in range for attack.
            if (!creep.attackPartsActive || (!creep.pos.isNearTo(sourcekeeper) && (creep.isDamaged || creep.pos.inRange3(sourcekeeper)))) {
                creep.smartHeal(creep);
            }
            // Pause here out of range to just heal up before engaging.
            if (!creep.pos.inRange3(sourcekeeper) && creep.pos.inRange6(sourcekeeper) && creep.isDamaged && sourcekeeper.isSourceKeeper) {
                creep.talk('🚬');
                return true;
            }

            // Finally, make our attack (or move to target).
            // If we are attacking a sourcekeeper (aka near a lair) then do not move.
            // Otherwise try to move closer to the (possibly moving) target.
            creep.smartAttack(sourcekeeper, true);
            return true;
        }

        // If we are damanged, heal up while we wait.
        if (creep.isDamaged) {
            creep.smartHeal(creep);
        }

        // The order here could be important...should be the shortest combined path between the 4.
        // Note we aren't visiting ALL lairs ALL the time, could just be minerals.
        let lair = _.sortBy(focusResources().map(m => m.keeperLair), s => (s.ticksToSpawn || 0))[0];
        creep.moveToId = lair.id;

        if (lair) {
            // Check to see if the lair won't respawn before we die of old age.
            // In which case just die quickly so we can get a new one spawned quicker.
            if (lair.ticksToSpawn && (creep.ticksToLive < lair.ticksToSpawn)) {
                // Oft yourself.
                creep.commitHaraKiri();
                return true;
            }

            // If there is someone right next to me, then back away so they can get loot I am probably blocking.
            if (creep.pos.isNearTo(lair) && room.myCreeps.find(f => (f.id !== creep.id) && creep.pos.isNearTo(f) && f.isSKWorker)) {
                creep.nap();
                return true;
            }

            // Cozy up to the lair in anticipation.
            if (lair.ticksToSpawn) creep.talk(lair.ticksToSpawn);

            // Get the spot next to the lair that is closest to the source it is defending.
            let moveToPos = lair;

            // Pause here out of range to just heal up before engaging.
            if (!creep.pos.inRange6(lair) && creep.pos.inRange9(lair) && creep.isDamaged) {
                creep.talk('🚬');
                return true;
            }

            let focusTargetResource = lair.resource;
            if (focusTargetResource) {
                moveToPos = _.sortBy(lair.nips, s => s.getDistanceTo(focusTargetResource)).find(f => !f.isNearTo(focusTargetResource));
            }
            this.smartMove(moveToPos);
            return true;
        }

        // Stay in this task until exit criteria is met. Take a nap while we wait.
        creep.nap();
        return true;
    }

    Creep.prototype.task_harvest_peasant_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
        );
    }

    Creep.prototype.task_harvest_peasant = function() {
        // Determine if we have a cached target to harvest.
        let source = this.harvestTarget;

        if (!source) {
            // Find any sources not already claimed and has a harvesting position (it may not due to bugs or blocked area.)
            source = this.pos.findClosestByPath(this.room.reachableSources.filter(f => f.needsHarvester), {
                ignoreCreeps: true
            });
        }

        if (!source) {
            // How can there not be any sources? Should be 1 havester per source. Perhaps blocked.
            this.harvestId = null;
            return false;
        }

        // We have a source, save it so no-one else takes it.
        this.harvestId = source.id;

        // harvestPos is first and always called.
        let harvestPos = source.harvestPos;

        // Somehow we don't have a spot to harvest from, so give up.
        if (!harvestPos) {
            this.harvestId = null;
            return false;
        }

        // Move to our designated harvesting spot.
        if (!this.pos.isEqualTo(harvestPos)) {
            // At max level, there will only be one creep havesting.
            if (this.room.atMaxLevel) {
                this.talk('⛏️');
                this.smartMove(harvestPos);
                return true;
            }
            else {
                // If there is no one currently on the harvesting position, move to it.
                let harvestPosCreep = harvestPos.lookForCreep();
                if (!harvestPosCreep) {
                    this.talk('⛏️');
                    this.smartMove(harvestPos);
                    return true;
                }
                // Test to see that the creep currently harvesting can handle it by itself. If so, nap until it dies.
                if (harvestPosCreep.harvestSourceBasePower >= source.power) {
                    // Stay in this task until exit criteria is met. Take a nap while we wait.
                    this.nap();
                    return true;
                }
            }
        }

        // Perform our harvest if we have space, or don't have space at all (early peasants)
        let harvestResult = ERR_FULL;
        if (!this.store.getCapacity() || (this.store.getFreeCapacity() && (this.ticksToLive > 1))) {
            // Harvest this puppy!
            harvestResult = this.smartHarvest(source);
        }

        // We have energy, and we are not harvesting (probably empty), or we have no room left for any more energy.
        // Transfer what we have to our link.
        let linkSuccess = ERR_NOT_FOUND;
        if (
            // Early peasants won't have any carry parts.
            this.store.getCapacity()
            && (
                (harvestResult !== OK)
                || (this.store.getFreeCapacity() < this.harvestSourceBasePower)
                || (this.ticksToLive === 1)
            )
        ) {
            // Interact with our link if we have one.
            // Use stickyTarget to remember the link.
            let sourceLink = this.stickyTarget;
            if (!sourceLink) {
                sourceLink = source.sourceLink;
                this.stickyTarget = sourceLink;
            }

            if (sourceLink && this.store.getUsedCapacity(RESOURCE_ENERGY)) {
                // Transfer to our link. This may error, or fail with a full error condition.
                linkSuccess = this.smartStorage(sourceLink, RESOURCE_ENERGY);
            }
        }

        // If the link is not present or was full, then drop all our load at once. Hopefully onto a container.
        // Otherwise peons get excited to see one little bit of droppings at a time.
        if (
            ![OK, ERR_FULL].includes(linkSuccess)
            && this.store.getUsedCapacity(RESOURCE_ENERGY)
            && (
                (harvestResult !== OK)
                || (this.store.getFreeCapacity() < this.harvestSourceBasePower)
            )
        ) {
            // Just drop everything. Hope we have a container under us!
            // Need to drop since we want to renew and have to be empty in that case.
            this.smartDrop();
            return true;
        }

        // We have made it this far, with nothing else to do.
        // If remove farmer has fewer ticks left to live than our source has to respawn, then just suicide and save cpu.
        if (source && !source.energy && (this.ticksToLive < source.ticksToRegeneration)) {
            this.commitHaraKiri();
            return true;
        }

        // Stay in this task forever.
        return true;
    }

    Creep.prototype.task_harvest_farmer_criteria = function() {
        // Shorthand.
        let creep = this;

        return (
            !creep.inWorkRoom
            || creep.shouldDisengageFromCurrentRoom
        );
    }

    Creep.prototype.task_harvest_farmer = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // If attacked, then drop everything and start running!
        if (creep.isBodyPartDestroyed) {
            if (creep.store.getUsedCapacity()) creep.smartDrop();
            return false;
        }

        // If we have a focus (set by spawn manager), set our harvest Id to it.
        if (creep.focusId) creep.harvestId = creep.focusId;

        // Determine if we have a cached target to harvest.
        let source = creep.harvestTarget;

        if (!source && creep.inWorkRoom) {
            // Find any sources not already claimed and has a harvesting position (it may not due to bugs or blocked area.)
            source = creep.pos.findClosestByPath(room.sources, {
                ignoreCreeps: true
                , filter: f => !creep.otherCreepsHarvesting(f) && f.harvestPos
            });
        }

        if (!source) {
            // How can there not be any sources? Should be 1 havester per source. Perhaps blocked.
            creep.harvestId = null;
            return false;
        }

        // We have a source, save it so no-one else takes it.
        creep.harvestId = source.id;

        // For SK rooms we need to back away if the keeper lair is about to spawn.
        if (creep.shouldFleeFromLairByResource(source)) {
            if (creep.store.getUsedCapacity()) creep.smartDrop();
            // Stay in this task until exit criteria is met. Take a nap while we wait.
            creep.napSK(source);
            return true;
        }

        // harvestPos is first and always called.
        let harvestPos = source.harvestPos;

        // Somehow we don't have a spot to harvest from, so give up.
        if (!harvestPos) {
            creep.harvestId = null;
            return false;
        }

        // Suicide if the room we are in doesn't yet support farming.
        // Usually when we claim a room, our presense will block peons.
        if (this.room.controller && (this.room.controller.level === 1) && this.room.colonyFlag && this.room.claimFlag) {
            creep.commitHaraKiri();
            return true;
        }

        // Move to our designated harvesting spot.
        if (!creep.pos.isEqualTo(harvestPos)) {
            // If there is no one currently on the harvesting position, move to it.
            let harvestPosCreep = harvestPos.lookForCreep();
            if (!harvestPosCreep) {
                creep.talk('⛏️');
                creep.smartMove(harvestPos);
                return true;
            }
            // Test to see that the creep currently harvesting can handle it by itself. If so, nap until it dies.
            if (harvestPosCreep.harvestSourceBasePower >= source.power) {
                // Stay in this task until exit criteria is met. Take a nap while we wait.
                creep.nap();
                return true;
            }
        }

        // We have energy, and we are not harvesting (probably empty), or we have no room left for any more energy.
        // Now is the time to perform some container maintenance.
        let workParts = creep.workParts;

        // Interact with our container if we have one.
        // Use stickyTarget to remember the container.
        let sourceContainer = creep.stickyTarget;
        if (!sourceContainer) {
            sourceContainer = source.sourceContainer;
            creep.stickyTarget = sourceContainer;
        }

        if (
            creep.store.getCapacity()
            && (creep.store.getFreeCapacity() < (workParts * HARVEST_POWER))
            && creep.pos.isEqualTo(harvestPos)
        ) {

            if (creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
                // Be smart about the repairing; repair if below half life, or if our container is full.
                if (
                    sourceContainer
                    && (sourceContainer.hits <= (sourceContainer.hitsMax - (workParts * REPAIR_POWER)))
                    && (
                        // No more room in the container so repair it to full health before dropping on ground.
                        !sourceContainer.store.getFreeCapacity()
                        // Or container have fallen below half health.
                        || (sourceContainer.hits < (sourceContainer.hitsMax / 2))
                        // Or this room is no longer being reserved by us, so repair it fully so it can be used if we reclaim it.
                        || !GameManager.empireReservedRoomsHash[room.name]
                    )
                ) {
                    // Repair and bail out.
                    creep.smartRepair(sourceContainer, false);
                    return true;
                }

                if (
                    !sourceContainer
                ) {
                    if (GameManager.myConstructionSiteRoomNamesHash[room.name]) {
                        let containerConstructionSite = harvestPos.lookForContainerConstructionSite();
                        if (containerConstructionSite) {
                            // No container, but there is a construction site, so build it.
                            // Building by farmer is faster and safer than relying on oxen.
                            // It also doesn't cause more oxen to spawn than need be, as containers are hard to build.
                            creep.smartBuild(containerConstructionSite, true)
                            return true;
                        }
                    }

                    // We don't have a container, and we don't have a construction site.
                    // Go ahead and put one down, even if this isn't our reserved room (it may be later).
                    // Don't need to return true here, as this may error and we can still harvest.
                    room.createConstructionSite(harvestPos, STRUCTURE_CONTAINER);
                }
            }
        }

        // Only harvest if we have room in container or ourself.
        if (
            // Disable for now to save CPU.
            !GameManager.empireReservedRoomsHash[room.name]
            && sourceContainer
            && !sourceContainer.store.getFreeCapacity()
            && creep.storeFull
        ) {
            // Do nothing.
            creep.talk('🚬');
        }
        else {
            // If we haven't bailed out by now, harvest this puppy!
            // This may not be successful (ource could be empty, etc).
            creep.smartHarvest(source);
        }

        // We have made it this far, with nothing else to do.
        // If remove farmer has fewer ticks left to live than our source has to respawn, then just suicide and save cpu.
        if (
            !source.energy
            && (creep.ticksToLive < source.ticksToRegeneration)
        ) {
            creep.commitHaraKiri();
            return true;
        }

        // If this room is no longer reserved, and we have our source container and its at full hit points, then oft ourselves to save cpu.
        if (
            !GameManager.empireReservedRoomsHash[room.name]
            && sourceContainer
            && (sourceContainer.hits >= (sourceContainer.hitsMax - (workParts * REPAIR_POWER)))
        ) {
            creep.commitHaraKiri();
            return true;
        }

        // Stay in this task forever.
        return true;
    }

	Object.defineProperty(Creep.prototype, 'canLongNap', {
		get() {
			if (typeof this._canLongNap === "undefined") {
                this._canLongNap =
                    true
                    && (this.task === Config.tasks.BOOTSTRAP)
                    && this.room.my
                    && this.inWorkRoom
                    && this.isNapping
                    && !this.room.isTemple
                    && this.isOnParkingSpot
                    && (!this.isNoLongNapCreep || RoomIntel.getDangerousHostilesTTL(this.room.name))
			}
			return this._canLongNap;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'longNapTalk', {
		get() {
            if (this.task === Config.tasks.BUNKER) {
                return '😨';
            } else {
                return '🧛';
            }
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.task_run = function(taskList) {
        // Shorthand.
        let creep = this;

        // First step is to initialize our creep.
        if (creep.task_initialize()) return;

        // Bail out if we are currently napping on a parking spot.
        // But wake up if we have hostiles in the room!
        if (creep.canLongNap) {
            creep.talk(creep.longNapTalk);
            return;
        }
        // We are actively working, so clear out our naptime.
        creep.napTime = null;

        // Next go into our task priority list, and perform the one we are on, or the next good one.
        let i = taskList.indexOf(creep.task);
        if (i < 0) {
            // Shouldn't happen unless changing code, but if the task isn't in our (subset) taskList then reset to first task.
            i = 0;
            creep.switchToTask(taskList[i]);
        }
        let nonTask = false;
        let originalIndex = i;

        do {
            // Perform the current task.
            // Subtasks that return true indicate the task is still working.
            switch (creep.task) {
                case Config.tasks.BOOTSTRAP:
                    // No-op task.
                    break;

                case Config.tasks.BOOST:
                    if (this.task_boost()) return;
                    break;
                case Config.tasks.UNBOOST:
                case Config.tasks.UNBOOST_PROPHET:
                case Config.tasks.UNBOOST_WORKER:
                case Config.tasks.UNBOOST_TRANSPORTER:
                    if (this.task_unboost()) return;
                    break;

                case Config.tasks.RECYCLE:
                case Config.tasks.RECYCLE_WORKER:
                case Config.tasks.RECYCLE_UNBOOSTED:
                    if (this.task_recycle()) return;
                    break;
                case Config.tasks.RECYCLE_STOP:
                    if (this.task_recycle_stop()) return;
                    break;

                case Config.tasks.RENEW:
                case Config.tasks.RENEW2:
                    if (this.task_renew()) return;
                    break;

                case Config.tasks.RENEW_TOPOFF:
                    if (this.task_renew_topoff()) return;
                    break;

                case Config.tasks.CLEAR_WORKROOM:
                    if (this.task_clear_workRoom()) return;
                    break;
                case Config.tasks.CLEAR_FOCUS:
                    if (this.task_clear_focus()) return;
                    break;
                case Config.tasks.UPDATE_WORKROOM_OX:
                    if (this.task_update_workRoom_ox()) return;
                    break;
                case Config.tasks.UPDATE_WORKROOM_ROGUE:
                    if (this.task_update_workRoom_rogue()) return;
                    break;
                case Config.tasks.UPDATE_WORKROOM_BUILDER:
                    if (this.task_update_workRoom_builder()) return;
                    break;
                case Config.tasks.MOVE_TO_WORKROOM:
                case Config.tasks.MOVE_TO_WORKROOM_NOTEMPTY:
                    if (this.task_move_to_workRoom()) return;
                    break;
                case Config.tasks.MOVE_TO_WORKROOM_CACHED:
                    if (this.task_move_to_workRoom_cached()) return;
                    break;
                case Config.tasks.MOVE_TO_WORKROOM_ROGUE:
                    if (this.task_move_to_workRoom_rogue()) return;
                    break;
                case Config.tasks.MOVE_TO_ASSIGNEDROOM:
                case Config.tasks.MOVE_TO_ASSIGNEDROOM_NOTEMPTY:
                    if (this.task_move_to_assignedRoom()) return;
                    break;
                case Config.tasks.MOVE_TO_ASSIGNEDROOM_CACHED:
                    if (this.task_move_to_assignedRoom_cached()) return;
                    break;
                case Config.tasks.MOVE_TO_SPAWNROOM:
                    if (this.task_move_to_spawnRoom()) return;
                    break;
                case Config.tasks.BUNKER:
                    if (this.task_bunker()) return;
                    break;
                case Config.tasks.LABWORK:
                    if (this.task_labwork()) return;
                    break;
                case Config.tasks.PORTAL:
                    if (this.task_portal()) return;
                    break;
                case Config.tasks.CLAIM:
                    if (this.task_claim()) return;
                    break;

                case Config.tasks.STOMP_HOSTILE_CONSTRUCTION_SITES:
                    if (this.task_stomp_hostileConstructionSites()) return;
                    break;
                case Config.tasks.VISIT_CONTROLLER:
                    if (this.task_visit_controller()) return;
                    break;
                case Config.tasks.BLOCK_CONTROLLER:
                    if (this.task_blockController()) return;
                    break;
                case Config.tasks.IDLE:
                    if (this.task_idle()) return;
                    break;

                case Config.tasks.WAIT_POWERBANK_DESTROYED:
                    if (this.task_wait_powerbank_destroyed()) return;
                    break;

                case Config.tasks.DROPS:
                    if (this.task_drops()) return;
                    break;
                case Config.tasks.DECAYABLE:
                    if (this.task_decayable()) return;
                    break;
                case Config.tasks.GATHER_MOST_VALUABLE:
                    if (this.task_gather_most_valuable()) return;
                    break;
                case Config.tasks.GATHER_ENERGY:
                    if (this.task_gather_energy()) return;
                    break;
                case Config.tasks.FORAGE:
                    if (this.task_forage()) return;
                    break;
                case Config.tasks.PICKUP_RESOURCE:
                    if (this.task_pickup_resource()) return;
                    break;

                case Config.tasks.WITHDRAW_CONTAINER_SOURCE:
                case Config.tasks.WITHDRAW_CONTAINER_PEON:
                    if (this.task_withdraw_container_source()) return;
                    break;
                case Config.tasks.WITHDRAW_CONTAINER_OX:
                    if (this.task_withdraw_container_ox()) return;
                    break;

                // These 3 plunders will plunder anything in the room and bail out once nothing is left, even if not full or empty.
                case Config.tasks.PLUNDER:
                case Config.tasks.PLUNDER2:
                case Config.tasks.PLUNDER_ROOK:
                    if (this.task_plunder(0)) return;
                    break;

                case Config.tasks.PLUNDER_NOTEMPTY:
                    if (this.task_plunder(1)) return;
                    break;
                case Config.tasks.PLUNDER_NOTFULL:
                    if (this.task_plunder(2)) return;
                    break;

                case Config.tasks.WITHDRAW_PROSPECTOR:
                    if (this.task_withdraw_worker(Config.roles.PROSPECTOR, false)) return;
                    break;
                case Config.tasks.WITHDRAW_PROSPECTOR_HALT:
                    if (this.task_withdraw_worker(Config.roles.PROSPECTOR, true)) return;
                    break;
                case Config.tasks.WITHDRAW_DREDGER:
                    if (this.task_withdraw_worker(Config.roles.DREDGER, false)) return;
                    break;
                case Config.tasks.WITHDRAW_DREDGER_HALT:
                    if (this.task_withdraw_worker(Config.roles.DREDGER, true)) return;
                    break;

                case Config.tasks.WITHDRAW_ALWAYS:
                case Config.tasks.WITHDRAW_PAGE:
                    if (this.task_withdraw_always()) return;
                    break;
                case Config.tasks.WITHDRAW_ROOK:
                    if (this.task_withdraw_rook()) return;
                    break;
                case Config.tasks.WITHDRAW_PEON:
                    if (this.task_withdraw_peon()) return;
                    break;
                case Config.tasks.WITHDRAW_LLAMA:
                    if (this.task_withdraw_llama()) return;
                    break;
                case Config.tasks.WITHDRAW_GHODIUM:
                    if (this.task_withdraw_ghodium()) return;
                    break;

                case Config.tasks.DEPOSIT:
                    if (this.task_deposit()) return;
                    break;

                case Config.tasks.HARVEST_PEON:
                    if (this.task_harvest_peon()) return;
                    break;
                case Config.tasks.HARVEST_PEASANT:
                    if (this.task_harvest_peasant()) return;
                    break;
                case Config.tasks.HARVEST_FARMER:
                    if (this.task_harvest_farmer()) return;
                    break;

                case Config.tasks.EXTRACT_CHECK:
                    if (this.task_extract_check()) return;
                    break;
                case Config.tasks.EXTRACT_REMOTEROOM:
                    if (this.task_extract_remoteroom()) return;
                    break;
                case Config.tasks.EXTRACT_MYROOM:
                    if (this.task_extract_myroom()) return;
                    break;

                case Config.tasks.DELIVER:
                    if (this.task_deliver()) return;
                    break;
                case Config.tasks.TRANSFER_TOWER:
                    if (this.task_transfer_tower()) return;
                    break;
                case Config.tasks.TRANSFER_SPAWN:
                case Config.tasks.TRANSFER_SPAWN_ROOK:
                    if (this.task_transfer_spawn()) return;
                    break;
                case Config.tasks.TRANSFER_LAB:
                    if (this.task_transfer_lab()) return;
                    break;
                case Config.tasks.TRANSFER_POWERSPAWN:
                    if (this.task_transfer_powerspawn()) return;
                    break;
                case Config.tasks.TRANSFER_COLONY_CONTAINER:
                    if (this.task_transfer_colonyContainer()) return;
                    break;

                case Config.tasks.BUILD:
                case Config.tasks.BUILD2:
                    if (this.task_build()) return;
                    break;
                case Config.tasks.REPAIR:
                    if (this.task_repair()) return;
                    break;
                case Config.tasks.CREATE_SOURCE_TRAIL:
                    if (this.task_createSourceTrail()) return;
                    break;

                // Both peon and mason task call the same work method, just have different criteria.
                case Config.tasks.REPAIR_WALL_PEON:
                case Config.tasks.REPAIR_WALL_MAX:
                case Config.tasks.REPAIR_WALL_ALWAYS:
                    if (this.task_repair_wall()) return;
                    break;

                case Config.tasks.TRANSFER_CONTROLLER_CONTAINER:
                    if (this.task_transfer_controllerContainer()) return;
                    break;
                case Config.tasks.TRANSFER_CONTROLLER_CONTAINER_PAGE:
                    if (this.task_transfer_controllerContainer_page()) return;
                    break;
                case Config.tasks.TRANSFER_DROPOFF:
                case Config.tasks.TRANSFER_DROPOFF_ROOK:
                case Config.tasks.TRANSFER_DROPOFF_PEON:
                    if (this.task_transfer_dropoff()) return;
                    break;
                case Config.tasks.TRANSFER_FOCUS_TRANSPORTER:
                    if (this.task_transfer_focus_transporter()) return;
                    break;
                case Config.tasks.TRANSFER_DROP:
                    if (this.task_transfer_drop()) return;
                    break;

                case Config.tasks.UPGRADE:
                case Config.tasks.UPGRADE_ALWAYS:
                case Config.tasks.UPGRADE_OX:
                    if (this.task_upgrade()) return;
                    break;
                case Config.tasks.UPGRADE_CRIER:
                    if (this.task_upgrade_crier()) return;
                    break;
                case Config.tasks.UPGRADE_PROPHET:
                    if (this.task_upgrade_prophet()) return;
                    break;
                case Config.tasks.UPGRADE_TEMPLE:
                    if (this.task_upgrade_temple()) return;
                    break;

                case Config.tasks.GENERATE_SAFE_MODE:
                    if (this.task_generate_safeMode()) return;
                    break;

                case Config.tasks.DISMANTLE:
                    if (this.task_dismantle()) return;
                    break;
                case Config.tasks.ATTACK_POWERBANK:
                    if (this.task_attack_powerbank()) return;
                    break;
                case Config.tasks.HEAL_POWERBANK:
                    if (this.task_heal_powerbank()) return;
                    break;
                case Config.tasks.ATTACK_SOURCEKEEPER:
                    if (this.task_attack_sourceKeeper()) return;
                    break;
                case Config.tasks.ATTACK_INVADERSTRUCTURES:
                    if (this.task_attack_invaderStructures()) return;
                    break;
                case Config.tasks.ATTACK_STRONGHOLD:
                    if (this.task_attack_stronghold()) return;
                    break;

                case Config.tasks.SUICIDE:
                    if (this.task_suicide()) return;
                    break;
                case Config.tasks.SUICIDE_MINER:
                    if (this.task_suicide_miner()) return;
                    break;
                case Config.tasks.SUICIDE_UPGRADER:
                    if (this.task_suicide_upgrader()) return;
                    break;
                case Config.tasks.SUICIDE_HORSE:
                    if (this.task_suicide_horse()) return;
                    break;
                case Config.tasks.SUICIDE_BURRO:
                    if (this.task_suicide_burro()) return;
                    break;
                case Config.tasks.SUICIDE_DONKEY:
                    if (this.task_suicide_donkey()) return;
                    break;
                case Config.tasks.SUICIDE_RESERVEDROOM:
                    if (this.task_suicide_reservedRoom()) return;
                    break;

                case Config.tasks.COMBAT:
                    if (this.task_combat()) return;
                    break;

                // Seasonal.
                case Config.tasks.WITHDRAW_THORIUM:
                    if (this.task_withdraw_thorium()) return;
                    break;
                case Config.tasks.CLAIM_REACTOR:
                    if (this.task_claim_reactor()) return;
                    break;
                case Config.tasks.TRANSFER_REACTOR:
                    if (this.task_transfer_reactor()) return;
                    break;

                default:
                    nonTask = true;
                    break;

            }

            if (nonTask) break;

            // Keep track of our potential task's enter criteria result.
            let taskNotFound = true;

            do {

                // We made it out of our task, so attempt to pick a new one.
                i = i + 1;
                if (i < 0 || i >= taskList.length) i = 0;
                creep.switchToTask(taskList[i]);

                // Only allow one pass through the loop from original task.
                if (i === originalIndex) {
                    // Don't get stuck on the same task (aka Renew), reset to the first task.
                    creep.switchToTask(taskList[0]);
                    creep.nap({talk:creep.longNapTalk});
                    return;
                }

                // Pick new task.
                switch (creep.task) {
                    case Config.tasks.BOOTSTRAP:
                        taskNotFound = true;
                        break;

                    case Config.tasks.BOOST:
                        taskNotFound = this.task_boost_criteria();
                        break;
                    case Config.tasks.UNBOOST:
                        taskNotFound = this.task_unboost_criteria();
                        break;
                    case Config.tasks.UNBOOST_PROPHET:
                        taskNotFound = this.task_unboost_prophet_criteria();
                        break;
                    case Config.tasks.UNBOOST_WORKER:
                        taskNotFound = this.task_unboost_worker_criteria();
                        break;
                    case Config.tasks.UNBOOST_TRANSPORTER:
                        taskNotFound = this.task_unboost_transporter_criteria();
                        break;

                    case Config.tasks.RECYCLE:
                        taskNotFound = this.task_recycle_criteria();
                        break;
                    case Config.tasks.RECYCLE_WORKER:
                        taskNotFound = this.task_recycle_worker_criteria();
                        break;
                    case Config.tasks.RECYCLE_STOP:
                        taskNotFound = this.task_recycle_stop_criteria();
                        break;
                    case Config.tasks.RECYCLE_UNBOOSTED:
                        taskNotFound = this.task_recycle_unboosted_criteria();
                        break;

                    case Config.tasks.RENEW:
                    case Config.tasks.RENEW2:
                        taskNotFound = this.task_renew_criteria();
                        break;

                    case Config.tasks.RENEW_TOPOFF:
                        taskNotFound = this.task_renew_topoff_criteria();
                        break;

                    case Config.tasks.CLEAR_WORKROOM:
                        taskNotFound = this.task_clear_workRoom_criteria();
                        break;
                    case Config.tasks.CLEAR_FOCUS:
                        taskNotFound = this.task_clear_focus_criteria();
                        break;
                    case Config.tasks.UPDATE_WORKROOM_OX:
                        taskNotFound = this.task_update_workRoom_ox_criteria();
                        break;
                    case Config.tasks.UPDATE_WORKROOM_ROGUE:
                        taskNotFound = this.task_update_workRoom_rogue_criteria();
                        break;
                    case Config.tasks.UPDATE_WORKROOM_BUILDER:
                        taskNotFound = this.task_update_workRoom_builder_criteria();
                        break;
                    case Config.tasks.MOVE_TO_WORKROOM:
                    case Config.tasks.MOVE_TO_WORKROOM_CACHED:
                        taskNotFound = this.task_move_to_workRoom_criteria();
                        break;
                    case Config.tasks.MOVE_TO_WORKROOM_NOTEMPTY:
                        taskNotFound = this.task_move_to_workRoom_notempty_criteria();
                        break;
                    case Config.tasks.MOVE_TO_WORKROOM_ROGUE:
                        taskNotFound = this.task_move_to_workRoom_rogue_criteria();
                        break;
                    case Config.tasks.MOVE_TO_ASSIGNEDROOM:
                        taskNotFound = this.task_move_to_assignedRoom_criteria();
                        break;
                    case Config.tasks.MOVE_TO_ASSIGNEDROOM_NOTEMPTY:
                        taskNotFound = this.task_move_to_assignedRoom_notempty_criteria();
                        break;
                    case Config.tasks.MOVE_TO_ASSIGNEDROOM_CACHED:
                        taskNotFound = this.task_move_to_assignedRoom_cached_criteria();
                        break;
                    case Config.tasks.MOVE_TO_SPAWNROOM:
                        taskNotFound = this.task_move_to_spawnRoom_criteria();
                        break;
                    case Config.tasks.BUNKER:
                        taskNotFound = this.task_bunker_criteria();
                        break;
                    case Config.tasks.LABWORK:
                        taskNotFound = this.task_labwork_criteria();
                        break;
                    case Config.tasks.PORTAL:
                        taskNotFound = this.task_portal_criteria();
                        break;
                    case Config.tasks.CLAIM:
                        taskNotFound = this.task_claim_criteria();
                        break;

                    case Config.tasks.STOMP_HOSTILE_CONSTRUCTION_SITES:
                        taskNotFound = this.task_stomp_hostileConstructionSites_criteria();
                        break;
                    case Config.tasks.VISIT_CONTROLLER:
                        taskNotFound = this.task_visit_controller_criteria();
                        break;
                    case Config.tasks.BLOCK_CONTROLLER:
                        taskNotFound = this.task_blockController_criteria();
                        break;
                    case Config.tasks.IDLE:
                        taskNotFound = this.task_idle_criteria();
                        break;

                    case Config.tasks.WAIT_POWERBANK_DESTROYED:
                        taskNotFound = this.task_wait_powerbank_destroyed_criteria();
                        break;

                    case Config.tasks.DROPS:
                        taskNotFound = this.task_drops_criteria();
                        break;
                    case Config.tasks.DECAYABLE:
                        taskNotFound = this.task_decayable_criteria();
                        break;
                    case Config.tasks.GATHER_MOST_VALUABLE:
                        taskNotFound = this.task_gather_most_valuable_criteria();
                        break;
                    case Config.tasks.GATHER_ENERGY:
                        taskNotFound = this.task_gather_energy_criteria();
                        break;
                    case Config.tasks.FORAGE:
                        taskNotFound = this.task_forage_criteria();
                        break;
                    case Config.tasks.PICKUP_RESOURCE:
                        taskNotFound = this.task_pickup_resource_criteria();
                        break;

                    case Config.tasks.WITHDRAW_CONTAINER_PEON:
                        taskNotFound = this.task_withdraw_container_peon_criteria();
                        break;
                    case Config.tasks.WITHDRAW_CONTAINER_SOURCE:
                        taskNotFound = this.task_withdraw_container_source_criteria();
                        break;
                    case Config.tasks.WITHDRAW_CONTAINER_OX:
                        taskNotFound = this.task_withdraw_container_ox_criteria();
                        break;

                    case Config.tasks.PLUNDER:
                    case Config.tasks.PLUNDER2:
                        taskNotFound = this.task_plunder_criteria();
                        break;
                    case Config.tasks.PLUNDER_ROOK:
                        taskNotFound = this.task_plunder_rook_criteria();
                        break;
                    case Config.tasks.PLUNDER_NOTEMPTY:
                        taskNotFound = this.task_plunder_criteria();
                        break;
                    case Config.tasks.PLUNDER_NOTFULL:
                        taskNotFound = this.task_plunder_criteria();
                        break;

                    case Config.tasks.WITHDRAW_PROSPECTOR:
                    case Config.tasks.WITHDRAW_PROSPECTOR_HALT:
                    case Config.tasks.WITHDRAW_DREDGER:
                    case Config.tasks.WITHDRAW_DREDGER_HALT:
                        taskNotFound = this.task_withdraw_worker_criteria();
                        break;
                    case Config.tasks.WITHDRAW_ALWAYS:
                        taskNotFound = this.task_withdraw_always_criteria();
                        break;
                    case Config.tasks.WITHDRAW_PAGE:
                        taskNotFound = this.task_withdraw_page_criteria();
                        break;
                    case Config.tasks.WITHDRAW_ROOK:
                        taskNotFound = this.task_withdraw_rook_criteria();
                        break;
                    case Config.tasks.WITHDRAW_PEON:
                        taskNotFound = this.task_withdraw_peon_criteria();
                        break;
                    case Config.tasks.WITHDRAW_LLAMA:
                        taskNotFound = this.task_withdraw_llama_criteria();
                        break;
                    case Config.tasks.WITHDRAW_GHODIUM:
                        taskNotFound = this.task_withdraw_ghodium_criteria();
                        break;

                    case Config.tasks.DEPOSIT:
                        taskNotFound = this.task_deposit_criteria();
                        break;

                    case Config.tasks.HARVEST_PEON:
                        taskNotFound = this.task_harvest_peon_criteria();
                        break;
                    case Config.tasks.HARVEST_PEASANT:
                        taskNotFound = this.task_harvest_peasant_criteria();
                        break;
                    case Config.tasks.HARVEST_FARMER:
                        taskNotFound = this.task_harvest_farmer_criteria();
                        break;

                    case Config.tasks.EXTRACT_CHECK:
                        taskNotFound = this.task_extract_check_criteria();
                        break;
                    case Config.tasks.EXTRACT_REMOTEROOM:
                        taskNotFound = this.task_extract_remoteroom_criteria();
                        break;
                    case Config.tasks.EXTRACT_MYROOM:
                        taskNotFound = this.task_extract_myroom_criteria();
                        break;

                    case Config.tasks.DELIVER:
                        taskNotFound = this.task_deliver_criteria();
                        break;
                    case Config.tasks.TRANSFER_TOWER:
                        taskNotFound = this.task_transfer_tower_criteria();
                        break;
                    case Config.tasks.TRANSFER_SPAWN:
                        taskNotFound = this.task_transfer_spawn_criteria();
                        break;
                    case Config.tasks.TRANSFER_SPAWN_ROOK:
                        taskNotFound = this.task_transfer_spawn_rook_criteria();
                        break;
                    case Config.tasks.TRANSFER_LAB:
                        taskNotFound = this.task_transfer_lab_criteria();
                        break;
                    case Config.tasks.TRANSFER_POWERSPAWN:
                        taskNotFound = this.task_transfer_powerspawn_criteria();
                        break;
                    case Config.tasks.TRANSFER_COLONY_CONTAINER:
                        taskNotFound = this.task_transfer_colonyContainer_criteria();
                        break;

                    case Config.tasks.BUILD:
                    case Config.tasks.BUILD2:
                        taskNotFound = this.task_build_criteria();
                        break;
                    case Config.tasks.REPAIR:
                        taskNotFound = this.task_repair_criteria();
                        break;
                    case Config.tasks.CREATE_SOURCE_TRAIL:
                        taskNotFound = this.task_createSourceTrail_criteria();
                        break;

                    // Both peon and mason task call the same work method, just have different criteria.
                    case Config.tasks.REPAIR_WALL_PEON:
                        taskNotFound = this.task_repair_wallPeon_criteria();
                        break;
                    case Config.tasks.REPAIR_WALL_MAX:
                        taskNotFound = this.task_repair_wallMax_criteria();
                        break;
                    case Config.tasks.REPAIR_WALL_ALWAYS:
                        taskNotFound = this.task_repair_wallAlways_criteria();
                        break;

                    case Config.tasks.TRANSFER_CONTROLLER_CONTAINER:
                        taskNotFound = this.task_transfer_controllerContainer_criteria();
                        break;
                    case Config.tasks.TRANSFER_CONTROLLER_CONTAINER_PAGE:
                        taskNotFound = this.task_transfer_controllerContainer_page_criteria();
                        break;
                    case Config.tasks.TRANSFER_DROPOFF:
                        taskNotFound = this.task_transfer_dropoff_criteria();
                        break;
                    case Config.tasks.TRANSFER_DROPOFF_ROOK:
                        taskNotFound = this.task_transfer_dropoff_rook_criteria();
                        break;
                    case Config.tasks.TRANSFER_DROPOFF_PEON:
                        taskNotFound = this.task_transfer_dropoff_peon_criteria();
                        break;
                    case Config.tasks.TRANSFER_FOCUS_TRANSPORTER:
                        taskNotFound = this.task_transfer_focus_transporter_criteria();
                        break;
                    case Config.tasks.TRANSFER_DROP:
                        taskNotFound = this.task_transfer_drop_criteria();
                        break;

                    case Config.tasks.UPGRADE:
                        taskNotFound = this.task_upgrade_criteria();
                        break;
                    case Config.tasks.UPGRADE_ALWAYS:
                        taskNotFound = this.task_upgrade_always_criteria();
                        break;
                    case Config.tasks.UPGRADE_OX:
                        taskNotFound = this.task_upgrade_ox_criteria();
                        break;
                    case Config.tasks.UPGRADE_CRIER:
                        taskNotFound = this.task_upgrade_crier_criteria();
                        break;
                    case Config.tasks.UPGRADE_PROPHET:
                        taskNotFound = this.task_upgrade_prophet_criteria();
                        break;
                    case Config.tasks.UPGRADE_TEMPLE:
                        taskNotFound = this.task_upgrade_temple_criteria();
                        break;

                    case Config.tasks.GENERATE_SAFE_MODE:
                        taskNotFound = this.task_generate_safeMode_criteria();
                        break;

                    case Config.tasks.DISMANTLE:
                        taskNotFound = this.task_dismantle_criteria();
                        break;
                    case Config.tasks.ATTACK_POWERBANK:
                        taskNotFound = this.task_attack_powerbank_criteria();
                        break;
                    case Config.tasks.HEAL_POWERBANK:
                        taskNotFound = this.task_heal_powerbank_criteria();
                        break;
                    case Config.tasks.ATTACK_SOURCEKEEPER:
                        taskNotFound = this.task_attack_sourceKeeper_criteria();
                        break;
                    case Config.tasks.ATTACK_INVADERSTRUCTURES:
                        taskNotFound = this.task_attack_invaderStructures_criteria();
                        break;
                    case Config.tasks.ATTACK_STRONGHOLD:
                        taskNotFound = this.task_attack_stronghold_criteria();
                        break;

                    case Config.tasks.SUICIDE:
                        taskNotFound = this.task_suicide_criteria();
                        break;
                    case Config.tasks.SUICIDE_MINER:
                        taskNotFound = this.task_suicide_miner_criteria();
                        break;
                    case Config.tasks.SUICIDE_UPGRADER:
                        taskNotFound = this.task_suicide_upgrader_criteria();
                        break;
                    case Config.tasks.SUICIDE_HORSE:
                        taskNotFound = this.task_suicide_horse_criteria();
                        break;
                    case Config.tasks.SUICIDE_BURRO:
                        taskNotFound = this.task_suicide_burro_criteria();
                        break;
                    case Config.tasks.SUICIDE_DONKEY:
                        taskNotFound = this.task_suicide_donkey_criteria();
                        break;
                    case Config.tasks.SUICIDE_RESERVEDROOM:
                        taskNotFound = this.task_suicide_reservedRoom_criteria();
                        break;

                    case Config.tasks.COMBAT:
                        taskNotFound = this.task_combat_criteria();
                        break;

                    // Seasonal
                    case Config.tasks.WITHDRAW_THORIUM:
                        taskNotFound = this.task_withdraw_thorium_criteria();
                        break;
                    case Config.tasks.CLAIM_REACTOR:
                        taskNotFound = this.task_claim_reactor_criteria();
                        break;
                    case Config.tasks.TRANSFER_REACTOR:
                        taskNotFound = this.task_transfer_reactor_criteria();
                        break;

                    default:
                        taskNotFound = false;
                        break;
                }

            } while (taskNotFound)

        } while (true)

    }

}
