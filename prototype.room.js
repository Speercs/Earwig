"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

    Room.prototype.logRoom = function(message, icon = '🏡') {
		message = icon + ' ' + this.printShard + ' ' + message;
		utils.verboseLog(message);
    };

	Object.defineProperty(Room.prototype, 'packedRoomName', {
		get() {
            if (typeof this._packedRoomName === "undefined") {
				this._packedRoomName = packRoomName(this.name);
			}
			return this._packedRoomName;
		},
		configurable: true, enumerable: true,
    });

    Room.prototype.getNearToWalkable = function(pos, includeCreeps) {
		let walkable = [];
		for (let x=-1; x<=1; x++) {
			for (let y=-1; y<=1; y++) {
				let posX = pos.x + x;
				let posY = pos.y + y;
				if (posX < 0 || posX > 49 || posY < 0 || posY > 49) continue;

				let success = true;
				let lookAtPos = new RoomPosition(posX, posY, pos.roomName);
				const look = this.lookAt(lookAtPos);

				look.forEach(function(lookObject) {
					switch (lookObject.type) {
						case LOOK_STRUCTURES:
							if (
								(lookObject[LOOK_STRUCTURES].structureType === STRUCTURE_RAMPART && !lookObject[LOOK_STRUCTURES].my)
								|| C.OBSTACLE_OBJECT_TYPES_HASH[lookObject[LOOK_STRUCTURES].structureType]
							) success = false;
							break;
						case LOOK_TERRAIN:
							if (lookObject[LOOK_TERRAIN] === 'wall') success = false;
							break;
						case LOOK_CREEPS:
							if (includeCreeps) success = false;
							break;
					}
				});

				if (success) walkable.push(lookAtPos);
			}
		}
		return walkable;
	};

    Room.prototype.canBuildAtPos = function(x, y, structureType) {
		let lookAtPos = new RoomPosition(x, y, this.name);
		const look = this.lookAt(lookAtPos);
		let result = true;

		look.forEach(function(lookObject) {
			// Excludes creeps.
			switch (lookObject.type) {

				// Process structure logic in order....
				case LOOK_STRUCTURES:
					// No type (including roads) are allowed to be built on top of themselves.
					if (lookObject[LOOK_STRUCTURES].structureType === structureType) {
						result = false;
					}
					// Roads are not allowed to be built under constructed walls.
					else if ((STRUCTURE_ROAD === structureType) && (lookObject[LOOK_STRUCTURES].structureType === STRUCTURE_WALL)) {
						result = false;
					}
					// Roads and ramparts are allowed to be built over any other structure.
					else if ([STRUCTURE_ROAD, STRUCTURE_RAMPART].includes(structureType)) {
						// result is true;
					}
					// Other structures are allowed to be built on top of roads/ramparts, but that's it.
					else if (![STRUCTURE_ROAD, STRUCTURE_RAMPART].includes(lookObject[LOOK_STRUCTURES].structureType)) {
						result = false;
					}
					break;

				case LOOK_CONSTRUCTION_SITES:
					result = false;
					break;

				case LOOK_TERRAIN:
					if (lookObject[LOOK_TERRAIN] === 'wall' && ![STRUCTURE_ROAD, STRUCTURE_EXTRACTOR].includes(structureType)) result = false;
					break;

			}
		});
		return result;
	};

	Object.defineProperty(Room.prototype, 'importantHostileStructureHits', {
		get() {
            if (typeof this._importantHostileStructureHits === "undefined") {
				this._importantHostileStructureHits = _.sum(this.importantHostileStructures, s=>s.hits + s.pos.hasRampartHits);
			}
			return this._importantHostileStructureHits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'importantDismantlableHostileStructureHits', {
		get() {
            if (typeof this._importantDismantlableHostileStructureHits === "undefined") {
				this._importantDismantlableHostileStructureHits = _.sum(this.importantDismantlableHostileStructures, s=>s.hits + s.pos.hasRampartHits);
			}
			return this._importantDismantlableHostileStructureHits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'destroyFlagHits', {
		get() {
            if (typeof this._destroyFlagHits === "undefined") {
				let destroyFlagsPositions = this.destroyFlags.map(m => m.flag.pos);
				//this._destroyFlagHits = _.sum(this.structures.filter(f => destroyFlagsPositions.find(i => i.isEqualTo(f))), s=>s.hits);
				this._destroyFlagHits = _.sum(destroyFlagsPositions, s=>s.hasBarrier);
			}
			return this._destroyFlagHits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'invaderStructureHits', {
		get() {
            if (typeof this._invaderStructureHits === "undefined") {
				this._invaderStructureHits = _.sum(this.invaderStructures, s=>s.hits);
			}
			return this._invaderStructureHits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'massAttackInvaderStructureHits', {
		get() {
            if (typeof this._massAttackInvaderStructureHits === "undefined") {
				this._massAttackInvaderStructureHits = _.sum(this.massAttackInvaderStructures, s=>s.hits);
			}
			return this._massAttackInvaderStructureHits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'dismantlableInvaderStructureHits', {
		get() {
            if (typeof this._dismantlableInvaderStructureHits === "undefined") {
				this._dismantlableInvaderStructureHits = _.sum(this.dismantlableInvaderStructures, s=>s.hits);
			}
			return this._dismantlableInvaderStructureHits;
		},
		configurable: true, enumerable: true,
    });

    Room.prototype.cleanRoom = function(force = false) {
		// Bail out if not our room, or the room is over level 4, or there are hostiles in room.
		// This gives time to take anything out of existing terminals and factories and put it in storage.
		let level = this.controller.level;
		if (!force && (!this.my || (level >= 5))) return false

		if (RoomIntel.getHostilesTTL(this.name)) {
			this.logRoom('Cannot clean room: hostiles are present. These must be destroyed first.');
			return false;
		}

		// Remove all hostile construction sites. Only need to do this at level 1.
		if (level === 1) {
			this.hostileConstructionSites.forEach(site => site.remove());
		}

		// Clean the walls that aren't ours. Only need to do this at level 1.
		if (level === 1) {
			let walls = this.hasMyNonControllerStructures ? this.walls.filter(f => !this.perimeterBarrierPositionsNameHash[f.pos.name]) : this.walls;
			for (let i=0; i<walls.length; i++) {
				let wall = walls[i];
				wall.destroy();
			}
		}

		// General idea is to destroy all worthless buildings (and ramparts), but retain hostile structures that we can suck resources out of
		// until we are ready to build our own copies of those buildings (or they go dry).
		let hostilePlayerBuildings = this.hostilePlayerBuildings;
		for (let i=0; i<hostilePlayerBuildings.length; i++) {
			let hostileStructure = hostilePlayerBuildings[i];

			if ((hostileStructure.structureType === STRUCTURE_STORAGE) && hostileStructure.store.getUsedCapacity()) {
				// If I'm at the level where I can make my own store, then go ahead and blow this one up and do that.
				if (CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level]) {
					if (hostileStructure.destroy() === OK) {
						console.log('💣 Destroying hostile storage !!!');
					}
				}
			}
			else if ((hostileStructure.structureType === STRUCTURE_TERMINAL) && hostileStructure.store.getUsedCapacity()) {
				// Do nothing until we have our own storage up.
				if (this.myStorage) {
					if (hostileStructure.destroy() === OK) {
						console.log('💣 Destroying hostile terminal !!!');
					}
				}
			}
			else {
				// Clear any hostile structures that have no energy or our not worth our time.
				hostileStructure.destroy();
			}
		}

		return true;
	};

	// Try to determine, using as little CPU as possible, if room has structures in it excluding the controller (which is considered a structure).
	Object.defineProperty(Room.prototype, 'hasStructures', {
		get() {
			if (typeof this._hasStructures === "undefined") {
				this._hasStructures = !!(this.storage || this.terminal || (this.structures.length - (this.controller ? 1 : 0)));
			}
			return this._hasStructures;
		},
		configurable: true, enumerable: true,
	});

	// Try to determine, using as little CPU as possible, if room has hostile structures in it excluding the controller (which is considered a structure).
	Object.defineProperty(Room.prototype, 'hasHostileStructures', {
		get() {
			if (typeof this._hasHostileStructures === "undefined") {
				this._hasHostileStructures = !!((this.storage && !this.storage.my) || (this.terminal && !this.terminal.my) || (this.hostileStructures.length - ((this.controller && !this.controller.my && this.controller.owner) ? 1 : 0)));
			}
			return this._hasHostileStructures;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.dryStructuresFilter = function(structure) {
        return (
			// Either structure does not have a store or its store is empty, so it is dry.
			!structure.store
			|| !structure.store.getUsedCapacity()
		);
	}

	Object.defineProperty(Room.prototype, 'dryHostileStructures', {
		get() {
			if (typeof this._dryHostileStructures === "undefined") {
				this._dryHostileStructures = this.hostilePlayerBuildings.filter(f => this.dryStructuresFilter(f));
			}
			return this._dryHostileStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasDryHostileStructures', {
		get() {
			if (typeof this._hasDryHostileStructures === "undefined") {
				this._hasDryHostileStructures =
					// Check hostile storage/terminal first, no cpu required.
					this.hostileStores.find(f => this.dryStructuresFilter(f))
					// Do a scan for hostile structures and stop at the first one is dry.
					|| this.hostilePlayerBuildings.find(f => this.dryStructuresFilter(f))
					// Remember to return null if nothing was found.
					|| null;
			}
			return this._hasDryHostileStructures;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Note that structures that we should even consider dismantling would be in non-owned rooms or SK rooms.
	 * Would never dismantle anything in my own room (once at max level) or in a highway or core room.
	 * Also consider if we have our own storage/terminal in this room (unclaimed rooms can be considered clean).
	 */
	Object.defineProperty(Room.prototype, 'hasStructuresToDismantle', {
		get() {
			if (typeof this._hasStructuresToDismantle === "undefined") {
				this._hasStructuresToDismantle = !!(
					// Exclude my room or rooms that have my storage/terminal in them.
					!(this.my && this.atMaxLevel)
					&& (!this.storage || !this.storage.my)
					&& (!this.terminal || !this.terminal.my)

					// Will never dismantle any structures in highways or core rooms.
					// SK rooms will have strongholes to dismantle of course.
					&& !this.isHighwayRoom
					&& !this.isCoreRoom

					// Controller rooms will be trickier to detect.
					&& !!(
						// We have destroy flags, which is a direct indicator of structures/walls that need to be taken down.
						this.destroyFlags.length
						// There are dry hostile structures (like empty storage or extensions or ramparts).
						|| this.hasDryHostileStructures
						// Walls need to come down!
						|| (!this.hasMyNonControllerStructures && this.walls.length)
					)
				);
			}
			return this._hasStructuresToDismantle;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasMySpawnByRoomName', {
		get() {
			if (typeof this._hasMySpawnByRoomName === "undefined") {
				this._hasMySpawnByRoomName = !!(
					// Only need to check the first spawn as it should always be present.
					(Game.spawns[this.name + 'a'] && Game.spawns[this.name + 'a'].my)
					// Then check if this room has any of our spawns.
					|| GameManager.empireSpawnRoomNamesHashFromGameSpawns[this.name]
				);
			}
			return this._hasMySpawnByRoomName;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Determine if we have any important structures in this room.
	 * Can get free checks for storage, terminals, and spawns.
	 */
	Object.defineProperty(Room.prototype, 'hasMyNonControllerStructures', {
		get() {
			if (typeof this._hasMyNonControllerStructures === "undefined") {
				this._hasMyNonControllerStructures = !!(
					(this.storage && this.storage.my)
					|| (this.terminal && this.terminal.my)
					|| this.hasMySpawnByRoomName
				);
			}
			return this._hasMyNonControllerStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'shouldRoomBeClaimedToClean', {
		get() {
			if (typeof this._shouldRoomBeClaimedToClean === "undefined") {
				this._shouldRoomBeClaimedToClean = !!(this.controller && !this.my && !this.hasMyNonControllerStructures && RoomIntel.getHasStructuresToDismantle(this.name));
			}
			return this._shouldRoomBeClaimedToClean;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'canRoomBeClaimed', {
		get() {
			if (typeof this._canRoomBeClaimed === "undefined") {
				// Checking raw room count vs Gcl level with the intention that this will not be a long term claimed room; only for cleaning.
				this._canRoomBeClaimed = !!(GameManager.okToClaimRoomAbsolute && (this.isTempleCandidate || (!this.destroyFlagsController.length && this.shouldRoomBeClaimedToClean)));
			}
			return this._canRoomBeClaimed;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'doClaimRoom', {
		get() {
			if (typeof this._doClaimRoom === "undefined") {
                this._doClaimRoom = false;

				// Must have a colony flag up to claim a room.
				// We are saving ONE room for the purpose of cleaning reserved rooms.
                if (
					!this.my
					&& this.claimFlag
					&& !this.unclaimFlag
					&& this.colonyFlag
					&& (
						// Don't claim a room while it has a safemode, as it won't be able to be defended at lowest levels.
						(!this.safeModeCooldown || this.isTemple || !RoomIntel.getHostilesTTL(this.name))
						// ... unless we are explicity overriding that check with a higher color.
						|| (FlagManager.claimFlags[this.name].count > 1)
					)
					&& GameManager.okToClaimRoom
					&& !this.destroyFlagsController.length

					// When we have empire castle assistance, wait until the room has a colony container built before claiming.
					&& (
						// We have no assistance, just claim it now and hope for the best.
						!this.hasEmpireCastleAssistance
						// Have we already owned this room and have structures in it?
						|| this.hasMyNonControllerStructures.length
						// Brand new room, wait until we have all the necessary containers up.
						|| this.hasRoomContainers
					)
				) {
                    this._doClaimRoom = true;
                }
            }
			return this._doClaimRoom;
		},
		configurable: true, enumerable: true,
    });

    Room.prototype.unclaimRoom = function() {
		// Safely unclaim room. If we have a level 1 room with no colony flag and no structures to dismantle, then unclaim this room.
		if (
			// Obviously has to be my room to unclaim.
			this.my

			// Don't delete our only spawn in early game.
			&& (Object.keys(Game.spawns).length > 1)

			&& (
				// This was a reserved room that needed to be cleaned.
				((this.level === 1) && !this.claimFlag)

				// This room is flagged to be unclaimed, and no longer has any creeps in it.
				|| (this.unclaimFlag && !this.myCreeps.length)
			)

			// Do we have any structures to dismantle.
			//&& !(this.hasStructuresToDismantle || this.hasHostileWalls)
			&& !RoomIntel.getHasStructuresToDismantle(this.name)
		) {
			// BE REALLY CAREFUL HERE!
			this.logRoom('unclaiming room');
			this.controller.unclaim();
		}
	}

	Object.defineProperty(Room.prototype, 'print', {
		get() {
			return utils.getRoomHTML(this.name);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'printShard', {
		get() {
			return utils.getShardRoomHTML(this.name);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'printRoom', {
		get() {
			return utils.getRoomHTML(this.name);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'my', {
		get() {
			if (typeof this._my === "undefined") {
				this._my = !!(this.controller && this.controller.my);
			}
			return this._my;
		},
		configurable: true, enumerable: true,
	});

	/**
	 *  Note that rooms without a controller, or are reserved, default to level 0.
	 */
	Object.defineProperty(Room.prototype, 'level', {
		get() {
			if (typeof this._level === "undefined") {
				this._level = this.controller ? this.controller.level : 0;
			}
			return this._level;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'safeMode', {
		get() {
			if (typeof this._safeMode === "undefined") {
				this._safeMode = this.controller ? this.controller.safeMode || 0 : 0;
			}
			return this._safeMode;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'safeModeCooldown', {
		get() {
			if (typeof this._safeModeCooldown === "undefined") {
				this._safeModeCooldown = this.controller ? this.controller.safeModeCooldown || 0 : 0;
			}
			return this._safeModeCooldown;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileSafeMode', {
		get() {
			if (typeof this._hostileSafeMode === "undefined") {
				this._hostileSafeMode = this.my ? 0 : this.safeMode;
			}
			return this._hostileSafeMode;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasMaxSafeModesAvailable', {
		get() {
			if (typeof this._hasMaxSafeModesAvailable === "undefined") {
				this._hasMaxSafeModesAvailable = !this.controller || ((this.controller.safeModeAvailable || 0) >= this.controller.level);
			}
			return this._hasMaxSafeModesAvailable;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasOneSafeModesAvailable', {
		get() {
			if (typeof this._hasOneSafeModesAvailable === "undefined") {
				this._hasOneSafeModesAvailable = !this.controller || ((this.controller.safeModeAvailable || 0) >= 1);
			}
			return this._hasOneSafeModesAvailable;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileSafeModeExpiresTime', {
		get() {
			if (typeof this._hostileSafeModeExpiresTime === "undefined") {
				this._hostileSafeModeExpiresTime = null;
				if (this.hostileSafeMode) {
					this._hostileSafeModeExpiresTime = Game.time + this.safeMode;
				}
			}
			return this._hostileSafeModeExpiresTime;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'safeModeCooldownExpiresTime', {
		get() {
			if (typeof this._safeModeCooldownExpiresTime === "undefined") {
				this._safeModeCooldownExpiresTime = (this.controller && this.controller.safeModeCooldown) ? Game.time + this.controller.safeModeCooldown : null;
			}
			return this._safeModeCooldownExpiresTime;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myProperty', {
		get() {
			if (typeof this._myProperty === "undefined") {
				this._myProperty = !!(this.my || this.reservedByMe);
			}
			return this._myProperty;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myManagement', {
		get() {
			if (typeof this._myManagement === "undefined") {
				this._myManagement = !!(this.my || GameManager.empireReservedRoomsHash[this.name]);
			}
			return this._myManagement;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myReserved', {
		get() {
			if (typeof this._myReserved === "undefined") {
				this._myReserved = !!(GameManager.empireReservedRoomsHash[this.name]);
			}
			return this._myReserved;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myReservedNotManaged', {
		get() {
			if (typeof this._myReservedNotManaged === "undefined") {
				this._myReservedNotManaged = !!(this.reservedByMe && !GameManager.empireReservedRoomsHash[this.name]);
			}
			return this._myReservedNotManaged;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByMeButOtherManagement', {
		get() {
			if (typeof this._reservedByMeButOtherManagement === "undefined") {
				this._reservedByMeButOtherManagement = !!(this.otherManagement && GameManager.empireReservedRoomsHash[this.name]);
			}
			return this._reservedByMeButOtherManagement;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'otherManagement', {
		get() {
			if (typeof this._otherManagement === "undefined") {
				this._otherManagement = !!(this.ownedByOther || this.reservedByOther);
			}
			return this._otherManagement;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'otherPlayerManagement', {
		get() {
			if (typeof this._otherPlayerManagement === "undefined") {
				this._otherPlayerManagement = !!(this.ownedByOther || this.reservedByOtherPlayer);
			}
			return this._otherPlayerManagement;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'owner', {
		get() {
			if (typeof this._owner === "undefined") {
				this._owner = (this.controller && this.controller.owner && this.controller.owner.username) || null;
			}
			return this._owner;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'ownedByOther', {
		get() {
			if (typeof this._ownedByOther === "undefined") {
				this._ownedByOther = !!((this.controller && this.controller.level) ? !this.controller.my : false);
			}
			return this._ownedByOther;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'ownedByNobody', {
		get() {
			if (typeof this._ownedByNobody === "undefined") {
				this._ownedByNobody = !!(this.controller && !this.controller.owner);
			}
			return this._ownedByNobody;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedBy', {
		get() {
			return !!(this.controller && this.controller.reservation) ? this.controller.reservation.username : null;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByNobody', {
		get() {
			return !(this.controller && this.controller.reservation);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByMe', {
		get() {
			return !!(this.controller && this.controller.reservation && (this.controller.reservation.username === utils.getUsername()));
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByOther', {
		get() {
			return !!(this.controller && this.controller.reservation && (this.controller.reservation.username != utils.getUsername()));
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByOtherPlayer', {
		get() {
			const users = {
				[utils.getUsername()]: 1
				, 'Invader': 1
			}
			return !!(this.controller && this.controller.reservation && !users[this.controller.reservation.username]);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByAlly', {
		get() {
			return !!(this.reservedByOtherPlayer && PlayerManager.isAlly(this.reservedBy))
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByInvader', {
		get() {
			return !!(this.controller && this.controller.reservation && (this.controller.reservation.username === 'Invader'));
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByMeTicksToEnd', {
		get() {
			return this.reservedByMe ? this.controller.reservation.ticksToEnd : 0;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedByMeTicksFree', {
		get() {
			return CONTROLLER_RESERVE_MAX - this.reservedByMeTicksToEnd;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'decayables', {
		get() {
			if (typeof this._decayables === "undefined") {
				this._decayables = this.tombstones.concat(this.ruins);

				// Determine if ruins are likely to be present in the room.
				// if (
				// 	(this.controller && this.my && !this.atMaxLevel && (RoomIntel.getSourceCount(this.name) > 1))
				// 	|| (this.isSKRoom && RoomIntel.getStrongholdByRoomName(this.name))
				// 	|| (this.isHighwayCorridor && RoomIntel.getPowerBanksByRoomName(this.name).length)
				// ) {
				//	this._decayables = this._decayables.concat(this.ruins)
				//}
			}
			return this._decayables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'foragables', {
		get() {
			if (typeof this._foragables === "undefined") {
				if (CreepManager.getLlamasByFocusId(this.controller.id).length) {
					this._foragables = this.nonSourceHarvestDecayables.concat(this.misplacedStores); //.concat(this.nonSourceHarvestDrops);
				}
				else {
					this._foragables = this.decayables.concat(this.misplacedStores).concat(this.droppedResources);
				}
			}
			return this._foragables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'foragablesSorted', {
		get() {
			if (typeof this._foragablesSorted === "undefined") {
				this._foragablesSorted = _.sortBy(this.foragables, s => s.amount ? -(s.value / s.amount) : -s.value);
			}
            return this._foragablesSorted
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'foragableEnergy', {
		get() {
			if (typeof this._foragableEnergy === "undefined") {
				if (CreepManager.getLlamasByFocusId(this.controller.id).length) {
					this._foragableEnergy = this.nonSourceHarvestDecayables.concat(this.misplacedStores).filter(f => f.store[RESOURCE_ENERGY]);
					this._foragableEnergy = this._foragableEnergy.concat(this.nonSourceDroppedEnergy);
				}
				else {
					this._foragableEnergy = this.decayables.concat(this.misplacedStores).filter(f => f.store[RESOURCE_ENERGY]);
					this._foragableEnergy = this._foragableEnergy.concat(this.droppedEnergy);
				}
			}
			return this._foragableEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'foragableTypes', {
		get() {
			if (typeof this._foragableTypes === "undefined") {
				let decayableTypes = Object.keys(utils.mergeStores(this.foragables.filter(m => m.store).map(m => m.store)));
				let dropTypes = this.foragables.filter(f => f.resourceType).map(m => m.resourceType);
				this._foragableTypes = utils.unique(decayableTypes.concat(dropTypes));
			}
			return this._foragableTypes;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Array of structures that can and should be withdrawn from because they are in the wrong location (colony flag moved most likely)
	 * or they below to previous hostile owner.
	 *
	 * storage and terminal are FREE cpu lookups. Anything else requires FIND_STRUCTURES which is expensive.
	 */
	Object.defineProperty(Room.prototype, 'misplacedStores', {
		get() {
			if (typeof this._misplacedStores === "undefined") {
				this._misplacedStores = [];

				// Our stores need to be aligned on the colony flag.
				if (this.my && this.colonyFlag) {
					if (this.storage && this.storage.my && this.storage.isMisplaced) this._misplacedStores.push(this.storage);
					if (this.terminal && this.terminal.my && this.terminal.isMisplaced) this._misplacedStores.push(this.terminal);
				}

				// Hostile stores are by definition misplaced.
				if (this.storage && !this.storage.my) this._misplacedStores.push(this.storage);
				if (this.terminal && !this.terminal.my) this._misplacedStores.push(this.terminal);
			}
			return this._misplacedStores;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'gatherables', {
		get() {
			if (typeof this._gatherables === "undefined") {
				this._gatherables = this.decayables.concat(this.misplacedStores);
				this._gatherables = this._gatherables.concat(this.droppedResources);
			}
			return this._gatherables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'gatherablesSorted', {
		get() {
			if (typeof this._gatherablesSorted === "undefined") {
				this._gatherablesSorted = _.sortBy(this.gatherables, s => s.amount ? -(s.value / s.amount) : -s.value);
			}
            return this._gatherablesSorted
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'gatherableEnergyAny', {
		get() {
			if (typeof this._gatherableEnergyAny === "undefined") {
				this._gatherableEnergyAny = this.decayables.concat(this.misplacedStores).filter(f => f.store[RESOURCE_ENERGY]);
				this._gatherableEnergyAny = this._gatherableEnergyAny.concat(this.droppedEnergy);
			}
			return this._gatherableEnergyAny;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This variation is used by carpenters, masons, and pages to find any loose energy on the ground.
	 * But do not pull from sources, let llamas do that.
	 */
	Object.defineProperty(Room.prototype, 'gatherableEnergy', {
		get() {
			if (typeof this._gatherableEnergy === "undefined") {
				this._gatherableEnergy = this.decayables.concat(this.misplacedStores).filter(f => f.store[RESOURCE_ENERGY]);
				this._gatherableEnergy = this._gatherableEnergy.concat(this.nonSourceHarvestDroppedEnergy);
			}
			return this._gatherableEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'gatherableTypes', {
		get() {
			if (typeof this._gatherableTypes === "undefined") {
				let decayableTypes = Object.keys(utils.mergeStores(this.decayables.concat(this.misplacedStores).map(m => m.store)));
				let dropTypes = this.droppedResources.map(m => m.resourceType);
				this._gatherableTypes = utils.unique(decayableTypes.concat(dropTypes));
			}
			return this._gatherableTypes;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'plunderables', {
		get() {
			if (typeof this._plunderables === "undefined") {
				this._plunderables = [];

				// Ruins are never in core room,
				// somewhat likely to be in SK rooms from strongholds (and when ruins are present, they are very valuable!),
				// UNLIKELY to be in highways (unfortunately Power Banks are structures whos ruins live 5 seconds),
				// and UNLIKELY to be in source.length==1 rooms since nobody would build there haha.

				// We will never plunder in an allies room.
				if (!this.controller || !RoomIntel.getAllyManagement(this.name)) {

					// Decayables are allowed in any room.
					if (this.decayables.length) this._plunderables = this._plunderables.concat(this.decayables);

					// Any hostile store is plunderable.
					if (this.controller) {
						if (this.hostileStores.length) this._plunderables = this._plunderables.concat(this.hostileStores);
					}

					if (this.my) {
						// Drops are allowed anywhere in my room.
						if (this.droppedResources.length) this._plunderables = this._plunderables.concat(this.droppedResources)

					}
					else if (this.myManagement) {
						// Drops are allowed on non-harvest positions. Oxen will gather harvestpos drops.
						if (this.nonSourceHarvestDrops.length) this._plunderables = this._plunderables.concat(this.nonSourceHarvestDrops);

						// Exclude ALL containers in owned rooms.
						// Allow non-source containers in other rooms.
						// Those are already filtered by my management of room.

						// SK rooms will have stronghold containers.
						// These containers will be destroyed by our lancers, and turn into ruins which are already included.
						// SK containers will be destroyed and turned into ruins, which are already checked above, however lancers leave before they are destroyed.
						//if (this.isSKRoom && RoomIntel.getStrongholdByRoomName(this.name)) this._plunderables = this._plunderables.concat(this.nonSourceContainers);
					}
					else {
						// Include any drops anywhere in the room, including under source containers or from battles.
						if (this.droppedResources.length) this._plunderables = this._plunderables.concat(this.droppedResources);

						// Container logic.
						if (FlagManager.plunderplayersFlag && this.reservedByOtherPlayer && this.containers.length) {
							// We can steal from other players...muwahahah!
							this._plunderables = this._plunderables.concat(this.containers);
						}
						else if (this.reservedByMe && this.sourceContainers.length) {
							// Most likely center rooms or rooms reserved by myself (but not currently under my management due to reserved rooms shrinkage) or others will have containers.
							// Otherwise do not include them in the search as it is expensive.
							// SK containers will be destroyed and turned into ruins, which are already included above.
							this._plunderables = this._plunderables.concat(this.sourceContainers);
						}
					}

					// Finally filter out anything under hostile ramparts.
					// This could happen in any room (owned or reserved or SK) except if its our property in which case these would have been cleaned.
					if (!this.myProperty && !this.isHighwayRoom && !this.isCoreRoom) {
						this._plunderables = this._plunderables.filter(f => !f.pos.hasHostileRampartHits);
					}
				}
			}
			return this._plunderables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'plunderableHash', {
		get() {
			if (typeof this._plunderableHash === "undefined") {
				this._plunderableHash = utils.mergeStores(this.plunderables.filter(f => f.store).map(m => m.store));
				let resources = this.plunderables.filter(f => f.resourceType);
				resources.forEach(resource => {
					this._plunderableHash[resource.resourceType] = (this._plunderableHash[resource.resourceType] || 0) + resource.amount;
				})
			}
            return this._plunderableHash;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'plunderableAmount', {
		get() {
			if (typeof this._plunderableAmount === "undefined") {
				this._plunderableAmount = _.sum(Object.values(this.plunderableHash));
			}
            return this._plunderableAmount
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'plunderablesSorted', {
		get() {
			if (typeof this._plunderablesSorted === "undefined") {
				this._plunderablesSorted = _.sortBy(this.plunderables, s => s.amount ? -(s.value / s.amount) : -s.value);
			}
            return this._plunderablesSorted
        },
        configurable: true, enumerable: true,
    });

	Room.prototype.getLootValue = function(lootHash) {
		return Object.keys(lootHash).reduce((acc, resourceType) => {
			return acc + lootHash[resourceType] * GameManager.getMarketValue(resourceType)
		}, 0);
	}

	Object.defineProperty(Room.prototype, 'plunderableValue', {
		get() {
			if (typeof this._plunderableValue === "undefined") {
				this._plunderableValue = this.getLootValue(this.plunderableHash);
			}
            return this._plunderableValue
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'atMaxLevel', {
		get() {
			if (typeof this._atMaxLevel === "undefined") {
				this._atMaxLevel = (this.controller.level === 8);
			}
			return this._atMaxLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reachableSources', {
		get() {
			if (typeof this._reachableSources === "undefined") {
				this._reachableSources = this.sources.filter(f => f.harvestPos && !f.harvestPos.isBlockedByObject)
			}
			return this._reachableSources;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Note that standard map has 1 mineral per room.
	 * However, seasons or custome servers can have multiple minerals per room.
	 * But since some minerals can disappear (like thorium) after it is used, minerals incurs a lookup each call.
	 * So, do not consider those special minerals as part of the room resources.
	 */
	Object.defineProperty(Room.prototype, 'resources', {
		get() {
			if (typeof this._resources === "undefined") {
				this._resources = this.sources;
				if (this.mineral) this._resources = this._resources.concat([this.mineral]);
			}
			return this._resources;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'haltSpawning', {
		get() {
			if (typeof this._haltSpawning === "undefined") {
				this._haltSpawning = GameManager.haltSpawning;
			}
			return this._haltSpawning;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.atSpawningEnergyCapacityForLevel = function(level) {
		if (this.isTemple) return true;
		return this.energyCapacityAvailable >= C.SPAWNING_ENERGY_CAPACITY[level];
	};

	Object.defineProperty(Room.prototype, 'atSpawningEnergyCapacityForCurrentLevel', {
		get() {
			if (typeof this._atSpawningEnergyCapacityForCurrentLevel === "undefined") {
				this._atSpawningEnergyCapacityForCurrentLevel = this.atSpawningEnergyCapacityForLevel(this.controller.level);
			}
			return this._atSpawningEnergyCapacityForCurrentLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'storageEnergy', {
		get() {
			if (typeof this._storageEnergy === "undefined") {
				let energy = 0;
				if (this.storage) energy += this.storage.store.getUsedCapacity(RESOURCE_ENERGY);
				if (this.terminal) energy += this.terminal.store.getUsedCapacity(RESOURCE_ENERGY);
				if (this.storage && this.king) energy += this.king.store.getUsedCapacity(RESOURCE_ENERGY);
				if (!this.storage && this.colonyContainer) energy += this.colonyContainer.store.getUsedCapacity(RESOURCE_ENERGY);

				this._storageEnergy = energy;
			}
			return this._storageEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'storageCapacity', {
		get() {
			if (typeof this._storageCapacity === "undefined") {
				if (!this.storage) {
					this._storageCapacity = 0;
				} else {
					this._storageCapacity = this.storage.store.getCapacity();
				}
			}
			return this._storageCapacity;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'storagePercent', {
		get() {
			if (typeof this._storagePercent === "undefined") {
				if (!this.storage) {
					this._storagePercent = 0;
				} else {
					this._storagePercent = Math.floor((this.storage.store.getUsedCapacity() / this.storage.store.getCapacity()) * 100);
				}
			}
			return this._storagePercent;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * All subsequent energy functions are based off this property.
	 * Calculated off the spawn storage capacity in the room, by level and by storage capacity (including bonus power effect).
	 */
	Object.defineProperty(Room.prototype, 'energyMinimal', {
		get() {
			if (typeof this._energyMinimal === "undefined") {
				this._energyMinimal = this.storageCapacity * Config.params.ENERGY_MINIMAL_PERCENT;
			}
			return this._energyMinimal;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyMinimal', {
		get() {
			if (typeof this._isStorageEnergyMinimal === "undefined") {
				this._isStorageEnergyMinimal = (this.storageEnergy >= this.energyMinimal);
			}
			return this._isStorageEnergyMinimal;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyNormal', {
		get() {
			if (typeof this._energyNormal === "undefined") {
				this._energyNormal = this.storageCapacity * Config.params.ENERGY_NORMAL_PERCENT;
			}
			return this._energyNormal;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyNormal', {
		get() {
			if (typeof this._isStorageEnergyNormal === "undefined") {
				this._isStorageEnergyNormal = (this.storageEnergy >= this.energyNormal);
			}
			return this._isStorageEnergyNormal;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyControllerLinkUpgrade', {
		get() {
			if (typeof this._energyControllerLinkUpgrade === "undefined") {
				this._energyControllerLinkUpgrade = this.storageCapacity * Config.params.ENERGY_CONTROLLER_LINK_UPGRADE_PERCENT;
			}
			return this._energyControllerLinkUpgrade;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyControllerLinkUpgrade', {
		get() {
			if (typeof this._isStorageEnergyControllerLinkUpgrade === "undefined") {
				if (!this.myColonyLink || !this.myControllerLink) {
					this._isStorageEnergyControllerLinkUpgrade = false;
				} else {
					this._isStorageEnergyControllerLinkUpgrade = (this.storageEnergy >= this.energyControllerLinkUpgrade);
				}
			}
			return this._isStorageEnergyControllerLinkUpgrade;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyAbundant', {
		get() {
			if (typeof this._energyAbundant === "undefined") {
				this._energyAbundant = this.storageCapacity * Config.params.ENERGY_ABUNDANT_PERCENT;
			}
			return this._energyAbundant;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyAbundant', {
		get() {
			if (typeof this._isStorageEnergyAbundant === "undefined") {
				this._isStorageEnergyAbundant = (this.storageEnergy >= this.energyAbundant);
			}
			return this._isStorageEnergyAbundant;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyFarm', {
		get() {
			if (typeof this._energyFarm === "undefined") {
				this._energyFarm = this.storageCapacity * Config.params.ENERGY_FARM_PERCENT;
			}
			return this._energyFarm;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyFarm', {
		get() {
			if (typeof this._isStorageEnergyFarm === "undefined") {
				this._isStorageEnergyFarm = (this.storageEnergy >= this.energyFarm);
			}
			return this._isStorageEnergyFarm;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyTemple', {
		get() {
			if (typeof this._energyTemple === "undefined") {
				this._energyTemple = this.storageCapacity * Config.params.ENERGY_TEMPLE_PERCENT;
			}
			return this._energyTemple;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyTemple', {
		get() {
			if (typeof this._isStorageEnergyTemple === "undefined") {
				this._isStorageEnergyTemple = !!this.storageEnergy && (this.storageEnergy >= this.energyTemple);
			}
			return this._isStorageEnergyTemple;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyDump', {
		get() {
			if (typeof this._energyDump === "undefined") {
				this._energyDump = this.storageCapacity * Config.params.ENERGY_DUMP_PERCENT;
			}
			return this._energyDump;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyDump', {
		get() {
			if (typeof this._isStorageEnergyDump === "undefined") {
				this._isStorageEnergyDump = (this.storageEnergy >= this.energyDump) && !!this.storageEnergy;
			}
			return this._isStorageEnergyDump;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyBattery', {
		get() {
			if (typeof this._energyBattery === "undefined") {
				this._energyBattery = this.storageCapacity * Config.params.ENERGY_BATTERY_PERCENT;;
			}
			return this._energyBattery;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyBattery', {
		get() {
			if (typeof this._isStorageEnergyBattery === "undefined") {
				this._isStorageEnergyBattery = (this.storageEnergy >= this.energyBattery);
			}
			return this._isStorageEnergyBattery;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'energyPower', {
		get() {
			if (typeof this._energyPower === "undefined") {
				this._energyPower = this.storageCapacity * Config.params.ENERGY_POWER_PERCENT;;
			}
			return this._energyPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyPower', {
		get() {
			if (typeof this._isStorageEnergyPower === "undefined") {
				this._isStorageEnergyPower = (this.storageEnergy >= this.energyPower);
			}
			return this._isStorageEnergyPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isTerminalFull', {
		get() {
			if (typeof this._isTerminalFull === "undefined") {
				this._isTerminalFull = this.terminal ? this.terminal.store.getFreeCapacity() <= Config.params.TERMINAL_TARGET_ENERGY : false;
			}
			return this._isTerminalFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageFull', {
		get() {
			if (typeof this._isStorageFull === "undefined") {
				// if (!this.my) {
				// 	this._isStorageFull = false;

				// }
				// else
				if (this.storage && this.isTemple) {
					// Temples go a little higher than normal. Want to really fill it up for the next cycle.
					this._isStorageFull = ((this.storage.store.getUsedCapacity() / this.storage.store.getCapacity()) >= Config.params.ENERGY_TEMPLE_PERCENT);

				}
				else if (this.storage) {
					this._isStorageFull = ((this.storage.store.getUsedCapacity() / this.storage.store.getCapacity()) >= Config.params.STORAGE_STORE_MAX_PERCENT);

				}
				else if (this.colonyContainer) {
					// We have a colony container, so room is low level.
					// To be full, our colony container has to be full, and no controller container can be empty.
					this._isStorageFull =
						!this.colonyContainer.store.getFreeCapacity()
						&& !this.controllerContainers.find(f => !f.store.getUsedCapacity());

				}
				else if (this.controllerContainers.length) {
					// Unlikely scenerio, early game...no storage or colony container.
					// To be full, every controller container must be full.
					this._isStorageFull = !this.controllerContainers.find(f => f.store.getFreeCapacity());

				}
				else if (this.colonyStorageTransporter) {
					// We have horses or mules, so its a low level room without storage.
					// We have a storage transporter, and nobody is targetting them (for deposit or withdrawal).
					this._isStorageFull = (this.myTransporterCreeps.length === this.myTransporterCreepsIdle.length) && !this.noStickyTarget(this.colonyStorageTransporter)

				}
				else {
					this._isStorageFull = false;

				}
			}
			return this._isStorageFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyHalfFull', {
		get() {
			if (typeof this._isStorageEnergyHalfFull === "undefined") {
				if (this.storage) {
					this._isStorageEnergyHalfFull = this.storage.store.isEnergyHalfFull
				} else {
					this._isStorageEnergyHalfFull = false;
				}
			}
			return this._isStorageEnergyHalfFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergyQuarterFull', {
		get() {
			if (typeof this._isStorageEnergyQuarterFull === "undefined") {
				if (this.storage) {
					this._isStorageEnergyQuarterFull = this.storage.store.isEnergyQuarterFull
				} else {
					this._isStorageEnergyQuarterFull = false;
				}
			}
			return this._isStorageEnergyQuarterFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStorageEnergySell', {
		get() {
			if (typeof this._isStorageEnergySell === "undefined") {
				if (this.storage) {
					this._isStorageEnergySell = ((this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / this.storage.store.getCapacity()) >= Config.params.TERMINAL_SELL_ENERGY_PERCENT);
				} else {
					this._isStorageEnergySell = false;
				}
			}
			return this._isStorageEnergySell;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isStoragePercentHighestInEmpire', {
		get() {
			if (typeof this._isStoragePercentHighestInEmpire === "undefined") {
				if (!this.atMaxLevel) {
					this._isStoragePercentHighestInEmpire = false;
				} else {
					this._isStoragePercentHighestInEmpire = (this.storagePercent === GameManager.empireHighestStoragePercent);
				}
			}
			return this._isStoragePercentHighestInEmpire;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barrierHits', {
		get() {
			if (typeof this._barrierHits === "undefined") {
				let multiplier = 1;

				if (FlagManager.nowallFlag) {
					multiplier = Config.params.REPAIR_NONEMPIRE_THRESHHOLD_PERCENT;
				}
				else if (this.safeMode) {
					multiplier = 1;
				}
				else if (!this.atMaxLevel && !GameManager.empireCastleRooms.length) {
					multiplier = Config.params.REPAIR_NONEMPIRE_THRESHHOLD_PERCENT;
				}
				else if (GameManager.empireCastleRooms.length < Config.params.EMPIRE_GCL_THRESHHOLD) {
					multiplier = Config.params.REPAIR_NONEMPIRE_THRESHHOLD_PERCENT;
				}

				this._barrierHits = this.barrierHitsByLevel(this.level) * multiplier;
			}
			return this._barrierHits;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barrierHitsMaxLevel', {
		get() {
			if (typeof this._barrierHitsMaxLevel === "undefined") {
				this._barrierHitsMaxLevel = this.barrierHitsByLevel(8);
			}
			return this._barrierHitsMaxLevel;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.barrierHitsByLevel = function(level) {
		return Math.min((Config.params.BARRIER_HITS_POW ** (level || 0)) * Config.params.BARRIER_HITS_MULTIPLIER, (RAMPART_HITS_MAX[level] || 0));
	}

	Object.defineProperty(Room.prototype, 'hostileConstructionSitesWithProgress', {
		get() {
			if (typeof this._hostileConstructionSitesWithProgress === "undefined") {
				this._hostileConstructionSitesWithProgress = this.hostileConstructionSites.filter(f => f.progress && (f.structureType !== STRUCTURE_EXTRACTOR));
			}
			return this._hostileConstructionSitesWithProgress;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Note that walls and ramparts only have 1 build point, but really we want them to be built until barrier repair hits.
	 * This addresses issues with allocation of builders when walls first start going up.
	 */
	Object.defineProperty(Room.prototype, 'myConstructionSitesProgressRemaining', {
		get() {
			if (typeof this._myConstructionSitesProgressRemaining === "undefined") {
				this._myConstructionSitesProgressRemaining = _.sum(this.myConstructionSites, s => ([STRUCTURE_WALL, STRUCTURE_RAMPART].includes(s.structureType) ? this.barrierHits : s.progressTotal) - s.progress) || 0;
			}
			return this._myConstructionSitesProgressRemaining;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myUpgradeControllerCreepWorkPartsTTL', {
		get() {
			if (typeof this._myUpgradeControllerCreepWorkPartsTTL === "undefined") {
				// Intentionally using workParks and not boosted parts equivelant to determine TTL not power.
				this._myUpgradeControllerCreepWorkPartsTTL = _.sum(CreepManager.getUpgradeControllerCreepsByFocusId(this.controller.id), s => s.workParts * (s.ticksToLive || CREEP_LIFE_TIME));
			}
			return this._myUpgradeControllerCreepWorkPartsTTL;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myConstructorCreepBuildPowerTTL', {
		get() {
			if (typeof this._myConstructorCreepBuildPowerTTL === "undefined") {
				// Get any builder working in any of our reserved rooms, since they can be re-assigned.
				let creeps = this.reserveRouteRoomNames.map(m => CreepManager.getConstructorsByWorkRoom(m)).flatten();
				this._myConstructorCreepBuildPowerTTL = _.sum(creeps, s => s.workPartsActiveBuildBoostEquivalent * (s.ticksToLive || CREEP_LIFE_TIME) * BUILD_POWER * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT);
			}
			return this._myConstructorCreepBuildPowerTTL;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myConstructorCreepRepairPowerTTL', {
		get() {
			if (typeof this._myConstructorCreepRepairPowerTTL === "undefined") {
				this._myConstructorCreepRepairPowerTTL = _.sum(CreepManager.getConstructorsByWorkRoom(this.name), s => s.workPartsActiveRepairBoostEquivalent * (s.ticksToLive || CREEP_LIFE_TIME) * REPAIR_POWER * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT);
			}
			return this._myConstructorCreepRepairPowerTTL;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps', {
		get() {
			if (typeof this._myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps === "undefined") {
				this._myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps = Math.max(this.myConstructionSitesProgressRemaining - this.myConstructorCreepBuildPowerTTL, 0);
			}
			return this._myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps', {
		get() {
			if (typeof this._myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps === "undefined") {
				this._myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps = Math.max(this.barrierHitsBelowRepairThreshhold - this.myConstructorCreepRepairPowerTTL, 0);
			}
			return this._myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps', {
		get() {
			if (typeof this._myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps === "undefined") {
				this._myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps = Math.max(this.barrierHitsBelowWorkerRepairThreshhold - this.myConstructorCreepRepairPowerTTL, 0);
			}
			return this._myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps', {
		get() {
			if (typeof this._myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps === "undefined") {
				this._myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps = Math.max(this.nukeBarrierHitsBelowRepairThreshhold - this.myConstructorCreepRepairPowerTTL, 0);
			}
			return this._myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isSKRoom', {
		get() {
			if (typeof this._isSKRoom === "undefined") {
				this._isSKRoom = Cartographer.isSKRoom(this.name);
			}
			return this._isSKRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isPortalRoom', {
		get() {
			if (typeof this._isPortalRoom === "undefined") {
				this._isPortalRoom = Cartographer.isPortalRoom(this.name);
			}
			return this._isPortalRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isCenterRoom', {
		get() {
			if (typeof this._isCenterRoom === "undefined") {
				this._isCenterRoom = Cartographer.isCenterRoom(this.name);
			}
			return this._isCenterRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isControllerRoom', {
		get() {
			if (typeof this._isControllerRoom === "undefined") {
				this._isControllerRoom = Cartographer.isControllerRoom(this.name);
			}
			return this._isControllerRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isCoreRoom', {
		get() {
			if (typeof this._isCoreRoom === "undefined") {
				this._isCoreRoom = Cartographer.isCoreRoom(this.name);
			}
			return this._isCoreRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isHighwayCorridor', {
		get() {
			if (typeof this._isHighwayCorridor === "undefined") {
				this._isHighwayCorridor = Cartographer.isHighwayCorridor(this.name);
			}
			return this._isHighwayCorridor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isHighwayCorner', {
		get() {
			if (typeof this._isHighwayCorner === "undefined") {
				this._isHighwayCorner = Cartographer.isHighwayCorner(this.name);
			}
			return this._isHighwayCorner;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isHighwayRoom', {
		get() {
			if (typeof this._isHighwayRoom === "undefined") {
				this._isHighwayRoom = Cartographer.isHighwayRoom(this.name);
			}
			return this._isHighwayRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isSKAccessRoom', {
		get() {
			if (typeof this._isSKAccessRoom === "undefined") {
				this._isSKAccessRoom = Cartographer.isSKAccessRoom(this.name);
			}
			return this._isSKAccessRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isCoreAccessRoom', {
		get() {
			if (typeof this._isCoreAccessRoom === "undefined") {
				this._isCoreAccessRoom = Cartographer.isCoreAccessRoom(this.name);
			}
			return this._isCoreAccessRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isHighwayAccessRoom', {
		get() {
			if (typeof this._isHighwayAccessRoom === "undefined") {
				this._isHighwayAccessRoom = Cartographer.isHighwayAccessRoom(this.name);
			}
			return this._isHighwayAccessRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isHighwayAccessRouteDistance2Room', {
		get() {
			if (typeof this._isHighwayAccessRouteDistance2Room === "undefined") {
				this._isHighwayAccessRouteDistance2Room = Cartographer.isHighwayAccessRouteDistance2Room(this.name);
			}
			return this._isHighwayAccessRouteDistance2Room;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'accessibleHighways', {
		get() {
			if (typeof this._accessibleHighways === "undefined") {
				this._accessibleHighways = Cartographer.getAccessibleHighways(this.name);
			}
			return this._accessibleHighways;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isDredgerSpawnRoom', {
		get() {
			if (typeof this._isDredgerSpawnRoom === "undefined") {
				this._isDredgerSpawnRoom = false;

				// SK access rooms will obviously have dredgers.
				if (Cartographer.isSKAccessRoom(this.name)) {
					this._isDredgerSpawnRoom = true;
				}

				// Rooms assisting temples will have access to their minerals.
				if (!this._isDredgerSpawnRoom) {
					let templeRoomName = GameManager.empireTempleRoomNames.find(templeRoomName => Cartographer.describeExitRooms(templeRoomName).find(exitRoomName => exitRoomName === this.name));
					if (templeRoomName) {
						let templeRoom = Game.rooms[templeRoomName];
						if (templeRoom && templeRoom.colonyMineralExtractor) this._isDredgerSpawnRoom = true;
					}
				}
			}
			return this._isDredgerSpawnRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'potentialMineralRoomNames', {
		get() {
			if (typeof this._potentialMineralRoomNames === "undefined") {
				this._potentialMineralRoomNames = [];

				// Any center rooms in this sector are potentials.
				if (Cartographer.isSKAccessRoom(this.name)) {
					this._potentialMineralRoomNames = this._potentialMineralRoomNames.concat(Cartographer.getSectorCenterRooms(this.name));
				}

				// Rooms assisting temples will have access to their minerals.
				let templeRoomName = GameManager.empireTempleRoomNames.find(templeRoomName => Cartographer.describeExitRooms(templeRoomName).find(exitRoomName => exitRoomName === this.name));
				if (templeRoomName) {
					let templeRoom = Game.rooms[templeRoomName];
					if (templeRoom && templeRoom.colonyMineralExtractor) this._potentialMineralRoomNames = this._potentialMineralRoomNames.concat([templeRoom.name])
				}
			}
			return this._potentialMineralRoomNames;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isBestRoom', {
		get() {
			if (typeof this._isBestRoom === "undefined") {
				this._isBestRoom = (GameManager.empireHighestControllerEnergyCapacityAvailable === this.energyCapacityAvailable);
			}
			return this._isBestRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'renewAvailableOrInProgress', {
		get() {
            if (typeof this._renewAvailableOrInProgress === "undefined") {
				this._renewAvailableOrInProgress =
					// At least one spawn is free to renew.
					(this.room.spawnsSpawning.length < GameManager.getSpawnsByRoomName(this.room.name).length)
					// No creep is already on the renew position, or we are ourselves.
					&& (
						!this.room.isCreepOnColonyRenewPos
						|| this.isOnColonyRenewPos
					)
            }
			return this._renewAvailableOrInProgress;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isOnColonyRenewPos', {
		get() {
            if (typeof this._isOnColonyRenewPos === "undefined") {
				this._isOnColonyRenewPos = this.room.isCreepOnColonyRenewPos && (this.room.isCreepOnColonyRenewPos.id === this.id);
			}
			return this._isOnColonyRenewPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'spawnsHaveEnergy', {
		get() {
            if (typeof this._spawnsHaveEnergy === "undefined") {
				this._spawnsHaveEnergy =
                    ((this.colonySpawn1 && this.colonySpawn1.energy >= 10)
                    || (this.colonySpawn2 && this.colonySpawn2.energy >= 10)
                    || (this.colonySpawn3 && this.colonySpawn3.energy >= 10))
            }
			return this._spawnsHaveEnergy;
		},
		configurable: true, enumerable: true,
    });

	Room.prototype.targetIsContainer = function(target) {
        return (target instanceof StructureContainer);
    }

	Room.prototype.targetIsWall = function(target) {
        return (target instanceof StructureWall);
    }

    Room.prototype.targetIsBarrier = function(target) {
        return (target instanceof StructureRampart || target instanceof StructureWall);
    }

    Room.prototype.targetIsCreep = function(target) {
        return (target instanceof Creep);
    }

    Room.prototype.targetIsPowerBank = function(target) {
        return (target instanceof StructurePowerBank);
    }

    Room.prototype.targetIsPortal = function(target) {
        return (target instanceof StructurePortal);
	}

    Room.prototype.targetIsDeposit = function(target) {
        return (target instanceof Deposit);
	}

    Room.prototype.constructionSiteIsBarrier = function(target) {
        return (target instanceof ConstructionSite && [STRUCTURE_WALL, STRUCTURE_RAMPART].includes(target.structureType));
    }

	Room.prototype.removeConstructionSites = function(includeInProgress = false) {
		this.constructionSites.forEach(site => {
			if (!site.progress || includeInProgress) site.remove();
		})
	}

	Object.defineProperty(Room.prototype, 'centerPos', {
		get() {
			if (typeof this._centerPos === "undefined") {
				this._centerPos = new RoomPosition(25, 25, this.name)
			}
			return this._centerPos;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.getCenterPos = function() {
		// Back away from controller/sources/mineral in the room.
		let positions = this.allNonWallPos;
		if (this.controller) {
			positions = positions.filter(f => f.getRangeTo(this.controller) > 2);
		}
		this.sources.forEach(source => {
			positions = positions.filter(f => f.getRangeTo(source) > 2);
		})
		if (this.mineral) {
			positions = positions.filter(f => f.getRangeTo(this.mineral) > 2);
		}

		return (new RoomPosition(25, 25, this.name)).findClosestByDistance(positions);
	}

	Object.defineProperty(Room.prototype, 'allNonWallPos', {
		get() {
			if (typeof this._allNonWallPos === "undefined") {
				this._allNonWallPos = this.heap.allNonWallPos;

				if (typeof this._allNonWallPos === "undefined") {
					this.heap.allNonWallPos = [];

					const terrain = new Room.Terrain(this.name);
					for (let y = 0; y < 50; y++) {
						for(let x = 0; x < 50; x++) {
							if (terrain.get(x, y) !== TERRAIN_MASK_WALL) this.heap.allNonWallPos.push({x:x, y:y});
						}
					}
					this._allNonWallPos = this.heap.allNonWallPos;
				}

				// Need new RoomPositions each tick.
				this._allNonWallPos = this._allNonWallPos.map(m => new RoomPosition(m.x, m.y, this.name));
			}
			return this._allNonWallPos;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.removeFlag = function(flagName) {
		if (Game.flags[flagName]) return Game.flags[flagName].remove();
		return ERR_NOT_FOUND;
	}

	Room.prototype.hasExitToRoom = function(roomName) {
		return !!Cartographer.describeExitRoomsHash(this.name)[roomName]
	}

}
