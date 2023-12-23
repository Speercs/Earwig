
"use strict";

module.exports = function() {

	Object.defineProperty(Creep.prototype, 'isBoosted', {
		get() {
            if (typeof this._isBoosted === "undefined") {
                this._isBoosted = !!this.body.find(f => f.boost);
            }
			return this._isBoosted;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isBoosting', {
		get() {
            if (typeof this._isBoosting === "undefined") {
				const tasks = {
					[Config.tasks.BOOTSTRAP]: true
					, [Config.tasks.BOOST]: true
				}
                this._isBoosting = this.spawning || !this.task || !!tasks[this.task];
            }
			return this._isBoosting;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'hasBoostStructures', {
		get() {
            if (typeof this._hasBoostStructures === "undefined") {
                this._hasBoostStructures =
					this.my
					&& CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]
					&& this.terminal
					&& this.terminal.my
					&& this.colonyLab1
					&& this.colonyLab2
					&& this.colonyLab3
            }
			return this._hasBoostStructures;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isProperlyBoosted', {
		get() {
            if (typeof this._isProperlyBoosted === "undefined") {
                this._isProperlyBoosted = true;

				let boosts = Config.params.CREEP_ROLE_BOOSTS[this.role] || [];

				// Only need to check for boosts if creep is still spawning or in the boost task.
				if (boosts.length && this.isBoosting) {
					// Loop thru each boost and determine if we have any unboosted parts.
					for (let boost of boosts) {
						if (this.body.find(f => !f.boost && C.BOOST_TYPES[f.type].includes(boost))) {
							this._isProperlyBoosted = false;
							break;
						}
					}
				}
            }
			return this._isProperlyBoosted;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * A quicker way to determine if a creep is boosted.
	 * We know the role of the creep, and if that role is not defined to be boosted, then don't bother checking its body for boosts.
	 * Otherwise do the physical body scan for boosts.
	 */
	Object.defineProperty(Creep.prototype, 'isBoostedByRole', {
		get() {
            if (typeof this._isBoostedByRole === "undefined") {
				let boosts = Config.params.CREEP_ROLE_BOOSTS[this.role] || [];
				this._isBoostedByRole = !!(boosts.length && this.isBoosted);
            }
			return this._isBoostedByRole;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldWorkerRoleUnboost', {
		get() {
            if (typeof this._shouldWorkerRoleUnboost === "undefined") {
				this._shouldWorkerRoleUnboost = !!(
					(this.ticksToLive <= Config.params.UNBOOST_MIN_TTL)
					&& this.inAssignedRoom
					&& this.room.isCastle
					&& this.isBoostedByRole
				);
            }
			return this._shouldWorkerRoleUnboost;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'ticksToLiveBoostUpgradeControllerCapacity', {
		get() {
            if (typeof this._ticksToLiveBoostUpgradeControllerCapacity === "undefined") {
				this._ticksToLiveBoostUpgradeControllerCapacity = (this.ticksToLive - Config.params.UNBOOST_MIN_TTL) * this.workParts * UPGRADE_CONTROLLER_POWER;
            }
			return this._ticksToLiveBoostUpgradeControllerCapacity;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isInUnboostTicksToLive', {
		get() {
            if (typeof this._isInUnboostTicksToLive === "undefined") {
				this._isInUnboostTicksToLive = this.ticksToLive <= Config.params.UNBOOST_MIN_TTL;
            }
			return this._isInUnboostTicksToLive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldCombatRoleUnboost', {
		get() {
            if (typeof this._shouldCombatRoleUnboost === "undefined") {
				this._shouldCombatRoleUnboost = !!(
					this.isInUnboostTicksToLive
					&& this.inAssignedRoom
					&& this.room.isCastle
					&& !RoomIntel.getHostilesTTL(this.room.name)
					&& this.isBoostedByRole
				);
            }
			return this._shouldCombatRoleUnboost;
		},
		configurable: true, enumerable: true,
    });

	// TODO: Combine this with room.boostsNeeded
	Object.defineProperty(Creep.prototype, 'missingBoosts', {
		get() {
            if (typeof this._missingBoosts === "undefined") {
                this._missingBoosts = {};

				let boosts = Config.params.CREEP_ROLE_BOOSTS[this.role] || [];

				if (boosts.length && this.isBoosting) {
					// Loop thru each boost and determine if we have any unboosted parts.
					for (let boost of boosts) {
						let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
						let unboostedParts = this.body.filter(f => (f.type === bodyPartType) && !f.boost).length;
						if (unboostedParts.length) {
							this._missingBoosts[C.BOOST_COMPOUNDS[boost]] = LAB_BOOST_MINERAL * unboostedParts.length;
						}
					}
				}
            }
			return this._missingBoosts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedMoveParts', {
		get() {
            if (typeof this._unboostedMoveParts === "undefined") {
                this._unboostedMoveParts = this.body.filter(f => (f.type === MOVE) && !f.boost).length;
            }
			return this._unboostedMoveParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedAttackParts', {
		get() {
            if (typeof this._unboostedAttackParts === "undefined") {
				this._unboostedAttackParts = this.body.filter(f => f.type === ATTACK && !f.boost).length;
            }
			return this._unboostedAttackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedToughParts', {
		get() {
            if (typeof this._unboostedToughParts === "undefined") {
                this._unboostedToughParts = this.body.filter(f => (f.type === TOUGH) && !f.boost).length;
            }
			return this._unboostedToughParts;
		},
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedRangedAttackParts', {
		get() {
            if (typeof this._unboostedRangedAttackParts === "undefined") {
				this._unboostedRangedAttackParts = this.body.filter(f => (f.type === RANGED_ATTACK) && !f.boost).length;
            }
			return this._unboostedRangedAttackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedHealParts', {
		get() {
            if (typeof this._unboostedHealParts === "undefined") {
				this._unboostedHealParts = this.body.filter(f => (f.type === HEAL) && !f.boost).length;
            }
			return this._unboostedHealParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedWorkParts', {
		get() {
            if (typeof this._unboostedWorkParts === "undefined") {
				this._unboostedWorkParts = this.body.filter(f => (f.type === WORK) && !f.boost).length;
            }
			return this._unboostedWorkParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedCarryParts', {
		get() {
            if (typeof this._unboostedCarryParts === "undefined") {
				this._unboostedCarryParts = this.body.filter(f => (f.type === CARRY) && !f.boost).length;
            }
			return this._unboostedCarryParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'unboostedClaimParts', {
		get() {
            if (typeof this._unboostedClaimParts === "undefined") {
				this._unboostedClaimParts = this.body.filter(f => (f.type === CLAIM) && !f.boost).length;
            }
			return this._unboostedClaimParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedMinerals', {
		get() {
            if (typeof this._boostedMinerals === "undefined") {
                this._boostedMinerals = utils.unique(this.body, f => f.boost);
            }
			return this._boostedMinerals;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'hasBoostedParts', {
		get() {
            if (typeof this._hasBoostedParts === "undefined") {
                this._hasBoostedParts = !!this.body.find(f => f.boost);
            }
			return this._hasBoostedParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedMoveParts', {
		get() {
            if (typeof this._boostedMoveParts === "undefined") {
                this._boostedMoveParts = this.body.filter(f => (f.type === MOVE) && f.boost && f.hits).length;
            }
			return this._boostedMoveParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedAttackParts', {
		get() {
            if (typeof this._boostedAttackParts === "undefined") {
				this._boostedAttackParts = this.body.filter(f => (f.type === ATTACK) && f.boost && f.hits).length;
            }
			return this._boostedAttackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedToughParts', {
		get() {
            if (typeof this._boostedToughParts === "undefined") {
                this._boostedToughParts = this.body.filter(f => (f.type === TOUGH) && f.boost && f.hits).length;
            }
			return this._boostedToughParts;
		},
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedToughParts', {
		get() {
            if (typeof this._boostedToughParts === "undefined") {
                this._boostedToughParts = this.body.filter(f => (f.type === TOUGH) && f.boost && f.hits).length;
            }
			return this._boostedToughParts;
		},
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedRangedAttackParts', {
		get() {
            if (typeof this._boostedRangedAttackParts === "undefined") {
				this._boostedRangedAttackParts = this.body.filter(f => (f.type === RANGED_ATTACK) && f.boost && f.hits).length;
            }
			return this._boostedRangedAttackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedHealParts', {
		get() {
            if (typeof this._boostedHealParts === "undefined") {
				this._boostedHealParts = this.body.filter(f => (f.type === HEAL) && f.boost && f.hits).length;
            }
			return this._boostedHealParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedWorkParts', {
		get() {
            if (typeof this._boostedWorkParts === "undefined") {
				this._boostedWorkParts = this.body.filter(f => (f.type === WORK) && f.boost && f.hits).length;
            }
			return this._boostedWorkParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedCarryParts', {
		get() {
            if (typeof this._boostedCarryParts === "undefined") {
				this._boostedCarryParts = this.body.filter(f => (f.type === CARRY) && f.boost && f.hits).length;
            }
			return this._boostedCarryParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'boostedClaimParts', {
		get() {
            if (typeof this._boostedClaimParts === "undefined") {
				this._boostedClaimParts = this.body.filter(f => (f.type === CLAIM) && f.boost && f.hits).length;
            }
			return this._boostedClaimParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isRoomProperlyBoosted', {
		get() {
			if (typeof this._isRoomProperlyBoosted === "undefined") {
				this._isRoomProperlyBoosted = !this.myCreeps.find(f => !f.isProperlyBoosted);
			}
			return this._isRoomProperlyBoosted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomMissingBoosts', {
		get() {
			if (typeof this._roomMissingBoosts === "undefined") {
				this._roomMissingBoosts = {};

				// Get the master list of all boosts currently needed by creeps.
				let creepBoosts = utils.mergeSum(this.myCreeps.map(m => m.missingBoosts));
				let creepBoostKeys = Object.keys(creepBoosts);

				if (creepBoostKeys.length) {
					let roomResources = this.roomResources;
					let missingBoosts = {};

					// If our room has less than what the creep needs, then add the difference to the return hash.
					Object.keys(creepBoosts).forEach(boost => {
						if ((roomResources[boost] || 0) < creepBoosts[boost]) {
							missingBoosts[boost] = creepBoosts[boost] - (roomResources[boost] || 0);
						}
					})

					this._roomMissingBoosts = missingBoosts;
				}
			}
			return this._roomMissingBoosts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'capacityBoostMineralNeeded', {
        get() {
            if (typeof this._capacityBoostMineralNeeded === "undefined") {
                this._capacityBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._capacityBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_CAPACITY)), (s) => s.unboostedCarryParts * LAB_BOOST_MINERAL)
                }
            }
            return this._capacityBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'harvestBoostMineralNeeded', {
        get() {
            if (typeof this._harvestBoostMineralNeeded === "undefined") {
                this._harvestBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._harvestBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_HARVEST)), (s) => s.unboostedWorkParts * LAB_BOOST_MINERAL)
                }
            }
            return this._harvestBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'repairBoostMineralNeeded', {
        get() {
            if (typeof this._repairBoostMineralNeeded === "undefined") {
                this._repairBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._repairBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_CONSTRUCTION)), (s) => s.unboostedWorkParts * LAB_BOOST_MINERAL)
                }
            }
            return this._repairBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'upgradeControllerBoostMineralNeeded', {
        get() {
            if (typeof this._upgradeControllerBoostMineralNeeded === "undefined") {
                this._upgradeControllerBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._upgradeControllerBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_UPGRADECONTROLLER)), (s) => s.unboostedWorkParts * LAB_BOOST_MINERAL)
                }
            }
            return this._upgradeControllerBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'fatigueBoostMineralNeeded', {
        get() {
            if (typeof this._fatigueBoostMineralNeeded === "undefined") {
                this._fatigueBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._fatigueBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_FATIGUE)), (s) => s.unboostedMoveParts * LAB_BOOST_MINERAL)
                }
            }
            return this._fatigueBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'attackBoostMineralNeeded', {
        get() {
            if (typeof this._attackBoostMineralNeeded === "undefined") {
                this._attackBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._attackBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_ATTACK)), (s) => s.unboostedAttackParts * LAB_BOOST_MINERAL)
                }
            }
            return this._attackBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'rangedAttackBoostMineralNeeded', {
        get() {
            if (typeof this._rangedAttackBoostMineralNeeded === "undefined") {
                this._rangedAttackBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._rangedAttackBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_RANGEDATTACK)), (s) => s.unboostedRangedAttackParts * LAB_BOOST_MINERAL)
                }
            }
            return this._rangedAttackBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'healBoostMineralNeeded', {
        get() {
            if (typeof this._healBoostMineralNeeded === "undefined") {
                this._healBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._healBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_HEAL)), (s) => s.unboostedHealParts * LAB_BOOST_MINERAL)
                }
            }
            return this._healBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'reduceDamageBoostMineralNeeded', {
        get() {
            if (typeof this._reduceDamageBoostMineralNeeded === "undefined") {
                this._reduceDamageBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._reduceDamageBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_REDUCEDAMAGE)), (s) => s.unboostedToughParts * LAB_BOOST_MINERAL)
                }
            }
            return this._reduceDamageBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'dismantleBoostMineralNeeded', {
        get() {
            if (typeof this._dismantleBoostMineralNeeded === "undefined") {
                this._dismantleBoostMineralNeeded = 0;
                if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level]) {
                    this._dismantleBoostMineralNeeded = _.sum(this.myCreeps.filter(f => Config.params.CREEP_ROLE_BOOSTS[f.role] && Config.params.CREEP_ROLE_BOOSTS[f.role].includes(C.BOOST_DISMANTLE)), s => s.unboostedWorkParts * LAB_BOOST_MINERAL);
                }
            }
            return this._dismantleBoostMineralNeeded || 0;
        },
        configurable: true, enumerable: true,
    });

    Room.prototype.getBoostArray = function(type, action) {
        let result = [];
        for (let key in BOOSTS[type]) {
            if (BOOSTS[type][key][action]) {
                result.push({ compound:key, amount:BOOSTS[type][key][action] })
            }
        }
        return result;
    }

	Room.prototype.getBestBoostCompound = function(bodyPart, boostType) {
		// Shorthand.
		let room = this;

        // Order the array of boosts by strongest first.
        // Exception being damage reduction, which is backwards.
        let boostData = _.sortBy(room.getBoostArray(bodyPart, boostType), s => s.amount);
		if (boostType === C.BOOST_REDUCEDAMAGE) boostData.reverse();
		let boost = boostData[3 - 1];
		return boost ? boost.compound : null;
	}

	/**
	 * Note that boostLevel is 1-3 with 3 being the best, catalized, boost.
	 */
	Room.prototype.isBoostCompoundAtMax = function(bodyPart, boostType, boostLevel) {
		// Shorthand.
		let room = this;

        // Order the array of boosts by strongest first.
        // Exception being damage reduction, which is backwards.
        let boostData = _.sortBy(room.getBoostArray(bodyPart, boostType), s => s.amount);
		if (boostType === C.BOOST_REDUCEDAMAGE) boostData.reverse();
		let boost = boostData[boostLevel - 1];
		if (!boost) return false;

		return (GameManager.empireResourceTypesBelowMaxSortedHash[boost.compound] === undefined)
	}

	Room.prototype.areBoostsAtMax = function(role) {
		// Shorthand.
		let room = this;

		// Check that we have enough mats for every boost specified for this role and body.
		return (Config.params.CREEP_ROLE_BOOSTS[role] || []).every(boost => {
			let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
			return room.isBoostCompoundAtMax(bodyPartType, boost, 3);
		})
	}

	/**
	 * Note that boostLevel is 1-3 with 3 being the best, catalized, boost.
	 */
	Room.prototype.isBoostCompoundAtTarget = function(bodyPart, boostType, boostLevel) {
		// Shorthand.
		let room = this;

        // Order the array of boosts by strongest first.
        // Exception being damage reduction, which is backwards.
        let boostData = _.sortBy(room.getBoostArray(bodyPart, boostType), s => s.amount);
		if (boostType === C.BOOST_REDUCEDAMAGE) boostData.reverse();
		let boost = boostData[boostLevel - 1];
		if (!boost) return false;

		return (GameManager.empireResourceTypeBelowTargetSortedHash[boost.compound] === undefined)
	}

	Room.prototype.areBoostsAtTarget = function(role) {
		// Shorthand.
		let room = this;

		// Check that we have enough mats for every boost specified for this role and body.
		return (Config.params.CREEP_ROLE_BOOSTS[role] || []).every(boost => {
			let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
			return room.isBoostCompoundAtTarget(bodyPartType, boost, 3);
		})
	}

	Object.defineProperty(Room.prototype, 'areBoostsAtNeededAmountForBlacksmith', {
		get() {
			if (typeof this._areBoostsAtNeededAmountForBlacksmith === "undefined") {
                this._areBoostsAtNeededAmountForBlacksmith = this.areBoostsAtMax(Config.roles.BLACKSMITH);
			}
			return this._areBoostsAtNeededAmountForBlacksmith;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'areBoostsAtNeededAmountForBishop', {
		get() {
			if (typeof this._areBoostsAtNeededAmountForBishop === "undefined") {
                this._areBoostsAtNeededAmountForBishop = this.areBoostsAtMax(Config.roles.BISHOP);
			}
			return this._areBoostsAtNeededAmountForBishop;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Note that boostLevel is 1-3 with 3 being the best, catalized, boost.
	 */
    Room.prototype.canBoostType = function(body, bodyPart, boostType, boostLevel, availableMinerals) {
		// Shorthand.
		let room = this;

        // Order the array of boosts by strongest first.
        // Exception being damage reduction, which is backwards.
        let boostData = _.sortBy(room.getBoostArray(bodyPart, boostType), s => s.amount);
		if (boostType === C.BOOST_REDUCEDAMAGE) boostData.reverse();
		let boost = boostData[boostLevel - 1];
		if (!boost) return false;

		if (availableMinerals[boost.compound] && (availableMinerals[boost.compound] >= (body.filter(f => f === bodyPart).length * LAB_BOOST_MINERAL))) return true;
        return false;
    }

	Room.prototype.canBoostBody = function(role, body) {
		// Shorthand.
		let room = this;
		let boostBody = body;

		// Is this role even setup to boost? If not, consider it boostable.
		if (!Config.params.CREEP_ROLE_BOOSTS[role]) return true;

		// All mats are stored in the terminal.
		if (!room.myTerminal) return false;

		// We may not be able to even build this creep.
		if (!boostBody.length) return false;

		// If we are conserving minerals, then we aren't allowing usage of anything that consumes them.
		if (GameManager.isEmpireConservingMinerals) return false;

		// Now grab the available mats in the room. Test to see that we have enough to fully boost with BEST boost.
		let availableMinerals = this.labResourcesAfterBoosting;

		// Check that we have enough mats for every boost specified for this role and body.
		return (Config.params.CREEP_ROLE_BOOSTS[role] || []).every(boost => {
			let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
			return room.canBoostType(boostBody, bodyPartType, boost, 3, availableMinerals);
		})
	}

	Room.prototype.bodyMarketValue = function(role, body) {
		// Shorthand.
		let room = this;
		let boostBody = body;
		let value = 0;
		let boostedBodyPartTypes = {};

		// We may not be able to even build this creep.
		if (!boostBody.length) return value;

		// Get the base cost of the body in energy.
		value += GameManager.getMarketValue(RESOURCE_ENERGY) * utils.getBodyCost(body);

		// Then add in the costs of the boosts needed for this body definition.
		(Config.params.CREEP_ROLE_BOOSTS[role] || []).forEach(boost => {
			let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
			boostedBodyPartTypes[bodyPartType] = true;
			let compound = room.getBestBoostCompound(bodyPartType, boost);
			// Add the value of the part times how many parts we have.
			value += GameManager.getMarketValue(compound) * LAB_BOOST_MINERAL * body.filter(f => f === bodyPartType).length;
		})

		return value;
	}

    Object.defineProperty(Room.prototype, 'boostsNeeded', {
        get() {
            if (typeof this._boostsNeeded === "undefined") {
				// For every creep in the room (or spawning), get the count of each boost still needed.
				// Return a NEGATIVE number here, so it subtracts from the room totals.
				this._boostsNeeded = utils.mergeSubtract(this.myCreeps.map(m => m.missingBoosts));
            }
            return this._boostsNeeded;
        },
        configurable: true, enumerable: true,
    });

    Room.prototype.getBoostsByRole = function(role) {
		let boosts = {}
		// Note that bodies can change by level, so this can't be cached.
		let body = this.getBodyByRole(role);

		// For each boost specified for this creep, get the body part type needed for this boost
		// then find all the unboosted parts of this type currently in the body.
		(Config.params.CREEP_ROLE_BOOSTS[role] || []).forEach(boost => {
			let bodyPartType = C.BODY_PART_BY_BOOST_TYPES[boost];
			let parts = body.filter(f => f === bodyPartType).length;
			if (parts) {
				let compound = C.BOOST_COMPOUNDS[boost];
				boosts[compound] = (boosts[compound] || 0) + (parts * LAB_BOOST_MINERAL);
			}
		});

		return boosts;
    }

	Object.defineProperty(Room.prototype, 'labResourcesAfterBoosting', {
		get() {
			if (typeof this._labResourcesAfterBoosting === "undefined") {
                let stores = [];
				stores.push(this.roomResources);
				stores.push(this.boostsNeeded);

                this._labResourcesAfterBoosting = utils.mergeStores(stores);
			}
			return this._labResourcesAfterBoosting;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.getGroupBoosts = function(group) {
		let boosts = {};
		Config.params.GROUP_ROLES[group].forEach(role => {
			boosts = utils.mergeSum([boosts, this.getBoostsByRole(role)])
		})
		return boosts;
	}

	Room.prototype.canBoostGroup = function(group) {
		let boosts = this.getGroupBoosts(group);
		// Now grab the available mats in the room. Test to see that we have enough to fully boost with BEST boost.
		let availableMinerals = this.labResourcesAfterBoosting;
		return Object.keys(boosts).every(boost => {
			return ((availableMinerals[boost] || 0) >= boosts[boost]);
		})
	}

	// Bodies must be added here if they want to be boosted.
	Room.prototype.getBodyByRole = function(role, incomingDamage) {
		switch (role) {
			case Config.roles.PROPHET: return this.getBodyProphet();
			case Config.roles.HERALD: return this.getBodyHerald();
			case Config.roles.BLACKSMITH: return this.getBodyBlacksmith();
			case Config.roles.BISHOP: return this.getBodyBishop();
			case Config.roles.MASON: return this.getBodyMason();
			case Config.roles.DEACON:
				let options = { incomingDamage: incomingDamage }
				return this.getRangedBodyByIncomingDamage(options);
			case Config.roles.MULE: return this.getBodyMule();
			case Config.roles.PIKEMAN: return this.getBodyPikeman();
			case Config.roles.CROSSBOWMAN: return this.getBodyCrossbowman();
			case Config.roles.SAPPER: return this.getBodySapper();
			case Config.roles.CLERIC: return this.getBodyCleric();
			case Config.roles.ORACLE: return this.getBodyOracle();

			case Config.roles.LANCER1: return this.getBodyLancer1();
			case Config.roles.LANCER2: return this.getBodyLancer2();
			case Config.roles.LANCER3: return this.getBodyLancer3();
			case Config.roles.LANCER4: return this.getBodyLancer4();
			case Config.roles.LANCER5: return this.getBodyLancer5();

			default: return [];
		}
	}

	Room.prototype.canBoostBodyByRole = function(role, incomingDamage) {
		return this.canBoostBody(role, this.getBodyByRole(role, incomingDamage));
	}

	Room.prototype.canBoostBodyProphet = function() {
		return this.canBoostBody(Config.roles.PROPHET, this.getBodyProphet());
	}

	Room.prototype.canBoostBodyHerald = function() {
		return this.canBoostBody(Config.roles.HERALD, this.getBodyHerald());
	}

	Room.prototype.canBoostBodyBlacksmith = function() {
		return this.canBoostBody(Config.roles.BLACKSMITH, this.getBodyBlacksmith());
	}

	Room.prototype.canBoostBodyBishop = function() {
		return this.canBoostBody(Config.roles.BISHOP, this.getBodyBishop());
	}

	Room.prototype.canBoostBodyMason = function() {
		return this.canBoostBody(Config.roles.MASON, this.getBodyMason());
	}

	Room.prototype.canBoostBodyOracle = function() {
		return this.canBoostBody(Config.roles.ORACLE, this.getBodyOracle());
	}

	Room.prototype.canBoostBodyRanger = function(options) {
		let defaults = {
            incomingDamage: 0
        };
		options = _.defaults({}, _.clone(options), defaults);
		return this.canBoostBody(Config.roles.RANGER, this.getRangedBodyByIncomingDamage(options));
	}

	Room.prototype.canBoostBodyDeacon = function(options) {
		let defaults = {
            incomingDamage: 0
        };
		options = _.defaults({}, _.clone(options), defaults);
		return this.canBoostBody(Config.roles.DEACON, this.getRangedBodyByIncomingDamage(options));
	}

	Room.prototype.canBoostBodyCleric = function() {
		return this.canBoostBody(Config.roles.CLERIC, this.getBodyCleric());
	}

	Room.prototype.canBoostBodyMule = function() {
		return this.canBoostBody(Config.roles.MULE, this.getBodyMule());
	}

	Room.prototype.canBoostBodyPikeman = function() {
		return this.canBoostBody(Config.roles.PIKEMAN, this.getBodyPikeman());
	}

	Room.prototype.canBoostBodyCrossbowman = function() {
		return this.canBoostBody(Config.roles.CROSSBOWMAN, this.getBodyCrossbowman());
	}

	Room.prototype.canBoostBodySapper = function() {
		return this.canBoostBody(Config.roles.SAPPER, this.getBodySapper());
	}

	Room.prototype.canBoostBodyLancerByLevel = function(level) {
		switch (level) {
			case 1: return this.canBoostBody(Config.roles.LANCER1, this.getBodyLancer1());
			case 2: return this.canBoostBody(Config.roles.LANCER2, this.getBodyLancer2());
			case 3: return this.canBoostBody(Config.roles.LANCER3, this.getBodyLancer3());
			case 4: return this.canBoostBody(Config.roles.LANCER4, this.getBodyLancer4());
			case 5: return this.canBoostBody(Config.roles.LANCER5, this.getBodyLancer5());
		}
		return false;
	}
	Room.prototype.canBoostBodyLancer1 = function() {
		return this.canBoostBody(Config.roles.LANCER1, this.getBodyLancer1());
	}
	Room.prototype.canBoostBodyLancer2 = function() {
		return this.canBoostBody(Config.roles.LANCER2, this.getBodyLancer2());
	}
	Room.prototype.canBoostBodyLancer3 = function() {
		return this.canBoostBody(Config.roles.LANCER3, this.getBodyLancer3());
	}
	Room.prototype.canBoostBodyLancer4 = function() {
		return this.canBoostBody(Config.roles.LANCER4, this.getBodyLancer4());
	}
	Room.prototype.canBoostBodyLancer5 = function() {
		return this.canBoostBody(Config.roles.LANCER5, this.getBodyLancer5());
	}

    // Returns true if moving to designated work room (and doesn't have hostiles), false otherwise.
    Creep.prototype.boosting = function() {
        // Shorthand.
        let creep = this;
        let room = creep.room;

        // If we aren't in our room, don't bother buffing.
        if (!room.my) return false;

        // If this room isn't capable of boosting, don't bother buffing.
        if (!CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.room.level]) return false;

        // If this creep role isn't buffed, bail out.
        if (!Config.params.CREEP_ROLE_BOOSTS[creep.role]) return false;

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_UPGRADECONTROLLER) && creep.unboostedWorkParts && room.upgradeControllerBoostLab) {
            creep.smartBoost(room.upgradeControllerBoostLab)
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_CONSTRUCTION) && creep.unboostedWorkParts && room.constructionBoostLab) {
            creep.smartBoost(room.constructionBoostLab)
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_CAPACITY) && creep.unboostedCarryParts && room.capacityBoostLab) {
            creep.smartBoost(room.capacityBoostLab);
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_RANGEDATTACK) && creep.unboostedRangedAttackParts && room.rangedAttackBoostLab) {
            creep.smartBoost(room.rangedAttackBoostLab)
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_HEAL) && creep.unboostedHealParts && room.healBoostLab) {
            creep.smartBoost(room.healBoostLab);
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_ATTACK) && creep.unboostedAttackParts && room.attackBoostLab) {
            creep.smartBoost(room.attackBoostLab)
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_REDUCEDAMAGE) && creep.unboostedToughParts && room.reduceDamageBoostLab) {
            creep.smartBoost(room.reduceDamageBoostLab);
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_FATIGUE) && creep.unboostedMoveParts && room.fatigueBoostLab) {
            creep.smartBoost(room.fatigueBoostLab);
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_DISMANTLE) && creep.unboostedWorkParts && room.dismantleBoostLab) {
            creep.smartBoost(room.dismantleBoostLab)
            return true;
        }

        if (Config.params.CREEP_ROLE_BOOSTS[creep.role].includes(C.BOOST_HARVEST) && creep.unboostedWorkParts && room.harvestBoostLab) {
            creep.smartBoost(room.harvestBoostLab)
            return true;
        }

        // All set, either fully boosted or boosts have been exhausted.
        return false;
    };

	Object.defineProperty(Room.prototype, 'preacherClaimParts', {
		get() {
			if (typeof this._preacherClaimParts === "undefined") {
				this._preacherClaimParts = this.getBodyPreacher().filter(f=>f===CLAIM).length;
			}
			return this._preacherClaimParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'harvestBoostLab', {
		get() {
			if (typeof this._harvestBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_UTRIUM_OXIDE
							//RESOURCE_UTRIUM_ALKALIDE
							RESOURCE_CATALYZED_UTRIUM_ALKALIDE
						].includes(lab.mineralType)
					) {
						this._harvestBoostLab = lab;
						break;
					}
				}
			}
			return this._harvestBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'constructionBoostLab', {
		get() {
			if (typeof this._constructionBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_LEMERGIUM_HYDRIDE
							//RESOURCE_LEMERGIUM_ACID
							RESOURCE_CATALYZED_LEMERGIUM_ACID
						].includes(lab.mineralType)
					) {
						this._constructionBoostLab = lab;
						break;
					}
				}
			}
			return this._constructionBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dismantleBoostLab', {
		get() {
			if (typeof this._dismantleBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_ZYNTHIUM_HYDRIDE
							//RESOURCE_ZYNTHIUM_ACID
							RESOURCE_CATALYZED_ZYNTHIUM_ACID
						].includes(lab.mineralType)
					) {
						this._dismantleBoostLab = lab;
						break;
					}
				}
			}
			return this._dismantleBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'upgradeControllerBoostLab', {
		get() {
			if (typeof this._upgradeControllerBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_GHODIUM_HYDRIDE
							//RESOURCE_GHODIUM_ACID
							RESOURCE_CATALYZED_GHODIUM_ACID
						].includes(lab.mineralType)
					) {
						this._upgradeControllerBoostLab = lab;
						break;
					}
				}
			}
			return this._upgradeControllerBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'attackBoostLab', {
		get() {
			if (typeof this._attackBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_UTRIUM_HYDRIDE
							//RESOURCE_UTRIUM_ACID
							RESOURCE_CATALYZED_UTRIUM_ACID
						].includes(lab.mineralType)
					) {
						this._attackBoostLab = lab;
						break;
					}
				}
			}
			return this._attackBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'rangedAttackBoostLab', {
		get() {
			if (typeof this._rangedAttackBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_KEANIUM_OXIDE
							//RESOURCE_KEANIUM_ALKALIDE
							RESOURCE_CATALYZED_KEANIUM_ALKALIDE
						].includes(lab.mineralType)
					) {
						this._rangedAttackBoostLab = lab;
						break;
					}
				}
			}
			return this._rangedAttackBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'healBoostLab', {
		get() {
			if (typeof this._healBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_LEMERGIUM_OXIDE
							//RESOURCE_LEMERGIUM_ALKALIDE
							RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE
						].includes(lab.mineralType)
					) {
						this._healBoostLab = lab;
						break;
					}
				}
			}
			return this._healBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'capacityBoostLab', {
		get() {
			if (typeof this._capacityBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_KEANIUM_HYDRIDE
							//RESOURCE_KEANIUM_ACID
							RESOURCE_CATALYZED_KEANIUM_ACID
						].includes(lab.mineralType)
					) {
						this._capacityBoostLab = lab;
						break;
					}
				}
			}
			return this._capacityBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'fatigueBoostLab', {
		get() {
			if (typeof this._fatigueBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_ZYNTHIUM_OXIDE
							//RESOURCE_ZYNTHIUM_ALKALIDE
							RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE
						].includes(lab.mineralType)
					) {
						this._fatigueBoostLab = lab;
						break;
					}
				}
			}
			return this._fatigueBoostLab;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'reduceDamageBoostLab', {
		get() {
			if (typeof this._reduceDamageBoostLab === "undefined") {
				for (let i=0; i < this.colonyLabs.length; i++) {
					let lab = this.colonyLabs[i];
					if (
						(lab.mineralAmount >= LAB_BOOST_MINERAL)
						&& (lab.energy >= LAB_BOOST_ENERGY)
						&& [
							//RESOURCE_GHODIUM_OXIDE
							//RESOURCE_GHODIUM_ALKALIDE
							RESOURCE_CATALYZED_GHODIUM_ALKALIDE
						].includes(lab.mineralType)
					) {
						this._reduceDamageBoostLab = lab;
						break;
					}
				}
			}
			return this._reduceDamageBoostLab;
		},
		configurable: true, enumerable: true,
	});

}
