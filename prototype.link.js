"use strict";

module.exports = function() {

	Object.defineProperty(StructureLink.prototype, 'isColonyLink', {
		get() {
			if (typeof this._isColonyLink === "undefined") {
                this._isColonyLink = false;
                if (this.room.colonyLink) this._isColonyLink = (this.room.colonyLink.id == this.id);
            }
			return this._isColonyLink;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(StructureLink.prototype, 'isControllerLink', {
		get() {
			if (typeof this._isControllerLink === "undefined") {
                this._isControllerLink = false;
                if (this.room.controllerLink) this._isControllerLink = (this.room.controllerLink.id == this.id);
            }
			return this._isControllerLink;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(StructureContainer.prototype, 'isSourceLink', {
		get() {
			if (typeof this._isSourceLink === "undefined") {
				this._isSourceLink = !!this.room.sourceLinks.find(f => f.id === this.id);
            }
			return this._isSourceLink;
		},
		configurable: true, enumerable: true,
    });

};
