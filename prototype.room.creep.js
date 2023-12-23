"use strict";

/**
 * NAMING CONVENTION:
 *
 * All lower case: Derived from 'creeps'. These are spawned creeps using room.find(FIND_MY_CREEP).
 * "my" camel case: Derived form 'myCreeps'. These are the creeps in this room, and include spawning creeps.
 */

module.exports = function() {

	/**
	 * This method is faster than using CreepManager.creepsArray or Game.creeps.
	 * However, it does NOT return spawning creeps. So the length will be inaccurate for the purposes of spawning logic.
	 *
 	 * https://screeps.com/forum/topic/1409/game-creeps-filter-vs-room-find-find_my_creeps
	 */
	Object.defineProperty(Room.prototype, 'creeps', {
		get() {
			if (typeof this._creeps === "undefined") {
				// Including all creeps not just my own.
				this._creeps = this.find(FIND_CREEPS);
				if (Game.flags.FIND_CREEPS) utils.printStack(this.print, 'FIND_CREEPS');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_CREEPS')
			}
			return this._creeps;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This method is slower than using room.creeps or room.find(FIND_CREEPS)
	 * However, it DOES return spawning creeps. This is needed for spawning purposes.
	 */
	Object.defineProperty(Room.prototype, 'myCreeps', {
		get() {
			if (typeof this._myCreeps === "undefined") {
				// Use the GameManager supplied version of creeps in the current room.
				this._myCreeps = CreepManager.getCreepsByCurrentRoom(this.name);
			}
			return this._myCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsNotSpawning', {
		get() {
			if (typeof this._myCreepsNotSpawning === "undefined") {
				this._myCreepsNotSpawning = this.myCreeps.filter(f => !f.spawning);
			}
			return this._myCreepsNotSpawning;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsAtWork', {
		get() {
			if (typeof this._myCreepsAtWork === "undefined") {
				this._myCreepsAtWork = this.myCreeps.filter(f => f.inWorkRoom);
			}
			return this._myCreepsAtWork;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsAtWorkWorkParts', {
		get() {
			if (typeof this._myCreepsAtWorkWorkParts === "undefined") {
				this._myCreepsAtWorkWorkParts = _.sum(this.myCreepsAtWork, s => s.workParts);
			}
			return this._myCreepsAtWorkWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myTransporterCreeps', {
		get() {
			if (typeof this._myTransporterCreeps === "undefined") {
				this._myTransporterCreeps = this.myCreeps.filter(f => f.isFocusTransporter);
			}
			return this._myTransporterCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myTransporterCreepsIdle', {
		get() {
			if (typeof this._myTransporterCreepsIdle === "undefined") {
				this._myTransporterCreepsIdle = this.myTransporterCreeps.filter(f => f.store.getUsedCapacity() && f.isOnParkingSpot);
			}
			return this._myTransporterCreepsIdle;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myWorkRoomHighestPeonCreeps', {
		get() {
			if (typeof this._myWorkRoomHighestPeonCreeps === "undefined") {
				// Get peons who have the highest energy available when spawned.  This determines if a peon is a squire or not.
				this._myWorkRoomHighestPeonCreeps = CreepManager.getPeonsByFocusId(this.controller.id).filter(f => f.creepSpawnEnergyCapacityAvailable >= GameManager.empireHighestControllerEnergyCapacityAvailable);
			}
			return this._myWorkRoomHighestPeonCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'mySpawnedRogueCreepsUnassigned', {
		get() {
			const tasks = {
				[Config.tasks.BOOTSTRAP]: true
				, [Config.tasks.UPDATE_WORKROOM_ROGUE]: true
			}

			return CreepManager.getRoguesByFocusId(this.controller.id).filter(f =>
				!!tasks[f.task]
				&& !f.spawning
				&& (f.workRoom === f.assignedRoom)
				&& !f.store.getUsedCapacity()
			);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myExtractCreepsAtWork', {
		get() {
			if (typeof this._myExtractCreepsAtWork === "undefined") {
				const roles = {
					[Config.roles.MINER]: true
					, [Config.roles.DREDGER]: true
				}
				this._myExtractCreepsAtWork = this.myCreepsAtWork.filter(f => roles[f.role]);
			}
			return this._myExtractCreepsAtWork;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'king', {
		get() {
			if (typeof this._king === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.kingId) object = Game.getObjectById(this.memory.kingId);

				// Object wasn't in cache, so look for it.
				if (!object && this.controller && !this.isTemple) {
					// Special case, consider the creep to be null while spawning.
					object = CreepManager.getKingsByFocusId(this.controller.id).find(f => !f.spawning);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.kingId = object.id;
				}
				else {
					delete this.memory.kingId;
				}

				this._king = object || null;
            }
			return this._king;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'queen', {
		get() {
			if (typeof this._queen === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.queenId) object = Game.getObjectById(this.memory.queenId);

				// Object wasn't in cache, so look for it.
				if (!object && this.controller && !this.isTemple) {
					// Special case, consider the creep to be null while spawning.
					object = CreepManager.getQueensByFocusId(this.controller.id).find(f => !f.spawning);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.queenId = object.id;
				}
				else {
					delete this.memory.queenId;
				}

				this._queen = object || null;
            }
			return this._queen;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'rook', {
		get() {
			if (typeof this._rook === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.rookId) object = Game.getObjectById(this.memory.rookId);

				// Object wasn't in cache, so look for it.
				if (!object && this.controller && !this.isTemple) {
					// Special case, consider the creep to be null while spawning.
					object = CreepManager.getRooksByFocusId(this.controller.id).find(f => !f.spawning);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.rookId = object.id;
				}
				else {
					delete this.memory.rookId;
				}

				this._rook = object || null;
            }
			return this._rook;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'rogue', {
		get() {
			if (typeof this._rogue === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.rogueId) object = Game.getObjectById(this.memory.rogueId);

				// Object wasn't in cache, so look for it.
				if (!object && this.controller && !this.isTemple) {
					// Special case, consider the creep to be null while spawning.
					object = CreepManager.getRoguesByFocusId(this.controller.id).find(f => !f.spawning);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.rogueId = object.id;
				}
				else {
					delete this.memory.rogueId;
				}

				this._rogue = object || null;
            }
			return this._rogue;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myCreepsRenewing', {
		get() {
			const tasks = {
				[Config.tasks.RENEW]: true
				, [Config.tasks.RENEW2]: true
				, [Config.tasks.RENEW_TOPOFF]: true
			}
			// Unfortunately this cannot be cached, as a creeps task state can change in the creep processing loop.
			return this.myCreeps.filter(f => !!tasks[f.task]);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsExtracting', {
		get() {
			const tasks = {
				[Config.tasks.EXTRACT_MYROOM]: true
				, [Config.tasks.EXTRACT_REMOTEROOM]: true
			}
			// Unfortunately this cannot be cached, as a creeps task state can change in the creep processing loop.
			return this.myCreepsAtWork.filter(f => !!tasks[f.task]);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsBoosted', {
		get() {
            if (typeof this._myCreepsBoosted === "undefined") {
				this._myCreepsBoosted = this.myCreeps.filter(f => f.isBoostedByRole);
            }
			return this._myCreepsBoosted;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isUnboosting', {
		get() {
			const tasks = {
				[Config.tasks.UNBOOST]: true
			}
			// Unfortunately this cannot be cached, as a creeps task state can change in the creep processing loop.
			return !!tasks[this.task];
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsUnboosting', {
		get() {
			// Unfortunately this cannot be cached, as a creeps task state can change in the creep processing loop.
			return this.myCreeps.filter(f => f.isUnboosting);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myWounded', {
		get() {
            if (typeof this._myWounded === "undefined") {
                this._myWounded = this.myCreeps.filter(f => f.hits < f.hitsMax);
            }
			return this._myWounded;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myWoundedNotNearEdge', {
		get() {
            if (typeof this._myWoundedNotNearEdge === "undefined") {
				this._myWoundedNotNearEdge = this.myWounded.filter(f => !f.pos.isNearEdge && f.isGuardianCreep);
            }
			return this._myWoundedNotNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'myWoundedNotNearEdgeSameWorkRoom', {
		get() {
            if (typeof this._myWoundedNotNearEdgeSameWorkRoom === "undefined") {
				this._myWoundedNotNearEdgeSameWorkRoom = this.room.myWoundedNotNearEdge.filter(f => (this.workRoom === f.workRoom));
            }
			return this._myWoundedNotNearEdgeSameWorkRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'myCreepsAtArea3', {
		get() {
            if (typeof this._myCreepsAtArea3 === "undefined") {
                this._myCreepsAtArea3 = this.room.myCreeps.filter(f => f.pos.inRange3(this));
            }
			return this._myCreepsAtArea3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'myWoundedAtArea3', {
		get() {
            if (typeof this._myWoundedAtArea3 === "undefined") {
				this._myWoundedAtArea3 = this.room.myWounded.filter(f => this.pos.getRangeTo(f) <= 3);
            }
			return this._myWoundedAtArea3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'myCreepsNearBy', {
		get() {
            if (typeof this._myCreepsNearBy === "undefined") {
                this._myCreepsNearBy = this.room.myCreepsAtArea3.filter(f => this.pos.isNearTo(f));
            }
			return this._myCreepsNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'myWoundedNearBy', {
		get() {
            if (typeof this._myWoundedNearBy === "undefined") {
				this._myWoundedNearBy = this.room.myWounded.filter(f => this.pos.isNearTo(f));
            }
			return this._myWoundedNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'hasMyWoundedNearByMoreDamaged', {
		get() {
            if (typeof this._hasMyWoundedNearByMoreDamaged === "undefined") {
				this._hasMyWoundedNearByMoreDamaged = _.sortBy(this.myWoundedNearBy.filter(f => (f.damage > this.damage)), s => s.damage)[0];
            }
			return this._hasMyWoundedNearByMoreDamaged;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myWoundedNearEdge', {
		get() {
            if (typeof this._myWoundedNearEdge === "undefined") {
				this._myWoundedNearEdge = this.myWounded.filter(f => f.pos.isNearEdge);
            }
			return this._myWoundedNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'hasMyWoundedNearByCloserToCenter', {
		get() {
            if (typeof this._hasMyWoundedNearByCloserToCenter === "undefined") {
				this._hasMyWoundedNearByCloserToCenter = _.sortBy(this.myWoundedNearBy.filter(f => (f.id !== this.id) && (f.rangeToCenter < this.rangeToCenter)), s => this.pos.getDistanceTo(s))[0];
            }
			return this._hasMyWoundedNearByCloserToCenter;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'hasLargeEnemies', {
		get() {
            if (typeof this._hasLargeEnemies === "undefined") {
				this._hasLargeEnemies = RoomIntel.getLethalHostilesTTL(this.name) && this.enemies.find(f => f.body.length >= 20);
            }
			return this._hasLargeEnemies;
		},
		configurable: true, enumerable: true,
    });

}
