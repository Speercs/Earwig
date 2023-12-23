"use strict";

module.exports = function() {

	Object.defineProperty(StructureKeeperLair.prototype, 'resource', {
		get() {
			if (typeof this._resource === "undefined") {
				if (this.room.heap.keeperLairResource === undefined) this.room.heap.keeperLairResource = {};

				this._resource = this.room.heap.keeperLairResource[this.id];
				if (typeof this._resource === "undefined") {
					this.room.heap.keeperLairResource[this.id] = this.room.resources.find(f => f.pos.inRange6(this));
					this._resource = this.room.heap.keeperLairResource[this.id];
				}
			}
			return this._resource;
		},
		configurable: true, enumerable: true,
    });

};
