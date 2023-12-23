"use strict";

module.exports = function() {

	Object.defineProperty(RoomObject.prototype, 'storeEmpty', {
		get() {
            if (typeof this._storeEmpty === "undefined") {
                this._storeEmpty = !!this.store && (this.store.getUsedCapacity() === 0);
            }
			return this._storeEmpty;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'hasEnergy', {
		get() {
            if (typeof this._hasEnergy === "undefined") {
				this._hasEnergy = !!this.store && (this.store.getUsedCapacity(RESOURCE_ENERGY) > 0);
            }
			return this._hasEnergy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'hasMinerals', {
		get() {
            if (typeof this._hasMinerals === "undefined") {
				this._hasMinerals = !!this.store && this.store.getUsedCapacity() && (this.store.getUsedCapacity(RESOURCE_ENERGY) !== this.store.getUsedCapacity())
            }
			return this._hasMinerals;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'storeFull', {
		get() {
            if (typeof this._storeFull === "undefined") {
                // Note that stores CAN go into negative numbers.
				this._storeFull = !!this.store && (this.store.getFreeCapacity() <= 0);
            }
			return this._storeFull;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'storeNearEmpty', {
		get() {
            if (typeof this._storeNearEmpty === "undefined") {
				this._storeNearEmpty = !!this.store && (this.store.getFreeCapacity() > this.store.getUsedCapacity());
            }
			return this._storeNearEmpty;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'storeNearFull', {
		get() {
            if (typeof this._storeNearFull === "undefined") {
				this._storeNearFull = !!this.store && (this.store.getFreeCapacity() < this.store.getUsedCapacity());
            }
			return this._storeNearFull;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'energyOnly', {
		get() {
            if (typeof this._energyOnly === "undefined") {
				this._energyOnly = !!this.store && (this.store.getUsedCapacity() === 0 || (this.store.getUsedCapacity(RESOURCE_ENERGY) === this.store.getUsedCapacity()));
            }
			return this._energyOnly;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomObject.prototype, 'mineralOnly', {
		get() {
            if (typeof this._mineralOnly === "undefined") {
				this._mineralOnly = !!this.store && (this.store.getUsedCapacity() === 0 || (this.store.getUsedCapacity(RESOURCE_ENERGY) != this.store.getUsedCapacity()));
            }
			return this._mineralOnly;
		},
		configurable: true, enumerable: true,
    });

}
