"use strict";

module.exports = function() {

    // Nice version of say.
    PowerCreep.prototype.talk = function(text) {
        if (this._text) {
            if (!this._text.includes(text)) {
                this._text += text;
            }
        } else {
            this._text = text;
        }
    };

    PowerCreep.prototype.finalize = function() {
        // Append the target id if it is specified.
        if (this._text && this._text != '') { this.say(this._text); }
    }

	Object.defineProperty(PowerCreep.prototype, 'generateOpsAmount', {
		get() {
			if (typeof this._generateOpsAmount === "undefined") {
                this._generateOpsAmount = 0;
                if (this.powers[PWR_GENERATE_OPS]) {
                    this._generateOpsAmount = POWER_INFO[PWR_GENERATE_OPS].effect[this.powers[PWR_GENERATE_OPS].level - 1];
                }

			}
			return this._generateOpsAmount;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(PowerCreep.prototype, 'operateExtensionPercent', {
		get() {
			if (typeof this._operateExtensionPercent === "undefined") {
                this._operateExtensionPercent = 0;
                if (this.powers[PWR_OPERATE_EXTENSION]) {
                    this._operateExtensionPercent = POWER_INFO[PWR_OPERATE_EXTENSION].effect[this.powers[PWR_OPERATE_EXTENSION].level - 1];
                }
			}
			return this._operateExtensionPercent;
		},
		configurable: true, enumerable: true,
	});

	Object.defineProperty(PowerCreep.prototype, 'operateTerminalPercent', {
		get() {
			if (typeof this._operateTerminalPercent === "undefined") {
                this._operateTerminalPercent = 0;
                if (this.powers[PWR_OPERATE_TERMINAL]) {
                    this._operateExtensionPercent = POWER_INFO[PWR_OPERATE_TERMINAL].effect[this.powers[PWR_OPERATE_TERMINAL].level - 1];
                }
			}
			return this._operateTerminalPercent;
		},
		configurable: true, enumerable: true,
	});

    PowerCreep.prototype.canOperatePower = function(power) {
        // Check to see if we have this power off cooldown and enough ops to execute it.
        return (
            !!this.powers[power]
            && (this.powers[power].cooldown === 0)
            && (this.store.getUsedCapacity(RESOURCE_OPS) >= (POWER_INFO[power].ops || 0))
        );
    }

    PowerCreep.prototype.smartOperatePower = function(power, target, overrideEffect = false) {
        let result = ERR_TIRED;

        // Check to see if we have this power off cooldown and enough ops to execute it.
        if (!this.canOperatePower(power)) return result;

        // Verify target does not already has this effect; wasteful to run again and block other commands.
        if (!overrideEffect && target.hasEffect(power)) return ERR_FULL;

        // Verify the range of this power and use when close enough.
        result = ERR_NOT_IN_RANGE;
        if (this.pos.inRangeTo(target, POWER_INFO[power].range)) result = this.usePower(power, target);

        switch (result) {
            case OK:
                this.talk('🌟');
                break;
            case ERR_NOT_IN_RANGE:
                this.smartMove(target);
                break;
            default:
                this.talk(result + '⁉️');
                break;
        }
        return result;
    }

    PowerCreep.prototype.smartOperateSpawn = function(target) {
        let result = ERR_TIRED;

        if (
            // Are we spawned?
            this.pos

            // Can/should we be using this talent?
            && this.room.operateSpawnLevel

            && (
                // Always use if we are under attack by boosted players.
                RoomIntel.getLethalBoostedPlayerHostilesTTL(this.room.name)

                // Do we have focus rooms that need creeps?
                || GameManager.myNonMaxSpawnRoomsActive.length

                // Normal cases below, use efficiently.
                || (
                    // Only want one spawn to have this effect at a time, its too expensive.
                    !this.room.spawns.find(f => f.hasEffect(PWR_OPERATE_SPAWN))

                    // Fire only if we already have a spawn cooking, so we know that this room is busy.
                    // Can renew just fine with two free spawns.
                    && this.room.spawns.find(f => f.spawning)

                    // We are overflowing with Ops, use them up.
                    && (
                        this.room.myTerminal
                        && (this.room.myTerminal.store.getUsedCapacity(RESOURCE_OPS) >= POWER_INFO[PWR_OPERATE_SPAWN].ops)
                    )
                )
            )
        ) {
            result = this.smartOperatePower(PWR_OPERATE_SPAWN, target)
        }

        return result;
    }

    PowerCreep.prototype.smartOperateTower = function(target) {
        let result = ERR_TIRED;

        if (
            // Always attempt to boost towers.
            true
        ) {
            result = this.smartOperatePower(PWR_OPERATE_TOWER, target)
        }

        return this.smartOperatePower(PWR_OPERATE_TOWER, target);
    }

}
