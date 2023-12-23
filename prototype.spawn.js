"use strict";

module.exports = function() {

    StructureSpawn.prototype.logSpawn = function(type, result) {
        if (result != OK) {
            this.room.logRoom(this.name + " failed attempting to spawn " + type + ": " + utils.errNumToCode(result) + ' (' + result + ')');
        }
    };

    StructureSpawn.prototype.createName = function(type, room1, room2) {
        let name = type;
        if (room1) name += '_' + room1;
        if (room2 && (room1 !== room2)) name += '_' + room2;
        name += '_' + Game.time;
        return name;
    };

    StructureSpawn.prototype.getSpawnEnergyCapacityAvailable = function(body, levelBody, maxBody) {
        // Determine if this body is equal to the body at full energy level, or even level 8 energy level.
        // This will keep the creep around longer without having to respawn only to create the same exact body.
        let bodyCost = utils.getBodyCost(body);
        let maxBodyCost = utils.getBodyCost(maxBody);

        if (bodyCost >= maxBodyCost) {
            return C.SPAWNING_ENERGY_CAPACITY[8];
        }

        let levelBodyCost = utils.getBodyCost(levelBody);
        if (bodyCost >= levelBodyCost) {
            return C.SPAWNING_ENERGY_CAPACITY[this.room.controller.level];
        }

        return this.room.energyAvailable;
    }

	Object.defineProperty(StructureSpawn.prototype, 'operateSpawnTicksRemaining', {
		get() {
            if (typeof this._operateSpawnTicksRemaining === "undefined") {
                this._operateSpawnTicksRemaining = this.effectTicksRemaining(PWR_OPERATE_SPAWN);
            }
			return this._operateSpawnTicksRemaining;
		},
		configurable: true, enumerable: true,
    });

    StructureSpawn.prototype.getSpawnDirection = function() {
        if (!this.room.colonyFlag) return [TOP];

        // Determine which flag we are.
        let whichSpawn = 0;
        if (this.room.colonySpawn1 && (this.id === this.room.colonySpawn1.id)) {
            whichSpawn = 1;
        } else if (this.room.colonySpawn2 && this.id === (this.room.colonySpawn2.id)) {
            whichSpawn = 2;
        } else if (this.room.colonySpawn3 && this.id === (this.room.colonySpawn3.id)) {
            whichSpawn = 3;
        }

        switch (this.room.colonyFlag.color) {

            case COLOR_GREEN:
            case COLOR_RED:
                switch (whichSpawn) {
                    case 1: return [TOP_LEFT];
                    case 2: return [TOP_LEFT];
                    case 3: return [TOP];
                }
                break;

            case COLOR_YELLOW:
            case COLOR_PURPLE:
                switch (whichSpawn) {
                    case 1: return [TOP_RIGHT];
                    case 2: return [TOP_RIGHT];
                    case 3: return [TOP];
                }
                break;

            case COLOR_ORANGE:
            case COLOR_BLUE:
                switch (whichSpawn) {
                    case 1: return [BOTTOM_RIGHT];
                    case 2: return [BOTTOM_RIGHT];
                    case 3: return [BOTTOM];
                }
                break;

            case COLOR_BROWN:
            case COLOR_CYAN:
                switch (whichSpawn) {
                    case 1: return [BOTTOM_LEFT];
                    case 2: return [BOTTOM_LEFT];
                    case 3: return [BOTTOM];
                }
                break;

        }

        return [TOP];
    };

    // Factory for creating creeps by role.
    StructureSpawn.prototype.createCreep = function(role, getBodyFunc, options) {
        // Don't mess with the original options object.
		let defaults = {
            focusId: undefined
            , workRoom: this.room.name
            , assignedRoom: this.room.name
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Get the body definition of this creep.
        let body = getBodyFunc(options);
        let result = ERR_NOT_ENOUGH_ENERGY;
        let spawnEnergyCapacityAvailable = this.getSpawnEnergyCapacityAvailable(
            body
            , getBodyFunc({...options, energy:C.SPAWNING_ENERGY_CAPACITY[this.room.controller.level]})
            , getBodyFunc({...options, energy:C.SPAWNING_ENERGY_CAPACITY[8]})
        );

        // Need to have parts to create this creep.
        if (body.length > 0) {
            if (!this.room.canBoostBody(role, body)) {
                // We can't boost this creep so don't bother to create it.
                result = ERR_NOT_ENOUGH_RESOURCES;
            }
            else {
                let name = this.createName(role, options.assignedRoom, options.workRoom);

                // Time sensitive creep gets priority spawn boost!
                if (this.room.powerCreep) this.room.powerCreep.smartOperateSpawn(this);

                // create creep with the created body and the given role
                result = this.spawnCreep(body, name, {
                    memory: {
                        [C.MEMORY_KEY_CREEP_SPAWN_ROOM]: this.room.name
                        , [C.MEMORY_KEY_CREEP_WORK_ROOM]: options.workRoom
                        , [C.MEMORY_KEY_CREEP_ASSIGNED_ROOM]: options.assignedRoom
                        , [C.MEMORY_KEY_CREEP_SPAWN_ENERGY_CAPACITY_AVAILABLE]: spawnEnergyCapacityAvailable
                        , [C.MEMORY_KEY_CREEP_FOCUS_ID]: options.focusId

                        // TODO: refactor this
                        , [C.MEMORY_KEY_CREEP_RESERVE_ONLY]: options.reserveOnly
                    }
                    , directions: options.direction ? [options.direction] : this.getSpawnDirection()
                });
            }
        }
        this.logSpawn(role, result);
        return result;
    };

    StructureSpawn.prototype.createCreepKing = function(focusId, emergencySpawn, options) {
		let defaults = {
            focusId: focusId
            , useEnergyAvailable: emergencySpawn
            , direction: this.pos.getDirectionTo(this.room.colonyKingPos)
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.KING, this.room.getBodyKing.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepQueen = function(focusId, emergencySpawn, options) {
		let defaults = {
            focusId: focusId
            , useEnergyAvailable: emergencySpawn
            , direction: this.pos.getDirectionTo(this.room.colonyQueenPos)
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.QUEEN, this.room.getBodyQueen.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepJester = function(focusId, pos, options) {
		let defaults = {
            focusId: focusId
            , direction: this.pos.getDirectionTo(pos)
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.JESTER, this.room.getBodyJester.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPeon = function(workRoom, assignedRoom, focusId, emergencySpawn, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
            , useEnergyAvailable: emergencySpawn
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PEON, this.room.getBodyPeon.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPeasant = function(focusId, options) {
		let defaults = {
            focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PEASANT, this.room.getBodyPeasant.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLlama = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LLAMA, this.room.getBodyLlama.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepOx = function(options) {
		let defaults = {};
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.OX, this.room.getBodyOx.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepMiner = function(focusId, options) {
		let defaults = {
            focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.MINER, this.room.getBodyMiner.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepDredger = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.DREDGER, this.room.getBodyDredger.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepRook = function(focusId, emergencySpawn, options) {
		let defaults = {
            useEnergyAvailable: emergencySpawn
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.ROOK, this.room.getBodyRook.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPage = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            assignedRoom: assignedRoom
            , workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PAGE, this.room.getBodyPage.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepFarmer = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.FARMER, this.room.getBodyFarmer.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepScavenger = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.SCAVENGER, this.room.getBodyScavenger.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepGnome = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.GNOME, this.room.getBodyGnome.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepFencer = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.FENCER, this.room.getBodyFencer.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepProspector = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PROSPECTOR, this.room.getBodyProspector.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPaladin = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PALADIN, this.room.getBodyPaladin.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepExecutioner = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.EXECUTIONER, this.room.getBodyExecutioner.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCollier = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.COLLIER, this.room.getBodyCollier.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepKnight = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.KNIGHT, this.room.getBodyKnight.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCrossbowman = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CROSSBOWMAN, this.room.getBodyCrossbowman.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPikeman = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PIKEMAN, this.room.getBodyPikeman.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepWatchman = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.WATCHMAN, this.room.getBodyWatchman.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPriest = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PRIEST, this.room.getBodyPriest.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepRanger = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
            , incomingDamage: (750 * 3) // This would cover 3 ranged screeps with 25 tier2 boosted ranged parts.
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.RANGER, this.room.getRangedBodyByIncomingDamage.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepDeacon = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
            , incomingDamage: (750 * 3) // This would cover 3 ranged screeps with 25 tier2 boosted ranged parts.
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.DEACON, this.room.getRangedBodyByIncomingDamage.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepSwordsman = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.SWORDSMAN, this.room.getBodySwordsman.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCleric = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CLERIC, this.room.getBodyCleric.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepStriker = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.STRIKER, this.room.getBodyStriker.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCardinal = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CARDINAL, this.room.getBodyCardinal.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepBlacksmith = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.BLACKSMITH, this.room.getBodyBlacksmith.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepBishop = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.BISHOP, this.room.getBodyBishop.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLancer1 = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LANCER1, this.room.getBodyLancer1.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLancer2 = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LANCER2, this.room.getBodyLancer2.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLancer3 = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LANCER3, this.room.getBodyLancer3.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLancer4 = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LANCER4, this.room.getBodyLancer4.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepLancer5 = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.LANCER5, this.room.getBodyLancer5.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepArcher = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.ARCHER, this.room.getBodyArcher.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepHound = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.HOUND, this.room.getBodyHound.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepSapper = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.SAPPER, this.room.getBodySapper.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepPreacher = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , reserveOnly: 0
            , focusId: focusId
            , claimParts: MAX_CREEP_SIZE
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PREACHER, this.room.getBodyPreacher.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepBurro = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.BURRO, this.room.getBodyBurro.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepDonkey = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.DONKEY, this.room.getBodyDonkey.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepJackass = function(workRoom, assignedRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.JACKASS, this.room.getBodyJackass.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepHorse = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.HORSE, this.room.getBodyHorse.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepMule = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , assignedRoom: assignedRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.MULE, this.room.getBodyMule.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepRogue = function(focusId, options) {
		let defaults = {
            focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.ROGUE, this.room.getBodyRogue.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepScout = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.SCOUT, this.room.getBodyScout.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCrier = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CRIER, this.room.getBodyCrier.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepProphet = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.PROPHET, this.room.getBodyProphet.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepBellman = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.BELLMAN, this.room.getBodyBellman.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepHerald = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.HERALD, this.room.getBodyHerald.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepDiviner = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.DIVINER, this.room.getBodyDiviner.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepOracle = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.ORACLE, this.room.getBodyOracle.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepCarpenter = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            assignedRoom: assignedRoom
            , workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CARPENTER, this.room.getBodyCarpenter.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepMason = function(assignedRoom, workRoom, focusId, options) {
		let defaults = {
            assignedRoom: assignedRoom
            , workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.MASON, this.room.getBodyMason.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepClerk = function(workRoom, focusId, options) {
		let defaults = {
            workRoom: workRoom
            , focusId: focusId
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.CLERK, this.room.getBodyClerk.bind(this.room), options);
    };

    StructureSpawn.prototype.createCreepEngineer = function(workRoom, options) {
		let defaults = {
            workRoom: workRoom
        };
		options = _.defaults({}, _.clone(options), defaults);
        return this.createCreep(Config.roles.ENGINEER, this.room.getBodyEngineer.bind(this.room), options);
    };

};
