"use strict";

module.exports = function() {

	Object.defineProperty(StructureController.prototype, 'progressRemaining', {
		get() {
			return (this.progressTotal || 0) - (this.progress || 0);
		},
		configurable: true, enumerable: true,
    });

};
