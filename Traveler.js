/**
 * To start using Traveler, require it in main.js:
 * Example: var Traveler = require('Traveler.js');
 */
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

// this might be higher than you wish, setting it lower is a great way to diagnose creep behavior issues. When creeps
// need to repath to often or they aren't finding valid paths, it can sometimes point to problems elsewhere in your code
const REPORT_CPU_THRESHOLD = 1000;
const DEFAULT_MAXOPS = 20000;
const DEFAULT_STUCK_VALUE = 2;
const STATE_PREV_X = 0;
const STATE_PREV_Y = 1;
const STATE_STUCK = 2;
const STATE_CPU = 3;
const STATE_DEST_X = 4;
const STATE_DEST_Y = 5;
const STATE_DEST_ROOMNAME = 6;
const MEMORY_KEY = 't';

let _defaults = {
    ignoreCreeps: true,
    preferHighway: true,
    allowSK: true,
    avoidSKResources: true,
    avoidExitArea: false,
    maxOps: DEFAULT_MAXOPS,
    range: 1,
    movingTarget: false,
    avoidPortals: true,
    weightedBarriers: false,
    flee: false,
    allowHostile: false,
    ensurePath: true,
    returnData: false,
    cpu: false,
    debug: false,
    maxRooms: 16
};

class Traveler {
    /**
     * move creep to destination
     * @param creep
     * @param destination
     * @param options
     * @returns {number}
     */
    static travelTo(creep, destination, options = {}) {
        // uncomment if you would like to register hostile rooms entered
        //this.updateRoomStatus(creep.room);

        if (!destination) {
            return ERR_INVALID_ARGS;
        }
        if (creep.fatigue > 0) {
            Traveler.circle(creep.pos, "aqua", .3);
            return ERR_TIRED;
        }
        destination = this.normalizePos(destination);
        // manage case where creep is nearby destination
        let rangeToDestination = creep.pos.getRangeTo(destination);
        if (options.range && rangeToDestination <= options.range) {
            return OK;
        }
        else if (rangeToDestination <= 1) {
            if (rangeToDestination === 1 && !options.range) {
                let direction = creep.pos.getDirectionTo(destination);
                if (options.returnData) {
                    options.returnData.nextPos = destination;
                    options.returnData.path = direction.toString();
                }
                return creep.move(direction);
            }
            return OK;
        }
        // initialize data object
        if (!creep.memory[MEMORY_KEY] || options.refreshPath) {
            delete creep.memory[MEMORY_KEY];
            creep.memory[MEMORY_KEY] = {};
        }
        let travelData = creep.memory[MEMORY_KEY];
        let state = this.deserializeState(travelData, destination);
        // uncomment to visualize destination
        //this.circle(destination, "orange");
        // check if creep is stuck
        if (this.isStuck(creep, state)) {
            state.stuckCount++;
            Traveler.circle(creep.pos, "magenta", state.stuckCount * .2);
        }
        else {
            state.stuckCount = 0;
        }
        // handle case where creep is stuck
        if (!options.stuckValue) {
            options.stuckValue = DEFAULT_STUCK_VALUE;
        }
        if (state.stuckCount >= options.stuckValue && Math.random() > .5) {
        //if (state.stuckCount >= options.stuckValue) {
            options.ignoreCreeps = false;
            options.freshMatrix = true;
            delete travelData.path;
        }
        // TODO:handle case where creep moved by some other function, but destination is still the same
        // delete path cache if destination is different
        if (!this.samePos(state.destination, destination)) {
            if (options.movingTarget && state.destination.isNearTo(destination)) {
                travelData.path += state.destination.getDirectionTo(destination);
                state.destination = destination;
            }
            else {
                delete travelData.path;
            }
        }
        if (options.repath && Math.random() < options.repath) {
            // add some chance that you will find a new path randomly
            delete travelData.path;
        }
        // pathfinding
        let newPath = false;
        let ret = null;
        if (!travelData.path) {
            newPath = true;
            if (creep.spawning) {
                return ERR_BUSY;
            }
            state.destination = destination;
            state.stuckCount = 0;
            if (options.useCachedPath && !options.freshMatrix && !options.repath) {
                // Lookup the key in our cache, if present.
                let roomName = Traveler.getCachedPathRoomName(creep.pos.roomName);
                let key = Traveler.getCachedPathKey(creep.pos, destination);
                if (Memory.cachedPath[roomName] && Memory.cachedPath[roomName][key]) {
                    travelData.path = Memory.cachedPath[roomName][key].path;
                    this.circle(creep.pos, "lime");
                    // console.log(`TRAVELER: useCachedPath for ${creep.name} ${creep.room.print} ${creep.pos.name}: ${key} ${travelData.path}`);
                }
            }
            if (!travelData.path) {
                let cpu = options.cpu ? Game.cpu.getUsed() : 0;
                ret = this.findTravelPath(creep, creep.pos, destination, options);
                let cpuUsed = options.cpu ? Game.cpu.getUsed() - cpu : 0;
                state.cpu = _.round(cpuUsed + state.cpu);
                if (state.cpu > REPORT_CPU_THRESHOLD) {
                    // see note at end of file for more info on this
                    // console.log(`TRAVELER: heavy cpu use: ${creep.name}, cpu: ${state.cpu} origin: ${creep.pos}, dest: ${destination}`);
                }
                let color = "orange";
                if (ret.incomplete) {
                    // uncommenting this is a great way to diagnose creep behavior issues
                    // console.log(`TRAVELER: incomplete path for ${creep.name}`);
                    color = "red";
                }
                if (options.returnData) {
                    options.returnData.pathfinderReturn = ret;
                }
                travelData.path = Traveler.serializePath(creep.pos, ret.path);
                Traveler.displayPath(creep.pos, ret.path, color);
            }
        }
        this.serializeState(creep, destination, state, travelData);
        if (!travelData.path || travelData.path.length === 0 || (ret && ret.incomplete)) {
        //if (!travelData.path || travelData.path.length === 0) {
            return ERR_NO_PATH;
        }
        // consume path
        if (state.stuckCount === 0 && !newPath) {
            travelData.path = travelData.path.substring(1);
        }
        let nextDirection = parseInt(travelData.path[0], 10);
        let nextPos;
        if (nextDirection) {
            nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);
        }
        if (options.returnData) {
            if (nextDirection) {
                nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);
                if (nextPos) {
                    options.returnData.nextPos = nextPos;
                }
            }
            options.returnData.state = state;
            options.returnData.path = travelData.path;
        }
        let myresult = creep.move(nextDirection);
        return myresult;
    }
    /**
     * make position objects consistent so that either can be used as an argument
     * @param destination
     * @returns {any}
     */
    static normalizePos(destination) {
        if (!(destination instanceof RoomPosition)) {
            return destination.pos;
        }
        return destination;
    }
    /**
     * check if room should be avoided by findRoute algorithm
     * @param roomName
     * @returns {RoomIntel|number}
     */
    static checkAvoid(roomName) {
        return RoomIntel.getAvoid(roomName);
    }
    /**
     * check if room is my property
     * @param roomName
     * @returns {RoomIntel|number}
     */
    static checkMy(roomName) {
        return RoomIntel.getMyManagement(roomName);
    }
    /**
     * check if room is reserved by another
     * @param roomName
     * @returns {RoomIntel|number}
     */
    static checkReservedByOtherPlayer(roomName) {
        return RoomIntel.getReservedByOtherPlayer(roomName);
    }
    /**
     * check if a position is an exit
     * @param pos
     * @returns {boolean}
     */
    static isExit(pos) {
        let coords = {
            0: true
            , 49: true
        }
        return coords[pos.x] || coords[pos.y];
        //return pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49;
    }
    /**
     * check two coordinates match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */
    static sameCoord(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }
    /**
     * check if two positions match
     * @param pos1
     * @param pos2
     * @returns {boolean}
     */
    static samePos(pos1, pos2) {
        return this.sameCoord(pos1, pos2) && pos1.roomName === pos2.roomName;
    }
    /**
     * draw a circle at position
     * @param pos
     * @param color
     * @param opacity
     */
    static circle(pos, color, opacity) {
        new RoomVisual(pos.roomName).circle(pos, {
            radius: .45, fill: "transparent", stroke: color, strokeWidth: .15, opacity: opacity
        });
    }
    /**
     * update memory on whether a room should be avoided based on controller owner
     * @param room
     */
    static updateRoomStatus(room) {
        if (!room) {
            return;
        }

        if (room.controller) {
            if (room.controller.owner && !room.controller.my) {
                room.memory.a = 1;  // avoid
            }
            else {
                delete room.memory.a;  // avoid
            }
        }
        else {
            delete room.memory.a;  // avoid
        }
    }
    /**
     * find a path from origin to destination
     * @param origin
     * @param destination
     * @param options
     * @returns {PathfinderReturn}
     */
    static findTravelPath(creep, origin, destination, options = {}) {
        // Set our options from the defaults and what was passed.
        options = _.defaults({}, _.clone(options), _defaults);

        if (options.movingTarget) {
            options.range = 0;
        }

        origin = this.normalizePos(origin);
        destination = this.normalizePos(destination);
        let originRoomName = origin.roomName;
        let destRoomName = destination.roomName;
        // check to see whether findRoute should be used
        let roomDistance = Game.map.getRoomLinearDistance(origin.roomName, destination.roomName);
        let allowedRooms = options.route;
        if (!allowedRooms && (options.useFindRoute || (options.useFindRoute === undefined && roomDistance > 2))) {
            let route = this.findRoute(origin.roomName, destination.roomName, options);
            if (route) {
                allowedRooms = route;
            }
        }
        let roomsSearched = 0;
        let callback = (roomName) => {
            if (allowedRooms) {
                if (!allowedRooms[roomName]) {
                    return false;
                }
            }
            else if (!options.allowHostile && Traveler.checkAvoid(roomName) && (roomName !== destRoomName) && (roomName !== originRoomName)) {
                return false;
            }
            roomsSearched++;
            let matrix;
            let room = Game.rooms[roomName];

            // No visiblity.
            if (!room) {
                matrix = new PathFinder.CostMatrix();

                // All matrixs have the following options applied.
                if (options.avoidSKResources && Cartographer.isSKRoom(roomName)) {
                    Traveler.addSKResourcesToMatrix(roomName, matrix, origin, destination);
                }

                // Are we avoiding portals on this trip? Most of the time yes, otherwise you will get warped.
                if (options.avoidPortals && Cartographer.isPortalRoom(roomName)) {
                    Traveler.addPortalsToMatrix(roomName, matrix);
                }
            }

            // Visibility.
            if (room) {
                // Determine the starting matrix. These are cached individually.
                // Are barriers weighted? Used for finding path of least resistance.
                // Are we including structures?
                // Are we including creeps?
                if (options.weightedBarriers) {
                    if (options.debug) room.logRoom(`TRAVELER: using getWeightedBarrierMatrix`);
                    matrix = this.getWeightedBarrierMatrix(room);
                }
                else if (options.ignoreStructures) {
                    if (options.debug) room.logRoom(`TRAVELER: ignoreStructures; creating new CostMatrix`);
                    matrix = new PathFinder.CostMatrix();
                    if (!options.ignoreCreeps) {
                        if (options.debug) room.logRoom(`TRAVELER: overlay addCreepsToMatrix`);
                        Traveler.addCreepsToMatrix(room, matrix);
                    }
                }
                else if (options.ignoreCreeps || (roomName !== originRoomName)) {
                    if (options.debug) room.logRoom(`TRAVELER: using getStructureMatrix`);
                    matrix = this.getStructureMatrix(room, options.freshMatrix, options);
                }
                else {
                    if (options.debug) room.logRoom(`TRAVELER: using getCreepMatrix`);
                    matrix = this.getCreepMatrix(room, options);
                }

                // All matrixs have the following options applied.
                if (options.avoidSKResources && Cartographer.isSKRoom(roomName)) {
                    if (options.debug) room.logRoom(`TRAVELER: overlay addSKResourcesToMatrix`);
                    matrix = matrix.clone();
                    Traveler.addSKResourcesToMatrix(room.name, matrix, origin, destination);
                }

                // All matrixs have the following options applied.
                if (options.avoidExitArea) {
                    if (options.debug) room.logRoom(`TRAVELER: overlay addExitAreaToMatrix`);
                    matrix = matrix.clone();
                    Traveler.addExitAreaToMatrix(room, matrix);
                }

                // Are we avoiding portals on this trip? Most of the time yes, otherwise you will get warped.
                if (options.avoidPortals && Cartographer.isPortalRoom(roomName)) {
                    if (options.debug) room.logRoom(`TRAVELER: overlay addPortalsToMatrix`);
                    matrix = matrix.clone();
                    Traveler.addPortalsToMatrix(room.name, matrix);
                }

                // If we are only looking in the current room, then add all exits as obstacles to prevent creeps from slipping into neighboring rooms.
                if (options.maxRooms == 1) {
                    options['obstacles'] = (options['obstacles'] || []).concat(room.exits);
                }

                // Where custom obstacles passed in?
                if (options.obstacles) {
                    matrix = matrix.clone();
                    for (let obstacle of options.obstacles) {
                        if (obstacle) {
                            // RoomPositions might have been passed in as obsticles.
                            if (obstacle instanceof RoomPosition) {
                                if (obstacle.roomName !== roomName) {
                                    continue;
                                }
                                matrix.set(obstacle.x, obstacle.y, 0xff);
                            }
                            else {
                                if (obstacle.pos.roomName !== roomName) {
                                    continue;
                                }
                                matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
                            }
                        }
                    }
                }
            }
            if (options.roomCallback) {
                if (!matrix) {
                    matrix = new PathFinder.CostMatrix();
                }
                let outcome = options.roomCallback(roomName, matrix.clone());
                if (outcome !== undefined) {
                    return outcome;
                }
            }
            return matrix;
        };

        // Get the cost of this creeps movement, and add in whoever it might be pulling.
        // Power creeps have a 0 cost for movement so detect if this is a creep vs powercreep.
        let plainCost = 0;
        let swampCost = 0;
        if (!creep || !creep.powers) {
            plainCost = creep ? creep.moveCostPlain : 2;
            swampCost = creep ? creep.moveCostSwamp : 10;
        }
        let pathFinderOptions = {
            maxOps: options.maxOps,
            maxRooms: options.maxRooms,
            flee: options.flee,
            plainCost: options.offRoad ? 1 : options.ignoreRoads ? 1 : plainCost,
            swampCost: options.offRoad ? 1 : options.ignoreRoads ? 5 : swampCost,
            roomCallback: callback,
        }
        let ret = PathFinder.search(origin, { pos: destination, range: options.range }, pathFinderOptions);
        if (ret.incomplete && options.ensurePath) {
            if (options.useFindRoute === undefined) {
                // handle case where pathfinder failed at a short distance due to not using findRoute
                // can happen for situations where the creep would have to take an uncommonly indirect path
                // options.allowedRooms and options.routeCallback can also be used to handle this situation
                if (roomDistance <= 2) {
                    if (options.debug) console.log(`TRAVELER: path failed without findroute, trying with options.useFindRoute = true from: ${origin}, destination: ${destination}`);
                    options.useFindRoute = true;
                    ret = this.findTravelPath(creep, origin, destination, options);
                    if (options.debug) console.log(`TRAVELER: second attempt was ${ret.incomplete ? "not " : ""}successful`);
                    return ret;
                }
                // TODO: handle case where a wall or some other obstacle is blocking the exit assumed by findRoute
            }
            else {
            }
        }

        // Save a copy of this path for use in travelTo.
        // TODO: how to expire/delete old cached paths?
        if (options.cachePath) {
            let roomName = Traveler.getCachedPathRoomName(origin.roomName);
            if (!Memory.cachedPath[roomName]) Memory.cachedPath[roomName] = {};
            // Need to adjust origin to remove the first step.
            let adjustedOrigin = origin;
            let adjustedPath = ret.path;
            if (ret && ret.path && !ret.incomplete && !options.includeOriginStep) {
                adjustedOrigin = ret.path[0];
                adjustedPath = [...ret.path].slice(-(ret.path.length-1));
            }

            let key = Traveler.getCachedPathKey(adjustedOrigin, destination);
            if (!ret || !ret.path || ret.incomplete) {
                delete Memory.cachedPath[roomName][key];
            } else {
                Memory.cachedPath[roomName][key] = {};
                Memory.cachedPath[roomName][key].path = Traveler.serializePath(adjustedOrigin, adjustedPath);
                Memory.cachedPath[roomName][key].t = packTime(Game.time);
            }
        }

        return ret;
    }
    /**
     * find a viable sequence of rooms that can be used to narrow down pathfinder's search algorithm
     * @param origin
     * @param destination
     * @param options
     * @returns {{}}
     */
    static findRoute(origin, destination, options = {}) {
        // Set our options from the defaults and what was passed.
        options = _.defaults({}, _.clone(options), _defaults);

        let restrictDistance = options.restrictDistance || Game.map.getRoomLinearDistance(origin, destination) + 10;

        // The logic is a little tricky. If highway bias is enabled, we bump up the normal bias and treat highway as 1.
        let normalBias = 1;
        if (options.preferHighway) {
            normalBias = 2.5;
            if (options.highwayBias) {
                normalBias = options.highwayBias;
            }
        }

        let ret = Game.map.findRoute(origin, destination, {
            routeCallback: (roomName) => {
                if (options.routeCallback) {
                    let outcome = options.routeCallback(roomName);
                    if (outcome !== undefined) {
                        return outcome;
                    }
                }

                // Test for range.
                let rangeToRoom = Game.map.getRoomLinearDistance(origin, roomName);
                if (rangeToRoom > restrictDistance) {
                    // room is too far out of the way
                    return Number.POSITIVE_INFINITY;
                }

                // Rooms under our management are always preferred.
                if (Traveler.checkMy(roomName)) {
                    return 0.5;
                }

                // Rooms reserved by other players are discouraged, but not totally ignored.
                if (Traveler.checkReservedByOtherPlayer(roomName)) {
                    return 2 * normalBias;
                }

                // Test for avoid room flag.
                if (!options.allowHostile && roomName !== destination && roomName !== origin && Traveler.checkAvoid(roomName)) {
                    // room is marked as "avoid" in room memory
                    return Number.POSITIVE_INFINITY;
                }

                // Do we prefer highway travel?
                if (options.preferHighway) {
                    if (Cartographer.isHighwayRoom(roomName)) {
                        return 1;
                    }
                }

                // SK rooms are avoided when there is no vision in the room, harvested-from SK rooms are allowed
                if (!options.allowSK && !Game.rooms[roomName]) {
                    if (Cartographer.isSKRoom(roomName)) {
                        return 5 * normalBias;
                    }
                }

                // Return the normal room.
                return normalBias;
            },
        });
        if (!_.isArray(ret)) {
            //console.log(`Traveler: couldn't findRoute from ${origin} to ${destination}`);
            return;
        }
        // origin and destination are allowed.
        let allowedRooms = { [origin]: true };
        for (let value of ret) {
            allowedRooms[value.room] = true;
        }
        allowedRooms[destination] = true;
        return allowedRooms;
    }
    /**
     * check how many rooms were included in a route returned by findRoute
     * @param origin
     * @param destination
     * @returns {number}
     */
    static findRouteDistance(origin, destination, options) {
        let linearDistance = Game.map.getRoomLinearDistance(origin, destination);
        if (linearDistance >= 32) {
            return linearDistance;
        }
        let allowedRooms = this.findRoute(origin, destination, options);
        if (allowedRooms) {
            return Object.keys(allowedRooms).length - 1;
        }
    }
    static findRouteRooms(origin, destination, options) {
        let linearDistance = Game.map.getRoomLinearDistance(origin, destination);
        if (linearDistance >= 32) {
            return linearDistance;
        }
        let allowedRooms = this.findRoute(origin, destination, options);
        if (allowedRooms) {
            return Object.keys(allowedRooms);
        }
    }

    /**
     * build a cost matrix based on structures in the room. Will be cached for more than one tick. Requires vision.
     * @param room
     * @param freshMatrix
     * @returns {any}
     */
    static getStructureMatrix(room, freshMatrix, options) {
        if (!this.structureMatrixCache[room.name] || (freshMatrix && Game.time !== this.structureMatrixTick)) {
            this.structureMatrixTick = Game.time;
            let matrix = new PathFinder.CostMatrix();
            this.structureMatrixCache[room.name] = Traveler.addStructuresToMatrix(room, matrix, 1, options);
        }
        return this.structureMatrixCache[room.name];
    }
    /**
     * build a cost matrix based on creeps and structures in the room. Will be cached for one tick. Requires vision.
     * @param room
     * @returns {any}
     */
    static getCreepMatrix(room, options) {
        if (!this.creepMatrixCache[room.name] || Game.time !== this.creepMatrixTick) {
            this.creepMatrixTick = Game.time;
            this.creepMatrixCache[room.name] = Traveler.addCreepsToMatrix(room, this.getStructureMatrix(room, true, options).clone());
        }
        return this.creepMatrixCache[room.name];
    }
    /**
     * build a cost matrix based on just weighted barriers in the room. Will be cached for one tick. Requires vision.
     * @param room
     * @returns {any}
     */
    static getWeightedBarrierMatrix(room) {
        if (!this.weightedBarrierMatrixCache[room.name] || Game.time !== this.weightedBarrierMatrixTick) {
            this.weightedBarrierMatrixTick = Game.time;
            let matrix = new PathFinder.CostMatrix();
            this.weightedBarrierMatrixCache[room.name] = Traveler.addWeightedBarriersToMatrix(room, matrix);
        }
        return this.weightedBarrierMatrixCache[room.name];
    }

    /**
     * add structures to matrix so that impassible structures can be avoided and roads given a lower cost
     * @param room
     * @param matrix
     * @param roadCost
     * @returns {CostMatrix}
     */
    static addStructuresToMatrix(room, matrix, roadCost, options) {
        let avoid = {};
        let impassibleStructures = [];

        // Mark the source harvesting pos as more difficult to pass through.
        if (room.myManagement) {
            room.sources.forEach(source => {
                let pos = source.harvestPos;
                if (pos) {
                    matrix.set(pos.x, pos.y, 20);
                    avoid[pos.x + '_' + pos.y] = true;
                }
            })
        }

        // Mark the mineral harvesting nips as more difficult to pass through.
        if (room.my || room.isCenterRoom) {
            // Assuming only 1 mineral per room.
            let xyArea = room.mineral.xyInRange1;
            xyArea.forEach(pos => {
                matrix.set(pos.x, pos.y, 20);
                avoid[pos.x + '_' + pos.y] = true;
            })
            // Assuming multiple minerals per room.
            // room.minerals.forEach(mineral => {
            //     let xyArea = mineral.xyInRange1;
            //     xyArea.forEach(pos => {
            //         matrix.set(pos.x, pos.y, 20);
            //         avoid[pos.x + '_' + pos.y] = true;
            //         if (options.debug) room.logRoom(`TRAVELER: addStructuresToMatrix; adding mineral.nip ${pos.x},${pos.y}`);
            //     })
            // })

            // Temples and center rooms also need to make room range 2 so that jackasses don't block.
            if (room.isCenterRoom || room.isTemple) {
                let xyArea = room.mineral.xyOfRange2;
                xyArea.forEach(pos => {
                    matrix.set(pos.x, pos.y, 20);
                    avoid[pos.x + '_' + pos.y] = true;
                })
            }
        }

        // Mark the area around controller as more difficult to pass through.
        if (room.claimFlag && !room.atMaxLevel) {
            // While upgrading the range 3 spots are basically a no-go zone unless you are purposing upgrading the controller.
            let xyArea3 = room.controller.coordInRange3NotNearEdge;
            xyArea3.forEach(pos => {
                matrix.set(pos.x, pos.y, 10);
                avoid[pos.x + '_' + pos.y] = true;
            })
            // let xyArea3 = room.controller.coordInRange3NotNearEdge;
            // xyArea3.forEach(pos => {
            //     matrix.set(pos.x, pos.y, 15);
            //     avoid[pos.x + '_' + pos.y] = true;
            // })
            // // The range 4 ring is more swampy, discouraging creeps from walking in it normally.
            // let xyArea4 = room.controller.coordOfRange4NotNearEdge;
            // xyArea4.forEach(pos => {
            //     matrix.set(pos.x, pos.y, 5);
            //     avoid[pos.x + '_' + pos.y] = true;
            // })
        } else if (room.controller) {
            // Could be an enemy room or a reserved room, or our maxed room.
            let xyArea = room.controller.coordInRange1NotNearEdge;
            xyArea.forEach(pos => {
                matrix.set(pos.x, pos.y, 20);
                avoid[pos.x + '_' + pos.y] = true;
            })
        }

        // Mark the colony flag as an obsticle. King will be there perminately.
        if (room.my && room.colonyKingPos) {
            let pos = room.colonyKingPos;
            impassibleStructures.push(pos);
        }

        // Mark the colony flag as an obsticle. King will be there perminately.
        if (room.my && room.colonyQueenPos) {
            let pos = room.colonyQueenPos;
            impassibleStructures.push(pos);
        }

        // Mark colony renew spot and all colony parking spots as more difficult to pass through.
        if (room.my && room.colonyFlag) {
            let pos = room.colonyRenewPos;
            matrix.set(pos.x, pos.y, 20);
            avoid[pos.x + '_' + pos.y] = true;

            room.colonyParking.forEach(pos => {
                matrix.set(pos.x, pos.y, 20);
                avoid[pos.x + '_' + pos.y] = true;
            })

            // Don't forget power creep renew location.
            pos = room.colonyPowerCreepRenewPos;
            if (pos) {
                matrix.set(pos.x, pos.y, 20);
                avoid[pos.x + '_' + pos.y] = true;
            }
        }

        // Mark the invader stronghold structure nips as more difficult (but not impossible) to pass through.
        if (room.isSKRoom && RoomIntel.getStrongholdInvaderCoreHitsByRoomName(room.name) && room.invaderStronghold && (room.invaderStronghold.level > 1)) {
            room.invaderStructures.forEach(structure => {
                let positions = structure.nips;
                positions.forEach(pos => {
                    matrix.set(pos.x, pos.y, 254);
                    avoid[pos.x + '_' + pos.y] = true;
                });
            })
        }

        // Structures will override any difficult terrain defined above.
        // Except for roads, those get applied only if no obsticles above.
        for (let structure of room.structures) {
            if (structure instanceof StructureRampart) {
                if (!structure.my && !structure.isPublic) {
                    impassibleStructures.push(structure);
                    avoid[structure.pos.x + '_' + structure.pos.y] = true;
                }
            }
            else if (C.OBSTACLE_OBJECT_TYPES_HASH[structure.structureType]) {
                impassibleStructures.push(structure);
            }
            else if (avoid[structure.pos.x + '_' + structure.pos.y]) {
                // Ignore this spot, it is already set to be difficult terrain.
            }
            else if (structure instanceof StructureRoad) {
                matrix.set(structure.pos.x, structure.pos.y, roadCost);
            }
        }

        // Add structure construction sites as positions that are not passable.
        // This will prevent creeps from standing on construction sites preventing them from building.
        // Hostile construction sites can and should be stomped on freely.
        // Road construction sites should be treated as normal roads to prevent creating multiple trail paths.
        for (let site of room.myConstructionSites) {
            if ((site.structureType === STRUCTURE_ROAD) && !site.pos.isTerrainWall) {
                matrix.set(site.pos.x, site.pos.y, roadCost);
            }
            else if (C.OBSTACLE_OBJECT_TYPES_HASH[site.structureType]) {
                impassibleStructures.push(site);
            }
        }

        // Add impassible structures to the matrix.
        for (let structure of impassibleStructures) {
            if (structure.pos) {
                matrix.set(structure.pos.x, structure.pos.y, 0xff);
            }
            else {
                matrix.set(structure.x, structure.y, 0xff);
            }
        }

        return matrix;
    }
    /**
     * add creeps to matrix so that they will be avoided by other creeps
     * @param room
     * @param matrix
     * @returns {CostMatrix}
     */
    static addCreepsToMatrix(room, matrix) {
        // Using myCreeps (which is based off Game.creeps) vs Room.creeps (which is a FIND) can save some CPU but will collide with hostiles.
        let creeps = room.my ? room.myCreeps : room.creeps;
        // Allies could be in other rooms, but can safely be excluded from our rooms.
        if (room.isHighwayRoom) creeps = creeps.concat(room.allies);
        creeps.forEach((creep) => matrix.set(creep.pos.x, creep.pos.y, 0xff));

        let powerCreep = room.powerCreep;
        if (powerCreep && powerCreep.pos && (powerCreep.pos.roomName === room.name)) {
            matrix.set(powerCreep.pos.x, powerCreep.pos.y, 0xff)
        }

        return matrix;
    }

    /**
     * add portals to matrix so that they will be avoided by creeps
     * @param room
     * @param matrix
     * @returns {CostMatrix}
     */
    static addPortalsToMatrix(roomName, matrix) {
        let portals = RoomIntel.getPortalPosList(roomName);
        portals.forEach(pos => matrix.set(pos.x, pos.y, 0xff));
        return matrix;
    }

    /**
     * add barriers to matrix using their hit points as cost. Stronger walls means more difficult to pass.
     * Novice walls are impassible.
     * We take the fraction maximum value of the barrier as related to the maximum value of a matrix cost; 254. Note 255 is impassible.
     * The minimum amount of a wall piece is 50, so the pathing will only go thru walls if absolutely needed.
     * @param room
     * @param matrix
     * @returns {CostMatrix}
     */
    static addWeightedBarriersToMatrix(room, matrix) {
        // To help get a better estimate, use the strongest barrier as the maximum up to WALL_HITS_MAX.
        let hitsMax = WALL_HITS_MAX;
        if (room.barriers) {
            hitsMax = room.barriersSorted[room.barriersSorted.length - 1].hits;
        }
        room.barriers.forEach(barrier => matrix.set(barrier.pos.x, barrier.pos.y, 50 + Math.floor((barrier.hits/hitsMax)*204)));
        room.noviceWalls.forEach(barrier => matrix.set(barrier.pos.x, barrier.pos.y, 0xff));
        return matrix;
    }

    /**
     * Add difficult terrain around source keeper resources at range 4 so that they will be avoided by other creeps.
     * Hostiles will naturally move to position closest to resource, so they will be 1 away.
     * Then add 3 to be out of attack range, so total range 4 should never aggro.
     * Note that we don't want to override any value already in place for this spot, like creeps which are 255 and already added.
     * @param room
     * @param matrix
     * @param distance
     * @returns {CostMatrix}
     */
    static addSKResourcesToMatrix(roomName, matrix, origin, destination) {
        // 244 is not impossible to pass thru, but damn near it.
        const myManagement = RoomIntel.getMyManagement(roomName);
        const weight = myManagement ? 15 : 254;

        // Block out spots in rangedAttack 3 of the keeper guard position.
        let keepers = RoomIntel.getSourceKeeperPosList(roomName);
        keepers.forEach((keeper) => {
            if (
                (!origin || !origin.inRange3(keeper))
                && (!destination || !destination.inRange3(keeper))
            ) {
                // Taking the max here, as we are purposely overriding low cost roads.
                keeper.xyInRange3.forEach(coord => matrix.set(coord.x, coord.y, Math.max(weight, matrix.get(coord.x, coord.y))));
                //if (roomName === 'W6N54') console.log('Traveler: ', roomName, origin, destination, 'Adding keeper.xyInRange3 of weight', weight, keeper)
            }
            else {
                // Avoid the actual keeper position if trying to move into its zone, as to not get stuck.
                matrix.set(keeper.x, keeper.y, Math.max(weight, matrix.get(keeper.x, keeper.y)));
                //if (roomName === 'W6N54') console.log('Traveler: ', roomName, origin, destination, 'Adding keeper.pos of weight', weight, keeper)
            }
        });

        // Expect keeper to move a bit from the starting spot, although sometimes (ideally) he will be blocked in by Executor.
        let lairs = RoomIntel.getKeeperLairPosList(roomName);
        lairs.forEach((lair) => {
            // Range 4 from the lair as this is where the fighting will happen with Executioners.
            if (
                myManagement
                && (!origin || !origin.inRange4(lair))
                && (!destination || !destination.inRange4(lair))
            ) {
                // Taking the max here, as we are purposely overriding low cost roads.
                lair.xyInRange4.forEach(coord => matrix.set(coord.x, coord.y, Math.max(weight, matrix.get(coord.x, coord.y))));
                //if (roomName === 'W6N54') console.log('Traveler: ', roomName, origin, destination, 'Adding lair.xyInRange4 of weight', weight, lair)
            }
            // Range 3 from the lair as optimistically the keeper will have moved to his guarding spot.
            else if (
                !myManagement
                && (!origin || !origin.inRange3(lair))
                && (!destination || !destination.inRange3(lair))
            ) {
                // Taking the max here, as we are purposely overriding low cost roads.
                lair.xyInRange3.forEach(coord => matrix.set(coord.x, coord.y, Math.max(weight, matrix.get(coord.x, coord.y))));
                //if (roomName === 'W6N54') console.log('Traveler: ', roomName, origin, destination, 'Adding lair.xyInRange3 of weight', weight, lair)
            }
            else {
                // Melee range of source keeper should be avoided at all cost.
                lair.xyInRange1.forEach(coord => matrix.set(coord.x, coord.y, Math.max(weight, matrix.get(coord.x, coord.y))));
                //if (roomName === 'W6N54') console.log('Traveler: ', roomName, origin, destination, 'Adding lair.xyInRange1 of weight', weight, lair)
            }
        });

        return matrix;
    }

    /**
     * Add difficult terrain around exit areas so less time is spent on them, or avoided when traveling along the edge.
     * Useful for base building, when you want to build perimeter barriers.
     * Note that we don't want to override any value already in place for this spot, like creeps which are 255 and already added.
     * @param room
     * @param matrix
     * @param distance
     * @returns {CostMatrix}
     */
    static addExitAreaToMatrix(room, matrix) {
        // Mark all areas around exits as diffiult, to have creeps avoid walking on them.
        // Bad peformance tho, as there are a lot of these spots, so use a pre-cached area of spots.
        if ((room.my && room.colonyFlag && room.claimFlag) || room.colonyTestFlag) {
            // We are purposely allowing existing low cost roads, except if they are marked as zero/undefined.
            room.perimeterBarrierCoords.forEach(coord => matrix.set(coord.x, coord.y, matrix.get(coord.x, coord.y) || 15));
        }

        return matrix;
    }

    /**
     * serialize a path, traveler style. Returns a string of directions.
     * @param startPos
     * @param path
     * @param color
     * @returns {string}
     */
    static serializePath(startPos, path) {
        let serializedPath = "";
        let lastPosition = startPos;
        for (let position of path) {
            if (position.roomName === lastPosition.roomName) {
                serializedPath += lastPosition.getDirectionTo(position);
            }
            lastPosition = position;
        }
        return serializedPath;
    }
    static displayPath(startPos, path, color = "orange") {
        let lastPosition = startPos;
        this.circle(startPos, color);
        for (let position of path) {
            if (position.roomName === lastPosition.roomName) {
                new RoomVisual(position.roomName)
                    .line(position, lastPosition, { color: color, lineStyle: "dashed" });
            }
            lastPosition = position;
        }
        return;
    }
    static getCachedPathRoomName(roomName) {
        return packRoomName(roomName);
        //return roomName;
    }
    static getCachedPathKey(origin, destination) {
        return packPos(origin) + packPos(destination);
        //return origin.name + '-' + destination.name;
    }
    /**
     * returns a position at a direction relative to origin
     * @param origin
     * @param direction
     * @returns {RoomPosition}
     */
    static positionAtDirection(origin, direction) {
        let offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
        let offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
        let x = origin.x + offsetX[direction];
        let y = origin.y + offsetY[direction];
        if (x > 49 || x < 0 || y > 49 || y < 0) {
            return;
        }
        return new RoomPosition(x, y, origin.roomName);
    }
    /**
     * convert room avoidance memory from the old pattern to the one currently used
     * @param cleanup
     */
    static patchMemory(cleanup = false) {
        if (!Memory.empire) {
            return;
        }
        if (!Memory.empire.hostileRooms) {
            return;
        }
        let count = 0;
        for (let roomName in Memory.empire.hostileRooms) {
            if (Memory.empire.hostileRooms[roomName]) {
                if (!Memory.rooms[roomName]) {
                    Memory.rooms[roomName] = {};
                }
                Memory.rooms[roomName].a = 1;  // avoid
                count++;
            }
            if (cleanup) {
                delete Memory.empire.hostileRooms[roomName];
            }
        }
        if (cleanup) {
            delete Memory.empire.hostileRooms;
        }
        console.log(`TRAVELER: room avoidance data patched for ${count} rooms`);
    }
    static deserializeState(travelData, destination) {
        let state = {};
        if (travelData.state) {
            state.lastCoord = { x: travelData.state[STATE_PREV_X], y: travelData.state[STATE_PREV_Y] };
            state.cpu = travelData.state[STATE_CPU];
            state.stuckCount = travelData.state[STATE_STUCK];
            state.destination = new RoomPosition(travelData.state[STATE_DEST_X], travelData.state[STATE_DEST_Y], travelData.state[STATE_DEST_ROOMNAME]);
        }
        else {
            state.cpu = 0;
            state.destination = destination;
        }
        return state;
    }
    static serializeState(creep, destination, state, travelData) {
        travelData.state = [creep.pos.x, creep.pos.y, state.stuckCount, state.cpu, destination.x, destination.y, destination.roomName];
    }
    static isStuck(creep, state) {
        let stuck = false;
        if (state.lastCoord !== undefined) {
            if (this.sameCoord(creep.pos, state.lastCoord)) {
                // didn't move
                stuck = true;
            }
            else if (this.isExit(creep.pos) && this.isExit(state.lastCoord)) {
                // moved against exit
                stuck = true;
            }
        }
        return stuck;
    }
}

Traveler.structureMatrixCache = {};
Traveler.creepMatrixCache = {};
Traveler.weightedBarrierMatrixCache = {};

exports.Traveler = Traveler;
module.exports = Traveler;

// assigns a function to Creep.prototype: creep.travelTo(destination)
Creep.prototype.travelTo = function (destination, options) {
    return Traveler.travelTo(this, destination, options);
};

// assigns a function to PowerCreep.prototype: powercreep.travelTo(destination)
PowerCreep.prototype.travelTo = function (destination, options) {
    return Traveler.travelTo(this, destination, options);
};
