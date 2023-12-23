"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

	/*** SEASONAL STRUCTURES ***/
	Object.defineProperty(Room.prototype, 'reactor', {
		get() {
			if (typeof this._reactor === "undefined") {
				// This will fined owned hostile structures.  Unowned structures are not included, like containers and roads.
				this._reactor = this.find(C.FIND_REACTORS).find(x => x !== undefined);
				if (Game.flags.FIND_REACTORS) utils.printStack(this.print, 'FIND_REACTORS');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_REACTORS')
			}
			return this._reactor;
		},
		configurable: true, enumerable: true,
	});


	/*** ALL STRUCTURES ***/
	Object.defineProperty(Room.prototype, 'structures', {
		get() {
			if (typeof this._structures === "undefined") {
				this._structures = this.find(FIND_STRUCTURES);
				if (Game.flags.FIND_STRUCTURES) utils.printStack(this.print, 'FIND_STRUCTURES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_STRUCTURES')
			}
			return this._structures;
		},
		configurable: true, enumerable: true,
	});

	// // Interesting alternative approach...as discussed on Discord #cpu-clinic
	// Object.defineProperty(Room.prototype, 'structures', {
	// 	get() {
	// 		return Object.defineProperty(this, 'structures', { value: this.find(FIND_STRUCTURES) }).structures;
	// 	}
	// 	, configurable: true, enumerable: true
    // });

	Object.defineProperty(Room.prototype, 'structureGroups', {
		get() {
			if (typeof this._structureGroups === "undefined") {
				this._structureGroups = utils.groupBy(this.structures, 'structureType');
			}
			return this._structureGroups;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.getStructureGroups = function(structureTypes) {
		let result = [];
		for (let structureType of structureTypes) {
			if (this.structureGroups[structureType]) result = result.length ? result.concat(this.structureGroups[structureType]) : this.structureGroups[structureType];
		}
		return result;
	};

    Room.prototype.getStructureTypesExcluding = function(structureTypes) {
		return Object.keys(this.structureGroups).filter(f => !structureTypes[f]);
	};


	/*** MY OWNED STRUCTURES ***/
	Object.defineProperty(Room.prototype, 'myStructures', {
		get() {
			if (typeof this._myStructures === "undefined") {
				this._myStructures = this.find(FIND_MY_STRUCTURES);
				if (Game.flags.FIND_MY_STRUCTURES) utils.printStack(this.print, 'FIND_MY_STRUCTURES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_MY_STRUCTURES')
			}
			return this._myStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myStructureGroups', {
		get() {
			if (typeof this._myStructureGroups === "undefined") {
				this._myStructureGroups = utils.groupBy(this.myStructures, 'structureType');
			}
			return this._myStructureGroups;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.getMyStructureGroups = function(structureTypes) {
		let result = [];
		for (let structureType of structureTypes) {
			if (this.myStructureGroups[structureType]) result = result.length ? result.concat(this.myStructureGroups[structureType]) : this.myStructureGroups[structureType];
		}
		return result;
	};

    Room.prototype.getMyStructureTypesExcluding = function(structureTypes) {
		return Object.keys(this.myStructureGroups).filter(f => !structureTypes[f]);
	};


	/*** HOSTILE STRUCTURES ***/
	Object.defineProperty(Room.prototype, 'hostileStructures', {
		get() {
			if (typeof this._hostileStructures === "undefined") {
				// This will fined owned hostile structures.  Unowned structures are not included, like containers and roads.
				this._hostileStructures = this.find(FIND_HOSTILE_STRUCTURES);
				if (Game.flags.FIND_HOSTILE_STRUCTURES) utils.printStack(this.print, 'FIND_HOSTILE_STRUCTURES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_HOSTILE_STRUCTURES')
			}
			return this._hostileStructures;
		},
		configurable: true, enumerable: true,
	});


    Room.prototype.hostileStructuresFilter = function(structure) {
		const structureTypes = {
			[STRUCTURE_CONTROLLER]: true
			, [STRUCTURE_POWER_BANK]: true
			, [STRUCTURE_KEEPER_LAIR]: true
		}
        return (
			!structure.my
			&& structure.owner  // Excludes walls, roads, containers of all kinds
			&& !structureTypes[structure.structureType]
		);
	}

    Room.prototype.massAttackStructuresFilter = function(structure) {
		const structureTypes = {
			[STRUCTURE_ROAD]: true
			, [STRUCTURE_WALL]: true
			, [STRUCTURE_KEEPER_LAIR]: true
			, [STRUCTURE_PORTAL]: true
			, [STRUCTURE_CONTROLLER]: true
			, [STRUCTURE_POWER_BANK]: true
			, [STRUCTURE_CONTAINER]: true
			, [STRUCTURE_INVADER_CORE]: true
		}
        return (
			!structure.my
			&& !structureTypes[structure.structureType]
		);
	}


	Object.defineProperty(Room.prototype, 'hostileStructureGroups', {
		get() {
			if (typeof this._hostileStructureGroups === "undefined") {
				this._hostileStructureGroups = utils.groupBy(this.hostileStructures, 'structureType');
			}
			return this._hostileStructureGroups;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.getHostileStructureGroups = function(structureTypes) {
		let result = [];
		for (let structureType of structureTypes) {
			if (this.hostileStructureGroups[structureType]) result = result.length ? result.concat(this.hostileStructureGroups[structureType]) : this.hostileStructureGroups[structureType];
		}
		return result;
	};

    Room.prototype.getHostileStructureTypesExcluding = function(structureTypes) {
		return Object.keys(this.hostileStructureGroups).filter(f => !structureTypes[f]);
	};

	Object.defineProperty(Room.prototype, 'hostileStores', {
		get() {
			if (typeof this._hostileStores === "undefined") {
				this._hostileStores = []
				if (this.hostileStorage) this._hostileStores.push(this.hostileStorage);
				if (this.hostileTerminal) this._hostileStores.push(this.hostileTerminal);
			}
			return this._hostileStores;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostilePlayerBuildings', {
		get() {
			if (typeof this._hostilePlayerBuildings === "undefined") {
				const structureTypes = {
					[STRUCTURE_CONTROLLER]: true
					, [STRUCTURE_POWER_BANK]: true
					, [STRUCTURE_KEEPER_LAIR]: true
					, [STRUCTURE_INVADER_CORE]: true
				}
				// Remove any weird non-player built structures like controllers, power banks, keepers lairs, invader cores, etc.
				this._hostilePlayerBuildings = this.controller ? this.getHostileStructureGroups(this.getHostileStructureTypesExcluding(structureTypes)) : [];
			}
			return this._hostilePlayerBuildings;
		},
		configurable: true, enumerable: true,
	});


	/*** INVADER STRUCTURES ***/
	Object.defineProperty(Room.prototype, 'invaderStructures', {
		get() {
			if (typeof this._invaderStructures === "undefined") {
				const types = [
					STRUCTURE_INVADER_CORE
					, STRUCTURE_TOWER
					, STRUCTURE_CONTAINER
					, STRUCTURE_RAMPART
				]
				// When strongholds first appear, for some reason they are assigned 1 point. These are public walkable and do not need to be destroyed.
				this._invaderStructures = (this.isSKRoom || this.reservedBy) ? this.getStructureGroups(types).filter(f => f.hasEffect(EFFECT_COLLAPSE_TIMER)) : [];
			}
			return this._invaderStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'massAttackInvaderStructures', {
		get() {
			if (typeof this._massAttackInvaderStructures === "undefined") {
				const types = [
					STRUCTURE_INVADER_CORE
					, STRUCTURE_TOWER
					, STRUCTURE_RAMPART
				]
				// When strongholds first appear, for some reason they are assigned 1 point. These are public walkable and do not need to be destroyed.
				this._massAttackInvaderStructures = (this.isSKRoom || this.reservedBy) ? this.getStructureGroups(types).filter(f => f.hasEffect(EFFECT_COLLAPSE_TIMER)) : [];
			}
			return this._massAttackInvaderStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dismantlableInvaderStructures', {
		get() {
			if (typeof this._dismantlableInvaderStructures === "undefined") {
				const types = [
					STRUCTURE_TOWER
					, STRUCTURE_CONTAINER
					, STRUCTURE_RAMPART
				]
				// Only SK rooms can have invader structures.
				this._dismantlableInvaderStructures = this.isSKRoom ? this.getStructureGroups(types).filter(f => f.hasEffect(EFFECT_COLLAPSE_TIMER)) : [];
			}
			return this._dismantlableInvaderStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myNonControllerStructures', {
		get() {
			if (typeof this._myNonControllerStructures === "undefined") {
				const types = {
					[STRUCTURE_CONTROLLER]: true
				}
				this._myNonControllerStructures = this.getMyStructureGroups(this.getMyStructureTypesExcluding(types))
			}
			return this._myNonControllerStructures;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * My structures that we care to put ramparts over if needed (near walls).
	 */
	Object.defineProperty(Room.prototype, 'protectedPerimeterStructures', {
		get() {
			if (typeof this._protectedPerimeterStructures === "undefined") {
				const excludedTypes = {
					[STRUCTURE_RAMPART]: true
					, [STRUCTURE_EXTRACTOR]: true
				}
				// Filter on my owned structures other than ramparts (duh) and extractors (can't build ramparts on top of wall terrain).
				this._protectedPerimeterStructures = this.getMyStructureGroups(this.getMyStructureTypesExcluding(excludedTypes));
			}
			return this._protectedPerimeterStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonDecayStructures', {
		get() {
			if (typeof this._nonDecayStructures === "undefined") {
				const excludedTypes = {
					[STRUCTURE_CONTAINER]: true
					, [STRUCTURE_ROAD]: true
					, [STRUCTURE_RAMPART]: true
				}
				this._nonDecayStructures = this.getStructureGroups(this.getStructureTypesExcluding(excludedTypes));
			}
			return this._nonDecayStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'decayStructures', {
		get() {
			if (typeof this._decayStructures === "undefined") {
				const types = [
					STRUCTURE_CONTAINER
					, STRUCTURE_ROAD
					, STRUCTURE_RAMPART
				]
				this._decayStructures = this.getStructureGroups(types);
			}
			return this._decayStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'infrastructure', {
		get() {
			if (typeof this._infrastructure === "undefined") {
				const types = [
					STRUCTURE_CONTAINER
					, STRUCTURE_ROAD
				]
				this._infrastructure = this.getStructureGroups(types);
			}
			return this._infrastructure;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roads', {
		get() {
			if (typeof this._roads === "undefined") {
				this._roads = this.getStructureGroups([STRUCTURE_ROAD]);
			}
			return this._roads;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'walls', {
		get() {
			if (typeof this._walls === "undefined") {
				this._walls = this.getStructureGroups([STRUCTURE_WALL]);
			}
			return this._walls;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'ramparts', {
		get() {
			if (typeof this._ramparts === "undefined") {
				this._ramparts = this.getStructureGroups([STRUCTURE_RAMPART]);
			}
			return this._ramparts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'dangerousPlayerBarriersSorted', {
		get() {
			if (typeof this._dangerousPlayerBarriersSorted === "undefined") {
				this._dangerousPlayerBarriersSorted = [];
				if (!this.safeMode && this.dangerousPlayerHostiles.length) {
					//this._dangerousPlayerBarriersSorted = this.barriersSorted.filter(f => f.pos.findInRange(this.dangerousPlayerHostiles, 3).length);
					this._dangerousPlayerBarriersSorted = this.barriersSorted.filter(f => this.dangerousPlayerHostiles.find(f2 => f2.pos.inRange3(f)));
				}
			}
			return this._dangerousPlayerBarriersSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'spawns', {
		get() {
			if (typeof this._spawns === "undefined") {
				//this._spawns = this.getStructureGroups([STRUCTURE_SPAWN]);
				this._spawns = GameManager.getSpawnsByRoomName(this.name);
			}
			return this._spawns;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'extensions', {
		get() {
			if (typeof this._extensions === "undefined") {
				this._extensions = this.getStructureGroups([STRUCTURE_EXTENSION]);
			}
			return this._extensions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'containers', {
		get() {
			if (typeof this._containers === "undefined") {
				this._containers = this.getStructureGroups([STRUCTURE_CONTAINER]);
			}
			return this._containers;
		},
		configurable: true, enumerable: true,
	});


	/*** DROPS, DECAYABLES, CONTAINERS ***/

	Object.defineProperty(Room.prototype, 'sourceContainers', {
		get() {
			if (typeof this._sourceContainers === "undefined") {
				//if (this.myManagement || this.isCenterRoom) {
					this._sourceContainers = this.sources.map(m => m.sourceContainer).filter(f => !!f);
				// }
				// else {
				// 	this._sourceContainers = [];
				// }
			}
			return this._sourceContainers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonSourceContainers', {
		get() {
			if (typeof this._nonSourceContainers === "undefined") {
				if (this.myManagement || this.isCenterRoom) {
					let sourceContainers = this.sourceContainers;
					if (sourceContainers.length) {
						let ids = utils.arrayToHash(sourceContainers.map(m => m.id));
						this._nonSourceContainers = this.containers.filter(f => !ids[f.id]);
					}
					else {
						this._nonSourceContainers = this.containers;
					}
				}
				else {
					this._nonSourceContainers = this.containers;
				}
			}
			return this._nonSourceContainers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasSourceHarvestPositions', {
		get() {
			if (typeof this._hasSourceHarvestPositions === "undefined") {
				this._hasSourceHarvestPositions = this.myManagement || this.isCenterRoom
			}
			return this._hasSourceHarvestPositions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceHarvestPositions', {
		get() {
			if (typeof this._sourceHarvestPositions === "undefined") {
				if (this.hasSourceHarvestPositions) {
					this._sourceHarvestPositions = this.sources.map(m => m.harvestPos).filter(f => !!f);
				}
				else {
					this._sourceHarvestPositions = [];
				}
			}
			return this._sourceHarvestPositions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceHarvestPositionNamesHash', {
		get() {
			if (typeof this._sourceHarvestPositionNamesHash === "undefined") {
				this._sourceHarvestPositionNamesHash = utils.arrayToHash(this.sourceHarvestPositions.map(m => m.name));
			}
			return this._sourceHarvestPositionNamesHash;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceHarvestDecayables', {
		get() {
			if (typeof this._sourceHarvestDecayables === "undefined") {
				if (this.hasSourceHarvestPositions) {
					let sourceHarvestPositionNamesHash = this.sourceHarvestPositionNamesHash;
					this._sourceHarvestDecayables = this.decayables.filter(f => sourceHarvestPositionNamesHash[f.pos.name]);
				}
				else {
					this._sourceHarvestDecayables = this.decayables;
				}
			}
			return this._sourceHarvestDecayables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonSourceHarvestDecayables', {
		get() {
			if (typeof this._nonSourceHarvestDecayables === "undefined") {
				if (this.hasSourceHarvestPositions) {
					let sourceHarvestPositionNamesHash = this.sourceHarvestPositionNamesHash;
					this._nonSourceHarvestDecayables = this.decayables.filter(f => !sourceHarvestPositionNamesHash[f.pos.name]);
				}
				else {
					this._nonSourceHarvestDecayables = this.decayables;
				}
			}
			return this._nonSourceHarvestDecayables;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceHarvestDrops', {
		get() {
			if (typeof this._sourceHarvestDrops === "undefined") {
				if (this.hasSourceHarvestPositions) {
					let sourceHarvestPositionNamesHash = this.sourceHarvestPositionNamesHash;
					this._sourceHarvestDrops = this.droppedResources.filter(f => sourceHarvestPositionNamesHash[f.pos.name]);
				}
				else {
					this._sourceHarvestDrops = this.droppedResources;
				}
			}
			return this._sourceHarvestDrops;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonSourceHarvestDrops', {
		get() {
			if (typeof this._nonSourceHarvestDrops === "undefined") {
				if (this.hasSourceHarvestPositions) {
					let sourceHarvestPositionNamesHash = this.sourceHarvestPositionNamesHash;
					this._nonSourceHarvestDrops = this.droppedResources.filter(f => !sourceHarvestPositionNamesHash[f.pos.name]);
				}
				else {
					this._nonSourceHarvestDrops = this.droppedResources;
				}
			}
			return this._nonSourceHarvestDrops;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonSourceHarvestDroppedEnergy', {
		get() {
			if (typeof this._nonSourceHarvestDroppedEnergy === "undefined") {
				if (this.hasSourceHarvestPositions) {
					let sourceHarvestPositionNamesHash = this.sourceHarvestPositionNamesHash;
					this._nonSourceHarvestDroppedEnergy = this.droppedEnergy.filter(f => !sourceHarvestPositionNamesHash[f.pos.name]);
				}
				else {
					this._nonSourceHarvestDroppedEnergy = this.droppedEnergy;
				}
			}
			return this._nonSourceHarvestDroppedEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonSourceDroppedEnergy', {
		get() {
			if (typeof this._nonSourceDroppedEnergy === "undefined") {
				this._nonSourceDroppedEnergy = this.droppedEnergy.filter(drop => !this.sources.find(source => source.pos.isNearTo(drop)));
			}
			return this._nonSourceDroppedEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sourceLinks', {
		get() {
			if (typeof this._sourceLinks === "undefined") {
				this._sourceLinks = this.sources.map(m => m.sourceLink).filter(f => !!f);
			}
			return this._sourceLinks;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is called from both creep/tower repair and also from attack role.
	 */
    Room.prototype.barriersFilter = function(structure) {
        return (
			(structure.hits > 0)	// Must be a real wall not novice wall.
			&& (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART)
		);
	}

    Room.prototype.noviceWallsFilter = function(structure) {
        return (
			!structure.hits
		);
	}

	Object.defineProperty(Room.prototype, 'barriers', {
		get() {
			if (typeof this._barriers === "undefined") {
				//this._barriers = this.decayStructures.filter(s => [STRUCTURE_WALL, STRUCTURE_RAMPART].includes(s.structureType));
				//this._barriers = this.decayStructures.filter(s => this.barriersFilter(s));

				this._barriers = this.getStructureGroups([STRUCTURE_WALL, STRUCTURE_RAMPART]).filter(f => f.hits > 0);

				//this._barriers = this.structures.filter(f => this.barriersFilter(f));

				// const types = {
				// 	[STRUCTURE_WALL]: true
				// 	, [STRUCTURE_RAMPART]: true
				// }
				// this._barriers = this.structures.filter(f =>
				// 	types[f.structureType]
				// 	&& (f.hits > 0)	// Must be a real wall not novice wall.
				// );
			}
			return this._barriers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barriersSorted', {
		get() {
			if (typeof this._barriersSorted === "undefined") {
				this._barriersSorted = _.sortBy(this.barriers, s => s.hits);
				GameManager.addProcess('barriersSorted');
			}
			return this._barriersSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barriersSortedByRangeHits', {
		get() {
			if (typeof this._barriersSortedByRangeHits === "undefined") {
				this._barriersSortedByRangeHits = _.sortByOrder(this.barriers, [
					sortRange => sortRange.pos.getRangeTo(this.controller)
					, sortHits => sortHits.hits
				]);
				GameManager.addProcess('barriersSortedByRangeHits');
			}
			return this._barriersSortedByRangeHits;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'rampartsSorted', {
		get() {
			if (typeof this._rampartsSorted === "undefined") {
				this._rampartsSorted = _.sortBy(this.ramparts, s => s.hits);
				GameManager.addProcess('rampartsSorted');
			}
			return this._rampartsSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barriersOneHit', {
		get() {
			if (typeof this._barriersOneHit === "undefined") {
				let barriers = [];
				this.barriersSorted.every(barrier => {
					if (barrier.hits === 1) {
						barriers.push(barrier);
						return true;
					}
					return false;
				})
				this._barriersOneHit = barriers;
				GameManager.addProcess('barriersOneHit');
			}
			return this._barriersOneHit;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'perimeterBarriersSorted', {
		get() {
			if (typeof this._perimeterBarriersSorted === "undefined") {
				this._perimeterBarriersSorted = this.barriersSorted.filter(f => f.pos.inRange4Edge);
				GameManager.addProcess('perimeterBarriersSorted');
			}
			return this._perimeterBarriersSorted;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * TODO: Want to include all potential wall positions and those ramparts just inside the wall that are covering structures.
	 */
	Object.defineProperty(Room.prototype, 'perimeterRampartsSorted', {
		get() {
			if (typeof this._perimeterRampartsSorted === "undefined") {
				this._perimeterRampartsSorted = this.rampartsSorted.filter(f => f.pos.inRange4Edge);
			}
			return this._perimeterRampartsSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nukeBarriersSorted', {
		get() {
			if (typeof this._nukeBarriersSorted === "undefined") {
				this._nukeBarriersSorted = [];
				if (this.isNukeInbound) {
					this._nukeBarriersSorted = this.barriersSorted.filter(f => RoomIntel.getNukePosList.find(nukePos => f.pos.inRange2(nukePos)));
				}
			}
			return this._nukeBarriersSorted;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is the value at which workers should repair barriers.
	 * It does scale with level, and also the state of the room.
	 */
	Object.defineProperty(Room.prototype, 'barrierHitsWorkerRepair', {
		get() {
			if (typeof this._barrierHitsWorkerRepair === "undefined") {
				let multiplier = Config.params.REPAIR_WORKER_THRESHHOLD_PERCENT;

				if (this.safeMode) {
					multiplier = 1;
				}
				else if (this.isStorageEnergyDump && this.myTerminal) {
					multiplier = 1;
				}
				else if (this.atMaxLevel && !GameManager.empireFocusRooms.length) {
					multiplier = 1;
				}

				this._barrierHitsWorkerRepair = this.barrierHits * multiplier;
			}
			return this._barrierHitsWorkerRepair;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is the sum of all all barriers below their peon repair threshhold.
	 */
	Object.defineProperty(Room.prototype, 'barrierHitsBelowWorkerRepairThreshhold', {
		get() {
			if (typeof this._barrierHitsBelowWorkerRepairThreshhold === "undefined") {
				let hitsRepair = this.barrierHitsWorkerRepair;
				this._barrierHitsBelowWorkerRepairThreshhold = this.perimeterBarriersSorted.reduce((a, b) => a + Math.max(0, hitsRepair - b.hits), 0);
			}
			return this._barrierHitsBelowWorkerRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is the sum of all all barriers below their repair threshhold.
	 */
	Object.defineProperty(Room.prototype, 'barrierHitsBelowRepairThreshhold', {
		get() {
			if (typeof this._barrierHitsBelowRepairThreshhold === "undefined") {
				let hitsRepair = this.barrierHits;
				this._barrierHitsBelowRepairThreshhold = this.perimeterBarriersSorted.reduce((a, b) => a + Math.max(0, hitsRepair - b.hits), 0);
			}
			return this._barrierHitsBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barriersBelowRepairThreshhold', {
		get() {
			if (typeof this._barriersBelowRepairThreshhold === "undefined") {
				this._barriersBelowRepairThreshhold = [];

				// We can short circuit this loop by testing if we have any potentials to begin with.
				if (this.hasBarrierBelowRepairThreshhold) {
					// We have the sorted list of barriers.
					// Only need to check the last one and then the first one to know if we have a match.
					let barriers = this.perimeterBarriersSorted;
					let hitsRepair = this.barrierHits;
					barriers.some(barrier => {
						// While the barrier is below our target threshhold, add it to the array.
						if (barrier.hits < hitsRepair) {
							this._barriersBelowRepairThreshhold.push(barrier);
							return false;
						}
						// We have hit a barrier in our sorted array that doesn't need repair, ok to exit the loop now.
						return true;
					});
				}
			}
			return this._barriersBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'barriersBelowWorkerRepairThreshhold', {
		get() {
			if (typeof this._barriersBelowWorkerRepairThreshhold === "undefined") {
				this._barriersBelowWorkerRepairThreshhold = [];

				// We can short circuit this loop by testing if we have any potentials to begin with.
				if (this.hasBarrierBelowWorkerRepairThreshhold) {
					// We have the sorted list of barriers.
					// Only need to check the last one and then the first one to know if we have a match.
					let barriers = this.perimeterBarriersSorted;
					let hitsRepair = this.barrierHits * Config.params.REPAIR_WORKER_THRESHHOLD_PERCENT;
					barriers.some(barrier => {
						// While the barrier is below our target threshhold, add it to the array.
						if (barrier.hits < hitsRepair) {
							this._barriersBelowWorkerRepairThreshhold.push(barrier);
							return false;
						}
						// We have hit a barrier in our sorted array that doesn't need repair, ok to exit the loop now.
						return true;
					});
				}
			}
			return this._barriersBelowWorkerRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasUnreservedBarriersBelowWorkerRepairThreshhold', {
		get() {
			if (typeof this._hasUnreservedBarriersBelowWorkerRepairThreshhold === "undefined") {
				this._hasUnreservedBarriersBelowWorkerRepairThreshhold = this.barriersBelowWorkerRepairThreshhold.find(f => this.noStickyTarget(f))
			}
			return this._hasUnreservedBarriersBelowWorkerRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasBarrierBelowWorkerRepairThreshhold', {
		get() {
			if (typeof this._hasBarrierBelowWorkerRepairThreshhold === "undefined") {
				this._hasBarrierBelowWorkerRepairThreshhold = false;
				// We have the sorted list of barriers.
				// Only need to check the last one and then the first one to know if we have a match.
				let barriers = this.perimeterBarriersSorted;
				let length = barriers.length;
				//let hitsRepair = this.barrierHits * (this.isStorageEnergyDump ? 1 : Config.params.REPAIR_WORKER_THRESHHOLD_PERCENT);
				let hitsRepair = this.barrierHits * Config.params.REPAIR_WORKER_THRESHHOLD_PERCENT;
				if (length) {
					if (barriers[length - 1].hits < hitsRepair) {
						this._hasBarrierBelowWorkerRepairThreshhold = true;
					}
					else if (barriers[0].hits < hitsRepair) {
						this._hasBarrierBelowWorkerRepairThreshhold = true;
					}
				}
			}
			return this._hasBarrierBelowWorkerRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasBarrierBelowRepairThreshhold', {
		get() {
			if (typeof this._hasBarrierBelowRepairThreshhold === "undefined") {
				this._hasBarrierBelowRepairThreshhold = false;
				// We have the sorted list of barriers.
				// Only need to check the last one and then the first one to know if we have a match.
				let barriers = this.perimeterBarriersSorted;
				let length = barriers.length;
				let hitsRepair = this.barrierHits;
				if (length) {
					if (
						(barriers[0].hits < hitsRepair)
						|| (barriers[length - 1].hits < hitsRepair)
					) {
						this._hasBarrierBelowRepairThreshhold = true;
					}
				}
			}
			return this._hasBarrierBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	// This is a FILTER, not a FIND.
	Object.defineProperty(Room.prototype, 'nukeBarriersBelowRepairThreshhold', {
		get() {
			if (typeof this._nukeBarriersBelowRepairThreshhold === "undefined") {
				this._nukeBarriersBelowRepairThreshhold = this.nukeBarriersSorted.filter(f => (f.hits < f.hitsMax) && (f.hits < this.getNukeDamage(f.pos) + RAMPART_DECAY_AMOUNT));
            }
			return this._nukeBarriersBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	// This is a FIND, not a FILTER.
	Object.defineProperty(Room.prototype, 'nukeBarrierBelowRepairThreshhold', {
		get() {
			if (typeof this._nukeBarrierBelowRepairThreshhold === "undefined") {
				this._nukeBarrierBelowRepairThreshhold = this.nukeBarriersSorted.find(f => (f.hits < f.hitsMax) && (f.hits < this.getNukeDamage(f.pos) + RAMPART_DECAY_AMOUNT));
            }
			return this._nukeBarrierBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nukeBarrierHitsBelowRepairThreshhold', {
		get() {
			if (typeof this._nukeBarrierHitsBelowRepairThreshhold === "undefined") {
				this._nukeBarrierHitsBelowRepairThreshhold = this.nukeBarriersSorted.reduce((a, b) => a + Math.min(b.hitsMax, Math.max(0, this.getNukeDamage(b.pos) + RAMPART_DECAY_AMOUNT - b.hits)), 0);
            }
			return this._nukeBarrierHitsBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'noviceWalls', {
		get() {
			if (typeof this._noviceWalls === "undefined") {
				this._noviceWalls = this.walls.filter(f => this.noviceWallsFilter(f));
			}
			return this._noviceWalls;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'noviceWallsExist', {
		get() {
			if (typeof this._noviceWallsExist === "undefined") {
				if (this.isControllerRoom) {
					this._noviceWallsExist = !!this.walls.find(f => this.noviceWallsFilter(f));
				}
				else {
					// Any walls in a non-controller room are novice walls.
					this._noviceWallsExist = !!this.walls.length;
				}
			}
			return this._noviceWallsExist;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.attackableHostileStructuresFilter = function(structure) {
        return (
			this.hostileStructuresFilter(structure)
			&& ![STRUCTURE_RAMPART].includes(structure.structureType)
		);
	}

	Object.defineProperty(Room.prototype, 'attackableHostileStructures', {
		get() {
			if (typeof this._attackableHostileStructures === "undefined") {
				// If the room is owned by someone else, then look for any enemy structures.
				const structureTypes = {
					[STRUCTURE_CONTROLLER]: true
					, [STRUCTURE_POWER_BANK]: true
					, [STRUCTURE_KEEPER_LAIR]: true
					, [STRUCTURE_RAMPART]: true

					// Excluding these as they will be specifically targetted. We want to loot them first.
					, [STRUCTURE_STORAGE]: true
					, [STRUCTURE_TERMINAL]: true
				}
				this._attackableHostileStructures = this.getHostileStructureGroups(this.getHostileStructureTypesExcluding(structureTypes));
			}
			return this._attackableHostileStructures;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.dismantlableHostileStructuresFilter = function(structure) {
        return (
			this.hostileStructuresFilter(structure)
			&& ![STRUCTURE_RAMPART, STRUCTURE_INVADER_CORE].includes(structure.structureType)
		);
	}

	Object.defineProperty(Room.prototype, 'dismantlableHostileStructures', {
		get() {
			if (typeof this._dismantlableHostileStructures === "undefined") {
				// If the room is owned by someone else, then look for any enemy structures.
				const structureTypes = {
					[STRUCTURE_CONTROLLER]: true
					, [STRUCTURE_POWER_BANK]: true
					, [STRUCTURE_KEEPER_LAIR]: true
					, [STRUCTURE_RAMPART]: true
					, [STRUCTURE_INVADER_CORE]: true  // Invader cores seperate attackable from dismantlable.

					// Excluding these as they will be specifically targetted. We want to loot them first.
					, [STRUCTURE_STORAGE]: true
					, [STRUCTURE_TERMINAL]: true
				}
				this._dismantlableHostileStructures = this.getHostileStructureGroups(this.getHostileStructureTypesExcluding(structureTypes));
			}
			return this._dismantlableHostileStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileStructuresUnderRampart', {
		get() {
			if (typeof this._hostileStructuresUnderRampart === "undefined") {
				this._hostileStructuresUnderRampart = this.attackableHostileStructures.filter(f => f.pos.hasRampartHits);
			}
			return this._hostileStructuresUnderRampart;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'importantHostileStructures', {
		get() {
			if (typeof this._importantHostileStructures === "undefined") {
				const structureTypes = [
					[STRUCTURE_SPAWN]
					//, [STRUCTURE_LINK]
					, [STRUCTURE_STORAGE]
					, [STRUCTURE_TOWER]
					, [STRUCTURE_POWER_SPAWN]
					//, [STRUCTURE_LAB]
					, [STRUCTURE_TERMINAL]
					, [STRUCTURE_FACTORY]
					, [STRUCTURE_NUKER]
					, [STRUCTURE_INVADER_CORE]
				]
				this._importantHostileStructures = this.getHostileStructureGroups(structureTypes);
			}
			return this._importantHostileStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'importantDismantlableHostileStructures', {
		get() {
			if (typeof this._importantDismantlableHostileStructures === "undefined") {
				const structureTypes = [
					[STRUCTURE_SPAWN]
					//, [STRUCTURE_LINK]
					, [STRUCTURE_STORAGE]
					, [STRUCTURE_TOWER]
					, [STRUCTURE_POWER_SPAWN]
					//, [STRUCTURE_LAB]
					, [STRUCTURE_TERMINAL]
					, [STRUCTURE_FACTORY]
					, [STRUCTURE_NUKER]
					//, [STRUCTURE_INVADER_CORE]
				]
				this._importantDismantlableHostileStructures = this.getHostileStructureGroups(structureTypes);
			}
			return this._importantDismantlableHostileStructures;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.attackableStructuresFilter = function(structure) {
		const structureTypes = {
			[STRUCTURE_CONTROLLER]: true
			, [STRUCTURE_CONTAINER]: true
			, [STRUCTURE_WALL]: true
			, [STRUCTURE_RAMPART]: true
			, [STRUCTURE_ROAD]: true
			, [STRUCTURE_KEEPER_LAIR]: true
			, [STRUCTURE_POWER_BANK]: true
		}
        return (
			!structure.my
			&& structure.hits  // Exclude novice walls
			&& !structureTypes[structure.structureType]
		);
	}

	Object.defineProperty(Room.prototype, 'attackableStructures', {
		get() {
			if (typeof this._attackableStructures === "undefined") {
				const structureTypes = {
					[STRUCTURE_RAMPART]: true
					, [STRUCTURE_KEEPER_LAIR]: true
					, [STRUCTURE_POWER_BANK]: true
				}
				this._attackableStructures = this.getHostileStructureGroups(this.getHostileStructureTypesExcluding(structureTypes));
			}
			return this._attackableStructures;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.dismantlableStructuresFilter = function(structure) {
		const structureTypes = {
			[STRUCTURE_CONTROLLER]: true
			, [STRUCTURE_CONTAINER]: true
			, [STRUCTURE_WALL]: true
			, [STRUCTURE_RAMPART]: true
			, [STRUCTURE_ROAD]: true
			, [STRUCTURE_KEEPER_LAIR]: true
			, [STRUCTURE_POWER_BANK]: true
			, [STRUCTURE_INVADER_CORE]: true
		}
        return (
			!structure.my
			&& structure.hits  // Exclude novice walls
			&& !structureTypes[structure.structureType]
		);
	}

	Object.defineProperty(Room.prototype, 'dismantlableStructures', {
		get() {
			if (typeof this._dismantlableStructures === "undefined") {
				const structureTypes = {
					[STRUCTURE_RAMPART]: true
					, [STRUCTURE_KEEPER_LAIR]: true
					, [STRUCTURE_POWER_BANK]: true
					, [STRUCTURE_INVADER_CORE]: true
				}
				this._dismantlableStructures = this.getHostileStructureGroups(this.getHostileStructureTypesExcluding(structureTypes));
			}
			return this._dismantlableStructures;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.hostileSpawnsFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_SPAWN) && !structure.my);
	}

    Room.prototype.hostileInvaderCoreFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_INVADER_CORE));
	}

	Room.prototype.hostileStorageFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_STORAGE) && !structure.my);
	}

    Room.prototype.hostileTerminalFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_TERMINAL) && !structure.my);
	}

    Room.prototype.hostileFactoryFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_FACTORY) && !structure.my);
	}

    Room.prototype.hostileNukerFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_NUKER) && !structure.my);
	}

    Room.prototype.hostileRampartsFilter = function(structure) {
        return ((structure.structureType === STRUCTURE_RAMPART) && !structure.my);
	}

    Room.prototype.hostileTowersFilter = function(structure) {
        return (structure.structureType === STRUCTURE_TOWER && !structure.my);
	}

	Object.defineProperty(Room.prototype, 'hostileSpawns', {
		get() {
			if (typeof this._hostileSpawns === "undefined") {
				this._hostileSpawns = this.getHostileStructureGroups([STRUCTURE_SPAWN]);
			}
			return this._hostileSpawns;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileStorage', {
		get() {
			if (typeof this._hostileStorage === "undefined") {
				// terminal and storage are special structures, which we have direct access to for free.
				this._hostileStorage = (this.storage && !this.storage.my) ? this.storage : null;
			}
			return this._hostileStorage;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileTerminal', {
		get() {
			if (typeof this._hostileTerminal === "undefined") {
				// terminal and storage are special structures, which we have direct access to for free.
				this._hostileTerminal = (this.terminal && !this.terminal.my) ? this.terminal : null;
			}
			return this._hostileTerminal;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileFactory', {
		get() {
			if (typeof this._hostileFactory === "undefined") {
				this._hostileFactory = this.getHostileStructureGroups([STRUCTURE_FACTORY]).find(x => x !== undefined);
			}
			return this._hostileFactory;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileNuker', {
		get() {
			if (typeof this._hostileNuker === "undefined") {
				this._hostileNuker = this.getHostileStructureGroups([STRUCTURE_NUKER]).find(x => x !== undefined);
			}
			return this._hostileNuker;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileRamparts', {
		get() {
			if (typeof this._hostileRamparts === "undefined") {
				this._hostileRamparts = this.getHostileStructureGroups([STRUCTURE_RAMPART]);
			}
			return this._hostileRamparts;
		},
		configurable: true, enumerable: true,
	});


	Object.defineProperty(Room.prototype, 'hostileLabs', {
		get() {
			if (typeof this._hostileLabs === "undefined") {
				this._hostileLabs = this.getHostileStructureGroups([STRUCTURE_LAB]);
			}
			return this._hostileLabs;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileTowers', {
		get() {
			if (typeof this._hostileTowers === "undefined") {
				this._hostileTowers = this.getHostileStructureGroups([STRUCTURE_TOWER]);
			}
			return this._hostileTowers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileSpawnStructures', {
		get() {
			if (typeof this._hostileSpawnStructures === "undefined") {
				const structureTypes = [
					STRUCTURE_EXTENSION
					, STRUCTURE_SPAWN
				]
				this._hostileSpawnStructures = this.getHostileStructureGroups(structureTypes);
			}
			return this._hostileSpawnStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'keeperLairs', {
		get() {
			if (typeof this._keeperLairs === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory[C.MEMORY_KEY_KEEPER_LAIRS]) object = Object.keys(this.memory[C.MEMORY_KEY_KEEPER_LAIRS]).map(m => Game.getObjectById(m));

				// Object wasn't in cache, so look for it.
				if (!object && this.isSKRoom) {
					object = this.getHostileStructureGroups([STRUCTURE_KEEPER_LAIR]);
				}

				// Cache the object Id for next time.
				if (object && object.length) {
					this.memory[C.MEMORY_KEY_KEEPER_LAIRS] = {};
					object.forEach(lair => {
						this.memory[C.MEMORY_KEY_KEEPER_LAIRS][lair.id] = 1;
					})
				}
				else {
					delete this.memory[C.MEMORY_KEY_KEEPER_LAIRS];
				}

				this._keeperLairs = object || [];
            }
			return this._keeperLairs;
		},
		configurable: true, enumerable: true,
    });

	/*** MY NAMED STRUCTURE ***/
	Object.defineProperty(Room.prototype, 'myStorage', {
		get() {
			if (typeof this._myStorage === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				// NOTE: storage can actually be active even if the room is not high enough RCL yet.
				// However this only applies to building/depositing, not existing or depositing.
				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][this.controller.level]) {
					if (this.memory[STRUCTURE_STORAGE]) object = Game.structures[this.memory[STRUCTURE_STORAGE]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						if (this.isTemple) {
							object = this.storage
						}
						else if (this.colonyFlag) {
							// terminal and storage are special structures, which we have direct access to for free.
							object = (this.storage && this.storage.my && this.storage.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_STORAGE(this.colonyFlag)))) ? this.storage : null;
						}
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_STORAGE] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_STORAGE];
				}

				this._myStorage = object || null;
            }
			return this._myStorage;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myTerminal', {
		get() {
			if (typeof this._myTerminal === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][this.controller.level]) {
					if (this.memory[STRUCTURE_TERMINAL]) object = Game.structures[this.memory[STRUCTURE_TERMINAL]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						if (this.isTemple) {
							object = this.terminal
						}
						else if (this.colonyFlag) {
							// terminal and storage are special structures, which we have direct access to for free.
							object = (this.terminal && this.terminal.my && this.terminal.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_TERMINAL(this.colonyFlag)))) ? this.terminal : null;
						}
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_TERMINAL] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_TERMINAL];
				}

				this._myTerminal = object || null;
            }
			return this._myTerminal;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'mySpawns', {
		get() {
			if (typeof this._mySpawns === "undefined") {
				this._mySpawns = this.my ? this.getMyStructureGroups([STRUCTURE_SPAWN]) : [];
			}
			return this._mySpawns;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'mySpawnStructures', {
		get() {
			if (typeof this._mySpawnStructures === "undefined") {
				const types = [
					STRUCTURE_EXTENSION
					, STRUCTURE_SPAWN
				]
				this._mySpawnStructures = this.getMyStructureGroups(types);
			}
			return this._mySpawnStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasMyConstructionSpawns', {
		get() {
			if (typeof this._hasMyConstructionSpawns === "undefined") {
				this._hasMyConstructionSpawns = !!this.myConstructionSites.find(f => f.structureType === STRUCTURE_SPAWN);
			}
			return this._hasMyConstructionSpawns;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNonKingSpawnStructures', {
		get() {
			if (typeof this._colonyNonKingSpawnStructures === "undefined") {
				let spawns = [];

				if (this.colonySpawn1 && (!this.king || !this.myStorage || !this.myStorage.store.getUsedCapacity(RESOURCE_ENERGY))) spawns.push(this.colonySpawn1);
				if (!this.queen && this.colonySpawn2) spawns.push(this.colonySpawn2);
				if (!this.queen && this.colonySpawn3) spawns.push(this.colonySpawn3);

				this._colonyNonKingSpawnStructures = this.colonyExtensions.concat(spawns);
			}
			return this._colonyNonKingSpawnStructures;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNonKingSpawnStructuresNotFull', {
		get() {
			if (typeof this._colonyNonKingSpawnStructuresNotFull === "undefined") {
				this._colonyNonKingSpawnStructuresNotFull = this.colonyNonKingSpawnStructures.filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY));
			}
			return this._colonyNonKingSpawnStructuresNotFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyFirstExtensionNeedingEnergy', {
		get() {
			if (typeof this._colonyFirstExtensionNeedingEnergy === "undefined") {
				let flag = this.colonyFlagAnyColor || this.templeFlagAnyColor;
				// distance 6 is ring 1, 8 is ring 2, 10 is ring 3, etc.
				// We will find the first that needs energy at ring 2, then ring 4, after is a hodge podge take anything.
				this._colonyFirstExtensionNeedingEnergy = this.colonyNonKingSpawnStructuresNotFull.filter( f => [8, 10].includes(f.pos.getDistanceTo(flag)));
				if (!this._colonyFirstExtensionNeedingEnergy.length) this._colonyFirstExtensionNeedingEnergy = this.colonyNonKingSpawnStructuresNotFull;
			}
			return this._colonyFirstExtensionNeedingEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'nonKingEnergyFull', {
		get() {
			if (typeof this._nonKingEnergyFull === "undefined") {

				// Remove energy amount of colonySpawn if we have a king.
				let colonySpawnEnergy = 0;
				let colonySpawnEnergyCapacity = 0;
				if (this.colonySpawn1 && this.myStorage && this.myStorage.store.getUsedCapacity(RESOURCE_ENERGY) && this.king) {
					colonySpawnEnergy = this.colonySpawn1.energy;
					colonySpawnEnergyCapacity = this.colonySpawn1.energyCapacity;
				}

				// Remove energy amount of colonySpawn2 if we have a queen.
				let colonySpawn2Energy = 0;
				let colonySpawn2EnergyCapacity = 0;
				if (this.colonySpawn2 && this.queen) {
					colonySpawn2Energy = this.colonySpawn2.energy;
					colonySpawn2EnergyCapacity = this.colonySpawn2.energyCapacity;
				}

				// Remove energy amount of colonySpawn3 if we have a queen.
				let colonySpawn3Energy = 0;
				let colonySpawn3EnergyCapacity = 0;
				if (this.colonySpawn3 && this.queen) {
					colonySpawn3Energy = this.colonySpawn3.energy;
					colonySpawn3EnergyCapacity = this.colonySpawn3.energyCapacity;
				}

				this._nonKingEnergyFull = (this.energyAvailable - colonySpawnEnergy - colonySpawn2Energy - colonySpawn3Energy) >= (this.energyCapacityAvailable - colonySpawnEnergyCapacity - colonySpawn2EnergyCapacity - colonySpawn3EnergyCapacity);
			}
			return this._nonKingEnergyFull;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myExtensions', {
		get() {
			if (typeof this._myExtensions === "undefined") {
				this._myExtensions = this.my ? this.getMyStructureGroups([STRUCTURE_EXTENSION]) : [];
			}
			return this._myExtensions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myLinks', {
		get() {
			if (typeof this._myLinks === "undefined") {
				this._myLinks = this.my ? this.getMyStructureGroups([STRUCTURE_LINK]) : [];
			}
			return this._myLinks;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myTowers', {
		get() {
			if (typeof this._myTowers === "undefined") {
				this._myTowers = this.my ? this.getMyStructureGroups([STRUCTURE_TOWER]) : [];
			}
			return this._myTowers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myLabs', {
		get() {
			if (typeof this._myLabs === "undefined") {
				this._myLabs = this.my ? this.getMyStructureGroups([STRUCTURE_LAB]) : [];
			}
			return this._myLabs;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myExtractors', {
		get() {
			if (typeof this._myExtractors === "undefined") {
				this._myExtractors = this.my ? this.getMyStructureGroups([STRUCTURE_EXTRACTOR]) : [];
			}
			return this._myExtractors;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myFactories', {
		get() {
			if (typeof this._myFactories === "undefined") {
				this._myFactories = this.my ? this.getMyStructureGroups([STRUCTURE_FACTORY]) : [];
			}
			return this._myFactories;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myPowerSpawns', {
		get() {
			if (typeof this._myPowerSpawns === "undefined") {
				this._myPowerSpawns = this.my ? this.getMyStructureGroups([STRUCTURE_POWER_SPAWN]) : [];
			}
			return this._myPowerSpawns;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myObservers', {
		get() {
			if (typeof this._myObservers === "undefined") {
				this._myObservers = this.my ? this.getMyStructureGroups([STRUCTURE_OBSERVER]) : [];
			}
			return this._myObservers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myNukers', {
		get() {
			if (typeof this._myNukers === "undefined") {
				this._myNukers = this.my ? this.getMyStructureGroups([STRUCTURE_NUKER]) : [];
			}
			return this._myNukers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myClosestSpawnRoom', {
		get() {
			if (typeof this._myClosestSpawnRoom === "undefined") {
				let controller = _.sortBy(GameManager.empireSpawnControllersActive, s => Cartographer.findRouteDistance(this.name, s.room.name))[0];
				this._myClosestSpawnRoom = controller ? controller.room : this;
			}
			return this._myClosestSpawnRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myClosestControllerRoom', {
		get() {
			if (typeof this._myClosestControllerRoom === "undefined") {
				let room = _.sortBy(GameManager.empireRooms, s => Cartographer.findRouteDistance(this.name, s.name))[0];
				this._myClosestControllerRoom = room ? room : this;
			}
			return this._myClosestControllerRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myClosestSafeControllerRoom', {
		get() {
			if (typeof this._myClosestControllerRoom === "undefined") {
				let room = _.sortBy(GameManager.empireRooms.filter(f => !f.colonyBreached), s => Cartographer.findRouteDistance(this.name, s.name))[0];
				this._myClosestControllerRoom = room ? room : this;
			}
			return this._myClosestControllerRoom;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Return the next room in the path of rooms that lead back to the closest safe controller room.
	 */
	Object.defineProperty(Room.prototype, 'nextRoomNameToClosestSafeControllerRoom', {
		get() {
			if (typeof this._nextRoomNameToClosestSafeControllerRoom === "undefined") {
				this._nextRoomNameToClosestSafeControllerRoom = this.name;
				let roomNames = Cartographer.findRouteRooms(this.name, this.myClosestSafeControllerRoom.name);
				if (roomNames.length > 1) {
					this._nextRoomNameToClosestSafeControllerRoom = roomNames[1];
				}
			}
			return this._nextRoomNameToClosestSafeControllerRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myRamparts', {
		get() {
			if (typeof this._myRamparts === "undefined") {
				this._myRamparts = this.getMyStructureGroups([STRUCTURE_RAMPART]);
			}
			return this._myRamparts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'invaderCore', {
		get() {
			if (typeof this._invaderCore === "undefined") {
				this._invaderCore = null;
				// Where invaderCores can pop up is semi-consistant. We only care about these rooms.
				if (this.controller && this.controller.reservation) {
					this._invaderCore = this.getHostileStructureGroups([STRUCTURE_INVADER_CORE]).find(x => x !== undefined) || null;
				}
			}
			return this._invaderCore;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is the SK invader stronghold structure at any time it is visible on screen, even when invulnerable.
	 */
	Object.defineProperty(Room.prototype, 'invaderStrongholdStructure', {
		get() {
			if (typeof this._invaderStrongholdStructure === "undefined") {
				this._invaderStrongholdStructure = null;
				// Where invaderStronghold can pop up is semi-consistant. We only care about these rooms.
				if (this.isSKRoom) {
					this._invaderStrongholdStructure = this.getHostileStructureGroups([STRUCTURE_INVADER_CORE]).find(f => f.level) || null;
				}
			}
			return this._invaderStrongholdStructure;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'invaderStronghold', {
		get() {
			if (typeof this._invaderStronghold === "undefined") {
				let invaderCore = this.invaderStrongholdStructure
				this._invaderStronghold = (invaderCore && !invaderCore.isInvulnerableTicks) ? invaderCore : null;
			}
			return this._invaderStronghold;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Factory object similar to storage and terminal.
	 * Does not filter on owner of room nor structure.
	 */
	Object.defineProperty(Room.prototype, 'factory', {
		get() {
			if (typeof this._factory === "undefined") {
				this._factory = this.getStructureGroups([STRUCTURE_FACTORY]).find(x => x !== undefined) || null;
			}
			return this._factory;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'powerspawn', {
		get() {
			if (typeof this._powerspawn === "undefined") {
				this._powerspawn = this.getStructureGroups([STRUCTURE_POWER_SPAWN]).find(x => x !== undefined) || null;
			}
			return this._powerspawn;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'links', {
		get() {
			if (typeof this._links === "undefined") {
				this._links = this.getStructureGroups([STRUCTURE_LINK]);
			}
			return this._links;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'towers', {
		get() {
			if (typeof this._towers === "undefined") {
				this._towers = this.getStructureGroups([STRUCTURE_TOWER]);
			}
			return this._towers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'observer', {
		get() {
			if (typeof this._observer === "undefined") {
				this._observer = this.getStructureGroups([STRUCTURE_OBSERVER]).find(x => x !== undefined) || null;
			}
			return this._observer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'mineralExtractor', {
		get() {
			if (typeof this._mineralExtractor === "undefined") {
				// Special case where we know exactly where an extractor would be if there was one.
				// Chances are this is faster than looking at structure groups as mineral will more likely be cached.
				this._mineralExtractor = this.mineral ? this.mineral.pos.lookForExtractor() : null;
			}
			return this._mineralExtractor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'thoriumExtractor', {
		get() {
			if (typeof this._thoriumExtractor === "undefined") {
				// Special case where we know exactly where an extractor would be if there was one.
				// Chances are this is faster than looking at structure groups as mineral will more likely be cached.
				this._thoriumExtractor = this.thorium ? this.thorium.pos.lookForExtractor() : null;
			}
			return this._thoriumExtractor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'powerbanks', {
		get() {
			if (typeof this._powerbanks === "undefined") {
				// Where powerbanks can pop up is semi-consistant. We only care about these rooms.
				if (this.isHighwayRoom) {
					// Unlike sources, we are always refreshing our memory value, as powerbanks are transiant.
					this._powerbanks = this.getHostileStructureGroups([STRUCTURE_POWER_BANK]);
				}
			}
			return this._powerbanks;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'portals', {
		get() {
			if (typeof this._portals === "undefined") {
				this._portals = [];
				// Where portals can pop up is semi-consistant. We only care about these rooms.
				if (this.isCoreRoom || this.isHighwayCorner) {
					// Unlike sources, we are always refreshing our memory value, as portals are transiant.
					this._portals = this.getStructureGroups([STRUCTURE_PORTAL]);
					if (Game.flags.FIND_PORTALS) utils.printStack(this.print, 'FIND_PORTALS');
					if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_PORTALS')
				}
			}
			return this._portals;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sources', {
		get() {
			if (typeof this._sources === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				// All rooms except highways are expected to have sources.
				if (!this.isHighwayRoom) {
					if (!object && this.memory[C.MEMORY_KEY_SOURCES]) object = Object.keys(this.memory[C.MEMORY_KEY_SOURCES]).map(m => Game.getObjectById(m));
					if (!object && this.heap[C.MEMORY_KEY_SOURCES]) object = Object.keys(this.heap[C.MEMORY_KEY_SOURCES]).map(m => Game.getObjectById(m));

					// Object wasn't in cache, so look for it.
					// Note that our room intel source count should be accurate....whereas memory/heap data can be deleted.
					if (!object || !object.length || (object.length !== RoomIntel.getSourceCount(this.name))) {
						object = this.find(FIND_SOURCES);
						if (Game.flags.FIND_SOURCES) utils.printStack(this.print, 'FIND_SOURCES');
						if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_SOURCES')
					}
				}

				// Cache the object Id for next time.
				if (object && object.length && this.myManagement) {
					// Only need to do this once, as sources do not change.
					if (!this.memory[C.MEMORY_KEY_SOURCES]) {
						this.memory[C.MEMORY_KEY_SOURCES] = {};
						// We store additional information under each source id entry.
						object.forEach(source => {
							this.memory[C.MEMORY_KEY_SOURCES][source.id] = {};
						})
					}
				}
				else if (object && object.length) {
					// Only need to do this once, as sources do not change.
					if (!this.heap[C.MEMORY_KEY_SOURCES]) {
						this.heap[C.MEMORY_KEY_SOURCES] = {};
						// We store additional information under each source id entry.
						object.forEach(source => {
							this.heap[C.MEMORY_KEY_SOURCES][source.id] = {};
						})
					}
				}
				else {
					// This is a bitter pill. We need to keep this data around for the purpose of sourceContainers and path lengths.
					// So once a room is reserved, source data may be in memory for a while.
					//delete this.memory[C.MEMORY_KEY_SOURCES];
				}

				this._sources = object || [];
            }
			return this._sources;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'minerals', {
		get() {
			if (typeof this._minerals === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory[C.MEMORY_KEY_MINERALS]) object = Object.keys(this.memory[C.MEMORY_KEY_MINERALS]).map(m => Game.getObjectById(m));

				// Object wasn't in cache, so look for it.
				if (!object) {
					object = this.find(FIND_MINERALS) || [];
					if (Game.flags.FIND_MINERALS) utils.printStack(this.print, 'FIND_MINERALS');
					if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_MINERALS')
				}

				// Cache the object Id for next time.  We will be mining in our own rooms, and any of the center rooms of course.
				if (object && object.length) { // && (this.my || this.isCenterRoom)) {
					// Unfortunately, since minerals do change (can be depleted and disappear), we need to store this every time.
					this.memory[C.MEMORY_KEY_MINERALS] = {};
					object.forEach(mineral => {
						this.memory[C.MEMORY_KEY_MINERALS][mineral.id] = {};
						this.memory[C.MEMORY_KEY_MINERALS][mineral.id][C.MEMORY_KEY_MINERAL_TYPE] = mineral.mineralType;
						this.memory[C.MEMORY_KEY_MINERALS][mineral.id][C.MEMORY_KEY_MINERAL_AMOUNT] = Math.ceil(mineral.mineralAmount);
						this.memory[C.MEMORY_KEY_MINERALS][mineral.id][C.MEMORY_KEY_MINERAL_NIPS] = mineral.nips.length;
					})
				}
				else {
					delete this.memory[C.MEMORY_KEY_MINERALS];
				}

				this._minerals = object || null;
            }
			return this._minerals;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'mineral', {
		get() {
			if (typeof this._mineral === "undefined") {
				this._mineral = this.minerals.find(f => f.mineralType !== C.RESOURCE_THORIUM) || null;
            }
			return this._mineral;
		},
		configurable: true, enumerable: true,
    });

	// Object.defineProperty(Room.prototype, 'mineral', {
	// 	get() {
	// 		if (typeof this._mineral === "undefined") {
	// 			// Read from the cache to help performance. This object shouldn't change often/ever.
	// 			let object = null;
	// 			if (this.memory[C.MEMORY_KEY_MINERAL_ID]) object = Game.getObjectById(this.memory[C.MEMORY_KEY_MINERAL_ID]);

	// 			// Object wasn't in cache, so look for it.
	// 			if (!object) {
	// 				object = this.find(FIND_MINERALS).find(f => f.mineralType !== C.RESOURCE_THORIUM);
	// 				if (Game.flags.FIND_MINERALS) utils.printStack(this.print, 'FIND_MINERALS');
	// 				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_MINERALS')
	// 			}

	// 			// Cache the object Id for next time.
	// 			if (object) {
	// 				this.memory[C.MEMORY_KEY_MINERAL_ID] = object.id;
	// 			}
	// 			else {
	// 				delete this.memory[C.MEMORY_KEY_MINERAL_ID];
	// 			}

	// 			this._mineral = object || null;
    //         }
	// 		return this._mineral;
	// 	},
	// 	configurable: true, enumerable: true,
    // });

	Object.defineProperty(Room.prototype, 'thorium', {
		get() {
			if (typeof this._thorium === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (FlagManager.season5Flag) {
					if (this.memory[C.MEMORY_KEY_THORIUM_ID]) object = Game.getObjectById(this.memory[C.MEMORY_KEY_THORIUM_ID]);

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.find(FIND_MINERALS).find(f => f.mineralType === C.RESOURCE_THORIUM);
						if (Game.flags.FIND_THORIUM) utils.printStack(this.print, 'FIND_THORIUM');
						if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_THORIUM')
					}

					// Cache the object Id for next time.
					if (object) {
						this.memory[C.MEMORY_KEY_THORIUM_ID] = object.id;
					}
					else {
						delete this.memory[C.MEMORY_KEY_THORIUM_ID];
					}
				}

				this._thorium = object || null;
            }
			return this._thorium;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'nukes', {
		get() {
			if (typeof this._nukes === "undefined") {
				this._nukes = this.find(FIND_NUKES) || [];
				if (Game.flags.FIND_NUKES) utils.printStack(this.print, 'FIND_NUKES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_NUKES')
			}
			return this._nukes;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'deposits', {
		get() {
			if (typeof this._deposits === "undefined") {
				this._deposits = [];
				// Where deposits can pop up is semi-consistant. We only care about these rooms.
				if (this.isHighwayRoom) {
					// Unlike sources, we are always refreshing our memory value, as deposits are transiant.
					this._deposits = this.find(FIND_DEPOSITS) || [];
					if (Game.flags.FIND_DEPOSITS) utils.printStack(this.print, 'FIND_DEPOSITS');
					if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_DEPOSITS')
				}
			}
			return this._deposits;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'flags', {
		get() {
			if (typeof this._flags === "undefined") {
				this._flags = this.find(FIND_FLAGS) || [];
				if (Game.flags.FIND_FLAGS) utils.printStack(this.print, 'FIND_FLAGS');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_FLAGS')
			}
			return this._flags;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'exits', {
		get() {
			if (typeof this._exits === "undefined") {
				this._exits = this.heap.exits;
				if (typeof this._exits === "undefined") {
					this.heap.exits = packCoordList((this.find(FIND_EXIT) || []));
					this._exits = this.heap.exits;
					if (Game.flags.FIND_EXIT) utils.printStack(this.print, 'FIND_EXIT');
					if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_EXIT')
				}
				this._exits = unpackCoordListAsPosList(this._exits, this.name) || [];
			}
			return this._exits;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'droppedResources', {
		get() {
			if (typeof this._droppedResources === "undefined") {
				this._droppedResources = this.find(FIND_DROPPED_RESOURCES) || [];
				if (Game.flags.FIND_DROPPED_RESOURCES) utils.printStack(this.print, 'FIND_DROPPED_RESOURCES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_DROPPED_RESOURCES')
			}
			return this._droppedResources;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'drops', {
		get() {
			if (typeof this._drops === "undefined") {
				this._drops = utils.groupBy(this.droppedResources, 'resourceType');
			}
			return this._drops;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'droppedEnergy', {
		get() {
			if (typeof this._droppedEnergy === "undefined") {
				this._droppedEnergy = this.drops[RESOURCE_ENERGY] || [];
			}
			return this._droppedEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'droppedPower', {
		get() {
			if (typeof this._droppedPower === "undefined") {
				this._droppedPower = this.drops[RESOURCE_POWER] || []
			}
			return this._droppedPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'ruins', {
		get() {
			if (typeof this._ruins === "undefined") {
				//this._ruins = this.find(FIND_RUINS, {filter: f => f.store.getUsedCapacity()}) || [];
				this._ruins = this.find(FIND_RUINS).filter(f => f.store.getUsedCapacity());
				if (Game.flags.FIND_RUINS) utils.printStack(this.print, 'FIND_RUINS');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_RUINS')
			}
			return this._ruins;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'tombstones', {
		get() {
			if (typeof this._tombstones === "undefined") {
				// Some creeps die with 1 energy in them. Ugh!
				//this._tombstones = this.find(FIND_TOMBSTONES, {filter: f => f.store.getUsedCapacity() > 1}) || [];
				this._tombstones = this.find(FIND_TOMBSTONES).filter(f => f.store.getUsedCapacity() > 1);
				if (Game.flags.FIND_TOMBSTONES) utils.printStack(this.print, 'FIND_TOMBSTONES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_TOMBSTONES');
			}
			return this._tombstones;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'constructionSites', {
		get() {
			if (typeof this._constructionSites === "undefined") {
				this._constructionSites = this.find(FIND_CONSTRUCTION_SITES) || [];
				if (Game.flags.FIND_CONSTRUCTION_SITES) utils.printStack(this.print, 'FIND_CONSTRUCTION_SITES');
			}
			return this._constructionSites;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myConstructionSites', {
		get() {
			if (typeof this._myConstructionSites === "undefined") {
				this._myConstructionSites = GameManager.myConstructionSitesGroupedByRoomName[this.name] || [];
				//this._myConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES) || [];
				//if (Game.flags.FIND_MY_CONSTRUCTION_SITES) utils.printStack(this.print, 'FIND_MY_CONSTRUCTION_SITES');
				//if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_MY_CONSTRUCTION_SITES');
			}
			return this._myConstructionSites;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hostileConstructionSites', {
		get() {
			if (typeof this._hostileConstructionSites === "undefined") {
				this._hostileConstructionSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES) || [];
				if (Game.flags.FIND_HOSTILE_CONSTRUCTION_SITES) utils.printStack(this.print, 'FIND_HOSTILE_CONSTRUCTION_SITES');
				if (Game.flags.find) GameManager.recordFind(this.name, 'FIND_HOSTILE_CONSTRUCTION_SITES');
			}
			return this._hostileConstructionSites;
		},
		configurable: true, enumerable: true,
	});

}
