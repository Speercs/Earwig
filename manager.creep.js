"use strict";

class CreepManager {

    constructor() {
        // Clear the cache as objects need to be requeried on each tick.
        this._cache = {}
    }

    initialize() {
        // Load up the initial hash tables that we know will run, so our profiler isn't poluted with misleading cpu load.
        if (FlagManager.preloadcreepsFlag) {
            this.creepsGroupedByRole;
            this.creepsGroupedByCurrentRoom;
            this.creepsGroupedByRoleAndSubject;
        }
    }

    /**
     * creeps propery returns hash of all creeps from Game.creeps.
     */
    get creepsHash() {
        if (typeof this._creepsHash === "undefined") {
            this._creepsHash = Game.creeps;
        }
        return this._creepsHash;
    }

    /**
     * creeps propery returns array of all creeps from Game.creeps.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get creepsArray() {
        if (typeof this._creepsArray === "undefined") {
            this._creepsArray = Object.values(Game.creeps);
        }
        return this._creepsArray;
    }

    /**
     * Currently used by Prospectors, Dredgers, Strikers, Blacksmiths, Archers, Rangers, Hounds, Rogues, Burros.
     */
	get creepsGroupedByRole() {
        if (typeof this._creepsGroupedByRole === "undefined") {
            this._creepsGroupedByRole = utils.groupBy(this.creepsArray, 'role');
            if (Game.flags.CREEPS_BY_ROLE) utils.printStack('CreepManager', 'CREEPS_BY_ROLE');
        }
        return this._creepsGroupedByRole;
	}
    getCreepsByRole(role) {
		return this.creepsGroupedByRole[role] || [];
	}
    getCreepsByRoles(roles) {
		let result = [];
		for (let role of roles) {
			if (this.creepsGroupedByRole[role]) result = result.length ? result.concat(this.creepsGroupedByRole[role]) : this.creepsGroupedByRole[role];
		}
		return result;
	}

    /**
     * Currently used by room.myCreeps
     */
	get creepsGroupedByCurrentRoom() {
        if (typeof this._creepsGroupedByCurrentRoom === "undefined") {
            this._creepsGroupedByCurrentRoom = utils.groupBy(this.creepsArray, 'currentRoom');
            if (Game.flags.CREEPS_BY_CURRENTROOM) utils.printStack('CreepManager', 'CREEPS_BY_CURRENTROOM');
        }
        return this._creepsGroupedByCurrentRoom;
	}
    getCreepsByCurrentRoom(currentRoom) {
		return this.creepsGroupedByCurrentRoom[currentRoom] || [];
	}

    /**
     * Double cut by Role and Subject (focusId || workRoom).
     */
	get creepsGroupedByRoleAndSubject() {
        if (typeof this._creepsGroupedByRoleAndSubject === "undefined") {
            this._creepsGroupedByRoleAndSubject = utils.groupBy(this.creepsArray, 'roleAndSubject');
            if (Game.flags.CREEPS_BY_ROLEANDSUBJECT) utils.printStack('CreepManager', 'CREEPS_BY_ROLEANDSUBJECT');
        }
        return this._creepsGroupedByRoleAndSubject;
	}

    /**
     * Double cut by Role and workRoom.
     */
	get creepsGroupedByRoleAndWorkRoom() {
        if (typeof this._creepsGroupedByRoleAndWorkRoom === "undefined") {
            this._creepsGroupedByRoleAndWorkRoom = utils.groupBy(this.creepsArray, 'roleAndWorkRoom');
            if (Game.flags.CREEPS_BY_ROLEANDWORKROOM) utils.printStack('CreepManager', 'CREEPS_BY_ROLEANDWORKROOM');
        }
        return this._creepsGroupedByRoleAndWorkRoom;
	}
    getCreepsByRoleAndWorkRoom(role, workRoom) {
        //console.log('getCreepsByRoleAndWorkRoom:', role, workRoom)
		return this.creepsGroupedByRoleAndWorkRoom[role + '_' + workRoom] || [];
	}
    getCreepsByRolesAndWorkRoom(roles, workRoom) {
        //console.log('getCreepsByRolesAndWorkRoom:', roles.join(), workRoom)
		let result = [];
		for (let role of roles) {
			if (this.creepsGroupedByRoleAndWorkRoom[role + '_' + workRoom]) result = result.length ? result.concat(this.creepsGroupedByRoleAndWorkRoom[role + '_' + workRoom]) : this.creepsGroupedByRoleAndWorkRoom[role + '_' + workRoom];
		}
		return result;
	}

    /**
     * Double cut by Role and FocusId.
     */
	get creepsGroupedByRoleAndFocusId() {
        if (typeof this._creepsGroupedByRoleAndFocusId === "undefined") {
            this._creepsGroupedByRoleAndFocusId = utils.groupBy(this.creepsArray, 'roleAndFocusId');
            if (Game.flags.CREEPS_BY_ROLEANDFOCUSID) utils.printStack('CreepManager', 'CREEPS_BY_ROLEANDFOCUSID');
        }
        return this._creepsGroupedByRoleAndFocusId;
	}
    getCreepsByRoleAndFocusId(role, focusId) {
		return this.creepsGroupedByRoleAndFocusId[role + '_' + focusId] || [];
	}
    getCreepsByRolesAndFocusId(roles, focusId) {
		let result = [];
		for (let role of roles) {
			if (this.creepsGroupedByRoleAndFocusId[role + '_' + focusId]) result = result.length ? result.concat(this.creepsGroupedByRoleAndFocusId[role + '_' + focusId]) : this.creepsGroupedByRoleAndFocusId[role + '_' + focusId];
		}
		return result;
	}

    /**
     * Do NOT use this! Only for debugging purposes.
     */
	get creepsGroupedByWorkRoom() {
        if (typeof this._creepsGroupedByWorkRoom === "undefined") {
            this._creepsGroupedByWorkRoom = utils.groupBy(this.creepsArray, 'workRoom');
            if (Game.flags.CREEPS_BY_WORKROOM) utils.printStack('CreepManager', 'CREEPS_BY_WORKROOM');
        }
        return this._creepsGroupedByWorkRoom;
	}
    getCreepsByWorkRoom(workRoom) {
		return this.creepsGroupedByWorkRoom[workRoom] || [];
	}


    /** START CREEPS BY ROLE/ROLES */

    getProspectors() {
        return this.getCreepsByRole(Config.roles.PROSPECTOR);
    }

    getDredgers() {
        return this.getCreepsByRole(Config.roles.DREDGER);
    }

    getStrikers() {
        return this.getCreepsByRole(Config.roles.STRIKER);
    }

    getBlacksmiths() {
        return this.getCreepsByRole(Config.roles.BLACKSMITH);
    }

    getPowerWorkers() {
        return this.getCreepsByRoles(Config.roleGroups.POWERWORKER);
    }

    getLancers() {
        return this.getCreepsByRoles(Config.roleGroups.LANCER);
    }

    getArchers() {
        return this.getCreepsByRole(Config.roles.ARCHER);
    }

    getRangers() {
        return this.getCreepsByRole(Config.roles.RANGER);
    }

    getHounds() {
        return this.getCreepsByRole(Config.roles.HOUND);
    }

    getRogues() {
        return this.getCreepsByRole(Config.roles.ROGUE);
    }

    getBurros() {
        return this.getCreepsByRole(Config.roles.BURRO);
    }

    getBuilders() {
        return this.getCreepsByRoles(Config.roleGroups.BUILDER);
    }

    /** END CREEPS BY ROLE/ROLES */


    /*** START ROLE AND ASSIGNEDROOM ***/

    // getArchersByAssignedRoom(assignedRoom) {
    //     if (typeof this._cache['getArchersByAssignedRoom_' + assignedRoom] === "undefined") {
    //         this._cache['getArchersByAssignedRoom_' + assignedRoom] = this.getArchers().filter(creep => creep.assignedRoom === assignedRoom);
    //     }
    //     return this._cache['getArchersByAssignedRoom_' + assignedRoom];
    // }

    // getHoundsByAssignedRoom(assignedRoom) {
    //     if (typeof this._cache['getHoundsByAssignedRoom_' + assignedRoom] === "undefined") {
    //         this._cache['getHoundsByAssignedRoom_' + assignedRoom] = this.getHounds().filter(creep => creep.assignedRoom === assignedRoom);
    //     }
    //     return this._cache['getHoundsByAssignedRoom_' + assignedRoom];
    // }

    getRangersByAssignedRoom(assignedRoom) {
        if (typeof this._cache['getRangersByAssignedRoom_' + assignedRoom] === "undefined") {
            this._cache['getRangersByAssignedRoom_' + assignedRoom] = this.getRangers().filter(creep => creep.assignedRoom === assignedRoom);
        }
        return this._cache['getRangersByAssignedRoom_' + assignedRoom];
    }

    /*** END ROLE AND DELIVER ***/


    /*** START ROLE AND WORKROOM ***/

    getEngineersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.ENGINEER, workRoom)
    }

    getPikemenByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.PIKEMAN, workRoom)
    }

    getCrossbowmenByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.CROSSBOWMAN, workRoom)
    }

    getRangersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.RANGER, workRoom)
    }

    getOxenByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.OX, workRoom);
    }

    getScavengersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.SCAVENGER, workRoom)
    }

    getDefendersByWorkRoom(workRoom) {
        return this.getCreepsByRolesAndWorkRoom(Config.roleGroups.DEFENDER, workRoom)
    }

    getRoguesByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.ROGUE, workRoom);
    }

    getRogueCarryCapacityByWorkRoom(workRoom) {
        if (typeof this._cache['getRogueCarryCapacityByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getRogueCarryCapacityByWorkRoom_' + workRoom] = _.sum(this.getRoguesByWorkRoom(workRoom), s => s.store.getCapacity());
        }
        return this._cache['getRogueCarryCapacityByWorkRoom_' + workRoom];
    }

    getExecutionersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.EXECUTIONER, workRoom)
    }

    getExecutionersNotNeedingReplacementByWorkRoom(workRoom) {
        if (typeof this._cache['getExecutionersNotNeedingReplacementByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getExecutionersNotNeedingReplacementByWorkRoom_' + workRoom] = this.getExecutionersByWorkRoom(workRoom).filter(creep => !creep.needsReplacementPessimistic);
        }
        return this._cache['getExecutionersNotNeedingReplacementByWorkRoom_' + workRoom];
    }

    getScoutsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.SCOUT, workRoom)
    }

    getWatchmenByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.WATCHMAN, workRoom)
    }

    getPriestsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.PRIEST, workRoom)
    }

    getKnightsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.KNIGHT, workRoom)
    }

    getDeaconsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.DEACON, workRoom)
    }

    getSwordsmenByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.SWORDSMAN, workRoom)
    }

    getClericsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.CLERIC, workRoom)
    }

    getColliersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.COLLIER, workRoom)
    }

    getSappersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.SAPPER, workRoom)
    }

    getGuardiansByWorkRoom(workRoom) {
        return this.getCreepsByRolesAndWorkRoom(Config.roleGroups.GUARDIAN, workRoom)
    }
    getGuardianRangedAttackPowerByWorkRoom(workRoom) {
        if (typeof this._cache['getGuardianRangedAttackPowerByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getGuardianRangedAttackPowerByWorkRoom_' + workRoom] = _.sum(this.getGuardiansByWorkRoom(workRoom), s => s.rangedAttackPower);
        }
        return this._cache['getGuardianRangedAttackPowerByWorkRoom_' + workRoom];
    }
    getGuardianCombatPowerByWorkRoom(workRoom) {
        if (typeof this._cache['getGuardianCombatPowerByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getGuardianCombatPowerByWorkRoom_' + workRoom] = _.sum(this.getGuardiansByWorkRoom(workRoom), s => s.combatPower);
        }
        return this._cache['getGuardianCombatPowerByWorkRoom_' + workRoom];
    }

    getBurrosByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.BURRO, workRoom)
    }

    getBurroCarryCapacityByWorkRoom(workRoom) {
        if (typeof this._cache['getBurroCarryCapacityByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getBurroCarryCapacityByWorkRoom_' + workRoom] = _.sum(this.getBurrosByWorkRoom(workRoom), s => s.store.getCapacity());
        }
        return this._cache['getBurroCarryCapacityByWorkRoom_' + workRoom];
    }

    getDismantlersByWorkRoom(workRoom) {
        return this.getCreepsByRolesAndWorkRoom(Config.roleGroups.DISMANTLER, workRoom)
    }

    getDismantlersLifetimeDismantlePowerByWorkRoom(workRoom) {
        if (typeof this._cache['getDismantlersLifetimeDismantlePowerByWorkRoom_' + workRoom] === "undefined") {
            this._cache['getDismantlersLifetimeDismantlePowerByWorkRoom_' + workRoom] = _.sum(this.getDismantlersByWorkRoom(workRoom), s => s.dismantlePower * (s.ticksToLive || CREEP_LIFE_TIME));
        }
        return this._cache['getDismantlersLifetimeDismantlePowerByWorkRoom_' + workRoom];
    }

    getCarpentersByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.CARPENTER, workRoom)
    }

    getMasonsByWorkRoom(workRoom) {
        return this.getCreepsByRoleAndWorkRoom(Config.roles.MASON, workRoom)
    }

    // Carpenters, Masons, Peons
    getConstructorsByWorkRoom(workRoom) {
        return this.getCreepsByRolesAndWorkRoom(Config.roleGroups.CONSTRUCTOR, workRoom)
    }

    // Carpenters, Masons
    getBuildersByWorkRoom(workRoom) {
        return this.getCreepsByRolesAndWorkRoom(Config.roleGroups.BUILDER, workRoom)
    }

    /*** END ROLE AND WORKROOM ***/


    /*** START ROLE AND FOCUSID ***/

    getKingsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.KING, id)
    }

    getQueensByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.QUEEN, id)
    }

    getJestersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.JESTER, id)
    }

    getPeonsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PEON, id);
    }
    getPeonsNotDieingByFocusId(id) {
        if (typeof this._cache['getPeonsNotDieingByFocusId_' + id] === "undefined") {
            this._cache['getPeonsNotDieingByFocusId_' + id] = this.getPeonsByFocusId(id).filter(creep => !creep.needsReplacementPessimistic);
        }
        return this._cache['getPeonsNotDieingByFocusId_' + id];
    }
    getPeonWorkPartsByFocusId(id) {
        if (typeof this._cache['getPeonWorkPartsByFocusId_' + id] === "undefined") {
            this._cache['getPeonWorkPartsByFocusId_' + id] = _.sum(this.getPeonsNotDieingByFocusId(id), s => s.workParts);
        }
        return this._cache['getPeonWorkPartsByFocusId_' + id];
    }
    getPeonsNotDieingOptimisticByFocusId(id) {
        if (typeof this._cache['getPeonsNotDieingOptimisticByFocusId_' + id] === "undefined") {
            this._cache['getPeonsNotDieingOptimisticByFocusId_' + id] = this.getPeonsByFocusId(id).filter(creep => !creep.needsReplacementNoTravel);
        }
        return this._cache['getPeonsNotDieingOptimisticByFocusId_' + id];
    }
    getPeonWorkPartsOptimisticByFocusId(id) {
        if (typeof this._cache['getPeonWorkPartsOptimisticByFocusId_' + id] === "undefined") {
            this._cache['getPeonWorkPartsOptimisticByFocusId_' + id] = _.sum(this.getPeonsNotDieingOptimisticByFocusId(id), s => s.workParts);
        }
        return this._cache['getPeonWorkPartsOptimisticByFocusId_' + id];
    }
    getPeonWorkPartsByFocusId(id) {
        if (typeof this._cache['getPeonWorkPartsByFocusId_' + id] === "undefined") {
            this._cache['getPeonWorkPartsByFocusId_' + id] = _.sum(this.getPeonsByFocusId(id), s => s.workParts);
        }
        return this._cache['getPeonWorkPartsByFocusId_' + id];
    }

    getPeasantsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PEASANT, id)
    }
    getPeasantsNotDieingByFocusId(id) {
        if (typeof this._cache['getPeasantsNotDieingByFocusId_' + id] === "undefined") {
            this._cache['getPeasantsNotDieingByFocusId_' + id] = this.getPeasantsByFocusId(id).filter(creep => !creep.needsReplacementNoTravel);
        }
        return this._cache['getPeasantsNotDieingByFocusId_' + id];
    }

    getRooksByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.ROOK, id);
    }

    getArchersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.ARCHER, id);
    }

    getHoundsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.HOUND, id);
    }

    getCarpentersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.CARPENTER, id)
    }

    getMasonsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.MASON, id)
    }

    // Carpenters, Masons, Peons
    getConstructorsByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.CONSTRUCTOR, id)
    }

    // Carpenters, Masons
    getBuildersByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.BUILDER, id)
    }

    getLlamasByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.LLAMA, id)
    }

    getLlamaCarryCapacityByFocusId(id) {
        if (typeof this._cache['getLlamaCarryCapacityByFocusId_' + id] === "undefined") {
            this._cache['getLlamaCarryCapacityByFocusId_' + id] = _.sum(this.getLlamasByFocusId(id), s => s.store.getCapacity());
        }
        return this._cache['getLlamaCarryCapacityByFocusId_' + id];
    }

    getClerksByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.CLERK, id)
    }

    getRoguesByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.ROGUE, id)
    }

    getFencersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.FENCER, id);
    }

    getMinersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.MINER, id)
    }

    getCriersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.CRIER, id)
    }
    getProphetsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PROPHET, id)
    }
    getBellmenByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.BELLMAN, id)
    }
    getHeraldsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.HERALD, id)
    }
    getDivinersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.DIVINER, id)
    }
    getOraclesByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.ORACLE, id)
    }

    getUpgradeControllerCreepsByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.UPGRADE_CONTROLLER, id)
    }
    getUpgradeControllerCreepsNotNeedingReplacementByFocusId(id) {
        if (typeof this._cache['getUpgradeControllerCreepsNotNeedingReplacementByFocusId_' + id] === "undefined") {
            this._cache['getUpgradeControllerCreepsNotNeedingReplacementByFocusId_' + id] = this.getUpgradeControllerCreepsByFocusId(id).filter(creep => !creep.needsReplacementForUpgrader);
        }
        return this._cache['getUpgradeControllerCreepsNotNeedingReplacementByFocusId_' + id];
    }
    getUpgradeControllerCreepsAtWorkByFocusId(id) {
        if (typeof this._cache['getUpgradeControllerCreepsAtWorkByFocusId_' + id] === "undefined") {
            this._cache['getUpgradeControllerCreepsAtWorkByFocusId_' + id] = this.getUpgradeControllerCreepsByFocusId(id).filter(creep => creep.inWorkRoom);
        }
        return this._cache['getUpgradeControllerCreepsAtWorkByFocusId_' + id];
    }
    getUpgradeControllerCreepWorkPartsByFocusId(id) {
        if (typeof this._cache['getUpgradeControllerCreepWorkPartsByFocusId_' + id] === "undefined") {
            this._cache['getUpgradeControllerCreepWorkPartsByFocusId_' + id] = _.sum(this.getUpgradeControllerCreepsByFocusId(id), s => s.workParts);
        }
        return this._cache['getUpgradeControllerCreepWorkPartsByFocusId_' + id];
    }

    getGeneralUpgradeControllerCreepsByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.GENERAL_UPGRADE_CONTROLLER, id)
    }

    getTempleUpgradeControllerCreepsByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.TEMPLE_UPGRADE_CONTROLLER, id)
    }

    getPagesByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PAGE, id)
    }
    getPageCarryCapacityByFocusId(id) {
        if (typeof this._cache['getPageCarryCapacityByFocusId_' + id] === "undefined") {
            this._cache['getPageCarryCapacityByFocusId_' + id] = _.sum(this.getPagesByFocusId(id), s => s.store.getCapacity());
        }
        return this._cache['getPageCarryCapacityByFocusId_' + id];
    }
    getPagesAtWorkByFocusId(id) {
        if (typeof this._cache['getPagesAtWorkByFocusId_' + id] === "undefined") {
            this._cache['getPagesAtWorkByFocusId_' + id] = this.getPagesByFocusId(id).filter(f => !f.spawning && f.inWorkRoom);
        }
        return this._cache['getPagesAtWorkByFocusId_' + id];
    }

    getPreachersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PREACHER, id)
    }
    getPreacherTicksByFocusId(id) {
        if (typeof this._cache['getPreacherTicksByFocusId_' + id] === "undefined") {
            // Get the count of creeps ticks to live and are assigned to the room the flag is in.
            // Subtract 1 from claim parts as that is the natural decay of a reserved room.
            this._cache['getPreacherTicksByFocusId_' + id] = _.sum(this.getPreachersByFocusId(id), s => (s.ticksToLive ? s.ticksToLive : CREEP_CLAIM_LIFE_TIME) * (s.claimParts - 1));
        }
        return this._cache['getPreacherTicksByFocusId_' + id];
    }

    getFarmersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.FARMER, id);
    }
    getFarmersNotNeedingReplacementByFocusId(id) {
        if (typeof this._cache['getFarmersNotNeedingReplacementByFocusId_' + id] === "undefined") {
            this._cache['getFarmersNotNeedingReplacementByFocusId_' + id] = this.getFarmersByFocusId(id).filter(creep => !creep.needsReplacement);
        }
        return this._cache['getFarmersNotNeedingReplacementByFocusId_' + id];
    }

    getOxByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.OX, id)
    }
    getOxCapacityByFocusId(id) {
        if (typeof this._cache['getOxCapacityByFocusId_' + id] === "undefined") {
            this._cache['getOxCapacityByFocusId_' + id] = _.sum(this.getOxByFocusId(id), s => s.store.getCapacity());
        }
        return this._cache['getOxCapacityByFocusId_' + id];
    }

    getPaladinsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PALADIN, id)
    }
    getPaladinAttackPowerByFocusId(id) {
        if (typeof this._cache['getPaladinAttackPowerByFocusId_' + id] === "undefined") {
            this._cache['getPaladinAttackPowerByFocusId_' + id] = _.sum(this.getPaladinsByFocusId(id), s => s.attackPower * (s.ticksToLive || CREEP_LIFE_TIME));
        }
        return this._cache['getPaladinAttackPowerByFocusId_' + id];
    }

    getLancersByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.LANCER, id)
    }
    getLancerRangedAttackPowerTTLByFocusId(id) {
        if (typeof this._cache['getLancerRangedAttackPowerTTLByFocusId_' + id] === "undefined") {
            this._cache['getLancerRangedAttackPowerTTLByFocusId_' + id] = _.sum(this.getLancersByFocusId(id), s => s.rangedAttackPower * (s.ticksToLive || CREEP_LIFE_TIME));
        }
        return this._cache['getLancerRangedAttackPowerTTLByFocusId_' + id];
    }

    getWatchmanByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.WATCHMAN, id)
    }

    getKnightsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.KNIGHT, id)
    }

    getDredgersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.DREDGER, id)
    }

    getDeaconByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.DEACON, id)
    }

    getGuardiansByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.GUARDIAN, id)
    }
    getGuardianHealPowerByFocusId(focusId) {
        if (typeof this._cache['getGuardianHealPowerByFocusId_' + focusId] === "undefined") {
            this._cache['getGuardianHealPowerByFocusId_' + focusId] = _.sum(this.getGuardiansByFocusId(focusId), s => s.healPower);
        }
        return this._cache['getGuardianHealPowerByFocusId_' + focusId];
    }
    getGuardianRangedAttackPowerByFocusId(focusId) {
        if (typeof this._cache['getGuardianRangedAttackPowerByFocusId_' + focusId] === "undefined") {
            this._cache['getGuardianRangedAttackPowerByFocusId_' + focusId] = _.sum(this.getGuardiansByFocusId(focusId), s => s.rangedAttackPower);
        }
        return this._cache['getGuardianRangedAttackPowerByFocusId_' + focusId];
    }

    getProspectorsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.PROSPECTOR, id)
    }

    getStrikersByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.STRIKER, id)
    }

    getPowerWorkersByFocusId(id) {
        return this.getCreepsByRolesAndFocusId(Config.roleGroups.POWERWORKER, id)
    }

    getBlacksmithsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.BLACKSMITH, id)
    }

    getPowerWorkerByFocusIdAttackPowerTTL(id) {
        if (typeof this._cache['getPowerWorkerByFocusIdAttackPowerTTL_' + id] === "undefined") {
            this._cache['getPowerWorkerByFocusIdAttackPowerTTL_' + id] = _.sum(this.getPowerWorkersByFocusId(id), s => s.attackPower * (s.ticksToLive || CREEP_LIFE_TIME));
        }
        return this._cache['getPowerWorkerByFocusIdAttackPowerTTL_' + id];
    }

    getCardinalsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.CARDINAL, id)
    }

    getBishopsByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.BISHOP, id)
    }

    getMulesByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.MULE, id)
    }

    getDonkeysByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.DONKEY, id)
    }

    getJackassByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.JACKASS, id)
    }

    getJackassNotDieingByFocusId(id) {
        if (typeof this._cache['getJackassNotDieingByFocusId_' + id] === "undefined") {
            this._cache['getJackassNotDieingByFocusId_' + id] = this.getJackassByFocusId(id).filter(creep => !creep.needsReplacement);
        }
        return this._cache['getJackassNotDieingByFocusId_' + id];
    }

    getHorsesByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.HORSE, id)
    }

    getHorseCarryCapacityByFocusId(id) {
        if (typeof this._cache['getHorseCarryCapacityByFocusId_' + id] === "undefined") {
            this._cache['getHorseCarryCapacityByFocusId_' + id] = _.sum(this.getHorsesByFocusId(id), s => s.store.getCapacity());
        }
        return this._cache['getHorseCarryCapacityByFocusId_' + id];
    }

    getBurrosByFocusId(id) {
        return this.getCreepsByRoleAndFocusId(Config.roles.BURRO, id)
    }

    /*** END ROLE AND FOCUSID ***/

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(CreepManager, 'CreepManager');

module.exports = CreepManager;
