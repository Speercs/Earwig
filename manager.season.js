"use strict";

module.exports = function() {

    // if (!room.haltSpawning && !room.colonyUnsafe && room.colonyNeedsThoriumMiner) {
    //     room.logRoom('needs home thorium miner')
    //     creepSpawned = (spawn.createCreepMiner(room.thorium.id) === OK);
    //     if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
    // }

    // if (room.colonyNeedsEngineer) {
    //     room.logRoom('needs engineer')
    //     let workRoom = Cartographer.getSectorCoreRoom(room.name);
    //     let options = { includeClaim: !RoomIntel.getMyReactor(workRoom) }
    //     creepSpawned = (spawn.createCreepEngineer(workRoom, options) === OK);
    //     if (creepSpawned && !getNextSpawn()) break creepSpawnedLabel;
    // }

	// Object.defineProperty(Room.prototype, 'shouldCreateLabs', {
	// 	get() {
	// 		if (typeof this._shouldCreateLabs === "undefined") {
    //             // Default to returning true.
    //             this._shouldCreateLabs = true;

    //             // Season 5 specific logic.
    //             if (FlagManager.season5Flag) {
    //                 this._shouldCreateLabs = !!this.isSKAccessRoom || !!(this.unclaimFlagAnyColor && !this.unclaimFlagAnyColor.count);
    //             }
    //         }
	// 		return this._shouldCreateLabs;
	// 	},
	// 	configurable: true, enumerable: true,
	// });

	// Object.defineProperty(Room.prototype, 'isShortTerm', {
	// 	get() {
	// 		if (typeof this._isShortTerm === "undefined") {
    //             // Default to returning true.
    //             this._isShortTerm = false;

    //             // Season 5 specific logic.
    //             if (FlagManager.season5Flag) {
    //                 // Short terms are non-SK access rooms that are level 6 and do not have a white unclaim flag.
    //                 this._isShortTerm = !this.isSKAccessRoom && (this.controller.level >= 6) && !(this.unclaimFlagAnyColor && !this.unclaimFlagAnyColor.count);
    //             }
    //         }
	// 		return this._isShortTerm;
	// 	},
	// 	configurable: true, enumerable: true,
	// });

	// Object.defineProperty(Room.prototype, 'colonyNeedsThoriumMiner', {
	// 	get() {
	// 		if (typeof this._colonyNeedsThoriumMiner === "undefined") {
	// 			this._colonyNeedsThoriumMiner = false;

	// 			if (
	// 				this.isFortified
	// 				&& !this.noMineral
	// 				&& this.isStorageEnergyMinimal
	// 				&& this.thorium
	// 				&& this.colonyThoriumExtractor
	// 				&& this.doesColonyNeedThoriumMinerForRoomName(this.name)
	// 				&& RoomIntel.getThoriumId(this.name)
	// 				&& (CreepManager.getMinersByFocusId(RoomIntel.getThoriumId(this.name)).length < this.thorium.nips.length)
	// 			) {
    //                 this._colonyNeedsThoriumMiner = true;
	// 			}
    //         }
	// 		return this._colonyNeedsThoriumMiner;
	// 	},
	// 	configurable: true, enumerable: true,
	// });

}