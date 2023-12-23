"use strict";

var Traveler = require('Traveler');  // This is required even if not directly referenced.

module.exports = function() {

    Creep.prototype.logCreep = function(method, result) {
        if (
            Game.flags[this.name]
            && (Game.flags[this.name].color === COLOR_RED)
        ) {
            let message = '🐛 ' + this.name + ' @ ' + this.room.printShard + ' ' + method + (!(result === undefined) ? ':  (' + result + ')' : '');
            utils.verboseLog(message);
        }
    };

    PowerCreep.prototype.logCreep = function(method, result) {
        if (
            Game.flags[this.name]
            && (Game.flags[this.name].color === COLOR_RED)
        ) {
            let message = '🐛 ' + this.name + ' @ ' + this.room.printShard + ' ' + method + (!(result === undefined) ? ':  (' + result + ')' : '');
            utils.verboseLog(message);
        }
    };

    Creep.prototype.inchForward = function(target, minimumDistance = 1) {
        let result = OK;
        if (this.pos.getRangeTo(target) > minimumDistance) {
            let dir = this.pos.getDirectionTo(target);
            if (
                this.pos.getPosByDirection(dir).isEnterable
            ) {
                result = this.move(dir);
            }
        }
        return result;
    }

    Creep.prototype.flee = function(options) {
        // Shorthand.
        let creep = this;
        let room = this.room;

		let defaults = {
            friendlies: false,
            hostiles: false,
            range: 2,
		};
		options = _.defaults({}, _.clone(options), defaults);

        // If both options are turned off, then don't do anything.
        if (!options.friendlies && !options.hostiles) return false;

        let creeps = [];
        if (options.friendlies) creeps = creeps.concat(room.myCreeps);
        if (options.hostiles) creeps = creeps.concat(room.lethalHostiles);

        let path = PathFinder.search(
            creep.pos
            , creeps.filter(f => f.id != creep.id).map(c => {return {pos:c.pos, range:options.range}})
            , {
                flee: true
            }
        ).path

        if (path && path.length) {
            creep.talk('🏳️');
            creep.moveByPath(path);
            return true;
        }

        return false;
    }

    RoomObject.prototype.getFleePosFromLethalHostiles = function(options) {
        // Shorthand.
        let object = this;

        // Range 1 moves away from target of at least range 3. This is out of melee attack distance plus one buffer.
        // Range 3 moves away from target of at least range 5. This is out of ranged attack distance plus one buffer.
		let defaults = {
            origin: object.pos
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Our target list are all lethal hostiles in the room.
        let targets = this.room.lethalHostiles;

        let path = PathFinder.search(
            options.origin
            , targets.map(m => {return {pos:m.pos, range:m.rangedAttackParts ? 5 : m.attackParts ? 3 : 0}})
            , {
                flee: true
                , roomCallback: function(roomName) {
                    let room = Game.rooms[roomName];
                    if (!room) return;
                    let costs = new PathFinder.CostMatrix;

                    room.structures.forEach(struct => {
                        if (struct.structureType === STRUCTURE_ROAD) {
                            // Favor roads over plain tiles.
                            costs.set(struct.pos.x, struct.pos.y, 1);
                        } else if (
                            (struct.structureType !== STRUCTURE_CONTAINER)
                            && ((struct.structureType !== STRUCTURE_RAMPART) || !struct.my)
                        ) {
                            // Can't walk through non-walkable buildings.
                            costs.set(struct.pos.x, struct.pos.y, 255);
                        }
                    });

                    // Avoid creeps in the room
                    room.creeps.forEach(creep => {
                        costs.set(creep.pos.x, creep.pos.y, 255);
                    });

                    return costs;
                }
            }
        ).path

        if (path && path.length) {
            return path[0];
        }

        return object.pos;
    }

    RoomObject.prototype.getFleePosFromTarget = function(target, options) {
        // Shorthand.
        let object = this;

        // Default range is halfway across room.
		let defaults = {
            origin: object.pos
            , range: 10
		};
		options = _.defaults({}, _.clone(options), defaults);

        // Our target is supplied.
        let targets = [target];

        let path = PathFinder.search(
            options.origin
            , targets.map(m => {return {pos:m.pos, range:options.range}})
            , {
                flee: true
                , roomCallback: function(roomName) {
                    let room = Game.rooms[roomName];
                    if (!room) return;
                    let costs = new PathFinder.CostMatrix;

                    room.structures.forEach(struct => {
                        if (struct.structureType === STRUCTURE_ROAD) {
                            // Favor roads over plain tiles.
                            costs.set(struct.pos.x, struct.pos.y, 1);
                        } else if (
                            (struct.structureType !== STRUCTURE_CONTAINER)
                            && ((struct.structureType !== STRUCTURE_RAMPART) || !struct.my)
                        ) {
                            // Can't walk through non-walkable buildings.
                            costs.set(struct.pos.x, struct.pos.y, 255);
                        }
                    });

                    // Avoid creeps in the room
                    room.creeps.forEach(creep => {
                        costs.set(creep.pos.x, creep.pos.y, 255);
                    });

                    return costs;
                }
            }
        ).path

        if (path && path.length) {
            return path[0];
        }

        return object.pos;
    }

    Creep.prototype.shouldFleeFromLair = function(target) {
        // Shorthand.
        let room = this.room;

        // Only applicable to SK rooms.
        if (!target) return false;
        if (!room.isSKRoom) return false;

        // For SK rooms we need to back away if the keeper lair is about to spawn.
        let lair = room.keeperLairs.find(f => f.pos.inRange5(target));
        // The number of ticks before we flee. Indicates respawning situation.
        let ticks = Config.params.FLEE_LAIR_TICKS;
        if (lair && lair.ticksToSpawn && (lair.ticksToSpawn < ticks)) return true;

        // Could be a source keeper up even with lair ticksToSpawn being zero.
        if (lair && lair.sourceKeeper) return true;

        // Do not flee.
        return false;
    }

    Creep.prototype.shouldFleeFromLairByResource = function(target) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Only applicable to SK rooms.
        if (!room.isSKRoom) return false;
        if (!target) return false;

        // For SK rooms we need to back away if the keeper lair is about to spawn.
        let lair = target.keeperLair;

        // Rare exception, if the lair only has 1 nip and it has a defender on it, and our current position is > 3 away, we can stay here!
        if (lair && creep.pos.isNearTo(target) && !creep.pos.inRange3(lair) && (lair.nips.length === 1) && lair.nips[0].lookForMyCreep()) return false;

        // The minimum number of ticks before we flee.
        if (lair && ((lair.ticksToSpawn || 0) < Config.params.FLEE_LAIR_TICKS)) return true;

        // Could be a source keeper up even with lair ticksToSpawn being zero.
        if (lair && lair.sourceKeeper) return true;

        // The worst case number of ticks before we flee (swamp).
        if (lair && ((lair.ticksToSpawn || 0) < (Config.params.FLEE_LAIR_TICKS * 3)) && (target instanceof Mineral) && target.hasSwampRing2NearNipsNoRoad) return true;

        // Do not flee.
        return false;
    }

    Creep.prototype.napSKFilterSafePos = function(resource, pos, checkRoad) {
        return (
            pos.isRange7(resource)
            && !pos.inRange5(resource.keeperLair)
            && !pos.isNearEdge
            && (this.pos.isEqualTo(pos) || !pos.lookForCreep())
            && (!checkRoad || !pos.hasRoad)
        );
    }

    Creep.prototype.napSK = function(resource, options) {
        // Shorthand.
        let creep = this;

		let defaults = {
            talk: '🚷'
            , debug: false
            // We are not going to avoid SK resources while we are escaping, since it screws up pathing.
            , avoidSKResources: false
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Naptime. Display custom flag if any.
        creep.talk(options.talk);

        // Find the spot we want to nap on if we aren't there already.
        let napPos = null;
        if (!napPos && creep.moveToPos) {
            napPos = creep.napSKFilterSafePos(resource, creep.moveToPos, false) ? creep.moveToPos : null;
        }
        if (!napPos) {
            napPos = creep.napSKFilterSafePos(resource, creep.pos, true) ? creep.pos : null;
        }
        napPos = napPos ? napPos : creep.pos.findClosestByPath(resource.posOfRange7NotNearEdge, {ignoreCreeps: true, ignoreDestructibleStructures: true, filter: f => creep.napSKFilterSafePos(resource, f, true)});
        creep.moveToPos = napPos;

        // Move to our napping position if we aren't on it already.
        if (napPos && !creep.pos.isEqualTo(napPos)) {
            return creep.smartMove(napPos, options);
        }

        // If there actually isn't a valid spot, then do a normal nap?
        if (!napPos) return creep.nap();

        // No issues with napping.
        return OK;
	}

    Creep.prototype.nap = function(options) {
        // Shorthand.
        let creep = this;
        let room = this.room;

		let defaults = {
			fleeHostiles: false
			, fleeFriendlies: false
            , talk: '💤'
		};
		options = _.defaults({}, _.clone(options), defaults);

        creep.logCreep('nap; entering nap routine');

        // Clear any targets we had.
        creep.clearMemoryTargets();

        // If we have any hostile creeps near us, run away from them.
        if (options.fleeHostiles && RoomIntel.getLethalHostilesTTL(room.name)) {
            if (creep.flee({friendies:false, hostiles:true, range:Config.params.CREEP_IN_DANGER_RANGE})) return true;
        }

        // Naptime. Display custom flag if any.
        creep.talk(options.talk);

        // If we have a colony flag, we will have designated parking spots.
        if (
            (room.colonyFlag || room.templeFlag)
            && room.claimFlag
            && creep.isOnParkingSpot  // This line differs from below.
            && creep.isAllowedToUseColonyParking
        ) {
            // We have arrived. Flag this creeps naptime (not this is in addition to the room level naptime)
            creep.napTime = Game.time;
        }

        // If we are napping in our room, use the parking spots (unless we are building construction sites!)
        else if (
            (room.colonyFlag || room.templeFlag)
            && room.claimFlag
            && room.colonyFirstOpenParkingSpot  // This line differs from above.
            && creep.isAllowedToUseColonyParking
        ) {
            creep.logCreep('nap; mvoing to first colony parking spot');
            return creep.smartMove(room.colonyFirstOpenParkingSpot);
        }

        // Move to rally in the room, just to get out of the way.
        else {
            let napPos = null;

            // Try to use the cached value of the nap position we are shooting for.
            let cacheNapPos = creep.napPos;
            if (cacheNapPos && (cacheNapPos.roomName !== room.name)) cacheNapPos = null;

            // Determine if the cached value is still valid.
            if (cacheNapPos) {
                if (creep.pos.isEqualTo(cacheNapPos) && !cacheNapPos.hasRoad) {
                    napPos = cacheNapPos;
                    creep.logCreep('nap; on cached location', napPos)
                } else if (cacheNapPos.isEnterable) {
                    napPos = cacheNapPos;
                    creep.logCreep('nap; cache is enterable', napPos)
                }
            }

            // Find a suitable spot that isn't on a road.
            if (!napPos) {
                // Get the best posible spot (may be occupied)...
                napPos = GameManager.getRoomMoveToPos(room.name);
                // Now find the spot closest to the best spot and start moving towards it.
                // Since we are going by the positions location, and not this creeps, ignore all creeps or it will find none after first ring is full.
                let closestNapPos = napPos ? GameManager.getRoomMoveToPos(room.name).findClosestByPath(napPos.posInRange8EnterableOffsetDefend.filter(f =>
                    (!room.my || (room.colonyFlag && !f.inRange5(room.colonyFlag)) || (room.templeFlag && !f.inRange5(room.templeFlag)))
                    && !f.inRange3(room.controller)
                    && (!room.my || !f.inRange5(room.controller))
                    && !room.sources.find(source => f.inRange2(source))
                    //&& !room.minerals.find(mineral => f.inRange2(mineral))
                    && (!room.mineral || !room.mineral.pos.inRange2(f))
                    && !f.hasRoad
                ), { ignoreCreeps: true }) : null;
                if (closestNapPos) {
                    napPos = closestNapPos;
                }
                creep.logCreep('nap; finding best new position', napPos)
            }

            // We have found a napping position (nor not), save it to cache.
            //if (napPos) {
                creep.napPos = napPos;
            //}

            // Move to our napping position if we aren't on it already.
            if (napPos && !creep.pos.isEqualTo(napPos)) {
                return creep.smartMove(napPos);
            }
            else {
                // Stay put unless there is another creep right on top of us, in which case flee from them.
                if (options.fleeFriendlies && creep.isNearAnotherCreep) {
                    return creep.flee({friendlies:true});
                }
            }
        }

        return OK;
    }

    Creep.prototype.smartMove = function(target, options = {}) {
        let result = OK;
        if (!target) return result;

        // Don't mess with the original options object.
		// let defaults = {
        //     debug: !!FlagManager.debugFlag
        // };
		// options = _.defaults({}, _.clone(options), defaults);

        if (typeof options.maxRooms === "undefined") {
            // This fixes the edge condition where creeps would constantly move into next room while building near side of map.
            // Apparently it does not stop creeps from moving to another room if that is where their target is, which is great!
            if (this.pos.inSameRoom(target)) {
                options.maxRooms = 1;
                this.logCreep('target in same room, setting maxRooms=1');
            }
        }

        result = this.travelTo(target, options);
        return result;
    }

    Creep.prototype.smartBoost = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = target.boostCreep(this);
        switch (result) {
            case OK:
                this.talk('♨️');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('♨️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartUnboost = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = target.unboostCreep(this);
        switch (result) {
            case OK:
                this.talk('❄️');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('❄️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartExtract = function(target, extractor) {
        let result = ERR_NOT_IN_RANGE;

        // No minerals at this source, so give up.
        let isNearTo = this.pos.isNearTo(target);
        if (extractor.cooldown) {
            result = ERR_TIRED;
        }
        else if (target.mineralAmount) {
            if (isNearTo) result = this.harvest(target);
        }
        else {
            result = ERR_NOT_ENOUGH_RESOURCES;
        }

        switch (result) {
            case OK:
                this.talk('⛏️');
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.talk('🏝️' + (target.ticksToRegeneration - 1));
                if (!isNearTo) {
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                break;
            case ERR_TIRED:
                if (!isNearTo) {
                    this.talk('⛏️' + (extractor.cooldown - 1));
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                else {
                    this.talk('🏝️' + (extractor.cooldown - 1));
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('⛏️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_NO_PATH:
                this.talk('🚫');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

	Object.defineProperty(Room.prototype, 'signMessage', {
		get() {
			if (typeof this._signMessage === "undefined") {
                this._signMessage = null;

                // Can't do anything about Screeps signs, they are perminant...I think.
                if (!this.controller || (this.controller.sign && (this.controller.sign.username === 'Screeps'))) {
                    // Do nothing
                }
                else {
                    let message = "";
                    if (this.my) {
                        message = Config.params.MY_SIGN_OWNED;
                        message += ' M:' + RoomIntel.getMineralType(this.name);
                        if (this.factoryLevel) message += ' F:' + this.factoryLevel;

                    } else if (this.reservedByMeButOtherManagement) {
                        message = Config.params.MY_SIGN_BURN;
                        message += ' M:' + RoomIntel.getMineralType(this.name);

                    } else if (this.myManagement) {
                        message = Config.params.MY_SIGN_RESERVED;
                        message += ' M:' + RoomIntel.getMineralType(this.name);

                    } else if (this.otherMangement) {
                        message = this.controller.sign.text;

                    } else {
                        message = Config.params.MY_SIGN_VISIT;
                        if (!this.isHighwayRoom) message += ' M:' + RoomIntel.getMineralType(this.name);
                    }

                    this._signMessage = message;
                }
			}
			return this._signMessage;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.smartVisitController = function() {
        let result = OK;
        let target = this.room.controller;

        // Bail out if no controller.
        if (!target) return result;

        // Can't do anything about Screeps signs, they are perminant...I think.
        if (target.sign && (target.sign.username === 'Screeps')) return result;

        // Get the correct sign for this room.
        let message = this.room.signMessage;

        if (!target.sign || !target.sign.text || (target.sign.text !== message)) {
            result = this.signController(target, message)
            switch (result) {
                case OK:
                    this.talk('💋');
                    break;
                case ERR_NOT_IN_RANGE:
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                    break;
                default:
                    this.talk(result + '⁉️');
                    break;
            }
        }
        return result;
    }

    Creep.prototype.smartAttackController = function(target, moveOnly = false) {
        let result = ERR_NOT_IN_RANGE;

        if (!moveOnly && this.pos.isNearTo(target)) result = this.attackController(target);
        switch (result) {
            case OK:
                this.talk('⚔️');
                break;
            case ERR_TIRED:
                this.talk('💦')
                break;
            case ERR_NOT_IN_RANGE:
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartClaimController = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.claimController(target);
        switch (result) {
            case OK:
                this.talk('⚔️');
                break;
            case ERR_TIRED:
                this.talk('💦')
                break;
            case ERR_NOT_IN_RANGE:
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_GCL_NOT_ENOUGH:
                // No way to determine if GCL is high enough across shards, so don't consider this an error for now.
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartReserveController = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.reserveController(target);
        switch (result) {
            case OK:
                this.talk('✨');
                break;
            case ERR_TIRED:
                this.talk('💦')
                break;
            case ERR_NOT_IN_RANGE:
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartHarvest = function(target) {
        let result = ERR_NOT_IN_RANGE;

        // No energy at this source, so give up.
        let isNearTo = this.pos.isNearTo(target);
        if (target.energy) {
            if (isNearTo) result = this.harvest(target);
        }
        else
            result = ERR_NOT_ENOUGH_RESOURCES;

        switch (result) {
            case OK:
                this.talk('⛏️');
                break;
            case ERR_NOT_OWNER:
                this.talk('🚫');
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.talk('🏝️' + (target.ticksToRegeneration - 1));
                if (!isNearTo) {
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('⛏️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartDeposit = function(target) {
        let result = ERR_NOT_IN_RANGE;

        // If target has a cooldown, hang tight.
        let isNearTo = this.pos.isNearTo(target);
        if (!target.cooldown) {
            if (isNearTo) result = this.harvest(target);
        }
        else
            result = ERR_NOT_ENOUGH_RESOURCES;

        switch (result) {
            case OK:
                this.talk('⛏️');
                break;
            case ERR_NOT_OWNER:
                this.talk('🚫');
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.talk('🏝️' + (target.cooldown - 1));
                if (!isNearTo) {
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('⛏️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartRecycle = function() {
        let result = ERR_NOT_IN_RANGE;

        // Not sure best error code, but bail out.
        if (!this.room.colonySpawn1) return ERR_INVALID_TARGET;
        let target = this.room.colonySpawn1;

        // Note that this is somewhat backwards. The spawn renews the creep.
        if (this.pos.isNearTo(target)) result = target.recycleCreep(this);

        switch (result) {
            case OK:
                this.talk('💀');
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                this.talk('🚫');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('💀');
                if (this.moveParts) this.smartMove(target);
                break;
            case ERR_BUSY:
                this.talk('🚫');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartRenew = function(moveTocolonyRenewPos = true) {
        let result = ERR_NOT_IN_RANGE;
        let result2 = ERR_NOT_IN_RANGE;
        let result3 = ERR_NOT_IN_RANGE;

        let target = this.room.colonySpawn1;
        let target2 = this.room.colonySpawn2;
        let target3 = this.room.colonySpawn3;

        // Not sure best error code, but bail out.
        if (!target && !target2 && !target3) return ERR_INVALID_TARGET;

        // Note that this is somewhat backwards. The spawn renews the creep.
        if (target && target.pos.isNearTo(this)) {
            result = !target.spawning ? target.renewCreep(this) : ERR_BUSY;
        }

        // We can attempt to renew the creep from all nearby spawns.
        if (target2 && target2.pos.isNearTo(this)) {
            result2 = !target2.spawning ? target2.renewCreep(this) : ERR_BUSY;
        }

        // We can attempt to renew the creep from all nearby spawns.
        if (target3 && target3.pos.isNearTo(this)) {
            result3 = !target3.spawning ? target3.renewCreep(this) : ERR_BUSY;
        }

        // If the primary failed, use the results from the 2nd/3rd spawn.
        if (![OK, ERR_FULL].includes(result) && target2) {
            result = result2;
        }
        if (![OK, ERR_FULL].includes(result) && target3) {
            result = result3;
        }

        // Some creeps know they can't move, so save some CPU by bypassing move logic for them.
        let colonyRenewPos = null;
        if (moveTocolonyRenewPos) {
            colonyRenewPos = this.room.colonyRenewPos;
            if (colonyRenewPos && !this.pos.isEqualTo(colonyRenewPos)) this.smartMove(colonyRenewPos);
        }

        switch (result) {
            case OK:
                this.talk('♻️' + (CREEP_LIFE_TIME - this.ticksToLive));
                // Still need to move, as we may not actually be in the official renew position.
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                this.talk('🚫');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('♻️');
                break;
            case ERR_FULL:
                // All full, not an error really, so don't show default questionmark.
                // Possibly could calculate when to stop better, but meh.
                break;
            case ERR_BUSY:
                this.talk('🚫');
                break;
            case ERR_RCL_NOT_ENOUGH:
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }

        // We MUST be on the colony renew spot to get an accurate result.
        // Walking to the spot we might get some free renews in and if they are busy spawning, we could get a false result.
        // Do this check last just so we can get some nice icons above.
        if (moveTocolonyRenewPos && colonyRenewPos && !this.pos.isEqualTo(colonyRenewPos)) result = ERR_NOT_IN_RANGE;

        return result;
    }

    Creep.prototype.smartWithdraw = function(target, resourceType, amount = Math.min(this.store.getFreeCapacity(), target.store.getUsedCapacity(resourceType))) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) {
            if (amount === 0) {
                result = ERR_NOT_ENOUGH_RESOURCES;
            }
            else if (target instanceof Creep) {
                result = this.smartHandoff(target, resourceType, amount)
            }
            else {
                result = this.withdraw(target, resourceType, amount);
            }
        }
        switch (result) {
            case OK:
                this.talk('🔋');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🔋');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.talk('🚫');
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartGather = function(target, resourceType, amount = undefined) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target) && resourceType && target.store[resourceType]) {
            result = this.withdraw(target, resourceType, amount);
        }

        switch (result) {
            case OK:
                this.talk('🚚');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚚');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.talk('🚫');
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartCollect = function(target, resourceType, amount = Math.min(this.store.getFreeCapacity(), target.store[resourceType])) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.withdraw(target, resourceType, amount);
        switch (result) {
            case OK:
                this.talk('🚛');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚛');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartAssigned = function(target, resourceType, amount = Math.min(this.store[resourceType], target.store.getFreeCapacity(resourceType))) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.transfer(target, resourceType, amount);
        switch (result) {
            case OK:
                this.talk('💎');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('💎');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartStorage = function(target, resourceType, amount) {
        let result = ERR_NOT_IN_RANGE;

        if (typeof amount === "undefined") {
            amount = Math.min(this.store.getUsedCapacity(resourceType), target.store.getFreeCapacity(resourceType))
        }

        if (this.pos.isNearTo(target)) result = this.transfer(target, resourceType, amount);
        switch (result) {
            case OK:
                this.talk('🛢️');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🛢️');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartTransfer = function(target, resourceType, amount, moveOnly = false) {
        let result = ERR_NOT_IN_RANGE;

        // Are we only moving?
        if (moveOnly) {
            if (amount === 0) {
                this.talk('🌩️');
            } else {
                this.talk('⚡');
            }
            if (!this.pos.isNearTo(target)) {
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
            }
            return ERR_NOT_IN_RANGE;
        }

        if (this.pos.isNearTo(target)) {
            if (amount === undefined) {
                amount = Math.min(this.store[resourceType], target.store.getFreeCapacity(resourceType))
            }
            result = this.transfer(target, resourceType, amount);
        }

        switch (result) {
            case OK:
                this.talk('⚡');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('⚡');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartHandoff = function(target, resourceType, amount, options = {}) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) {
            if (amount === undefined) {
                amount = Math.min(target.store[resourceType], this.store.getFreeCapacity(resourceType))
            }
            // Note this is REVERSE then normal. The target is transfering to us.
            result = target.transfer(this, resourceType, amount);
        }

        switch (result) {
            case OK:
                this.talk('🏈');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🏈');
                if (this.smartMove(target, options) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartGive = function(target, resourceType, amount, options = {}) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) {
            if (amount === undefined) {
                amount = Math.min(this.store[resourceType], target.store.getFreeCapacity(resourceType))
            }
            // Note this is NORMAL. We are transfering to target.
            result = this.transfer(target, resourceType, amount);
        }

        switch (result) {
            case OK:
                this.talk('🏉');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🏉');
                if (this.smartMove(target, options) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_FULL:
                this.talk('🤑');
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartDismantle = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.dismantle(target);
        switch (result) {
            case OK:
                this.talk('🪓');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🪓');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartBuild = function(target, getClose = false, moveTo = target) {
        let result = ERR_NOT_IN_RANGE;

        if (!target || !moveTo) return result;

        if (this.pos.inRange3(target)) result = this.build(target);
        switch (result) {
            case OK:
                if (!target.pos.isEqualTo(moveTo) && !this.pos.isEqualTo(moveTo)) {
                    this.smartMove(moveTo);
                }
                else if (getClose) {
                    if (this.isNearAnotherCreep) {
                        this.inchForward(moveTo, 1)
                    }
                }
                this.talk('🚧');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚧');
                this.smartMove(moveTo);
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartRepair = function(target, getClose = false, moveTo = target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.inRange3(target)) result = this.repair(target);
        switch (result) {
            case OK:
                if (!target.pos.isEqualTo(moveTo) && !this.pos.isEqualTo(moveTo)) {
                    this.smartMove(moveTo);
                }
                else if (getClose) {
                    if (!this.pos.inRange4Edge && this.isNearAnotherCreep) {
                        this.inchForward(target, 1)
                    } else if (this.pos.inRange2Edge && this.isNearAnotherCreep && !this.pos.isNearTo(moveTo)) {
                        this.smartMove(moveTo);
                    }
                }
                this.talk('🔧');  // 🔧🛠️
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🔧');
                this.smartMove(moveTo);
                break;
            case ERR_NO_BODYPART:
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

	Object.defineProperty(Creep.prototype, 'smartUpgradePosFindNearBy', {
		get() {
			if (typeof this._smartUpgradePosFindNearBy === "undefined") {
                // Note NOT guarenteed to get the best spot, if entering into range3 from a weird angle.
				this._smartUpgradePosFindNearBy = this.room.controllerUpgradePositionsSorted.find(f =>
                    this.pos.inRange1(f)
                    && (this.pos.isEqualTo(f) || !f.lookForCreep())
                );

                if (!this._smartUpgradePosFindNearBy) this._smartUpgradePosFindNearBy = null;
			}
			return this._smartUpgradePosFindNearBy;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'smartUpgradePosFindFirst', {
		get() {
			if (typeof this._smartUpgradePosFindFirst === "undefined") {
                // Once we get close range 5 to controller, look for the nearest spot to settle down in.
                if (!this._smartUpgradePosFindFirst && this.pos.inRange5(this.room.controller)) {
                    this._smartUpgradePosFindFirst = this.room.controllerUpgradePositionsSorted.find(f =>
                        (
                            this.pos.isEqualTo(f)
                            || (this.pos.inRange2(f) && !f.lookForCreep())
                        )
                        && this.pos.findClosestByPath([f])
                    );
                }

                // Try to find any of our upgrade spots that doesn't have a creep and we can get to it.
                if (!this._smartUpgradePosFindFirst) {
                    this._smartUpgradePosFindFirst = this.room.controllerUpgradePositionsSorted.find(f =>
                        !f.lookForCreep()
                        && this.pos.findClosestByPath([f])
                    );
                }

                // Temples will try to get creeps to stay near the stores.
                if (this.room.isTemple) {
                    this._smartUpgradePosFindFirst = this.room.controllerPosTempleDry.find(f =>
                        (
                            this.pos.isEqualTo(f)
                            || !f.lookForCreep()
                        )
                        && this.pos.findClosestByPath([f])
                    );
                }

                // Find any position not yet taken. Early game when there won't be many stores up.
                if (!this._smartUpgradePosFindFirst) {
                    this._smartUpgradePosFindFirst = this.room.controllerPosInRange3NotBlockedByObjectSorted.find(f =>
                        (
                            this.pos.isEqualTo(f)
                            || !f.lookForCreep()
                        )
                        && this.pos.findClosestByPath([f])
                    );
                }

                if (!this._smartUpgradePosFindFirst) this._smartUpgradePosFindFirst = null;
			}
			return this._smartUpgradePosFindFirst;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'smartUpgradeNonPosFindFirst', {
		get() {
			if (typeof this._smartUpgradeNonPosFindFirst === "undefined") {
                this._smartUpgradeNonPosFindFirst = this.room.nonControllerUpgradePositionsSorted.find(f =>
                    (
                        this.pos.isEqualTo(f)
                        || (this.pos.inRange1(f) && !f.lookForCreep())
                    )
                    && this.pos.findClosestByPath([f])
                );

                if (!this._smartUpgradeNonPosFindFirst) this._smartUpgradeNonPosFindFirst = null;
			}
			return this._smartUpgradeNonPosFindFirst;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.smartUpgrade = function() {
        let result = ERR_NOT_IN_RANGE;
        let move = true;

        // Set the target.
        let target = this.room.controller;

        // When in range, perform the upgrade.
        if (this.pos.getRangeTo(target) <= 3) {
            result = this.upgradeController(target);
            if (Game.time % Config.params.SMART_UPGRADE_TICK_MOD !== 0) move = false;
        }

        // Search our ordered list of positions finding the best position or stop at our own.
        // Has to be near our current spot so we are just shifting. Otherwise creeps end up walking all over the place.
        let upgradePos = null

        // Only going to move on a specific tick, wasteful otherwise.
        if (move) {
            if (target.level === 8) upgradePos = this.room.myControllerLinkUpgradePos;
            if (!upgradePos && (this.pos.getRangeTo(target) <= 3)) upgradePos = this.smartUpgradePosFindNearBy;
            if (!upgradePos) upgradePos = this.smartUpgradePosFindFirst;
            if (!upgradePos) upgradePos = this.smartUpgradeNonPosFindFirst;
        }
        else {
            upgradePos = this.pos;
        }

        switch (result) {
            case OK:
                this.talk('🔆');
                // Improve on our position to upgrade.
                if (upgradePos && !this.pos.isEqualTo(upgradePos)) {
                    this.smartMove(upgradePos);
                }
                // Move closer to the target.
                else if (this.pos.getRangeTo(target) > 3) {
                    this.smartMove(target);
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🔆');
                if (upgradePos) {
                    if (this.smartMove(upgradePos) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                else {
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                this.talk('🚫');
                // Improve on our position to upgrade.
                if (upgradePos) {
                    this.smartMove(upgradePos);
                }
                // Move closer to the target.
                else if (this.pos.getRangeTo(target) > 3) {
                    this.smartMove(target);
                }
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartGenerateSafeMode = function() {
        let result = ERR_NOT_IN_RANGE;

        // Bail out if not my controller.
        if (!this.room.my) { return result; }

        // Set the target.
        let target = this.room.controller;

        if (this.pos.isNearTo(target)) result = this.generateSafeMode(target);
        switch (result) {
            case OK:
                this.talk('🌀');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🌀');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartPickup = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.pickup(target);
        switch (result) {
            case OK:
                this.talk('💍');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('💍');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartPull = function(target) {
        let result = ERR_NOT_IN_RANGE;

        if (this.pos.isNearTo(target)) result = this.pull(target);
        switch (result) {
            case OK:
                this.talk('🚕');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚕');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartDrop = function(resourceType) {
        let result = ERR_NOT_ENOUGH_RESOURCES;

        if (resourceType === undefined) {
            resourceType = _.findKey(this.store);
        }

        if (this.store.getUsedCapacity()) {
            // Otherwise, just drop everything.
            result = this.drop(resourceType);
            this.talk('💰');
        }
        return result;
    }

    Creep.prototype.smartAttack = function(target, moveTo = false) {
        let result = ERR_NOT_IN_RANGE;

        // Hmm...why is this hear?
        this.memory.stickyTargetId = target.id;

        if (this.pos.isNearTo(target)) result = this.attack(target);
        switch (result) {
            case OK:
                if (moveTo) this.smartMove(target);
                this.talk('⚔️');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚓');
                if (moveTo && (this.smartMove(target) === ERR_NO_PATH)) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartRangedAttack = function(target, moveTo = false) {
        let result = ERR_NOT_IN_RANGE;

        // Hmm...why is this hear?
        this.memory.stickyTargetId = target.id;

        if (this.pos.isNearTo(target)) result = target.owner ? this.rangedMassAttack() : this.rangedAttack(target);
        switch (result) {
            case OK:
                if (moveTo) this.smartMove(target);
                this.talk('⚔️');
                break;
            case ERR_NOT_IN_RANGE:
                this.talk('🚓');
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    Creep.prototype.smartHeal = function(target, moveTo = true) {
        let result = ERR_NOT_IN_RANGE;
        let action = '🚑';

        if (this.pos.isNearTo(target)) {
            result = this.heal(target);
            action = '🩹';
        }
        else if (this.pos.inRange3(target)) {
            result = this.rangedHeal(target);
            action = '💉'
        }
        switch (result) {
            case OK:
                this.talk(action);
                // Always attempt to move to target, in case we are both traveling together.
                // Unless its yourself, then don't move obviously.
                if (moveTo && !this.pos.isEqualTo(target)) {
                    if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                }
                break;
            case ERR_NOT_IN_RANGE:
                this.talk(action);
                if (moveTo && (this.smartMove(target) === ERR_NO_PATH)) result = ERR_NO_PATH;
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    // Seasonal.
    Creep.prototype.smartClaimReactor = function(target) {
        let result = ERR_NOT_IN_RANGE;

        //if (this.pos.isNearTo(target)) result = this.claimReactor(target);
        switch (result) {
            case OK:
                this.talk('⚔️');
                break;
            case ERR_TIRED:
                this.talk('💦')
                break;
            case ERR_NOT_IN_RANGE:
                if (this.smartMove(target) === ERR_NO_PATH) result = ERR_NO_PATH;
                break;
            case ERR_GCL_NOT_ENOUGH:
                // No way to determine if GCL is high enough across shards, so don't consider this an error for now.
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

}
