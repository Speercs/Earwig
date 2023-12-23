"use strict";

module.exports = function() {

    Room.prototype.logTower = function(action, target) {
        this.logRoom("Tower" + " " + action + ":", target);
    };

    Room.prototype.manageTower = function(roomMod, roomIndex) {
        // For every tower in the given room,
        // attack the closest hostile to the tower.
        // If no hostiles, heal/repair any structures that need it.
        let room = this;

        // Max level temples no longer need to repair anything.
        if (room.isTemple && room.atMaxLevel) return;

        let heals = [];
        let repairs = [];
        let overRepair = false;
        let attacks = [];
        let testing = room.testingFlag;
        let halt = GameManager.haltShutdown;
        let spamming = !FlagManager.throttleFlag && ((!room.haltSpawning && (room.isStorageEnergyAbundant && room.isNukeInbound)) || !room.atMaxLevel || room.memory.spamRepair);

        // If the purpose is to not look for myWounded then realize that at least 1 room per tick would be, and that negates the benefit of any other room looking
        let okToHeal = !room.isTemple && (!FlagManager.throttleFlag || RoomIntel.getHostilesTTL(room.name));
        let okToAttack = !room.isTemple && (RoomIntel.getHostilesTTL(room.name) || RoomIntel.getPlayerHostileLastEdgePos(room.name));
        let okToRepair = ((Game.time % roomMod === roomIndex) || spamming);

        // Delete our cached wall upgrade if we are on our room's priority tick.
        if (Game.time % (roomMod * Config.params.TOWER_REPAIR_CACHE_MOD) === roomIndex) {
            delete room.memory.towerTargetId;
        }

        // Are we allowed to do anything on this tick?
        if (!okToHeal && !okToAttack && !okToRepair) return;

        // Bail out if we have no towers to process.
        let towers = room.colonyTowers;
        if (!towers.length) return;

        // Heal any creeps that have lost all armor.
        if (!halt && okToHeal) {
            let creeps = room.myWounded;
            creeps = _.sortByOrder(creeps, [
                // Prioritize creeps with armor.
                sortToughParts => sortToughParts.toughParts ? 0 : 1
                // The fewer active tough parts, the higher priority.
                , sortToughPartsActive => sortToughPartsActive.toughPartsActive
                // Badly wounded creeps take priority.
                , sortHits => sortHits.hits
            ]);
            heals = creeps;
        }

        // Get the list of all creeps. Sort in priority order.
        // Only look for hostiles if RoomIntel says we have them, which is on a cache timer so may not be instant.
        if (okToAttack) {
            let creeps = room.hostiles;
            // When in safeMode, let them get close to the colonyFlag before engaging (or if they are wounded).
            if (room.safeMode && !room.invaders.length) {
                creeps = creeps.filter(f => f.pos.isInsideOfWall || (f.hits < f.hitsMax));
            }

            // If there are creeps without boosted tough parts, only focus on them.
            if (creeps.find(f => !f.boostedToughParts)) {
                creeps = creeps.filter(f => !f.boostedToughParts);
            }

            creeps = _.sortByOrder(creeps, [
                // Attack unarmored/least armored first.
                s1 => s1.boostedToughParts
                // Closer to our colony flag, the more dangerous.
                , s2 => s2.pos.getRangeTo(room.colonyFlag)
                // Weaker creeps are killed faster.
                , s3 => s3.hits
                // Fewer heal parts are easier to kill.
                , s4 => s4.healParts
            ]);
            attacks = creeps;
        }

        // repairs last only if not healing or attacking.
        if (!halt && !heals.length && !attacks.length && okToRepair) {
            delete room.memory.spamRepair;

            // Repair whatever is in the cache currently to save cpu.
            if (room.memory.towerTargetId && Game.getObjectById(room.memory.towerTargetId)) {
                repairs.push(Game.getObjectById(room.memory.towerTargetId));
                overRepair = true;
            }
            else {

                // repair any structures that have decayed. Order by the weakest structures.
                // This will pick up roads/containers but NOT ramparts and bring them to their repair HP target.
                // Has to be done with minimum energy as containers will disappear.
                // This is smaller list with more likely to find hits, so check this before nonDecayStructures.
                if ((repairs.length < towers.length) && room.storage && room.isStorageEnergyMinimal) {
                    //let structures = room.infrastructureRepairSorted;
                    let structures = room.colonyRoadsNeedingRepairSorted;
                    repairs = repairs.concat(structures);

                    // If we have repairs below double repair then spam repairing.
                    // Note that infrastructureRepairSorted is sorted by percentage, not absolute decay amount.
                    // So this logic is a little wonkey since tunnels have far more hitsMax than plain roads.
                    if (repairs.length && (repairs[0].hits < (repairs[0].hitsMax - (TOWER_POWER_REPAIR * towers.length)))) {
                        room.memory.spamRepair = true;
                        overRepair = true;
                    }
                }

                if ((repairs.length < towers.length) && room.storage && room.isStorageEnergyNormal) {
                    //let hitsRepair = room.barrierHits + RAMPART_DECAY_AMOUNT;
                    //let structure = room.perimeterRampartsSorted.find(f => f.hits <= hitsRepair);
                    let structure = room.colonyRampartsNeedingRepairSorted[0];
                    if (structure) {
                        overRepair = true;
                        repairs.push(structure);
                        room.memory.towerTargetId = structure.id;
                    }
                }

                // Repair inbound nuke ramparts.
                if ((repairs.length < towers.length) && room.storage && room.isStorageEnergyNormal) {
                    let structure = room.nukeBarrierBelowRepairThreshhold;
                    if (structure) {
                        overRepair = true;
                        repairs = repairs.push(structure);
                        room.memory.towerTargetId = structure.id;
                    }
                }

            }

        }


        // We have heal & attack loops. Keep track of which tower we are currently processing.
        // Try to be efficient and split them up.
        let towerIndex = 0;

        // Heal creeps.
        // Attempt to heal multiple creeps if possible, and don't overheal.
        if ((towerIndex < towers.length) && (towers.length > 1 || !attacks.length)) {
            for (let h = 0; h < heals.length; h++) {
                let target = heals[h];
                let damage = target.hitsMax - target.hits - target.activeHealPower;
                for (let i = towerIndex; (damage > 0) && (i < towers.length); i++) {
                    let tower = towers[i];
                    // Subtract from damage what we can heal.
                    if (tower.heal(target) === OK) {
                        damage -= tower.getHealAmount(target);
                    }
                    towerIndex++;
                }
                if (towerIndex >= towers.length) break;
            }
        }

        // Enable power on our towers if needed.
        let roomPowerCreep = null;
        if (attacks.length || spamming) roomPowerCreep = room.powerCreep;

        // Attack creeps.
        // Wave one is to put one attack on each hostile, to cause spread damage and confuse priests.
        if (towerIndex < towers.length) {
            for (let a = 0; a < attacks.length; a++) {
                let target = attacks[a];
                let tower = towers[towerIndex];
                if (!testing) {
                    // Defensive tower gets power boost!
                    if (roomPowerCreep) roomPowerCreep.smartOperateTower(tower);
                    // If the tower can't attack for some reason, then stay on a (by subtracting one from it).
                    if (tower.attack(target) !== OK) {
                        a--;
                    }
                }
                towerIndex++;
                if (towerIndex >= towers.length) break;
            }
            // Wave two, overkill the primary target.
            if (attacks.length) {
                let target = attacks[0];
                for (let i = towerIndex; i < towers.length; i++) {
                    let tower = towers[i];
                    if (!testing) {
                        // Defensive tower gets power boost!
                        if (roomPowerCreep) roomPowerCreep.smartOperateTower(tower);
                        tower.attack(target);
                    }
                    towerIndex++;
                }
            }
        }

        // Repairs last only if not healing or attacking.
        if (repairs.length) {
            if (!overRepair) {
                // Stop when we have reached the end of the repair list.
                let repairIndex = 0;
                for (let i = 0; (i < towers.length) && (repairIndex < repairs.length); i++) {
                    let tower = towers[i];

                    // Get better output from towers if we are spamming them.
                    //if (spamming && roomPowerCreep) roomPowerCreep.smartOperateTower(tower);

                    let target = repairs[repairIndex];
                    // Only move to the next repair target if this repair was successful.
                    if (tower.repair(target) === OK) {
                        repairIndex++;
                    }
                }
            }

            if (overRepair) {
                for (let i = 0; i < towers.length; i++) {
                    let tower = towers[i];

                    // Get better output from towers if we are spamming them.
                    //if (spamming && roomPowerCreep) roomPowerCreep.smartOperateTower(tower);

                    // This mod trick will repair the same item if the targets in list is shorter than the tower list.
                    let target = repairs[i % repairs.length];
                    tower.repair(target);
                }
            }
        }


    }

}