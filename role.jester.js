"use strict";

module.exports = function() {

    Creep.prototype.roleJester = function() {

        // Shorthand.
        let creep = this;
        let room = this.room;

        // Jesters are not needed for low level rooms, likely recycled from temple.
        if (room.controller.level <= 2) {
            creep.commitHaraKiri();
            return;
        }

        // Get the flag for the colony. If it doesn't exist, just nap till death.
        let templeFlag = room.templeFlag;
        if (!templeFlag) {
            creep.nap();
            return;
        }

        // Our master flag.
        let transferSuccess = false;
        let withdrawSuccess = false;

        // Save variables for common objects.
        let colonySpawn1 = room.colonySpawn1;
        let colonyTower1 = room.colonyTower1;
        let colonyStorage = room.storage;
        let colonyTerminal = room.terminal;

        // WITHDRAW: Attempt to withdraw from colony sites.
        if ((creep.ticksToLive >= Config.params.CREEP_STOP_WITHDRAW_TICKS) && !creep.store.getUsedCapacity()) {

            // spawn is completely full, we can use it as "free" 300 energy.
            // Only do this on the tower side however, as the terminal jester will have his hands full.
            if (!withdrawSuccess && colonySpawn1 && !colonySpawn1.store.getFreeCapacity(RESOURCE_ENERGY) && colonyTower1 && creep.pos.isNearTo(colonyTower1) && !room.colonyNeedsJester) {
                withdrawSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartWithdraw(colonySpawn1, RESOURCE_ENERGY));
            }

            // storage has something other than energy in it, grab it.
            if (!withdrawSuccess && colonyStorage && colonyTerminal && creep.pos.isNearTo(colonyTerminal)) {
                let resource = Object.keys(colonyStorage.store).find(f => f !== RESOURCE_ENERGY);
                if (resource) {
                    withdrawSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartWithdraw(colonyStorage, resource));
                }
            }

            // colonyTower1 has something in it, grab from it.
            if (!withdrawSuccess && colonyStorage && colonyTower1 && creep.pos.isNearTo(colonyTower1) && colonyStorage.store.getUsedCapacity(RESOURCE_ENERGY)) {
                withdrawSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartWithdraw(colonyStorage, RESOURCE_ENERGY));
            }

            // colonyTerminal has something in it (and not running low), grab from it.
            if (!withdrawSuccess && colonyStorage && colonyTerminal && creep.pos.isNearTo(colonyTerminal) && colonyTerminal.store.getUsedCapacity(RESOURCE_ENERGY) && colonyTerminal.store.isEnergyQuarterFull) {
                withdrawSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartWithdraw(colonyTerminal, RESOURCE_ENERGY));
            }

        }

        // TRANSFER: Drop off energy/minerals to colony locations.
        else if (creep.store.getUsedCapacity()) {

            // store has something other than energy in it, get rid of it.
            if (!transferSuccess && colonyStorage && colonyTerminal && creep.pos.isNearTo(colonyTerminal)) {
                let resource = Object.keys(creep.store).find(f => f !== RESOURCE_ENERGY);
                if (resource) {
                    transferSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartTransfer(colonyTerminal, resource));
                }
            }

            // Move from storage into tower.
            if (!transferSuccess && colonyTower1 && creep.pos.isNearTo(colonyTower1) && colonyTower1.store.getFreeCapacity(RESOURCE_ENERGY)) {
                transferSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartTransfer(colonyTower1, RESOURCE_ENERGY));
            }

            // Move from terminal to storage.
            if (!transferSuccess && colonyStorage && colonyTerminal && creep.pos.isNearTo(colonyTerminal) && colonyStorage.store.getFreeCapacity(RESOURCE_ENERGY)) {
                transferSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartTransfer(colonyStorage, RESOURCE_ENERGY));
            }

        }


        // We only need one king, so try to renew it to keep it immortal forever.
        // We haven't actually done anything above, so go for the renew.
        if (!creep.doNotRenew) {
            creep.smartRenew(false);
        }

    }

}

