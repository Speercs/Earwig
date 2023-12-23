"use strict";

module.exports = function() {

	/**
	 * Note that hostiles will pre-filter out allies.
	 */
    Object.defineProperty(Room.prototype, 'hostiles', {
		get() {
			if (typeof this._hostiles === "undefined") {
				this._hostiles = this.find(FIND_HOSTILE_CREEPS).filter(f => !PlayerManager.isAlly(f.owner.username));
				this._hostiles = this._hostiles.concat(this.find(FIND_HOSTILE_POWER_CREEPS).filter(f => !PlayerManager.isAlly(f.owner.username)));
				if (Game.flags.FIND_HOSTILE_CREEPS) utils.printStack(this.print, 'FIND_HOSTILE_CREEPS/hostiles');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_HOSTILE_CREEPS')
			}
			return this._hostiles;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'allies', {
		get() {
			if (typeof this._allies === "undefined") {
				this._allies = this.find(FIND_HOSTILE_CREEPS).filter(f => PlayerManager.isAlly(f.owner.username));
				if (Game.flags.FIND_HOSTILE_CREEPS) utils.printStack(this.print, 'FIND_HOSTILE_CREEPS/allies');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_HOSTILE_CREEPS')
			}
			return this._allies;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'enemies', {
		get() {
			if (typeof this._enemies === "undefined") {
				this._enemies = this.find(FIND_HOSTILE_CREEPS).filter(f => PlayerManager.isEnemy(f.owner.username));
				this._enemies = this._enemies.concat(this.find(FIND_HOSTILE_POWER_CREEPS).filter(f => PlayerManager.isEnemy(f.owner.username)));
				if (Game.flags.FIND_HOSTILE_CREEPS) utils.printStack(this.print, 'FIND_HOSTILE_CREEPS/enemies');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_HOSTILE_CREEPS')
			}
			return this._enemies;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'invaders', {
		get() {
			if (typeof this._invaders === "undefined") {
				this._invaders = this.hostiles.filter(f => f.owner.username === 'Invader');
			}
			return this._invaders;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'invadersWithWork', {
		get() {
			if (typeof this._invadersWithWork === "undefined") {
				this._invadersWithWork = this.invaders.filter(f => f.workParts);
			}
			return this._invadersWithWork;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'invadersWithAttack', {
		get() {
			if (typeof this._invadersWithAttack === "undefined") {
				this._invadersWithAttack = this.invaders.filter(f => f.attackParts);
			}
			return this._invadersWithAttack;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'screeps', {
		get() {
			if (typeof this._screeps === "undefined") {
				this._screeps = this.hostiles.filter(f => f.owner.username === 'Screeps');
			}
			return this._screeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'screepsWithCarry', {
		get() {
			if (typeof this._screepsWithCarry === "undefined") {
				this._screepsWithCarry = this.screeps.filter(f => f.store.getCapacity());
			}
			return this._screepsWithCarry;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceKeepers', {
		get() {
			if (typeof this._sourceKeepers === "undefined") {
				this._sourceKeepers = this.hostiles.filter(f => f.owner.username === 'Source Keeper');
			}
			return this._sourceKeepers;
		},
		configurable: true, enumerable: true,
	});


	Object.defineProperty(Room.prototype, 'nonSourceKeeperHostiles', {
		get() {
			if (typeof this._nonSourceKeeperHostiles === "undefined") {
				if (this.isSKRoom && RoomIntel.getStrongholdByRoomName(this.name)) {
					// Hostiles will include invaders within strongholds.
					this._nonSourceKeeperHostiles = this.hostiles.filter(f => (f.owner.username !== 'Source Keeper'));

				} else if (this.isSKRoom && !RoomIntel.getStrongholdByRoomName(this.name)) {
					// In SK rooms we may have random invaders (is this really a thing?) but we don't count the invaders that are leftover from a stronghold after its been destroyed; those invaders which will have huge life times.
					this._nonSourceKeeperHostiles = this.hostiles.filter(f => (f.owner.username !== 'Invader' || ((f.owner.username === 'Invader') && (f.ticksToLive <= CREEP_LIFE_TIME))) && (f.owner.username !== 'Source Keeper'));

				} else {
					this._nonSourceKeeperHostiles = this.hostiles;

				}
			}
			return this._nonSourceKeeperHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalNonSourceKeeperHostiles', {
		get() {
			if (typeof this._lethalNonSourceKeeperHostiles === "undefined") {
				this._lethalNonSourceKeeperHostiles = this.nonSourceKeeperHostiles.filter(f =>
					f.attackParts
					|| f.rangedAttackParts
				);
			}
			return this._lethalNonSourceKeeperHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'playerHostiles', {
		get() {
			if (typeof this._playerHostiles === "undefined") {
				const npc = {
					'Invader': 1
					, 'Source Keeper': 1
					, 'Screeps': 1
				}
				this._playerHostiles = this.hostiles.filter(f => !npc[f.owner.username]);
			}
			return this._playerHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousHostiles', {
		get() {
			if (typeof this._dangerousHostiles === "undefined") {
				if (this.my) {
					this._dangerousHostiles = this.hostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.workParts
						|| f.claimParts
						|| f.carryParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else if (this.isSKRoom) {
					this._dangerousHostiles = this.nonSourceKeeperHostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.carryParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else if (this.myManagement) {
					// Basically any part except for scouts with move parts only.
					this._dangerousHostiles = this.hostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.workParts
						|| f.claimParts
						|| f.carryParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else {  // Core and highway rooms.
					// Including work parts for harvesting deposits.
					this._dangerousHostiles = this.hostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.workParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				}
			}
			return this._dangerousHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalHostiles', {
		get() {
			if (typeof this._lethalHostiles === "undefined") {
				this._lethalHostiles = this.dangerousHostiles.filter(f =>
					f.attackParts
					|| f.rangedAttackParts

					// Include all invaders, including pure healers.
					// KMP: WHY? When there is only one healer left, it can become a chase around the room to kill them.
					// They can't do any damage...so....
					// || f.isInvader
				);
			}
			return this._lethalHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalActiveHostiles', {
		get() {
			if (typeof this._lethalActiveHostiles === "undefined") {
				this._lethalActiveHostiles = this.dangerousHostiles.filter(f =>
					f.attackPartsActive
					|| f.rangedAttackPartsActive
				);
			}
			return this._lethalActiveHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalPlayerHostiles', {
		get() {
			if (typeof this._lethalPlayerHostiles === "undefined") {
				this._lethalPlayerHostiles = this.dangerousPlayerHostiles.filter(f =>
					f.attackParts
					|| f.rangedAttackParts
				);
			}
			return this._lethalPlayerHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousBoostedHostiles', {
		get() {
			if (typeof this._dangerousBoostedHostiles === "undefined") {
				this._dangerousBoostedHostiles = this.dangerousHostiles.filter(f => f.hasBoostedParts);
			}
			return this._dangerousBoostedHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalBoostedHostiles', {
		get() {
			if (typeof this._lethalBoostedHostiles === "undefined") {
				this._lethalBoostedHostiles = this.dangerousBoostedHostiles.filter(f =>
					f.attackParts
					|| f.rangedAttackParts
				);
			}
			return this._lethalBoostedHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'lethalBoostedPlayerHostiles', {
		get() {
			if (typeof this._lethalBoostedPlayerHostiles === "undefined") {
				this._lethalBoostedPlayerHostiles = this.dangerousBoostedPlayerHostiles.filter(f =>
					f.attackParts
					|| f.rangedAttackParts
				);
			}
			return this._lethalBoostedPlayerHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousPlayerHostiles', {
		get() {
			if (typeof this._dangerousPlayerHostiles === "undefined") {
				if (this.my) {
					this._dangerousPlayerHostiles = this.playerHostiles;
				} else if (this.isSKRoom) {
					this._dangerousPlayerHostiles = this.playerHostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.carryParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else if (this.myManagement) {
					this._dangerousPlayerHostiles = this.playerHostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.workParts
						|| f.claimParts
						|| f.carryParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else if (this.isHighwayRoom) {
					this._dangerousPlayerHostiles = this.playerHostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| f.workParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				} else {
					this._dangerousPlayerHostiles = this.playerHostiles.filter(f =>
						f.attackParts
						|| f.rangedAttackParts
						|| f.healParts
						|| PlayerManager.isEnemy(f.owner.username)
					);
				}
			}
			return this._dangerousPlayerHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousBoostedPlayerHostiles', {
		get() {
			if (typeof this._dangerousBoostedPlayerHostiles === "undefined") {
				this._dangerousBoostedPlayerHostiles = this.dangerousPlayerHostiles.filter(f => f.hasBoostedParts);
			}
			return this._dangerousBoostedPlayerHostiles;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'hostilesInRange3', {
		get() {
            if (typeof this._hostilesInRange3 === "undefined") {
                this._hostilesInRange3 = this.room.hostiles.filter(f => f.pos.inRange3(this));
            }
			return this._hostilesInRange3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'hostilesNearBy', {
		get() {
            if (typeof this._hostilesNearBy === "undefined") {
                this._hostilesNearBy = this.hostilesInRange3.filter(f => f.pos.isNearTo(this));
            }
			return this._hostilesNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lethalHostilesInRange3', {
		get() {
            if (typeof this._lethalHostilesInRange3 === "undefined") {
                this._lethalHostilesInRange3 = this.room.lethalHostiles.filter(f => f.pos.inRange3(this));
            }
			return this._lethalHostilesInRange3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lethalHostilesInRange2', {
		get() {
            if (typeof this._lethalHostilesInRange2 === "undefined") {
                this._lethalHostilesInRange2 = this.lethalHostilesInRange3.filter(f => f.pos.inRange2(this));
            }
			return this._lethalHostilesInRange2;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lethalHostilesNearBy', {
		get() {
            if (typeof this._lethalHostilesNearBy === "undefined") {
                this._lethalHostilesNearBy = this.lethalHostilesInRange3.filter(f => f.pos.isNearTo(this));
            }
			return this._lethalHostilesNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lethalActiveHostilesInRange3', {
		get() {
            if (typeof this._lethalActiveHostilesInRange3 === "undefined") {
                this._lethalActiveHostilesInRange3 = this.room.lethalActiveHostiles.filter(f => f.pos.inRange3(this));
            }
			return this._lethalActiveHostilesInRange3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'lethalActiveHostilesNearBy', {
		get() {
            if (typeof this._lethalActiveHostilesNearBy === "undefined") {
                this._lethalActiveHostilesNearBy = this.lethalActiveHostilesInRange3.filter(f => f.pos.isNearTo(this));
            }
			return this._lethalActiveHostilesNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'meleeActiveHostilesInRange3', {
		get() {
            if (typeof this._meleeActiveHostilesInRange3 === "undefined") {
                this._meleeActiveHostilesInRange3 = this.lethalActiveHostilesInRange3.filter(f => f.attackParts);
            }
			return this._meleeActiveHostilesInRange3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'meleeActiveHostilesInRange2', {
		get() {
            if (typeof this._meleeActiveHostilesInRange2 === "undefined") {
                this._meleeActiveHostilesInRange2 = this.meleeActiveHostilesInRange3.filter(f => f.pos.inRange2(this));
            }
			return this._meleeActiveHostilesInRange2;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'meleeActiveHostilesNearBy', {
		get() {
            if (typeof this._meleeActiveHostilesNearBy === "undefined") {
                this._meleeActiveHostilesNearBy = this.meleeActiveHostilesInRange2.filter(f => f.pos.isNearTo(this));
            }
			return this._meleeActiveHostilesNearBy;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Potentially active towers in hostile room.
	 * Stronghold towers will somehow shoot on the same tick that they get filled. So they are ALWAYS dangerous.
	 */
	Object.defineProperty(Room.prototype, 'hostileTowersWithEnergy', {
		get() {
			if (typeof this._hostileTowersWithEnergy === "undefined") {
				this._hostileTowersWithEnergy = [];
				if (this.ownedByOther && CONTROLLER_STRUCTURES[STRUCTURE_TOWER][this.controller.level]) {
					this._hostileTowersWithEnergy = this.hostileTowers.filter(f => f.store[RESOURCE_ENERGY] >= TOWER_ENERGY_COST);
				}
				else if (this.invaderStronghold) {
					this._hostileTowersWithEnergy = this.hostileTowers;
				}
			}
			return this._hostileTowersWithEnergy;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Refer to code in for adjustments
	 * screeps\engine\src\processor\intents\creeps\keepers\pretick.js
	 */
	Room.prototype.getSourceKeeperPosByResource = function(resource) {
		let lair = resource.pos.findClosestByRange(this.keeperLairs);
		let options = { range: 1, ignoreCreeps: true, ignoreRoads: true }
		let path = lair.pos.findPathTo(resource, options);
		let lastStep = path[path.length - 1];
		return new RoomPosition(lastStep.x, lastStep.y, this.name);
	};

	Object.defineProperty(Room.prototype, 'isDangerousRoom', {
		get() {
			if (typeof this._isDangerousRoom === "undefined") {
				this._isDangerousRoom = RoomIntel.getDangerousRoom(this.name);
			}
			return this._isDangerousRoom;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Does the room have any hostile buildings in it. This excludes controllers, powerbanks, invader cores, and keeper lairs.
	 */
	Object.defineProperty(Room.prototype, 'hasHostileStructures', {
		get() {
			if (typeof this._hasHostileStructures === "undefined") {
				// Since we are returning true/false, a quick check for hostileStores (fast) is a quick way to determine true many times.
				this._hasHostileStructures = !!this.hostileStores.length || !!this.hostilePlayerBuildings.length || !!this.invaderStructures.length;
			}
			return this._hasHostileStructures;
		},
		configurable: true, enumerable: true,
	});

}
