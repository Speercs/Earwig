"use strict";

module.exports = function() {

    Room.prototype.manageLink = function() {

        // Only process the first successful transfer on this tick. Prevents overlapping transfers.
        this.myColonyLinks.some(link => {
            // As long as this isn't the the controller link, transfer from it.
            // Delay transfer until at least half full to cut down on CPU, and not on cooldown.
            if (
                !link.cooldown
                && link.store.isEnergyHalfFull
                && !link.isControllerLink  // Controller link is always a sink, never a sender.
            ) {

                // Once we are at normal energy, send energy to the controller link for upgrades.
                // Otherwise send to the colony link for storage.
                if (this.myControllerLink && !this.myControllerLink.store.isEnergyHalfFull) {
                    link.transferEnergy(this.myControllerLink);
                    // Bail out so links don't transfer twice to same spot.
                    return true;
                }
                // Send from our source links to the colony link.
                else if (this.myColonyLink && !link.isColonyLink && !this.myColonyLink.store.isEnergyHalfFull) {
                    link.transferEnergy(this.myColonyLink);
                    // Bail out so links don't transfer twice to same spot.
                    return true;
                }

            }

            // Process the next link.
            return false;
        })

    }

	Object.defineProperty(Room.prototype, 'myControllerLinkPower', {
		get() {
			if (typeof this._myControllerLinkPower === "undefined") {
                let controllerLink = this.myControllerLink;
                let colonyLink = this.myColonyLink;
                this._myControllerLinkPower = Math.floor((controllerLink && colonyLink) ? ((LINK_CAPACITY - (LINK_CAPACITY * LINK_LOSS_RATIO)) / (LINK_COOLDOWN * colonyLink.pos.getRangeTo(controllerLink))) : 0);
			}
			return this._myControllerLinkPower;
		},
		configurable: true, enumerable: true,
	});

}