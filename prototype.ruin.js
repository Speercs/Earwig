"use strict";

module.exports = function() {

	Object.defineProperty(Ruin.prototype, 'value', {
		get() {
			if (typeof this._value === "undefined") {
                this._value = _.sum(Object.keys(this.store), s => this.store[s] * GameManager.getMarketValue(s));
			}
			return this._value;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Ruin.prototype, 'amount', {
		get() {
			if (typeof this._amount === "undefined") {
                this._amount = _.sum(Object.keys(this.store), s => this.store[s]);
			}
			return this._amount;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Ruin.prototype, 'storeMostValuableResource', {
		get() {
			if (typeof this._storeMostValuableResource === "undefined") {
				this._storeMostValuableResource = null;
				let keys = Object.keys(this.store);
				if (keys.length) {
					if (keys.length > 1) {
						this._storeMostValuableResource = _.sortBy(keys, s => -GameManager.getMarketValue(s)).find(x => x !== undefined);
					}
					else {
						this._storeMostValuableResource = keys[0];
					}
				}
			}
			return this._storeMostValuableResource;
		},
		configurable: true, enumerable: true,
	});

};
