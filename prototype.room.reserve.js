"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'isRoomReadyToReserve', {
		get() {
			if (typeof this._isRoomReadyToReserve === "undefined") {
				this._isRoomReadyToReserve = (
					!this.noReserve
					// No reserving until level 2+.
					&& (this.controller.level > 1)
					// If we don't have a storage, or its not full.
					&& (!this.myStorage || !this.isStorageFull || this.storageEnergy)
					// Temples will never reserve, it just causes reserved room remapping.
					&& !this.isTemple
					// All our spawns are busy, so don't bother.
					&& !this.colonyAllSpawnsSpawningOrRenewing
				);
			}
			return this._isRoomReadyToReserve;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.getReachableRoomsUnvisited = function() {
		// Shorthand.
		let room = this;

		// Get all rooms in the path from this room to each reserved room.
		let rooms = Object.keys(room.getReachableRoomsToReserve(true));

		// Use a hash to condense duplicate rooms in path.
		let scoutRooms = {};
		rooms.forEach(roomName => {
			if (!room.colonyObserver)  {
				// With no observer, we can't use findRouteRooms as it will avoid rooms.
				scoutRooms[roomName] = roomName;
			}
			else {
				// Send scouts to each room along the route, which would include highways.
				let path = Cartographer.findRouteRooms(room.name, roomName) || [];
				path.forEach(step => {
					if (!Game.rooms[step]) {
						scoutRooms[step] = step;
					}
				})
			}
		})

		return scoutRooms;
	}

	Room.prototype.getRoomsOnRouteNeedingScout = function(roomName) {
		// Shorthand.
		let room = this;
		let scoutRooms = {};

		let path = Cartographer.findRouteRooms(room.name, roomName) || [];
		path.forEach(step => {
			// No visibility or its not under my direct ownership.
			// Those rooms are dangerous and should always have a scout.
			if (!Game.rooms[step] || !Game.rooms[step].myProperty)  {
				if (!RoomIntel.getLethalHostilesTTL(step)) {
					scoutRooms[step] = step;
				}
			}
		})

		return scoutRooms;
	}

	Object.defineProperty(Room.prototype, 'reservedRouteRoomNames', {
		get() {
			if (typeof this._reservedRouteRoomNames === "undefined") {
				this._reservedRouteRoomNames = [];

				// Get a sorted list of rooms that this room have reserve flags for.
				let reservedRooms = this.reservedRoomNames;

				for (let i=0; i<reservedRooms.length; i++) {
					// Shorthand.
					let reservedRoom = reservedRooms[i];
					let path = Cartographer.findRouteRooms(this.name, reservedRoom) || [];
					path.forEach(step => {
						// Don't include this (spawn) room in list.
						if (this.name !== step) this._reservedRouteRoomNames.push(step);
					});
				}

				// Remove duplicates.
				this._reservedRouteRoomNames = utils.unique(this._reservedRouteRoomNames);
			}
			return this._reservedRouteRoomNames;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isMaxActiveRoomClosestToNonMaxNonTerminalColony', {
		get() {
			if (typeof this._isMaxActiveRoomClosestToNonMaxNonTerminalColony === "undefined") {
				this._isMaxActiveRoomClosestToNonMaxNonTerminalColony = !!GameManager.myMaxSpawnRoomNamesActiveClosestToNonMaxNonTerminalColony.find(f => f === this.name);
			}
			return this._isMaxActiveRoomClosestToNonMaxNonTerminalColony;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.isClosestCastleRoomTo = function(roomName) {
		return GameManager.getClosestCastleRoomTo(roomName) === this.name;
	}

	Object.defineProperty(Room.prototype, 'closestCastleRoom', {
		get() {
			if (typeof this._closestCastleRoom === "undefined") {
				this._closestCastleRoom = GameManager.getClosestCastleRoomTo(this.name)
			}
			return this._closestCastleRoom;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.getReachableRoomsToAssault = function() {
		// Shorthand.
		let room = this;
		let rooms = [];

		// Only proceed if this room is capable of assaulting.
		if (
			room.atMaxLevel
			&& !room.unclaimFlag
			&& !room.noReserve
			&& !room.myConstructionSites.length
			&& !room.hasBarrierBelowWorkerRepairThreshhold
			&& GameManager.haveAllMineralTerminals
		) {

			// Get a list of (safe, not otherManagement, in sector) rooms sorted by distance (1 to 3), range to highway.
			// What is distance? Must have exit from room.
			rooms = Cartographer.getRoomsInDistance(room.name, GameManager.reservedRoomDistance);

			// Only include controller rooms.
			rooms = rooms.filter(f => Cartographer.isControllerRoom(f));

			// Filter out "closed" rooms or rooms that are in newbie zones; only include "normal" rooms.
			// TODO: unless I myself am in the newb zone??
			rooms = rooms.filter(f => RoomIntel.getRoomStatus(f) === 'normal');

			// Filter out rooms that have a noreserve flag in them.
			rooms = rooms.filter(f => !FlagManager.noreserveFlags[f]);

			// Filter out rooms that have an avoid flag in them.
			rooms = rooms.filter(f => !FlagManager.avoidFlags[f]);

			// Filter for rooms that are owned by others.
			rooms = rooms.filter(f => Memory.rooms[f] && RoomIntel.getOwner(f) && ![utils.getUsername()].includes(RoomIntel.getOwner(f)) && !PlayerManager.isAlly(RoomIntel.getOwner(f)));

			// Filter out any room distances that are greater than 3. We don't want to walk that far.
			rooms = rooms.filter(f => Cartographer.isInRouteDistance(room.name, f, GameManager.reservedRoomDistance));
		}

		// Return our list of rooms in hash format.
		return rooms.reduce((map, obj) => (map[obj] = obj, map), {});
	}

	Object.defineProperty(Room.prototype, 'reservedRoomDistance', {
		get() {
			return GameManager.reservedRoomDistance;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.getReachableRoomsToReserve = function(unvisited, debug = false) {
		// Shorthand.
		let room = this;
		let rooms = [];

		let debugLog = function(text) {
			const TEXT_LENGTH = 18;
			if (debug) console.log((text + ' '.repeat(TEXT_LENGTH)).left(TEXT_LENGTH), rooms.join())
		}

		// Only proceed if this room is capable of reserving.
		if (
			!room.unclaimFlag
			&& !room.noReserve
			&& (room.atMaxLevel || !room.isTemple)
		) {

			// Get a list of (safe, not otherManagement, in sector) rooms sorted by distance (1 to 3), range to highway.
			rooms = Cartographer.getRoomsInDistance(room.name, room.reservedRoomDistance);
			debugLog('initial');

			// Only include controller rooms and core rooms (include SK rooms at max room level).
			if (room.atMaxLevel && !FlagManager.noskFlag) {
				rooms = rooms.filter(f => Cartographer.isControllerRoom(f) || Cartographer.isCoreRoom(f) || Cartographer.isSKRoom(f));
			}
			else {
				rooms = rooms.filter(f => Cartographer.isControllerRoom(f) || Cartographer.isCoreRoom(f));
			}
			debugLog('max level');

			// Filter out rooms that we have spawns in. Level 8 temple rooms can also be farmed.
			rooms = rooms.filter(f => !GameManager.empireSpawnRoomNamesHash[f] || ((RoomIntel.getLevel(f) == 8) && GameManager.empireTempleRoomNamesHash[f]));
			debugLog('my spawn rooms');

			// Filter out rooms that we have put down a claim flag, may not belong to us yet so wouldn't be a spawn room.
			rooms = rooms.filter(f => !FlagManager.claimFlags[f] || FlagManager.unclaimFlags[f]);
			debugLog('my claimed rooms');

			// Filter out "closed" rooms or rooms that are in newbie zones; only include "normal" rooms.
			// TODO: unless I myself am in the newb zone??
			rooms = rooms.filter(f => RoomIntel.getRoomStatus(f) === 'normal');
			debugLog('status normal');

			// Filter out rooms that have a noreserve flag in them.
			rooms = rooms.filter(f => !FlagManager.noreserveFlags[f]);
			debugLog('noreserve flag');

			// Filter out rooms that are our allies.
			// Means to keep rooms that are not reserved, or reserved by us, or reserved by someone other than our allies (which will will take).
			rooms = rooms.filter(f => !RoomIntel.getVisited(f) || !RoomIntel.getReservedBy(f) || [utils.getUsername(), 'Invader'].includes(RoomIntel.getReservedBy(f)) || !PlayerManager.isAlly(RoomIntel.getReservedBy(f)));
			debugLog('ally reserved');

			// We don't want to reserve rooms that are invader strongholds.
			// TODO: Is this only SK rooms in practice? Example on webpage shows controller room being a stronghold.
			rooms = rooms.filter(f => !RoomIntel.getStrongholdWarning(f));
			debugLog('strongholds');

			// Filter out rooms that we'd have to travel thru a highway.
			rooms = rooms.filter(f => !(Cartographer.findRouteRooms(room.name, f) || []).find(highway => Cartographer.isHighwayRoom(highway)));
			debugLog('highway rooms');

			// Create a criteria for if we should aggresively reserve rooms that may be difficult.
			let filterReservedByOther = !room.isCastle;

			// Filter out avoid rooms. Very easy, fast.
			// If specified, only include rooms we have no data on, so that a scout is sent to explore.
			if (unvisited) {
				// Revisit any rooms being avoided for more than a creep lifetime.
				// Observers handle updating avoid normally, but fresh colonies relie on scouts and they will get stuck otherwise.
				rooms = rooms.filter(f => !RoomIntel.getVisited(f) || RoomIntel.getUnvisitedByScout(f) || (RoomIntel.getAvoid(f) && (Game.time - RoomIntel.getAvoid(f) > CREEP_LIFE_TIME)));
			} else {
				// Filter rooms that are in safemode or are being avoided.
				rooms = rooms.filter(f => !!RoomIntel.getVisited(f) && (!RoomIntel.getAvoid(f) || FlagManager.reserveFlags[f]));  // avoid or force reserve

				// Wait till the level 8 room is fully built and we have all minerals for boosting before attempting to expand reserve spots.
				// reserve flag will override this check.
				if (filterReservedByOther) {
					rooms = rooms.filter(f => FlagManager.reserveFlags[f] || (!!RoomIntel.getVisited(f) && (!RoomIntel.getReservedBy(f) || [utils.getUsername(), 'Invader'].includes(RoomIntel.getReservedBy(f)))));
				}
			}
			debugLog('reserved by other');

			// Filter out rooms that are allies or have towers/spawns in them.
			rooms = rooms.filter(f =>
				!RoomIntel.getOwner(f)
				|| RoomIntel.getMy(f)
				|| (
					// We can do a hostile takeover of low level rooms.
					RoomIntel.getOwner(f)
					&& (RoomIntel.getLevel(f) <= 2)
					&& !RoomIntel.getHostileSafeMode(f)
					&& !PlayerManager.isAlly(RoomIntel.getOwner(f))
					// Unpowered towers can be in SK rooms. The avoid flag is checking that.
					&& !(RoomIntel.getHostileTowerCount(f) && !Cartographer.isSKRoom(f))
					&& !RoomIntel.getHostileSpawnCount(f)
				)
			)
			debugLog('ally or towers');

			// Filter out any room distances that are greater than our defined range. We don't want to walk too far.
			// The avoid tag for rooms will block low level rooms from ever being re-selected, so ignore this when testing for unvisited.
			if (!unvisited) {
				rooms = rooms.filter(f => Cartographer.isInRouteDistance(room.name, f, room.reservedRoomDistance));
				debugLog('route distance');
			}

			// Filter out rooms that have paths routing thru hostile reserved rooms or rooms we own.
			let preFilteredRooms = rooms;
			preFilteredRooms.forEach(routeRoom => {
				// Get the array of rooms from start to destination.
				// Note this includes start and destination rooms and is not in any particular order.
				let routeRooms = Cartographer.findRouteRooms(room.name, routeRoom) || [];
				// Attempt to find at least one room in the array that is not truly passable,
				// and if found, exclude the destination from our list of candidates.
				let findReservedByOther = routeRooms.find(f =>
					// Needs to have been visited to even know if we can't pass thru it.
					RoomIntel.getVisited(f)

					// Starting room is obviously fine.
					&& (f !== room.name)

					&& (
						// If the reserved room itself has a reserved flag, then it should be allowed.
						(f !== routeRoom)
						//|| ((f === routeRoom) && !FlagManager.reserveFlags[f])
					)

					// Under the incremental reserving scheme, this should actually be okay.
					// A max level room could end up extending 4 rooms thru and beyond a low level room.
					&& (
						// If the room is owned (by anyone else), then it should not be allowed.
						(RoomIntel.getOwner(f) && !RoomIntel.getMy(f))

						// Is there an avoid room along this path? If so then its a no-reserve.
						|| RoomIntel.getAvoid(f)

						// We don't want to reserve rooms that path thru invader strongholds.
						|| RoomIntel.getStrongholdInvaderCoreHitsByRoomName(f)

						// Avoid walking thru deploying strongholds.
						|| RoomIntel.getStrongholdWarning(f)

						// Don't attempt to reserve another players reserved room if our spawn room is too weak.
						|| (filterReservedByOther && RoomIntel.getReservedBy(f) && ![utils.getUsername(), 'Invader'].includes(RoomIntel.getReservedBy(f)))
					)
				);
				if (findReservedByOther) {
					// Some issue with the rooms along the route, so remove this destination room.
					rooms = rooms.filter(f => f !== routeRoom);
				}
			})
			debugLog('final cut');
		}

		// Return our list of rooms in hash format.
		return rooms.reduce((map, obj) => (map[obj] = obj, map), {});
	}

	Object.defineProperty(Room.prototype, 'reachableRoomsToReserve', {
		get() {
			if (typeof this._reachableRoomsToReserve === "undefined") {
				this._reachableRoomsToReserve = this.getReachableRoomsToReserve(false);
			}
			return this._reachableRoomsToReserve;
		},
		configurable: true, enumerable: true,
	});


	// Closer rooms by walking path have priority.
	Room.prototype.roomSortRouteDistance = function(s) {
		return Cartographer.findRouteDistance(this.name, s);
	}

	// The type of room we are inspecting.
	// Core and SK rooms have same sources but core is better as it doesn't have sourcekeepers.
	Room.prototype.roomSortType = function(s) {
		return Cartographer.isCoreRoom(s) ? 0 : 1;
	}

	// More sources, better (lower) priority.
	// We may not have the room in memory, in which case return a very low number so that a scout is sent to check it out.
	Room.prototype.roomSortSources = function(s) {
		return -RoomIntel.getSourceCount(s) || 0;
	}

	// Prefer rooms further away from any other spawn room, so rooms are allowed to grow more equaly.
	// This is a reverse test; map distances and then take the smallest value...and return its negative value to sort properly.
	// Rooms out of range of any spawn room are given equal weight.
	Room.prototype.roomSortOtherSpawnDistance = function(s, range) {
		let rooms = ReserveManager.spawnRoomsReserving.filter(f =>
			(f.name !== this.name)
			&& f.reachableRoomsToReserve[s]
			&& !f.getIsOverMaxReserveCreepCost()
			//&& (Cartographer.findRoomDistance(s, f) <= range)
		);
		// Map each room possibly in route distance to its actual distance.
		//return -_.min(rooms.map(m => Math.min(Cartographer.findRouteDistance(m, s), range+1)));
		return -_.min(rooms.map(m => Cartographer.findRouteDistance(m.name, s)));
	}

	// Rooms that are less/un-reachable by other rooms take priority, so we can expand as much as possible.
	Room.prototype.roomSortOtherSpawnReachable = function(s, range) {
		let rooms = ReserveManager.spawnRoomsReserving.filter(f =>
			f.reachableRoomsToReserve[s]
			&& !f.getIsOverMaxReserveCreepCost()
			&& (Cartographer.findRouteDistance(f.name, s) === range)
		);
		return rooms.length;
	}

	// Is room in the same sector?
	Room.prototype.roomSortSector = function(s) {
		return (Cartographer.getSector(this.name) === Cartographer.getSector(s)) ? 0 : 1;
	}

	// Physically room distance away from spawn.
	Room.prototype.roomSortRoomDistance = function(s) {
		return Cartographer.findRoomDistance(this.name, s);
	}

	// Deprioritize crossing highways.
	Room.prototype.roomSortRouteContainsHighway = function(s) {
		return Cartographer.findRouteRooms(this.name, s).find(f => Cartographer.isHighwayRoom(f)) ? 1 : 0;
	}

	// Physically closer rooms have priority as walking around corners is often shorter paths.
	Room.prototype.roomSortRoomRange = function(s) {
		return Cartographer.findRoomRange(this.name, s);
	}

	// Would this room put us over the max? If not, choose it first.
	Room.prototype.roomSortExceedMaxCost = function(s) {
		return ((this.memory.reserveCpuCost + this.getCpuCostForWorkRoom(s)) < this.maxReserveCpuCapacity) ? 0 : 1;
	}

	Room.prototype.getIsOverMaxReserveCreepCost = function() {
		return (this.memory.reserveCreeps || 0) >= this.maxReserveCreepCapacity;
	}

	Room.prototype.getReservedRoomsSortedAutoIncremental = function(reservedRooms, distance, options) {
		let room = this;
		let reservedRoom = null;
		let cost = 0;
		let creeps = 0;

        // Don't mess with the original options object.
		let defaults = {
            centerRoomsOnly: false
			, sectorRoomsOnly: false
			, debug: false
        };
		options = _.defaults({}, _.clone(options), defaults);

		// Get our current reserve cost and bail out if we are over our max creep cost.
		if (room.getIsOverMaxReserveCreepCost()) return reservedRoom;

		// Bail out if we are too low level for distance >=3 rooms.
		if (distance >= 3 && !room.myStorage) return reservedRoom;

		// Start with rooms that are reachable. Typically this is distance 3, diamond shaped area.
		let rooms = Object.keys(room.reachableRoomsToReserve)

		if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental all rooms: ' + rooms.join());
		if (options.centerRoomsOnly) {
			rooms = rooms.filter(f => Cartographer.isCenterRoom(f));
			if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental options.centerRoomsOnly: ' + rooms.join());
		}
		if (options.sectorRoomsOnly) {
			rooms = rooms.filter(f => Cartographer.getSector(room.name) === Cartographer.getSector(f));
			if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental options.sectorRoomsOnly: ' + rooms.join());
		}

		// Filter out rooms that are already reserved by any room so far.
		rooms = rooms.filter(f => !reservedRooms[f]);
		if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental filter previously reserved: ' + rooms.join());

		// Filter out rooms we have not visited yet. Let scouts/observers go there first.
		rooms = rooms.filter(f => RoomIntel.getVisited(f));
		if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental filter visited: ' + rooms.join());

		// Filter out rooms that are beyond our current maximum distance, travel wise.
		// For example if the creep would have to walk around an avoided room.
		rooms = rooms.filter(f => Cartographer.findRouteDistance(room.name, f) === distance);
		if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental filter distance: ' + rooms.join());

		// This is an if, not a while. Only one room will be returned.
		if (rooms.length) {
			// Sort our reserve rooms.
			rooms = _.sortByOrder(rooms, [
				// Our room list may contain route distances 1-3, sort on closest ones first.
				sortRouteDistance => room.roomSortRouteDistance(sortRouteDistance)

				// Would this room put us over the max? If not, choose it first.
				// In other words save big rooms for the last choice.
				, sortCost => room.roomSortExceedMaxCost(sortCost)

				// Same sector rooms are better.
				, sortSector => room.roomSortSector(sortSector)

				// How many sources does this room have?
				, sortSources => room.roomSortSources(sortSources)

				// Is this is controller room, source keeper room, or core room?
				, sortType => room.roomSortType(sortType)

				// Find rooms same distance, but further walking distance away from other rooms.
				, sortOtherSpawnDistance => room.roomSortOtherSpawnDistance(sortOtherSpawnDistance, distance)

				// How many other rooms is this room reachable by?
				, sortOtherSpawnReachable => room.roomSortOtherSpawnReachable(sortOtherSpawnReachable, distance)

				// Physically closer rooms.
				// Rooms that curve back to spawn are nice since trails can be shorter when bending corners.
				// Is this even relevent if we are using a fixed range test?
				, sortRoomDistance => room.roomSortRoomDistance(sortRoomDistance)

				// Deprioritize crossing highways.
				, sortRouteContainsHighway => room.roomSortRouteContainsHighway(sortRouteContainsHighway)

				// Rooms that curve back to spawn are nice since trails can be shorter when bending corners.
				, sortRoomRange => room.roomSortRoomRange(sortRoomRange)
			]);

			if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental picking first from: ' + rooms.join());

			// ALLOW TO EXCEED METHOD
			// Take the first best room, and claim it as ours.
			// This may put us over our limit, but thats okay....as long as it doesn't exceed our total ability of cpu or creeps.
			reservedRoom = rooms.find(f =>
				(room.getCpuCostForWorkRoom(f) <= room.maxReserveCpuCapacity)
				&& (room.getCreepCostForWorkRoom(f) <= room.maxReserveCreepCapacity)
			);

			if (reservedRoom) {
				// Update the cpu cost of this room.
				cost = room.getCpuCostForWorkRoom(reservedRoom);
				room.memory.reserveCpuCost = (room.memory.reserveCpuCost || 0) + cost;

				// Update the creep cost of this room.
				creeps = room.getCreepCostForWorkRoom(reservedRoom);
				room.memory.reserveCreeps = (room.memory.reserveCreeps || 0) + creeps;

				if (options.debug && (options.debugRoom ? room.name === options.debugRoom : true)) room.logRoom('getReservedRoomsSortedAutoIncremental adding: ' + reservedRoom);
			}
		}

		// Return our list of rooms. Only one room is returned.
		return reservedRoom;
	}

	// Is this a dupe function of oxenNeededByColony?
	Room.prototype.getOxenCountForWorkRoom = function(workRoom) {
		let energyCapacity = GameManager.getRoomSourceEnergyCapacity(workRoom, this.controller.level);
		let carry = this.oxCarryCapacity || CARRY_CAPACITY;
		let energyPerTick = energyCapacity / ENERGY_REGEN_TIME;
		let routeDistanceRoundTrip = Cartographer.findRouteDistance(this.name, workRoom) * 50 * 2;
		let carryPerTick = carry / routeDistanceRoundTrip;

		// Round down so oxen aren't standing around.
		// But ensure that at least one ox is assigned if there is energy in the room.
		let oxen = energyPerTick / carryPerTick;
		if ((oxen < 1) && energyPerTick) oxen = 1;

		// Return the final result.
		return Math.ceil(oxen);
	}

	/**
	 * Return the estimated number of creeps needed for the room times our (flag variable) cpu cost per creep (~0.5).
	 */
	Room.prototype.getCpuCostForWorkRoom = function(workRoom) {
		return this.getCreepCostForWorkRoom(workRoom) * ReserveManager.creepCpuReserveCost;
	}

	/**
	 * Returns a very rough estimate of number of creeps this reserve room will need.
	 */
	Room.prototype.getCreepCostForWorkRoom = function(workRoom) {
		let distance = Cartographer.findRouteDistance(this.name, workRoom);

		let farmers = GameManager.getRoomSourceCount(workRoom);
		let oxens = this.getOxenCountForWorkRoom(workRoom);
		let preachers = Cartographer.isControllerRoom(workRoom) ? 1 : 0;
		let executioners = Cartographer.isSKRoom(workRoom) ? 1 : 0;
		let scavengers = Cartographer.isSKRoom(workRoom) ? distance : 0;

		// We will include some overhead for dedgers, as they will likely spawn/be maintained by the room asking for this data.
		let dredgers = Cartographer.isCenterRoom(workRoom) ? 1 : 0;
		let jackasses = Cartographer.isCenterRoom(workRoom) ? 2 : 0;

		// Return the final result.
		return farmers + oxens + preachers + executioners + scavengers + dredgers + jackasses;
	}

	Object.defineProperty(Room.prototype, 'maxReserveCreepCapacity', {
		get() {
			if (typeof this._maxReserveCreepCapacity === "undefined") {
				let reservePercent = 1;
				if (this.atMaxLevel) {
					if (this.isMaxActiveRoomClosestToNonMaxNonTerminalColony) {
						reservePercent = Config.params.RESERVE_CREEP_ASSIST_PERCENT;
					}
					else {
						reservePercent = Config.params.RESERVE_CREEP_MAXLEVEL_PERCENT;
					}
				}

				this._maxReserveCreepCapacity = Math.floor(this.estimatedCreepSpawnCapacity * reservePercent);
			}
			return this._maxReserveCreepCapacity;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * The maximum cpu capacity of this room that can be used for reserving.
	 */
	Object.defineProperty(Room.prototype, 'maxReserveCpuCapacity', {
		get() {
			return Math.floor(this.maxReserveCreepCapacity * ReserveManager.creepCpuReserveCost);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'estimatedCreepSpawnCapacity', {
		get() {
			if (typeof this._estimatedCreepSpawnCapacity === "undefined") {
				let worstCaseCreepSize = Math.min(MAX_CREEP_SIZE, Math.floor(this.energyCapacityAvailable / BODYPART_COST[CARRY]));
				let timeToSpawnCreep = worstCaseCreepSize * CREEP_SPAWN_TIME;
				// Exclude Golddiggers from the bonus. They are temporary and will be moving around, don't let this interfer with room selection.
				let powerBonus = (this.operateSpawnLevel && this.powerCreep && (this.powerCreep.name.substring(0, 1) !== 'g')) ? POWER_INFO[PWR_OPERATE_SPAWN].effect[this.operateSpawnLevel - 1] : 1;
				let timetoSpawnPowerCreep = worstCaseCreepSize * CREEP_SPAWN_TIME * powerBonus;
				let averageSpawnRoomDelay = Math.floor(GameManager.empireSpawnRoomsActive.length / 2);
				let spawnsPerLifetime = Math.floor(CREEP_LIFE_TIME / (timeToSpawnCreep + averageSpawnRoomDelay));
				let powerSpawnsPerLifetime = Math.floor(CREEP_LIFE_TIME / (timetoSpawnPowerCreep + averageSpawnRoomDelay));

				// We will assume will have 1 spawn powered.
				// The calculation will also work if we don't have a power creep yet, since there will be no bonus applied.
				let creepsPerRoom = powerSpawnsPerLifetime + (spawnsPerLifetime * (GameManager.getSpawnsByRoomName(this.name).length - 1));

				this._estimatedCreepSpawnCapacity = creepsPerRoom;
			}
			return this._estimatedCreepSpawnCapacity;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reserveCpuCost', {
		get() {
			return this.memory.reserveCpuCost || 0;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reserveCreeps', {
		get() {
			return this.memory.reserveCreeps || 0;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedRoomNamesHash', {
		get() {
			return this.memory.reservedRooms || {};
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedRoomNames', {
		get() {
			return Object.keys(this.memory.reservedRooms || {});
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reserveRouteRoomNames', {
		get() {
			if (typeof this._reserveRouteRoomNames === "undefined") {
				this._reserveRouteRoomNames = utils.unique(this.reservedRoomNames.map(m => Cartographer.findRouteRooms(this.name, m)).flatten());
			}
			return this._reserveRouteRoomNames;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reservedRoomNamesWithConstructionSites', {
		get() {
			if (typeof this._reservedRoomNamesWithConstructionSites === "undefined") {
				this._reservedRoomNamesWithConstructionSites = this.reserveRouteRoomNames.filter(f =>
					GameManager.myConstructionSiteRoomNamesHash[f]
				);
			}
			return this._reservedRoomNamesWithConstructionSites;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Returns the amount of construction site progress in route to each reserved room.
	 * Includes this room, the reserve room, and any rooms on the route.
	 */
	Object.defineProperty(Room.prototype, 'reservedRoomNamesWithConstructionSitesProgressRemaining', {
		get() {
			if (typeof this._reservedRoomNamesWithConstructionSitesProgressRemaining === "undefined") {
				this._reservedRoomNamesWithConstructionSitesProgressRemaining = _.sum(this.reservedRoomNamesWithConstructionSites.map(m =>
					Game.rooms[m] ? Game.rooms[m].myConstructionSitesProgressRemaining : 0
				));
			}
			return this._reservedRoomNamesWithConstructionSitesProgressRemaining;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reserveRoomNamesWithConstructionSiteProgressRemainingAfterCurrentConstructorCreeps', {
		get() {
			if (typeof this._reserveRoomNamesWithConstructionSiteProgressRemainingAfterCurrentConstructorCreeps === "undefined") {
				this._reserveRoomNamesWithConstructionSiteProgressRemainingAfterCurrentConstructorCreeps = Math.max(this.reservedRoomNamesWithConstructionSitesProgressRemaining - this.myConstructorCreepBuildPowerTTL, 0);
			}
			return this._reserveRoomNamesWithConstructionSiteProgressRemainingAfterCurrentConstructorCreeps;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This method plays into how rooms are reserved.
	 * We are leaving highway rooms as the last rooms to reserve, since they will be busy farming.
	 * So if they DO reserve (lots of CPU) they will not make trails or ox with work parts.
	 */
	Object.defineProperty(Room.prototype, 'shouldCreateSourceTrails', {
		get() {
			if (typeof this._shouldCreateSourceTrails === "undefined") {
				this._shouldCreateSourceTrails = !!(this.isSectorClaimed || !this.isHighwayAccessRoom || GameManager.isCpuSpawnMaxed);
			}
			return this._shouldCreateSourceTrails;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Returns an array of the top 2 data object for the first two containers found that could use an ox assignment; Null otherwise.
	 * Because of caching, only works for one ox at a time per tick.
	 */
	Object.defineProperty(Room.prototype, 'reservedRoomSourceContainerData', {
		get() {
			if (typeof this._reservedRoomSourceContainerData === "undefined") {
				this._reservedRoomSourceContainerData = [];
				let oxCarryCapacity = this.oxCarryCapacity * Config.params.OX_CAPACITY_FUDGE_PERCENT;
				let reservedRoomNames = this.reservedRoomNames;

				for (let i=0; i<reservedRoomNames.length && this._reservedRoomSourceContainerData.length < 2; i++) {
					let workRoom = Game.rooms[reservedRoomNames[i]];
					if (!workRoom) continue;

					// Don't send oxen to rooms that have lethals.
					if (RoomIntel.getLethalHostilesTTL(workRoom.name)) continue;

					let sourceContainerData = [];
					let sourcesWithSourceContainer = workRoom.sources.filter(source => source.sourceContainer);

					if (sourcesWithSourceContainer.length) {
						// We have at least one source container, so that means the room is container-enabled.
						sourceContainerData = sourcesWithSourceContainer.map(source => {
							return {
								id: source.sourceContainer.id
								, pos: source.sourceContainer.pos
								, moveToPos: source.sourceContainerRoadPos
								, roomName: workRoom.name
								, resourceType: RESOURCE_ENERGY
								, pathLength: source.sourcePathLength
								, amount: source.sourceContainer.store.getUsedCapacity(RESOURCE_ENERGY)
								, freeCapacity: source.sourceContainer.store.getFreeCapacity()
							}
						});
					}
					else {
						// No source containers, so look for energy dropped on the ground.
						sourceContainerData = workRoom.droppedEnergy.map(energy => {
							return {
								id: energy.id
								, pos: energy.pos
								, moveToPos: null
								, roomName: workRoom.name
								, resourceType: RESOURCE_ENERGY
								, pathLength: 1
								, amount: energy.amount
								, freeCapacity: 1  // Just need a non-zero number here to prevent double-lookup of lookForEnergy.
							}
						});
					}

					// Include sort by to get the largest amount first.
					let result = _.sortBy(sourceContainerData.filter(f =>
						// Need to have a valid path established.
						//&& f.pathLength

						// Make sure there is a healthy amount in the container before we spawn new oxen.
						(f.amount >= oxCarryCapacity)

						// Only look for energy if there is no free capacity left in the container.
						&& (f.amount + (f.freeCapacity ? 0 : f.pos.lookForEnergyAmount()) >= CreepManager.getOxCapacityByFocusId(f.id) + oxCarryCapacity)
					), sortByAmount => -sortByAmount.amount);

					// Once we find the first good container, bail out.
					if (result.length) {
						this._reservedRoomSourceContainerData = this._reservedRoomSourceContainerData.concat(result);
					}
				};
			}
            return this._reservedRoomSourceContainerData;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasQueueForReservedRoomSources', {
		get() {
			if (typeof this._hasQueueForReservedRoomSources === "undefined") {
				// For when we only have 1 room reserved, then queue is full at 1 source. Otherwise, wait till we have 2 so there aren't ox standing around.
				this._hasQueueForReservedRoomSources = this.reservedRoomSourceContainerData.length >= Math.min(this.reservedRoomNames.length, 2);
			}
            return this._hasQueueForReservedRoomSources;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isOxSpawning', {
		get() {
			if (typeof this._isOxSpawning === "undefined") {
				// TODO: Can this be done by looking at our 3 spawns and determining if one of them has an ox role?
				this._isOxSpawning = !!CreepManager.getOxenByWorkRoom(this.name).find(f => f.spawning);
			}
            return this._isOxSpawning;
        },
        configurable: true, enumerable: true,
	});

	/**
	 * This method is cached, even tho workroom will get updated, with the intention of only
	 * reassigning a workroom to one ox at a time.  This eases CPU lookups based on workroom changing.
	 */
	Object.defineProperty(Room.prototype, 'myIdleOxenSorted', {
		get() {
			if (typeof this._myIdleOxenSorted === "undefined") {
				// Bootstrap for early game when no storage and just waiting around to fill up spawn structures.
				// Update work room is later game when just waiting around.
				const tasks = {
					[Config.tasks.BOOTSTRAP]: true
					, [Config.tasks.UPDATE_WORKROOM_OX]: true
				}
				this._myIdleOxenSorted = _.sortBy(CreepManager.getOxenByWorkRoom(this.name).filter(f =>
					// Has to be one of the tasks that indicate done (or nearly done).
					!!tasks[f.task]
				), s => -(s.ticksToLive || CREEP_LIFE_TIME));
			}
			return this._myIdleOxenSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'isYoungestIdleOx', {
		get() {
			let idle = this.room.myIdleOxenSorted[0];
			if (idle) {
				return idle.id === this.id;
			}
			return false;
		},
		configurable: true, enumerable: true,
	});

}
