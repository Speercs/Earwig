"use strict";

module.exports = function() {

	Object.defineProperty(StructureNuker.prototype, 'readyToLaunch', {
		get() {
			if (typeof this._readyToLaunch === "undefined") {
                this._readyToLaunch = !this.cooldown && !(this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) && !this.store.getFreeCapacity(RESOURCE_GHODIUM);
            }
			return this._readyToLaunch;
		},
		configurable: true, enumerable: true,
    });

};
