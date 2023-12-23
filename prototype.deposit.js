"use strict";

module.exports = function() {

    Object.defineProperty(Deposit.prototype, 'totalHarvestable', {
        get() {
			if (typeof this._totalHarvestable === "undefined") {
				this._totalHarvestable = (Config.params.MAX_DEPOSIT_COOLDOWN / 0.001)**(1/1.2);
            }
            return this._totalHarvestable;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Deposit.prototype, 'totalHarvested', {
        get() {
			if (typeof this._totalHarvested === "undefined") {
				this._totalHarvested = ((this.lastCooldown || 0) / 0.001)**(1/1.2);
            }
            return this._totalHarvested;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Deposit.prototype, 'marketValue', {
        get() {
			if (typeof this._marketValue === "undefined") {
				this._marketValue = this.totalHarvestable * GameManager.getMarketValue(this.depositType);
            }
            return this._marketValue;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Deposit.prototype, 'marketValueHarvested', {
        get() {
			if (typeof this._marketValueHarvested === "undefined") {
				this._marketValueHarvested = this.totalHarvested * GameManager.getMarketValue(this.depositType);
            }
            return this._marketValueHarvested;
        },
        configurable: true, enumerable: true,
	});

    Object.defineProperty(Deposit.prototype, 'marketValueRemaining', {
        get() {
			if (typeof this._marketValueRemaining === "undefined") {
				this._marketValueRemaining = this.marketValue - this.marketValueHarvested;
            }
            return this._marketValueRemaining;
        },
        configurable: true, enumerable: true,
	});

	Object.defineProperty(Deposit.prototype, 'transporter', {
		get() {
            if (typeof this._transporter === "undefined") {
                this._transporter = _.sortBy(CreepManager.getDonkeysByFocusId(this.id).filter(f => !f.spawning && f.store.getFreeCapacity()), s => s.pos.getRangeTo(this))[0] || null;
            }
			return this._transporter;
		},
		configurable: true, enumerable: true,
    });

};
