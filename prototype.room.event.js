"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'hasEventObjectDestroyed', {
		get() {
			if (typeof this._hasEventObjectDestroyed === "undefined") {
				this._hasEventObjectDestroyed = this.getEventLog().find(f => f.event === EVENT_OBJECT_DESTROYED);
			}
			return this._hasEventObjectDestroyed;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'hasEventAttack', {
		get() {
			if (typeof this._hasEventAttack === "undefined") {
				let attackEvents = this.getEventLog().filter(f => f.event === EVENT_ATTACK);
				this._hasEventAttack = !!attackEvents.some(event => {
					let target = Game.getObjectById(event.data.targetId);
					if (target && target.my) {
						return true;
					}
					return false;
				});
			}
			return this._hasEventAttack;
		},
		configurable: true, enumerable: true,
	});

}
