"use strict";

module.exports = function() {

    Room.prototype.manageDefense = function() {
        // Shorthand.
        let room = this;

        // Can we build ramparts for this room?
        if (CONTROLLER_STRUCTURES[STRUCTURE_RAMPART][room.level]) {

            // Define our shelters.
            let shelterSites = [];
            if (room.colonySpawn1) shelterSites.push(room.colonySpawn1);
            if (room.storage) shelterSites.push(room.storage);
            if (room.terminal) shelterSites.push(room.terminal);
            if (room.colonyNuker) shelterSites.push(room.colonyNuker);
            if (room.colonyPowerSpawn) shelterSites.push(room.colonyPowerSpawn);
            if (room.colonyFactory) shelterSites.push(room.colonyFactory);

            // Detect incoming nukes.
            let nukes = RoomIntel.getNukePosList(room.name);
            shelterSites.forEach(site => {
                // Put ramparts on top of every valuable structure.
                if (nukes.find(nuke => site.pos.inRange2(nuke)) && !site.pos.hasRampartHits) {
                    let result = room.createConstructionSite(structure.pos, STRUCTURE_RAMPART);
                    room.logRoom('Creating nuke rampart: ' + result);
                }
            });
        }

        // Done our building.
        return false;
    }

	Object.defineProperty(Room.prototype, 'isNukeInbound', {
		get() {
			if (typeof this._isNukeInbound === "undefined") {
                this._isNukeInbound = RoomIntel.getNukeCount(this.name);
            }
			return this._isNukeInbound;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'haltSpawningNukeImminent', {
		get() {
			if (typeof this._haltSpawningNukeImminent === "undefined") {
                this._haltSpawningNukeImminent = RoomIntel.getNukeTimeToLand(this.name) ? (RoomIntel.getNukeTimeToLand(this.name) < Game.time + Config.params.NUKE_HALT_SPAWNING_TICKS) : false;
            }
			return this._haltSpawningNukeImminent;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'defendRoom', {
		get() {
			if (typeof this._defendRoom === "undefined") {
                if (
                    (
                        // Our room is always a defensive potition, or screeps are in this room with valuable loot!
                        this.room.myManagement
                        || RoomIntel.getScreepsWithCarryTTL(this.room.name)
                    )
                    && (
                        // Active hostiles in this room, fight them!
                        //this.room.nonSourceKeeperHostiles.length
                        RoomIntel.getHostilesTTL(this.room.name)

                        // There are no dedicated guardians in this room, and no towers either, yikes.
                        || (
                            RoomIntel.getPlayerHostileLastEdgePos(this.room.name)
                            && !CreepManager.getGuardiansByWorkRoom(this.room.name).length
                            && !this.room.colonyTowers.length
                        )
                    )
                ) {
                    // While we have a recent hostile in this room, stay here.
                    this._defendRoom = this.room.name;

                } else {
                    this._defendRoom = Game.rooms[this.assignedRoom] ? Game.rooms[this.assignedRoom].colonyDefendRoomsPrioritized.find(x => x !== undefined) : null;

                    // If no active defense is needed, find the closest room under our management and move there.
                    if (!this._defendRoom) {
                        // Return to spawn room.
                        this._defendRoom = this.assignedRoom;
                    }
                }
            }
			return this._defendRoom;
		},
		configurable: true, enumerable: true,
    });

	// Creep.prototype.setLancerWorkRoom = function() {
    //     // Once strongholds and all invader owned targets are destroyed, then move back to assigned room for unboosting.
    //     if (this.assignedRoom !== this.workRoom) {
    //         this.workRoom = (!RoomIntel.getStrongholdInvaderStructureHitsByRoomName(this.workRoom) && this.room.isSKRoom && !this.room.nonSourceContainers.length) ? this.assignedRoom : this.workRoom;
    //     }
    // };

	Object.defineProperty(Room.prototype, 'myClosestRemoteSafeRoom', {
		get() {
			if (typeof this._myClosestRemoteSafeRoom === "undefined") {
				let closestRoom = _.sortBy(GameManager.empireRooms.filter(f =>
					(f.name != this.name)
                    && !RoomIntel.getLethalHostilesTTL(f.name)
				), s => Cartographer.findRouteDistance(this.name, s.name))[0];
				this._myClosestRemoteSafeRoom = closestRoom ? closestRoom : this;
			}
			return this._myClosestRemoteSafeRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'shouldEvacuate', {
		get() {
			if (typeof this._shouldEvacuate === "undefined") {
                this._shouldEvacuate = !!(
                    // Only applicable to my rooms.
                    this.my

                    // Any of the conditions below...
                    && (
                        // Nuke incoming, everyone get out!
                        GameManager.isNukeImminent(this.name)

                        // Early room without any towers and invaders are coming, they will despawn if all creeps leave the room.
                        // Checking the controller structure hash instead of let workRoom = Game.rooms[creep.workRoom]; workRoom.myTowers.length only for performance sake.
                        || (RoomIntel.getInvadersTTL(this.name) && !this.safeMode && !CONTROLLER_STRUCTURES[STRUCTURE_TOWER][this.controller.level])

                        // We are not a combat troop and players have now breached our lower-level room walls....bail out.
                        || (RoomIntel.getLethalPlayerHostilesTTL(this.name) && !this.atMaxLevel && !this.safeMode && this.colonyBreached)
                    )
                );
			}
			return this._shouldEvacuate;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'shouldEvacuate', {
		get() {
			if (typeof this._shouldEvacuate === "undefined") {
                this._shouldEvacuate = this.room.shouldEvacuate;
                if (!this._shouldEvacuate && !this.inWorkRoom) {
                    let workRoom = Game.rooms[this.workRoom];
                    this._shouldEvacuate = !!(workRoom && workRoom.shouldEvacuate);
                }
			}
			return this._shouldEvacuate;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.evacuateRoom = function() {
        // Exit criteria.
        if (!this.shouldEvacuate) return false;

        // Need to drop everything and make a run for it!
        // Carrying things in the escape is slower, and messes up logic for returning to workRoom.
        if (this.store.getUsedCapacity()) {
            this.smartDrop();
        }

        // If we are bailing out, just heal ourselves and run!
        if (this.healParts && RoomIntel.getLethalRoom(this.room.name)) {
            this.heal(this);
        }

        // Our escape path is to the closest remote room.
        // Really we are just headed there and will stop once we leave the work room.
        if (this.inWorkRoom || RoomIntel.getLethalRoom(this.room.name)) {
            this.talk('🤯')
            this.moveToRoom(this.room.myClosestRemoteSafeRoom.name);
            return true;
        }

        // Once we are out of hte workroom that is being nuked, nap for a few ticks while the bomb goes off, then we will head back inside.
        this.nap({talk:'🤯'});
        return true;
    }

	Room.prototype.safeModeCheck = function() {
		// If we have hostiles in my room, and I have spawns, then better lock it up!
		if (
            // This room does have actual spawns now and is worth protecting.
            GameManager.empireSpawnRoomNamesHashFromGameSpawns[this.name]
            // Dangerous players inside our walls, oh shit?!?
			&& this.dangerousPlayerHostilesInMyRoom.length
		) {
            // Activate safe mode if we can.
            if (!this.safeMode) {
                if (this.controller.activateSafeMode() === OK) {
                    console.log('⚠️ Safe Mode activated for', this.printShard, ' !!!');
                } else {
                    console.log('⛔ Safe Mode is not available for', this.printShard, ' !!!  Safe Modes available:', this.controller.safeModeAvailable, 'Cooldown:', this.controller.safeModeCooldown || 0, 'Empire Safe Mode:', (GameManager.empireSafeMode || 0));
                }
            }
		}

        // Record any hostiles/nukes in our base. Low level rooms are given a pass, since our walls are likely not up yet.
        if (this.controller.level >= 5) {
            this.dangerousPlayerHostilesInMyRoom.forEach(hostile => {
                if (!PlayerManager.isAlly(hostile.owner.username)) PlayerManager.addEnemy(hostile.owner.username);
            })
        }

        // Flag our room if this room has been breached by a player.
        if (this.colonyBreachedByPlayer) {
            this.colonyBreachedByPlayerTime = Game.time;
        }
        else {
            if (this.colonyBreachedByPlayerTime && ((this.colonyBreachedByPlayerTime + SAFE_MODE_COOLDOWN) < Game.time)) this.colonyBreachedByPlayerTime = null;
        }

        // Record any hostiles/nukes in our base.
        RoomIntel.getNukeLaunchRoomNameList(this.name).forEach(launchRoomName => {
            if (RoomIntel.getOwner(launchRoomName)) {
                if (!PlayerManager.isAlly(RoomIntel.getOwner(launchRoomName))) PlayerManager.addEnemy(RoomIntel.getOwner(launchRoomName));
            }
        })
	};

	Object.defineProperty(Room.prototype, 'colonyBreachedByPlayerTime', {
		get() {
            return this.memory[C.MEMORY_KEY_ROOM_COLONY_BREACHED_BY_PLAYER] ? unpackTime(this.memory[C.MEMORY_KEY_ROOM_COLONY_BREACHED_BY_PLAYER]) : null;
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_ROOM_COLONY_BREACHED_BY_PLAYER] = packTime(value);
            } else {
                delete this.memory[C.MEMORY_KEY_ROOM_COLONY_BREACHED_BY_PLAYER];
            }
        },
		configurable: true, enumerable: true,
    });

	Room.prototype.getNukeDamage = function(target) {
        let pos = utils.normalizePos(target);
        let actualNukeDamage = this.nukes.reduce((acc, nuke) => {
			let nukeDamageIndex = Object.keys(NUKE_DAMAGE).find(f => pos.getRangeTo(nuke) <= f);
			let nukeDamage = nukeDamageIndex === undefined ? 0 : NUKE_DAMAGE[nukeDamageIndex];
			return acc + nukeDamage;
		}, 0);
        return actualNukeDamage;
	};

	Room.prototype.getPotentialNukeDamageByPosHash = function(target, nukePositionsHash) {
        return this.getPotentialNukeDamage(target, Object.values(nukePositionsHash));
	};

	Room.prototype.getPotentialNukeDamage = function(target, nukePositions) {
        let pos = utils.normalizePos(target);
        let actualNukeDamage = this.getNukeDamage(target);
		let potentialNukeDamage = nukePositions.reduce((acc, nuke) => {
			let nukeDamageIndex = Object.keys(NUKE_DAMAGE).find(f => pos.getRangeTo(nuke) <= f);
			let nukeDamage = nukeDamageIndex === undefined ? 0 : NUKE_DAMAGE[nukeDamageIndex];
			return acc + nukeDamage;
		}, 0);
        return actualNukeDamage + potentialNukeDamage;
	};

}