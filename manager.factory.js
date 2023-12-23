"use strict";

module.exports = function() {

    /**
     * Takes into consideration if the room actually has a powercreep as well as a factory.
     */
	Object.defineProperty(Room.prototype, 'factoryLevel', {
		get() {
            if (typeof this._factoryLevel === "undefined") {
                this._factoryLevel = (this.colonyFactory && this.powerCreep) ? (this.colonyFactory.level || 0) : 0;
            }
			return this._factoryLevel;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'factoryBoosted', {
		get() {
            if (typeof this._factoryBoosted === "undefined") {
                this._factoryBoosted = this.colonyFactory ? this.colonyFactory.hasEffect(PWR_OPERATE_FACTORY) : 0;
            }
			return this._factoryBoosted;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'factoryCooldown', {
		get() {
            if (typeof this._factoryCooldown === "undefined") {
                this._factoryCooldown = this.colonyFactory ? this.colonyFactory.cooldown : 0;
            }
			return this._factoryCooldown;
		},
		configurable: true, enumerable: true,
    });

	Room.prototype.getFactoryResourceAmountInRoom = function(resourceType) {
        return (
            (this.terminal ? (this.terminal.store[resourceType] || 0) : 0)
            + (this.colonyFactory ? (this.colonyFactory.store[resourceType] || 0) : 0)
            + (this.king ? (this.king.store[resourceType] || 0) : 0)
        );
    }

	Room.prototype.isFactoryResourceAmountInRoomOverDecompressThreshold = function(resourceType) {
        return this.getFactoryResourceAmountInRoom(resourceType) > (Config.params.FACTORY_STORE_TARGET * 2) + COMMODITIES[resourceType].amount;
    }

	Room.prototype.shouldCommodityBeProduced = function(commodity) {
        // If its not a chain, then just make it.
        if (!C.FACTORY_COMMODITIES_CHAIN_SELL_HASH[commodity]) return true;

        // Based on market data for the chain this commodity is in, is it the best we have.
        let bestInChain = Object.keys(GameManager.highestMarkupPercentCommodityOfChain).find(f => C.COMMODITY_CHAIN[f] === C.COMMODITY_CHAIN[commodity]);

        // Didn't find a best in chain, so just make it?
        if (!bestInChain) return true;

        // The best component is the raw material, we can't "make" it.
        if (!C.RESOURCE_COMPONENTS_HASH[bestInChain]) return false;

        // Now compare the levels. If the best is this commodity's level or above, then make this commodity.
        // Its not always the case that the highest level commodity has the best markup, far from it.  Could be any, and usually the first or low level.
        return (C.RESOURCE_COMPONENTS_HASH[bestInChain].level || 0) >= (C.RESOURCE_COMPONENTS_HASH[commodity].level || 0);
    }

	Object.defineProperty(Room.prototype, 'factoryReadyForBoost', {
		get() {
            if (typeof this._factoryReadyForBoost === "undefined") {
                this._factoryReadyForBoost = false;

                do {
                    // If we are conserving minerals, then we aren't allowing usage of anything that consumes them.
                    if (GameManager.isEmpireConservingMinerals) break;

                    // No factory no joy.
                    let colonyFactory = this.colonyFactory;
                    if (!colonyFactory) break;

                    // No terminal no joy.
                    let myTerminal = this.terminal;
                    if (!myTerminal) break;

                    // Level 0 is irrelevent.
                    let level = this.factoryLevel;
                    if (level === 0) break;

                    GameManager.addProcess('factoryReadyForBoost');

                    // Get a list of commodities that require specified level and we aren't already at target amount.
                    // We want to make, but won't be selling, the "common" higher commodities.
                    // Our terminal is where we are staging commodities, so if we have an overstock there, then don't make any more.
                    let commodities = C.FACTORY_COMMODITIES_BY_LEVEL_HASH[level].filter(f => this.getFactoryResourceAmountInRoom(f) < Config.params.FACTORY_STORE_TARGET);

                    // Note that we only need to find one complete chain of the four (five including commons).
                    for (let product of commodities) {
                        // Determine if we are ready to boost.
                        if (
                            // If we don't find a component in our factory that is below our target for at least one of the commodities we want to build, we are ready for boost.
                            !Object.keys(COMMODITIES[product].components).find(component => (colonyFactory.store[component] || 0) < utils.getComponentAmountForProduct(component, product))

                            // The level of the commodity needs to be at or below the level of the best markup percentage in its chain.
                            && this.shouldCommodityBeProduced(product)
                        ) {
                            this._factoryReadyForBoost = true;
                            break;
                        }
                    }
                } while (false)
            }
			return this._factoryReadyForBoost;
		},
		configurable: true, enumerable: true,
    });

    Room.prototype.produceCommodities = function() {
        // Shorthand.
        let room = this;

        // If we are inactive, then bail out.
        if (room.unclaimFlag) return false;

        // Do we even have a factory?
        let colonyFactory = room.colonyFactory;
        if (!colonyFactory) return false;

        // Do we even have a terminal?
        let myTerminal = room.terminal;
        if (!myTerminal) return false;

        // If the factory is on cooldown we are done.
        // Returning true because cooldown indicates we actually did something.
        if (colonyFactory.cooldown) return true;

        // Can only make higher level commodities when we have our boost in effect by the power creep.
        let effectLevel = room.factoryBoosted ? room.factoryLevel : 0;

        // Luckily, the heirarchy of commodities is purely one way.
        // Therefore we should always make commodities in order that they are needed.
        // Level 2 and higher rely on -1 lower level commodities that cannot be made by this factory.
        // We will have to rely on other factories creating them and shipping them to us via terminal.

        // This function will check that we have all our components and produce the commodity if possible.
        let produceCommodity = function(commodities, name) {
            GameManager.addProcess('produceCommodities');

            for (let commodity of commodities) {
                // If our factory doesn't have the target amount of this commodity, then try to make it.
                // Kings will move the output into the terminal if we don't need it.
                // The terminals in turn will sell any overstock that can't be moved around.

                // This is a check for batteries. We shouldn't be making these at all unless we have max energy for whatever reason.
                if ((commodity === RESOURCE_BATTERY) && (!room.atMaxLevel || !room.isStorageEnergyBattery)) continue;

                // The level of the commodity needs to be at or below the level of the best markup percentage in its chain.
                if (!room.shouldCommodityBeProduced(commodity)) continue;

                if (
                    // Level zero items are needed by higher levels, so always have enough in the terminal as well.
                    // Batteries are fungibles, so they have a different (higher) value.
                    //(C.FACTORY_COMMODITIES_LEVEL0_HASH[commodity] && (myTerminal.store.getUsedCapacity(commodity) < ((commodity === RESOURCE_BATTERY) ? Config.params.TERMINAL_STORE_TARGET : Config.params.FACTORY_STORE_TARGET)))
                    (C.FACTORY_COMMODITIES_LEVEL0_HASH[commodity] && (room.getResourceAmount(commodity) < ((commodity === RESOURCE_BATTERY) ? room.getResourceMaxAmount(commodity) : Config.params.FACTORY_STORE_TARGET)))

                    // Decompressing batteries and minerals.
                    || (C.FACTORY_COMMODITIES_DECOMPRESSING_HASH[commodity])

                    // Are we below target for this commodity
                    || (room.getFactoryResourceAmountInRoom(commodity) < Config.params.FACTORY_STORE_TARGET)
                ) {
                    // Test that we have all the required amounts of components in our factory for this commodity.
                    // If we can't find a needed component in our factory or we don't have enough of that component, then bail out.
                    if (!Object.keys(COMMODITIES[commodity].components).find(key => (colonyFactory.store[key] || 0) < COMMODITIES[commodity].components[key])) {
                        // Produce the commodity!
                        if (colonyFactory.produce(commodity) === OK) {
                            console.log('🏭 Factory ' + room.printShard + ' making x' + COMMODITIES[commodity].amount + ' ' + name + ' [' + commodity + ']');
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // This is an expensive operation both energy and cpu, only run it when abundant energy or when we have our power applied (so we don't waste power time).
        if (
            room.isStorageEnergyAbundant
            || effectLevel
        ) {

            // Based on the level of the factory at the moement, produce our commodities.
            switch (effectLevel) {
                case 1:
                    if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL1, '⭐')) return true;
                    break;
                case 2:
                    if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL2, '⭐⭐')) return true;
                    break;
                case 3:
                    if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL3, '⭐⭐⭐')) return true;
                    break;
                case 4:
                    if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL4, '⭐⭐⭐⭐')) return true;
                    break;
                case 5:
                    if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL5, '⭐⭐⭐⭐⭐')) return true;
                    break;
            }

            // Apparently the factory is not boosted, so just create basic components (free to do anytime by any factory).
            if (produceCommodity(C.FACTORY_COMMODITIES_LEVEL0, '💫')) return true;

            // Determine if we have MORE compressed resources than we are expected to have.
            // This would be over 2x FACTORY_STORE_TARGET (full terminal and full factory) plus how much it costs to compress once.
            // If so, that is our signal to decompress and get our minerals back.
            let compressedCommodity = Object.keys(_.pick(colonyFactory.store, C.FACTORY_COMMODITIES_COMPRESSING_MINERAL)).find(f => room.isFactoryResourceAmountInRoomOverDecompressThreshold(f));
            if (compressedCommodity) {
                let mineral = C.FACTORY_COMMODITIES_COMPRESSING_MINERAL_HASH[compressedCommodity]
                if (produceCommodity([mineral], '🗜️')) return true;
            }
        }

        // Lets try to decrompress batteries that are in our store if we have more than we should.
        if (!room.isStorageEnergyNormal && (colonyFactory.store.getUsedCapacity(RESOURCE_BATTERY) >= COMMODITIES[RESOURCE_ENERGY].components[RESOURCE_BATTERY])) {
            if (produceCommodity([RESOURCE_ENERGY], '⚡')) return true;
        }

        // Nothing produced.
        return false;
    }

}
