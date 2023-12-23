"use strict";

module.exports = function() {

    PowerCreep.prototype.powerLevel = function(power) {
        return this.powers[power] ? this.powers[power].level : 0;
    }

    PowerCreep.prototype.commitHaraKiri = function() {
        console.log('🔫 ' + this.name + ' @ ' + this.room.print + ' (' + this.pos.x + ',' + this.pos.y + ') has committed suicide!');
        this.suicide();
    }

	Object.defineProperty(Room.prototype, 'powerCreepGhost', {
		get() {
			if (typeof this._powerCreepGhost === "undefined") {
				this._powerCreepGhost = (
                    FlagManager.powercreepFlags[this.name]
                    && Game.powerCreeps[FlagManager.powercreepFlags[this.name].name]
                ) ? Game.powerCreeps[FlagManager.powercreepFlags[this.name].name] : null;
			}
			return this._powerCreepGhost;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'powerCreep', {
		get() {
			if (typeof this._powerCreep === "undefined") {
				this._powerCreep = (
                    FlagManager.powercreepFlags[this.name]
                    && Game.powerCreeps[FlagManager.powercreepFlags[this.name].name]
                    && Game.powerCreeps[FlagManager.powercreepFlags[this.name].name].pos
                ) ? Game.powerCreeps[FlagManager.powercreepFlags[this.name].name] : null;
			}
			return this._powerCreep;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(PowerCreep.prototype, 'flagRoom', {
		get() {
			if (typeof this._flagRoom === "undefined") {
				this._flagRoom = Object.keys(FlagManager.powercreepFlags).find(f => FlagManager.powercreepFlags[f].name === this.name) || null;
			}
			return this._flagRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(PowerCreep.prototype, 'inFlagRoom', {
		get() {
			if (typeof this._inFlagRoom === "undefined") {
				this._inFlagRoom = (this.pos.roomName === this.flagRoom);
			}
			return this._inFlagRoom;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(PowerCreep.prototype, 'flag', {
		get() {
			if (typeof this._flag === "undefined") {
				this._flag = this.flagRoom && FlagManager.powercreepFlags[this.flagRoom].flag || null;
			}
			return this._flag;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateExtensionLevel', {
		get() {
            if (typeof this._operateExtensionLevel === "undefined") {
                this._operateExtensionLevel = (
                    !FlagManager.nopowerextensionFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_EXTENSION]
                    && (this.powerCreep.powers[PWR_OPERATE_EXTENSION].level >= Config.params.POWERCREEP_OPERATE_EXTENSION_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_EXTENSION].level : 0;
			}
			return this._operateExtensionLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateSpawnLevel', {
		get() {
            if (typeof this._operateSpawnLevel === "undefined") {
                this._operateSpawnLevel = (
                    !FlagManager.nopowerspawnFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_SPAWN]
                    && (this.powerCreep.powers[PWR_OPERATE_SPAWN].level >= Config.params.POWERCREEP_OPERATE_SPAWN_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_SPAWN].level : 0;
			}
			return this._operateSpawnLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateStorageLevel', {
		get() {
            if (typeof this._operateStorageLevel === "undefined") {
                this._operateStorageLevel = (
                    !FlagManager.nopowerstorageFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_STORAGE]
                    && (this.powerCreep.powers[PWR_OPERATE_STORAGE].level >= Config.params.POWERCREEP_OPERATE_STORAGE_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_STORAGE].level : 0;
			}
			return this._operateStorageLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateStorageInactive', {
		get() {
            if (typeof this._operateStorageInactive === "undefined") {
                this._operateStorageInactive = this.operateStorageLevel && !this.storage.hasEffect(PWR_OPERATE_STORAGE);
			}
			return this._operateStorageInactive;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateTerminalLevel', {
		get() {
            if (typeof this._operateTerminalLevel === "undefined") {
                this._operateTerminalLevel = (
                    !FlagManager.nopowerterminalFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_TERMINAL]
                    && (this.powerCreep.powers[PWR_OPERATE_TERMINAL].level >= Config.params.POWERCREEP_OPERATE_TERMINAL_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_TERMINAL].level : 0;
			}
			return this._operateTerminalLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateLabLevel', {
		get() {
            if (typeof this._operateLabLevel === "undefined") {
                this._operateLabLevel = (
                    !FlagManager.nopowerlabFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_LAB]
                    && (this.powerCreep.powers[PWR_OPERATE_LAB].level >= Config.params.POWERCREEP_OPERATE_LAB_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_LAB].level : 0;
			}
			return this._operateLabLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operatePowerLevel', {
		get() {
            if (typeof this._operatePowerLevel === "undefined") {
                this._operatePowerLevel = (
                    !FlagManager.nopowerpowerFlags[this.name]
                    && this.powerCreep
                    && this.powerCreep.powers[PWR_OPERATE_POWER]
                    && (this.powerCreep.powers[PWR_OPERATE_POWER].level >= Config.params.POWERCREEP_OPERATE_POWER_MIN_LEVEL)
                ) ? this.powerCreep.powers[PWR_OPERATE_POWER].level : 0;
			}
			return this._operatePowerLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateSourceLevel', {
		get() {
            if (typeof this._operateSourceLevel === "undefined") {
                this._operateSourceLevel = (
                    this.powerCreep
                    && this.powerCreep.powers[PWR_REGEN_SOURCE]
                ) ? this.powerCreep.powers[PWR_REGEN_SOURCE].level : 0;
			}
			return this._operateSourceLevel;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'operateMineralLevel', {
		get() {
            if (typeof this._operateMineralLevel === "undefined") {
                this._operateMineralLevel = (
                    this.powerCreep
                    && this.powerCreep.powers[PWR_REGEN_MINERAL]
                ) ? this.powerCreep.powers[PWR_REGEN_MINERAL].level : 0;
			}
			return this._operateMineralLevel;
		},
		configurable: true, enumerable: true,
	});

    PowerCreep.prototype.smartMove = function(target, options = {}) {
        let result = OK;
        if (!target) return result;

        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugFlag
            , offRoad: true
            , ignoreRoads: true
        };
		options = _.defaults({}, _.clone(options), defaults);

        if (typeof options.maxRooms === "undefined") {
            // This fixes the edge condition where creeps would constantly move into next room while building near side of map.
            // Apparently it does not stop creeps from moving to another room if that is where their target is, which is great!
            if (this.pos.inSameRoom(target)) {
                options.maxRooms = 1;
                this.logCreep('target in same room, setting maxRooms=1');
            }
        }

        result = this.travelTo(target, options);
        return result;
    }

    /**
     * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/screeps/screeps-tests.ts
     */
    Room.prototype.managePowerCreep = function(roomMod, roomIndex) {
        // Shorthand.
        let room = this;

        // If we don't have a powercreep (does not have to be spawned), just bail out.
        // Note that the power creep does NOT have to be in this room; it could be traveling or working outside this room.
        let powerCreep = room.powerCreepGhost;
        if (!powerCreep) return false;

        // If we don't have a powerspawn in this room, just bail out.
        let roomPowerSpawn = room.colonyPowerSpawn;
        if (!roomPowerSpawn) return false;

        // Spawn this powercreep if it isn't spawned.
        // Bug where powercreeps can't be upgraded while spawned at level 0?
        if (!powerCreep.pos && powerCreep.level && !FlagManager.killpowercreepFlag) {
            powerCreep.spawn(roomPowerSpawn);
            return true;
        }

        // Still spawning? Weirdness. Still a ghost.
        if (!powerCreep.pos) return false;

        // Keep the powercreep alive.
        if (
            powerCreep.pos.isNearTo(roomPowerSpawn)
            && (powerCreep.ticksToLive <= Config.params.RENEW_TICKS_POWERCREEP)
        ) {
            // This task will not stop other power actions.
            powerCreep.renew(roomPowerSpawn);
        }


        // Move the this room if the powercreep isn't here.
        // Sometimes they get lost on edges.
        if (
            !powerCreep.inFlagRoom
        ) {
            if (powerCreep.ticksToLive <= Config.params.RENEW_TICKS_POWERCREEP_TRAVEL) {
                // Is there a power spawn in the current room we can use? Note this is NOT flag room.
                let localPowerSpawn = powerCreep.room.colonyPowerSpawn;
                if (localPowerSpawn) {
                    powerCreep.smartMove(localPowerSpawn);
                    if (powerCreep.pos.isNearTo(localPowerSpawn)) powerCreep.renew(localPowerSpawn);
                    return true;
                }
            }

            powerCreep.say('✈️' + powerCreep.flagRoom);
            powerCreep.smartMove(GameManager.getRoomMoveToPos(powerCreep.flagRoom))
            return true;
        }

        // Keep the powercreep alive; so low that we need to force move.
        if (
            !powerCreep.pos.isNearTo(roomPowerSpawn)
            && (powerCreep.ticksToLive <= Config.params.RENEW_TICKS_POWERCREEP_MIN)
        ) {
            powerCreep.smartMove(roomPowerSpawn);
            return true;
        }

        // If we don't have a terminal, just bail out.
        let roomTerminal = room.myTerminal;

        // If we don't have storage, just bail out.
        let roomStorage = room.myStorage;

        // Enable this room.
        if (
            powerCreep.room.controller
            && !powerCreep.room.controller.isPowerEnabled
        ) {
            // Move to our controller.
            powerCreep.smartMove(powerCreep.room.controller);
            if (powerCreep.pos.isNearTo(powerCreep.room.controller)) {
                powerCreep.enableRoom(powerCreep.room.controller);
            }
            return true;
        }

        // If we have free capacity, then make an op.
        // Excess would have been transfered to the factory above,
        // so if the creep is full, then so is the factory.
        // Doing this early so it can be done even if we are moving to another location.
        if (
            powerCreep.canOperatePower(PWR_GENERATE_OPS)
            && powerCreep.store.getFreeCapacity() >= powerCreep.generateOpsAmount
            && roomTerminal
            && (roomTerminal.store.getUsedCapacity(RESOURCE_OPS) < Config.params.TERMINAL_STORE_MAX + C.PWR_GENERATE_OPS_MAX_EFFECT)
        ) {
            if (powerCreep.usePower(PWR_GENERATE_OPS) === OK) return true;
        }

        // Use our regen source power.
        // This power requires movement, but no ops.
        if (
            powerCreep.canOperatePower(PWR_REGEN_SOURCE)

            // Need at least one source without the effect.
            && room.sources.find(f => f.operateTicksRemaining < Config.params.POWERCREEP_OPERATE_SOURCE_TICKS)
        ) {
            // Find the source with the least time left on it, and move to it.
            // Since we don't have sticky targets, make sure this sort gives the same results each tick.
            let source = _.sortByOrder(room.sources, [
                sortTicksRemaining => sortTicksRemaining.operateTicksRemaining
                , sortTieBreaker => sortTieBreaker.id
            ]).find(x => x !== undefined);

            if (source) {
                if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_REGEN_SOURCE, source, true))) return true;
            }
        }

        // Use our regen mineral power.
        // This power requires movement, but no ops.
        if (
            powerCreep.canOperatePower(PWR_REGEN_MINERAL)

            // Obviously need a mineral in the room.
            && room.mineral
            // Must have some minerals in the mine for this to work; tested with empty mine and power does not work (returns OK tho weird).
            && (room.mineral.mineralAmount || 0)
            // Cannot exceed ultra density.
            && (room.mineral.mineralAmount < MINERAL_DENSITY[4])

            // We will renew minerals as long as this rooms terminal has less than the max amount (MINERAL_DENSITY[1]).
            && room.myTerminal
            && (room.myTerminal.store.getUsedCapacity(room.mineral.mineralType) < Config.params.TERMINAL_MINERAL_MAX)

            // The cooldown and effect time are the same, so go when the operational effect runs out. Not in a big hurry here.
            && !room.mineral.operateTicksRemaining
        ) {
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_REGEN_MINERAL, room.mineral, true))) return true;
        }

        // Use our operate lab power.
        // This power requires movement.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_LAB)

            // Verify we have the basic labs built.
            && room.colonyLab1
            && room.colonyLab2

            // If we are outputting a tier3, then it has a long cooldown.
            // These are the ones we want to boost our output on.
            && room.labOutput
            && room.colonyLab1.mineralType
            && room.colonyLab2.mineralType

            // Does this powercreep have sufficent level to operate?
            && room.operateLabLevel
        ) {
            let labs = FlagManager.maxpowerlabFlag ?
                [
                    room.colonyLab3
                    , room.colonyLab4
                    , room.colonyLab5
                    , room.colonyLab6
                    , room.colonyLab7
                    , room.colonyLab8
                    , room.colonyLab9
                    , room.colonyLab10
                ]
                : [
                    room.colonyLab3
                    , room.colonyLab4
                    , room.colonyLab5
                    , room.colonyLab6
                ];

            // Try each of these labs. Some may not exist, but if so they would be skipped.
            if (labs.some(colonyLab => {
                if (
                    // Verify we have the lab to boost.
                    colonyLab

                    // Make sure we don't have a huge cooldown on this as an unboost lab.
                    && ((colonyLab.cooldown || 0) <= REACTION_TIME[colonyLab.room.labOutput])

                    // There is no active effect on the structure.
                    && !colonyLab.hasEffect(PWR_OPERATE_LAB)
                ) {
                    if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_LAB, colonyLab))) return true;
                }

                // This lab was not boosted.
                return false;
            })) {
                // Found a lab to boost, bail out.
                return true;
            }
        }

        // Move to the renew position.
        if (
            powerCreep.room.colonyPowerCreepRenewPos
            && !powerCreep.pos.isEqualTo(powerCreep.room.colonyPowerCreepRenewPos)
        ) {
            if (powerCreep.smartMove(powerCreep.room.colonyPowerCreepRenewPos) === OK) return true;
        }


        // *** CPU MAX TEST ***
        // Unless CPU is fully free (maxed), bail out for all other tasks if its not our turn.
        //if (!GameManager.isCpuMaxed && !GameManager.tickCheck(roomMod, roomIndex, 1)) return true;
        if (!GameManager.isCpuMaxed && (Game.time % Config.params.POWERCREEP_TICK_MOD !== 0)) return true;


        // Withdraw ops if we are low.
        if (
            (powerCreep.store.getFreeCapacity() > powerCreep.generateOpsAmount)
            && roomTerminal
            && roomTerminal.store.getUsedCapacity(RESOURCE_OPS)
            && powerCreep.pos.isNearTo(roomTerminal)
        ) {
            // Note transfer should not overlap with usePower action.
            let amount = Math.min(powerCreep.store.getFreeCapacity() - powerCreep.generateOpsAmount, roomTerminal.store.getUsedCapacity(RESOURCE_OPS))
            powerCreep.withdraw(roomTerminal, RESOURCE_OPS, amount);
            return true;
        }

        // Use our storage power.
        // This power is high up as it is pretty important to keep up if we want to actually deposit new loot.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_STORAGE)

            // Save half our ops for other things.
            && (powerCreep.store.getUsedCapacity() > powerCreep.store.getFreeCapacity())

            // We have a valid target.
            && roomStorage

            // There is no active effect on the structure.
            && !roomStorage.hasEffect(PWR_OPERATE_STORAGE)

            // Do our energy check. If we aren't in dump range, then no point in expanding our capacity just yet.
            && room.isStorageEnergyDump

            // Does this powercreep have sufficent level to operate?
            && room.operateStorageLevel
        ) {
            //if (powerCreep.usePower(PWR_OPERATE_STORAGE, roomStorage) === OK) return true;
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_STORAGE, roomStorage))) return true;
        }

        // Use our extension power.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_EXTENSION)

            // Save half our ops for other things.
            && (powerCreep.store.getUsedCapacity() > powerCreep.store.getFreeCapacity())

            // Only use if we can take full advantage of the power, or if we are below a minimum percent energy.
            && (1.0 - (room.energyAvailable / room.energyCapacityAvailable) >= Config.params.POWERCREEP_OPERATE_EXTENSION_MIN)

            // Does this powercreep have sufficent level to operate?
            && room.operateExtensionLevel
        ) {
            let target = null;
            if (!target && room.storage && !room.storage.hasEffect(PWR_OPERATE_EXTENSION)) target = room.storage;
            if (!target && room.terminal && !room.terminal.hasEffect(PWR_OPERATE_EXTENSION)) target = room.terminal;

            //if (target && powerCreep.usePower(PWR_OPERATE_EXTENSION, target) === OK) return true;
            if (target) {
                if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_EXTENSION, target))) return true;
            }
        }

        // Enable our factory power.
        let colonyFactory = room.colonyFactory;
        if (
            powerCreep.canOperatePower(PWR_OPERATE_FACTORY)
            // Must have a flag out and non-red!
            // This is a permanent change to the factory, and cannot be undone without destroying the factory. Dumb!
            && colonyFactory
            && !colonyFactory.level
            && FlagManager.factoryFlags[room.name]
            // Only enable factory if we have used all our GPL. Prevents premature usage when re-creating all powercreeps.
            && (Game.gpl.level === GameManager.usedGPL)

            // There is no active effect on the structure.
            && !colonyFactory.hasEffect(PWR_OPERATE_FACTORY)
        ) {
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_FACTORY, colonyFactory))) return true;
        }

        // Use our factory power.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_FACTORY)

            // Save half our ops for other things.
            && (powerCreep.store.getUsedCapacity() > powerCreep.store.getFreeCapacity())

            // Factory had to have been upgraded already.
            && colonyFactory
            && colonyFactory.level
            && FlagManager.factoryFlags[room.name]
            // Only use factory if we have used all our GPL. Prevents premature usage when re-creating all powercreeps.
            && (Game.gpl.level === GameManager.usedGPL)

            // There is no active effect on the structure.
            && !colonyFactory.hasEffect(PWR_OPERATE_FACTORY)

            // Do our energy check.
            && room.isStorageEnergyAbundant

            // Need a function that takes in a creep power level and the factory store and termines if there is enough to run for 1000 seconds.
            // This could be an expensive call to be making every tick.
            // Make sure this is done after the call to check hasEffect.
            && room.factoryReadyForBoost
        ) {
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_FACTORY, colonyFactory))) return true;
        }

        // Use our power power.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_POWER)

            // Save half our ops for other things.
            && (powerCreep.store.getUsedCapacity() > powerCreep.store.getFreeCapacity())

            // We are overflowing with Ops, use them up.
            && roomTerminal
            && (roomTerminal.store.getUsedCapacity(RESOURCE_OPS) > Config.params.TERMINAL_STORE_TARGET)

            // We are overflowing with power, use them up.
            && roomTerminal
            && (roomTerminal.store.getUsedCapacity(RESOURCE_POWER) > Config.params.TERMINAL_STORE_TARGET)

            // Make sure we have enough power to last the entire time if lucky.
            && (roomTerminal.store.getUsedCapacity(RESOURCE_POWER) >= (POWER_INFO[PWR_OPERATE_POWER].duration * roomPowerSpawn.operatePowerAmount))

            // Only use if we can take full advantage of the power.
            && room.isStorageEnergyPower

            // Does this powercreep have sufficent level to operate?
            && room.operatePowerLevel
        ) {
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_POWER, roomPowerSpawn))) return true;
        }

        // Use our terminal power.
        if (
            powerCreep.canOperatePower(PWR_OPERATE_TERMINAL)

            // Save half our ops for other things.
            && (powerCreep.store.getUsedCapacity() > powerCreep.store.getFreeCapacity())

            // Does this powercreep have sufficent level to operate?
            && room.operateTerminalLevel

            // Need to have a terminal and storage.
            && roomTerminal
            && roomStorage
            && roomStorage.hasEffect(PWR_OPERATE_STORAGE)

            // Include logic about being room with the most energy.
            && (
                room.isStorageFull
                || room.isStoragePercentHighestInEmpire
            )
        ) {
            if ([OK, ERR_NOT_IN_RANGE].includes(powerCreep.smartOperatePower(PWR_OPERATE_TERMINAL, roomTerminal))) return true;
        }

        // Make/store ops if we have capacity and haven't done anything else this tick.
        // We are making slightly more than the terminals max so that overflow can be sent to other rooms that need ops.
        if (
            roomTerminal
            && (powerCreep.store.getFreeCapacity() < powerCreep.generateOpsAmount)
            && (roomTerminal.store.getFreeCapacity() >= powerCreep.generateOpsAmount)
            && powerCreep.pos.isNearTo(roomTerminal)
            && (roomTerminal.store.getUsedCapacity(RESOURCE_OPS) < Config.params.TERMINAL_STORE_MAX + C.PWR_GENERATE_OPS_MAX_EFFECT)

            // Shove any overflow into the factory, king will take it out and put in terminal.
            // Overflow will goto other terminals, then their factories.
            // Excess after all that will be sold by terminal for profit.
        ) {
            // Note transfer should not overlap with usePower action.
            powerCreep.transfer(roomTerminal, RESOURCE_OPS, powerCreep.generateOpsAmount)
        }

        // Nothing else going on, bail out.
        return false;
    }

}
