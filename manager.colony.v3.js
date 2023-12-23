"use strict";

const TESTING = false;
//const testRoom = 'E7N59';
const testRoom = '';
const STRUCTURE_PLACEHOLDER = 'structurePlaceholder'
const STRUCTURE_HARVEST = 'harvestPosition'

class StructureManager {
    constructor(room, data) {
        this._structures = {};
        this._structuresByType = {};
        this._roads = {};
        this._ramparts = {};
        this._containers = {};
        this._placeholders = {};
        this._all = [];

        this._room = room;

        // If we have data, then load it up.
        if (data) {
            data.forEach(structure => {
                this.add(structure);
            })
        }
    }

    addIfNotWallTerrain(structure, force) {
        if (!structure) return;
        let pos = new RoomPosition(structure.x, structure.y, structure.roomName);
        if (force || !pos.isTerrainWall) {
            this.add(structure);
        }
    }

    add(structure) {
        if (this._add(structure)) {
            // Save all successful structures.
            this._all.push(structure)
        }
    }

    getAll() {
        return JSON.parse(JSON.stringify(this._all));
    }

    _add(structure) {
        // Parameter check.
        if (!structure) return;
        if (structure.x <= 0 || structure.x >= 49) return;
        if (structure.y <= 0 || structure.y >= 49) return;

        let key = this.makeKeyByStructure(structure);
        let existing = this.find(structure.x, structure.y, structure.roomName);

        // Check for duplicates.  Lower our level if necessary. Can happen with roads/walls.
        if (existing && (structure.structureType === existing.structureType)) {
            if (structure.level < existing.level) existing.level = structure.level;
            return true;
        }

        // If nothing is at this spot, or the existing is over level 9 (meaning it is just a display placeholder), or the existing is a road (which structures can be placed over)
        if (!existing || (existing.level >= 9) || (existing.structureType === STRUCTURE_ROAD)) {

            // Walkable structures have to be recorded seperately, since they can overlap.
            if (structure.structureType === STRUCTURE_ROAD) {
                this._roads[key] = structure;
            }
            else if (structure.structureType === STRUCTURE_RAMPART) {
                this._ramparts[key] = structure;
            }
            else if (structure.structureType === STRUCTURE_CONTAINER) {
                this._containers[key] = structure;
            }
            else if (structure.structureType === STRUCTURE_PLACEHOLDER) {
                this._placeholders[key] = structure;
            }
            else {
                // Record all structures into our global hash...
                this._structures[key] = structure;
                // ...and also our type specific hash.
                if (!this._structuresByType[structure.structureType]) this._structuresByType[structure.structureType] = {}
                this._structuresByType[structure.structureType][key] = structure;
            }

            // Exit the method successfully.
            return true;
        }

        if (structure.structureType === STRUCTURE_CONTAINER) {
            // You are allowed to put down containers over walkable objects, nothing else.
            if ([STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_PLACEHOLDER].includes(existing.structureType)) {
                if (!this._containers[key]) {
                    this._containers[key] = structure;
                } else {
                    // Use the lower of the two build requests.
                    this._containers[key].level = Math.min(this._containers[key].level, structure.level);
                }
                // Exit the method successfully.
                return true;
            }
        }
        else if (structure.structureType === STRUCTURE_ROAD) {
            // You are allowed to put down roads over walkable objects OR while road is lower level and structure doesn't exist yet, nothing else.
            if (
                [STRUCTURE_CONTAINER, STRUCTURE_ROAD, STRUCTURE_RAMPART].includes(existing.structureType)
                || ((structure.level < existing.level) && (this._room.controller.level < existing.level))
            ) {
                if (!this._roads[key]) {
                    this._roads[key] = structure;
                } else {
                    // Use the lower of the two build requests.
                    this._roads[key].level = Math.min(this._roads[key].level, structure.level);
                }
                // Exit the method successfully.
                return true;
            }
        }
        else if (structure.structureType === STRUCTURE_RAMPART) {
            // Allowed to rampart over anything.
            if (!this._ramparts[key]) {
                this._ramparts[key] = structure;
            } else {
                // Use the lower of the two road build requests.
                this._ramparts[key].level = Math.min(this._ramparts[key].level, structure.level);
            }
            // Exit the method successfully.
            return true;
        }

        // Display a warning if we detect a serious problem.
        if (structure.structureType !== STRUCTURE_ROAD) {
            console.log("StructureManager not overriding existing structure @ [" + structure.x + ',' + structure.y + ' ' + structure.roomName + ']: existing [' + existing.structureType + '], new [' + structure.structureType + ']');
        }
        return true;
    }

    /**
     * While this searches any structures, there may be duplicates and it will return the first one found based on the || order.
     */
    find(x, y, roomName) {
        let key = this.makeKeyByXY(x, y, roomName);
        return this._structures[key] || this._containers[key] || this._roads[key] || this._ramparts[key] || this._placeholders[key];
    }

    findNonWalkableStructure(x, y, roomName) {
        let key = this.makeKeyByXY(x, y, roomName);
        return this._structures[key];
    }

    findRoad(x, y, roomName) {
        let key = this.makeKeyByXY(x, y, roomName);
        return this._roads[key];
    }

    findRoadNearBy(x, y, roomName) {
        for (let dx = x - 1; dx <= x + 1; dx++) {
            for (let dy = y - 1; dy <= y + 1; dy++) {
                if ((dx !== x) || (dy !== y)) {
                    let key = this.makeKeyByXY(dx, dy, roomName);
                    if (this._roads[key]) return true;
                }
            }
        }
        return false;
    }

    _structurePosByType(structureType) {
        return Object.keys(this._structuresByType[structureType] || {}).map(m => new RoomPosition(this._structuresByType[structureType][m].x, this._structuresByType[structureType][m].y, this._structuresByType[structureType][m].roomName));
    }

    get roads() {
        return Object.values(this._roads);
    }

    get roadsPos() {
        return Object.keys(this._roads).filter(f => this._roads[f].level < 9).map(m => new RoomPosition(this._roads[m].x, this._roads[m].y, this._roads[m].roomName));
    }

    get spawnsPos() {
        return this._structurePosByType(STRUCTURE_SPAWN);
    }

    get storagePos() {
        return this._structurePosByType(STRUCTURE_STORAGE).find(x => x !== undefined);
    }

    get terminalPos() {
        return this._structurePosByType(STRUCTURE_TERMINAL).find(x => x !== undefined);
    }

    get extensionsPos() {
        return this._structurePosByType(STRUCTURE_EXTENSION);
    }

    get towersPos() {
        return this._structurePosByType(STRUCTURE_TOWER);
    }

    get labsPos() {
        return this._structurePosByType(STRUCTURE_LAB);
    }

    get factoriesPos() {
        return this._structurePosByType(STRUCTURE_FACTORY);
    }

    get powerspawnsPos() {
        return this._structurePosByType(STRUCTURE_POWER_SPAWN);
    }

    get observersPos() {
        return this._structurePosByType(STRUCTURE_OBSERVER);
    }

    get nukersPos() {
        return this._structurePosByType(STRUCTURE_NUKER);
    }

    get wallsPos() {
        return this._structurePosByType(STRUCTURE_WALL);
    }

    get rampartsPos() {
        return Object.keys(this._ramparts).map(m => new RoomPosition(this._ramparts[m].x, this._ramparts[m].y, this._ramparts[m].roomName));
    }

    get perimeterBarriersPos() {
        return this.wallsPos.concat(this.rampartsPos);
    }

    get placeholders() {
        return Object.values(this._placeholders);
    }

    makeKeyByStructure(structure) {
        return structure.x + '_' + structure.y + '_' + structure.roomName;
    }

    makeKeyByXY(x, y, roomName) {
        return x + '_' + y + '_' + roomName;
    }

    get allStructures() {
        return Object.values(this._structures)
            .concat(Object.values(this._containers))
            .concat(Object.values(this._roads))
            .concat(Object.values(this._ramparts))
            .concat(Object.values(this._placeholders))
    }
}

class ColonyManager {

    // Put down our three spawns.
    COLONY_STAMP_SPAWN1(flag) { return this.createStructureObjectRel(flag, 1, +1, +0, STRUCTURE_SPAWN, flag.pos.roomName + 'a'); }
    COLONY_STAMP_SPAWN2(flag) { return this.createStructureObjectRel(flag, 7, +0, +1, STRUCTURE_SPAWN, flag.pos.roomName + 'b'); }
    COLONY_STAMP_SPAWN3(flag) { return this.createStructureObjectRel(flag, 8, -1, +1, STRUCTURE_SPAWN, flag.pos.roomName + 'c'); }

    COLONY_STAMP_TOWER1(flag) { return this.createStructureObjectRel(flag, 3, +1, +1, STRUCTURE_TOWER); }
    COLONY_STAMP_TOWER2(flag) { return this.createStructureObjectRel(flag, 5, +1, +2, STRUCTURE_TOWER); }
    COLONY_STAMP_TOWER3(flag) { return this.createStructureObjectRel(flag, 7, +1, +3, STRUCTURE_TOWER); }
    COLONY_STAMP_TOWER4(flag) { return this.createStructureObjectRel(flag, 8, +0, +3, STRUCTURE_TOWER); }
    COLONY_STAMP_TOWER5(flag) { return this.createStructureObjectRel(flag, 8, -1, +3, STRUCTURE_TOWER); }
    COLONY_STAMP_TOWER6(flag) { return this.createStructureObjectRel(flag, 8, -1, +2, STRUCTURE_TOWER); }

    // Place the colony container.
    COLONY_STAMP_COLONY_CONTAINER(flag) { return this.createStructureObjectRel(flag, 0, +0, +0, STRUCTURE_CONTAINER); }

    // Place storage, link and container once we reach level 5.
    COLONY_STAMP_STORAGE(flag) { return this.createStructureObjectRel(flag, 4, +3, -1, STRUCTURE_STORAGE); }

    // Place colony link.
    COLONY_STAMP_COLONY_LINK(flag) { return this.createStructureObjectRel(flag, 5, +3, 0, STRUCTURE_LINK); }

    // Place terminal.
    COLONY_STAMP_TERMINAL(flag) { return this.createStructureObjectRel(flag, 6, +1, -1, STRUCTURE_TERMINAL); }

    // Place factory.
    COLONY_STAMP_FACTORY(flag) { return this.createStructureObjectRel(flag, 7, +3, +1, STRUCTURE_FACTORY); }

    // Place power spawn.
    //COLONY_STAMP_POWER_SPAWN(flag) { return this.createStructureObjectRel(flag, 8, +2, +1, STRUCTURE_POWER_SPAWN); }
    COLONY_STAMP_POWER_SPAWN(flag) { return this.createStructureObjectRel(flag, 8, +2, -1, STRUCTURE_POWER_SPAWN); }

    // Place nuker.
    //COLONY_STAMP_NUKER(flag) { return this.createStructureObjectRel(flag, 8, +2, -1, STRUCTURE_NUKER); }
    COLONY_STAMP_NUKER(flag) { return this.createStructureObjectRel(flag, 8, +2, +1, STRUCTURE_NUKER); }

    // Place observer.
    //COLONY_STAMP_OBSERVER(flag) { return this.createStructureObjectRel(flag, 8, +0, +4, STRUCTURE_OBSERVER); }
    COLONY_STAMP_OBSERVER(flag) { return this.createStructureObjectRel(flag, 8, +2, +2, STRUCTURE_OBSERVER); }

    // Place colony renew pos.
    COLONY_STAMP_RENEW_POS(flag) { return this.createStructureObjectRel(flag, 1, +0, +0, STRUCTURE_PLACEHOLDER); }
    //COLONY_STAMP_POWER_SPAWN_RENEW_POS(flag) { return this.createStructureObjectRel(flag, 1, +2, +2, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_POWER_SPAWN_RENEW_POS(flag) { return this.createStructureObjectRel(flag, 1, +2, -2, STRUCTURE_PLACEHOLDER); }

    // Make creep parking spots.
    //COLONY_STAMP_COLONY_PARKING_1(flag) { return this.createStructureObjectRel(flag, 1, +2, -2, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_1(flag) { return this.createStructureObjectRel(flag, 1, +4, +0, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_2(flag) { return this.createStructureObjectRel(flag, 1, +0, -4, STRUCTURE_PLACEHOLDER); }
    //COLONY_STAMP_COLONY_PARKING_3(flag) { return this.createStructureObjectRel(flag, 1, +4, +0, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_3(flag) { return this.createStructureObjectRel(flag, 1, +0, +4, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_4(flag) { return this.createStructureObjectRel(flag, 1, -2, +2, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_5(flag) { return this.createStructureObjectRel(flag, 1, -3, +1, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_6(flag) { return this.createStructureObjectRel(flag, 1, -4, +0, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_7(flag) { return this.createStructureObjectRel(flag, 1, -3, -1, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_8(flag) { return this.createStructureObjectRel(flag, 1, -0, -6, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_9(flag) { return this.createStructureObjectRel(flag, 1, +1, -5, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_10(flag) { return this.createStructureObjectRel(flag, 1, +2, -4, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_11(flag) { return this.createStructureObjectRel(flag, 1, +3, -3, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_12(flag) { return this.createStructureObjectRel(flag, 1, +4, -2, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_13(flag) { return this.createStructureObjectRel(flag, 1, +5, -1, STRUCTURE_PLACEHOLDER); }
    COLONY_STAMP_COLONY_PARKING_14(flag) { return this.createStructureObjectRel(flag, 1, +6, +0, STRUCTURE_PLACEHOLDER); }

    // Place labs.
    COLONY_STAMP_LAB1(flag) { return this.createStructureObjectRel(flag, 6, -1, -1, STRUCTURE_LAB); }
    COLONY_STAMP_LAB2(flag) { return this.createStructureObjectRel(flag, 6, -1, -2, STRUCTURE_LAB); }
    COLONY_STAMP_LAB3(flag) { return this.createStructureObjectRel(flag, 6, +0, -2, STRUCTURE_LAB); }

    COLONY_STAMP_LAB4(flag) { return this.createStructureObjectRel(flag, 7, +1, -3, STRUCTURE_LAB); }
    COLONY_STAMP_LAB5(flag) { return this.createStructureObjectRel(flag, 7, +0, -3, STRUCTURE_LAB); }
    COLONY_STAMP_LAB6(flag) { return this.createStructureObjectRel(flag, 7, -1, -3, STRUCTURE_LAB); }

    COLONY_STAMP_LAB7(flag) { return this.createStructureObjectRel(flag, 8, -2, -1, STRUCTURE_LAB); }
    COLONY_STAMP_LAB8(flag) { return this.createStructureObjectRel(flag, 8, -2, +0, STRUCTURE_LAB); }
    COLONY_STAMP_LAB9(flag) { return this.createStructureObjectRel(flag, 8, -3, +0, STRUCTURE_LAB); }
    COLONY_STAMP_LAB10(flag) { return this.createStructureObjectRel(flag, 8, -2, -2, STRUCTURE_LAB); }

    // King & Queen positions.
    COLONY_KING_POS(flag) { return this.getAbsXY(flag, +2, +0); }
    COLONY_STAMP_KING_POS(flag) { return this.createStructureObjectRel(flag, 1, +2, +0, STRUCTURE_PLACEHOLDER); }
    COLONY_QUEEN_POS(flag) { return this.getAbsXY(flag, +0, +2); }
    COLONY_STAMP_QUEEN_POS(flag) { return this.createStructureObjectRel(flag, 1, +0, +2, STRUCTURE_PLACEHOLDER); }


    getPos(stamp) {
        return new RoomPosition(stamp.x, stamp.y, stamp.roomName);
    }

    getXY(stamp) {
        return { x:stamp.x, y:stamp.y };
    }

    forceCreateColony(roomName) {
        // Shorthand.
        let room = Game.rooms[roomName];

        // Can't do an update if we are max construction sites already.
        if (GameManager.constructionSitesArray.length === MAX_CONSTRUCTION_SITES) {
            return false;
        }
        // Hard coded test room.
        if (roomName === testRoom) {
            return true;
        }
        // We have a global "colony" flag up.
        if (FlagManager.colonyFlag && (FlagManager.colonyFlag.pos.roomName === roomName)) {
            return true;
        }
        // Use our last recorded colony level to determine if we just leveled up (or down).
        if ((room.colonyBuildLevel || 0) !== room.controller.level) {
            return true;
        }
        // We successfully created a site last time, and have no construction sites left.
        // Since we may have hit a max, try again now.
        if (room.colonyCreateTime && !room.myConstructionSites.length) {
            return true;
        }

        // Clear out our colonyCreateTime flag if we have hostiles in the room, since they may destroy things.
        if (RoomIntel.getDangerousHostilesTTL(room.name)) room.colonyCreateTime = null;

        // We have missing structures and no contruction sites, easy way to detect a colony build is needed.
        if (
            (!room.colonyCreateTime || !room.myConstructionSites.length)
            && !FlagManager.throttleFlag
            && room.roomMissingStructure
        ) {
            return true;
        }

        return false;
    }

    testBuild(flag) {
        const colors = {
            [COLOR_GREEN]: true
            , [COLOR_YELLOW]: true
            , [COLOR_ORANGE]: true
            , [COLOR_BROWN]: true
        }
        return colors[flag.color] || TESTING;
    }

    productionBuild(flag) {
        const colors = {
            [COLOR_RED]: true
            , [COLOR_PURPLE]: true
            , [COLOR_BLUE]: true
            , [COLOR_CYAN]: true
        }
        return colors[flag.color] || TESTING;
    }

    createBaseSiteAbs(level, flag, x, y, roomName, structureType, name) {
        // Parameter check.
        if (!flag.room) return false;

        // Shorthand.
        let room = Game.rooms[roomName];
        if (!room) {
            console.log('createBaseSiteAbs roomName not visible room:', x, y, roomName, structureType, level)
            return false;
        }

        let testing = this.testBuild(flag);

        // Parameter check.
        if ((x < 0) || (y < 0) || (x > 49) || (y > 49)) {
            console.log('createBaseSiteAbs creating structure on invalid position:', x, y, roomName, structureType, level)
            return false;
        }
        let pos = new RoomPosition(x, y, roomName);

        // Parameter check.
        if ((structureType || '') === '') {
            console.log('createBaseSiteAbs structureType invalid:', x, y, roomName, structureType, level)
            return false;
        }

        let roomLevel = 1;
        if (flag.room.controller) roomLevel = flag.room.controller.level;

        // Bail out if the room isn't at the desired level yet.
        if (!testing && (level > roomLevel)) {
            //if (level < 9) console.log('createBaseSiteAbs level not reached:', x, y, roomName, structureType, level)
            return false;
        }

        // The "fake" placeholder structure is always a success.
        if (structureType === STRUCTURE_PLACEHOLDER) return true;

        // The "fake" placeholder structure is always a success.
        if (structureType === STRUCTURE_HARVEST) {
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (!testing && (pos.lookForStructure(structureType) || pos.lookForConstructionSite(structureType))) {
            // If the requested structure is present already, return true.
            return true;

        } else if ([STRUCTURE_EXTRACTOR, STRUCTURE_RAMPART].includes(structureType)) {
            // Special case as this is actually on a wall or a structure.
            if (!testing) pos.removeWall();
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (!testing && (!room.canBuildAtPos(x, y, structureType) || room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length)) {
            // Bail out if there is already a construction structure at the given location, assume it is correct.  Ramparts are always allowed to be built.
            if (testing) this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (pos.hasRoad && ![STRUCTURE_ROAD, STRUCTURE_CONTAINER, STRUCTURE_RAMPART].includes(structureType)) {
            // We are building on top of a road. Other than another walkable object, we would never do this. Destroy the road.
            if (!testing) pos.removeRoad();
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (!pos.isTerrainWall) {
            // Do not build on walls in this method.
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (pos.isTerrainWall && room.canBuildAtPos(x, y, structureType)) {
            // This is for roads/extractors that can be build on wall terrains.
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else if (testing) {
            // If we are testing, then show ALL requested structures. Nothing is really built, just colored.
            this.createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name);
            return true;

        } else {
            // Something bad happened?
            return false;
        }
    }

    createConstructionSiteOrVisual(flag, x, y, roomName, structureType, name) {
        var testing = this.testBuild(flag);

        let room = Game.rooms[roomName];
        if (!room) {
            console.log('createConstructionSiteOrVisual attempting to place structure in non-visible room:', structureType, room.print, '(' + x + ',' + y + ' ' + roomName + ')');
            return;
        }

        if (testing) {
            let invalid = false;

            let pos = new RoomPosition(x, y, roomName);

            if (
                // Only extractors/roads can be placed on a terrain wall.
                (![STRUCTURE_EXTRACTOR, STRUCTURE_ROAD].includes(structureType) && pos.isTerrainWall)
            ) {
                invalid = true;
                console.log('createConstructionSiteOrVisual attempting to place structure on wall:', structureType, flag.room.print, '(' + x + ',' + y + ')');
            }
            else if (
                // Stupid bug where you can't build structures near the edge, even tho you can manually place them.
                ((structureType !== STRUCTURE_ROAD) && pos.isNearEdge)
            ) {
                invalid = true;
                console.log('createConstructionSiteOrVisual attempting to place structure near edge:', structureType, flag.room.print, '(' + x + ',' + y + ')');
            }

            // Draw our structure on the map while testing.
            room.visual.structure(structureType, x, y, invalid)
        } else {
            // The "fake" placeholder harvest position is always a success.
            if (structureType === STRUCTURE_HARVEST) return OK;

            // Make the specified construction site.
            let result = room.createConstructionSite(x, y, structureType, name);
            if (![OK, ERR_FULL].includes(result)) {
                console.log('createConstructionSiteOrVisual failed:', result, structureType, room.print, '(' + x + ',' + y + ')');
            }
            else {
                // We had a successful build attempt, so record the time.
                flag.room.colonyCreateTime = Game.time;
            }
        }
    }

    okToCreateColony(roomName) {
        // Shorthand.
        let room = Game.rooms[roomName];

        // Must have visibility, obviously.
        if (!room) return false;

        // Must have a claim flag out.
        if (!room.claimFlag) return false;

        // Okay to build.
        return true;
    }

    // Common entry point for all version of a base.
    createColonyBase(flag) {
        // Parameter check.
        if (!flag) return;
        if (!flag.room) return;

        // When testing a room, ONLY the test room will ever be created.
        if (testRoom && (flag.pos.roomName !== testRoom)) return;

        let testing = this.testBuild(flag);
        if (!testing) {
            if (!this.okToCreateColony(flag.pos.roomName)) {
                console.log('🚧 Not okay to create colony; cannot build colony', flag.room.printShard);
                return;
            }

            if (GameManager.constructionSitesArray.length === MAX_CONSTRUCTION_SITES) {
                console.log('🚧 Maxium construction sites are deployed; cannot build colony', flag.room.printShard);
                return;
            }

            // We are going to give this a shot...
            console.log('🚧 Colony build in progress for', flag.room.printShard);

            // Delete our last successful create construction site tick.
            flag.room.colonyCreateTime = null;

            // If we had a colony flag, set it back to white.
            if (FlagManager.colonyFlag && (FlagManager.colonyFlag.pos.roomName === flag.pos.roomName)) FlagManager.colonyFlag.setColor(COLOR_WHITE);
        }

        this.createColonyBaseDetails(flag);
        GameManager.addProcess('createColonyBase');
    }

    createStructureObjectAbs(flag, level, x, y, roomName, structureType, name = undefined) {
        return {
            level: level
            , x: x
            , y: y
            , roomName: roomName
            , structureType: structureType
            , name: name
        }
    }

    getAbsXY(flag, offsetX, offsetY) {
        switch (flag.color) {

            case COLOR_GREEN:
            case COLOR_RED:
                // Base direction.
                break;

            case COLOR_YELLOW:
            case COLOR_PURPLE:
                // Mirror left/right
                offsetX = -offsetX;
                break;

            case COLOR_ORANGE:
            case COLOR_BLUE:
                // Mirror left/right
                offsetX = -offsetX;
                // Mirror up/down;
                offsetY = -offsetY;
                break;

            case COLOR_BROWN:
            case COLOR_CYAN:
                // Mirror up/down;
                offsetY = -offsetY;
                break;

        }

        let x = flag.pos.x + offsetX;
        let y = flag.pos.y + offsetY;

        // Uh oh...something wrong. Possibly colony builder auto-placing structures outside bounds of room.
        if (x<0 || x>49 || y<0 || y>49) {
            return null;
        }

        return new RoomPosition(x, y, flag.pos.roomName);
    }

    createStructureObjectRel(flag, level, offsetX, offsetY, structureType, name = undefined) {
        let xy = this.getAbsXY(flag, offsetX, offsetY);
        if (!xy) {
            //console.log('ERROR (createStructureObjectRel):', level, offsetX, offsetY, flag.pos.roomName, structureType);
            return;
        }
        return this.createStructureObjectAbs(flag, level, xy.x, xy.y, flag.pos.roomName, structureType, name);
    }

    // Create roads from our storage/colony flag to the destination.
    buildTrailToColonyFlag(flag, level, destination, includeDestination) {
        let room = flag.room;
        let isTempleCandiate = room.isTempleCandidate;
        let testing = this.testBuild(flag);

        let options = {}
        options['avoidExitArea'] = true;
        if (room.name === destination.roomName) {
            options['maxRooms'] = 1;
        }

        //let ignorePos = getIgnorePos(room.mineral);
        let start = room.storage ? room.storage : flag;
        let startPath = Traveler.findTravelPath(null, start, destination, options).path;

        // If our starting point is walkable, then add it to our trail. Good for ramparts.
        if (includeDestination && destination.isTrailRoadBuildable) {
            startPath.push(destination);
        }

        // Will rely on building one road at a time instead, so that pathfinding will pickup existing road optimizations on 2nd/3rd runs.
        startPath.forEach(path => {
            // If we aren't in the same room, then bail out.
            if (!testing && (room.name !== path.roomName)) return;

            // Find existing roads or structures.
            let existing = this.structureManager.find(path.x, path.y, path.roomName);

            if ((path.getDistanceTo(flag) <= 5) && !isTempleCandiate) {
                // Do not build here, ever.
            }
            else if (existing && (existing.structureType === STRUCTURE_PLACEHOLDER)) {
                // Do not build here, ever.
            }
            // else if (room.isTempleCandidate && !path.isTrailRoadBuildable) {
            //     // Do not build roads over existing structures if road is temple, as those structures are perminant.
            // }
            else if (existing && (existing.structureType === STRUCTURE_ROAD)) {
                // We may have a road scheduled to build here later, build it at specified level..
                if (existing.level > level) existing.level = level;
            }
            else if (existing && ![STRUCTURE_WALL, STRUCTURE_RAMPART].includes(existing.structureType) && (existing.level <= level)) {
                // Walls are excluded from our ability to make roads. Ramparts will be created over them later.
                // All other structures BELOW or equal to this road level request will block this road.
            }
            else {
                // Determine if this spot is "good" to build a road on.
                // Note that we are potentially building a road on a spot reserved for a building
                // But when that building is to be built, we will over-write that road piece.
                let good = true;

                // Check for any rogue structures that are already built on this spot.
                // Should have been in structures already but only if it was automated.
                //if (good && !newPos.isTrailRoadBuildable) good = false;

                if (good) {
                    // Nothing appears to be here so build away!
                    this.structureManager.add(this.createStructureObjectAbs(flag, level, path.x, path.y, path.roomName, STRUCTURE_ROAD));
                }
            }
        });

        // Testing won't work well because pathfinding requires roads to already be built.
        if (testing) return false;

        // If we added any roads, return true.
        return startPath;
    }

    getRange2EdgeArray(flag, destination) {
        let room = flag.room;

        let options = {}
        options.avoidExitArea = true;
        if (room.name === destination.roomName) options.maxRooms = 1;

        let start = room.storage ? room.storage : flag;
        let startPath = Traveler.findTravelPath(null, start, destination, options).path;
        let retval = [];

        // Will rely on building one road at a time instead, so that pathfinding will pickup existing road optimizations on 2nd/3rd runs.
        startPath.every(path => {
            // If we hit a barrier position, record it. Last one recorded wins.
            if (path.isRange2Edge) retval.push(path);

            // If we aren't in the same room, then bail out.
            return (path.roomName === room.name);
        });

        // If we added any roads, return true.
        return retval;
    }

    createColonyBaseDetails(flag) {
        // Bail out if we have no flag.
        if (!flag) return;

        // Yellow colony flag means we are in testing mode, so display a map and do not actually build anything.
        let testing = this.testBuild(flag);
        let room = flag.room;

        // Bail out if room isn't visible for some reason.
        if (!room) return;

        // Bail out if we have no controller.
        if (!room.controller) return;

        // Then create all the roads around the main cluster. (level 2)
        const MIN_ROAD_LEVEL = (room.colonyShouldHaveRoads >= 0) ? room.colonyShouldHaveRoads : 4;
        // We won't put down roads at very eary levels so that energy isn't wasted on creating them too early.
        const SOURCE_CONTAINER_LEVEL = (room.colonyShouldHaveRoads >= 0) ? room.colonyShouldHaveRoads : 4;
        // The level to make our controller ring.
        const COLONY_CONTROLLER_RING_LEVEL = (!room.atMaxLevel && room.hasEmpireCastleAssistance) ? 0 : 9;
        // Source container level.
        const COLONY_SOURCE_CONTAINER_LEVEL = (!room.atMaxLevel && room.hasEmpireCastleAssistance) ? 0 : Config.params.COLONY_SOURCE_CONTAINER_LEVEL;
        // Road levels.
        const COLONY_EXIT_ROAD_LEVEL = (!room.atMaxLevel && room.hasEmpireCastleAssistance) ? 0 : 3;
        // Set our perimeter barrier level.
        const COLONY_PERIMETER_LEVEL = (!room.atMaxLevel && room.hasEmpireCastleAssistance) ? 3 : Config.params.COLONY_PERIMETER_LEVEL;

        // Initialize variables.
        let posIdealControllerLinkPosition = null;

        // Initialize.
        this.structureManager = new StructureManager(room);

        // *** MAIN BASE CLUSTER BEGIN ***

        // Temple logic is here, only a few structures are created.
        if (room.isTempleCandidate) {
            // Create the only 4 structures we need.
            this.structureManager.add(this.createStructureObjectAbs(flag, 1, room.templeSpawnPos.x, room.templeSpawnPos.y, room.templeSpawnPos.roomName, STRUCTURE_SPAWN, flag.pos.roomName + 'a'));
            this.structureManager.add(this.createStructureObjectAbs(flag, 4, room.templeStoragePos.x, room.templeStoragePos.y, room.templeStoragePos.roomName, STRUCTURE_STORAGE));
            this.structureManager.add(this.createStructureObjectAbs(flag, 6, room.templeTerminalPos.x, room.templeTerminalPos.y, room.templeTerminalPos.roomName, STRUCTURE_TERMINAL));
            this.structureManager.add(this.createStructureObjectAbs(flag, room.templeTowerLevel, room.templeTowerPos.x, room.templeTowerPos.y, room.templeTowerPos.roomName, STRUCTURE_TOWER));

            // If the room has minerals, place an extraction on it.
            if (room.mineral) {
                this.structureManager.add(this.createStructureObjectAbs(flag, 6, room.mineral.pos.x, room.mineral.pos.y, room.mineral.pos.roomName, STRUCTURE_EXTRACTOR));
            }

            // *** ROADS ***
            let templeRoadLevel = (testing || !room.atMaxLevel) ? 1 : 9;

            // Road to our sources. Peons will use these to harvest and fill up the spawn.
            let setupSourceRoads = _.sortBy(room.sources, s => s.pos.findPathTo(flag).length);
            setupSourceRoads.forEach(source => {
                return this.buildTrailToColonyFlag(flag, templeRoadLevel, source.harvestPos, true);
            });

            // If this room is a temple assist, make sure there is a path to the controller of the temple room.
            // This should add a road on the outside of our perimeter barriers.
            room.roomsAssistingTemple.forEach(assistingRoom => {
                let targetPos = assistingRoom.storage.pos;
                this.buildTrailToColonyFlag(flag, templeRoadLevel, targetPos, false);
            });

            // Add in extra ring for temples since they have some intense creep movement.
            let controllerRingPos = room.controller.pos.xyOfRange4;
            controllerRingPos.forEach(xy => {
                let pos = new RoomPosition(xy.x, xy.y, room.name);
                if (
                    !pos.isDistance8(room.controller)
                    && (
                        (room.storage && pos.inRange2(room.storage))
                        || (room.terminal && pos.inRange2(room.terminal))
                        || (room.colonyTower1 && pos.inRange2(room.colonyTower1))
                    )
                ) {
                    this.structureManager.addIfNotWallTerrain(this.createStructureObjectAbs(flag, templeRoadLevel, pos.x, pos.y, pos.roomName, STRUCTURE_ROAD));
                }
            })

            // Create extra road around spawn which would otherwise block passage.
            let spawnRoadPos = flag.pos.posOfRange2.find(f => f.isRange5(room.controller) && f.isDistance2(flag));
            if (spawnRoadPos) {
                this.structureManager.addIfNotWallTerrain(this.createStructureObjectAbs(flag, templeRoadLevel, spawnRoadPos.x, spawnRoadPos.y, spawnRoadPos.roomName, STRUCTURE_ROAD));
            }

        }

        // Colony logic is here.
        else {

            // Put a placeholder on the king and queen spots.
            this.structureManager.add(this.COLONY_STAMP_KING_POS(flag));
            this.structureManager.add(this.COLONY_STAMP_QUEEN_POS(flag));


            // First create the 3 spawns (level 1, 7, 8)
            this.structureManager.add(this.COLONY_STAMP_SPAWN1(flag));
            this.structureManager.add(this.COLONY_STAMP_SPAWN2(flag));
            this.structureManager.add(this.COLONY_STAMP_SPAWN3(flag));

            // Create the power spawn (level 8)
            this.structureManager.add(this.COLONY_STAMP_POWER_SPAWN(flag));

            // Mid road.
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -2, +1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -1, +0, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +0, -1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +1, -2, STRUCTURE_ROAD), room.level >= 4);

            // Top right road.
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +1, -4, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +2, -3, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +3, -2, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +4, -1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +5, -0, STRUCTURE_ROAD), room.level >= 4);

            // Bottom right road.
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +4, +1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +3, +2, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +2, +3, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +1, +4, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, +0, +5, STRUCTURE_ROAD), room.level >= 4);

            // Bottom left road.
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -1, +4, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -2, +3, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -3, +2, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -4, +1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -5, +0, STRUCTURE_ROAD), room.level >= 4);

            // Top left road. Two spots taken by labs.
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -4, -1, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -3, -2, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -2, -3, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -1, -4, STRUCTURE_ROAD), room.level >= 4);
            this.structureManager.addIfNotWallTerrain(this.createStructureObjectRel(flag, MIN_ROAD_LEVEL, -0, -5, STRUCTURE_ROAD), room.level >= 4);

            // PowerSpawn renew spot.
            this.structureManager.add(this.COLONY_STAMP_POWER_SPAWN_RENEW_POS(flag));

            // The colony renew position.
            this.structureManager.add(this.COLONY_STAMP_RENEW_POS(flag));

            // Place parking spots.
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_1(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_2(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_3(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_4(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_5(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_6(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_7(flag));

            // Outside of immedate distance-5 base parking. Not guarenteed to be available.
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_8(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_9(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_10(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_11(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_12(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_13(flag));
            this.structureManager.add(this.COLONY_STAMP_COLONY_PARKING_14(flag));

            // Place towers
            this.structureManager.add(this.COLONY_STAMP_TOWER1(flag));
            this.structureManager.add(this.COLONY_STAMP_TOWER2(flag));
            this.structureManager.add(this.COLONY_STAMP_TOWER3(flag));

            // Forget about level 8 towers when we are going to recycle again quickly.
            this.structureManager.add(this.COLONY_STAMP_TOWER4(flag));
            this.structureManager.add(this.COLONY_STAMP_TOWER5(flag));
            this.structureManager.add(this.COLONY_STAMP_TOWER6(flag));

            // Place storage.
            this.structureManager.add(this.COLONY_STAMP_STORAGE(flag));

            // Place link.
            this.structureManager.add(this.COLONY_STAMP_COLONY_LINK(flag));

            // Place terminal.
            this.structureManager.add(this.COLONY_STAMP_TERMINAL(flag));

            // Place factory.
            this.structureManager.add(this.COLONY_STAMP_FACTORY(flag));

            // Place nuker.
            this.structureManager.add(this.COLONY_STAMP_NUKER(flag));

            // Place observer.
            this.structureManager.add(this.COLONY_STAMP_OBSERVER(flag));


            // *** MAIN BASE CLUSTER END ***


            // *** MINERAL EXTRACTOR ***

            // If the room has minerals, place an extraction on it.
            if (room.mineral) {
                this.structureManager.add(this.createStructureObjectAbs(flag, 6, room.mineral.pos.x, room.mineral.pos.y, room.mineral.pos.roomName, STRUCTURE_EXTRACTOR));
            }


            // *** LABS ***
            this.structureManager.add(this.COLONY_STAMP_LAB1(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB2(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB3(flag));

            this.structureManager.add(this.COLONY_STAMP_LAB4(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB5(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB6(flag));

            this.structureManager.add(this.COLONY_STAMP_LAB7(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB8(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB9(flag));
            this.structureManager.add(this.COLONY_STAMP_LAB10(flag));


            // *** LINK SETUP ***

            // Create our controller link.
            posIdealControllerLinkPosition = room.idealControllerLinkPosition;

            // While one link will be made at level 5, another will get created at level 6.
            // Per the sorting of the sources, we would create the link on the one furthest from the controller.
            if (posIdealControllerLinkPosition) {
                this.structureManager.add(this.createStructureObjectAbs(flag, room.controllerLinkLevel, posIdealControllerLinkPosition.x, posIdealControllerLinkPosition.y, posIdealControllerLinkPosition.roomName, STRUCTURE_LINK));
            }


            // *** EXTENSIONS ***

            let placedExtensions = 0;
            let done = false;
            let level = 1;
            let previousLevel = 1;

            // Make two passes for creating base fully behind labs, then lastly in front if needed.
            for (let b=0; b<=1; b++) {
                // Initial cut range stops right in front of labs.
                let idealCut = -5;
                if ((b === 1)) {
                    // Successfully placed all extensions up to max level on first round.
                    if (placedExtensions >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]) break;

                    // Problem...made it thru the first cut without doing all extensions.
                    // Try again allow to move in front of colony.
                    idealCut = -25;
                }

                // Go forward and backwards to ensure we wrap around structures.
                for (let r=1; r<=30; r++) {
                    if (done) break;
                    let repeatR = false;

                    for (let dir=1; dir<=2; dir=dir+1) {
                        if (done) break;
                        if (repeatR) break;

                        for (let a=-r; -r<=a && a<=r; a=a+1) {
                            if (done) break;
                            if (repeatR) break;

                            for (let b=-r; -r<=b && b<=r; b=b+1) {
                                if (done) break;
                                if (repeatR) break;

                                let x = (dir === 1) ? a : b;
                                let y = (dir === 1) ? b : a;

                                // Are we doing range or distance?
                                if (Math.abs(x) + Math.abs(y) !== r) continue;

                                // Are we above the line where building is prohibited?
                                //if (x + y < idealCut) continue;
                                if (y - x < idealCut) continue;

                                // Offset to other side of labs.
                                // We are only doing the ring around the square, not the interier.
                                // Interating over R will get us the whole onion square.

                                // Bail out once we hit our max, so additional empty roads aren't created.
                                if (!testing) {
                                    done = placedExtensions >= CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]
                                }

                                if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][2]) {
                                    level = 2;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][3]) {
                                    level = 3;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][4]) {
                                    level = 4;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][5]) {
                                    level = 5;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][6]) {
                                    level = 6;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][7]) {
                                    level = 7;
                                } else if (placedExtensions < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]) {
                                    level = 8;
                                } else {
                                    done = true;
                                    break;
                                }

                                // If we break to a new level, then reset our r, x, y as better spots may have opened up due to roads in previous level.
                                if (level > previousLevel) {
                                    r = Math.max(1, r-3); // The loop will increment it by 1, so go 2 rows back to backfill.
                                    previousLevel++;
                                    repeatR = true
                                    break;
                                }
                                else {

                                    // Adjust the XY based on the colony flag logic.
                                    let xy = this.getAbsXY(flag, x + 1, y);
                                    // Make sure we arent off the playing map.
                                    if (!xy) continue;

                                    let structureType = STRUCTURE_ROAD;

                                    // Our pattern is extension, road, extension, road...
                                    if ((Math.isEven(x) && Math.isOdd(y)) || (Math.isOdd(x) && Math.isEven(y))) {
                                        structureType = STRUCTURE_EXTENSION;
                                    } else {
                                        structureType = STRUCTURE_ROAD;
                                    }

                                    // Make sure we aren't already planning of building on this position.
                                    // Unless it is an early road structure (labs), then allow it.
                                    if (this.structureManager.find(xy.x, xy.y, xy.roomName)) continue;

                                    // Don't put on top of walls.
                                    if (xy.isTerrainWall) continue;

                                    // Make sure we arent near an exit which we cannot build on.
                                    if (xy.inRange1Edge) continue;
                                    if (room.anyPerimeterBarrierRange2CoordsNameHash[xy.x + '_' + xy.y]) continue;

                                    // Only spots are outside of range 5 (so range 6+).
                                    if (xy.getDistanceTo(flag) <= 5) continue;

                                    // Determine if we can put down an extension/road.
                                    let good = true;

                                    // Stay away from sources.
                                    for (let i=0; (i<room.sources.length) && good; i++) {
                                        if (xy.inRangeTo(room.sources[i], 2)) {
                                            good = false;
                                            break;
                                        }
                                    }

                                    // Stay away from minerals.
                                    for (let i=0; (i<room.minerals.length) && good; i++) {
                                        if (xy.inRangeTo(room.minerals[i], 2)) {
                                            good = false;
                                            break;
                                        }
                                    }

                                    // Stay away from controller.
                                    if (good && room.controller) {
                                        if (xy.inRangeTo(room.controller, 5)) {
                                            good = false;
                                        }
                                    }

                                    // If we are already correctly on the location, then call it good.
                                    // This be a manual placement to force a spot that would otherwise fail a "good" check below.
                                    let existing = false;
                                    if (!good && (structureType === STRUCTURE_ROAD) && xy.hasRoad) {
                                        existing = true;
                                    }

                                    // Finally, if everything checks out, then add this structure to our array.
                                    if (good || existing) {
                                        // Make sure we are building our object next to an existing road. No gaps!
                                        if (!this.structureManager.findRoadNearBy(xy.x, xy.y, xy.roomName)) continue;

                                        // We want to record all extensions and roads in memory.
                                        let extensionLevel = done ? 9 : MIN_ROAD_LEVEL;

                                        if (structureType === STRUCTURE_EXTENSION) {
                                            // Increment our placed extentions. They will go early before roads even.
                                            placedExtensions = placedExtensions + 1;
                                            extensionLevel = done ? 9 : level;
                                        }

                                        // We want to record all extensions and roads in memory.
                                        //extensionLevel = (done || (level <= MIN_ROAD_LEVEL)) ? 9 : level;

                                        // Success, add our structure to the list!
                                        this.structureManager.add(this.createStructureObjectAbs(flag, extensionLevel, xy.x, xy.y, xy.roomName, structureType));
                                    }

                                }
                            }

                        }
                    }

                }
            }


            // *** ROAD TO CONTROLLER LINK ***

            // While one link will be made at level 5, another will get created at level 6.
            // Per the sorting of the sources, we would create the link on the one furthest from the controller.
            if (posIdealControllerLinkPosition) {
                this.buildTrailToColonyFlag(flag, room.controllerLinkLevel, posIdealControllerLinkPosition, false);
            }


            // Sort sources by distance from controller descending, so that first link is automatically made from most distance source.
            let roomSources = _.sortBy(room.sources, s => s.pos.findPathTo(flag.pos, {ignoreCreeps: true, ignoreDestructibleStructures: true}).length).reverse();
            roomSources.forEach((source, index) => {
                let sourceLinkPos = source.sourceLinkPos;
                // The first two are colony and controller.
                let sourceLinkLevel = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_LINK]).find(f => CONTROLLER_STRUCTURES[STRUCTURE_LINK][f] > (2 + index));

                if (sourceLinkPos) {
                    // While one link will be made at level 6, another will get created at level 7.
                    // Per the sorting of the sources, we would create the link on the one furthest from the controller.
                    this.structureManager.add(this.createStructureObjectAbs(flag, sourceLinkLevel, sourceLinkPos.x, sourceLinkPos.y, sourceLinkPos.roomName, STRUCTURE_LINK));

                    // Stick a road on this position to keep it from being a wall.
                    if (sourceLinkPos.inRange2Edge) {
                        this.structureManager.add(this.createStructureObjectAbs(flag, MIN_ROAD_LEVEL, sourceLinkPos.x, sourceLinkPos.y, sourceLinkPos.roomName, STRUCTURE_ROAD));
                    }
                }
                else {
                    room.logRoom('colony manager cant find a suitable location for source link for source @' + source.pos, '💢');
                }
            });


            // *** ROADS OUT OF COLONY ***
            // Road to our sources.
            let setupSourceRoads = _.sortBy(room.sources, s => s.pos.findPathTo(flag).length);
            setupSourceRoads.forEach(source => {
                // Llamas need to travel the trail until we get a source link.
                // By then peasants will have enough movement to fast travel without roads, and no llamas will be needed.
                return this.buildTrailToColonyFlag(flag, SOURCE_CONTAINER_LEVEL, source.harvestPos, false);
            });

            // Road to our mineral harvesting position.
            if (room.thorium && room.thorium.mineralAmount) {
                // Road the mineral deposit for the miner.
                // So only build if we have an amount. Even then we may not mine it, but better than nothing at least.
                let thoriumTrailLevel = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR]).find(f => CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][f]);
                room.thorium.nips.forEach(nip => {
                    this.buildTrailToColonyFlag(flag, thoriumTrailLevel, nip, false);
                });

                // Build a trail around the thorium for easy movement.
                room.thorium.pos.ringPosOfRangeDNotBlockedByObject(2).forEach(road => {
                    if (room.thorium.nips.find(f => f.isNearTo(road))) {
                        this.structureManager.add(this.createStructureObjectAbs(flag, thoriumTrailLevel, road.x, road.y, road.roomName, STRUCTURE_ROAD));
                    }
                })
            }
            else if (room.mineral) {
                // Road the mineral deposit for the miner.
                // So only build if we have an amount. Even then we may not mine it, but better than nothing at least.
                let mineralTrailLevel = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR]).find(f => CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][f]);
                room.mineral.nips.forEach(nip => {
                    this.buildTrailToColonyFlag(flag, mineralTrailLevel, nip, false);
                });

                // Build a trail around the mineral for easy movement.
                if (room.mineral.nips.length > 1) {
                    room.mineral.pos.ringPosOfRangeDNotBlockedByObject(2).forEach(road => {
                        if (room.mineral.nips.find(f => f.isNearTo(road))) {
                            this.structureManager.add(this.createStructureObjectAbs(flag, mineralTrailLevel, road.x, road.y, road.roomName, STRUCTURE_ROAD));
                        }
                    })
                }
            }



            // *** SOURCE CONTAINERS ***

            if (
                testing
                || !room.atMaxLevel
            ) {
                room.sources.forEach(source => {
                    if (testing || !source.sourceLink) {
                        // Normally made at level 2. Played with churches providing peasants, but was too hard to make it work right.
                        // Body size of early best rooms is problematic.
                        this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_SOURCE_CONTAINER_LEVEL, source.harvestPos.x, source.harvestPos.y, source.harvestPos.roomName, STRUCTURE_CONTAINER));
                    }
                })
            }


            // Non-max level rooms get roads around controller so they can be blasted by upgraders.
            if (testing || (COLONY_CONTROLLER_RING_LEVEL < 9)) {
                let controllerRingPos = [];

                // Add in extra ring for temples since they have some intense creep movement.
                controllerRingPos = room.controller.pos.xyOfRange5.concat(room.controller.pos.xyOfRange4);

                controllerRingPos.forEach(xy => {
                    let pos = new RoomPosition(xy.x, xy.y, room.name);
                    // We do allow building roads on terrain walls, which get turned into ramparts. But not constructed walls, which are from level 8.
                    // This is a bit of a race condition.
                    if (
                        // Don't build on exits and don't build on the last position out.
                        !this.structureManager.findNonWalkableStructure(pos.x, pos.y, pos.roomName)
                        && room.controllerUpgradePositions.find(f => pos.getRangeTo(f) <= 2)
                    ) {
                        this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_CONTROLLER_RING_LEVEL, pos.x, pos.y, pos.roomName, STRUCTURE_ROAD));
                    }
                })
            }


            // The colony container.  Conditional based on if we have storage yet or not, or if room has assistance.
            if (
                testing
                || (
                    !room.storage
                    && !CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][room.controller.level]
                    && ((room.controller.level >= 2) || room.hasEmpireCastleAssistance)
                )
            ) {
                this.structureManager.add(this.COLONY_STAMP_COLONY_CONTAINER(flag));
            }


            // *** CONTROLLER CONTAINERS ***

            if (
                testing
                || !room.atMaxLevel
            ) {
                // Create the controller containers used for upgrading.
                let containerCount = CONTROLLER_STRUCTURES[STRUCTURE_CONTAINER][room.controller.level]
                // Remove one controller container until we have a colony storage.
                if (!room.storage) containerCount -= 1;

                let level = 9;
                if (!testing) {
                    if (room.hasEmpireCastleAssistance) {
                        //level = room.atSpawningEnergyCapacityForLevel(2) ? 2 : 9;
                        level = 0;
                        containerCount -= (room.sources.length - room.sources.filter(source => source.sourceLink).length)
                    }
                    else {
                        // If no assistance, then only make 1 container.
                        // This prevents criers from going dry.
                        level = room.atSpawningEnergyCapacityForLevel(2) ? 2 : 9;
                        containerCount = 1;
                    }
                }

                for (let i = 0; (i < containerCount) && (i < room.idealControllerContainerPositions.length); i++) {
                    let idealControllerContainerPosition = room.idealControllerContainerPositions[i];
                    // Early vs late game logic:
                    // We build controller containers, if needed, starting at level 2 with 1 containers.
                    // The rest are not build since early rooms can't use all of them anyway.
                    // Exception is temples or late game support, which should have all containers at level 1 always.
                    // Note: adjust the value of i here (0 or 1 or 2) to specify how many starting containers to make.
                    //let level = (room.isTemple || room.hasEmpireCastleAssistance) ? 1 : ((((i <= 0) && !room.atMaxLevel) ? 2 : 9) + i);

                    this.structureManager.add(this.createStructureObjectAbs(flag, level, idealControllerContainerPosition.x, idealControllerContainerPosition.y, idealControllerContainerPosition.roomName, STRUCTURE_CONTAINER));

                    // Build a trail to each of the containers, as they will potentially be walled off and on a different route to storage.
                    this.buildTrailToColonyFlag(flag, level, idealControllerContainerPosition, false);
                }

                // Don't do this expensive/costly step for normal baby rooms without outside help.
                if (testing || (room.storage && room.hasEmpireCastleAssistance)) {
                    // Make sure we have a walking alley at range 4 around the controller.
                    let controllerRingPos4 = room.controller.pos.anyPosOfRange4.filter(f =>
                        // Exclude the very corner positions, they are not needed to pass by.
                        !(
                            (Math.abs(f.x - room.controller.pos.x) === 4)
                            && (Math.abs(f.y - room.controller.pos.y) === 4)
                        )
                    );
                    let controllerRing3 = room.controllerUpgradePositions.filter(f => f.getRangeTo(room.controller) === 3);
                    controllerRingPos4.forEach(pos => {
                        // We do allow building roads on walls so that movement around ring is smooth.
                        if (
                            !pos.inRange2Edge
                            && pos.isTerrainWall
                            && (pos.findInRange(controllerRing3, 1).length >= 2)
                            && !room.exits.find(f => pos.getRangeTo(f) <= 2)
                        ) {
                            this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_CONTROLLER_RING_LEVEL, pos.x, pos.y, pos.roomName, STRUCTURE_ROAD));
                        }
                    });
                }
            }


            // *** ROAD BOOSTRAPERS ***

            // At level 3, create roads to the center of each of the next rooms on the first position at range 23 from center.
            // This will be the marker for level 4 perimeter barrier ramparts.
            room.exitGroups.forEach(exitGroup => {
                let closestExit = flag.pos.findClosestByPath(exitGroup, { ignoreCreeps: true, ignoreDestructibleStructures: true});
                if (closestExit) {
                    let positions = this.getRange2EdgeArray(flag, closestExit);
                    positions.forEach(pos => this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_EXIT_ROAD_LEVEL, pos.x, pos.y, pos.roomName, STRUCTURE_ROAD)));
                }
            })

            // *** EXIT WALLS ***
            let pushWallOrRampart = function(flag, self, area, room, pos) {

                if (pos.isTerrainWall) {
                    // Do nothing if there is already a natural wall here.
                }
                if (pos.inDistance5(flag)) {
                    // Do nothing, can't build within range 5 of the flag.
                }
                else if (room.minerals.length && room.minerals.find(f => pos.isNearTo(f))) {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_RAMPART, pos: pos});
                }
                else if (room.sources.length && room.sources.find(f => pos.isNearTo(f.harvestPos))) {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_RAMPART, pos: pos});
                }
                // Need to be able to resupply/move around the full controller upgrade area. Exclude corners.
                else if (room.controller && pos.inRange4(room.controller) && !pos.isRange8(room.controller)) {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_RAMPART, pos: pos});
                }
                else if (pos.hasRampartHits || pos.hasRampartConstructionSite) {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_RAMPART, pos: pos});
                }
                // Some roads are set to level 9 for testing display purposes, ignore them here tho.
                else if (pos.hasRoad || pos.lookForRoadConstructionSite() || (self.structureManager.findRoad(pos.x, pos.y, pos.roomName) && self.structureManager.findRoad(pos.x, pos.y, pos.roomName).level < 9)) {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_RAMPART, pos: pos});
                }
                else {
                    area.push({x: pos.x, y: pos.y, roomName: pos.roomName, structureType: STRUCTURE_WALL, pos: pos});
                }
            }

            let barriers = [];
            room.perimeterBarrierPositions.forEach(pos => {
                pushWallOrRampart(flag, this, barriers, room, pos);
            });
            barriers.forEach(barrier => {
                this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_PERIMETER_LEVEL, barrier.x, barrier.y, barrier.roomName, barrier.structureType));
            })


            // *** ROADS TO OUTSIDE ***

            // Find top barriers.
            let topFilter = function(structure) {  return (structure.y && structure.y <= 2); }
            let bottomFilter = function(structure) {  return (structure.y && structure.y >= 47); }
            let leftFilter = function(structure) {  return (structure.x && structure.x <= 2); }
            let rightFilter = function(structure) {  return (structure.x && structure.x >= 47); }

            // Make a road if
            // 1. We are still leveling up and need access to perimeter walls to upgrade.
            // 2. We are a temple and won't be reserving but need paths walls and storage.
            // 3. We are assisting a temple and won't be reserving but need paths to storage.
            // 3. We have reserved rooms in any direction and should be creating trails.
            let rampartRoads = [];
            let rampartTrailLevel = (
                // All low level rooms will create trails for building walls.
                !room.atMaxLevel

                // Temples and asisting rooms will have trails for the upgraders.
                || room.isTempleAssist

                // Is this room expected to have travelers to other rooms?
                || (room.reservedRoomNames.length && room.shouldCreateSourceTrails)

                // This room has lots of walls left to upgrade.
                || room.colonyRampartsNeedingRepair.length
            ) ? COLONY_PERIMETER_LEVEL : 9;
            if (room.hasEmpireCastleAssistance) rampartTrailLevel = 0;

            // Top ramparts.
            rampartRoads = _.sortBy(this.structureManager.rampartsPos.filter(f => topFilter(f)), s => s.findPathTo(flag).length);
            rampartRoads.forEach(rampart => {
                return this.buildTrailToColonyFlag(flag, rampartTrailLevel, rampart, true);
            });

            // Bottom ramparts.
            rampartRoads = _.sortBy(this.structureManager.rampartsPos.filter(f => bottomFilter(f)), s => s.findPathTo(flag).length);
            rampartRoads.forEach(rampart => {
                return this.buildTrailToColonyFlag(flag, rampartTrailLevel, rampart, true);
            });

            // Left ramparts.
            rampartRoads = _.sortBy(this.structureManager.rampartsPos.filter(f => leftFilter(f)), s => s.findPathTo(flag).length);
            rampartRoads.forEach(rampart => {
                return this.buildTrailToColonyFlag(flag, rampartTrailLevel, rampart, true);
            });

            // Right ramparts.
            rampartRoads = _.sortBy(this.structureManager.rampartsPos.filter(f => rightFilter(f)), s => s.findPathTo(flag).length);
            rampartRoads.forEach(rampart => {
                return this.buildTrailToColonyFlag(flag, rampartTrailLevel, rampart, true);
            });

            // Ramparts over harvesting positions and structures near exits.
            // TODO: how are the structure ramparts deleted if not needed anymore?
            let perimeterBarrierPos = this.structureManager.perimeterBarriersPos.filter(f => f.inRange2Edge);
            room.sources.forEach(source => {
                if (source.harvestPos.findInRange(perimeterBarrierPos, 2).length) {
                    this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_PERIMETER_LEVEL, source.harvestPos.x, source.harvestPos.y, source.harvestPos.roomName, STRUCTURE_RAMPART));
                }
            })

            // Any harvesting positions near mineral.
            let mineralLevel = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR]).find(f => CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][f]);
            room.minerals.forEach(mineral => { mineral.nips.forEach(pos => {
                if (pos.findInRange(perimeterBarrierPos, 2).length) {
                    this.structureManager.add(this.createStructureObjectAbs(flag, mineralLevel, pos.x, pos.y, pos.roomName, STRUCTURE_RAMPART));
                }
            })});

            // Any structure near the edge should be shielded.
            room.protectedPerimeterStructures.forEach(structure => {
                let pos = structure.pos;
                if (pos.findInRange(perimeterBarrierPos, 2).length) {
                    this.structureManager.add(this.createStructureObjectAbs(flag, COLONY_PERIMETER_LEVEL, pos.x, pos.y, pos.roomName, STRUCTURE_RAMPART));
                }
            })

        }


        // *** MAKE THOSE STRUCTURES ***
        let structures = _.sortByOrder(this.structureManager.allStructures, [
            sortLevel => sortLevel.level
            , sortRange => utils.posFromCoord(sortRange, room.name).getRangeTo(flag)
        ]);
        structures.forEach(s => {
            this.createBaseSiteAbs(s.level, flag, s.x, s.y, s.roomName, s.structureType, s.name);
        })

        if (!testing) {
            // Save our roads.
            room.setColonyRoadsFromPosList(this.structureManager.roadsPos);
        }


        // *** REMOVE MISPLACED STRUCTURES ***

        // Remember the roads we made, these are the only ones that towers will repair.
        if (!testing && !room.isTempleCandidate) {
            let hasDestroyedStructure = false;

            // Save our ramprts.
            room.setColonyRampartsFromPosList(this.structureManager.rampartsPos);

            // Save the path length from each source to storage.
            room.sources.forEach(source => {
                // Llamas are not used for very long, we don't need to spend the cpu to get an accurate distance.
                //source.sourcePathLength = Traveler.findTravelPath(null, source.harvestPos, room.storage || flag).path.length;
                let distanceToStorage = source.harvestPos.getRangeTo(room.storage || flag) * 1.5;
                source.sourcePathLength = distanceToStorage;
            });


            // *** CLEANUP MISLEVEL STRUCTURES ***

            // Delete structures if they are empty and in the wrong location.
            // storage and terminal will be destroyed once they are empty.
            room.misplacedStores.filter(f => !f.store.getUsedCapacity()).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // Destroy spawns not in the right place.
            room.mySpawns.filter(f => !this.structureManager.spawnsPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // Destroy extensions not in the right place.
            room.myExtensions.filter(f => !this.structureManager.extensionsPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // Destroy towers not in the right place.
            room.myTowers.filter(f => !this.structureManager.towersPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // Destroy observers not in the right place.
            room.myObservers.filter(f => !this.structureManager.observersPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // Any structure that is on our storage, terminal, spawn position needs to be destroyed immediately or it blocks progress.
            if (CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][room.controller.level]) {
                this.structureManager.storagePos.structures.filter(f => ![STRUCTURE_RAMPART, STRUCTURE_STORAGE].includes(f.structureType)).forEach(structure => {
                    let result = structure.destroy();
                    hasDestroyedStructure = true;
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });
            }
            if (CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][room.controller.level]) {
                this.structureManager.terminalPos.structures.filter(f => ![STRUCTURE_RAMPART, STRUCTURE_TERMINAL].includes(f.structureType)).forEach(structure => {
                    let result = structure.destroy();
                    hasDestroyedStructure = true;
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });
            }
            if (CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level]) {
                this.structureManager.spawnsPos.forEach(spawnPos => {
                    spawnPos.structures.filter(f => ![STRUCTURE_RAMPART, STRUCTURE_SPAWN].includes(f.structureType)).forEach(structure => {
                        let result = structure.destroy();
                        hasDestroyedStructure = true;
                        console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                    });
                });
            }
            room.colonyRenewPos.structures.filter(f => ![STRUCTURE_RAMPART, STRUCTURE_CONTAINER, STRUCTURE_ROAD].includes(f.structureType)).forEach(structure => {
                let result = structure.destroy();
                hasDestroyedStructure = true;
                console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
            });

            // If we haven't destroyed anything and we no longer have any construction sites, then destroy our storage and terminal.
            if (!hasDestroyedStructure) {
                if (room.storage && room.storage.isMisplaced) {
                    let result = room.storage.destroy();
                    hasDestroyedStructure = true;
                    console.log('ColonyManager destroying misplaced', 'storage', room.storage.id, '@', room.storage.pos, ':', result);
                }
                else if (room.myStorage && room.terminal && room.terminal.isMisplaced) {
                    let result = room.terminal.destroy();
                    hasDestroyedStructure = true;
                    console.log('ColonyManager destroying misplaced', 'terminal', room.terminal.id, '@', room.terminal.pos, ':', result);
                }
            }

            // Wait until we have storage or terminal before destroying these structures, as they have valuables in them.
            // Both storage and terminal are built before any of these structures normally.
            if ((room.myStorage && !room.myStorage.isMisplaced) && (room.myTerminal && !room.myTerminal.isMisplaced)) {
                // Destroy labs not in the right place.
                room.myLabs.filter(f => !this.structureManager.labsPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                    let result = structure.destroy();
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });

                // Destroy factory not in the right place.
                room.myFactories.filter(f => !this.structureManager.factoriesPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                    let result = structure.destroy();
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });

                // Destroy powerspawns not in the right place.
                room.myPowerSpawns.filter(f => !this.structureManager.powerspawnsPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                    let result = structure.destroy();
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });

                // Destroy nukers not in the right place.
                room.myNukers.filter(f => !this.structureManager.nukersPos.find(f2 => f.pos.isEqualTo(f2))).forEach(structure => {
                    let result = structure.destroy();
                    console.log('ColonyManager destroying misplaced', structure.structureType, structure.id, '@', structure.pos, ':', result);
                });
            }

            // Delete these spawns if we aren't high enough level yet.
            if ((CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level] < 2) && room.colonySpawn2 && !room.colonySpawn2.spawning) room.colonySpawn2.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level] < 3) && room.colonySpawn3 && !room.colonySpawn3.spawning) room.colonySpawn3.destroy();

            // Delete these towers if we aren't high enough level yet.
            if ((CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] < 2) && room.colonyTower2) room.colonyTower2.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] < 3) && room.colonyTower3) room.colonyTower3.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] < 4) && room.colonyTower4) room.colonyTower4.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] < 5) && room.colonyTower5) room.colonyTower5.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] < 6) && room.colonyTower6) room.colonyTower6.destroy();

            // Destroy all links except the colony link if we have restarted our colony from zero.
            if (!CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level]) {
                room.links.forEach(link => {
                    // For now, only the colony link is spared. It is always the first one made.
                    if (!link.isColonyLink && !link.isControllerLink) link.destroy();
                })
            }
            if (room.colonyLink && !room.colonyLink.pos.isEqualTo(this.getPos(this.COLONY_STAMP_COLONY_LINK(flag)))) room.colonyLink.destroy();
            if (room.controllerLink && posIdealControllerLinkPosition && !room.controllerLink.pos.isEqualTo(posIdealControllerLinkPosition)) room.controllerLink.destroy();

            // Cleanup any containers that are no longer needed at max level...which is all of them, unless we are a temple.
            if (room.atMaxLevel && !room.isTempleCandidate) {
                room.containers.forEach(container => {
                    container.destroy();
                });

                room.controllerConstructionContainers.forEach(container =>  {
                    container.remove();
                })
            }

            // Remove any non-source and non-controller container that might be left over.
            room.containers.forEach(container => {
                // Be careful here...controller containers can be source containers and vice versa.
                if (container.isSourceContainer) {
                    // Do nothing.
                }
                // Controller containers are fine as long as we don't have a controller link or we have empire castle upgraders being sent to us.
                // But these can be destroyed if we are low level rooms and can't use.
                // UPDATE: We WILL keep containers near to our controller links however.
                //else if (container.isControllerContainer && (!room.controllerLink || room.hasEmpireCastleAssistance)) {
                else if (container.isControllerContainer) {
                    // Do nothing.
                }
                else if (container.isColonyContainer && !room.myStorage) {
                    // Do nothing.
                }

                else {
                    // Get rid of it.
                    container.destroy();
                }
            });

            // Destroy source containers once a source link is created.
            room.sources.forEach(source => {
                if (source.sourceLink && source.sourceContainer) {
                    source.sourceContainer.destroy();
                }
                // Once a source has a link, delete its construction container as its a waste to build.
                if (source.sourceLink && source.sourceConstructionContainer) {
                    source.sourceConstructionContainer.remove();
                }
            });

            // Delete these labs if we aren't high enough level yet.
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 4) && room.colonyLab4) room.colonyLab4.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 5) && room.colonyLab5) room.colonyLab5.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 6) && room.colonyLab6) room.colonyLab6.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 7) && room.colonyLab7) room.colonyLab7.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 8) && room.colonyLab8) room.colonyLab8.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 9) && room.colonyLab9) room.colonyLab9.destroy();
            if ((CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level] < 10) && room.colonyLab10) room.colonyLab10.destroy();

            // Can only have one extractor...so put it on the thorium first.
            // Destroy it if it is on the mineral.
            if (room.thorium && room.thorium.mineralAmount && room.mineralExtractor) {
                room.mineralExtractor.destroy();
            }

            // Can only have one extractor...if there is no thorium, then delete the thorium extractor that is left behind.
            if (!room.thorium && !room.mineralExtractor) {
                room.myExtractors.forEach(extractor => {
                    extractor.destroy();
                });
            }

        }  // End of !testing


        // POST CREATE LOGIC

        // Save the current level after a successful run.
        room.colonyBuildLevel = room.controller.level;
    }

};

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(ColonyManager, 'ColonyManager');
if (profiler) profiler.registerClass(StructureManager, 'StructureManager');

module.exports = ColonyManager;
