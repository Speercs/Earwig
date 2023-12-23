"use strict";

module.exports = function() {

	Object.defineProperty(Store.prototype, 'isEnergyQuarterFull', {
		get() {
			if (typeof this._isEnergyQuarterFull === "undefined") {
                this._isEnergyQuarterFull = this.getUsedCapacity(RESOURCE_ENERGY) > (this.getCapacity(RESOURCE_ENERGY) / 4);
			}
			return this._isEnergyQuarterFull;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Store.prototype, 'isEnergyHalfFull', {
		get() {
			if (typeof this._isEnergyHalfFull === "undefined") {
                this._isEnergyHalfFull = this.getUsedCapacity(RESOURCE_ENERGY) > (this.getCapacity(RESOURCE_ENERGY) / 2);
			}
			return this._isEnergyHalfFull;
		},
		configurable: true, enumerable: true,
    });

};
