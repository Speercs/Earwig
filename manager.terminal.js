"use strict";

class TerminalManager {

    constructor() {
    }

    sortResource(resource) {
        switch (resource) {
            case C.RESOURCE_THORIUM: return -1;
            default: return 0;
        }
    }

    getNote(resource, sendingTerminal, receivingTerminal) {
        switch (resource) {
            case RESOURCE_ENERGY:
                return sendingTerminal.room.storageEnergy + ', ' + sendingTerminal.room.storagePercent + '=>' + receivingTerminal.room.storageEnergy + ', ' + receivingTerminal.room.storagePercent;
        }
        return null;
    }

    manageTerminals(options) {
        // Don't mess with the original options object.
		let defaults = {
			debug: false
            , resourceType: null
            , force: false
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Bail out if we are not on our specified tick.
        let cooldown = GameManager.empireFocusRooms.length ? 1 : 2;
        if (!options.force && !options.debug && ((Game.time % (TERMINAL_COOLDOWN * cooldown)) !== 0)) return false;

        // Record that we are doing this work.
        GameManager.addProcess('manageTerminals');

        // Get list of sending terminals. This list will shrink as we send, as we can only send 1 thing at a time.
        let sendingTerminals = GameManager.empireTerminals.filter(f =>
            !f.cooldown
            && (f.store.getUsedCapacity(RESOURCE_ENERGY) >= Config.params.TERMINAL_TARGET_ENERGY)
        );

        // Get a sorted list of all possible resources we could send in this loop.
        let resources = options.resourceType ? [options.resourceType] :
            C.TERMINAL_MINERALS_COMPOUNDS
            .concat([RESOURCE_ENERGY, RESOURCE_POWER, RESOURCE_OPS, RESOURCE_BATTERY]);
        // Sort was useful for season5 thorium.
        //resources = _.sortBy(resources, s => this.sortResource(s));

        // Add in an extra energy for each low level room and temples.
        if (GameManager.empireFocusRooms.length) {
            resources = resources.concat(_.times(GameManager.empireFocusRooms.length, () => RESOURCE_ENERGY));
        }
        if (GameManager.empireNonMaxTempleRooms.length) {
            resources = resources.concat(_.times(GameManager.empireNonMaxTempleRooms.length, () => RESOURCE_ENERGY));
        }

        if (options.debug) console.log('manageTerminals sending terminals:', sendingTerminals.length, 'resources:', resources.length)

        let receivingRoom = {};

        // Loop thru each sending terminal and we aren't at the end of our list.
        for (let resource of resources) {
            if (options.debug) console.log('manageTerminals processing resource:', resource)

            // Get the terminal that has more than what they need the most of this resource.
            let sendingTerminal = _.sortBy(
                sendingTerminals.filter(f => f.filterSending(resource))
                , s => s.sortSending(resource)
            )[0];
            if (options.debug && sendingTerminal) console.log('manageTerminals resource:', resource, 'sendingTerminal:', sendingTerminal.room.print)
            if (!sendingTerminal) continue;

            // Get the terminal that is below target, and closest to the sending terminal.
            let receivingTerminal = _.sortBy(
                sendingTerminal.room.otherTerminals.filter(f => !receivingRoom[f.room.name + '_' + resource] && f.filterReceiving(resource, sendingTerminal))
                , s => s.sortReceiving(resource, sendingTerminal)
            ).find(f => f.getAmountNeeded(resource, sendingTerminal) > 0);
            if (options.debug && receivingTerminal) console.log('manageTerminals resource:', resource, 'receivingTerminal:', receivingTerminal.room.print)
            if (!receivingTerminal) continue;

            // Keep a hash for each room & resource sent.
            receivingRoom[receivingTerminal.room.name + '_' + resource] = true;

            // Determine the amount to send.
            let amount = receivingTerminal.getAmountNeeded(resource, sendingTerminal);
            if (options.debug) console.log('manageTerminals resource:', resource, 'amount:', amount)

            // Send this resource. Don't send if the amount is zero or negative.
            if (amount > 0) {
                // Create a note specific to this resource.
                let note = this.getNote(resource, sendingTerminal, receivingTerminal);

                // Calculate the cost in energy to make this transaction.
                let cost = sendingTerminal.room.calcTransactionCost(amount, receivingTerminal.room.name);
                if (options.debug) console.log('manageTerminals resource:', resource, 'sendingTerminal:', sendingTerminal.room.print, 'receivingTerminal:', receivingTerminal.room.print, 'amount:', amount, 'cost:', cost)

                // We can only send if we have enough energy to cover the cost.
                if (cost <= sendingTerminal.store.getUsedCapacity(RESOURCE_ENERGY)) {
                    // Create the message.
                    let message = amount + 'x [' + resource + '] => ' + receivingTerminal.room.print + ' costing ' + cost + (note ? ' (' + note + ')' : '');

                    // Attempt to send to this terminal, it might fail so move on the next one if so.
                    if (sendingTerminal.send(resource, amount, receivingTerminal.room.name) === OK) {
                        sendingTerminal.room.logRoom(message, '🚀');

                        // Remove this sending terminal from our master list.
                        sendingTerminals = sendingTerminals.filter(f => f.id !== sendingTerminal.id);
                        if (options.debug) console.log('manageTerminals removing sendingTerminal:', sendingTerminal.room.print, 'remaining terminals:', sendingTerminals.length)
                    }
                }
            }

        }

        return true;
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(TerminalManager, 'TerminalManager');

module.exports = TerminalManager;
