"use strict";

module.exports = function() {

	Object.defineProperty(StructureContainer.prototype, 'isSourceContainer', {
		get() {
			if (typeof this._isSourceContainer === "undefined") {
				this._isSourceContainer = !!this.room.sourceContainers.find(f => f.id === this.id);
            }
			return this._isSourceContainer;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(StructureContainer.prototype, 'isControllerContainer', {
		get() {
			if (typeof this._isControllerContainer === "undefined") {
                this._isControllerContainer = !!this.room.controllerContainers.find(f => f.id === this.id);
            }
			return this._isControllerContainer;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(StructureContainer.prototype, 'isColonyContainer', {
		get() {
			if (typeof this._isColonyContainer === "undefined") {
				this._isColonyContainer = false;
				if (this.room.colonyFlag && this.room.colonyContainer) {
					this._isColonyContainer = this.id === this.room.colonyContainer.id;
				}
            }
			return this._isColonyContainer;
		},
		configurable: true, enumerable: true,
    });

};
