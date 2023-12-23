"use strict";

module.exports = function() {

    StructureTerminal.prototype.filterSending = function(resource) {
        // Obviously must have some of the resource in the terminal to be able to send.
        if (!this.store.getUsedCapacity(resource)) return false;

        if (resource === RESOURCE_ENERGY) {
            // Temples never send energy.
            if (this.room.isTemple) return false;

            return (
                this.room.atMaxLevel
                && (this.store.getUsedCapacity(RESOURCE_ENERGY) >= Config.params.TERMINAL_TARGET_ENERGY)

                // We don't want to go below normal ourselves, so only send when we have a good surplus.
                && this.room.isStorageEnergyNormal

                // All rooms can balance anytime except our special terminal/storage room which should only do so when activated.
                && (
                    !this.room.operateTerminalLevel
                    || this.hasEffect(PWR_OPERATE_TERMINAL)
                )

                // Do not send if we have storage that is powered but does not currently have the effect (making it seem full).
                && !this.room.operateStorageInactive
            )
        }
        else {
            // Temples always send anything else; should only have energy.
            if (this.room.isTemple) return true;
        }

        // Power will send as long as we have more than 200 in the terminal.
        if (resource === RESOURCE_POWER) return (this.store.getUsedCapacity(resource) > POWER_SPAWN_POWER_CAPACITY * 2);

        // Fungible will send once an amount has been put in storage.
        if (C.TERMINAL_FUNGIBLES_HASH[resource]) return !!(this.room.storage && this.room.storage.store.getUsedCapacity(resource));

        // Standard filter....do we have more than our max?
        // Once below max and not in storage, no longer sending anything (can still have some in terminal tho).
        return this.room.getResourceUsedCapacity(resource) > this.room.getResourceMaxAmount(resource);
    }

    StructureTerminal.prototype.filterReceiving = function(resource, sendingTerminal) {
        if (resource === RESOURCE_ENERGY) {
            return (
                // Don't send to terminals that are over their target energy, otherwise it can overflow.
                (
                    (this.store.getUsedCapacity(RESOURCE_ENERGY) <= Config.params.TERMINAL_TARGET_ENERGY)
                    || (this.room.isTemple && !this.room.isTerminalFull)
                )
                // All rooms with storage and terminals should balance out to the same energy percent, level 6, 7, 8's.
                // This helps with the upgrade process of 7 and 8 not being short on energy just after level up.
                && (
                    sendingTerminal.hasEffect(PWR_OPERATE_TERMINAL)
                    || (this.room.storagePercent + Config.params.TERMINAL_STORE_BALANCE_ENERGY_PERCENT < sendingTerminal.room.storagePercent)
                    || this.room.isTemple
                )
                // Do NOT send energy to our special terminal/storage room.
                && !this.room.operateTerminalLevel
                // Don't send energy to rooms that are burning power already.
                && (sendingTerminal.hasEffect(PWR_OPERATE_TERMINAL) || !this.room.canProcessPower)
            )
        }

        // Temples never receive anything except for energy.
        if (this.room.isTemple) return false;
        // But take anything that a temple is trying to send.
        if (sendingTerminal.room.isTemple) return true;

        // Standard filter....do we have less than our target?
        // And does the sending room have more than our receiving room.
        return (
            (this.room.getResourceUsedCapacity(resource) < this.room.getResourceTargetAmount(resource))
            && (this.room.getResourceUsedCapacity(resource) < sendingTerminal.room.getResourceUsedCapacity(resource))
        );
    }

    Room.prototype.getResourceUsedCapacity = function(resource) {
        if (resource === RESOURCE_ENERGY) {
            return this.terminal ? this.terminal.store.getUsedCapacity(resource) : 0;
        }

        // For any resource other than energy, add anything in storage to the terminal value.
        return (this.terminal ? this.terminal.store.getUsedCapacity(resource) : 0) + (this.storage ? this.storage.store.getUsedCapacity(resource) : 0);
    }

    StructureTerminal.prototype.sortSending = function(resource) {
        if (resource === RESOURCE_ENERGY) {
            if (this.hasEffect(PWR_OPERATE_TERMINAL)) return -100;
            return -this.room.storagePercent;
        }

        // Temples always send anything they have as a priority.
        if (this.room.isTemple) return -Infinity;

        // For raw minerals, in overflow situations if the mineral is in the room then you get a priority bonus.
        // The idea here is it is more efficient to maintain local miners than dredgers.
        // If a room somehow gets an overflowing amount of non-native minerals that get "stuck", those would be sold on the market.
        let resourceAmount = this.room.getResourceUsedCapacity(resource);
        let targetAmount = this.room.getResourceTargetAmount(resource);
        if (
            C.TERMINAL_MINERALS_RAW_HASH[resource]
            && (resource === RoomIntel.getMineralType(this.room.name))
            && (resourceAmount > targetAmount)
        ) {
            // Sub-sort these by the amount they have.
            return -(resourceAmount + targetAmount)
        }

        // Standard sort....how much do we have? Add in the storage amount of this resource.
        return -resourceAmount;
    }

    StructureTerminal.prototype.sortReceiving = function(resource, sendingTerminal) {
        // For energy, send to rooms that have the lowest percent in storage first.
        // Temples are an exception, where we want their storage to always be completely full.
        if (resource === RESOURCE_ENERGY) {
            // Temples that are not full get highest priority.
            if (this.room.isTemple && !this.room.isTerminalFull) return 0;

            if (this.hasEffect(PWR_OPERATE_TERMINAL)) return 100;
            return this.room.storagePercent;
        }

        // Fungibles are sent based on need, not distance.
        if (C.TERMINAL_FUNGIBLES_HASH[resource]) return this.room.getResourceUsedCapacity(resource);

        // Standard sort....how far away are they? Keep costs low.
        return Game.map.getRoomLinearDistance(sendingTerminal.room.name, this.room.name, true);
    }

    StructureTerminal.prototype.getAmountNeeded = function(resource, sendingTerminal) {
        // Temples will send everything they have outside of energy.
        if ((resource !== RESOURCE_ENERGY) && sendingTerminal.room.isTemple) return sendingTerminal.store.getUsedCapacity(resource);

        if (resource === RESOURCE_ENERGY) {
            // Start with all our target energy amount.
            let amount = Math.min(
                Math.max(0, this.store.getFreeCapacity())
                , sendingTerminal.store.getUsedCapacity(RESOURCE_ENERGY)
                , Config.params.TERMINAL_TARGET_ENERGY
            );
            // Figure out the fee that it will cost to send.
            let cost = sendingTerminal.room.calcTransactionCost(amount, this.room.name);
            // Now take away the fee so we have enough energy to pay for it.
            return amount - cost;
        }

        // Standard amount....how much to bring us up to target?
        let amount = Math.min(
            // Only ask for what we can hold and bring us up to target.
            this.store.getFreeCapacity()
            , this.room.getResourceTargetAmount(resource) - this.room.getResourceUsedCapacity(resource)
            , this.room.getResourceMaxAmount(resource)

            // Sender is only obliged to send what they actually have.
            , sendingTerminal.store.getUsedCapacity(resource)
            // Sender can send anything they have over max, but after that only split the difference to balance between terminals.
            , ((sendingTerminal.room.getResourceUsedCapacity(resource) > sendingTerminal.room.getResourceMaxAmount(resource)) ?
                (sendingTerminal.room.getResourceUsedCapacity(resource) - sendingTerminal.room.getResourceMaxAmount(resource))
                : Math.floor((sendingTerminal.room.getResourceUsedCapacity(resource) - this.room.getResourceUsedCapacity(resource)) / 2)
            )
        );

        // Don't send less than a minimum amount to prevent constant updates of tiny amounts.
        // Except for power, which we can burn down to nothing.
        if (
            C.TERMINAL_FUNGIBLES_HASH[resource]
            && (resource !== RESOURCE_POWER)
            && (amount < Config.params.TERMINAL_MIN_TRANSFER_AMOUNT)
            && this.room.storage
            && (amount < Config.params.STORAGE_STORE_TARGET - this.room.storage.store.getUsedCapacity(resource))
            && (sendingTerminal.room.getResourceUsedCapacity(resource) <= sendingTerminal.room.getResourceMaxAmount(resource))
        ) amount = 0;

        // Return out final amount.
        return amount;
    }

    Room.prototype.getResourceTargetAmount = function(resource) {
        // Temples max on energy, and zero for everything else.
        if ((resource !== RESOURCE_ENERGY) && this.isTemple) return 0;
        if ((resource === RESOURCE_ENERGY) && this.isTemple) return TERMINAL_CAPACITY;

        // Fungible target is store target plus terminal target.
        if (C.TERMINAL_FUNGIBLES_HASH[resource]) return Config.params.STORAGE_STORE_TARGET + Config.params.TERMINAL_STORE_TARGET;

        switch (resource) {
            case RESOURCE_ENERGY:
                return Config.params.TERMINAL_TARGET_ENERGY;

            case RESOURCE_OPS:
                return this.powerCreep ? Config.params.TERMINAL_STORE_TARGET : 0;

            default:
                return Config.params.TERMINAL_STORE_TARGET;
        }
    }

    Room.prototype.getResourceMaxAmount = function(resource) {
        // Temples max on energy, and zero for everything else.
        if ((resource !== RESOURCE_ENERGY) && this.isTemple) return 0;
        if ((resource === RESOURCE_ENERGY) && this.isTemple) return TERMINAL_CAPACITY;

        // Fungible target is store target plus terminal target.
        if (C.TERMINAL_FUNGIBLES_HASH[resource]) return Config.params.STORAGE_STORE_TARGET + Config.params.TERMINAL_STORE_TARGET;

        switch (resource) {
            case RESOURCE_ENERGY:
                return Config.params.TERMINAL_TARGET_ENERGY;

            case RESOURCE_OPS:
                return this.powerCreep ? Config.params.TERMINAL_STORE_MAX : 0;

            default:
                return Config.params.TERMINAL_STORE_MAX;
        }
    }

	Object.defineProperty(Room.prototype, 'otherTerminals', {
		get() {
            if (typeof this._otherTerminals === "undefined") {
                this._otherTerminals = GameManager.empireTerminals.filter(f =>
                    // Exclude ourselves.
                    (f.room.name !== this.name)
                    // Need room to be able to accept incoming amounts.
                    && !f.room.isTerminalFull
                    // Obviously don't send to other terminals if they don't have the room (temples being the exception)
                    && (!f.room.isStorageFull || f.room.isTemple)
                    // Don't send if we are currently unclaiming this room.
                    && (!f.room.unclaimFlag || f.room.isTemple)
                );
			}
			return this._otherTerminals;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'shouldTerminalSend', {
		get() {
            if (typeof this._shouldTerminalSend === "undefined") {
                this._shouldTerminalSend = ((Game.time % TERMINAL_COOLDOWN) !== 0);
			}
			return this._shouldTerminalSend;
		},
		configurable: true, enumerable: true,
    });

    /**
     * Calculates the powercreep boosted (if applicable) terminal transaction cost.
     */
    Room.prototype.calcTransactionCost = function(amount, destination) {
        return Math.ceil(Game.market.calcTransactionCost(amount, this.name, destination) * (this.operateTerminalPercent || 1));
    }

    /**
     * Manages sending factory components to the next higher level factory.
     */
    Room.prototype.manageTerminal_factory = function(options) {
        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugterminalFlag
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Shorthand.
        let room = this;

		// Initialize.
		let roomMyTerminal = room.myTerminal;
        if (!roomMyTerminal) return false;

        if (roomMyTerminal.cooldown) {
            if (options.debug) room.logRoom('manageTerminal_sell terminal is on cooldown; bailing out...');
            return false;
        }

        let otherTerminals = room.otherTerminals;
        let colonyFactory = room.colonyFactory;
        let factoryLevel = room.factoryLevel;

        // Factory logic. Send mats I've created at my level at my level to highever level rooms than us.
        if (room.unclaimFlag) return false;
        if (!colonyFactory) return false;

        // Get other rooms that have factories of course.
        // Sort by the lowest room first, as these resources are likely to be sold earlier (by market percent markup).
        // We would never get to making the higher level commodities in this scenerio, as all lower factories would be starved forever.
        let destinations = otherTerminals.filter(f => f.room.colonyFactory);
        destinations = _.sortByOrder(destinations, [
            sortFactoryLevel => sortFactoryLevel.room.factoryLevel ? sortFactoryLevel.room.factoryLevel : 99
            , sortDistance => Game.map.getRoomLinearDistance(room.name, sortDistance.room.name)
        ]);

        // If we are just going to sell this resource, then don't try to move it.
        // In case we have multiple high level factories.
        // Batteries are also fungibles, so don't include them in this transfer.
        let resources = Object.keys(_.pick(roomMyTerminal.store, C.FACTORY_COMMODITIES)).filter(f => !GameManager.commoditiesToAwaysSell[f] && (f !== RESOURCE_BATTERY));

        // Loop thru each room and send them our precious liquids.
        for (let i=0; i < destinations.length; i++) {
            let destination = destinations[i];

            if (options.debug) room.logRoom('manageTerminal_factory processing destination ' + destination.room.name + ' factory level ' + destination.room.factoryLevel);

            for (let resource of resources) {
                GameManager.addProcess('manageTerminal_factory');

                let amount = 0;
                let cost = 0;
                let maxAmount = 0;
                let maxNeededByThisRoom = utils.getMaxComponentAmountForFactoryLevel(resource, factoryLevel);
                let maxNeededByRemoteRoom = utils.getMaxComponentAmountForFactoryLevel(resource, destination.room.factoryLevel);
                let note = '';

                if (false) {
                    // Placeholder.
                }

                // This is a commodity in the chain that we should be selling since its the most valuable.
                // While we have only a few of them created, keep them here for a bit to let the terminals sell them.
                // Its possible that the market has no one buying them at the moment.
                else if (
                    factoryLevel
                    && COMMODITIES[resource]
                    && ((COMMODITIES[resource].level || 0) === factoryLevel)
                    && GameManager.highestMarkupPercentCommodityOfChain[resource]
                    && (roomMyTerminal.store[resource] < (Config.params.FACTORY_STORE_TARGET / 2))
                ) {
                    continue;
                }

                // Basic regional commodity that is harvested. But we are a factory level and won't ever process it.
                // Note we are sorting by factory level descending, so no rooms left in the loops would need this by definition.
                else if (
                    !COMMODITIES[resource]
                    && factoryLevel
                    && !maxNeededByThisRoom
                    && !destination.room.factoryLevel
                ) {
                    maxAmount = roomMyTerminal.store[resource] - maxNeededByThisRoom;
                    note = 'return for processing ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // I didn't make this commodity and the destination did make it. So send anything I don't need back to him, so he doesn't make any more.
                // WRONG: Note we are sorting by factory level descending, so no rooms left in the loops would need this by definition.
                else if (
                    COMMODITIES[resource]
                    && (roomMyTerminal.store[resource] > maxNeededByThisRoom)
                    && ((COMMODITIES[resource].level || 0) < factoryLevel)
                    && ((COMMODITIES[resource].level || 0) === destination.room.factoryLevel)
                ) {
                    maxAmount = roomMyTerminal.store[resource] - maxNeededByThisRoom;
                    note = 'return to manufacturor ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // Destination room doesn't need any more, skip.
                // Note that since we are sorting ascending, the next block of sending over max to destination won't get it.
                else if ((destination.store[resource] || 0) >= maxNeededByRemoteRoom) {
                    continue;
                }

                // Both rooms are same level, but he is below max and I am above.
                // Send him my overflow so he will stop making extras sooner.
                // WRONG: Note we are sorting by factory level descending, so no rooms left in the loops would need this by definition.
                else if (
                    COMMODITIES[resource]
                    && ((roomMyTerminal.store[resource] || 0) > Config.params.FACTORY_STORE_TARGET)
                    && ((COMMODITIES[resource].level || 0) === factoryLevel)
                    && ((COMMODITIES[resource].level || 0) === destination.room.factoryLevel)
                    && ((destination.store[resource] || 0) < Config.params.FACTORY_STORE_TARGET)
                ) {
                    maxAmount = roomMyTerminal.store[resource] - Config.params.FACTORY_STORE_TARGET;
                    note = 'factory tier balance ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // Do both of us need it? Share just the overflow of what I actually need of this resource, and just up to the point he can do something with it too.
                // My factory level is lower than the destination, and they are short. Give them what they need to keep moving.
                else if (
                    (
                        // Room is level 0, so should share anything,
                        // or the commodity is greater than level 0 (so its rare).
                        !factoryLevel
                        || (
                            COMMODITIES[resource]
                            && (COMMODITIES[resource].level || 0)
                        )
                    )
                    && maxNeededByThisRoom
                    && maxNeededByRemoteRoom
                    && ((destination.store[resource] || 0) < maxNeededByRemoteRoom)
                    && (factoryLevel < destination.room.factoryLevel)
                ) {
                    maxAmount = maxNeededByRemoteRoom - (destination.store[resource] || 0);
                    note = 'factory level forced ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // I need what I have. Hard pass!
                else if (roomMyTerminal.store[resource] <= maxNeededByThisRoom) {
                    continue;
                }

                // Do both of us need it? Share just the overflow of what I actually need of this resource, and just up to the point he can do something with it too.
                // If I need this and the destination is starving by not having some, then give up to what he can use.
                else if (
                    maxNeededByRemoteRoom
                    && (roomMyTerminal.store[resource] > maxNeededByThisRoom)
                    && ((destination.store[resource] || 0) < maxNeededByRemoteRoom)
                ) {
                    maxAmount = Math.min(roomMyTerminal.store[resource] - maxNeededByThisRoom, maxNeededByRemoteRoom - (destination.store[resource] || 0));
                    note = 'factory generous ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // Whats left over are basic inputs, like mist. Share up to factory store target.
                // If destination did not need it at all, we wouldn't even get this far.
                else {
                    maxAmount = Math.max(0, roomMyTerminal.store[resource] - Config.params.FACTORY_STORE_TARGET);
                    note = 'basic sharing ' + factoryLevel + '=>' + destination.room.factoryLevel
                }

                // If the destination doesn't already have this resource in its terminal already, and its factory is below the target.
                amount = Math.min(maxAmount, destination.store.getFreeCapacity(), roomMyTerminal.store[resource], Config.params.FACTORY_STORE_TARGET - (destination.store[resource] || 0));
                cost = room.calcTransactionCost(amount, destination.room.name);

                // Don't send if we don't have an amount or the cost is more than we can afford.
                if (amount > 0) {
                    if (cost <= roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY)) {
                        // Attempt to send to this terminal, it might fail so move on the next one if so.
                        let message = '🚀 ' + room.printShard + ' ' + amount + 'x [' + resource + '] => ' + destination.room.print + ' costing ' + cost + ' (' + note + ')';
                        if (roomMyTerminal.send(resource, amount, destination.room.name) === OK) {
                            console.log(message)
                            return true;
                        }
                    }
                }
            }

        }

        return false;
    }

    // KEEP
    Room.prototype.manageTerminal_sell = function(options)  {
        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugterminalFlag
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Shorthand.
        let room = this;

        if (FlagManager.nomarketFlag) {
            if (options.debug) room.logRoom('manageTerminal_sell nomarket flag is present; bailing out...');
            return false;
        }

        if (room.unclaimFlag) {
            if (options.debug) room.logRoom('manageTerminal_sell unclaim flag is set; bailing out...');
            return false;
        }

        if (!room.isStorageEnergyNormal) {
            if (options.debug) room.logRoom('manageTerminal_sell not at normal energy level; bailing out...');
            return false;
        }

        if (room.isTemple) {
            //if (options.debug) room.logRoom('manageTerminal_sell temples do not sell; bailing out...');
            return false;
        }

		// Initialize.
		let roomMyTerminal = room.myTerminal;
        if (!roomMyTerminal) return false;

        if (roomMyTerminal.cooldown) {
            if (options.debug) room.logRoom('manageTerminal_sell terminal is on cooldown; bailing out...');
            return false;
        }

        let roomMyStorage = room.storage;
        let factoryLevel = room.factoryLevel;

        if (
            !(roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) >= Config.params.TERMINAL_TARGET_ENERGY)
            && (roomMyTerminal.store.getFreeCapacity() > Config.params.TERMINAL_TARGET_ENERGY)
        ) {
            if (options.debug) room.logRoom('manageTerminal_sell not enough energy in terminal; bailing out...');
            return false;
        }

        if (roomMyTerminal.hasEffect(PWR_OPERATE_TERMINAL)) {
            if (options.debug) room.logRoom('manageTerminal_sell terminal is boosted to send energy to empire; bailing out...');
            return false;
        }

        let resources = [];

        // Get the factory commodities to sell that are over our target (overflow). Includes bars, raw deposits, etc.
        // Excluding battery, as we will actually be buying those for decompression. Never sell them!
        let factoryTarget = utils.intersection(roomMyTerminal.store, C.FACTORY_COMMODITIES_SELL_HASH);
        factoryTarget = factoryTarget.filter(f => (roomMyTerminal.store[f] > Config.params.TERMINAL_STORE_MAX + Config.params.TERMINAL_MIN_TRANSFER_AMOUNT) && !C.FACTORY_COMMODITIES_NEVER_SELL_HASH[f]);
        resources = resources.concat(factoryTarget.map(m => ({
            amount: roomMyTerminal.store.getUsedCapacity(m) - Config.params.TERMINAL_STORE_MAX
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })));

        // To prevent blocking of the creation of lower level but valuable components,
        // when we reach our store limit and have already attempted to send them to higher level factories
        // that might need them, then at this point is okay to sell a little off the top...so that more are made and we make money.
        let factoryChainTarget = utils.intersection(roomMyTerminal.store, C.FACTORY_COMMODITIES_CHAIN_SELL_HASH);
        factoryChainTarget = factoryChainTarget.filter(f => !C.FACTORY_COMPONENTS_BY_LEVEL_HASH[factoryLevel][f] && (roomMyTerminal.store[f] >= Config.params.TERMINAL_STORE_MAX) && !C.FACTORY_COMMODITIES_NEVER_SELL_HASH[f]);
        resources = resources.concat(factoryChainTarget.map(m => ({
            amount: Math.min(Config.params.TERMINAL_STORE_MAX, Config.params.TERMINAL_MIN_TRANSFER_AMOUNT)
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })));

        // Now also add in resources that we should always sell, due to max level of factory.
        // No filter for amount in terminal because it all must go ASAP!
        let always = Object.keys(GameManager.commoditiesToAwaysSell).filter(f => roomMyTerminal.store[f]);
        resources = resources.concat(always.map(m => ({
            amount: roomMyTerminal.store.getUsedCapacity(m)
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })))

        // Now also add in commodities that are the most valuable in their chain sorted by marketup percent.
        // Note that this may not, and likely will not be, the highest level commodity.
        // No filter for amount in terminal because it all must go ASAP!
        let highestMarketupPercent = Object.keys(GameManager.highestMarkupPercentCommodityOfChain).filter(f => roomMyTerminal.store[f]);
        resources = resources.concat(highestMarketupPercent.map(m => ({
            amount: roomMyTerminal.store.getUsedCapacity(m)
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })))

        // Sell excesive amounts of fungibles (minerals, power) we are mining in this room. Mostly to kickstart new colonies.
        // Detecting if we should sell or not is tricky...most rooms will have up to max amount, but the rooms that are extracting will have a lot more on purpose.
        // This means simply seeing if we are above max on average is not accurate, as we always would be.
        let fungibles = C.TERMINAL_FUNGIBLES.filter(f => (roomMyTerminal.store.getUsedCapacity(f) > Config.params.TERMINAL_MINERAL_SELL) && !GameManager.empireFungiblesBelowMinSortedHash[f]);
        resources = resources.concat(fungibles.map(m => ({
            amount: roomMyTerminal.store.getUsedCapacity(m) - Config.params.TERMINAL_MINERAL_SELL
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })))

        // As long as we aren't a factory, add in bars if we were going to sell their mineral type.
        // We sell 500 at a time, since that is what the receipt is to create one batch.
        if (!room.factoryLevel) {
            let bars = fungibles.filter(f => C.FACTORY_COMMODITIES_DECOMPRESSING_MINERAL_HASH[f]).map(m => C.FACTORY_COMMODITIES_DECOMPRESSING_MINERAL_HASH[m]);
            bars = bars.filter(f => (roomMyTerminal.store.getUsedCapacity(f) >= Config.params.FACTORY_STORE_TARGET) && (GameManager.getMarketMarkupPercent(f) > Config.params.MARKET_SELL_BAR_PERCENT));
            resources = resources.concat(bars.map(m => ({
                amount: Math.min(roomMyTerminal.store.getUsedCapacity(m), 500)
                , resourceType: m
                , markupPercent: GameManager.getMarketMarkupPercent(m)
            })))
        }

        // Sell excesive amounts of the compounds that we are saturated with (except for upgrade mats)
        // Only sell up to an amount that the empire is over as a whole, as we may be in the process of currently distributing it.
        // Do NOT sell any of the ingredients for controller upgrading. These are constantly in use and we can use any overflow very quickly.
        let resourcesOverMax = Object.keys(roomMyTerminal.store).filter(f => C.TERMINAL_COMPOUNDS_HASH[f] && (roomMyTerminal.store[f] > Config.params.TERMINAL_STORE_SELL) && !C.TERMINAL_COMPOUNDS_UPGRADE_CONTROLLER_HASH[f] && GameManager.empireResourceTypeAboveMaxSorted[f]);
        resources = resources.concat(resourcesOverMax.map(m => ({
            amount: Math.min(roomMyTerminal.store.getUsedCapacity(m) - Config.params.TERMINAL_STORE_SELL, GameManager.empireResourceTypeAboveMaxSorted[m])
            , resourceType: m
            , markupPercent: GameManager.getMarketMarkupPercent(m)
        })))

        // Sell excesive amounts of the energy we are harvesting in this room. Mostly to kickstart new colonies and to slow down overflows.
        // Special logic around not selling energy for our special terminal room, which is purposely trying to be the richest room in the empire
        // before handing out energy all at once.
        // But any and all rooms will sell if storage is full, yikes!
        if (roomMyStorage && ((room.isStorageEnergySell && !room.operateTerminalLevel) || room.isStorageFull) && !room.operateStorageInactive) {
            let energy = [RESOURCE_ENERGY];
            resources = resources.concat(energy.map(m => ({
                amount: Math.floor(roomMyTerminal.store[energy] / 2)
                , resourceType: m
                , markupPercent: -1  // Energy is hard coded as negative markup to allow all other types to get sold first and no block the terminal.
            })))
        }

        // Sort all of these by the markup percent, selling the ones with the biggest markup percent first.
        resources = _.sortBy(resources, s => -s.markupPercent);

        if (options.debug) room.logRoom(JSON.stringify(resources));

        let resourceAmount = null;
        let resourceType = null;
        let orders = null;

        // Using "of" as resources is an array.
        for (let resource of resources) {
            // Don't sell everything at once.
            resourceAmount = resource.amount;
            resourceType = resource.resourceType;

            // Do a fast lookup for orders.
            // https://blog.screeps.com/page/6/
            orders = Game.market.getAllOrders({
                resourceType: resourceType
                , type: ORDER_BUY
            });

            // Perform additional distance and cost filters.
            // Only sell to the NPC's in the highway corners for commodities.
            let npcOnly = !!C.FACTORY_COMMODITIES_SELL_HASH[resourceType];
            orders = orders.filter(f =>
                (!npcOnly || Cartographer.isHighwayRoom(f.roomName))
                && (room.calcTransactionCost(Math.min(resourceAmount, f.amount), f.roomName) <= roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY))
                && (f.amount > 0)
            );

            // Sort to get best price!
            orders = _.sortBy(orders, s =>
                // We want the price per unit, including shipping.
                -(
                    (s.price * resourceAmount)
                    // Subtract from the buying price the cost of shipping which is charged to us.
                    - (GameManager.getMarketValue(RESOURCE_ENERGY) * room.calcTransactionCost(resourceAmount, s.roomName))
                ) / resourceAmount
            );

            GameManager.addProcess('manageTerminal_sell');

            for (let order of orders) {
                if (options.debug) {
                    room.logRoom('Processing ' + resourceAmount + ' of resourceType [' + resourceType + ']...order' + (order ? '' : ' NOT') + ' found');
                }

                if (order) {
                    // Execute the deal!
                    let amount = Math.min(resourceAmount, order.amount);
                    let fee = room.calcTransactionCost(amount, order.roomName);
                    // If we are selling energy, then reserve at half for the transfer fee amount.
                    if (fee <= roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) / ((resourceType === RESOURCE_ENERGY) ? 2 : 1)) {
                        let result = Game.market.deal(order.id, amount, room.name);
                        if (result === OK) {
                            console.log('🍾 Sold!', amount + 'x [' + resourceType + '] @ ' + order.price + ' = ' + (amount * order.price).toFixed(3) + ' fee:' + fee, room.printShard + '=>' + utils.getRoomHTML(order.roomName));
                            return true;
                        }
                    }
                    else {
                        if (options.debug) {
                            room.logRoom('Fee of ' + fee + ' too expensive for ' + amount + ' of resourceType [' + resourceType + ']');
                        }
                    }
                }
            }
        }

        return false;
    }

    // KEEP
    Room.prototype.manageTerminal_buy = function(options) {
        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugterminalFlag
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Shorthand.
        let room = this;

        if (FlagManager.nomarketFlag) {
            if (options.debug) room.logRoom('manageTerminal_buy nomarket flag is present; bailing out...');
            return false;
        }

		// Initialize.
		let roomMyTerminal = room.myTerminal;
        if (!roomMyTerminal) return false;

        if (roomMyTerminal.cooldown) {
            if (options.debug) room.logRoom('manageTerminal_sell terminal is on cooldown; bailing out...');
            return false;
        }

        let roomMyStorage = room.myStorage;
        if (!roomMyStorage) return false;

        // If we are inactive, then bail out.
        if (room.unclaimFlag) return false;
        if (!room.isStorageEnergyNormal) return false;

        let colonyFactory = room.colonyFactory;
        let otherTerminals = room.otherTerminals;

        // Buy anything we are short of and our resources are on cooldown.
        let resources = [];

        if (GameManager.isEmpireObjectiveCredits) {
            if (options.debug) room.logRoom('manageTerminal_buy GameManager.isEmpireObjectiveCredits; bailing out...');
            return false;
        }

        // Are we short any boosts in this room?
        resources = resources.concat(Object.keys(room.roomMissingBoosts));

        // Keep our labs churning with raw materials. These are usually cheapest.
        resources = resources.concat(C.TERMINAL_MINERALS_RAW);

        // We don't want our prophets, heralds, and oracles to starve, ever.
        if (GameManager.atCreditMax || GameManager.myNonMaxNonTempleSpawnRoomsActive.length) {
            resources = resources.concat(C.TERMINAL_BOOSTS_UPGRADE_CONTROLLER);
        }

        // If we are closest room to other low level room that could need any kind of help, then buy all the mats.
        if (!room.atMaxLevel || room.isClosestMaxRoomToLowerRoom) {
            resources = resources.concat(C.TERMINAL_COMPOUNDS_TIER3);
        }

        // Buy ops if we have a power creep. Ops are cheap usually.
        if (room.powerCreep) {
            resources = resources.concat([RESOURCE_OPS]);
        }

        // Add power to our shopping list if we have a powerspawn and we have none in our terminal nor our powerspawn, and we are allowing farming.
        // Terminal may be temporarily at zero if we are low, but the powerspawn may still be full.
        // The power balance terminal step will give us 200 power if it can even when below max target.
        if (
            // We either have credits to burn, or we are focusing on gpl and have enough credits to buy normally.
            (GameManager.atCreditMax || (GameManager.atCreditTargetForBuy && GameManager.isEmpireObjectiveGpl))
            && !room.noPowerbank
            && !roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER)
            && room.isStorageEnergyPower
            && !GameManager.empireResourceTypeAboveTargetSorted[RESOURCE_POWER]
        ) {
            resources = resources.concat([RESOURCE_POWER]);
        }

        // Get a unique list so we don't process dupes.
        resources = utils.unique(resources);

        if (options.debug) room.logRoom('Potential buys: ' + resources.join());

        for (let resource of resources) {
            // If we have this material (fungible) in storage, then bail out.
            if (!FlagManager.overbuyfungiblesFlag && (roomMyStorage.store.getUsedCapacity(resource) > 0)) continue;

            // Determine target amount.
            let targetAmount = room.getResourceTargetAmount(resource);

            // Are we low on the resources and we don't have another terminal that has more than the MAX.
            // It is possible to try to exclude minerals that we mine our selves or are in the process of being mined,
            // but whats the point? We are below target so we don't have them right now and we may need them. Just buy it!
            if (roomMyTerminal.room.getResourceUsedCapacity(resource) >= targetAmount) continue;

            // If other rooms have overmax of this resource, they will eventually send it to us, so do not buy more now.
            // TODO: This is slow...finding a matching terminal in the empire for every resource. Can we not use/determine collective resources for empire?
            if (otherTerminals.find(f => f.room.getResourceUsedCapacity(resource) > f.room.getResourceMaxAmount(resource))) continue;

            let resourceAmount = 0;
            let resourceType = resource;
            let order = null;
            let orders = [];
            let maxBuyPrice = -1; // Start negative as an indication not to use price protection.
            let baseResourceAmount = targetAmount - roomMyTerminal.room.getResourceUsedCapacity(resource);

            // If we are trying to buy a mineral and we have a factory, include looking for compressed commodity that can decompress into that mineral.
            // We need 100 bars to decompress into 500 mineral (so a 5-to-1 +energy ratio).
            // Don't buy compressed resources if we have an active factory level, as it is busy doing other things.
            let resourceToBeDecompressed = false;
            if (colonyFactory && !room.factoryLevel) {
                // Determine if we have enough of the compressed version (if any) that will be decompressed.
                let compressedResourceType = C.FACTORY_COMMODITIES_DECOMPRESSING_MINERAL_HASH[resource];
                resourceToBeDecompressed = compressedResourceType && room.isFactoryResourceAmountInRoomOverDecompressThreshold(compressedResourceType);

                // This is a compressed resource, look to see if the compressed version is cheaper.
                if (
                    compressedResourceType
                    && !resourceToBeDecompressed
                    // It is not always true that our compressed component is cheaper than just buying raw material.
                    // If the markup is negative on the compressed version,t hen get it instead.
                    && (GameManager.getMarketMarkupPercent(compressedResourceType) < 0)
                ) {
                    // We don't need nearly as much of the compressed version.
                    resourceAmount = Math.ceil(baseResourceAmount / (COMMODITIES[compressedResourceType].components[resource] / COMMODITIES[compressedResourceType].amount));  // 100
                    // Do this in each of the compressed/uncompressed blocks.
                    maxBuyPrice = -1;

                    // Do a fast lookup for orders.
                    // https://blog.screeps.com/page/6/
                    orders = Game.market.getAllOrders({
                        resourceType: compressedResourceType
                        , type: ORDER_SELL
                    });

                    // Price protection!  Buy from the last best known value. Markup by fixed percent to find our acceptable buy price.
                    if (orders.length && !FlagManager.nopriceprotectionFlag) {
                        maxBuyPrice = GameManager.getMarketAverage(compressedResourceType) * GameManager.terminalBuyAvgPercent;

                        // If we are in desperate need of this boost, buy it at inflated prices if necessary.
                        if (room.roomMissingBoosts[compressedResourceType]) {
                            maxBuyPrice = maxBuyPrice * Config.params.TERMINAL_BUY_CRITICAL_MULTIPLIER;
                        }
                    }

                    // Perform additional distance and cost filters.
                    orders = orders.filter(f =>
                        ((maxBuyPrice < 0) || (f.price <= maxBuyPrice))
                        && ((Math.min(resourceAmount, f.amount) * f.price) <= Game.market.credits)
                        && (!Game.rooms[f.roomName] || !Game.rooms[f.roomName].my)
                        && (room.calcTransactionCost(Math.min(resourceAmount, f.amount), f.roomName) <= roomMyTerminal.store[RESOURCE_ENERGY])
                    )

                    if (options.debug) room.logRoom('Looking for ' + resourceType + '/' + compressedResourceType + ' at max of ' + maxBuyPrice + ': found ' + orders.length + ' orders');

                    // If we found an order, set the resourceType to buy as the compressed equivelant instead.
                    if (orders.length) {
                        resourceType = compressedResourceType;
                    }
                }
            }

            // Not a decompressing mineral, or none for sale. Buy raw resource.
            if (!orders.length && !resourceToBeDecompressed) {
                // Buying the base amount of this resource type.
                resourceAmount = baseResourceAmount;
                // Do this in each of the compressed/uncompressed blocks.
                maxBuyPrice = -1;

                // Do a fast lookup for orders.
                // https://blog.screeps.com/page/6/
                orders = Game.market.getAllOrders({
                    resourceType: resourceType
                    , type: ORDER_SELL
                });

                // Price protection!  Buy from the last best known value. Markup by fixed percent to find our acceptable buy price.
                if (orders.length && !FlagManager.nopriceprotectionFlag) {
                    maxBuyPrice = GameManager.getMarketAverage(resourceType) * GameManager.terminalBuyAvgPercent;

                    // If we are in desperate need of this boost, buy it at inflated prices if necessary.
                    if (room.roomMissingBoosts[resourceType]) {
                        maxBuyPrice = maxBuyPrice * Config.params.TERMINAL_BUY_CRITICAL_MULTIPLIER;
                    }
                }

                // Perform additional distance and cost filters.
                orders = orders.filter(f =>
                    ((maxBuyPrice < 0) || (f.price <= maxBuyPrice))
                    && ((Math.min(resourceAmount, f.amount) * f.price) <= Game.market.credits)
                    && (!Game.rooms[f.roomName] || !Game.rooms[f.roomName].my)
                    && (room.calcTransactionCost(Math.min(resourceAmount, f.amount), f.roomName) <= roomMyTerminal.store[RESOURCE_ENERGY])
                )

                if (options.debug) room.logRoom('Looking for ' + resourceType + ' at max of ' + maxBuyPrice + ': found ' + orders.length + ' orders');
            }

            // Sort to get best price! Include cost of shipping.
            // Transform orders into order.
            if (orders.length) {
                order = _.sortByOrder(orders, [
                    s =>
                        // We want the price per unit, including shipping.
                        (
                            (s.price * resourceAmount)
                            // Add to the buying price the cost of shipping which is charged to us.
                            + (GameManager.getMarketValue(RESOURCE_ENERGY) * room.calcTransactionCost(resourceAmount, s.roomName))
                        ) / resourceAmount
                ]).find(x => x !== undefined);
            }

            GameManager.addProcess('manageTerminal_buy');

            if (order) {
                // Execute the deal!
                let amount = Math.min(resourceAmount, order.amount);
                let fee = room.calcTransactionCost(amount, order.roomName);
                if (fee <= roomMyTerminal.store[RESOURCE_ENERGY]) {
                    if (Game.market.deal(order.id, amount, room.name) === OK) {
                        console.log('🍾 Bought!', amount + 'x [' + resourceType + '] @ ' + order.price + ' = ' + (amount * order.price).toFixed(3) + ' fee:' + fee, utils.getRoomHTML(order.roomName) + '=>' + room.printShard);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // KEEP
    Room.prototype.manageTerminal_buyOrder = function(options) {
        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugterminalFlag
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Shorthand.
        let room = this;

        if (FlagManager.nomarketFlag) {
            if (options.debug) room.logRoom('manageTerminal_buyOrder nomarket flag is present; bailing out...');
            return false;
        }

		// Initialize.
		let roomMyTerminal = room.myTerminal;
        if (!roomMyTerminal) return false;

        if (roomMyTerminal.cooldown) {
            if (options.debug) room.logRoom('manageTerminal_sell terminal is on cooldown; bailing out...');
            return false;
        }

        let colonyFactory = room.colonyFactory;
        let factoryLevel = room.factoryLevel;

        // Create buy orders for resources in factory rooms that could use them.
        if (!room.unclaimFlag && room.isStorageEnergyNormal && roomMyTerminal && colonyFactory && factoryLevel && (Game.market.credits > Config.params.MARKET_CHAIN_CREDIT_CUTOFF)) {
            let resources = [];
            let resourceLevel = '';

            // Based on the level of the factory at the moement, produce our commodities.
            switch (factoryLevel) {
                case 1:
                    resourceLevel = '💫'
                    resources = C.FACTORY_COMMODITIES_LEVEL0_CHAIN;
                    break;

                case 2:
                    resourceLevel = '⭐'
                    resources = C.FACTORY_COMMODITIES_LEVEL1_CHAIN;
                    break;

                case 3:
                    resourceLevel = '⭐⭐'
                    resources = C.FACTORY_COMMODITIES_LEVEL2_CHAIN;
                    break;

                case 4:
                    resourceLevel = '⭐⭐⭐'
                    resources = C.FACTORY_COMMODITIES_LEVEL3_CHAIN;
                    break;

                case 5:
                    resourceLevel = '⭐⭐⭐⭐'
                    resources = C.FACTORY_COMMODITIES_LEVEL4_CHAIN;
                    break;
            }

            let orderKeys = Object.keys(Game.market.orders);

            for (let resource of resources) {
                GameManager.addProcess('manageTerminal_buyOrder');

                if ((roomMyTerminal.store[resource] || 0) < Config.params.MARKUP_ORDER_BUY_AMOUNT) {

                    // Determine if we have an order for this resource already.
                    // If it does, don't do anything.
                    let orders = orderKeys.find(f => Game.market.orders[f].resourceType === resource);
                    if (orders) continue;

                    // Price protection!  Get the average of last 14 days of averages. Markup by fixed percent to find our acceptable buy price.
                    let avg = GameManager.getMarketValue(resource);
                    let buyPrice = avg * Config.params.MARKUP_ORDER_BUY_MARKUP_PERCENT;
                    let totalAmount = Config.params.MARKUP_ORDER_BUY_AMOUNT;
                    let fee = buyPrice * totalAmount * MARKET_FEE;

                    // Create an order for this resource.
                    if (Game.market.createOrder({
                        type: ORDER_BUY
                        , resourceType: resource
                        , price: buyPrice
                        , totalAmount: totalAmount
                        , roomName: room.name
                    }) == OK) {
                        console.log('📈 Order created', totalAmount + 'x ' + resourceLevel + ' [' + resource + '] @ ' + buyPrice.toFixed(3) + ' fee:' + fee.toFixed(3), room.printShard);
                        return true;
                    }
                }
            }
        }

        return false;
    }

}