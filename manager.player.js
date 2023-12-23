"use strict";

class PlayerManager {

    constructor() {
        if (!Memory.players) Memory.players = {};
    }

    addAlly(name) {
        Memory.players[name] = 1;
        return Object.keys(Memory.players).filter(f => Memory.players[f] === 1);
    }

    addEnemy(name) {
        Memory.players[name] = 2;
        return Object.keys(Memory.players).filter(f => Memory.players[f] === 2);
    }

    removePlayer(name) {
        delete Memory.players[name];
        return Object.keys(Memory.players);
    }

    isAlly(name) {
        return Memory.players[name] ? (Memory.players[name] === 1) : false;
    }

    isEnemy(name) {
        return Memory.players[name] ? (Memory.players[name] === 2) : false;
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(PlayerManager, 'PlayerManager');

module.exports = PlayerManager;
