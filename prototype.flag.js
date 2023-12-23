"use strict";

module.exports = function() {

	Object.defineProperty(Flag.prototype, 'code', {
		get() {
			if (typeof this._code === "undefined") {
                this._code = this.name + '_' + this.pos.name + '_' + this.color;
			}
			return this._code;
		},
		configurable: true, enumerable: true,
    });

};
