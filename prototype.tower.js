"use strict";

module.exports = function() {

    StructureTower.prototype.getHealAmount = function(target) {
        return this.getEffectiveAmount(target, TOWER_POWER_HEAL);
    }

    StructureTower.prototype.getAttackAmount = function(target) {
        return this.getEffectiveAmount(target, TOWER_POWER_ATTACK);
    }

    StructureTower.prototype.getRepairAmount = function(target) {
        return this.getEffectiveAmount(target, TOWER_POWER_REPAIR);
    }

    StructureTower.prototype.getEffectiveAmount = function(target, amount) {
        target = utils.normalizePos(target);
        let range = target ? this.pos.getRangeTo(target) : 50;

        if (range > TOWER_OPTIMAL_RANGE) {
            if (range > TOWER_FALLOFF_RANGE) {
                range = TOWER_FALLOFF_RANGE;
            }
            amount -= amount * TOWER_FALLOFF * (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
        }

        return amount;
    }

}