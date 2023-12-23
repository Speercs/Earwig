"use strict";

module.exports = function() {

	Object.defineProperty(Mineral.prototype, 'harvestPos', {
		get() {
			if (typeof this._harvestPos === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				let roomMemory = this.room.memory;
				let mineralHarvestPos = roomMemory[C.MEMORY_KEY_MINERAL_HARVEST_POSITION];

				if (mineralHarvestPos) {
					let memoryPos = unpackPos(mineralHarvestPos);
					object = memoryPos;
				}

				if (!object) {
					// Find the nip closest to the controller.
					// This is the most consistant way of finding a spot that does not have any variables and should never change.
					// Cannot be next to controller or a source.
					let nips = this.nips;
					if (this.room.controller) nips = nips.filter(nip => !nip.isNearTo(this.room.controller));
					if (this.room.sources.length) nips = nips.filter(nip => !this.room.sources.find(source => nip.isNearTo(source)));
					//if (this.room.minerals.length > 1) nips = nips.filter(nip => !this.room.minerals.find(otherMineral => (this.id !== otherMineral.id) && nip.isNearTo(otherMineral)));
					if (this.room.isSKRoom) nips = nips.filter(nip => !nip.isEqualTo(this.sourceKeeperPos));
					if (nips.length === 0) nips = this.nips;

					// Get the spot on the map we want to align outselves to.
					let alignToPos = this.room.controller? this.room.controller.pos : new RoomPosition(25, 25, this.room.name);

					object = _.sortByOrder(nips, [
						// Positions outside of exit range will always be preferred, but since none may be available
						// include them and we will put ramparts on them.
						sortExits => this.room.exits.find(f => f.inRange4(sortExits)) ? 1 : 0

						// Now pick the spot that is vertically/horizontally closest to our chosen alignment position.
						, sortAlignToPos => sortAlignToPos.getDistanceTo(alignToPos)
					]).find(x => x !== undefined);

					roomMemory[C.MEMORY_KEY_MINERAL_HARVEST_POSITION] = object ? packPos(object) : null;
				}

				this._harvestPos = object || null;
            }
			return this._harvestPos;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Mineral.prototype, 'operateTicksRemaining', {
		get() {
            if (typeof this._operateTicksRemaining === "undefined") {
                this._operateTicksRemaining = this.effectTicksRemaining(PWR_REGEN_MINERAL);
            }
			return this._operateTicksRemaining;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Mineral.prototype, 'transporter', {
		get() {
            if (typeof this._transporter === "undefined") {
                this._transporter = _.sortBy(CreepManager.getJackassByFocusId(this.id).filter(f => !f.spawning && f.store.getFreeCapacity()), s => s.pos.getRangeTo(this))[0] || null;
            }
			return this._transporter;
		},
		configurable: true, enumerable: true,
    });

};
