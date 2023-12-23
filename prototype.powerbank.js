"use strict";

module.exports = function() {

    Object.defineProperty(StructurePowerBank.prototype, 'marketValue', {
        get() {
			if (typeof this._marketValue === "undefined") {
				this._marketValue = GameManager.getMarketValue(RESOURCE_POWER) * this.power;
            }
            return this._marketValue;
        },
        configurable: true, enumerable: true,
	});

};
