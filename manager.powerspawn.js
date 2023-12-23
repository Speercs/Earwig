"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'canProcessPower', {
		get() {
			if (typeof this._canProcessPower === "undefined") {
                this._canProcessPower = false;

                // Do we even have a power spawn?
                let colonyPowerSpawn = this.colonyPowerSpawn;

                if (
                    colonyPowerSpawn
                    && colonyPowerSpawn.store.getUsedCapacity(RESOURCE_ENERGY)
                    && colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER)
                    && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) >= colonyPowerSpawn.operatePowerEnergy)
                    && (colonyPowerSpawn.store.getUsedCapacity(RESOURCE_POWER) >= colonyPowerSpawn.operatePowerAmount)

                    // Global flag check for disabling power processing.
                    && !FlagManager.noprocesspowerFlag

                    && (
                        // We are dumping power, so lets do this.
                        // Note we must be at target credits to buy, or have lower level rooms (since we are no longer in save credit mode).
                        (this.isStorageEnergyPower && !GameManager.haltProcessPower)

                        // Our power spawn is boosted, so keep it chugging while we still have reasonable energy.
                        || (this.isStorageEnergyNormal && (colonyPowerSpawn.operatePowerAmount > 1))

                        // We are overflowing with energy, can't sell it or use it fast enough.
                        || (this.isStorageFull && !this.operateStorageInactive && !GameManager.isEmpireObjectiveCredits)

                        // Process power at normal energy IF we have the highest emoung of storage energy in the empire.
                        // This is to be efficient with energy and avoid transfers all over the map by balancing rooms better.
                        || (this.isStorageEnergyPower && !this.haltProcessPowerBalance && !this.operateStorageInactive && this.isStoragePercentHighestInEmpire)
                    )
                ) this._canProcessPower = true;
			}
			return this._canProcessPower;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'haltProcessPowerBalance', {
		get() {
			if (typeof this._haltProcessPowerBalance === "undefined") {
                this._haltProcessPowerBalance = !!(
                    // Global flag check for disabling power processing.
                    FlagManager.noprocesspowerFlag

                    // Are we low on CPU? Lower bound than normal process power level.
                    || GameManager.haltSpawning

                    // Is empire objective NOT to increase gpl?
                    || !GameManager.isEmpireObjectiveGpl
                );
			}
			return this._haltProcessPowerBalance;
		},
		configurable: true, enumerable: true,
	});

    Room.prototype.managePowerSpawn = function() {
        // Do we even have a power spawn?
        let colonyPowerSpawn = this.colonyPowerSpawn;
        if (!colonyPowerSpawn) return false;

        // This is HUGE energy suck, so only do it when we have plenty of energy.
        if (this.canProcessPower) {
            if (colonyPowerSpawn.processPower() === OK) {
                return true;
            }
        }

        // Nothing processed.
        return false;
    }

}
