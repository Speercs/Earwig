"use strict";

module.exports = function() {

	Object.defineProperty(StructureLab.prototype, 'usedMineralCapacity', {
		get() {
			if (typeof this._usedMineralCapacity === "undefined") {
                this._usedMineralCapacity = this.mineralType ? this.store.getUsedCapacity(this.mineralType) : 0;
            }
			return this._usedMineralCapacity;
		},
		configurable: true, enumerable: true,
    });

};
