
"use strict";

module.exports = function() {

    Creep.prototype.rolePeon = function() {
        if (this.optimisticRepairRoad() === ERR_TIRED) return true;
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleRook = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePage = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleFarmer = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleOx = function() {
        // As we are traveling around, repair roads we walk over.
        if (this.optimisticRepairRoad() === ERR_TIRED) return true;
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleScavenger = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleLlama = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleBurro = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDonkey = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleJackass = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleHorse = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleMule = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleRogue = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleScout = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCrier = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleProphet = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleBellman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleHerald = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDiviner = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleOracle = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCarpenter = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleMason = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePreacher = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleMiner = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDredger = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleProspector = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleStriker = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCardinal = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleBlacksmith = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleBishop = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePaladin = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleExecutioner = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCollier = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleClerk = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleGnome = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleFencer = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleHound = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePikeman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDefender = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCrossbowman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleLancer = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleWatchman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleKnight = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDeacon = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleCleric = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePeasant = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleSwordsman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleBowman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleSpearman = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.rolePriest = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleDozer = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleSapper = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    Creep.prototype.roleRecon = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

    // Seasonal.
    Creep.prototype.roleEngineer = function() {
        this.task_run(Config.params.CREEP_ROLE_TASKS[this.role]);
    }

}
