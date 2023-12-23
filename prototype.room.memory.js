"use strict";

module.exports = function() {

	Room.prototype.updateRoomMemory = function() {
		// Every room will have these properties.
		this.updateRoomMemory_every()

		// Update our hostile information.
		this.updateRoomMemory_hostiles()

		// Record the presense of any novice walls.
		if (this.isHighwayRoom) {
			this.updateRoomMemory_highway();
		}
		else {
			this.updateRoomMemory_sector();
		}

		// Update our avoid data.
		this.updateRoomMemory_avoid()
    }

	Room.prototype.updateRoomMemory_every = function() {
		// Save the time we last updated this data.
		RoomIntel.setVisited(this.name);

		// Get loots room amounts for estimating rogues.
		RoomIntel.setPlunderables(this);

		// Set our portal info.
		RoomIntel.setPortals(this);

		// Record the rooms center position. Expensive operation, only do it at full CPU.
		RoomIntel.updateRoomCenterPos(this.name);
	}

	Room.prototype.updateRoomMemory_hostiles = function() {
		// Set all hostile creep data.
		RoomIntel.setHostiles(this);

		// Record invader strongholds.
		RoomIntel.setInvaderCore(this);
		RoomIntel.setStronghold(this);

		// Does this room has structures we want to dismantle?
		RoomIntel.setHasStructuresToDismantle(this);

		// Set our source keeper guard positions.
		RoomIntel.setSK(this);

		// Rooms that have hostile towers we should investigate.
		RoomIntel.setHostileSpawnCount(this);
		RoomIntel.setHostileTowerCount(this);

		// Does this room need a defender?
		RoomIntel.setRoomNeedsDefender(this);
		RoomIntel.setRoomNeedsBoostedDefender(this);

		// Relies on hostile creeps & structures to be set first.
		RoomIntel.setLastHostileAttack(this);
	}

	Room.prototype.updateRoomMemory_avoid = function() {
		// Now, given the information above, determine if the room should be avoided.
		// This flag is used by Traveler to determine creep pathing.
		if (
			// Rooms we don't own which are in novice/respawn status should be avoided.
			(
				!this.myProperty
				&& (RoomIntel.getRoomStatus(this.name) !== 'normal')
			)

			|| (
				// If there is a safe flag, then the room will never be marked as avoid.
				!FlagManager.safeFlags[this.name]

				&& (
					// Avoid flag exists in this room.
					!!FlagManager.avoidFlags[this.name]

					// Avoid stronghold rooms that have invader towers
					// Once stronghold or towers are killed, it becomes nuetered.
					|| RoomIntel.getStrongholdWarning(this.name)

					// There are destroy flags in this room meaning walls are preventing movement.
					// We can't reliably walk thru rooms with destroy flags, so avoid these rooms.
					|| this.destroyFlags.length

					// This hostile room could have active hostile towers or spawns, or worse...barriers.
					// Avoiding this room for normal traffic; defenders can still move into it.
					|| this.ownedByOther

					// If room is in safe mode, don't pass thru it.
					|| this.hostileSafeModeExpiresTime
				)
			)
		) {
			RoomIntel.setAvoid(this.name, Game.time);
		}
		else {
			RoomIntel.setAvoid(this.name, null);
		}
	}

	Room.prototype.updateRoomMemory_highway = function() {
		// Record the presense of novice walls, which can mess with pathing.
		// TODO: Record novice status rooms in memory hash, and if there are any, then perform this operation.
		// Otherwise it is safe to skip, correct?
		//RoomIntel.setHighwayNoviceWallsExist(this);

		RoomIntel.setPowerBanks(this);
		RoomIntel.setDeposits(this);
    }

	Room.prototype.updateRoomMemory_sector = function() {
		// Basic settings.
		RoomIntel.setOwner(this);
		RoomIntel.setLevel(this);
		RoomIntel.setMy(this);
		RoomIntel.setReservedBy(this);
		RoomIntel.setHasBarrierBelowThreshhold(this);

		// Hostile data.
		RoomIntel.setHostileSafeMode(this);
		RoomIntel.setSafeModeCooldownExpiresTime(this);
		RoomIntel.setHostileEnergy(this);

		// Record sources and minerals.
		RoomIntel.setSources(this);
		RoomIntel.setMineral(this);
		//RoomIntel.setThorium(this);

		// Set our nuke info.
		RoomIntel.setNukes(this);

		// Determine if the room needs its sign updated.
		SignManager.updateSign(this)
    }

}
