"use strict";

module.exports = function() {

	Object.defineProperty(Source.prototype, 'harvestPos', {
		get() {
			if (typeof this._harvestPos === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				let roomMemory = this.room.memory;
				if (!roomMemory[C.MEMORY_KEY_SOURCES]) roomMemory[C.MEMORY_KEY_SOURCES] = {};
				if (!roomMemory[C.MEMORY_KEY_SOURCES][this.id]) roomMemory[C.MEMORY_KEY_SOURCES][this.id] = {};

				if (roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_HARVEST_POS]) {
					object = unpackCoordAsPos(roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_HARVEST_POS], this.room.name);
				}

				if (!object) {
					console.log('ALERT: source.harvestPos lookup:', this.room.print, this.pos.name, this.id)

					// Find the nip closest to the controller.
					// This is the most consistant way of finding a spot that does not have any variables and should never change.
					let nips = this.nips;
					if (nips.length > 1) {
						if (this.room.controller) nips = nips.filter(nip => !nip.isNearTo(this.room.controller));
						if (this.room.sources.length > 1) nips = nips.filter(nip => !this.room.sources.find(otherSource => (this.id !== otherSource.id) && nip.isNearTo(otherSource)));
						//if (this.room.minerals.length) nips = nips.filter(nip => !this.room.minerals.find(mineral => nip.isNearTo(mineral)));
						if (this.room.mineral) nips = nips.filter(nip => !nip.isNearTo(this.room.mineral));
						if (this.room.isSKRoom) nips = nips.filter(nip => !nip.isEqualTo(this.sourceKeeperPos));
					}
					if (nips.length === 0) nips = this.nips;

					if (this.room.isSKRoom) {
						// For SK rooms, we want to align AWAY from the nearest keepers lair.
						let alignToPos = this.keeperLair.pos;
						let exits = this.room.exits;

						object = _.sortByOrder(nips, [
							// Positions outside of exit range will always be preferred, but since none may be available
							// include them and we will put ramparts on them.
							sortExits => exits.find(f => f.inRange4(sortExits)) ? 1 : 0

							// Now pick the spot that is vertically/horizontally furthest from us.
							, sortAlignToPos => -sortAlignToPos.getDistanceTo(alignToPos)
						]).find(x => x !== undefined);
					}
					else {
						// Core and controller rooms, align to the controller or center of the room.
						let alignToPos = this.room.controller ? this.room.controller.pos : new RoomPosition(25, 25, this.room.name);
						let exits = this.room.exits;

						object = _.sortByOrder(nips, [
							// Positions outside of exit range will always be preferred, but since none may be available
							// include them and we will put ramparts on them.
							sortExits => exits.find(f => f.inRange4(sortExits)) ? 1 : 0

							// If there is a controller, then try to get a spot that at range 3 or better if possible.
							// Trying to get a harvesting creep past a wall of upgraders would not be fun.
							, sortController => !this.room.controller ? 0 : -Math.min(3, sortController.getRangeTo(this.room.controller))

							// Now pick the spot that is vertically/horizontally closest to us.
							, sortAlignToPos => sortAlignToPos.getDistanceTo(alignToPos)
						]).find(x => x !== undefined);
					}
				}

				// Cache the object for next time.
				if (object) {
					roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_HARVEST_POS] = packCoord(object)
				}
				else {
					delete roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_HARVEST_POS];
				}

				this._harvestPos = object || null;
            }
			return this._harvestPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourceContainer', {
		get() {
			if (typeof this._sourceContainer === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				let roomMemory = this.room.heap;
				if (!roomMemory[C.MEMORY_KEY_SOURCES]) roomMemory[C.MEMORY_KEY_SOURCES] = {};

				if (roomMemory[C.MEMORY_KEY_SOURCES][this.id] && roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER]) {
					object = Game.getObjectById(roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER]);
				}

				if (!object) {
					object = this.harvestPos.lookForStructure(STRUCTURE_CONTAINER);
				}

				// Cache the object Id for next time.
				if (object) {
					if (!roomMemory[C.MEMORY_KEY_SOURCES][this.id]) roomMemory[C.MEMORY_KEY_SOURCES][this.id] = {};
					roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER] = object.id;
				}
				else {
					if (roomMemory[C.MEMORY_KEY_SOURCES][this.id]) delete roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER];
				}

				this._sourceContainer = object || null;
            }
			return this._sourceContainer;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourceContainerRoadPos', {
		get() {
			if (typeof this._sourceContainerRoadPos === "undefined") {
				this._sourceContainerRoadPos = null;
				let roomMemory = this.room.memory;
				if (roomMemory[C.MEMORY_KEY_SOURCES] && roomMemory[C.MEMORY_KEY_SOURCES][this.id] && roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER_ROAD]) {
					this._sourceContainerRoadPos = unpackPos(roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER_ROAD]);
				}
            }
			return this._sourceContainerRoadPos;
		},
		set(value) {
			let roomMemory = this.room.memory;
			if (value) {
				if (!roomMemory[C.MEMORY_KEY_SOURCES]) roomMemory[C.MEMORY_KEY_SOURCES] = {};
				if (!roomMemory[C.MEMORY_KEY_SOURCES][this.id]) roomMemory[C.MEMORY_KEY_SOURCES][this.id] = {};
				roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER_ROAD] = packPos(value);
			} else {
				if (roomMemory[C.MEMORY_KEY_SOURCES] && roomMemory[C.MEMORY_KEY_SOURCES][this.id]) {
					delete roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_CONTAINER_ROAD];
				}
			}
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourcePathLength', {
		get() {
			if (typeof this._sourcePathLength === "undefined") {
				this._sourcePathLength = null;
				let roomMemory = this.room.memory;
				if (roomMemory[C.MEMORY_KEY_SOURCES] && roomMemory[C.MEMORY_KEY_SOURCES][this.id] && roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_PATH_LENGTH]) {
					this._sourcePathLength = roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_PATH_LENGTH];
				}
            }
			return this._sourcePathLength;
		},
		set(value) {
			let roomMemory = this.room.memory;
			if (value) {
				if (!roomMemory[C.MEMORY_KEY_SOURCES]) roomMemory[C.MEMORY_KEY_SOURCES] = {};
				if (!roomMemory[C.MEMORY_KEY_SOURCES][this.id]) roomMemory[C.MEMORY_KEY_SOURCES][this.id] = {};
				roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_PATH_LENGTH] = value;
			} else {
				if (roomMemory[C.MEMORY_KEY_SOURCES] && roomMemory[C.MEMORY_KEY_SOURCES][this.id]) {
					delete roomMemory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_PATH_LENGTH];
				}
			}
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourceLinkPos', {
		get() {
			if (typeof this._sourceLinkPos === "undefined") {
				this._sourceLinkPos = _.sortByOrder(
					this.harvestPos.posOfRangeDNonTerrainWall(1).filter(f =>
						// Allow being directly next to the controller, or range3...just not range2, which is reserved for controllerLink.
						!f.isRange2(this.room.controller)
						// But if we are next to the controller, then it has to have multiple nips.
						&& (!f.isNearTo(this.room.controller) || (this.room.controller.nips.length >= 2))
						// Do not allow being next to any mineral.
						//&& !this.room.minerals.find(f2 => f2.pos.isNearTo(f))
						&& !this.room.mineral.pos.isNearTo(f)
						// Do not allow to be in range 2 of another source, or the links will be confused.
						&& !this.room.sources.filter(f2 => f2.id !== this.id).find(f3 => f3.pos.inRange2(f))
						// Do not allow to be ouside of wall.
						&& !f.isNearEdge
						// Do not allow within 5 of the colony flag.
						&& (!this.room.colonyFlagAnyColor || !f.inDistance5(this.room.colonyFlagAnyColor))
					)
					, [
						// Positions outside of exit range will always be preferred, but since none may be available
						// include them and we will put ramparts on them.
						sortPerimeter => sortPerimeter.inRange4Edge ? 1 : 0
						// Try not to be in the way of controller upgraders/pages if possible.
						, sortRangeToController => -Math.min(5, sortRangeToController.getRangeTo(this.room.controller))
						// Closer to center of room is better, more likely to be less cost transmitting.
						, sortRangeToCenter => sortRangeToCenter.rangeToCenter
						// The closer to the source the better, to prevent traffic jams.
						, sortRangeToSource => sortRangeToSource.getRangeTo(this)
						// Pick the spot that is vertically/horizontally further to us, so diagonal movement can occur.
						, sortDistanceToSource => -sortDistanceToSource.getDistanceTo(this)
					]
				).find(x => x !== undefined);
			}
			return this._sourceLinkPos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Source.prototype, 'sourceLink', {
		get() {
			if (typeof this._sourceLink === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (!this.room.memory[C.MEMORY_KEY_SOURCES]) this.room.memory[C.MEMORY_KEY_SOURCES] = {};

				// Source links are created after colonyLink and controllerLink.
				if (this.room.my && (CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.room.controller.level] > 2)) {
					if (this.room.memory[C.MEMORY_KEY_SOURCES][this.id] && this.room.memory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_LINK]) {
						object = Game.structures[this.room.memory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_LINK]];
					}

					if (!object) {
						object = this.sourceLinkPos.lookForLink();
					}
				}

				// Cache the object Id for next time.
				if (object) {
					if (!this.room.memory[C.MEMORY_KEY_SOURCES][this.id]) this.room.memory[C.MEMORY_KEY_SOURCES][this.id] = {};
					this.room.memory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_LINK] = object.id;
				}
				else {
					if (this.room.memory[C.MEMORY_KEY_SOURCES][this.id]) delete this.room.memory[C.MEMORY_KEY_SOURCES][this.id][C.MEMORY_KEY_SOURCES_LINK];
				}

				this._sourceLink = object || null;
            }
			return this._sourceLink;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourceConstructionContainer', {
		get() {
			if (typeof this._sourceConstructionContainer === "undefined") {
                this._sourceConstructionContainer = this.room.myConstructionSites.find(f => (f.structureType === STRUCTURE_CONTAINER) && f.pos.getRangeTo(this) <= 1) || null;
            }
			return this._sourceConstructionContainer;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'sourceConstructionLink', {
		get() {
			if (typeof this._sourceConstructionLink === "undefined") {
                this._sourceConstructionLink = this.room.myConstructionSites.find(f => (f.structureType === STRUCTURE_LINK) && f.pos.getRangeTo(this) <= Config.params.SOURCE_LINK_RANGE) || null;
            }
			return this._sourceConstructionLink;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'operateTicksRemaining', {
		get() {
            if (typeof this._operateTicksRemaining === "undefined") {
                this._operateTicksRemaining = this.effectTicksRemaining(PWR_REGEN_SOURCE);
            }
			return this._operateTicksRemaining;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'harvestingCreeps', {
		get() {
			// Cannot be cached due to harvest property.
            return this.room.myCreeps.filter(f => (f.harvestId === this.id) || (f.focusId === this.id));
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'harvestingCreepPower', {
		get() {
			// Cannot be cached due to harvest property.
            return _.sum(this.harvestingCreeps.map(m => m.harvestSourceBasePower));
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'needsHarvester', {
		get() {
			// Cannot be cached due to harvest property.
			// Do not exceed our available nips or harvesting capacity.
            return (this.harvestingCreeps.length < this.nips.length) && (this.harvestingCreepPower < this.power);
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Source.prototype, 'power', {
		get() {
            return this.energyCapacity / ENERGY_REGEN_TIME;
		},
		configurable: true, enumerable: true,
    });

};
