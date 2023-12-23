"use strict";

module.exports = function() {

    Creep.prototype.roleQueen = function() {

        // Shorthand.
        let creep = this;
        let room = this.room;

        // Queens are not needed for low level rooms, likely recycled from temple.
        if (room.controller.level <= 3) {
            creep.commitHaraKiri();
            return;
        }

        // No need to run every tick.
        if (Game.time % Config.params.QUEEN_TICK_MOD !== 1) return;

        // Get the flag for the colony. If it doesn't exist, just nap till death.
        let colonyFlag = room.colonyFlag;
        if (!colonyFlag) {
            creep.nap();
            return;
        }

        // Our master flag.
        let transferSuccess = false;
        let withdrawSuccess = false;

        // Save variables for common objects.
        let colonyTower1 = room.colonyTower1;


        // TRANSFER: Drop off energy/minerals to colony locations.
        if (creep.store.getUsedCapacity()) {
            let transfer = null;

            if (!transfer) {
                transfer = room.colonyQueenTowers.filter(structure =>
                    // Tower is below the threshhold to withdraw from.
                    (structure.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store.getUsedCapacity(RESOURCE_ENERGY))
                    || (structure.store.getUsedCapacity(RESOURCE_ENERGY) < Config.params.QUEEN_TOWER_ENERGY_TARGET)
                );
                transfer = _.sortBy(transfer, s => s.store[RESOURCE_ENERGY]).find(x => x !== undefined);
            }

            // For the spawns we are filling, find ones that need energy and sort by who needs the most energy.
            if (!transfer) {
                transfer = room.colonyQueenSpawns.filter(f => (f.store.getFreeCapacity(RESOURCE_ENERGY) > 0));
                transfer = _.sortBy(transfer, s => s.store[RESOURCE_ENERGY]).find(x => x !== undefined);
            }

            if (transfer) {
                transferSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartTransfer(transfer, RESOURCE_ENERGY));
            }
        }


        // WITHDRAW: Attempt to withdraw from colony sites.
        if ((creep.ticksToLive >= Config.params.CREEP_STOP_WITHDRAW_TICKS) && creep.store.getFreeCapacity()) {

            // colonyTower1 has something in it, grab from it.
            if (!withdrawSuccess && colonyTower1 && colonyTower1.store.getUsedCapacity(RESOURCE_ENERGY)) {
                withdrawSuccess = [OK, ERR_NOT_IN_RANGE].includes(creep.smartWithdraw(colonyTower1, RESOURCE_ENERGY));
            }

        }


        // We only need one king, so try to renew it to keep it immortal forever.
        // We haven't actually done anything above, so go for the renew.
        if (
            (
                (room.colonySpawn2 && !room.colonySpawn2.spawning)
                || (room.colonySpawn3 && !room.colonySpawn3.spawning)
            )
            && !room.isCreepOnColonyRenewPos
            && !creep.doNotRenew
        ) {
            creep.smartRenew(false);
        }

    }

}

