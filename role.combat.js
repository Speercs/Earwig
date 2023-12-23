"use strict";

module.exports = function() {

	Object.defineProperty(Creep.prototype, 'healLongRanged', {
		get() {
            if (this.memory.healLongRangedId) {
                let target = Game.getObjectById(this.memory.healLongRangedId);
                if (target && this.pos.inSameRoom(target) && target.isDamaged) return target;
                //if (target && target.isDamaged && target.pos.inSameRoom(this.workRoom)) return target;
                //if (target) return target;
                delete this.memory.healLongRangedId;
            }
            return null;
        },
        set(value) {
            if (value) {
                this.memory.healLongRangedId = value.id;
            }
            else {
                delete this.memory.healLongRangedId;
            }
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(Creep.prototype, 'shouldRetreatFromHostilesInRoute', {
        get() {
            if (this._shouldRetreatFromHostilesInRoute === undefined) {
                this._shouldRetreatFromHostilesInRoute = GameManager.haltDefend;

                if (!this._shouldRetreatFromHostilesInRoute) {
                    this._shouldRetreatFromHostilesInRoute = this.isGuardianCreep && !this.room.my && !this.isBoosted;

                    if (this._shouldRetreatFromHostilesInRoute) {
                        let friendlyCombatPower = 0;
                        let nextRoom = GameManager.getNextRoomInRoute(this.room.name, this.workRoom);
                        if (nextRoom && Game.rooms[nextRoom]) friendlyCombatPower += Game.rooms[nextRoom].friendlyCombatPower;

                        if (nextRoom) {
                            this._shouldRetreatFromHostilesInRoute = this.room.friendlyCombatPower + friendlyCombatPower < RoomIntel.getHostileCombatPower(nextRoom);
                        }
                    }
                }
            }
            return this._shouldRetreatFromHostilesInRoute;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myBestHealer', {
		get() {
			if (typeof this._myBestHealer === "undefined") {
				this._myBestHealer = _.sortByOrder(this.myHealerCreeps, [
					sortHealPartsActive => -sortHealPartsActive.healPartsActive
					//, sortDamaged => sortDamaged.hitsMax - sortDamaged.hits
				])[0];
			}
			return this._myBestHealer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'isBestHealer', {
		get() {
			if (typeof this._isBestHealer === "undefined") {
				this._isBestHealer = this.room.myBestHealer && this.healPartsActive && (this.room.myBestHealer.healPartsActive === this.healPartsActive);
			}
			return this._isBestHealer;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myHealerCreeps', {
		get() {
			if (typeof this._myHealerCreeps === "undefined") {
				// Has to be spawned so wounded creeps can move to it for heals.
				this._myHealerCreeps = this.myCreepsNotSpawning.filter(f => f.healPartsActive && (f.task === Config.tasks.COMBAT));
			}
			return this._myHealerCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myCombatCreeps', {
		get() {
			if (typeof this._myCombatCreeps === "undefined") {
				// Has to be spawned so wounded creeps can move to it for heals.
				this._myCombatCreeps = this.myCreepsNotSpawning.filter(f => f.hasLethalParts);
			}
			return this._myCombatCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Room.prototype, 'myMeleeCreeps', {
		get() {
			if (typeof this._myMeleeCreeps === "undefined") {
				this._myMeleeCreeps = this.myCombatCreeps.filter(f => f.attackParts);
			}
			return this._myMeleeCreeps;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(Creep.prototype, 'hasStrongerFriendlyCombatCreepInRange2NotOnRampart', {
		get() {
			if (typeof this._hasStrongerFriendlyCombatCreepInRange2NotOnRampart === "undefined") {
				this._hasStrongerFriendlyCombatCreepInRange2NotOnRampart = this.room.myCombatCreeps.find(f => f.pos.inRange2(this) && (f.lethalPower > this.lethalPower) && !f.pos.hasRampartHits);
			}
			return this._hasStrongerFriendlyCombatCreepInRange2NotOnRampart;
		},
		configurable: true, enumerable: true,
	});

    Creep.prototype.findHealData = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let data = {};
        let healSelf = null;
        let healNearBy = null;
        let healRanged = null;
        let healLongRanged = null;
        let healReflect = null;

        // Priest code. Find any friendly creeps in range of healing.

        // Find a heal target unless we are in a room with friendly (heal) towers and no enemies.
        // Healing not allowed in hostile room in safe mode.
        // No need to check for healPartsActive as you will be DEAD as heal parts are always last.
        //if (creep.healParts && (creep.isDamaged || !room.myTowers.length || creep.rangedAttackParts) && !room.hostileSafeMode) {

        if (
            creep.healParts
            //&& (creep.isDamaged || !room.myTowers.length || creep.rangedAttackParts)
            && (room.myWounded.length || RoomIntel.getLethalRoom(room.name))
            && !room.hostileSafeMode
        ) {

            // If I have armor, heal myself.
            if (!healNearBy && creep.isDamaged && creep.toughParts) {
                healNearBy = creep;;
            }

            // Duo takes precidence.
            if (!healNearBy && creep.duo && creep.pos.isNearTo(creep.duo) && (creep.duo.damage > creep.damage)) {
                // Most import to heal yourself once taking damage. Everything else is irrelevant.
                healNearBy = creep.duo;
            }

            // Find primary heal target.
            if (!healNearBy && creep.isQuarterDamaged) {
                // Most import to heal yourself once taking big damage. Everything else is irrelevant.
                healNearBy = creep;
            }

            // I'm likely to take more than half damage, so heal now otherwise in 2 ticks I'll be dead.
            if (!healNearBy && creep.potentiallyTakingHalfToughDamage) {
                healNearBy = creep;
                healSelf = creep;
            }

            // // Prioritize myself if I'm known to be the target of a stronghold.
            // if (!healNearBy && room.isSKRoom && room.invaderStronghold && !room.myCreeps.find(f => (f.id !== creep.id) && (f.pos.getRangeTo(room.invaderStronghold) < creep.pos.getRangeTo(room.invaderStronghold)))) {
            //     // Most import to heal yourself once taking damage. Everything else is irrelevant.
            //     healNearBy = creep;
            //     healSelf = creep;
            // }

            // Prioritize those without armor, as armor is buffed and those without armor will be taking more damage.
            if (!healNearBy) {
                // Find nearby direct heals. 12 points of heal.
                healNearBy = _.sortBy(creep.myWoundedNearBy, s => -s.damage)[0];
            }

            if (!healNearBy && !healRanged) {
                // Find ranged heals. 4 points of heal.
                healRanged = _.sortBy(creep.myWoundedAtArea3, s => -s.damage)[0];
            }

            // Find a friendly that could use a pre-heal. This includes ourself, and orders by closest.
            if (!healNearBy && !healRanged) {
                let friendly = creep.friendlyCloseBySorted.find(f => f.takingDamage);
                if (friendly) {
                    if (creep.pos.isNearTo(friendly)) {
                        healNearBy = friendly;
                    } else {
                        healRanged = friendly;
                    }
                }
            }

            // No immediate need to heal anyone, and in dangerous room so heal self.
            if (!healNearBy && !healRanged && creep.incomingDamage) {
                healNearBy = creep;
                healSelf = creep;
            }

            // Try to use the cached long range heal.
            if (!healNearBy && !healRanged && creep.healLongRanged && creep.healLongRanged.isDamaged) {
                healLongRanged = creep.healLongRanged
            }
            if (!healLongRanged) {
                // Clear the cache if we have someone in range that needs to be healed.
                // This could give a better target next time.
                creep.healLongRanged = null;
            }

            // We can heal others if we are in our work room and its not dangerous to do so.
            if (!healNearBy && !healRanged && !healLongRanged && !room.isSKRoom && creep.myWoundedNotNearEdgeSameWorkRoom.length) {
                healLongRanged = creep.pos.findClosestByPath(creep.myWoundedNotNearEdgeSameWorkRoom);
                creep.healLongRanged = healLongRanged;
            }

            // We can heal others if we are in our work room and its not dangerous to do so.
            if (!healNearBy && !healRanged && !healLongRanged && !room.isSKRoom && RoomIntel.getLethalRoom(room.name) && room.myCombatCreeps.filter(f => (creep.workRoom === f.workRoom)).length) {
                healLongRanged = creep.pos.findClosestByPath(room.myCombatCreeps.filter(f => (creep.workRoom === f.workRoom)));
                creep.healLongRanged = healLongRanged;
            }

        }

        // If we have heal parts, we can always heal ourselves if needed.
        if (creep.healParts) {
            healReflect = creep;
        }

        // Set our return data.
        data.healSelf = healSelf;
        data.healNearBy = healNearBy;
        data.healRanged = healRanged;
        data.healLongRanged = healLongRanged;
        data.healReflect = healReflect;

        // Return our data object.
        return data;
    }

    Creep.prototype.findHostileTarget = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let data = {};
        let hostileTarget = null;

        // Get our combat flag.
        let flag = null //creep.combatFlag;

        // Verify that we can see the flag for finding hostiles.
        if (flag && !Game.rooms[flag.pos.roomName]) flag = null;

        // If we are in a hostile room with hostile safe mode enabled, nothing is attackable.
        if (room.hostileSafeMode) {
            // Reset and start over.
            creep.clearStickyTarget();
            return data;
        }

        // The ranged attackers can ignore creeps. Leaders too while room is dangerous.
        // After that they are just busting down structures, and its easy to get blocked by friendlies.
        let ignoreCreeps = creep.rangedAttackParts || (creep.isTeamLeader && room.isDangerousRoom);

        // Normal case, we are solo or the leader, with damage parts.
        if (
            creep.attackParts
            || creep.workParts
            || creep.rangedAttackParts
        ) {
            // Clear our sticky target every X ticks so we don't get stuck banging on a wall thats already broken thru, or a runner creep.
            if (
                // Only reset if we are in our workroom. Its possible we are resetting to another perimeter position and traveling a distance.
                (!creep.inWorkRoom || (Game.time % Config.params.ATTACK_RETARGET_MOD !== 0))
                && creep.stickyTarget
                && (creep.stickyTarget.pos.roomName === creep.workRoom)
                //&& creep.stickyTargetPos
                //&& creep.stickyTargetPos.isNearTo(creep.stickyTarget)
            ) {
                // Start by looking at the sticky target we may already have found.
                // Note that in the case of a creep, it will likely move. But we don't want to invalidate our target
                // and look for a new one (which is expensive) unless it has moved out of range of where we were already headed.
                hostileTarget = creep.stickyTarget;
            }
            else {
                // Reset and start over.
                let message = 'stickyTarget:' + creep.stickyTarget;
                if (creep.stickyTarget) message += ' stickyTargetPos:' + creep.stickyTargetPos;
                if (creep.stickyTargetPos) message += ' isNearTo:' + creep.stickyTargetPos.isNearTo(creep.stickyTarget);
                message += ' retargetMod:' + (!creep.inWorkRoom || (Game.time % Config.params.ATTACK_RETARGET_MOD !== 0));
                creep.logCreep('clearStickyTarget: ' + message);
                creep.clearStickyTarget();
            }

            // None of this matters at all if we aren't in the room we are supposed to be in.
            if (!hostileTarget && creep.inWorkRoom) {

                // HOSTILE STRUCTURES, NO RAMPARTS
                // Target structures first, as they don't run away from us and does more long term damage!
                if (!room.my && !room.hasMyNonControllerStructures && room.hasHostileStructures) {
                    // Going to exclude the rare case where we own/reserve a room with hostile structures in them.
                    // These should be looted, and can be destroyed in code not by creep.
                    // if (room.isSKRoom) {
                    //     if (!hostileTarget && room.invaderStronghold && creep.hasLethalParts) {
                    //         hostileTarget = creep.pos.findClosestByPath([room.invaderStronghold], { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                    //         if (hostileTarget) creep.logCreep('hostileTarget finding hostile invader stronghold not under ramparts: ' + hostileTarget)
                    //     }
                    // }

                    if (!room.myProperty) {
                        // Look for easy targets not under ramparts first.
                        if (!hostileTarget) {
                            hostileTarget = creep.pos.findClosestByPath(room.hostileSpawns, { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile spawns not under ramparts: ' + hostileTarget)
                        }
                        if (!hostileTarget) {
                            hostileTarget = creep.pos.findClosestByPath(room.hostileSpawns, { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile spawns not under ramparts: ' + hostileTarget)
                        }
                        if (!hostileTarget) {
                            hostileTarget = creep.pos.findClosestByPath(room.hostileTowers, { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits });
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile towers not under ramparts: ' + hostileTarget)
                        }

                        // It's a HARD choice to kill storage/terminal if they have loot in them...could lose millions of credits from a single melee scout in the room.
                        if (!hostileTarget && room.hostileStorage && (room.hostileStorage.storeEmpty || RoomIntel.getLethalRoom(room.name))) {
                            hostileTarget = creep.pos.findClosestByPath([room.hostileStorage], { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile storage not under ramparts: ' + hostileTarget)
                        }
                        if (!hostileTarget && room.hostileTerminal && (room.hostileTerminal.storeEmpty || RoomIntel.getLethalRoom(room.name))) {
                            hostileTarget = creep.pos.findClosestByPath([room.hostileTerminal], { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile terminal not under ramparts: ' + hostileTarget)
                        }

                        if (!hostileTarget && !creep.workParts) {
                            hostileTarget = creep.pos.findClosestByPath(room.attackableHostileStructures, { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits });
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile attackable structures not under ramparts: ' + hostileTarget)
                        }
                        if (!hostileTarget && creep.workParts) {
                            hostileTarget = creep.pos.findClosestByPath(room.dismantlableHostileStructures, { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits });
                            if (hostileTarget) creep.logCreep('hostileTarget finding hostile dismantlable structures not under ramparts: ' + hostileTarget)
                        }
                    }
                }

                if (!hostileTarget && RoomIntel.getInvaderCore(room.name) && creep.hasLethalParts) {
                    hostileTarget = creep.pos.findClosestByPath([room.invaderCore], { ignoreCreeps: ignoreCreeps, filter: (f) => !f.pos.hasRampartHits })
                    if (hostileTarget) creep.logCreep('hostileTarget finding invader core not under ramparts: ' + hostileTarget)
                }

            }

            // HOSTILE CREEPS
            // If this creep is in a room in my control, find priority hostile targets from the creep to attack.
            // Note that we are NOT ignoringCreeps, as this is just finding a target. Moving to the target will we use smartMove.
            if (!hostileTarget && creep.inWorkRoom && room.hostiles.length && creep.hasLethalParts) {

                // When defending a highway resource, only attack hostiles that come close to our precious area.
                // Got yelled at for attacking everyone indescriminately.
                if (room.isHighwayRoom) {
                    // If we have lethal hostiles that are closer to our exit than we are, they become the target.
                    if (!hostileTarget && creep.exitToClosestSafeControllerRoom && room.lethalPlayerHostiles.length) {
                        hostileTarget = creep.exitToClosestSafeControllerRoom.findClosestByPath(room.lethalPlayerHostiles.filter(f => creep.shouldAttack(f)), {
                            ignoreCreeps: ignoreCreeps
                        });

                        if (hostileTarget) creep.logCreep('hostileTarget finding lethal player closest to safe exit: ' + hostileTarget);
                    }

                    if (!hostileTarget && creep.focusTarget) {
                        hostileTarget = creep.focusTarget.pos.findClosestByRange(room.hostiles.filter(f => f.pos.inRangeTo(creep.focusTarget, Config.params.HIGHWAY_DEFEND_RANGE) && creep.shouldAttack(f)), {
                            ignoreCreeps: ignoreCreeps
                        });
                        if (hostileTarget) creep.logCreep('hostileTarget finding focusTarget hostiles in highway: ' + hostileTarget);
                    }

                    // Blood is on the ground, everyone is fair game!
                    if (!hostileTarget && (room.tombstones.length || room.droppedResources.length)) {
                        hostileTarget = creep.pos.findClosestByPath(room.hostiles.filter(f => creep.shouldAttack(f)), { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding hostiles in highway because droppings are out: ' + hostileTarget);
                    }

                    // We want to attack screeps, they have great loot!
                    // Attack the ranged screeps at the end of the train first.
                    // Then the carry screeps will be easy pickings.
                    // No need to kill the melee or healer screeps at the front of the train, other than for sport.
                    if (!hostileTarget && room.screeps.length) {
                        hostileTarget = creep.pos.findClosestByRange(room.screeps.filter(f => creep.shouldAttack(f) && f.rangedAttackParts), { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding ranged screeps in highway: ' + hostileTarget);
                    }

                    if (!hostileTarget && room.screeps.length) {
                        hostileTarget = creep.pos.findClosestByRange(room.screeps.filter(f => creep.shouldAttack(f) && !f.hasLethalParts), { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding healer screeps in highway: ' + hostileTarget);
                    }

                    if (!hostileTarget && room.screeps.length) {
                        hostileTarget = creep.pos.findClosestByRange(room.screeps.filter(f => creep.shouldAttack(f)), { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding any screeps in highway: ' + hostileTarget);
                    }

                }
                else if (room.isSKRoom) {
                    // Ignore 'Source Keeper' owner creeps. But could have invaders/players. Ignore heal-only invaders.
                    if (!hostileTarget) {
                        hostileTarget = creep.pos.findClosestByPath(room.nonSourceKeeperHostiles.filter(f => !f.isHealOnlyInvader && creep.shouldAttack(f) && !f.pos.hasRampartHits), { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding non-sourcekeeper hostiles: ' + hostileTarget);
                    }

                    // // Once all invader structures are down, then proceed to kill source keepers while we are here.
                    // if (!hostileTarget && creep.inWorkRoom && !room.invaderStructures.length && !room.nonSourceContainers.length) {
                    //     hostileTarget = creep.pos.findClosestByPath(room.sourceKeepers.filter(f => creep.shouldAttack(f)), { ignoreCreeps: ignoreCreeps });
                    //     if (hostileTarget) creep.logCreep('hostileTarget finding source keepers: ' + hostileTarget);
                    // }

                }
                else {
                    // Find hostile creeps, excluding those hiding in ramparts.

                    // Do we have anyone in immedate range? Hoping to save some CPU?
                    if (!hostileTarget) {
                        let unprotectedHostilesNearBy = creep.hostilesNearBy.filter(f => f.isDamaged && !f.isHealOnlyInvader && creep.shouldAttack(f) && !f.pos.hasRampartHits);
                        // Attack support creeps first, as melee creeps will cause us reflective damage.
                        hostileTarget = _.sortBy(unprotectedHostilesNearBy, s => s.attackParts).find(x => x !== undefined);
                        if (hostileTarget) creep.logCreep('hostileTarget finding nearby damaged hostiles: ' + hostileTarget);
                    }

                    // Do we have anyone in range? Only works for ranged attackers.
                    if (!hostileTarget && creep.rangedAttackParts) {
                        let unprotectedHostilesAtArea3 = creep.hostilesInRange3.filter(f => f.isDamaged && !f.isHealOnlyInvader && creep.shouldAttack(f) && !f.pos.hasRampartHits);
                        // Attack support creeps first, as melee creeps will cause us reflective damage.
                        hostileTarget = _.sortBy(unprotectedHostilesAtArea3, s => s.hits - s.hitsMax).find(x => x !== undefined);
                        if (hostileTarget) creep.logCreep('hostileTarget finding range3 damaged hostiles: ' + hostileTarget);
                    }

                    // Do we have anyone in range? Only works for ranged attackers.
                    if (!hostileTarget && room.my) {
                        hostileTarget = creep.pos.findClosestByPath(room.hostiles.filter(f => creep.shouldAttack(f)), {
                            ignoreCreeps: ignoreCreeps
                        });
                        if (hostileTarget) creep.logCreep('hostileTarget finding closest hostile in my room: ' + hostileTarget);
                    }

                    // Finding by path, so that we can actually GET to the target. May be behind a wall.
                    // Unfortunately since creeps can move, we have to find this on each tick.  Yuk!
                    if (!hostileTarget && creep.exitToClosestSafeControllerRoom) {
                        hostileTarget = creep.exitToClosestSafeControllerRoom.findClosestByPath(room.hostiles.filter(f => !f.isHealOnlyInvader && creep.shouldAttack(f) && !f.pos.hasRampartHits), {
                            ignoreCreeps: ignoreCreeps
                        });
                        if (hostileTarget) creep.logCreep('hostileTarget finding closest hostile from entry point: ' + hostileTarget);
                    }

                }

                // Attack our known enemies always. We may not have had a target from above.
                if (!hostileTarget && creep.exitToClosestSafeControllerRoom && (creep.exitToClosestSafeControllerRoom.roomName === room.name)) {
                    hostileTarget = creep.exitToClosestSafeControllerRoom.findClosestByPath(room.hostiles.filter(f => PlayerManager.isEnemy(f.owner.username) && !f.pos.hasRampartHits && creep.shouldAttack(f)));
                    if (hostileTarget) creep.logCreep('hostileTarget finding closest enemy from entry point: ' + hostileTarget);
                }
            }

            // POWERBANK
            // Pitch in with powerbank dps while room is otherwise idle.
            if (!hostileTarget && creep.inWorkRoom && !room.hostiles.length && creep.hasLethalParts && creep.focusTarget && room.targetIsPowerBank(creep.focusTarget)) {
                hostileTarget = creep.focusTarget;
                if (hostileTarget) creep.logCreep('hostileTarget power bank focus target: ' + hostileTarget);
            }

            // AUTONUKE AND DESTROY FLAGS
            if (creep.inWorkRoom && !room.myProperty) {
                // Look for autonuke flags with structures under them.
                // Note they won't all have structures since they will be dismantled, so just care about the ones that have structures.
                if (!hostileTarget) {
                    hostileTarget = creep.pos.findClosestByPath(room.autonukeFlags.map(f => f.flag.pos.getHostileStructure).filter(x => x !== undefined), { ignoreCreeps: ignoreCreeps });
                    if (hostileTarget) creep.logCreep('hostileTarget finding autonuke flag target: ' + hostileTarget);
                }

                // Look for destroy flags with structures under them.
                // Note they won't all have structures since they will be dismantled, so just care about the ones that have structures.
                if (!hostileTarget) {
                    hostileTarget = creep.pos.findClosestByPath(room.destroyFlags.map(f => f.flag.pos.getHostileStructure).filter(x => x !== undefined), { ignoreCreeps: ignoreCreeps });
                    if (hostileTarget) creep.logCreep('hostileTarget finding destroy flag structure target: ' + hostileTarget);
                }

                // Secondary destroy flags find is for barriers.
                if (!hostileTarget) {
                    hostileTarget = creep.pos.findClosestByPath(room.destroyFlags.map(f => f.flag.pos.lookForWall()).filter(x => x !== undefined), { ignoreCreeps: ignoreCreeps });
                    if (hostileTarget) creep.logCreep('hostileTarget finding destroy flag barrier target: ' + hostileTarget);
                }
            }

            // None of this matters at all if we aren't in the room we are supposed to be in.
            if (creep.inWorkRoom) {

                // ANY HOSTILE STRUCTURES, POSSIBLY RAMPARTED
                if (!hostileTarget && !room.myProperty && !room.hasMyNonControllerStructures && !room.isHighwayRoom && !room.isCoreRoom) {
                    // The previous search for structures was excluding rampart covered structures, so all freebies are now destroyed.

                    // Now tear into the rampart covered structures.
                    if (!hostileTarget) {
                        hostileTarget = creep.pos.findClosestByPath(room.hostileSpawns, { ignoreCreeps: ignoreCreeps })
                        if (hostileTarget) creep.logCreep('hostileTarget finding hostile spawns: ' + hostileTarget);
                    }
                    if (!hostileTarget && room.invaderCore && creep.hasLethalParts) {
                        hostileTarget = creep.pos.findClosestByPath([room.invaderCore], { ignoreCreeps: ignoreCreeps })
                        if (hostileTarget) creep.logCreep('hostileTarget finding invader core: ' + hostileTarget);
                    }
                    if (!hostileTarget) {
                        hostileTarget = creep.pos.findClosestByPath(room.hostileTowers, { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding hostile towers: ' + hostileTarget);
                    }

                    // It's a HARD choice to kill storage/terminal if they have loot in them...could lose millions of credits from a single melee scout in the room.
                    if (!hostileTarget && room.hostileStorage && (room.hostileStorage.storeEmpty || RoomIntel.getLethalRoom(room.name))) {
                        hostileTarget = creep.pos.findClosestByPath([room.hostileStorage], { ignoreCreeps: ignoreCreeps })
                        if (hostileTarget) creep.logCreep('hostileTarget finding hostile storage: ' + hostileTarget);
                    }
                    if (!hostileTarget && room.hostileTerminal && (room.hostileTerminal.storeEmpty || RoomIntel.getLethalRoom(room.name))) {
                        hostileTarget = creep.pos.findClosestByPath([room.hostileTerminal], { ignoreCreeps: ignoreCreeps })
                        if (hostileTarget) creep.logCreep('hostileTarget finding hostile terminal: ' + hostileTarget);
                    }

                    // In SK rooms, attack containers that have ramparts over them.
                    if (!hostileTarget && room.isSKRoom) {
                        hostileTarget = creep.pos.findClosestByPath(room.nonSourceContainers, { ignoreCreeps: ignoreCreeps })
                        if (hostileTarget) creep.logCreep('hostileTarget finding SK room non-source containers: ' + hostileTarget);
                    }

                    // Anything with a structure are higly important after spawns.
                    if (!hostileTarget && !creep.workParts) {
                        hostileTarget = creep.pos.findClosestByPath(room.attackableHostileStructures, { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding attackable hostile structures: ' + hostileTarget);
                    }
                    if (!hostileTarget && creep.workParts) {
                        hostileTarget = creep.pos.findClosestByPath(room.dismantlableHostileStructures, { ignoreCreeps: ignoreCreeps });
                        if (hostileTarget) creep.logCreep('hostileTarget finding dismantlable hostile structures: ' + hostileTarget);
                    }

                    // Tear into barriers.
                    if (!hostileTarget && flag && creep.pos.isNearTo(flag)) {
                        // Do we have any barriers right next to us? Find the weakest one and attack it.
                        let barriersNearBy = flag.pos.lookForStructureAtArea1.filter(f => !f.my && room.barriersFilter(f));
                        if (barriersNearBy.length) {
                            hostileTarget = _.sortBy(barriersNearBy, s => s.hits).find(f => creep.pos.findClosestByPath([f]));
                        }
                        if (hostileTarget) creep.logCreep('hostileTarget finding nearby barriers: ' + hostileTarget);
                    }

                    if (!hostileTarget && flag) {
                        // If we can't find a structure to attack, then attack barriers that are in the way.
                        // We are sorting by the closest barriers to the flag, then the weakest barrier.
                        // And of course test that we can actually find a path to it.
                        hostileTarget = _.sortByOrder(room.barriers.filter(f => !f.my), [
                            s1 => s1.pos.getRangeTo(flag)
                            , s2 => s2.hits
                        ]).find(f => flag.pos.findClosestByPath([f], { ignoreCreeps: ignoreCreeps }));
                        if (hostileTarget) creep.logCreep('hostileTarget finding closest barrier to flag: ' + hostileTarget);
                    }

                    if (!hostileTarget && creep.inWorkRoom) {
                        // Find the weakest barrier in the room that we have a path tho, and attack it.
                        // Don't attack barriers in my property as I should be able to unclaim/reclaim room if needed.
                        // Without this watchmen in unclaimed rooms will attack our walls.
                        hostileTarget = room.barriersSortedByRangeHits.find(f => !f.my && creep.pos.findClosestByPath([f], { ignoreCreeps: ignoreCreeps }))
                        if (hostileTarget) creep.logCreep('hostileTarget finding weakest reachable barrier: ' + hostileTarget);
                    }

                }

            }

        }

        // If we found a hostile structure, then store it AND its current pos.
        if (hostileTarget && (!creep.memory.stickyTargetId || (creep.memory.stickyTargetId !== hostileTarget.id))) {
            creep.memory.stickyTargetId = hostileTarget.id;
            creep.stickyTargetPos = hostileTarget;
        }

        // If our hostile target is no longer in the room we are in, or the room we are assigned to, then remove it.
        // Otherwise creeps get stuck on edge between rooms.
        if (
            !hostileTarget
            || (
                creep.stickyTarget && (
                    !creep.stickyTarget.isInRoom(creep.room.name)
                    && !creep.stickyTarget.isInRoom(creep.workRoom)
                )
            )
        ) {
            // Otherwise no hostile, clear our sticky target.
            creep.logCreep('clearStickyTarget ' + creep.workRoom + ', ' + hostileTarget + ', ' + creep.stickyTarget);
            this.clearStickyTarget();
        }

        // Save our hostile data as return value.
        if (hostileTarget) {
            data.hostileTarget = hostileTarget;
            data.hostileTargetPos = utils.normalizePos(hostileTarget);
        }


        // Finally return our chosen target data.
        return data;
    }

    Creep.prototype.findAttackData = function(hostileTarget) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let data = {};
        let attackNearBy = null;
        let attackRanged = null;
        let attackRangedScore = null;


        // RANGE ATTACK LOGIC
        if (creep.activeRangedAttackPower >= creep.activeAttackPower) {

            // Calculate the amount of damage we would do to all attackable structures and creeps
            // to determine if we should AOE or single target attack.
            const attackStructuresInRange3 = room.my ? [] : creep.attackStructuresInRange3;
            const massAttackStructures = attackStructuresInRange3.filter(f => room.massAttackStructuresFilter(f));

            // Ranged mass attack is 10,4,1 damage. Ranged attack is 10 damage flat. So unless target is 2/3 away use mass attack.
            let isBoosted = creep.boostedRangedAttackParts;
            function scoreFilter(total, currentValue) {
                let score = 0;
                switch(creep.pos.getRangeTo(currentValue)) {
                    case 3:
                        score = 1 * (isBoosted ? 4 : 1);
                        break;
                    case 2:
                        score = 4 * (isBoosted ? 4 : 1);
                        break;
                    case 1:
                        score = 10 * (isBoosted ? 4 : 1);
                        break;
                }
                return total + score
            }

            // Add together the damage to structures and hostiles.
            attackRangedScore = massAttackStructures.reduce(scoreFilter, attackRangedScore);
            attackRangedScore = creep.hostilesInRange3.reduce(scoreFilter, attackRangedScore);
            if (attackRangedScore) creep.logCreep('attackRangedScore: ' + attackRangedScore);

            // CREEP LOGIC
            // The selection of this creep is important.
            if (!attackRanged) {
                attackRanged = creep.hostilesInRange3;
                attackRanged = _.sortByOrder(attackRanged, [
                    sortIsHealOnlyInvader => sortIsHealOnlyInvader.isHealOnlyInvader ? 1 : 0
                    , sortToughPartsActive => sortToughPartsActive.toughPartsActive
                    , sortHealParts => -sortHealParts.healParts
                    , sortHits => sortHits.hits
                    , sortRange => creep.pos.getRangeTo(sortRange)
                ]);
                attackRanged = attackRanged.find(x => x !== undefined);
                if (attackRanged) creep.logCreep('attackRanged sorted: ' + attackRanged);
            }

            // HOSTILE TARGET LOGIC
            // Attack our target if we are in range.
            if (!attackRanged) {
                if (hostileTarget && creep.pos.inRangeTo(hostileTarget, 3)) {
                    attackRanged = hostileTarget;
                    if (attackRanged) creep.logCreep('attackRanged hostile target: ' + attackRanged);
                }
            }

            // STRUCTURE LOGIC
            if (!attackRanged && attackStructuresInRange3.length) {

                // Spawn structures.
                if (!attackRanged) {
                    attackRanged = attackStructuresInRange3.filter(f => room.hostileSpawnsFilter(f))
                    attackRanged = _.sortByOrder(attackRanged, [s1 => creep.pos.getRangeTo(s1), s2 => s2.hits]);
                    attackRanged = attackRanged.find(x => x !== undefined);
                    if (attackRanged) creep.logCreep('attackRanged closest hostile spawn: ' + attackRanged);
                }

                // InvaderCore structures.
                if (!attackRanged && !creep.workParts) {
                    attackRanged = attackStructuresInRange3.filter(f => room.hostileInvaderCoreFilter(f))
                    attackRanged = _.sortByOrder(attackRanged, [s1 => creep.pos.getRangeTo(s1), s2 => s2.hits]);
                    attackRanged = attackRanged.find(x => x !== undefined);
                    if (attackRanged) creep.logCreep('attackRanged closest invader core: ' + attackRanged);
                }

                // Tower structures.
                if (!attackRanged) {
                    attackRanged = attackStructuresInRange3.filter(f => room.hostileTowersFilter(f))
                    attackRanged = _.sortByOrder(attackRanged, [s1 => creep.pos.getRangeTo(s1), s2 => s2.hits]);
                    attackRanged = attackRanged.find(x => x !== undefined);
                    if (attackRanged) creep.logCreep('attackRanged closest tower: ' + attackRanged);
                }

                // Any other attackable structure.
                if (!attackRanged) {
                    attackRanged = attackStructuresInRange3.filter(f => room.attackableHostileStructuresFilter(f));
                    attackRanged = _.sortByOrder(attackRanged, [s1 => creep.pos.getRangeTo(s1), s2 => s2.hits]);
                    attackRanged = attackRanged.find(x => x !== undefined);
                    if (attackRanged) creep.logCreep('attackRanged closest structure: ' + attackRanged);
                }

                // Have a flag out and we are not in a room we own or have reserved.
                if (!attackRanged) {
                    attackRanged = attackStructuresInRange3.filter(f => room.barriersFilter(f));
                    attackRanged = _.sortBy(attackRanged, s => s.hits);
                    attackRanged = attackRanged.find(x => x !== undefined);
                    if (attackRanged) creep.logCreep('attackRanged closest barrier: ' + attackRanged);
                }
            }

        }


        // ATTACK NEARBY LOGIC
        if (
            (creep.activeAttackPower && !attackRanged)
            || creep.workPartsActive
        ) {

            // HOSTILE TARGET LOGIC
            // Attack our target if we are in range.
            if (!attackNearBy) {
                if (hostileTarget && creep.pos.isNearTo(hostileTarget)) {
                    attackNearBy = hostileTarget;
                    if (attackNearBy) creep.logCreep('attackNearBy is nearby hostiletarget: ' + attackNearBy);
                }
            }

            // CREEP LOGIC
            // Attack parts needed to attack hostile creeps.
            if (!attackNearBy && creep.attackPartsActive) {
                attackNearBy = creep.hostilesNearBy.filter(f => creep.shouldAttack(f));
                attackNearBy = _.sortByOrder(attackNearBy, [
                    sortIsHealOnlyInvader => sortIsHealOnlyInvader.isHealOnlyInvader ? 1 : 0
                    , sortHits => sortHits.hits
                ])[0];
                if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest creep: ' + attackNearBy);
            }

            // STRUCTURE LOGIC
            if (!attackNearBy) {
                // Filter down into just area range 1.
                const attackStructuresInRange3 = room.my ? [] : creep.attackStructuresInRange3;
                const structuresNearBy = attackStructuresInRange3.filter(f => creep.pos.isNearTo(f));

                if (structuresNearBy.length) {
                    // Spawn structures.
                    if (!attackNearBy) {
                        attackNearBy = structuresNearBy.filter(f => room.hostileSpawnsFilter(f))
                        attackNearBy = _.sortBy(attackNearBy, s => s.hits)[0];
                        if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest spawn: ' + attackNearBy);
                    }

                    // InvaderCore structure.
                    if (!attackNearBy && !creep.workParts) {
                        attackNearBy = structuresNearBy.filter(f => room.hostileInvaderCoreFilter(f))
                        attackNearBy = _.sortBy(attackNearBy, s => s.hits)[0];
                        if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest invader core: ' + attackNearBy);
                    }

                    // Tower structures.
                    if (!attackNearBy) {
                        attackNearBy = structuresNearBy.filter(f => room.hostileTowersFilter(f))
                        attackNearBy = _.sortBy(attackNearBy, s => s.hits)[0];
                        if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest tower: ' + attackNearBy);
                    }

                    // Any other attackable structure.
                    if (!attackNearBy) {
                        attackNearBy = structuresNearBy.filter(f => room.attackableHostileStructuresFilter(f));
                        attackNearBy = _.sortBy(attackNearBy, s => s.hits)[0];
                        if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest structure: ' + attackNearBy);
                    }

                    // Have a flag out and we are not in a room we own or have reserved.
                    if (!attackNearBy) {
                        attackNearBy = structuresNearBy.filter(f => room.barriersFilter(f));
                        attackNearBy = _.sortBy(attackNearBy, s => s.hits)[0];
                        if (attackNearBy) creep.logCreep('attackNearBy is nearby weakest barrier: ' + attackNearBy);
                    }
                }
            }

        }


        // Set our return data.
        data.attackNearBy = attackNearBy;
        data.attackRanged = attackRanged;
        data.attackRangedScore = attackRangedScore;

        // Return our data object.
        return data;
    }

    Creep.prototype.performCombatAction = function(healData, attackData) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let healNearBy = healData.healNearBy;
        let healSelf = healData.healSelf;
        let healRanged = healData.healRanged;
        let healReflect = healData.healReflect;
        let attackNearBy = attackData.attackNearBy;
        let attackRanged = attackData.attackRanged;
        let attackRangedScore = attackData.attackRangedScore;
        let message = '';
        let result = ERR_NOT_FOUND;
        let isBoosted = creep.boostedRangedAttackParts;

        if (attackRanged && healNearBy) {
            // On a ranged attack, attempt to also heal nearby (or myself) as its a freebee.
            if (
                (attackRangedScore < RANGED_ATTACK_POWER * (isBoosted ? C.MAX_BOOST_RANGEDATTACK : 1))
                || room.targetIsWall(attackRanged)
                // If target is creep and its not next to us, then attack it directly with full force.
                || (room.targetIsCreep(attackRanged) && !creep.pos.isNearTo(attackRanged) && attackRanged.isHalfDamaged)
            ) {
                // Normal ranged attack is more powerful than AOE if score is less than 10.
                result = creep.rangedAttack(attackRanged);
                if (result == OK) { message += '🏹'; }
                creep.logCreep('attackRanged+healNearBy/rangedAttack: ' + attackRanged);
            } else {
                result = creep.rangedMassAttack()
                if (result == OK) { message += '🏹'; }
                creep.logCreep('attackRanged+healNearBy/rangedMassAttack: ' + attackRanged);
            }
            if (healNearBy) {
                result = creep.heal(healNearBy)
                if (result == OK) { message += '🩹'; }
                creep.logCreep('attackRanged+healNearBy/heal: ' + healNearBy);
            }
            creep.logCreep('attackRangedScore:' + attackRangedScore)
        }

        else if (healSelf) {
            result = creep.heal(healSelf);
            if (result == OK) { message += '🩹'; }
            creep.logCreep('healSelf/heal: ' + healSelf);
        }

        else if (attackNearBy) {
            if (!(attackNearBy instanceof Creep) && creep.workPartsActive) {
                result = creep.dismantle(attackNearBy);
                if (result == OK) { message += '⚒️'; }
                creep.logCreep('attackNearBy/dismantle: ' + attackNearBy);
            }
            else if (creep.attackPartsActive) {
                result = creep.attack(attackNearBy);
                if (result == OK) { message += '⚔️'; };
                creep.logCreep('attackNearBy/attack: ' + attackNearBy);
            }

        }

        else if (healNearBy) {
            result = creep.heal(healNearBy);
            if (result == OK) { message += '🩹'; }
            creep.logCreep('healNearBy/heal: ' + healNearBy);
        }

        else if (attackRanged) {
            // On a ranged attack, attempt to also heal nearby (or myself) as its a freebee.
            if ((attackRangedScore < RANGED_ATTACK_POWER * (isBoosted ? C.MAX_BOOST_RANGEDATTACK : 1)) || room.targetIsWall(attackRanged)) {
                // Normal ranged attack is more powerful than AOE if score is less than 10.
                result = creep.rangedAttack(attackRanged);
                if (result == OK) { message += '🏹'; }
                creep.logCreep('attackRanged/rangedAttack: ' + attackRanged);
            } else {
                result = creep.rangedMassAttack();
                if (result == OK) { message += '🏹'; }
                creep.logCreep('attackRanged/rangedMassAttack: ' + attackRanged);
            }
            if (healNearBy) {
                result = creep.heal(healNearBy);
                if (result == OK) { message += '🩹'; }
                creep.logCreep('attackRanged/heal: ' + healNearBy);
            }
            else if (healReflect && (attackRanged instanceof StructurePowerBank)) {
                result = creep.heal(healReflect);
                if (result == OK) { message += '🩹'; }
                creep.logCreep('attackRanged/heal: ' + healReflect);
            }
        }

        else if (healRanged) {
            result = creep.rangedHeal(healRanged);
            if (result == OK) { message += '💉'; }
            creep.logCreep('healRanged/rangedHeal: ' + healRanged);
        }

        creep.talk(message);
        return result;
    }

    Creep.prototype.findRetreatPosition = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let retreatPosition = null;

        // Two major paths...either room is (currently) lethal, or not;
        if (RoomIntel.getLethalRoom(room.name)) {

            // Determine if we can retreat to a nearby unoccupied rampart (possibly temporary in case of archers on a door).
            // Would be nice if this were biased to go towards homebase, but whatever.
            if (!retreatPosition && room.my && room.lethalHostiles.length && creep.isBodyPartDestroyed && creep.healParts) {
                let rampart = room.myRamparts.find(f => f.pos.inRange3(creep) && !f.pos.lookForCreep());
                if (rampart) {
                    retreatPosition = rampart;
                    creep.logCreep('retreat position; lethal, in range 3 of ramparts', retreatPosition);
                }
            }

            // Determine if we can retreat to a nearby unoccupied rampart (possibly temporary in case of archers on a door).
            // Would be nice if this were biased to go towards homebase, but whatever, ate least it is a safe room.
            if (!retreatPosition && !room.isReinforced && creep.isBodyPartDestroyed && creep.isNearSafeExit) {
                retreatPosition = creep.isNearSafeExit;
                creep.logCreep('retreat position: lethal, in range 1 of safe exit', retreatPosition);
            }

            if (!retreatPosition && room.isReinforced && creep.isBodyPartDestroyed) {
                retreatPosition = room.colonyFirstOpenParkingSpot;
                creep.logCreep('retreat position: lethal, room reinforced, move to parking', retreatPosition);
            }

            // When in a stronghold room, just need to move away and let someone else take damage.
            // if (!retreatPosition && room.invaderStronghold) {
            //     retreatPosition = creep.getFleePosFromTarget(room.invaderStronghold);
            //     creep.logCreep('retreat position: lethal, flee from invader stronghold', retreatPosition);
            // }

            if (!retreatPosition && creep.isNearSafeExit) {
                // If the room is dangerous, fall back to spawn room (with towers and backup creeps).
                retreatPosition = creep.isNearSafeExit;
                creep.logCreep('retreat position: lethal, move to safe exit', retreatPosition);
            }

            // This would effect unlinked archers and hounds mostly.
            if (!retreatPosition && !creep.isBodyPartDestroyed && !creep.duo && room.myBestHealer && !creep.isBestHealer && !creep.pos.inRange5(room.myBestHealer)) {
                // If the room is dangerous, try to get in general range of our best healer.
                retreatPosition = room.myBestHealer.pos;
                creep.logCreep('retreat position: lethal, move closer to our best healer position', retreatPosition);
            }

            if (!retreatPosition && !creep.isBodyPartDestroyed && GameManager.screepRoomNamesHash[room.name]) {
                // If the room has screeps (likely boosted and lethal), run away from them. They are slow moving so shoudl be easy.
                retreatPosition = creep.getFleePosFromLethalHostiles();
                creep.logCreep('retreat position: screeps, flee from hostiles', retreatPosition);
            }

            if (!retreatPosition && creep.previousRoom) {
                // If the room is dangerous, fall back to previous room we were in (if we had such a room)
                retreatPosition = GameManager.getRoomMoveToPos(creep.previousRoom);
                creep.logCreep('retreat position: lethal, move to previous room', retreatPosition);
            }

        }

        // Non-lethal room logic here.
        else {

            // Also check that someone in this "safe" room has healing power (excluding me), otherwise why would we stay here wounded?
            if (!retreatPosition && creep.isDamaged) {
                if (!creep.pos.inRange2Edge && room.myBestHealer) {
                    retreatPosition = creep;
                    creep.logCreep('retreat position: not lethal, creep is damaged, stay put', retreatPosition);
                }
                else if (!creep.pos.inRange2Edge && creep.healPartsActive) {
                    // No healer, but just stay in this safe room and heal yourself.
                    retreatPosition = creep;
                    creep.logCreep('retreat position: not lethal, creep has own heal parts, stay put', retreatPosition);
                }
                else if (creep.healPartsActive) {
                    // I'm a healer, just stay in this safe room but move to center and heal yourself.
                    retreatPosition = GameManager.getRoomMoveToPos(room.name);
                    creep.logCreep('retreat position: not lethal, creep has own heal parts, move to center', retreatPosition);
                }
                else {
                    // No heal parts so head home.
                    retreatPosition = GameManager.getRoomMoveToPos(room.nextRoomNameToClosestSafeControllerRoom);
                    creep.logCreep('retreat position: not lethal, no heals in room, move to center of closest controller room', retreatPosition);
                }
            }

            if (!retreatPosition && creep.pos.isRange1Edge && !creep.shouldRetreatFromHostilesInRoute && !room.myWoundedNearEdge.filter(f => creep.workRoom === f.workRoom).length) {
                // We are in a friendly room, and a healer only...go further inside rather than linger near edge.
                retreatPosition = creep;
                creep.logCreep('retreat position: not lethal, boosted, move to edge', retreatPosition);
            }

            if (!retreatPosition && creep.pos.inRange4Edge && creep.shouldRetreatFromHostilesInRoute && room.myWounded.filter(f => creep.workRoom === f.workRoom).length) {
                // We are in a friendly room, and a healer only...go further inside rather than linger near edge.
                retreatPosition = GameManager.getRoomMoveToPos(room.name);
                creep.logCreep('retreat position: not lethal, wounded need help, backaway from edge, move to center', retreatPosition);
            }

            // Also check that someone in this "safe" room has healing power (excluding me), otherwise why would we stay here wounded?
            if (!retreatPosition && creep.healPartsActive && creep.shouldRetreatFromHostilesInRoute && room.myWounded.filter(f => creep.workRoom === f.workRoom).length) {
                // I'm a healer, move to the closest wounded.
                let wounded = creep.pos.findClosestByRange(room.myWounded.filter(f => creep.workRoom === f.workRoom));
                if (wounded) {
                    let healPosInside = wounded.healPosInside;
                    if (healPosInside) {
                        retreatPosition = healPosInside;
                        creep.logCreep('retreat position: not lethal, creep has own heal parts, move to closest wounded', healPosInside);
                    }
                }
            }

        }

        if (!retreatPosition && room.my && !room.colonyBreached) {
            // We are in a friendly room, its rally position (hopefully a safe spot!)
            retreatPosition = GameManager.getRoomMoveToPos(room.name);
            creep.logCreep('retreat position: catchall, in my room, and not breached, move to center', retreatPosition);
        }

        if (!retreatPosition && room.nextRoomNameToClosestSafeControllerRoom) {
            // Fall thru condition; fall back to closest spawn room that I control. Mostly for archers.
            retreatPosition = GameManager.getRoomMoveToPos(room.nextRoomNameToClosestSafeControllerRoom);
            creep.logCreep('retreat position: catchall, move to center of closest controller room', retreatPosition);
        }

        // Test our retreat position when on edge.
        if (retreatPosition && creep.pos.isEdge && creep.pos.inSameRoom(retreatPosition) && (room.myCreeps.length > 1)) {
            // Verify that we can get to the specified position.
            retreatPosition = _.sortBy(creep.nipsFree.filter(f => !f.isEdge), s => creep.pos.getDistanceTo(s))[0] || retreatPosition;
            creep.logCreep('retreat position: catchall, test failed finding path, retreat off edge', retreatPosition);
        }

        if (!retreatPosition) {
            // If we are totally screwed and nowhere to move, just move to center of room and pray.
            retreatPosition = GameManager.getRoomMoveToPos(room.name);
            creep.logCreep('retreat position: catchall, move to center of room', retreatPosition);
        }

        // Return our best retreat position.
        return retreatPosition;
    }

    Creep.prototype.findMoveTarget = function(hostileTarget, hostileTargetPos, healNearBy, healRanged, healLongRanged) {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Initialize.
        let moveTarget = null;

        // Get our combat flag. This is the flag with the highest priority (team/attack/guard/etc).
        let flag = null //creep.combatFlag;

        // Define some commonly used variables.
        let rangeToHostileTarget = hostileTarget ? creep.pos.getRangeTo(hostileTarget) : 0;

        doneLabel: do {

            // *** ON RAMPART CONDITIONS START ***
            if (creep.pos.hasRampartHits) {
                // If we are already on a rampart next to an attacker, just stay here no matter damage or class. Can stand in door (not great but whatever).
                if (hostileTarget && (rangeToHostileTarget === 1) && !creep.hasStrongerFriendlyCombatCreepInRange2NotOnRampart) {
                    moveTarget = creep;
                    creep.logCreep('park on rampart, hostile nearby', moveTarget);
                    break doneLabel;
                }
            }
            // *** ON RAMPART CONDITIONS END ***


            // *** RETREAT CONDITIONS START ***
            {
                // Enemy room has gone safemode, so just retreat.
                if (room.hostileSafeMode) {
                    creep.talk('🔒');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; hostileSafeMode', moveTarget);
                    break doneLabel;
                }

                // Have armor, but its all gone, retreat.
                if (creep.isDamaged && creep.pos.hasRampartHits) {
                    creep.talk('🏳️‍');
                    moveTarget = creep
                    creep.logCreep('stay under rampart', moveTarget);
                    break doneLabel;
                }

                // We are damaged, but in a non-dangerous room, stay here and heal up fully.
                if (!room.isDangerousRoom && creep.isDamaged) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; we are in a safe room and damaged', moveTarget);
                    break doneLabel;
                }

                // We are damaged, but in a non-dangerous room, stay here and heal up fully.
                if (!room.isDangerousRoom && creep.shouldRetreatFromHostilesInRoute && room.myWounded.filter(f => (creep.workRoom === f.workRoom)).length) {
                    creep.talk('🚑');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; we are in a safe room with wounded creeps', moveTarget);
                    break doneLabel;
                }

                // Have armor, but its all gone, retreat.
                if (creep.toughParts && creep.isArmorGone) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; armor is gone', moveTarget);
                    break doneLabel;
                }

                // Have armor, but can take more damage than armor if I don't retreat.
                if (creep.toughParts && room.isReinforced && creep.toughPartsHalfGone && !creep.isNearSafeExit) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; unowned room and damaged', moveTarget);
                    break doneLabel;
                }

                // Have armor, but can take more damage than armor if I don't retreat.
                if (creep.toughParts && room.isReinforced && creep.potentiallyTakingDamage && !creep.isNearSafeExit) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; unowned room potentially taking damage even with armor', moveTarget);
                    break doneLabel;
                }

                // If we can potentially be one-shot on the next hit, then get out of here!
                if (creep.potentiallyTakingKillingBlowNextTick) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; potential killing blow', moveTarget);
                    break doneLabel;
                }

                // Had no armor, but now all our offensive ability is gone, retreat.
                if (creep.isAllAttackGone) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; no armor installed and all attack parts are gone', moveTarget);
                    break doneLabel;
                }

                // Can't more than 25% damage while not near an exist, start backing up.
                if (!room.my && creep.isQuarterDamaged && !creep.isNearSafeExit) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; offensive creep taken too much damage > 20% and is not near safe exit', moveTarget);
                    break doneLabel;
                }

                // Can't more than 50% damage, get out of this room.
                if (!room.my && creep.isHalfDamaged) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; offensive creep taken too much damage > 25%', moveTarget);
                    break doneLabel;
                }

                // My duo partner can't more than 20% damage, get out of this room.
                if (!room.my && creep.isDuoLeader && creep.duo && creep.duo.is20PercentDamaged) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; offensive duo taken too much damage > 20%', moveTarget);
                    break doneLabel;
                }

                // Healers should backup if we lose any heal body parts.
                if (!room.my && !creep.isNearSafeExit && creep.rangedAttackParts && creep.isBodyPartDestroyed && creep.lethalHostilesInRange2.length) {
                    creep.talk('🏳️‍');
                    moveTarget = creep.findRetreatPosition();
                    creep.logCreep('retreat; not near safe exit and lossing body parts with lethals in range 2', moveTarget);
                    break doneLabel;
                }

                // Healers should backup if we lose any heal body parts.
                // if (!room.my && !creep.pos.isNearEdge && !creep.isLethal && (creep.isBodyPartDestroyed || creep.lethalHostilesInRange3.length)) {
                //     creep.talk('🏳️‍');
                //     moveTarget = creep.findRetreatPosition();
                //     creep.logCreep('retreat; no attack and losting body parts or lethals in range 3', moveTarget);
                //     break doneLabel;
                // }

                // Can't win against all the incoming damage/healing in room. Move to edge.
                if (!room.isSKRoom && room.isReinforced && !creep.canWinRoomBattle && creep.pos.isEdge && creep.isDecisionMaker) {

                    if (creep.hasMyWoundedNearByCloserToCenter) {
                        creep.talk('🚪‍');
                        moveTarget = creep.hasMyWoundedNearByCloserToCenter;
                        console.log(creep.name, 'cannot win battle against all incoming damage/heals, switching with more wounded creep', moveTarget)
                        creep.logCreep('cannot win battle against all incoming damage/heals, switching with more wounded creep', moveTarget);
                        break doneLabel;
                    }

                    if (!creep.pos.isEdge && creep.isNearSafeExit) {
                        creep.talk('🚪‍');
                        moveTarget = creep;
                        creep.logCreep('cannot win battle against all incoming damage/heals, stay here and chill', moveTarget);
                        break doneLabel;
                    }

                    if (creep.pos.isEdge && !creep.isDuoFollower) {
                        // On the very edge, let us naturally move a bit closer.
                        moveTarget = GameManager.getRoomMoveToPos(room.name);
                        creep.logCreep('cannot win battle against all incoming damage/heals, get off edge', moveTarget);
                        break doneLabel;
                    }

                    if (creep.pos.isNearEdge && creep.isDuoFollower) {
                        // On the very edge, let us naturally move a bit closer.
                        moveTarget = creep.duo;
                        creep.logCreep('cannot win battle against all incoming damage/heals, on edge move toward duo leader', moveTarget);
                        break doneLabel;
                    }

                    if (true) {
                        // Fallthru case, retreat.
                        creep.talk('🏳️‍');
                        moveTarget = creep.findRetreatPosition();
                        creep.logCreep('cannot win battle against all incoming damage/heals, retreat to edge', moveTarget);
                        break doneLabel;
                    }

                }
            }
            // *** RETREAT CONDITIONS END ***


            // *** DUO LEADER START ***
            if (creep.duo) {
                // Duo leader has obligation to not leave the side of his follower.
                if (!creep.duo.spawning && creep.isDuoLeader && creep.duo.fatigue && creep.pos.isNearTo(creep.duo)) {
                    moveTarget = creep;
                    creep.logCreep('duo leader, follower is fatigue and nearby, stay put', moveTarget);
                    break doneLabel;
                }

                if (!creep.duo.spawning && creep.isDuoLeader && !creep.pos.inRange2(creep.duo) && creep.pos.inSameRoom(creep.duo)) {
                    moveTarget = creep.duo;
                    creep.logCreep('duo leader, follower is in same room and far away, move to follower', moveTarget);
                    break doneLabel;
                }

                if (!creep.duo.spawning && creep.isDuoLeader && creep.pos.isRange2(creep.duo) && creep.pos.inSameRoom(creep.duo)) {
                    moveTarget = creep;
                    creep.logCreep('duo leader, follower is in same room but is range2, stay put', moveTarget);
                    break doneLabel;
                }

                if (!creep.pos.inSameRoom(creep.duo) && (!creep.isDuoLeader || !creep.pos.isNearEdge) && (!room.my || room.isDangerousRoom)) {
                    moveTarget = creep.duo;
                    creep.logCreep('duo collapsing to each others room', moveTarget);
                    break doneLabel;
                }
            }
            // *** DUO LEADER END ***


            // *** DUO FOLLOWER START ***
            if (creep.isDuoFollower && !creep.duo.spawning) {
                // Enemy room has gone safemode, so just retreat.
                moveTarget = creep.duo;
                creep.logCreep('duo follower, following leader', moveTarget);
                break doneLabel;
            }
            // *** DUO FOLLOWER END ***


            // *** SAFE MODE CHECK START ***
            if (!creep.inWorkRoom && (!GameManager.isInSafeMode(creep.workRoom) || (Cartographer.findRouteDistance(creep.room.name, creep.workRoom) > 1))) {

                // *** WORKROOM CONDITIONS START ***
                {
                    creep.logCreep('work room; attempting to move to ' + creep.workRoom);

                    // This logic will allow a target to be aquired, then if we can't get to it, we are allowed to travel outside the room.
                    // Visibility will screw with this however. Will have observers scoping out these rooms to help.
                    // Be careful of aquiring a stickytarget only to have our workroom change.
                    // Only move to sticky target if we are immediately next door. Otherwise long distance pathing could keep being refreshed if target moves.
                    if (creep.stickyTarget && (creep.stickyTarget.pos.roomName === creep.workRoom) && (!room.targetIsCreep(creep.stickyTarget) || Cartographer.isInRouteDistance(creep.pos.roomName, creep.stickyTarget.pos.roomName, 1))) {
                        // We are not in the correct room.
                        this.talk('🎯' + creep.workRoom);
                        moveTarget = creep.stickyTarget;
                        creep.logCreep('work room; move directly to sticky target', moveTarget);
                        break doneLabel;
                    }

                    // Move to the room we are in. teams have more pin-point movement.
                    if (!creep.shouldRetreatFromHostilesInRoute && !creep.myWoundedNotNearEdgeSameWorkRoom.length && !room.hasLargeEnemies) {
                        // We are not in the correct room.
                        this.talk('✈️' + creep.workRoom);
                        moveTarget = GameManager.getRoomMoveToPos(creep.workRoom);
                        creep.logCreep('work room; move generally to work room', moveTarget);
                        break doneLabel;
                    }
                }
                // *** WORKROOM CONDITIONS END ***


                // *** FLAG CONDITIONS START ***
                if (flag) {
                    // We aren't in the same room as the flag, but have visibility to it. so move towards an open spot near flag.
                    // This will help get to the exact location we need to be.
                    if (!creep.pos.inSameRoom(flag) && flag.room && flag.posInRange1EnterableOffEdge[0]) {
                        creep.talk('🚩');
                        moveTarget = flag.posInRange1EnterableOffEdge[0];
                        creep.logCreep('flag; move to flag room visible', moveTarget);
                        break doneLabel;
                    }

                    // We aren't in the same room as the flag, so move towards it specifically.
                    // This will help get to the exact location we need to be.
                    if (!creep.pos.inSameRoom(flag)) {
                        creep.talk('🚩');
                        moveTarget = flag;
                        creep.logCreep('flag; move to flag directly due to invisible room', moveTarget);
                        break doneLabel;
                    }

                    // We are now in the same room as the flag, with no hostile target (or target is wall), but are on the edge.
                    // Move to an open spot near the flag.
                    if (
                        !room.my
                        && (!hostileTarget || (room.targetIsBarrier(hostileTarget) && hostileTarget.pos.isNearTo(flag)))
                        && flag.posInRange1EnterableOffEdge[0]
                    ) {
                        creep.talk('🚩');
                        moveTarget = flag.posInRange1EnterableOffEdge[0];
                        creep.logCreep('flag; not my room, no hostile target (or is wall), move to flag', moveTarget);
                        break doneLabel;
                    }
                }
                // *** FLAG CONDITIONS END ***


                // *** WORKROOM CONDITIONS START ***
                {
                    // We are in room defense mode, goto our rally point.
                    if (
                        !creep.shouldRetreatFromHostilesInRoute
                        && !creep.myWoundedNotNearEdgeSameWorkRoom.length
                        && !room.hasLargeEnemies
                    ) {
                        // We are not in the correct room.
                        this.talk('✈️' + creep.workRoom);
                        moveTarget = GameManager.getRoomMoveToPos(creep.workRoom);
                        creep.logCreep('move directly work room', moveTarget);
                        break doneLabel;
                    }
                }
                // *** WORKROOM CONDITIONS END ***

            }
            // *** SAFE MODE CHECK END ***


            // *** EXIT CONDITIONS START ***
            if (creep.pos.isNearEdge && hostileTarget && room.targetIsBarrier(hostileTarget)) {

                // We are near the edge, and our hostile target is a wall.
                // Means we are outside of enemy barricade.
                if (creep.rangedAttackParts && creep.pos.inRange3(hostileTarget)) {
                    let rangedAttackPos = creep.getRangedAttackPos(hostileTarget);

                    if (rangedAttackPos && creep.pos.isEqualTo(rangedAttackPos)) {
                        moveTarget = creep;
                        creep.logCreep('barrier edge; in ideal ranged attack positions stay here', moveTarget);
                        break doneLabel;
                    }

                    if (rangedAttackPos && creep.pos.findClosestByPath([rangedAttackPos])) {
                        moveTarget = rangedAttackPos;
                        creep.logCreep('barrier edge; move to ranged attack position', moveTarget);
                        break doneLabel;
                    }
                }

                if ((creep.attackParts || creep.workParts) && creep.pos.isNearTo(hostileTarget)) {
                    let attackPos = creep.getAttackPos(hostileTarget);

                    if (attackPos && creep.pos.isEqualTo(attackPos)) {
                        moveTarget = creep;
                        creep.logCreep('barrier edge; in ideal attack positions stay here', moveTarget);
                        break doneLabel;
                    }

                    if (attackPos && creep.pos.findClosestByPath([attackPos])) {
                        moveTarget = attackPos;
                        creep.logCreep('barrier edge; move to attack position near exit', moveTarget);
                        break doneLabel;
                    }
                }

            }
            // *** EXIT CONDITIONS END ***


            // *** SHIFT CONDITIONS START ***
            if (creep.hasMyWoundedNearByMoreDamaged) {
                // Look for any friendly ramparts inside of our wall structure to move to.
                // Note this does not include rampart gates on our wall, but rather defensive positions.
                moveTarget = creep.hasMyWoundedNearByMoreDamaged;
                creep.logCreep('shifting positions with wounded to let them escape', moveTarget)
                break doneLabel;
            }
            // *** SHIFT CONDITION END ***



            // *** ATTACK CONDITIONS START ***
            if (hostileTarget) {

                if (hostileTarget instanceof ConstructionSite) {
                    // Stomp on this construction site.
                    creep.talk('😈');
                    moveTarget = hostileTargetPos;
                    creep.logCreep('construction site', moveTarget)
                    break doneLabel;
                }

                if (creep.rangedAttackPartsActive) {

                    if (creep.potentiallyTakingDamage && hostileTarget.freeRampartInRange3) {
                        // Look for any friendly ramparts to move to.
                        creep.talk('🎪');
                        moveTarget = hostileTarget.freeRampartInRange3;
                        creep.logCreep('ranged; move to rampart near hostile target', moveTarget);
                        break doneLabel;
                    }

                    if (creep.meleeActiveHostilesNearBy.length) {
                        // Any creeps up in my shit then back up.
                        creep.talk('🎌');
                        moveTarget = creep.findRetreatPosition();
                        creep.logCreep('ranged; flee from melee hostiles nearby', moveTarget);
                        break doneLabel;
                    }

                    if (!room.isReinforced && !creep.isNearSafeExit && creep.exitToClosestSafeControllerRoom && room.lethalPlayerHostiles.length && !creep.canWinRoomBattle) {
                        let exitPos = creep.exitToClosestSafeControllerRoom;
                        let myRangeToExitPos = creep.pos.getRangeTo(exitPos);
                        if (room.lethalPlayerHostiles.find(f => f.pos.getRangeTo(exitPos) - 2 <= myRangeToExitPos)) {
                            creep.talk('🎌');
                            moveTarget = exitPos;
                            creep.logCreep('room not reinforced; cant win room battle, lethal players closer to safe exit than we are, move to exit position', moveTarget);
                            break doneLabel;
                        }
                    }

                    if (!creep.pos.isNearEdge && creep.meleeActiveHostilesInRange2.length) {
                        // Any creeps up in my shit then back up. SK rooms are only dangerous when strongholds are present.
                        creep.talk('🎌');
                        moveTarget = creep.findRetreatPosition();
                        creep.logCreep('retreat from melee range2', moveTarget);
                        break doneLabel;
                    }

                    // I'm taking too much damage with lethal hostiles around, retreat!
                    if (creep.isBodyPartDestroyed && creep.lethalActiveHostilesInRange3.length) {
                        creep.talk('🎌');
                        moveTarget = creep.findRetreatPosition();
                        creep.logCreep('retreat we are losing body parts with lethal hostiles nearby', moveTarget);
                        break doneLabel;
                    }

                    if (room.targetIsCreep(hostileTarget) && !hostileTarget.pos.isEdge && !hostileTarget.attackPartsActive && creep.pos.inRange3(hostileTarget) && !room.colonyTowers.length) {
                        // Move close in super-close if the hostile creep has no ability to melee attack.
                        // They may be wiggly and start moving around hence the need for this step.
                        moveTarget = hostileTarget;
                        creep.logCreep('move closer to non-melee hostile creep', moveTarget);
                        break doneLabel;
                    }

                    if (
                        !room.lethalHostiles.length && !room.targetIsPowerBank(hostileTarget) && !room.targetIsBarrier(hostileTarget) && creep.pos.inRange3(hostileTarget)
                        // Avoid strongholds that are about to spawn.
                        //&& (!room.isSKRoom || !room.invaderStronghold || !room.invaderStronghold.spawning || (!room.invaderStronghold.spawning.remainingTime > 10))
                    ) {
                        // Move close in if the hostile target is easily destructable and if there are no lethal creeps around to harrass us.
                        moveTarget = hostileTarget;
                        creep.logCreep('no lethal creeps in room, move closer to hostile target', moveTarget);
                        break doneLabel;
                    }

                    if (
                        // This is the goldilocks test...are we in perfect range to hostile?
                        //!creep.pos.isNearEdge && (!room.isSKRoom || room.invaderStronghold) && (
                        !creep.pos.isNearEdge && (
                            // Range 4 for boosted players. Let them make a step to us.
                            ((rangeToHostileTarget === 4) && ((room.targetIsCreep(hostileTarget) && !hostileTarget.isNPC && hostileTarget.isBoosted)))
                            // Range 3 for non-invaders.
                            || ((rangeToHostileTarget === 3) && ((room.targetIsCreep(hostileTarget) && !hostileTarget.isNPC) || room.targetIsPowerBank(hostileTarget))
                            // Range 2 for invaders.
                            || ((rangeToHostileTarget === 2) && !((room.targetIsCreep(hostileTarget) && !hostileTarget.isNPC) || room.targetIsPowerBank(hostileTarget))))
                        )
                    ) {
                        // Determine if we should stay put. Don't move closer to creeps or powerbanks.
                        moveTarget = creep;
                        creep.logCreep('parked on ideal location', moveTarget);
                        break doneLabel;
                    }

                    if (!creep.pos.isNearEdge && [1,2].includes(rangeToHostileTarget)) {
                        // We are a ranged damage class, so if we get too close, back away. If not to just make room for paladin class.
                        creep.talk('🎌');
                        moveTarget = creep.getFleePosFromTarget(hostileTarget);
                        creep.logCreep('not on edge, but too close to target...fleeing away', moveTarget);
                        break doneLabel;
                    }

                    // Try to use our last cached attack spot. Ensure that it is still valid.
                    // Either I'm already there on the spot, or nobody else is.
                    if (
                        creep.rangedAttackPos
                        // Force a refresh of this position every few ticks to make sure we have the best spot still.
                        && (Game.time % Config.params.ATTACK_RETARGET_MOD !== 0)
                        // As long as the target hasn't moved 3 spots away, we can reuse this position.
                        && hostileTarget.pos.inRangeTo(creep.rangedAttackPos, 3)
                        // Our spot might be blocked by another chasing creep, don't worry about it till we get close.
                        && (!creep.pos.isNearTo(creep.rangedAttackPos) || ((creep.pos.isEqualTo(creep.rangedAttackPos) || creep.rangedAttackPos.isEnterable)))
                    ) {
                        moveTarget = creep.rangedAttackPos;
                        creep.logCreep('move to cached ranged location of hostileTarget', moveTarget);
                        break doneLabel;
                    }
                    else {
                        // Our cached position is no longer in range or is now occupied, so start again.
                        creep.rangedAttackPos = null;
                        creep.logCreep('delete cached ranged location', moveTarget);
                    }

                    if (room.my) {
                        // When in our own room with walls, look for a spot in range 3 of the hostile.
                        // As we do not build any structures in range 3 of wall, we could just look for and exclude terrain type walls.
                        // So get a list of firing positions inside our walls that ranged attack can hit.
                        // Note that these positions are all 'good' and are not walls, structures, or creeps.
                        moveTarget = creep.pos.findClosestByPath(hostileTarget.pos.posInRange3EnterableOffsetDefend, { ignoreCreeps: true } );
                        if (moveTarget) {
                            creep.logCreep('move to defend location of range 3', moveTarget);
                            break doneLabel;
                        }
                    }

                    // Nothing in range in non-owned room, just find any path to hostile.
                    moveTarget = hostileTargetPos;
                    creep.logCreep('move to hostileTarget', moveTarget);
                    break doneLabel;

                }

                if (creep.attackPartsActive) {

                    if (!room.my && creep.pos.isNearTo(hostileTarget) && !hostileTarget.pos.isEdge) {
                        moveTarget = hostileTarget;
                        creep.logCreep('near to hostileTarget in non-owned room, move to hostileTarget to chase', moveTarget);
                        break doneLabel;
                    }

                    if (
                        creep.meleeAttackPos
                        // Force a refresh of this position every few ticks to make sure we have the best spot still.
                        && (Game.time % Config.params.ATTACK_RETARGET_MOD !== 0)
                        // As long as the target hasn't moved 3 spots away, we can reuse this position.
                        && hostileTarget.pos.inRangeTo(creep.meleeAttackPos, 1)
                        // Our spot might be blocked by another chasing creep, don't worry about it till we get close.
                        && (!creep.pos.isNearTo(creep.meleeAttackPos) || ((creep.pos.isEqualTo(creep.meleeAttackPos) || creep.meleeAttackPos.isEnterable)))
                    ) {
                        // Try to use our last cached attack spot. Ensure that it is still valid.
                        // Either I'm already there on the spot, or nobody else is.
                        moveTarget = creep.meleeAttackPos;
                        creep.logCreep('move to cached melee location of hostileTarget', moveTarget);
                        break doneLabel;
                    }
                    else {
                        // Our cached position is no longer in range or is now occupied, so start again.
                        creep.meleeAttackPos = null;
                        creep.logCreep('delete cached melee location', moveTarget);
                    }

                    if (hostileTarget.freeRampartNearTo) {
                        moveTarget = hostileTarget.freeRampartNearTo;
                        creep.talk('🎪');
                        creep.logCreep('attack pos rampart', moveTarget)
                        break doneLabel;
                    }

                    if (creep.pos.inRange2Edge && creep.pos.isNearTo(hostileTarget)) {
                        // We are outside our wall, and near our target.
                        // No need to keep move to the hostile
                        moveTarget = creep.getAttackPos(hostileTarget);
                        creep.logCreep('getAttackPos', moveTarget)
                        break doneLabel;
                    }

                    // Too far away, just keep walking.
                    moveTarget = hostileTargetPos;
                    creep.logCreep('hostileTargetPos', moveTarget)
                    break doneLabel;
                }

                if (creep.workPartsActive) {
                    // Too far away, just keep walking.
                    moveTarget = hostileTarget;
                    creep.logCreep('work parts; move to hostileTarget', moveTarget, hostileTarget);
                    break doneLabel;
                }
            }
            // *** ATTACK CONDITIONS END ***


            // *** HEAL CONDITIONS START ***
            if (creep.healParts && !creep.attackParts) {
                // We are in range of someone hurt, try to get closer to them.
                if (!hostileTarget && healNearBy) {
                    creep.talk('🚑');
                    moveTarget = room.isDangerousRoom ? healNearBy.healPosOutside : healNearBy.healPosInside;
                    creep.logCreep('move to healNearBy', moveTarget);
                    break doneLabel;
                }

                // We are in range of someone hurt, try to get closer to them.
                if (!hostileTarget && healRanged && !creep.rangedAttackParts) {
                    creep.talk('🚑');
                    moveTarget = room.isDangerousRoom ? healRanged.healPosOutside : healRanged.healPosInside;
                    creep.logCreep('move to healRanged', moveTarget);
                    break doneLabel;
                }

                if (!hostileTarget && healLongRanged && (healLongRanged.workRoom === creep.workRoom) && !creep.rangedAttackParts) {
                    creep.talk('🚑');
                    moveTarget = healLongRanged;
                    creep.logCreep('move to healLongRanged', moveTarget);
                    break doneLabel;
                }

                if (!hostileTarget && RoomIntel.getLethalRoom(room.name)) {
                    creep.talk('🚑');
                    moveTarget = creep.pos.findClosestByPath(room.myCombatCreeps.filter(f => (f.id !== creep.id) && !f.pos.inRange3(creep)));
                    creep.logCreep('move to closest combat creep', moveTarget);
                    break doneLabel;
                }
            }
            // *** HEAL CONDITIONS END ***


            // *** GENERAL CONDITIONS START ***
            {

                // Attack flag, move to it.
                if (flag) {
                    moveTarget = flag;
                    creep.logCreep('move to flag range3', moveTarget);
                    break doneLabel;
                }

                // Highway protection mode. Move within 4 of focusTarget (powerbank or deposit);
                if (creep.focusTarget && !room.myManagement) {
                    creep.talk('get away');
                    if (creep.pos.getRangeTo(creep.focusTarget) > 4) {
                        moveTarget = creep.focusTarget;
                        creep.logCreep('not my room, focusTarget, more than range4, camp here', moveTarget);
                    }
                    else if (creep.pos.isRange4(creep.focusTarget)) {
                        moveTarget = creep;
                        creep.logCreep('not my room, focusTarget, range4, camp here', moveTarget);
                    } else {
                        moveTarget = creep.findRetreatPosition();
                        creep.logCreep('retreat; not my room, focusTarget, camp here', moveTarget);
                    }
                    break doneLabel;
                }

                // Had recent hostiles, goto the last spot on the edge they came in and wait.
                if (RoomIntel.getPlayerHostileLastEdgePos(room.name)) {
                    creep.talk('🏰');

                    if (creep.attackPartsActive) {
                        if (room.my) {
                            moveTarget = room.myRamparts.find(f => f.pos.isNearTo(RoomIntel.getPlayerHostileLastEdgePos(room.name)) && (creep.pos.isEqualTo(f.pos) || !f.pos.lookForCreep()));
                            creep.logCreep('find closest RoomIntel.getPlayerHostileLastEdgePos(room.name) ramparts', moveTarget);
                            break doneLabel;
                        }
                        if (!moveTarget) {
                            moveTarget = creep.lastHostileEdgePosInRange1FindFirst;
                            creep.logCreep('find closest room.lastHostileEdgePosInRange1FindFirst', moveTarget);
                            if (moveTarget && creep.pos.isEqualTo(moveTarget)) {
                                moveTarget = creep.lastHostileEdgePosInRange1FindNearBy;
                                creep.logCreep('find closest room.lastHostileEdgePosInRange1FindNearBy', moveTarget);
                                break doneLabel;
                            }
                        }
                    }

                    if (creep.rangedAttackPartsActive) {
                        moveTarget = creep.lastHostileEdgePosInRange3FindFirst;
                        creep.logCreep('find closest lastHostileEdgePosInRange3FindFirst', moveTarget);
                        if (moveTarget && creep.pos.isEqualTo(moveTarget)) {
                            moveTarget = creep.lastHostileEdgePosInRange3FindNearBy;
                            creep.logCreep('find closest lastHostileEdgePosInRange3FindNearBy', moveTarget);
                        }
                        break doneLabel;
                    }
                }

            }
            // *** GENERAL CONDITIONS END ***


            // *** FALLTHRU CONDITIONS START ***
            {
                moveTarget = RoomIntel.getRoomCenterPos(room.name);
                creep.logCreep('no moveTarget found, moving to center position', moveTarget);
                break doneLabel;
            }


        } while (false)


        // *** EDGE TEST START ***
        if (moveTarget && creep.pos.isEdge && creep.pos.inSameRoom(moveTarget) && room.isDangerousRoom && room.myCreeps.find(f => f.pos.isNearTo(creep))) {
            // Verify that we can get to the specified position.
            moveTarget = _.sortBy(creep.nipsFree.filter(f => !f.isEdge), s => creep.pos.getDistanceTo(s))[0] || moveTarget;
            creep.logCreep('edge: test failed finding path, manual move off edge', moveTarget);
        }
        // *** EDGE TEST END ***


        // *** CACHE DATA START ***
        if (moveTarget && creep.rangedAttackParts) {
            // Save the rangedAttackPos for next tick, as this is expensive to calculate and will help perforance.
            creep.talk('🚓');
            creep.rangedAttackPos = moveTarget;
        }

        if (moveTarget && creep.attackPart) {
            // Save the meleeAttackPos for next tick, as this is expensive to calculate and will help perforance.
            creep.talk('🚓');
            creep.meleeAttackPos = moveTarget;
        }

        // Normal defense creep, move to rally spot aka parking lot.
        if (!moveTarget) {
            creep.talk('🛡️');
        }

        // *** CACHE DATA END ***


        // Return our best move position, if any.
        return moveTarget;
    }

    Creep.prototype.getAttackPos = function(target) {
        // Shorthand.
        let room = this.room;

        // Two scenerios here...
        let targetPos = utils.normalizePos(target);

        // ATTACKING -- in which case we want to align outside the wall
        if (room.otherManagement) {
            if (!this.pos.isNearEdge) return target;
            if (!targetPos.inRange2Edge) return target;

            // Get a list of positions outside the wall that are not blocked.
            // Sort them by distance, so align them in diamond formation and get as close as possible.
            let positions = _.sortBy(targetPos.posInRangeDNotBlockedByObject(1).filter(f => f.isNearExit), s => s.getDistanceTo(targetPos));

            // Find the first position that I'm on (which means I'm already in best location) or doesn't have a creep.
            return positions.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));
        }

        // DEFENDING -- in which case we want to try to surround the enemy, top/bottom/right/left range 3.
        let positions = _.sortByOrder(targetPos.posInRangeDNotBlockedByObject(1).filter(f => !f.isEdge), [
            sortDistanceToTarget => -sortDistanceToTarget.getDistanceTo(targetPos)
            , sortDistanceToCreep => sortDistanceToCreep.getDistanceTo(this)
        ]);

        // Find the first position that I'm on (which means I'm already in best location) or doesn't have a creep.
        return positions.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));
    };

    Creep.prototype.getRangedAttackPos = function(target) {
        // Shorthand.
        let room = this.room;

        // Two scenerios here...
        let targetPos = utils.normalizePos(target);

        // ATTACKING -- in which case we want to align outside the wall
        if (room.otherManagement) {

            // TODO: when creep and/or target is not near the edge, what do we want to do?
            if (!this.pos.isNearEdge) return target.pos;
            if (!targetPos.inRange2Edge) return target;

            // Get a list of positions outside the wall that are not blocked.
            // Sort them by distance, so align them in diamond formation and get as close as possible.
            let positions = _.sortByOrder(targetPos.posInRangeDNotBlockedByObject(3).filter(f => f.isNearExit), [
                sortDistanceToTarget => -sortDistanceToTarget.getDistanceTo(targetPos)
                , sortDistanceToCreep => sortDistanceToCreep.getDistanceTo(this)
            ]);

            // Find the first position that I'm on (which means I'm already in best location) or doesn't have a creep.
            return positions.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));

        }

        // DEFENDING -- in which case we want to try to surround the enemy, top/bottom/right/left range 3.
        let positions = _.sortByOrder(targetPos.posInRangeDNotBlockedByObject(3).filter(f => !f.isEdge), [
            sortDistanceToTarget => -sortDistanceToTarget.getDistanceTo(targetPos)
            , sortDistanceToCreep => sortDistanceToCreep.getDistanceTo(this)
        ]);

        // Find the first position that I'm on (which means I'm already in best location) or doesn't have a creep.
        return positions.find(f => (this.pos.isEqualTo(f) || !f.lookForCreep()));
    };

	Room.prototype.getRangedAttackPosFromObjects = function(range, objects) {
		function scoreFilter(pos, target) {
			let score = 0;
			switch(pos.getRangeTo(target)) {
				case 3:
					score = 1; // * (isBoosted ? 4 : 1);
					break;
				case 2:
					score = 4; // * (isBoosted ? 4 : 1);
					break;
				case 1:
					score = 10;// * (isBoosted ? 4 : 1);
					break;
			}
			return score;
		}

		// For each object, get the positions around it. Flatten the array.
		let pos = objects.map(m => m.pos.posOfRangeDNotBlockedByObject(range)).flatten();

		// Stringify the array values, then get unique values, then remap back to RoomPosition.
		pos = utils.unique(pos.map(m => m.name)).map(m => utils.posFromName(m));

		// Filter out positions that are less than desired range to any other object.
		pos = pos.filter(f => !objects.find(i => f.getRangeTo(i) < range));

		// Finally sort positions by how close each is to all other objects in range 3.
		pos = _.sortBy(pos, s => -_.sum(objects, object => scoreFilter(s, object.pos)));

		// Return final result.
		return pos;
	}

    Object.defineProperty(Creep.prototype, 'combatFlag', {
		get() {
            if (this._combatFlag === undefined) {
                this._combatFlag = null;
                if (!this._combatFlag) this._combatFlag = FlagManager.guardFlags[this.pos.roomName] ? FlagManager.guardFlags[this.pos.roomName].flag : null;
            }
			return this._combatFlag;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.task_combat_criteria = function() {
        // Shorthand.

        // This check always passes.
        return (
            false
        );
    }

    Creep.prototype.assignToDuo = function() {
        // Shorthand.
        let creep = this;

        // Bail out if we are in a duo already.
        if (creep.duo) return true;

        Object.keys(Config.params.DUO_ROLES).some(duo => {
            let roles = Config.params.DUO_ROLES[duo];

            // If our role is defined in this duo, then get the other role.
            // Note it maybe the same role listed twice.
            if (roles.find(f => f === creep.role)) {
                let otherRole = roles.find(f => f !== creep.role) || creep.role;

                // Find a creep (other than ourself) that has the role we are looking for assigned to the same work room.
                if (otherRole) {
                    let otherCreep = CreepManager.getCreepsByRoleAndWorkRoom(otherRole, creep.workRoom).find(f => (creep.id !== f.id) && !f.duo);

                    // Did we find a creep? Great, assign them!
                    if (otherCreep) {
                        creep.duo = otherCreep;
                        return true;
                    }
                }
            }

            // Did not find a creep in this duo that needed a pair, keep looking tho.
            return false;
        });
    }

	Object.defineProperty(Creep.prototype, 'shouldCombatRoleNap', {
		get() {
            if (typeof this._shouldCombatRoleNap === "undefined") {
				this._shouldCombatRoleNap = !!(
                    this.room.my
                    && this.room.colonyTowers.length
                    && this.inDefendRoom
                    && this.inWorkRoom
                    && !RoomIntel.getHostilesTTL(this.room.name)
				);
            }
			return this._shouldCombatRoleNap;
		},
		configurable: true, enumerable: true,
    });

    Creep.prototype.task_combat = function() {
        // Shorthand.
        let creep = this;
        let room = this.room;

        // Is creep in a good position to unboost and recycle?
        if (creep.shouldCombatRoleUnboost) return false;

        // Check to see if I'm in a duo.
        creep.assignToDuo();

        // If we are in passive mode, don't bother doing ANYTHING if we are just sitting around guarding while towers can heal.
        if (creep.shouldCombatRoleNap) {
            creep.logCreep('napping in my defend/work room');
            creep.nap();
            return true;
        }

        // Gather the data we need to make decisions.
        let healData = creep.findHealData();
        let healNearBy = healData.healNearBy;
        let healRanged = healData.healRanged;
        let healLongRanged = healData.healLongRanged;

        let hostileTargetData = creep.findHostileTarget();
        let hostileTarget = hostileTargetData.hostileTarget;
        let hostileTargetPos = hostileTargetData.hostileTargetPos;

        let attackData = creep.findAttackData(hostileTarget);

        // Make our attack!
        let combatResult = creep.performCombatAction(healData, attackData);

        // // Move closer to our target.
        let moveTarget = creep.findMoveTarget(hostileTarget, hostileTargetPos, healNearBy, healRanged, healLongRanged);

        // Make our move!
        if (moveTarget && (!creep.pos.isEqualTo(moveTarget))) {
            // Combat troops do not get stuck, immediately move.
            let options = {};
            if (!creep.pos.isNearEdge) options.stuckValue = 1;
            options.maxRooms = (moveTarget && creep.pos.inSameRoom(moveTarget) && !creep.room.ownedByOther) ? 1 : 12;
            creep.logCreep('smartMove to', moveTarget);
            creep.smartMove(moveTarget, options);

            // When duo is active, then the follower is not really moving.
            // Leader will control movement.
            if (creep.duo && !creep.duo.spawning && creep.isDuoLeader && !creep.pos.isNearTo(creep.duo) && (!room.my || room.isDangerousRoom)) {
                creep.duo.smartMove(creep, options);
                creep.duo.logCreep('duo following', creep);
            }
        }

        creep.logCreep('hostileTarget: ' + hostileTarget + ', moveTarget: ' + moveTarget);

        // Record the hostile target in case we are the team leader. Other teammates will inspect it.
        creep.memory.hostileTargetId = (hostileTarget ? hostileTarget.id : null);

        // Stay in this task forever.
        return true;
    }

}

