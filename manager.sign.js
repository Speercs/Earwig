"use strict";

class SignManager {

    constructor() {
        if (typeof Memory.signs === "undefined") Memory.signs = {};
    }

    addSign(roomName) {
        roomName = packRoomName(roomName);

        // Set the game time for this sign if we don't have a time yet.
        if (typeof Memory.signs[roomName] === "undefined") {
            Memory.signs[roomName] = packTime(Game.time);
        }
    }

    removeSign(roomName) {
        roomName = packRoomName(roomName);
        delete Memory.signs[roomName];
    }

    getSignHash() {
        let signs = {};
        Object.keys(Memory.signs).forEach(key => signs[unpackRoomName(key)] = unpackTime(Memory.signs[key]));
        return signs;
    }

    updateSign(room) {
        // Not necessary to spam this.
        if ((room.heap.updateSign || Game.time) > Game.time) return;

        // Record the next desired scan time.
        room.heap.updateSign = utils.roundToMultipleOf(Game.time + 1, Config.params.SIGN_CACHE_TICKS);

		// Determine if the room needs its sign updated.
		if (
			room.controller
			&& !room.ownedByOther
			&& (!room.controller.sign || (room.controller.sign.text !== room.signMessage))

            // Correct, but expensive testing for nipsFree in order to determine if we can physically update this sign.
			//&& room.controller.nipsFree.length
		) {
			// Set the game time for this sign if we don't have a time yet.
			this.addSign(room.name)
		} else {
			this.removeSign(room.name)
		}
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(SignManager, 'SignManager');

module.exports = SignManager;
