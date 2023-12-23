"use strict";

module.exports = function() {

    /**
     * PWR_OPERATE_FACTORY, PWR_OPERATE_EXTENSION, PWR_OPERATE_SPAWN, etc
     */
    Structure.prototype.hasEffect = function(effect) {
        if (!this.effects) return 0;
        let hasEffect = this.effects.find(f => f.effect === effect);
        return hasEffect ? (hasEffect.ticksRemaining || 0) : 0;
	};

	Object.defineProperty(Structure.prototype, 'isInvulnerableTicks', {
		get() {
            if (typeof this._isInvulnerableTicks === "undefined") {
                // Oh this is a structure and can be handling non-container structures.
                this._isInvulnerableTicks = this.hasEffect(EFFECT_INVULNERABILITY)
            }
			return this._isInvulnerableTicks;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Structure.prototype, 'value', {
		get() {
			if (typeof this._value === "undefined") {
                this._value = 0;
                if (this.store) {
                    this._value = _.sum(Object.keys(this.store), s => this.store[s] * GameManager.getMarketValue(s));
                }
			}
			return this._value;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Structure.prototype, 'amount', {
		get() {
			if (typeof this._amount === "undefined") {
                if (this.store) {
                    this._amount = _.sum(Object.keys(this.store), s => this.store[s]);
                }
                else {
                    this._amount = 0;
                }
			}
			return this._amount;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Structure.prototype, 'storeMostValuableResource', {
		get() {
			if (typeof this._storeMostValuableResource === "undefined") {
                this._storeMostValuableResource = null;
                // Not all structures have a store.
                if (this.store) {
                    let keys = Object.keys(this.store);
                    if (keys.length) {
                        if (keys.length > 1) {
                            this._storeMostValuableResource = _.sortBy(keys, s => -GameManager.getMarketValue(s)).find(x => x !== undefined);
                        }
                        else {
                            this._storeMostValuableResource = keys[0];
                        }
                    }
                }
			}
			return this._storeMostValuableResource;
		},
		configurable: true, enumerable: true,
	});

    /**
     * Is this pos enterable by a creep.
     * Other creeps are considered blocking.
     */
    Object.defineProperty(RoomPosition.prototype, 'lootAmount', {
        get() {
            if (typeof this._lootAmount === "undefined") {
                this._lootAmount = _.sum(this.look().map(item => {
                    switch (item.type) {
                        // For drops, return the amount.
                        case LOOK_RESOURCES:
                            return item.resource.amount;
                        // For structures, tombstones, ruines, return the sum amount of their stores.
                        case LOOK_STRUCTURES:
                            return _.sum(item.structure.store);
                        case LOOK_TOMBSTONES:
                            return _.sum(item.tombstone.store);
                        case LOOK_RUINS:
                            return _.sum(item.ruin.store);
                        // Anything else return zero.
                        default: return 0;
                    }
                }));
            }
            return this._lootAmount;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Structure.prototype, 'findNearByGeneralUpgradeControllerCreeps', {
		get() {
			if (typeof this._findNearByGeneralUpgradeControllerCreeps === "undefined") {
                // TODO: We could implement a findNearBy/findNextTo which would know to stop at 9 possible targets, since that is the max.
                this._findNearByGeneralUpgradeControllerCreeps = this.pos.findInRange(CreepManager.getGeneralUpgradeControllerCreepsByFocusId(this.room.controller.id), 1);
            }
			return this._findNearByGeneralUpgradeControllerCreeps;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Structure.prototype, 'isRampart', {
		get() {
			if (typeof this._isRampart === "undefined") {
                this._isRampart = this.structureType === STRUCTURE_RAMPART;
            }
			return this._isRampart;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Structure.prototype, 'isMisplaced', {
		get() {
			if (typeof this._isMisplaced === "undefined") {
                this._isMisplaced = false;
                let colonyFlag = this.room.colonyFlag;
                if (colonyFlag) {
                    switch (this.structureType) {
                        case STRUCTURE_STORAGE:
                            this._isMisplaced = !this.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_STORAGE(colonyFlag)));
                            break;
                        case STRUCTURE_TERMINAL:
                            this._isMisplaced = !this.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_TERMINAL(colonyFlag)));
                            break;
                    }
                }
                else if (this.room.isTempleCandidate) {
                    switch (this.structureType) {
                        case STRUCTURE_STORAGE:
                            this._isMisplaced = !this.pos.isEqualTo(this.room.templeStoragePos);
                            break;
                        case STRUCTURE_TERMINAL:
                            this._isMisplaced = !this.pos.isEqualTo(this.room.templeTerminalPos);
                            break;
                    }
                }
            }
			return this._isMisplaced;
		},
		configurable: true, enumerable: true,
    });

};
