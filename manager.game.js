"use strict";

var Color = {
    white:      ["#ffffff", "#4c4c4c"],
    grey:       ["#b4b4b4", "#4c4c4c"],
    red:        ["#ff7b7b", "#592121"],
    yellow:     ["#fdd388", "#5d4c2e"],
    green:      ["#00f4a2", "#236144"],
    blue:       ["#50d7f9", "#006181"],
    purple:     ["#a071ff", "#371383"],
    brown:      ["#cc9900", "#663300"],
    nuke:       ["#98d237", "#659419"],
};
var MineralColor = {
    [RESOURCE_ENERGY]:    Color.yellow,
    [RESOURCE_POWER]:     Color.red,

    [RESOURCE_HYDROGEN]:  Color.grey,
    [RESOURCE_OXYGEN]:    Color.grey,
    [RESOURCE_UTRIUM]:    Color.blue,
    [RESOURCE_LEMERGIUM]: Color.green,
    [RESOURCE_KEANIUM]:   Color.purple,
    [RESOURCE_ZYNTHIUM]:  Color.yellow,
    [RESOURCE_CATALYST]:  Color.red,
    [RESOURCE_GHODIUM]:   Color.white,
    [C.RESOURCE_THORIUM]: Color.nuke,

    [RESOURCE_HYDROXIDE]:         Color.grey,
    [RESOURCE_ZYNTHIUM_KEANITE]:  Color.grey,
    [RESOURCE_UTRIUM_LEMERGITE]:  Color.grey,

    [RESOURCE_UTRIUM_HYDRIDE]:    Color.blue,
    [RESOURCE_UTRIUM_OXIDE]:      Color.blue,
    [RESOURCE_KEANIUM_HYDRIDE]:   Color.purple,
    [RESOURCE_KEANIUM_OXIDE]:     Color.purple,
    [RESOURCE_LEMERGIUM_HYDRIDE]: Color.green,
    [RESOURCE_LEMERGIUM_OXIDE]:   Color.green,
    [RESOURCE_ZYNTHIUM_HYDRIDE]:  Color.yellow,
    [RESOURCE_ZYNTHIUM_OXIDE]:    Color.yellow,
    [RESOURCE_GHODIUM_HYDRIDE]:   Color.white,
    [RESOURCE_GHODIUM_OXIDE]:     Color.white,

    [RESOURCE_UTRIUM_ACID]:       Color.blue,
    [RESOURCE_UTRIUM_ALKALIDE]:   Color.blue,
    [RESOURCE_KEANIUM_ACID]:      Color.purple,
    [RESOURCE_KEANIUM_ALKALIDE]:  Color.purple,
    [RESOURCE_LEMERGIUM_ACID]:    Color.green,
    [RESOURCE_LEMERGIUM_ALKALIDE]:Color.green,
    [RESOURCE_ZYNTHIUM_ACID]:     Color.yellow,
    [RESOURCE_ZYNTHIUM_ALKALIDE]: Color.yellow,
    [RESOURCE_GHODIUM_ACID]:      Color.white,
    [RESOURCE_GHODIUM_ALKALIDE]:  Color.white,

    [RESOURCE_CATALYZED_UTRIUM_ACID]:         Color.blue,
    [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]:     Color.blue,
    [RESOURCE_CATALYZED_KEANIUM_ACID]:        Color.purple,
    [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]:    Color.purple,
    [RESOURCE_CATALYZED_LEMERGIUM_ACID]:      Color.green,
    [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]:  Color.green,
    [RESOURCE_CATALYZED_ZYNTHIUM_ACID]:       Color.yellow,
    [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]:   Color.yellow,
    [RESOURCE_CATALYZED_GHODIUM_ACID]:        Color.white,
    [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]:    Color.white,

    [RESOURCE_METAL]:       Color.brown,
    [RESOURCE_BIOMASS]:     Color.green,
    [RESOURCE_SILICON]:     Color.blue,
    [RESOURCE_MIST]:        Color.purple
};

class GameManager {

    // Cached function results.
    constructor() {
        this._getClosestCastleRoomsTo = {};
        this._getClosestCastleRoomTo = {};
        this._getClosestNonTempleTerminalRoomNamesTo = {};
        this._getClosestNonTempleTerminalRoomNameTo = {};
        this._getClosestSpawnRoomsTo = {};
        this._getClosestSpawnRoomTo = {};
        this._getClosestPowerCreepOperateSpawnRoomsTo = {};
        this._getClosestPowerCreepOperateSpawnRoomTo = {};
        this._getResourceMarketValue = {};
        this._doesRoomHaveLethalHostilesInRoute = {};
        this._doesRoomHaveLethalPlayerHostilesInRoute = {};
        this._doesRoomHaveLethalHostilesInNextRoom = {};
        this._getNextRoomInRoute = {};
        this._getClosestCastleRoomForGolddigger = {}
        this._getSectorRareMinerals = {};
        this._getSectorCenterMinerals = {};
        this._isDepositTypeNeeded = {};
        this._isDepositTypeProfitable = {};
        this._addProcess = {};

        // Global flag for updating rogue work room.
        // Only allow one per tick.
        this.hasRogueWorkRoomBeenSet = false;
    }

    addProcess(name) {
        this._addProcess[name] = (this._addProcess[name] || 0) + 1;
    }

    printProcesses() {
        return Object.keys(this._addProcess).map(m => m + ':' + this._addProcess[m]).join();
    }

    shouldNotStop(flag) {
        if (!flag) return true;
        if (flag.color === COLOR_WHITE) return true
        return false;
    }

    /*
    * Main entry point for GameManager logic.
    */
    run() {
        // Make sure the class is ready to go.
        this.initialize();

        // Get our creep manager initialized.
        CreepManager.initialize();

        // Record our cpu statistics for each tick.
        CpuManager.record();

        // Refresh all room data with any room that is currently visable.
        // Needs to run first so that subsequent logic can use it on this tick.
        if (this.shouldNotStop(Game.flags.stopmemory)) RoomIntel.updateRoomIntel();

        // Update our avoid flags every tick.
        FlagManager.setAvoidFlagRooms();

        // Manage our terminals.
        if (this.shouldNotStop(Game.flags.stopterminal)) TerminalManager.manageTerminals();

        // Manage every room we own.
        if (this.shouldNotStop(Game.flags.stopcontroller)) this.manageControllers();

        // Manage every room we can see.
        this.manageRooms();

        // Setup offensive nukes! Has to run every tick as it depends on room visibility.
        this.updateAutoNukeFlags();

        // Now handle all the creep logic.
        if (this.shouldNotStop(Game.flags.stopcreep)) this.manageCreeps();

        // Display colony layouts. May break so put at end.
        // This is done at the game level as we will place test flags in non-owned rooms, maybe reserved, but with no controller ownership.
        this.displayColonyLayout();

        // Our creeps may be moving around.
        this.verifyPowerCreepRooms();

        // Make a pixel if enabled.
        this.generatePixel();

        // Display the tick data we've collected.
        this.displayTickInfo();

        // Save any data about this shard to InterShardMemory.
        this.saveRoomData();

        // Scan for colony flags.
        this.manageColonyFlags()

        // Keep our assault flags maintained.
        this.manageAssaultFlags();

        // Manage our colony claim flags.
        this.manageClaimFlags()

        // Manage our unclaim flags.
        this.manageUnclaimFlags()

        // Make informative visuals on game map.
        this.drawMapVisuals();

        // Draw best colony locations in the room.
        this.manageMapFlag();

        // Manage our GPL.
        this.manageGPL();

        // Display our find report.
        this.reportFind();

        // The very last step to set variables.
        this.finalize();
    };

    initialize() {
        // Clear the cache as objects need to be requeried on each tick.
        this._cache = {}

        // Initialize our stats hash in memory.
        if (typeof Memory.stats === "undefined") Memory.stats = {};
        if (typeof Memory.reservedRooms === "undefined") Memory.reservedRooms = {};
        if (typeof Memory.market === "undefined") Memory.market = {};
        if (typeof Memory.nukes === "undefined") Memory.nukes = {};
        if (typeof Memory.screeps === "undefined") Memory.screeps = {};
        if (typeof Memory.plunderables === "undefined") Memory.plunderables = {};
        if (typeof Memory.findRouteDistance === "undefined") Memory.findRouteDistance = {};
        if (typeof Memory.findRouteRooms === "undefined") Memory.findRouteRooms = {};
        if (typeof Memory.cpu === "undefined") Memory.cpu = {};
        if (typeof Memory.constructionSites === "undefined") Memory.constructionSites = {};
        if (typeof Memory.roads === "undefined") Memory.roads = {};
        if (typeof Memory.cachedPath === "undefined") Memory.cachedPath = {};
        if (typeof Memory.portals === "undefined") Memory.portals = {};
        if (typeof Memory.claimRooms === "undefined") Memory.claimRooms = [];
        if (typeof Memory.sectors === "undefined") Memory.sectors = [];

        // Every so often, remove our Cartographer cached data.
        if (Game.time % Config.params.CARTOGRAPHER_CACHE_MEMORY_TICKS === 0) {
            Memory.findRouteDistance = {};
            Memory.findRouteRooms = {};
        }

        // Always reset our find debugging tracker to blank each tick.
        Memory.find = {};

        // Aways reset out observed rooms variable to empty array on each tick.
        Memory.observedRooms = [];

        // Initialize room and creep heap.
        this.initializeHeaps();

        // I am always my own ally.
        PlayerManager.addAlly(utils.getUsername());

        // Update our moving average cpu usage.
        this.updateMovingAvg();
    }

    finalize() {
        // Record how many rooms we have at the end of this tick.
        Memory.stats.roomCount = this.empireRooms.length;
    }

    get didRoomCountChange() {
        return (Memory.stats.roomCount || 0) !== (this.empireRooms.length || 0);
    }

    initializeHeaps() {
        Object.keys(Game.rooms).forEach(roomName => { if (typeof Heap.rooms[roomName] === "undefined") Heap.rooms[roomName] = {} } );
        Object.keys(Game.creeps).forEach(creepName => { if (typeof Heap.creeps[creepName] === "undefined") Heap.creeps[creepName] = {} } );
    }

    drawMapVisuals() {
        // Clear our cache every number of ticks.
        if (Game.time % Config.params.VISUALS_CACHE_TICKS === 0) {
            delete Memory.stats.visuals;
        }

		// After a config amount of time, it will be automatically turned off to save CPU.
		if (!FlagManager.visualsFlag) {
			delete Memory.stats.visualsTime;
			return;
		}
		if (!Memory.stats.visualsTime) Memory.stats.visualsTime = Game.time;
		if (Memory.stats.visualsTime < (Game.time - Config.params.VISUALS_TICKS)) {
			if (FlagManager.visualsFlag) FlagManager.visualsFlag.setColor(COLOR_WHITE);
			return;
		}

        // If the previous call was cached, then use it.
        if (Memory.stats.visuals) {
            Game.map.visual.import(Memory.stats.visuals)
            return;
        }

        // Reserved rooms. Draw line (width varies by distance) from spawn room to reserve room.
        Object.keys(Memory.reservedRooms || {}).forEach(roomName => {
            let spawnPos = new RoomPosition(25, 25, Memory.reservedRooms[roomName]);
            let reservedPos = new RoomPosition(25, 25, roomName);
            let range = Game.map.getRoomLinearDistance(roomName, Memory.reservedRooms[roomName]);
            Game.map.visual.line(spawnPos, reservedPos, {
                color: '#FFFF00'
                , width: 2 / range
            })
        })

        // Resources...Yikes!  Draw little indicaters in each room corrisponding to what they have.
        const size = 5;
        let positionIndex = 0;
        let getNextPosX = function() {
            positionIndex++;
            return (positionIndex * size * 2) - size;
        }

        let positionIndexRow2 = 0;
        let getNextPosXRow2 = function() {
            positionIndexRow2++;
            return (positionIndexRow2 * size * 2) - size;
        }

        Object.keys(Memory.rooms || {}).forEach(roomName => {
            // Reseat the position for each room.
            positionIndex = 0;
            positionIndexRow2 = 0;

            // Minerals
            let mineralType = RoomIntel.getMineralType(roomName);
            if (mineralType) {
                let mineralPos = new RoomPosition(getNextPosX(), 49 - size, roomName);
                this.MapVisual_resource(mineralType, mineralPos, size);
            }

            // Sources
            let sourceCount = RoomIntel.getSourceCount(roomName);
            for (let x = 1; x <= sourceCount || 0; x++) {
                let sourcePos = new RoomPosition(getNextPosX(), 49 - size, roomName);
                this.MapVisual_resource(RESOURCE_ENERGY, sourcePos, size);
            }

            // // Seasonal. Thorium.
            // let thoriumDensity = RoomIntel.getThoriumDensity(roomName) || 0;
            // for (let x = 1; x <= thoriumDensity || 0; x++) {
            //     let mineralPos = new RoomPosition(getNextPosXRow2(), 39 - size, roomName);
            //     this.MapVisual_resource(C.RESOURCE_THORIUM, mineralPos, size);
            // }

            // Deposits
            let deposits = RoomIntel.getDepositsByRoomName(roomName);
            for (let x = 0; x < deposits.length || 0; x++) {
                let deposit = deposits[x];
                let depositPos = new RoomPosition(getNextPosXRow2(), 49 - size, roomName);
                this.MapVisual_resource(deposit.depositType, depositPos, size);
            }

            // Powerbanks
            let powerbanks = RoomIntel.getPowerBanksByRoomName(roomName);
            for (let x = 0; x < powerbanks.length || 0; x++) {
                // Scale the number of powerbanks by chunks of 2500 to indicate how rich they are.
                for (let i = 0; i < Math.ceil(powerbanks[x].power / 2500); i++) {
                    let powerbankPos = new RoomPosition(getNextPosX(), 49 - size, roomName);
                    this.MapVisual_resource(RESOURCE_POWER, powerbankPos, size);
                }
            }

            // Ready to launch nuke.
            if (Game.rooms[roomName] && Game.rooms[roomName].my && Game.rooms[roomName].colonyNuker && Game.rooms[roomName].colonyNuker.readyToLaunch) {
                let nukerPos = new RoomPosition(getNextPosX(), 49 - size, roomName);
                Game.map.visual.text('🚀', nukerPos, {
                    fontSize: size*1.25
                })
            }

            // Rooms in claimed sector that are NOT mine or reserved by me, mark in red.
            if (FlagManager.sectorFlags[Cartographer.getSector(roomName)] && !RoomIntel.getMyManagement(roomName)) {
                let sectorPos = new RoomPosition(1, 1, roomName);
                Game.map.visual.rect(sectorPos, 48, 48, {
                    fill: '#FF0000'
                    , opacity: 0.1
                })
            }

            // Nukes
            if (RoomIntel.getNukeCount(roomName)) {
                // Bottom right triangle.
                let nukePoints = [
                    new RoomPosition(48, 1, roomName)
                    , new RoomPosition(48, 48, roomName)
                    , new RoomPosition(1, 48, roomName)
                ];
                Game.map.visual.poly(nukePoints, {
                    fill: '#9b111e'  // Ruby Red
                    , opacity: 0.25
                })
            }

        })

        // Assault flags.
        Object.keys(FlagManager.assaultFlags).forEach(roomName => {
            // Top left triangle.
            let assaultPoints = [
                new RoomPosition(1, 1, roomName)
                , new RoomPosition(48, 1, roomName)
                , new RoomPosition(1, 48, roomName)
            ];
            Game.map.visual.poly(assaultPoints, {
                fill: '#ff0080'     // Pink.
                , opacity: 0.25
            })

        });

        // Observed rooms.
        Memory.observedRooms.forEach(roomName => {
            // Not necessary to color rooms we are assaulting.
            if (!FlagManager.assaultFlags[roomName]) {
                let observePos = new RoomPosition(1, 1, roomName);
                Game.map.visual.rect(observePos, 48, 48, {
                    fill: '#0000FF'     // Blue.
                    , opacity: 0.25
                })
            }
        })

        // Temple flagged rooms. May not be owned.
        this.templeFlagRooms.forEach(roomName => {
            let templePos = new RoomPosition(1, 1, roomName);
            Game.map.visual.rect(templePos, 48, 48, {
                fill: '#FFD700 '     // Gold.
                , opacity: 0.25
            })
        })

        // Ranked claim rooms.
        let claimRooms = this.getClaimRoomsToVisualize();
        if (claimRooms.length) {
            for (let i = 0; i < claimRooms.length; i++) {
                let roomName = claimRooms[i];
                let claimPos = new RoomPosition(25, 25, roomName);
                Game.map.visual.text(i + 1, claimPos, {
                    fontSize: size*5
                    , color: '#FFDF00'  // Golden yellow.
                });
                claimPos = new RoomPosition(1, 1, roomName);
                Game.map.visual.rect(claimPos, 48, 48, {
                    fill: '#D4AF37'     // Darker yellow.
                    , opacity: 0.1
                    , stroke: '#da9100' // Dark yellow.
                    , strokeWidth: size
                })
            }
        }

        // Ranked reserved rooms.
        if (this.empireReservedRoomsArray.length) {
            for (let i = 0; i < this.empireReservedRoomsArray.length; i++) {
                let roomName = this.empireReservedRoomsArray[i];
                let claimPos = new RoomPosition(40, 10, roomName);
                Game.map.visual.text(i + 1, claimPos, {
                    fontSize: size*2
                    , color: '#00ff00'  // green.
                });
            }
        }

        // Save the output from all these visuals to memory for subsequent ticks.
        Memory.stats.visuals = Game.map.visual.export()
    }

    MapVisual_resource(type, pos, size = 10) {
        let fluids = {
            [RESOURCE_ENERGY]: true
            , [RESOURCE_POWER]: true
        }
        let minerals = {
            [RESOURCE_CATALYST]: true
            , [RESOURCE_HYDROGEN]: true
            , [RESOURCE_OXYGEN]: true
            , [RESOURCE_LEMERGIUM]: true
            , [RESOURCE_UTRIUM]: true
            , [RESOURCE_ZYNTHIUM]: true
            , [RESOURCE_KEANIUM]: true
            , [C.RESOURCE_THORIUM]: true
        }
        let commodities = {
            [RESOURCE_METAL]: true
            , [RESOURCE_BIOMASS]: true
            , [RESOURCE_SILICON]: true
            , [RESOURCE_MIST]: true
        }
        if (typeof fluids[type] !== "undefined")
            this.MapVisual_fluid(type, pos, size);
        else if (typeof minerals[type] !== "undefined")
            this.MapVisual_mineral(type, pos, size);
        else if (typeof commodities[type] !== "undefined")
            this.MapVisual_commodity(type, pos, size);
        else if (typeof MineralColor[type] !== "undefined")
            this.MapVisual_compound(type, pos, size);
        else
            return ERR_INVALID_ARGS
        return OK;
    };

    MapVisual_fluid(type, pos, size = 10) {
        Game.map.visual.circle(pos, {
            radius: size,
            fill: MineralColor[type][0],
            opacity: 0.5
        })
        Game.map.visual.text(type[0], pos, {
            fontSize: size*1.5,
            color: MineralColor[type][1]
        })
    };

    MapVisual_mineral(type, pos, size = 10) {
        Game.map.visual.circle(pos, {
            radius: size,
            fill: MineralColor[type][0],
            opacity: 0.5
        })
        Game.map.visual.circle(pos, {
            radius: size * 0.8,
            fill: MineralColor[type][1],
            opacity: 0.5
        })
        Game.map.visual.text(type, pos, {
            fontStyle: "bold",
            fontFamily: "arial",
            fontSize: size*1.25,
            color: MineralColor[type][0]
        })
    };

    MapVisual_commodity(type, pos, size = 10) {
        Game.map.visual.circle(pos, {
            radius: size,
            fill: MineralColor[type][0],
            opacity: 0.5
        })
        Game.map.visual.circle(pos, {
            radius: size * 0.8,
            fill: MineralColor[type][1],
            opacity: 0.5
        })
        Game.map.visual.text(type[0], pos, {
            fontStyle: "bold",
            fontFamily: "arial",
            fontSize: size*1.25,
            color: MineralColor[type][0]
        })
    };

    MapVisual_compound(type, pos, size = 10) {
        let label = type.replace("2", '₂');

        Game.map.visual.text(label, pos, {
            fontStyle: "bold",
            fontFamily: "arial",
            fontSize: size,
            color: MineralColor[type][1],
            backgroundColor: MineralColor[type][0],
            backgroundPadding: 0.3*size,
            opacity: 0.5
        })
    };

    manageColonyFlags() {
        // Only do one room at a time, as this can be expensive.
        // The call should go quick if room has already been scanned.
        this.roomsArray.some(room => {
            return room.createColonyFlag();
        })

        // Scan for temple flags for every visible room.
        this.roomsArray.forEach(room => {
            room.createTempleFlag();
        })
    }

    manageMapFlag() {
        // Only do one room at a time, as this can be expensive.
        // The call should go quick if room has already been scanned.
        if (FlagManager.mapFlag) {
            let room = Game.rooms[FlagManager.mapFlag.pos.roomName];
            if (room) {
                room.displayColonyLocations();
            }
        }
    }

    // This is for manual removal of unused colony and nocolony flags.
    // They will be recreated automatically.
    removeColonyFlags() {
        let keys = utils.unique(Object.keys(FlagManager.colonyFlags).concat(Object.keys(FlagManager.nocolonyFlags)));

        keys.forEach(key => {
            let flagData = FlagManager.colonyFlags[key] || FlagManager.nocolonyFlags[key];

            if (
                (
                    // Can't see into room, and there is no claim flag, so this can go.
                    !Game.rooms[flagData.roomName]
                    && !FlagManager.claimFlags[flagData.roomName]
                )
                || (
                    // We have visibility...but there is no claim flag and its not owned by me.
                    Game.rooms[flagData.roomName]
                    && !FlagManager.claimFlags[flagData.roomName]
                    && !Game.rooms[flagData.roomName].my
                    && !Game.rooms[flagData.roomName].hasMyNonControllerStructures
                )
            ) {
                console.log('📝 Removing unused colony flag for room', flagData.flag.name, ' @ ', utils.getShardRoomHTML(flagData.flag.pos.roomName));
                flagData.flag.remove();
            }
        });
    }

    manageAssaultFlags() {
        // Remove assault flags that we have successfully completed.
        Object.keys(FlagManager.assaultFlags).forEach(key => {
            let flagData  = FlagManager.assaultFlags[key];

            if (
                // Don't assult our own rooms.
                RoomIntel.getMyManagement(flagData.workRoom)
                // Don't assault a room that is empty.
                || !RoomIntel.getOwner(flagData.workRoom)
                // And they are not an ally.
                || PlayerManager.isAlly(RoomIntel.getOwner(flagData.workRoom))
            ) {
                console.log('📝 Removing completed assault flag for room', utils.getShardRoomHTML(flagData.workRoom));
                flagData.flag.remove();
            }
        });

        return false;
    }

    /**
     * Will call the algorithm we want to use for our market value.
     * This will store the market value of each resouce, high, low and average over the 14 day history.
     */
    updateMarketHistory() {
        // Clear our memory data to start over.
        Memory.market = {};

        // Get the list of resoruces currently being sold.
        let marketOrderData = Game.market.getAllOrders({type: ORDER_BUY});
        let marketOrderResources = utils.unique(marketOrderData.map(m => m.resourceType));
        // For each resource, go find the average over all the records in history.
        marketOrderResources.forEach(resource => {
            let resourceOrders = marketOrderData.filter(f =>
                (f.resourceType === resource)
                && (
                    // If this is a component chain resource, then only look for buy requests from NPCs. Everyone else is a scammer.
                    !C.COMMODITY_CHAIN[f.resourceType]
                    || Cartographer.isHighwayCorner(f.roomName)
                )
            );

            if (!Memory.market[resource]) Memory.market[resource] = {}
            Memory.market[resource].name = resource;
            Memory.market[resource].orders = resourceOrders.length;

            if (resourceOrders.length) {
                Memory.market[resource].buyHigh = _.max(resourceOrders.map(m => m.price)).toFixed(2);
            }
        })


        // Get the list of resources in for the last 14 days.
        let marketHistoryData = Game.market.getHistory();
        let marketHistoryResources = utils.unique(marketHistoryData.map(m => m.resourceType));
        // For each resource, go find the average over all the records in history.
        marketHistoryResources.forEach(resource => {
            let resourceHistory = marketHistoryData.filter(f => f.resourceType === resource);
            if (!Memory.market[resource]) Memory.market[resource] = {}
            Memory.market[resource].name = resource;
            Memory.market[resource].avgPrice = (_.sum(resourceHistory, s => s.avgPrice) / resourceHistory.length).toFixed(2);
        })


        // For each resource, figure out the component markup and percent.
        // Needs to be done last as it relies on previous data in memory.
        Object.keys(Memory.market).forEach(resource => {
            let marketValue = Number(this.getMarketValue(resource) || 0);
            let componentValue = Number(this.getResourceMarketValue(resource) || 0);
            let markup = marketValue - componentValue;
            let markupPercent = ((marketValue - componentValue) / componentValue) * 100;

            Memory.market[resource].componentValue = componentValue.toFixed(2);
            Memory.market[resource].markup = markup.toFixed(2);
            Memory.market[resource].markupPercent = markupPercent.toFixed(2);
        })

        this.addProcess('updateMarketHistory');
    }

    getMarketBuy(resourceType) {
        return Memory.market[resourceType] ? (Memory.market[resourceType].buyHigh || 0) : 0;
    }

    getMarketAverage(resourceType) {
        return Memory.market[resourceType] ? (Memory.market[resourceType].avgPrice || 0) : 0;
    }

    /**
     * Different ways of considering a resource's value.
     * This way say "how much can I sell this for right now", and if not available, "what is its average price over time".
     * Note that things can be worth almost nothing XZH2O was buying for 0.001 for instance. Make the floor value 1 for everything.
     */
    getMarketValue(resourceType) {
        if (this.getMarketBuy(resourceType) >= 1) return this.getMarketBuy(resourceType);
        if (this.getMarketAverage(resourceType) >= 1) return this.getMarketAverage(resourceType);
        return 1;
    }

    getMarketMarkupPercent(resourceType) {
        return Memory.market[resourceType] ? Number(Memory.market[resourceType].markupPercent || 0) : 0;
    }

    resourceTypeValueSort(resourceType) {
        return -(this.getMarketValue(resourceType) || 1);
    }

    getResourceMarketValue(resource, debug = false) {
        if (typeof this._getResourceMarketValue[resource] === "undefined") {
            let marketValue = 0;

            // All minerals, deposit types, and energy.
            if (C.HARVEST_RESOURCES_HASH[resource]) {
                marketValue = this.getMarketValue(resource);
                if (debug) console.log('getResourceMarketValue[' + resource + '] (harvest_resource):', marketValue);
            }
            else {
                // This is a compressed resource, look to see if the compressed version is cheaper.
                if (C.RESOURCE_COMPONENTS_HASH[resource]) {
                    Object.keys(C.RESOURCE_COMPONENTS_HASH[resource].components).forEach(component => {
                        // As these are coded in multiple amounts, take the amount created divided by the amount needed to get the fractional value.
                        // Recursively call method to get components value, which itself may be a component.
                        marketValue += this.getResourceMarketValue(component) * ((C.RESOURCE_COMPONENTS_HASH[resource].components[component] / C.RESOURCE_COMPONENTS_HASH[resource].amount))
                    });
                }
                else {
                    // Whatever else was passed in assume its not made up of anything else.
                    marketValue = this.getMarketValue(resource);
                    if (debug) console.log('getResourceMarketValue[' + resource + '] (other):', marketValue);
                }
            }

            // Return our final combined price.
            this._getResourceMarketValue[resource] = marketValue;
        }
        return this._getResourceMarketValue[resource];
    }

    /**
     * All resourced return in array, sorted by highest markup percent first.
     */
    get resourceSortByMarkupPercent() {
        if (typeof this._resourceSortByMarkupPercent === "undefined") {
            this._resourceSortByMarkupPercent = _.sortBy(Object.keys(Memory.market), s => -Memory.market[s].markupPercent).map(m => Memory.market[m])
        }
        return this._resourceSortByMarkupPercent;
    }

    reportMarket() {
        const header = 'Resource\tLevel\tChain\tAvg\tHigh\tComponent\tMarkup\tPercent';
        const output = [header];
        const footer = [];
        const stats = this.resourceSortByMarkupPercent;

        let getLineData = function() {
            const lines = stats.map(data => {
                return [
                    data.name
                    , C.RESOURCE_COMPONENTS_HASH[data.name] ? C.RESOURCE_COMPONENTS_HASH[data.name].level : null
                    , C.COMMODITY_CHAIN[data.name]
                    , Number(data.avgPrice || 0).toFixed(1)
                    , Number(data.buyHigh || 0).toFixed(1)
                    , Number(data.componentValue || 0).toFixed(1)
                    , Number(data.markup || 0).toFixed(1)
                    , Number(data.markupPercent || 0).toFixed(1)
                ].join('\t');
            });
            return lines;
        }

        const lineData = getLineData();
        while (lineData.length) {
            const line = lineData.shift();
            output.push(line);
        }

        output.push(footer);
        return output.join('\n');
    }

    get creditsNeededForBoostsOfNewRoom() {
        if (typeof this._creditsNeededForBoostsOfNewRoom === "undefined") {
            // Default to zero.
            this._creditsNeededForBoostsOfNewRoom = 0;

            // * Number of heralds needed to level 1-8 controller upgrade. Does not include travel time.
            // * parts in a herald
            // * boost resources needed per part (note 3 boosts needed work/carry/move)
            // * avg market price of each boost

            // If we don't have a castle room, then we aren't even worried abot credits for new room.
            if (this.empireCastleRooms.length) {
                // Really any room would do.
                let room = this.empireHighestControllerRoom;
                let heralds = Math.ceil(C.CONTROLLER_LEVELS_SUM / (room.heraldUpgradeControllerPower || 1));

                // Get boosts needed for all heralds.
                let workPartsBoostCost = room.heraldWorkParts * heralds * LAB_BOOST_MINERAL * this.getMarketValue(C.BOOST_COMPOUNDS[C.BOOST_UPGRADECONTROLLER]);
                let carryPartsBoostCost = room.heraldCarryParts * heralds * LAB_BOOST_MINERAL * this.getMarketValue(C.BOOST_COMPOUNDS[C.BOOST_CAPACITY]);
                let movePartsBoostCost = room.heraldMoveParts * heralds * LAB_BOOST_MINERAL * this.getMarketValue(C.BOOST_COMPOUNDS[C.BOOST_FATIGUE]);

                this._creditsNeededForBoostsOfNewRoom = workPartsBoostCost + carryPartsBoostCost + movePartsBoostCost;
            }
        }
        return this._creditsNeededForBoostsOfNewRoom;
    }

    get creditsNeededForBuy() {
        if (typeof this._creditsNeededForBuy === "undefined") {
            this._creditsNeededForBuy = Math.floor(this.creditsNeededForBoostsOfNewRoom * Config.params.CREDIT_FOR_BUY_PERCENT);
        }
        return this._creditsNeededForBuy;
    }

    /**
     * Will be able to buy if we have our no credit limit flag out, or we actually have the credits, or if we have non-max rooms building.
     */
    get atCreditTargetForBuy() {
        if (typeof this._atCreditTargetForBuy === "undefined") {
            this._atCreditTargetForBuy = !!FlagManager.nocreditlimitFlag || (Game.market.credits >= this.creditsNeededForBuy);
        }
        return this._atCreditTargetForBuy;
    }

    get creditsNeededForNewRoom() {
        if (typeof this._creditsNeededForNewRoom === "undefined") {
            this._creditsNeededForNewRoom = Math.floor(this.creditsNeededForBoostsOfNewRoom * Config.params.CREDIT_FOR_NEW_ROOM_PERCENT);
        }
        return this._creditsNeededForNewRoom;
    }

    get atCreditTargetForNewRoom() {
        if (typeof this._atCreditTargetForNewRoom === "undefined") {
            this._atCreditTargetForNewRoom = !!FlagManager.nocreditlimitFlag || (Game.market.credits >= this.creditsNeededForNewRoom);
        }
        return this._atCreditTargetForNewRoom;
    }

    get creditMax() {
        if (typeof this._creditMax === "undefined") {
            this._creditMax = Math.floor(this.creditsNeededForBoostsOfNewRoom * this.creditmaxAmount);
        }
        return this._creditMax;
    }

    get atCreditMax() {
        if (typeof this._atCreditMax === "undefined") {
            this._atCreditMax = !!FlagManager.nocreditlimitFlag || (Game.market.credits >= this.creditMax);
        }
        return this._atCreditMax;
    }

    get creditsNeededForBoostsOfTempleRoom() {
        if (typeof this._creditsNeededForBoostsOfTempleRoom === "undefined") {
            this._creditsNeededForBoostsOfTempleRoom = Math.floor(this.creditsNeededForBoostsOfNewRoom * Config.params.CREDIT_FOR_TEMPLE_ROOM_PERCENT);
        }
        return this._creditsNeededForBoostsOfTempleRoom;
    }

    get atCreditTargetForTempleRoom() {
        if (typeof this._atCreditTargetForTempleRoom === "undefined") {
            this._atCreditTargetForTempleRoom = !!FlagManager.nocreditlimitFlag || (Game.market.credits >= this.creditsNeededForBoostsOfTempleRoom);
        }
        return this._atCreditTargetForTempleRoom;
    }

    /**
     * Determine if when below max credits, if the given mineral has is worth extracting instead of simply selling excess energy.
     * Some minerals (like X typically is) can be worth more than energy harvested at the same rate.
     * Will assume farmers/preachers/oxen and miners/dredgers/jackasses/executioners and strikers/burrows cost the same for the sake of simplicity.
     */
    getTerminalResourceTargetAmount(resourceType, amount) {
        // Power is interesting since the amount being harvested can vary; sometimes when only a small amount is present will not make it worth the effort.
        if (
            (resourceType === RESOURCE_POWER)
            && (
                this.atCreditMax
                || (this.getMarketValue(RESOURCE_ENERGY) * HARVEST_POWER >= this.getMarketValue(resourceType) * HARVEST_DEPOSIT_POWER * amount / CREEP_LIFE_TIME)
            )
        ) {
            return Config.params.TERMINAL_FUNGIBLE_TARGET
        }

        else if (
            C.TERMINAL_MINERALS_RAW_HASH[resourceType]
            && (
                this.atCreditMax
                || (this.getMarketValue(RESOURCE_ENERGY) * HARVEST_POWER >= this.getMarketValue(resourceType) * HARVEST_MINERAL_POWER / EXTRACTOR_COOLDOWN)
            )
        ) {
            return Config.params.TERMINAL_FUNGIBLE_TARGET;
        }

        // Harvest until we are max (which is over sell, so we assume excess will be sold).
        return Config.params.TERMINAL_MINERAL_MAX;
    }

    cleanupMemory() {
        // Cleanup memory of dead creeps.
        for (let name in Memory.creeps) {
            if (typeof Game.creeps[name] === "undefined") {
                delete Memory.creeps[name];
            }
        }

        // Cleanup memory of dead powercreeps.
        for (let name in Memory.powerCreeps) {
            if (typeof Game.powerCreeps[name] === "undefined") {
                delete Memory.powerCreeps[name];
            }
        }

        // Cleanup heap of dead creeps.
        for (let name in Heap.creeps) {
            if (typeof Game.creeps[name] === "undefined") {
                delete Heap.creeps[name];
            }
        }

        // Cleanup memory of dead rooms that we haven't visited recently.
        let visitTimeExpired = Game.time - Math.min(Game.time, Config.params.CACHE_ROOM_TICKS);
        for (let name in Memory.rooms) {
            if (
                ((RoomIntel.getVisited(name) || 0) < visitTimeExpired)
                && !FlagManager.avoidFlags[name]
                //&& (typeof Game.rooms[name] === "undefined")
            ) {
                // Avoid flags are forcing avoid into Memory, leave them be.
                delete Memory.rooms[name];
                //delete Heap.rooms[name];
            }
        }

        // If a site doesn't exist, clear its entry in memory.
        this.maintainConstructionSites();
    }

    tickCheck(roomMod, roomIndex, tickMod) {
        return ((Game.time % (roomMod * tickMod) || 0) === (roomIndex * tickMod));
    }

    /**
     * For each room that is visible, perform generic operations.
     * Note that this runs after manageControllers.
     */
    manageRooms() {
        this.roomsArray.forEach(room => {

            // Create/remove destroy flags for barriers in reserved rooms.
            room.updateDestroyFlags();

        })
    }

    maintainConstructionSites() {
        // Clear out any construction sites in memory that have been built or no longer exist.
        Object.keys(Memory.constructionSites).forEach(id => {
            if (!Game.constructionSites[id]) {
                delete Memory.constructionSites[id];
            }
        });

        // Give all construction sites an age to be built.
        Object.keys(Game.constructionSites).forEach(id => {
            if (!Memory.constructionSites[id]) {
                Memory.constructionSites[id] = {};
                Memory.constructionSites[id].p = 0;
                Memory.constructionSites[id].t = Game.time;
            }
            // If the site has gained some progress, then reset its timer.
            if (Memory.constructionSites[id].p !== Game.constructionSites[id].progress) {
                Memory.constructionSites[id].p = Game.constructionSites[id].progress;
                Memory.constructionSites[id].t = Game.time;
            }
        });

        // If the site hasn't been touched in so many ticks, and there is no progress on it, then remove it.
        Object.keys(Game.constructionSites).forEach(id => {
            // This logic could probably use some more conditions.
            if (
                Game.constructionSites[id].progress
                && Game.constructionSites[id].room
                && (
                    // Either the room is under my management or we have creeps (scouts) in rooms we are passing thru to harvest.
                    Game.constructionSites[id].room.myManagement
                    || Game.constructionSites[id].room.myCreeps.length
                )
            ) {
                // The site has progress in a room I own and its already got a level built into it, let it continue forever.
            }
            else if (Memory.constructionSites[id].t < (Game.time - ((Game.constructionSites[id].room && Game.constructionSites[id].room.my) ? Config.params.REMOVE_COLONY_TICK_MY : Config.params.REMOVE_COLONY_TICK_OTHER))) {
                // Remove after so much time as passed.
                Game.constructionSites[id].remove();
            }
        });
    }

    /**
     * For each of our controllers, perform all the activities that the room can do.
     * Creating base, managing links, managing towers, running reactions, etc.
     */
    manageControllers() {
        // Get list of controllers I own, and iterate throught them.
        let spawnControllers = this.spawnControllersSorted;
        let haltStop = this.haltStop;

        // Master bailout switch.  Bad juju!
        if (this.haltShutdown) return;

        // Adding 1 to the overall loop to run expensive non-controller methods.
        let tickCount = spawnControllers.length + 1;
        let maintenanceTick = tickCount - 1;

        // Preform maintainence tick operations.
        if (spawnControllers.length && this.tickCheck(tickCount, maintenanceTick, 1)) {
            // Remove any dead or unused rooms from memory.
            this.cleanupMemory();
            RoomIntel.cleanupMemory();

            // Update our market history.
            if (!haltStop) this.updateMarketHistory();
        }

        for (let i = 0; i < spawnControllers.length; i++) {
            // Set the controller we are working on.
            let controller = spawnControllers[i];
            let room = controller.room;

            // Initalize room variables.
            room.initialize();

            // Check to see if we have a breach of security.
            // Do this first, as script may break and our last line of defense would be down.
            if (this.shouldNotStop(Game.flags.stopsafemode)) room.safeModeCheck();

            // This will make sure our flag is set to the right color.
            if (this.tickCheck(tickCount, i, 1)) room.setRallyFlagColor();

            // Activate towers first, as this is needed for defense and rest of code might contain errors.
            if (this.shouldNotStop(Game.flags.stoptower)) room.manageTower(tickCount, i);
        }

        // Release the hounds, send the bombers! This is on a tick check, so that we don't get spammed.
        if (!haltStop && spawnControllers.length && this.shouldNotStop(Game.flags.stopnuker) && this.tickCheck(tickCount, maintenanceTick, 1)) this.manageNukers();

        // Setup our golddigger flag for the special golddigger powercreep.
        if (!haltStop && spawnControllers.length && this.shouldNotStop(Game.flags.stopgolddigger) && this.tickCheck(tickCount, maintenanceTick, 1)) this.managePowerCreepGolddiggerFlag();

        // Observe rooms around our controllers.
        if (!haltStop && this.shouldNotStop(Game.flags.stopobserver)) this.manageObservers();

        for (let i = 0; i < spawnControllers.length; i++) {
            // Set the controller we are working on.
            let controller = spawnControllers[i];
            let room = controller.room;

            // Process power creeps and abilities. Note this needs to come first as later, more important, powers can override if needed.
            if (this.shouldNotStop(Game.flags.stoppowercreep)) room.managePowerCreep(tickCount, i);
        }

        for (let i = 0; i < spawnControllers.length; i++) {
            // Set the controller we are working on.
            let controller = spawnControllers[i];
            let room = controller.room;

            // Manage the spawns in this room.
            if (
                this.shouldNotStop(Game.flags.stopspawn) && room.slidingTickCheck('S', tickCount, i, Config.params.SPAWN_TICK_MOD)
                // Exception when hostiles are in room, force run on our normal tick.
                || ((RoomIntel.getDangerousHostilesTTL(room.name) || room.isTemple) && this.tickCheck(tickCount, i, 1))
            ) room.updateSlidingTickCheck('S', tickCount, room.manageSpawn(), Config.params.SPAWN_TICK_MOD);

            // Do link transfers.
            if (this.shouldNotStop(Game.flags.stoplink)) room.manageLink();

            // Process our lab minerals to make new ones if any are present.
            if (!haltStop && this.shouldNotStop(Game.flags.stoplab)) room.runReaction();

            // Process our factory resources to create new commodities.
            if (!haltStop && this.shouldNotStop(Game.flags.stopfactory) && (
                room.slidingTickCheck('F', tickCount, i, Config.params.FACTORY_TICK_MOD)
                // Exception when factory is boosted run every tick to not waste factory time.
                || room.factoryBoosted
            )) room.updateSlidingTickCheck('F', tickCount, room.produceCommodities(), Config.params.FACTORY_TICK_MOD);

            // Process our power.
            if (!haltStop && this.shouldNotStop(Game.flags.stoppowerspawn)) room.managePowerSpawn();

            // Verify that we are safe from nukes!
            if (!haltStop && this.shouldNotStop(Game.flags.stopdefense) && room.slidingTickCheck('D', tickCount, i, Config.params.DEFENSE_TICK_MOD))
                room.updateSlidingTickCheck('D', tickCount, room.manageDefense(), Config.params.DEFENSE_TICK_MOD);

            // Terminal logic is broken out individually as they don't need to all run if nothing is happening.
            if (!haltStop && this.shouldNotStop(Game.flags.stopterminal) && room.myTerminal && !room.myTerminal.cooldown) {
                do {

                    if (room.slidingTickCheck('TF', tickCount, i, Config.params.TERMINAL_TICK_MOD)) {
                        if (room.updateSlidingTickCheck('TF', tickCount, room.manageTerminal_factory(), Config.params.TERMINAL_TICK_MOD)) break;
                    }

                    if (room.slidingTickCheck('TB', tickCount, i, Config.params.TERMINAL_TICK_MOD)) {
                        if (room.updateSlidingTickCheck('TB', tickCount, room.manageTerminal_buy(), Config.params.TERMINAL_TICK_MOD)) break;
                    }

                    // Selling goes last obviously, as we don't want to sell anything that could have been sent/used by our other rooms above.
                    if (room.slidingTickCheck('TS', tickCount, i, Config.params.TERMINAL_TICK_MOD) || room.isStorageEnergySell) {
                        if (room.updateSlidingTickCheck('TS', tickCount, room.manageTerminal_sell(), Config.params.TERMINAL_TICK_MOD)) break;
                    }

                    if (room.slidingTickCheck('TU', tickCount, i, Config.params.TERMINAL_TICK_MOD)) {
                        if (room.updateSlidingTickCheck('TU', tickCount, room.manageTerminal_buyOrder(), Config.params.TERMINAL_TICK_MOD)) break;
                    }
                } while (false);
            }

            // Display room info top left corner.
            if (!haltStop) controller.room.displayRoomInfo();
        }

        // Finalize powercreeps, which may have been done anywhere in code.
        this.finalizePowerCreeps();

        // Are we okay CPU wise to make collonies?
        let createColonyBaseCalled = false;
        if (
            !FlagManager.stopcolonyFlag
            && (
                // The force colony flag is out?
                FlagManager.colonyFlag
                // Or we are not halting spawning.
                || !this.haltSpawning
            )
        ) {
            // Get list of full controllers I own, and iterate throught them.
            // This loop contains things we need to do for any controller I own.
            let rooms = this.empireRooms;
            let tickCount = rooms.length + 1;

            for (let i = 0; i < rooms.length; i++) {
                // Set the room we are working on.
                let room = rooms[i];

                // Create construction sites for the colony base if it doesn't exist already.
                // This is for production color flags.  Also done in the main loop for testing flags.
                if (
                    // Max level rooms have long natural mods.
                    this.tickCheck(tickCount, i, Config.params.CREATE_COLONY_TICK_MOD)

                    // We may be forcing a create colony that would happen anytime on this colonys turn.
                    || (
                        this.tickCheck(tickCount, i, 1)
                        && ColonyManager.forceCreateColony(room.name)
                    )
                ) {
                    let flag = room.templeFlag || room.colonyFlag;
                    // Create the colony base.
                    if (flag) {
                        // Preload the barrier coords into memory before making the base, its too expensive.
                        if (!room.hasAnyPerimeterBarrierCoordsInMemory) {
                            room.anyPerimeterBarrierCoords;
                        }
                        else {
                            ColonyManager.createColonyBase(flag)
                        }
                        createColonyBaseCalled = true;
                    }

                    // Only update one room at a time to keep CPU from blowing up.
                    break;
                }
            }

            // Lets try to make any unclaimed rooms.
            if (!createColonyBaseCalled && this.tickCheck(tickCount, maintenanceTick, 1)) {
                this.empireRoomsToClaimThatAreUnclaimedAndVisible.forEach(unclaimedRoom => {
                    if (
                        (this.constructionSitesArray.length !== MAX_CONSTRUCTION_SITES)
                        && !unclaimedRoom.isTempleCandidate
                        && !unclaimedRoom.myConstructionSites.length
                        && !unclaimedRoom.hasRoomContainers
                    ) {
                        // Preload the barrier coords into memory before making the base, its too expensive.
                        if (!unclaimedRoom.hasAnyPerimeterBarrierCoordsInMemory) {
                            unclaimedRoom.anyPerimeterBarrierCoords;
                        }
                        else {
                            let flag = unclaimedRoom.templeFlag || unclaimedRoom.colonyFlag;
                            ColonyManager.createColonyBase(flag);
                        }
                        createColonyBaseCalled = true;
                    }
                });
            }
        }

        // Special case to handle manually refreshing the spawn cpu flag and reserved rooms.
        // Set our reserved rooms list if it non-existant or we are forcing a cpu change.
        let forceSetReservedRoomsMod = (
            ((CpuManager.getRecommendedDelta() >= Config.params.CPU_DELTA_REFRESH_POSITIVE) || (CpuManager.getRecommendedDelta() <= Config.params.CPU_DELTA_REFRESH_NEGATIVE))
            && (Config.params.EMPIRE_GCL_THRESHHOLD < Game.gcl.level)
        ) ? 1 : this.setreservedroomsValue;

        // Delta flag will cause an immediate call to update reserved rooms.
        if (!createColonyBaseCalled && spawnControllers.length && (FlagManager.deltaFlag || this.tickCheck(tickCount, maintenanceTick, forceSetReservedRoomsMod))) {
            // Update our reserved rooms when colonies are created or updated levels.
            ReserveManager.setReservedRooms();
        }


        // Get list of full controllers I own, and iterate throught them.
        // This loop contains things we need to do for any controller I own.
        this.cleanAllRooms();

        // Expensive operation, only do it sparingly.
        if (spawnControllers.length && (this.tickCheck(tickCount, maintenanceTick, Config.params.UPDATE_CLAIM_ROOM_DATA_TICK_MOD) || this.didRoomCountChange)) {
            // Update our sectors that are totally claimed by us.
            this.updateClaimedSectors();

            // Update our prioritized claim room list.
            this.updateClaimRoomData();
        }
    }

    cleanAllRooms() {
        // This loop contains things we need to do for any room I own.
        let rooms = this.empireRooms;

        for (let i = 0; i < rooms.length; i++) {
            // Set the room we are working on.
            let room = rooms[i];

            // Clean this room of any leftover structures.
            room.cleanRoom();

            // Safely unclaim this room. Used for reserved rooms that need instant cleaning.
            room.unclaimRoom();

            // Safely unclaim temple room. Used to blast upgrade controller to increase GCL.
            room.unclaimTempleRoom();
        }
    }

    /**
     * This method drives the main loop. Order is important to line up with the tick display.
     */
    get spawnControllersSorted() {
        if (typeof this._spawnControllersSorted === "undefined") {
            this._spawnControllersSorted = _.sortBy(this.empireSpawnControllers, s => s.level + s.room.factoryLevel);
        }
        return this._spawnControllersSorted;
    }

    displayTickInfo() {
        // Get list of controllers I own, and iterate throught them.
        let controllers = this.spawnControllersSorted;

        for (let i = 0; i < controllers.length; i++) {
            // Set the controller we are working on.
            let controller = controllers[i];
            let room = controller.room;

            // Display our current info after all previous processing is done.
            // Needs to be in the same controller sequence as when processes are run for a room.
            if (this.tickCheck(controllers.length, i, 1)) room.displayTickInfo();
        }
    }

    updateMovingAvg() {
        this.updateDataMovingAvg('cpuMovingAvg', Game.cpu.bucket);
        this.updateDataMovingAvg('energyMovingAvg', FlagManager.throttleFlag ? 0 : this.empireEnergy);
    }

    updateDataMovingAvg(avgName, newValue) {
        // Initialize variables.
        let dataName = avgName + 'Data';
        let previousSumName = avgName + 'PreviousSum'

        // Initialize the data array.
        if (typeof Memory.stats[dataName] === "undefined") Memory.stats[dataName] = [];
        // Data is just a pointer to memory.
        let data = Memory.stats[dataName];

        // This will be based on current cpu allocation or constant.
        let sampleSize = this.dataMovingAvgSampleSize;

        // Very so often, or when we have an unexpected sample length, force a fresh calculation.
        let recalcSum = Game.time % Config.params.MOVING_AVERAGE_REFRESH_TICKS === 0;
        if (data.length > sampleSize) {
            // data exceeds sample size, so retain the last X elements that we need.
            data = data.slice(-(sampleSize-1));                                         // O(N)
            recalcSum = true;
        }
        else if (data.length < sampleSize) {
            recalcSum = true;
        }

        // Save back the data we need to calculate the averages.
        // When run brand new we won't have enough samples to save.
        let removedValue = null;
        if (data.length === sampleSize) {
            removedValue = data.splice(0, 1);                                           // O(1)
        }

        // Add to the end of the array our current cpu bucket.
        // Normally at this point our data would be the target sample length.
        data.push(newValue);                                                            // O(1)

        // Get the previous sum on the last tick.
        let previousSum = 0;
        if (typeof Memory.stats[previousSumName] === "undefined") {
            recalcSum = true;
        }
        else {
            previousSum = Memory.stats[previousSumName] - removedValue;                 // O(1)
        }

        // Calculate previous average if we need to. This is expensive and is to be avoided.
        if (recalcSum) {
            previousSum = data.slice(0, data.length - 1).reduce((a, b) => a + b, 0);    // O(N)
        }

        let value = 0;
        let currentSum = 0;
        if (data.length > 1) {
            let previousAvg = previousSum / (data.length - 1);                          // O(1)
            currentSum = (previousSum + data[data.length - 1])                          // O(1)
            let currentAvg = currentSum / data.length;                                  // O(1)
            value = _.round(currentAvg - previousAvg, 2);                               // O(1)
        }
        Memory.stats[avgName] = value;
        Memory.stats[previousSumName] = currentSum;
    }

    /**
     * The high level objective of the empire, given the state and environment it is in.
     * Possible values include:
     *   gcl: Focus on increasing our global control level in order to obtain max cpu, or control rooms.
     *   gpl: Focus on processing power; powercreeps are immensely powerful (source power provides >2.5x extra energy per room)
     *   credits: Credits are used to buy mats we don't have. Early game needs minerals/upgrade boosts; end game will need power.
     *   focus: Low level room in play, save cpu time for getting it up to castle.
     *
     * See related methods:
     *   GameManager.haltProcessPower
     *   PowerSpawn.haltProcessPowerBalance
     *   GameManager.empirePreppedForTempleRoom
     */
    get empireObjective() {
        if (typeof this._empireObjective === "undefined") {

            // Objective flag overrides automatic logic.
            if (Game.flags.objective) {
                if (Game.flags.objective.color === COLOR_RED) return C.OBJECTIVE_GPL;
                if (Game.flags.objective.color === COLOR_YELLOW) return C.OBJECTIVE_GCL;
                if (Game.flags.objective.color === COLOR_GREEN) return C.OBJECTIVE_CREDITS;
                if (Game.flags.objective.color === COLOR_ORANGE) return C.OBJECTIVE_FOCUS;
            }

            // Default end game is gpl.
            this._empireObjective = C.OBJECTIVE_GPL;

            // We have non-max rooms trying to level up, focus on getting this room up.
            if (this.empireCastleRooms.length && this.myNonMaxNonTempleSpawnRoomsActive.length) {
                this._empireObjective = C.OBJECTIVE_FOCUS;
            }

            // We have non-max rooms trying to level up, focus on getting this room up.
            else if (this.empireRoomNamesToClaimThatAreUnclaimed.length) {
                this._empireObjective = C.OBJECTIVE_FOCUS;
            }

            // Are we below our max potential cpu limit?
            // Do not leave "free" cpu potential to be wasted.
            else if (this.isCpuLimitBelowShardLimit) {
                this._empireObjective = C.OBJECTIVE_GCL;
            }

            // Is our cpu to spawn ratio greater than 1? This means we have extra cpu that is potentiall going unused.
            else if (this.cpuSpawnRatio > 1) {
                this._empireObjective = C.OBJECTIVE_GCL;
            }

            // We are below our credit limit for buying needed resources; start saving our money.
            else if (!FlagManager.nomarketFlag && !this.atCreditTargetForBuy) {
                this._empireObjective = C.OBJECTIVE_CREDITS;
            }

            // End game scenerio were we want to balance powercreep per number of rooms.
            // Account for 1 extra gc to clean rooms, and always have at least 1 gcl free that the next gpl can spawn into.
            else if (this.isUnderGclGplRatio) {
                this._empireObjective = C.OBJECTIVE_GCL;
            }
        }
        return this._empireObjective;
    }

    /**
     * Account for 1 extra gc to clean rooms, and always have at least 1 gcl free that the next gpl can spawn into.
     * Full level 25 powercreeps are what are counted.
     */
    get isUnderGclGplRatio() {
        let ratio = FlagManager.gclgplratioFlag ? C.COLOR_TO_NUMBER[FlagManager.gclgplratioFlag.color] : Config.params.GCL_GPL_RATIO
        return ((Game.gcl.level - 2) / Math.floor(Game.gpl.level / (POWER_CREEP_MAX_LEVEL + 1))) <= ratio
    }

    get isEmpireObjectiveGcl() {
        return this.empireObjective === C.OBJECTIVE_GCL;
    }

    get isEmpireObjectiveGpl() {
        return this.empireObjective === C.OBJECTIVE_GPL;
    }

    get isEmpireObjectiveCredits() {
        return this.empireObjective === C.OBJECTIVE_CREDITS;
    }

    get isEmpireObjectiveFocus() {
        return this.empireObjective === C.OBJECTIVE_FOCUS;
    }

    /**
     * Used to determine if our allowed cpu for the current shard is below the set shard limit.
     * If so, that indicates that we have not "unlocked" all our cpu yet based on current GCL.
     * https://docs.screeps.com/control.html
     */
    get isCpuLimitBelowShardLimit() {
        return Game.cpu.shardLimits ? (Game.cpu.limit < Game.cpu.shardLimits[Game.shard.name]) : false;
    }

    get isBestShard() {
        if (typeof this._isBestShard === "undefined") {
            this._isBestShard = Game.cpu.shardLimits ? !Object.keys(Game.cpu.shardLimits).find(f => Game.cpu.shardLimits[f] > Game.cpu.shardLimits[Game.shard.name]) : true;
        }
        return this._isBestShard;
    }

    /**
     * On official server, we get 10 cpu per GPL (20 cpu given on the first level only) with purchased cpu unlocked.
     * This stop at 300 max cpu, 29 rooms. So our standard ratio is about (300/30)/10 = 1.0
     */
    get cpuSpawnRatio() {
        if (typeof this._cpuSpawnRatio === "undefined") {
            this._cpuSpawnRatio = (Game.cpu.limit / this.empireSpawnControllersActive.length) / Config.params.CPU_PER_COLONY;
        }
        return this._cpuSpawnRatio;
    }

    /**
     * Are we well over (x2) the cpu to spawn room ratio?
     * This would typically mean the rooms we have spawned are are only using half our available cpu (15 rooms with full 300 cpu unlocked).
     * This would come into play mostly when doing a fresh respawn, or when have 1 room in our 20 cpu shard3 limit.
     */
    get isCpuSpawnMaxed() {
        return this.cpuSpawnRatio >= Config.params.CPU_PER_COLONY_MAX_RATIO;
    }

	get dataMovingAvgSampleSize() {
        if (typeof this._dataMovingAvgSampleSize === "undefined") {
            this._dataMovingAvgSampleSize = Game.cpu.limit || Config.params.MOVING_AVERAGE_SAMPLE_SIZE;
        }
        return this._dataMovingAvgSampleSize;
    }

	get empireEnergy() {
        if (typeof this._empireEnergy === "undefined") {
            this._empireEnergy = _.sum(this.empireCastleRooms.map(m => m.storageEnergy));
        }
        return this._empireEnergy;
    }

	get empireEnergyTerminalsOverEnergyMinimal() {
        if (typeof this._empireEnergyTerminalsOverEnergyMinimal === "undefined") {
            this._empireEnergyTerminalsOverEnergyMinimal = _.sum(this.empireCastleRooms.map(m => (m.storageEnergy - m.energyMinimal)));
        }
        return this._empireEnergyTerminalsOverEnergyMinimal;
    }

    /**
     * This value should be based on creep ticksToSpawn (max is ~150) not room count.
     * So take our normal value of 150 and mod it by the number of rooms we have.
     */
    get setreservedroomsValue() {
        let ticksToSpawn = Config.params.SET_RESERVED_ROOMS_MULTIPLIER * (FlagManager.setreservedroomsFlag ? C.COLOR_TO_NUMBER[FlagManager.setreservedroomsFlag.color] : Config.params.SET_RESERVED_ROOMS_MOD);
        let roomCount = (this.empireRooms.length || 1);
        return Math.ceil(ticksToSpawn / roomCount);
    }

    get isCpuPegged() {
        return (
            // Are we at our maximum limit?
            (Game.cpu.bucket >= Config.params.CPU_MAX)
        )
    }

    get isCpuMaxed() {
        return (
            // Are we at our maximum limit?
            (Game.cpu.bucket >= Config.params.CPU_MAX_BUFFER)
        )
    }

	get isCpuBelowNearMaxed() {
        if (typeof this._isCpuBelowNearMaxed === "undefined") {
            this._isCpuBelowNearMaxed = Game.cpu.bucket < Config.params.CPU_NEARMAX_ABSOLUTE;
        }
        return this._isCpuBelowNearMaxed;
    }

    get isCpuSupporting() {
        return (
            // This limit should be right below cpu maxed, so that we can spawn Auxiliary creeps without false positive bumps in cpu maxed.
            (Game.cpu.bucket >= Config.params.CPU_SUPPORTING_ABSOLUTE)
        )
    }

	get isCpuAboveNormal() {
        if (typeof this._isCpuAboveNormal === "undefined") {
            this._isCpuAboveNormal = Game.cpu.bucket >= Config.params.CPU_NORMAL_ABSOLUTE;
        }
        return this._isCpuAboveNormal;
    }

	get isCpuBelowNormal() {
        if (typeof this._isCpuBelowNormal === "undefined") {
            this._isCpuBelowNormal = Game.cpu.bucket < Config.params.CPU_NORMAL_ABSOLUTE;
        }
        return this._isCpuBelowNormal;
    }

	get isCpuHalted() {
        if (typeof this._isCpuHalted === "undefined") {
            this._isCpuHalted = Game.cpu.bucket < Config.params.CPU_SPAWN_ABSOLUTE;
        }
        return this._isCpuHalted;
    }

	get isCpuStopped() {
        if (typeof this._isCpuStopped === "undefined") {
            this._isCpuStopped = Game.cpu.bucket < Config.params.CPU_STOP_ABSOLUTE;
        }
        return this._isCpuStopped;
    }

    get haltRenewing() {
        if (typeof this._haltRenewing === "undefined") {
            this._haltRenewing = Game.cpu.bucket < Config.params.CPU_RENEW_ABSOLUTE;
        }
        return this._haltRenewing;
    }

	get haltSpawning() {
        if (typeof this._haltSpawning === "undefined") {
            this._haltSpawning = Game.cpu.bucket < Config.params.CPU_SPAWN_ABSOLUTE;
        }
        return this._haltSpawning;
    }

    get haltSupporting() {
        if (typeof this._haltSupporting === "undefined") {
            this._haltSupporting = (
                !this.isCpuSupporting
            );
        }
        return this._haltSupporting;
    }

    get haltFocus() {
        if (typeof this._haltFocus === "undefined") {
            this._haltFocus = Game.cpu.bucket < Config.params.CPU_FOCUS_ABSOLUTE;
        }
        return this._haltFocus;
    }

    /**
     * Global flag to stop INITIATING farming.
     * Existing farms will continue to spawn workers.
     * When CPU bucket drops below farming limit or we have non-temple focus rooms, then save cpus.
     */
    get haltFarming() {
        if (typeof this._haltFarming === "undefined") {
            this._haltFarming = Game.cpu.bucket < Config.params.CPU_FARMING_ABSOLUTE;
        }
        return this._haltFarming;
    }

    get haltProcessPower() {
        if (typeof this._haltProcessPower === "undefined") {
            this._haltProcessPower = !!(
                // Global CPU check for power.
                (Game.cpu.bucket < Config.params.CPU_PROCESSPOWER_ABSOLUTE)

                // Global flag check for disabling power processing.
                || FlagManager.noprocesspowerFlag

                // Is empire objective NOT to increase gpl?
                || !this.isEmpireObjectiveGpl
            );
        }
        return this._haltProcessPower;
    }

	get haltDefend() {
        if (typeof this._haltDefend === "undefined") {
            this._haltDefend =
                // If we are past our bucket, let the game cool down.
                (Game.cpu.bucket < Config.params.CPU_DEFEND_ABSOLUTE)
        }
        return this._haltDefend;
    }

	get haltStop() {
        if (typeof this._haltStop === "undefined") {
            this._haltStop =
                // If we are past our bucket, let the game cool down.
                (Game.cpu.bucket < Config.params.CPU_STOP_ABSOLUTE)
        }
        return this._haltStop;
    }

	get haltShutdown() {
        if (typeof this._haltShutdown === "undefined") {
            this._haltShutdown =
                // If we are past our bucket, let the game cool down.
                (Game.cpu.bucket < Config.params.CPU_SHUTDOWN_ABSOLUTE)
        }
        return this._haltShutdown;
    }

    finalizePowerCreeps() {
        let powerCreeps = this.powerCreeps;
        powerCreeps.forEach(powerCreep => {
            powerCreep.finalize();
        })
    }

    manageCreeps() {
        let creeps = CreepManager.creepsArray;
        creeps.forEach(creep => {

            if (!creep.spawning) {
                // Setup any variables and settings.
                creep.initialize();

                // Note that profiler will NOT include king, queen, jester time in the time for Creep.task_run since they have dedicated routines.
                switch (creep.role) {
                    // Just to keep the lights on and the base protected.
                    case Config.roles.KING: if (this.shouldNotStop(Game.flags.stopking)) creep.roleKing(); break;
                    case Config.roles.QUEEN: if (this.shouldNotStop(Game.flags.stopqueen)) creep.roleQueen(); break;
                    case Config.roles.JESTER: if (this.shouldNotStop(Game.flags.stopjester)) creep.roleJester(); break;

                    // Defenders of the realm! Archers are allowed to move between rooms and reserved properties.
                    case Config.roles.ARCHER:
                    case Config.roles.RANGER:
                    case Config.roles.HOUND:
                        if (!creep.memory.portal && (creep.defendRoom !== creep.workRoom)) {
                            creep.workRoom = creep.defendRoom;
                            if (creep.workRoom === creep.assignedRoom) {
                                utils.verboseLog('🛡️ Creep ' + creep.name + ' ' + creep.room.print + ' returning to assigned room ' + utils.getShardRoomHTML(creep.assignedRoom));
                            }
                            else {
                                utils.verboseLog('🗡️ Creep ' + creep.name + ' ' + creep.room.print + ' defending room ' + utils.getShardRoomHTML(creep.workRoom));
                            }
                        }

                        creep.roleDefender();
                        break;

                    // InvaderCore paladin.
                    case Config.roles.PALADIN: creep.rolePaladin(); break;
                    case Config.roles.EXECUTIONER: creep.roleExecutioner(); break;
                    case Config.roles.COLLIER: creep.roleCollier(); break;

                    case Config.roles.LANCER1:
                    case Config.roles.LANCER2:
                    case Config.roles.LANCER3:
                    case Config.roles.LANCER4:
                    case Config.roles.LANCER5:
                        //creep.setLancerWorkRoom();
                        creep.roleLancer();
                        break;

                    case Config.roles.SAPPER: creep.roleSapper(); break;

                    // Do the rest of the non-essential creep types.
                    case Config.roles.PEASANT: creep.rolePeasant(); break;

                    case Config.roles.PEON: creep.rolePeon(); break;
                    case Config.roles.ROOK: creep.roleRook(); break;
                    case Config.roles.PAGE: creep.rolePage(); break;

                    case Config.roles.FARMER: creep.roleFarmer(); break;
                    case Config.roles.OX: creep.roleOx(); break;
                    case Config.roles.SCAVENGER: creep.roleScavenger(); break;

                    case Config.roles.PROSPECTOR: creep.roleProspector(); break;
                    case Config.roles.MINER: creep.roleMiner(); break;
                    case Config.roles.DREDGER: creep.roleDredger(); break;
                    case Config.roles.PREACHER: creep.rolePreacher(); break;
                    case Config.roles.LLAMA: creep.roleLlama(); break;
                    case Config.roles.DONKEY: creep.roleDonkey(); break;
                    case Config.roles.JACKASS: creep.roleJackass(); break;
                    case Config.roles.BURRO: creep.roleBurro(); break;
                    case Config.roles.HORSE: creep.roleHorse(); break;
                    case Config.roles.MULE: creep.roleMule(); break;
                    case Config.roles.ROGUE: creep.roleRogue(); break;
                    case Config.roles.SCOUT: creep.roleScout(); break;

                    case Config.roles.CRIER: creep.roleCrier(); break;
                    case Config.roles.PROPHET: creep.roleProphet(); break;
                    case Config.roles.BELLMAN: creep.roleBellman(); break;
                    case Config.roles.HERALD: creep.roleHerald(); break;
                    case Config.roles.DIVINER: creep.roleDiviner(); break;
                    case Config.roles.ORACLE: creep.roleOracle(); break;

                    case Config.roles.CARPENTER: creep.roleCarpenter(); break;
                    case Config.roles.MASON: creep.roleMason(); break;
                    case Config.roles.CLERK: creep.roleClerk(); break;
                    case Config.roles.GNOME: creep.roleGnome(); break;
                    case Config.roles.FENCER: creep.roleFencer(); break;

                    case Config.roles.PIKEMAN: creep.rolePikeman(); break;
                    case Config.roles.HOUND: creep.roleHound(); break;
                    case Config.roles.CROSSBOWMAN: creep.roleCrossbowman(); break;
                    case Config.roles.DEACON: creep.roleDeacon(); break;

                    case Config.roles.SWORDSMAN: creep.roleSwordsman(); break;
                    case Config.roles.CLERIC: creep.roleCleric(); break;

                    // The powerbank group.
                    case Config.roles.STRIKER: creep.roleStriker(); break;
                    case Config.roles.CARDINAL: creep.roleCardinal(); break;
                    case Config.roles.BLACKSMITH: creep.roleBlacksmith(); break;
                    case Config.roles.BISHOP: creep.roleBishop(); break;

                    // Attack logic creeps who are not otherwise defenders/offensive.
                    case Config.roles.WATCHMAN: creep.roleWatchman(); break;
                    case Config.roles.KNIGHT: creep.roleKnight(); break;
                    case Config.roles.PRIEST: creep.rolePriest(); break;

                    // Seasonal.
                    case Config.roles.ENGINEER: creep.roleEngineer(); break;
                }

                // Cleanup.
                creep.finalize();
            }

        })

    }

    get usedGPL() {
        if (typeof this._usedGPL === "undefined") {
            this._usedGPL = _.sum(Object.keys(Game.powerCreeps), s => 1 + Game.powerCreeps[s].level);
        }
        return this._usedGPL;
    }

    /**
     * If the killpowercreep flag is out, powercreeps will drop everything, despawn and will not respawn.
     */
    suicidePowerCreeps() {
        if (FlagManager.killpowercreepFlag) {
            this.powerCreeps.forEach(creep => {
                if (creep.pos) {
                    if (creep.store.getUsedCapacity(RESOURCE_OPS)) {
                        creep.drop(RESOURCE_OPS);
                    }
                    else {
                        creep.suicide();
                    }
                }
            });
        }
    }

    manageGPL() {
        // Suicide any powercreeps if our flag is out.
        this.suicidePowerCreeps();

        // If we are not managing GPL automatically with nogpl flag, then bail out.
        if (FlagManager.nogplFlag) return false;

        // Only process on every 5 tick.
        // I think there is race condition with individual shards.
        if (Game.time % 5 !== 0) return false;

        // Grab our global power level.
        let gplLevel = Game.gpl.level;

        // Not sure but think we can only do one at a time.
        for (let i=this.usedGPL; (i<gplLevel) && (i<this.usedGPL+1) && (i<Config.params.POWERCREEP_GPL.length); i++) {
            let loopIndex = Math.floor(i / Config.params.POWERCREEP_GPL.length);
            let suffix = String.fromCharCode('a'.charCodeAt(0) + loopIndex);

            let index = i % Config.params.POWERCREEP_GPL.length;
            let gplData = Config.params.POWERCREEP_GPL[index];
            let powerCreepName = (gplData.name + suffix + ' ' + gplData.shard).trim();

            let result = OK;
            switch (gplData.action) {
                case 'create':
                    result = PowerCreep.create(powerCreepName, gplData.arg)
                    break;

                case 'upgrade':
                    result = ERR_NOT_FOUND;
                    if (Game.powerCreeps[powerCreepName]) {
                        result = Game.powerCreeps[powerCreepName].upgrade(gplData.arg);
                    }
                    break;
            }

            console.log('🔴 Consuming GPL #' + i + ' on PowerCreep [' + powerCreepName + '] ACTION:' + gplData.action + ';' + gplData.arg + '  RESULT:' + result);
            return true;
        }

        // This is the loop for our repeating golddiggers.
        for (let i=this.usedGPL; (i<gplLevel) && (i<this.usedGPL+1) && (i>=Config.params.POWERCREEP_GPL.length); i++) {
            let loopIndex = Math.floor((i - Config.params.POWERCREEP_GPL.length) / Config.params.GOLDDIGGER_GPL.length);
            // Note that we are starting at 'b' since one was already created.
            let suffix = String.fromCharCode('b'.charCodeAt(0) + loopIndex);

            let index = (i - Config.params.POWERCREEP_GPL.length) % Config.params.GOLDDIGGER_GPL.length;
            let gplData = Config.params.GOLDDIGGER_GPL[index];
            let powerCreepName = (gplData.name + suffix + ' ' + gplData.shard).trim();

            let result = OK;
            switch (gplData.action) {
                case 'create':
                    result = PowerCreep.create(powerCreepName, gplData.arg)
                    break;

                case 'upgrade':
                    result = ERR_NOT_FOUND;
                    if (Game.powerCreeps[powerCreepName]) {
                        result = Game.powerCreeps[powerCreepName].upgrade(gplData.arg);
                    }
                    break;
            }

            console.log('🔴 Consuming GPL #' + i + ' on PowerCreep [' + powerCreepName + '] ACTION:' + gplData.action + ';' + gplData.arg + '  RESULT:' + result);
            return true;
        }

        return false;
    }

    /**
     * Using all our observers, observe rooms in this sector & surrounding highways ordered by oldest time since last visit.
     */
    manageObservers() {
        // The working list of rooms we have observed in this tick.
        let observedRooms = {};

        // Skip if we are throttling cpu.
        if (!FlagManager.throttleFlag) {

            // Update our list of available observers by filtering out the ones used in this loop.
            let observers = this.empireObservers;
            observers.forEach(observer => {
                let roomName = null;

                // Are we currently claiming a room that we haven't got the controller yet?
                if (!roomName) {
                    roomName = this.empireRoomNamesToClaimThatAreUnclaimed.find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    );
                }

                // We have a colony map  flag out?
                if (!roomName) {
                    let f = FlagManager.mapFlag ? FlagManager.mapFlag.pos.roomName : null;

                    // Filter out any rooms we are already observing in this loop.
                    if (
                        // Do we even have a map room?
                        f

                        // Filter out any rooms we are already observing in this loop.
                        && !observedRooms[f]

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    ) {
                        roomName = f;
                    }
                }

                // We have an observe flag for the room.
                if (!roomName) {
                    roomName = Object.keys(FlagManager.observeFlags).find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    );
                }

                // We have a screeps in highways? Screeps move so keep an eye on them.
                // if (!roomName) {
                //     roomName = this.screepsRoomNames.find(f =>
                //         // Filter out any rooms we are already observing in this loop.
                //         !observedRooms[f]

                //         // If this flag is in range, then observe it.
                //         && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                //     );
                // }

                // We have a screeps in nearby highways? Screeps move so keep an eye on them as it will move along the highway from corner to corner.
                if (!roomName) {
                    roomName = this.screepsAdjacentHighwayRoomNames.find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    );
                }

                // We have an assult flag for the room with no nuke flags.
                if (!roomName) {
                    roomName = Object.keys(FlagManager.assaultFlags).find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // If there are autonuke flags or nukes, then room has been processed already and no need to scan every tick.
                        && !FlagManager.autonukeFlagsByRoomName(f).length
                        && !RoomIntel.getNukeCount(f)

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    );
                }

                // Our reserved rooms. Need visiblity into them at all times for hostile detection, and our own spawn data.
                if (!roomName) {
                    roomName = this.myReservedRoomNamesWithNoVisibility.find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // If this flag is in range, then observe it.
                        && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                    );
                }

                // // We have an stronghold attack underway?
                // if (!roomName) {
                //     roomName = this.activeStrongholdRoomNames.find(f =>
                //         // Filter out any rooms we are already observing in this loop.
                //         !observedRooms[f]

                //         // If this flag is in range, then observe it.
                //         && (Cartographer.findRoomRange(observer.room.name, f) <= OBSERVER_RANGE)
                //     );
                // }

                // We want to observe corners more often, as screep trains are created in them.
                if (!roomName) {
                    roomName = observer.room.highwayCornerRoomsInObserverRange.find(f =>
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[f]

                        // We have old data on this room that needs to be refreshed.
                        && (((RoomIntel.getVisited(f) || 0) + Config.params.OBSERVE_CORNER_ROOM_AGE_TICKS) < Game.time)
                    );
                }

                if (!roomName) {
                    // Get the rooms in reservable range, and use the current tick as index into array of all reachable rooms.
                    // Then only observe the room if it hasn't been observed recently.
                    // This algorithm does not need to search for a room and keeps performance managable.
                    // CAREFUL: HUGE PERFORMANCE ISSUES IN THIS VERY LARGE SET! DO NOT ADD CRITERIA.
                    let index = Game.time % observer.room.roomsInObserverRange.length;
                    let indexRoomName = observer.room.roomsInObserverRange[index];
                    if (
                        // Filter out any rooms we are already observing in this loop.
                        !observedRooms[indexRoomName]

                        // We have old data on this room that needs to be refreshed.
                        && (((RoomIntel.getVisited(indexRoomName) || 0) + Config.params.OBSERVE_ROOM_AGE_TICKS) < Game.time)
                    ) {
                        roomName = indexRoomName;
                    }
                }

                // FINAL STEP: If a room was picked, observer can spy on it now.
                if (roomName && (observer.observeRoom(roomName) === OK)) {
                    observedRooms[roomName] = roomName;
                    this.addProcess('observeRoom')
                }
            })
        };

        // Save the rooms we observed to display later to the user.
        let observedArray = Object.keys(observedRooms);
        Memory.observedRooms = observedArray;

        return true;
    }

    get roomsInEmpireAutoAssaultDistanceHash() {
        if (typeof this._roomsInEmpireAutoAssaultDistanceHash === "undefined") {
            this._roomsInEmpireAutoAssaultDistanceHash = utils.arrayToHash(
                utils.unique(this.empireSpawnRoomsActive.map(m => m.controllerRoomsInAutoAssaultRoomDistance).flatten()).filter(f =>
                    // Room is owned by someone else.
                    RoomIntel.getOwnedByOtherPlayer(f)
                    // And they are not an ally.
                    && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                )
            );
        }
        return this._roomsInEmpireAutoAssaultDistanceHash;
    }

    /**
     * Return the room name of the best target to nuke.
     * Will only return a name if no other autonuke flags are currently out.
     * Will search our top 3 most desired claimable rooms.
     * Then will search for closest room to any hostile room in reservable range of our spawns.
     */
    get autonukeRoomName() {
        if (typeof this._autonukeRoomName === "undefined") {
            this._autonukeRoomName = null;

            // Don't add any more autonuke flags if we already have some out.
            if (!Object.keys(FlagManager.autonukeFlags).length) {

                if (!this._autonukeRoomName) {
                    // Find the first claim room in the top 3 that is hostile.
                    this._autonukeRoomName = this.getClaimRoomToNuke();
                }

                // if (!this._autonukeRoomName) {
                //     // Map every spawn room to its closest hostile room.
                //     let roomData = this.empireSpawnRoomsActive.map(m => { return {
                //         roomName: m.name
                //         // Sorting all rooms in autoassault distance.
                //         , closestHostileRoomName: _.sortBy(Cartographer.getRoomsInDistance(m.name, this.autoAssaultRoomDistance).filter(f =>
                //             // Room is owned by someone else.
                //             RoomIntel.getOwnedByOtherPlayer(f)
                //             // And they are not an ally.
                //             && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                //         ), s => Cartographer.findRouteDistance(m.name, s))[0]
                //     // Some rooms won't have any nearby hostile rooms, filter those out.
                //     }}).filter(f => f.closestHostileRoomName);

                //     // Now find the closest hostile room in our empire.
                //     if (roomData.length) {
                //         this._autonukeRoomName = _.sortBy(roomData, s=> Cartographer.findRouteDistance(s.roomName, s.closestHostileRoomName))[0].closestHostileRoomName;
                //     }
                // }

            }

        }
        return this._autonukeRoomName;
    }

    /**
     * This routine will create nuke flags for all hostile rooms that are visible.
     *
     * Note that allies will not be flagged.
     */
    updateAutoNukeFlags(force = false) {
        Object.keys(Game.rooms).forEach(roomName => {
            let room = Game.rooms[roomName];
            let flags = {}

            if (
                FlagManager.nonukeFlags[roomName]
                || FlagManager.throttleFlag
                || FlagManager.nonukeFlag
            ) {
                // Do nothing; nonuke flag is present.
            }

            else if (room.controller) {
                // Determine if this room needs to be nuked.
                if (
                    // Placeholder
                    true

                    // Any nuke candidate MUST be owned by another player.
                    && room.ownedByOther

                    // Don't nuke our friends!
                    && !PlayerManager.isAlly(room.owner)

                    // Once we have autonuke flags, don't add any more. One pass should have been enough.
                    && (force || !room.autonukeFlags.length)

                    // Performe basic sanity check for nuking.
                    && (RoomIntel.getHostileSpawnCount(roomName) || RoomIntel.getHostileTowerCount(roomName))

                    // General criteria for nuking a room.
                    && (
                        // Any room in our claimed sectors is nukable.
                        FlagManager.sectorFlags[Cartographer.getSector(roomName)]

                        // Do we have a manual assault flag in this room?
                        || FlagManager.assaultFlags[roomName]

                        // Are we looking to claim this room as the top priority?
                        || ((this.empireRoomNamesToClaimHash[roomName] || 0) === 1)

                        // This room is in our autonuke list.
                        || (this.autonukeRoomName === roomName)

                        // Is this room within our autoattack distance? If so, flag for nuking.
                        || this.roomsInEmpireAutoAssaultDistanceHash[roomName]
                    )

                    // Once nukes start flying, halt putting down any more flags.
                    // Don't use cached RoomIntel for this, it needs to be real time.
                    //&& (force || !room.nukes.length)
                    && (force || !RoomIntel.getNukeCount(room.name))
                ) {
                    // Note that flags are tagged A/B/C/D/etc so they can be sorted in order of priority nuking, when we don't have enough nukes to cover all flags.

                    // Tag each spawn in the room with a nuke flag as long as it doesn't already have a nuke inbound.
                    if (RoomIntel.getHostileSpawnCount(roomName)) {
                        room.hostileSpawns.forEach(spawn => {
                            let pos = spawn.pos;
                            let nukesNeeded = Math.ceil(Math.max(0, (pos.hasRampartHits + SPAWN_HITS + NUKE_DAMAGE[0]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                            for (let i = 0; i < nukesNeeded; i++) {
                                let flagName = 'autonuke A_' + pos.name + '_' + i;
                                if (typeof Game.flags[flagName] === "undefined") {
                                    // Create a flag on this spawn.
                                    console.log("🚩 Unflagged hostile spawn found", room.printShard, "for nuking =>", pos);
                                    room.createFlag(pos, flagName, COLOR_RED);
                                }
                                flags[flagName] = pos;
                            }
                        })
                    }

                    // Drop a nuke on the primary path barrier into the room to the controller.
                    if (RoomIntel.getDestroyFlagHits(room.name) && room.destroyFlagsController.length) {
                        // Now create a nuke flag on each barrier.
                        room.destroyFlagsController.map(m => m.flag.pos).forEach(pos => {
                            let nukesNeeded = Math.ceil(Math.max(0, (pos.hasBarrier + NUKE_DAMAGE[2]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                            for (let i = 0; i < nukesNeeded; i++) {
                                let flagName = 'autonuke B_' + pos.name + '_' + i;
                                if (typeof Game.flags[flagName] === "undefined") {
                                    // Create a flag on this barrier.
                                    console.log("🚩 Unflagged hostile barrier found", room.printShard, "for nuking =>", pos);
                                    room.createFlag(pos, flagName, COLOR_RED);
                                }
                                flags[flagName] = pos;
                            }
                        })
                    }

                    // // Drop a nuke on the primary path barrier into the room.
                    // if (RoomIntel.getDestroyFlagHits(room.name) && room.barriers.length) {
                    //     let myClosestRoom = this.getClosestCastleRoomTo(roomName);
                    //     if (myClosestRoom) {
                    //         // Unless we have a path to the controller already.
                    //         let data = Traveler.findTravelPath(null, Game.rooms[myClosestRoom].controller, room.controller);
                    //         if (!data || !data.path || !data.path.length || data.incomplete) {
                    //             let entry = Cartographer.findExitPos(roomName, myClosestRoom);
                    //             let barriers = room.getDestroyPositions(entry, room.controller);

                    //             // Now create a nuke flag on each barrier.
                    //             barriers.forEach(pos => {
                    //                 let nukesNeeded = Math.ceil(Math.max(0, (pos.hasBarrier + NUKE_DAMAGE[2]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                    //                 for (let i = 0; i < nukesNeeded; i++) {
                    //                     let flagName = 'autonuke B_' + pos.name + '_' + i;
                    //                     if (typeof Game.flags[flagName] === "undefined") {
                    //                         // Create a flag on this barrier.
                    //                         console.log("🚩 Unflagged hostile barrier found", room.printShard, "for nuking =>", pos);
                    //                         room.createFlag(pos, flagName, COLOR_RED);
                    //                     }
                    //                     flags[flagName] = pos;
                    //                 }
                    //             })
                    //         }
                    //     }
                    // }

                    // Tag storage in the room with a nuke flag as long as it doesn't already have a nuke inbound.
                    if (room.hostileStorage) {
                        let pos = room.hostileStorage.pos;
                        let nukesNeeded = Math.ceil(Math.max(0, (pos.hasRampartHits + STORAGE_HITS + NUKE_DAMAGE[0]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                        for (let i = 0; i < nukesNeeded; i++) {
                            let flagName = 'autonuke C_' + pos.name + '_' + i;
                            if (typeof Game.flags[flagName] === "undefined") {
                                // Create a flag on this spawn.
                                console.log("🚩 Unflagged hostile storage found", room.printShard, "for nuking =>", pos);
                                room.createFlag(pos, flagName, COLOR_RED);
                            }
                            flags[flagName] = pos;
                        }
                    }

                    // Tag terminal in the room with a nuke flag as long as it doesn't already have a nuke inbound.
                    if (room.hostileTerminal) {
                        let pos = room.hostileTerminal.pos;
                        let nukesNeeded = Math.ceil(Math.max(0, (pos.hasRampartHits + TERMINAL_HITS + NUKE_DAMAGE[0]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                        for (let i = 0; i < nukesNeeded; i++) {
                            let flagName = 'autonuke C_' + pos.name + '_' + i;
                            if (typeof Game.flags[flagName] === "undefined") {
                                // Create a flag on this spawn.
                                console.log("🚩 Unflagged hostile terminal found", room.printShard, "for nuking =>", pos);
                                room.createFlag(pos, flagName, COLOR_RED);
                            }
                            flags[flagName] = pos;
                        }
                    }

                    // Tag each tower in the room with a nuke flag as long as it doesn't already have a nuke inbound.
                    if ((RoomIntel.getHostileTowerCount(roomName) || 0) > 2) {
                        room.hostileTowers.forEach(tower => {
                            let pos = tower.pos;
                            let nukesNeeded = Math.ceil(Math.max(0, (pos.hasRampartHits + TOWER_HITS + NUKE_DAMAGE[2]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                            for (let i = 0; i < nukesNeeded; i++) {
                                let flagName = 'autonuke D_' + pos.name + '_' + i;
                                if (typeof Game.flags[flagName] === "undefined") {
                                    // Create a flag on this spawn.
                                    console.log("🚩 Unflagged hostile tower found", room.printShard, "for nuking =>", pos);
                                    room.createFlag(pos, flagName, COLOR_RED);
                                }
                                flags[flagName] = pos;
                            }
                        })
                    }

                    // Tag the labs that are in the center of other labs as a target.
                    if (CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level]) {
                        let labs = room.hostileLabs.filter(f => f.pos.findInRange(room.hostileLabs, 2).length === CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level]);
                        labs.forEach(lab => {
                            let pos = lab.pos;
                            let nukesNeeded = Math.ceil(Math.max(0, (pos.hasRampartHits + LAB_HITS + NUKE_DAMAGE[2]) - room.getPotentialNukeDamageByPosHash(pos, flags)) / NUKE_DAMAGE[0]);
                            for (let i = 0; i < nukesNeeded; i++) {
                                let flagName = 'autonuke E_' + pos.name + '_' + i;
                                if (typeof Game.flags[flagName] === "undefined") {
                                    // Create a flag on this spawn.
                                    console.log("🚩 Unflagged hostile lab found", room.printShard, "for nuking =>", pos);
                                    room.createFlag(pos, flagName, COLOR_RED);
                                }
                                flags[flagName] = pos;
                            }
                        })
                    }

                }

                // Remove dead flags.
                let flagItems = FlagManager.autonukeFlagsByRoomName(roomName);
                if (
                    // Any nuke candidate MUST be owned by another player.
                    !room.ownedByOther

                    // Don't nuke our friends!
                    || PlayerManager.isAlly(room.owner)

                    // Once nukes are flying, the player may defend and move things around.
                    // Should clear out an remaining flags and let flags reset after these lands.
                    || RoomIntel.getNukeCount(room.name)
                ) {
                    // Remove any nuke flags that might be in this room by accident or leftover or never fired because we were short of nukes.
                    Object.values(flagItems).forEach(flagItem => {
                        if (!flags[flagItem.flag.name]) {
                            flagItem.flag.remove();
                            console.log("🚩 Removing unneeded flag", room.printShard, "=>", flagItem.flag.pos);
                        }
                    })
                }

                // Remove any nuke flags that have nothing under them.
                Object.values(flagItems).forEach(flagItem => {
                    if (!flagItem.flag.pos.lookForHostileNonDecayStructure()) {
                        flagItem.flag.remove();
                        console.log("🚩 Removing unneeded flag with no structure", room.printShard, "=>", flagItem.flag.pos);
                    }
                })

            }

            else if (Cartographer.isSKRoom(roomName)) {
                let flagItems = FlagManager.autonukeFlagsByRoomName(roomName);

                // Tag storage in the room with a nuke flag as long as it doesn't already have a nuke inbound.
                if (
                    // Once flags are put down in an SK room, no need to calculate again.
                    !flagItems.length

                    // Is there a stronghold to nuke?
                    // Test agains room intel first to bypass hard lookup.
                    && RoomIntel.getStrongholdInvaderCoreHitsByRoomName(roomName)

                    // Will this stronghold despawn before the nuke lands?
                    && (RoomIntel.getStrongholdDespawnTimeByRoomName(roomName) > Game.time + NUKE_LAND_TIME + (CREEP_LIFE_TIME * 2))

                    // Once nukes start flying, halt putting down any more flags.
                    && (force || !RoomIntel.getNukeCount(roomName))

                    // Is this room even in a sector we have rooms in to loot?
                    && this.isRoomNameInEmpireSectors(roomName)

                    // Will be referencing the actual stronghold.
                    && room.invaderStronghold
                ) {
                    // Cannot handle any fortifier creeps, 50% chance of this occuring.
                    // See \screeps\engine\src\processor\intents\invader-core\stronghold\stronghold.js
                    if ((room.invaderStronghold.level === 4) && (room.hostileTowers.length === 4) && (room.invaders.length === 4) && (room.invadersWithWork.length === 0)) {

                        // Level 4 strongholds get 2 nuke dropped right outside of the least valueable container and its opposite.
                        let invaderContainers = room.containers.filter(f => f.pos.inRange2(room.invaderStronghold));
                        let bestContainer = _.sortBy(invaderContainers, s => -s.value)[0];
                        let bestContainerId = bestContainer.id;
                        let oppositeContainerId = invaderContainers.find(f => ((f.pos.x == bestContainer.pos.x) || (f.pos.y === bestContainer.pos.y))).id;
                        let worstContainers = invaderContainers.filter(f => ![bestContainerId, oppositeContainerId].includes(f.id));

                        worstContainers.forEach(container => {
                            let pos = null;
                            // Top container.
                            if (container.pos.x === room.invaderStronghold.pos.x && container.pos.y < room.invaderStronghold.pos.y) {
                                pos = new RoomPosition(container.pos.x, container.pos.y - 1, container.pos.roomName);
                            }
                            // Right container.
                            else if (container.pos.x > room.invaderStronghold.pos.x && container.pos.y === room.invaderStronghold.pos.y) {
                                pos = new RoomPosition(container.pos.x + 1, container.pos.y, container.pos.roomName);
                            }
                            // Bottom container.
                            else if (container.pos.x === room.invaderStronghold.pos.x && container.pos.y > room.invaderStronghold.pos.y) {
                                pos = new RoomPosition(container.pos.x, container.pos.y + 1, container.pos.roomName);
                            }
                            // Left container.
                            else if (container.pos.x < room.invaderStronghold.pos.x && container.pos.y === room.invaderStronghold.pos.y) {
                                pos = new RoomPosition(container.pos.x - 1, container.pos.y, container.pos.roomName);
                            }

                            let flagName = 'autonuke ' + pos.name;
                            if (!FlagManager.autonukeFlags.find(f => f.flag.pos.isEqualTo(pos)) && !room.nukes.find(f => f.pos.isEqualTo(pos))) {
                                // Create a flag on this spawn.
                                console.log("🚩 Unflagged invader stronghold found", room.printShard, "for nuking =>", pos);
                                room.createFlag(pos, flagName, COLOR_RED);
                            }
                            flags[flagName] = pos;
                        })

                    }
                    // Cannot handle 2 fortifier creeps, small chance of this occuring.
                    // See \screeps\engine\src\processor\intents\invader-core\stronghold\stronghold.js
                    else if ((room.invaderStronghold.level === 5) && (room.hostileTowers.length === 6) && (room.invaders.length === 9) && (room.invadersWithWork.length === 1)) {

                        // Level 5 strongholds get 9 nukes dropped on the stronghold, then 4 nukes offset by one around the stronghold.
                        let pos = room.invaderStronghold.pos;
                        let nukesNeeded = 9 - room.nukes.filter(f => f.pos.isEqualTo(pos)).length;
                        if (FlagManager.autonukeFlags.filter(f => f.flag.pos.isEqualTo(pos)).length !== nukesNeeded) {
                            console.log("🚩 Unflagged invader stronghold found", room.printShard, "for nuking =>", pos);
                        }
                        for (let i = 0; i < nukesNeeded; i++) {
                            let flagName = 'autonuke ' + pos.name + '_' + i;
                            room.createFlag(pos, flagName, COLOR_RED);
                            flags[flagName] = pos;
                        }

                        let flagName = null;

                        pos = new RoomPosition(room.invaderStronghold.pos.x + 1, room.invaderStronghold.pos.y - 1, room.invaderStronghold.pos.roomName);
                        flagName = 'autonuke ' + pos.name;
                        if (!room.nukes.find(f => f.pos.isEqualTo(pos))) {
                            room.createFlag(pos, flagName, COLOR_RED);
                            flags[flagName] = pos;
                        }

                        pos = new RoomPosition(room.invaderStronghold.pos.x + 1, room.invaderStronghold.pos.y + 1, room.invaderStronghold.pos.roomName);
                        flagName = 'autonuke ' + pos.name;
                        if (!room.nukes.find(f => f.pos.isEqualTo(pos))) {
                            room.createFlag(pos, flagName, COLOR_RED);
                            flags[flagName] = pos;
                        }

                        pos = new RoomPosition(room.invaderStronghold.pos.x - 1, room.invaderStronghold.pos.y + 1, room.invaderStronghold.pos.roomName);
                        flagName = 'autonuke ' + pos.name;
                        if (!room.nukes.find(f => f.pos.isEqualTo(pos))) {
                            room.createFlag(pos, flagName, COLOR_RED);
                            flags[flagName] = pos;
                        }

                        pos = new RoomPosition(room.invaderStronghold.pos.x - 1, room.invaderStronghold.pos.y - 1, room.invaderStronghold.pos.roomName);
                        flagName = 'autonuke ' + pos.name;
                        if (!room.nukes.find(f => f.pos.isEqualTo(pos))) {
                            room.createFlag(pos, flagName, COLOR_RED);
                            flags[flagName] = pos;
                        }

                    }
                }

                // Remove any nuke flags that might be in this room by accident or leftover or never fired because we were short of nukes.
                if (
                    // Is there a stronghold to nuke?
                    // Test agains room intel first to bypass hard lookup.
                    !RoomIntel.getStrongholdInvaderCoreHitsByRoomName(roomName)

                    // Once nukes are flying, the player may defend and move things around.
                    // Should clear out an remaining flags and let flags reset after these lands.
                    || RoomIntel.getNukeCount(roomName)
                ) {
                    Object.values(flagItems).forEach(flagItem => {
                        if (!flags[flagItem.flag.name]) flagItem.flag.remove();
                    })
                }
            }

        })
    }

    removeAllNukeFlags() {
        // Remove all nuke flags.
        let flags = FlagManager.nukeFlags;
        Object.values(flags).forEach(flagName => {
            flagName.flag.remove();
        })

        // Remove all autonuke flags.
        let autoflags = FlagManager.autonukeFlags;
        Object.values(autoflags).forEach(flagName => {
            flagName.flag.remove();
        })
    }

    /**
     * The master routine for managing nukers and target selection.
     */
    manageNukers() {
        // If we are conserving minerals, then we aren't allowing usage of anything that consumes them.
		if (this.isEmpireConservingMinerals) return true;

        // The list of nukes we have requested.
        let nukeFlags = FlagManager.nukeFlags;

        // The list of autonukes that are placed.
        let autonukeFlags = FlagManager.autonukeFlags;

        // If there are no nuke flags at all, unset the launch key and bail out.
        if (!nukeFlags.length && FlagManager.launchFlag) {
            FlagManager.launchFlag.setColor(COLOR_WHITE);
        }

        // Get the list of nukers from active rooms that are good to go.
        let empireNukers = this.empireNukers.filter(f => f.readyToLaunch);

        // Initialize our variables.
        let statusFail = [];
        let noNukesAvailableFail = [];
        let noNukesInRangeFail = [];
        let saturateFail = [];

        // Launch our manual nukes.
        if (FlagManager.launchFlag && nukeFlags.length) {

            for (let i=0; i < nukeFlags.length; i++) {
                let nukeFlag = nukeFlags[i].flag;

                // Look for a nonuke flag out in this room, if so then bypass.
                if (FlagManager.nonukeFlags[nukeFlag.pos.roomName]) continue;

                if (RoomIntel.getRoomStatus(nukeFlag.pos.roomName) !== 'normal') {
                    // The room to be nuked is protected. Nuke only when room restrictions have been lifted.
                    statusFail.push(nukeFlag.pos.roomName);
                }
                else if (!empireNukers.length) {
                    // If we have run out of nukers, but still have targets, then write to the console that this is a problem.
                    noNukesAvailableFail.push(nukeFlag.pos.roomName);
                }
                else {
                    // Get a list of nukers in range of this target.
                    let empireNukersInRange = empireNukers.filter(f => Game.map.getRoomLinearDistance(f.room.name, nukeFlag.pos.roomName) <= NUKE_RANGE);

                    // Find the closest nuke that we have to this flag, and launch it.
                    let colonyNuker = _.sortBy(empireNukersInRange, s => Game.map.getRoomLinearDistance(s.room.name, nukeFlag.pos.roomName)).find(x => x !== undefined);
                    if (!colonyNuker) {
                        noNukesInRangeFail.push(nukeFlag.pos.roomName);
                    }
                    else {
                        let message = '🍄 Nuke outbound from ' + colonyNuker.room.printShard + ' to ' + utils.getRoomHTML(nukeFlag.pos.roomName) + ' !!!';
                        Game.notify(message);
                        console.log(message);

                        // Launch the nuke!
                        if (colonyNuker.launchNuke(nukeFlag.pos) === OK) {
                            // Remove the nuke flag that was present.
                            nukeFlag.remove();

                            // Only launch one nuke at a time and do not process any autonukes.
                            return true;
                        }
                    }
                }
            }
        }

        // Launch our auto nukes.
        if (FlagManager.autolaunchFlag && autonukeFlags.length) {

            // Get list of unique room names with autonuke flags.
            let roomNames = Object.keys(FlagManager.autonukeFlagsGroupedByRoomName);

            // Order rooms by the closest to one of our rooms.
            roomNames = _.sortBy(roomNames, s => this.getRangeToClosestSpawnRoomTo(s));

            for (let r=0; r<roomNames.length; r++) {
                let nukeRoom = roomNames[r];

                // Get a list of nuke flags in this room. Compare against the number of nukers in range.
                // We want to be able to launch all nuke requests for a room at once.
                // Sort so that more valuable flags are processed first (A should be first target, B should be second, etc)
                let myNukeFlagsInRoom = _.sortBy(FlagManager.autonukeFlagsByRoomName(nukeRoom), s=>s.flag.name);

                // Get a list of nukers in range of this target.
                let empireNukersInRange = this.empireNukers.filter(f => Game.map.getRoomLinearDistance(f.room.name, nukeRoom) <= NUKE_RANGE);
                let empireNukersInRangeReadyToLaunch = empireNukersInRange.filter(f => f.readyToLaunch);
                let empireNukersInRangeReadyToLaunchOrJustLaunched = empireNukersInRange.filter(f => f.readyToLaunch || ((f.cooldown || 0) > Config.params.NUKER_SATURATION_COOLDOWN));

                // Have to have at least one nuker actually ready to launch.
                if (empireNukersInRangeReadyToLaunch.length) {
                    // Can we saturate this room with nukes?
                    // Or are all nukes that are in range available, even if it isn't enough?
                    // Or did we just have a launch, and there are some left over that we might as well send out to have every cooldown ticking?
                    // SK rooms should NOT launch incomplete, only controller rooms should.
                    if (
                        (myNukeFlagsInRoom.length <= empireNukersInRangeReadyToLaunch.length)
                        || ((Cartographer.isControllerRoom(nukeRoom) && (empireNukersInRange.length === empireNukersInRangeReadyToLaunchOrJustLaunched.length)))
                    ) {
                        // Sort them by the closest to target.
                        empireNukersInRangeReadyToLaunch = _.sortBy(empireNukersInRangeReadyToLaunch, s => Game.map.getRoomLinearDistance(s.room.name, nukeRoom));

                        // We should have the same number of flags and nukes in our arrays (possibly more nukers).
                        for (let i=0; i<empireNukersInRangeReadyToLaunch.length; i++) {
                            if (myNukeFlagsInRoom[i]) {
                                let colonyNuker = empireNukersInRangeReadyToLaunch[i];
                                let nukeFlag = myNukeFlagsInRoom[i].flag;

                                let message = '🍄 Nuke outbound from ' + colonyNuker.room.printShard + ' to ' + utils.getRoomHTML(nukeFlag.pos.roomName) + ' ' + nukeFlag.pos + ' !!!';
                                Game.notify(message);
                                console.log(message);

                                // Launch the nuke!
                                if (colonyNuker.launchNuke(nukeFlag.pos) === OK) {
                                    // Remove the nuke flag that was present.
                                    nukeFlag.remove();
                                }
                            }
                        }

                        // Only nuke one room at a time.
                        return true;
                    }
                }

                // Something went wrong, report on the error condition.
                if (!empireNukersInRange.length) {
                    noNukesInRangeFail.push(nukeRoom);
                }
                else if (empireNukersInRangeReadyToLaunch.length < myNukeFlagsInRoom.length) {
                    // Get the estimated max cooldown of the nuker which will give us enough to saturate the room with nukes.
                    let cooldown = _.max(_.sortBy(empireNukersInRange.filter(f => f.cooldown).map(m => m.cooldown)).slice(0, myNukeFlagsInRoom.length - empireNukersInRangeReadyToLaunch.length));

                    saturateFail.push({ roomName:nukeRoom, nukersInRange:empireNukersInRange.length, nukersReadyToLaunch:empireNukersInRangeReadyToLaunch.length, nukeFlags:myNukeFlagsInRoom.length, cooldown:cooldown });
                }
            }
        }


		// Bail out if we don't have a tick flag.
		if (FlagManager.notickFlag) return false;

        // Display info in console.
        if (noNukesAvailableFail.length) {
            let message = '🚫 Nuke request to' + utils.unique(noNukesAvailableFail.map(m => ' ' + utils.getShardRoomHTML(m))) + ' but no nukes are available.';
            console.log(message);
        }
        if (statusFail.length)  {
            // The room to be nuked is protected. Nuke only when room restrictions have been lifted.
            let message = '🚫 Nuke request to' + utils.unique(statusFail.map(m => ' ' + utils.getShardRoomHTML(m))) + ' but room status is not normal.';
            console.log(message);
        }
        if (noNukesInRangeFail.length) {
            let message = '🚫 Nuke request to' + utils.unique(noNukesInRangeFail.map(m => ' ' + utils.getShardRoomHTML(m))) + ' but no nukes are in range.';
            console.log(message);
        }
        saturateFail.forEach(fail => {
            let message = '🚫 Nuke request to ' + utils.getShardRoomHTML(fail.roomName) + ' but not enough ready nukes (' + fail.nukersReadyToLaunch + ') are in range (' + fail.nukersInRange + ') to saturate all nuke flags (' + fail.nukeFlags + ') in room. Estimated cooldown ' + fail.cooldown;
            console.log(message);
        })
        if (empireNukers.length)  {
            let message = '💣 Nukers ready to launch on ' + Game.shard.name + ': ' + empireNukers.length + '/' + this.empireNukers.length;
            console.log(message);
        }

        let nukedRooms = RoomIntel.getNukedRoomsList();
        if (nukedRooms.length) {
            let message = '🍄 NUKE ACTIVITY -- ' + nukedRooms.map(m => utils.getRoomHTML(m) + ':' + (RoomIntel.getNukeTimeToLand(m) - Game.time) + 'x' + RoomIntel.getNukeCount(m)).join();
            console.log(message);
        }

        // Nothing to nuke.
        return false;
    }

    get empireRoomNamesToClaim() {
        if (typeof this._empireRoomNamesToClaim === "undefined") {
            // Manually placed claim flags that are red (enabled).
            let claimFlags = FlagManager.claimFlags;
            let workRooms = Object.keys(claimFlags).map(m => claimFlags[m].workRoom);

            // Filter out any overriding flags. This could have been a temple room.
            let unclaimFlags = FlagManager.unclaimFlags;
            let avoidFlags = FlagManager.avoidFlags;
            workRooms = workRooms.filter(f => !unclaimFlags[f] && !avoidFlags[f]);

            this._empireRoomNamesToClaim = workRooms;
        }
        return this._empireRoomNamesToClaim;
    }

    get empireRoomNamesToClaimHash() {
        if (typeof this._empireRoomNamesToClaimHash === "undefined") {
            this._empireRoomNamesToClaimHash = utils.arrayToHashIndexOne(this.empireRoomNamesToClaim);
        }
        return this._empireRoomNamesToClaimHash;
    }

    get empireRoomNamesToClaimThatAreUnclaimed() {
        if (typeof this._empireRoomNamesToClaimThatAreUnclaimed === "undefined") {
            // Only return rooms if we have Gcl availble.
            // It is a mistake to have claim room flags up but no GCL available.
            // Otherwise this is a huge performance suck in the manage spawn.
            this._empireRoomNamesToClaimThatAreUnclaimed = this.isGclAvailable ? this.empireRoomNamesToClaim.filter(f => !RoomIntel.getMy(f)) : [];
        }
        return this._empireRoomNamesToClaimThatAreUnclaimed;
    }

    get empireRoomsToClaimThatAreUnclaimedAndVisible() {
        if (typeof this._empireRoomsToClaimThatAreUnclaimedAndVisible === "undefined") {
            this._empireRoomsToClaimThatAreUnclaimedAndVisible = this.empireRoomNamesToClaimThatAreUnclaimed.filter(f => Game.rooms[f]).map(m => Game.rooms[m]);
        }
        return this._empireRoomsToClaimThatAreUnclaimedAndVisible;
    }

    /**
     * Returns an array of rooms from the given (spawn) room that are attackable.
     */
    getRoomsToAssault(roomName) {
        // The list of rooms (or room) that we are testing for.
        let roomNames = roomName ? [roomName] : this.empireSpawnRoomNamesActive;

        let getCacheKey = function(roomName) { return 'getRoomsToAssault_' + roomName; }

        roomNames.forEach(roomName => {
            let cacheKey = getCacheKey(roomName);
            let sectorName = Cartographer.getSector(roomName);

            if (typeof this._cache[cacheKey] === "undefined") {
                this._cache[cacheKey] = [];

                // Add empire rooms, filter out end state max rooms which can defend themselves.
                // Also filter out temples which should never need help once claimed.
                this._cache[cacheKey] = this._cache[cacheKey].concat(this.empireRoomNames.filter(f => !Game.rooms[f] || (!Game.rooms[f].isBulwark && !Game.rooms[f].isTemple)));

                // Include rooms that have a claim flag and are yet unclaimed. These are our pre-born baby rooms that need defense.
                this._cache[cacheKey] = this._cache[cacheKey].concat(this.empireRoomNamesToClaimThatAreUnclaimed);

                // Include rooms that are mine but do not have a claim flag. These are being cleaned.
                this._cache[cacheKey] = this._cache[cacheKey].concat(this.empireNonClaimRoomNames);

                // If we have a sector flag up for this room, then ANY rooms in its sector are fair game.
                if (FlagManager.sectorFlags[sectorName]) {
                    this._cache[cacheKey] = this._cache[cacheKey].concat(Cartographer.getSectorControllerRooms(sectorName).filter(f =>
                        // There is an owner of the room.
                        RoomIntel.getOwner(f)

                        // Don't assault our own rooms.
                        && !RoomIntel.getMy(f)

                        // And they are not an ally.
                        && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                    ));
                }

                // Add in any manually set assault flags.
                Object.keys(FlagManager.assaultFlags).forEach(f => {
                    if (
                        // There is an owner of the room.
                        RoomIntel.getOwner(f)

                        // Don't assult our own rooms.
                        && !RoomIntel.getMyManagement(f)

                        // And they are not an ally.
                        && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                    ) {
                        this._cache[cacheKey].push(f);
                    }
                })

                // Add in any rooms around us that are "interesting" and should be autoassaulted.
                // These are hostile rooms, but are showing cracks in their armor.
                Cartographer.getRoomsInRouteDistance(roomName, this.autoAssaultRoomDistance).forEach(f => {
                    if (
                        // Room is owned by someone just not us.
                        RoomIntel.getOwner(f)

                        // Don't assult our own rooms.
                        && !RoomIntel.getMyManagement(f)

                        // And they are not an ally.
                        && !PlayerManager.isAlly(RoomIntel.getOwner(f))

                        // Avoid rooms with hundreds of hit points on their destroy flags.
                        && ((RoomIntel.getDestroyFlagHits(f) || 0) < Config.params.AUTOASSAULT_DESTROY_FLAG_HITS)

                        // Conditions that make this room vulnerable.
                        && (
                            // Confirmed the room is level 5 or lower. So hard cap at 2 towers and 1 spawn max, and no boosts.
                            ((RoomIntel.getLevel(f) !== null) && (RoomIntel.getLevel(f) <= 5))
                            // Confirmed that they have 2 or fewer towers WITH ENERGY.
                            || ((RoomIntel.getHostileTowerCount(f) !== null) && (RoomIntel.getHostileTowerCount(f) <= 2))
                            // Or confirmed that they have 1 or 0 spawns up. This would make them up to level 6.
                            || ((RoomIntel.getHostileSpawnCount(f) !== null) && (RoomIntel.getHostileSpawnCount(f) <= 1))
                            // Or they have low energy in their storage or terminal. Not enough to spawn an average 50 part creep.
                            || ((RoomIntel.getHostileEnergy(f) !== null) && (RoomIntel.getHostileEnergy(f) < 50 * 100))
                        )
                    ) {
                        this._cache[cacheKey].push(f);
                    }
                })

                // Add in any long range rooms around us that are "interesting".
                // These are unowned but have some structures that should be cleaned out.
                // Some rooms have walls build around the controller or sources; annoying!
                Cartographer.getRoomsInRouteDistance(roomName, this.autoAssaultLongRangeDistance).forEach(f => {
                    if (
                        // Only care about controller rooms.
                        Cartographer.isControllerRoom(f)

                        // Don't assult our own rooms.
                        && !RoomIntel.getMyManagement(f)

                        // Room is unowned/unreserved and has structures to take down.
                        // (May be an owned low-level room with no destroy flags.)
                        && (
                            !RoomIntel.getOtherPlayerManagement(f)
                            || (
                                // Owned room is eviserated...no defense.
                                RoomIntel.getOwner(f)
                                && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                                && (RoomIntel.getHostileTowerCount(f) === 0)
                                && (RoomIntel.getHostileSpawnCount(f) <= 1)
                            )
                        )

                        // Importantly, needs to have structures we can dismantle.
                        && RoomIntel.getHasStructuresToDismantle(f)

                        // No autonuke flags
                        && !RoomIntel.getAutonukeFlags(f).length
                    ) {
                        this._cache[cacheKey].push(f);
                    }
                })

                // Get a unique list of these rooms.
                this._cache[cacheKey] = utils.unique(this._cache[cacheKey]);

                // If nukes are flying, start harrassing this room (assuming it is not Ally)
                // Add rooms around this room that might be reserved.
                this._cache[cacheKey].forEach(f => {
                    if (
                        RoomIntel.getOwner(f)
                        && !RoomIntel.getMy(f)
                        && RoomIntel.getNukeCount(f)
                        && !PlayerManager.isAlly(RoomIntel.getOwner(f))
                        && !FlagManager.avoidFlags[f]
                    ) {
                        let reservedExitRooms = Cartographer.describeExitRooms(f).filter(f2 => RoomIntel.getReservedByOtherPlayer(f2) === RoomIntel.getOwner(f));
                        reservedExitRooms.forEach(r => this._cache[cacheKey].push(r))
                    }
                })

                // Finally apply global filters that apply to all rooms.
                this._cache[cacheKey] = this._cache[cacheKey].filter(f =>
                    // Bail out if the room is in hostile safe mode.
                    !this.isInSafeMode(f)

                    // We are not purposely avoiding this room.
                    && !FlagManager.avoidFlags[f]
                );

                // Get a unique list of these rooms.
                this._cache[cacheKey] = utils.unique(this._cache[cacheKey]);

                // Lastly, sort on distance.
                this._cache[cacheKey] = _.sortByOrder(this._cache[cacheKey], [
                    sortMy => RoomIntel.getMy(sortMy) ? 0 : 1
                    , sortDistance => Cartographer.findRouteDistance(roomName, sortDistance)
                ])
            }
        });

        let retval = utils.unique(roomNames.map(m => this._cache[getCacheKey(m)]).flatten());
        return retval;
    }

    /**
     * All active spawn rooms. Exclude noreserve and temple flagged rooms.
     */
    get spawnRoomNamesReserving() {
        if (typeof this._spawnRoomNamesReserving === "undefined") {
            this._spawnRoomNamesReserving = this.spawnRoomsReserving.map(m => m.name);
        }
        return this._spawnRoomNamesReserving;
    }

    get empireBuilderCreepMax() {
        if (typeof this._empireBuilderCreepMax === "undefined") {
            this._empireBuilderCreepMax = Math.min(Math.max(1, Game.cpu.limit / Config.params.CPU_PER_BUILDER_CREEP), Config.params.MAX_BUILDERS_PER_WORKROOM);
        }
        return this._empireBuilderCreepMax;
    }

    get reservedRoomDistance() {
        let result = FlagManager.reservedRoomDistanceFlag ? C.COLOR_TO_NUMBER[FlagManager.reservedRoomDistanceFlag.color] : Config.params.RESERVE_ROOM_DISTANCE;
        return result;
    }

    get autoAssaultRoomDistance() {
        let result = FlagManager.autoAssaultRoomDistanceFlag ? C.COLOR_TO_NUMBER[FlagManager.autoAssaultRoomDistanceFlag.color] : Config.params.AUTOASSAULT_ROOM_DISTANCE;
        return result;
    }

    get autoAssaultLongRangeDistance() {
        let result = FlagManager.autoassaultLongRangeDistanceFlag ? C.COLOR_TO_NUMBER[FlagManager.autoassaultLongRangeDistanceFlag.color] : Config.params.AUTOASSAULT_LONG_RANGE_DISTANCE;
        return result;
    }

    get bestpowerbankCount() {
        let result = FlagManager.bestpowerbankFlag ? C.COLOR_TO_NUMBER[FlagManager.bestpowerbankFlag.color] : Config.params.BEST_POWERBANK_COUNT;
        return result;
    }

    get creditmaxAmount() {
        let result = FlagManager.creditmaxFlag ? C.COLOR_TO_NUMBER[FlagManager.creditmaxFlag.color] : Config.params.CREDIT_MAX_PERCENT;
        return result;
    }

    get empireSpawnRoomsWithUnassignedRogues() {
        if (typeof this._empireSpawnRoomsWithUnassignedRogues === "undefined") {
            this._empireSpawnRoomsWithUnassignedRogues = this.empireSpawnRoomsActive.filter(f => f.mySpawnedRogueCreepsUnassigned.length);
        }
        return this._empireSpawnRoomsWithUnassignedRogues;
    }

    get empireHasRogueSpawning() {
        if (typeof this._empireHasRogueSpawning === "undefined") {
            this._empireHasRogueSpawning = this.empireSpawnRoomsActive.find(room => CreepManager.getRoguesByFocusId(room.controller.id).find(rogue => rogue.spawning)) || null;
        }
        return this._empireHasRogueSpawning;
    }

    get myNonMaxSpawnRoomsActive() {
        if (typeof this._myNonMaxSpawnRoomsActive === "undefined") {
            this._myNonMaxSpawnRoomsActive = this.empireSpawnRoomsActive.filter(f => !f.atMaxLevel);
        }
        return this._myNonMaxSpawnRoomsActive;
    }

    get myNonMaxNonTempleSpawnRoomsActive() {
        if (typeof this._myNonMaxNonTempleSpawnRoomsActive === "undefined") {
            this._myNonMaxNonTempleSpawnRoomsActive = this.myNonMaxSpawnRoomsActive.filter(f => !f.isTemple);
        }
        return this._myNonMaxNonTempleSpawnRoomsActive;
    }

    get myNonMaxNonTerminalSpawnRoomsActive() {
        if (typeof this._myNonMaxNonTerminalSpawnRoomsActive === "undefined") {
            this._myNonMaxNonTerminalSpawnRoomsActive = this.myNonMaxSpawnRoomsActive.filter(f => !f.myTerminal);
        }
        return this._myNonMaxNonTerminalSpawnRoomsActive;
    }

    get myMaxSpawnRoomNamesActiveClosestToNonMaxNonTerminalColony() {
        if (typeof this._myMaxSpawnRoomNamesActiveClosestToNonMaxNonTerminalColony === "undefined") {
            // Get a unique list of max-room names that are closest to non-max rooms.
            // Unique as same max room might be closested to multiple non-max rooms.
            this._myMaxSpawnRoomNamesActiveClosestToNonMaxNonTerminalColony = utils.unique(
                this.myNonMaxNonTerminalSpawnRoomsActive
                    .filter(f => f.hasEmpireCastleAssistance)
                    .map(m => this.getClosestCastleRoomTo(m.name))
            )
        }
        return this._myMaxSpawnRoomNamesActiveClosestToNonMaxNonTerminalColony;
    }

    /**
     * Return the array of sectors that we have rooms in.
     */
    get activeSectors() {
        if (typeof this._activeSectors === "undefined") {
            this._activeSectors = utils.unique(this.empireRooms.map(m => Cartographer.getSector(m.name)));
        }
        return this._activeSectors;
    }

    generatePixel() {
        // Hey why not?
        if ((Game.cpu.bucket >= PIXEL_CPU_COST) && FlagManager.pixelFlag) {
            Game.cpu.generatePixel();
            console.log('🎨 Generating pixel for decorations: ' + pixelFlag.room.print);
        }
    }

    displayColonyLayout() {
        let colonyFlags = FlagManager.colonyFlags;
        for (let name in colonyFlags) {
            let flag = colonyFlags[name];

            // Create construction sites for the colony base if it doesn't exist already.
            if (ColonyManager.testBuild(flag.flag)) {
                ColonyManager.createColonyBase(flag.flag);
            }
        }

        let templeFlags = FlagManager.templeFlagsAnyColor;
        for (let name in templeFlags) {
            let flag = templeFlags[name];

            // Create construction sites for the colony base if it doesn't exist already.
            if (ColonyManager.testBuild(flag.flag)) {
                ColonyManager.createColonyBase(flag.flag);
            }
        }
    }


    /*** CREEP METHODS */


    /**
     * powerCreeps propery returns array of all power creeps from Game.powerCreeps.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get powerCreeps() {
        if (typeof this._powerCreeps === "undefined") {
            this._powerCreeps = Object.values(Game.powerCreeps);
        }
        return this._powerCreeps;
    }

    /**
     * All golddigger power creeps on this shard; spawned or not.
     * These should be sorted by level simply from the order they were created, but if one was deleted then it would come out of order.
     */
    getGolddiggers() {
        return _.sortBy(this.powerCreeps.filter(f => (f.name.substring(0, 1) === 'g') && (f.name.split(' ')[1] === Game.shard.name)), s => -s.level);
    }

    /**
     * rooms propery returns hash of all rooms from Game.rooms.
     */
    get roomsHash() {
        if (typeof this._roomsHash === "undefined") {
            this._roomsHash = Game.rooms;
        }
        return this._roomsHash;
    }

    /**
     * rooms propery returns array of all rooms from Game.rooms.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get roomsArray() {
        if (typeof this._roomsArray === "undefined") {
            this._roomsArray = Object.values(Game.rooms);
        }
        return this._roomsArray;
    }

    /**
     * Returns list of rooms that I own. No other filters.
     * Could be a spawn room, a temple room, or a room that is being cleaned.
     */
    get empireRooms() {
        if (typeof this._empireRooms === "undefined") {
            this._empireRooms = this.roomsArray.filter(f => f.my);
        }
        return this._empireRooms;
    }

    get empireRoomNames() {
        if (typeof this._empireRoomNames === "undefined") {
            this._empireRoomNames = this.empireRooms.map(m => m.name);
        }
        return this._empireRoomNames;
    }

    /**
     * spawnsArray propery returns array of all spawns from Game.spawns.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get spawnsArray() {
        if (typeof this._spawnsArray === "undefined") {
            this._spawnsArray = Object.values(Game.spawns);
        }
        return this._spawnsArray;
    }

    /**
     * Get hash of spawns grouped by room name.
     */
    get spawnsByRoomName() {
        if (typeof this._spawnsByRoomName === "undefined") {
            this._spawnsByRoomName = _.groupBy(this.spawnsArray, g => g.pos.roomName);
        }
        return this._spawnsByRoomName;
    }

    /**
     * Wrapper to return empty array instead of undefined.
     */
    getSpawnsByRoomName(roomName) {
        return this.spawnsByRoomName[roomName] || [];
    }

    /**
     * Note room does NOT have to be currently owned by us.
     */
    get empireSpawnRoomNamesHashFromGameSpawns() {
        if (typeof this._empireSpawnRoomNamesHashFromGameSpawns === "undefined") {
            this._empireSpawnRoomNamesHashFromGameSpawns = utils.arrayToHash(this.spawnsArray.map(m => m.room.name));
        }
        return this._empireSpawnRoomNamesHashFromGameSpawns;
    }

    /**
     * structures propery returns hash of all structures from Game.structures.
     */
    get structuresHash() {
        if (typeof this._structuresHash === "undefined") {
            this._structuresHash = Game.structures;
        }
        return this._structuresHash;
    }

    /**
     * structures propery returns array of all structures from Game.structures.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get structuresArray() {
        if (typeof this._structuresArray === "undefined") {
            this._structuresArray = Object.values(Game.structures);
        }
        return this._structuresArray;
    }

    /**
     * construction sites propery returns array of all sites from Game.constructionSites.
     * Useful to be array rather than hash format for filter and find methods.
     */
    get constructionSitesArray() {
        if (typeof this._constructionSitesArray === "undefined") {
            this._constructionSitesArray = Object.values(Game.constructionSites);
        }
        return this._constructionSitesArray;
    }

	get myConstructionSitesGroupedByRoomName() {
        if (typeof this._myConstructionSitesGroupedByRoomName === "undefined") {
            this._myConstructionSitesGroupedByRoomName = _.groupBy(this.constructionSitesArray, g => g.pos.roomName);
            if (Game.flags.FIND_MY_CONSTRUCTION_SITES) utils.printStack('GameManager', 'FIND_MY_CONSTRUCTION_SITES');
        }
        return this._myConstructionSitesGroupedByRoomName;
	}

    get myConstructionSiteRoomNamesArray() {
        if (typeof this._myConstructionSiteRoomNamesArray === "undefined") {
            this._myConstructionSiteRoomNamesArray = Object.keys(this.myConstructionSitesGroupedByRoomName);
        }
        return this._myConstructionSiteRoomNamesArray;
    }

    get myConstructionSiteRoomNamesHash() {
        if (typeof this._myConstructionSiteRoomNamesHash === "undefined") {
            this._myConstructionSiteRoomNamesHash = utils.arrayToHash(this.myConstructionSiteRoomNamesArray);
        }
        return this._myConstructionSiteRoomNamesHash;
    }

    lethalHostilesOverpoweringGuardiansByFocusId(focusId, roomName) {
        return (
            // Is our offensive power less than their hostile power?
            CreepManager.getGuardianRangedAttackPowerByFocusId(focusId) + CreepManager.getGuardianHealPowerByFocusId(focusId) <= RoomIntel.getHostileHealPower(roomName) + RoomIntel.getHostileRangedAttackPower(roomName)
        );
    }

    isInSafeMode(roomName) {
        return (RoomIntel.getHostileSafeMode(roomName) || Game.time) > Game.time;
    }

	doesRoomHaveLethalHostilesInRoute(origin, destination) {
        if (!origin) return false;
        if (!destination) return false;
        let key = (origin > destination) ? destination + origin : origin + destination;

        if (typeof this._doesRoomHaveLethalHostilesInRoute[key] === "undefined") {
            let path = Cartographer.findRouteRooms(origin, destination) || [];
            let roomName = path.find(step => RoomIntel.getLethalHostilesTTL(step));
            this._doesRoomHaveLethalHostilesInRoute[key] = roomName ? RoomIntel.getHostileRangedAttackPower(roomName) : 0;

        }
        return this._doesRoomHaveLethalHostilesInRoute[key];
	}

	doesRoomHaveLethalPlayerHostilesInRoute(origin, destination) {
        if (!origin) return false;
        if (!destination) return false;
        let key = (origin > destination) ? destination + origin : origin + destination;

        if (typeof this._doesRoomHaveLethalPlayerHostilesInRoute[key] === "undefined") {
            let path = Cartographer.findRouteRooms(origin, destination) || [];
            let roomName = path.find(step => RoomIntel.getLethalPlayerHostilesTTL(step));
            this._doesRoomHaveLethalPlayerHostilesInRoute[key] = roomName ? RoomIntel.getHostileRangedAttackPower(roomName) : 0;

        }
        return this._doesRoomHaveLethalPlayerHostilesInRoute[key];
	}

	getNextRoomInRoute(origin, destination) {
        if (!origin) return false;
        if (!destination) return false;
        let key = (origin > destination) ? destination + origin : origin + destination;

        if (typeof this._getNextRoomInRoute[key] === "undefined") {
            let path = Cartographer.findRouteRooms(origin, destination) || [];
            this._getNextRoomInRoute[key] = path[1];
        }
        return this._getNextRoomInRoute[key];
	}

	doesRoomHaveLethalHostilesInNextRoom(origin, destination) {
        if (!origin) return false;
        if (!destination) return false;
        let key = (origin > destination) ? destination + origin : origin + destination;

        if (typeof this._doesRoomHaveLethalHostilesInNextRoom[key] === "undefined") {
            let path = Cartographer.findRouteRooms(origin, destination) || [];
            this._doesRoomHaveLethalHostilesInNextRoom[key] = path[1] && RoomIntel.getHostileRangedAttackPower(path[1]);
        }
        return this._doesRoomHaveLethalHostilesInNextRoom[key];
	}

    get okToSpawnArcher() {
        if (typeof this._okToSpawnArcher === "undefined") {
            this._okToSpawnArcher =
                !this.haltDefend
                // Can spawn as many defenders as we need until we run out of cpu or hit the limit
                || (CreepManager.getArchers().length < Config.params.MAX_ARCHERS)
        }
        return this._okToSpawnArcher;
    }

    get okToSpawnHound() {
        if (typeof this._okToSpawnHound === "undefined") {
            this._okToSpawnHound =
                !this.haltDefend
                // Can spawn as many defenders as we need until we run out of cpu or hit the limit
                || (CreepManager.getHounds().length < Config.params.MAX_HOUNDS)
        }
        return this._okToSpawnHound;
    }

    get okToSpawnRanger() {
        if (typeof this._okToSpawnRanger === "undefined") {
            this._okToSpawnRanger =
                !this.haltDefend
                // Note the AND...can have only 1 ranger at a time globally.
                && (CreepManager.getRangers().length < Config.params.MAX_RANGERS)
        }
        return this._okToSpawnRanger;
    }

    get activePowerBanks() {
        if (typeof this._activePowerBanks === "undefined") {
            this._activePowerBanks = utils.unique(CreepManager.getPowerWorkers().map(m => m.focusId));
        }
        return this._activePowerBanks;
    }

    get activeDeposits() {
        if (typeof this._activeDeposits === "undefined") {
            this._activeDeposits = utils.unique(CreepManager.getProspectors().map(m => m.focusId));
        }
        return this._activeDeposits;
    }

    get activeMinerals() {
        if (typeof this._activeMinerals === "undefined") {
            this._activeMinerals = utils.unique(CreepManager.getDredgers().map(m => m.focusId));
        }
        return this._activeMinerals;
    }

    get activeStrongholdRoomNames() {
        if (typeof this._activeStrongholdRoomNames === "undefined") {
            this._activeStrongholdRoomNames = utils.unique(CreepManager.getLancers().map(m => m.workRoom));
        }
        return this._activeStrongholdRoomNames;
    }

    get farmCount() {
        if (typeof this._farmCount === "undefined") {
            // Exlcuding this.activeDeposits.length on purpose since they have such low overhead.
            this._farmCount = this.activePowerBanks.length + this.activeStrongholdRoomNames.length + this.activeMinerals.length;
        }
        return this._farmCount;
    }

    get maxFarmCount() {
        if (typeof this._maxFarmCount === "undefined") {
            this._maxFarmCount = Math.min(this.empireCastleRooms.length, Math.floor(Game.cpu.limit / Config.params.GAME_CPU_PER_FARM));
        }
        return this._maxFarmCount;
    }

    /**
     * Note that this is expensive due to farmCount.
     */
    get farmCountBelowMax() {
        return !!FlagManager.nofarmlimitFlag || (this.farmCount < this.maxFarmCount);
    }

    /**
     * Determines if the given deposit is active at a high level.
     * includeWorkers should be set to false in context of prospectors, and true for donkeys.
     */
    isDepositActive(id, includeWorkers) {
        let deposit = RoomIntel.getDepositById(id);
        if (!deposit) return false;

        // Are there currently prospectors on this deposit?
        if (includeWorkers && CreepManager.getProspectorsByFocusId(id).length) return true;

        // This is the trigger to stop the whole process.
        // Once lastcooldown max is hit, no more prospectors, which then means no more donkeys or watchmen.
        return !!(
            // Are we within our max cooldown?
            (deposit.lastCooldown < Config.params.MAX_DEPOSIT_COOLDOWN)

            && (
                // Brand new deposit obviously always active.
                (deposit.lastCooldown <= Config.params.MIN_DEPOSIT_COOLDOWN)
                // Do we not need any more credits?
                || (FlagManager.deepextractFlag && !this.atCreditMax)
            )
        );
    }

	get structureGroups() {
        if (typeof this._structureGroups === "undefined") {
            //this._structureGroups = _.groupBy(this.structuresArray, g => g.structureType);
            this._structureGroups = utils.groupBy(this.structuresArray, 'structureType');
        }
        return this._structureGroups;
	}

    getStructureGroups(structureTypes) {
		let result = [];
		for (let structureType of structureTypes) {
			if (this.structureGroups[structureType]) result = result.length ? result.concat(this.structureGroups[structureType]) : this.structureGroups[structureType];
		}
		return result;
	}

    /**
     * Returns list of controllers that I own. No filters.
     */
	get empireControllers() {
        if (typeof this._empireControllers === "undefined") {
            this._empireControllers = this.empireRooms.map(m => m.controller);
        }
        return this._empireControllers;
    }

    /**
     * Returns the safe mode value for any room we control that is in safemode.
     * Only allowed one safe mode at a time.
     */
    get empireSafeMode() {
        if (typeof this._empireSafeMode === "undefined") {
            let room = this.empireRooms.find(f => f.controller.safeMode);
            this._empireSafeMode = room ? room.controller.safeMode : null;
        }
        return this._empireSafeMode;
    }

    /**
     * My controllers that have spawns, or construction spawns, or colony flags.
     */
	get empireSpawnControllers() {
        if (typeof this._empireSpawnControllers === "undefined") {
            this._empireSpawnControllers = this.empireControllers.filter(f =>
                this.empireSpawnRoomNamesHashFromGameSpawns[f.room.name]
                || (f.room.claimFlag && f.room.colonyFlagAnyColor)
                || f.room.hasMyConstructionSpawns
            );
        }
        return this._empireSpawnControllers;
    }

    /**
     * Spawn controllers in rooms that are not unclaimed.
     */
	get empireSpawnControllersActive() {
        if (typeof this._empireSpawnControllersActive === "undefined") {
            this._empireSpawnControllersActive = this.empireSpawnControllers.filter(f => !f.room.unclaimFlag);
        }
        return this._empireSpawnControllersActive;
    }

	get empireSpawnControllersActiveSorted() {
        if (typeof this._empireSpawnControllersActiveSorted === "undefined") {
            this._empireSpawnControllersActiveSorted = _.sortBy(this.empireSpawnControllersActive, s => -s.room.energyCapacityAvailable);
        }
        return this._empireSpawnControllersActiveSorted;
    }

    get empireSpawnsSpawning() {
        if (typeof this._empireSpawnsSpawning === "undefined") {
            this._empireSpawnsSpawning = this.spawnsArray.filter(f => f.spawning);
        }
        return this._empireSpawnsSpawning;
    }

    get empireHighestControllerRoom() {
        return this.empireSpawnControllersActiveSorted[0].room;
    }

    get empireHighestControllerEnergyCapacityAvailable() {
        return this.empireSpawnControllersActiveSorted[0].room.energyCapacityAvailable;
    }

	get empireNonTempleSpawnRoomsActiveWithTerminals() {
        if (typeof this._empireNonTempleSpawnRoomsActiveWithTerminals === "undefined") {
            this._empireNonTempleSpawnRoomsActiveWithTerminals = this.empireNonTempleSpawnRoomsActive.filter(f => f.myTerminal);
        }
        return this._empireNonTempleSpawnRoomsActiveWithTerminals;
    }

	get empireSpawnRoomsWithTerminals() {
        if (typeof this._empireSpawnRoomsWithTerminals === "undefined") {
            this._empireSpawnRoomsWithTerminals = this.empireSpawnRooms.filter(f => f.myTerminal);
        }
        return this._empireSpawnRoomsWithTerminals;
    }

	get empireTerminals() {
        if (typeof this._empireTerminals === "undefined") {
            this._empireTerminals = this.empireSpawnRoomsWithTerminals.map(m => m.myTerminal);
        }
        return this._empireTerminals;
    }

	get empireNonTempleTerminals() {
        if (typeof this._empireNonTempleTerminals === "undefined") {
            this._empireNonTempleTerminals = this.empireTerminals.filter(m => !m.room.isTemple);
        }
        return this._empireNonTempleTerminals;
    }

	get empireSpawnRoomsWithStorage() {
        if (typeof this._empireSpawnRoomsWithStorage === "undefined") {
            this._empireSpawnRoomsWithStorage = this.empireSpawnRooms.filter(f => f.myStorage);
        }
        return this._empireSpawnRoomsWithStorage;
    }

	get empireStorage() {
        if (typeof this._empireStorage === "undefined") {
            this._empireStorage = this.empireSpawnRoomsWithStorage.map(m => m.myStorage);
        }
        return this._empireStorage;
    }

	get empireNonTempleStorage() {
        if (typeof this._empireNonTempleStorage === "undefined") {
            this._empireNonTempleStorage = this.empireStorage.filter(m => !m.room.isTemple);
        }
        return this._empireNonTempleStorage;
    }

	get empireNonTempleStoresMerged() {
        if (typeof this._empireNonTempleStoresMerged === "undefined") {
            // Do we want to add in storage amounts?
            let stores = this.empireNonTempleTerminals.map(m => m.store).concat(this.empireNonTempleStorage.map(m => m.store));
            this._empireNonTempleStoresMerged = utils.mergeStores(stores);
        }
        return this._empireNonTempleStoresMerged;
    }

	get empireSpawnRoomsActiveWithStorages() {
        if (typeof this._empireSpawnRoomsActiveWithStorages === "undefined") {
            this._empireSpawnRoomsActiveWithStorages = this.empireSpawnRoomsActive.filter(f => f.myStorage);
        }
        return this._empireSpawnRoomsActiveWithStorages;
    }

	get empireHighestStoragePercent() {
        if (typeof this._empireHighestStoragePercent === "undefined") {
            this._empireHighestStoragePercent = Math.max(...this.empireSpawnRoomsActiveWithStorages.map(m => m.storagePercent));
        }
        return this._empireHighestStoragePercent;
    }

	get empireSpawnRoomsWithPowerSpawn() {
        if (typeof this._empireSpawnRoomsWithPowerSpawn === "undefined") {
            this._empireSpawnRoomsWithPowerSpawn = this.empireSpawnRooms.filter(f => f.colonyPowerSpawn);
        }
        return this._empireSpawnRoomsWithPowerSpawn;
    }

	get empirePowerSpawns() {
        if (typeof this._empirePowerSpawns === "undefined") {
            this._empirePowerSpawns = this.empireSpawnRoomsWithPowerSpawn.map(m => m.colonyPowerSpawn);
        }
        return this._empirePowerSpawns;
    }

	get labOutputsArray() {
        if (typeof this._labOutputsArray === "undefined") {
            this._labOutputsArray = this.empireTerminals.map(m => m.room.labOutput).filter(f => f);
        }
        return this._labOutputsArray;
    }

	get labOutputsHash() {
        if (typeof this._labOutputsHash === "undefined") {
            this._labOutputsHash = utils.arrayToHash(this.labOutputsArray);
        }
        return this._labOutputsHash;
    }

	get empireFactories() {
        if (typeof this._empireFactories === "undefined") {
            this._empireFactories = this.empireSpawnRoomsActive.filter(f => f.colonyFactory).map(m => m.colonyFactory);
        }
        return this._empireFactories;
    }

	get empireNukers() {
        if (typeof this._empireNukers === "undefined") {
            this._empireNukers = this.empireSpawnRoomsActive.filter(f => f.colonyNuker).map(m => m.colonyNuker);
        }
        return this._empireNukers;
    }

	get empireObservers() {
        if (typeof this._empireObservers === "undefined") {
            // Observers cost nothing, so pull from active and inactive rooms.
            this._empireObservers = this.empireSpawnRooms.filter(f => f.colonyObserver).map(m => m.colonyObserver);
        }
        return this._empireObservers;
    }

    get empireCenterRoom() {
        if (typeof this._empireCenterRoom === "undefined") {
            this._empireCenterRoom = Cartographer.findCenterRoom(this.empireSpawnRoomNamesActive);
        }
        return this._empireCenterRoom;
    }

    /**
     * Return an array of all the minerals we own.
     */
	get empireMineralTypes() {
        if (typeof this._empireMineralTypes === "undefined") {
            this._empireMineralTypes = utils.unique(this.empireSpawnRoomsActive.map(m => m.mineral.mineralType));
        }
        return this._empireMineralTypes;
    }

    /**
     * Return a hash of all the minerals we own.
     */
	get empireMineralTypesHash() {
        if (typeof this._empireMineralTypesHash === "undefined") {
            this._empireMineralTypesHash = utils.arrayToHash(this.empireMineralTypes);
        }
        return this._empireMineralTypesHash;
    }

    /**
     * The list of minerals that we control and the count of each.
     * Only includes active rooms.
     * Do not have to have a terminal in this room.
     * All (7) of the minerals will be included in the output, even if we don't have them.
     */
	get empireClaimedMinerals() {
        if (typeof this._empireClaimedMinerals === "undefined") {
            let results = {}
            let minerals = this.empireSpawnRoomsActive.map(m => m.mineral.mineralType);

            // Add in minerals that our empire has access to (SK access room in sector).
            minerals = minerals.concat(this.empireCenterRoomMinerals);

            // Add the count of each mineral we have.
            minerals.forEach(mineral => {
                results[mineral] = (results[mineral] || 0) + 1;
            });
            // Add in minerals we may not have as zeros.
            C.TERMINAL_MINERALS_RAW.forEach(raw => {
                results[raw] = (results[raw] || 0);
            })
            this._empireClaimedMinerals = results;
        }
        return this._empireClaimedMinerals;
    }

    get empireCenterRoomMinerals() {
        if (typeof this._empireCenterRoomMinerals === "undefined") {
            this._empireCenterRoomMinerals = Object.keys(this.empireSectors).map(m => this.empireSectors[m].find(f => f.isSKAccessRoom) ? this.getSectorCenterMinerals(m) : []).flatten();
        }
        return this._empireCenterRoomMinerals;
    }

    get unclaimedMinerals() {
        if (typeof this._unclaimedMinerals === "undefined") {
            this._unclaimedMinerals = _.omit(this.empireClaimedMinerals, Object.keys(this.empireClaimedMinerals).filter(f => this.empireClaimedMinerals[f]));
        }
        return this._unclaimedMinerals;
    }

    get empireHasEveryMineral() {
        if (typeof this._empireHasEveryMineral === "undefined") {
            this._empireHasEveryMineral = !Object.keys(this.empireClaimedMinerals).find(f => !this.empireClaimedMinerals[f]);
        }
        return this._empireHasEveryMineral;
    }

    get isEmpireConservingMinerals() {
        if (typeof this._isEmpireConservingMinerals === "undefined") {
            this._isEmpireConservingMinerals = false;

            if (
                // conserveminerals flag must be out.
                FlagManager.conservemineralsFlag
                // Of the 7 raw minerals, do we not have any of them or are any of them below minimum.
                && C.TERMINAL_MINERALS_RAW_BASE.find(f => !this.empireMineralTypesHash[f] || this.empireFungiblesBelowMinSortedHash[f])
            ) {
                this._isEmpireConservingMinerals = true
            }
        }
        return this._isEmpireConservingMinerals;
    }

    // Mineral selection. We want to have one of each mineral.
    // First round is primary is H/O, secondary U/K/L/Z, third is X.
    // Second+ round is H/O/X, secondary U/K/L/Z;
    roomSortMineral(roomName) {
        // Create a scoring mechanism for picking the next room.
        let myColonyCount = this.empireRooms.length;
        let hasEveryMineral = this.empireHasEveryMineral;
        let mineralType = RoomIntel.getMineralType(roomName);
        if (!mineralType) return Config.params.CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING;

        let baseAmount = 0;

        // // Add bonus for rooms with thorium (more density the better).
        // if (FlagManager.season5Flag) {
        //     if ((RoomIntel.getThoriumAmount(roomName) || 0) < MINERAL_DENSITY[1]) return Config.params.CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING
        //     baseAmount -= (RoomIntel.getThoriumDensity(roomName) ** 3);
        // }

        // For the quadrants our empire exists in,  we will need more of those mineral types to run factories.
        let quadrantBonus = this.empireMineralTypesByQuadrantHash[mineralType] ? 2 : 1;

        if (hasEveryMineral) {
            // Once we have every mineral, we want to maintain three H/O and two X for every U/L/K/Z.
            // That gives a set of 12, with a slight bonus to H used for upgrading.
            switch (mineralType) {
                case RESOURCE_HYDROGEN:
                    return baseAmount + Math.floor(this.empireClaimedMinerals[mineralType] / 3) - 1;
                case RESOURCE_OXYGEN:
                    return baseAmount + Math.floor(this.empireClaimedMinerals[mineralType] / 3);
                case RESOURCE_CATALYST:
                    return baseAmount + Math.floor(this.empireClaimedMinerals[mineralType] / 2);

                case RESOURCE_UTRIUM:
                case RESOURCE_LEMERGIUM:
                case RESOURCE_KEANIUM:
                case RESOURCE_ZYNTHIUM:
                    return baseAmount + Math.floor(this.empireClaimedMinerals[mineralType] / quadrantBonus);
            }
        }
        else {
            switch (mineralType) {
                case RESOURCE_HYDROGEN:
                    return baseAmount + (this.empireClaimedMinerals[mineralType] ? myColonyCount : this.empireClaimedMinerals[mineralType] + 0);

                case RESOURCE_OXYGEN:
                    return baseAmount + (this.empireClaimedMinerals[mineralType] ? myColonyCount : this.empireClaimedMinerals[mineralType] + 1);

                case RESOURCE_UTRIUM:
                case RESOURCE_LEMERGIUM:
                case RESOURCE_KEANIUM:
                case RESOURCE_ZYNTHIUM:
                    return baseAmount + (this.empireClaimedMinerals[mineralType] ? myColonyCount : this.empireClaimedMinerals[mineralType] + 3);

                // We don't need catalyst badly until we have all other minerals.
                case RESOURCE_CATALYST:
                    return baseAmount + (this.empireClaimedMinerals[mineralType] ? myColonyCount : this.empireClaimedMinerals[mineralType] + 6);
            }
        }
    }

    // Penalize for every source below max in this room.
    roomSortSources(roomName) {
        return (2 * Config.params.CLAIM_ROOM_FACTOR_SOURCE_COUNT) - (RoomIntel.getSourceCount(roomName) * Config.params.CLAIM_ROOM_FACTOR_SOURCE_COUNT);
    }

    // Penalize for looking outside of sector we are currently in.  The more rooms in a sector the better.
    roomSortSector(roomName) {
        if (FlagManager.onlyclaimedsectorsFlag && !this.empireSectorPercentage[Cartographer.getSector(roomName)]) return Config.params.CLAIM_ROOM_FACTOR_SECTOR_AVOID;
        let score = (10 - Math.ceil((this.empireSectorPercentage[Cartographer.getSector(roomName)] || 0) * 10));
        // If this room is in a completely unclaimed sector, then mark it as not interesting...which isn't a death sentence, but puts it last.
        if (score === 10) return Config.params.CLAIM_ROOM_FACTOR_SECTOR_NOT_INTERESTING;
        // Put a little bit of bias on our bigger claimed sectors to keep everyone together.
        return score * 2;
    }

    // Penalize any distance too close to another room, and also if travelling beyond the standard reserve distance.
    roomSortRouteDistance(roomName) {
        let myClosestRoom = this.getClosestSpawnRoomTo(roomName);
        if (!myClosestRoom) return Infinity;
        let distance = Cartographer.findRouteDistance(myClosestRoom, roomName)
        return distance;
    }

    // Penalize any distance too close to another room, and also if travelling beyond the standard reserve distance.
    roomSortRouteDistancePowerCreepOperateSpawn(roomName) {
        let myClosestRoom = this.getClosestPowerCreepOperateSpawnRoomTo(roomName);
        if (!myClosestRoom) return Infinity;
        let distance = Cartographer.findRouteDistance(myClosestRoom, roomName)
        return distance;
    }

    // More exits are always better for movement and support.
    roomSortExits(roomName) {
        return 4 - Cartographer.describeExitRooms(roomName).length;
    }

    // We would prefer to keep our colony in range of each other for terminal/support purposes.
    roomSortCenterDistance(roomName) {
        return Cartographer.findRoomDistance(this.empireCenterRoom, roomName);
    }

    // If we are right next to a highway or SK room, we get extra points.
    // If it is already owned by another, then we lose ranking. Still possible to "take" tho.
    roomSortType(roomName) {
        // Core access rooms are best!
        if (Cartographer.isCoreAccessRoom(roomName)) return FlagManager.season5Flag ? Config.params.CLAIM_ROOM_FACTOR_TYPE_SEASON : Config.params.CLAIM_ROOM_FACTOR_TYPE_CORE;

        // SK access rooms are really really good, unless already have a spawn room that also has access to this room.
        if (
            Cartographer.isSKAccessRoom(roomName)
            && (this.roomSortRouteDistance(Cartographer.isSKAccessRoom(roomName)) > 1)
        ) return Config.params.CLAIM_ROOM_FACTOR_TYPE_SK;

        // Double highways are a priority.
        if (Cartographer.isDualHighwayAccessRoom(roomName)) return Config.params.CLAIM_ROOM_FACTOR_TYPE_DUAL_HIGHWAY;

        // Not necessisarily a good room, but it has rare mineral, then give it SOME importance instead of burying it.
        // Only applicable if we have less than our average of this mineral already.
        if (
            this.getSectorRareMinerals(roomName).includes(RoomIntel.getMineralType(roomName))
            && ((this.empireClaimedMinerals[RoomIntel.getMineralType(roomName)] || 0) < (this.empireRooms.length / 10))
        ) return Config.params.CLAIM_ROOM_FACTOR_TYPE_RARE_MINERAL;

        // If this room is right next to an existing room, then it is not interesting.
        if (this.roomSortRouteDistance(roomName) <= 1) return Config.params.CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING;

        // All highway access rooms along equator are great!
        if (Cartographer.isEquatorAccessRoom(roomName)) return Config.params.CLAIM_ROOM_FACTOR_TYPE_EQUATOR;

        // General highway access is desirable.
        if (Cartographer.isHighwayAccessRoom(roomName)) return Config.params.CLAIM_ROOM_FACTOR_TYPE_HIGHWAY;

        // If the room is within distance 2 of a powercreep operating a spawn, then it is not interesting.
        if (this.roomSortRouteDistancePowerCreepOperateSpawn(roomName) <= 2) return Config.params.CLAIM_ROOM_FACTOR_TYPE_POWERCREEP;

        // More complicated case now. If the room is a normal controller room and isn't next too one of the types listed above,
        // then give it a good but less significant.
        if (!Cartographer.describeExitRooms(roomName).find(exitRoom => Cartographer.isHighwayAccessRoom(exitRoom) || Cartographer.isSKAccessRoom(exitRoom))) return Config.params.CLAIM_ROOM_FACTOR_TYPE_CONTROLLER;

        // If not a good room, but do not yet posses the mineral in this room, then give it SOME importance instead of burying it.
        if (!this.empireClaimedMinerals[RoomIntel.getMineralType(roomName)]) return Config.params.CLAIM_ROOM_FACTOR_TYPE_UNCLAIMED_MINERAL;

        // While in season, allow any room with thorium to be interesting.
        //if (RoomIntel.getThoriumAmount(roomName)) return Config.params.CLAIM_ROOM_FACTOR_TYPE_UNCLAIMED_MINERAL;

        // Not an interesting room since its adjacent to an interesting room.
        // Its technically possible we will want these rooms if nothing else is around, but highly unlikely.
        return Config.params.CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING;
    }

    get colonyRoomMinSourceCount() {
        if (FlagManager.season5Flag) return 1;
        return 2;
    }

    /**
     * The unsorted list of unclaimed, viable, colony rooms.
     */
    get potentialColonyRooms() {
        if (typeof this._potentialColonyRooms === "undefined") {
            // Create a scoring mechanism for picking the next room.
            const colors = {
                [COLOR_RED]: true
                , [COLOR_PURPLE]: true
                , [COLOR_BLUE]: true
                , [COLOR_CYAN]: true
            }

            // Most have a colony flag up already. Some rooms are marked as nocolony.
            // This will include hostile rooms which we can use for nuking purposes.
            this._potentialColonyRooms = Object.keys(FlagManager.colonyFlags).filter(f =>
                // Placeholder
                true

                // Filter out our existing colonyFlags in rooms we own.
                && !RoomIntel.getMy(f)
                // Has to have an active colony flag.
                && colors[FlagManager.colonyFlags[f].flag.color]
                // And they are not an ally.
                && !PlayerManager.isAlly(RoomIntel.getOwner(f))

                // Also we need to have at least X sources in the room to make it viable from the start.
                && (RoomIntel.getSourceCount(f) >= this.colonyRoomMinSourceCount)

                // Should not be rooms that we already "own" and have unclaimed.
                && !FlagManager.unclaimFlags[f]
                && !FlagManager.avoidFlags[f]
            );
        }
        return this._potentialColonyRooms;
    }

	getSectorMineralHash(roomName) {
        return Cartographer.getSectorRooms(roomName)
            .filter(f =>
                // Include any room that has a colony flag.
                FlagManager.colonyFlags[f]
                // Include temple rooms that we can mine.
                || FlagManager.templeFlags[f]
                // Include all center room minerals which can be harvested.
                || Cartographer.isCenterRoom(f)
            )
            .map(m => RoomIntel.getMineralType(m))
            .reduce((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1, acc), {});
	}

    /**
     * Returns array of the rarest mineral types in the given rooms sector.
     * This includes all rooms in the sector including center rooms.
     */
    getSectorRareMinerals(roomName) {
        let sector = Cartographer.getSector(roomName);
        if (typeof this._getSectorRareMinerals[sector] === "undefined") {
            let mineralHash = this.getSectorMineralHash(sector);
            let rarestMineral = Object.keys(mineralHash).sort((a, b) => mineralHash[a] - mineralHash[b])[0];
            let rarestCount = mineralHash[rarestMineral];
            this._getSectorRareMinerals[sector] = Object.keys(mineralHash).filter(f => mineralHash[f] === rarestCount);
        }
        return this._getSectorRareMinerals[sector];
    }

	getDepositTypeByQuadrant(roomName) {
		const quadrant = Cartographer.getQuadrant(roomName);
		switch (quadrant) {
			case 'NW':
				return RESOURCE_BIOMASS;
			case 'NE':
				return RESOURCE_SILICON;
			case 'SW':
				return RESOURCE_MIST;
			case 'SE':
				return RESOURCE_METAL;
			default:
				return 'error';
		}
	}

	getMineralTypeByQuadrant(roomName) {
		const depositType = this.getDepositTypeByQuadrant(roomName);
		switch (depositType) {
			case RESOURCE_BIOMASS:
				return RESOURCE_LEMERGIUM;
			case RESOURCE_SILICON:
				return RESOURCE_UTRIUM;
			case RESOURCE_MIST:
				return RESOURCE_KEANIUM;
			case RESOURCE_METAL:
				return RESOURCE_ZYNTHIUM;
			default:
				return 'error';
		}
	}

    /**
     * A hash of mineral types needed by our empire to help process deposits in the factory for those quadrants we are likely to be mining.
     */
    get empireMineralTypesByQuadrantHash() {
        if (typeof this._empireMineralTypesByQuadrantHash === "undefined") {
            this._empireMineralTypesByQuadrantHash = utils.arrayToHash(this.empireSectorNames.map(m => this.getMineralTypeByQuadrant(m)));
        }
        return this._empireMineralTypesByQuadrantHash;
    }

    getSectorCenterMinerals(roomName) {
        let sector = Cartographer.getSector(roomName);
        if (typeof this._getSectorCenterMinerals[sector] === "undefined") {
            let rooms = Cartographer.getSectorCenterRooms(sector).filter(f => RoomIntel.getMineralType(f) && !FlagManager.avoidFlags[f]);
            let minerals = rooms.map(m => RoomIntel.getMineralType(m));
            this._getSectorCenterMinerals[sector] = minerals;
        }
        return this._getSectorCenterMinerals[sector];
    }

    claimRoomScore(data) {
        return data.u + data.m + data.t + data.e + data.s + data.d;
    }

    /**
     * Will print out a list of rooms and the data used to determine ranking.
     */
    reportClaimRooms(options) {
        // Don't mess with the original options object.
		let defaults = {
            top: Config.params.CLAIM_ROOM_VISUALIZE_COUNT
			, roomName: undefined
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Rank, Room, Sources, Mineral Type, Mineral Amount, Room Type, Exits, Sector, Distance, Colony Center, Score
        const header = ['rank\troom\tsrc\tres\tmin\ttype\texit\tsect\tdist\tcent\tscore'];
        const lines = Memory.claimRooms.filter(f => f.r === (options.roomName || f.r)).map((data, index) => {
            return [
                index + 1
                , utils.getRoomHTML(data.r)
                , data.u
                , RoomIntel.getMineralType(data.r)
                , data.m
                , data.t
                , data.e
                , data.s
                , data.d
                , data.c
                , this.claimRoomScore(data)
            ].join('\t');
        });
        let output = header.concat(lines.slice(0, options.top));
        console.log(output.join('\n'));
    }

    /**
     * Called from the main game loop periodically to refresh our data.
     */
    updateClaimRoomData(report) {
        // Get the best room to claim, and update its claim flag.
        Memory.claimRooms = _.sortByOrder(this.potentialColonyRooms.map(roomName => { return {
                r: roomName
                , u: this.roomSortSources(roomName)
                , m: this.roomSortMineral(roomName)
                , t: this.roomSortType(roomName)
                , e: this.roomSortExits(roomName)
                , s: this.roomSortSector(roomName)
                , d: this.roomSortRouteDistance(roomName)
                , c: this.roomSortCenterDistance(roomName)
            }})
            , [
                sortScore => this.claimRoomScore(sortScore)
                , sortDistance => sortDistance.d
                , sortCenter => sortCenter.c
            ]
        );
        console.log('📝 updated claim room data; current best room: ' + utils.getRoomHTML(this.getRoomToClaim()));
        if (report) this.reportClaimRooms()
        return true;
    }

    /**
     * Find the first best room to claim from our candidates.
     */
    getRoomToClaim() {
        if (
            // Only care about temples after we have a solid group of rooms going.
            (this.empireRooms.length > Config.params.EMPIRE_GCL_THRESHHOLD)
            // We want to add one for every certain number of colony rooms, so we aren't starved for energy.
            && (this.empireTempleRooms.length < Math.floor(this.empireRooms.length / Config.params.EMPIRE_GCL_THRESHHOLD))
            // Have to make a choice...the best choice at the time, even if we are only temporarily switching out of late game gpl mode.
            && !this.isEmpireObjectiveGpl
        ) {
            // Get the list of good temple rooms that we can claim.
            let templeData = this.templeFlagRooms.filter(f => !RoomIntel.getMy(f));

            // Get the temple closest to all other rooms so energy transfer is lowest.
            if (templeData.length > 0) templeData = _.sortBy(templeData, s => this.roomSortCenterDistance(s));

            // Take the first one.
            if (templeData.length) return templeData[0];
        }

        // Find the best available colony claim room.
        let colonyData = Memory.claimRooms.find(f =>
            // Has to be an unclaimed room (to excluder mine or hostiles)
            !RoomIntel.getOwner(f.r)

            // The score of this room needs to be interesting.
            && (FlagManager.claimnotinterestingFlag || (this.claimRoomScore(f) < Config.params.CLAIM_ROOM_FACTOR_TYPE_NOT_INTERESTING))
        );
        return colonyData ? colonyData.r : null;
    }

    /**
     * Find the first best room to claim from our candidates.
     */
    getClaimRoomToNuke() {
        let data = Memory.claimRooms.find((f, i) =>
            // Top 3 record.
            (i<3)
            // Room is owned by someone else.
            && RoomIntel.getOwnedByOtherPlayer(f.r)
            // And they are not an ally.
            && !PlayerManager.isAlly(RoomIntel.getOwner(f.r))
        );
        return data ? data.r : null;
    }

    /**
     * Find the first best room to claim from our candidates.
     */
    getClaimRoomsToVisualize() {
        let data = Memory.claimRooms.filter(f =>
            true
            // Has to be an unclaimed room (to excluder mine or hostiles)
            //&& !RoomIntel.getOwner(f.r)
        ).map(m => m.r).slice(0, Config.params.CLAIM_ROOM_VISUALIZE_COUNT)
        return data;
    }

    manageClaimFlags(options) {
        // Don't mess with the original options object.
		let defaults = {
            debug: !!FlagManager.debugFlag
        };
		options = _.defaults({}, _.clone(options), defaults);

        // Bail if we have the noautoclaim flag up.
        if (FlagManager.noautoclaimFlag) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: noautoclaim flag present');
            return false;
        }

        // Bail out if empire objective is not gcl.
        if (!this.isEmpireObjectiveGcl) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: isEmpireObjectiveGcl');
            return false;
        }

        // Get the best room to claim, and update its claim flag.
        let roomToClaim = this.getRoomToClaim();
        if (!roomToClaim) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: getRoomToClaim() empty');
            return false;
        }

        // Do we already have a red claim flag for this room?
        // It may take a while to update the roomToClaim cache.
        if (FlagManager.claimFlags[roomToClaim]) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: claim flag already red for', utils.getRoomHTML(roomToClaim));
            return false;
        }

        // Verify our GCL and make sure we can actually claim a new room.
        if (!this.okToClaimRoom) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: okToClaimRoom');
            return false;
        }

        // Are our empire resources at the required levels?
        if (!this.empirePreppedToClaimRoom) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: empirePreppedToClaimRoom');
            return false;
        }

        // Test to see that our red claim flags are not over our current room count.
        // Only flip one red flag at a time in other words.
        if (Object.keys(FlagManager.claimFlags).filter(f => !FlagManager.unclaimFlags[f]).length > this.empireRooms.length) return false;

        // Verify that we have a claim flag in the room.
        // These should be made automatically.
        let claimFlag = FlagManager.claimFlagsAnyColor[roomToClaim];
        if (!claimFlag) {
            if (options.debug) console.log('🐛 manageClaimFlags bailing out: claimFlag not present');
            return false;
        }

        // Update the claim flag to red, and release the hounds!
        console.log('🎉 Auto claiming new room, congratuations !!! ==>', utils.getShardRoomHTML(roomToClaim))
        claimFlag.flag.setColor(COLOR_RED);
        return true;
    }

    /**
     * Is the given room name a potential temple? Only meets the basic requirements of neighboring rooms.
     */
    isPotentialTempleRoom(roomName) {
        return !Cartographer.describeExitRooms(roomName).find(f => !RoomIntel.getMy(f));
    }

    get potentialTempleRooms() {
        if (typeof this._potentialTempleRooms === "undefined") {
            // Default to not found.
            this._potentialTempleRooms = [];

            let roomNames = this.empireSectorNames
                .map(sector => Cartographer.getSectorControllerRooms(sector))
                .flatten()
                .filter(roomName => this.isPotentialTempleRoom(roomName))
                //.map(m => utils.getRoomHTML(m))

            if (roomNames.length) {
                let centerRoom = this.empireCenterRoom;
                this._potentialTempleRooms = _.sortBy(roomNames, s => Cartographer.findRoomDistance(centerRoom, s));
            }
        }
        return this._potentialTempleRooms;
    }

    get templeFlagRooms() {
        if (typeof this._templeFlagRooms === "undefined") {
            this._templeFlagRooms = Object.values(FlagManager.templeFlags).map(m => m.workRoom);
        }
        return this._templeFlagRooms;
    }

    managePowerCreepGolddiggerFlag() {
        // Get the golddigger powercreeps on this shard.
        let golddiggers = this.getGolddiggers();

        // While there may be multiple golddiggers, only assign one at a time (loop will return after 1st is set).
        for (let i=0; i<golddiggers.length; i++) {
            let golddigger = golddiggers[i];

            // Get the room the golddigger is assigned to. Note they may be traveling.
            let room = golddigger.flagRoom && Game.rooms[golddigger.flagRoom];
            if (room && !room.colonyPowerSpawn) room = null;

            // Determine if the golddigger flag should stay in this room.
            // Once placed, it should stay until we have exhausted our minerals.
            if (
                room
                && room.colonyPowerSpawn
                && (
                    // We are mining the current room.
                    (room.mineral && room.mineral.mineralAmount && (room.mineral.mineralAmount < MINERAL_DENSITY[4]))
                    // Or we are assisting a temple room. Maybe just to help out spawning, not necessarily mineral boosting.
                    || this.castleNamesActivelyAssistingTempleHash[room.name]
                )
                // We are assisting a temple room or we can't find a temple room assisting castle that doesn't have a powercreep already.
                && (
                    this.castleNamesActivelyAssistingTempleHash[room.name]
                    || !this.castleNamesActivelyAssistingTempleWithoutPowercreep
                )
            ) {
                room.logRoom('golddigger flag holding in room ' + utils.getRoomHTML(room.name));
                continue;
            }

            // If we don't have a room specified, then just start with the first room in our spawn list.
            if (!room) room = this.empireCastleRooms.find(f => !f.powerCreep && f.colonyPowerSpawn);

            // Since we aren't staying here, determine if there is another room to move our flag to.
            // Likely yes there will be, but if not then just stay here.
            // Looking in the set of castle rooms that don't have powercreeps already trying to find the first best active mineral mine.
            let newMineralRoomName = this.castleNamesActivelyAssistingTempleWithoutPowercreep;
            if (!newMineralRoomName && room) {
                newMineralRoomName = this.getClosestCastleRoomForGolddigger(room.name);
            }
            // In the event we actually don't need ANY golddigger, just stay with our default room for now.
            if (!newMineralRoomName && room) {
                newMineralRoomName = room.name;
            }

            // Create/update the new flag location, if we need to.
            let newMineralRoom = newMineralRoomName && Game.rooms[newMineralRoomName];
            if (newMineralRoom && ((newMineralRoomName !== room.name) || !room.powerCreep)) {
                let pos = new RoomPosition(newMineralRoom.mineral.pos.x, newMineralRoom.mineral.pos.y - 2, newMineralRoomName);
                newMineralRoom.logRoom('updating golddigger flag to ' + utils.getRoomHTML(pos.roomName));
                if (golddigger.flag) {
                    return golddigger.flag.setPosition(pos);
                }
                else  {
                    return newMineralRoom.createFlag(pos, 'powercreep ' + golddigger.name, COLOR_RED);
                }

            }
        }

        // Nothing changed, bail out.
        return false;
    }

    manageUnclaimFlags() {
        // Cycle thru all our rooms and determine if they should be unclaimed.
        //let rooms = this.empireRooms;

        // for (let i=0; i<rooms.length; i++) {
        //     let room = rooms[i];

            // // Only applies to season 5 for now.
            // if (FlagManager.season5Flag) {
            //     // We want to retain SK access rooms forever to protect the reactor and mine minerals.
            //     if (room.isSKAccessRoom) continue;

            //     // If we already have a spare room, then keep building up this one.
            //     // We only need have one room building at a time, hopefully supported by other max level rooms.
            //     //if (rooms.length <= Game.gcl.level - 1) continue;

            //     // In season 5, once a room is out of thorium, and nothing is left in the terminal, it is useless to us.
            //     if (
            //         !RoomIntel.getThoriumAmount(room.name)
            //         && room.myTerminal
            //         && !room.myTerminal.store.getUsedCapacity(C.RESOURCE_THORIUM)
            //         && !CreepManager.getMinersByFocusId(RoomIntel.getThoriumId(room.name)).length

            //         // Mine the mineral from this room before unclaiming.
            //         && !RoomIntel.getMineralAmount(room.name)
            //     ) {
            //         let pos = new RoomPosition(room.controller.pos.x, room.controller.pos.y - 4, room.name);
            //         let result = room.createFlag(pos, 'unclaim ' + room.name, COLOR_RED)
            //         if (result === OK) {
            //             room.logRoom('setting unclaim flag');
            //             break;
            //         }
            //     }
            // }
        //}

        // Nothing to do.
        return true;
    }

    get empireHasCastleRoomBelowStorageEnergyDump() {
        if (typeof this._empireHasCastleRoomBelowStorageEnergyDump === "undefined") {
            this._empireHasCastleRoomBelowStorageEnergyDump = !!(
                this.empireCastleRooms.find(f => !f.isStorageEnergyDump)
            );
        }
        return this._empireHasCastleRoomBelowStorageEnergyDump;
    }

    /**
     * The amount of energy over normal for the entire empire is more than the boosted upgrade cost of a controller to level 8.
     */
    get empireEnergyAtClaimRoomLevel() {
        if (typeof this._empireEnergyAtClaimRoomLevel === "undefined") {
            this._empireEnergyAtClaimRoomLevel = (
                (this.empireEnergyOverNormal > (C.CONTROLLER_LEVELS_SUM / (UPGRADE_CONTROLLER_POWER * C.MAX_BOOST_UPGRADECONTROLLER)))
                || !this.empireHasCastleRoomBelowStorageEnergyDump
            );
        }
        return this._empireEnergyAtClaimRoomLevel;
    }

    /**
     * The amount of energy over normal for the entire empire is more than the boosted upgrade cost of a controller to level 8 times number of temples we would be running.
     */
    get empireEnergyAtTempleRoomLevel() {
        if (typeof this._empireEnergyAtTempleRoomLevel === "undefined") {
            this._empireEnergyAtTempleRoomLevel = (
                (this.empireEnergyOverNormal > (C.CONTROLLER_LEVELS_SUM / (UPGRADE_CONTROLLER_POWER * C.MAX_BOOST_UPGRADECONTROLLER))  * this.empireTempleRooms.length)
                || !this.empireHasCastleRoomBelowStorageEnergyDump
            );
        }
        return this._empireEnergyAtTempleRoomLevel;
    }

    get empirePreppedToClaimRoom() {
        if (typeof this._empirePreppedToClaimRoom === "undefined") {
            this._empirePreppedToClaimRoom = (
                // If we don't have any castle rooms, then a respawn is likely happening.
                // Allow new rooms to be taken even at low levels.
                (this.empireCastleRooms.length < Config.params.EMPIRE_GCL_THRESHHOLD)

                // Normal case for mature empires.
                || (
                    // Placeholder.
                    true

                    // Do we have enough credits to buy mats for boosted  upgraders that can build controller to level 8.
                    && this.atCreditTargetForNewRoom

                    // The amount of energy over normal for the entire empire is more than the boosted upgrade cost of a controller to level 8.
                    && this.empireEnergyAtClaimRoomLevel

                    // We have target level of upgrade controller boosts.
                    && !this.empireUpgradeControllerBoostBelowStorageMinSortedArray.length

                    // No other rooms are leveling up or need focused attention.
                    && !this.empireFocusRooms.length
                )
            );
        }
        return this._empirePreppedToClaimRoom;
    }

    /**
     * Temples are prepped when we are done processing power. Aka run out of power.
     * See: prototype.room.isTempleNotPreppedToRecycleReasons
     */
    get empirePreppedForTempleRoom() {
        if (typeof this._empirePreppedForTempleRoom === "undefined") {
            this._empirePreppedForTempleRoom = !!(
                // Placeholder.
                true

                // No temple flag means do nothing.
                && !FlagManager.notempleFlag

                // Do not cycle temple while we have free GCL's as resources should be used for building new rooms.
                && !this.isGclAvailable

                // Is the empire objective to increase gcl?
                && this.isEmpireObjectiveGcl

                // No other rooms are leveling up or need focused attention.
                && !this.empireFocusRooms.length

                // The amount of energy over normal for the entire empire is more than the boosted upgrade cost of a controller to level 8.
                && this.empireEnergyAtTempleRoomLevel

                // We have target level of upgrade controller boosts.
                && !this.empireUpgradeControllerBoostBelowStorageMinSortedArray.length

                // We have target level of minerals saved up.
                && !this.empireMineralRawTypesBelowStorageMinSortedArray.length
            );
        }
        return this._empirePreppedForTempleRoom;
    }

    // Hash version of empireReservedRoomsHash
    get empireReservedRoomsHash() {
        return Memory.reservedRooms || {};
    }

    // Array version of empireReservedRoomsHash
    get empireReservedRoomsArray() {
        return Object.keys(Memory.reservedRooms || {});
    }

    get empireManagementRoomNames() {
        if (typeof this._empireManagementRoomNames === "undefined") {
            // Get a list of rooms directly under my management.

            // TODO: Appears to be a performance hit here between these two statements.
            // Looking at myManagement is correct, as it picks up reserved flag rooms, however this.roomsArray skips reserved rooms that we can't see.
            // empireRooms is not fully correct as it only picks up owned and claimed rooms.
            let rooms = this.empireRooms.map(m => m.name);

            // Also need rooms that are reserved by us but not currently reserved by us.
            rooms = rooms.concat(this.empireReservedRoomsArray);

            // Finally get a distinct list of rooms from what we have in our array.
            this._empireManagementRoomNames = utils.unique(rooms);
        }
        return this._empireManagementRoomNames;
    }

    get empireManagementRoomNamesHash() {
        if (typeof this._empireManagementRoomNamesHash === "undefined") {
            // Reduce the array into a hash for better performance.
            this._empireManagementRoomNamesHash = this.empireManagementRoomNames.reduce((map, obj) => (map[obj] = obj, map), {});
        }
        return this._empireManagementRoomNamesHash;
    }

    get empireNonClaimRooms() {
        if (typeof this._empireNonClaimRooms === "undefined") {
            this._empireNonClaimRooms = this.empireRooms.filter(f => !f.claimFlag);
        }
        return this._empireNonClaimRooms;
    }

    get empireNonClaimRoomNames() {
        if (typeof this._empireNonClaimRoomNames === "undefined") {
            this._empireNonClaimRoomNames = this.empireNonClaimRooms.map(m => m.name);
        }
        return this._empireNonClaimRoomNames;
    }

    get empireSpawnRooms() {
        if (typeof this._empireSpawnRooms === "undefined") {
            this._empireSpawnRooms = this.empireSpawnControllers.map(m => m.room);
        }
        return this._empireSpawnRooms;
    }

    get empireSpawnRoomsActive() {
        if (typeof this._empireSpawnRoomsActive === "undefined") {
            this._empireSpawnRoomsActive = this.empireSpawnControllersActive.map(m => m.room);
        }
        return this._empireSpawnRoomsActive;
    }

    get empireNonTempleSpawnRoomsActive() {
        if (typeof this._empireNonTempleSpawnRoomsActive === "undefined") {
            this._empireNonTempleSpawnRoomsActive = this.empireSpawnRoomsActive.filter(f => !f.isTemple);
        }
        return this._empireNonTempleSpawnRoomsActive;
    }

	get empireFocusRooms() {
        if (typeof this._empireFocusRooms === "undefined") {
            this._empireFocusRooms = this.empireSpawnRoomsActive.filter(f => f.hasFocus);
        }
        return this._empireFocusRooms;
	}

	get empireTempleRooms() {
        if (typeof this._empireTempleRooms === "undefined") {
            this._empireTempleRooms = this.empireSpawnRoomsActive.filter(f => f.isTemple);
        }
        return this._empireTempleRooms;
	}

	get empireTempleRoomNames() {
        if (typeof this._empireTempleRoomNames === "undefined") {
            this._empireTempleRoomNames = this.empireTempleRooms.map(m => m.name);;
        }
        return this._empireTempleRoomNames;
	}

    get empireTempleRoomNamesHash() {
        if (typeof this._empireTempleRoomNamesHash === "undefined") {
            this._empireTempleRoomNamesHash = utils.arrayToHash(this.empireTempleRoomNames);
        }
        return this._empireTempleRoomNamesHash;
    }

	get empireNonMaxTempleRooms() {
        if (typeof this._empireNonMaxTempleRooms === "undefined") {
            this._empireNonMaxTempleRooms = this.empireTempleRooms.filter(f => !f.atMaxLevel);
        }
        return this._empireNonMaxTempleRooms;
	}

	get empireNonMaxTempleRoomNames() {
        if (typeof this._empireNonMaxTempleRoomNames === "undefined") {
            this._empireNonMaxTempleRoomNames = this.empireNonMaxTempleRooms.map(m => m.name);
        }
        return this._empireNonMaxTempleRoomNames;
	}

    get empireSpawnRoomNames() {
        if (typeof this._empireSpawnRoomNames === "undefined") {
            this._empireSpawnRoomNames = this.empireSpawnRoomsActive.map(m => m.name);
        }
        return this._empireSpawnRoomNames;
    }

    get empireSpawnRoomNamesHash() {
        if (typeof this._empireSpawnRoomNamesHash === "undefined") {
            this._empireSpawnRoomNamesHash = utils.arrayToHash(this.empireSpawnRoomNames);
        }
        return this._empireSpawnRoomNamesHash;
    }

    get empireSpawnRoomNamesActive() {
        if (typeof this._empireSpawnRoomNamesActive === "undefined") {
            this._empireSpawnRoomNamesActive = this.empireSpawnRoomsActive.map(m => m.name);
        }
        return this._empireSpawnRoomNamesActive;
    }

    get empirePowerCreepOperateSpawnRoomNames() {
        if (typeof this._empirePowerCreepOperateSpawnRoomNames === "undefined") {
            this._empirePowerCreepOperateSpawnRoomNames = this.empireSpawnRoomsActive.filter(f => f.operateSpawnLevel).map(m => m.name);
        }
        return this._empirePowerCreepOperateSpawnRoomNames;
    }

    get empireCastleRooms() {
        if (typeof this._empireCastleRooms === "undefined") {
            this._empireCastleRooms = this.empireSpawnRoomsActive.filter(f => f.isCastle);
        }
        return this._empireCastleRooms;
    }

    get empireCastleRoomNames() {
        if (typeof this._empireCastleRoomNames === "undefined") {
            this._empireCastleRoomNames = this.empireCastleRooms.map(m => m.name);
        }
        return this._empireCastleRoomNames;
    }

    getClosestCastleRoomsTo(other) {
        if (!this._getClosestCastleRoomsTo[other]) {
            this._getClosestCastleRoomsTo[other] = Cartographer.findClosestRoomsByDistance(other, this.empireCastleRoomNames);
        }
        return this._getClosestCastleRoomsTo[other];
    }

    getClosestCastleRoomTo(other) {
        if (!this._getClosestCastleRoomTo[other]) {
            // Return the first room in the closest room list.
            this._getClosestCastleRoomTo[other] = this.getClosestCastleRoomsTo(other).find(x => x !== undefined);
        }
        return this._getClosestCastleRoomTo[other];
    }

    isClosestCastleRoomTo(origin, other) {
        // If we are the same distance as the min, then we are closest to.
        let closestRooms = this.getClosestCastleRoomsTo(other);
        return (origin !== other) && closestRooms.includes(origin);
    }

    isOnlyClosestCastleRoomTo(origin, other) {
        // If we are the same distance as the min, then we are closest to.
        let closestRooms = this.getClosestCastleRoomsTo(other);
        return (origin !== other) && (closestRooms.length === 1) && closestRooms.includes(origin);
    }

    get empireNonTempleTerminalRoomNames() {
        if (typeof this._empireNonTempleTerminalRoomNames === "undefined") {
            this._empireNonTempleTerminalRoomNames = this.empireNonTempleTerminals.map(m => m.room.name);
        }
        return this._empireNonTempleTerminalRoomNames;
    }

    getClosestNonTempleTerminalRoomNamesTo(other) {
        if (typeof this._getClosestNonTempleTerminalRoomNamesTo[other] === "undefined") {
            this._getClosestNonTempleTerminalRoomNamesTo[other] = Cartographer.findClosestRoomsByDistance(other, this.empireNonTempleTerminalRoomNames);
        }
        return this._getClosestNonTempleTerminalRoomNamesTo[other];
    }

    getClosestNonTempleTerminalRoomNameTo(other) {
        if (typeof this._getClosestNonTempleTerminalRoomNameTo[other] === "undefined") {
            // Return the first room in the closest room list.
            this._getClosestNonTempleTerminalRoomNameTo[other] = this.getClosestNonTempleTerminalRoomNamesTo(other).find(x => x !== undefined);
        }
        return this._getClosestNonTempleTerminalRoomNameTo[other];
    }

    getClosestSpawnRoomsTo(other, excludeRoomName) {
        let spawnRoomNames = this.empireSpawnRoomNamesActive;
        if (excludeRoomName) spawnRoomNames = spawnRoomNames.filter(f => f !== excludeRoomName);
        return Cartographer.findClosestRoomsByDistance(other, spawnRoomNames);
    }
    getClosestSpawnRoomTo(other, excludeRoomName) {
        return this.getClosestSpawnRoomsTo(other, excludeRoomName).find(x => x !== undefined);
    }

    getClosestChurchRoomsTo(other, excludeRoomName) {
        let spawnRoomNames = this.empireSpawnRoomNamesActive.filter(f => Game.rooms[f].isChurch);
        if (excludeRoomName) spawnRoomNames = spawnRoomNames.filter(f => f !== excludeRoomName);
        return Cartographer.findClosestRoomsByDistance(other, spawnRoomNames);
    }
    getClosestChurchRoomTo(other, excludeRoomName) {
        return this.getClosestChurchRoomsTo(other, excludeRoomName).find(x => x !== undefined);
    }

    getClosestPowerCreepOperateSpawnRoomsTo(other) {
        if (typeof this._getClosestPowerCreepOperateSpawnRoomsTo[other] === "undefined") {
            this._getClosestPowerCreepOperateSpawnRoomsTo[other] = Cartographer.findClosestRoomsByDistance(other, this.empirePowerCreepOperateSpawnRoomNames);
        }
        return this._getClosestPowerCreepOperateSpawnRoomsTo[other];
    }

    getClosestPowerCreepOperateSpawnRoomTo(other) {
        if (typeof this._getClosestPowerCreepOperateSpawnRoomTo[other] === "undefined") {
            // Return the first room in the closest room list.
            this._getClosestPowerCreepOperateSpawnRoomTo[other] = this.getClosestPowerCreepOperateSpawnRoomsTo(other).find(x => x !== undefined);
        }
        return this._getClosestPowerCreepOperateSpawnRoomTo[other];
    }

    getClosestCastleRoomForGolddigger(origin) {
        if (typeof this._getClosestCastleRoomForGolddigger[origin] === "undefined") {
            let closestMineralRoomName = null;
            this.empireFungiblesBelowMinSortedArray.some(mineralType => {
                let mineralRoomNames = this.empireCastleRoomNames.filter(f =>
                    // Obviously the same mineral.
                    (mineralType === RoomIntel.getMineralType(f))
                    // Has to have some amount of mineral to renew.
                    && RoomIntel.getMineralAmount(f)
                    // But don't bother if its already at maximum.
                    && (RoomIntel.getMineralAmount(f) < MINERAL_DENSITY[4])
                    // Has to be an SK access room.
                    //&& Cartographer.isSKAccessRoom(f)
                    // Can't have another powercreep in this room.
                    && !FlagManager.powercreepFlags[f]
                );
                closestMineralRoomName = Cartographer.findClosestRoomsByDistance(origin, mineralRoomNames).find(x => x !== undefined);
                if (closestMineralRoomName) return true;
                return false;
            })
            this._getClosestCastleRoomForGolddigger[origin] = closestMineralRoomName;
        }
        return this._getClosestCastleRoomForGolddigger[origin];
    }

    /**
     * Note we are getting the closest route but returning basic range value.
     */
    getRangeToClosestSpawnRoomTo(other) {
        let closestRoom = this.getClosestSpawnRoomTo(other);
        return Cartographer.findRoomRange(other, closestRoom);
    }

    /**
     * Return an array of every castle room that is associated with a temple.
     */
    get castleNamesActivelyAssistingTemple() {
        if (typeof this._castleNamesActivelyAssistingTemple === "undefined") {
            this._castleNamesActivelyAssistingTemple = utils.unique(this.empireNonMaxTempleRoomNames.map(m => Cartographer.describeExitRooms(m).filter(f => Game.rooms[f] && Game.rooms[f].isCastle)).flatten());
        }
        return this._castleNamesActivelyAssistingTemple;
    }

    /**
     * Return a hash of every castle room that is associated with a temple.
     */
    get castleNamesActivelyAssistingTempleHash() {
        if (typeof this._castleNamesActivelyAssistingTempleHash === "undefined") {
            // let templeRoomNames = this.empireNonMaxTempleRoomNames;
            // this._castleNamesActivelyAssistingTempleHash = templeRoomNames.reduce((hash, roomName) => (hash[this.getClosestCastleRoomTo(roomName) || roomName] = roomName, hash), {});
            this._castleNamesActivelyAssistingTempleHash = utils.arrayToHash(this.castleNamesActivelyAssistingTemple);
        }
        return this._castleNamesActivelyAssistingTempleHash;
    }

    get castleNamesActivelyAssistingTempleWithoutPowercreep() {
        if (typeof this._castleNamesActivelyAssistingTempleWithoutPowercreep === "undefined") {
            this._castleNamesActivelyAssistingTempleWithoutPowercreep = this.castleNamesActivelyAssistingTemple.find(f => !FlagManager.powercreepFlags[f]) || null;
        }
        return this._castleNamesActivelyAssistingTempleWithoutPowercreep;
    }

    /**
     * This method will return best estimate of rooms with screeps in them, including TTL logic.
     */
    get screepsRoomNames() {
        if (typeof this._screepRoomNames === "undefined") {
            this._screepRoomNames = Object.keys(RoomIntel.getScreepsData());
        }
        return this._screepRoomNames;
    }

    get screepRoomNamesHash() {
        if (typeof this._screepRoomNamesHash === "undefined") {
            this._screepRoomNamesHash = utils.arrayToHash(this.screepsRoomNames);
        }
        return this._screepRoomNamesHash;
    }

    /**
     * This method will return best estimate of rooms with screeps with carry in them, including TTL logic.
     */
    get screepsWithCarryRoomNames() {
        if (typeof this._screepsWithCarryRoomNames === "undefined") {
            this._screepsWithCarryRoomNames = Object.keys(RoomIntel.getScreepsData()).filter(f => RoomIntel.getScreepsWithCarryTTL(f));
        }
        return this._screepsWithCarryRoomNames;
    }

    get screepsWithCarryRoomNamesHash() {
        if (typeof this._screepsWithCarryRoomNamesHash === "undefined") {
            this._screepsWithCarryRoomNamesHash = utils.arrayToHash(this.screepsWithCarryRoomNames);
        }
        return this._screepsWithCarryRoomNamesHash;
    }

    /**
     * This method will return best estimate of rooms with screeps in them, including TTL logic.
     * Also includes highway rooms next to these rooms.
     * This is a sorted list, with rooms with known screeps with carry in them. Use .find to find first best match.
     */
    get screepsAdjacentHighwayRoomNames() {
        if (typeof this._screepsAdjacentHighwayRoomNames === "undefined") {
            this._screepsAdjacentHighwayRoomNames = _.sortBy(utils.unique(this.screepsRoomNames.map(m => Cartographer.getRoomsInDistance(m, 1).filter(f => Cartographer.isHighwayRoom(f))).flatten()), s => this.screepsWithCarryRoomNamesHash[s] ? 0 : 1);
        }
        return this._screepsAdjacentHighwayRoomNames;
    }

    /**
     * Return the list of all rooms under our management that need defenders.
     * Includes spawn rooms and reserved rooms.
     */
    get empireDefendRooms() {
        if (typeof this._empireDefendRooms === "undefined") {
            this._empireDefendRooms = [];

            // For all our spawn rooms (active and inactive), determine if we need defenders in them.
            this.empireSpawnRooms.forEach(room => {
                if (room.colonyDefendRooms.length) this._empireDefendRooms = this._empireDefendRooms.concat(room.colonyDefendRooms);
            })

            // Add in rooms that we have dangerous players in.
            if (this.empireManagementRoomNamesWithDangerousPlayerHostiles.length) this._empireDefendRooms = this._empireDefendRooms.concat(this.empireManagementRoomNamesWithDangerousPlayerHostiles);

            // Add in highway rooms with screeps in them for the loot.
            if (this.screepsWithCarryRoomNames.length) this._empireDefendRooms = this._empireDefendRooms.concat(this.screepsWithCarryRoomNames);

            // Remove duplicate names.
            this._empireDefendRooms = utils.unique(this._empireDefendRooms);
        }
        return this._empireDefendRooms;
    }

    get myReservedRoomNamesWithNoVisibility() {
        if (typeof this._myReservedRoomNamesWithNoVisibility === "undefined") {
            // Filter on my property rooms.
            this._myReservedRoomNamesWithNoVisibility = this.empireReservedRoomsArray.filter(f =>
                // And we don't have any creeps in the rooms.
                !CreepManager.getCreepsByCurrentRoom(f).length
                // And we don't have any structures in the room that would grant us visibility.
                //&& (!Game.rooms[f].controller || Game.rooms[f].controller.my)
            );
        }
        return this._myReservedRoomNamesWithNoVisibility;
    }

    get empireManagementRoomNamesWithDangerousPlayerHostiles() {
        if (typeof this._empireManagementRoomNamesWithDangerousPlayerHostiles === "undefined") {
            // Filter on my property rooms.
            this._empireManagementRoomNamesWithDangerousPlayerHostiles = this.empireManagementRoomNames.filter(f =>
                //Game.rooms[f]
                //&& !Game.rooms[f].safeMode
                //&& Game.rooms[f].dangerousPlayerHostiles.length
                RoomIntel.getDangerousPlayerHostilesTTL(f)
            );
        }
        return this._empireManagementRoomNamesWithDangerousPlayerHostiles;
    }

    get myReservedRoomNamesWithDangerousHostiles() {
        if (typeof this._myReservedRoomNamesWithDangerousHostiles === "undefined") {
            // Filter on my property rooms.
            this._myReservedRoomNamesWithDangerousHostiles = this.empireReservedRoomsArray.filter(f =>
                RoomIntel.getDangerousHostilesTTL(f)
            );
        }
        return this._myReservedRoomNamesWithDangerousHostiles;
    }

    get myReservedRoomNamesWithDangerousHostiles() {
        if (typeof this._myReservedRoomNamesWithDangerousHostiles === "undefined") {
            // Filter on my property rooms.
            this._myReservedRoomNamesWithDangerousHostiles = this.empireReservedRoomsArray.filter(f =>
                RoomIntel.getDangerousHostilesTTL(f)
            );
        }
        return this._myReservedRoomNamesWithDangerousHostiles;
    }

    get haveAllMineralTerminals() {
        if (typeof this._haveAllMineralTerminals === "undefined") {
            this._haveAllMineralTerminals = !C.TERMINAL_MINERALS_RAW.find(f => !this.empireMineralTypesHash[f]);
        }
        return this._haveAllMineralTerminals;
    }

    get haveAllBaseMineralTerminals() {
        if (typeof this._haveAllBaseMineralTerminals === "undefined") {
            this._haveAllBaseMineralTerminals = !C.TERMINAL_MINERALS_RAW_BASE.find(f => !this.empireMineralTypesHash[f]);
        }
        return this._haveAllBaseMineralTerminals;
    }

    /**
     * For all terminals in the empire, return the resource compounds whose average is below the amount specified.
     */
    empireTypesBelowAmountSorted(types, amount) {
        // Get a master hash of all our terminal contents summed up.
        let data = this.empireNonTempleStoresMerged;
        let maxAmount = amount * this.empireNonTempleTerminals.length;

        // Find the resources that we have less than the maxium amount for all our stores, including zero amounts.
        data = _.pick(data, types.filter(f => (data[f] || 0) < maxAmount))

        // Create an array of objects that we can sort on.
        let sortedData = Object.keys(data).map(m => ({ resourceType: m, amount: data[m] }))

        // Sort the list by amount.
        sortedData = sortedData.sort((a, b) => a.amount - b.amount);

        // Add a rank to the sorted list.
        // Add 1 so that the first index isn't a zero.
        sortedData = sortedData.map((m, i) => ({...m, rank: i + 1}));

        // Convert array into a hash indexed by resource type.
        sortedData = sortedData.reduce((map, obj) => (map[obj.resourceType] = obj.rank, map), {});
        return sortedData;
	}

    get storeFungibleMin() {
        return Config.params.STORAGE_STORE_TARGET + Config.params.TERMINAL_STORE_TARGET;
    }

    /**
     * Returns a hash of all resource types keys/rank values that are below maximum, sorted in order of the amount the empire has.
     */
    get empireFungiblesBelowMinSortedHash() {
        if (typeof this._empireFungiblesBelowMinSortedHash === "undefined") {
            this._empireFungiblesBelowMinSortedHash = this.empireTypesBelowAmountSorted(C.TERMINAL_FUNGIBLES, this.storeFungibleMin);
        }
        return this._empireFungiblesBelowMinSortedHash;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are below maximum, sorted in order of the amount the empire has.
     */
    get empireFungiblesBelowMinSortedArray() {
        if (typeof this._empireFungiblesBelowMinSortedArray === "undefined") {
            this._empireFungiblesBelowMinSortedArray = Object.keys(this.empireFungiblesBelowMinSortedHash);
        }
        return this._empireFungiblesBelowMinSortedArray;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are below maximum, sorted in order of the amount the empire has.
     */
    get empireResourceTypesBelowMaxSortedHash() {
        if (typeof this._empireResourceTypesBelowMaxSortedHash === "undefined") {
            this._empireResourceTypesBelowMaxSortedHash = this.empireTypesBelowAmountSorted(RESOURCES_ALL, Config.params.TERMINAL_STORE_MAX);
        }
        return this._empireResourceTypesBelowMaxSortedHash;
	}

    /**
     * Returns an array of all resource types keys/rank values that are below maximum, sorted in order of the amount the empire has.
     */
    get empireResourceTypesBelowMaxSortedArray() {
        if (typeof this._empireResourceTypesBelowMaxSortedArray === "undefined") {
            this._empireResourceTypesBelowMaxSortedArray = Object.keys(this.empireResourceTypesBelowMaxSortedHash);
        }
        return this._empireResourceTypesBelowMaxSortedArray;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are below target, sorted in order of the amount the empire has.
     */
    get empireResourceTypeBelowTargetSortedHash() {
        if (typeof this._empireResourceTypeBelowTargetSortedHash === "undefined") {
            this._empireResourceTypeBelowTargetSortedHash = this.empireTypesBelowAmountSorted(RESOURCES_ALL, Config.params.TERMINAL_STORE_TARGET);
        }
        return this._empireResourceTypeBelowTargetSortedHash;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are below maximum, sorted in order of the amount the empire has.
     */
    get empireResourceTypeBelowTargetSortedArray() {
        if (typeof this._empireResourceTypeBelowTargetSortedArray === "undefined") {
            this._empireResourceTypeBelowTargetSortedArray = Object.keys(this.empireResourceTypeBelowTargetSortedHash);
        }
        return this._empireResourceTypeBelowTargetSortedArray;
	}

    /**
     * Returns a hash of all boost upgrade controller types keys/rank values that are below target, sorted in order of the amount the empire has.
     */
    get empireUpgradeControllerBoostBelowStorageMinSortedHash() {
        if (typeof this._empireUpgradeControllerBoostBelowStorageMinSortedHash === "undefined") {
            this._empireUpgradeControllerBoostBelowStorageMinSortedHash = this.empireTypesBelowAmountSorted(C.TERMINAL_BOOSTS_UPGRADE_CONTROLLER, Config.params.STORAGE_STORE_TARGET + Config.params.TERMINAL_STORE_TARGET);
        }
        return this._empireUpgradeControllerBoostBelowStorageMinSortedHash;
	}

    /**
     * Returns an array of all resource types keys/rank values that are below target, sorted in order of the amount the empire has.
     */
    get empireUpgradeControllerBoostBelowStorageMinSortedArray() {
        if (typeof this._empireUpgradeControllerBoostBelowStorageMinSortedArray === "undefined") {
            this._empireUpgradeControllerBoostBelowStorageMinSortedArray = Object.keys(this.empireUpgradeControllerBoostBelowStorageMinSortedHash);
        }
        return this._empireUpgradeControllerBoostBelowStorageMinSortedArray;
	}

    /**
     * Returns a hash of all boost upgrade controller types keys/rank values that are below target, sorted in order of the amount the empire has.
     */
    get empireMineralRawTypesBelowStorageMinSortedHash() {
        if (typeof this._empireMineralRawTypesBelowStorageMinSortedHash === "undefined") {
            this._empireMineralRawTypesBelowStorageMinSortedHash = this.empireTypesBelowAmountSorted(C.TERMINAL_MINERALS_RAW, Config.params.STORAGE_STORE_TARGET + Config.params.TERMINAL_STORE_TARGET);
        }
        return this._empireMineralRawTypesBelowStorageMinSortedHash;
	}

    /**
     * Returns an array of all resource types keys/rank values that are below target, sorted in order of the amount the empire has.
     */
    get empireMineralRawTypesBelowStorageMinSortedArray() {
        if (typeof this._empireMineralRawTypesBelowStorageMinSortedArray === "undefined") {
            this._empireMineralRawTypesBelowStorageMinSortedArray = Object.keys(this.empireMineralRawTypesBelowStorageMinSortedHash);
        }
        return this._empireMineralRawTypesBelowStorageMinSortedArray;
	}

    /**
     * For all terminals in the empire, return the resource compounds that are over the target.
     * The amount returned is the amount over the max, and is safe to sell.
     */
    empireTypesAboveAmountSorted(types, amount) {
        // Get a master hash of all our terminal contents summed up.
        let data = this.empireNonTempleStoresMerged;
        let targetAmount = amount * this.empireTerminals.length;

        // Find the resources that we have less than the maxium amount for all our stores, including zero amounts.
        data = _.pick(data, types.filter(f => (data[f] || 0) > targetAmount))

        // Create an array of objects that we can sort on.
        let sortedData = Object.keys(data).map(m => ({ resourceType: m, amount: data[m] - targetAmount }))

        // Sort the list by amount.
        sortedData = sortedData.sort((a, b) => a.amount - b.amount);

        // Convert array into a hash indexed by resource type.
        sortedData = sortedData.reduce((map, obj) => (map[obj.resourceType] = obj.amount, map), {});
        return sortedData;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are above maximum, sorted in order of the amount the empire has.
     */
    get empireResourceTypeAboveMaxSorted() {
        if (typeof this._empireResourceTypeAboveMaxSorted === "undefined") {
            this._empireResourceTypeAboveMaxSorted = this.empireTypesAboveAmountSorted(C.TERMINAL_MINERALS_TARGET, Config.params.TERMINAL_STORE_MAX);
        }
        return this._empireResourceTypeAboveMaxSorted;
	}

    /**
     * Returns a hash of all resource types keys/rank values that are above target, sorted in order of the amount the empire has.
     */
    get empireResourceTypeAboveTargetSorted() {
        if (typeof this._empireResourceTypeAboveTargetSorted === "undefined") {
            this._empireResourceTypeAboveTargetSorted = this.empireTypesAboveAmountSorted(C.TERMINAL_MINERALS_TARGET, Config.params.TERMINAL_STORE_TARGET);
        }
        return this._empireResourceTypeAboveTargetSorted;
	}

    get empireEnergyOverNormal() {
        if (typeof this._empireEnergyOverNormal === "undefined") {
            this._empireEnergyOverNormal = _.sum(this.empireCastleRooms, s => s.storageEnergy - s.energyNormal);
        }
        return this._empireEnergyOverNormal;
	}

    get empireEnergyOverMinimal() {
        if (typeof this._empireEnergyOverMinimal === "undefined") {
            this._empireEnergyOverMinimal = _.sum(this.empireCastleRooms, s => s.storageEnergy - s.energyMinimal);
        }
        return this._empireEnergyOverMinimal;
	}

    getPowerCreepMaxPowerLevel(power) {
        let powerCreep = _.sortByOrder(
            this.powerCreeps.filter(f => f.powers[power])
            , [s => s.powers[power].level], ['desc']
        ).find(x => x !== undefined);

        return powerCreep ? powerCreep.powers[power].level : 0;
    }

    get powerCreepMaxOperateFactoryLevel() {
        if (typeof this._powerCreepMaxOperateFactoryLevel === "undefined") {
            this._powerCreepMaxOperateFactoryLevel = this.getPowerCreepMaxPowerLevel(PWR_OPERATE_FACTORY)
        }
        return this._powerCreepMaxOperateFactoryLevel
    }

    verifyPowerCreepRooms() {
        this.powerCreeps.forEach(creep => {
            // Verify that this assigned creep has a flag.
            if (
                creep.pos
                && !creep.flagRoom
            ) {
                // Despawn, then rename.
                if (creep.ticksToLive) {
                    //creep.commitHaraKiri();
                    creep.room.logRoom('despawning powercreep:' + creep.name + ' @ ' + creep.room.printShard);
                    return;
                }
                return;
            }
        })
    }

    get maxFactoryLevel() {
        if (typeof this._maxFactoryLevel === "undefined") {
            this._maxFactoryLevel = _.max(this.empireFactories.map(m => (m.level || 0)));
        }
        return this._maxFactoryLevel
    }

    convertDepositTypeToBasicCommodity(depositType) {
        // Make this more dynamic and less ugly. LOL
        switch (depositType) {
            case RESOURCE_SILICON: return RESOURCE_WIRE;
            case RESOURCE_BIOMASS: return RESOURCE_CELL;
            case RESOURCE_METAL: return RESOURCE_ALLOY;
            case RESOURCE_MIST: return RESOURCE_CONDENSATE;
        }
    }

	get commoditiesToAwaysSell() {
        if (typeof this._commoditiesToAwaysSell === "undefined") {
            this._commoditiesToAwaysSell = {};

            // Always sell anything at or above our maximum factory level.
            // So if we have factory 3, then sell anything we aquire that is level 3,4,5.
            if (this.maxFactoryLevel <= 5) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL5_CHAIN_HASH);
            }
            if (this.maxFactoryLevel <= 4) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL4_CHAIN_HASH);
            }
            if (this.maxFactoryLevel <= 3) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL3_CHAIN_HASH);
            }
            if (this.maxFactoryLevel <= 2) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL2_CHAIN_HASH);
            }
            if (this.maxFactoryLevel <= 1) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL1_CHAIN_HASH);
            }
            if (this.maxFactoryLevel <= 0) {
                this._commoditiesToAwaysSell = Object.assign(this._commoditiesToAwaysSell, C.FACTORY_COMMODITIES_LEVEL0_CHAIN_HASH);
            }

        }
        return this._commoditiesToAwaysSell;
    }

	get highestMarkupPercentCommodityOfChain() {
        if (typeof this._highestMarkupPercentCommodityOfChain === "undefined") {
            this._highestMarkupPercentCommodityOfChain = {};
            let data = this.resourceSortByMarkupPercent.filter(f => f.orders);

            let mechanical = data.find(f => C.FACTORY_COMMODITIES_MECHANICAL_CHAIN_HASH[f.name]);
            if (mechanical) this._highestMarkupPercentCommodityOfChain[mechanical.name] = true;

            let biological = data.find(f => C.FACTORY_COMMODITIES_BIOLOGICAL_CHAIN_HASH[f.name]);
            if (biological) this._highestMarkupPercentCommodityOfChain[biological.name] = true;

            let electronical = data.find(f => C.FACTORY_COMMODITIES_ELECTRONICAL_CHAIN_HASH[f.name]);
            if (electronical) this._highestMarkupPercentCommodityOfChain[electronical.name] = true;

            let mystical = data.find(f => C.FACTORY_COMMODITIES_MYSTICAL_CHAIN_HASH[f.name]);
            if (mystical) this._highestMarkupPercentCommodityOfChain[mystical.name] = true;
        }
        return this._highestMarkupPercentCommodityOfChain;
    }

	isDepositTypeNeeded(depositType) {
        if (typeof this._isDepositTypeNeeded[depositType] !== "undefined") return this._isDepositTypeNeeded[depositType];

        // If we already are full up on the output of this type, don't bother getting more.
        // This means we can't upgrade it fast enough, and NPC's aren't buying it.
        this._isDepositTypeNeeded[depositType] = !!this.empireTerminals.find(f =>
            (f.room.factoryLevel === 0)
            && ((f.store[depositType] || 0) < Config.params.FACTORY_STORE_TARGET)
            && ((f.store[this.convertDepositTypeToBasicCommodity(depositType)] || 0) < Config.params.FACTORY_STORE_TARGET)
        );
        return this._isDepositTypeNeeded[depositType];
    }

    /**
     * Is farming this deposit even worth it?
     * This could be better...a flat markup percent does not consider energy cost of the creeps farming, nor cpu usage.
     */
    isDepositTypeProfitable(depositType) {
        if (typeof this._isDepositTypeProfitable[depositType] !== "undefined") return this._isDepositTypeProfitable[depositType];

        let chain = C.COMMODITY_CHAIN[depositType];
        let maxFactoryLevel = this.maxFactoryLevel;
        this._isDepositTypeProfitable[depositType] = C.COMMODITY_CHAIN_MEMBERS_HASH[chain].find((f, i) => (i < 2 + maxFactoryLevel) && (this.getMarketMarkupPercent(f) >= Config.params.DEPOSIT_PERCENT_MARKUP)) || null;

        return this._isDepositTypeProfitable[depositType];
    }

    /**
     * Very rough offset of how far away a target room is in ticks.
     * Will assume worse case, and tack on a few ticks to be sure.
     */
    estimatedTravelTicks(origin, destination) {
        return (Cartographer.findRouteDistance(origin, destination) * 50) + 10;
    }

    /**
     * Find the closest active colony flag from the given room.
     */
    closestColonyFlagFromRoomName(roomName) {
        return _.sortBy(Object.keys(FlagManager.colonyFlags).filter(f => FlagManager.colonyFlags[f].count > 0), s => Cartographer.findRouteDistance(roomName, s)).find(x => x !== undefined);
    }

    /**
     * Useful for finding rogue colony testing flags that have been turned on and may be sucking cpu.
     */
    get colonyTestingFlags() {
        if (typeof this._colonyTestingFlags === "undefined") {
            let pickRooms = Object.keys(FlagManager.colonyFlags).filter(f => ColonyManager.testBuild(FlagManager.colonyFlags[f].flag));
            this._colonyTestingFlags = _.pick(FlagManager.colonyFlags, pickRooms);
        }
        return this._colonyTestingFlags;
    }

    /**
     * Allow the buy avg percent to be adjustable. With no flag, default is 100% average.
     */
    get terminalBuyAvgPercent() {
        if (typeof this._terminalBuyAvgPercent === "undefined") {
            this._terminalBuyAvgPercent = 1;

            // When there are nonmax rooms out, we will buy at twice the average.
            if (this.myNonMaxNonTempleSpawnRoomsActive.length) this._terminalBuyAvgPercent = 2;

            // If there is a flag out, then include its multiplier.
            if (FlagManager.terminalBuyAvgPercentFlag) {
                const markupIncrement = 0.25;
                this._terminalBuyAvgPercent = this._terminalBuyAvgPercent * C.COLOR_TO_NUMBER[FlagManager.terminalBuyAvgPercentFlag.color] * markupIncrement;
            }
        }
        return this._terminalBuyAvgPercent;
    }

    getRoomMoveToPos(roomName) {
        let pos = null;

        if (!roomName) {
            // Do nothing.
        }
        // First see if we have a rally flag out.
        else if (FlagManager.rallyFlags[roomName]) {
            pos = FlagManager.rallyFlags[roomName].flag.pos;
        }
        // Look to see if we have location of the center of the room in memory.
        else if (RoomIntel.getRoomCenterPos(roomName)) {
            pos = RoomIntel.getRoomCenterPos(roomName);
        }
        // Second attempt to get to the colonyFlag.
        else if (FlagManager.colonyFlags[roomName]) {
            pos = FlagManager.colonyFlags[roomName].flag.pos;
        }
        // Ah, give up and just goto center of unknown room. Possibly highway room.
        else {
            if (roomName.length <= 6) {
                pos = new RoomPosition(25, 25, roomName);
            }
        }

        return pos;
    }

    saveRoomData() {
        // InterShardMemory may not be setup on some servers that don't have multiple shards.
        if (!Game.cpu.shardLimits) return;

        let roomCount = this.empireRooms.length;

        var data = JSON.parse(InterShardMemory.getLocal() || "{}");
        data.roomCount = roomCount;
        InterShardMemory.setLocal(JSON.stringify(data));
    }

    get serverRoomCount() {
        if (typeof this._serverRoomCount === "undefined") {
            let count = 0;
            if (Game.cpu.shardLimits) {
                Object.keys(Game.cpu.shardLimits).forEach(shard => {
                    let data = JSON.parse(InterShardMemory.getRemote(shard) || "{}");
                    count += data.roomCount || 0;
                })
            } else {
                count = this.empireRooms.length;
            }

            this._serverRoomCount = count;
        }
        return this._serverRoomCount;
    }

    /**
     * Check our GCL and make sure we can spawn a new room.
     * If we are at level one, obviously claim.
     * Count how many rooms we have on across shards and save one for reserved room claiming unless our gcl flag is out.
     * Recommended to leave one room free for this process however.
     */
    get isGclAvailable() {
        if (typeof this._isGclAvailable === "undefined") {
            this._isGclAvailable = (
                ((Game.gcl.level <= 1) && (this.serverRoomCount === 0))
                || (this.serverRoomCount + ((FlagManager.gclFlag || (this.empireCastleRooms.length < Config.params.EMPIRE_GCL_THRESHHOLD)) ? 0 : 1) < Game.gcl.level)
            )
        }
        return this._isGclAvailable;
    }

    get okToClaimRoom() {
        if (typeof this._okToClaimRoom === "undefined") {
            this._okToClaimRoom =
                // Check our GCL and make sure we can spawn a new room.
                // If we are at level one, obviously claim.
                // Count how many rooms we have on across shards and save one for reserved room claiming unless our gcl flag is out.
                // Recommended to leave one room free for this process however.
                this.isGclAvailable

                // Verify that we don't already have a VERY low level room (indicated by lack of spawns) we are currently working on.
                && !this.empireSpawnRooms.find(f => !this.getSpawnsByRoomName(f.name).length)
        }
        return this._okToClaimRoom;
    }

    get okToClaimRoomAbsolute() {
        if (typeof this._okToClaimRoomAbsolute === "undefined") {
            this._okToClaimRoomAbsolute =
                // Check our GCL and make sure we can claim a new room.
                // No additional checks are made here.
                (this.serverRoomCount < Game.gcl.level)
        }
        return this._okToClaimRoomAbsolute;
    }

    isNukeImminent(roomName) {
        if (!roomName) return false;

        if (typeof this._cache['isNukeImminent_' + roomName] === "undefined") {
            // Look at all the nuke data and find the smallest time to land that hasn't expired.
            let timeToLand = RoomIntel.getNukeTimeToLand(roomName);
            //if (!timeToLand) return false;
            this._cache['isNukeImminent_' + roomName] = timeToLand ? (timeToLand - Config.params.NUKE_IMMINENT_TICKS < Game.time) : false;
        }
        return this._cache['isNukeImminent_' + roomName];
    }

    shouldSpawnNukeBuilders(roomName) {
        // Look at all the nuke data and find the smallest time to land that hasn't expired.
        let timeToLand = RoomIntel.getNukeTimeToLand(roomName);
        if (!timeToLand) return false;
        return timeToLand - Config.params.NUKE_SPAWN_BUILDERS_TICKS < Game.time;
    }

	getRoomSourceCount(roomName) {
        let sources = RoomIntel.getSourceCount(roomName) || 0;

        // Provide an estimate if the room is not visible.
        if (((sources || 0) === 0) && !Cartographer.isHighwayRoom(roomName)) {
            if (Cartographer.isCoreRoom(roomName)) {
                sources = 3;
            }
            else if (Cartographer.isSKRoom(roomName)) {
                sources = 3;
            }
            else if (Cartographer.isControllerRoom(roomName)) {
                // This is a controller room that I can't see. Current set to worst case scenerio, one source non reserved.
                sources = 1;
            }
        }

        return sources;
    }

	getRoomSourceEnergyCapacity(roomName, level) {
        let capacity = 0;

        if (Cartographer.isHighwayRoom(roomName)) {
            capacity = 0;
        }
        else if (Cartographer.isCoreRoom(roomName)) {
            capacity = SOURCE_ENERGY_KEEPER_CAPACITY * 3;
        }
        else if (Cartographer.isSKRoom(roomName)) {
            capacity = SOURCE_ENERGY_KEEPER_CAPACITY * 3;
        }

        // Determine if we plan on sending preachers to this room or not.
        else if (Cartographer.isControllerRoom(roomName) && (level >= Config.params.RESERVE_PREACHER_LEVEL)) {
            capacity = SOURCE_ENERGY_CAPACITY * (RoomIntel.getSourceCount(roomName) || 1);
        }
        else if (Cartographer.isControllerRoom(roomName)) {
            capacity = SOURCE_ENERGY_NEUTRAL_CAPACITY * (RoomIntel.getSourceCount(roomName) || 1);
        }

        return capacity;
    }

    removeConstructionSites() {
        // TODO: This should run off the Game.constructionSites array, as rooms won't have visibility all the time.
        this.roomsArray.forEach(room => {
            room.removeConstructionSites();
        });
    }

	get roomsWithPlunderables() {
        if (typeof this._roomsWithPlunderables === "undefined") {
            this._roomsWithPlunderables = Object.keys(Memory.plunderables).map(m => unpackRoomName(m)).filter(f =>
                // Exclude rooms owned by others, or otherwise avoided.
                !RoomIntel.getAvoid(f)

                // Exclude our own rooms. Will look directly at assigned room first.
                && !RoomIntel.getMy(f)

                // Need to also check if a claim flag is up, so early rooms are avoided.
                && !FlagManager.claimFlags[f]

                // This room has lethal creeps or structures, exclude it.
                // Full paths will be filter out later, but this is the most likely place hostiles will be.
                && !RoomIntel.getLethalRoom(f)
            );
        }
        return this._roomsWithPlunderables;
    }

    reportBestTempleRooms() {
        return _.sortBy(this.empireSpawnRoomsActive, s => -s.controllerPosInRange3NotBlockedByObjectWithinPath.length).map(m => m.print + ':' + m.controllerPosInRange3NotBlockedByObjectWithinPath.length)
    }

	removeConstructionSites(includeInProgress = false) {
		Object.values(Game.constructionSites).forEach(site => {
			if (!site.progress || includeInProgress) site.remove();
		})
	}

    // TODO: not the best algorithm since rooms could be out of range.
	get empireBestPeonBody() {
        if (typeof this._empireBestPeonBody === "undefined") {
            this._empireBestPeonBody = this.empireHighestControllerRoom.getBodyPeon()
        }
        return this._empireBestPeonBody;
    }

    get empireSectors() {
        if (typeof this._empireSectors === "undefined") {
            this._empireSectors = utils.groupBy(this.empireSpawnRoomsActive, 'sector');
        }
        return this._empireSectors;
    }

    get empireSectorNames() {
        if (typeof this._empireSectorNames === "undefined") {
            this._empireSectorNames = Object.keys(this.empireSectors);
        }
        return this._empireSectorNames;
    }

    isRoomNameInEmpireSectors(roomName) {
        return !!this.empireSectors[Cartographer.getSector(roomName)];
    }

    get empireSectorRoomCount() {
        if (typeof this._empireSectorRoomCount === "undefined") {
            this._empireSectors = this.empireSectorNames.reduce((map, sector) => (map[sector] = this.empireSectors[sector].length, map), {});
        }
        return this._empireSectorRoomCount;
    }

    get empireSectorPercentage() {
        if (typeof this._empireSectorPercentage === "undefined") {
            this._empireSectorPercentage = this.empireSectorNames.reduce((map, sector) => (map[sector] = this.empireSectors[sector].length / this.empireSpawnRoomsActive.length, map), {});
        }
        return this._empireSectorPercentage;
    }

    /**
     * Determine if the sector the specified room is in is "claimed" by us.
     */
    isSectorClaimed(roomName) {
        let sector = Cartographer.getSector(roomName);
        return Memory.sectors[sector] || !!FlagManager.sectorFlags[sector];
    }

	updateClaimedSectors() {
        // Clear our any previous data.
        Memory.sectors = {}

        // We will only automatically claim our best sector.
        let maxPercent = Math.max(...Object.values(this.empireSectorPercentage));
        let sector = Object.keys(this.empireSectorPercentage).find(f => this.empireSectorPercentage[f] === maxPercent);

        // Mark each good sector in memory.
        Memory.sectors[sector] = 1;
	}

    /**
     * Determine if the sector the specified room is in is "claimed" by us.
     */
    recordFind(roomName, find) {
        if (typeof Memory.find[roomName] === "undefined") Memory.find[roomName] = {};
        Memory.find[roomName][find] = 1;
    }

    /**
     * Display FIND_* operations in this tick.
     */
    reportFind() {
        if (FlagManager.findFlag) {
            let keys = Object.keys(Memory.find);

            // Based on color, filter the rooms.
            switch (FlagManager.findFlag.color) {
                case COLOR_PURPLE:
                    keys = keys.filter(f => Cartographer.isControllerRoom(f));
                    break;

                case COLOR_BLUE:
                    keys = keys.filter(f => Cartographer.isHighwayRoom(f));
                    break;

                case COLOR_CYAN:
                    keys = keys.filter(f => Cartographer.isCenterRoom(f));
                    break;
            }

            keys.forEach(roomName => {
                console.log(utils.getRoomHTML(roomName), Object.keys(Memory.find[roomName]).join());
            });
        }
    }

    get empireBestPowerBanks() {
        if (typeof this._empireBestPowerBanks === "undefined") {
            let data = RoomIntel.getPowerBanks()
                // Filter out anything not interesting or not in range to our castles.
                .filter(f =>
                    (f.hits > 0)
                    && !RoomIntel.getAvoid(f.roomName)
                    && !RoomIntel.getHighwayNoviceWallsExist(f.roomName)
                    && (f.despawnTime > Game.time + CREEP_LIFE_TIME)
                    && Cartographer.isInRouteDistance(f.roomName, this.getClosestCastleRoomTo(f.roomName), Config.params.MAX_POWERBANK_RANGE)

                    // Determine if we have enough time for to extract from this powerbank..
                    && (
                        // 1 nip powerbanks only need one Blacksmith lifetime to harvest.
                        ((f.nips === 1) && (f.despawnTime > Game.time + (CREEP_LIFE_TIME * (1 + Config.params.POWERBANK_DECAY_FUDGE))))
                        // 2 nip powerbanks need 2 Strikers lifetimes to harvest.
                        || ((f.nips === 2) && (f.despawnTime > Game.time + (CREEP_LIFE_TIME * (2 + Config.params.POWERBANK_DECAY_FUDGE))))
                        // More than 3 nips will send 3 Strikers, and only need one lifetime.
                        || ((f.nips >= 3) && (f.despawnTime > Game.time + (CREEP_LIFE_TIME * (1 + Config.params.POWERBANK_DECAY_FUDGE))))
                    )
                )
                // Sort by how much power they have.
                .sort((a,b) => b.power - a.power)
                // Filter again excluding powerbanks currently being worked on.
                .filter(f => !CreepManager.getPowerWorkersByFocusId(f.id).length)
                // Return only the top couple of rooms we are capable of farming.
                .slice(0, this.bestpowerbankCount)
                // Get the id's of these powerbanks.
                .map(m => m.id)

            // Return results as a hash by id for quick lookup.
            this._empireBestPowerBanks = utils.arrayToHash(data, 1);
        }
        return this._empireBestPowerBanks;
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(GameManager, 'GameManager');

module.exports = GameManager;
