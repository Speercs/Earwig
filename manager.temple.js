"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'isTempleCandidate', {
		get() {
			// Note this does NOT have to be my or have a claim flag in it yet.
			return !!FlagManager.templeFlags[this.name];
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isTemple', {
		get() {
			// Note this does NOT have to be my or have a claim flag in it yet.
			return !!FlagManager.templeFlags[this.name] && !!FlagManager.claimFlags[this.name] && this.my;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeTowerLevel', {
		get() {
			// We don't need a tower until we have storage.
			return this.storage ? 3 : 4;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Used by colony manager to build roads.
	 */
	Object.defineProperty(Room.prototype, 'isTempleAssist', {
		get() {
			if (typeof this._isTempleAssist === "undefined") {
				this._isTempleAssist = Cartographer.describeExitRooms(this.name).find(f => Game.rooms[f] && Game.rooms[f].isTempleCandidate && !Game.rooms[f].atMaxLevel) || null;
			}
			return this._isTempleAssist;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Used by colony manager to build roads.
	 */
	Object.defineProperty(Room.prototype, 'roomsAssistingTemple', {
		get() {
			if (typeof this._roomsAssistingTemple === "undefined") {
				this._roomsAssistingTemple = Cartographer.describeExitRooms(this.name).filter(f => Game.rooms[f] && Game.rooms[f].isCastle).map(m => Game.rooms[m]);
			}
			return this._roomsAssistingTemple;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomsAssistingTempleNeedMineral', {
		get() {
			if (typeof this._roomsAssistingTempleNeedMineral === "undefined") {
				this._roomsAssistingTempleNeedMineral = this.roomsAssistingTemple.filter(f => f.doesColonyNeedMineralMinerForRoomName(this.name))
			}
			return this._roomsAssistingTempleNeedMineral;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isTemplePreppedToRecycle', {
		get() {
			if (typeof this._isTemplePreppedToRecycle === "undefined") {
				// Long list of requirements to being the recycle process.
				this._isTemplePreppedToRecycle = !!(
					// No temple flag means do nothing.
					!FlagManager.notempleFlag

					&& this.atMaxLevel
					&& this.isTemple
					&& (
						!!FlagManager.autotempleFlag
						|| !!FlagManager.forcetempleFlag
					)
					&& !this.haltSpawning
					// Make sure we have castles next to us that will assist.
					&& this.roomsAssistingTemple.length

					&& (
						// Are we forcing over the harder requirements?
						!!FlagManager.forcetempleFlag

						|| (
							// Storage is full.
							this.isStorageFull

							// The terminal is full.
							&& this.isTerminalFull

							// Do the assisting rooms need our mineral?
							&& !this.roomsAssistingTempleNeedMineral.length

							// Are our empire resources at the required levels?
							&& GameManager.empirePreppedForTempleRoom
						)
					)
				);
			}
			return this._isTemplePreppedToRecycle;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isTempleNotPreppedToRecycleReasons', {
		get() {
			if (typeof this._isTempleNotPreppedToRecycleReasons === "undefined") {
				// Long list of requirements to being the recycle process.
				let reasons = [];

				if (FlagManager.notempleFlag) reasons.push('notemple');
				if (!FlagManager.autotempleFlag) reasons.push('autotemple');
				if (this.isGclAvailable) reasons.push('GCL available');
				if (!this.isStorageFull) reasons.push('storage energy');
				if (!this.isTerminalFull) reasons.push('terminal energy');
				if (this.roomsAssistingTempleNeedMineral.length) reasons.push('minerals:' + this.roomsAssistingTempleNeedMineral.map(m => m.print).join());
				if (!GameManager.atCreditMax) reasons.push('credits<' + GameManager.creditMax);
				if (!GameManager.isEmpireObjectiveGcl) reasons.push('objective:' + GameManager.empireObjective);
				if (!GameManager.empireEnergyAtTempleRoomLevel) reasons.push('empire energy')
				if (GameManager.empireUpgradeControllerBoostBelowStorageMinSortedArray.length) reasons.push('boosts:' + GameManager.empireUpgradeControllerBoostBelowStorageMinSortedArray.join())
				if (GameManager.empireMineralRawTypesBelowStorageMinSortedArray.length) reasons.push('minerals:' + GameManager.empireMineralRawTypesBelowStorageMinSortedArray.join())
				if (GameManager.empireFocusRooms.length) reasons.push('focus:' + GameManager.empireFocusRooms.join());

				this._isTempleNotPreppedToRecycleReasons = reasons;
			}
			return this._isTempleNotPreppedToRecycleReasons;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.unclaimTempleRoom = function() {
		// This is for level 8 rooms we are using to pump upgrades into controller to increase GCL.
		if (this.isTemplePreppedToRecycle) {
			// BE REALLY CAREFUL HERE!
			this.logRoom('unclaiming temple room...good luck!');
			this.controller.unclaim();
			if (FlagManager.forcetempleFlag) {
				FlagManager.forcetempleFlag.setColor(COLOR_WHITE);
			}
		}
	}

	Object.defineProperty(Room.prototype, 'idealTempleFlagPos', {
		get() {
			if (typeof this._idealTempleFlagPos === "undefined") {
				this._idealTempleFlagPos = this.heap.idealTempleFlagPos;

				if (typeof this._idealTempleFlagPos === "undefined") {
					if (this.controller) {
						// All posible positions in range 3 around the controller.
						let allPosRange3 = this.controller.posInRange3NonTerrainWallNotNearEdge;

						// Find the posible locations of our spawn -- exactly distance 3 from the controller, so 4 possible locations.
						// We are looking at distance 4 as this spot MUST be open to walk by, and we need it to test a full 21 positions.
						let spawnPositions4 = this.controller.posOfRange4NonTerrainWallNotNearEdge.filter(f => this.controller.pos.isDistance4(f));

						// Valid spawn locations need to have full positions for terminal and tower. 15/21 depending if you want all posible positions.
						spawnPositions4 = spawnPositions4.filter(spawnPos =>
							// Only care about this spot if we get a full 21 upgrade positions out of it.
							(allPosRange3.filter(f => f.inRange3(spawnPos)).length >= 21)
						);

						// Find the position that is one closer to the controller. Should only be 1.
						let spawnPositions3 = spawnPositions4.map(m => m.nips.find(f => this.controller.pos.isDistance3(f)));

						// Get the side with the most potential positions.
						this.heap.idealTempleFlagPos = _.sortBy(spawnPositions3, s => -allPosRange3.filter(f => s.inRange3(f)).length)[0] || null;
						this._idealTempleFlagPos = this.heap.idealTempleFlagPos;
					}
				}
				this._idealTempleFlagPos = this._idealTempleFlagPos ? utils.newPos(this._idealTempleFlagPos) : null;
			}
			return this._idealTempleFlagPos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeSpawnPos', {
		get() {
			if (typeof this._templeSpawnPos === "undefined") {
				// Spawn is the location of the flag.
				this._templeSpawnPos = FlagManager.templeFlagsAnyColor[this.name] ? FlagManager.templeFlagsAnyColor[this.name].flag.pos : null;
			}
			return this._templeSpawnPos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeStoragePos', {
		get() {
			if (typeof this._templeStoragePos === "undefined") {
				this._templeStoragePos = null;

				// We are putting the storage right next to our spawn, in line with the controller.
				let flagPos = this.idealTempleFlagPos;

				if (flagPos) {
					// All posible positions in range 2 around the controller.
					let allPosRange2 = this.controller.posOfRange2NonTerrainWallNotNearEdge;
					// The storage will be distance 1 from flag.
					this._templeStoragePos = allPosRange2.find(f => f.isDistance1(flagPos)) || null;
				}
			}
			return this._templeStoragePos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeTowerPos', {
		get() {
			if (typeof this._templeTowerPos === "undefined") {
				this._templeTowerPos = null;

				// We are putting the tower 2 away from the controller.
				let flagPos = this.idealTempleFlagPos;

				if (flagPos) {
					// All posible positions in range 2 around the controller.
					let allPosRange2 = this.controller.posOfRange2NonTerrainWallNotNearEdge;
					// Tower will be distance 3 from flag and distance 4 from controller.
					this._templeTowerPos = allPosRange2.find(f => f.isDistance3(flagPos) && f.isDistance4(this.controller.pos)) || null;
				}
			}
			return this._templeTowerPos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'templeTerminalPos', {
		get() {
			if (typeof this._templeTerminalPos === "undefined") {
				this._templeTerminalPos = null;

				// We are putting the terminal 2 away from the controller.
				let flagPos = this.idealTempleFlagPos;
				let towerPos = this.templeTowerPos;

				if (flagPos && towerPos) {
					// All posible positions in range 2 around the controller.
					let allPosRange2 = this.controller.posOfRange2NonTerrainWallNotNearEdge;
					// Tower will be distance 3 from flag and distance 4 from controller.
					this._templeTerminalPos = allPosRange2.find(f => f.isDistance3(flagPos) && f.isDistance4(this.controller.pos) && !f.isEqualTo(towerPos)) || null;
				}
			}
			return this._templeTerminalPos;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsJester', {
		get() {
			if (typeof this._colonyNeedsJester === "undefined") {
				this._colonyNeedsJester = false;

				if (
					this.isTemple
					&& this.storage
					&& !this.isJesterBanished
					// Once we can transfer into colonyTower1 or do terminal transfers into myTerminal, then we need jesters.
					&& (CreepManager.getJestersByFocusId(this.controller.id).length < (this.myColonyTower1 ? 1 : 0) + (this.myTerminal ? 2 : 0))
				) {
					// One per colony assigned to this room.
					this._colonyNeedsJester = true;
				}
            }
			return this._colonyNeedsJester;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'isJesterBanished', {
		get() {
			if (typeof this._isJesterBanished === "undefined") {
				this._isJesterBanished = false;

				if (
					this.isTemple
					&& this.atMaxLevel
					&& this.isStorageFull
					&& this.isTerminalFull
					&& !CreepManager.getTempleUpgradeControllerCreepsByFocusId(this.controller.id).length
				) {
					// One per colony assigned to this room.
					this._isJesterBanished = true;
				}
            }
			return this._isJesterBanished;
		},
		configurable: true, enumerable: true,
	});

	// There are three jester positions.
	Object.defineProperty(Room.prototype, 'colonyJesterPositions', {
		get() {
			if (typeof this._colonyJesterPositions === "undefined") {
				let xy = [];
				if (this.templeFlag && this.storage) {
					// Early levels will have tower.
					let colonyTower1 = this.myColonyTower1;
					if (colonyTower1) {
						let towerPos = this.storage.nips.find(f => f.isDistance1(colonyTower1) && f.isRange2(this.controller));
						xy.push(towerPos);
					}
					// Once terminal is up and active, need a jesters to pull from it into storage.
					if (this.myTerminal) {
						let terminalPos1 = this.terminal.nips.find(f => f.isDistance2(this.storage) && f.isRange3(this.controller));
						xy.push(terminalPos1);

                        let terminalPos2 = this.terminal.nips.find(f => f.isDistance1(this.storage));
						xy.push(terminalPos2);
					}
				}
				this._colonyJesterPositions = xy;
            }
			return this._colonyJesterPositions;
		},
		configurable: true, enumerable: true,
    });

	Room.prototype.getControllerPosTemple = function(includeEmptyStores) {
		let positions = [];
		if (this.isTemple) {
			let templeFlag = this.templeFlag;
			let colonyTower1 = this.myColonyTower1;
			let myTerminal = this.myTerminal;
			let colonyJesterPositions = this.colonyJesterPositions;

			// Must have storage to have anything going on here.
			if (this.storage) {
				positions = this.controllerPosInRange3NotBlockedByObject.filter(f =>
					// Has to be in range3 of our flag.
					(templeFlag && f.inRange3(templeFlag))

					// Find all initial spots around our stores.
					&& (
						((this.storage && (includeEmptyStores || this.storage.store.getUsedCapacity(RESOURCE_ENERGY))) ? f.isNearTo(this.storage) : false)
						// Need to have storage and jester to fill tower.
						|| ((this.storage && (includeEmptyStores || this.storage.store.getUsedCapacity(RESOURCE_ENERGY)) && colonyTower1) ? f.isNearTo(colonyTower1) : false)
						// All spots around our terminal are good.
						|| ((this.terminal && (includeEmptyStores || this.terminal.store.getUsedCapacity(RESOURCE_ENERGY))) ? f.isNearTo(this.terminal) : false)
					)

					// Save room for jester 1 above storage and tower1.
					//&& ((this.storage && colonyTower1) ? !(f.isDistance2(this.storage) && f.isDistance2(colonyTower1) && f.isRange3(this.controller)) : true)

					// Save room for jester 2 & 3 between storage and terminal.
					//&& ((this.storage && myTerminal && myTerminal.store.getUsedCapacity(RESOURCE_ENERGY)) ? !(f.isDistance1(this.storage) && f.isDistance1(myTerminal)) : true)
					//&& ((this.storage && myTerminal && myTerminal.store.getUsedCapacity(RESOURCE_ENERGY)) ? !(f.isDistance1(templeFlag) && f.isRange1(myTerminal)) : true)

					&& !colonyJesterPositions.find(jesterPos => jesterPos.isEqualTo(f))

					// Save room for movers and anyone who needs to pull from storage when we don't have a working terminal.
					// Do this on the tower side, only need 1 spot.
					//&& !(colonySpawn1 && this.storage && !myTerminal && f.isDistance1(colonySpawn1) && f.isDistance1(this.storage))
					&& !(colonyTower1 && (!myTerminal || (this.controller.level <= 6)) && f.isDistance1(templeFlag) && f.inRange1(this.storage) && f.isRange1(colonyTower1))
				)
			}
		}

		// If there is no spawn, then all spots will be available.
		if (!positions.length) {
			positions = this.controllerPosInRange3NotBlockedByObjectWithinPath;
		}

		return positions;
	}

    Object.defineProperty(Room.prototype, 'controllerPosTemple', {
        get() {
			if (typeof this._controllerPosTemple === "undefined") {
				this._controllerPosTemple = this.getControllerPosTemple(false);
            }
            return this._controllerPosTemple;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'controllerPosTempleDry', {
        get() {
			if (typeof this._controllerPosTempleDry === "undefined") {
				this._controllerPosTempleDry = this.getControllerPosTemple(true);
            }
            return this._controllerPosTempleDry;
        },
        configurable: true, enumerable: true,
    });

}
