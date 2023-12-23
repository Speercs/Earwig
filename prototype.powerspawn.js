"use strict";

module.exports = function() {

	Object.defineProperty(StructurePowerSpawn.prototype, 'operatePowerAmount', {
		get() {
			if (typeof this._operatePowerAmount === "undefined") {
                this._operatePowerAmount = 1 + (this.hasEffect(PWR_OPERATE_POWER) || 0);
			}
			return this._operatePowerAmount;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(StructurePowerSpawn.prototype, 'operatePowerEnergy', {
		get() {
			if (typeof this._operatePowerEnergy === "undefined") {
                this._operatePowerEnergy = this.operatePowerAmount * POWER_SPAWN_ENERGY_RATIO;
			}
			return this._operatePowerEnergy;
		},
		configurable: true, enumerable: true,
	});

}
