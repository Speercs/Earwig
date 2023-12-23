"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

	Object.defineProperty(Room.prototype, 'colonyBuildLevel', {
		get() {
			return this.memory[C.MEMORY_KEY_ROOM_COLONY_BUILD_LEVEL];
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_ROOM_COLONY_BUILD_LEVEL] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_ROOM_COLONY_BUILD_LEVEL];
            }
        },
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyCreateTime', {
		get() {
			return this.memory[C.MEMORY_KEY_ROOM_COLONY_CREATE_TIME];
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_ROOM_COLONY_CREATE_TIME] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_ROOM_COLONY_CREATE_TIME];
            }
        },
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyCoordRange2Edge', {
		get() {
			if (typeof this._anyCoordRange2Edge === "undefined") {
				this._anyCoordRange2Edge = this.heap.anyCoordRange2Edge;
				if (typeof this._anyCoordRange2Edge === "undefined") {
					this.heap.anyCoordRange2Edge = [];
					for (let y=2; y<=47; y++) {
						for (let x=2; x<=47; x++) {
							if ((x === 2) || (x === 47) || (y === 2) || (y === 47)) {
								this.heap.anyCoordRange2Edge.push({x:x, y:y});
							}
						}
					}
					this._anyCoordRange2Edge = this.heap.anyCoordRange2Edge;
				}
			}
			return this._anyCoordRange2Edge;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyCoordRange3Edge', {
		get() {
			if (typeof this._anyCoordRange3Edge === "undefined") {
				this._anyCoordRange3Edge = this.heap.anyCoordRange3Edge;
				if (typeof this._anyCoordRange3Edge === "undefined") {
					this.heap.anyCoordRange3Edge = [];
					for (let y=3; y<=46; y++) {
						for (let x=3; x<=46; x++) {
							if ((x === 3) || (x === 46) || (y === 3) || (y === 46)) {
								this.heap.anyCoordRange3Edge.push({x:x, y:y});
							}
						}
					}
					this._anyCoordRange3Edge = this.heap.anyCoordRange3Edge;
				}
			}
			return this._anyCoordRange3Edge;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyCoordRange2EdgeCostMatrix', {
		get() {
			if (typeof this._anyCoordRange2EdgeCostMatrix === "undefined") {
				let matrix = new PathFinder.CostMatrix;
				this.anyCoordRange2Edge.forEach(e => matrix.set(e.x, e.y, 255));
				this.anyCoordRange3Edge.forEach(e => matrix.set(e.x, e.y, 255));
				this._anyCoordRange2EdgeCostMatrix = matrix;
			}
			return this._anyCoordRange2EdgeCostMatrix;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * CAUTION!! EXTREMELY EXPENSIVE OPERATION!!!
	 */
    Room.prototype.doesCoordHaveExit = function(coord) {
		let pos = utils.posFromCoord(coord, this.name);
		return pos.findClosestByPath(FIND_EXIT, {
			ignoreCreeps: true
			, ignoreDestructibleStructures: true
			, costCallback: function(roomName, costMatrix) {
				let room = Game.rooms[roomName];
				if (room) {
					return room.anyCoordRange2EdgeCostMatrix;
				}
			}
		})
    }

	Object.defineProperty(Room.prototype, 'hasAnyPerimeterBarrierCoordsInMemory', {
		get() {
			return !!this.memory[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS];
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Since this is so expensive to calculate (but static), we will store this to memory for our rooms (which is only what we care about).
	 */
	Object.defineProperty(Room.prototype, 'anyPerimeterBarrierCoords', {
		get() {
			if (typeof this._anyPerimeterBarrierCoords === "undefined") {
				let useMemory = (this.my || this.claimFlag);
				this._anyPerimeterBarrierCoords = useMemory ? this.memory[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS] : this.heap[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS];
				if (typeof this._anyPerimeterBarrierCoords === "undefined") {
					if (Game.flags.anyPerimeterBarrierCoords) utils.printStack(this.print, 'anyPerimeterBarrierCoords');
					if (useMemory) {
						this.memory[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS] = packCoordList(this.anyCoordRange2Edge.filter(f => this.doesCoordHaveExit(f)));
						this._anyPerimeterBarrierCoords = this.memory[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS];
					}
					else {
						this.heap[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS] = packCoordList(this.anyCoordRange2Edge.filter(f => this.doesCoordHaveExit(f)));
						this._anyPerimeterBarrierCoords = this.heap[C.MEMORY_KEY_ANY_PERIMETER_BARRIER_COORDS];
					}
				}
				this._anyPerimeterBarrierCoords = unpackCoordList(this._anyPerimeterBarrierCoords);
			}
			return this._anyPerimeterBarrierCoords;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'perimeterBarrierCoords', {
		get() {
			if (typeof this._perimeterBarrierCoords === "undefined") {
				this._perimeterBarrierCoords = this.heap.perimeterBarrierCoords;
				if (typeof this._perimeterBarrierCoords === "undefined") {
					const terrain = new Room.Terrain(this.name);
					this.heap.perimeterBarrierCoords = this.anyPerimeterBarrierCoords.filter(f => (terrain.get(f.x, f.y) !== TERRAIN_MASK_WALL));
					this._perimeterBarrierCoords = this.heap.perimeterBarrierCoords;
				}
			}
			return this._perimeterBarrierCoords;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyPerimeterBarrierRange2Coords', {
		get() {
			if (typeof this._anyPerimeterBarrierRange2Coords === "undefined") {
				this._anyPerimeterBarrierRange2Coords = this.heap.anyPerimeterBarrierRange2Coords;
				if (typeof this._anyPerimeterBarrierRange2Coords === "undefined") {
					//let coords = this.anyPerimeterBarrierPositions.map(m => m.xyInRange2).flatten();
					// Can use "of" instead of "in" to cut down on data. Should be fine since there would still be complete coverage.
					let coords = this.anyPerimeterBarrierPositions.map(m => m.xyOfRange2).flatten();
					this.heap.anyPerimeterBarrierRange2Coords = [...new Map(coords.map(item => [item.x + '_' + item.y, item])).values()];
					this._anyPerimeterBarrierRange2Coords = this.heap.anyPerimeterBarrierRange2Coords;
				}
			}
			return this._anyPerimeterBarrierRange2Coords;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyPerimeterBarrierRange2CoordsNameHash', {
		get() {
			if (typeof this._anyPerimeterBarrierRange2CoordsNameHash === "undefined") {
				this._anyPerimeterBarrierRange2CoordsNameHash = this.heap.anyPerimeterBarrierRange2CoordsNameHash;
				if (typeof this._anyPerimeterBarrierRange2CoordsNameHash === "undefined") {
					let data = this.anyPerimeterBarrierRange2Coords.map(m => m.x + '_' + m.y);
					this.heap.anyPerimeterBarrierRange2CoordsNameHash = utils.arrayToHash(data, 1);
					this._anyPerimeterBarrierRange2CoordsNameHash = this.heap.anyPerimeterBarrierRange2CoordsNameHash;
				}
			}
			return this._anyPerimeterBarrierRange2CoordsNameHash;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'anyPerimeterBarrierPositions', {
		get() {
			if (typeof this._anyPerimeterBarrierPositions === "undefined") {
				this._anyPerimeterBarrierPositions = this.anyPerimeterBarrierCoords.map(coord => utils.posFromCoord(coord, this.name))
			}
			return this._anyPerimeterBarrierPositions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'perimeterBarrierPositions', {
		get() {
			if (typeof this._perimeterBarrierPositions === "undefined") {
				this._perimeterBarrierPositions = this.perimeterBarrierCoords.map(coord => utils.posFromCoord(coord, this.name))
			}
			return this._perimeterBarrierPositions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'perimeterBarrierPositionsNameHash', {
		get() {
			if (typeof this._perimeterBarrierPositionsNameHash === "undefined") {
				this._perimeterBarrierPositionsNameHash = utils.arrayToHash(this.perimeterBarrierPositions.map(pos => pos.name), 1);
			}
			return this._perimeterBarrierPositionsNameHash;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'exitsRange1', {
		get() {
			if (typeof this._exitsRange1 === "undefined") {
				this._exitsRange1 = this.heap.exitsRange1;
				if (typeof this._exitsRange1 === "undefined") {
					let data = Object.keys(this.exitsRange1NameHash).map(m => utils.posFromName(m));
					this.heap.exitsRange1 = packCoordList(data);
					this._exitsRange1 = this.heap.exitsRange1;
				}
				this._exitsRange1 = unpackCoordListAsPosList(this._exitsRange1, this.name) || [];
			}
			return this._exitsRange1;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'exitsRange1NameHash', {
		get() {
			if (typeof this._exitsRange1NameHash === "undefined") {
				this._exitsRange1NameHash = this.heap.exitsRange1NameHash;
				if (typeof this._exitsRange1NameHash === "undefined") {
					let data =
						this.exits
						.map(m => m.posOfRangeDNonTerrainWall(1).filter(f => f.isRange1Edge))
						.flatten()
						.map(m => m.name);
					this.heap.exitsRange1NameHash = utils.arrayToHash(data, 1);
					this._exitsRange1NameHash = this.heap.exitsRange1NameHash;
				}
			}
			return this._exitsRange1NameHash;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'exitGroups', {
		get() {
			if (typeof this._exitGroups === "undefined") {
				this._exitGroups = this.heap.exitGroups;
				if (typeof this._exitGroups === "undefined") {
					this.heap.exitGroups = [];
					let g = -1;
					let exits = this.exits;
					let prev = null;
					exits.forEach(pos => {
						if (!prev || !pos.isNearTo(prev)) g++;
						if (typeof this.heap.exitGroups[g] === "undefined") this.heap.exitGroups[g] = [];
						this.heap.exitGroups[g].push({x:pos.x, y:pos.y});
						prev = pos;
					});
					this._exitGroups = this.heap.exitGroups;
				}
				this._exitGroups = this._exitGroups.map(group => group.map(coord => utils.posFromCoord(coord, this.name)));
			}
			return this._exitGroups;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeFlag', {
		get() {
			if (typeof this._templeFlag === "undefined") {
				this._templeFlag = null;

				if (
					FlagManager.templeFlags[this.name]
					&& (FlagManager.templeFlags[this.name].flag.pos.roomName === this.name)

					// Ensure we are the correct color flag and not just testing.
					&& ColonyManager.productionBuild(FlagManager.templeFlags[this.name].flag)
				) {
					this._templeFlags = FlagManager.templeFlags[this.name].flag;
				}
			}
			return this._templeFlags;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeTestFlag', {
		get() {
			if (typeof this._templeTestFlag === "undefined") {
				this._templeTestFlag = null;

				if (
					FlagManager.templeFlags[this.name]
					&& (FlagManager.templeFlags[this.name].flag.pos.roomName === this.name)

					// Ensure we are the correct color flag and not just testing.
					&& ColonyManager.testBuild(FlagManager.templeFlags[this.name].flag)
				) {
					this._templeTestFlag = FlagManager.templeFlags[this.name].flag;
				}
			}
			return this._templeTestFlag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeFlagAnyColor', {
		get() {
			if (typeof this._templeFlagAnyColor === "undefined") {
				this._templeFlagAnyColor = null;

				if (
					FlagManager.templeFlagsAnyColor[this.name]
					&& (FlagManager.templeFlagsAnyColor[this.name].flag.pos.roomName === this.name)

				) {
					this._templeFlagAnyColor = FlagManager.templeFlagsAnyColor[this.name].flag;
				}
			}
			return this._templeFlagAnyColor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyFlag', {
		get() {
			if (typeof this._colonyFlag === "undefined") {
				this._colonyFlag = null;

				if (
					FlagManager.colonyFlags[this.name]
					&& (FlagManager.colonyFlags[this.name].flag.pos.roomName === this.name)

					// Ensure we are the correct color flag and not just testing.
					&& ColonyManager.productionBuild(FlagManager.colonyFlags[this.name].flag)
				) {
					this._colonyFlag = FlagManager.colonyFlags[this.name].flag;
				}
			}
			return this._colonyFlag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyTestFlag', {
		get() {
			if (typeof this._colonyTestFlag === "undefined") {
				this._colonyTestFlag = null;

				if (
					FlagManager.colonyFlags[this.name]
					&& (FlagManager.colonyFlags[this.name].flag.pos.roomName === this.name)

					// Ensure we are the correct color flag and not just testing.
					&& ColonyManager.testBuild(FlagManager.colonyFlags[this.name].flag)
				) {
					this._colonyTestFlag = FlagManager.colonyFlags[this.name].flag;
				}
			}
			return this._colonyTestFlag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyFlagAnyColor', {
		get() {
			if (typeof this._colonyFlagAnyColor === "undefined") {
				this._colonyFlagAnyColor = null;

				if (
					FlagManager.colonyFlags[this.name]
					&& (FlagManager.colonyFlags[this.name].flag.pos.roomName === this.name)

				) {
					this._colonyFlagAnyColor = FlagManager.colonyFlags[this.name].flag;
				}
			}
			return this._colonyFlagAnyColor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyFlagCode', {
		get() {
			if (typeof this._colonyFlagCode === "undefined") {
				this._colonyFlagCode = this.colonyFlagAnyColor.code;
			}
			return this._colonyFlagCode;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'noColony', {
		get() {
			if (typeof this._noColony === "undefined") {
				this._noColony = FlagManager.nocolonyFlags[this.name];
			}
			return this._noColony;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'claimFlag', {
		get() {
			if (typeof this._claimFlag === "undefined") {
				this._claimFlag = FlagManager.claimFlags[this.name];
			}
			return this._claimFlag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'unclaimFlag', {
		get() {
			if (typeof this._unclaimFlag === "undefined") {
				this._unclaimFlag = FlagManager.unclaimFlags[this.name];
			}
			return this._unclaimFlag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'unclaimFlagAnyColor', {
		get() {
			if (typeof this._unclaimFlagAnyColor === "undefined") {
				this._unclaimFlagAnyColor = FlagManager.unclaimFlagsAnyColor[this.name];
			}
			return this._unclaimFlagAnyColor;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyShouldHaveRoads', {
		get() {
			if (typeof this._colonyShouldHaveRoads === "undefined") {
				this._colonyShouldHaveRoads = (
					(this.controller && this.controller.level && this.atSpawningEnergyCapacityForLevel(Config.params.COLONY_ROAD_LEVEL))
					|| this.isTempleCandidate
					|| this.hasEmpireChurchAssistance
				) ? Config.params.COLONY_ROAD_LEVEL : -1;
			}
			return this._colonyShouldHaveRoads;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerContainers', {
		get() {
			if (typeof this._controllerContainers === "undefined") {
				// Having a controller container overlap with a source container will screw up crier logic.
				this._controllerContainers = this.containers.filter(f => (f.pos.getRangeTo(this.controller) === 3) && !this.sourceContainers.map(m => m.id).includes(f.id));
            }
			return this._controllerContainers;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerContainerEmpty', {
		get() {
			if (typeof this._controllerContainerEmpty === "undefined") {
				this._controllerContainerEmpty = this.controllerContainers.find(f => !f.store.getUsedCapacity() && this.noStickyTarget(f));
            }
			return this._controllerContainerEmpty;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerContainerNotFull', {
		get() {
			if (typeof this._controllerContainerNotFull === "undefined") {
				this._controllerContainerNotFull = this.controllerContainers.find(f => f.store.getFreeCapacity());
            }
			return this._controllerContainerNotFull;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerStores', {
		get() {
			if (typeof this._controllerStores === "undefined") {
				this._controllerStores = [];
				if (this.isTemple) {
					if (this.myTerminal) this._controllerStores.push(this.terminal);
					if (this.storage) this._controllerStores.push(this.storage);
					if (this.terminal && !this.myTerminal) this._controllerStores.push(this.terminal);
					if (this.myColonyTower1) this._controllerStores.push(this.myColonyTower1);
				}
				else {
					if (this.myControllerLink) this._controllerStores = this._controllerStores.concat([this.myControllerLink]);
					this._controllerStores = this._controllerStores.concat(this.controllerContainers);
				}
            }
			return this._controllerStores;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerStoresWithEnergySorted', {
		get() {
			if (typeof this._controllerStoresWithEnergySorted === "undefined") {
				if (this.isTemple) {
					// The list of temple stores is already orded in a predefined manner.
					this._controllerStoresWithEnergySorted = this.controllerStores.filter(f => f.store.getUsedCapacity(RESOURCE_ENERGY));
				}
				else {
					// Prioritize links, as they cut down on page movement.
					this._controllerStoresWithEnergySorted = _.sortByOrder(this.controllerStores.filter(f => f.store.getUsedCapacity(RESOURCE_ENERGY)), [
						//sortType => sortType instanceof StructureLink ? 0 : 1
						sortType => (sortType.structureType === STRUCTURE_LINK) ? 0 : 1
						, sortEnergy => -sortEnergy.store.getUsedCapacity(RESOURCE_ENERGY)
					]);
				}
            }
			return this._controllerStoresWithEnergySorted;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerContainersCapacity', {
		get() {
			if (typeof this._controllerContainersCapacity === "undefined") {
				this._controllerContainersCapacity = _.sum(this.controllerContainers, s => s.store.getCapacity());
			}
			return this._controllerContainersCapacity;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerConstructionContainers', {
		get() {
			if (typeof this._controllerConstructionContainers === "undefined") {
                this._controllerConstructionContainers = this.myConstructionSites.filter(f => (f.structureType === STRUCTURE_CONTAINER) && f.pos.getRangeTo(this.controller) <= 2) || null;
            }
			return this._controllerConstructionContainers;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerLinkLevel', {
		get() {
			if (typeof this._controllerLinkLevel === "undefined") {
				// Controller link is 2nd link to be created.
				this._controllerLinkLevel = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_LINK]).find(f => CONTROLLER_STRUCTURES[STRUCTURE_LINK][f] > 1);
            }
			return this._controllerLinkLevel;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * As the controller link does never actual get deleted when cycling a room,
	 * we need to know if its actual valid to use.
	 */
	Object.defineProperty(Room.prototype, 'myControllerLink', {
		get() {
			if (typeof this._myControllerLink === "undefined") {
				this._myControllerLink = null;

				if (this.my && CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level]) {
					this._myControllerLink = this.controllerLink;
				}
			}
			return this._myControllerLink;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerLink', {
		get() {
			if (typeof this._controllerLink === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				// Note: Excluding check for controller level so that this link can be ignored if colony build needs to delete it.
				if (this.controller) {
					if (this.memory.controllerLinkId) object = Game.structures[this.memory.controllerLinkId];

					// Object wasn't in cache, so look for it.
					if (!object) {
						// Controller link has to be in a valid position.
						object = this.links.find(f => this.validControllerLinkPos(f.pos));
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.controllerLinkId = object.id;
				}
				else {
					delete this.memory.controllerLinkId;
				}

				this._controllerLink = object || null;
			}
			return this._controllerLink;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerConstructionLink', {
		get() {
			if (typeof this._controllerConstructionLink === "undefined") {
                this._controllerConstructionLink = this.myConstructionSites.find(f =>
					(f.structureType === STRUCTURE_LINK)
					&& f.pos.isRange2(this.controller)
				)
            }
			return this._controllerConstructionLink;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isCreepOnColonyRenewPos', {
		get() {
			if (typeof this._isCreepOnColonyRenewPos === "undefined") {
				this._isCreepOnColonyRenewPos = this.colonyRenewPos ? this.colonyRenewPos.lookForCreep() : null;
            }
			return this._isCreepOnColonyRenewPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyRenewPos', {
		get() {
			if (typeof this._colonyRenewPos === "undefined") {
				// The colony flag IS the renew position, so we can cheat a bit here.
				this._colonyRenewPos = this.colonyFlag ? this.colonyFlag.pos : null;
            }
			return this._colonyRenewPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyPowerCreepRenewPos', {
		get() {
			if (typeof this._colonyPowerCreepRenewPos === "undefined") {
				this._colonyPowerCreepRenewPos = null;
				if (this.colonyFlag && this.powerCreep) {
					this._colonyPowerCreepRenewPos = ColonyManager.getPos(ColonyManager.COLONY_STAMP_POWER_SPAWN_RENEW_POS(this.colonyFlag));
				}
            }
			return this._colonyPowerCreepRenewPos;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.moveToColonyBuildPos = function(site) {
        // Shorthand.
        let creep = this;
        let room = this.room;

		if (site) site = utils.normalizePos(site);
		if (!site) return null;

		// When in a colony room, use our parking spots to build from if site is in range.
		// All parking spots are within 6 distance to the flag, so a very quick check can be performed here.
		if (room.my && room.colonyFlag && (site.getDistanceTo(room.colonyFlag) <= (3 + 6))) {
			// If we are building a structure that is near our designated build spots, try to go there.
			let buildPos = site.findInRange(room.colonyParking, 3);

			// We are already on a spot that we can build from, so stay here.
			if (buildPos.find(f => f.isEqualTo(creep))) {
				return creep.pos;
			}

			// We aren't on a build position, check to see if there is one available.
			if (buildPos.length) {
				let pos = creep.pos.findClosestByPath(buildPos, {
					filter: f => f.isEnterable
				});
				return pos;
			}
		}

		// Start with all positions in range 3.
		let buildPos = site.posInRange3NotBlockedByObjectOffsetEdge;
		if (RoomIntel.getLethalHostilesTTL(room.name) && site.findInRange(room.lethalHostiles, 3).length) {
			// If the room has hostiles, don't venture out past the site we are targetting.
			buildPos = buildPos.filter(f => site.rangeToEdge < f.rangeToEdge)
		}

		// Filter out the spots that are unreachable.
		// This is expensive, so make sure we are caching the calls to this function to keep its call count down.
		buildPos = buildPos.filter(f => creep.pos.findClosestByPath([f], { ignoreCreeps: true } ));

		// Sort by furthest away, and by distance. Ideal spot would be range 3 distance 3.
		buildPos = _.sortByOrder(buildPos, [sortRangeToEdge=>-sortRangeToEdge.rangeToEdge, sortDistance=>sortDistance.getDistanceTo(site)]);

		// Find the first spot in the ordered list that we are already at, or doesn't have a creep, and doesn't have a road.
		let movePos = buildPos.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()) && !f.hasRoad);

		// If we didn't find a spot previously, start over and just remove the road criteria.
        if (!movePos) movePos = buildPos.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));;

		// Return whatever spot, or none, that we found.
        return movePos;
    }

	Object.defineProperty(Room.prototype, 'roomSourcePower', {
		get() {
			if (typeof this._roomSourcePower === "undefined") {
				// The power of the room from sources.
				this._roomSourcePower = this.sources.length * SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
			}
			return this._roomSourcePower;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.calcCarryCapacity = function(body) {
		return body.filter(f => f === CARRY).length * CARRY_CAPACITY;
	}

	Room.prototype.getWorkParts = function(body) {
		return body.filter(f => f === WORK).length;
	}

	Room.prototype.getCarryParts = function(body) {
		return body.filter(f => f === CARRY).length;
	}

	Room.prototype.getMoveParts = function(body) {
		return body.filter(f => f === MOVE).length;
	}

	Room.prototype.calcRoomBodyPower = function(body) {
		// Sources are 3000 energy, and respawn every 300 ticks. So they are worth 10 e/t (energy per tick).
		// Peasants are 5 (6) parts each, as harvest gathers 2 energy per tick, therefore harvesting at 10 e/t.
		// Upgrade controller takes 1 energy per tick, so you need 10 work parts per source to balance.
		// There is some fudge factor in movement costs, building costs, etc.
		let carryCapacity = this.calcCarryCapacity(body);
		let workParts = body.filter(f => f === WORK).length;

		// How many ticks are spent filling our store.
		// Once peasants are available we don't need peons for this.
		let harvestTicks = 0; //this.peasantIsAvailable ? 0 : (carryCapacity / (workParts * HARVEST_POWER));

		// Calculate a guess at how many ticks are wasted spent walking from each source to controller.
		// If the source has a link, then we need to count how long it takes to get to the strorage unit and back.
		let storageMoveTicks = (this.controller && this.storage) ? this.controller.pos.getRangeTo(this.storage) : 0;
		let sourceMoveTicks = this.controller ? _.sum(this.sources, s => s.sourceLink ? storageMoveTicks : s.pos.getRangeTo(this.controller)) * 2 : 0;

		// Adjust so we are taking the average distance.
		sourceMoveTicks = sourceMoveTicks / this.sources.length;

		// How many ticks are spent using the energy in our store.
		// All work functions (build/repair/upgrade) consume one energy per work body part.
		let consumeTicks = workParts ? (carryCapacity / workParts) : 0;

		// Get the power value of this body in e/t.
		return carryCapacity / (harvestTicks + sourceMoveTicks + consumeTicks);
	}

	Object.defineProperty(Room.prototype, 'maxRogues', {
		get() {
			if (typeof this._maxRogues === "undefined") {
				if (FlagManager.throttleFlag || FlagManager.norogueFlag || this.isTemple) {
					this._maxRogues = 0;
				}
				else {
					this._maxRogues = 1;
				}
			}
			return this._maxRogues;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCreepsWorkParts', {
		get() {
			if (typeof this._myCreepsWorkParts === "undefined") {
				this._myCreepsWorkParts = _.sum(this.myCreeps, s => s.workParts);
			}
			return this._myCreepsWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'carryCapacityNeededByColony', {
		get() {
			if (typeof this._carryCapacityNeededByColony === "undefined") {
				this._carryCapacityNeededByColony = 0;

				// Need to have myStorage to be able to transfer into.
				this.sources.forEach(source => {
					if (!source.sourceLink) {
						// Llamas are not used for very long, we don't need to spend the cpu to get an accurate distance.
						//let distanceToStorage = source.sourcePathLength || source.harvestPos.getDistanceTo(this.colonyRenewPos);
						let distanceToStorage = source.harvestPos.getRangeTo(this.colonyRenewPos) * 1.5;
						this._carryCapacityNeededByColony += utils.carryPartsNeededForSourceDistance(distanceToStorage, source.energyCapacity) * CARRY_CAPACITY;
					}
				})
			}
			return this._carryCapacityNeededByColony;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyKingPos', {
		get() {
			if (typeof this._colonyKingPos === "undefined") {
				let xy = null;
				if (this.colonyFlag) {
					xy = ColonyManager.COLONY_KING_POS(this.colonyFlag);
				}
				this._colonyKingPos = xy;
            }
			return this._colonyKingPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyQueenPos', {
		get() {
			if (typeof this._colonyQueenPos === "undefined") {
				let xy = null;
				if (this.colonyFlag) {
					xy = ColonyManager.COLONY_QUEEN_POS(this.colonyFlag);
				}
				this._colonyQueenPos = xy;
            }
			return this._colonyQueenPos;
		},
		configurable: true, enumerable: true,
    });

	Room.prototype.doesColonyNeedMineralMinerForRoomName = function(roomName) {
		// Shorthand.
		let room = this;

		// Basic requirements.
		if (!room.shouldMinerContinueExtractingForRoom(roomName)) return false;

		return !!(
			// Keep mining until our terminal has the target amount.
			(room.myTerminal.store.getUsedCapacity(RoomIntel.getMineralType(roomName)) < GameManager.getTerminalResourceTargetAmount(RoomIntel.getMineralType(roomName), RoomIntel.getMineralAmount(roomName)))

			// If the mineral goes below the LOW density threshhold, then continue mining it so it can reset.
			// We can live with the extra amount or sell it off.
			|| (RoomIntel.getMineralAmount(roomName) < MINERAL_DENSITY[1])

			// Early rooms (ton of space in the terminal) should harvest a lot of minerals with the intention of spreading them out later (if they don't get sold first).
			|| (room.myTerminal.store.getUsedCapacity() < room.myTerminal.store.getFreeCapacity())
		);
	}

	// Room.prototype.doesColonyNeedThoriumMinerForRoomName = function(roomName) {
	// 	// Shorthand.
	// 	let room = this;

	// 	return !!(
	// 		// Base requirements.
	// 		room.myTerminal

	// 		// Amounts we have and whats available in the mineral positino.
	// 		&& (
	// 			// Baseline threshold...our terminal is below 35000
	// 			(room.myTerminal.store.getUsedCapacity(C.RESOURCE_THORIUM) < MINERAL_DENSITY[2])

	// 			// The mineral in the room is "tiny" amount, harvest it so it will reset.
	// 			|| (RoomIntel.getThoriumAmount(roomName) <= MINERAL_DENSITY[1])

	// 			// Early rooms should harvest a lot of minerals with the intention of spreading them out later.
	// 			|| (room.myTerminal.store.getUsedCapacity() < room.myTerminal.store.getFreeCapacity())
	// 		)
	// 	);
	// }

	Room.prototype.shouldMinerContinueExtractingForRoom = function(roomName) {
		// Need visibility into mineral room.
		let mineralRoom = Game.rooms[roomName];
		if (!mineralRoom) return false;

		return !!(
			// Base requirements.
			this.myTerminal

			// We have a non-zero mineral in this room.
			&& RoomIntel.getMineralType(roomName)
			&& RoomIntel.getMineralAmount(roomName)

			// Verify that we are allowed to mine this site. Center rooms have public extractors.
			&& (
				(RoomIntel.getMy(roomName) && mineralRoom.colonyMineralExtractor)
				|| Cartographer.isCenterRoom(roomName)
			)

			// Verify that we don't have this type locally. Deplete local before sending out for remote.
			&& (
				RoomIntel.getMy(roomName)
				|| !RoomIntel.getMineralAmount(this.name)
				|| (RoomIntel.getMineralType(this.name) !== RoomIntel.getMineralType(roomName))
			)

			// Only extract more if we have the room for it in our terminal.
			&& (this.myTerminal.store.getFreeCapacity() >= (Config.params.TERMINAL_TARGET_ENERGY * 2))

			// Absolutely never exceed our hard maximum. Thats a lot.
			&& (this.myTerminal.store.getUsedCapacity(RoomIntel.getMineralType(roomName)) < Config.params.TERMINAL_MINERAL_MAX)
		);
	}

	Object.defineProperty(Room.prototype, 'hasEmpireChurchAssistance', {
		get() {
			if (typeof this._hasEmpireChurchAssistance === "undefined") {
				this._hasEmpireChurchAssistance = false;

				// Verify that we have a closest max room that is in range of assinting us.
				let closestRoom = GameManager.getClosestChurchRoomTo(this.name, this.name)
				if (
					closestRoom
					&& Cartographer.isInRouteDistance(this.name, closestRoom, Config.params.CHURCH_ASSIST_DISTANCE)
				) {
					this._hasEmpireChurchAssistance = true;
				}
            }
			return this._hasEmpireChurchAssistance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'usingEmpireChurchAssistance', {
		get() {
			if (typeof this._usingEmpireChurchAssistance === "undefined") {
				// Once we reach full level 2, then we don't need any more early assistance.
				this._usingEmpireChurchAssistance =
					(
						!this.atSpawningEnergyCapacityForLevel(Config.params.CHURCH_LEVEL)
						|| (this.controller.level === Config.params.CHURCH_LEVEL)
						//|| ((this.controller.level === 2) && this.myConstructionSites.length)
					)
					&& this.hasEmpireChurchAssistance;
            }
			return this._usingEmpireChurchAssistance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasEmpireCastleAssistance', {
		get() {
			if (typeof this._hasEmpireCastleAssistance === "undefined") {
				let count = 0;

				// Apply a filter to the castle rooms to get just those in assist range of us.
				if (GameManager.empireCastleRooms.length >= Config.params.EMPIRE_CASTLE_ROOM_ASSISTANCE_COUNT) {
					// Loop thru every room until we find enough to satisfy our limit.
					GameManager.empireCastleRooms.every(f => {
						if (count >= Config.params.EMPIRE_CASTLE_ROOM_ASSISTANCE_COUNT) return false;
						count += Cartographer.isInRouteDistance(this.name, f.name, Config.params.FOCUS_ASSIST_DISTANCE) ? 1 : 0;
						return true;
					})
				}

				this._hasEmpireCastleAssistance = count >= Config.params.EMPIRE_CASTLE_ROOM_ASSISTANCE_COUNT;
            }
			return this._hasEmpireCastleAssistance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsUpgradeControllerAssistance', {
		get() {
			if (typeof this._colonyNeedsUpgradeControllerAssistance === "undefined") {
				this._colonyNeedsUpgradeControllerAssistance = false;
				if (
					// Once we get to level 7, we can build our own prophets and criers.
					this.my
					&& !this.atMaxLevel
					&& this.atSpawningEnergyCapacityForCurrentLevel
				) {
					this._colonyNeedsUpgradeControllerAssistance = true;
				}
            }
			return this._colonyNeedsUpgradeControllerAssistance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'belowBuilderCreepMax', {
		get() {
			if (typeof this._belowBuilderCreepMax === "undefined") {
				this._belowBuilderCreepMax =
					FlagManager.nobuildlimitFlag
					// Can always have 1 in each room.
					|| !CreepManager.getBuildersByFocusId(this.controller.id).length
					// Overall empire cap to prevent runaway CPU.
					|| (CreepManager.getBuildersByFocusId(this.controller.id).length < GameManager.empireBuilderCreepMax)
			}
			return this._belowBuilderCreepMax;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isConstructorCountBelowConstructionSites', {
		get() {
			if (typeof this._isConstructorCountBelowConstructionSites === "undefined") {
				this._isConstructorCountBelowConstructionSites = (CreepManager.getConstructorsByFocusId(this.controller.id).length < this.myConstructionSites.length);
			}
			return this._isConstructorCountBelowConstructionSites;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isConstructorCountBelowBarriersBelowRepairThreshhold', {
		get() {
			if (typeof this._isConstructorCountBelowBarriersBelowRepairThreshhold === "undefined") {
				this._isConstructorCountBelowBarriersBelowRepairThreshhold = (CreepManager.getConstructorsByFocusId(this.controller.id).length < this.barriersBelowRepairThreshhold.length);
			}
			return this._isConstructorCountBelowBarriersBelowRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isConstructorCountBelowBarriersBelowWorkerRepairThreshhold', {
		get() {
			if (typeof this._isConstructorCountBelowBarriersBelowWorkerRepairThreshhold === "undefined") {
				this._isConstructorCountBelowBarriersBelowWorkerRepairThreshhold = (CreepManager.getConstructorsByFocusId(this.controller.id).length < this.barriersBelowWorkerRepairThreshhold.length);
			}
			return this._isConstructorCountBelowBarriersBelowWorkerRepairThreshhold;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.setRallyFlagColor = function() {
		let flag = FlagManager.rallyFlags[this.name] ? FlagManager.rallyFlags[this.name].flag : null;

		if (flag) {
			let rallyFlagEnergyColor = this.rallyFlagEnergyColor;
			let rallyFlagAuxColor = this.rallyFlagAuxColor;

			// Should the aux color be white, then fill in the whole flag with the energy color.
			rallyFlagAuxColor = (rallyFlagAuxColor === COLOR_WHITE) ? rallyFlagEnergyColor : rallyFlagAuxColor;

			if ((flag.color != rallyFlagAuxColor) || (flag.secondaryColor != rallyFlagEnergyColor)) {
				flag.setColor(rallyFlagAuxColor, rallyFlagEnergyColor);
				return true;
			}
		}
		return false;
	};

    Object.defineProperty(Room.prototype, 'rallyFlagEnergyColor', {
        get() {
			if (typeof this._rallyFlagEnergyColor === "undefined") {
				let color = COLOR_WHITE;

				// Test in descending order, as they are supersets of one another.
				if (this.energyCapacityAvailable == 0) {
					color = COLOR_WHITE;

				} else if (this.isStorageEnergyPower) {
					color = COLOR_RED;

				} else if (this.isStorageEnergyDump) {
					color = COLOR_CYAN;

				} else if (this.isStorageEnergyAbundant) {
					color = COLOR_BLUE;

				} else if (this.isStorageEnergyNormal) {
					color = COLOR_GREEN;

				} else if (this.isStorageEnergyMinimal) {
					color = COLOR_YELLOW;

				} else {
					color = COLOR_GREY;
				}

				this._rallyFlagEnergyColor = color;
            }
            return this._rallyFlagEnergyColor;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'rallyFlagAuxColor', {
        get() {
			if (typeof this._rallyFlagAuxColor === "undefined") {
				let color = COLOR_WHITE;

				// Test in descending order, as they are supersets of one another.
				if (RoomIntel.getHostilesTTL(this.name)) {
					color = COLOR_RED;
				}

				this._rallyFlagAuxColor = color;
            }
            return this._rallyFlagAuxColor;
        },
        configurable: true, enumerable: true,
	});

	/**
	 * Determines if this room is the best room that is also closest or tied to target in terms of istance.
	 */
	Room.prototype.isClosestAndBestToRoom = function(roomName, options) {
		let defaults = {
			minLevel: null
			, includeSpawning: false
			, includeBuilding: false
			, includeTemples: false
			, excludeNoPowerbank: false
			, excludeNoDeposit: false
			, excludeNoMineral: false
			, maxDistance: 16
			, bestOf: true
			, atSpawningEnergyCapacityForCurrentLevel: true
			, noCriteria: false
			, boostRole: null
			, boostRoleIncomingDamage: null
			, debug: false
		};
		options = _.defaults({}, _.clone(options), defaults);

		let filterCriteria = function(room) {
			return (
				// Are we bypassing any criteria options?
				options.noCriteria

				|| (
					// Placeholder
					true

					// Temples are never the best room.
					&& (options.includeTemples || !room.isTemple)

					// Minimum level check to be included in the potentials.
					&& (!options.minLevel || (room.level >= options.minLevel))

					// Must have all extensions built.
					&& (!options.atSpawningEnergyCapacityForCurrentLevel || room.atSpawningEnergyCapacityForCurrentLevel)

					// Do we want to including rooms that are building?
					&& (options.includeBuilding || !room.myConstructionSites.length)

					// Do we want to including rooms that have powerbank enabled?
					&& (!options.excludeNoPowerbank || !room.noPowerbank)

					// Do we want to including rooms that have deposits enabled?
					&& (!options.excludeNoDeposit || !room.noDeposit)

					// Do we want to including rooms that have minerals enabled?
					&& (!options.excludeNoMineral || !room.noMineral)

					// Should rooms that are spawning be a stopping criteria?
					// Otherwise will spawn from a greater distance but can spawn immediately.
					&& (options.includeSpawning || !room.colonyAllSpawnsSpawningOrRenewing)

					// Apply the maximum distance option.
					&& Cartographer.isInRouteDistance(room.name, roomName, (options.maxDistance || 0))

					// Check to see if the boost function is returning true.
					&& (!options.boostRole || room.canBoostBodyByRole(options.boostRole, options.boostRoleIncomingDamage))
				)
			);
		}

		// Can do a test against the room now, to see if it passes the basic tests.
		if (!filterCriteria(this)) {
			if (options.debug) console.log('isClosestAndBestToRoom =>', 'room failed basic criteria');
			return false;
		}

		// Get all our spawn rooms meeting the level and spawning criteria.
		let roomNames = GameManager.empireSpawnRoomsActive.filter(f => filterCriteria(f)).map(m => m.name);

		// If we are looking for the best level of this set (in the specified range), as opposed to any room above the minimum,
		// then find the highest ranked one of those in range.
		if (options.bestOf && roomNames.length) {
			let bestValue = Math.max(...roomNames.map(m => Game.rooms[m].energyCapacityAvailable));
			if (options.debug) console.log('isClosestAndBestToRoom =>', 'bestOf', bestValue);
			roomNames = roomNames.filter(f => Game.rooms[f].energyCapacityAvailable >= bestValue);

			// Our room isn't in the bestOf room list, meaning we are lower level. Bail out.
			if (!roomNames.find(f => f === this.name)) {
				if (options.debug) console.log('isClosestAndBestToRoom =>', 'bestOf failed:', this.energyCapacityAvailable, bestValue);
				return false;
			}
		}

		// Find the closest room to the specified room.
		let minDistance = Math.min(...roomNames.map(m => Cartographer.findRouteDistance(m, roomName)));
		let myDistance = Cartographer.findRouteDistance(this.name, roomName);

		if (options.debug) console.log('isClosestAndBestToRoom =>', 'roomNames:', roomNames, ', minDistance:', minDistance, ', myDistance:', myDistance)

		return myDistance === minDistance;
	}

	Object.defineProperty(Room.prototype, 'controllerNeedsEnergy', {
		get() {
			if (typeof this._controllerNeedsEnergy === "undefined") {
				this._controllerNeedsEnergy = false;
				if (this.controller) {
					// Level 2 is only 200 energy, so do that quickly so we can get a safe mode level.
					this._controllerNeedsEnergy = (this.level <= 2) || (this.controller.ticksToDowngrade < Math.max((CONTROLLER_DOWNGRADE[this.level] - (CREEP_LIFE_TIME * CONTROLLER_DOWNGRADE_RESTORE)), CREEP_LIFE_TIME));
				}
			}
			return this._controllerNeedsEnergy;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * For building up low-level rooms, peons can pull from horse/mules once they are parked (or there are no parking spots left).
	 */
	Object.defineProperty(Room.prototype, 'colonyStorageTransporter', {
		get() {
			if (typeof this._colonyStorageTransporter === "undefined") {
				this._colonyStorageTransporter = null;

				// Get the list of valid transporters. Must have something in storage and on a parking spot.
				let transporters = this.myTransporterCreeps.filter(f => f.store.getUsedCapacity() && f.inWorkRoom && f.isOnParkingSpot);

				// The best one to use as the focus is the biggest, oldest creep.
				// Most likely it can just sit there and act as a mobile storage unit
				// while other transporters fill it up and creeps withdraw from it.
				this._colonyStorageTransporter = _.sortByOrder(transporters, [
					s1 => -s1.store.getCapacity()
					, s2 => s2.ticksToLive
				]).find(x => x !== undefined);
			}
			return this._colonyStorageTransporter;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyStoragePickups', {
		get() {
			if (typeof this._colonyStoragePickups === "undefined") {
				this._colonyStoragePickups = []

				// Early game keep our focus transporters moving by exclusively withdrawing from it.
				if (!this.storage && this.colonyStorageTransporter) {
					this._colonyStoragePickups.push(this.colonyStorageTransporter)
				}

				// Temple can only really withdraw from early storage. Everything else will be blocked.
                else if (this.isTemple) {
					if (this.storage && (!this.terminal || !this.myStorage)) this._colonyStoragePickups.push(this.storage);
                }

				// Terminal is overflowing, choose it exclusively.
                else if (this.terminal && (this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > Config.params.TERMINAL_TARGET_ENERGY)) {
					this._colonyStoragePickups.push(this.terminal);
                }

				// Midgame storage units.
				else {
					if (this.storage) this._colonyStoragePickups.push(this.storage);
					if (this.terminal) this._colonyStoragePickups.push(this.terminal);
					if (this.colonyFactory) this._colonyStoragePickups.push(this.colonyFactory);

					// Late game towers can be a source once we have a queen (and aren't under attack).
					// Primarily intended for filling extensions only.
					if (this.queen && this.king && this.colonyQueenTowers.length && !RoomIntel.getHostilesTTL(this.name)) {
						this._colonyStoragePickups = this._colonyStoragePickups.concat(this.colonyQueenTowers);
					}

					// For building up low-level rooms.
					if (this.colonyContainer) this._colonyStoragePickups.push(this.colonyContainer)

					// For building up low-level rooms, peons can pull from mules once they are parked (or there are no parking spots left).
					// For performance, don't test for this special creep unless you really have to.
					//if (!this.myStorage && !this.colonyContainer && this.colonyStorageTransporter) this._colonyStoragePickups.push(this.colonyStorageTransporter)

					if (this.king)  {
						// With a king, can pull from spawn1 and tower1.
						if (!RoomIntel.getHostilesTTL(this.name) && this.colonySpawn1 && this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY)) this._colonyStoragePickups.push(this.colonySpawn1);
						if (!RoomIntel.getHostilesTTL(this.name) && this.colonyTower1) this._colonyStoragePickups.push(this.colonyTower1);
					}
					else {
						// With no king, pull for any links with energy.
						this._colonyStoragePickups = this._colonyStoragePickups.concat(this.myLinks);
					}
				}
			}
			return this._colonyStoragePickups;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyStoragePeon', {
		get() {
			if (typeof this._colonyStoragePeon === "undefined") {
				this._colonyStoragePeon = this.colonyStoragePickups;

				// Early/Mid game container around controller, used for mass controller upgrades.
				if (!this.isTemple && this.hasEmpireCastleAssistance && !CreepManager.getUpgradeControllerCreepsAtWorkByFocusId(this.controller.id).length && this.controllerContainers.length) this._colonyStoragePeon = this._colonyStoragePeon.concat(this.controllerContainers);
			}
			return this._colonyStoragePeon;
		},
		configurable: true, enumerable: true,
	});

	// Meant for homebase peons in the spawn room.
	Object.defineProperty(Room.prototype, 'colonyStorageDropoffs', {
		get() {
			if (typeof this._colonyStorageDropoffs === "undefined") {
				this._colonyStorageDropoffs = []

				// Temples can drop off at storage before they get a terminal.
				if (this.isTemple && !this.atMaxLevel) {
					if (this.myStorage && !this.myStorage.storeFull && !this.myTerminal) {
						this._colonyStorageDropoffs.push(this.myStorage);
					}
				}

				else if (this.myStorage && !this.myStorage.storeFull) {
					// Storage is primary location as long as it isn't full.
					this._colonyStorageDropoffs.push(this.myStorage);
				}

				else {
					// In case we are trying to move our storage.
					if (this.myStorage) this._colonyStorageDropoffs.push(this.myStorage);
					if (this.myTerminal) this._colonyStorageDropoffs.push(this.myTerminal);
					if (this.colonyFactory) this._colonyStorageDropoffs.push(this.colonyFactory);

					// The low level container.
					if (this.colonyContainer) this._colonyStorageDropoffs.push(this.colonyContainer);

					// For low level rooms that are going thru speed-upgrades.
					if (this.controllerContainers.length) this._colonyStorageDropoffs = this._colonyStorageDropoffs.concat(this.controllerContainers)
				}
			}

			return this._colonyStorageDropoffs;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyParking', {
		get() {
			if (typeof this._colonyParking === "undefined") {
				// Use a unique value for this key that is different if colony is moved or changes color.
				let flag = this.templeFlag || this.colonyFlag;
				let key = 'colonyParking' + (flag ? flag.code : '') + (this.powerCreep ? 'p' : 'n');

				if (typeof this.heap[key] === "undefined") {
					if (flag) {
						let spots = [];

						if (this.isTemple) {
							// The best spots are near the flag.
							spots = this.templeFlag.nipDistance4FromController;

							// Add in spots in walking range.
							spots = spots.concat(this.templeFlag.posInRange6ControllerOfRange6);

							// Save to the heap as a xy coordinate only.
							this.heap[key] = spots.map(m => m.coord);
						}
						else {
							// As long as no storage in play, this is the best spot.
							if (!this.storage) {
								spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_RENEW_POS(flag)));
							}

							// With no powercreep, this is closest to renew/storage.
							if (!this.powerCreep) {
								spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_POWER_SPAWN_RENEW_POS(flag)));
							}

							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_1(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_2(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_3(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_4(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_5(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_6(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_7(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_8(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_9(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_10(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_11(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_12(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_13(flag)));
							spots.push(ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_PARKING_14(flag)));

							// Filter out invalid parking spots.
							let filter = function(pos, controller) { return (pos.getRangeTo(controller) > (controller.room.atMaxLevel ? 3 : 5)) && !pos.isTerrainWall; }

							// Save to the heap as a xy coordinate only.
							this.heap[key] = spots.filter(f => filter(f, this.controller)).map(m => m.coord);
						}

					}
				}

				// Rebuild new positions each tick from the raw coords.
				this._colonyParking = (this.heap[key] || []).map(m => utils.posFromCoord(m, this.name));

				// Clear the heap if we are building.
				if (this.myConstructionSites.length) delete this.heap[key];
			}
			return this._colonyParking;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyParkingPosNameHash', {
		get() {
			if (typeof this._colonyParkingPosNameHash === "undefined") {
				// Use a unique value for this key that is different if colony is moved or changes color.
				let flag = this.templeFlag || this.colonyFlag;
				let key = 'colonyParkingPosNameHash' + (flag ? flag.code : '') + (this.powerCreep ? 'p' : 'n');
				if (typeof this.heap[key] === "undefined") {
					this.heap[key] = this.colonyParking.map(m => m.name).reduce((map, obj) => (map[obj] = obj, map), {});
				}
				this._colonyParkingPosNameHash = this.heap[key];

				// Clear the heap if we are building.
				if (this.myConstructionSites.length) delete this.heap[key];
			}
			return this._colonyParkingPosNameHash;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyFirstOpenParkingSpot', {
		get() {
			if (typeof this._colonyFirstOpenParkingSpot === "undefined") {
				this._colonyFirstOpenParkingSpot = this.colonyParking.find(f => !f.lookForCreep());
			}
			return this._colonyFirstOpenParkingSpot;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'isOnParkingSpot', {
		get() {
			if (typeof this._isOnParkingSpot === "undefined") {
				this._isOnParkingSpot = !!this.room.colonyParkingPosNameHash[this.pos.name];
			}
			return this._isOnParkingSpot;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'updateDestroyFlagsTick', {
		get() {
			return this.heap.updateDestroyFlagsTick;
		},
        set(value) {
            if (value) {
                this.heap.updateDestroyFlagsTick = value;
            } else {
                delete this.heap.updateDestroyFlagsTick;
            }
        },
		configurable: true, enumerable: true,
	});

	/**
	 * Unboosting creates a VERY large cooldown.
	 * We should only really use lab1 and lab2, since they don't incur a cooldown for normal lab reactions.
	 * As long as we aren't currently output (which would create a reaction cooldown) then use the other labs as well.
	 *
	 * The common scenerio for this is Prophet upgrade creeps.
	 *
	 * The math for allowing other non lab1/lab2 boils down to the cooldown of the reaction is close to the
	 * SUM of all the reactions that went into the type (tier3 really),
	 * AND you are getting hard to come by materials,
	 * AND you are saving CPU for all those reactions.
	 */
	Object.defineProperty(Room.prototype, 'unboostLab', {
		get() {
			if (typeof this._unboostLab === "undefined") {
				this._unboostLab =
					((this.colonyLab1 && !this.colonyLab1.cooldown) ? this.colonyLab1 : null)
					|| ((this.colonyLab2 && !this.colonyLab2.cooldown) ? this.colonyLab2 : null)
					// As long as we aren't currently output (which would create a reaction cooldown) then use the other labs as well.
					|| this.colonyOutputLabs.find(f => !f.cooldown && !f.hasEffect(PWR_OPERATE_LAB))
					// || ((!this.labOutput && this.colonyLab10 && !this.colonyLab10.cooldown) ? this.colonyLab10 : null)
					// || ((!this.labOutput && this.colonyLab9 && !this.colonyLab9.cooldown) ? this.colonyLab9 : null)
					// || ((!this.labOutput && this.colonyLab8 && !this.colonyLab8.cooldown) ? this.colonyLab8 : null)
					// || ((!this.labOutput && this.colonyLab7 && !this.colonyLab7.cooldown) ? this.colonyLab7 : null)
					// || ((!this.labOutput && this.colonyLab6 && !this.colonyLab6.cooldown) ? this.colonyLab6 : null)
					// || ((!this.labOutput && this.colonyLab5 && !this.colonyLab5.cooldown) ? this.colonyLab5 : null)
					// || ((!this.labOutput && this.colonyLab4 && !this.colonyLab4.cooldown) ? this.colonyLab4 : null)
					// || ((!this.labOutput && this.colonyLab3 && !this.colonyLab3.cooldown) ? this.colonyLab3 : null)

					// Stick a null at the end so this method caches something other than undefined.
					|| null;
            }
			return this._unboostLab;
		},
		configurable: true, enumerable: true,
    });


    Object.defineProperty(Room.prototype, 'colonyQueenTowers', {
        get() {
			if (typeof this._colonyQueenTowers === "undefined") {
				this._colonyQueenTowers = [];

				// Tower 1 is excluded but must exist for the queen to own anything.
				if (this.colonyTower1) {
					if (this.colonyTower2) this._colonyQueenTowers.push(this.colonyTower2);
					if (this.colonyTower3) this._colonyQueenTowers.push(this.colonyTower3);
					if (this.colonyTower4) this._colonyQueenTowers.push(this.colonyTower4);
					if (this.colonyTower5) this._colonyQueenTowers.push(this.colonyTower5);
					if (this.colonyTower6) this._colonyQueenTowers.push(this.colonyTower6);
				}
            }
            return this._colonyQueenTowers;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'colonyQueenSpawns', {
        get() {
			if (typeof this._colonyQueenSpawns === "undefined") {
				this._colonyQueenSpawns = [];
				if (this.colonySpawn2) this._colonyQueenSpawns.push(this.colonySpawn2)
				if (this.colonySpawn3) this._colonyQueenSpawns.push(this.colonySpawn3)
            }
            return this._colonyQueenSpawns;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'donkeyCarryCapacity', {
        get() {
			if (typeof this._donkeyCarryCapacity === "undefined") {
				if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.donkeyCarryCapacity;

				this._donkeyCarryCapacity = this.heap.donkeyCarryCapacity;
				if (typeof this._donkeyCarryCapacity === "undefined") {
					this.heap.donkeyCarryCapacity = this.calcCarryCapacity(this.getBodyDonkey());
					this._donkeyCarryCapacity = this.heap.donkeyCarryCapacity;
				}
            }
            return this._donkeyCarryCapacity;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'jackassCarryCapacity', {
        get() {
			if (typeof this._jackassCarryCapacity === "undefined") {
				if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.jackassCarryCapacity;

				this._jackassCarryCapacity = this.heap.jackassCarryCapacity;
				if (typeof this._jackassCarryCapacity === "undefined") {
					this.heap.jackassCarryCapacity = this.calcCarryCapacity(this.getBodyJackass());
					this._jackassCarryCapacity = this.heap.jackassCarryCapacity;
				}
            }
            return this._jackassCarryCapacity;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'burroCarryCapacity', {
        get() {
			if (typeof this._burroCarryCapacity === "undefined") {
				if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.burroCarryCapacity;

				this._burroCarryCapacity = this.heap.burroCarryCapacity;
				if (typeof this._burroCarryCapacity === "undefined") {
					this.heap.burroCarryCapacity = this.calcCarryCapacity(this.getBodyBurro());
					this._burroCarryCapacity = this.heap.burroCarryCapacity;
				}
            }
            return this._burroCarryCapacity;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'oxCarryCapacity', {
        get() {
			if (typeof this._oxCarryCapacity === "undefined") {
				if (this.my) {
					if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.oxCarryCapacity;

					this._oxCarryCapacity = this.heap.oxCarryCapacity;
					if (typeof this._oxCarryCapacity === "undefined") {
						this.heap.oxCarryCapacity = this.calcCarryCapacity(this.getBodyOx());
						this._oxCarryCapacity = this.heap.oxCarryCapacity;
					}
				}
				else if (Memory.reservedRooms[this.name] && Game.rooms[Memory.reservedRooms[this.name]] && Game.rooms[Memory.reservedRooms[this.name]].my) {
					this._oxCarryCapacity = Game.rooms[Memory.reservedRooms[this.name]].oxCarryCapacity;
				}
				else {
					this._oxCarryCapacity = 0;
				}
            }
            return this._oxCarryCapacity;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'rogueCarryCapacity', {
        get() {
			if (typeof this._rogueCarryCapacity === "undefined") {
				if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.rogueCarryCapacity;

				this._rogueCarryCapacity = this.heap.rogueCarryCapacity;
				if (typeof this._rogueCarryCapacity === "undefined") {
					this._rogueCarryCapacity = this.calcCarryCapacity(this.getBodyRogue());
					this._rogueCarryCapacity = this.heap.rogueCarryCapacity;
				}
            }
            return this._rogueCarryCapacity;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'rogueBodyCost', {
        get() {
			if (typeof this._rogueBodyCost === "undefined") {
				if (!this.atSpawningEnergyCapacityForCurrentLevel) delete this.heap.rogueBodyCost;

				this._rogueBodyCost = this.heap.rogueBodyCost;
				if (typeof this._rogueBodyCost === "undefined") {
					this._rogueBodyCost = utils.getBodyCost(this.getBodyRogue());
					this._rogueBodyCost = this.heap.rogueBodyCost;
				}
            }
            return this._rogueBodyCost;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'rogueMarketValue', {
        get() {
			if (typeof this._rogueMarketValue === "undefined") {
				this._rogueMarketValue = GameManager.getMarketValue(RESOURCE_ENERGY) * this.rogueBodyCost;
            }
            return this._rogueMarketValue;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'creepMarketValue', {
        get() {
			if (typeof this._creepMarketValue === "undefined") {
				this._creepMarketValue = _.sum(this.myCreeps, s => s.marketValue);
            }
            return this._creepMarketValue;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'carpenterWorkParts', {
		get() {
			if (typeof this._carpenterWorkParts === "undefined") {
				this._carpenterWorkParts = this.heap.carpenterWorkParts;

				if (typeof this._carpenterWorkParts === "undefined") {
					this.heap.carpenterWorkParts = this.getWorkParts(this.getBodyCarpenter());
					this._carpenterWorkParts = this.heap.carpenterWorkParts;
				}
			}
			return this._carpenterWorkParts;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'carpenterBuildPower', {
        get() {
			if (typeof this._carpenterBuildPower === "undefined") {
				// Estimate we spend half our time traveling for energy.
				this._carpenterBuildPower = this.carpenterWorkParts * BUILD_POWER * CREEP_LIFE_TIME * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT;
            }
            return this._carpenterBuildPower;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'carpenterRepairPower', {
        get() {
			if (typeof this._carpenterRepairPower === "undefined") {
				// Estimate we spend half our time traveling for energy.
				this._carpenterRepairPower = this.carpenterWorkParts * REPAIR_POWER * CREEP_LIFE_TIME * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT;
            }
            return this._carpenterRepairPower;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'masonWorkParts', {
		get() {
			if (typeof this._masonWorkParts === "undefined") {
				this._masonWorkParts = this.heap.masonWorkParts;

				if (typeof this._masonWorkParts === "undefined") {
					this.heap.masonWorkParts = this.getWorkParts(this.getBodyMason());
					this._masonWorkParts = this.heap.masonWorkParts;
				}
			}
			return this._masonWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'collierWorkParts', {
		get() {
			if (typeof this._collierWorkParts === "undefined") {
				this._collierWorkParts = this.isBulwark ? this.heap.collierWorkParts : undefined;

				if (typeof this._collierWorkParts === "undefined") {
					this.heap.collierWorkParts = this.getWorkParts(this.getBodyCollier());
					this._collierWorkParts = this.heap.collierWorkParts;
				}
			}
			return this._collierWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sapperWorkParts', {
		get() {
			if (typeof this._sapperWorkParts === "undefined") {
				this._sapperWorkParts = this.heap.sapperWorkParts;

				if (typeof this._sapperWorkParts === "undefined") {
					this.heap.sapperWorkParts = this.getWorkParts(this.getBodySapper());
					this._sapperWorkParts = this.heap.sapperWorkParts;
				}
			}
			return this._sapperWorkParts;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'masonBuildPower', {
        get() {
			if (typeof this._masonBuildPower === "undefined") {
				// Estimate we spend half our time traveling for energy.
				this._masonBuildPower = this.masonWorkParts * BUILD_POWER * CREEP_LIFE_TIME * C.MAX_BOOST_BUILD * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT;
            }
            return this._masonBuildPower;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'masonRepairPower', {
        get() {
			if (typeof this._masonRepairPower === "undefined") {
				// Estimate we spend half our time traveling for energy.
				this._masonRepairPower = this.masonWorkParts * REPAIR_POWER * CREEP_LIFE_TIME * C.MAX_BOOST_REPAIR * Config.params.BUILDER_WORK_EFFICIENCY_PERCENT;
            }
            return this._masonRepairPower;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'collierDismantlePower', {
        get() {
			if (typeof this._collierDismantlePower === "undefined") {
				this._collierDismantlePower = this.collierWorkParts * DISMANTLE_POWER * CREEP_LIFE_TIME;
            }
            return this._collierDismantlePower;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'sapperDismantlePower', {
        get() {
			if (typeof this._sapperDismantlePower === "undefined") {
				this._sapperDismantlePower = this.sapperWorkParts * DISMANTLE_POWER * CREEP_LIFE_TIME * C.MAX_BOOST_DISMANTLE;
            }
            return this._sapperDismantlePower;
        },
        configurable: true, enumerable: true,
	});

	/**
	 * Note this can't be cached in hash as creeps will change size by level.
	 */
	Object.defineProperty(Room.prototype, 'crierWorkParts', {
		get() {
			if (typeof this._crierWorkParts === "undefined") {
				this._crierWorkParts = this.getWorkParts(this.getBodyCrier());
			}
			return this._crierWorkParts;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Note this can't be cached in hash as creeps will change size by level.
	 */
	Object.defineProperty(Room.prototype, 'prophetWorkParts', {
		get() {
			if (typeof this._prophetWorkParts === "undefined") {
				this._prophetWorkParts = this.getWorkParts(this.getBodyProphet());
			}
			return this._prophetWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'heraldWorkParts', {
		get() {
			if (typeof this._heraldWorkParts === "undefined") {
				this._heraldWorkParts = this.heap.heraldWorkParts;

				if (typeof this._heraldWorkParts === "undefined") {
					this.heap.heraldWorkParts = this.getWorkParts(this.getBodyHerald());
					this._heraldWorkParts = this.heap.heraldWorkParts;
				}
			}
			return this._heraldWorkParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'heraldCarryParts', {
		get() {
			if (typeof this._heraldCarryParts === "undefined") {
				this._heraldCarryParts = this.heap.heraldCarryParts;

				if (typeof this._heraldCarryParts === "undefined") {
					this.heap.heraldCarryParts = this.getCarryParts(this.getBodyHerald());
					this._heraldCarryParts = this.heap.heraldCarryParts;
				}
			}
			return this._heraldCarryParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'heraldMoveParts', {
		get() {
			if (typeof this._heraldMoveParts === "undefined") {
				this._heraldMoveParts = this.heap.heraldMoveParts;

				if (typeof this._heraldMoveParts === "undefined") {
					this.heap.heraldMoveParts = this.getMoveParts(this.getBodyHerald());
					this._heraldMoveParts = this.heap.heraldMoveParts;
				}
			}
			return this._heraldMoveParts;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'heraldUpgradeControllerPower', {
        get() {
			if (typeof this._heraldUpgradeControllerPower === "undefined") {
				// Do no include travel time, as we will be doing little travelling.
				this._heraldUpgradeControllerPower = this.heraldWorkParts * UPGRADE_CONTROLLER_POWER * CREEP_LIFE_TIME * C.MAX_BOOST_UPGRADECONTROLLER;
            }
            return this._heraldUpgradeControllerPower;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'oracleWorkParts', {
		get() {
			if (typeof this._oracleWorkParts === "undefined") {
				this._oracleWorkParts = this.heap.oracleWorkParts;

				if (typeof this._oracleWorkParts === "undefined") {
					this.heap.oracleWorkParts = this.getWorkParts(this.getBodyOracle());
					this._oracleWorkParts = this.heap.oracleWorkParts;
				}
			}
			return this._oracleWorkParts;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'oracleUpgradeControllerPower', {
        get() {
			if (typeof this._oracleUpgradeControllerPower === "undefined") {
				// Do no include travel time, as we will be doing little travelling.
				this._oracleUpgradeControllerPower = this.oracleWorkParts * UPGRADE_CONTROLLER_POWER * CREEP_LIFE_TIME * C.MAX_BOOST_UPGRADECONTROLLER;
            }
            return this._oracleUpgradeControllerPower;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'roomColor', {
        get() {
			if (typeof this._roomColor === "undefined") {
				let energyColor = 'white';

				if (RoomIntel.getHostilesTTL(this.name)) {
					energyColor = 'red';

				} else if (this.energyCapacityAvailable == 0) {
					energyColor = 'white';

				} else if (this.isStorageEnergyDump) {
					energyColor = 'DarkTurquoise';

				} else if (this.isStorageEnergyAbundant) {
					energyColor = 'LightSkyBlue';

				} else if (this.isStorageEnergyNormal) {
					energyColor = 'LightGreen';

				} else if (this.isStorageEnergyMinimal) {
					energyColor = 'LightYellow';

				} else {
					energyColor = 'LightPink';
				}

				this._roomColor = energyColor;
            }
            return this._roomColor;
        },
        configurable: true, enumerable: true,
	});

    /**
     * Inialize room memory variables.
     */
	Room.prototype.initialize = function() {
		delete this.memory.tickCheckResults;
		if (typeof this.memory.tickCheck === "undefined") this.memory.tickCheck = {}
	}

    /**
     * This method will return true if its "time" to perform an action.
     */
	Room.prototype.slidingTickCheck = function(name, roomMod, roomIndex, defaultMod = 1, runOnCpuMaxed = false) {
        // Lookup the current mod for the specified object. Default to 1 if not found.
		if (typeof this.memory.tickCheck[name] === "undefined") {
            this.memory.tickCheck[name] = {
				mod: defaultMod
				, runtime: Game.time
			};
		}

		// With non maxed cpu, we need to do our normal time check.
		if (!GameManager.isCpuMaxed) {
			// Need to wait until we get to our next allowed run time.
			if (Game.time < (this.memory.tickCheck[name].runtime || Game.time)) return false;
		}
		else if (runOnCpuMaxed) {
			// Does this function allow to be run on every tick when we have full CPU?
			return true;
		}

        return ((Game.time % roomMod) === roomIndex);
    }

    /**
     * Update the memory for the given object.
     * On success, meaning the task was performed and action was taken, we will reset tickmod to default of 1.
     * On failure, we will increment the tick mod so that next time it will skip an extra turn.
     */
	Room.prototype.updateSlidingTickCheck = function(name, roomMod, success, max = 1) {
        if (!this.memory.tickCheck) this.memory.tickCheck = {}

		let tickMod = 1;
        if (!this.memory.tickCheck[name] || success) {
            this.memory.tickCheck[name] = {
				mod: tickMod
				, runtime: Game.time
			};
        } else {
			tickMod = Math.min((this.memory.tickCheck[name].mod || 1) + 1, max);

            this.memory.tickCheck[name] = {
				mod: Math.min((this.memory.tickCheck[name].mod || 1) + 1, max)
				, runtime: Game.time + (roomMod * tickMod)
			}
        }

		if (!this.memory.tickCheckResults) this.memory.tickCheckResults = [];
		this.memory.tickCheckResults.push(name + tickMod.toString());

		return success;
    }

	/**
	 * A room with focus will ..
	 * 1. have labs that concentrate on mason/prophet boosts
	 * 2. have donkeys/mules/heralds sent to it
	 * 3. wont send out energy to other rooms
	 * 4. will have tier3 focus mats sent to it by other rooms
	 * 5. will buy tier3 mats off the market
	 * 6. will spawn masons
	 * 7. kill will be more active (to handle terminal work)
	 * 8. will spawn creeps at lower cpu levels than normal rooms
	 * 9. will get more peons via charity
	 */
	Object.defineProperty(Room.prototype, 'hasFocus', {
		get() {
			if (typeof this._hasFocus === "undefined") {
                this._hasFocus =
                    this.my
                    && !GameManager.haltStop
					&& !FlagManager.haltfocusFlag
					&& !this.unclaimFlag
					&& this.claimFlag
					&& !this.isTemple
                    && (
						// Room is not yet at the maximum level.
						!this.atMaxLevel

						// If we are missing either storage or terminal, even at level 8.
						|| !this.myStorage
						|| !this.myTerminal

						// We don't have our primary spawn, or are below our spawn count; something is (majorly) wrong.
						|| (GameManager.getSpawnsByRoomName(this.name).length < (this.isTemple ? 1 : CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][this.controller.level]))
                    )
            }
			return this._hasFocus;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noAssault', {
		get() {
			if (typeof this._noAssault === "undefined") {
                this._noAssault = !!(
					FlagManager.throttleFlag
					|| FlagManager.noassaultFlag
				);
            }
			return this._noAssault;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noStronghold', {
		get() {
			if (typeof this._noStronghold === "undefined") {
                this._noStronghold = !!(
					FlagManager.throttleFlag
					|| FlagManager.nostrongholdFlag
					|| FlagManager.nostrongholdFlags[this.name]
				);
            }
			return this._noStronghold;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noPowerbank', {
		get() {
			if (typeof this._noPowerbank === "undefined") {
                this._noPowerbank = !!(
					FlagManager.throttleFlag
					|| FlagManager.nopowerbankFlag
					|| FlagManager.nopowerbankFlags[this.name]
				);
            }
			return this._noPowerbank;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noDeposit', {
		get() {
			if (typeof this._noDeposit === "undefined") {
                this._noDeposit = !!(
					FlagManager.throttleFlag
					|| FlagManager.nodepositFlag
					|| FlagManager.nodepositFlags[this.name]
				);
            }
			return this._noDeposit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noMineral', {
		get() {
			if (typeof this._noMineral === "undefined") {
                this._noMineral = !!(
					FlagManager.throttleFlag
					|| FlagManager.nomineralFlag
					|| FlagManager.nomineralFlags[this.name]
				);
            }
			return this._noMineral;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noReserve', {
		get() {
			if (typeof this._noReserve === "undefined") {
                this._noReserve = !!(
					FlagManager.throttleFlag
					|| FlagManager.noreserveFlag
					|| FlagManager.noreserveFlags[this.name]
				);
            }
			return this._noReserve;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noTemple', {
		get() {
			if (typeof this._noTemple === "undefined") {
                this._noTemple = !!(
					FlagManager.throttleFlag
					|| FlagManager.notempleFlag
				);
            }
			return this._noTemple;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'noBuilder', {
		get() {
			if (typeof this._noBuilder === "undefined") {
                this._noBuilder = !!(
					FlagManager.nobuilderFlag
					|| FlagManager.nobuilderFlags[this.name]
				);
            }
			return this._noBuilder;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isFOB', {
		get() {
			if (typeof this._isFOB === "undefined") {
				// Test our peasant count against sources that have containers or links (so they aren't just harvesting and dropping)
				// and that peasants can actually be made at this room level.
				this._isFOB =
					!this.myStorage
					|| (
						(this.level <= 4)
						&& this.myConstructionSites.length
					)
			}
			return this._isFOB;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isOutpost', {
		get() {
			if (typeof this._isOutpost === "undefined") {
				this._isOutpost =
					this.myStorage
					&& this.atSpawningEnergyCapacityForCurrentLevel
			}
			return this._isOutpost;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Max level room that is fully built. Excludes temples.
	 */
	Object.defineProperty(Room.prototype, 'isCastle', {
		get() {
			if (typeof this._isCastle === "undefined") {
                this._isCastle =
					this.my
					&& this.atMaxLevel
					&& this.myStorage
					&& this.myTerminal
					&& this.atSpawningEnergyCapacityForCurrentLevel
					&& !this.isTemple
            }
			return this._isCastle;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Max level room that is fully built. Includes temples.
	 */
	Object.defineProperty(Room.prototype, 'isBulwark', {
		get() {
			if (typeof this._isBulwark === "undefined") {
                this._isBulwark =
					this.my
					&& this.atMaxLevel
					&& this.atSpawningEnergyCapacityForCurrentLevel
					&& !this.isTemple
            }
			return this._isBulwark;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Level 7 room that is fully built. Excludes temples.
	 */
	Object.defineProperty(Room.prototype, 'isFort', {
		get() {
			if (typeof this._isFort === "undefined") {
                this._isFort =
					this.my
					&& (this.controller.level >= 7)
					&& this.atSpawningEnergyCapacityForCurrentLevel
					&& !this.isTemple
            }
			return this._isFort;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Any level room that is fully built.
	 */
	Object.defineProperty(Room.prototype, 'isFortified', {
		get() {
			if (typeof this._isFortified === "undefined") {
                this._isFortified =
					this.my
					&& this.atSpawningEnergyCapacityForCurrentLevel
					//&& !this.roomMissingStructure
					&& !this.myConstructionSites.length
					&& !this.isTemple
            }
			return this._isFortified;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * A room that is capable of spawning preachers.
	 */
	Object.defineProperty(Room.prototype, 'isChurch', {
		get() {
			if (typeof this._isChurch === "undefined") {
                this._isChurch =
					this.my
					//&& this.atSpawningEnergyCapacityForCurrentLevel
					//&& (this.level >= 2)
					&& (this.energyCapacityAvailable >= C.SPAWNING_ENERGY_CAPACITY[Config.params.CHURCH_LEVEL])
					&& (this.myStorage || this.colonyContainer)
					//&& !this.isTemple
            }
			return this._isChurch;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isOnlyClosestMaxRoomToLowerRoom', {
		get() {
			if (typeof this._isOnlyClosestMaxRoomToLowerRoom === "undefined") {
				this._isOnlyClosestMaxRoomToLowerRoom = !!GameManager.empireSpawnRoomsActive.find(f => !f.atMaxLevel && GameManager.isOnlyClosestCastleRoomTo(this.name, f.name));
            }
			return this._isOnlyClosestMaxRoomToLowerRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isClosestMaxRoomToLowerRoom', {
		get() {
			if (typeof this._isClosestMaxRoomToLowerRoom === "undefined") {
				this._isClosestMaxRoomToLowerRoom = !!GameManager.empireFocusRooms.find(f => !f.atMaxLevel && GameManager.isClosestCastleRoomTo(this.name, f.name));
            }
			return this._isClosestMaxRoomToLowerRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'isInRouteDistanceToFocusRoomToAssist', {
		get() {
			if (typeof this._isInRouteDistanceToFocusRoomToAssist === "undefined") {
				this._isInRouteDistanceToFocusRoomToAssist = GameManager.empireFocusRooms.find(f => Cartographer.isInRouteDistance(this.name, f.name, Config.params.FOCUS_ASSIST_DISTANCE) && f.hasEmpireCastleAssistance);
            }
			return this._isInRouteDistanceToFocusRoomToAssist;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'okToSpawnAuxiliaryCreep', {
		get() {
			if (typeof this._okToSpawnAuxiliaryCreep === "undefined") {
				this._okToSpawnAuxiliaryCreep = !!(
					// Got to have minimal energy always.
					this.isStorageEnergyMinimal

					// Our CPU must be maxed or no other room is spawning and this room hasn't halted spawning.
					// This throttles back our spawn rate.
					&& !this.haltSpawning

					// We want to reserve at least one spawn for creeps wanting to renew so they don't die.
					&& !this.colonyAllSpawnsSpawningOrRenewing

					// Is this room next to a non-castle room that we need to be supporting?
					// Note: too expensive to be doing
					//&& !this.isMaxActiveRoomClosestToNonMaxNonTerminalColony
				);
            }
			return this._okToSpawnAuxiliaryCreep;
		},
		configurable: true, enumerable: true,
    });

	Room.prototype.getTrailPath = function(sourcePos, destinationPos, options) {
		let defaults = {
			avoidExitArea: true
		};
		options = _.defaults({}, _.clone(options), defaults);
		return Traveler.findTravelPath(null, sourcePos, destinationPos, options).path;
	}

    Room.prototype.createTrail = function(sourcePos, destinationPos, includeDestination, options) {
		// Get the path from source to destination using Traveler.
		let path = this.getTrailPath(sourcePos, destinationPos, options);
		let result = ERR_INVALID_TARGET;

        // Will rely on building one road at a time instead, so that pathfinding will pickup existing road optimizations on 2nd/3rd runs.
        path.forEach((step, index) => {
			// Must have visibility into the room to attempt to create a construction site.
			// Include basic check for rooms we are avoiding.
			if (
				Game.rooms[step.roomName]
				&& !Game.rooms[step.roomName].otherManagement
				&& Memory.rooms[step.roomName]
				&& (!RoomIntel.getAvoid(step.roomName) || FlagManager.reserveFlags[step.roomName])
				&& (includeDestination || (index < path.length - 1))
			) {
				let pos = new RoomPosition(step.x, step.y, step.roomName);
				if (
					(
						// Can build in my room as long as it is not on the perimeter walls.
						!Game.rooms[pos.roomName].my
						|| !pos.isRange2Edge
					)

					// Do we not have a road here at all, then create one.
					&& (typeof Game.rooms[step.roomName].doesPosNeedRoadRepair(pos) === "undefined")
				) {
					let stepResult = Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
					// At least one step registered successfully, so we should build this trail.
					if (stepResult === OK) result = OK;
				}
			}
        });

		// Return our results and the full path.
		return {
			result: result
			, path: path
		};
    }

	Room.prototype.createReservedRoomSourceTrails = function(options) {
		// Shorthand.
		let room = this;

        // Don't mess with the original options object.
		let defaults = {
            force: false
			, debug: false
        };
		options = _.defaults({}, _.clone(options), defaults);

		// Bail out on very low level rooms.
		if (room.isFOB) return false;

		// For each of our reserved rooms, if it has visibility, then create source trails.
		let reservedRooms = room.reservedRoomNames;
		reservedRooms.forEach(room => {
			if (Game.rooms[room]) {
				Game.rooms[room].createSourceTrails(options);
			}
		})

		return true;
	}

	Object.defineProperty(Room.prototype, 'sourceTrailCooldown', {
		get() {
			if (this.heap.sourceTrailCooldown !== undefined) {
				return (this.heap.sourceTrailCooldown - Game.time > 0) ? this.heap.sourceTrailCooldown - Game.time: null;
            }
			return null;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Will set the cooldown only if there is no current cooldown.
	 */
	Room.prototype.setSourceTrailCooldown = function() {
		if (!this.sourceTrailCooldown) this.heap.sourceTrailCooldown = Game.time + Config.params.SOURCE_TRAIL_COOLDOWN;
	}

    Room.prototype.createSourceTrails = function(options = {}) {
        // Shorthand.
        let room = this;

        // Don't mess with the original options object.
		let defaults = {
            force: false
			, debug: !!FlagManager.debugtrails
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Exit criteria.

		// Do our cooldown test to see if we have built a source trail recently.
		if (!options.force && room.sourceTrailCooldown) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: room.sourceTrailCooldown');
			return ERR_FULL;
		}
		if (room.my) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: room.my');
			return ERR_INVALID_ARGS;
		}
        if (room.otherManagement) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: room.otherManagement');
			return ERR_NOT_OWNER;
		}
		if (!Memory.reservedRooms[room.name]) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: !Memory.reservedRooms[room.name]');
			return ERR_NOT_OWNER;
		}
		if (Game.rooms[Memory.reservedRooms[room.name]].isFOB) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: Game.rooms[Memory.reservedRooms[room.name]].isFOB');
			return ERR_INVALID_ARGS;
		}
		if (!Game.rooms[Memory.reservedRooms[room.name]].shouldCreateSourceTrails) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: !Game.rooms[Memory.reservedRooms[room.name]].shouldCreateSourceTrails');
			return ERR_INVALID_ARGS;
		}
		if (!options.force && Game.rooms[Memory.reservedRooms[room.name]].myConstructionSites.length > 10) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: Game.rooms[Memory.reservedRooms[room.name]].myConstructionSites.length');
			return ERR_INVALID_ARGS;
		}
		if (!Game.rooms[Memory.reservedRooms[room.name]].storage) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: !Game.rooms[Memory.reservedRooms[room.name]].storage');
			return ERR_INVALID_ARGS;
		}

		// No point in building any trails if we are at our maximum amount of sites.
		if (Object.keys(Game.constructionSites).length >= MAX_CONSTRUCTION_SITES) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: Object.keys(Game.constructionSites).length >= MAX_CONSTRUCTION_SITES');
			return ERR_FULL;
		}

		let destination = Game.rooms[Memory.reservedRooms[room.name]].colonyFlag;
        if (!destination) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: !Game.rooms[Memory.reservedRooms[room.name]].colonyFlag');
			return ERR_NOT_OWNER;
		}
		if (!Cartographer.areAllRouteRoomsVisible(room.name, destination.pos.roomName)) {
			if (options.debug) room.logRoom('createSourceTrails bailing out: !Cartographer.areAllRouteRoomsVisible(room.name, destination.pos.roomName)');
			return ERR_INVALID_ARGS;
		}

		// Find the spawn rooms destination positions.
		let storage = Game.rooms[Memory.reservedRooms[room.name]].storage;
		let colonyRenewPos = Game.rooms[Memory.reservedRooms[room.name]].colonyRenewPos;
		//let terminal = Game.rooms[Memory.reservedRooms[room.name]].terminal;

		// Set our cooldown so we don't run this too often.
		room.setSourceTrailCooldown();

		// We are in our work room, full and next to a source.
		let sources = room.sources;
		let result = ERR_INVALID_TARGET;

		// For center rooms, we will create a cut from the two sources on opposite ends first.
		// Once that is complete, will will create a cut from the 3rd source to the mineral.
		// Then we make a trail from the closest of all resources to our storage.
		if (room.isSKRoom) {
			if (options.debug) room.logRoom('createSourceTrails processing SK room: ' + room.print);

			let trailOptions = { maxRooms: 1 };
			let topLeft = (new RoomPosition(0, 0, room.name)).findClosestByRange(room.resources);
			let topRight = (new RoomPosition(49, 0, room.name)).findClosestByRange(room.resources);
			let bottomRight = (new RoomPosition(49, 49, room.name)).findClosestByRange(room.resources);
			let bottomLeft = (new RoomPosition(0, 49, room.name)).findClosestByRange(room.resources);

			let mineral = room.mineral;
			let source1 = null;
			let source2 = null;
			let source3 = null;

			if (topLeft instanceof Mineral) {
				source1 = topRight;
				source2 = bottomLeft;
				source3 = bottomRight;
			} else if (topRight instanceof Mineral) {
				source1 = topLeft;
				source2 = bottomRight;
				source3 = bottomLeft;
			} else if (bottomRight instanceof Mineral) {
				source1 = topRight;
				source2 = bottomLeft;
				source3 = topLeft;
			} else if (bottomLeft instanceof Mineral) {
				source1 = topLeft;
				source2 = bottomRight;
				source3 = topRight;
			}

			// Create the first cut.
			let ret = room.createTrail(source1.harvestPos, source2.harvestPos, true, trailOptions);
			result = ret.result;

			// Check for error condition.
			if (result > 0) {
				// If this trail was needing at least one road pos built, then bail out of the loop, as we only want to do one trail at a time.
				room.logRoom('bailing out of source trail after creating trail between source1 and source2: ' + source1.harvestPos.name + '-' + source2.harvestPos.name + ' ' + result);
				return result;
			}
			else {
				// Anything other than INVALID TARGET should bail out, something went wrong.
				// But INVALID TARGET means all roads in to this source are built, and we can move onto the next source.
				if (result !== ERR_INVALID_TARGET) {
					room.logRoom('bailing out of source trail with error: ' + source1.harvestPos.name + '-' + source2.harvestPos.name + ' ' + result);
					return result;
				}
			}

			// Create the second cut.
			ret = room.createTrail(source3.harvestPos, mineral.pos, false, trailOptions);
			result = ret.result;

			// Check for error condition.
			if (result > 0) {
				// If this trail was needing at least one road pos built, then bail out of the loop, as we only want to do one trail at a time.
				room.logRoom('bailing out of source trail after creating trail between source3 and mineral: ' + source3.harvestPos.name + '-' + mineral.pos.name + ' ' + result);
				return result;
			}
			else {
				// Anything other than INVALID TARGET should bail out, something went wrong.
				// But INVALID TARGET means all roads in to this source are built, and we can move onto the next source.
				if (result !== ERR_INVALID_TARGET) {
					room.logRoom('bailing out of source trail with error: ' + source3.harvestPos.name + '-' + mineral.pos.name + ' ' + result);
					return result;
				}

				// Build a trail around the mineral for easy movement. Only needed when swampy as dredgers and jackass have speed 1.
				if (mineral.mineralAmount && (mineral.nips.length > 1)) {
					mineral.pos.ringPosOfRangeDNotBlockedByObject(2).forEach(road => {
						if (mineral.nips.find(f => f.isNearTo(road)) && road.isTerrainSwamp) {
							let stepResult = room.createConstructionSite(road.x, road.y, STRUCTURE_ROAD);
							// At least one step registered successfully, so we should build this trail.
							if (stepResult === OK) result = OK;
						}
					})
				}

				// Anything other than INVALID TARGET should bail out, something went wrong.
				// But INVALID TARGET means all roads in to this source are built, and we can move onto the next source.
				if (result !== ERR_INVALID_TARGET) {
					room.logRoom('bailing out of mineral circle with error: ' + mineral.pos.name + ' ' + result);
					return result;
				}
			}

		}
		// For normal controller rooms, if there are two sources, create trail between them.
		else if (room.controller && (room.sources == 2)) {
			if (options.debug) room.logRoom('createSourceTrails processing control room with 2 sources: ' + room.print);

			let trailOptions = { maxRooms: 1 };
			let source1 = room.sources[0];
			let source2 = room.sources[1];

			// Create the first cut.
			let ret = room.createTrail(source1.harvestPos, source2.harvestPos, true, trailOptions);
			result = ret.result;

			// Check for error condition.
			if (result > 0) {
				// If this trail was needing at least one road pos built, then bail out of the loop, as we only want to do one trail at a time.
				room.logRoom('bailing out of source trail after creating trail between source1 and source2: ' + source1.harvestPos.name + '-' + source2.harvestPos.name + ' ' + result);
				return result;
			}
			else {
				// Anything other than INVALID TARGET should bail out, something went wrong.
				// But INVALID TARGET means all roads in to this source are built, and we can move onto the next source.
				if (result !== ERR_INVALID_TARGET) {
					room.logRoom('bailing out of source trail with error: ' + source1.harvestPos.name + '-' + source2.harvestPos.name + ' ' + result);
					return result;
				}
			}
		}

		// Sort by distance and build trails, hopefully further away trails will be able to use the closer trail system.
		sources = _.sortBy(sources, s => room.getTrailPath(s.harvestPos, storage.pos).length);

		if (options.debug) room.logRoom('createSourceTrails processing trail from each source to storage: ' + sources.length);

		// Assuming all roads are now built, now create the cache paths.
		sources.every(source => {
			// Create the trail home.
			let trailOptions = {
				cachePath: true
				, includeOriginStep: false
			}
			if (options.debug) room.logRoom('createSourceTrails processing source ' + source.id + ': ' + JSON.stringify(result));
			let ret = room.createTrail(source.harvestPos, storage.pos, true, trailOptions);
			result = ret.result;

			// Save the first position as the sourceContainerRoadPos. This will be used for caching.
			if (ret.path && ret.path.length) {
				if (options.debug) room.logRoom('createSourceTrails setting source.sourceContainerRoadPos = ' + ret.path[0]);
				source.sourceContainerRoadPos = ret.path[0];
				source.sourcePathLength = ret.path.length;
			} else {
				if (options.debug) room.logRoom('createSourceTrails no path returned: ' + JSON.stringify(ret));
			}

			// Check for error condition.
			if (result > 0) {
				// If this trail was needing at least one road pos built, then bail out of the loop, as we only want to do one trail at a time.
				room.logRoom('bailing out of source trail after creating trail: ' + source.pos.name + ' ' + result);
				return false;
			}
			else {
				// Anything other than INVALID TARGET should bail out, something went wrong.
				// But INVALID TARGET means all roads in to this source are built, and we can move onto the next source.
				if (result !== ERR_INVALID_TARGET) {
					room.logRoom('bailing out of source trail with error: ' + source.pos.name + ' ' + result);
					return false;
				}
			}

			// Now do the reverse trail, and store the paths the colonyFlag to the source trail road posisition.
			// Assume that creeps have plenty of move and would not be restricted by swamps at all. Offroad mode!
			// This is a very common and likely path for oxen to take, as they will always try to renew then move to work room.
			if (source.sourceContainerRoadPos && colonyRenewPos) {
				trailOptions = {
					cachePath: true
					, includeOriginStep: true
					, range: 0
					, offRoad: true
				}
				let path = room.getTrailPath(colonyRenewPos, source.sourceContainerRoadPos, trailOptions);
				if (options.debug) room.logRoom('createSourceTrails cached reverse trail path from storage to source container road ' + source.id + ': ' + path.length);
			}

			return true;
		})

		// Result is how long the trail being built is, or an error code indicating no trail was built including if it was already built.
        return result;
    }

    Room.prototype.getDestroyPositions = function(sourcePos, destinationPos) {
		// Get the path from source to destination using Traveler.
		let result = [];

		// We want to use the weighted barriers traveler setting, and also not to leave this room for pathing.
		let options = {}
		options.weightedBarriers = true;
		options.maxRooms = 1;

		// If there are no barriers, then we can bail out early.
		if (!this.barriers.length) return result;
		if (!sourcePos) return result;
		if (!destinationPos) return result;

		// Get the path from source to destination.
		let path = Traveler.findTravelPath(null, sourcePos, destinationPos, options).path;

		// Add on the destination if it isn't a terrain wall.
		if (!destinationPos.isTerrianWall) { path.push(destinationPos) }

        path.forEach(step => {
			// Must have visibility into the room to attempt to create a construction site.
			// Include basic check for rooms we are avoiding.
			if (
				Game.rooms[step.roomName]
				&& !Game.rooms[step.roomName].my
			) {
				let pos = new RoomPosition(step.x, step.y, step.roomName);
				if (pos.hasBarrier) result.push(pos);
			}
        });

		return result;
    }

    Room.prototype.cleanDestroyFlags = function() {
		// Remove any destroy flags that we don't need anymore.
		// Cleanup/remove all destroy flags that don't have a structure under them anymore.
		let count = 0;
		this.destroyFlags.forEach(flag => {
			if (!flag.flag.pos.lookForStructure()) {
				count++;
				flag.flag.remove();
			}
		})
		return count;
	}

    Room.prototype.updateDestroyFlags = function(options) {
        // Don't mess with the original options object.
		let defaults = {
			force: false
			, debug: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Shorthand.
        let room = this;

		// Create a trail from each edge to the controller.
		let barriers = [];

		let updateBarriers = function(entry, t) {
			let b = [];
			t.forEach(target => {
				// For each target, find a path from the first position in this exit group.
				// It may not add any barriers if there aren't any.
				b = b.concat(room.getDestroyPositions(entry, target));
			});
			return b;
		}

		// If we are forcing an update, just skip all this.
		if (!options.force) {
			// Determine if we need to refresh the destroy flags in this room.
			// Its expensive so don't do it every tick or if we are lacking CPU.
			if (!GameManager.isCpuMaxed && !room.my) {
				if (options.debug) room.logRoom('updateDestroyFlags not max cpu and not my room; bailing out');
				return this.cleanDestroyFlags();
			}

			if (room.my && (room.controller.level === 1) && !room.claimFlag) {
				// We want to force scanning for destroy flags as this room
				// was claimed for the purpose of destroying everything.
			}
			else if (((room.updateDestroyFlagsTick || 0) + Config.params.UPDATE_DESTROY_FLAG_TICKS) > Game.time) {
				if (options.debug) room.logRoom('updateDestroyFlags destroy flag ticks not yet met; bailing out');
				return this.cleanDestroyFlags();
			}
		}

		// Make flags if we are in a non-owned controller room with barriers.
		if (
			room.controller
			&& !room.my
			&& !room.hasMyNonControllerStructures
			&& room.barriers.length
		) {
			// Drop primary on the primary path barrier into the room.
			let myClosestRoomName = GameManager.getClosestCastleRoomTo(room.name);
			let entry = Cartographer.findExitPos(room.name, myClosestRoomName);
			let type = ''

			// Do the controller itself. It is the most important, for claiming/attacking rooms.
			if (!barriers.length) {
				let targets = [];
				type = C.DESTROY_FLAG_CONTROLLER;
				targets.push(room.controller.pos);
				barriers = updateBarriers(entry, targets);
			}

			// Doing each nip as there may be paths unreachable due to terrain.
			if (!barriers.length) {
				let targets = [];
				type = C.DESTROY_FLAG_CONTROLLER_NIP;
				room.controller.nips.forEach(nip => {
					targets.push(nip);
				});
				barriers = updateBarriers(entry, targets);
			}


			// Include all the target positions we wish to get to.
			// To save CPU, we will start with spawns and then add controller.
			if (!barriers.length) {
				let targets = [];
				type = C.DESTROY_FLAG_SPAWN;
				if (room.ownedByOther && RoomIntel.getHostileSpawnCount(room.name)) {
					room.hostileSpawns.forEach(spawn => {
						targets.push(spawn.pos);
					});
				}
				barriers = updateBarriers(entry, targets);
			}

			// Doing each nip to each source as there may be paths unreachable due to terrain.
			// Only do this if we have no other targets, as (normally) all structures will be cleared by preachers.
			if (!barriers.length) {
				let targets = [];
				type = C.DESTROY_FLAG_SOURCE;
				room.sources.forEach(source => {
					targets.push(source.pos);
				});
				barriers = updateBarriers(entry, targets);
			}

			// targets.forEach(target => {
			// 	// For each target, find a path from the first position in this exit group.
			// 	// It may not add any barriers if there aren't any.
			// 	barriers = barriers.concat(room.getDestroyPositions(entry, target));
			// });

			// Now create a destroy flag on each barrier.
			barriers.forEach(barrier => {
				room.createFlag(barrier.x, barrier.y, 'destroy ' + barrier.name + ' ' + type, COLOR_RED);
			})
		}

		// Remove any destroy flags that we don't need anymore.
		// Cleanup/remove all destroy flags that don't have a structure under them anymore.
		room.destroyFlags.forEach(flag => {
			if (!barriers.find(f => f.isEqualTo(flag.flag.pos))) flag.flag.remove();
		})

		// Update our RoomIntel destroy flag with what we found on this tick.
		// The flags don't exist yet so we can't query them directly and we may lose visibility on next tick.
		let hits = _.sum(barriers, s => s.hasBarrier);
		RoomIntel.setDestroyFlagHits(room.name, hits);
		if (options.debug) room.logRoom('updateDestroyFlags barriers: ' + barriers.length + ', hits: ' + hits);

		// Update our timer.
		room.updateDestroyFlagsTick = Game.time;
		GameManager.addProcess('updateDestroyFlags');

        return barriers.length;
    }

	Object.defineProperty(Room.prototype, 'roomsInObserverRange', {
		get() {
			if (typeof this._roomsInObserverRange === "undefined") {
				this._roomsInObserverRange = this.heap.roomsInObserverRange;
				if (typeof this._roomsInObserverRange === "undefined") {
					this.heap.roomsInObserverRange = Cartographer.getRoomsInRange(this.name, OBSERVER_RANGE).filter(f =>
						// Don't waste bringing back closed rooms, they can't ever be visited.
						(RoomIntel.getRoomStatus(f) !== 'closed')
					);
					this._roomsInObserverRange = this.heap.roomsInObserverRange;
				}
			}
			return this._roomsInObserverRange;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'highwayCornerRoomsInObserverRange', {
		get() {
			if (typeof this._highwayCornerRoomsInObserverRange === "undefined") {
				this._highwayCornerRoomsInObserverRange = this.heap.highwayCornerRoomsInObserverRange;
				if (typeof this._highwayCornerRoomsInObserverRange === "undefined") {
					this.heap.highwayCornerRoomsInObserverRange = this.roomsInObserverRange.filter(f =>
						Cartographer.isHighwayCorner(f)
					);
					this._highwayCornerRoomsInObserverRange = this.heap.highwayCornerRoomsInObserverRange;
				}
			}
			return this._highwayCornerRoomsInObserverRange;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerMaxUpgradePerTick', {
		get() {
			if (typeof this._controllerMaxUpgradePerTick === "undefined") {
				// Max level rooms are capped at a certain number of ticks.
				this._controllerMaxUpgradePerTick = this.atMaxLevel ? CONTROLLER_MAX_UPGRADE_PER_TICK : Number.POSITIVE_INFINITY;
			}
			return this._controllerMaxUpgradePerTick;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'creepsUpgradingWorkParts', {
		get() {
			const tasks = {
				[Config.tasks.UPGRADE]: Config.tasks.UPGRADE
				, [Config.tasks.UPGRADE_ALWAYS]: Config.tasks.UPGRADE_ALWAYS
			}
			// Unfortunately this cannot be cached, as a creeps task state can change in the creep processing loop.
			//return this.myCreeps.filter(f => f.task === Config.tasks.UPGRADE).length;
			return _.sum(this.myCreeps.filter(f => tasks[f.task]), s => s.workParts);
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'posInRange3OfController', {
        get() {
			if (typeof this._posInRange3OfController === "undefined") {
				this._posInRange3OfController = this.controller.coordInRange3NotNearEdge.map(m => new RoomPosition(m.x, m.y, this.name));
			}
			return this._posInRange3OfController;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.validControllerLinkPos = function(pos) {
		return (
			// Has to be range 2 of controller.
			pos.isRange2(this.controller)
			// Cannot be range 2 of any source, since it will get confusing.
			&& !this.sources.find(f => pos.isRange2(f))
			// Do not put next to mineral since those are all harvesting positions.
			&& !pos.isNearTo(this.mineral)
		);
	}

    Object.defineProperty(Room.prototype, 'idealControllerLinkPosition', {
        get() {
			if (typeof this._idealControllerLinkPosition === "undefined") {
				// Create our controller link.
				this._idealControllerLinkPosition = _.sortByOrder(
					// The filter constitutes absolute requirements.
					this.controller.pos.posOfRangeDNonTerrainWall(2).filter(f =>
						this.validControllerLinkPos(f)
					)
					// The sort constitutes preferences.
					, [
						// We want to cover the most free upgrade positions,
						// while being as close to controller as possible to keep the cooldown low.
						sortFreeNips => -sortFreeNips.findInRange(this.posInRange3OfController, 1).length + sortFreeNips.getRangeTo(this.colonyFlagAnyColor.pos)

						// Positions outside of exit range will always be preferred, but since none may be available
						// include them and we will put ramparts on them. Use 5 instead of 4 so that upgrade spots next to this one aren't in range 4 either.
						, sortExits => this.exits.find(f => f.inRange5(sortExits)) ? 1 : 0

						// Pick the spot that is vertically/horizontally closest to flag.
						, sortAlignToFlag => sortAlignToFlag.getRangeTo(this.colonyFlagAnyColor.pos)

						// Align to controller.
						, sortDistanceToController => sortDistanceToController.getDistanceTo(this.controller)
					]
				).find(x => x !== undefined) || null;
			}
			return this._idealControllerLinkPosition;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myControllerLinkUpgradePos', {
		get() {
			if (typeof this._myControllerLinkUpgradePos === "undefined") {
				this._myControllerLinkUpgradePos = this.heap.myControllerLinkUpgradePos;
				if (typeof this._myControllerLinkUpgradePos === "undefined") {
					this.heap.myControllerLinkUpgradePos = this.myControllerLink ? this.myControllerLink.nips.find(f => !f.hasStructure) : null;
					if (!this.heap.myControllerLinkUpgradePos) {
						this.heap.myControllerLinkUpgradePos = this.myControllerLink ? this.myControllerLink.nipsWalkable.find(x => x !== undefined) : null;
					}
					this._myControllerLinkUpgradePos = this.heap.myControllerLinkUpgradePos;
				}
				this._myControllerLinkUpgradePos = this._myControllerLinkUpgradePos ? utils.newPos(this._myControllerLinkUpgradePos) : null;
			}
			return this._myControllerLinkUpgradePos;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'idealControllerContainerPositions', {
        get() {
			if (typeof this._idealControllerContainerPositions === "undefined") {
				this._idealControllerContainerPositions = [];
				let flag = this.colonyFlagAnyColor;
				if (flag) {

					// Start with spots that we can build on. Exclude any spots completely covered by terrain walls.
					let posOfRange3 = this.controllerPosInRange3NotBlockedByObject.filter(f => f.isRange3(this.controller) && f.nips.find(nip => nip.isRange4(this.controller)));
					let posOfRange2 = this.controllerPosInRange3NotBlockedByObject.filter(f => f.isRange2(this.controller));
					let masterPositions = posOfRange2.concat(posOfRange3);

					let idealSpots = [];
					let controllerLinkPos = this.idealControllerLinkPosition;

					while (idealSpots.length < Math.min(masterPositions.length, CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][this.controller.level])) {
						let workingPositions = [...masterPositions];

						// Initial pass, getting the most ideal spots.
						for (let i=0; i < CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][this.controller.level]; i++) {
							let positions = workingPositions.filter(f => f.isRange3(this.controller));
							let pos = _.sortByOrder(positions, [
								// Ideally, it is near our controller link, or in range 3 of a previously found ideal spot.
								// This allows creeps to potentially share resources better.
								sortNearOther => (sortNearOther.isNearTo(controllerLinkPos) || idealSpots.find(f => f.inRange3(sortNearOther))) ? 0 : 1
								// We want the spot with the most nips.
								, sortNips => -sortNips.findInRange(workingPositions, 1).length
								// Closer to range of flag is better.
								, sortRangeTo => sortRangeTo.getRangeTo(flag)
								// Closer in distance to controller is better.
								, sortDistanceTo => sortDistanceTo.getDistanceTo(this.controller)
							])[0];

							if (pos) {
								// If we have a good pos, save it and remove all positions near it from our working list.
								idealSpots.push(pos);
								workingPositions = workingPositions.filter(f => !pos.isNearTo(f));
							}
							else {
								// No spot was found, so bail out.
								// Note we may not have exhausted all our containers in this round.
								break;
							}
						}

						// Once out of the loop, remove any ideal spots we found from our master list.
						masterPositions = masterPositions.filter(f => !idealSpots.includes(f));
					}

					// Finally, save our idea list.
					this._idealControllerContainerPositions = idealSpots;
				}
            }
            return this._idealControllerContainerPositions;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosInRange3NotBlockedByObject', {
        get() {
			if (typeof this._controllerPosInRange3NotBlockedByObject === "undefined") {
				this._controllerPosInRange3NotBlockedByObject = this.controller.pos.posInRangeDNotBlockedByObject(3).filter(f =>
					// Exclude any resource harvesting positions that might overlap.
					!f.inRange2(this.mineral)
					// This also covers the harvesting position.
					&& !this.sources.find(f2 => f2.pos.isNearTo(f))

					// And make sure we are at outside distance 5 of the colony flag.
					&& (!this.colonyFlagAnyColor || !f.inDistance5(this.colonyFlagAnyColor))
				)
            }
            return this._controllerPosInRange3NotBlockedByObject;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosNearToStore', {
        get() {
			if (typeof this._controllerPosNearToStore === "undefined") {
				this._controllerPosNearToStore = this.controllerPosInRange3NotBlockedByObject.filter(f =>
					this.controllerStores.find(store => store.pos.isNearTo(f))
				)
            }
            return this._controllerPosNearToStore;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosInRange3NotBlockedByObjectWithinPath', {
        get() {
			if (typeof this._controllerPosInRange3NotBlockedByObjectWithinPath === "undefined") {
				this._controllerPosInRange3NotBlockedByObjectWithinPath = this.controllerPosInRange3NotBlockedByObject.filter(f =>
					// Make sure this is in walking distance.
					// If a spot is outside of normal walking range then it will likely not ever get a container.
					f.findPathTo(this.controller, {ignoreCreeps: true, swampCost:1}).length <= 4
				);
            }
            return this._controllerPosInRange3NotBlockedByObjectWithinPath;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosMaxLevel', {
        get() {
			if (typeof this._controllerPosMaxLevel === "undefined") {
				this._controllerPosMaxLevel = [];
				if (this.myControllerLink && !this._controllerPosMaxLevel.length) {
					this._controllerPosMaxLevel = _.sortBy(this.myControllerLink.pos.posInRangeDNotBlockedByObject(1).filter(f => !f.hasRoad), s => s.getDistanceTo(this.controller));
				}
				if (this.myControllerLink && !this._controllerPosMaxLevel.length) {
					this._controllerPosMaxLevel = _.sortBy(this.myControllerLink.pos.posInRangeDNotBlockedByObject(1), s => s.getDistanceTo(this.controller));
				}
				if (!this._controllerPosMaxLevel.length) {
					this._controllerPosMaxLevel = _.sortBy(this.controllerPosInRange3NotBlockedByObjectWithinPath, s => s.getDistanceTo(this.controller));
				}
            }
            return this._controllerPosMaxLevel;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerUpgradePositions', {
        get() {
			if (typeof this._controllerUpgradePositions === "undefined") {
				this._controllerUpgradePositions = [];

				if (this.atMaxLevel) {
					this._controllerUpgradePositions = this.controllerPosMaxLevel;
				}
				else if (this.isTemple) {
					this._controllerUpgradePositions = this.controllerPosTemple;
				}
				// This is a trigger for bellmen and heralds, who don't move. Limit to controller store positions.
				else if (this.controllerStores.length) {
					this._controllerUpgradePositions = this.controllerPosNearToStore;
				}

				if (!this._controllerUpgradePositions.length) {
					this._controllerUpgradePositions = this.controllerPosInRange3NotBlockedByObject;
				}
            }
            return this._controllerUpgradePositions;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerUpgradePositionsHashByName', {
        get() {
			if (typeof this._controllerUpgradePositionsHashByName === "undefined") {
				this._controllerUpgradePositionsHashByName = this.controllerUpgradePositions.reduce((map, obj) => (map[obj.name] = obj.name, map), {});
            }
            return this._controllerUpgradePositionsHashByName;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosInRange3NotBlockedByObjectSorted', {
        get() {
			if (typeof this._controllerPosInRange3NotBlockedByObjectSorted === "undefined") {
				if (this.controllerStores.length) {
					this._controllerPosInRange3NotBlockedByObjectSorted = _.sortByOrder(this.controllerPosInRange3NotBlockedByObject, [
						sortRangeToController => sortRangeToController.getRangeTo(this.controller)
						, sortRangeToStore => sortRangeToStore.getRangeTo(sortRangeToStore.findClosestByRange(this.controllerStores))
					]);
				}
				else {
					this._controllerPosInRange3NotBlockedByObjectSorted = _.sortBy(this.controllerPosInRange3NotBlockedByObject, s => s.getRangeTo(this.controller));
				}
            }
            return this._controllerPosInRange3NotBlockedByObjectSorted;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'controllerUpgradePositionsSorted', {
		get() {
			if (typeof this._controllerUpgradePositionsSorted === "undefined") {
				this._controllerUpgradePositionsSorted = [];

				if (this.controller) {
					// Start with all empty positions in range 3 of controller that are not blocked.
					if (
						!this.heap.controllerUpgradePositionsSorted
						|| !this.heap.controllerUpgradePositionsSortedTick
						|| (this.heap.controllerUpgradePositionsSortedTick + Config.params.CACHE_OBJECT_TICKS < Game.time)
						|| this.myConstructionSites.length
						|| (this.controller.level !== this.heap.controllerUpgradePositionsSortedLevel)
					) {
						delete this.heap.controllerUpgradePositionsSorted;
						delete this.heap.controllerUpgradePositionsSortedTick;
					}

					if (!this.heap.controllerUpgradePositionsSorted) {
						// Off all the positions in range 3 that are not blocked by structure or terrain, filter out those that don't have a path to the controller in range 3.
						// This filters out positions that could be on the wrong side of the controller that are not usable.
						this._controllerUpgradePositionsSorted = this.controllerUpgradePositions;

						// Once we get to max level, don't stand on roads anymore.
						//let colonyFlag = this.templeFlagAnyColor || this.colonyFlagAnyColor || null;
						let colonyFlag = (this.isTemple ? this.templeFlagAnyColor : this.colonyFlagAnyColor) || null;

						if (this.controllerStores.length) {

							// let controllerStores = _.sortByOrder(this.controllerStores, [
							// 	sortRangeToController => sortRangeToController.pos.getRangeTo(this.controller)
							// 	, sortDistanceToColonyFlag => sortDistanceToColonyFlag.pos.getDistanceTo(colonyFlag)
							// ]);

							let controllerStores = _.sortByOrder(this.controllerStores, [
								sortRangeToController => sortRangeToController.pos.getDistanceTo(this.controller)
							]);

							this._controllerUpgradePositionsSorted = _.sortByOrder(this._controllerUpgradePositionsSorted, [

								// SORT A
								// sortNearToLinkController => (sortNearToLinkController.isNearTo(this.controllerLink) && sortNearToLinkController.isNearTo(this.controller)) ? 0 : 1
								// , sortNearToLink => sortNearToLink.isNearTo(this.controllerLink) ? 0 : 1
								// , sortIdealPos => ((sortIdealPos.getDistanceTo(this.controller) == 2) && sortIdealPos.findInRange(controllerStores, 1).length) ? 0 : 1
								// , sortNearControllerStore => (sortNearControllerStore.getDistanceTo(this.controller) * 2) + sortNearControllerStore.getDistanceTo(sortNearControllerStore.findClosestByDistance(controllerStores))

								// SORT B
								// sortNearToLink => sortNearToLink.isNearTo(this.controllerLink) ? sortNearToLink.getDistanceTo(this.controller) : 7
								// , sortNearToLinkDistanceToFlag => sortNearToLinkDistanceToFlag.isNearTo(this.controllerLink) ? sortNearToLinkDistanceToFlag.getDistanceTo(this.colonyFlag) : 100

								// , sortNearToStore => sortNearToStore.findInRange(this.controllerStores, 1).length ? sortNearToStore.getDistanceTo(this.controller) : 7
								// , sortNearToStoreDistanceToFlag => sortNearToStoreDistanceToFlag.findInRange(this.controllerStores, 1).length ? sortNearToStoreDistanceToFlag.getDistanceTo(this.colonyFlag) : 100

								// , sortDistanceToController => sortDistanceToController.getDistanceTo(this.controller)
								// , sortDistanceToColonyFlag => sortDistanceToColonyFlag.getDistanceTo(this.colonyFlag)

								// SORT C
								sortIsNearByStore => controllerStores.findIndex(f => f.pos.isNearTo(sortIsNearByStore))
								, sortDistanceToController => sortDistanceToController.getDistanceTo(this.controller)
								//, sortDistanceToColonyFlag => sortDistanceToColonyFlag.getDistanceTo(colonyFlag)

							]);

						}
						else {
							this._controllerUpgradePositionsSorted = _.sortByOrder(this._controllerUpgradePositionsSorted, [
								// Then the range to the controller of course, closer is better.
								sortDistanceToController => sortDistanceToController.getDistanceTo(this.controller)
								// Positions further away from flag are better, actually!
								//, sortDistanceToColonyFlag => colonyFlag ? -sortDistanceToColonyFlag.getDistanceTo(colonyFlag) : 0
							]);
						}

						this.heap.controllerUpgradePositionsSorted = this._controllerUpgradePositionsSorted;
						this.heap.controllerUpgradePositionsSortedTick = Game.time;
						this.heap.controllerUpgradePositionsSortedLevel = this.controller.level;
					}

					this._controllerUpgradePositionsSorted = this.heap.controllerUpgradePositionsSorted;
				}
            }
			return this._controllerUpgradePositionsSorted;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'nonControllerUpgradePositionsSorted', {
		get() {
			if (typeof this._nonControllerUpgradePositionsSorted === "undefined") {
				if (this.controllerStores.length) {
					// Filter out all the positions near our controller stores, and sort by distance to controller.
					this._nonControllerUpgradePositionsSorted = this.controllerPosInRange3NotBlockedByObject.filter(f => !this.controllerUpgradePositionsHashByName[f.name]);
					this._nonControllerUpgradePositionsSorted = _.sortBy(this._nonControllerUpgradePositionsSorted, s => s.getDistanceTo(this.controller));
				} else {
					// Fall back to our standard list, whatever that might be.
					this._nonControllerUpgradePositionsSorted = this.controllerUpgradePositionsSorted;
				}
			}
			return this._nonControllerUpgradePositionsSorted;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'labNeedsEnergy', {
		get() {
			if (typeof this._labNeedsEnergy === "undefined") {
				this._labNeedsEnergy = this.colonyLabs.find(f => (f.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) || null;
			}
			return this._labNeedsEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerContainerNeedsEnergy', {
		get() {
			if (typeof this._controllerContainerNeedsEnergy === "undefined") {
				this._controllerContainerNeedsEnergy = this.controllerContainers.find(f => (f.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) || null;
			}
			return this._controllerContainerNeedsEnergy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyTowersUnmanned', {
		get() {
			if (typeof this._colonyTowersUnmanned === "undefined") {
				this._colonyTowersUnmanned = [];

				// Note that tower1 is unreachable when we have powercreeps.
				if (!this.king && this.colonyTower1 && !this.powerCreep && !this.isTemple) {
					this._colonyTowersUnmanned.push(this.colonyTower1);
				}
				else if (!this.queen && this.colonyTower2 && !this.isTemple) {
					this._colonyTowersUnmanned.push(this.colonyTower2);
				}
			}
			return this._colonyTowersUnmanned;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyTowersNeedsEnergy', {
		get() {
			if (typeof this._colonyTowersNeedsEnergy === "undefined") {
				this._colonyTowersNeedsEnergy = !!this.colonyTowersUnmanned.find(f => f.store.getUsedCapacity(RESOURCE_ENERGY) < f.store.getFreeCapacity(RESOURCE_ENERGY));
			}
			return this._colonyTowersNeedsEnergy;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.displayTickInfo = function() {
        // Shorthand.
        let room = this;

		// Bail out if we don't have a tick flag.
		if (FlagManager.notickFlag) return;

        let creepCount = CreepManager.creepsArray.length;
		let roomCount = GameManager.empireRooms.length;
		let reservedCount = GameManager.empireReservedRoomsArray.length;
		let deltaMessage = '💠';
		if (!room.noReserve) {
			let delta = CpuManager.getRecommendedDelta();
			if (delta > 0) {
				deltaMessage = '🔺'.repeat(Math.abs(delta));
			} else if (delta < 0) {
				deltaMessage = '🔻'.repeat(Math.abs(delta));
			}
		}
		let creepMessage = ' 🐛' + creepCount + '/' + roomCount + '/' + reservedCount + deltaMessage + GameManager.empireObjective;

        let powerCreepCount = GameManager.powerCreeps.filter(f => f.shard || !Game.cpu.shardLimits).length;
        let powerCreepTotalCount = GameManager.powerCreeps.length;
		let powerCreepMessage = powerCreepTotalCount ? (' 🦂' + powerCreepCount + ':' + powerCreepTotalCount) : '';

        // Special 'halt' flag that when non-zero will stop any assist and reserve creeps to spawn.
        // Can either manually halt with a flag, or if our CPU bucket is less than that of a creep.
        let haltMessage = '';
		haltMessage += (GameManager.haltSupporting ? '👤' : '🕺')
		haltMessage += (!room.okToSpawnAuxiliaryCreep ? '👥' : '💃')
		haltMessage += (GameManager.haltFarming ? '🥔' : '🚜')
		haltMessage += (GameManager.haltStop ? '🛑' : '')

        let colorFunction = function(num) {
            if (num <= -4) return '🔥'
            if (num <= -3) return '🔴'
            if (num <= -2) return '🟠'
            if (num <= -1) return '🟤'
            if (num <= 0) return '🟡'
            if (num <= 1) return '🟢'
            if (num <= 2) return '🔵'
            if (num <= 3) return '🟣'
            if (num <= 4) return '⚪'
            return '❄️'
        }
        let cpuBucketDelta = Game.cpu.bucket - Memory.stats.cpuBucket;

		// Interesting/special creeps that we like to see at work!
		let specialCreepsMessage = '';
		if (!FlagManager.notickinfoFlag) {
			let temples = GameManager.empireNonMaxTempleRooms;
			let templeMessage = temples.length ? ' T:' + temples.map(m => m.print + '(' + m.controller.level + ')').join() : '';

			let gd = GameManager.getGolddiggers().filter(f => f.pos);
			let gdMessage = gd.length ? ' G:' + gd.map(m => utils.getRoomHTML(m.room.name)).join() : '';

			let scr = Object.keys(Memory.screeps);
			let ran = CreepManager.getRangers().filter(f => !f.spawning);
			let lan = CreepManager.getLancers().filter(f => !f.spawning);
			let str = CreepManager.getStrikers().filter(f => !f.spawning);
			let bla = CreepManager.getBlacksmiths().filter(f => !f.spawning);
			let pro = CreepManager.getProspectors().filter(f => !f.spawning);
			let dre = CreepManager.getDredgers().filter(f => !f.spawning);
			let scrMessage = (scr.length ? ' R:' + scr.map(m => utils.getRoomHTML(m)).join() : '');
			let ranMessage = (ran.length ? ' A:' + utils.unique(ran.map(m => utils.getRoomHTML(m.currentRoom))).join() : '');
			let lanMessage = (lan.length ? ' L:' + utils.unique(lan.map(m => utils.getRoomHTML(m.workRoom))).join() : '');
			let strMessage = (str.length ? ' S:' + utils.unique(str.map(m => utils.getRoomHTML(m.workRoom))).join() : '');
			let blaMessage = (bla.length ? ' B:' + utils.unique(bla.map(m => utils.getRoomHTML(m.workRoom))).join() : '');
			let dreMessage = (dre.length ? ' D:' + utils.unique(dre.map(m => utils.getRoomHTML(m.workRoom) + (m.focusTarget ? utils.formatNum(m.focusTarget.mineralAmount || 0, 0) + '/' + RoomIntel.getMineralType(m.workRoom) : '' ))).join() : '');
			let proMessage = (pro.length ? ' P:' + utils.unique(pro.map(m => utils.getRoomHTML(m.workRoom) + (m.focusTarget ? ':' + m.focusTarget.lastCooldown : '' ))).join() : '');

			// No add all the types together.
			specialCreepsMessage = templeMessage + gdMessage + scrMessage + ranMessage + lanMessage + blaMessage + strMessage + dreMessage + proMessage;
		}

		// A detailed list of creeps currently spawning.
        let spawningText = ''
		if (!FlagManager.notickinfoFlag) {
			let spawning = _.sortBy(GameManager.empireSpawnsSpawning, s=>s.spawning.remainingTime);
			for (let i=0; i<spawning.length; i++) {
				let spawn = spawning[i];
				let creep = Game.creeps[spawn.spawning.name];
				if (creep) spawningText += ',' + creep.role.substring(0, 3) + '' + creep.room.print + ':' + (spawn.spawning ? spawn.spawning.remainingTime : 0) + '';
			}
			spawningText = spawningText.substring(1);
			spawningText = (spawningText.length ? ' W:' + spawningText : '')
		}

		let tickCheckMessage = GameManager.isCpuMaxed ? '' : (room.memory.tickCheckResults || []).join();
		tickCheckMessage = (tickCheckMessage.length ? ' [' + tickCheckMessage + ']' : '')

		let hostilesInRoomsMessage = '';
		if (!FlagManager.notickinfoFlag) {
			let hostilesInRooms = GameManager.empireManagementRoomNames.filter(f => RoomIntel.getDangerousHostilesTTL(f)).map(m => utils.getRoomHTML(m)).join();
			hostilesInRoomsMessage = hostilesInRooms.length ? ' H:' + hostilesInRooms : '';
		}

		// Construct the room message.
        let roomMessage = '[' + room.controller.level;
		roomMessage += ',' + RoomIntel.getMineralType(room.name);
		if (room.labOutput) roomMessage += ',' + room.labOutput;
		if (!FlagManager.notickinfoFlag) {
			roomMessage += '⛏️'.repeat(CreepManager.getMinersByFocusId(RoomIntel.getMineralId(room.name)).length);
			//if (RoomIntel.getThoriumId(room.name)) roomMessage += '⛏️'.repeat(CreepManager.getMinersByFocusId(RoomIntel.getThoriumId(room.name)).length);
		}

		// The state of a particular room and its local workers.
		let roomMessageState = ''
		if (!FlagManager.notickinfoFlag) {
			if (room.hasFocus) roomMessageState += '🔎';
			if (RoomIntel.getHostilesTTL(room.name) && room.hostiles.length) roomMessageState += '👹';
			if (room.isNukeInbound) roomMessageState += '🍄';
			roomMessageState += '🐱‍👤'.repeat(CreepManager.getRoguesByFocusId(room.controller.id).length);
			roomMessageState += '👩‍🔬'.repeat(CreepManager.getCriersByFocusId(room.controller.id).length);
			roomMessageState += '🧙‍♀️'.repeat(CreepManager.getProphetsByFocusId(room.controller.id).length);
			if (!room.atMaxLevel) {
				roomMessageState += '👨‍🔬'.repeat(CreepManager.getBellmenByFocusId(room.controller.id).length);
				roomMessageState += '🧙'.repeat(CreepManager.getHeraldsByFocusId(room.controller.id).length);
				roomMessageState += '🧞‍♀️'.repeat(CreepManager.getDivinersByFocusId(room.controller.id).length);
				roomMessageState += '🧞'.repeat(CreepManager.getOraclesByFocusId(room.controller.id).length);
			}
			roomMessageState += '👷'.repeat(CreepManager.getCarpentersByFocusId(room.controller.id).length);
			roomMessageState += '👨‍🔧'.repeat(CreepManager.getMasonsByFocusId(room.controller.id).length);
			if (roomMessageState) roomMessage += ',' + roomMessageState;
		}

		// Factory information about current room.
		if (room.factoryLevel) roomMessage += ',' + '🏭'.repeat(room.factoryLevel) + (room.factoryBoosted ? '✅' : (room.factoryCooldown ? '✴️' + (room.factoryReadyForBoost ? '☑️' : '') : (room.factoryReadyForBoost ? '☑️' : '')));
		if (room.level < 8) roomMessage += ',' + utils.formatNum(room.controller.progressRemaining, 1)
        roomMessage += ']:' + room.storageEnergy;
		if (room.isTemple && room.atMaxLevel) roomMessage += ' {🗼' + room.isTempleNotPreppedToRecycleReasons.join() + '}'

		// Construct our GPL/GCL message.
		let gplgclMessage = ''
		if (GameManager.isBestShard) {
			let gplTick = (Game.gpl.progress - Memory.stats.gplProgress).toFixed(0);
			let gclTick = (Game.gcl.progress - Memory.stats.gclProgress).toFixed(0);
			gplgclMessage = ((gclTick > 0) ? ',💡' + gclTick : '') + ((gplTick > 0) ? ',🔴' + gplTick : '');
			gplgclMessage = gplgclMessage.length ? ' [' + gplgclMessage.substring(1) + ']' : '';
		}

        let creepCountMessage = (creepCount < Memory.stats.creepCount) ? '👻' : ((creepCount > Memory.stats.creepCount) ? '👶' : '⏱️');
		let timeMessage = creepCountMessage + ':' + Game.time;

		// Construction Sites.
		let constructionSitesMessage = '';
		if (!FlagManager.notickinfoFlag) {
			constructionSitesMessage = GameManager.myConstructionSiteRoomNamesArray.map(m => utils.getRoomHTML(m));
			constructionSitesMessage = constructionSitesMessage.length ? ' C' + GameManager.constructionSitesArray.length + ':' + constructionSitesMessage : '';
		}

		// Process information.
		let processesMessage = ''
		if (!FlagManager.notickinfoFlag) {
			processesMessage = GameManager.printProcesses();
			processesMessage = processesMessage.length ? ' {' + processesMessage + '}' : '';
		}

        // Display our time so we know we aren't disconnected or stuck.
        console.log(
            (
                timeMessage
                + creepMessage
				+ powerCreepMessage
                + ' 🤖' + Game.cpu.bucket + '['
					+ colorFunction(cpuBucketDelta) + Math.abs(cpuBucketDelta)
					+ ',' + colorFunction(Memory.stats.cpuMovingAvg) + Math.abs(Memory.stats.cpuMovingAvg).toFixed(2)
				+ ']'
                + ' 💰[' + colorFunction(Memory.stats.energyMovingAvg) + Math.abs(Memory.stats.energyMovingAvg).toFixed(0) + ']'
            )
            + ' ' + (GameManager.haltRenewing ? '☠️' : '♻️') + (room.haltSpawning ? '🚫' : '🏁')
            + (haltMessage.length ? haltMessage : '')
            //+ ' ' + Game.shard.name.substring(Game.shard.name.length - 1) + '/' + room.print + roomMessage
			+ ' ' + room.printShard + roomMessage
			+ gplgclMessage
			+ hostilesInRoomsMessage
			+ constructionSitesMessage
			+ specialCreepsMessage
            + spawningText
            + tickCheckMessage
			+ processesMessage
        );

        Memory.stats.cpuBucket = Game.cpu.bucket;
        Memory.stats.creepCount = creepCount;

		// These are global across shards, and trying to calculate them when shards run at different ticks is not possible.
		// Only update if we are on shard3.
		if (GameManager.isBestShard) {
			Memory.stats.gplProgress = Game.gpl.progress.toFixed(0);
			Memory.stats.gclProgress = Game.gcl.progress.toFixed(0);
		}

        if (RoomIntel.getHostilesTTL(room.name) && room.hostiles.length) {
            // If we have a hostile, notify me of it.
            let usernames = utils.unique(room.hostiles.map(m => m.owner.username)).join();
            let message = room.hostiles.length + 'x 🔺 ' + usernames + ' spotted in ' + room.printShard + ' !!!';
            Game.notify(message);
            console.log(message);
        }

    }

	Room.prototype.displayRoomInfo = function() {
		// Shorthand.
		let room = this;

		// A flag named "display" needs to be placed.
		// After a config amount of time, it will be automatically turnedd off to save CPU.
		if (!FlagManager.displayFlag) {
			delete Memory.stats.displayRoomInfoTime;
			return;
		}
		if (!Memory.stats.displayRoomInfoTime) Memory.stats.displayRoomInfoTime = Game.time;
		if (Memory.stats.displayRoomInfoTime < (Game.time - (Config.params.DISPLAY_TICKS * C.COLOR_TO_NUMBER[FlagManager.displayFlag.color]))) {
			FlagManager.displayFlag.setColor(COLOR_WHITE);
			return;
		}

        let message = [];
        let color = 'yellow';
        if (room.hostiles.length > 0) { color = 'red'; }
		let claimedMinerals = _.sortBy(Object.keys(GameManager.empireClaimedMinerals), s => GameManager.empireClaimedMinerals[s]).map(m => ' ' + m + ':' + GameManager.empireClaimedMinerals[m]);

        // Construct message to place top left of room.
		message.push({data:room.name + ' (' + room.controller.level + ')', color:color});
		message.push({data:'CPU: ' + GameManager.Game.cpu.limit + ' / ' + Game.cpu.tickLimit + ' / ' + Game.cpu.bucket, color:color});
        message.push({data:'Barrier hits: ' + room.barrierHits, color:color});
		message.push({data:'Barrier below (normal/peon) repair: ' + utils.formatNum(room.barrierHitsBelowRepairThreshhold) + ' / ' + utils.formatNum(room.barrierHitsBelowWorkerRepairThreshhold), color:color});
        message.push({data:'Energy: ' + room.energyAvailable + ' / ' + room.energyCapacityAvailable + ' / ' + room.storageEnergy, color:color});
        message.push({data:'Energy minimal: ' + room.energyMinimal + ' (' + room.isStorageEnergyMinimal + ')', color:color});
        message.push({data:'Energy normal: ' + room.energyNormal + ' (' + room.isStorageEnergyNormal + ')', color:color});
		message.push({data:'Energy abundance: ' + room.energyAbundant + ' (' + room.isStorageEnergyAbundant + ')', color:color});
		message.push({data:'Energy dump: ' + room.energyDump + ' (' + room.isStorageEnergyDump + ')', color:color});
		message.push({data:'Energy dump power: ' + room.energyDumpPower + ' (' + room.isStorageEnergyPower + ')', color:color});
		message.push({data:'Minerals: ' + claimedMinerals, color:color});
		message.push({data:'Reserved: ' + room.reservedRoomNames.join(), color:color});
		message.push({data:'Cost (cpu,creeps): ' + room.reserveCpuCost + ' ' + room.reserveCreeps + '/' + room.maxReserveCreepCapacity, color:color});

		if (room.labMineralsPrint) message.push({data:'Lab: ' + room.labMineralsPrint, color:color})
        message.push({data:'', color:color});

        // Get list of controllers I own, and iterate throught them.
        let controllers = GameManager.empireSpawnControllersActive;
        for (let i = 0; i < controllers.length; i++) {
            // Set the controller we are working on.
            let controller = controllers[i];
			let energyColor = controller.room.roomColor;

			message.push(
                {data:
                    controller.room.name + ' (' + controller.level + '): '
                    + (controller.level < 8 ? ' ' + utils.formatNum(controller.progress, 3) + ' / ' + utils.formatNum(controller.progressTotal, 3) : '')
					+ ' ' + controller.room.mineral.mineralType + ':' + (controller.room.mineral.mineralAmount ? controller.room.mineral.mineralAmount : '(' + controller.room.mineral.ticksToRegeneration + ')')
					+ ' B[' + utils.formatNum(controller.room.barrierHitsBelowRepairThreshhold) + ' / ' + utils.formatNum(controller.room.barrierHitsBelowWorkerRepairThreshhold) + ']'
					+ ' ' + controller.room.myCreeps.length

					// Use cache to look for hostiles, but display actual number if found.
                    + (RoomIntel.getHostilesTTL(controller.room.name) ? (', ' + controller.room.hostiles.length + ' hostiles') : '')

					+ ((controller.room.name == room.name) ? ' (Viewing)' : '')
                , color: energyColor}
            );
        }
		message.push({data:'', color:color});

        // Display the message.
        for (let i = 0; i < message.length; i++) {
            room.visual.text(
                message[i].data
                , 0
                , i
                , {align: 'left', opacity: 0.5, font: '0.6 arial', color: message[i].color}
            );
        }
    }

	Object.defineProperty(Room.prototype, 'wallPositions', {
		get() {
			if (typeof this._wallPositions === "undefined") {
				this._wallPositions = [];
				const raw = (new Room.Terrain(this.name)).getRawBuffer();
				for(let y = 0; y < 50; y++) {
					for(let x = 0; x < 50; x++) {
						const code = raw[y * 50 + x];
						if (code & TERRAIN_MASK_WALL) {
							this._wallPositions.push(new RoomPosition(x, y, this.name));
						}
					}
				}
			}
			return this._wallPositions;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyLocations', {
		get() {
			if (typeof this._colonyLocations === "undefined") {
				this._colonyLocations = this.heap.colonyLocations;
				if (typeof this._colonyLocations === "undefined") {
					// Shorthand.
					let room = this;

					// Set the max range from a colony flag marker that we would allow walls to be.
					const COLONY_SIZE_DISTANCE = 5;
					const RANGE_TO_EDGE = 9;

					// Find all wall and nonwall positions.
					let walls = [];
					let candidates = [];
					const raw = (new Room.Terrain(room.name)).getRawBuffer();
					for(let y = 0; y < 50; y++) {
						for(let x = 0; x < 50; x++) {
							const code = raw[y * 50 + x];
							let pos = new RoomPosition(x, y, room.name);
							if (code & TERRAIN_MASK_WALL) {
								walls.push(pos);
							} else {
								if (
									// Don't go anywhere near the wall.
									(pos.x > RANGE_TO_EDGE)
									&& (pos.x < 49 - RANGE_TO_EDGE)
									&& (pos.y > RANGE_TO_EDGE)
									&& (pos.y < 49 - RANGE_TO_EDGE)

									// We leave range 3 ring around the controller for spamming upgraders.
									// Remember that our base has a road around it already that pages can walk on.
									&& (pos.getRangeTo(room.controller) > COLONY_SIZE_DISTANCE)
									&& !room.controller.pos.anyPosInRangeD(3).find(f => f.getDistanceTo(pos) <= COLONY_SIZE_DISTANCE)

									// We leave range 1 ring around the mineral for mining.
									&& room.minerals.every(mineral => {
										return !mineral.pos.anyPosInRangeD(1).find(f => f.getDistanceTo(pos) <= COLONY_SIZE_DISTANCE)
									})

									// Don't go range 2 near the sources as a link could be placed there.
									&& room.sources.every(source => {
										return !source.pos.anyPosInRangeD(2).find(f => f.getDistanceTo(pos) <= COLONY_SIZE_DISTANCE)
									})
								) {
									candidates.push(pos);
								}
							}
						}
					}

					let candidateData = [];
					candidates.forEach(pos => {
						let closest = pos.findClosestByDistance(walls);
						if (closest && (pos.getDistanceTo(closest) > 5)) {
							candidateData.push({
								pos: pos
							})
						}
					});

					// Now find the closest to the controller, biased to the center of the room.
					let centerPos = new RoomPosition(25, 25, room.name);
					candidateData = _.sortByOrder(candidateData, [
						// This could be a handy sort, but would need to be weighted somehow.
						// No point in having a base on other side of room from controller just because it has 1 fewer walking spots around it.
						//sortWallsInRange => sortWallsInRange.pos.findInDistance(obsticles, 6).length

						// Closer to the controller the better.
						sortControllerRange => sortControllerRange.pos.getRangeTo(room.controller)
						, sortCenterRange => sortCenterRange.pos.getRangeTo(centerPos)
						, sortControllerDistance => sortControllerDistance.pos.getDistanceTo(room.controller)
						, sortCenterDistance => sortCenterDistance.pos.getDistanceTo(centerPos)
					])

					if (candidateData.length) {
						candidateData[0].best = true;
					}

					// if (FlagManager.mapFlag && (FlagManager.mapFlag.pos.roomName === this.name)) {
					// 	for (let i = 0; i < Math.min(5, candidateData.length); i++) {
					// 		console.log('candidate', i, 'distance5 to obsticle:', candidateData[i].pos, candidateData[i].pos.findInDistance(obsticles, 6).length)
					// 	}
					// }

					this.heap.colonyLocations = candidateData;
					this._colonyLocations = this.heap.colonyLocations;
				}
			}
			return this._colonyLocations;
		},
		configurable: true, enumerable: true,
	});

	Room.prototype.visualizeColonyLocations = function(candidateData) {
		const visual = new RoomVisual(this.name);
		candidateData.forEach((candidate, index) => {
			let color = 'red';
			if (candidate.best) color = 'green';
			visual.circle(candidate.pos.x, candidate.pos.y, { fill: color, radius: 0.5, opacity: 0.9 });
			if (index < 9) {
				visual.text(index + 1, candidate.pos.x, candidate.pos.y + 0.2, { opacity: 0.9 });
			}
		})
	}

	Room.prototype.displayColonyLocations = function() {
		// Shorthand.
		let room = this;

		const candidateData = room.colonyLocations;
		if (candidateData.length) {
			room.visualizeColonyLocations(candidateData);
		} else {
			room.logRoom('unable to find any suitable colony locations')
		}
	}

	Room.prototype.createColonyFlag = function() {
		// Shorthand.
		let room = this;

		// Conditions that exclude creating a flag.
		if (
			!room.controller
			|| room.colonyFlagAnyColor
			|| room.templeFlagAnyColor
			|| room.noColony
		) return false;

		let candidate = null;
		let fixNewSpawnCanidate = false;

		// New room situation. We just laid down our first spawn. Could not have made a colony flag before this. Will ignore CPU level.
		if ((Object.keys(Game.spawns).length === 1) && !Object.keys(FlagManager.colonyFlags).length && room.mySpawns.length) {
			candidate = room.mySpawns[0];
			fixNewSpawnCanidate = true;

		} else {
        	// Master bailout switch on first controller.  Bad juju!
			//if (!GameManager.isCpuMaxed) return false;

			// Late processing check. Do no process if the room is ours already or if room is garbage.
			// Would have to guess at the spawn which should be colony flag.
			if (
				room.my
				|| GameManager.isCpuHalted
				|| (RoomIntel.getSourceCount(room.name) < GameManager.colonyRoomMinSourceCount)
			) return false;

			// Get the best location.
			candidate = room.colonyLocations[0];
		}

		room.logRoom('scanning for colony location');

		// Determine if we have a good position.
		if (!candidate) {
			room.createFlag(25, 25, 'nocolony ' + room.name, COLOR_RED);
			return true;
		}

		// Put a colored flag down on this position based on the direction to the controller.
		let color = COLOR_WHITE;
		let fixNewSpawnCanidateDirection = 0;
		if ((candidate.pos.x <= room.controller.pos.x) && (candidate.pos.y < room.controller.pos.y)) {
			// Candidate is above and to the left of the controller, so point storage down to the right.
			color = COLOR_CYAN;
			fixNewSpawnCanidateDirection = LEFT;

		} else if ((candidate.pos.x > room.controller.pos.x) && (candidate.pos.y <= room.controller.pos.y)) {
			// Candidate is above and to the right of the controller, so point storage down the left.
			color = COLOR_BLUE;
			fixNewSpawnCanidateDirection = RIGHT;

		} else if ((candidate.pos.x >= room.controller.pos.x) && (candidate.pos.y > room.controller.pos.y)) {
			// Candidate is below and to the right of the controller, so point storage up to the left
			color = COLOR_PURPLE;
			fixNewSpawnCanidateDirection = RIGHT;

		} else if ((candidate.pos.x < room.controller.pos.x) && (candidate.pos.y >= room.controller.pos.y)) {
			// Candidate is below and to the left of the controller, so point storage up to the right.
			color = COLOR_RED;
			fixNewSpawnCanidateDirection = LEFT;

		}

		// Need to move the flag to the renew position from the intial spawn position.
		if (fixNewSpawnCanidate) {
			candidate = candidate.pos.fromDirection(fixNewSpawnCanidateDirection);
		}
		candidate = utils.normalizePos(candidate);
		room.createFlag(candidate, 'colony ' + room.name, color);

		// Create the corrisponding claim flag as white if we don't have one already.
		if (!FlagManager.claimFlags[room.name]) {
			let claimFlagPos = new RoomPosition(room.controller.pos.x, room.controller.pos.y - 2, room.controller.pos.roomName);
			room.createFlag(claimFlagPos, 'claim ' + room.name, room.my ? COLOR_RED : COLOR_WHITE);
		}

		// Create a claim room flag if it isn't present already.
		return true;
	}

	Room.prototype.createTempleFlag = function() {
		// Shorthand.
		let room = this;

		// Conditions that exclude creating a flag.
		if (
			!room.controller
			|| FlagManager.notempleFlags[room.name]
			|| !GameManager.isPotentialTempleRoom(room.name)
			|| !room.idealTempleFlagPos
		) {
			// Temples can actually be transitory...if we move colony rooms around.
			if (FlagManager.templeFlagsAnyColor[room.name]) {
				room.logRoom('removing invalid temple flag');
				FlagManager.templeFlagsAnyColor[room.name].flag.remove();
			}
			return false;
		}

		// Create our temple flag if it doesn't exist.
		if (!FlagManager.templeFlagsAnyColor[room.name]) {
			let templeFlagPos = room.idealTempleFlagPos;
			room.createFlag(templeFlagPos, 'temple ' + room.name, COLOR_RED);
			room.logRoom('creating temple flag');
		}

		// Create the corrisponding claim flag as white if we don't have one already.
		if (!FlagManager.claimFlagsAnyColor[room.name]) {
			let claimFlagPos = new RoomPosition(room.controller.pos.x, room.controller.pos.y - 2, room.controller.pos.roomName);
			room.createFlag(claimFlagPos, 'claim ' + room.name, room.my ? COLOR_RED : COLOR_WHITE);
		}

		// This room is a temple room and flags were (potentially) created.
		return true;
	}

	Room.prototype.myPrintRawTerain = function(raw) {
		const visual = new RoomVisual();
		for(let y = 0; y < 50; y++) {
			for(let x = 0; x < 50; x++) {
				const code = raw[y * 50 + x];
				const color =
					(code & TERRAIN_MASK_WALL ) ? "gray"  :
					(code & TERRAIN_MASK_SWAMP) ? "green" : "white" ;
				visual.circle(x, y, {fill: color, radius: 0.5});
			}
		}
	}

	Room.prototype.doPrint = function() {
		const raw = (new Room.Terrain(this.name)).getRawBuffer();
		this.myPrintRawTerain(raw);
	}

	Object.defineProperty(Room.prototype, 'hasRoomContainers', {
		get() {
			if (typeof this._hasRoomContainers === "undefined") {
				this._hasRoomContainers = !!(
					this.colonyContainer
					&& !this.sources.find(f => !f.sourceContainer)
					&& (this.controllerStores.length >= 2)
				)
			}
			return this._hasRoomContainers;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomMissingStructure', {
		get() {
			if (typeof this._roomMissingStructure === "undefined") {
				let level = this.controller ? this.controller.level : 0;
				if (this.isTemple) {
					this._roomMissingStructure =
						// Temples only care about a few structures; and will not max out on spawns or towers.
						(Math.min(1, CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level]) > GameManager.getSpawnsByRoomName(this.name).length)
						|| ((level >= this.templeTowerLevel) && Math.min(1, CONTROLLER_STRUCTURES[STRUCTURE_TOWER][level]) > this.myTowers.length)
						|| (CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level] > (this.myStorage ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][level] > (this.myTerminal ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][level] > ((this.mineral && this.colonyMineralExtractor) ? 1 : 0))
				}
				else {
					this._roomMissingStructure =
						// Check the count of each important structure, make sure we have them all.
						// Structures being omitted are: CONTAINERS, more than 3 LINKS, ROAD, WALL, RAMPART
						(CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][level] > GameManager.getSpawnsByRoomName(this.name).length)
						|| (CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][level] > this.colonyExtensions.length)
						|| (Math.min(3, CONTROLLER_STRUCTURES[STRUCTURE_LINK][level]) > this.myColonyLinks.length)
						|| (CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][level] > (this.myStorage ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_TOWER][level] > this.colonyTowers.length)
						|| (CONTROLLER_STRUCTURES[STRUCTURE_OBSERVER][level] > (this.colonyObserver ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_POWER_SPAWN][level] > (this.colonyPowerSpawn ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][level] > ((this.mineral && this.colonyMineralExtractor) ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][level] > (this.myTerminal ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_LAB][level] > this.colonyLabs.length)
						|| (CONTROLLER_STRUCTURES[STRUCTURE_NUKER][level] > (this.colonyNuker ? 1 : 0))
						|| (CONTROLLER_STRUCTURES[STRUCTURE_FACTORY][level] > (this.colonyFactory ? 1 : 0))
						// Low level rooms should always have 5 containers out; max rooms will have zero.
						|| (!this.atMaxLevel && this.hasEmpireCastleAssistance && (CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][level] > this.colonyContainers.length))
				}
			}
			return this._roomMissingStructure;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'shouldAttackControllerNow', {
		get() {
			if (typeof this._shouldAttackControllerNow === "undefined") {
				this._shouldAttackControllerNow =
					// Check to see if our nip count matches our preacher count.
					// Its possible someone made a road next to the controller, so preachers may not actually stand on a nip.
					(this.controller.nipsWalkable.length === CreepManager.getPreachersByFocusId(this.controller.id).filter(f => f.pos.getRangeTo(this.controller) <= 1).length)
					// Are we running out of time to perform our claim move?
					|| CreepManager.getPreachersByFocusId(this.controller.id).find(f => f.pos.getRangeTo(this.controller) <= 1 && (f.ticksToLive <= 2 || f.isDamaged))
					|| (this.controller.ticksToDowngrade < _.sum(CreepManager.getPreachersByFocusId(this.controller.id).filter(f => f.pos.getRangeTo(this.controller) <= 1), s=>s.attackControllerPower))
			}
			return this._shouldAttackControllerNow;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'sector', {
		get() {
			if (typeof this._sector === "undefined") {
				this._sector = Cartographer.getSector(this.name);
			}
			return this._sector;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isSectorClaimed', {
		get() {
			if (typeof this._isSectorClaimed === "undefined") {
				this._isSectorClaimed = GameManager.isSectorClaimed(this.name);
			}
			return this._isSectorClaimed;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'closestSpawnRoomName', {
		get() {
			if (typeof this._closestSpawnRoomName === "undefined") {
				this._closestSpawnRoomName = GameManager.getClosestSpawnRoomTo(this.name);
			}
			return this._closestSpawnRoomName;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'powerbankWorkerCost', {
		get() {
			if (typeof this._powerbankWorkerCost === "undefined") {
				this._powerbankWorkerCost = this.heap.powerbankWorkerCost;

				if (typeof this._powerbankWorkerCost === "undefined") {
					this.heap.powerbankWorkerCost = (
						(utils.getBodyCost(this.getBodyStriker()) * 3)
						+ (utils.getBodyCost(this.getBodyCardinal()) * 3)
						+ (utils.getBodyCost(this.getBodyBurro()) * 1)
						+ (utils.getBodyCost(this.getBodyWatchman()) * 1)
					);
					this._powerbankWorkerCost = this.heap.powerbankWorkerCost;
				}
			}
			return this._powerbankWorkerCost;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'powerbankWorkerValue', {
		get() {
			if (typeof this._powerbankWorkerValue === "undefined") {
				this._powerbankWorkerValue = this.powerbankWorkerCost * GameManager.getMarketValue(RESOURCE_ENERGY);
			}
			return this._powerbankWorkerValue;
		},
		configurable: true, enumerable: true,
	});

	// TODO: if a flag color changes the distance, this would need to be invalidated and recalculated.
	Object.defineProperty(Room.prototype, 'controllerRoomsInAutoAssaultRoomDistance', {
		get() {
			if (typeof this._controllerRoomsInAutoAssaultRoomDistance === "undefined") {
				this._controllerRoomsInAutoAssaultRoomDistance = this.heap.controllerRoomsInAutoAssaultRoomDistance;
				if (typeof this._controllerRoomsInAutoAssaultRoomDistance === "undefined") {
					this.heap.controllerRoomsInAutoAssaultRoomDistance = Cartographer.getRoomsInDistance(this.name, GameManager.autoAssaultRoomDistance).filter(f => Cartographer.isControllerRoom(f));
					this._controllerRoomsInAutoAssaultRoomDistance = this.heap.controllerRoomsInAutoAssaultRoomDistance;
				}
			}
			return this._controllerRoomsInAutoAssaultRoomDistance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'upgradeEnergyCreeps', {
		get() {
			if (typeof this._upgradeEnergyCreeps === "undefined") {
				// Any creep that is upgrade, or if they are a dedicated upgrader creep, gets free energy from us!
				let creeps = CreepManager.getGeneralUpgradeControllerCreepsByFocusId(this.controller.id);
				// Include oxen that may be around us at low levels.
				if (!this.myStorage) creeps = creeps.concat(CreepManager.getOxenByWorkRoom(this.name));
				// Include llamas always.
				creeps = creeps.concat(CreepManager.getLlamasByFocusId(this.controller.id));
				// Include pages once we have storage in place.
				if (this.myStorage) creeps = creeps.concat(CreepManager.getPagesByFocusId(this.controller.id));

				this._upgradeEnergyCreeps = creeps;
			}
			return this._upgradeEnergyCreeps;
		},
		configurable: true, enumerable: true,
	});

}
