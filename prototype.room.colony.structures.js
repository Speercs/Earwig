"use strict";

// Room prototypes - commonly used room properties and methods
// https://github.com/bencbartlett/Overmind/blob/master/src/prototypes/Room.ts

module.exports = function() {

	Object.defineProperty(Room.prototype, 'colonyContainer', {
		get() {
			if (typeof this._colonyContainer === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				// Once we have storage container, the colony container will be destroyed.
				if (!this.myStorage) {
					if (this.memory.colonyContainerId) object = Game.getObjectById(this.memory.colonyContainerId);

					// Object wasn't in cache, so look for it.
					if (!object && this.colonyFlag) {
						let pos = ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_CONTAINER(this.colonyFlag));
						object = pos.lookForContainer();
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyContainerId = object.id;
				}
				else {
					delete this.memory.colonyContainerId;
				}

				this._colonyContainer = object || null;
			}
			return this._colonyContainer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonySpawns', {
		get() {
			if (typeof this._colonySpawns === "undefined") {
				this._colonySpawns = [];
				if (this.colonySpawn1) this._colonySpawns.push(this.colonySpawn1);
				if (!this.isTemple) {
					if (this.colonySpawn2) this._colonySpawns.push(this.colonySpawn2);
					if (this.colonySpawn3) this._colonySpawns.push(this.colonySpawn3);
				}
            }
			return this._colonySpawns;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonySpawn1', {
		get() {
			if (typeof this._colonySpawn1 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonySpawn1Id) object = Game.structures[this.memory.colonySpawn1Id];

				// Object wasn't in cache, so look for it.
				if (!object) {
					if (this.isTemple && this.templeSpawnPos) {
						let xy = this.templeSpawnPos;
						object = xy.lookForStructure(STRUCTURE_SPAWN);
					}
					else if (this.colonyFlag) {
						let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_SPAWN1(this.colonyFlag));
						object = xy.lookForStructure(STRUCTURE_SPAWN);
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonySpawn1Id = object.id;
				}
				else {
					delete this.memory.colonySpawn1Id;
				}

				this._colonySpawn1 = object || null;
            }
			return this._colonySpawn1;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonySpawn2', {
		get() {
			if (typeof this._colonySpawn2 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonySpawn2Id) object = Game.structures[this.memory.colonySpawn2Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_SPAWN2(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_SPAWN);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonySpawn2Id = object.id;
				}
				else {
					delete this.memory.colonySpawn2Id;
				}

				this._colonySpawn2 = object || null;
            }
			return this._colonySpawn2;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonySpawn3', {
		get() {
			if (typeof this._colonySpawn3 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonySpawn3Id) object = Game.structures[this.memory.colonySpawn3Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_SPAWN3(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_SPAWN);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonySpawn3Id = object.id;
				}
				else {
					delete this.memory.colonySpawn3Id;
				}

				this._colonySpawn3 = object || null;
            }
			return this._colonySpawn3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'spawnsSpawning', {
		get() {
			if (typeof this._spawnsSpawning === "undefined") {
				this._spawnsSpawning = this.spawns.filter(f => f.spawning);
			}
			return this._spawnsSpawning;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'spawnsNotSpawning', {
		get() {
			if (typeof this._spawnsNotSpawning === "undefined") {
				this._spawnsNotSpawning = this.spawns.filter(f => !f.spawning);
			}
			return this._spawnsNotSpawning;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * If we only have 1 free spawn (unless we only have 1), or if a creep is renewing, then spawns are busy.
	 */
	Object.defineProperty(Room.prototype, 'colonyAllSpawnsSpawningOrRenewing', {
		get() {
            if (typeof this._colonyAllSpawnsSpawningOrRenewing === "undefined") {
				this._colonyAllSpawnsSpawningOrRenewing = false;
				let spawns = this.spawns;
				let spawnsSpawning = this.spawnsSpawning;

				if (spawns.length === spawnsSpawning.length) {
					// All spawns are busy spawning.
					this._colonyAllSpawnsSpawningOrRenewing = true;
				}
				else if (spawns.length === spawnsSpawning.length + 1) {
					// There is one spawn free, so it depends on if someone is currently renewing.
					this._colonyAllSpawnsSpawningOrRenewing = !!((this.storage && this.isCreepOnColonyRenewPos) || this.myCreepsRenewing.find(f => f.pos.inRange5(this.colonyFlag)));
				}
            }
			return this._colonyAllSpawnsSpawningOrRenewing;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyExtensions', {
		get() {
			if (typeof this._colonyExtensions === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][this.controller.level]) {
					if (this.memory[STRUCTURE_EXTENSION]) object = Object.keys(this.memory[STRUCTURE_EXTENSION]).map(m => Game.structures[m]).filter(f => f);

					// Object wasn't in cache, so look for it.
					if (!object || (object.length < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][this.controller.level])) {
						object = this.myExtensions;
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_EXTENSION] = {};
					object.forEach(extension => {
						this.memory[STRUCTURE_EXTENSION][extension.id] = 1;
					})
				}
				else {
					delete this.memory[STRUCTURE_EXTENSION];
				}

				this._colonyExtensions = object || [];
            }
			return this._colonyExtensions;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyContainers', {
		get() {
			if (typeof this._colonyContainers === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][this.controller.level]) {
					if (this.memory[STRUCTURE_CONTAINER]) object = Object.keys(this.memory[STRUCTURE_CONTAINER]).map(m => Game.getObjectById(m)).filter(f => f);

					// Object wasn't in cache, so look for it.
					if (!object || (object.length < CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][this.controller.level])) {
						object = this.containers;
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_CONTAINER] = {};
					object.forEach(extension => {
						this.memory[STRUCTURE_CONTAINER][extension.id] = 1;
					})
				}
				else {
					delete this.memory[STRUCTURE_CONTAINER];
				}

				this._colonyContainers = object || [];
            }
			return this._colonyContainers;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTowers', {
		get() {
			if (typeof this._colonyTowers === "undefined") {
				this._colonyTowers = [];
				if (this.colonyTower1) this._colonyTowers.push(this.colonyTower1);
				if (!this.isTemple) {
					if (this.colonyTower2) this._colonyTowers.push(this.colonyTower2);
					if (this.colonyTower3) this._colonyTowers.push(this.colonyTower3);
					if (this.colonyTower4) this._colonyTowers.push(this.colonyTower4);
					if (this.colonyTower5) this._colonyTowers.push(this.colonyTower5);
					if (this.colonyTower6) this._colonyTowers.push(this.colonyTower6);
				}
            }
			return this._colonyTowers;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myColonyTower1', {
		get() {
			if (typeof this._myColonyTower1 === "undefined") {
				this._myColonyTower1 = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][this.controller.level] ? this.colonyTower1 : null;
            }
			return this._myColonyTower1;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower1', {
		get() {
			if (typeof this._colonyTower1 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower1Id && this.my) object = Game.structures[this.memory.colonyTower1Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my) {
					if (this.isTemple && this.templeTowerPos) {
						let xy = this.templeTowerPos;
						object = xy.lookForStructure(STRUCTURE_TOWER);
					}
					else if (this.colonyFlag) {
						let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER1(this.colonyFlag));
						object = xy.lookForStructure(STRUCTURE_TOWER);
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower1Id = object.id;
				}
				else {
					delete this.memory.colonyTower1Id;
				}

				this._colonyTower1 = object || null;
            }
			return this._colonyTower1;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower2', {
		get() {
			if (typeof this._colonyTower2 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower2Id && this.my) object = Game.structures[this.memory.colonyTower2Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER2(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_TOWER);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower2Id = object.id;
				}
				else {
					delete this.memory.colonyTower2Id;
				}

				this._colonyTower2 = object || null;
            }
			return this._colonyTower2;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower3', {
		get() {
			if (typeof this._colonyTower3 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower3Id && this.my) object = Game.structures[this.memory.colonyTower3Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER3(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_TOWER);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower3Id = object.id;
				}
				else {
					delete this.memory.colonyTower3Id;
				}

				this._colonyTower3 = object || null;
            }
			return this._colonyTower3;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower4', {
		get() {
			if (typeof this._colonyTower4 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower4Id && this.my) object = Game.structures[this.memory.colonyTower4Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER4(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_TOWER);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower4Id = object.id;
				}
				else {
					delete this.memory.colonyTower4Id;
				}

				this._colonyTower4 = object || null;
            }
			return this._colonyTower4;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower5', {
		get() {
			if (typeof this._colonyTower5 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower5Id && this.my) object = Game.structures[this.memory.colonyTower5Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER5(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_TOWER);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower5Id = object.id;
				}
				else {
					delete this.memory.colonyTower5Id;
				}

				this._colonyTower5 = object || null;
            }
			return this._colonyTower5;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyTower6', {
		get() {
			if (typeof this._colonyTower6 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyTower6Id && this.my) object = Game.structures[this.memory.colonyTower6Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag && !this.isTemple) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_TOWER6(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_TOWER);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyTower6Id = object.id;
				}
				else {
					delete this.memory.colonyTower6Id;
				}

				this._colonyTower6 = object || null;
            }
			return this._colonyTower6;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myColonyLinks', {
		get() {
			if (typeof this._myColonyLinks === "undefined") {
				this._myColonyLinks = [];
				if (this.myColonyLink) this._myColonyLinks.push(this.myColonyLink);
				if (this.myControllerLink) this._myColonyLinks.push(this.myControllerLink);
				this.sources.forEach(source => {
					if (source.sourceLink) this._myColonyLinks.push(source.sourceLink);
				})
            }
			return this._myColonyLinks;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'myColonyLink', {
		get() {
			if (typeof this._myColonyLink === "undefined") {
				this._myColonyLink = null;

				if (CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level]) {
					this._myColonyLink = this.colonyLink;
				}
			}
			return this._myColonyLink;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyLink', {
		get() {
			if (typeof this._colonyLink === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				// Note: Excluding check for controller level so that this link can be ignored if colony build needs to delete it.
				if (this.my) {
					if (this.memory.colonyLinkId) object = Game.structures[this.memory.colonyLinkId];

					// Object wasn't in cache, so look for it.
					if (!object && this.colonyFlag) {
						let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_COLONY_LINK(this.colonyFlag));
						object = xy.lookForStructure(STRUCTURE_LINK);
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLinkId = object.id;
				}
				else {
					delete this.memory.colonyLinkId;
				}

				this._colonyLink = object || null;
			}
			return this._colonyLink;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyLab1', {
		get() {
			if (typeof this._colonyLab1 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab1Id && this.my) object = Game.structures[this.memory.colonyLab1Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB1(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab1Id = object.id;
				}
				else {
					delete this.memory.colonyLab1Id;
				}

				this._colonyLab1 = object || null;
            }
			return this._colonyLab1;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab2', {
		get() {
			if (typeof this._colonyLab2 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab2Id && this.my) object = Game.structures[this.memory.colonyLab2Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB2(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab2Id = object.id;
				}
				else {
					delete this.memory.colonyLab1Id;
				}

				this._colonyLab2 = object || null;
            }
			return this._colonyLab2;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab3', {
		get() {
			if (typeof this._colonyLab3 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab3Id && this.my) object = Game.structures[this.memory.colonyLab3Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB3(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab3Id = object.id;
				}
				else {
					delete this.memory.colonyLab3Id;
				}

				this._colonyLab3 = object || null;
            }
			return this._colonyLab3;
		},
		configurable: true, enumerable: true,
    })

	Object.defineProperty(Room.prototype, 'colonyLab4', {
		get() {
			if (typeof this._colonyLab4 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab4Id && this.my) object = Game.structures[this.memory.colonyLab4Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB4(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab4Id = object.id;
				}
				else {
					delete this.memory.colonyLab4Id;
				}

				this._colonyLab4 = object || null;
            }
			return this._colonyLab4;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab5', {
		get() {
			if (typeof this._colonyLab5 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab5Id && this.my) object = Game.structures[this.memory.colonyLab5Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB5(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab5Id = object.id;
				}
				else {
					delete this.memory.colonyLab5Id;
				}

				this._colonyLab5 = object || null;
            }
			return this._colonyLab5;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab6', {
		get() {
			if (typeof this._colonyLab6 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab6Id && this.my) object = Game.structures[this.memory.colonyLab6Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB6(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab6Id = object.id;
				}
				else {
					delete this.memory.colonyLab6Id;
				}

				this._colonyLab6 = object || null;
            }
			return this._colonyLab6;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab7', {
		get() {
			if (typeof this._colonyLab7 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab7Id && this.my) object = Game.structures[this.memory.colonyLab7Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB7(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab7Id = object.id;
				}
				else {
					delete this.memory.colonyLab7Id;
				}

				this._colonyLab7 = object || null;
            }
			return this._colonyLab7;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab8', {
		get() {
			if (typeof this._colonyLab8 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab8Id && this.my) object = Game.structures[this.memory.colonyLab8Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB8(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab8Id = object.id;
				}
				else {
					delete this.memory.colonyLab8Id;
				}

				this._colonyLab8 = object || null;
            }
			return this._colonyLab8;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab9', {
		get() {
			if (typeof this._colonyLab9 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab9Id && this.my) object = Game.structures[this.memory.colonyLab9Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB9(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab9Id = object.id;
				}
				else {
					delete this.memory.colonyLab9Id;
				}

				this._colonyLab9 = object || null;
            }
			return this._colonyLab9;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLab10', {
		get() {
			if (typeof this._colonyLab10 === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;
				if (this.memory.colonyLab10Id && this.my) object = Game.structures[this.memory.colonyLab10Id];

				// Object wasn't in cache, so look for it.
				if (!object && this.my && this.colonyFlag) {
					let xy = ColonyManager.getPos(ColonyManager.COLONY_STAMP_LAB10(this.colonyFlag));
					object = xy.lookForStructure(STRUCTURE_LAB);
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.colonyLab10Id = object.id;
				}
				else {
					delete this.memory.colonyLab10Id;
				}

				this._colonyLab10 = object || null;
            }
			return this._colonyLab10;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyLabs', {
		get() {
			if (typeof this._colonyLabs === "undefined") {
				this._colonyLabs = [];

				if (!this.isTemple && this.colonyFlag) {
					// Add these in priority order.
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 1) && this.colonyLab1) this._colonyLabs.push(this.colonyLab1);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 2) && this.colonyLab2) this._colonyLabs.push(this.colonyLab2);

					// Stored in reverse order since that is more useful for consuming function.
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 10) && this.colonyLab10) this._colonyLabs.push(this.colonyLab10);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 9) && this.colonyLab9) this._colonyLabs.push(this.colonyLab9);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 8) && this.colonyLab8) this._colonyLabs.push(this.colonyLab8);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 7) && this.colonyLab7) this._colonyLabs.push(this.colonyLab7);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 6) && this.colonyLab6) this._colonyLabs.push(this.colonyLab6);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 5) && this.colonyLab5) this._colonyLabs.push(this.colonyLab5);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 4) && this.colonyLab4) this._colonyLabs.push(this.colonyLab4);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 3) && this.colonyLab3) this._colonyLabs.push(this.colonyLab3);
				}
			}
			return this._colonyLabs;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * This is the order rooks will load/unload.
	 */
	Object.defineProperty(Room.prototype, 'colonyLabsRook', {
		get() {
			if (typeof this._colonyLabsRook === "undefined") {
				this._colonyLabsRook = [];

				if (!this.isTemple && this.colonyFlag) {
					// Add these in priority order.
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 1) && this.colonyLab1) this._colonyLabsRook.push(this.colonyLab1);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 2) && this.colonyLab2) this._colonyLabsRook.push(this.colonyLab2);

					// Order here is according to stamp, in order to circle the perimeter without looping back.
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 3) && this.colonyLab3) this._colonyLabsRook.push(this.colonyLab3);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 4) && this.colonyLab4) this._colonyLabsRook.push(this.colonyLab4);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 5) && this.colonyLab5) this._colonyLabsRook.push(this.colonyLab5);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 6) && this.colonyLab6) this._colonyLabsRook.push(this.colonyLab6);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 10) && this.colonyLab10) this._colonyLabsRook.push(this.colonyLab10);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 7) && this.colonyLab7) this._colonyLabsRook.push(this.colonyLab7);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 9) && this.colonyLab9) this._colonyLabsRook.push(this.colonyLab9);
					if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][this.controller.level] >= 8) && this.colonyLab8) this._colonyLabsRook.push(this.colonyLab8);
				}
			}
			return this._colonyLabsRook;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyLabsDry', {
		get() {
			if (typeof this._colonyLabsDry === "undefined") {
				this._colonyLabsDry = !this.colonyLabs.find(f => f.mineralType);
			}
			return this._colonyLabsDry;
		},
		configurable: true, enumerable: true,
	});

    Object.defineProperty(Room.prototype, 'colonyOutputLabs', {
        get() {
			if (typeof this._colonyOutputLabs === "undefined") {
				this._colonyOutputLabs = [];
				if (this.colonyLab1 && this.colonyLab2) {
					let inputLabs = {
						[this.colonyLab1.id]: 1
						, [this.colonyLab2.id]: 1
					}
					this._colonyOutputLabs = this.colonyLabs.filter(f => typeof inputLabs[f.id] === "undefined");
				}
			}
            return this._colonyOutputLabs;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyMineralExtractor', {
		get() {
			if (typeof this._colonyMineralExtractor === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][this.controller.level]) {
					if (this.memory[STRUCTURE_EXTRACTOR]) object = Game.structures[this.memory[STRUCTURE_EXTRACTOR]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.mineral ? this.mineral.pos.lookForExtractor() : null;
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_EXTRACTOR] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_EXTRACTOR];
				}

				this._colonyMineralExtractor = object || null;
            }
			return this._colonyMineralExtractor;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyThoriumExtractor', {
		get() {
			if (typeof this._colonyThoriumExtractor === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][this.controller.level]) {
					if (this.memory.extractorThorium) object = Game.structures[this.memory.extractorThorium];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.thorium ? this.thorium.pos.lookForExtractor() : null;
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory.extractorThorium = object.id;
				}
				else {
					delete this.memory.extractorThorium;
				}

				this._colonyThoriumExtractor = object || null;
            }
			return this._colonyThoriumExtractor;
		},
		configurable: true, enumerable: true,
    });


	Object.defineProperty(Room.prototype, 'colonyFactory', {
		get() {
			if (typeof this._colonyFactory === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_FACTORY][this.controller.level]) {
					if (this.memory[STRUCTURE_FACTORY]) object = Game.structures[this.memory[STRUCTURE_FACTORY]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.getMyStructureGroups([STRUCTURE_FACTORY]).find(f => f.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_FACTORY(this.colonyFlag))));
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_FACTORY] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_FACTORY];
				}

				this._colonyFactory = object || null;
            }
			return this._colonyFactory;
		},
		configurable: true, enumerable: true,
    });


	Object.defineProperty(Room.prototype, 'colonyNuker', {
		get() {
			if (typeof this._colonyNuker === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_NUKER][this.controller.level]) {
					if (this.memory[STRUCTURE_NUKER]) object = Game.structures[this.memory[STRUCTURE_NUKER]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.getMyStructureGroups([STRUCTURE_NUKER]).find(f => f.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_NUKER(this.colonyFlag))));
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_NUKER] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_NUKER];
				}

				this._colonyNuker = object || null;
            }
			return this._colonyNuker;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyPowerSpawn', {
		get() {
			if (typeof this._colonyPowerSpawn === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_POWER_SPAWN][this.controller.level]) {
					if (this.memory[STRUCTURE_POWER_SPAWN]) object = Game.structures[this.memory[STRUCTURE_POWER_SPAWN]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.getMyStructureGroups([STRUCTURE_POWER_SPAWN]).find(f => f.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_POWER_SPAWN(this.colonyFlag))));
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_POWER_SPAWN] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_POWER_SPAWN];
				}

				this._colonyPowerSpawn = object || null;
            }
			return this._colonyPowerSpawn;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyObserver', {
		get() {
			if (typeof this._colonyObserver === "undefined") {
				// Read from the cache to help performance. This object shouldn't change often/ever.
				let object = null;

				if (this.controller && CONTROLLER_STRUCTURES[STRUCTURE_OBSERVER][this.controller.level]) {
					if (this.memory[STRUCTURE_OBSERVER]) object = Game.structures[this.memory[STRUCTURE_OBSERVER]];

					// Object wasn't in cache, so look for it.
					if (!object) {
						object = this.getMyStructureGroups([STRUCTURE_OBSERVER]).find(f => f.pos.isEqualTo(ColonyManager.getPos(ColonyManager.COLONY_STAMP_OBSERVER(this.colonyFlag))));
					}
				}

				// Cache the object Id for next time.
				if (object) {
					this.memory[STRUCTURE_OBSERVER] = object.id;
				}
				else {
					delete this.memory[STRUCTURE_OBSERVER];
				}

				this._colonyObserver = object || null;
            }
			return this._colonyObserver;
		},
		configurable: true, enumerable: true,
    });

    /**
	 * Roads that are automatically created by our colony builder and should be repaired.
	 */
	Object.defineProperty(Room.prototype, 'colonyRoadsPackedPosHash', {
		get() {
			// If we have nothing in memory, use the existing roads in the room for now.
			// This will get fixed when the colony is built.
			if (typeof this.memory[STRUCTURE_ROAD] === "undefined") this.setColonyRoadsFromPosList(this.roads.map(m => m.pos));
			return this.memory[STRUCTURE_ROAD] || {};
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Save the list of positions as valid roads for this colony. These will be repaired; all others will decay.
	 */
	Room.prototype.setColonyRoadsFromPosList = function(positions) {
		let hash = Object.assign({}, ...positions.filter(f => f.roomName === this.name).map(a => ({ [packCoord(a)]: a.hasRoad ? a.hasRoad.id : 1 })));
		this.memory[STRUCTURE_ROAD] = hash;
	}

	Object.defineProperty(Room.prototype, 'colonyRoads', {
		get() {
			if (typeof this._colonyRoads === "undefined") {
				if (typeof this.memory[STRUCTURE_ROAD] === "undefined") this.memory[STRUCTURE_ROAD] = {};
				// Objects are stored as hash by coord. They may not exist, in which case they would be invalid ids. Be sure to filter the invalids out.
				this._colonyRoads = Object.keys(this.memory[STRUCTURE_ROAD]).map(m => Game.getObjectById(this.memory[STRUCTURE_ROAD][m])).filter(f => f);
            }
			return this._colonyRoads;
		},
		configurable: true, enumerable: true,
    });

	/**
	 * Prevent overrepair by only returning structures with less hits than the maximum tower repair power.
	 * Also only includes roads that were created by the colony build process. Other roads will be ignored and decay.
	 */
	Object.defineProperty(Room.prototype, 'colonyRoadsNeedingRepair', {
		get() {
			if (typeof this._colonyRoadsNeedingRepair === "undefined") {
				this._colonyRoadsNeedingRepair = this.colonyRoads.filter(f => (f.hits <= (f.hitsMax - TOWER_POWER_REPAIR)));
			}
			return this._colonyRoadsNeedingRepair;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyRoadsNeedingRepairSorted', {
		get() {
			if (typeof this._colonyRoadsNeedingRepairSorted === "undefined") {
				this._colonyRoadsNeedingRepairSorted = _.sortBy(this.colonyRoadsNeedingRepair, s => s.hits / s.hitsMax);
			}
			return this._colonyRoadsNeedingRepairSorted;
		},
		configurable: true, enumerable: true,
	});

    /**
	 * Roads that are automatically created by our colony builder and should be repaired.
	 */
	Object.defineProperty(Room.prototype, 'colonyRampartsPackedPosHash', {
		get() {
			// If we have nothing in memory, use the existing roads in the room for now.
			// This will get fixed when the colony is built.
			if (typeof this.memory[STRUCTURE_RAMPART] === "undefined") this.setColonyRampartsFromPosList(this.perimeterRampartsSorted.map(m => m.pos));
			return this.memory[STRUCTURE_RAMPART] || {};
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Save the list of positions as valid roads for this colony. These will be repaired; all others will decay.
	 */
	Room.prototype.setColonyRampartsFromPosList = function(positions) {
		let hash = Object.assign({}, ...positions.map(a => ({ [packCoord(a)]: a.hasRampart ? a.hasRampart.id : 1 })));
		this.memory[STRUCTURE_RAMPART] = hash;
	}

	Object.defineProperty(Room.prototype, 'colonyRamparts', {
		get() {
			if (typeof this._colonyRamparts === "undefined") {
				if (typeof this.memory[STRUCTURE_RAMPART] === "undefined") this.memory[STRUCTURE_RAMPART] = {};
				// Objects are stored as hash by coord. They may not exist, in which case they would be invalid ids. Be sure to filter the invalids out.
				this._colonyRamparts = Object.keys(this.memory[STRUCTURE_RAMPART]).map(m => Game.structures[this.memory[STRUCTURE_RAMPART][m]]).filter(f => f);
            }
			return this._colonyRamparts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'colonyRampartsNeedingRepair', {
		get() {
			if (typeof this._colonyRampartsNeedingRepair === "undefined") {
				let hitsRepair = this.barrierHits + RAMPART_DECAY_AMOUNT;
				this._colonyRampartsNeedingRepair = this.colonyRamparts.filter(f => f.hits <= hitsRepair);
			}
			return this._colonyRampartsNeedingRepair;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'colonyRampartsNeedingRepairSorted', {
		get() {
			if (typeof this._colonyRampartsNeedingRepairSorted === "undefined") {
				this._colonyRampartsNeedingRepairSorted = _.sortBy(this.colonyRampartsNeedingRepair, s => s.hits / s.hitsMax);
			}
			return this._colonyRampartsNeedingRepairSorted;
		},
		configurable: true, enumerable: true,
	});

	/**
	 * Prevent overrepair by only returning structures with less hits than the maximum tower repair power.
	 * Also only includes roads that were created by the colony build process. Other roads will be ignored and decay.
	 */
	Object.defineProperty(Room.prototype, 'infrastructureRepair', {
		get() {
			if (typeof this._infrastructureRepair === "undefined") {
				let roadsHash = this.colonyRoadsPackedPosHash;
				this._infrastructureRepair = this.infrastructure.filter(f => ((f.structureType !== STRUCTURE_ROAD) || roadsHash[packCoord(f.pos)]) && (f.hits <= (f.hitsMax - TOWER_POWER_REPAIR)));
			}
			return this._infrastructureRepair;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'infrastructureRepairSorted', {
		get() {
			if (typeof this._infrastructureRepairSorted === "undefined") {
				this._infrastructureRepair = _.sortBy(this.infrastructureRepair, s => s.hits / s.hitsMax);
			}
			return this._infrastructureRepair;
		},
		configurable: true, enumerable: true,
	});

}
