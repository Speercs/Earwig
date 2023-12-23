"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

	Object.defineProperty(Room.prototype, 'testingFlag', {
		get() {
			return FlagManager.testingFlag && (FlagManager.testingFlag.pos.roomName == this.name);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyUnsafe', {
		get() {
			if (typeof this._colonyUnsafe === "undefined") {
				// This does need to retain the my check as it is called in many rooms and this check only applies to colonies.
				this._colonyUnsafe = RoomIntel.getLethalHostilesTTL(this.name) && this.my && !this.safeMode
			}
			return this._colonyUnsafe;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousPlayerHostilesInMyRoom', {
		get() {
			if (typeof this._dangerousPlayerHostilesInMyRoom === "undefined") {
				this._dangerousPlayerHostilesInMyRoom = [];
				if (RoomIntel.getDangerousPlayerHostilesTTL(this.name)) {
					// If my room (which has spawns in it) has a creep inside the standard boarders, then safe mode baby!
					this._dangerousPlayerHostilesInMyRoom = this.dangerousPlayerHostiles.filter(f => f.pos.isInsideOfWall);
				}
			}
			return this._dangerousPlayerHostilesInMyRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalHostilesInMyRoom', {
		get() {
			if (typeof this._lethalHostilesInMyRoom === "undefined") {
				this._lethalHostilesInMyRoom = [];
				if (RoomIntel.getLethalHostilesTTL(this.name)) {
					// If my room (which has spawns in it) has a creep inside the standard boarders, then safe mode baby!
					this._lethalHostilesInMyRoom = this.lethalHostiles.filter(f => f.pos.isInsideOfWall);
				}
			}
			return this._lethalHostilesInMyRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyBreached', {
		get() {
			if (typeof this._colonyBreached === "undefined") {
				this._colonyBreached = this.lethalHostilesInMyRoom.length && !this.safeMode
			}
			return this._colonyBreached;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isReinforced', {
		get() {
			if (typeof this._isReinforced === "undefined") {
				this._isReinforced = !this.colonyBreached && this.colonyTowers.length
			}
			return this._isReinforced;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyBreachedByPlayer', {
		get() {
			if (typeof this._colonyBreachedByPlayer === "undefined") {
				this._colonyBreachedByPlayer = this.dangerousPlayerHostilesInMyRoom.length && !this.safeMode
			}
			return this._colonyBreachedByPlayer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsArcher', {
		get() {
			if (typeof this._roomNeedsArcher === "undefined") {
				this._roomNeedsArcher = !!(
					RoomIntel.getRoomNeedsDefender(this.name)
					&& GameManager.okToSpawnArcher
					&& (CreepManager.getArchersByFocusId(this.controller.id).length < Config.params.MAX_ARCHERS_PER_ASSIGNEDROOM)
				);
			}
			return this._roomNeedsArcher;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsHound', {
		get() {
			if (typeof this._roomNeedsHound === "undefined") {
				this._roomNeedsHound = !!(
					RoomIntel.getRoomNeedsDefender(this.name)
					&& GameManager.okToSpawnHound
					&& (CreepManager.getHoundsByFocusId(this.controller.id).length < Config.params.MAX_HOUNDS_PER_ASSIGNEDROOM)
				);
			}
			return this._roomNeedsHound;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Returns the worst case damage (max range) done by all towers in this room.
	 */
    Object.defineProperty(Room.prototype, 'friendlyTowerDamagePower', {
		get() {
            if (typeof this._friendlyTowerDamagePower === "undefined") {
                // Initialize damage to zero.
                this._friendlyTowerDamagePower = 0;

				// Get the amount from towers.
				if (!this.testingFlag) {
					this.colonyTowers.forEach(tower => {
						this._friendlyTowerDamagePower += tower.getAttackAmount(this);
					});
				}
            }
			return this._friendlyTowerDamagePower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'friendlyDamagePower', {
		get() {
            if (typeof this._friendlyDamagePower === "undefined") {
                // Initialize damage to zero.
                this._friendlyDamagePower = 0;

				// Get the amount from towers.
				this._friendlyDamagePower += this.friendlyTowerDamagePower;

				// Get the amount of damage from each creep in the room.
				CreepManager.getDefendersByWorkRoom(this.name).forEach(creep => {
					this._friendlyDamagePower += creep.attackPower;
					this._friendlyDamagePower += creep.rangedAttackPower;
				});
            }
			return this._friendlyDamagePower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'activeFriendlyDamagePowerInRoom', {
		get() {
            if (typeof this._activeFriendlyDamagePowerInRoom === "undefined") {
                // Initialize damage to zero.
                this._activeFriendlyDamagePowerInRoom = 0;

				// Get the amount from towers.
				this._activeFriendlyDamagePowerInRoom += this.friendlyTowerDamagePower;

				// Get the amount of damage from each creep in the room.
				this.myCreeps.forEach(creep => {
					this._activeFriendlyDamagePowerInRoom += creep.activeAttackPower;
					this._activeFriendlyDamagePowerInRoom += creep.activeRangedAttackPower;
				});
            }
			return this._activeFriendlyDamagePowerInRoom;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'activeFriendlyDamagePower', {
		get() {
            if (typeof this._activeFriendlyDamagePower === "undefined") {
                // Initialize damage to zero.
                this._activeFriendlyDamagePower = 0;

				// Get the amount from towers.
				this._activeFriendlyDamagePower += this.friendlyTowerDamagePower;

				// Get the amount of damage from each creep in the room.
				CreepManager.getDefendersByWorkRoom(this.name).forEach(creep => {
					this._activeFriendlyDamagePower += creep.activeAttackPower;
					this._activeFriendlyDamagePower += creep.activeRangedAttackPower;
				});
            }
			return this._activeFriendlyDamagePower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'friendlyHealPower', {
		get() {
            if (typeof this._friendlyHealPower === "undefined") {
                this._friendlyHealPower = _.sum(CreepManager.getDefendersByWorkRoom(this.name), s=>s.healPower);
            }
			return this._friendlyHealPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'activeFriendlyHealPower', {
		get() {
            if (typeof this._activeFriendlyHealPower === "undefined") {
                this._activeFriendlyHealPower = _.sum(CreepManager.getDefendersByWorkRoom(this.name), s=>s.activeHealPower);
            }
			return this._activeFriendlyHealPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'hostileDamagePower', {
		get() {
            if (typeof this._hostileDamagePower === "undefined") {
                // Initialize damage to zero.
                this._hostileDamagePower = 0;

                // If we are in my room with safemode, then we never take damage.
                if (!this.my || !this.safeMode) {
                    // Get the amount from towers.
                    this.hostileTowersWithEnergy.forEach(tower => {
                        this._hostileDamagePower += tower.getAttackAmount(this);
                    });

					// Get the amount of damage from each creep in the room.
                    this.nonSourceKeeperHostiles.forEach(creep => {
                        this._hostileDamagePower += creep.activeAttackPower;
                        this._hostileDamagePower += creep.activeRangedAttackPower;
                    })
                }
            }
			return this._hostileDamagePower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'hostileHealPower', {
		get() {
            if (typeof this._hostileHealPower === "undefined") {
                this._hostileHealPower = _.sum(this.nonSourceKeeperHostiles, s=>s.healPower);
            }
			return this._hostileHealPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'hostileAttackPower', {
		get() {
            if (typeof this._hostileAttackPower === "undefined") {
                this._hostileAttackPower = _.sum(this.nonSourceKeeperHostiles, s=>s.attackPower);
            }
			return this._hostileAttackPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'hostileRangedAttackPower', {
		get() {
            if (typeof this._hostileRangedAttackPower === "undefined") {
                this._hostileRangedAttackPower = _.sum(this.nonSourceKeeperHostiles, s=>s.rangedAttackPower);
            }
			return this._hostileRangedAttackPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'lethalHostileTicksToLive', {
		get() {
            if (typeof this._lethalTicksToLive === "undefined") {
                this._lethalTicksToLive = Math.max.apply(Math, this.lethalHostiles.map(m => m.ticksToLive));
            }
			return this._lethalTicksToLive;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'invadersTicksToLive', {
		get() {
            if (typeof this._invadersTicksToLive === "undefined") {
                this._invadersTicksToLive = Math.max.apply(Math, this.invaders.map(m => m.ticksToLive));
            }
			return this._invadersTicksToLive;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'activeHostileHealPower', {
		get() {
            if (typeof this._activeHostileHealPower === "undefined") {
                this._activeHostileHealPower = _.sum(this.nonSourceKeeperHostiles, s=>s.activeHealPower);
            }
			return this._activeHostileHealPower;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'roomNeedsDefender', {
		get() {
			if (typeof this._roomNeedsDefender === "undefined") {
				this._roomNeedsDefender = !!(
					// Basic check to see if we even have hostiles in this room.
					RoomIntel.getHostilesTTL(this.name)

					// For my rooms, towers will almost always be enough to take down hostile invaders.
					&& (!this.my || (this.friendlyTowerDamagePower <= RoomIntel.getHostileHealPower(this.name)))

					// Our defender creeps are now part of the calculation.
					&& (
						// My management room (my or reservedByMe) include towers and our work room defender creeps.
						(
							this.myManagement
							// Test for power in room as its less expensive.
							&& ((this.activeFriendlyDamagePowerInRoom * Config.params.DEFEND_ROOM_FRIENDLY_MULTIPLIER) <= RoomIntel.getHostileHealPower(this.name))
							// This is expensive call to get creeps by workroom.
							&& ((this.activeFriendlyDamagePower * Config.params.DEFEND_ROOM_FRIENDLY_MULTIPLIER) <= RoomIntel.getHostileHealPower(this.name))
						)

						// Screeps need to stop off the corner so we can determine which direction they are going.
						|| (this.isHighwayCorridor && RoomIntel.getScreepsWithCarryTTL(this.name) && CreepManager.getRangersByWorkRoom(this.name).length)
					)
				);
			}
			return this._roomNeedsDefender;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsBoostedDefender', {
		get() {
			if (typeof this._roomNeedsBoostedDefender === "undefined") {
				this._roomNeedsBoostedDefender = !!(
					// Basic check to see if we even have hostiles in this room.
					RoomIntel.getHostilesTTL(this.name)

					// For my rooms, towers will almost always be enough to take down hostile invaders.
					&& (!this.my || (this.friendlyTowerDamagePower <= RoomIntel.getHostileHealPower(this.name)))

					// Our defender creeps are now part of the calculation.
					&& (
						// My management room (my or reservedByMe) include towers and our work room defender creeps.
						(
							(this.myManagement && !this.isCenterRoom)
							// Only need to spawn if boosted players are in our rooms.
							&& RoomIntel.getLethalBoostedPlayerHostilesTTL(this.name)
							// Test for power in room as its less expensive.
							&& ((this.activeFriendlyDamagePowerInRoom * Config.params.DEFEND_ROOM_FRIENDLY_MULTIPLIER) <= RoomIntel.getHostileHealPower(this.name))
							// This is expensive call to get creeps by workroom.
							&& ((this.activeFriendlyDamagePower * Config.params.DEFEND_ROOM_FRIENDLY_MULTIPLIER) <= RoomIntel.getHostileHealPower(this.name))
						)
						// Screeps need to stop off the corner so we can determine which direction they are going.
						|| (this.isHighwayCorridor && RoomIntel.getScreepsWithCarryTTL(this.name))
					)
				);
			}
			return this._roomNeedsBoostedDefender;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyDefendRoomsPrioritized', {
		get() {
			if (typeof this._colonyDefendRoomsPrioritized === "undefined") {

				// If we have a screeps room, we are allowed to travel further.
				// We only care about extending the base length when the screep room
				// is not on a corner (meaning they are on the move)
				// and they are in our sector highways (so moving towards or by us, not away from us).
				let rooms = GameManager.empireDefendRooms.filter(f =>
					Cartographer.isInRouteDistance(this.name, f,
						(GameManager.screepsWithCarryRoomNamesHash[f] && this.isHighwayAccessRoom && Cartographer.isRoomInSectorArea(f, this.name)) ? Config.params.MAX_SCREEP_RANGE : Config.params.MAX_DEFEND_RANGE
					)
				);

				this._colonyDefendRoomsPrioritized = _.sortByOrder(rooms, [
					sortMyRoom => RoomIntel.getMy(sortMyRoom) ? 0 : 1
					, sortScreepsInRoom => RoomIntel.getScreepsWithCarryTTL(sortScreepsInRoom) ? 0 : 1
					, sortInvadersInRoom => RoomIntel.getInvadersTTL(sortInvadersInRoom) ? 0 : 1
					, sortMySpawnReservedRoom => this.reservedRoomNamesHash[sortMySpawnReservedRoom] ? 0 : 1
					, sortDistance => Cartographer.findRouteDistance(this.name, sortDistance)
					, sortRoomName => sortRoomName
				]);
			}
			return this._colonyDefendRoomsPrioritized;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsDefender', {
		get() {
			if (typeof this._colonyNeedsDefender === "undefined") {
				this._colonyNeedsDefender = null;

				if (this.canDefendColony) {
					// Filter out screep rooms that are at the corners, we don't know which way they will go.
					let rooms = this.colonyDefendRoomsPrioritized.filter(f => !(GameManager.screepsWithCarryRoomNamesHash[f] && Cartographer.isHighwayCorner(f)));

					for (let i=0; i<rooms.length; i++) {
						let roomName = rooms[i];
						// Our reserved rooms need special handling.
						// Invaders will NOT despawn just by leaving the room. Just assume we need one defender until visibility is gained into room.
						if (
							RoomIntel.getRoomNeedsDefender(roomName)
							&&  (
								Game.rooms[roomName]
								// If the room is reserved but we have no visibility, best we can do is
								// determine if there is at least one nearby defender sent to investigate.
								|| (!Game.rooms[roomName] && !CreepManager.getDefendersByWorkRoom(roomName).length)
							)
						) {
							this._colonyNeedsDefender = roomName;
							break;
						}
					}
				}
			}
			return this._colonyNeedsDefender;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsBoostedDefender', {
		get() {
			if (typeof this._colonyNeedsBoostedDefender === "undefined") {
				this._colonyNeedsBoostedDefender = null;

				if (this.canDefendColony && this.hasBoostStructures) {
					// Filter out screep rooms that are at the corners, we don't know which way they will go.
					let rooms = this.colonyDefendRoomsPrioritized.filter(f => !(GameManager.screepsWithCarryRoomNamesHash[f] && Cartographer.isHighwayCorner(f)));;

					for (let i=0; i<rooms.length; i++) {
						let roomName = rooms[i];
						// Our reserved rooms need special handling.
						// Invaders will NOT despawn just by leaving the room. Just assume we need one defender until visibility is gained into room.
						if (
							RoomIntel.getRoomNeedsBoostedDefender(roomName)
							&&  (
								Game.rooms[roomName]
								// If the room is reserved but we have no visibility, best we can do is
								// determine if there is at least one nearby defender sent to investigate.
								|| (!Game.rooms[roomName] && !CreepManager.getDefendersByWorkRoom(roomName).length)
							)
						) {
							this._colonyNeedsBoostedDefender = roomName;
							break;
						}
					}
				}
			}
			return this._colonyNeedsBoostedDefender;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Can this room even make a good remote defender? Need to be able to make heal parts.
	 */
	Object.defineProperty(Room.prototype, 'canDefendColony', {
		get() {
			if (typeof this._canDefendColony === "undefined") {
				this._canDefendColony = this.atSpawningEnergyCapacityForLevel(Config.params.DEFEND_EMPIRE_SPAWN_LEVEL) || this.isBestRoom;
			}
			return this._canDefendColony;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsArcher', {
		get() {
			if (typeof this._colonyNeedsArcher === "undefined") {
				// Find a room that needs a defender.
				let roomName = this.colonyNeedsDefender;

				// Then determine if we can create one.
				this._colonyNeedsArcher = !!(
					roomName
					&& (CreepManager.getArchersByFocusId(this.controller.id).length < Config.params.MAX_ARCHERS_PER_ASSIGNEDROOM)
					// Can this room even make a good remote defender?
					&& this.canDefendColony
					&& GameManager.okToSpawnArcher
				) ? roomName : null;
			}
			return this._colonyNeedsArcher;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsHound', {
		get() {
			if (typeof this._colonyNeedsHound === "undefined") {
				// Find a room that needs a defender.
				let roomName = this.colonyNeedsDefender;

				// Then determine if we can create one.
				this._colonyNeedsHound = !!(
					roomName
					&& (CreepManager.getHoundsByFocusId(this.controller.id).length < Config.params.MAX_HOUNDS_PER_ASSIGNEDROOM)
					// Can this room even make a good remote defender?
					&& this.canDefendColony
					&& GameManager.okToSpawnHound
				) ? roomName : null;
			}
			return this._colonyNeedsHound;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsRanger', {
		get() {
			if (typeof this._colonyNeedsRanger === "undefined") {
				// Find a room that needs a defender.
				let roomName = this.colonyNeedsBoostedDefender;

				// Then determine if we can create one.
				this._colonyNeedsRanger = !!(
					roomName
					// We are only spawning rangers if being attacked by boosted lethal players in our management rooms, or screeps are on the same highway as us.
					&& (
						!GameManager.screepsWithCarryRoomNamesHash[roomName]
						|| this.accessibleHighways.find(f => Cartographer.getHighwayGroup(f) == Cartographer.getHighwayGroup(roomName))
					)
					// Expensive call try to avoid.
					&& GameManager.okToSpawnRanger
					// Do this check near the end, so we don't incur the overhead of checking for ranger if we don't need it.
					&& (CreepManager.getRangersByAssignedRoom(this.name).length < Config.params.MAX_RANGERS_PER_ASSIGNEDROOM)
				) ? roomName : null;
			}
			return this._colonyNeedsRanger;
		},
		configurable: true, enumerable: true,
	});

	// This is the primary method for getting what rooms need defense from this room.
	// Archers will move from distant rooms to these rooms, even if they are initially out of range or the room doesn't need them.
	// Called from manageCreeps only.
	Object.defineProperty(Room.prototype, 'colonyDefendRooms', {
		get() {
			if (typeof this._colonyDefendRooms === "undefined") {
				this._colonyDefendRooms = [];

				// Add this room if its a spawn room and has hostiles in it.
				if (RoomIntel.getHostilesTTL(this.name)) this._colonyDefendRooms.push(this.name);

				// Rooms we want to send defenders to are:
                // 1. any hostiles that are in our spawn room (above).
                // 2. dangerous player hostiles (but not scouts) in reserved rooms under my management.
                // 3. hostile structures that are in our reserved rooms (should be invader cores mostly).
				// 4. any lethal hostiles including invaders in reserved rooms.
				if (this.dangerousPlayerHostilesInReservedRooms.length) this._colonyDefendRooms = this._colonyDefendRooms.concat(this.dangerousPlayerHostilesInReservedRooms);
				if (this.hostileStructuresInReservedRooms.length) this._colonyDefendRooms = this._colonyDefendRooms.concat(this.hostileStructuresInReservedRooms);
				if (this.lethalHostilesInReservedRooms.length) this._colonyDefendRooms = this._colonyDefendRooms.concat(this.lethalHostilesInReservedRooms);

				// Eliminate duplicates.
				this._colonyDefendRooms = utils.unique(this._colonyDefendRooms);
			}
			return this._colonyDefendRooms;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalHostilesInReservedRooms', {
		get() {
			if (typeof this._lethalHostilesInReservedRooms === "undefined") {
				this._lethalHostilesInReservedRooms = [];

				// Check for hostiles in the reserved rooms, which means the room may not be reserved or visible.
				this.reservedRoomNames.forEach(room => {
				//this.reservedRouteRoomNames.forEach(room => {
					if (
						// Highways are excluded from defense.
						!Cartographer.isHighwayRoom(room)

						// Was there a lethal in this room?
						&& RoomIntel.getLethalHostilesTTL(room)
					) {
						this._lethalHostilesInReservedRooms.push(room);
					}
				});

				// Eliminate duplicates. Only needed when using reservedRouteRoomNames.
				//this._lethalHostilesInReservedRooms = utils.unique(this._lethalHostilesInReservedRooms);
			}
			return this._lethalHostilesInReservedRooms;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousPlayerHostilesInReservedRooms', {
		get() {
			if (typeof this._dangerousPlayerHostilesInReservedRooms === "undefined") {
				this._dangerousPlayerHostilesInReservedRooms = [];

				// Check for hostiles in the reserved rooms, which means the room may not be reserved or visible.
				this.reservedRoomNames.forEach(room => {
				//this.reservedRouteRoomNames.forEach(room => {
					if (
						// Highways are excluded from defense.
						!Cartographer.isHighwayRoom(room)

						// Was there a dangerous player hostile in this room?
						&& RoomIntel.getDangerousPlayerHostilesTTL(room)
					) {
						this._dangerousPlayerHostilesInReservedRooms.push(room);
					}
				});

				// Eliminate duplicates. Only needed when using reservedRouteRoomNames.
				//this._dangerousPlayerHostilesInReservedRooms = utils.unique(this._dangerousPlayerHostilesInReservedRooms);
			}
			return this._dangerousPlayerHostilesInReservedRooms;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileStructuresInReservedRooms', {
		get() {
			if (typeof this._hostileStructuresInReservedRooms === "undefined") {
				this._hostileStructuresInReservedRooms = [];

				// Check for hostile structures in the reserved rooms, which means the room may not be reserved or visible.
				this.reservedRoomNames.forEach(room => {
					if (
                        // Only care about controller rooms; not source keeper rooms or cores which will never spawn an invader core.
						Cartographer.isControllerRoom(room)

                        // Hostile invader cores are the only kinds of structures that we care about.
						// The rest should be removed via claim/unclaim process.
						&& RoomIntel.getInvaderCore(room)
					) {
						this._hostileStructuresInReservedRooms.push(room);
					}
				});

			}
			return this._hostileStructuresInReservedRooms;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'destroyFlags', {
		get() {
			if (typeof this._destroyFlags === "undefined") {
				this._destroyFlags = FlagManager.destroyFlagsByRoomName(this.name);
			}
			return this._destroyFlags;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'destroyFlagsController', {
		get() {
			if (typeof this._destroyFlagsController === "undefined") {
				const types = {
					[C.DESTROY_FLAG_CONTROLLER]: true
				}
				this._destroyFlagsController = this.destroyFlags.filter(f => !!types[f.type]);
			}
			return this._destroyFlagsController;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'autonukeFlags', {
		get() {
			if (typeof this._autonukeFlags === "undefined") {
				this._autonukeFlags = FlagManager.autonukeFlagsByRoomName(this.name);
			}
			return this._autonukeFlags;
		},
		configurable: true, enumerable: true,
	});


	Object.defineProperty(Room.prototype, 'lastHostileEdgePosInRange1', {
		get() {
			if (typeof this._lastHostileEdgePosInRange1 === "undefined") {
                this._lastHostileEdgePosInRange1 = [];
				let lastHostileEdgePos = RoomIntel.getPlayerHostileLastEdgePos(this.name);
				if (lastHostileEdgePos) {
					let positions = lastHostileEdgePos.posInRange1NotBlockedByObjectOffsetEdge;
					this._lastHostileEdgePosInRange1 = _.sortByOrder(positions, [
						// Prefer longer ranges.
						sortRangeFromCenter => sortRangeFromCenter.rangeToCenter
						// Try to align to last hostile position.
						, sortDistanceToLastHostileEdgePos => sortDistanceToLastHostileEdgePos.getDistanceTo(lastHostileEdgePos)
					]);
				}
            }
            return this._lastHostileEdgePosInRange1;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lastHostileEdgePosInRange1FindFirst', {
		get() {
			if (typeof this._lastHostileEdgePosInRange1FindFirst === "undefined") {
				this._lastHostileEdgePosInRange1FindFirst = this.room.lastHostileEdgePosInRange1.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()) && !f.hasRoad);

				// First attempt is no roads, second attempt is with roads.
				if (!this._lastHostileEdgePosInRange1FindFirst) {
					this._lastHostileEdgePosInRange1FindFirst = this.room.lastHostileEdgePosInRange1.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));
				}
			}
			return this._lastHostileEdgePosInRange1FindFirst;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'lastHostileEdgePosInRange1FindNearBy', {
		get() {
			if (typeof this._lastHostileEdgePosInRange1FindNearBy === "undefined") {
				this._lastHostileEdgePosInRange1FindNearBy = this.room.lastHostileEdgePosInRange1.find(f => this.pos.inRange1(f) && (this.pos.isEqualTo(f) || !f.lookForCreep()) && !f.hasRoad);

				// First attempt is no roads, second attempt is with roads.
				if (!this._lastHostileEdgePosInRange1FindNearBy) {
					this._lastHostileEdgePosInRange1FindNearBy = this.room.lastHostileEdgePosInRange1.find(f => this.pos.inRange1(f) && (this.pos.isEqualTo(f) || !f.lookForCreep()));
				}
			}
			return this._lastHostileEdgePosInRange1FindNearBy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lastHostileEdgePosInRange3', {
		get() {
			if (typeof this._lastHostileEdgePosInRange3 === "undefined") {
                this._lastHostileEdgePosInRange3 = [];
				let lastHostileEdgePos = RoomIntel.getPlayerHostileLastEdgePos(this.name);;
				if (lastHostileEdgePos) {
					let positions = lastHostileEdgePos.posInRange3NotBlockedByObjectOffsetEdge;
					this._lastHostileEdgePosInRange3 = _.sortByOrder(positions, [
						// Prefer longer ranges.
						sortRangeFromCenter => sortRangeFromCenter.rangeToCenter
						// Try to align to last hostile position.
						, sortDistanceToLastHostileEdgePos => sortDistanceToLastHostileEdgePos.getDistanceTo(lastHostileEdgePos)
					]);
				}
            }
            return this._lastHostileEdgePosInRange3;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lastHostileEdgePosInRange3FindFirst', {
		get() {
			if (typeof this._lastHostileEdgePosInRange3FindFirst === "undefined") {
				this._lastHostileEdgePosInRange3FindFirst = this.room.lastHostileEdgePosInRange3.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()) && !f.hasRoad);

				// First attempt is no roads, second attempt is with roads.
				if (!this._lastHostileEdgePosInRange3FindFirst) {
					this._lastHostileEdgePosInRange3FindFirst = this.room.lastHostileEdgePosInRange3.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));
				}
			}
			return this._lastHostileEdgePosInRange3FindFirst;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'lastHostileEdgePosInRange3FindNearBy', {
		get() {
			if (typeof this._lastHostileEdgePosInRange3FindNearBy === "undefined") {
				this._lastHostileEdgePosInRange3FindNearBy = this.room.lastHostileEdgePosInRange3.find(f => this.pos.inRange1(f) && (this.pos.isEqualTo(f) || !f.lookForCreep()) && !f.hasRoad);

				// First attempt is no roads, second attempt is with roads.
				if (!this._lastHostileEdgePosInRange3FindNearBy) {
					this._lastHostileEdgePosInRange3FindNearBy = this.room.lastHostileEdgePosInRange3.find(f => this.pos.inRange1(f) && (this.pos.isEqualTo(f) || !f.lookForCreep()));
				}
			}
			return this._lastHostileEdgePosInRange3FindNearBy;
		},
		configurable: true, enumerable: true,
	});

}
