"use strict";

module.exports = function() {

	Object.defineProperty(Room.prototype, 'heap', {
		get() {
			return Object.defineProperty(this, 'heap', { value: Heap.rooms[this.name] }).heap;
			//return Heap.rooms[this.name];
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'heap', {
		get() {
			return Object.defineProperty(this, 'heap', { value: Heap.creeps[this.name] }).heap;
			//return Heap.creeps[this.name];
		},
		configurable: true, enumerable: true,
	});

}
