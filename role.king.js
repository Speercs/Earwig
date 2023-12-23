"use strict";

module.exports = function() {

    Creep.prototype.roleKing = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Kings are not needed for low level rooms, likely recycled from temple.
        if (room.controller.level <= 3) {
            creep.commitHaraKiri();
            return;
        }

        // In order to optimize CPU, only manage the terminal if we detected a cooldown.
        let roomMyTerminal = room.myTerminal;
        let colonyPowerSpawn = room.colonyPowerSpawn;
        let roomMyStorage = room.myStorage;

        // If we have no storage unit, this role is useless.
        if (!roomMyStorage) {
            return;
        }

        // Run every tick if we have focus or we are processing power or have large storage, as energy will be flowing in quickly.
        // Otherwise once every x turns to keep CPU down.
        if (
            // Placeholder
            false

            // Low level rooms will be busy always.
            || !room.atMaxLevel

            // We have sent something via terminal or received energy, hurry and get back to balance.
            || (roomMyTerminal && (roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) !== Config.params.TERMINAL_TARGET_ENERGY))

            // Powerspawn is dry of energy or power.
            || (colonyPowerSpawn && roomMyTerminal && roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER) && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER) < colonyPowerSpawn.operatePowerAmount))
            || (colonyPowerSpawn && roomMyTerminal && roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER) && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) < colonyPowerSpawn.operatePowerEnergy))

            // We have source boost power, which means massive incoming link transfers.
            || (colonyPowerSpawn && room.operateSourceLevel)
        ) {
            // Do nothing. Will run every tick. Easier to understand logic without NOTs.
        }
        else {
            if (Game.time % Config.params.KING_TICK_MOD !== 0) return;
        }

        // Get the flag for the colony. If it doesn't exist, just nap till death.
        let colonyFlag = room.colonyFlag;
        if (!colonyFlag) return;

        // In order to optimize CPU, only manage the factory if we detected a cooldown.
        let colonyFactory = room.colonyFactory;
        let manageFactory = (Game.time % (Config.params.KING_TICK_MOD_FACTORY) === 0);
        if (colonyFactory && colonyFactory.cooldown) manageFactory = true;
        let factoryLevel = room.factoryLevel;

        // Our master flag.
        let withdrawSuccess = false;
        let transferSuccess = false;


        // TRANSFER: Drop off minerals/resources to various locations.
        if (creep.store.getUsedCapacity()) {

            // Drop off resources we need to produce into factory as long as there is room. This includes ops.
            // Anything above target amount else will be dropped off into terminal later.
            // Should include energy as well.
            if (!transferSuccess) {
                if (colonyFactory && (colonyFactory.store.getFreeCapacity() > 0)) {
                    // This SHOULD be close to O(1).
                    // King doesn't hold more than 2 things in store.
                    // The constant hash lookup is instant.
                    // The Utilitye function is cached results and effectively instant.
                    let resource = Object.keys(creep.store).find(f => colonyFactory.store.getUsedCapacity(f) < utils.getMaxComponentAmountForFactoryLevel(f, factoryLevel));
                    if (resource) {
                        let amount = Math.min(
                            creep.store.getUsedCapacity(resource)
                            , colonyFactory.store.getFreeCapacity()
                            , utils.getMaxComponentAmountForFactoryLevel(resource, factoryLevel) - colonyFactory.store.getUsedCapacity(resource)
                        );
                        transferSuccess = (creep.smartStorage(colonyFactory, resource, amount) === OK);
                    }
                }
            }

            // Drop off ghodium into nuker.
            if (!transferSuccess) {
                let resource = RESOURCE_GHODIUM;
                let roomMyNuker = room.colonyNuker;
                if (roomMyNuker && creep.store.getUsedCapacity(resource) && (roomMyNuker.store.getFreeCapacity(resource) > 0)) {
                    transferSuccess = (creep.smartStorage(roomMyNuker, resource) === OK);
                }
            }

            // Powerspawn logic.
            // Keep our powerspawns buzzing processing power.
            // If I have power in my hands, and we are full on energy.
            if (!transferSuccess) {
                if (colonyPowerSpawn && creep.store.getUsedCapacity(RESOURCE_POWER) && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER) < colonyPowerSpawn.operatePowerAmount) && !colonyPowerSpawn.store.getFreeCapacity(RESOURCE_ENERGY)) {
                    transferSuccess = (creep.smartStorage(colonyPowerSpawn, RESOURCE_POWER) === OK);
                }
            }

            // Put any leftover resources into terminal, or storage, since the apparently didn't fit into our terminal (it may not exist yet).
            if (!transferSuccess) {
                // This should be close to instant.
                let resource = Object.keys(creep.store).find(f => f !== RESOURCE_ENERGY);

                if (resource) {
                    // Fungibles go into terminal up to target as a baseline
                    if (!transferSuccess && roomMyTerminal && C.TERMINAL_FUNGIBLES_HASH[resource] && (roomMyTerminal.store.getUsedCapacity(resource) < Config.params.TERMINAL_STORE_TARGET)) {
                        let amount = Math.min(creep.store.getUsedCapacity(resource), roomMyTerminal.store.getFreeCapacity(), (Config.params.TERMINAL_STORE_TARGET - roomMyTerminal.store.getUsedCapacity(resource)));
                        transferSuccess = (creep.smartStorage(roomMyTerminal, resource, amount) === OK);
                    }

                    // Fungibles go into storage up to target.
                    if (!transferSuccess && roomMyStorage && C.TERMINAL_FUNGIBLES_HASH[resource] && (roomMyStorage.store.getUsedCapacity(resource) < Config.params.STORAGE_STORE_TARGET)) {
                        let amount = Math.min(creep.store.getUsedCapacity(resource), roomMyStorage.store.getFreeCapacity(), (Config.params.STORAGE_STORE_TARGET - roomMyStorage.store.getUsedCapacity(resource)));
                        transferSuccess = (creep.smartStorage(roomMyStorage, resource, amount) === OK);
                    }

                    // Everything else goes into terminal as long as it can fit.
                    if (!transferSuccess && roomMyTerminal && (roomMyTerminal.store.getFreeCapacity() > 0)) {
                        let amount = Math.min(creep.store.getUsedCapacity(resource), roomMyTerminal.store.getFreeCapacity());
                        transferSuccess = (creep.smartStorage(roomMyTerminal, resource, amount) === OK);
                    }

                    // Fall back to storage; else goes into storage as long as it can fit.
                    if (!transferSuccess && roomMyStorage && (roomMyStorage.store.getFreeCapacity() > 0)) {
                        let amount = Math.min(creep.store.getUsedCapacity(resource), roomMyStorage.store.getFreeCapacity());
                        transferSuccess = (creep.smartStorage(roomMyStorage, resource, amount) === OK);
                    }
                }
            }


            // Energy transfers.
            if (!transferSuccess && (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) {

                // Primary energy transfers.

                if (!transferSuccess) {
                    let colonyLink = room.colonyLink;
                    let controllerLink = room.controllerLink;
                    // If we have a controller link and it is empty (<= half), then put energy back into the colony link to be sent away.
                    // However don't put any in until its cooldown is close to over, since our peasents might be trying to send us something.
                    if (colonyLink && (colonyLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) && controllerLink && !controllerLink.store.isEnergyHalfFull && (
                        // At level 5, we will only have these two links, so fill always.
                        (room.controller.level === 5)
                        // At higher levels, only fill when needed, since the other source links will be assisting.
                        || ((colonyLink.cooldown || 0) < 3)
                    )) {
                        transferSuccess = (creep.smartTransfer(colonyLink, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    let colonyTower1 = room.colonyTower1;
                    // Fill up the tower first. Queen needs energy in this tower for its supply.
                    if (colonyTower1 && (colonyTower1.store.getUsedCapacity(RESOURCE_ENERGY) < Config.params.KING_TOWER_TARGET)) {
                        transferSuccess = (creep.smartTransfer(colonyTower1, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    let colonySpawn1 = room.colonySpawn1;
                    // Fill up the spawn when below half energy. This helps keep renew going but allows to fill terminal below.
                    if (colonySpawn1 && !colonySpawn1.store.isEnergyHalfFull) {
                        transferSuccess = (creep.smartTransfer(colonySpawn1, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    // If we have a power spawn then make sure it has SOME energy to process.
                    if (colonyPowerSpawn && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) < colonyPowerSpawn.operatePowerEnergy)) {
                        transferSuccess = (creep.smartTransfer(colonyPowerSpawn, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    // Terminal should have a target of its capacity as energy on reserve for transmitting.
                    if (roomMyTerminal && (roomMyTerminal.store.getFreeCapacity() > 0) && (roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < Config.params.TERMINAL_TARGET_ENERGY)) {
                        let amount = Math.min(creep.store.getUsedCapacity(RESOURCE_ENERGY), roomMyTerminal.store.getFreeCapacity(), Config.params.TERMINAL_TARGET_ENERGY - roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY));
                        transferSuccess = (creep.smartTransfer(roomMyTerminal, RESOURCE_ENERGY, amount) === OK);
                    }
                }


                // Secondary transfers for ubundant situations.

                if (!transferSuccess) {
                    // Does our nuker need energy? Only fill when we are dumping energy.
                    let roomMyNuker = room.colonyNuker;
                    if (roomMyNuker && (roomMyNuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0) && room.isStorageEnergyAbundant) {
                        transferSuccess = (creep.smartTransfer(roomMyNuker, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    // Top off the power spawn with full energy once all power has been processed.
                    if (colonyPowerSpawn && (colonyPowerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER) < colonyPowerSpawn.operatePowerAmount)) {
                        transferSuccess = (creep.smartTransfer(colonyPowerSpawn, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    let colonySpawn = room.colonySpawn1;
                    // Fill up the spawn. Kinda dangerous, as this emptys constantly due to renew.
                    if (colonySpawn && (colonySpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
                        transferSuccess = (creep.smartTransfer(colonySpawn, RESOURCE_ENERGY) === OK);
                    }
                }

                if (!transferSuccess) {
                    let colonyLink = room.colonyLink;
                    // If we know we have overflow energy in link, terminal or factory, then dump anything we have left into storage.
                    if (
                        (roomMyStorage.store.getFreeCapacity() > 0)
                        && (
                            (colonyLink && colonyLink.store.getUsedCapacity(RESOURCE_ENERGY))
                            || (roomMyTerminal && (roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) > Config.params.TERMINAL_TARGET_ENERGY))
                            || (colonyFactory && (colonyFactory.store.getUsedCapacity(RESOURCE_ENERGY) > Config.params.FACTORY_STORE_TARGET))
                            || (creep.ticksToLive < Config.params.CREEP_STOP_WITHDRAW_TICKS)
                        )
                    ) {
                        transferSuccess = (creep.smartStorage(roomMyStorage, RESOURCE_ENERGY) === OK);
                    }

                }

            }
        }


        // WITHDRAW: Attempt to withdraw from colony sites.
        // Be careful about overwithdrawing when we have mats in creep storage already. No point of having more than 2 resources in our store at once.
        if ((creep.store.getFreeCapacity() > 0) && (Object.keys(creep.store).length <= 1) && (creep.ticksToLive >= Config.params.CREEP_STOP_WITHDRAW_TICKS)) {

            // Energy overflow in link, terminal, or factory. Perform these first.
            {
                // Link has something in it and the controllerLink (if any) is empty (<= half), empty that bad boy (colonyLink) out.
                if (!withdrawSuccess) {
                    let colonyLink = room.colonyLink;
                    let controllerLink = room.controllerLink;
                    if (colonyLink && colonyLink.store.getUsedCapacity(RESOURCE_ENERGY) && (!controllerLink || controllerLink.store.isEnergyHalfFull)) {
                        withdrawSuccess = (creep.smartWithdraw(colonyLink, RESOURCE_ENERGY) === OK);
                    }
                }

                // We have too much energy in the terminal (should be exact number), so take some out to correct it.
                if (!withdrawSuccess) {
                    if (roomMyTerminal && (roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) > Config.params.TERMINAL_TARGET_ENERGY)) {
                        // Terminal shoudl have 1/30th of its capacity as energy on reserve for transmitting.
                        let amount = Math.min(creep.store.getFreeCapacity(), roomMyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) - Config.params.TERMINAL_TARGET_ENERGY);
                        withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, RESOURCE_ENERGY, amount) === OK);
                    }
                }
            }

            // Our nuker needs ghodium.
            if (!withdrawSuccess) {
                let roomMyNuker = room.colonyNuker;
                if (roomMyNuker && roomMyTerminal && (roomMyNuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) && roomMyTerminal.store.getUsedCapacity(RESOURCE_GHODIUM)) {
                    let amount = Math.min(creep.store.getFreeCapacity(), roomMyTerminal.store.getUsedCapacity(RESOURCE_GHODIUM), roomMyNuker.store.getFreeCapacity(RESOURCE_GHODIUM));
                    withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, RESOURCE_GHODIUM, amount) === OK);
                }
            }

            // Our powerspawn needs power. Only do this once the powerspawn is completely dry and energy has been topped off.
            if (!withdrawSuccess) {
                if (colonyPowerSpawn && roomMyTerminal && !colonyPowerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER) < colonyPowerSpawn.operatePowerAmount) && roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER)) {
                    let amount = Math.min(creep.store.getFreeCapacity(), roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER), colonyPowerSpawn.store.getFreeCapacity(RESOURCE_POWER));
                    withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, RESOURCE_POWER, amount) === OK);
                }
            }

            // WITHDRAW: FACTORY
            {
                // Our factory needs components to produce. If we have any in the terminal, take as much as we need to get to the target amount.
                // Note that ops go in factory for power creep storage.
                // Note that creep MAY have some in store already due to simultanious actions logic.
                if (!withdrawSuccess) {
                    if (manageFactory && colonyFactory && roomMyTerminal && (colonyFactory.store.getFreeCapacity() > 0)) {
                        // Since the find is first looking at the terminal store, this will be O(N).
                        let resource = Object.keys(C.FACTORY_COMPONENTS_BY_LEVEL_HASH[room.factoryLevel]).find(f =>
                            roomMyTerminal.store.getUsedCapacity(f)
                            && (colonyFactory.store.getUsedCapacity(f) < utils.getMaxComponentAmountForFactoryLevel(f, factoryLevel))
                        );
                        if (resource) {
                            let amount = Math.min(
                                creep.store.getFreeCapacity()
                                , roomMyTerminal.store.getUsedCapacity(resource)
                                , utils.getMaxComponentAmountForFactoryLevel(resource, factoryLevel) - colonyFactory.store.getUsedCapacity(resource) - creep.store.getUsedCapacity(resource)
                            );
                            if (amount > 0) {
                                withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, resource, amount) === OK);
                            }
                        }
                    }
                }

                // Withdraw any resource with amounts over the factory level target.
                // There is not much space here to play with so yeah stick them back in the terminal.
                // This includes commodities that the factory created (as long as it can't use them at higher level production.)
                if (!withdrawSuccess) {
                    if (manageFactory && colonyFactory && roomMyTerminal && (roomMyTerminal.store.getFreeCapacity() > 0)) {
                        // This is O(n) on every call, since we have to test every key in the factory; which will be 17 or more every time.
                        let resource = Object.keys(colonyFactory.store).find(f => colonyFactory.store.getUsedCapacity(f) > utils.getMaxComponentAmountForFactoryLevel(f, factoryLevel));
                        if (resource) {
                            let amount = Math.min(creep.store.getFreeCapacity(), colonyFactory.store.getUsedCapacity(resource), roomMyTerminal.store.getFreeCapacity(), colonyFactory.store.getUsedCapacity(resource) - utils.getMaxComponentAmountForFactoryLevel(resource, factoryLevel));
                            withdrawSuccess = (creep.smartWithdraw(colonyFactory, resource, amount) === OK);
                        }
                    }
                }

            }

            // Deal with resources someone put in storage if we now have a terminal to move things around.
            // Once we have a terminal, the only thing that goes in storage is energy and fungibles.
            if (!withdrawSuccess) {
                if (roomMyStorage && roomMyTerminal && (roomMyTerminal.store.getFreeCapacity() > 0)) {
                    let resource = Object.keys(roomMyStorage.store).find(f =>
                        (f !== RESOURCE_ENERGY)
                        && (!C.TERMINAL_FUNGIBLES_HASH[f] || (roomMyTerminal.store.getUsedCapacity(f) < Config.params.TERMINAL_STORE_TARGET))
                    );
                    if (resource) {
                        let amount = 0;
                        if (C.TERMINAL_FUNGIBLES_HASH[resource]) {
                            amount = Math.min(creep.store.getFreeCapacity(), roomMyStorage.store.getUsedCapacity(resource), roomMyTerminal.store.getFreeCapacity(), (Config.params.TERMINAL_STORE_TARGET - roomMyTerminal.store.getUsedCapacity(resource)))
                        } else {
                            amount = Math.min(creep.store.getFreeCapacity(), roomMyStorage.store.getUsedCapacity(resource), roomMyTerminal.store.getFreeCapacity());
                        }
                        withdrawSuccess = (creep.smartWithdraw(roomMyStorage, resource, amount) === OK);
                    }
                }
            }

            // Withdraw excess fungible from terminal if our storage is low.
            // Do not withdraw more than the terminal minimum amount.
            if (!withdrawSuccess) {
                if (roomMyStorage && roomMyTerminal && (roomMyStorage.store.getFreeCapacity() > 0)) {
                    let resource = C.TERMINAL_FUNGIBLES.find(f =>
                        (roomMyTerminal.store.getUsedCapacity(f) > Config.params.TERMINAL_STORE_TARGET)
                        && (roomMyStorage.store.getUsedCapacity(f) < Config.params.STORAGE_STORE_TARGET)
                    );
                    if (resource) {
                        let amount = Math.min(creep.store.getFreeCapacity(), roomMyTerminal.store.getUsedCapacity(resource), roomMyStorage.store.getFreeCapacity(), (Config.params.STORAGE_STORE_TARGET - roomMyStorage.store.getUsedCapacity(resource)), (roomMyTerminal.store.getUsedCapacity(resource) - Config.params.TERMINAL_STORE_TARGET))
                        withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, resource, amount) === OK);
                    }
                }
            }

            // When room is not in process power mode, our powerspawn could be topped off with FULL power once it has full energy.
            // This is a fresh start on the power process, and will ensure all rooms are topped off and terminals are back to normal.
            // if (!withdrawSuccess) {
            //     if (colonyPowerSpawn && roomMyTerminal && !colonyPowerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) && (colonyPowerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 0) && (colonyPowerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) && roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER) && !room.canProcessPower) {
            //         let amount = Math.min(creep.store.getFreeCapacity(), roomMyTerminal.store.getUsedCapacity(RESOURCE_POWER), colonyPowerSpawn.store.getFreeCapacity(RESOURCE_POWER));
            //         withdrawSuccess = (creep.smartWithdraw(roomMyTerminal, RESOURCE_POWER, amount) === OK);
            //     }
            // }

            // Last step....
            if (!withdrawSuccess && creep.store.getFreeCapacity()) {
                // If nobody needs anything, then grab some energy as we are most likely to need it.
                // Too many cases where we would need (passive) energy.
                if (roomMyStorage.store.getUsedCapacity(RESOURCE_ENERGY) && (creep.store.getUsedCapacity(RESOURCE_ENERGY) < LINK_CAPACITY)) {
                    let amount = Math.min(roomMyStorage.store.getUsedCapacity(RESOURCE_ENERGY), creep.store.getFreeCapacity(), LINK_CAPACITY - creep.store.getUsedCapacity(RESOURCE_ENERGY));
                    withdrawSuccess = (creep.smartWithdraw(roomMyStorage, RESOURCE_ENERGY, amount) === OK);
                }
            }
        }


        // We only need one king, so try to renew it to keep it immortal forever.
        // We haven't actually done anything above, so go for the renew.
        if (
            (room.colonySpawn1 && !room.colonySpawn1.spawning)
            && !room.isCreepOnColonyRenewPos
            && !creep.doNotRenew
        ) {
            creep.smartRenew(false);
        }

    }

}

