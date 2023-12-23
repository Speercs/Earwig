"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

    Room.prototype.getBodyRook = function(options) {
		let defaults = {
			energy: this.controller.level >= 2 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        let body = [];

        // Create a carry/carry/move body with the given energy up to 16c/8m under normal conditions.
        if (this.colonyShouldHaveRoads >= 0) {
            let maxParts = 8;
            let numberOfParts = Math.min(maxParts, Math.min(Math.floor(options.energy / (BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3)));
            body = _.times(numberOfParts, () => [CARRY, CARRY, MOVE]).flatten();
        }
        else {
            // Low level strategy is to move around without roads.
            let numberOfParts = Math.min(Math.floor(options.energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
            body = _.times(numberOfParts, () => [CARRY, MOVE]).flatten();
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPage = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        let body = [];

        if (this.isFOB) {
            let numberOfParts = Math.min(Math.floor(options.energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));

            // Low level strategy is to move around without roads.
            body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());
        }
        else {
            // Create a carry/carry/move body with the given energy up to 16c/8m.
            let maxParts = Math.floor(50 / 3);
            let numberOfParts = Math.min(maxParts, Math.min(Math.floor(options.energy / (BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3)));

            body = body.concat(_.times(numberOfParts, () => [CARRY, CARRY, MOVE]).flatten());

            // Do we left than/equal t 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && ((options.energy - utils.getBodyCost(body)) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPeon = function(options) {
		let defaults = {
			energy: this.controller.level >= 2 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        let body = [];

        if (this.isFOB) {
            let numberOfParts = Math.min(Math.floor(options.energy / (BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move*2)), Math.floor(MAX_CREEP_SIZE / 4));

            // Low level strategy is to move around without roads.
            body = body.concat(_.times(numberOfParts, () => [WORK, CARRY, MOVE, MOVE]).flatten());
        }
        else {
            // Create a balanced body as big as possible with the given energy.
            // 200 is the sum of MOVE, CARRY, WORK.
            // Each creep will get at least one of each.
            // There is a maximum at level 8 of the number of WORK parts that can be used in the upgradeController, CONTROLLER_MAX_UPGRADE_PER_TICK
            let numberOfParts = Math.min(Math.floor(options.energy / (BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3));
            let numberOfWorkParts = Math.min(numberOfParts, CONTROLLER_MAX_UPGRADE_PER_TICK)

            body = body.concat(_.times(numberOfWorkParts, () => WORK));
            body = body.concat(_.times(numberOfParts, () => CARRY));
            body = body.concat(_.times(numberOfParts, () => MOVE));

            // Do we left than/equal t 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && ((options.energy - utils.getBodyCost(body)) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyFarmer = function(options) {
		let defaults = {
			needsContainer: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        if (this.isFOB) {
            let numberOfParts = Math.min(4, Math.min(Math.floor(energy / (BODYPART_COST.work + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2)));

            // Low level strategy is to move around without roads.
            body = body.concat(_.times(numberOfParts, () => [WORK, MOVE]).flatten());
        }
        else {
            let reserved = this.atSpawningEnergyCapacityForLevel(Config.params.RESERVE_PREACHER_LEVEL);
            let numberOfParts = 0;
            let addContainerParts = options.needsContainer ? (this.atSpawningEnergyCapacityForLevel(5) ? 2 : 1) : 0;

            if (Cartographer.isControllerRoom(options.workRoom)) {
                // Add an extra part if we need a container for this room.
                numberOfParts = Math.ceil((reserved ? SOURCE_ENERGY_CAPACITY : SOURCE_ENERGY_NEUTRAL_CAPACITY) / 1000) + addContainerParts;
            }
            else if (Cartographer.isCoreRoom(options.workRoom)) {
                numberOfParts = Math.ceil(SOURCE_ENERGY_KEEPER_CAPACITY / 1000) + 0 + addContainerParts;
            }
            else if (Cartographer.isSKRoom(options.workRoom)) {
                // Adding 1 just to offset for evading the source keepers constantly.
                numberOfParts = Math.ceil(SOURCE_ENERGY_KEEPER_CAPACITY / 1000) + 1 + addContainerParts;
            }

            // Remove havest farmer will need 2 carry parts (overflow prevention) to hold enough to spend a full 10*5=50 energy for building purposes.
            body = body.concat(_.times(numberOfParts * 2, () => WORK));
            body = body.concat(_.times(addContainerParts ? 2 : 1, () => CARRY));
            if (this.shouldCreateSourceTrails && !addContainerParts) {
                body = body.concat(_.times(numberOfParts, () => MOVE));
            }
            else {
                body = body.concat(_.times(numberOfParts * 2, () => MOVE));
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
	};

    Room.prototype.getBodyProspector = function() {
        let body = [];

        // Determine if we should create peon with energy we have right now, or wait till extensions are full.
        let energy = this.energyCapacityAvailable;  // Full energy

        // Donkeys will take care of transport. Build is 20w+5c+25m in order to harvest as much as possible without moving
        // but give time to transport to get there and back.
        // Also we want to allow the prospector to disengage from the room in case of danger without suffering fatigue.
        body = body.concat(_.times(20, () => WORK));
        body = body.concat(_.times(5, () => CARRY));
        body = body.concat(_.times(25, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPeasant = function(options) {
		let defaults = {
			energy: this.controller.level >= 2 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let numberOfParts = 0;

        // Determine if we should start building no road peasants. These have equal work/move.
        // Build once we have links to all sources. Could be level 5 or 6 depending if we have 1 or 2 sources.
        let powerSourceLevel = this.operateSourceLevel;
        let powerWorkParts = powerSourceLevel ? Math.ceil(POWER_INFO[PWR_REGEN_SOURCE].effect[powerSourceLevel - 1] * POWER_INFO[PWR_REGEN_SOURCE].period / HARVEST_POWER / POWER_INFO[PWR_REGEN_SOURCE].duration) : 0;

        // Carry parts will cut down on the transfers to the source link, saving CPU.
        let highEndCarry = (CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level] >= 2 + this.sources.length) ? 4 : 1;

        if (this.isFOB) {
            // Early game we will have no carry, just work and move. All harvested energy will be dropped.
            let body = _.times(6, () => WORK);
            body = body.concat(_.times(3, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= options.energy) {
                return body;
            }

            // Very early game we will have no carry, just work and move. All harvested energy will be dropped.
            body = []
            body = body.concat(_.times(5, () => WORK));
            body = body.concat(_.times(1, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= options.energy) {
                return body;
            }
        }

        if ((this.controller.level >= 6) && (options.energy >= (BODYPART_COST.work*(6 + powerWorkParts) + BODYPART_COST.move*(3 + Math.ceil(powerWorkParts / 2)) + BODYPART_COST.carry*highEndCarry))) {
            // Mid game optimal peasant. Can't work faster than 3000 energy in 300 ticks for a spawn.
            // 8 WORK and 4 MOVE to allow speed 1 over road in order to get back to spawn and renew.
            let body = _.times(6 + powerWorkParts, () => WORK);
            body = body.concat(_.times(3 + Math.ceil(powerWorkParts / 2), () => MOVE));
            body = body.concat(_.times(highEndCarry, () => CARRY));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= options.energy) {
                return body;
            }

        }

        if (options.energy >= (BODYPART_COST.work*6) - (BODYPART_COST.move*3)) {
            // Early game optimal peasant. Can't work faster than 3000 energy in 300 ticks for a spawn.
            // 6 WORK and 3 MOVE to allow speed 1 over road in order to get back to spawn and renew.

            // Optimal peasant. Can't work faster than 3000 energy in 300 ticks for a spawn.
            // Three moves to allow speed 1 over road for six work parts.
            let body = _.times(6, () => WORK);
            body = body.concat(_.times(3, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= options.energy) {
                return body;
            }
        }

        return [];
	};

    Room.prototype.getBodyKing = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        // Build a bigger king if we plan on getting a lot of resources thru our terminal.
        //let maxParts = (this.atMaxLevel || !this.myTerminal) ? 20 : 50;
        //let maxParts = 20;
        let maxParts = this.myColonyLink ? 20 : 6;
        let numberOfParts = Math.min(Math.min(Math.floor((options.energy) / (BODYPART_COST.carry)), Math.floor(MAX_CREEP_SIZE / 1)), maxParts);
        let body = [];

        // 20 carries max, as that gives us 800+200 capacity, enough to empty the controller link completely and have enough for minerals.
        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => CARRY));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyQueen = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        let numberOfParts = Math.min(Math.min(Math.floor((options.energy) / (BODYPART_COST.carry)), Math.floor(MAX_CREEP_SIZE / 1)), 12);
        let body = [];

        // 12 carries max, as that gives us 600 capacity, enough to fill up two spawns in one shot. Plus enough for towers.
        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => CARRY));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyJester = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }

        let numberOfParts = Math.min(Math.floor((options.energy) / (BODYPART_COST.carry)), Math.floor(MAX_CREEP_SIZE / 1));
        let body = [];

        // 12 carries max, as that gives us 600 capacity, enough to fill up two spawns in one shot. Plus enough for towers.
        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => CARRY));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyMiner = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let numberOfParts = Math.min(Math.floor(options.energy / (BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3));
        let body = [];

        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => WORK));
            body = body.concat(_.times(numberOfParts, () => CARRY));
            body = body.concat(_.times(numberOfParts, () => MOVE));

            // Do we left than/equal t 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && ((options.energy - utils.getBodyCost(body)) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyDredger = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let body = [];

        // Build is 10w+15c+25m in order to harvest and move over plains quickly.
        body = body.concat(_.times(20, () => WORK));
        body = body.concat(_.times(5, () => CARRY));
        body = body.concat(_.times(25, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPaladin = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 2));
        let body = [];

        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyExecutioner = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        body = body.concat(_.times(27, () => MOVE));
        body = body.concat(_.times(15, () => ATTACK));
        body = body.concat(_.times(1, () => MOVE));
        body = body.concat(_.times(7, () => HEAL));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyCollier = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.move + BODYPART_COST.work)), Math.floor((MAX_CREEP_SIZE) / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => WORK));
        body = body.concat(_.times(numberOfParts, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPikeman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor((energy - 4*BODYPART_COST.tough - BODYPART_COST.move) / (4*BODYPART_COST.attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 5) / 5));
        let body = [];

        if (numberOfParts > 0) {
            body = body.concat(_.times(4, () => TOUGH));
            body = body.concat(_.times(numberOfParts*4, () => ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
            body.push(MOVE);
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyHound = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.storage ? this.energyCapacityAvailable : this.energyAvailable;
        let numberOfParts = 0;
        let body = [];

        // Special body that allows 2f movement over swamp, but 390 damage output can take down a 25h hostile.
        body = [];
        body = body.concat(_.times(22, () => MOVE));
        body = body.concat(_.times(13, () => ATTACK));
        body = body.concat(_.times(13, () => MOVE));
        body = body.concat(_.times(1, () => HEAL));
        body = body.concat(_.times(1, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.attack + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        body = [];
        body = body.concat(_.times(numberOfParts, () => ATTACK));
        body = body.concat(_.times(numberOfParts, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        return [];
    };

    Room.prototype.getBodyKnight = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.storage ? this.energyCapacityAvailable : this.energyAvailable;
        let numberOfParts = 0;
        let body = [];

        numberOfParts = Math.min(Math.floor((energy - BODYPART_COST.heal - BODYPART_COST.move) / (BODYPART_COST.attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 2) / 2));
        body = [];
        body = body.concat(_.times(numberOfParts, () => ATTACK));
        body = body.concat(_.times(numberOfParts, () => MOVE));
        body = body.concat(_.times(1, () => HEAL));
        body = body.concat(_.times(1, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.attack + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        body = [];
        body = body.concat(_.times(numberOfParts, () => ATTACK));
        body = body.concat(_.times(numberOfParts, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        return [];
    };

    Room.prototype.getBodySwordsman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        body = body.concat(_.times(11, () => TOUGH));
        body = body.concat(_.times(29, () => ATTACK));
        body = body.concat(_.times(10, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyCleric = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Can overheal 6 towers at point blank range.
        body = body.concat(_.times(11, () => TOUGH));
        body = body.concat(_.times(6, () => RANGED_ATTACK));
        body = body.concat(_.times(10, () => MOVE));
        body = body.concat(_.times(23, () => HEAL));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLancer1 = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Enough armor to cover 1 tower and 0 ranged creeps and 1 source keeper.
        for (let i = 0; i < 3; i++) {
            body.push(TOUGH);
        }
        for (let i = 0; i < 32; i++) {
            body.push(RANGED_ATTACK);
        }
        for (let i = 0; i < 10; i++) {
            body.push(MOVE);
        }
        for (let i = 0; i < 5; i++) {
            body.push(HEAL);
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLancer2 = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Enough armor to cover 2 towers and 0 ranged creeps and 1 source keeper.
        for (let i = 0; i < 4; i++) {
            body.push(TOUGH);
        }
        for (let i = 0; i < 27; i++) {
            body.push(RANGED_ATTACK);
        }
        for (let i = 0; i < 10; i++) {
            body.push(MOVE);
        }
        for (let i = 0; i < 9; i++) {
            body.push(HEAL);
        }

         // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLancer3 = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Enough armor to cover 3 towers and 0 ranged creeps and 1 source keeper.
        for (let i = 0; i < 6; i++) {
            body.push(TOUGH);
        }
        for (let i = 0; i < 22; i++) {
            body.push(RANGED_ATTACK);
        }
        for (let i = 0; i < 10; i++) {
            body.push(MOVE);
        }
        for (let i = 0; i < 12; i++) {
            body.push(HEAL);
        }

         // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLancer4 = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Enough armor to cover 0 towers and 2 ranged creep (although there maybe 1-4 ranged creeps) and 1 source keeper.
        // This is assuming room has been nuked and 4 of the 4 towers were destroyed.
        for (let i = 0; i < 5; i++) {
            body.push(TOUGH);
        }
        for (let i = 0; i < 25; i++) {
            body.push(RANGED_ATTACK);
        }
        for (let i = 0; i < 10; i++) {
            body.push(MOVE);
        }
        for (let i = 0; i < 10; i++) {
            body.push(HEAL);
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLancer5 = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Enough armor to cover 0 towers and 2 ranged creep (although there maybe 1-9 ranged creeps) and 1 source keeper.
        // This is assuming room has been nuked and 6 towers were destroyed.
        // for (let i = 0; i < 11; i++) {
        //     body.push(TOUGH);
        // }
        // for (let i = 0; i < 6; i++) {
        //     body.push(RANGED_ATTACK);
        // }
        // for (let i = 0; i < 10; i++) {
        //     body.push(MOVE);
        // }
        // for (let i = 0; i < 23; i++) {
        //     body.push(HEAL);
        // }

        // Enough armor to cover 0 towers and 1 ranged creep (although there maybe 1-9 ranged creeps) and 1 source keeper.
        // This is assuming room has been nuked and 6 towers were destroyed.
        for (let i = 0; i < 6; i++) {
            body.push(TOUGH);
        }
        for (let i = 0; i < 21; i++) {
            body.push(RANGED_ATTACK);
        }
        for (let i = 0; i < 10; i++) {
            body.push(MOVE);
        }
        for (let i = 0; i < 13; i++) {
            body.push(HEAL);
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodySapper = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor((energy) / (4*BODYPART_COST.work + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 5));
        let body = [];

        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts * 4, () => WORK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyDozer = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.move + BODYPART_COST.work)), Math.floor((MAX_CREEP_SIZE) / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => WORK));
        body = body.concat(_.times(numberOfParts, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyPriest = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.move + BODYPART_COST.heal)), Math.floor((MAX_CREEP_SIZE) / 2));

        if (numberOfParts >= 2) {
            let body = [];
            body = body.concat(_.times(1, () => HEAL));
            body = body.concat(_.times(numberOfParts-1, () => MOVE));
            body = body.concat(_.times(numberOfParts-1, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        return [];
    };

    Room.prototype.getBodyBowman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let numberOfParts = 0;
        let body = [];

        numberOfParts = Math.min(Math.floor((energy - 2*BODYPART_COST.move - 2*BODYPART_COST.heal) / (BODYPART_COST.move + BODYPART_COST.ranged_attack)), Math.floor((MAX_CREEP_SIZE - 4) / 2));
        body = [];
        if (numberOfParts > 0) {
            body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
            body = body.concat(_.times(1, () => MOVE));
            body = body.concat(_.times(2, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        numberOfParts = Math.min(Math.floor((energy - BODYPART_COST.move - BODYPART_COST.heal) / (BODYPART_COST.ranged_attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 2) / 2));
        body = [];
        if (numberOfParts > 0) {
            body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
            body = body.concat(_.times(1, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.ranged_attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 2));
        body = [];
        if (numberOfParts > 0) {
            body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        return [];
    };

    Room.prototype.getBodyCrossbowman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;

        let numberOfParts = Math.min(Math.floor((energy - 2*BODYPART_COST.tough - BODYPART_COST.move - 2*BODYPART_COST.heal) / (4*BODYPART_COST.ranged_attack + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 5) / 5));
        let body = [];

        if (numberOfParts > 0) {
            body = body.concat(_.times(2, () => TOUGH));
            body = body.concat(_.times(numberOfParts * 4, () => RANGED_ATTACK));
            body = body.concat(_.times(numberOfParts, () => MOVE));
            body = body.concat(_.times(2, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyArcher = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;

        // Create a balanced body of RANGED_ATTACK/MOVE as big as possible with the given energy.
        // Each creep will get at least one of each.
        let healParts = 10;
        let numberOfParts = Math.min(Math.floor((energy - healParts*BODYPART_COST.move - healParts*BODYPART_COST.heal) / (BODYPART_COST.move + BODYPART_COST.ranged_attack)), Math.floor((MAX_CREEP_SIZE - healParts - healParts) / 2));
        let body = [];

        if (numberOfParts > 0) {
            body = body.concat(_.times(numberOfParts, () => [RANGED_ATTACK, MOVE]).flatten());
            body = body.concat(_.times(healParts-1, () => MOVE));
            body = body.concat(_.times(healParts, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));
        }
        else {
            body = this.getBodyBowman();
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyWatchman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;

        // Create a balanced body of RANGED_ATTACK/MOVE as big as possible with the given energy.
        // Each creep will get at least one of each.
        let healParts = 10;
        let numberOfParts = Math.min(Math.floor((energy - healParts*BODYPART_COST.move - healParts*BODYPART_COST.heal) / (BODYPART_COST.move + BODYPART_COST.ranged_attack)), Math.floor((MAX_CREEP_SIZE - healParts - healParts) / 2));
        //let numberOfParts = Math.min(Math.floor((energy - healParts*BODYPART_COST.move - healParts*BODYPART_COST.heal - BODYPART_COST.move - BODYPART_COST.attack) / (BODYPART_COST.move + BODYPART_COST.ranged_attack)), Math.floor((MAX_CREEP_SIZE - healParts - healParts - 2) / 2));
        let body = [];

        if (numberOfParts > 0) {
            // body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            // body = body.concat(_.times(numberOfParts, () => MOVE));
            // body = body.concat(_.times(healParts-1, () => MOVE));
            // body = body.concat(_.times(healParts, () => HEAL));
            // body = body.concat(_.times(1, () => MOVE));

            // body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            // body = body.concat(_.times(1, () => ATTACK));
            // body = body.concat(_.times(numberOfParts, () => MOVE));
            // body = body.concat(_.times(healParts-1, () => MOVE));
            // body = body.concat(_.times(healParts, () => HEAL));
            // body = body.concat(_.times(1, () => MOVE));
            // body = body.concat(_.times(1, () => MOVE));

            // body = body.concat(_.times(numberOfParts, () => MOVE));
            // body = body.concat(_.times(healParts-1, () => MOVE));
            // body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            // body = body.concat(_.times(healParts, () => HEAL));
            // body = body.concat(_.times(1, () => MOVE));

            // body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
            // body = body.concat(_.times(numberOfParts, () => MOVE));
            // body = body.concat(_.times(healParts-1, () => MOVE));
            // body = body.concat(_.times(healParts, () => HEAL));
            // body = body.concat(_.times(1, () => MOVE));

            //body = body.concat(_.times(numberOfParts, () => MOVE));
            body = body.concat(_.times(numberOfParts, () => [RANGED_ATTACK, MOVE]).flatten());
            body = body.concat(_.times(healParts-1, () => MOVE));
            body = body.concat(_.times(healParts, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));
        }
        else {
            body = this.getBodyBowman();
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getRangedBodyByIncomingDamage = function(options) {
		let defaults = {
            incomingDamage: 0
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Minimum will be 3 tough and 5 heal. That will cover 800 incoming damage.
        const boostedHealPower = HEAL_POWER * C.MAX_BOOST_HEAL;
        const reducedDamage = options.incomingDamage * C.MAX_BOOST_REDUCEDAMAGE;
        const toughParts = Math.max(3, Math.ceil(reducedDamage / 100))  // 100 is per-bodypart hit points.
        const healParts = Math.max(5, Math.ceil(reducedDamage / boostedHealPower));
        const moveParts = 10;  // Mandatory to move 1 on plains for a 50 part creep.
        const rangedAttackParts = MAX_CREEP_SIZE - toughParts - healParts - moveParts;

        // Did we have enough space after damage for ranged attack parts?
        if (rangedAttackParts > 0) {
            body = body.concat(_.times(toughParts, () => TOUGH));
            body = body.concat(_.times(rangedAttackParts, () => RANGED_ATTACK));
            body = body.concat(_.times(moveParts - 1, () => MOVE));
            body = body.concat(_.times(healParts, () => HEAL));
            body = body.concat(_.times(1, () => MOVE));
        }
        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    }

    Room.prototype.getBodyStriker = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let body = [];

        body = body.concat(_.times(10, () => MOVE));
        body = body.concat(_.times(20, () => ATTACK));
        body = body.concat(_.times(10, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyCardinal = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        body = body.concat(_.times(25, () => MOVE));
        body = body.concat(_.times(25, () => HEAL));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyBlacksmith = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let body = [];

        // Carry parts needed to pickup unboosted resources are 50% return on boosted inputs, which are 30 per part. (4+18)*30*.5 = 330.
        // body = body.concat(_.times(4, () => TOUGH));
        // body = body.concat(_.times(6, () => CARRY));
        // body = body.concat(_.times(22, () => MOVE));
        // body = body.concat(_.times(18, () => ATTACK));

        // No carry parts used since we want to focus on burning down powerbank and returning quickly.
        // Let rook/rogue pickup resources.
        body = body.concat(_.times(4, () => TOUGH));
        body = body.concat(_.times(25, () => MOVE));
        body = body.concat(_.times(21, () => ATTACK));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyBishop = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Carry parts needed to pickup unboosted resources are 50% return on boosted inputs, which are 30 per part. 8*30*.5 = 120.
        // Note for blacksmith using 18 attack would only need 7 heal/move instead of 8.
        body = body.concat(_.times(3, () => CARRY));
        body = body.concat(_.times(8, () => MOVE));
        body = body.concat(_.times(8, () => HEAL));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyClerk = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;
        let body = [];

        // Need to carry enough parts to carry 1000 ghodium.
        let numberOfParts = Math.ceil(SAFE_MODE_COST / CARRY_CAPACITY);

        body = body.concat(_.times(numberOfParts, () => CARRY));
        body = body.concat(_.times(Math.ceil(numberOfParts / 2), () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyGnome = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let body = [];

        body.push(WORK);
        body.push(CARRY);
        body.push(MOVE);

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyFencer = function(options) {
		let defaults = {
			energy: this.controller.level >= 3 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
		};
		options = _.defaults({}, _.clone(options), defaults);

        let body = [];

        body.push(ATTACK);
        body.push(MOVE);

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodySpearman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;

        // Level 8 configuration.
        let body = [];
        body = body.concat(_.times(17, () => RANGED_ATTACK));
        body = body.concat(_.times(24, () => MOVE));
        body = body.concat(_.times(8, () => HEAL));
        body = body.concat(_.times(1, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        // Level 7 configuration.
        body = [];
        body = body.concat(_.times(9, () => RANGED_ATTACK));
        body = body.concat(_.times(12, () => MOVE));
        body = body.concat(_.times(4, () => HEAL));
        body = body.concat(_.times(1, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        // Level 6 configuration.
        body = [];
        body = body.concat(_.times(8, () => RANGED_ATTACK));
        body = body.concat(_.times(9, () => MOVE));
        body = body.concat(_.times(2, () => HEAL));
        body = body.concat(_.times(1, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        // All other lower levels.
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.ranged_attack + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        body = [];

        body = body.concat(_.times(numberOfParts, () => RANGED_ATTACK));
        body = body.concat(_.times(numberOfParts, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }

        return [];
    };

    Room.prototype.getBodyPreacher = function(options) {
        let defaults = {
            energy: this.controller.level >= 2 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , claimParts: MAX_CREEP_SIZE
        };
        options = _.defaults({}, _.clone(options), defaults);

        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        // Special logic for capping at 14 move parts for normal reserving.
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.claim + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2), options.claimParts === MAX_CREEP_SIZE ? MAX_CREEP_SIZE : 14);
        let body = [];

        // Special case to make up to 5 move parts per claim piece, so it can move over swamp in 1 tick.
        let numberOfSingleClaimMoveParts = Math.min(Math.min(Math.floor((energy - BODYPART_COST.claim) / (BODYPART_COST.move)),Math.floor((MAX_CREEP_SIZE - 1) / 1)), 5);

        // Pure preachers have 1 body part, and therefore give them 5 move parts to move over swamps in one tick.
        let moveParts = (options.claimParts === 1) ? numberOfSingleClaimMoveParts : numberOfParts

        body = body.concat(_.times(Math.min(numberOfParts, moveParts), () => MOVE));
        body = body.concat(_.times(Math.min(numberOfParts, (options.claimParts || numberOfParts)), () => CLAIM));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyLlama = function(options) {
        let defaults = {
            energy: this.controller.level >= 2 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , useEnergyAvailable: false
        };
        options = _.defaults({}, _.clone(options), defaults);

        // Determine if we should create creep with energy we have right now, or wait till extensions are full.
        if (options.useEnergyAvailable) {
            options.energy = this.energyAvailable;  // Whatever we have now, in case of emergency really.
        }
        let body = [];

        // Llamas need to carry 3000 / 300 (source power) * 30 (avg distance from source to storage) * 2 / 50 (carry capacity of each part)
        // This is 12 carry parts.

        if (this.colonyShouldHaveRoads >= 0) {
            let numberOfParts = Math.min(6, Math.min(Math.floor(options.energy / (BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3)));
            body = body.concat(_.times(numberOfParts, () => [CARRY, CARRY, MOVE]).flatten());
        }
        else {
            // Low level strategy is to move around without roads.
            let numberOfParts = Math.min(12, Math.min(Math.floor(options.energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2)));
            body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyOx = function(options) {
		let defaults = {
			energy: this.controller.level >= 1 ? this.energyCapacityAvailable : SPAWN_ENERGY_START
            , carryParts: 50
		};
		options = _.defaults({}, _.clone(options), defaults);
        let body = [];

        // Try to make a 2 work part creep, obeying the max count on carry parts.
        let workParts = 0;
        let numberOfParts = 0;
        let repeat = [];

        if (!this.isFOB) {
            if (this.shouldCreateSourceTrails) {
                workParts = 2;
                numberOfParts = Math.min(Math.floor((options.energy - BODYPART_COST.work*workParts - BODYPART_COST.move*workParts) / (BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - workParts - workParts) / 3));
                repeat = [CARRY, CARRY, MOVE];
                numberOfParts = Math.min(numberOfParts, Math.ceil((options.carryParts / 2)));
            }
            else {
                workParts = 0;
                numberOfParts = Math.min(Math.floor((options.energy) / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 2));
                repeat = [CARRY, MOVE];
                numberOfParts = Math.min(numberOfParts, Math.ceil((options.carryParts / 2)));
            }
        }

        // If I can't make a body with two work parts and at least one carry, then remake with 1 work part at least to give 1w1c2m
        if (numberOfParts < 1) {
            workParts = 1;
            numberOfParts = Math.min(Math.floor((options.energy - BODYPART_COST.work - BODYPART_COST.move) / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 2) / 2));
            repeat = [CARRY, MOVE];
            numberOfParts = Math.min(numberOfParts, options.carryParts);
        }

        if (numberOfParts > 0) {
            body = [];

            // Begin with a work to do road repairs...
            body = body.concat(_.times(workParts, () => WORK));

            // Repeating body section.
            body = body.concat(_.times(numberOfParts, () => repeat).flatten());

            // End with a move...
            body = body.concat(_.times(workParts, () => MOVE));

            // Do we left than/equal to 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && (options.energy - utils.getBodyCost(body) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= options.energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyBurro = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyDonkey = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyJackass = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyEngineer = function(options) {
		let defaults = {
			includeClaim: false
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        if (options.includeClaim) {
            let numberOfParts = Math.min(7, Math.min(Math.floor((energy - BODYPART_COST.claim - BODYPART_COST.move) / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE - 2) / 2)));

            body = [];
            body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());
            body = body.concat(CLAIM);
            body = body.concat(MOVE);

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        if (!options.includeClaim) {
            // Cap of 1000 capacity on the reactor.
            let numberOfParts = Math.min(7, Math.min(Math.floor((energy) / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 2)));

            body = [];
            body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        return [];
    };

    Room.prototype.getBodyHorse = function(options) {
		let defaults = {
			offroad: true
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = 0;
        let body = [];

        if (options.offroad) {
            numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
            body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());
        }
        else {
            numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3));
            body = body.concat(_.times(numberOfParts, () => [CARRY, CARRY, MOVE]).flatten());

            // Do we have less than/equal to 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && ((energy - utils.getBodyCost(body)) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyRogue = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyScavenger = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 2));
        let body = [];

        body = body.concat(_.times(numberOfParts, () => [CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyMule = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        // 40w 10m intended to be boosted.
        body = body.concat(_.times(10, () => [CARRY, CARRY, CARRY, CARRY, MOVE]).flatten());

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyScout = function() {
        // Simple creep, only 1 move! Can move thru swamps each tick.
        let body = [];
        body.push(MOVE);

        return body;
    };

    Room.prototype.getBodyRecon = function() {
        // Simple creep, only 1 move! Can move thru swamps each tick.
        let body = [];
        body.push(MOVE);

        return body;
    };

    Room.prototype.getBodyCrier = function(maxMove = false) {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = 0;
        let body = [];

        if (this.atMaxLevel && this.atSpawningEnergyCapacityForCurrentLevel) {
            // Level 8 rooms are subject to maximum of 15 upgrader controller work parts.
            // We want to be able to completely empty the controller link in one withdraw.
            // We want to move at speed 2 so we need a 4/1 work/move ratio.
            // So this shoud be 15w/16c/4m
            body = body.concat(_.times(CONTROLLER_MAX_UPGRADE_PER_TICK, () => WORK));
            body = body.concat(_.times(LINK_CAPACITY / 2 / CARRY_CAPACITY, () => CARRY));
            if (maxMove) {
                body = body.concat(_.times(Math.ceil(CONTROLLER_MAX_UPGRADE_PER_TICK / 2), () => MOVE));
            }
            else {
                body = body.concat(_.times(Math.ceil(CONTROLLER_MAX_UPGRADE_PER_TICK / 4), () => MOVE));
            }

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        // Special level 3 body. Won't have roads yet, so its a 3w/1m ratio.
        if ((this.controller.level === 3) && this.atSpawningEnergyCapacityForCurrentLevel) {
            body = body.concat(_.times(6, () => WORK));
            body = body.concat(_.times(2, () => CARRY));
            body = body.concat(_.times(2, () => MOVE));

            // Check to see that we can make this body.
            if (utils.getBodyCost(body) <= energy) {
                return body;
            }
        }

        // Lower level rooms we want a walk speed of 2 on road.
        // Get as many work parts in that will support that. 4w/1m is ideal.
        numberOfParts = Math.min(Math.floor((energy) / (BODYPART_COST.work*4 + BODYPART_COST.carry*2 + BODYPART_COST.move)), Math.floor((MAX_CREEP_SIZE) / 7));
        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts*4, () => WORK));
            body = body.concat(_.times(numberOfParts*2, () => CARRY));
            body = body.concat(_.times(numberOfParts, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyProphet = function() {
        return this.getBodyCrier(true);
    };

    Room.prototype.getBodyBellman = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        // Lower level rooms we want a walk speed of 2 on road.
        // Get as many work parts in that will support that.
        if (this.atMaxLevel) {
            // Level 8 configuration only.
            body = body.concat(_.times(21, () => WORK));
            body = body.concat(_.times(8, () => CARRY));
            body = body.concat(_.times(21, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyDiviner = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        // Lower level rooms we want a walk speed of 4 on road.
        // Get as many work parts in that will support that.
        // if (this.atMaxLevel) {
        //     // Level 8 configuration only.
        //     body = body.concat(_.times(42, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(6, () => MOVE));
        // }
        // else if (this.controller.level === 7) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(28, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(4, () => MOVE));
        // }
        // else if (this.controller.level === 6) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(20, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(4, () => MOVE));
        // }
        // else if (this.controller.level === 5) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(16, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(2, () => MOVE));
        // }
        // else if (this.controller.level === 4) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(11, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(2, () => MOVE));
        // }
        // else if (this.controller.level === 3) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(7, () => WORK));
        //     body = body.concat(_.times(1, () => CARRY));
        //     body = body.concat(_.times(1, () => MOVE));
        // }


        // if (this.atMaxLevel) {
        //     // Level 8 configuration only.
        //     body = body.concat(_.times(40, () => WORK));
        //     body = body.concat(_.times(4, () => CARRY));
        //     body = body.concat(_.times(6, () => MOVE));
        // }
        // else if (this.controller.level === 7) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(27, () => WORK));
        //     body = body.concat(_.times(4, () => CARRY));
        //     body = body.concat(_.times(4, () => MOVE));
        // }
        // else if (this.controller.level === 6) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(20, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(4, () => MOVE));
        // }
        // else if (this.controller.level === 5) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(16, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(2, () => MOVE));
        // }
        // else if (this.controller.level === 4) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(11, () => WORK));
        //     body = body.concat(_.times(2, () => CARRY));
        //     body = body.concat(_.times(2, () => MOVE));
        // }
        // else if (this.controller.level === 3) {
        //     // Level 7 configuration only.
        //     body = body.concat(_.times(7, () => WORK));
        //     body = body.concat(_.times(1, () => CARRY));
        //     body = body.concat(_.times(1, () => MOVE));
        // }


        // Level 8 configuration only.
        body = body.concat(_.times(30, () => WORK));
        body = body.concat(_.times(5, () => CARRY));
        body = body.concat(_.times(15, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyOracle = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        // Level 8 configuration only.
        body = body.concat(_.times(30, () => WORK));
        body = body.concat(_.times(5, () => CARRY));
        body = body.concat(_.times(15, () => MOVE));

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyHerald = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let body = [];

        if (this.atMaxLevel) {
            // Level 8 configuration only.
            // body = body.concat(_.times(36, () => WORK));
            // body = body.concat(_.times(5, () => CARRY));
            // body = body.concat(_.times(9, () => MOVE));

            // Level 8 configuration only.
            body = body.concat(_.times(32, () => WORK));
            body = body.concat(_.times(10, () => CARRY));
            body = body.concat(_.times(8, () => MOVE));
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyCarpenter = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3));
        let body = [];

        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => WORK));
            body = body.concat(_.times(numberOfParts, () => CARRY));
            body = body.concat(_.times(numberOfParts, () => MOVE));

            // Do we left than/equal to 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && (energy - utils.getBodyCost(body) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

    Room.prototype.getBodyMason = function() {
        // Total amount of energyCapacity of all spawns and extensions in the room.
        let energy = this.energyCapacityAvailable;  // Full energy
        let numberOfParts = Math.min(Math.floor(energy / (BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move)), Math.floor(MAX_CREEP_SIZE / 3));
        let body = [];

        if (numberOfParts) {
            body = body.concat(_.times(numberOfParts, () => WORK));
            body = body.concat(_.times(numberOfParts, () => CARRY));
            body = body.concat(_.times(numberOfParts, () => MOVE));

            // Do we left than/equal to 48 parts and enough energy to add in one more carry+move combo?
            if ((body.length <= 48) && (energy - utils.getBodyCost(body) >= (BODYPART_COST.carry + BODYPART_COST.move))) {
                body.push(CARRY);
                body.push(MOVE);
            }
        }

        // Check to see that we can make this body.
        if (utils.getBodyCost(body) <= energy) {
            return body;
        }
        return [];
    };

}
