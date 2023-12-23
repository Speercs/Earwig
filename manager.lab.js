"use strict";

module.exports = function() {

    Object.defineProperty(Room.prototype, 'labOutput', {
        get() {
            return this.memory.labOutput;
        },
        configurable: true, enumerable: true,
    });

    // Returns ture if creep is busy managing lab. False otherwise leaving it free to do other things.
    Creep.prototype.manageLab = function() {

        // Shorthand.
        let creep = this;
        let room = this.room;

        // If the labs don't exist we are done.
        if (!room.colonyLab1 || !room.colonyLab2 || !room.colonyLab3) return false;

        // If myTerminal does not exist we are done.
        if (!room.myTerminal) return false;

        // If we are being unclaimed, then bail out.
        if (room.unclaimFlag) return false;

        // Hydrate our labs!
        let working = creep.setLabMinerals();
        if (working) working = creep.hydrateLabs();
        if (working) creep.talk('🔬');
        return working;
    }

    // Returns ture if creep is busy managing lab. False otherwise leaving it free to do other things.
    Creep.prototype.setLabMinerals = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Make sure we have at least an empty array.
        if (!room.memory.labMinerals) room.memory.labMinerals = []

        // Attempt to switch out to boost minerals if we need them and we have them.
        // Otherwise keep on reacting as normal.
        let boostMinerals = [];
        if (!room.isRoomProperlyBoosted) {
            // This will get called the entire time while peon creep is hydrating.
            // New creeps could spawn or enter the room and this would need to be updated.
            boostMinerals = creep.getBoostLabMinerals();
            if (boostMinerals.length) {
                delete room.memory.labMinerals;
                delete room.memory.labOutput;
                delete room.memory.labsReacting;
                delete room.memory.labReactionMineralsSet;
                room.memory.labMinerals = boostMinerals;

                // Are we missing any resources?
                return room.areLabsMissinBoostResources();
            }
        }

        // Check that we can react, aren't boosting, and aren't already reacting...and if not, get those labs cookin'!
        if (!boostMinerals.length && !room.memory.labsReacting && !room.memory.labReactionMineralsSet && !RoomIntel.getHostilesTTL(room.name)) {
            delete room.memory.labMinerals;
            delete room.memory.labOutput;
            room.memory.labReactionMineralsSet = true;
            room.memory.labMinerals = creep.getReactionLabMineralArray();
            // Save the output (in lab 3 which is zero indexed).
            if (room.memory.labMinerals[2]) {
                room.memory.labOutput = room.memory.labMinerals[2].mineralType;
            }
        }

        return true;
    }

    Room.prototype.areLabsMissinBoostResources = function() {
        //return !!(this.memory.labMinerals || []).find(f => !this.inLabResources[f.mineralType] || (!this.inLabResources[f.mineralType] === f.mineralAmount));
        return !!(this.memory.labMinerals || []).find(resource => !this.colonyLabs.find(lab => lab.store.getUsedCapacity(resource.mineralType) === resource.mineralAmount));
    }

	Object.defineProperty(Room.prototype, 'roomResources', {
		get() {
			if (typeof this._roomResources === "undefined") {
                let stores = [];

				if (this.storage) stores.push(this.storage.store);
				if (this.terminal) stores.push(this.terminal.store);
				if (this.rook) stores.push(this.rook.store);
				if (this.king) stores.push(this.king.store);
				stores = stores.concat(this.colonyLabs.map(m => m.store));

                this._roomResources = utils.mergeStores(stores);
			}
			return this._roomResources;
		},
		configurable: true, enumerable: true,
	});

    /**
     * Returns the amount of all stored resources.
     * Note that energy is not ideal since it will include colony labs, which are not really accessible values for energy.
     */
    Room.prototype.getResourceAmount = function(resourceType) {
        return this.roomResources[resourceType] || 0;
    }

    Creep.prototype.getReactionLabMineralArray = function() {
        // https://docs.screeps.com/resources.html

        // Shorthand.
        let creep = this;
        let room = this.room;

        let minimumAmountToProcess = Math.max(LAB_BOOST_MINERAL, creep.store.getCapacity());
        let amountToProcess = 0;
        let craftable = null;
        let craftables = []
        let minerals = [];

        GameManager.addProcess('getReactionLabMineralArray');

        // Bail out if the room is being unclaimed.
        if (room.unclaimFlag) return minerals;

        // Get all the minerals in this room.
        let availableMinerals = room.roomResources;

        // Make sure we have a minimum of each type of mineral before we try to do anything with basic resources.
        // We are going to exclude X as it isn't a basic building block for all other reactions.
        let haveBasicResources = !C.TERMINAL_MINERALS_RAW_BASE.find(f => !availableMinerals[f] || (availableMinerals[f] < minimumAmountToProcess) || !GameManager.empireMineralTypesHash[f]);
        let reactions = C.REACTIONS_UNIQUE;
        //let haveMaxMinerals = !C.TERMINAL_MINERALS_RAW.find(f => room.getResourceAmount(f) < room.getResourceMaxAmount(f));

        // Get our global resource that we have least of and nobody is working on, just in case our labs would be dry otherwise.
        let empireResourceTypesBelowMax = _.omit(GameManager.empireResourceTypesBelowMaxSortedHash, GameManager.labOutputsArray);

        // Loop through each reaction, and determine if we have enough minerals to make it.
        for (let r=0; r<reactions.length; r++) {
            let compound1 = reactions[r].compound1;
            let compound2 = reactions[r].compound2;
            let result = reactions[r].result;
            let amountOnHand = availableMinerals[result] || 0;

            for (let pass = 0; pass <= 1; pass++) {
                // Exclude tiers that have enough of all minerals.
                if (
                    // Make sure we have enough of the two compounds needed to make this reaction.
                    ((availableMinerals[compound1] || 0) >= minimumAmountToProcess)
                    && ((availableMinerals[compound2] || 0) >= minimumAmountToProcess)
                    && (
                        // Low level (any) tiers just have to hit their lower processing amount which is lab capacity 3000
                        (amountOnHand < Config.params.TERMINAL_STORE_TARGET)
                        // First pass through, only care about getting to our minimal amount.
                        // On our second pass thru, we want all levels reguardless of current amounts.
                        // This means we could exceed our max, but the terminal will spread out the remainder.
                        || (pass==1)
                        // But tier 3 is unlimited. If we have mats, we should make tier3 first.
                        || C.TERMINAL_COMPOUNDS_TIER3_HASH[result]
                    )
                ) {
                    // Determine what tier this mineral is in.
                    let tier = 0;
                    let doMultipleAmount = true;

                    if ((empireResourceTypesBelowMax[result]) && (amountOnHand == room.getResourceMaxAmount(result))) {
                        // This is our most scarce empire wide resource types. Build last in order of empire rank.
                        // If amountOnHand is OVER max, then wait for it to be sent before making more.
                        tier = 100 + empireResourceTypesBelowMax[result];
                        doMultipleAmount = false;
                    }
                    else if (amountOnHand >= room.getResourceMaxAmount(result)) {
                        // Exclude this resource we already have enough and no other terminal needs any in tier 100.
                        // With the exception of upgrade controller, which we can ALWAYS have cooking to make/use locally on prophets.
                        // Only do this when we have max amount of minerals in the room and we aren't short on anything.
                        //tier = (haveMaxMinerals && (result === C.BOOST_COMPOUNDS[C.BOOST_UPGRADECONTROLLER])) ? 200 : 0;

                        // NOPE: the most efficient way to upgrade is with temples; not boosted prophets.
                        // And temples already know not to kick off until is at level.
                        tier =  0;
                    }
                    else if ((pass==1) && (amountOnHand >= room.getResourceTargetAmount(result))) {
                        // On our second pass, every reaction has equal value.
                        // Overflow will be sent to other rooms.
                        tier = 8;
                    }
                    else if (pass==1) {
                        // Else, on our second pass, every reaction has equal value.
                        tier = 7;
                    }
                    else if (haveBasicResources && (amountOnHand >= Config.params.TERMINAL_STORE_TARGET)) {
                        // This is tier 3 mats in the first pass.
                        // Store enough to fill an boost lab, but let all other tiers get SOMETHING.
                        tier = 6;
                    }
                    else if (!room.atMaxLevel && C.TERMINAL_COMPOUNDS_UPGRADE_CONTROLLER_HASH[result]) {
                        // These mineral types will be priority because we need to upgrade our controller.
                        tier = 1;
                    }
                    else if (C.TERMINAL_COMPOUNDS_TIER3_HASH[result]) {
                        // Easy, if we can make it, then do it.
                        // Most imortant tier, and mats are straightfoward.
                        tier = 2;
                    }
                    else if (haveBasicResources && C.TERMINAL_COMPOUNDS_BASE_HASH[result]) {
                        // Base materials NEED to be in place for other "lower" tiers to work, go figure.
                        // So make sure these are in stock before moving on.
                        tier = 3;
                    }
                    else if (C.TERMINAL_COMPOUNDS_TIER2_HASH[result]) {
                        // Easy, if we can make it, then do it.
                        // However, relies on OH which is generated by base mats.
                        tier = 4;
                    }
                    else if (haveBasicResources && C.TERMINAL_COMPOUNDS_TIER1_HASH[result]) {
                        // Low tier from raw mats AND things that should be in hopper.
                        tier = 5;
                    }
                    else {
                        // Debug tier, something is missing.
                        tier = 0;
                    }

                    if (tier > 0) {
                        // Determine the biggest multiple of our labtechs capacity to get.
                        // We don't need amounts past our maxes however.
                        // Avoid processing multiple amounts for long-cooldown tier3 outputs.
                        amountToProcess = minimumAmountToProcess;
                        doMultipleAmount = doMultipleAmount && !C.TERMINAL_COMPOUNDS_TIER3_HASH[result];
                        for (let i=minimumAmountToProcess; doMultipleAmount && (i<=LAB_MINERAL_CAPACITY); i=i+minimumAmountToProcess) {
                            if (
                                (availableMinerals[compound1] >= i)
                                && (availableMinerals[compound2] >= i)
                                && ((amountOnHand + amountToProcess) < Config.params.TERMINAL_STORE_MAX)
                            ) {
                                amountToProcess = i;
                            }
                            else {
                                // Save those cpu cycles...
                                break;
                            }
                        }

                        // Each process consumes 5 from both sources and yields 5 of the new compound.
                        // Get the dups into same order as reactions can go both ways.
                        if (compound1 < compound2)
                            craftables.push({tier:tier, mineralType:result, input1:compound1, input2:compound2, amountOnHand:amountOnHand, amountToProcess:amountToProcess})
                        else
                            craftables.push({tier:tier, mineralType:result, input1:compound2, input2:compound1, amountOnHand:amountOnHand, amountToProcess:amountToProcess})
                    }

                }
            }
        }

        // Get the list of unique reactions, and sort by the one we currently have the least output of grouped by tier.
        craftables = _.sortByOrder(craftables, [s1 => s1.tier, s2 => s2.amountOnHand]);
        craftable = craftables.find(x => x !== undefined);

        if (craftable) {
            minerals.push({mineralType:craftable.input1, mineralAmount:craftable.amountToProcess, type:'input'});
            minerals.push({mineralType:craftable.input2, mineralAmount:craftable.amountToProcess, type:'input'});
            for (var i=0; i<room.colonyLabs.length - 2; i++)
                minerals.push({mineralType:craftable.mineralType, mineralAmount:0, type:'output'});
        }

        //console.log(JSON.stringify(minerals))
        //console.log("availableMinerals[compound2]", availableMinerals['OH'])

        return minerals;
    }

    Room.prototype.runReaction = function() {
        // Shorthand.
        let room = this;

        // Clear our full flag.
        if (room.memory.runReactionFullId !== undefined) delete room.memory.runReactionFullId;

        // Is this room even lab capable?
        if (!CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level]) return false;

        // Is this room a temple? Bail out if so.
        if (room.isTemple) return false;

        let lab1 = room.colonyLab1;
        let lab2 = room.colonyLab2;
        let lab3 = room.colonyLab3;

        // If the labs don't exist we are done. Only need to test the first 3.
        if (!lab1 || !lab2 || !lab3) return false;

        // Bail out if we are in the process of filling labs with necessary minerals.
        if (!room.memory.labsReacting) return false;

        // If either input labs are empty, bail out.
        if (!lab1.mineralType || !lab2.mineralType) {
            delete room.memory.labsReacting;
            delete room.memory.labReactionMineralsSet;
            return false;
        }

        // Short circuit runReaction by testing for lab3 is still on cooldown. Saves some cpu.
        if (lab3.cooldown) return true;

        // Run the reactions. This may fail from minerals being incorrect or empty labs.
        // If so, it will create a memory entry in the room to be inspected by peon creeps to clear.
        let labs = room.colonyOutputLabs;
        let reacted = false;

        // Keep track of how many incative labs we have.  Want to have at least X of them for unboosting.
        let inactiveLabs = (!lab1.cooldown ? 1 : 0) + (!lab2.cooldown ? 1 : 0);

        // Get the number of creeps that are not currently unboosting but are about to unboost since they are getting close to death.
        // Since there will always be at least one lab ready to process (lab 3 from above check), might as well do it here.
        let reactionCooldown = REACTION_TIME[room.labOutput];
        let creepsAboutToUnboost = room.myCreepsBoosted.filter(f => !f.isUnboosting && (f.ticksToLive - reactionCooldown <= Config.params.UNBOOST_MIN_TTL)).length;
        let unboosteLabsNeeded = room.myCreepsUnboosting.length + creepsAboutToUnboost;

        labs.forEach(labOutput => {
            let result = null;
            if (!labOutput.cooldown) {
                if (inactiveLabs < unboosteLabsNeeded) {
                    // Skip processing on this lab and increase our inactive count.
                    inactiveLabs++;
                }
                else {
                    result = labOutput.runReaction(lab1, lab2);
                    reacted = reacted || (result === OK);
                    // Signal to peons that this lab is full and needs to be emptied.
                    // This is done to differenciate it from boosting labs that are full.
                    if (result === ERR_FULL) room.memory.runReactionFullId = labOutput.id;
                    if ([ERR_INVALID_ARGS, ERR_NOT_ENOUGH_RESOURCES].includes(result)) {
                        delete room.memory.labsReacting;
                        delete room.memory.labReactionMineralsSet;
                    }
                }
            }
        })

        // Return our result.
        return reacted;
    }

    Creep.prototype.hydrateLabs = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        let target;
        let mineralType;
        let mineralAmount;

        creep.logCreep('Beginning hydration of labs.');

        // Labs are busy working, don't touch!
        if (room.memory.labsReacting) return false;

        // Grab our lab minerals from memory so it doesn't have to be calculated each time.
        let minerals = room.memory.labMinerals || [];

        // Determine the best place to dump minerals.
        let storage = (room.myTerminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) ? room.myTerminal : room.myStorage;

        // Quick test for base case, which will be common.
        // We have desired minerals or our labs have something in them, then process.
        if (minerals.length || room.colonyLabsRook.find(f => f.mineralType)) {
            creep.logCreep('We need minerals, or labs have minerals.');
            GameManager.addProcess('hydrateLabs');

            // Find the first mismatch (including empties) or low amounts.
            // Loop starts with the ordered lab sequence, labs 1 & 2 are normal inputs for reactions so they need to be set first.
            for (let i=0; (i < room.colonyLabsRook.length); i++) {
                let lab = room.colonyLabsRook[i];
                if (
                    // Check to see that we have any minerals in our desired list for this lab.
                    !minerals[i]

                    // Less than 5 minerals..how did this happen, boosts?
                    // Take it out, as its useless for reactions -- need 5 minimum.
                    || ((minerals[i].type == 'input') && (lab.usedMineralCapacity < 5))

                    // Flat out have the wrong mineral in this lab.
                    || (lab.mineralType != minerals[i].mineralType)

                    // Have the right mineral in the right lab, but we have too much. Lets go for an exact amount here.
                    || ((minerals[i].type == 'input') && (lab.mineralType == minerals[i].mineralType) && (lab.mineralAmount > minerals[i].mineralAmount))

                    // Have the right minerals in the right lab, but we have too few. Need to get more in there if we have some on us or in our storage.
                    || ((minerals[i].type == 'input') && (lab.mineralType == minerals[i].mineralType) && (lab.usedMineralCapacity < Math.min(LAB_MINERAL_CAPACITY, minerals[i].mineralAmount)) && (creep.store[minerals[i].mineralType] || room.myTerminal.store[minerals[i].mineralType]))

                    // Outputs should be empty while we are filling the lab.
                    || ((minerals[i].type == 'output') && lab.usedMineralCapacity)

                    // Not going to worry about the case of outputs having correct resource but non-zero amount in them.
                    // Logic for signalling a full lab will take care of that.

                ) {
                    // Our target is the lab we are currently working with.
                    target = lab;

                    if (minerals[i]) {
                        mineralType = minerals[i].mineralType;
                        mineralAmount = Math.min(LAB_MINERAL_CAPACITY, minerals[i].mineralAmount);
                    }
                    else {
                        mineralType = null
                        mineralAmount = 0;
                    }

                    creep.logCreep('I am working on ' + target.pos + ',  target mineralType:' + target.mineralType + '/' + target.usedMineralCapacity + ',  desired mineralType: ' + mineralType + '/' + mineralAmount);

                    // // Need to clean out any existing labs that may have mats in them that we need.
                    if (creep.store.getFreeCapacity()) {
                        creep.logCreep('I have free capacity on me...')

                        // Determine if lab has the incorrect minerals (amount is not checked) in it, and start clearing out all subsequent labs if so.
                        // Target could be empty after a full lab reaction!
                        if (!mineralType || !mineralAmount || (target.mineralType !== mineralType)) {
                            for (let j=room.colonyLabsRook.length - 1; j>=i; j--) {
                                let clearLab = room.colonyLabsRook[j];
                                // If creep is completely empty or has the same mats as any other labs down the line, go grab them.
                                // This will empty labs one mineral type at a time. Better than nothing.
                                // Grabbing multipe types of minerals at once is proving to be tricky.
                                // Creep would get two minerals, empty one, and go get more of another while still carrying one of the originals.
                                if (clearLab.mineralType && (!creep.store.getUsedCapacity() || creep.store.getUsedCapacity(clearLab.mineralType))) {
                                    let result = creep.smartGather(clearLab, clearLab.mineralType);
                                    // Attempt to move back to the terminal if we are full after this pickup.
                                    if ((result === OK) && (clearLab.usedMineralCapacity + creep.store.getUsedCapacity() > creep.store.getCapacity())) {
                                        creep.smartMove(room.myTerminal);
                                        creep.logCreep('Attempt to move back to the terminal if we are full after this pickup.')
                                    }
                                    if ([OK, ERR_NOT_IN_RANGE].includes(result)) {
                                        creep.logCreep('Busy clearing out labs down the production line...')
                                        // Busy clearing out labs down the production line...
                                        return true;
                                    }
                                }
                            }
                        }
                    }

                    // Labtech is empty, so go get something from ...
                    if (creep.store.getUsedCapacity() === 0) {
                        creep.logCreep('I have NO mats on me...')

                        // Determine if lab has the incorrect minerals in it, and take from it if so.
                        if (target.mineralType && (!mineralType || (target.mineralType != mineralType))) {
                            if (creep.smartGather(target, target.mineralType) == OK) {
                                creep.smartMove(room.myTerminal);
                                creep.logCreep('Determine if lab has the incorrect minerals in it, and take from it if so.')
                            }
                        }
                        // If our lab is correct type but doesn't have enough, then go get the exact amount more (or as much as we can get)
                        else if ((target.usedMineralCapacity < mineralAmount) && room.myTerminal.store[mineralType]) {
                            if (creep.smartGather(room.myTerminal, mineralType, Math.min(creep.store.getFreeCapacity(), room.myTerminal.store[mineralType], (mineralAmount - target.usedMineralCapacity))) == OK) {
                                creep.smartMove(target);
                                creep.logCreep('If our lab is correct type but doesnt have enough, then go get the exact amount more (or as much as we can get)')
                            }

                        }
                        // If our lab has correct type but has too much, then take some out.
                        else if (target.usedMineralCapacity > mineralAmount) {
                            if (creep.smartGather(target, mineralType, Math.min(creep.store.getFreeCapacity(), (target.usedMineralCapacity - mineralAmount))) == OK) {
                                creep.smartMove(target);
                                creep.logCreep('If our lab has correct type but has too much, then take some out.')
                            }
                        }
                        else {

                            // Something bad happened, can't gather anything more, bail out!
                            // Don't have enough of this particular mineral.
                            // But we still want to process the rest of the labs.
                            creep.logCreep('Something bad happened, cant gather anything more, bail out!')
                            continue;
                        }

                    }

                    // Labtech now has some minerals, do something with them...
                    else if (creep.store.getUsedCapacity() > 0) {
                        creep.logCreep('I have mats on me...')

                        // If the target has the same kind of minerals we have in store and is empty or isn't at capacity, then hand them over.
                        if ((!target.mineralType || (target.mineralType == mineralType)) && (creep.store[mineralType] > 0) && (target.usedMineralCapacity < Math.min(LAB_MINERAL_CAPACITY, mineralAmount))) {
                            if (creep.smartAssigned(target, mineralType, Math.min(creep.store[mineralType], (mineralAmount - target.usedMineralCapacity))) == OK) {
                                creep.smartMove(room.terminal);
                            }
                            creep.logCreep('If the target has the same kind of minerals we have in store and is empty or isnt at capacity, then hand them over.')
                        }
                        else {
                            creep.smartAssigned(storage, _.findKey(creep.store));
                            creep.logCreep('Dump out whatever we have (including energy) in order to start gathering something useful.')

                            // Something bad has happened. Resources got stolen from us, like to fill Nuker.
                            if (mineralType && !creep.store[mineralType] && !room.myTerminal.store[mineralType]) {
                                room.memory.labsReacting = true;
                                creep.logCreep('Something bad has happened. Resources got stolen from us, like to fill Nuker.')
                                return false;
                            }
                        }

                    }

                    // I'm still working!
                    creep.logCreep('Im still working?')
                    return true;
                }
            }

        }

        // Last check to make sure we ourselves are completely empty.
        if (creep.hasMinerals) {
            // Dump out whatever we have in order to start gathering something.
            creep.smartAssigned(storage, _.findKey(creep.store));
            creep.logCreep('Dump out whatever we have in order to start gathering something.');
            return true;
        }

        // Done! Nothing else to do.
        room.memory.labsReacting = true;
        return false;
    }

	Room.prototype.colonyLabsWithMineral = function(mineralType, startIndex) {
		let result = [];

		// Find all the labs of this mineral type.
		for (let i=startIndex; i < this.colonyLabs.length; i++) {
			if (this.colonyLabs[i].mineralType == mineralType)
			result.push(this.colonyLabs[i]);
		}

		return result;
	}

    Creep.prototype.updateBoostArray = function(minerals, amountNeeded, type, action) {
        // Shorthand.
        let room = this.room;

        // If we have room left, add the next most important mineral.
        if (Object.keys(minerals).length < room.colonyLabs.length) {
            if (amountNeeded) {
                // Get a sorted array of the best boosts.
                // NOTE: this boost runs backwards, where a lower number is better.
                let boosts = _.sortBy(room.getBoostArray(type, action), s => s.amount);
                // Special exception for damage boost, lower number is better. Weird huh?
                if (action !== C.BOOST_REDUCEDAMAGE) boosts.reverse();

                // TODO: Only work with tier3 boosts for now.
                //for (let i=0; (i < boosts.length) && (!i || !GameManager.haveAllMineralTerminals); i++) {
                for (let i=0; (i < boosts.length) && (i < 1); i++) {
                    // Get the minimum of the rounded amount we have in store, and what our creeps are asking for.
                    let availableAmount = Math.min(Math.floor(room.getResourceAmount(boosts[i].compound) / LAB_BOOST_MINERAL) * LAB_BOOST_MINERAL, amountNeeded)
                    availableAmount = Math.floor(availableAmount / LAB_BOOST_MINERAL) * LAB_BOOST_MINERAL;
                    // We do have an upper cap of 3000 (which is 100 parts * 30 boost each) in each lab.
                    availableAmount = Math.min(availableAmount, LAB_MINERAL_CAPACITY);
                    // If we have at least one good boost, put it in the hopper.
                    if (availableAmount >= LAB_BOOST_MINERAL) {
                        minerals.push({mineralType:boosts[i].compound, mineralAmount:availableAmount, type:'input'});
                        break;
                    }
                }
            }
        }
    }

    Creep.prototype.getBoostLabMinerals = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;
        let minerals = [];

        GameManager.addProcess('getBoostLabMinerals');

        creep.updateBoostArray(minerals, room.fatigueBoostMineralNeeded, MOVE, C.BOOST_FATIGUE);
        creep.updateBoostArray(minerals, room.rangedAttackBoostMineralNeeded, RANGED_ATTACK, C.BOOST_RANGEDATTACK);
        creep.updateBoostArray(minerals, room.healBoostMineralNeeded, HEAL, C.BOOST_HEAL);
        creep.updateBoostArray(minerals, room.reduceDamageBoostMineralNeeded, TOUGH, C.BOOST_REDUCEDAMAGE);
        creep.updateBoostArray(minerals, room.attackBoostMineralNeeded, ATTACK, C.BOOST_ATTACK);
        creep.updateBoostArray(minerals, room.dismantleBoostMineralNeeded, WORK, C.BOOST_DISMANTLE);
        creep.updateBoostArray(minerals, room.upgradeControllerBoostMineralNeeded, WORK, C.BOOST_UPGRADECONTROLLER);
        creep.updateBoostArray(minerals, room.repairBoostMineralNeeded, WORK, C.BOOST_CONSTRUCTION);
        creep.updateBoostArray(minerals, room.capacityBoostMineralNeeded, CARRY, C.BOOST_CAPACITY);
        creep.updateBoostArray(minerals, room.harvestBoostMineralNeeded, WORK, C.BOOST_HARVEST);

        return minerals;
    }

    Object.defineProperty(Room.prototype, 'labMineralsPrint', {
        get() {
            if (typeof this._labMineralsPrint === "undefined") {
                let intput = '';
                let output = '';
                for (let i = 0; this.memory.labMinerals && i < this.memory.labMinerals.length; i++) {
                    if (this.memory.labMinerals[i].type == 'input')
                        intput = intput + ', ' + this.memory.labMinerals[i].mineralType + ':' + this.memory.labMinerals[i].mineralAmount

                    if (this.memory.labMinerals[i].type == 'output')
                        output = output + ', ' + this.memory.labMinerals[i].mineralType + ':' + this.memory.labMinerals[i].mineralAmount

                }
                let retval;
                if (intput) retval = 'inputs=' + intput.substring(2);
                if (output) retval = retval + '  outputs=' + output.substring(2);
                this._labMineralsPrint = retval;
            }
            return this._labMineralsPrint;
        },
        configurable: true, enumerable: true,
    });

}
