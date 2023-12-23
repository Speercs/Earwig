"use strict";

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
global.profiler = null;
//global.profiler = require('./screeps-profiler');

require('./prototype.generic')();
require('./prototype.container')();
require('./prototype.spawn')();
require('./prototype.flag')();
require('./prototype.creep')();
require('./prototype.creep.smart')();
require('./prototype.powercreep.smart')();
require('./prototype.roomposition')();
require('./prototype.room')();
require('./prototype.room.body')();
require('./prototype.room.colony')();
require('./prototype.room.colony.structures')();
require('./prototype.room.creep')();
require('./prototype.room.defense')();
require('./prototype.room.event')();
require('./prototype.room.hostile')();
require('./prototype.room.memory')();
require('./prototype.room.reserve')();
require('./prototype.room.spawn')();
require('./prototype.room.structureGroups')();
require('./prototype.boost')();
require('./prototype.controller')();
require('./prototype.deposit')();
require('./prototype.heap')();
require('./prototype.keeperlair')();
require('./prototype.lab')();
require('./prototype.link')();
require('./prototype.mineral')();
require('./prototype.nuker')();
require('./prototype.powerbank')();
require('./prototype.powerspawn')();
require('./prototype.resource')();
require('./prototype.roomobject')();
require('./prototype.roomobject.store')();
require('./prototype.roomvisual')();
require('./prototype.ruin')();
require('./prototype.source')();
require('./prototype.store')();
require('./prototype.structure')();
require('./prototype.terminal')();
require('./prototype.tombstone')();
require('./prototype.tower')();
require('./roles')();
require('./role.combat')();
require('./role.engine')();
require('./role.king')();
require('./role.queen')();
require('./role.jester')();
require('./manager.defense')();
require('./manager.factory')();
require('./manager.lab')();
require('./manager.link')();
require('./manager.powercreep')();
require('./manager.powerspawn')();
require('./manager.season')();
require('./manager.spawn')();
require('./manager.temple')();
require('./manager.tower')();
require('./packrat');


let _Heap = require('./Heap');
global.Heap = new _Heap();

// Load in our global constants file.
const _C = require("./constants");
global.C = _C;

// Load in our global config file.
const _Config = require("./config");
global.Config = _Config;

// Load in our global utilities file.
const _utils = require("./utils");
global.utils = _utils;

// Our mapping utility.
const _Cartographer = require('./cartographer');
global.Cartographer = _Cartographer;

// Load in our global traveler class.
const _Traveler = require("./Traveler");
global.Traveler = _Traveler;

// Load in our global utilities file.
const _CpuManager = require("./manager.cpu");
global.CpuManager = _CpuManager;

// Make a new copy of our colony manager each loop.
let _ColonyManager = require("./manager.colony.v3");
global.ColonyManager = new _ColonyManager();

// Our GameManager object, which will be recreated each tick.
let _GameManager = require('./manager.game');

// Our PlayerManager object, which will be recreated each tick.
let _PlayerManager = require('./manager.player');

// Our ReserveManager object, which will be recreated each tick.
let _ReserveManager = require('./manager.reserve');

// Our TerminalManager object, which will be recreated each tick.
let _TerminalManager = require('./manager.terminal');

// Our SignManager object, which will be recreated each tick.
let _SignManager = require('./manager.sign');

// Our RoomIntel object, which will be recreated each tick.
let _RoomIntel = require('./RoomIntel');

// Our FlagManager object, which will be recreated each tick.
let _FlagManager = require('./manager.flag');

// Our CreepManager object, which will be recreated each tick.
let _CreepManager = require('./manager.creep');

// This line monkey patches the global prototypes.
//if (profiler) profiler.enable();
//if (profiler) profiler.hookUpPrototypes();
//if (profiler) profiler.setup();

module.exports.loop = function () {

    // Manage our stop flag.
    let stop = Game.flags.stop && (Game.flags.stop.color !== COLOR_WHITE);
    if (stop && (Game.cpu.bucket === Config.params.CPU_MAX)) Game.flags.stop.setColor(COLOR_WHITE);

    let loopFunc = function() {
        try {
            // Get our game on!
            if (stop) return;

            // Make a new copy of our cpu manager each tick.
            delete global.CpuManager;
            global.CpuManager = new _CpuManager();

            // Make a new copy of our player manager each tick.
            delete global.PlayerManager;
            global.PlayerManager = new _PlayerManager();

            // Make a new copy of our player manager each tick.
            delete global.ReserveManager;
            global.ReserveManager = new _ReserveManager();

            // Make a new copy of our sign manager each tick.
            delete global.SignManager;
            global.SignManager = new _SignManager();

            // Make a new copy of our room intel each tick.
            delete global.RoomIntel;
            global.RoomIntel = new _RoomIntel();

            // Make a new copy of our flag manager each tick.
            delete global.FlagManager;
            global.FlagManager = new _FlagManager();

            // Make a new copy of our creep manager each tick.
            delete global.CreepManager;
            global.CreepManager = new _CreepManager();

            // Make a new copy of our terminal manager each tick.
            delete global.TerminalManager;
            global.TerminalManager = new _TerminalManager();

            // Make a new copy of our game manager each tick.
            delete global.GameManager;
            global.GameManager = new _GameManager();

            // Get our game on!
            GameManager.run();
        }
        catch (error) {
            console.log('Error stack: ' + error.stack);
        }

    }

    // Wrap all methods if profiler is enbled, otherwise let them run rawdog.
    if (profiler) {
        profiler.wrap(loopFunc);
    }
    else {
        loopFunc();
    }

}
