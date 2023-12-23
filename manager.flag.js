"use strict";

class FlagManager {

    constructor() {
        // This is causing a performance issue on shards that we have no rooms but have old structures.
        if (!Object.keys(Game.rooms).length && !Object.keys(Game.creeps).length) return;

        this.updateFlagCache();
    }

    /**
     * Update room memory to set the avoid flag.
     */
    setAvoidRoom(roomName) {
        // Only set avoid if the room isn't visible or I don't own it.
        if (!Game.rooms[roomName] || !Game.rooms[roomName].my) {
            RoomIntel.setAvoid(roomName, Game.time);
        }
    }

    /**
     * For all avoid flags, force update their avoid indicator.
     */
    setAvoidFlagRooms() {
        Object.keys(this.avoidFlags).forEach(flag => {
            this.setAvoidRoom(flag);
        })
    }

    get scoutFlags() {
        if (typeof this._scoutFlags === "undefined") {
            this._scoutFlags = this._flagCache['scout'];
        }
        return this._scoutFlags
    }

    get assistFlags() {
        if (typeof this._assistFlags === "undefined") {
            this._assistFlags = this._flagCache['assist'];
        }
        return this._assistFlags
    }

    get claimFlags() {
        if (typeof this._claimFlags === "undefined") {
            this._claimFlags = this._flagCache['claim'];
        }
        return this._claimFlags;
    }

    get claimFlagsAnyColor() {
        if (typeof this._claimFlagsAnyColor === "undefined") {
            this._claimFlagsAnyColor = this._flagCache['claimanycolor'];
        }
        return this._claimFlagsAnyColor;
    }

    get avoidFlags() {
        if (typeof this._avoidFlags === "undefined") {
            this._avoidFlags = this._flagCache['avoid'];
        }
        return this._avoidFlags;
    }

    get safeFlags() {
        if (typeof this._safeFlags === "undefined") {
            this._safeFlags = this._flagCache['safe'];
        }
        return this._safeFlags;
    }

    get powercreepFlags() {
        if (typeof this._powercreepFlags === "undefined") {
            this._powercreepFlags = this._flagCache['powercreep'];
        }
        return this._powercreepFlags;
    }

    get golddiggerFlags() {
        if (typeof this._golddiggerFlags === "undefined") {
            this._golddiggerFlags = this._flagCache['golddigger'];
        }
        return this._golddiggerFlags;
    }

    /**
     * Special case: it is intended that nukes will have more than one flag per room.
     */
    get nukeFlags() {
        if (typeof this._nukeFlags === "undefined") {
            this._nukeFlags = Object.values(this._flagCache['nuke']);
        }
        return this._nukeFlags;
    }

    /**
     * Special case: it is intended that destroy locations will have more than one flag per room.
     */
    get destroyFlags() {
        if (typeof this._destroyFlags === "undefined") {
            this._destroyFlags = Object.values(this._flagCache['destroy']);
        }
        return this._destroyFlags;
    }

	get destroyFlagsGroupedByRoomName() {
        if (typeof this._destroyFlagsGroupedByRoomName === "undefined") {
            this._destroyFlagsGroupedByRoomName = utils.groupBy(this.destroyFlags, 'roomName');
        }
        return this._destroyFlagsGroupedByRoomName;
	}

    destroyFlagsByRoomName(roomName) {
        return this.destroyFlagsGroupedByRoomName[roomName] || [];
    }

    /**
     * Special case: it is intended that autonuke locations will have more than one flag per room.
     */
    get autonukeFlags() {
        if (typeof this._autonukeFlags === "undefined") {
            this._autonukeFlags = Object.values(this._flagCache['autonuke']);
        }
        return this._autonukeFlags;
    }

	get autonukeFlagsGroupedByRoomName() {
        if (typeof this._autonukeFlagsGroupedByRoomName === "undefined") {
            this._autonukeFlagsGroupedByRoomName = utils.groupBy(this.autonukeFlags, 'roomName');
        }
        return this._autonukeFlagsGroupedByRoomName;
	}

    autonukeFlagsByRoomName(roomName) {
        return this.autonukeFlagsGroupedByRoomName[roomName] || [];
    }

    /**
     * For autonuking a specific room.
     */
    get autonukeroomFlags() {
        if (typeof this._autonukeroomFlags === "undefined") {
            this._autonukeroomFlags = this._flagCache['autonukeroom'];
        }
        return this._autonukeroomFlags;
    }

    get nostrongholdFlags() {
        if (typeof this._nostrongholdFlags === "undefined") {
            this._nostrongholdFlags = this._flagCache['nostronghold'];
        }
        return this._nostrongholdFlags;
    }

    get nopowerbankFlags() {
        if (typeof this._nopowerbankFlags === "undefined") {
            this._nopowerbankFlags = this._flagCache['nopowerbank'];
        }
        return this._nopowerbankFlags;
    }

    get nodepositFlags() {
        if (typeof this._nodepositFlags === "undefined") {
            this._nodepositFlags = this._flagCache['nodeposit'];
        }
        return this._nodepositFlags;
    }

    get nomineralFlags() {
        if (typeof this._nomineralFlags === "undefined") {
            this._nomineralFlags = this._flagCache['nomineral'];
        }
        return this._nomineralFlags;
    }

    get reserveFlags() {
        if (typeof this._reserveFlags === "undefined") {
            this._reserveFlags = this._flagCache['reserve'];
        }
        return this._reserveFlags;
    }

    get noreserveFlags() {
        if (typeof this._noreserveFlags === "undefined") {
            this._noreserveFlags = this._flagCache['noreserve'];
        }
        return this._noreserveFlags;
    }

    get guardFlags() {
        if (typeof this._guardFlags === "undefined") {
            this._guardFlags = this._flagCache['guard'];
        }
        return this._guardFlags;
    }

    get portalPreacherFlags() {
        if (typeof this._portalPreacherFlags === "undefined") {
            this._portalPreacherFlags = this._flagCache['portalpreacher'];
        }
        return this._portalPreacherFlags;
    }

    get portalPeonFlags() {
        if (typeof this._portalPeonFlags === "undefined") {
            this._portalPeonFlags = this._flagCache['portalpeon'];
        }
        return this._portalPeonFlags;
    }

    get portalArcherFlags() {
        if (typeof this._portalArcherFlags === "undefined") {
            this._portalArcherFlags = this._flagCache['portalarcher'];
        }
        return this._portalArcherFlags;
    }

    get sectorFlags() {
        if (typeof this._sectorFlags === "undefined") {
            this._sectorFlags = this._flagCache['sector'];
        }
        return this._sectorFlags;
    }

    get nopowerextensionFlags() {
        if (typeof this._nopowerextensionFlags === "undefined") {
            this._nopowerextensionFlags = this._flagCache['nopowerextension'];
        }
        return this._nopowerextensionFlags;
    }

    get nopowerspawnFlags() {
        if (typeof this._nopowerspawnFlags === "undefined") {
            this._nopowerspawnFlags = this._flagCache['nopowerspawn'];
        }
        return this._nopowerspawnFlags;
    }

    get nopowerstorageFlags() {
        if (typeof this._nopowerstorageFlags === "undefined") {
            this._nopowerstorageFlags = this._flagCache['nopowerstorage'];
        }
        return this._nopowerstorageFlags;
    }

    get nopowerterminalFlags() {
        if (typeof this._nopowerterminalFlags === "undefined") {
            this._nopowerterminalFlags = this._flagCache['nopowerterminal'];
        }
        return this._nopowerterminalFlags;
    }

    get nopowerlabFlags() {
        if (typeof this._nopowerlabFlags === "undefined") {
            this._nopowerlabFlags = this._flagCache['nopowerlab'];
        }
        return this._nopowerlabFlags;
    }

    get nopowerpowerFlags() {
        if (typeof this._nopowerpowerFlags === "undefined") {
            this._nopowerpowerFlags = this._flagCache['nopowerpower'];
        }
        return this._nopowerpowerFlags;
    }

    get colonyFlags() {
        if (typeof this._colonyFlags === "undefined") {
            this._colonyFlags = this._flagCache['colony'];
        }
        return this._colonyFlags;
    }

    get colonyFlagsAnyColor() {
        if (typeof this._colonyFlagsAnyColor === "undefined") {
            this._colonyFlagsAnyColor = this._flagCache['colonyanycolor'];
        }
        return this._colonyFlagsAnyColor;
    }

    get assaultFlags() {
        if (typeof this._assaultFlags === "undefined") {
            this._assaultFlags = this._flagCache['assault'];
        }
        return this._assaultFlags;
    }

    get rallyFlags() {
        if (typeof this._rallyFlags === "undefined") {
            this._rallyFlags = this._flagCache['rally'];
        }
        return this._rallyFlags;
    }

    get rallyminerFlags() {
        if (typeof this._rallyminerFlags === "undefined") {
            this._rallyminerFlags = this._flagCache['rallyminer'];
        }
        return this._rallyminerFlags;
    }

    get factoryFlags() {
        if (typeof this._factoryFlags === "undefined") {
            this._factoryFlags = this._flagCache['factory'];
        }
        return this._factoryFlags;
    }

    get skmFlags() {
        if (typeof this._skmFlags === "undefined") {
            this._skmFlags = this._flagCache['skm'];
        }
        return this._skmFlags;
    }

    get templeFlags() {
        if (typeof this._templeFlags === "undefined") {
            this._templeFlags = this._flagCache['temple'];
        }
        return this._templeFlags;
    }

    get templeFlagsAnyColor() {
        if (typeof this._templeFlagsAnyColor === "undefined") {
            this._templeFlagsAnyColor = this._flagCache['templeanycolor'];
        }
        return this._templeFlagsAnyColor;
    }

    get unclaimFlags() {
        if (typeof this._unclaimFlags === "undefined") {
            this._unclaimFlags = this._flagCache['unclaim'];
        }
        return this._unclaimFlags;
    }

    get unclaimFlagsAnyColor() {
        if (typeof this._unclaimFlagsAnyColor === "undefined") {
            this._unclaimFlagsAnyColor = this._flagCache['unclaimanycolor'];
        }
        return this._unclaimFlagsAnyColor;
    }

    get observeFlags() {
        if (typeof this._observeFlags === "undefined") {
            this._observeFlags = this._flagCache['observe'];
        }
        return this._observeFlags;
    }

    get nonukeFlags() {
        if (typeof this._nonukeFlags === "undefined") {
            this._nonukeFlags = this._flagCache['nonuke'];
        }
        return this._nonukeFlags;
    }

    get nocolonyFlags() {
        if (typeof this._nocolonyFlags === "undefined") {
            this._nocolonyFlags = this._flagCache['nocolony'];
        }
        return this._nocolonyFlags;
    }

    get nobuilderFlags() {
        if (typeof this._nobuilderFlags === "undefined") {
            this._nobuilderFlags = this._flagCache['nobuilder'];
        }
        return this._nobuilderFlags;
    }

    get notempleFlags() {
        if (typeof this._notempleFlags === "undefined") {
            this._notempleFlags = this._flagCache['notemple'];
        }
        return this._notempleFlags;
    }

    updateFlagCache() {
        // Bail out if this has already been run once.
        if (this._flagCache) return;
        this._flagCache = {};

        // Initialize.
        this._flagCache['nuke'] = {};
        this._flagCache['destroy'] = {};
        this._flagCache['autonuke'] = {};
        this._flagCache['autonukeroom'] = {};
        this._flagCache['claim'] = {};
        this._flagCache['claimanycolor'] = {};
        this._flagCache['avoid'] = {};
        this._flagCache['safe'] = {};
        this._flagCache['assist'] = {};
        this._flagCache['scout'] = {};
        this._flagCache['colony'] = {};
        this._flagCache['colonyanycolor'] = {};
        this._flagCache['powercreep'] = {};
        this._flagCache['golddigger'] = {};
        this._flagCache['nostronghold'] = {};
        this._flagCache['nopowerbank'] = {};
        this._flagCache['nodeposit'] = {};
        this._flagCache['nomineral'] = {};
        this._flagCache['reserve'] = {};
        this._flagCache['noreserve'] = {};
        this._flagCache['portalpreacher'] = {};
        this._flagCache['portalpeon'] = {};
        this._flagCache['portalarcher'] = {};
        this._flagCache['guard'] = {};
        this._flagCache['sector'] = {};
        this._flagCache['nopowerextension'] = {};
        this._flagCache['nopowerspawn'] = {};
        this._flagCache['nopowerstorage'] = {};
        this._flagCache['nopowerterminal'] = {};
        this._flagCache['nopowerlab'] = {};
        this._flagCache['nopowerpower'] = {};
        this._flagCache['temple'] = {};
        this._flagCache['templeanycolor'] = {};
        this._flagCache['assault'] = {};
        this._flagCache['rally'] = {};
        this._flagCache['rallyminer'] = {};
        this._flagCache['factory'] = {};
        this._flagCache['skm'] = {};
        this._flagCache['unclaim'] = {};
        this._flagCache['unclaimanycolor'] = {};
        this._flagCache['observe'] = {};
        this._flagCache['nonuke'] = {};
        this._flagCache['nocolony'] = {};
        this._flagCache['nobuilder'] = {};
        this._flagCache['notemple'] = {};

        for (let name in Game.flags) {
            let flag = Game.flags[name];
            let flagParts = flag.name.split(' ');

            let command = flagParts[0];
            let part1 = flagParts[1];
            let part2 = flagParts[2];
            let part3 = flagParts[3];
            let part4 = flagParts[4];
            let count = C.COLOR_TO_NUMBER[flag.color];

            switch (command) {

                case 'colony':
                    // command is 'colony'
                    // Format is: colony SPAWNROOM
                    // Example: colony E26S32
                    // Note that white flags are still returned in this set for debugging.
                    if (
                        command === 'colony'
                        && flagParts.length >= 2
                        && flagParts.length <= 3
                    ) {
                        // Old format was colony v2 roomName, so need to check for 3 parts.
                        let roomName = (flagParts.length == 2) ? part1 : part2;
                        let item = {
                            flag: flag
                            , roomName: roomName
                            , count: count
                        }
                        this._flagCache['colony'][roomName] = item;

                        this._flagCache['colonyanycolor'][roomName] = item;
                    }
                    break;

                case 'nocolony':
                    // command is 'nocolony'
                    // Format is: nocolony WORKROOM
                    // Example: nocolony E26S32
                    if (
                        command === 'nocolony'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , roomName: part1
                            , count: count
                        }
                        this._flagCache['nocolony'][part1] = item;
                    }
                    break;

                case 'nostronghold':
                    // command is 'nostronghold'
                    // Format is: nostronghold WORKROOM
                    // Example: nostronghold E26S32
                    if (
                        command === 'nostronghold'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nostronghold'][part1] = item;
                    }
                    break;

                case 'nopowerbank':
                    // command is 'nopowerbank'
                    // Format is: nopowerbank WORKROOM
                    // Example: nopowerbank E26S32
                    if (
                        command === 'nopowerbank'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nopowerbank'][part1] = item;
                    }
                    break;

                case 'nodeposit':
                    // command is 'nodeposit'
                    // Format is: nodeposit WORKROOM
                    // Example: nodeposit E26S32
                    if (
                        command === 'nodeposit'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nodeposit'][part1] = item;
                    }
                    break;

                case 'nomineral':
                    // command is 'nomineral'
                    // Format is: nomineral WORKROOM
                    // Example: nomineral E26S32
                    if (
                        command === 'nomineral'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nomineral'][part1] = item;
                    }
                    break;

                case 'reserve':
                    // command is 'reserve'
                    // Format is: reserve WORKROOM
                    // Example: reserve E26S32
                    if (
                        command === 'reserve'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['reserve'][part1] = item;
                    }
                    break;

                case 'noreserve':
                    // command is 'noreserve'
                    // Format is: noreserve WORKROOM
                    // Example: noreserve E26S32
                    if (
                        command === 'noreserve'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['noreserve'][part1] = item;
                    }
                    break;

                case 'guard':
                    // command is 'guard'
                    // Format is: guard WORKROOM
                    // Example: guard E26S32
                    if (
                        command === 'guard'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }
                        this._flagCache['guard'][part1] = item;
                    }
                    break;

                case 'portalpreacher':
                    // command is 'portalpreacher'
                    // Format is: portalpreacher SPAWNROOM WORKROOM
                    // Example: portalpreacher E26S32 E20S30
                    if (
                        command === 'portalpreacher'
                        && flagParts.length === 3
                        && count > 0
                    ) {
                        let item = {
                            spawnRoom: part1
                            , workRoom: part2
                            , count: count
                        }
                        this._flagCache['portalpreacher'][flag.name] = item;
                    }
                    break;

                case 'portalpeon':
                    // command is 'portalpeon'
                    // Format is: portalpeon SPAWNROOM WORKROOM
                    // Example: portalpeon E26S32 E20S30
                    if (
                        command === 'portalpeon'
                        && flagParts.length === 3
                        && count > 0
                    ) {
                        let item = {
                            spawnRoom: part1
                            , workRoom: part2
                            , count: count
                        }
                        this._flagCache['portalpeon'][flag.name] = item;
                    }
                    break;

                case 'portalarcher':
                    // command is 'portalarcher'
                    // Format is: portalarcher SPAWNROOM WORKROOM
                    // Example: portalarcher E26S32 E20S30
                    if (
                        command === 'portalarcher'
                        && flagParts.length === 3
                        && count > 0
                    ) {
                        let item = {
                            spawnRoom: part1
                            , workRoom: part2
                            , count: count
                        }
                        this._flagCache['portalarcher'][flag.name] = item;
                    }
                    break;

                case 'powercreep':
                    // command is 'powercreep'
                    // Format is: powercreep [f1/f2/f3/f4/f5 shard0/shard1/shard2/shard3]
                    // Example: powercreep f1 shard3
                    // Note that shard is an optional part of name, but should be specified.
                    if (
                        command === 'powercreep'
                        && flagParts.length >= 2
                        && flagParts.length <= 3
                        && count > 0
                    ) {
                        let item = {
                            name: (part1 + ' ' + (part2 ? part2 : '')).trim()
                            , count: count
                            , flag: flag
                        }
                        this._flagCache['powercreep'][flag.pos.roomName] = item;

                        // Special case, if this is a "g" flag then its a golddigger and can be tracked seperately.
                        if (part1.substring(0, 1) === 'g') {
                            this._flagCache['golddigger'][flag.pos.roomName] = item;
                        }
                    }
                    break;

                case 'scout':
                    // command is 'scout'
                    // Format is: scout WORKROOM
                    // Example: scout E26S31
                    if (
                        command === 'scout'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['scout'][flag.name] = item;
                    }
                    break;

                case 'claim':
                    // command is 'claim'
                    // Format is: claim WORKROOM
                    // Example: claim E26S32
                    if (
                        command === 'claim'
                        && flagParts.length === 2
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                            , flag: flag
                        }
                        if (count > 0) {
                            this._flagCache['claim'][part1] = item;
                        }
                        // Record flags of any color as well.
                        this._flagCache['claimanycolor'][part1] = item;
                    }

                case 'avoid':
                    // command is 'avoid'
                    // Format is: avoid WORKROOM
                    // Example: avoid E26S32
                    if (
                        command === 'avoid'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            avoidRoom: part1
                            , count: count
                        }
                        this._flagCache['avoid'][part1] = item;
                    }
                    break;

                case 'safe':
                    // command is 'safe'
                    // Format is: safe WORKROOM
                    // Example: safe E26S32
                    if (
                        command === 'safe'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            safeRoom: part1
                            , count: count
                        }
                        this._flagCache['safe'][part1] = item;
                    }
                    break;

                case 'assist':
                    // command is 'assist'
                    // Format is: assist SPAWNROOM WORKROOM ROLE [ASSIGNEDROOM] (color flag)
                    // Example: assist E26S32 E26S31 peon
                    if (
                        command === 'assist'
                        && (flagParts.length >= 4 )
                        && (count > 0)
                    ) {
                        let item = {
                            spawnRoom: part1
                            , workRoom: part2
                            , role: part3
                            , assignedRoom: part4 || part2
                            , count: count
                        }
                        this._flagCache['assist'][flag.name] = item;
                    }
                    break;

                case 'nuke':
                    // command is 'nuke'
                    // Format is: nuke a
                    // Example: nuke 1, nuke 2
                    if (
                        command === 'nuke'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , count: count
                        }

                        this._flagCache['nuke'][flag.name] = item;
                    }
                    break;

                case 'destroy':
                    // command is 'destroy'
                    // Format is: destroy [pos.name] [type]
                    // Type would be 'c' for controller barrier, 'a' for spawn, 's' for source.
                    // Example: destroy 3_5_W5N53 c, destroy 35_10_E3S32 s
                    if (
                        command === 'destroy'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , roomName: flag.pos.roomName
                            , id: part1
                            , type: part2
                            , count: count
                        }

                        this._flagCache['destroy'][flag.name] = item;
                    }
                    break;

                case 'autonuke':
                    // command is 'autonuke'
                    // Format is: autonuke pos
                    // Example: autonuke 12_34_E1N45
                    if (
                        command === 'autonuke'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , roomName: flag.pos.roomName
                            , count: count
                        }

                        this._flagCache['autonuke'][flag.name] = item;
                    }
                    break;

                case 'autonukeroom':
                    // command is 'autonukeroom'
                    // Format is: autonukeroom WORKROOM
                    // Example: autonukeroom E26S32
                    if (
                        command === 'autonukeroom'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['autonukeroom'][part1] = item;
                    }
                    break;

                case 'sector':
                    // command is 'sector'
                    // Format is: sector roomName
                    // Example: sector E5N52
                    // Note the index will be the sector name of the supplied room.
                    if (
                        command === 'sector'
                        && count > 0
                    ) {
                        let sector = Cartographer.getSector(part1);
                        let item = {
                            flag: flag
                            , sector: sector
                            , count: count
                        }

                        this._flagCache['sector'][sector] = item;
                    }
                    break;

                case 'nopowerextension':
                    // command is 'nopowerextension'
                    // Format is: nopowerextension roomName
                    // Example: nopowerextension E5N52
                    if (
                        command === 'nopowerextension'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerextension'][part1] = item;
                    }
                    break;

                case 'nopowerspawn':
                    // command is 'nopowerspawn'
                    // Format is: nopowerspawn roomName
                    // Example: nopowerspawn E5N52
                    if (
                        command === 'nopowerspawn'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerspawn'][part1] = item;
                    }
                    break;

                case 'nopowerstorage':
                    // command is 'nopowerstorage'
                    // Format is: nopowerstorage roomName
                    // Example: nopowerstorage E5N52
                    if (
                        command === 'nopowerstorage'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerstorage'][part1] = item;
                    }
                    break;

                case 'nopowerterminal':
                    // command is 'nopowerterminal'
                    // Format is: nopowerterminal roomName
                    // Example: nopowerterminal E5N52
                    if (
                        command === 'nopowerterminal'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerterminal'][part1] = item;
                    }
                    break;

                case 'nopowerlab':
                    // command is 'nopowerlab'
                    // Format is: nopowerlab roomName
                    // Example: nopowerlab E5N52
                    if (
                        command === 'nopowerlab'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerlab'][part1] = item;
                    }
                    break;

                case 'nopowerpower':
                    // command is 'nopowerpower'
                    // Format is: nopowerpower roomName
                    // Example: nopowerpower E5N52
                    if (
                        command === 'nopowerpower'
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }

                        this._flagCache['nopowerpower'][part1] = item;
                    }
                    break;

                case 'assault':
                    // command is 'assault'
                    // Format is: assault WORKROOM
                    // Example: assault E26S32
                    if (
                        command === 'assault'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }
                        this._flagCache['assault'][part1] = item;
                    }
                    break;

                case 'rally':
                    // command is 'rally'
                    // Format is: rally WORKROOM
                    // Example: rally E26S32
                    if (
                        command === 'rally'
                        && flagParts.length === 2
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }
                        this._flagCache['rally'][part1] = item;
                    }
                    break;

                case 'rallyminer':
                    // command is 'rallyminer'
                    // Format is: rallyminer WORKROOM
                    // Example: rallyminer E26S32
                    if (
                        command === 'rallyminer'
                        && flagParts.length === 2
                    ) {
                        let item = {
                            flag: flag
                            , workRoom: part1
                            , count: count
                        }
                        this._flagCache['rallyminer'][part1] = item;
                    }
                    break;

                case 'factory':
                    // command is 'factory'
                    // Format is: factory WORKROOM
                    // Example: factory E26S32
                    if (
                        command === 'factory'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['factory'][part1] = item;
                    }
                    break;

                case 'skm':
                    // command is 'skm'
                    // Format is: skm WORKROOM
                    // Example: skm E26S32
                    if (
                        command === 'skm'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['skm'][part1] = item;
                    }
                    break;

                case 'temple':
                    // command is 'temple'
                    // Format is: temple WORKROOM
                    // Example: temple E26S32
                    if (
                        command === 'temple'
                        && flagParts.length === 2
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                            , flag: flag
                        }
                        if (count > 0) {
                            this._flagCache['temple'][part1] = item;
                        }
                        // Record flags of any color as well.
                        this._flagCache['templeanycolor'][part1] = item;
                    }
                    break;

                case 'unclaim':
                    // command is 'unclaim'
                    // Format is: unclaim WORKROOM
                    // Example: unclaim E26S32
                    if (
                        command === 'unclaim'
                        && flagParts.length === 2
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        if (count > 0) {
                            this._flagCache['unclaim'][part1] = item;
                        }
                        // Record flags of any color as well.
                        this._flagCache['unclaimanycolor'][part1] = item;
                    }
                    break;

                case 'observe':
                    // command is 'observe'
                    // Format is: observe WORKROOM
                    // Example: observe E26S32
                    if (
                        command === 'observe'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['observe'][part1] = item;
                    }
                    break;

                case 'nonuke':
                    // command is 'nonuke'
                    // Format is: nonuke WORKROOM
                    // Example: nonuke E26S32
                    if (
                        command === 'nonuke'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nonuke'][part1] = item;
                    }
                    break;

                case 'nobuilder':
                    // command is 'nobuilder'
                    // Format is: nobuilder WORKROOM
                    // Example: nobuilder E26S32
                    if (
                        command === 'nobuilder'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['nobuilder'][part1] = item;
                    }
                    break;

                case 'notemple':
                    // command is 'notemple'
                    // Format is: notemple WORKROOM
                    // Example: notemple E26S32
                    if (
                        command === 'notemple'
                        && flagParts.length === 2
                        && count > 0
                    ) {
                        let item = {
                            workRoom: part1
                            , count: count
                        }
                        this._flagCache['notemple'][part1] = item;
                    }
                    break;

            }

        }
    }

    /**
     * gcl flag must be non-white. Used to determine if all rooms should be used, or if one should be saved.
     * The flag will make it so that all rooms are used.
     */
    get gclFlag() {
        if (typeof this._gclFlag === "undefined") {
            this._gclFlag = null;
            if (Game.flags.gcl && (Game.flags.gcl.color !== COLOR_WHITE)) {
                this._gclFlag = Game.flags.gcl;
            }
        }
        return this._gclFlag;
    }

    /**
     * Key to launch manual "nuke" flags.
     */
    get launchFlag() {
        if (typeof this._launchFlag === "undefined") {
            this._launchFlag = null;
            if (Game.flags.launch && (Game.flags.launch.color !== COLOR_WHITE)) {
                this._launchFlag = Game.flags.launch;
            }
        }
        return this._launchFlag;
    }

    /**
     * Key to launch script-placed "autonuke" flags.
     */
    get autolaunchFlag() {
        if (typeof this._autolaunchFlag === "undefined") {
            this._autolaunchFlag = null;
            if (Game.flags.autolaunch && (Game.flags.autolaunch.color !== COLOR_WHITE)) {
                this._autolaunchFlag = Game.flags.autolaunch;
            }
        }
        return this._autolaunchFlag;
    }

    /**
     * notick flag must be non-white.
     */
    get notickFlag() {
        if (typeof this._notickFlag === "undefined") {
            this._notickFlag = null;
            if (Game.flags.notick && (Game.flags.notick.color !== COLOR_WHITE)) {
                this._notickFlag = Game.flags.notick;
            }
        }
        return this._notickFlag;
    }

    get notickinfoFlag() {
        if (typeof this._notickinfoFlag === "undefined") {
            this._notickinfoFlag = null;
            if (Game.flags.notickinfo && (Game.flags.notickinfo.color !== COLOR_WHITE)) {
                this._notickinfoFlag = Game.flags.notickinfo;
            }
        }
        return this._notickinfoFlag;
    }

    /**
     * noreserve flag must be non-white.
     */
    get noreserveFlag() {
        if (typeof this._noreserveFlag === "undefined") {
            this._noreserveFlag = null;
            if (Game.flags.noreserve && (Game.flags.noreserve.color !== COLOR_WHITE)) {
                this._noreserveFlag = Game.flags.noreserve;
            }
        }
        return this._noreserveFlag;
    }

    /**
     * testing flag must be non-white.
     */
    get testingFlag() {
        if (typeof this._testingFlag === "undefined") {
            this._testingFlag = null;
            if (Game.flags.testing && (Game.flags.testing.color !== COLOR_WHITE)) {
                this._testingFlag = Game.flags.testing;
            }
        }
        return this._testingFlag;
    }

    get terminalBuyAvgPercentFlag() {
        if (typeof this._terminalBuyAvgPercentFlag === "undefined") {
            const flagName = 'terminal buy avg percent'
            this._terminalBuyAvgPercentFlag = null;
            if (Game.flags[flagName] && (Game.flags[flagName].color !== COLOR_WHITE)) {
                this._terminalBuyAvgPercentFlag = Game.flags[flagName];
            }
        }
        return this._terminalBuyAvgPercentFlag;
    }

    get reservedRoomDistanceFlag() {
        if (typeof this._reservedRoomDistanceFlag === "undefined") {
            const flagName = 'reserved room distance'
            this._reservedRoomDistanceFlag = null;
            if (Game.flags[flagName] && (Game.flags[flagName].color !== COLOR_WHITE)) {
                this._reservedRoomDistanceFlag = Game.flags[flagName];
            }
        }
        return this._reservedRoomDistanceFlag;
    }

    get autoassaultRoomDistanceFlag() {
        if (typeof this._autoassaultRoomDistanceFlag === "undefined") {
            const flagName = 'autoassault room distance'
            this._autoassaultRoomDistanceFlag = null;
            if (Game.flags[flagName] && (Game.flags[flagName].color !== COLOR_WHITE)) {
                this._autoassaultRoomDistanceFlag = Game.flags[flagName];
            }
        }
        return this._autoassaultRoomDistanceFlag;
    }

    get autoassaultLongRangeDistanceFlag() {
        if (typeof this._autoassaultLongRangeDistance === "undefined") {
            const flagName = 'autoassault long range distance'
            this._autoassaultLongRangeDistance = null;
            if (Game.flags[flagName] && (Game.flags[flagName].color !== COLOR_WHITE)) {
                this._autoassaultLongRangeDistance = Game.flags[flagName];
            }
        }
        return this._autoassaultLongRangeDistance;
    }

    get pixelFlag() {
        if (typeof this._pixelFlag === "undefined") {
            this._pixelFlag = null;
            if (Game.flags.pixel && (Game.flags.pixel.color !== COLOR_WHITE)) {
                this._pixelFlag = Game.flags.pixel;
            }
        }
        return this._pixelFlag;
    }

    get autotempleFlag() {
        if (typeof this._autotempleFlag === "undefined") {
            this._autotempleFlag = null;
            if (Game.flags.autotemple && (Game.flags.autotemple.color !== COLOR_WHITE)) {
                this._autotempleFlag = Game.flags.autotemple;
            }
        }
        return this._autotempleFlag;
    }

    get noupgradeFlag() {
        if (typeof this._noupgradeFlag === "undefined") {
            this._noupgradeFlag = null;
            if (Game.flags.noupgrade && (Game.flags.noupgrade.color !== COLOR_WHITE)) {
                this._noupgradeFlag = Game.flags.noupgrade;
            }
        }
        return this._noupgradeFlag;
    }

    get nowallFlag() {
        if (typeof this._noupgradeFlag === "undefined") {
            this._nowallFlag = null;
            if (Game.flags.nowall && (Game.flags.nowall.color !== COLOR_WHITE)) {
                this._nowallFlag = Game.flags.nowall;
            }
        }
        return this._nowallFlag;
    }

    get haltfocusFlag() {
        if (typeof this._haltfocusFlag === "undefined") {
            this._haltfocusFlag = null;
            if (Game.flags.haltfocus && (Game.flags.haltfocus.color !== COLOR_WHITE)) {
                this._haltfocusFlag = Game.flags.haltfocus;
            }
        }
        return this._haltfocusFlag;
    }

    get noautoclaimFlag() {
        if (typeof this._noautoclaimFlag === "undefined") {
            this._noautoclaimFlag = null;
            if (Game.flags.noautoclaim && (Game.flags.noautoclaim.color !== COLOR_WHITE)) {
                this._noautoclaimFlag = Game.flags.noautoclaim;
            }
        }
        return this._noautoclaimFlag;
    }

    get noverboseFlag() {
        if (typeof this._noverboseFlag === "undefined") {
            this._noverboseFlag = null;
            if (Game.flags.noverbose && (Game.flags.noverbose.color !== COLOR_WHITE)) {
                this._noverboseFlag = Game.flags.noverbose;
            }
        }
        return this._noverboseFlag;
    }

    get visualsFlag() {
        if (typeof this._visualsFlag === "undefined") {
            this._visualsFlag = null;
            if (Game.flags.visuals && (Game.flags.visuals.color !== COLOR_WHITE)) {
                this._visualsFlag = Game.flags.visuals;
            }
        }
        return this._visualsFlag;
    }

    get colonyFlag() {
        if (typeof this._colonyFlag === "undefined") {
            this._colonyFlag = null;
            if (Game.flags.colony && (Game.flags.colony.color !== COLOR_WHITE)) {
                this._colonyFlag = Game.flags.colony;
            }
        }
        return this._colonyFlag;
    }

    get mapFlag() {
        if (typeof this._mapFlag === "undefined") {
            this._mapFlag = null;
            if (Game.flags.map && (Game.flags.map.color !== COLOR_WHITE)) {
                this._mapFlag = Game.flags.map;
            }
        }
        return this._mapFlag;
    }

    get forcetempleFlag() {
        if (typeof this._forcetempleFlag === "undefined") {
            this._forcetempleFlag = null;
            if (Game.flags.forcetemple && (Game.flags.forcetemple.color !== COLOR_WHITE)) {
                this._forcetempleFlag = Game.flags.forcetemple;
            }
        }
        return this._forcetempleFlag;
    }

    get creepcpureserveFlag() {
        if (typeof this._creepCpuReserveFlag === "undefined") {
            this._creepCpuReserveFlag = null;
            if (Game.flags.creepcpureserve && (Game.flags.creepcpureserve.color !== COLOR_WHITE)) {
                this._creepCpuReserveFlag = Game.flags.creepcpureserve;
            }
        }
        return this._creepCpuReserveFlag;
    }

    get nobuildlimitFlag() {
        if (typeof this._nobuildlimitFlag === "undefined") {
            this._nobuildlimitFlag = null;
            if (Game.flags.nobuildlimit && (Game.flags.nobuildlimit.color !== COLOR_WHITE)) {
                this._nobuildlimitFlag = Game.flags.nobuildlimit;
            }
        }
        return this._nobuildlimitFlag;
    }

    get nofarmlimitFlag() {
        if (typeof this._nofarmlimitFlag === "undefined") {
            this._nofarmlimitFlag = null;
            if (Game.flags.nofarmlimit && (Game.flags.nofarmlimit.color !== COLOR_WHITE)) {
                this._nofarmlimitFlag = Game.flags.nofarmlimit;
            }
        }
        return this._nofarmlimitFlag;
    }

    get noprocesspowerFlag() {
        if (typeof this._noprocesspowerFlag === "undefined") {
            this._noprocesspowerFlag = null;
            if (Game.flags.noprocesspower && (Game.flags.noprocesspower.color !== COLOR_WHITE)) {
                this._noprocesspowerFlag = Game.flags.noprocesspower;
            }
        }
        return this._noprocesspowerFlag;
    }

    get setreservedroomsFlag() {
        if (typeof this._setreservedroomsFlag === "undefined") {
            this._setreservedroomsFlag = null;
            if (Game.flags.setreservedrooms && (Game.flags.setreservedrooms.color !== COLOR_WHITE)) {
                this._setreservedroomsFlag = Game.flags.setreservedrooms;
            }
        }
        return this._setreservedroomsFlag;
    }

    get nocreditlimitFlag() {
        if (typeof this._nocreditlimitFlag === "undefined") {
            this._nocreditlimitFlag = null;
            if (Game.flags.nocreditlimit && (Game.flags.nocreditlimit.color !== COLOR_WHITE)) {
                this._nocreditlimitFlag = Game.flags.nocreditlimit;
            }
        }
        return this._nocreditlimitFlag;
    }

    get nostrongholdFlag() {
        if (typeof this._nostrongholdFlag === "undefined") {
            this._nostrongholdFlag = null;
            if (Game.flags.nostronghold && (Game.flags.nostronghold.color !== COLOR_WHITE)) {
                this._nostrongholdFlag = Game.flags.nostronghold;
            }
        }
        return this._nostrongholdFlag;
    }

    get nopowerbankFlag() {
        if (typeof this._nopowerbankFlag === "undefined") {
            this._nopowerbankFlag = null;
            if (Game.flags.nopowerbank && (Game.flags.nopowerbank.color !== COLOR_WHITE)) {
                this._nopowerbankFlag = Game.flags.nopowerbank;
            }
        }
        return this._nopowerbankFlag;
    }

    get nodepositFlag() {
        if (typeof this._nodepositFlag === "undefined") {
            this._nodepositFlag = null;
            if (Game.flags.nodeposit && (Game.flags.nodeposit.color !== COLOR_WHITE)) {
                this._nodepositFlag = Game.flags.nodeposit;
            }
        }
        return this._nodepositFlag;
    }

    get nomineralFlag() {
        if (typeof this._nomineralFlag === "undefined") {
            this._nomineralFlag = null;
            if (Game.flags.nomineral && (Game.flags.nomineral.color !== COLOR_WHITE)) {
                this._nomineralFlag = Game.flags.nomineral;
            }
        }
        return this._nomineralFlag;
    }

    get displayFlag() {
        if (typeof this._displayFlag === "undefined") {
            this._displayFlag = null;
            if (Game.flags.display && (Game.flags.display.color !== COLOR_WHITE)) {
                this._displayFlag = Game.flags.display;
            }
        }
        return this._displayFlag;
    }

    get deltaFlag() {
        if (typeof this._deltaFlag === "undefined") {
            this._deltaFlag = null;
            if (Game.flags.delta && (Game.flags.delta.color !== COLOR_WHITE)) {
                this._deltaFlag = Game.flags.delta;
            }
        }
        return this._deltaFlag;
    }

    get nobuilderFlag() {
        if (typeof this._nobuilderFlag === "undefined") {
            this._nobuilderFlag = null;
            if (Game.flags.nobuilder && (Game.flags.nobuilder.color !== COLOR_WHITE)) {
                this._nobuilderFlag = Game.flags.nobuilder;
            }
        }
        return this._nobuilderFlag;
    }

    get nomarketFlag() {
        if (typeof this._nomarketFlag === "undefined") {
            this._nomarketFlag = null;
            if (Game.flags.nomarket && (Game.flags.nomarket.color !== COLOR_WHITE)) {
                this._nomarketFlag = Game.flags.nomarket;
            }
        }
        return this._nomarketFlag;
    }

    get noskFlag() {
        if (typeof this._noskFlag === "undefined") {
            this._noskFlag = null;
            if (Game.flags.nosk && (Game.flags.nosk.color !== COLOR_WHITE)) {
                this._noskFlag = Game.flags.nosk;
            }
        }
        return this._noskFlag;
    }

    get debugtrailsFlag() {
        if (typeof this._debugtrailsFlag === "undefined") {
            this._debugtrailsFlag = null;
            if (Game.flags.debugtrails && (Game.flags.debugtrails.color !== COLOR_WHITE)) {
                this._debugtrailsFlag = Game.flags.debugtrails;
            }
        }
        return this._debugtrailsFlag;
    }

    get debugFlag() {
        if (typeof this._debugFlag === "undefined") {
            this._debugFlag = null;
            if (Game.flags.debug && (Game.flags.debug.color !== COLOR_WHITE)) {
                this._debugFlag = Game.flags.debug;
            }
        }
        return this._debugFlag;
    }

    get preloadcreepsFlag() {
        if (typeof this._preloadcreepsFlag === "undefined") {
            this._preloadcreepsFlag = null;
            if (Game.flags.preloadcreeps && (Game.flags.preloadcreeps.color !== COLOR_WHITE)) {
                this._preloadcreepsFlag = Game.flags.preloadcreeps;
            }
        }
        return this._preloadcreepsFlag;
    }

    get nogplFlag() {
        if (typeof this._nogplFlag === "undefined") {
            this._nogplFlag = null;
            if (Game.flags.nogpl && (Game.flags.nogpl.color !== COLOR_WHITE)) {
                this._nogplFlag = Game.flags.nogpl;
            }
        }
        return this._nogplFlag;
    }

    get norogueFlag() {
        if (typeof this._norogueFlag === "undefined") {
            this._norogueFlag = null;
            if (Game.flags.norogue && (Game.flags.norogue.color !== COLOR_WHITE)) {
                this._norogueFlag = Game.flags.norogue;
            }
        }
        return this._norogueFlag;
    }

    get conservelabFlag() {
        if (typeof this._conservelabFlag === "undefined") {
            this._conservelabFlag = null;
            if (Game.flags.conservelab && (Game.flags.conservelab.color !== COLOR_WHITE)) {
                this._conservelabFlag = Game.flags.conservelab;
            }
        }
        return this._conservelabFlag;
    }

    get claimnotinterestingFlag() {
        if (typeof this._claimnotinterestingFlag === "undefined") {
            this._claimnotinterestingFlag = null;
            if (Game.flags.claimnotinteresting && (Game.flags.claimnotinteresting.color !== COLOR_WHITE)) {
                this._claimnotinterestingFlag = Game.flags.claimnotinteresting;
            }
        }
        return this._claimnotinterestingFlag;
    }

    get season5Flag() {
        if (typeof this._season5Flag === "undefined") {
            this._season5Flag = null;
            if (Game.flags.season5 && (Game.flags.season5.color !== COLOR_WHITE)) {
                this._season5Flag = Game.flags.season5;
            }
        }
        return this._season5Flag;
    }

    get onlyclaimedsectorsFlag() {
        if (typeof this._onlyclaimedsectorsFlag === "undefined") {
            this._onlyclaimedsectorsFlag = null;
            if (Game.flags.onlyclaimedsectors && (Game.flags.onlyclaimedsectors.color !== COLOR_WHITE)) {
                this._onlyclaimedsectorsFlag = Game.flags.onlyclaimedsectors;
            }
        }
        return this._onlyclaimedsectorsFlag;
    }

    get stopcolonyFlag() {
        if (typeof this._stopcolonyFlag === "undefined") {
            this._stopcolonyFlag = null;
            if (Game.flags.stopcolony && (Game.flags.stopcolony.color !== COLOR_WHITE)) {
                this._stopcolonyFlag = Game.flags.stopcolony;
            }
        }
        return this._stopcolonyFlag;
    }

    get findFlag() {
        if (typeof this._findFlag === "undefined") {
            this._findFlag = null;
            if (Game.flags.find && (Game.flags.find.color !== COLOR_WHITE)) {
                this._findFlag = Game.flags.find;
            }
        }
        return this._findFlag;
    }

    get plunderplayersFlag() {
        if (typeof this._plunderplayersFlag === "undefined") {
            this._plunderplayersFlag = null;
            if (Game.flags.plunderplayers && (Game.flags.plunderplayers.color !== COLOR_WHITE)) {
                this._plunderplayersFlag = Game.flags.plunderplayers;
            }
        }
        return this._plunderplayersFlag;
    }

    get bestpowerbankFlag() {
        if (typeof this._bestpowerbankFlag === "undefined") {
            this._bestpowerbankFlag = null;
            if (Game.flags.bestpowerbank && (Game.flags.bestpowerbank.color !== COLOR_WHITE)) {
                this._bestpowerbankFlag = Game.flags.bestpowerbank;
            }
        }
        return this._bestpowerbankFlag;
    }

    get killpowercreepFlag() {
        if (typeof this._killpowercreepFlag === "undefined") {
            this._killpowercreepFlag = null;
            if (Game.flags.killpowercreep && (Game.flags.killpowercreep.color !== COLOR_WHITE)) {
                this._killpowercreepFlag = Game.flags.killpowercreep;
            }
        }
        return this._killpowercreepFlag;
    }

    get maxpowerlabFlag() {
        if (typeof this._maxpowerlabFlag === "undefined") {
            this._maxpowerlabFlag = null;
            if (Game.flags.maxpowerlab && (Game.flags.maxpowerlab.color !== COLOR_WHITE)) {
                this._maxpowerlabFlag = Game.flags.maxpowerlab;
            }
        }
        return this._maxpowerlabFlag;
    }

    get notempleFlag() {
        if (typeof this._notempleFlag === "undefined") {
            this._notempleFlag = null;
            if (Game.flags.notemple && (Game.flags.notemple.color !== COLOR_WHITE)) {
                this._notempleFlag = Game.flags.notemple;
            }
        }
        return this._notempleFlag;
    }

    get rushgclFlag() {
        if (typeof this._rushgclFlag === "undefined") {
            this._rushgclFlag = null;
            if (Game.flags.rushgcl && (Game.flags.rushgcl.color !== COLOR_WHITE)) {
                this._rushgclFlag = Game.flags.rushgcl;
            }
        }
        return this._rushgclFlag;
    }

    get conservemineralsFlag() {
        if (typeof this._conservemineralsFlag === "undefined") {
            this._conservemineralsFlag = null;
            if (Game.flags.conserveminerals && (Game.flags.conserveminerals.color !== COLOR_WHITE)) {
                this._conservemineralsFlag = Game.flags.conserveminerals;
            }
        }
        return this._conservemineralsFlag;
    }

    get noassaultFlag() {
        if (typeof this._noassaultFlag === "undefined") {
            this._noassaultFlag = null;
            if (Game.flags.noassault && (Game.flags.noassault.color !== COLOR_WHITE)) {
                this._noassaultFlag = Game.flags.noassault;
            }
        }
        return this._noassaultFlag;
    }

    get throttleFlag() {
        if (typeof this._throttleFlag === "undefined") {
            this._throttleFlag = null;
            if (Game.flags.throttle && (Game.flags.throttle.color !== COLOR_WHITE)) {
                this._throttleFlag = Game.flags.throttle;
            }
        }
        return this._throttleFlag;
    }

    get nopriceprotectionFlag() {
        if (typeof this._nopriceprotectionFlag === "undefined") {
            this._nopriceprotectionFlag = null;
            if (Game.flags.nopriceprotection && (Game.flags.nopriceprotection.color !== COLOR_WHITE)) {
                this._nopriceprotectionFlag = Game.flags.nopriceprotection;
            }
        }
        return this._nopriceprotectionFlag;
    }

    get debugterminalFlag() {
        if (typeof this._debugterminalFlag === "undefined") {
            this._debugterminalFlag = null;
            if (Game.flags.debugterminal && (Game.flags.debugterminal.color !== COLOR_WHITE)) {
                this._debugterminalFlag = Game.flags.debugterminal;
            }
        }
        return this._debugterminalFlag;
    }

    get overbuyfungiblesFlag() {
        if (typeof this._overbuyfungiblesFlag === "undefined") {
            this._overbuyfungiblesFlag = null;
            if (Game.flags.overbuyfungibles && (Game.flags.overbuyfungibles.color !== COLOR_WHITE)) {
                this._overbuyfungiblesFlag = Game.flags.overbuyfungibles;
            }
        }
        return this._overbuyfungiblesFlag;
    }

    get nonukeFlag() {
        if (typeof this._nonukeFlag === "undefined") {
            this._nonukeFlag = null;
            if (Game.flags.nonuke && (Game.flags.nonuke.color !== COLOR_WHITE)) {
                this._nonukeFlag = Game.flags.nonuke;
            }
        }
        return this._nonukeFlag;
    }

    get deepextractFlag() {
        if (typeof this._deepextractFlag === "undefined") {
            this._deepextractFlag = null;
            if (Game.flags.deepextract && (Game.flags.deepextract.color !== COLOR_WHITE)) {
                this._deepextractFlag = Game.flags.deepextract;
            }
        }
        return this._deepextractFlag;
    }

    get gclgplratioFlag() {
        if (typeof this._gclgplratioFlag === "undefined") {
            this._gclgplratioFlag = null;
            if (Game.flags.gclgplratio && (Game.flags.gclgplratio.color !== COLOR_WHITE)) {
                this._gclgplratioFlag = Game.flags.gclgplratio;
            }
        }
        return this._gclgplratioFlag;
    }

    get creditmaxFlag() {
        if (typeof this._creditmaxFlag === "undefined") {
            this._creditmaxFlag = null;
            if (Game.flags.creditmax && (Game.flags.creditmax.color !== COLOR_WHITE)) {
                this._creditmaxFlag = Game.flags.creditmax;
            }
            if (Game.flags.creditmax && (Game.flags.creditmax.secondaryColor !== C.COLOR_TO_NUMBER[Config.params.CREDIT_MAX_PERCENT])) {
                Game.flags.creditmax.setColor(Game.flags.creditmax.color, C.COLOR_TO_NUMBER[Config.params.CREDIT_MAX_PERCENT]);
            }
        }
        return this._creditmaxFlag;
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(FlagManager, 'FlagManager');

module.exports = FlagManager;
