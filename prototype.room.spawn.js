"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'colonyNeedsKing', {
		get() {
			if (typeof this._colonyNeedsKing === "undefined") {
				this._colonyNeedsKing = false;

				// There is a list of things we want in place before a king is needed.
				// Intentially using myStorage here instead of storage.
				if (
					this.colonyFlag
					&& this.claimFlag
					&& !this.unclaimFlag
					&& !this.king
					&& (
						(this.myStorage && !this.myStorage.isMisplaced)
						|| (this.myTerminal && !this.myTerminal.isMisplaced)
					)
				) {
					// One per colony assigned to this room.
					this._colonyNeedsKing = !CreepManager.getKingsByFocusId(this.controller.id).length
				}
            }
			return this._colonyNeedsKing;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsQueen', {
		get() {
			if (typeof this._colonyNeedsQueen === "undefined") {
				this._colonyNeedsQueen = false;

				// There is a list of things we want in place before a king is needed.
				if (
					this.colonyFlag
					&& this.claimFlag
					&& !this.unclaimFlag
					&& !this.queen
					&& this.colonySpawn2
					&& (
						(this.myStorage && !this.myStorage.isMisplaced && this.myStorage.store.getUsedCapacity(RESOURCE_ENERGY))
						|| (this.myTerminal && !this.myTerminal.isMisplaced && this.myTerminal.store.getUsedCapacity(RESOURCE_ENERGY))
					)
					&& this.colonyQueenTowers.length
				) {
					// One per colony assigned to this room.
					this._colonyNeedsQueen = !CreepManager.getQueensByFocusId(this.controller.id).length;
				}
            }
			return this._colonyNeedsQueen;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsRook', {
		get() {
			if (typeof this._roomNeedsRook === "undefined") {
				this._roomNeedsRook = false;

				// There is a list of things we want in place before a king is needed.
				if (
					this.colonyFlag
					&& this.claimFlag
					&& !this.unclaimFlag
					&& !this.rook
					&& (
						(this.myStorage && this.myStorage.store.getUsedCapacity(RESOURCE_ENERGY))
						|| (this.myStorage && this.king)
						|| (this.colonyContainer && this.colonyContainer.store.getUsedCapacity(RESOURCE_ENERGY))
					)
				) {
					// One per colony assigned to this room.
					this._roomNeedsRook = !CreepManager.getRooksByFocusId(this.controller.id).length;
				}
			}
			return this._roomNeedsRook;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * If there are construction sites, then we don't need as many peons
	 */
	Object.defineProperty(Room.prototype, 'roomPeonMultiplier', {
		get() {
			if (typeof this._roomPeonMultiplier === "undefined") {
				// If we have energy and are upgrading/repairing (slow) then we will need more peons.
				// Otherwise are we are building and that consumes energy quicker, so we don't need as many peons.
				this._roomPeonMultiplier = (this.storageEnergy && !this.myConstructionSites.length) ? Config.params.PEON_UPGRADE_MULTIPLIER : Config.params.PEON_BUILD_MULTIPLIER;
			}
			return this._roomPeonMultiplier;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomPeonNips', {
		get() {
			if (typeof this._roomPeonNips === "undefined") {
				// If we have energy and are upgrading/repairing (slow) then we will need more peons.
				// Otherwise are we are building and that consumes energy quicker, so we don't need as many peons.
				this._roomPeonNips = _.sum(this.sources.map(m => m.nips.length)) + this.sources.length;
			}
			return this._roomPeonNips;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPeon', {
		get() {
			if (typeof this._roomNeedsPeon === "undefined") {
				if (this.unclaimFlag || !this.claimFlag) {
					// This room is sleeping. No peons are needed at all.
					this._roomNeedsPeon = false;

				}
				else if (!GameManager.getSpawnsByRoomName(this.name).length) {
					// Something bad happened, make sure we have at least one peon going.
					// This falls under the CRITICAL PEON category.
					this._roomNeedsPeon = !!(
						(
							(!this.terminal || (this.terminal && !CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][this.controller.level]))
							&& ((CreepManager.getPeonWorkPartsByFocusId(this.controller.id) * this.roomPeonMultiplier) < this.roomSourcePower)
							// Do not exceed our actual nip count.
							&& (CreepManager.getPeonsByFocusId(this.controller.id).length < this.roomPeonNips)
						)
						|| (
							(this.terminal && CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][this.controller.level])
							&& (CreepManager.getPeonsNotDieingByFocusId(this.controller.id).length < Config.params.MAX_PEONS_PER_WORKROOM)
						)
					);

				}
				else if (this.rook || this.roomNeedsRook) {
					// Only need one rook/peon per room. Rooks are created once storage/colony container is created.
					this._roomNeedsPeon = false;

				}
				else if (this.isTemple) {
					// If we are a temple, then when not max level this room will have peons to harvest the sources. Some will be sent via roomNeedsPeonBuilder too.
					this._roomNeedsPeon = !this.atMaxLevel ? (CreepManager.getPeonWorkPartsByFocusId(this.controller.id) < this.roomSourcePower) : false;

				}
				else if (!this.hasEmpireChurchAssistance && !CreepManager.getPeasantsByFocusId(this.controller.id).length) {
					// While there are no peasants out, we can load up on peons.
					this._roomNeedsPeon =
						((CreepManager.getPeonWorkPartsByFocusId(this.controller.id) * this.roomPeonMultiplier) < this.roomSourcePower)
						// Do not exceed our actual nip count.
						&& (CreepManager.getPeonsByFocusId(this.controller.id).length < this.roomPeonNips)

				}
				else {
					// Want to have at least one peon in the room to handle any odds-and-ends.
					this._roomNeedsPeon = !CreepManager.getPeonsByFocusId(this.controller.id).length;

				}
			}
			return this._roomNeedsPeon;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'canCreateBestPeon', {
		get() {
			if (typeof this._canCreateBestPeon === "undefined") {
				this._canCreateBestPeon = this.getBodyPeon().length === GameManager.empireBestPeonBody.length
			}
			return this._canCreateBestPeon;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPeonBuilder', {
		get() {
			if (typeof this._roomNeedsPeonBuilder === "undefined") {
				// Need at least one peon. And only spawn if we are the highest room, unless we have NONE in our current room.
				// Another room will send a charity peon to us if we are a lower level room.
				this._roomNeedsPeonBuilder = (
					// We always want to spawn at least one best peon in our room at all times
					// with construction sites up even if this room isn't the highest room.
					// It might be that the highest level room is incapacitated.
					this.myConstructionSites.length

					// Flag check; don't send to unclaimed rooms.
					&& this.claimFlag
					&& !this.unclaimFlag

					// Don't send to temples. This is handled by the other peon routines.
					&& !this.isTemple

					// Keep a peon around for room maintenance below max level.
					&& (
						!CreepManager.getRooksByFocusId(this.controller.id).length

						// Prior to having storage, always send a peon to this room.
						|| !this.myStorage
						|| !this.myStorage.store.getUsedCapacity(RESOURCE_ENERGY)

						// Prior to having a terminal (and ability to make boosted creeps).
						|| !this.myTerminal
					)

					// The room can only produce so much power, do not exceed this.
					&& ((CreepManager.getPeonWorkPartsByFocusId(this.controller.id) * this.roomPeonMultiplier) < this.roomSourcePower)

					// Do not exceed our actual nip count.
					&& (CreepManager.getPeonsByFocusId(this.controller.id).length < this.roomPeonNips)

					// Temples only need a max of 1 peon for light road duty once storage and terminal are up.
					//&& (!this.isTemple || !this.storage || !this.terminal || !CreepManager.getPeonsByFocusId(this.controller.id).length)
				);
			}
			return this._roomNeedsPeonBuilder;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPeonBonus', {
		get() {
			if (typeof this._roomNeedsPeonBonus === "undefined") {
				this._roomNeedsPeonBonus = false;

				if (this.unclaimFlag || !this.claimFlag) {
					// This room is sleeping. No peons are needed at all.
					this._roomNeedsPeonBonus = false;

				}
				else if (this.myStorage) {
					// Once storage is up, builders/upgraders will take over duties, even for temples.
					this._roomNeedsPeonBonus = false;

				}
				else if (this.isTemple) {
					// Temples will have castle assistance, so horses will be sent.
					this._roomNeedsPeonBonus =
						// No or empty storage.
						(!this.storage || !this.storage.store.getUsedCapacity(RESOURCE_ENERGY))
						// Go up to our max peon count.
						&& (CreepManager.getPeonsNotDieingByFocusId(this.controller.id).length < Config.params.MAX_PEONS_PER_WORKROOM)

				}
				else if (this.isBestRoom || this.hasEmpireCastleAssistance) {
					// This the best room, no help is coming, only build what we can afford.
					this._roomNeedsPeonBonus =
						// Our storage is full.
						(!this.my || this.isStorageFull)

						// Obey overall max peon count.
						&& (CreepManager.getPeonsNotDieingByFocusId(this.controller.id).length < Config.params.MAX_PEONS_PER_WORKROOM)

						// We have no peons just sitting around.
						&& !CreepManager.getPeonsNotDieingByFocusId(this.controller.id).find(f => !f.store.getUsedCapacity() && f.isNapping) // f.isOnParkingSpot)

						// We have a reason to spawn...
						&& (
							(this.myConstructionSites.length && !CreepManager.getBuildersByFocusId(this.controller.id).length)

							// Don't exceed the power that the room can provide.
							|| (CreepManager.getPeonWorkPartsByFocusId(this.controller.id) < this.roomSourcePower)
						)

						// Don't go over our upgrade position locations (could be small or large value)
						&& (CreepManager.getPeonsNotDieingByFocusId(this.controller.id).length < this.controllerUpgradePositionsSorted.length)

				}
				else if (this.usingEmpireChurchAssistance) {
					// We will take as many bonus peons as this room can allow from its own sources.
					this._roomNeedsPeonBonus =
						((CreepManager.getPeonWorkPartsByFocusId(this.controller.id) * this.roomPeonMultiplier) < this.roomSourcePower)
						// Do not exceed our actual nip count.
						&& (CreepManager.getPeonsByFocusId(this.controller.id).length < this.roomPeonNips)

				}
			}
			return this._roomNeedsPeonBonus;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'canBuildBestPeons', {
		get() {
			if (typeof this._canBuildBestPeons === "undefined") {
				this._canBuildBestPeons = ((this.getBodyPeon({energy:this.energyCapacityAvailable}).length === this.getBodyPeon({energy:GameManager.empireHighestControllerEnergyCapacityAvailable}).length))
			}
			return this._canBuildBestPeons;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPeasant', {
		get() {
			if (typeof this._roomNeedsPeasant === "undefined") {
				// Test our peasant count against sources that have containers or links (so they aren't just harvesting and dropping)
				// and that peasants can actually be made at this room level.
				this._roomNeedsPeasant =
					// Don't harvest if our storage is full.
					!this.isStorageFull

					// We don't want low level peasants if we have helper peons in room.
					// Actually, this is WAY to hard to cordinate. After initial setup, let the room go and build on its own.
					// && (
					// 	this.isChurch
					// 	|| !this.usingEmpireChurchAssistance
					// )
					&& this.atSpawningEnergyCapacityForLevel(Config.params.COLONY_SOURCE_CONTAINER_LEVEL)

					&& (
						// At least one per source always.
						(CreepManager.getPeasantsNotDieingByFocusId(this.controller.id).length < this.sources.length)

						|| (
							// Do not exceed our total harvesting power.
							(_.sum(CreepManager.getPeasantsNotDieingByFocusId(this.controller.id).map(m => m.harvestSourcePower)) < this.roomSourcePower)

							// Do not exceed our actual nip count.
							&& (CreepManager.getPeasantsNotDieingByFocusId(this.controller.id).length < _.sum(this.sources.map(m => m.nips.length)))
						)
					)
			}
			return this._roomNeedsPeasant;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * The idea here is to create a llama for each peasant as the peasant is created.
	 * So the spawn would be Peasant -> Llama -> Peasant -> Llama.
	 */
	Object.defineProperty(Room.prototype, 'colonyNeedsLlamaBalance', {
		get() {
			if (typeof this._colonyNeedsLlamaBalance === "undefined") {
				this._colonyNeedsLlamaBalance =
					// Bypass this check at max level.
					!this.atMaxLevel

					// Once we have links on all sources, Llamas become irrelevant.
					&& (this.sources.length > this.sourceLinks.length)

					// Need to have storage in place for llamas to be effective. First room in early game gets llamas as well.
					//&& (this.myStorage || this.isBestRoom || this.colonyContainer)
					&& (this.myStorage || this.colonyContainer)

					// We may have preemptive peasant spawning once they get old and need replacement.
					&& (this.sources.length >= CreepManager.getPeasantsByFocusId(this.controller.id).length)

					// Early game balancing.
					&& ((CreepManager.getPeasantsByFocusId(this.controller.id).length - this.sourceLinks.length) > CreepManager.getLlamasByFocusId(this.controller.id).length)
			}
			return this._colonyNeedsLlamaBalance;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsLlamaPower', {
		get() {
			if (typeof this._colonyNeedsLlamaPower === "undefined") {
				this._colonyNeedsLlamaPower =
					// Bypass this check at max level.
					!this.atMaxLevel

					// Need to have storage in place for llamas to be effective. First room in early game gets llamas as well.
					//&& (this.myStorage || this.isBestRoom || this.colonyContainer)
					&& (this.myStorage || this.colonyContainer)

					// Have to have peasants to need llamas.
					&& CreepManager.getPeasantsByFocusId(this.controller.id).length

					// Test that we have enough llamas to cover the rooms needs.
					&& (CreepManager.getLlamaCarryCapacityByFocusId(this.controller.id) < this.carryCapacityNeededByColony)

					// Don't make any more if we have idle ones, either full or empty.
					&& !CreepManager.getLlamasByFocusId(this.controller.id).find(f => f.isOnParkingSpot)
			}
			return this._colonyNeedsLlamaPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsMineralMiner', {
		get() {
			if (typeof this._colonyNeedsMineralMiner === "undefined") {
				this._colonyNeedsMineralMiner = false;

				if (
					this.isBulwark
					&& this.isStorageEnergyMinimal
					&& this.colonyMineralExtractor
					&& this.doesColonyNeedMineralMinerForRoomName(this.name)
					&& RoomIntel.getMineralId(this.name)
					&& (CreepManager.getMinersByFocusId(RoomIntel.getMineralId(this.name)).length < (FlagManager.throttleFlag ? 1 :this.mineral.nips.length))
				) {
                    this._colonyNeedsMineralMiner = true;
				}
            }
			return this._colonyNeedsMineralMiner;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsGnome', {
		get() {
			if (typeof this._colonyNeedsGnome === "undefined") {
				this._colonyNeedsGnome = false;
				if (
					this.my
					&& this.storage
					&& this.controllerNeedsEnergy
					&& !CreepManager.getUpgradeControllerCreepsByFocusId(this.controller.id).length
					&& this.myControllerLink
					&& !this.unclaimFlag
					&& !this.isTemple
				) {
                    this._colonyNeedsGnome = true;
				}
            }
			return this._colonyNeedsGnome;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsFencer', {
		get() {
			if (typeof this._colonyNeedsFencer === "undefined") {
				this._colonyNeedsFencer = false;
				if (
					this.my
					&& !this.safeMode
					&& !this.myStorage
					&& this.colonyBreachedByPlayerTime
					&& (CreepManager.getFencersByFocusId(this.controller.id).length < this.controller.nips.length)
				) {
                    this._colonyNeedsFencer = true;
				}
            }
			return this._colonyNeedsFencer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'controllerTransferPower', {
		get() {
			if (typeof this._controllerTransferPower === "undefined") {
				// Since we don't have the actual path length, guestimate by taking range to storage, times 2 way walking, plus a fudge for weird path lengths.
				let storagePos = this.storage || this.colonyContainer || this.colonyFlag;
				this._controllerTransferPower =
					(CreepManager.getPageCarryCapacityByFocusId(this.controller.id) / (this.controller.pos.getRangeTo(storagePos) * (2 + Config.params.PAGE_OFFSET_NORMAL_PERCENT)))
					+ this.myControllerLinkPower;
			}
			return this._controllerTransferPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPage', {
		get() {
			if (typeof this._roomNeedsPage === "undefined") {
				if (this.unclaimFlag || !this.colonyFlag) {
					// This room is sleeping. No creeps are needed at all.
					this._roomNeedsPage = false;
				}
				else if (
					!this.atMaxLevel
					&& this.storage
					&& !this.isTemple
					&& CreepManager.getUpgradeControllerCreepsByFocusId(this.controller.id).length
					&& this.controllerContainers.length
					&& (
						// Have at least one page just in case we get an upgrade parking away from link.
						!CreepManager.getPagesByFocusId(this.controller.id).length
						|| (this.controllerTransferPower < CreepManager.getUpgradeControllerCreepWorkPartsByFocusId(this.controller.id))
					)
				) {
					// If any of our containers is empty, that means we aren't filling them up fast enough.
					this._roomNeedsPage = true;
				}
				else {
					this._roomNeedsPage = false;
				}
			}
			return this._roomNeedsPage;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPaladin', {
		get() {
			if (typeof this._roomNeedsPaladin === "undefined") {
				this._roomNeedsPaladin = !!(
					// Owned rooms would never get an invader core.
					!this.owner
					// Has to be a controller room to get an invader core.
					&& this.controller

					// Don't send while room is lethal to us.
					&& !RoomIntel.getLethalRoom(this.name)

					// This is the trigger that a paladin is needed.
					&& RoomIntel.getInvaderCore(this.name)
					&& this.invaderCore
					&& !this.invaderCore.ticksToDeploy

					&& (CreepManager.getPaladinsByFocusId(this.invaderCore.id).length < Config.params.MAX_PALADIN_PER_WORKROOM)
					&& (this.invaderStructureHits > CreepManager.getPaladinAttackPowerByFocusId(this.invaderCore.id))
				)
			}
			return this._roomNeedsPaladin;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsCarpenter', {
		get() {
			if (typeof this._roomNeedsCarpenter === "undefined") {
				this._roomNeedsCarpenter = false;
				if (
					// Obviously has to be room owned by me.
					this.my

					// Temples are excluded.
					&& !this.isTemple

					// Level requirement.
					&& this.myStorage

					// Energy requirements.
                    && this.isStorageEnergyMinimal

					// Are builders tuned off?
                    && !this.noBuilder

					// Obey overall creep count.  This is very high number, just to prevent massive overflowing.
					&& this.belowBuilderCreepMax

					// Either we have barriers that need to be upgraded,
					// Or we have construction sites and ample energy to spair (or only have rooks).
					&& (
						// Placeholder
						false

						// Need at least one builder if we have construction sites, or extra builders if current one isn't enough.
						// Assume that the carpenter will only use about 50% of his time building.
						|| (!CreepManager.getConstructorsByFocusId(this.controller.id).length && this.myConstructionSitesProgressRemaining)
						|| (
							(this.myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps > this.carpenterBuildPower)
							// Temples don't build walls so don't worry about that.
							&& (this.isTemple || this.isConstructorCountBelowConstructionSites)
						)

						// Need at least one builder if we have walls to repair, or extra repairers if current one isn't enough.
						|| (
							RoomIntel.getHasBarrierBelowThreshhold(this.name)
							&& (
								(!CreepManager.getConstructorsByFocusId(this.controller.id).length && this.barrierHitsBelowRepairThreshhold)
								|| ((this.myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps > this.carpenterRepairPower) && this.isConstructorCountBelowBarriersBelowWorkerRepairThreshhold)
								|| (this.myTerminal && !GameManager.empireFocusRooms.length && ((this.myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps > this.carpenterRepairPower) && this.isConstructorCountBelowBarriersBelowRepairThreshhold))

								// Need at least one builder if we have nuke barriers to repair, or extra repairers if current one isn't enough.
								|| (!CreepManager.getConstructorsByFocusId(this.controller.id).length && this.nukeBarrierHitsBelowRepairThreshhold)
								|| (
									(this.myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps > this.carpenterRepairPower)
									&& (CreepManager.getConstructorsByFocusId(this.controller.id).length < (this.nukeBarriersBelowRepairThreshhold.length * Config.params.MAX_BUILDERS_PER_NUKE))
								)
							)
						)

						// Do we have nukes inbound?
						|| (GameManager.shouldSpawnNukeBuilders(this.name) && (CreepManager.getConstructorsByFocusId(this.controller.id).length < Config.params.MAX_BUILDERS_PER_NUKE))

						// Are we missing core structures?
						|| (!FlagManager.throttleFlag && !CreepManager.getConstructorsByFocusId(this.controller.id).length && this.roomMissingStructure)

						// Does this room have reserved rooms with construction sites?
						|| (
							this.shouldCreateSourceTrails
							// Look for builders in our room or in other reserve rooms.
							// If we find one, then we should be spawning a new one.
							&& (this.reserveRoomNamesWithConstructionSiteProgressRemainingAfterCurrentConstructorCreeps > this.carpenterBuildPower)
						)
					)
				) {
                    this._roomNeedsCarpenter = true;
				}
            }
			return this._roomNeedsCarpenter;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsCarpenter', {
		get() {
			if (typeof this._colonyNeedsCarpenter === "undefined") {
				// We may get a stray build request. If we can build creeps as good as our best room,
				// try to take care of it initially with a builder from our own spawn.
				if (
					!CreepManager.getConstructorsByFocusId(this.controller.id).length
					&& (this.getBodyCarpenter().length === GameManager.empireHighestControllerRoom.getBodyCarpenter().length)
				) {
                    this._colonyNeedsCarpenter = false;
				}
				// Otherwise determine if we need another carpenter.
				else {
					this._colonyNeedsCarpenter = this.roomNeedsCarpenter;
				}
            }
			return this._colonyNeedsCarpenter;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsMason', {
		get() {
			if (typeof this._roomNeedsMason === "undefined") {
				this._roomNeedsMason = false;
				if (
					// Obviously has to be room owned by me.
					this.my

					// Temples are excluded.
					&& !this.isTemple

					// Level requirement.
					&& this.myStorage

					// Energy requirements.
                    && this.isStorageEnergyNormal

					// Are builders tuned off?
                    && !this.noBuilder

					// Obey overall creep count. This is very high number, just to prevent massive overflowing.
					&& this.belowBuilderCreepMax

					// Either we have barriers that need to be upgraded,
					// Or we have construction sites and ample energy to spair (or only have rooks).
					&& (
						// Placeholder
						false

						|| (
							// Need to have spawned at least one prior builder creep first, as they can do the job for small build jobs.
							(this.myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps > this.carpenterBuildPower)
							&& (this.myConstructionSitesProgressRemainingAfterCurrentConstructorCreeps > this.masonBuildPower)
						)

						|| (
							RoomIntel.getHasBarrierBelowThreshhold(this.name)
							&& (
								// Need at least one builder if we have walls to repair, or extra repairers if current one isn't enough.
								(!CreepManager.getConstructorsByFocusId(this.controller.id).length && this.barrierHitsBelowRepairThreshhold)
								|| ((this.myBarrierHitsBelowWorkerRepairThreshholdAfterCurrentConstructorCreeps > this.masonRepairPower) && this.isConstructorCountBelowBarriersBelowWorkerRepairThreshhold)
								|| (this.myTerminal && !GameManager.empireFocusRooms.length && ((this.myBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps > this.masonRepairPower) && this.isConstructorCountBelowBarriersBelowRepairThreshhold))

								// Need at least one builder if we have nuke barriers to repair, or extra repairers if current one isn't enough.
								|| (!CreepManager.getConstructorsByFocusId(this.controller.id).length && this.nukeBarrierHitsBelowRepairThreshhold)
								|| (
									(this.myNukeBarrierHitsBelowRepairThreshholdAfterCurrentConstructorCreeps > this.masonRepairPower)
									&& (CreepManager.getConstructorsByFocusId(this.controller.id).length < (this.nukeBarriersBelowRepairThreshhold.length * Config.params.MAX_BUILDERS_PER_NUKE))
								)
							)
						)

						// Do we have nukes inbound?
						|| (GameManager.shouldSpawnNukeBuilders(this.name) && (CreepManager.getConstructorsByFocusId(this.controller.id).length < Config.params.MAX_BUILDERS_PER_NUKE))
					)
				) {
                    this._roomNeedsMason = true;
				}
            }
			return this._roomNeedsMason;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsMason', {
		get() {
			if (typeof this._colonyNeedsMason === "undefined") {
				// We may get a stray build request. If we can build creeps as good as our best room,
				// try to take care of it initially with a builder from our own spawn.
				if (
					!CreepManager.getConstructorsByFocusId(this.controller.id).length
					&& (this.getBodyMason().length === GameManager.empireHighestControllerRoom.getBodyMason().length)
				) {
                    this._colonyNeedsMason = false;
				}
				// Otherwise determine if we need another carpenter.
				else {
					this._colonyNeedsMason = this.roomNeedsMason;
				}
            }
			return this._colonyNeedsMason;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsClerk', {
		get() {
			if (typeof this._colonyNeedsClerk === "undefined") {
				this._colonyNeedsClerk = false;
				if (
					this.my
                    && this.terminal
					&& (this.terminal.store.getUsedCapacity(RESOURCE_GHODIUM) >= SAFE_MODE_COST)
					&& (
						// Temples only need one safe mode, don't bother with more than that as it gets wasted on recycle.
						!this.hasOneSafeModesAvailable
						|| (!this.isTemple && !this.hasMaxSafeModesAvailable)
					)
					&& !CreepManager.getClerksByFocusId(this.controller.id).length

					// Controller upgrade creeps get in the way.
					&& !CreepManager.getUpgradeControllerCreepsByFocusId(this.controller.id).length

					// Need a spot right next to the controller.
					&& this.controller.nipsFree.length
				) {
                    this._colonyNeedsClerk = true;
				}
            }
			return this._colonyNeedsClerk;
		},
		configurable: true, enumerable: true,
	});

	// Seasonal.
	Object.defineProperty(Room.prototype, 'colonyNeedsEngineer', {
		get() {
			if (typeof this._colonyNeedsEngineer === "undefined") {
				this._colonyNeedsEngineer = false;
				let reactor = RoomIntel.getMyReactor(Cartographer.getSectorCoreRoom(this.name)) ? Game.getObjectById(RoomIntel.getMyReactor(Cartographer.getSectorCoreRoom(this.name))) : null;

				if (
					this.my
                    && this.myTerminal
					&& this.myTerminal.store.getUsedCapacity(C.RESOURCE_THORIUM)

					// The only room that will be sending engineers is the season flag room.
					&& FlagManager.season5Flag
					&& (FlagManager.season5Flag.pos.roomName === this.name)

					// Don't send if we have hostiles in the way.
					//&& !GameManager.doesRoomHaveLethalHostilesInRoute(this.name, Cartographer.getSectorCoreRoom(this.name))

					&& (
						// We have plenty of thorium in the bank.
						(this.myTerminal.store.getUsedCapacity(C.RESOURCE_THORIUM) > MINERAL_DENSITY[4])

						// We need to run out of thorium in all rooms that currently have mines going before we send our engineers out.
						|| !GameManager.empireTerminals.find(f => f.room.thorium && f.room.thorium.mineralAmount)

						// Need to check to see if the reactor has continuousWork going, that is the real indicator of to send engineer in conjunction with above logic.
						// Send when we are getting low on thorium.
						|| (
							reactor
							&& reactor.store.getUsedCapacity(C.RESOURCE_THORIUM)
							&& (reactor.store.getUsedCapacity(C.RESOURCE_THORIUM) < 900)
						)
					)

					// One engineer per sector reactor...yes?
					&& !CreepManager.getEngineersByWorkRoom(Cartographer.getSectorCoreRoom(this.name)).length
				) {
                    this._colonyNeedsEngineer = true;
				}
            }
			return this._colonyNeedsEngineer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsHorse', {
		get() {
			if (typeof this._colonyNeedsHorse === "undefined") {
				this._colonyNeedsHorse =
					!this.myTerminal
					&& (!this.storage || !this.isStorageFull)
					&& GameManager.empireCastleRooms.length
					&& (
						// Mid level rooms and temples will have storage, and we can simply target for half full storage. That gives everyone enough buffer to keep running.
						(this.storage && (this.isTemple ? !this.isStorageEnergyQuarterFull : !this.isStorageEnergyHalfFull))

						// Have at least one horse going while we don't have a terminal.
						// Careful with temples since there are typically no place for them to go.
						|| (!CreepManager.getHorsesByFocusId(this.controller.id).length && (!this.isTemple || this.myStorage))

						// Low level rooms that don't have storage are relying on transporters, we will need to match the energy useage of the transporters directly with the workers.
						|| (!this.storage && (this.myCreepsWorkParts * CARRY_CAPACITY * 1 * (Cartographer.findRouteDistance(GameManager.getClosestCastleRoomTo(this.name), this.name)) > CreepManager.getHorseCarryCapacityByFocusId(this.controller.id)))

						// For very early bootstrapping of rooms, we want to start spawning a horse for every peon at least.
						|| (!this.my && (!this.storage || (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) <= 0)) && (CreepManager.getHorsesByFocusId(this.controller.id).length < CreepManager.getPeonsByFocusId(this.controller.id).length))
					)
					&& (CreepManager.getHorsesByFocusId(this.controller.id).length < Math.min(Cartographer.findRoomDistance(GameManager.getClosestCastleRoomTo(this.name), this.name) * Config.params.MAX_HORSES_PER_DISTANCE, Config.params.MAX_HORSES_PER_WORKROOM))
            }
			return this._colonyNeedsHorse;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsDiviner', {
		get() {
			if (typeof this._roomNeedsDiviner === "undefined") {
				this._roomNeedsDiviner = false
				if (
					this.atSpawningEnergyCapacityForLevel(6)
                    && this.colonyNeedsDiviner
				) {
					this._roomNeedsDiviner = true;
				}
			}
			return this._roomNeedsDiviner;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsOracle', {
		get() {
			if (typeof this._roomNeedsOracle === "undefined") {
				this._roomNeedsOracle = false
				if (
					this.atSpawningEnergyCapacityForLevel(6)
					&& this.colonyNeedsOracle
				) {
					this._roomNeedsOracle = true;
				}
			}
			return this._roomNeedsOracle;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyNeedsDiviner', {
		get() {
			if (typeof this._colonyNeedsDiviner === "undefined") {
				this._colonyNeedsDiviner = false
				if (
					this.isTemple
					&& !FlagManager.notempleFlag
					&& this.myTerminal
                    && this.roomNeedsCharityUpgrader
				) {
					this._colonyNeedsDiviner = true;
				}
			}
			return this._colonyNeedsDiviner;
		},
		configurable: true, enumerable: true,
	});

	// Oracles are used to quickly get back to level 6 and enable the terminal.
	// This helps prevent horses from spawning and sucking up more energy and cpu.
	// Once we have a terminal, switch to diviners to save on boost mats.
	Object.defineProperty(Room.prototype, 'colonyNeedsOracle', {
		get() {
			if (typeof this._colonyNeedsOracle === "undefined") {
				this._colonyNeedsOracle = false
				if (
					this.isTemple
					&& !FlagManager.notempleFlag
					&& (
						!this.myTerminal
						|| FlagManager.rushgclFlag
					)
					&& this.roomNeedsCharityUpgrader
					// Once we hit level 7, don't send boosted creeps near the end to prevent waste of materials.
					&& ((this.level !== 7) || (this.controller.progressRemaining > (this.controller.progressTotal * Config.params.TEMPLE_BOOSTED_UPGRADER_PERCENT)))
				) {
					this._colonyNeedsOracle = true;
				}
			}
			return this._colonyNeedsOracle;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsCrier', {
		get() {
			if (typeof this._roomNeedsCrier === "undefined") {
				this._roomNeedsCrier = false;
				if (
					this.my
					&& this.atSpawningEnergyCapacityForCurrentLevel

					// Did we turn off upgrades?
					&& !FlagManager.noupgradeFlag

					// We are low level, or empire is focusing on gcl, or we have abundant controller boost.
					&& (
						!this.atMaxLevel
						|| GameManager.isEmpireObjectiveGcl

						// This is peak end game here, where we are probably focusing on gpl but have excess cash left over AFTER selling energy and processing power.
						|| (this.isStorageEnergyDump && GameManager.atCreditMax)
					)

					// Level criteria.
					&& (
						!this.atMaxLevel
						|| (
							// If we have CPU to burn at level 8 and all walls are built (meaning no peons will be upgrading)
							// then create one (limited size) crier.
							!CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length
							//&& !this.hasBarrierBelowWorkerRepairThreshhold
						)
					)

					// Energy requirements...max, non-max, and rooms with no assistance.
					&& (
						(this.atMaxLevel && this.myStorage && this.isStorageEnergyControllerLinkUpgrade && !CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length)
						|| (!this.atMaxLevel && this.storage && !this.myStorage && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy))
						|| (!this.atMaxLevel && this.myStorage && this.isStorageEnergyControllerLinkUpgrade && (this.myControllerLinkPower >= (CreepManager.getUpgradeControllerCreepWorkPartsByFocusId(this.controller.id) + this.crierWorkParts)))
						|| (!this.atMaxLevel && this.myStorage && !this.myTerminal && this.isStorageEnergyAbundant && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy))
						|| (!this.atMaxLevel && this.myStorage && this.myTerminal && this.isStorageEnergyNormal && (this.myUpgradeControllerCreepWorkPartsTTL < GameManager.empireEnergyTerminalsOverEnergyMinimal))
						|| (!this.atMaxLevel && !this.myStorage && this.isStorageFull)
						|| (!this.atMaxLevel && !this.myStorage && !this.controllerStores.find(f => f.store.getUsedCapacity(RESOURCE_ENERGY) < (f.store.getCapacity(RESOURCE_ENERGY) * Config.params.CONTROLLER_CONTAINER_UPGRADER_PERCENT)))
					)

					// At level 7, we don't need to keep spawning new upgraders if we are getting close to level up.
					&& (
						(this.level !== 7)
						|| (this.myUpgradeControllerCreepWorkPartsTTL < this.controller.progressRemaining)
					)

					// Obey overall cap.
					&& (CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length < this.controllerUpgradePositionsSorted.length)

					// Don't fight for resources with masons.
					&& (
						!this.myConstructionSites.length
						|| (this.controllerNeedsEnergy && !CreepManager.getGeneralUpgradeControllerCreepsByFocusId(this.controller.id).length)
					)

					// Make sure we have something to pull energy from.
					// Always a chance something is wrong with feeding the controller energy.
					&& ((this.atMaxLevel && this.myControllerLink) || this.controllerStores.length)
				) {
                    this._roomNeedsCrier = true;
				}
            }
			return this._roomNeedsCrier;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasAbundantUpgradeControllerBoost', {
		get() {
			if (typeof this._hasAbundantUpgradeControllerBoost === "undefined") {
				// TODO: Not smart enough to account for a powered controller.
				this._hasAbundantUpgradeControllerBoost = !!(
					this.myTerminal
					&& (this.myTerminal.store.getUsedCapacity(C.BOOST_COMPOUNDS[C.BOOST_UPGRADECONTROLLER]) > Config.params.TERMINAL_STORE_MAX + (CONTROLLER_MAX_UPGRADE_PER_TICK * LAB_BOOST_MINERAL))
					&& !GameManager.empireFungiblesBelowMinSortedHash[C.BOOST_COMPOUNDS[C.BOOST_UPGRADECONTROLLER]]
				);
			}
			return this._hasAbundantUpgradeControllerBoost;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsProphet', {
		get() {
			if (typeof this._roomNeedsProphet === "undefined") {
				this._roomNeedsProphet = false;
				if (
					this.my
					&& this.atSpawningEnergyCapacityForCurrentLevel

					// Need a terminal for these types. Peons will be used before terminal.
					&& this.myTerminal

					// Did we turn off upgrades?
					&& !FlagManager.noupgradeFlag

					// If we are conserving lab cooldowns, then only go if the time left is less than a prophet time to live.
					&& (
						!FlagManager.conservelabFlag
						|| (this.colonyLab2 && ((this.colonyLab2.cooldown || 0) < CREEP_LIFE_TIME - Config.params.UNBOOST_MIN_TTL))
						|| (this.colonyLab1 && ((this.colonyLab1.cooldown || 0) < CREEP_LIFE_TIME - Config.params.UNBOOST_MIN_TTL))
					)

					// We are low level, or empire is focusing on gcl, or we have abundant controller boost.
					&& (
						!this.atMaxLevel
						|| (GameManager.isEmpireObjectiveGcl && FlagManager.rushgclFlag)
						// Use if we have plent of boost, reguardless of flags.
						|| this.hasAbundantUpgradeControllerBoost
					)

					// Level criteria.
					&& (
						!this.atMaxLevel
						|| (
							// If we have CPU to burn at level 8 and all walls are built (meaning no peons will be upgrading)
							// then create one (special size) crier.
							!CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length
							//&& !this.hasBarrierBelowRepairThreshhold
						)
					)

					// Energy requirements...max, non-max, and rooms with no assistance.
					&& (
						(this.atMaxLevel && this.myStorage && this.isStorageEnergyControllerLinkUpgrade && !CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length)
						|| (!this.atMaxLevel && this.storage && !this.myStorage && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy))
						|| (!this.atMaxLevel && this.myStorage && this.isStorageEnergyControllerLinkUpgrade && (this.myControllerLinkPower >= (CreepManager.getUpgradeControllerCreepWorkPartsByFocusId(this.controller.id) + this.prophetWorkParts)))
						|| (!this.atMaxLevel && this.myStorage && !this.myTerminal && this.isStorageEnergyAbundant && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy))
						|| (!this.atMaxLevel && this.myStorage && this.myTerminal && this.isStorageEnergyNormal && (this.myUpgradeControllerCreepWorkPartsTTL < GameManager.empireEnergyTerminalsOverEnergyMinimal))
						|| (!this.atMaxLevel && !this.myStorage && this.isStorageFull)
						|| (!this.atMaxLevel && !this.myStorage && !this.controllerStores.find(f => f.store.getUsedCapacity(RESOURCE_ENERGY) < (f.store.getCapacity(RESOURCE_ENERGY) * Config.params.CONTROLLER_CONTAINER_UPGRADER_PERCENT)))
					)

					// At level 7, we don't need to keep spawning new upgraders if we are getting close to level up.
					&& (
						(this.level !== 7)
						|| (this.myUpgradeControllerCreepWorkPartsTTL < this.controller.progressRemaining)
					)

                    // Once we hit level 7, don't send boosted creeps near the end to prevent waste of materials.
                    && ((this.level !== 7) || (this.controller.progressRemaining > (this.controller.progressTotal * 0.1)))

					// Obey overall cap.
					&& (CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length < this.controllerUpgradePositionsSorted.length)

					// Is this room capable of boosting, and do we have ample enough in the colony to do this?
					&& this.hasBoostStructures
					&& this.canBoostBodyProphet()

					// Don't fight for resources with builders.
					&& (
						!this.myConstructionSites.length
						|| (this.controllerNeedsEnergy && !CreepManager.getGeneralUpgradeControllerCreepsByFocusId(this.controller.id).length)
					)

					// Make sure we have something to pull energy from.
					// Always a chance something is wrong with feeding the controller energy.
					&& ((this.atMaxLevel && this.myControllerLink) || this.controllerStores.length)
				) {
                    this._roomNeedsProphet = true;
				}
            }
			return this._roomNeedsProphet;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsCharityUpgrader', {
		get() {
			if (typeof this._roomNeedsCharityUpgrader === "undefined") {
				this._roomNeedsCharityUpgrader = false;
				if (
					// Basic requirements.
					this.colonyNeedsUpgradeControllerAssistance

					// Did we turn off upgrades? Temples are excluded from this check.
					&& (
						!FlagManager.noupgradeFlag
						|| this.isTemple
					)

					// Has to have castle assistance to get upgraders.
					&& this.hasEmpireCastleAssistance

					// Energy requirements
					&& (
						(this.storage && !this.myStorage && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy))
						|| (this.myStorage && !this.myTerminal && this.isStorageEnergyAbundant && (this.myUpgradeControllerCreepWorkPartsTTL < this.storageEnergy + CreepManager.getHorseCarryCapacityByFocusId(this.controller.id)))
						|| (this.myStorage && this.myTerminal && this.isStorageEnergyAbundant && (this.myUpgradeControllerCreepWorkPartsTTL < GameManager.empireEnergyTerminalsOverEnergyMinimal))
					)

					// At level 7, we don't need to keep spawning new upgraders if we are getting close to level up.
					&& (
						(this.level !== 7)
						|| (this.myUpgradeControllerCreepWorkPartsTTL < this.controller.progressRemaining)
					)

					// Obey overall cap.
					// Unlike crier/prophets this will spawn new upgraders while existing ones are in the process of dieing off.
					&& (CreepManager.getUpgradeControllerCreepsNotNeedingReplacementByFocusId(this.controller.id).length < this.controllerUpgradePositionsSorted.length)

					// Don't fight for resources with masons.
					&& (
						!this.myConstructionSites.length
						|| this.isTemple
						|| this.isStorageEnergyDump
						|| this.controllerNeedsEnergy
					)

					// Make sure we have something to pull energy from.
					// Always a chance something is wrong with feeding the controller energy.
					&& this.controllerStores.length

					// If we have hostiles inside our walls, this room is screwed.
					&& !this.colonyBreached
				) {
                    this._roomNeedsCharityUpgrader = true;
				}
            }
			return this._roomNeedsCharityUpgrader;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsCollier', {
		get() {
			if (typeof this._roomNeedsCollier === "undefined") {
				this._roomNeedsCollier = !!(
					!this.my
					&& !this.safeMode

					// Don't send while room is dangerous.
					&& !RoomIntel.getStrongholdInvaderCoreHitsByRoomName(this.name)

					// Can we use a preacher to clean the room? Then we don't need a dismantler.
					&& !this.canRoomBeClaimed

					// Don't spawn colliers if we have sappers in room, they will just block spots.
					&& !CreepManager.getSappersByWorkRoom(this.name).length

					// Creep limit.
					&& (CreepManager.getColliersByWorkRoom(this.name).length < Config.params.MAX_COLLIER_PER_WORKROOM)

					// Do we have more hits than currently can be dismantled.
					&& (CreepManager.getDismantlersLifetimeDismantlePowerByWorkRoom(this.name) < Math.max(this.importantDismantlableHostileStructureHits, this.dismantlableInvaderStructureHits, this.destroyFlagHits))
				)
			}
			return this._roomNeedsCollier;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsSapper', {
		get() {
			if (typeof this._roomNeedsSapper === "undefined") {
				this._roomNeedsSapper = !!(
					!this.my
					&& !this.safeMode

					// Don't send to non-controller room (like SK strongholders, etc)
					&& this.controller

					// Can we use a preacher to clean the room? Then we don't need a dismantler.
					&& !this.canRoomBeClaimed

					// Creep limit.
					&& (CreepManager.getSappersByWorkRoom(this.name).length < Config.params.MAX_SAPPER_PER_WORKROOM)

					// Do we have more hits than currently can be dismantled.
					&& (CreepManager.getDismantlersLifetimeDismantlePowerByWorkRoom(this.name) < Math.max(this.importantDismantlableHostileStructureHits, this.dismantlableInvaderStructureHits, this.destroyFlagHits))
				)
			}
			return this._roomNeedsSapper;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsPikeman', {
		get() {
			if (typeof this._roomNeedsPikeman === "undefined") {
				this._roomNeedsPikeman = !!(
					this.controller
					&& !this.safeMode
					&& this.myManagement

					// Our towers can't overcome the healing power of player hostiles.
					&& (
						RoomIntel.getLethalHostilesTTL(this.name)
						&& this.dangerousBoostedPlayerHostiles.length
						&& (this.friendlyTowerDamagePower <= this.hostileHealPower)
					)

					// Creep limit.
					&& (CreepManager.getPikemenByWorkRoom(this.name).length < Config.params.MAX_PIKEMAN_PER_WORKROOM)

					// Do we have the mats to boost this creep?
					&& this.canBoostBodyPikeman()
				)
			}
			return this._roomNeedsPikeman;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'roomNeedsCrossbowman', {
		get() {
			if (typeof this._roomNeedsCrossbowman === "undefined") {
				this._roomNeedsCrossbowman = !!(
					this.controller
					&& !this.safeMode
					&& this.myManagement

					// Our towers can't overcome the healing power of player hostiles.
					&& (
						RoomIntel.getLethalHostilesTTL(this.name)
						&& this.dangerousBoostedPlayerHostiles.length
						&& (this.friendlyTowerDamagePower <= this.hostileHealPower)
					)

					// Creep limit.
					&& (CreepManager.getCrossbowmenByWorkRoom(this.name).length < Config.params.MAX_CROSSBOWMAN_PER_WORKROOM)

					// Do we have the mats to boost this creep?
					&& this.canBoostBodyCrossbowman()
				)
			}
			return this._roomNeedsCrossbowman;
		},
		configurable: true, enumerable: true,
	});

}