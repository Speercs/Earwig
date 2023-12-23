"use strict";

module.exports = function() {

    Creep.prototype.initialize = function() {
        // For combat creeps, record the current room entry position we first moved into.
        if (Config.roleGroups.COMBAT[this.role]) this.setExitToClosestSafeControllerRoom();

        // Initialize.
        this.sayRole();
    }

    Creep.prototype.setExitToClosestSafeControllerRoom = function() {
        // For combat creeps, record the current room entry position we first moved into.
        if (this.lastRoom !== this.room.name) {
            this.previousRoom = this.lastRoom || this.room.name;
            const exitDir = this.room.findExitTo(this.room.myClosestSafeControllerRoom.name);
            this.exitToClosestSafeControllerRoom = this.pos.findClosestByRange(exitDir);
        }

        // Save the current room we are in.
        this.lastRoom = this.room.name;
    }

	Object.defineProperty(Creep.prototype, 'exitToClosestSafeControllerRoom', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_EXIT_TO_CLOSEST_SAFE_CONTROLLER_ROOM] ? unpackPos(this.memory[C.MEMORY_KEY_CREEP_EXIT_TO_CLOSEST_SAFE_CONTROLLER_ROOM]) : null;
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_EXIT_TO_CLOSEST_SAFE_CONTROLLER_ROOM] = packPos(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_EXIT_TO_CLOSEST_SAFE_CONTROLLER_ROOM];
            }
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'creepSpawnEnergyCapacityAvailable', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_SPAWN_ENERGY_CAPACITY_AVAILABLE];
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_SPAWN_ENERGY_CAPACITY_AVAILABLE] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_SPAWN_ENERGY_CAPACITY_AVAILABLE];
            }
        },
		configurable: true, enumerable: true,
    });

    Creep.prototype.sayRole = function() {
        // Shorthand.
        let creep = this;

        switch (creep.role) {

            case Config.roles.PEON:
                creep.talk('👨‍💼');
                break;

            case Config.roles.ENGINEER:
                creep.talk('☢️');
                break;

            case Config.roles.SCOUT:
                creep.talk('🛸');
                break;

            case Config.roles.FENCER:
                creep.talk('🤺');
                break;

            case Config.roles.PEASANT:
                creep.talk('👨‍🌾');
                break;
            case Config.roles.FARMER:
                creep.talk('👩‍🌾');
                break;

            case Config.roles.PREACHER:
                creep.talk('🏳️‍🌈');
                break;

            case Config.roles.LANCER1:
            case Config.roles.LANCER2:
            case Config.roles.LANCER3:
            case Config.roles.LANCER4:
            case Config.roles.LANCER5:
                creep.talk('🦄');
                break;

            case Config.roles.SWORDSMAN:
                creep.talk('🦊');
                break;
            case Config.roles.PRIEST:
                creep.talk('🕊️');
                break;
            case Config.roles.SAPPER:
                creep.talk('🦏');
                break;

            case Config.roles.CARPENTER:
                creep.talk('👷');
                break;
            case Config.roles.MASON:
                creep.talk('👨‍🔧');
                break;

            case Config.roles.MINER:
                creep.talk('👨‍🏭');
                break;
            case Config.roles.DREDGER:
                creep.talk('👨‍🏭');
                break;

            case Config.roles.CRIER:
                creep.talk('👩‍🔬')
                break;
            case Config.roles.PROPHET:
                creep.talk('🧙‍♀️')
                break;
            case Config.roles.BELLMAN:
                creep.talk('👨‍🔬')
                break;
            case Config.roles.HERALD:
                creep.talk('🧙')
                break;
            case Config.roles.DIVINER:
                creep.talk('🧞‍♀️')
                break;
            case Config.roles.ORACLE:
                creep.talk('🧞')
                break;

            case Config.roles.LLAMA:
                creep.talk('🦙');
                break;
            case Config.roles.MULE:
                creep.talk('🦌');
                break;
            case Config.roles.DONKEY:
                creep.talk('🐐');
                break;
            case Config.roles.BURRO:
                creep.talk('🐐');
                break;
            case Config.roles.JACKASS:
                creep.talk('🐐');
                break;
            case Config.roles.HORSE:
                creep.talk('🐎');
                break;
            case Config.roles.OX:
                creep.talk('🐂');
                break;
            case Config.roles.SCAVENGER:
                creep.talk('🐀');
                break;
            case Config.roles.ROGUE:
                creep.talk('🐱‍👤') //('🥷');
                break;

            case Config.roles.PROSPECTOR:
                creep.talk('🧱');
                break;

            case Config.roles.STRIKER:
            case Config.roles.BLACKSMITH:
                creep.talk('🦺');
                break;
            case Config.roles.CARDINAL:
            case Config.roles.BISHOP:
                creep.talk('👩‍⚕️');
                break;

            case Config.roles.PALADIN:
                creep.talk('🧻');
                break;
            case Config.roles.EXECUTIONER:
                creep.talk('🪓');
                break;

            case Config.roles.CROSSBOWMAN:
                creep.talk('🦅');
                break;
            case Config.roles.ARCHER:
                creep.talk('🦟');
                break;
            case Config.roles.RANGER:
                creep.talk('🦩');
                break;
            case Config.roles.KNIGHT:
                creep.talk('🗡️');
                break;
            case Config.roles.WATCHMAN:
                creep.talk('🦉');
                break;
            case Config.roles.DEACON:
                creep.talk('🐝');
                break;
            case Config.roles.CLERIC:
                creep.talk('🧘');
                break;

            case Config.roles.PIKEMAN:
                creep.talk('🥋');
                break;
            case Config.roles.HOUND:
                creep.talk('🐶');
                break;

            case Config.roles.KING:
                creep.talk('🤴')
                break;
            case Config.roles.QUEEN:
                creep.talk('👸')
                break;
            case Config.roles.JESTER:
                creep.talk('🃏')
                break;
            case Config.roles.ROOK:
                creep.talk('♖')
                break;

        }
    }

    Creep.prototype.clearMemoryTargets = function() {
        // Clear any memory Id's that are volitile.
        if (typeof this.memory.harvestId !== "undefined") delete this.memory.harvestId;
        if (typeof this.memory.stickyTargetId !== "undefined") delete this.memory.stickyTargetId;
    }

    Creep.prototype.finalize = function() {
        // Append the target id if it is specified.
        if (this._text && this._text != '') { this.say(this._text); }
    }

    // Nice version of say.
    Creep.prototype.talk = function(text) {
        if (this._text) {
            if (!this._text.includes(text)) {
                this._text += text;
            }
        } else {
            this._text = text;
        }
    };

    /**
     * Returns the role of this creep.
     * Currently implemented as taking the first part of the creeps name.
     */
	Object.defineProperty(Creep.prototype, 'role', {
		get() {
            if (typeof this._role === "undefined") {
                this._role = this.memory[C.MEMORY_KEY_CREEP_ROLE];
                if (typeof this._role === "undefined") {
                    this.memory[C.MEMORY_KEY_CREEP_ROLE] = this.name.split('_', 1)[0];
                    this._role = this.memory[C.MEMORY_KEY_CREEP_ROLE];
                }
            }
            return this._role;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'roleAndFocusId', {
		get() {
            if (typeof this._roleAndFocusId === "undefined") {
                this._roleAndFocusId = this.role + '_' + this.focusId;
            }
            return this._roleAndFocusId;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'roleAndWorkRoom', {
		get() {
            if (typeof this._roleAndWorkRoom === "undefined") {
                this._roleAndWorkRoom = this.role + '_' + this.workRoom;
            }
            return this._roleAndWorkRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'roleAndSubject', {
		get() {
            if (typeof this._roleAndSubject === "undefined") {
                this._roleAndSubject = this.role + '_' + (this.focusId || this.workRoom);
            }
            return this._roleAndSubject;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'task', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_TASK];
		},
        set(value) {
            this.memory[C.MEMORY_KEY_CREEP_TASK] = value;
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isInvader', {
		get() {
            return this.owner.username === 'Invader';
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isNPC', {
		get() {
            const npc = {
                'Invader': 1
                , 'Source Keeper': 1
                , 'Screeps': 1
            }
            return !!npc[this.owner.username];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isSourceKeeper', {
		get() {
            return this.owner.username === 'Source Keeper';
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isPlayer', {
		get() {
            return (this.owner.username !== 'Source Keeper') && (this.owner.username !== 'Invader') && (this.owner.username !== 'Screeps');
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isPeon', {
		get() {
            return this.role === Config.roles.PEON;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isRook', {
		get() {
            return this.role === Config.roles.ROOK;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isPage', {
		get() {
            return this.role === Config.roles.PAGE;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isCardinal', {
		get() {
            return this.role === Config.roles.CARDINAL;
		},
		configurable: true, enumerable: true,
    });


	Object.defineProperty(Creep.prototype, 'focusId', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_FOCUS_ID];
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_FOCUS_ID] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_FOCUS_ID];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'focusTarget', {
		get() {
            return this.focusId ? Game.getObjectById(this.focusId) : null;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'moveToId', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_MOVETO_ID];
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_MOVETO_ID] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_MOVETO_ID];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'moveToPos', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_MOVETO_POS] ? unpackPos(this.memory[C.MEMORY_KEY_CREEP_MOVETO_POS]) : null;
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_MOVETO_POS] = packPos(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_MOVETO_POS];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'moveToTarget', {
		get() {
            return this.moveToId ? Game.getObjectById(this.moveToId) : null;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'healerId', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_HEALER_ID];
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_HEALER_ID] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_HEALER_ID];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'healer', {
		get() {
            return this.healerId ? Game.getObjectById(this.healerId) : null;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'reserveOnly', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_RESERVE_ONLY];
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_RESERVE_ONLY] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_RESERVE_ONLY];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'harvestId', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_HARVEST_ID];
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_HARVEST_ID] = value;
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_HARVEST_ID];
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'harvestTarget', {
		get() {
            return Game.getObjectById(this.harvestId);
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'canMakeWorkRoom', {
		get() {
            if (typeof this._canMakeWorkRoom === "undefined") {
                // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
                // Less accurate: Get the number of rooms in route to work room * 50;
                this._canMakeWorkRoom = (this.ticksToLive || CREEP_LIFE_TIME) > (this.estimatedTravelTicks(this.room.name, this.workRoom));
            }
			return this._canMakeWorkRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'canMakeWorkRoomRoundTrip', {
		get() {
            if (typeof this._canMakeWorkRoomRoundTrip === "undefined") {
                // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
                // Less accurate: Get the number of rooms in route to work room * 50;
                this._canMakeWorkRoomRoundTrip = (this.ticksToLive || CREEP_LIFE_TIME) > (this.estimatedTravelTicks(this.room.name, this.workRoom) * 2);
            }
			return this._canMakeWorkRoomRoundTrip;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'canMakeAssignedRoomRoundTrip', {
		get() {
            if (typeof this._canMakeAssignedRoomRoundTrip === "undefined") {
                // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
                // Less accurate: Get the number of rooms in route to work room * 50;
                this._canMakeAssignedRoomRoundTrip = (this.ticksToLive || CREEP_LIFE_TIME) > (this.estimatedTravelTicks(this.room.name, this.assignedRoom) * 2);
            }
			return this._canMakeAssignedRoomRoundTrip;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'needsReplacementNoTravel', {
		get() {
            if (typeof this._needsReplacementNoTravel === "undefined") {
                this._needsReplacementNoTravel = (
                    // How long did it take to spawn us.
                    this.spawnTicks

                    // Add in the avg position of spawns we have, since we don't spawn on every tick and iterate thru each one.
                    + Math.ceil(GameManager.empireRooms.length / 2)
                ) > (this.ticksToLive || CREEP_LIFE_TIME);
            }
			return this._needsReplacementNoTravel;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'needsReplacement', {
		get() {
            if (typeof this._needsReplacement === "undefined") {
                // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
                // Less accurate: Get the number of rooms in route to work room * 50;
                this._needsReplacement = (
                    // Our estimated travel time from current room to spawn room.
                    this.estimatedTravelTicks(this.room.name, this.spawnRoom)

                    // How long did it take to spawn us.
                    + this.spawnTicks

                    // Add in the avg position of spawns we have, since we don't spawn on every tick and iterate thru each one.
                    + Math.ceil(GameManager.empireRooms.length / 2)
                ) > (this.ticksToLive || CREEP_LIFE_TIME);
            }
			return this._needsReplacement;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'needsReplacementPessimistic', {
		get() {
            if (typeof this._needsReplacementPessimistic === "undefined") {
                // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
                // Less accurate: Get the number of rooms in route to work room * 50;
                this._needsReplacementPessimistic = (
                    // Our estimated travel time from current room to spawn room.
                    this.estimatedTravelTicks(this.room.name, this.spawnRoom)

                    // How long did it take to spawn us.
                    + this.spawnTicks

                    // Add in the avg position of spawns we have, since we don't spawn on every tick and iterate thru each one.
                    + Math.ceil(GameManager.empireRooms.length)
                ) > (this.ticksToLive || CREEP_LIFE_TIME);
            }
			return this._needsReplacementPessimistic;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.estimatedTravelTicks = function(origin, destination) {
        // Most accurate algorithm: Get the path length from spawn room colony flag to the center of the work room.
        // Less accurate: Get the number of rooms in route to work room * 50 plus small buffer;
        return (Cartographer.findRouteDistance(origin, destination) * 50) + 25;
    }

	Object.defineProperty(Creep.prototype, 'needsReplacementForUpgrader', {
		get() {
            if (typeof this._needsReplacementForUpgrader === "undefined") {
                this._needsReplacementForUpgrader = (
                    // Hard coding an amount of time to travel one room.
                    // Upgraders can be mixed sizes and replaced with one another from different room distances.
                    50

                    // Add in the avg position of spawns we have, since we don't spawn on every tick and iterate thru each one.
                    + Math.ceil(GameManager.empireRooms.length / 2)
                ) > (this.ticksToLive || CREEP_LIFE_TIME);
            }
			return this._needsReplacementForUpgrader;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.willLiveToRoom = function(roomName) {
        return this.estimatedTravelTicks(this.room.name, roomName) < (this.ticksToLive || CREEP_LIFE_TIME);
    }

	Object.defineProperty(Creep.prototype, 'willLiveToSpawnRoom', {
		get() {
            if (typeof this._willLiveToSpawnRoom === "undefined") {
                this._willLiveToSpawnRoom = this.willLiveToRoom(this.spawnRoom);
            }
            return this._willLiveToSpawnRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'willLiveToWorkRoom', {
		get() {
            if (typeof this._willLiveToWorkRoom === "undefined") {
                this._willLiveToWorkRoom = this.willLiveToRoom(this.workRoom);
            }
            return this._willLiveToWorkRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'willLiveToAssignedRoom', {
		get() {
            if (typeof this._willLiveToAssignedRoom === "undefined") {
                this._willLiveToAssignedRoom = this.willLiveToRoom(this.assignedRoom);
            }
            return this._willLiveToAssignedRoom;
		},
		configurable: true, enumerable: true,
    });

    /**
     * The needed amount of energy that this creep should withdraw in order to use it all for upgrades.
     * Assuming creep is currently and continuously upgrading without stopping.
     */
	Object.defineProperty(Creep.prototype, 'ticksToLiveUpgradeControllerEnergy', {
		get() {
            if (typeof this._ticksToLiveUpgradeControllerEnergy === "undefined") {
                this._ticksToLiveUpgradeControllerEnergy = Math.max(0, Math.min(this.store.getFreeCapacity(), (this.ticksToLive - 2) * this.workParts));
            }
            return this._ticksToLiveUpgradeControllerEnergy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isDefenderCreep', {
		get() {
            if (typeof this._isDefenderCreep === "undefined") {
                const roles = {
                    [Config.roles.ARCHER]: true
                    , [Config.roles.RANGER]: true
                    , [Config.roles.HOUND]: true
                }
                this._isDefenderCreep = !!roles[this.role];
            }
			return this._isDefenderCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isGuardianCreep', {
		get() {
            if (typeof this._isGuardianCreep === "undefined") {
                const roles = {
                    [Config.roles.WATCHMAN]: true
                    , [Config.roles.DEACON]: true

                    , [Config.roles.KNIGHT]: true
                    , [Config.roles.PRIEST]: true

                    , [Config.roles.CROSSBOWMAN]: true
                    , [Config.roles.PIKEMAN]: true
                }
                this._isGuardianCreep = !!roles[this.role];
            }
			return this._isGuardianCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isNoLongNapCreep', {
		get() {
            if (typeof this._isNoLongNapCreep === "undefined") {
                this._isNoLongNapCreep = this.isDefenderCreep || this.isGuardianCreep;
            }
			return this._isNoLongNapCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isUpgradeControllerCreep', {
		get() {
            if (typeof this._isUpgradeControllerCreep === "undefined") {
                const roles = {
                    [Config.roles.CRIER]: true
                    , [Config.roles.PROPHET]: true
                    , [Config.roles.BELLMAN]: true
                    , [Config.roles.HERALD]: true
                    , [Config.roles.DIVINER]: true
                    , [Config.roles.ORACLE]: true
                    , [Config.roles.GNOME]: true
                }
                this._isUpgradeControllerCreep = !!roles[this.role];
            }
			return this._isUpgradeControllerCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isGeneralUpgradeControllerCreep', {
		get() {
            if (typeof this._isGeneralUpgradeControllerCreep === "undefined") {
                const roles = {
                    [Config.roles.CRIER]: true
                    , [Config.roles.PROPHET]: true
                    , [Config.roles.BELLMAN]: true
                    , [Config.roles.HERALD]: true
                    , [Config.roles.DIVINER]: true
                    , [Config.roles.ORACLE]: true
                    , [Config.roles.GNOME]: true

                    // Include Peons in this classification.
                    , [Config.roles.PEON]: true
                }
                this._isGeneralUpgradeControllerCreep = !!roles[this.role];
            }
			return this._isGeneralUpgradeControllerCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isConstructorCreep', {
		get() {
            if (typeof this._isConstructorCreep === "undefined") {
                const roles = {
                    [Config.roles.PEON]: true
                    , [Config.roles.CARPENTER]: true
                    , [Config.roles.MASON]: true
                }
                this._isConstructorCreep = !!roles[this.role];
            }
			return this._isConstructorCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isUseEnergyCreep', {
		get() {
            if (typeof this._isUseEnergyCreep === "undefined") {
                const roles = {
                    [Config.roles.CRIER]: true
                    , [Config.roles.PROPHET]: true
                    , [Config.roles.BELLMAN]: true
                    , [Config.roles.HERALD]: true
                    , [Config.roles.DIVINER]: true
                    , [Config.roles.ORACLE]: true

                    , [Config.roles.CARPENTER]: true
                    , [Config.roles.MASON]: true

                    , [Config.roles.GNOME]: true
                }
                this._isUseEnergyCreep = !!roles[this.role];
            }
			return this._isUseEnergyCreep;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isFocusTransporter', {
		get() {
            if (typeof this._isFocusTransporter === "undefined") {
                const roles = {
                    [Config.roles.HORSE]: true
                    , [Config.roles.MULE]: true
                    , [Config.roles.LLAMA]: true
                }
                this._isFocusTransporter = !!roles[this.role];
            }
			return this._isFocusTransporter;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isAllowedToUseColonyParking', {
		get() {
            if (typeof this._isAllowedToUseColonyParking === "undefined") {
                this._isAllowedToUseColonyParking =
                    this.room.atMaxLevel
                    || this.room.isTemple
                    || this.room.myStorage
                    || this.isFocusTransporter
                    || this.room.colonyContainer
                    || !this.room.myTransporterCreeps.length
            }
			return this._isAllowedToUseColonyParking;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'canResetWorkRoom', {
		get() {
            if (typeof this._canResetWorkRoom === "undefined") {
                const roles = {
                    [Config.roles.ROGUE]: true
                    , [Config.roles.OX]: true
                }
                this._canResetWorkRoom = !!roles[this.role];
            }
			return this._canResetWorkRoom;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isSKWorker', {
		get() {
            if (typeof this._isSKWorker === "undefined") {
                const roles = {
                    [Config.roles.SCAVENGER]: true
                    , [Config.roles.ROGUE]: true
                }
                this._isSKWorker = !!roles[this.role];
            }
			return this._isSKWorker;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isSmallCoucilMember', {
		get() {
            if (typeof this._isSmallCoucilMember === "undefined") {
                const roles = {
                    [Config.roles.KING]: true
                    , [Config.roles.QUEEN]: true
                }
                this._isSmallCoucilMember = !!roles[this.role];
            }
			return this._isSmallCoucilMember;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isFarmer', {
		get() {
            if (typeof this._isFarmer === "undefined") {
                this._isFarmer = this.role === Config.roles.FARMER;
            }
			return this._isFarmer;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'currentRoom', {
        get() {
            return this.room.name;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Creep.prototype, 'lastRoom', {
        get() {
            return this.memory[C.MEMORY_KEY_CREEP_LAST_ROOM] ? unpackRoomName(this.memory[C.MEMORY_KEY_CREEP_LAST_ROOM]) : null;
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_LAST_ROOM] = packRoomName(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_LAST_ROOM];
            }
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Creep.prototype, 'previousRoom', {
        get() {
            return this.memory[C.MEMORY_KEY_CREEP_PREVIOUS_ROOM] ? unpackRoomName(this.memory[C.MEMORY_KEY_CREEP_PREVIOUS_ROOM]) : null;
        },
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_PREVIOUS_ROOM] = packRoomName(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_PREVIOUS_ROOM];
            }
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Creep.prototype, 'spawnRoom', {
        get() {
            return this.memory[C.MEMORY_KEY_CREEP_SPAWN_ROOM];
        },
        set(value) {
            this.memory[C.MEMORY_KEY_CREEP_SPAWN_ROOM] = value;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'workRoom', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_WORK_ROOM];
		},
        set(value) {
            this.memory[C.MEMORY_KEY_CREEP_WORK_ROOM] = value;
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'assignedRoom', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_ASSIGNED_ROOM];
		},
        set(value) {
            this.memory[C.MEMORY_KEY_CREEP_ASSIGNED_ROOM] = value;
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'inSpawnRoom', {
		get() {
            return this.room.name === this.memory[C.MEMORY_KEY_CREEP_SPAWN_ROOM];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'inWorkRoom', {
		get() {
            return this.room.name === this.memory[C.MEMORY_KEY_CREEP_WORK_ROOM];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'inAssignedRoom', {
		get() {
            return this.room.name === this.memory[C.MEMORY_KEY_CREEP_ASSIGNED_ROOM];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'inDefendRoom', {
		get() {
            return this.room.name === this.defendRoom;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'napTime', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_NAP_TIME] ? unpackTime(this.memory[C.MEMORY_KEY_CREEP_NAP_TIME]) : null;
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_NAP_TIME] = packTime(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_NAP_TIME];
            }
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'napPos', {
		get() {
            let napPos = this.memory[C.MEMORY_KEY_CREEP_NAP_POS] ? unpackPos(this.memory[C.MEMORY_KEY_CREEP_NAP_POS]) : null;
            if (napPos && (napPos.roomName === this.room.name)) return napPos;
            delete this.memory[C.MEMORY_KEY_CREEP_NAP_POS];
            return null;
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_NAP_POS] = packPos(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_NAP_POS];
            }
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isNapping', {
		get() {
            return ((this.napTime || 0) + (GameManager.isCpuMaxed ? Config.params.CREEP_NAP_TICKS : Config.params.CREEP_NAP_LONG)) >= Game.time;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'moveToRoomPos', {
		get() {
            return this.memory[C.MEMORY_KEY_CREEP_MOVE_TO_ROOM_POS] ? unpackPos(this.memory[C.MEMORY_KEY_CREEP_MOVE_TO_ROOM_POS]) : null;
		},
        set(value) {
            if (value) {
                this.memory[C.MEMORY_KEY_CREEP_MOVE_TO_ROOM_POS] = packPos(value);
            } else {
                delete this.memory[C.MEMORY_KEY_CREEP_MOVE_TO_ROOM_POS];
            }
        },
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isArmorGone', {
		get() {
            if (typeof this._isArmorGone === "undefined") {
                this._isArmorGone =
                    // Attempt to shortcircuit expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Did we expend all our tough body parts?
                    && (this.toughParts && !this.toughPartsActive);
            }
			return this._isArmorGone;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isRangedAttackDamaged', {
		get() {
            if (typeof this._isRangedAttackDamaged === "undefined") {
                this._isRangedAttackDamaged =
                    // Attempt to shortcircuit expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Do we have mismatched amount of body parts.
                    && (this.rangedAttackParts !== this.rangedAttackPartsActive);
            }
			return this._isRangedAttackDamaged;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isHealDamaged', {
		get() {
            if (typeof this._isHealDamaged === "undefined") {
                this._isHealDamaged =
                    // Attempt to shortcircuit expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Do we have mismatched amount of body parts.
                    && (this.healParts !== this.healPartsActive);
            }
			return this._isHealDamaged;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isAllAttackGone', {
		get() {
            if (typeof this._isAllAttackGone === "undefined") {
                this._isAllAttackGone =
                    // Attempt to shortcircuit expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Test each offensive body part type to see if they are all gone.
                    && (
                        (this.attackParts || this.rangedAttackParts || this.workParts)
                        && (!this.attackPartsActive && !this.rangedAttackPartsActive && !this.workPartsActive)
                    )

            }
			return this._isAllAttackGone;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isAnyAttackDamaged', {
		get() {
            if (typeof this._isAnyAttackDamaged === "undefined") {
                this._isAnyAttackDamaged =
                    // Attempt to shortcircuit expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Test each offensive body part type to see if any 1 part is gone.
                    && (
                        (this.attackParts !== this.attackPartsActive)
                        || (this.rangedAttackParts !== this.rangedAttackPartsActive)
                        || (this.workParts !== this.workPartsActive)
                    )

            }
			return this._isAnyAttackDamaged;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isHealGone', {
		get() {
            if (typeof this._isHealGone === "undefined") {
                this._isHealGone =
                    // Attempt to shortcuircut expensive calls to body parts by simply checking to see if we have taken damage.
                    this.isBodyPartDestroyed
                    // Test each offensive body part type.
                    && (this.healParts && !this.healPartsActive)
            }
			return this._isHealGone;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isLethal', {
		get() {
            if (typeof this._isLethal === "undefined") {
                this._isLethal = this.attackParts || this.rangedAttackParts;
            }
			return this._isLethal;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isOffensive', {
		get() {
            if (typeof this._isOffensive === "undefined") {
                this._isOffensive = this.attackParts || this.rangedAttackParts || this.workParts;
            }
			return this._isOffensive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isHealOnlyInvader', {
		get() {
            if (typeof this._isHealOnlyInvader === "undefined") {
                this._isHealOnlyInvader = this.isInvader && this.healParts && !this.isOffensive && this.healPartsActive;
            }
			return this._isHealOnlyInvader;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isNearExit', {
		get() {
            if (typeof this._isNearExit === "undefined") {
                this._isNearExit = null;
                if (this.pos.isRange1Edge) {
                    // If a creep is near an edge, then look for any non-wall positions on the edge that do not have a creep on them already.
                    // Fastest way to find a free spot without I believe.
                    this._isNearExit = this.exitsNearBy[0];
                }
            }
			return this._isNearExit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'exitsNearBy', {
		get() {
            if (typeof this._exitsNearBy === "undefined") {
                //this._exitsNearBy = this.room.exits.filter(f => this.pos.isNearTo(f));
                this._exitsNearBy = this.pos.isNearEdge ? _.sortBy(this.nips.filter(f => f.isEdge), s => this.pos.getDistanceTo(s)) : [];
            }
			return this._exitsNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isRange2Exit', {
		get() {
            if (typeof this._isRange2Exit === "undefined") {
                this._isRange2Exit = null;
                // if (this.pos.isEdge) {
                //     // If a creep is on the edge, then it is on an exit already.
                //     this._isRange2Exit = this.pos;
                // }
                // else
                if (this.pos.isRange2Edge) {
                    // If a creep is near an edge, then look for any non-wall positions on the edge that do not have a creep on them already.
                    // Fastest way to find a free spot without I believe.
                    //this._isRange2Exit = this.pos.posInRangeDNonTerrainWall(2).find(f => f.isEdge && !f.lookForCreep());
                    this._isRange2Exit = this.pos.posInRangeDNonTerrainWall(2).find(f => f.isEdge);
                }
            }
			return this._isRange2Exit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Room.prototype, 'decribeSafeExits', {
		get() {
            if (typeof this._safeExits === "undefined") {
                let exitData = Cartographer.describeExits(this.name);
                let unsafeDirs = Object.keys(exitData).filter(f =>
                    RoomIntel.getOwnedByOtherPlayer(exitData[f])
                    || RoomIntel.getStrongholdInvaderCoreHitsByRoomName(exitData[f])
                );
                this._safeExits = _.omit(exitData, unsafeDirs);
            }
			return this._safeExits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'range1ToExitsNearBy', {
		get() {
            if (typeof this._range1ToExitsNearBy === "undefined") {
                this._range1ToExitsNearBy = this.room.exitsRange1.filter(f => this.pos.isNearTo(f));
                //this._range1ToExitsNearBy = this.pos.isRange2Edge ? this.nips.filter(f => f.isEdge) : [];
            }
			return this._range1ToExitsNearBy;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isNearSafeExit', {
		get() {
            if (typeof this._isNearSafeExit === "undefined") {
                this._isNearSafeExit = null;
                let pos = this.isNearExit;
                if (pos) {
                    let exitData = this.room.decribeSafeExits;
                    let exitRoomName = null;
                    if (pos.x == 0) exitRoomName = exitData[LEFT];
                    if (pos.x == 49) exitRoomName = exitData[RIGHT];
                    if (pos.y == 0) exitRoomName = exitData[TOP];
                    if (pos.y == 49) exitRoomName = exitData[BOTTOM];

                    // Position is next to a non-hostile room.
                    if (exitRoomName) this._isNearSafeExit = pos;
                }
            }
			return this._isNearSafeExit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isRange2SafeExit', {
		get() {
            if (typeof this._isRange2SafeExit === "undefined") {
                this._isRange2SafeExit = null;
                let pos = this.isRange2Exit;
                if (pos) {
                    let exitData = this.room.decribeSafeExits;
                    let exitRoomName = null;
                    if (this.pos.x == 0) exitRoomName = exitData[LEFT];
                    if (this.pos.x == 49) exitRoomName = exitData[RIGHT];
                    if (this.pos.y == 0) exitRoomName = exitData[TOP];
                    if (this.pos.y == 49) exitRoomName = exitData[BOTTOM];

                    // Position is next to a non-hostile room.
                    if (exitRoomName) this._isRange2SafeExit = pos;

                }
            }
			return this._isRange2SafeExit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'inRange3SafeExit', {
		get() {
            if (typeof this._inRange3SafeExit === "undefined") {
                this._inRange3SafeExit = null;
                let pos = this.inRange3Exit;
                if (pos) {
                    let exitData = this.room.decribeSafeExits;
                    let exitRoomName = null;
                    if (this.pos.x == 0) exitRoomName = exitData[LEFT];
                    if (this.pos.x == 49) exitRoomName = exitData[RIGHT];
                    if (this.pos.y == 0) exitRoomName = exitData[TOP];
                    if (this.pos.y == 49) exitRoomName = exitData[BOTTOM];

                    // Position is next to a non-hostile room.
                    if (exitRoomName) this._inRange3SafeExit = pos;
                }
            }
			return this._isRange3SafeExit;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldCollectMinerals', {
		get() {
            if (typeof this._shouldCollectMinerals === "undefined") {
                let assignedRoomName = this.assignedRoom;
                let assignedRoom = Game.rooms[assignedRoomName];
                this._shouldCollectMinerals =
                    assignedRoom
                    && (
                        (assignedRoom.myStorage && !assignedRoom.myStorage.isMisplaced)
                        || (assignedRoom.myTerminal && !assignedRoom.myTerminal.isMisplaced)
                    )
                    && !assignedRoom.isTemple
            }
			return this._shouldCollectMinerals;
		},
		configurable: true, enumerable: true,
    });

    /**
     * Move to the given target/room.
     * Target can be a RoomPosition or a room name.
     */
    Creep.prototype.moveToRoom = function(target) {
        let result = null;
        let pos = null;
        let roomName = null;

        // When the target parameter is already a specific room position, then use it.
        if (target instanceof RoomPosition) {
            roomName = target.roomName;
            pos = target;
        }
        else {
            roomName = target;
        }

        // Read last position from cache.
        if (!pos) pos = this.moveToRoomPos;

        // Our destination has changed or otherwise needs to be determined.
        if (!pos || (pos.roomName != roomName)) {
            pos = GameManager.getRoomMoveToPos(roomName);
        }

        // Save our room position for next time.
        if (pos) this.moveToRoomPos = pos;

        // Pretty icon with destination!
        this.talk('✈️' + roomName);

        // Perform the move.
        result = this.smartMove(pos);

        // Return our results to the caller.
        return result;
    }

    // Returns true if moving to designated work room (and doesn't have hostiles), false otherwise.
    Creep.prototype.moveToWorkRoom = function(target, options) {
        // If we are in the work room, don't bother doing anything else.
        if (this.inWorkRoom) return ERR_INVALID_ARGS;

        // Do we have a moveToPos? If so, use it.
        if (!target && this.moveToPos) target = this.moveToPos;

        // Do we have a moveToTarget? If so, use it.
        if (!target && this.moveToTarget) target = this.moveToTarget;

        // Do we have a focusTarget? If so, use it.
        if (!target && this.focusTarget) target = this.focusTarget;

        let pos = target ? utils.normalizePos(target) : null;

        // If we have a target, use it!
        if (target && pos && (pos.roomName == this.workRoom)) {
            this.talk('🎯' + pos.roomName);
            return this.smartMove(target, options);
        }

        // Move to our workroom and to the specific focus target
        if (target && pos && (pos.roomName == this.workRoom)) {
            return this.moveToRoom(target);
        }

        // Translate our work room into the next room, in case there are waypoints.
        return this.moveToRoom(this.workRoom);
    };

    // Returns true if in correct room, false otherwise and will move to that room.
    Creep.prototype.moveToSpawnRoom = function(target) {
        // If we are in the spawn room, don't bother doing anything else.
        if (this.inSpawnRoom) return ERR_INVALID_ARGS;

        // If we have a target, use it!
        if (target) {
            this.talk('🎯' + target.pos.roomName);
            return this.smartMove(target);
        }

        // Translate our work room into the next room, in case there are waypoints.
        return this.moveToRoom(this.spawnRoom);
    };

    // Returns true if in correct room, false otherwise and will move to that room.
    Creep.prototype.moveToAssignedRoom = function(target, options) {
        // If we are in the spawn room, don't bother doing anything else.
        if (this.inAssignedRoom) return ERR_INVALID_ARGS;

        // If we have a target, use it!
        if (target) {
            this.talk('🎯' + target.pos.roomName);
            return this.smartMove(target, options);
        }

        // Translate our work room into the next room, in case there are waypoints.
        return this.moveToRoom(this.assignedRoom);
    };

    Room.prototype.noStickyTarget = function(target) {
        return !this.myCreeps.find(f => (f.memory.stickyTargetId === target.id));
    }

    Creep.prototype.noStickyTarget = function(target) {
        return !this.room.myCreeps.find(f => (f.memory.stickyTargetId === target.id));
    }

    Creep.prototype.stickyTargetCount = function(target) {
        return this.room.myCreeps.filter(f => f.memory.stickyTargetId === target.id).length;
    }

    Creep.prototype.otherCreepsHarvesting = function(target) {
        return this.room.myCreeps.filter(f => (f.memory.harvestId === target.id) && (f.id != this.id)).length
    }

    Creep.prototype.getReservedCapacity = function(targetId) {
        // For all the creeps harvesting, determine how many have their eyeballs on this spot.
        // Can't cache this as creep.memory.stickyTargetId could change while processing creeps.
        let creeps = this.room.myCreeps.filter(f => (f.memory.stickyTargetId === targetId) && (f.id != this.id));
        return _.sum(creeps, (s) => s.store.getFreeCapacity());
    }

    /**
     * Creep version of reserved energy.
     */
    Creep.prototype.getReservedEnergy = function(targetId) {
        // For all the creeps buiding or repairing, determine how many have their eyeballs on this spot.
        // Can't cache this as creep.memory.stickyTargetId could change while processing creeps.
        let creeps = this.room.myCreeps.filter(f => f.memory.stickyTargetId === targetId && f.id != this.id);
        return _.sum(creeps, (s) => s.store[RESOURCE_ENERGY]);
    }

    /**
     * Room version of reserved energy.
     */
    Room.prototype.getReservedEnergy = function(targetId) {
        // For all the creeps buiding or repairing, determine how many have their eyeballs on this spot.
        // Can't cache this as creep.memory.stickyTargetId could change while processing creeps.
        let creeps = this.myCreeps.filter(f => f.memory.stickyTargetId === targetId);
        return _.sum(creeps, (s) => s.store[RESOURCE_ENERGY]);
    }

    Creep.prototype.alert = function(text) {
        this.talk('⁉️');
        console.log('⁉️ ' + this.name + ' @ ' + this.room.print + ' (' + this.pos.x + ',' + this.pos.y + ') unexpected condition hit: ' + text);
    }

    Creep.prototype.commitHaraKiri = function() {
        this.talk('🔫');
        console.log('🔫 ' + this.name + ' @ ' + this.room.print + ' (' + this.pos.x + ',' + this.pos.y + ') has committed suicide with ' + (this.ticksToLive - 1) + ' ticks left!');
        this.suicide();
    }

    Object.defineProperty(Creep.prototype, 'shouldBunkerInAssignedRoom', {
        get() {
            if (typeof this._shouldBunkerInAssignedRoom === "undefined") {
                this._shouldBunkerInAssignedRoom = !!(
                    // I'm damaged, retreat until fully healed.
                    this.isDamaged

                    // There are lethals in the path between work and home, so just stay home.
                    || GameManager.doesRoomHaveLethalHostilesInRoute(this.workRoom, this.assignedRoom)
                );
            }
            return this._shouldBunkerInAssignedRoom;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'shouldDisengageFromCurrentRoom', {
        get() {
            if (typeof this._shouldDisengageFromCurrentRoom === "undefined") {
                this._shouldDisengageFromCurrentRoom = !!(
                    !this.inSpawnRoom
                    && !this.inAssignedRoom
                    && !this.room.my
                    && (
                        // Oh no, we are wounded, head back home for repairs.
                        this.isBodyPartDestroyed

                        // We are in our work room, and now there are lethal hostiles that want to kill us. Does not include sourcekeepers.
                        || (
                            this.inWorkRoom
                            && RoomIntel.getLethalHostilesTTL(this.room.name)
                            && (
                                (this.pos.inRange4Edge && this.room.lethalHostiles.find(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_DISENGAGE_RANGE))
                                || (!this.pos.inRange4Edge && this.room.lethalHostiles.find(f => (this.pos.getRangeTo(f) <= Config.params.HOSTILE_DISENGAGE_RANGE) && !f.pos.isNearEdge))
                            )
                        )

                        // We are not in our work but there are lethal hostiles in the path to our work room.
                        || (
                            !this.inWorkRoom
                            && GameManager.doesRoomHaveLethalHostilesInRoute(this.assignedRoom, this.workRoom)
                        )
                    )
                );
            }
            return this._shouldDisengageFromCurrentRoom;
        },
        configurable: true, enumerable: true,
    });

    // Returns true if the creep is disengaging; false if everything is okay.
    Creep.prototype.disengageToSpawnRoom = function(dropStore = false) {
        // Once damaged, fall back to spawn room and nap until healed.
        if (
            this.isBodyPartDestroyed
            || (this.inWorkRoom && this.room.lethalHostiles.length)
            || (!this.inWorkRoom && GameManager.doesRoomHaveLethalHostilesInRoute(this.spawnRoom, this.workRoom))
        ) {
            // If specified, drop anything we are carrying to move faster.
            if (dropStore && this.store.getUsedCapacity()) this.smartDrop();

            // Get back to spawn quickly.
            if (this.moveToSpawnRoom() !== OK) {
                // Return to the spawn room, and then take a nap!
                this.nap();
            }
            return true;
        }

        // Everything is normal, everything is fine. How are you?
        return false;
    }

    Object.defineProperty(Creep.prototype, 'spawnTicks', {
        get() {
            if (typeof this._spawnTicks === "undefined") {
                this._spawnTicks = this.body.length * CREEP_SPAWN_TIME;
            }
            return this._spawnTicks;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'bodyTypeArray', {
        get() {
            if (this.my) {
                if (typeof this.heap.bodyTypeArray === "undefined") {
                    this.heap.bodyTypeArray = this.body.map(m => m.type);
                }
                return this.heap.bodyTypeArray;
            }
            else {
                if (typeof this._bodyTypeArray === "undefined") {
                    this._bodyTypeArray = this.body.map(m => m.type);
                }
                return this._bodyTypeArray;
            }
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'bodyCost', {
        get() {
            if (typeof this._bodyCost === "undefined") {
                this._bodyCost = this.heap.bodyCost;
                if (typeof this._bodyCost === "undefined") {
                    this.heap.bodyCost = utils.getBodyCost(this.bodyTypeArray);
                    this._bodyCost = this.heap.bodyCost;
                }
            }
            return this._bodyCost;
        },
        configurable: true, enumerable: true,
    });

    // https://docs.screeps.com/api/#StructureSpawn.renewCreep
    Object.defineProperty(Creep.prototype, 'renewCost', {
        get() {
            if (typeof this._renewCost === "undefined") {
                this._renewCost = this.heap.renewCost;
                if (typeof this._renewCost === "undefined") {
                    // ceil(creep_cost/2.5/body_size)
                    this.heap.renewCost = Math.ceil(this.bodyCost/2.5/this.body.length);
                    this._renewCost = this.heap.renewCost;
                }
            }
            return this._renewCost;
        },
        configurable: true, enumerable: true,
    });

    Creep.prototype.moveCalc = function(terrainFactor) {
        // https://screeps.fandom.com/wiki/Creep#Movement
        // t = ceil(K * W / M)

        // Where:
        //     t = time (game ticks)
        //     K = terrain factor (0.5x for road, 1x for plain, 5x for swamp)
        //     W = creep weight (Number of body parts, excluding MOVE and empty CARRY parts)
        //     M = number of MOVE parts

        let W = this.bodyWeight;
        let K = terrainFactor;

        // Adjust for boosts.
        let M = this.getActiveBodypartsBoostEquivalent(MOVE, 'fatigue');

        // The calculation of move cost.
        return Math.ceil(K * W / M)
    }

    Object.defineProperty(Creep.prototype, 'moveCostRoad', {
        get() {
            if (typeof this._moveCostRoad === "undefined") {
                this._moveCostRoad = this.moveCalc(0.5);
                //this._moveCostRoad = this.moveCalc(1);
            }
            return this._moveCostRoad;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'moveCostPlain', {
        get() {
            if (typeof this._moveCostPlain === "undefined") {
                this._moveCostPlain = this.moveCalc(1);
                //this._moveCostPlain = this.moveCalc(2);
            }
            return this._moveCostPlain;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'moveCostSwamp', {
        get() {
            if (typeof this._moveCostSwamp === "undefined") {
                this._moveCostSwamp = this.moveCalc(5);
                //this._moveCostSwamp = this.moveCalc(10);
            }
            return this._moveCostSwamp;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'bodyWeight', {
		get() {
            if (typeof this._bodyWeight === "undefined") {
                // https://screeps.fandom.com/wiki/Creep#Movement
                //     W = creep weight (Number of body parts, excluding MOVE and empty CARRY parts)
                this._bodyWeight = this.parts - this.moveParts - this.emptyCarryParts;
            }
            return this._bodyWeight;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'parts', {
		get() {
            if (typeof this._parts === "undefined") {
                this._parts = this.body.length;
            }
            return this._parts;
		},
		configurable: true, enumerable: true,
    });

    /**
     * Returns object consisting of body type as key, with count of that type as value.
     */
	Object.defineProperty(Creep.prototype, 'bodyparts', {
		get() {
            if (typeof this._bodyparts === "undefined") {
                this._bodyparts = this.my ? this.heap.bodyparts : undefined;

                if (typeof this._bodyparts === "undefined") {
                    this._bodyparts = {}
                    //let bodyparts = _.groupBy(this.bodyTypeArray);
                    let bodyparts = utils.groupBy(this.bodyTypeArray);
                    Object.keys(bodyparts).forEach(part => {
                        this._bodyparts[part] = bodyparts[part].length;
                    });

                    // Cache our body part counts by type only if we own the creep. Hostile memory is not allowed.
                    if (this.my) {
                        this.heap.bodyparts = this._bodyparts;
                    }
                }
            }
            return this._bodyparts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'moveParts', {
		get() {
            if (typeof this._moveParts === "undefined") {
                this._moveParts = this.bodyparts[MOVE] || 0;
            }
            return this._moveParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'workParts', {
		get() {
            if (typeof this._workParts === "undefined") {
                this._workParts = this.bodyparts[WORK] || 0;
            }
            return this._workParts;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.getActiveBodypartsBoostEquivalent = function(type, action) {
        let total = 0;

        // If still spawning or otherwise not yet boosted, then lookup what the boost would be, if any.
        let roleCompound = this.my ? ((Config.params.CREEP_ROLE_BOOSTS[this.role] || []).find(f => f === action) ? C.BOOST_COMPOUNDS[action] : undefined) : undefined;

        for (let i = this.body.length; i-- > 0; ) {
            let x = this.body[i];
            if (x.hits <= 0) {
                break;
            }
            if (x.type === type) {
                // Use the actual boost if present.
                let compound = (x.boost !== undefined) ? x.boost : roleCompound;
                if (compound) {
                    total += BOOSTS[type][compound][action];
                } else {
                    total += 1;
                }
            }
        }
        return total;
    };

    Creep.prototype.getBodypartsBoostEquivalent = function(type, action, parts) {
        let total = 0;

        // My creeps can use the parts attribute to quickly get the number of parts without looping.
        if (this.my) {
            // If still spawning or otherwise not yet boosted, then lookup what the boost would be, if any.
            let compound = (Config.params.CREEP_ROLE_BOOSTS[this.role] || []).find(f => f === action) ? C.BOOST_COMPOUNDS[action] : undefined;

            // Use the actual boost if present.
            if (compound) {
                total = this[parts] * BOOSTS[type][compound][action];
            } else {
                total = this[parts];
            }
        }
        else {
            // Hostile creeps need to physically loop thru the entire body and check for these parts.
            for (let i = this.body.length; i-- > 0; ) {
                let x = this.body[i];
                if (x.type === type) {
                    // Use the actual boost if present.
                    let compound = (x.boost !== undefined) ? x.boost : null;
                    if (compound) {
                        total += BOOSTS[type][compound][action];
                    } else {
                        total += 1;
                    }
                }
            }
        }

        return total;
    };

    Object.defineProperty(Creep.prototype, 'attackPartsBoostEquivalent', {
        get() {
            if (typeof this._attackPartsBoostEquivalent === "undefined") {
                this._attackPartsBoostEquivalent = this.getBodypartsBoostEquivalent(ATTACK, 'attack', 'attackParts');
            }
            return this._attackPartsBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'attackPartsActiveBoostEquivalent', {
        get() {
            if (typeof this._attackPartsActiveBoostEquivalent === "undefined") {
                this._attackPartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(ATTACK, 'attack');
            }
            return this._attackPartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'movePartsActiveBoostEquivalent', {
        get() {
            if (typeof this._movePartsActiveBoostEquivalent === "undefined") {
                this._movePartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(MOVE, 'fatigue');
            }
            return this._movePartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestPartsActiveBoostEquivalent', {
        get() {
            if (typeof this._harvestPartsActiveBoostEquivalent === "undefined") {
                this._harvestPartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'harvest');
            }
            return this._harvestPartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'dismantlePartsActiveBoostEquivalent', {
        get() {
            if (typeof this._dismantlePartsActiveBoostEquivalent === "undefined") {
                this._dismantlePartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'dismantle');
            }
            return this._dismantlePartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'attackPower', {
        get() {
            if (typeof this._attackPower === "undefined") {
                this._attackPower = this.attackPartsBoostEquivalent * ATTACK_POWER;
            }
            return this._attackPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'activeAttackPower', {
        get() {
            if (typeof this._activeAttackPower === "undefined") {
                this._activeAttackPower = this.attackPartsActiveBoostEquivalent * ATTACK_POWER;
            }
            return this._activeAttackPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'dismantlePower', {
        get() {
            if (typeof this._dismantlePower === "undefined") {
                this._dismantlePower = this.dismantlePartsActiveBoostEquivalent * DISMANTLE_POWER;
            }
            return this._dismantlePower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestSourceBasePower', {
        get() {
            if (typeof this._harvestSourceBasePower === "undefined") {
                this._harvestSourceBasePower = this.workParts * HARVEST_POWER;
            }
            return this._harvestSourceBasePower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'upgradeControllerPower', {
        get() {
            if (typeof this._upgradeControllerPower === "undefined") {
                this._upgradeControllerPower = this.workPartsActiveUpgradeControllerBoostEquivalent * UPGRADE_CONTROLLER_POWER;
            }
            return this._upgradeControllerPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'attackControllerPower', {
        get() {
            if (typeof this._attackControllerPower === "undefined") {
                this._attackControllerPower = this.claimParts * CONTROLLER_CLAIM_DOWNGRADE;
            }
            return this._attackControllerPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestSourcePower', {
        get() {
            if (typeof this._harvestSourcePower === "undefined") {
                this._harvestSourcePower = this.workParts * HARVEST_POWER;
            }
            return this._harvestSourcePower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestDepositPower', {
        get() {
            if (typeof this._harvestDepositPower === "undefined") {
                this._harvestDepositPower = this.workParts * HARVEST_DEPOSIT_POWER;
            }
            return this._harvestDepositPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestMineralPower', {
        get() {
            if (typeof this._harvestMineralPower === "undefined") {
                this._harvestMineralPower = this.workParts * HARVEST_MINERAL_POWER;
            }
            return this._harvestMineralPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestPartsActiveBoostDepositPower', {
        get() {
            if (typeof this._harvestPartsActiveBoostDepositPower === "undefined") {
                this._harvestPartsActiveBoostDepositPower = this.harvestPartsActiveBoostEquivalent * HARVEST_DEPOSIT_POWER;
            }
            return this._harvestPartsActiveBoostDepositPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestDepositTicksToFillCapacity', {
        get() {
            if (typeof this._harvestDepositTicksToFillCapacity === "undefined") {
                this._harvestDepositTicksToFillCapacity = Math.floor(this.store.getCapacity() / this.harvestDepositPower);
            }
            return this._harvestDepositTicksToFillCapacity;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'harvestMineralTicksToFillCapacity', {
        get() {
            if (typeof this._harvestMineralTicksToFillCapacity === "undefined") {
                this._harvestMineralTicksToFillCapacity = Math.floor(this.store.getCapacity() / this.harvestMineralPower);
            }
            return this._harvestMineralTicksToFillCapacity;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'rangedAttackPartsBoostEquivalent', {
        get() {
            if (typeof this._rangedAttackPartsBoostEquivalent === "undefined") {
                this._rangedAttackPartsBoostEquivalent = this.getBodypartsBoostEquivalent(RANGED_ATTACK, 'rangedAttack', 'rangedAttackParts');
            }
            return this._rangedAttackPartsBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'rangedAttackPartsActiveBoostEquivalent', {
        get() {
            if (typeof this._rangedAttackPartsActiveBoostEquivalent === "undefined") {
                this._rangedAttackPartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(RANGED_ATTACK, 'rangedAttack');
            }
            return this._rangedAttackPartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'rangedAttackPower', {
        get() {
            if (typeof this._rangedAttackPower === "undefined") {
                this._rangedAttackPower = this.rangedAttackPartsBoostEquivalent * RANGED_ATTACK_POWER;
            }
            return this._rangedAttackPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'activeRangedAttackPower', {
        get() {
            if (typeof this._activeRangedAttackPower === "undefined") {
                this._activeRangedAttackPower = this.rangedAttackPartsActiveBoostEquivalent * RANGED_ATTACK_POWER;
            }
            return this._activeRangedAttackPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'healPartsBoostEquivalent', {
        get() {
            if (typeof this._healPartsBoostEquivalent === "undefined") {
                this._healPartsBoostEquivalent = this.getBodypartsBoostEquivalent(HEAL, 'heal', 'healParts');
            }
            return this._healPartsBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'healPartsActiveBoostEquivalent', {
        get() {
            if (typeof this._healPartsActiveBoostEquivalent === "undefined") {
                this._healPartsActiveBoostEquivalent = this.getActiveBodypartsBoostEquivalent(HEAL, 'heal');
            }
            return this._healPartsActiveBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'healPower', {
        get() {
            if (typeof this._healPower === "undefined") {
                this._healPower = this.healPartsBoostEquivalent * HEAL_POWER;
            }
            return this._healPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'activeHealPower', {
        get() {
            if (typeof this._activeHealPower === "undefined") {
                this._activeHealPower = this.healPartsActiveBoostEquivalent * HEAL_POWER;
            }
            return this._activeHealPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'lethalPower', {
        get() {
            if (typeof this._lethalPower === "undefined") {
                this._lethalPower = this.attackPower + this.rangedAttackPower;
            }
            return this._lethalPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'combatPower', {
        get() {
            if (typeof this._combatPower === "undefined") {
                this._combatPower = this.attackPower + this.rangedAttackPower + this.healPower;
            }
            return this._combatPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'activeCombatPower', {
        get() {
            if (typeof this._activeCombatPower === "undefined") {
                this._activeCombatPower = this.activeAttackPower + this.activeRangedAttackPower + this.activeHealPower;
            }
            return this._activeCombatPower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'toughHits', {
        get() {
            if (typeof this._toughHits === "undefined") {
                this._toughHits = 0;
                if (this.toughParts) {
                    this.body.forEach(part => {
                        if (part.type === TOUGH) {
                            // GO    -30% damage
                            // GHO2  -50% damage
                            // XGHO2 -70% damage
                            this._toughHits += (part.boost ? Math.floor(100 / BOOSTS[TOUGH][part.boost]['damage']) : part.hits);
                        }
                    })
                }
            }
            return this._toughHits;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'toughHitsRemaining', {
        get() {
            if (typeof this._toughHitsRemaining === "undefined") {
                this._toughHitsRemaining = 0;
                if (this.toughParts) {
                    this.body.forEach(part => {
                        if (part.type === TOUGH) {
                            // GO    -30% damage
                            // GHO2  -50% damage
                            // XGHO2 -70% damage
                            this._toughHitsRemaining += (part.boost ? Math.floor(part.hits / BOOSTS[TOUGH][part.boost]['damage']) : part.hits);
                        }
                    })
                }
            }
            return this._toughHitsRemaining;
        },
        configurable: true, enumerable: true,
    });

    /**
     * This value represents actual estimated incoming damage in this tick.
     * It may not actually happen (if hostiles are focused elsewhere), but it could.
     */
    Object.defineProperty(Creep.prototype, 'incomingDamage', {
		get() {
            if (typeof this._incomingDamage === "undefined") {
                // Initialize incoming damage to zero.
                this._incomingDamage = 0;

                // If we are in my room with safemode, then we never take damage.
                if (!this.room.my || !this.room.safeMode) {
                    // Get the amount from towers.
                    this.room.hostileTowersWithEnergy.forEach(tower => {
                        this._incomingDamage += tower.getAttackAmount(this);
                    });

                    this.room.hostiles.forEach(hostile => {
                        let meleeAttack = this.pos.isNearTo(hostile) ? hostile.activeAttackPower : 0;
                        let rangedAttack = this.pos.inRange3(hostile) ? hostile.activeRangedAttackPower : 0;
                        // Take the greater of the two potential attacks as worst case scenerio.
                        this._incomingDamage += Math.max(meleeAttack, rangedAttack);
                    })
                }
            }
			return this._incomingDamage;
		},
		configurable: true, enumerable: true,
    });

    /**
     * This represents the damage we could take on the next tick if we stay in our current spot.
     * That is if melee where to move next to us this tick, then this will be the damage we could
     * receive on every future tick if they chase us.
     */
	Object.defineProperty(Creep.prototype, 'potentialIncomingDamage', {
		get() {
            if (typeof this._potentialIncomingDamage === "undefined") {
                // Initialize incoming damage to zero.
                this._potentialIncomingDamage = 0;

                // If we are in my room with safemode, then we never take damage.
                if (!this.room.my || !this.room.safeMode) {
                    // Get the amount from towers.
                    this.room.hostileTowersWithEnergy.forEach(tower => {
                        this._potentialIncomingDamage += tower.getAttackAmount(this);
                    });

                    this.room.hostiles.forEach(hostile => {
                        let meleeAttack = 0;
                        if (this.pos.isNearTo(hostile)) {
                            // Any creep nearby can do a melee attack.
                            meleeAttack = hostile.activeAttackPower;
                        } else if (this.pos.isRange2(hostile)) {
                            // Invaders under ramparts will not move, so do not count their attack.
                            if (!hostile.isInvader || !hostile.pos.hasRampartHits) {
                                meleeAttack = hostile.activeAttackPower;
                            }
                        }
                        let rangedAttack = this.pos.inRange4(hostile) ? hostile.activeRangedAttackPower : 0;
                        // Take the greater of the two potential attacks as worst case scenerio.
                        this._potentialIncomingDamage += Math.max(meleeAttack, rangedAttack);
                    })
                }
            }
			return this._potentialIncomingDamage;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'hostileStructuresInRange3', {
		get() {
            if (typeof this._hostileStructuresInRange3 === "undefined") {
                this._hostileStructuresInRange3 = this.room.hostileStructures.filter(f => this.pos.inRange3(f));
            }
			return this._hostileStructuresInRange3;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'dryHostileStructuresInRange3', {
		get() {
            if (typeof this._dryHostileStructuresInRange3 === "undefined") {
                this._dryHostileStructuresInRange3 = this.hostileStructuresInRange3.filter(f => this.room.dryStructuresFilter(f));
            }
			return this._dryHostileStructuresInRange3;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'attackStructuresInRange3', {
		get() {
            if (typeof this._attackStructuresInRange3 === "undefined") {
                this._attackStructuresInRange3 = [];
                if (this.room.ownedByOther || this.room.reservedByMe || this.room.isSKRoom) {
                    // Any structure in a room owned by another else is fair game.
                    this._attackStructuresInRange3 = this.hostileStructuresInRange3;
                }
                // Going to ignore structures on my reserved areas, those should be deleted in code via claim process.
                else if (!this.room.myManagement && this.room.controller) {
                    // We are in an unclaimed/reserved room (not owned by me) but has a controller (so excluding highways and SK rooms).
                    this._attackStructuresInRange3 = this.dryHostileStructuresInRange3;
                }
            }
			return this._attackStructuresInRange3;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'meleeHostilesCloseBy', {
		get() {
            if (typeof this._meleeHostilesCloseBy === "undefined") {
                //this._meleeHostilesCloseBy = this.room.nonSourceKeeperHostiles.filter(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_CLOSEBY_RANGE);
                this._meleeHostilesCloseBy = this.room.playerHostiles.filter(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_CLOSEBY_RANGE);
            }
			return this._meleeHostilesCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'rangedHostilesCloseBy', {
		get() {
            if (typeof this._rangedHostilesCloseBy === "undefined") {
                //this._rangedHostilesCloseBy = this.room.nonSourceKeeperHostiles.filter(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_CLOSEBY_RANGE);
                this._rangedHostilesCloseBy = this.room.playerHostiles.filter(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_CLOSEBY_RANGE);
            }
			return this._rangedHostilesCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'hostileDamagePowerCloseBy', {
		get() {
            if (typeof this._hostileDamagePowerCloseBy === "undefined") {
                // Initialize incoming damage to zero.
                this._hostileDamagePowerCloseBy = 0;

                // If we are in my room with safemode, then we never take damage.
                if (!this.room.my || !this.room.safeMode) {
                    // Get the amount from towers but only count if there is a source of energy in the room.
                    if (this.room.storage || this.room.terminal || RoomIntel.getHostileSpawnCount(this.room.name) || RoomIntel.getStrongholdInvaderCoreHitsByRoomName(this.room.name) || RoomIntel.getHostilesTTL(this.room.name)) {
                        this.room.hostileTowersWithEnergy.forEach(tower => {
                            this._hostileDamagePowerCloseBy += tower.getAttackAmount(this);
                        });
                    }

                    this.meleeHostilesCloseBy.forEach(hostile => {
                        this._hostileDamagePowerCloseBy += hostile.activeAttackPower;
                    })

                    this.rangedHostilesCloseBy.forEach(hostile => {
                        this._hostileDamagePowerCloseBy += hostile.activeRangedAttackPower;
                    })
                }
            }
			return this._hostileDamagePowerCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'hostileHitsCloseBy', {
		get() {
            if (typeof this._hostileHitsCloseBy === "undefined") {
                // Initialize incoming damage to zero.
                this._hostileHitsCloseBy = 0;

                // If we are in my room with safemode, then we never take damage.
                if (!this.room.my || !this.room.safeMode) {
                    // Get the amount from towers but only count if there is a source of energy in the room.
                    if (this.room.storage || this.room.terminal || RoomIntel.getHostileSpawnCount(this.room.name) || RoomIntel.getStrongholdInvaderCoreHitsByRoomName(this.room.name) || RoomIntel.getHostilesTTL(this.room.name)) {
                        this.room.hostileTowersWithEnergy.forEach(tower => {
                            this._hostileHitsCloseBy += tower.hits;
                        });
                    }

                    this.meleeHostilesCloseBy.forEach(hostile => {
                        this._hostileHitsCloseBy += hostile.hits;
                    })

                    this.rangedHostilesCloseBy.forEach(hostile => {
                        this._hostileHitsCloseBy += hostile.hits;
                    })
                }
            }
			return this._hostileHitsCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomObject.prototype, 'hostileHealPowerCloseBy', {
		get() {
            if (typeof this._hostileHealPowerCloseBy === "undefined") {
                // Initialize incoming damage to zero.
                this._hostileHealPowerCloseBy = _.sum(this.room.nonSourceKeeperHostiles.filter(f => this.pos.getRangeTo(f) <= Config.params.HOSTILE_CLOSEBY_RANGE), s=>s.activeHealPower);
            }
			return this._hostileHealPowerCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'friendlyNearBy', {
		get() {
            if (typeof this._friendlyNearBy === "undefined") {
                this._friendlyNearBy = this.room.myCreeps.filter(f => this.pos.isNearTo(f));
            }
			return this._friendlyNearBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'friendlyCloseBy', {
		get() {
            if (typeof this._friendlyNearBy === "undefined") {
                this._friendlyNearBy = this.room.myCreeps.filter(f => this.pos.getRangeTo(f) <= 3);
            }
			return this._friendlyNearBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'friendlyCloseBySorted', {
		get() {
            if (typeof this._friendlyCloseBySorted === "undefined") {
                this._friendlyCloseBySorted = _.sortBy(this.friendlyCloseBy, s => this.pos.getRangeTo(s));
            }
			return this._friendlyCloseBySorted;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Room.prototype, 'friendlyCombatPower', {
		get() {
            if (typeof this._friendlyCombatPower === "undefined") {
                this._friendlyCombatPower = _.sum(this.myCreeps, f => f.combatPower);
            }
			return this._friendlyCombatPower;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'friendlyDamagePowerCloseBy', {
		get() {
            if (typeof this._friendlyDamagePowerCloseBy === "undefined") {
                // Initialize incoming damage to zero.
                this._friendlyDamagePowerCloseBy = 0;

                this.friendlyCloseBy.forEach(friendly => {
                    this._friendlyDamagePowerCloseBy += friendly.activeAttackPower;
                    this._friendlyDamagePowerCloseBy += friendly.activeRangedAttackPower;
                })
            }
			return this._friendlyDamagePowerCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'friendlyHealPowerCloseBy', {
		get() {
            if (typeof this._friendlyHealPowerCloseBy === "undefined") {
                // Initialize incoming damage to zero.
                this._friendlyHealPowerCloseBy = _.sum(this.friendlyCloseBy, s=>s.activeHealPower);
            }
			return this._friendlyHealPowerCloseBy;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'canWinRoomBattle', {
        get() {
            if (typeof this._canWinRoomBattle === "undefined") {
                this._canWinRoomBattle =
                    // There is no hostile damage at all, so short-cuircut rest of logic.
                    !this.hostileDamagePowerCloseBy

                    // We have armor to cover all incoming damage, easy peezee.
                    || (this.toughHitsRemaining >= this.hostileDamagePowerCloseBy)

                    // If we have more heals then they have damage, then we can win.
                    || (this.friendlyHealPowerCloseBy >= this.hostileDamagePowerCloseBy)

                    // Its a race condition...do we have more attack then they do?
                    || (
                        // If there are no towers in this room, then consider yourself part of a team.
                        !RoomIntel.getHostileTowerCount(this.room.name)
                        && ((this.friendlyHealPowerCloseBy + this.friendlyDamagePowerCloseBy) >= (this.hostileDamagePowerCloseBy + this.hostileHealPowerCloseBy))
                    )
                    || (
                        // If there are towers in this room, then consider yourself solo.
                        RoomIntel.getHostileTowerCount(this.room.name)
                        && ((this.activeHealPower + this.activeRangedAttackPower + this.hits) >= (this.hostileDamagePowerCloseBy + this.hostileHealPowerCloseBy + this.hostileHitsCloseBy))
                    )
            }
            return this._canWinRoomBattle;
        },
        configurable: true, enumerable: true,
    });

    Creep.prototype.shouldAttack = function(hostileCreep) {
        // A hostile creep with attack parts will reflect that damage back to us.
        // Also if we are in range to attack them, then they could attack us, so its really double damage in worst case scenerio.
        if (this.attackPartsActive && (this.hits <= (hostileCreep.attackPower * 2))) return false;

        return true;
    }

    Object.defineProperty(Creep.prototype, 'takingDamage', {
        get() {
            if (typeof this._takingDamage === "undefined") {
                this._takingDamage = this.incomingDamage ? this.incomingDamage > this.toughHitsRemaining : false;
            }
            return this._takingDamage;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'potentiallyTakingHalfToughDamage', {
        get() {
            if (typeof this._potentiallyTakingHalfToughDamage === "undefined") {
                this._potentiallyTakingHalfToughDamage = this.toughParts && (this.potentialIncomingDamage > Math.ceil(this.toughHits / 2));
            }
            return this._potentiallyTakingHalfToughDamage;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'potentiallyTakingDamage', {
        get() {
            if (typeof this._potentiallyTakingDamage === "undefined") {
                this._potentiallyTakingDamage = this.potentialIncomingDamage ? this.potentialIncomingDamage > this.toughHitsRemaining : false;
            }
            return this._potentiallyTakingDamage;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'takingKillingBlow', {
        get() {
            if (typeof this._takingKillingBlow === "undefined") {
                this._takingKillingBlow = this.incomingDamage >= this.hits;
            }
            return this._takingKillingBlow;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'potentiallyTakingKillingBlow', {
        get() {
            if (typeof this._potentiallyTakingKillingBlow === "undefined") {
                this._potentiallyTakingKillingBlow = this.potentialIncomingDamage >= this.hits;
            }
            return this._potentiallyTakingKillingBlow;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'fatigueTicks', {
        get() {
            if (typeof this._fatigueTicks === "undefined") {
                this._fatigueTicks = this.fatigue ? (this.fatigue / (this.movePartsActiveBoostEquivalent * 2)) : 0;
            }
            return this._fatigueTicks;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'potentiallyTakingKillingBlowNextTick', {
        get() {
            if (typeof this._potentiallyTakingKillingBlowNextTick === "undefined") {
                this._potentiallyTakingKillingBlowNextTick = (this.potentialIncomingDamage * Math.max(this.fatigueTicks, 2)) >= this.hits;
            }
            return this._potentiallyTakingKillingBlowNextTick;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'workPartsActiveHarvestBoostEquivalent', {
        get() {
            if (typeof this._workPartsActiveHarvestBoostEquivalent === "undefined") {
                this._workPartsActiveHarvestBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'harvest');
            }
            return this._workPartsActiveHarvestBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'workPartsActiveBuildBoostEquivalent', {
        get() {
            if (typeof this._workPartsActiveBuildBoostEquivalent === "undefined") {
                this._workPartsActiveBuildBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'build');
            }
            return this._workPartsActiveBuildBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'workPartsActiveRepairBoostEquivalent', {
        get() {
            if (typeof this._workPartsActiveRepairBoostEquivalent === "undefined") {
                this._workPartsActiveRepairBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'repair');
            }
            return this._workPartsActiveRepairBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'workPartsActiveUpgradeControllerBoostEquivalent', {
        get() {
            if (typeof this._workPartsActiveUpgradeControllerBoostEquivalent === "undefined") {
                this._workPartsActiveUpgradeControllerBoostEquivalent = this.getActiveBodypartsBoostEquivalent(WORK, 'upgradeController');
            }
            return this._workPartsActiveUpgradeControllerBoostEquivalent;
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'carryParts', {
		get() {
            if (typeof this._carryParts === "undefined") {
                this._carryParts = this.bodyparts[CARRY] || 0
            }
            return this._carryParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'emptyCarryParts', {
		get() {
            if (typeof this._emptyCarryParts === "undefined") {
                this._emptyCarryParts = (this.carryParts - Math.ceil(this.store.getUsedCapacity() / CARRY_CAPACITY));
            }
            return this._emptyCarryParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'attackParts', {
		get() {
            if (typeof this._attackParts === "undefined") {
                this._attackParts = this.bodyparts[ATTACK] || 0
            }
            return this._attackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'rangedAttackParts', {
		get() {
            if (typeof this._rangedAttackParts === "undefined") {
                this._rangedAttackParts = this.bodyparts[RANGED_ATTACK] || 0
            }
            return this._rangedAttackParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'hasLethalParts', {
		get() {
            if (typeof this._hasLethalParts === "undefined") {
                this._hasLethalParts = !!(this.attackParts || this.rangedAttackParts);
            }
            return this._hasLethalParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'healParts', {
		get() {
            if (typeof this._healParts === "undefined") {
                this._healParts = this.bodyparts[HEAL] || 0
            }
            return this._healParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'claimParts', {
		get() {
            if (typeof this._claimParts === "undefined") {
                this._claimParts = this.bodyparts[CLAIM] || 0
            }
            return this._claimParts;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'toughParts', {
		get() {
            if (typeof this._toughParts === "undefined") {
                this._toughParts = this.bodyparts[TOUGH] || 0
            }
            return this._toughParts;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'movePartsActive', {
		get() {
            if (typeof this._movePartsActive === "undefined") {
                this._movePartsActive = this.getActiveBodyparts(MOVE);
            }
			return this._movePartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'workPartsActive', {
		get() {
            if (typeof this._workPartsActive === "undefined") {
                this._workPartsActive = this.getActiveBodyparts(WORK);
            }
			return this._workPartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'carryPartsActive', {
		get() {
            if (typeof this._carryPartsActive === "undefined") {
                this._carryPartsActive = this.getActiveBodyparts(CARRY);
            }
			return this._carryPartsActive;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'attackPartsActive', {
		get() {
            if (typeof this._attackPartsActive === "undefined") {
                this._attackPartsActive = this.getActiveBodyparts(ATTACK);
            }
			return this._attackPartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'rangedAttackPartsActive', {
		get() {
            if (typeof this._rangedAttackPartsActive === "undefined") {
                this._rangedAttackPartsActive = this.getActiveBodyparts(RANGED_ATTACK);
            }
			return this._rangedAttackPartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'healPartsActive', {
		get() {
            if (typeof this._healPartsActive === "undefined") {
                this._healPartsActive = this.getActiveBodyparts(HEAL);
            }
			return this._healPartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'claimPartsActive', {
		get() {
            if (typeof this._claimPartsActive === "undefined") {
                this._claimPartsActive = this.getActiveBodyparts(CLAIM);
            }
			return this._claimPartsActive;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'toughPartsActive', {
		get() {
            if (typeof this._toughPartsActive === "undefined") {
                this._toughPartsActive = this.getActiveBodyparts(TOUGH);
            }
			return this._toughPartsActive;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'toughPartsHalfGone', {
		get() {
            if (typeof this._toughPartsHalfGone === "undefined") {
                this._toughPartsHalfGone = this.getActiveBodyparts(TOUGH) < (this.toughParts - this.getActiveBodyparts(TOUGH));
            }
			return this._toughPartsHalfGone;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'print', {
		get() {
            return utils.getRoomHTML(this.room.name);
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'isDamaged', {
		get() {
			return this.hits < this.hitsMax;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'is20PercentDamaged', {
		get() {
			return this.hits < (this.hitsMax * 0.80);
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isQuarterDamaged', {
		get() {
			return this.hits < (this.hitsMax * 0.75);
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isHalfDamaged', {
		get() {
			return this.hits < (this.hitsMax * 0.5);
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'damage', {
		get() {
			return this.hitsMax - this.hits;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isBodyPartDestroyed', {
		get() {
            if (typeof this._isBodyPartDestroyed === "undefined") {
                // If the first body part has no hits, then we have lost at least one part.
				this._isBodyPartDestroyed = !this.body[0].hits;
            }
			return this._isBodyPartDestroyed;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'isNearAnotherCreep', {
		get() {
            if (typeof this._isNearAnotherCreep === "undefined") {
                this._isNearAnotherCreep = this.room.myCreeps.find(f => this.pos.isNearTo(f) && (f.id !== this.id));
            }
			return this._isNearAnotherCreep;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'energyFull', {
		get() {
            if (typeof this._energyFull === "undefined") {
                // We have energy, and there is no room left; therefore we are energy full.
                // There is a chance we have resources other than energy as well, so be careful.
                this._energyFull = (this.store.getUsedCapacity(RESOURCE_ENERGY) && !this.store.getFreeCapacity());
            }
			return this._energyFull;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'energyOverHalf', {
		get() {
            if (typeof this._energyOverHalf === "undefined") {
                // We have energy, and there is no room left; therefore we are energy full.
                // There is a chance we have resources other than energy as well, so be careful.
                this._energyOverHalf = (this.store.getUsedCapacity(RESOURCE_ENERGY) >= (this.store.getCapacity() / 2));
            }
			return this._energyOverHalf;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'energyOverQuarter', {
		get() {
            if (typeof this._energyOverQuarter === "undefined") {
                // We have energy, and there is no room left; therefore we are energy full.
                // There is a chance we have resources other than energy as well, so be careful.
                this._energyOverQuarter = (this.store.getUsedCapacity(RESOURCE_ENERGY) >= (this.store.getCapacity() / 4));
            }
			return this._energyOverQuarter;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'energyEmpty', {
		get() {
            if (typeof this._energyEmpty === "undefined") {
				this._energyEmpty = (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0);
            }
			return this._energyEmpty;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'energyLastWorkTick', {
		get() {
            if (typeof this._energyLastWorkTick === "undefined") {
				this._energyLastWorkTick = (this.store.getUsedCapacity(RESOURCE_ENERGY) <= this.workParts);
            }
			return this._energyLastWorkTick;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'doNotRenew', {
		get() {
            if (typeof this._doNotRenew === "undefined") {
				this._doNotRenew = !!(
                    // Placeholder.
                    false

                    // There is no renew spawn setup yet.
                    || !this.room.my

                    // If the room is just starting out, let roads be built first.
                    || !this.room.controller
                    || !CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][this.room.level]
                    || !this.room.storage

                    // If our workroom is avoid (say strongholds popping up on reserved room) then do not renew.
                    || RoomIntel.getAvoid(this.workRoom)

                    // Is this room unclaimed, do not renew here.
                    || this.room.unclaimFlag

                    // If the creep is still new, no need to renew. Based on if creep sits on the small council or not.
                    || (
                        (
                            (this.ticksToLive >= Config.params.RENEW_TICKS_SMALL_COUNCIL)
                            && this.isSmallCoucilMember
                        )
                        || (
                            (this.ticksToLive >= Config.params.RENEW_TICKS_ROOK)
                            && this.isRook
                        )
                        || (
                            (this.ticksToLive >= Config.params.RENEW_TICKS)
                            && !this.isSmallCoucilMember
                            && !this.isRook
                        )
                    )

                    // Do we have a designated area setup yet?
                    || (!this.room.colonyRenewPos && !this.room.isTemple)

                    // Colony spawn setup.
                    || (!this.room.colonySpawn1 && !this.room.colonySpawn2 && !this.room.colonySpawn3)

                    // Spawns are sucked dry, and there is no storage to pull from. Bail out.
                    || ((this.room.energyAvailable < this.renewCost) && !this.room.storage)

                    // Check to see that the room hasn't gotten bigger.
                    || (this.creepSpawnEnergyCapacityAvailable < this.room.energyCapacityAvailable)

                    // Check to see if this creep is a charity from a higher room, in which case don't renew it if low on energy since they will send another.
                    || ((this.creepSpawnEnergyCapacityAvailable > this.room.energyCapacityAvailable) && (!this.room.storage || !this.room.isStorageEnergyNormal))

                    // Any boosts mean this creep should not renew, or it will lose boosts.
                    || this.hasBoostedParts

                    // If we have taken damage, don't bother renewing.
                    || this.isMissingBodyPart

                    // Rooks should die if the work room has halted spawning.
                    || (
                        (this.role === Config.roles.ROOK)
                        && (
                            // Creep count check.
                            (CreepManager.getRooksByFocusId(this.room.controller.id).length > 1)

                            // Not a correct sized creep.
                            || (this.body.length !== this.room.getBodyRook().length)
                        )
                    )

                    // Oxen: unless standard body size changes, they can renew.
                    // Idle oxen will naturally die of old age if no longer needed.
                    || (
                        (this.role === Config.roles.OX)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Assigned room is full of energy, so give up.
                            || Game.rooms[this.assignedRoom].isStorageFull

                            // Assigned room is full of energy, so give up.
                            || (this.body.length !== Game.rooms[this.assignedRoom].getBodyOx().length)
                        )
                    )

                    // Horses should die if the spawn room has halted spawning.
                    || (
                        (this.role === Config.roles.HORSE)
                        && (
                            // Do not renew if we are assigneding to a low level room.
                            !this.room.atMaxLevel

                            // Are we in CPU trouble?
                            || !Game.rooms[this.room.name]
                            || GameManager.haltRenewing

                            // Assigned room (now) has a terminal. Possibly created when room upgraded to level 6.
                            || !Game.rooms[this.assignedRoom]
                            || Game.rooms[this.assignedRoom].myTerminal
                            || Game.rooms[this.assignedRoom].isStorageEnergyNormal

                            // Verify the creep count.
                            || (CreepManager.getHorsesByFocusId(this.focusId).length > Config.params.MAX_HORSES_PER_WORKROOM)
                        )
                    )

                    // Rogues should die if the spawn room has halted spawning.
                    || (
                        (this.role === Config.roles.ROGUE)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Our spawn is full of energy, so give up.
                            || Game.rooms[this.assignedRoom].isStorageFull

                            // Verify the creep count.
                            || (CreepManager.getRoguesByFocusId(Game.rooms[this.assignedRoom].controller.id).length > Game.rooms[this.assignedRoom].maxRogues)
                        )
                    )

                    // Donkeys should die if the assigned room has halted renewing.
                    // Do not look at GameManager.isDepositActive as that does not account for other reasons such as hostiles in room.
                    || (
                        (this.role === Config.roles.DONKEY)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Verify we are still working on this deposit.
                            || !CreepManager.getProspectorsByFocusId(this.focusId).length

                            // We don't need more than 1 donkey except for early deposits, in which case just let the donkeys die off after 1 lifetime.
                            || (CreepManager.getDonkeysByFocusId(this.focusId).length > 1)
                        )
                    )

                    // Miners can potentially overmine, so be away of your terminal capacity.
                    || (
                        (this.role === Config.roles.MINER)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.spawnRoom]
                            || GameManager.haltRenewing

                            // Big check to see if we care about this miner anymore.
                            || !Game.rooms[this.spawnRoom].shouldMinerContinueExtractingForRoom(this.workRoom)
                        )
                    )

                    // Dredger can potentially overmine, so be away of your terminal capacity.
                    || (
                        (this.role === Config.roles.DREDGER)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Have we turned off minerals?
                            || Game.rooms[this.assignedRoom].noMineral

                            // Big check to see if we care about this miner anymore.
                            || !Game.rooms[this.assignedRoom].shouldMinerContinueExtractingForRoom(this.workRoom)
                        )
                    )

                    // Jackass should die if the assigned room has halted renewing.
                    || (
                        (this.role === Config.roles.JACKASS)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Have we turned off minerals?
                            || Game.rooms[this.assignedRoom].noMineral

                            // Verify we are still working on this target.
                            || !CreepManager.getDredgersByFocusId(this.focusId).length
                        )
                    )

                    // Scavengers should renew unless room is no longer reserved.
                    || (
                        (this.role === Config.roles.SCAVENGER)
                        && (
                            // Are we in CPU trouble?
                            !Game.rooms[this.assignedRoom]
                            || GameManager.haltRenewing

                            // Assigned room is full of energy, so give up.
                            || Game.rooms[this.assignedRoom].isStorageFull

                            // Room is no longer ours or reserved for our spawn.
                            || !Game.rooms[this.assignedRoom].reservedRoomNamesHash[this.workRoom]

                            // 1 scavenger per room distance.
                            || (CreepManager.getScavengersByWorkRoom(this.workRoom).length > Cartographer.findRouteDistance(this.assignedRoom, this.workRoom))
                        )
                    )

                    // Kings can change size during the colony lifetime.
                    || (
                        (this.role === Config.roles.KING)
                        && (
                            // Not a correct sized king.
                            (this.body.length !== this.room.getBodyKing().length)
                        )
                    )

                    // Queens must be on their special spot if the second colony spawn is up.
                    || (
                        (this.role === Config.roles.QUEEN)
                        && (
                            !this.room.colonySpawn2
                            || !this.pos.isEqualTo(this.room.colonyQueenPos)
                        )
                    )

                    // Jesters will stop renewing once room is at max level and ready to recycle.
                    || (
                        (this.role === Config.roles.JESTER)
                        && (
                            // We have been banished, do not renew.
                            this.room.isJesterBanished
                        )
                    )

                );

            }
			return this._doNotRenew;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'usableWorkCapacity', {
		get() {
            if (typeof this._usableWorkCapacity === "undefined") {
                // Default return value.
                this._usableWorkCapacity = 0;

                if (this.workParts) {
                    // Estimate how much we could spend with our remaining time left.
                    // Subtract a buffer of ~30 in order to move to whereever we are going and use everything before dieing.
                    this._usableWorkCapacity = Math.max(0, Math.min(this.store.getCapacity(), (this.ticksToLive - Config.params.MIN_WORKER_USABLE_TICKS) * this.workParts));
                }
                else {
                    // Without work parts, we aren't actually working just carrying.
                    // Make an estimate if we can reach our assigned room or not.
                    if (this.willLiveToAssignedRoom) {
                        this._usableWorkCapacity = this.store.getCapacity();
                    }
                }
            }
			return this._usableWorkCapacity;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'freeWorkCapacity', {
		get() {
            if (typeof this._freeWorkCapacity === "undefined") {
                this._freeWorkCapacity = Math.max(0, Math.min(this.store.getFreeCapacity(), this.usableWorkCapacity - this.store.getUsedCapacity()));
            }
			return this._freeWorkCapacity;
		},
		configurable: true, enumerable: true,
    });

    // Pickup any free energy under the creep.
    Creep.prototype.optimisticPickupEnergy = function() {
        // Shorthand.
        let creep = this;
        let result = ERR_NOT_FOUND;

        // Only bother doing these operations if we have room for them.
        if (!creep.store.getFreeCapacity()) return ERR_FULL;

        let resource = creep.pos.lookForEnergy();
        if (resource) {
            result = creep.smartPickup(resource);
        }

        return result;
    }

    // Pickup any free resource under the creep.
    Creep.prototype.optimisticPickupResource = function() {
        // Shorthand.
        let creep = this;
        let result = ERR_NOT_FOUND;

        // Only bother doing these operations if we have room for them.
        if (!creep.store.getFreeCapacity()) return ERR_FULL;

        let resource = creep.pos.lookForResource();
        if (resource) {
            result = creep.smartPickup(resource);
        }

        return result;
    }

    Room.prototype.updateRoadData = function(options) {
        // Don't mess with the original options object.
		let defaults = {
            force: false
			, debug: false
        };
		options = _.defaults({}, _.clone(options), defaults);

        let room = this;
        let roomName = packRoomName(room.name);
        const TICK_OFFSET = ROAD_DECAY_TIME / 2;
        const REPAIR_THRESHOLD = 2 * REPAIR_POWER * Config.params.ROAD_REPAIR_TICKS;

        if (!Memory.roads[roomName]) {
            Memory.roads[roomName] = {};
            Memory.roads[roomName].t = packTime(Game.time - TICK_OFFSET);
            Memory.roads[roomName].r = {};
        }

        if (!options.force && unpackTime(Memory.roads[roomName].t) + TICK_OFFSET > Game.time) return false;
        Memory.roads[roomName].t = packTime(Game.time);

        //let roads = this.roads.filter(f => f.hitsMax - f.hits >= REPAIR_THRESHOLD);
        //Memory.roads[roomName].r = utils.arrayToHash(roads.map(m => packCoord(m.pos)), 1);

        Memory.roads[roomName].r = this.roads.reduce((roads, road) => (roads[packCoord(road.pos)] = (road.hitsMax - road.hits >= REPAIR_THRESHOLD) ? 1 : 0, roads), {});

        //let count = Object.keys(Memory.roads[roomName].r).length;
        let count = Object.values(Memory.roads[roomName].r).filter(f => Memory.roads[roomName].r[f]).length;
        if (count) room.logRoom(count + ' roads need repair');
    }

    Room.prototype.doesPosNeedRoadRepair = function(pos) {
        let room = this;
        let roomName = packRoomName(room.name);
        let packedPos = packCoord(pos);
        return Memory.roads[roomName] && Memory.roads[roomName].r && Memory.roads[roomName].r[packedPos];
    }

    Room.prototype.removePosNeedRoadRepair = function(pos) {
        let room = this;
        let roomName = packRoomName(room.name);
        let packedPos = packCoord(pos);
        //delete Memory.roads[roomName].r[packedPos];
        Memory.roads[roomName].r[packedPos] = 0;
    }

    // Repair any structures we are passing over.
    Creep.prototype.optimisticRepairRoad = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;
        let result = ERR_NOT_FOUND;

        // We have to have energy and workparts and not in a room under someone else's management.
        if (creep.store[RESOURCE_ENERGY] && !room.otherManagement && !creep.isDamaged) {
            room.updateRoadData();

            if (room.doesPosNeedRoadRepair(creep.pos)) {
                let road = creep.pos.lookForStructure(STRUCTURE_ROAD);
                // Don't bother to repair unless we can fully use all our work parts.
                // Roads are typically 5000 hit points, repair power is 100 per work part.
                if (road) {
                    // Note this goes to floor, we don't care about a partial repair that would be wasted.
                    let repairsNeeded = Math.floor((road.hitsMax - road.hits) / (creep.workPartsActive * REPAIR_POWER));
                    if (repairsNeeded) result = creep.smartRepair(road, false);

                    // Update our cache and remove this location if it no longer needs repair.
                    if (repairsNeeded <= 1) {
                        room.removePosNeedRoadRepair(creep.pos);
                    }

                    // If we in remote room, need more than one repair action, and nobody is next to us,
                    // then return ERR_TIRED as a way to let caller know this is the situation.
                    if (
                        (repairsNeeded > 1)
                        //&& (!room.my || creep.pos.isRange1Edge)
                        && (creep.friendlyNearBy.length === 1)
                    ) {
                        result = ERR_TIRED;
                    }
                    // Road construction in a room that isn't under my management by me and may not be on my path.
                    // Roads built for dredgers fall under this category.
                    // TODO: does this break if we switch to build but are exceeding our builder limit?
                    else if (!room.myManagement && creep.pos.isRange1Edge && room.myConstructionSites.length) {
                        creep.switchToTask(Config.tasks.BUILD);
                    }
                }
            }
            // Road construction on the path I'm currently on.
            else if (room.myConstructionSites.length) {
                let road = creep.pos.lookForConstructionSite(STRUCTURE_ROAD);
                if (road) {
                    // Note this goes to ceil, as we need to get to 100 percent.
                    let buildsNeeded = Math.max(1, Math.ceil((road.progressTotal - road.progress) / (creep.workPartsActive * BUILD_POWER)));
                    if (buildsNeeded) result = creep.smartBuild(road, false);

                    // If we in remote room, and need any build action, and nobody is next to us,
                    // then return ERR_TIRED as a way to let caller know this is the situation.
                    if (
                        (buildsNeeded > 0)
                        //&& !room.my
                        && (creep.friendlyNearBy.length === 1)
                    ) {
                        result = ERR_TIRED;
                    }
                }
            }
            // Road construction in a room that isn't under my management by me and may not be on my path.
            // Roads built for dredgers fall under this category.
            // TODO: does this break if we switch to build but are exceeding our builder limit?
            else if (!room.myManagement && creep.pos.isRange1Edge && room.myConstructionSites.length) {
                creep.switchToTask(Config.tasks.BUILD);
            }
        }

        return result;
    }

    Object.defineProperty(Creep.prototype, 'marketValue', {
        get() {
            if (typeof this._marketValue === "undefined") {
				let value = 0;

				// For each body part, get its market value.
				this.body.forEach(part => {
					// Get the cost of the part in energy.
					value += GameManager.getMarketValue(RESOURCE_ENERGY) * BODYPART_COST[part.type];

					// Add the value of the boosted part if any.
					if (part.boost) {
						value += GameManager.getMarketValue(part.boost) * LAB_BOOST_MINERAL;
					}
				})

                this._marketValue = value;
            }
            return this._marketValue;
        },
        configurable: true, enumerable: true,
    });

    Creep.prototype.alignToAnchorBehindTarget = function(target, anchor) {
        // Our distance should be one greater than the targets range to anchor.
        let distance = target.pos.getRangeTo(anchor) + 1;
        let flag = this.room.colonyFlag;

        // Adjust our position so we are aligned on the far side of the anchor but still next to target.
        if (this.pos.isRange1Edge || (this.pos.getRangeTo(anchor) !== distance) || !this.pos.isDistance1(target)) {
            let positions = _.sortBy(target.pos.posOfRange1Enterable, s => s.rangeToCenter);
            let pos = positions.find(f => (f.getRangeTo(anchor) === distance) && f.isDistance1(target) && (!flag || !f.inDistance5(flag)));
            if (pos) {
                this.smartMove(pos);
                return ERR_NOT_IN_RANGE;
            }
            return ERR_NOT_FOUND;
        }
        return OK;
    }

    Creep.prototype.alignToCenterOfRoomInside = function(target) {
        // Adjust our position so we are aligned on the far side of the anchor but still next to target.
        if (this.pos.rangeToCenter >= target.pos.rangeToCenter) {
            let pos = target.healPosInside;
            if (pos) {
                this.smartMove(pos);
                return ERR_NOT_IN_RANGE;
            }
        }
        return OK;
    }

    Object.defineProperty(Creep.prototype, 'healPosInside', {
        get() {
            if (typeof this._healPosInside === "undefined") {
                let distance = this.pos.inRange2Edge ? 3 : 1
                this._healPosInside = _.sortByOrder(this.pos.posOfRangeDEnterable(distance, 1), [
                    sortRangeToCenter => sortRangeToCenter.rangeToCenter
                    , sortDistanceToCenter => sortDistanceToCenter.distanceToCenter
                ])[0] || null;
            }
            return this._healPosInside;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'healPosOutside', {
        get() {
            if (typeof this._healPosOutside === "undefined") {
                this._healPosOutside = _.sortByOrder(this.pos.posOfRangeDEnterable(1, 1), [
                    sortRangeToCenter => -sortRangeToCenter.rangeToCenter
                    , sortDistanceToCenter => sortDistanceToCenter.distanceToCenter
                ])[0] || null;
            }
            return this._healPosOutside;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'duo', {
        get() {
            return Game.getObjectById(this.memory.duoId);
        },
        set(value) {
            if (value) {
                this.memory.duoId = value.id;
                value.memory.duoId = this.id;
            } else {
                delete this.memory.duoId;
            }
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isDuoLeader', {
        get() {
            if (typeof this._isDuoLeader === "undefined") {
                this._isDuoLeader = false;
                if (this.duo) {
                    this._isDuoLeader = true;
                    if (this.lethalPower < this.duo.lethalPower) {
                        this._isDuoLeader = false;
                    }
                    else if ((this.lethalPower === this.duo.lethalPower) && (this.ticksToLive > this.duo.ticksToLive)) {
                        this._isDuoLeader = false;
                    }
                    else if ((this.lethalPower === this.duo.lethalPower) && (this.ticksToLive === this.duo.ticksToLive) && (this.id > this.duo.id)) {
                        this._isDuoLeader = false;
                    }
                }
            }
            return this._isDuoLeader;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isDuoFollower', {
        get() {
            if (typeof this._isDuoFollower === "undefined") {
                this._isDuoFollower = this.duo && !this.isDuoLeader;
            }
            return this._isDuoFollower;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(Creep.prototype, 'isDecisionMaker', {
        get() {
            if (typeof this._isDecisionMaker === "undefined") {
                this._isDecisionMaker = !this.duo || this.isDuoLeader;
            }
            return this._isDecisionMaker;
        },
        configurable: true, enumerable: true,
    });

}
