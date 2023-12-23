"use strict";

module.exports = function() {

    RoomObject.prototype.isInRoom = function(roomName) {
        return this.pos.roomName === roomName;
	};

    /**
     * This is a RoomObject and not Structure property. Will be called on sources and minerals, which are not Structures.
     */
    RoomObject.prototype.effectTicksRemaining = function(power) {
        if (!this.effects) return 0;
        let effect = this.effects.find(f => f.effect === power && (!POWER_INFO[power] || (f.level > 0)));
        return effect ? effect.ticksRemaining : 0;
	};

	Object.defineProperty(RoomObject.prototype, 'nips', {
		get() {
            if (typeof this._nips === "undefined") {
                if (typeof this.room.heap.nips === "undefined") this.room.heap.nips = {};

                this._nips = this.room.heap.nips[this.id];
                if ((typeof this._nips === "undefined") || (this instanceof Creep)) {
                    this.room.heap.nips[this.id] = this.pos.coordsNonWallNextTo;
                    this._nips = this.room.heap.nips[this.id];
                }
                this._nips = this._nips.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._nips;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange1OfNips', {
		get() {
            if (typeof this._posOfRange1OfNips === "undefined") {
                if (typeof this.room.heap.posOfRange1OfNips === "undefined") this.room.heap.posOfRange1OfNips = {};

                this._posOfRange1OfNips = this.room.heap.posOfRange1OfNips[this.id];
                if ((typeof this._posOfRange1OfNips === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange1OfNips[this.id] = this.pos.posOfRangeDNonTerrainWall(2).filter(f => this.nips.find(nip => nip.inRange1(f)));
                    this._posOfRange1OfNips = this.room.heap.posOfRange1OfNips[this.id];
                }
                this._posOfRange1OfNips = this._posOfRange1OfNips.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange1OfNips;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posNameOfRange1OfNipsHash', {
		get() {
            if (typeof this._posNameOfRange1OfNipsHash === "undefined") {
                if (typeof this.room.heap.posNameOfRange1OfNipsHash === "undefined") this.room.heap.posNameOfRange1OfNipsHash = {};

                this._posNameOfRange1OfNipsHash = this.room.heap.posNameOfRange1OfNipsHash[this.id];
                if ((typeof this._posNameOfRange1OfNipsHash === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posNameOfRange1OfNipsHash[this.id] = utils.arrayToHash(this.posOfRange1OfNips.map(m => m.name), 1);
                    this._posNameOfRange1OfNipsHash = this.room.heap.posNameOfRange1OfNipsHash[this.id];
                }
            }
            return this._posNameOfRange1OfNipsHash;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange2OfNips', {
		get() {
            if (typeof this._posOfRange2OfNips === "undefined") {
                if (typeof this.room.heap.posOfRange2OfNips === "undefined") this.room.heap.posOfRange2OfNips = {};

                this._posOfRange2OfNips = this.room.heap.posOfRange2OfNips[this.id];
                if ((typeof this._posOfRange2OfNips === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange2OfNips[this.id] = this.pos.posOfRangeDNonTerrainWall(3).filter(f => this.nips.find(nip => nip.inRange2(f)));
                    this._posOfRange2OfNips = this.room.heap.posOfRange2OfNips[this.id];
                }
                this._posOfRange2OfNips = this._posOfRange2OfNips.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange2OfNips;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posNameOfRange2OfNipsHash', {
		get() {
            if (typeof this._posNameOfRange2OfNipsHash === "undefined") {
                if (typeof this.room.heap.posNameOfRange2OfNipsHash === "undefined") this.room.heap.posNameOfRange2OfNipsHash = {};

                this._posNameOfRange2OfNipsHash = this.room.heap.posNameOfRange2OfNipsHash[this.id];
                if ((typeof this._posNameOfRange2OfNipsHash === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posNameOfRange2OfNipsHash[this.id] = utils.arrayToHash(this.posOfRange2OfNips.map(m => m.name), 1);
                    this._posNameOfRange2OfNipsHash = this.room.heap.posNameOfRange2OfNipsHash[this.id];
                }
            }
            return this._posNameOfRange2OfNipsHash;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange3OfNips', {
		get() {
            if (typeof this._posOfRange3OfNips === "undefined") {
                if (typeof this.room.heap.posOfRange3OfNips === "undefined") this.room.heap.posOfRange3OfNips = {};

                this._posOfRange3OfNips = this.room.heap.posOfRange3OfNips[this.id];
                if ((typeof this._posOfRange3OfNips === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange3OfNips[this.id] = this.pos.posOfRangeDNonTerrainWall(4).filter(f => this.nips.find(nip => nip.inRange3(f)));
                    this._posOfRange3OfNips = this.room.heap.posOfRange3OfNips[this.id];
                }
                this._posOfRange3OfNips = this._posOfRange3OfNips.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange3OfNips;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posNameOfRange3OfNipsHash', {
		get() {
            if (typeof this._posNameOfRange3OfNipsHash === "undefined") {
                if (typeof this.room.heap.posNameOfRange3OfNipsHash === "undefined") this.room.heap.posNameOfRange3OfNipsHash = {};

                this._posNameOfRange3OfNipsHash = this.room.heap.posNameOfRange3OfNipsHash[this.id];
                if ((typeof this._posNameOfRange3OfNipsHash === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posNameOfRange3OfNipsHash[this.id] = utils.arrayToHash(this.posOfRange3OfNips.map(m => m.name), 1);
                    this._posNameOfRange3OfNipsHash = this.room.heap.posNameOfRange3OfNipsHash[this.id];
                }
            }
            return this._posNameOfRange3OfNipsHash;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'nipsFree', {
		get() {
			if (typeof this._nipsFree === "undefined") {
                this._nipsFree = this.room.getNearToWalkable(this.pos, true);
            }
			return this._nipsFree;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'nipsWalkable', {
		get() {
			if (typeof this._nipsWalkable === "undefined") {
                this._nipsWalkable = this.room.getNearToWalkable(this.pos, false);
            }
			return this._nipsWalkable;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange2NonTerrainWallNotNearEdge', {
		get() {
            if (typeof this._posOfRange2NonTerrainWallNotNearEdge === "undefined") {
                if (typeof this.room.heap.posOfRange2NonTerrainWallNotNearEdge === "undefined") this.room.heap.posOfRange2NonTerrainWallNotNearEdge = {};

                this._posOfRange2NonTerrainWallNotNearEdge = this.room.heap.posOfRange2NonTerrainWallNotNearEdge[this.id];
                if ((typeof this._posOfRange2NonTerrainWallNotNearEdge === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange2NonTerrainWallNotNearEdge[this.id] = this.pos.coordOfRangeD(2, 2);
                    this._posOfRange2NonTerrainWallNotNearEdge = this.room.heap.posOfRange2NonTerrainWallNotNearEdge[this.id];
                }
                this._posOfRange2NonTerrainWallNotNearEdge = this._posOfRange2NonTerrainWallNotNearEdge.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange2NonTerrainWallNotNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange3NonTerrainWallNotNearEdge', {
		get() {
            if (typeof this._posOfRange3NonTerrainWallNotNearEdge === "undefined") {
                if (typeof this.room.heap.posOfRange3NonTerrainWallNotNearEdge === "undefined") this.room.heap.posOfRange3NonTerrainWallNotNearEdge = {};

                this._posOfRange3NonTerrainWallNotNearEdge = this.room.heap.posOfRange3NonTerrainWallNotNearEdge[this.id];
                if ((typeof this._posOfRange3NonTerrainWallNotNearEdge === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange3NonTerrainWallNotNearEdge[this.id] = this.pos.coordOfRangeD(3, 2);
                    this._posOfRange3NonTerrainWallNotNearEdge = this.room.heap.posOfRange3NonTerrainWallNotNearEdge[this.id];
                }
                this._posOfRange3NonTerrainWallNotNearEdge = this._posOfRange3NonTerrainWallNotNearEdge.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange3NonTerrainWallNotNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posOfRange4NonTerrainWallNotNearEdge', {
		get() {
            if (typeof this._posOfRange4NonTerrainWallNotNearEdge === "undefined") {
                if (typeof this.room.heap.posOfRange4NonTerrainWallNotNearEdge === "undefined") this.room.heap.posOfRange4NonTerrainWallNotNearEdge = {};

                this._posOfRange4NonTerrainWallNotNearEdge = this.room.heap.posOfRange4NonTerrainWallNotNearEdge[this.id];
                if ((typeof this._posOfRange4NonTerrainWallNotNearEdge === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posOfRange4NonTerrainWallNotNearEdge[this.id] = this.pos.coordOfRangeD(4, 2);
                    this._posOfRange4NonTerrainWallNotNearEdge = this.room.heap.posOfRange4NonTerrainWallNotNearEdge[this.id];
                }
                this._posOfRange4NonTerrainWallNotNearEdge = this._posOfRange4NonTerrainWallNotNearEdge.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posOfRange4NonTerrainWallNotNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posInRange3NonTerrainWallNotNearEdge', {
		get() {
            if (typeof this._posInRange3NonTerrainWallNotNearEdge === "undefined") {
                if (typeof this.room.heap.posInRange3NonTerrainWallNotNearEdge === "undefined") this.room.heap.posInRange3NonTerrainWallNotNearEdge = {};

                this._posInRange3NonTerrainWallNotNearEdge = this.room.heap.posInRange3NonTerrainWallNotNearEdge[this.id];
                if ((typeof this._posInRange3NonTerrainWallNotNearEdge === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posInRange3NonTerrainWallNotNearEdge[this.id] = this.pos.coordInRangeD(3, 2);
                    this._posInRange3NonTerrainWallNotNearEdge = this.room.heap.posInRange3NonTerrainWallNotNearEdge[this.id];
                }
                this._posInRange3NonTerrainWallNotNearEdge = this._posInRange3NonTerrainWallNotNearEdge.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posInRange3NonTerrainWallNotNearEdge;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'nipCornersNotInRange4Controller', {
		get() {
            if (typeof this._nipCornersNotInRange4Controller === "undefined") {
                if (typeof this.room.heap.nipCornersNotInRange4Controller === "undefined") this.room.heap.nipCornersNotInRange4Controller = {};

                this._nipCornersNotInRange4Controller = this.room.heap.nipCornersNotInRange4Controller[this.id];
                if ((typeof this._nipCornersNotInRange4Controller === "undefined") || (this instanceof Creep)) {
                    this.room.heap.nipCornersNotInRange4Controller[this.id] = this.nips.filter(f => f.isDistance2(this) && !f.inRange3(this.room.controller));
                    this._nipCornersNotInRange4Controller = this.room.heap.nipCornersNotInRange4Controller[this.id];
                }
                this._nipCornersNotInRange4Controller = this._nipCornersNotInRange4Controller.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._nipCornersNotInRange4Controller;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'nipDistance4FromController', {
		get() {
            if (typeof this._nipDistance4FromController === "undefined") {
                if (typeof this.room.heap.nipDistance4FromController === "undefined") this.room.heap.nipDistance4FromController = {};

                this._nipDistance4FromController = this.room.heap.nipDistance4FromController[this.id];
                if ((typeof this._nipDistance4FromController === "undefined") || (this instanceof Creep)) {
                    this.room.heap.nipDistance4FromController[this.id] = this.nips.filter(f => f.isDistance4(this.room.controller) && f.isRange4(this.room.controller));
                    this._nipDistance4FromController = this.room.heap.nipDistance4FromController[this.id];
                }
                this._nipDistance4FromController = this._nipDistance4FromController.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._nipDistance4FromController;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'posInRange6ControllerOfRange6', {
		get() {
            if (typeof this._posInRange6ControllerOfRange6 === "undefined") {
                if (typeof this.room.heap.posInRange6ControllerOfRange6 === "undefined") this.room.heap.posInRange6ControllerOfRange6 = {};

                this._posInRange6ControllerOfRange6 = this.room.heap.posInRange6ControllerOfRange6[this.id];
                if ((typeof this._posInRange6ControllerOfRange6 === "undefined") || (this instanceof Creep)) {
                    this.room.heap.posInRange6ControllerOfRange6[this.id] = _.sortByOrder(this.room.controller.posOfRange6NotNearEdge.filter(f => f.inRange6(this)), [sortRange => sortRange.getRangeTo(this), sortDistance => sortDistance.getDistanceTo(this)]);
                    this._posInRange6ControllerOfRange6 = this.room.heap.posInRange6ControllerOfRange6[this.id];
                }
                this._posInRange6ControllerOfRange6 = this._posInRange6ControllerOfRange6.map(m => new RoomPosition(m.x, m.y, this.room.name));
            }
            return this._posInRange6ControllerOfRange6;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * This is the location that a source keeper would normally move to and guard.
	 * This position should be avoided when traveling.
	 */
	Object.defineProperty(RoomObject.prototype, 'sourceKeeperPos', {
		get() {
			if (typeof this._sourceKeeperPos === "undefined") {
				if (this.room.isSKRoom) {
					this._sourceKeeperPos = this.room.getSourceKeeperPosByResource(this);
				} else {
					this._sourceKeeperPos = null;
				}
			}
			return this._sourceKeeperPos;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * This is the keepers lair that is associated with this resource (source or mineral).
	 */
	Object.defineProperty(RoomObject.prototype, 'keeperLair', {
		get() {
			if (typeof this._keeperLair === "undefined") {
				if (this.room.isSKRoom) {
					if (this.room.heap.resourceKeeperLair === undefined) this.room.heap.resourceKeeperLair = {};

					let id = this.room.heap.resourceKeeperLair[this.id];
					if (typeof id === "undefined") {
						let lair = this.room.keeperLairs.find(f => f.pos.inRange6(this));
						this.room.heap.resourceKeeperLair[this.id] = lair ? lair.id : null;
						id = this.room.heap.resourceKeeperLair[this.id];
					}
					this._keeperLair = id ? Game.getObjectById(id) : null;
				}
				else {
					this._keeperLair = null;
				}
			}
			return this._keeperLair;
		},
		configurable: true, enumerable: true,
    });

    /**
     * This type of RoomObject is really a Source Keeper Lair.
     * KeepersLair will start spawning every 300 ticks once keeper is initially damaged (not necessarily killed) or after it dies of old age (actual trigger is unknown.)
     */
	Object.defineProperty(RoomObject.prototype, 'sourceKeeper', {
		get() {
			if (typeof this._sourceKeeper === "undefined") {
                this._sourceKeeper = null;
				if (this.room.isSKRoom) {
					if (typeof this.room.heap.sourceKeepers === "undefined") this.room.heap.sourceKeepers = {};

                    if (typeof this.room.heap.sourceKeepers[this.id] === "undefined") this.room.heap.sourceKeepers[this.id] = {};
					let data = this.room.heap.sourceKeepers[this.id];

                    // Try to resolve our keeper with what we have in memory.
                    this._sourceKeeper = (data.id && Game.getObjectById(data.id)) || null;

                    // Do we still have a valid id and time?
                    if (!this._sourceKeeper) data.id = null;
                    if (!data.t) data.t = Game.time;

                    // We know when the lair will respawn, or at least the interval when they should be respawning in a fresh room.
					if (!data.id && (data.t <= Game.time)) {
                        data.t = Game.time + (this.ticksToSpawn || ENERGY_REGEN_TIME);

                        // Purposely setting this to null (not undefined) so that the call is cached for one tick.
                        this._sourceKeeper = this.room.sourceKeepers.find(f => f.name === 'Keeper' + this.id) || null;
                        data.id = this._sourceKeeper ? this._sourceKeeper.id : null;
					}
				}
			}
			return this._sourceKeeper;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'xyInRange1', {
        get() {
			if (typeof this._xyInRange1 === "undefined") {
                if (typeof this.room.heap.xyInRange1 === "undefined") this.room.heap.xyInRange1 = {};

                this._xyInRange1 = this.room.heap.xyInRange1[this.id];
                if (typeof this._xyInRange1 === "undefined") {
                    this.room.heap.xyInRange1[this.id] = this.pos.xyInRange1;
                    this._xyInRange1 = this.room.heap.xyInRange1[this.id];
                }
            }
            return this._xyInRange1;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'xyOfRange2', {
        get() {
			if (typeof this._xyOfRange2 === "undefined") {
                if (typeof this.room.heap.xyOfRange2 === "undefined") this.room.heap.xyOfRange2 = {};

                this._xyOfRange2 = this.room.heap.xyOfRange2[this.id];
                if (typeof this._xyOfRange2 === "undefined") {
                    this.room.heap.xyOfRange2[this.id] = this.pos.xyOfRange2;
                    this._xyOfRange2 = this.room.heap.xyOfRange2[this.id];
                }
            }
            return this._xyOfRange2;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'coordOfRange6NotNearEdge', {
        get() {
			if (typeof this._coordOfRange6NotNearEdge === "undefined") {
                if (typeof this.room.heap.coordOfRange6NotNearEdge === "undefined") this.room.heap.coordOfRange6NotNearEdge = {};

                this._coordOfRange6NotNearEdge = this.room.heap.coordOfRange6NotNearEdge[this.id];
                if (typeof this._coordOfRange6NotNearEdge === "undefined") {
                    this.room.heap.coordOfRange6NotNearEdge[this.id] = this.pos.coordOfRangeD(6, 2);
                    this._coordOfRange6NotNearEdge = this.room.heap.coordOfRange6NotNearEdge[this.id];
                }
            }
            return this._coordOfRange6NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'posOfRange6NotNearEdge', {
        get() {
			if (typeof this._posOfRange6NotNearEdge === "undefined") {
                this._posOfRange6NotNearEdge = this.coordOfRange6NotNearEdge.map(m => new RoomPosition(m.x, m.y, this.pos.roomName));
            }
            return this._posOfRange6NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'coordOfRange7NotNearEdge', {
        get() {
			if (typeof this._coordOfRange7NotNearEdge === "undefined") {
                if (typeof this.room.heap.coordOfRange7NotNearEdge === "undefined") this.room.heap.coordOfRange7NotNearEdge = {};

                this._coordOfRange7NotNearEdge = this.room.heap.coordOfRange7NotNearEdge[this.id];
                if (typeof this._coordOfRange7NotNearEdge === "undefined") {
                    this.room.heap.coordOfRange7NotNearEdge[this.id] = this.pos.coordOfRangeD(7, 2);
                    this._coordOfRange7NotNearEdge = this.room.heap.coordOfRange7NotNearEdge[this.id];
                }
            }
            return this._coordOfRange7NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'posOfRange7NotNearEdge', {
        get() {
			if (typeof this._posOfRange7NotNearEdge === "undefined") {
                this._posOfRange7NotNearEdge = this.coordOfRange7NotNearEdge.map(m => new RoomPosition(m.x, m.y, this.pos.roomName));
            }
            return this._posOfRange7NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'coordInRange3NotNearEdge', {
        get() {
			if (typeof this._coordInRange3NotNearEdge === "undefined") {
                if (typeof this.room.heap.coordInRange3NotNearEdge === "undefined") this.room.heap.coordInRange3NotNearEdge = {};

                this._coordInRange3NotNearEdge = this.room.heap.coordInRange3NotNearEdge[this.id];
                if (typeof this._coordInRange3NotNearEdge === "undefined") {
                    this.room.heap.coordInRange3NotNearEdge[this.id] = this.pos.coordInRange3NotNearEdge;
                    this._coordInRange3NotNearEdge = this.room.heap.coordInRange3NotNearEdge[this.id];
                }
            }
            return this._coordInRange3NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'coordOfRange4NotNearEdge', {
        get() {
			if (typeof this._coordOfRange4NotNearEdge === "undefined") {
                if (typeof this.room.heap.coordOfRange4NotNearEdge === "undefined") this.room.heap.coordOfRange4NotNearEdge = {};

                this._coordOfRange4NotNearEdge = this.room.heap.coordOfRange4NotNearEdge[this.id];
                if (typeof this._coordOfRange4NotNearEdge === "undefined") {
                    this.room.heap.coordOfRange4NotNearEdge[this.id] = this.pos.coordOfRange4NotNearEdge;
                    this._coordOfRange4NotNearEdge = this.room.heap.coordOfRange4NotNearEdge[this.id];
                }
            }
            return this._coordOfRange4NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

	/**
	 * Note this requires and 'id' property for objects that consume it.
	 * RoomObject does not have an 'id' property itself.
	 */
    Object.defineProperty(RoomObject.prototype, 'coordInRange1NotNearEdge', {
        get() {
			if (typeof this._coordInRange1NotNearEdge === "undefined") {
                if (typeof this.room.heap.coordInRange1NotNearEdge === "undefined") this.room.heap.coordInRange1NotNearEdge = {};

                this._coordInRange1NotNearEdge = this.room.heap.coordInRange1NotNearEdge[this.id];
                if (typeof this._coordInRange1NotNearEdge === "undefined") {
                    this.room.heap.coordInRange1NotNearEdge[this.id] = this.pos.coordInRange1NotNearEdge;
                    this._coordInRange1NotNearEdge = this.room.heap.coordInRange1NotNearEdge[this.id];
                }
            }
            return this._coordInRange1NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'posInRange1EnterableOffEdge', {
        get() {
			if (this._posInRange1EnterableOffEdge === undefined) {
                this._posInRange1EnterableOffEdge = this.pos.posInRangeDEnterable(1, 1);
            }
            return this._posInRange1EnterableOffEdge;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'freeRampartNearTo', {
		get() {
			if (typeof this._freeRampartNearTo === "undefined") {
				this._freeRampartNearTo = this.room.myRamparts.find(f => f.pos.isNearTo(this) && !f.pos.lookForCreep()) || null;
			}
			return this._freeRampartNearTo;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(RoomObject.prototype, 'freeRampartInRange3', {
		get() {
			if (typeof this._freeRampartInRange3 === "undefined") {
				this._freeRampartInRange3 = this.pos.findClosestByRange(this.room.myRamparts.filter(f => f.pos.inRange3(this) && !f.pos.lookForCreep()));
			}
			return this._freeRampartInRange3;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(RoomObject.prototype, 'posSwampRing2NearNips', {
		get() {
			if (typeof this._posSwampRing2NearNips === "undefined") {
                if (typeof this.room.heap.posSwampRing2NearNips === "undefined") this.room.heap.posSwampRing2NearNips = {};

                this._posSwampRing2NearNips = this.room.heap.posSwampRing2NearNips[this.id];
                if (typeof this._posSwampRing2NearNips === "undefined") {
                    this.room.heap.posSwampRing2NearNips[this.id] = this.pos.posOfRing2NotNearEdge.filter(r2 => r2.isTerrainSwamp && this.nips.find(nip => nip.isNearTo(r2))).map(m => utils.coordFromPos(m));
                    this._posSwampRing2NearNips = this.room.heap.posSwampRing2NearNips[this.id];
                }
				this._posSwampRing2NearNips = this._posSwampRing2NearNips.map(m => utils.posFromCoord(m, this.room.name));
            }
            return this._posSwampRing2NearNips;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(RoomObject.prototype, 'hasSwampRing2NearNipsNoRoad', {
		get() {
			if (typeof this._hasSwampRing2NearNipsNoRoad === "undefined") {
				this._hasSwampRing2NearNipsNoRoad = this.posSwampRing2NearNips.find(f => !f.hasRoad) || null;
			}
			return this._hasSwampRing2NearNipsNoRoad;
		},
		configurable: true, enumerable: true,
	});

};
