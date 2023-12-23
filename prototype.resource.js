"use strict";

module.exports = function() {

	Object.defineProperty(Resource.prototype, 'value', {
		get() {
			if (typeof this._value === "undefined") {
                this._value = GameManager.getMarketValue(this.resourceType) * this.amount;
            }
			return this._value;
		},
		configurable: true, enumerable: true,
    });

};
