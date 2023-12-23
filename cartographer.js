"use strict";

let _findRouteDistance = {};
let _findRouteRooms = {};
let _getSectorRooms = {};
let _getSectorControllerRooms = {};
let _sectorArea = {};
let _sectorAreaHash = {};
let _getHighwayRooms = {};
let _describeExits = {};
let _describeExitRooms = {};
let _describeExitRoomsHash = {};
let _roomTypes = {};
let _sector = {};
let _isRoomInSector = {};
let _findExitPos = {};
let _findRoomRange = {};
let _findRoomDistance = {};
let _getSectorCenterRooms = {};
let _getSectorSKRooms = {};
let _isSKAccessRoom = {};
let _getHighwayGroup = {};
let _getAccessibleHighways = {};
let _getSectorCoreRoom = {};
let _isCoreAccessRoom = {};
let _getQuadrant = {};

/**
 * Cartographer: provides helper methods related to Game.map. A few of these methods have been modified from BonzAI
 * codebase, although I have introduced new methods of my own over time as well.
 */
class Cartographer {

	static get ROOMTYPE_SOURCEKEEPER() { return 'SK'; }
	static get ROOMTYPE_CORE() { return 'CORE'; }
	static get ROOMTYPE_CONTROLLER() { return 'CTRL'; }
	static get ROOMTYPE_HIGHWAY_CORRIDOR() { return 'HIGHWAY_CORRIDOR'; }
	static get ROOMTYPE_HIGHWAY_CORNER() { return 'HIGHWAY_CORNER';	}

	static findClosestRoomsByDistance(origin, destinations, debug = false) {
		let rooms = [];
		let closest = Number.POSITIVE_INFINITY;
		// Sort the destination list by raw distance (not route). Closest first.
		destinations = _.sortBy(destinations, s => this.findRoomDistance(origin, s));

		for (let i = 0; i < destinations.length; i++) {
			// Stop when the raw distance is greater than the closest room found so far.
			// There is no chance any room past this point could be closer since they are already sorted.
			if (closest < this.findRoomDistance(origin, destinations[i])) break;

			// Get the actual route distance that a creep would path thru.
			let distance = this.findRouteDistance(origin, destinations[i]);

			if (debug) console.log('findClosestRoomsByDistance info', origin, destinations[i], distance)

			// Found a closer one, so clear the list completely.
			if (distance < closest) {
				rooms = [];
				if (debug) console.log('findClosestRoomsByDistance resetting rooms', rooms)
			}
			if (distance <= closest) {
				closest = distance;
				rooms.push(destinations[i]);
				if (debug) console.log('findClosestRoomsByDistance adding room', closest, rooms)
			}
		}
		return rooms;
	}

	static findRouteDistance(origin, otherRoom) {
		let packedOrigin = packRoomName(origin);
		let packedOtherRoom = packRoomName(otherRoom);
		let key = (origin <= otherRoom) ? packedOrigin + packedOtherRoom : packedOtherRoom  + packedOrigin;
		let distance = null;

		// If we have plenty of CPU, use the more expensive "true" route distance.
		if (GameManager.isCpuMaxed && (!_findRouteDistance[key] || (_findRouteDistance[key] + Config.params.CARTOGRAPHER_CACHE_RECENT_TICKS < Game.time))) {
			distance = Traveler.findRouteDistance(origin, otherRoom);
			_findRouteDistance[key] = Game.time;
			if (typeof distance === "undefined") distance = 99;
		}
		else {
			// We already have found this distance, return it.
			if (typeof Memory.findRouteDistance[key] !== "undefined") return Memory.findRouteDistance[key];

			// Make the expensive call to find the route distance.
			let keyMessage = (origin <= otherRoom) ? origin + '-' + otherRoom : otherRoom + '-' + origin;
			console.log('🗺️ Cartographer.findRouteDistance using Traveler.findRouteDistance as', keyMessage, '(' + key + ') is not cached')
			distance = Traveler.findRouteDistance(origin, otherRoom);
			if (typeof distance === "undefined") distance = 99;
		}

		// Cache the calculated distance.
		Memory.findRouteDistance[key] = distance;

		// Return our distance.
		return distance;
	}

	static isInRouteDistance(origin, otherRoom, range) {
		// Do a sanity check to see if room is even possibly in range.
		if (this.findRoomDistance(origin, otherRoom) > range) return false;

		// Perform the actual calculation of room distance.
		return (this.findRouteDistance(origin, otherRoom) <= range);
	}

	static findRouteRooms(origin, otherRoom, options = {}) {
		let packedOrigin = packRoomName(origin);
		let packedOtherRoom = packRoomName(otherRoom);
		let reversed = (origin > otherRoom);
		let key = reversed ? packedOtherRoom + packedOrigin : packedOrigin + packedOtherRoom;
		let rooms = [];

		// If we have plenty of CPU, use the more expensive "true" route distance.
		if ((GameManager.isCpuMaxed || options.force) && (!_findRouteRooms[key] || (_findRouteRooms[key] + Config.params.CARTOGRAPHER_CACHE_RECENT_TICKS < Game.time))) {
			rooms = Traveler.findRouteRooms(origin, otherRoom);
			_findRouteRooms[key] = Game.time;
		}
		else {
			// We already have found this route, return it.
			if (Memory.findRouteRooms[key] !== undefined) {
				rooms = Memory.findRouteRooms[key].map(m => unpackRoomName(m));
				return reversed ? rooms.slice().reverse() : rooms;
			}

			// Call our Traveler routine to find rooms.
			// This is a smart function and will ignore rooms being avoided.
			let keyMessage = reversed ? otherRoom + '-' + origin : origin + '-' + otherRoom;
			console.log('🗺️ Cartographer.findRouteRooms using Traveler.findRouteRooms as', keyMessage, '(' + key + ') is not cached')
			rooms = Traveler.findRouteRooms(origin, otherRoom);
		}

		// Normalize the result. Could be an array of room names (including length 1 when origin==otherRoom)
		// or could be a number if the path is too long, or could be undefined if can't reach room.
		if (!Array.isArray(rooms)) rooms = [];

		// Save the calculated result.
		let cacheRooms = reversed ? rooms.slice().reverse() : rooms;
		Memory.findRouteRooms[key] = cacheRooms.map(m => packRoomName(m));

		// Reverse our output if needed.
		return rooms;
	}

	/**
	 * Determines if all rooms between origin and otherRoom are currently visible.
	 */
	static areAllRouteRoomsVisible(origin, otherRoom) {
		let roomNames = this.findRouteRooms(origin, otherRoom)
		return roomNames.every(roomName => Game.rooms[roomName]);
	}

	/**
	 * Returns an hash of room names (key & value) that this room has exits to.
	 */
	static describeExits(roomName) {
		if (typeof _describeExits[roomName] !== "undefined") return _describeExits[roomName];
		_describeExits[roomName] = Game.map.describeExits(roomName);
		return _describeExits[roomName];
	}

	/**
	 * Returns an array of room names that this room has exits to.
	 */
	static describeExitRooms(roomName) {
		if (typeof _describeExitRooms[roomName] !== "undefined") return _describeExitRooms[roomName];
		_describeExitRooms[roomName] = Object.values(this.describeExits(roomName));
		return _describeExitRooms[roomName];
	}

	/**
	 * Returns an array of room names that this room has exits to.
	 */
	static describeExitRoomsHash(roomName) {
		if (typeof _describeExitRoomsHash[roomName] !== "undefined") return _describeExitRoomsHash[roomName];
		_describeExitRoomsHash[roomName] = utils.arrayToHash(Object.values(this.describeExits(roomName)), 1);
		return _describeExitRoomsHash[roomName];
	}

	static findExitPos(fromRoom, toRoom) {
		let key = fromRoom + '_' + toRoom;

		// We already have found this distance, return it.
		if (typeof _findExitPos[key] !== "undefined") return _findExitPos[key];

		// We need visibility in room to see the controller
		let room = Game.rooms[fromRoom];
		if (!room) return ERR_NO_PATH;

		const exitDir = Game.map.findExit(fromRoom, toRoom);
		_findExitPos[key] = room.controller.pos.findClosestByRange(exitDir);

		// Return our exit.
		return _findExitPos[key];
	}

	/**
	 * Return array of room names that are within specified range.
	 */
	static getRoomsInRange(roomName, range) {
		return Object.keys(this.getRoomsInRangeHash(roomName, range));
	}

	/**
	 * Return array of room names that are within specified range.
	 */
	static getRoomsInRangeHash(roomName, range) {
		let results = {};
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				results[room] = room;
			}
		}
		return results;
	}

	/**
	 * Return array of room names that are within specified distance (diamond).
	 */
	static getRoomsInDistance(roomName, distance) {
		return Object.keys(this.getRoomsInDistanceHash(roomName, distance));
	}

	/**
	 * Return array of room names that are within specified distance (diamond).
	 */
	static getRoomsInDistanceHash(roomName, distance) {
		let results = {};
		for (let y=-distance; y<=distance; y++) {
			for (let x=-distance; x<=distance; x++) {
				if (Math.abs(x) + Math.abs(y) <= distance) {
					let room = this.findRelativeRoomName(roomName, x, y);
					results[room] = room;
				}
			}
		}
		return results;
	}

	/**
	 * Return array of room names that are within specified distance (diamond).
	 */
	static getRoomsInRouteDistance(roomName, distance) {
		return Object.keys(this.getRoomsInRouteDistanceHash(roomName, distance));
	}

	static getRoomsInRouteDistanceHash(roomName, distance) {
		// Get the list of potential candiates based on distance only.
		let candidates = this.getRoomsInDistance(roomName, distance);

		// Find the actual route distance, and if in our desired value then add it to the return hash.
		let rooms = {};
		candidates.forEach(candiate => {
			let routeDistance = this.findRouteDistance(candiate, roomName);
			if (routeDistance <= distance) {
				rooms[candiate] = routeDistance;
			}
		})
		return rooms;
	}

	/**
	 * Return array of room names that are in this sector within specified range.
	 */
	static getSectorRoomsInRange(roomName, range) {
		let results = [];
		let sector = this.getSector(roomName);
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if (this.getSector(room) === sector) results.push(room);
			}
		}
		return results;
	}

	/**
	 * Return array of controller room names that are in this sector within specified range.
	 */
	static getSectorControllerRoomsInRange(roomName, range) {
		let results = [];
		let sector = this.getSector(roomName);
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if ((this.getSector(room) === sector) && this.isControllerRoom(room)) results.push(room);
			}
		}
		return results;
	}

	/**
	 * Return array of highway room names that are within specified range.
	 */
	static getHighwayRoomsInRange(roomName, range) {
		let results = [];
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if (this.isHighwayRoom(room)) results.push(room);
			}
		}
		return results;
	}

	/**
	 * Return array of highway room names that are within specified distance.
	 */
	static getHighwayRoomsInDistance(roomName, range) {
		let results = [];
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				if (Math.abs(x) + Math.abs(y) <= range) {
					let room = this.findRelativeRoomName(roomName, x, y);
					if (this.isHighwayRoom(room)) results.push(room);
				}
			}
		}
		return results;
	}

	static isHighwayAccessRouteDistance2Room(roomName) {
		// Do we have a natural path?
		if (this.isHighwayAccessRoom(roomName)) return true;

		let highwayRoomsNearBy = this.getHighwayRoomsInDistance(roomName, 2);
		return highwayRoomsNearBy.find(f => this.isInRouteDistance(roomName, f, 2)) || null;
	}

	/**
	 * Return array of SK room names that are in this sector within specified range.
	 */
	static getSectorSKRoomsInRange(roomName, range) {
		let results = [];
		let sector = this.getSector(roomName);
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if ((this.getSector(room) === sector) && this.isSKRoom(room)) results.push(room);
			}
		}
		return results;
	}

	/**
	 * Return array of center room names that are in this sector within specified range.
	 */
	static getSectorCenterRoomsInRange(roomName, range) {
		let results = [];
		let sector = this.getSector(roomName);
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if ((this.getSector(room) === sector) && this.isCenterRoom(room)) results.push(room);
			}
		}
		return results;
	}

	/**
	 * Return array of room names that are in this sector within specified range.
	 */
	static getSectorAreaRoomsInRange(roomName, range) {
		let results = [];
		let sector = this.getSector(roomName);
		for (let y=-range; y<=range; y++) {
			for (let x=-range; x<=range; x++) {
				let room = this.findRelativeRoomName(roomName, x, y);
				if (this.isRoomInSectorArea(room, sector) && !this.isSKRoom(room) && !this.isCoreRoom(room)) {
					let distance = this.findRouteDistance(roomName, room);
					if (distance && (distance <= range)) results.push(room);
				}
			}
		}
		return results;
	}

	/**
	 * Get the sector room (X1Y1) room name that the given roomName belongs to.
	 */
	static getSector(roomName) {
		if (!_sector) _sector = {};
		if (!_sector[roomName]) {
			// Highway rooms are not part of any sector.
			if (this.isHighwayRoom(roomName)) {
				_sector[roomName] = roomName;
			}
			else {
				let coords = this.getRoomCoordinates(roomName);
				let xDir = coords.xDir;
				let yDir = coords.yDir;
				let xOffset = (Math.floor(coords.x / 10) * 10) + 1;
				let yOffset = (Math.floor(coords.y / 10) * 10) + 1;
				_sector[roomName] = xDir + xOffset + yDir + yOffset;
			}
		}
		return _sector[roomName];
	}

    static getSectorRooms(roomName) {
        let sector = this.getSector(roomName);
		if (!_getSectorRooms) _getSectorRooms = {}

        if (!_getSectorRooms[sector]) {
            _getSectorRooms[sector] = [];
            let coords = this.getRoomCoordinates(sector);
            let xOffset = Math.floor(coords.x / 10) * 10;
            let yOffset = Math.floor(coords.y / 10) * 10;

            for (let x=1; x<=9; x++) {
                for (let y=1; y<=9; y++) {
                    _getSectorRooms[sector].push(coords.xDir + (x + xOffset) + coords.yDir + (y + yOffset));
                }
            }
        }

        return _getSectorRooms[sector];
	}

    static getSectorControllerRooms(roomName) {
        let sector = this.getSector(roomName);
		if (!_getSectorControllerRooms) _getSectorControllerRooms = {}

        if (!_getSectorControllerRooms[sector]) {
            _getSectorControllerRooms[sector] = [];
            let coords = this.getRoomCoordinates(sector);
            let xOffset = Math.floor(coords.x / 10) * 10;
            let yOffset = Math.floor(coords.y / 10) * 10;
			const positions = {
				4: true
				, 5: true
				, 6: true
			}

            for (let x=1; x<=9; x++) {
                for (let y=1; y<=9; y++) {
                    // The center 9 are always hostile spawn keeper rooms.
                    if (!(positions[x] && positions[y])) {
                        _getSectorControllerRooms[sector].push(coords.xDir + (x + xOffset) + coords.yDir + (y + yOffset));
                    }
                }
            }
        }

        return _getSectorControllerRooms[sector];
	}

    static getSectorCenterRooms(roomName) {
        let sector = this.getSector(roomName);

        if (typeof _getSectorCenterRooms[sector] === "undefined") {
            _getSectorCenterRooms[sector] = [];
            let coords = this.getRoomCoordinates(sector);
            let xOffset = Math.floor(coords.x / 10) * 10;
            let yOffset = Math.floor(coords.y / 10) * 10;

            for (let x=4; x<=6; x++) {
                for (let y=4; y<=6; y++) {
                    _getSectorCenterRooms[sector].push(coords.xDir + (x + xOffset) + coords.yDir + (y + yOffset));
                }
            }
        }

        return _getSectorCenterRooms[sector];
	}

    static getSectorSKRooms(roomName) {
        let sector = this.getSector(roomName);

        if (typeof _getSectorSKRooms[sector] === "undefined") {
            _getSectorSKRooms[sector] = [];
            let coords = this.getRoomCoordinates(sector);
            let xOffset = Math.floor(coords.x / 10) * 10;
            let yOffset = Math.floor(coords.y / 10) * 10;

            for (let x=4; x<=6; x++) {
                for (let y=4; y<=6; y++) {
					if ((x !== 5) || (y !== 5)) _getSectorSKRooms[sector].push(coords.xDir + (x + xOffset) + coords.yDir + (y + yOffset));
                }
            }
        }

        return _getSectorSKRooms[sector];
	}

	/**
	 * Get the highway group identifier for the given room. All rooms on this highway will have the same value.
	 */
	static getHighwayGroup(roomName) {
		if (typeof _getHighwayGroup[roomName] !== "undefined") return _getHighwayGroup[roomName];
		_getHighwayGroup[roomName] = null;

		if (this.isHighwayCorridor(roomName)) {;
			const coords = this.getRoomCoordinates(roomName);

			let x = (coords.x % 10 === 0) ? coords.x : (Math.floor(coords.x / 10) * 10) + 1;
			let y = (coords.y % 10 === 0) ? coords.y : (Math.floor(coords.y / 10) * 10) + 1;

			// Double roads along center axis.
			let xDir = (x !== 0) ? coords.xDir : 'W';
			let yDir = (y !== 0) ? coords.yDir : 'N';

			_getHighwayGroup[roomName] = xDir + x + yDir + y;
		}

		return _getHighwayGroup[roomName];
	}

    static getHighwayRooms(roomName) {
        let sector = this.getSector(roomName);

        if (typeof _getHighwayRooms[sector] === "undefined") {
            _getHighwayRooms[sector] = [];
            let coords = this.getRoomCoordinates(roomName);
            let xOffset = Math.floor(coords.x / 10) * 10;
            let yOffset = Math.floor(coords.y / 10) * 10;

            for (let x=0+xOffset; x<=10+xOffset; x++) {
                for (let y=0+yOffset; y<=10+yOffset; y++) {
                    if (x%10===0 || y%10===0) {
                        _getHighwayRooms[sector].push(coords.xDir + x + coords.yDir + y);

                        // Include adjacent highway along the equators. Easy access to deposits and power banks.
                        if (x===0) {
                            _getHighwayRooms[sector].push(this.oppositeDir(coords.xDir) + x + coords.yDir + y);
                        }
                        if (y===0) {
                            _getHighwayRooms[sector].push(coords.xDir + x + this.oppositeDir(coords.yDir) + y);
                        }
                    }
                }
            }
        }

        return _getHighwayRooms[sector];
    }

	/**
	 * Sector including surrounding highways rooms.
	 */
    static getSectorArea(roomName) {
		let sector = this.getSector(roomName);
		if (typeof _sectorArea[sector] === "undefined") _sectorArea[sector] = this.getSectorRooms(sector).concat(this.getHighwayRooms(sector));
		return _sectorArea[sector];
    }

	/**
	 * Sector hash including surrounding highways rooms.
	 */
    static getSectorAreaHash(roomName) {
		let sector = this.getSector(roomName);
		if (typeof _sectorAreaHash[sector] === "undefined") _sectorAreaHash[sector] = utils.arrayToHash(this.getSectorArea(sector), 1);
		return _sectorAreaHash[sector];
    }

	/**
	 * Determine if the given roomName is in the sector area (including highways).
	 */
	static isRoomInSectorArea(roomName, sector) {
		let key = roomName + '_' + this.getSector(sector);
		if (typeof _isRoomInSector[key] === "undefined") _isRoomInSector[key] = !!this.getSectorAreaHash(sector)[roomName];
		return _isRoomInSector[key];
	}

	/**
	 * Determine the type of room.
	 */
	static getRoomType(roomName) {
		if (typeof _roomTypes[roomName] !== "undefined") return _roomTypes[roomName];

		const coords = this.getRoomCoordinates(roomName);

		if ((coords.x % 10 === 5) && (coords.y % 10 === 5)) _roomTypes[roomName] = this.ROOMTYPE_CORE;
		else if ((coords.x % 10 === 0) && (coords.y % 10 === 0)) _roomTypes[roomName] = this.ROOMTYPE_HIGHWAY_CORNER;
		else if ((coords.x % 10 === 0) || (coords.y % 10 === 0)) _roomTypes[roomName] = this.ROOMTYPE_HIGHWAY_CORRIDOR;
		else if ([4,5,6].includes(coords.x % 10) && [4,5,6].includes(coords.y % 10)) _roomTypes[roomName] = this.ROOMTYPE_SOURCEKEEPER
		else _roomTypes[roomName] = this.ROOMTYPE_CONTROLLER;

		return _roomTypes[roomName];
	}

	/**
	* Determine if the type of room is highway.
	*/
	static isControllerRoom(roomName) {
		return this.getRoomType(roomName) === this.ROOMTYPE_CONTROLLER;
	}

	/**
	* Determine if the type of room is highway.
	*/
	static isSKRoom(roomName) {
		return this.getRoomType(roomName) === this.ROOMTYPE_SOURCEKEEPER;
	}

	/**
	* Determine if the type of room is core.
	*/
	static isCoreRoom(roomName) {
		return this.getRoomType(roomName) === this.ROOMTYPE_CORE;
	}

	/**
	 * Determine if the type of room is center room; either SK or core.
	 */
	static isCenterRoom(roomName) {
		return this.isSKRoom(roomName) || this.isCoreRoom(roomName);
	}

	/**
	* Determine if the type of room is highway.
	*/
	static isHighwayCorridor(roomName) {
		return this.getRoomType(roomName) === this.ROOMTYPE_HIGHWAY_CORRIDOR;
    }

	/**
	 * Determine if the type of room is highway corner.
	 */
	static isHighwayCorner(roomName) {
		return this.getRoomType(roomName) === this.ROOMTYPE_HIGHWAY_CORNER;
	}

	/**
	 * Determine if the type of room is highway room; either corner or corridor.
	 */
	static isHighwayRoom(roomName) {
		return this.isHighwayCorridor(roomName) || this.isHighwayCorner(roomName);
	}

	/**
	 * Determine if the type of room is capable of having portals; which are randomly spawned.
	 */
	static isPortalRoom(roomName) {
		return this.isCoreRoom(roomName) || this.isHighwayCorner(roomName);
	}

	static isSKAccessRoom(roomName) {
		if (typeof _isSKAccessRoom[roomName] !== "undefined") return _isSKAccessRoom[roomName];
		_isSKAccessRoom[roomName] = this.describeExitRooms(roomName).find(f => this.isSKRoom(f)) || null;
		return _isSKAccessRoom[roomName];
	}

	/**
	 * Returns the core room for the given sector.
	 */
    static getSectorCoreRoom(roomName) {
        let sector = this.getSector(roomName);
		if (typeof _getSectorCoreRoom[sector] !== "undefined") return _getSectorCoreRoom[sector];

        if (!_getSectorCoreRoom[sector]) {
            let coords = this.getRoomCoordinates(sector);
            let xOffset = (Math.floor(coords.x / 10) * 10) + 5;
            let yOffset = (Math.floor(coords.y / 10) * 10) + 5;

            _getSectorCoreRoom[sector] = coords.xDir + xOffset + coords.yDir + yOffset;
        }

        return _getSectorCoreRoom[sector];
	}

	/**
	 * Determines if given room has closest access to core room.
	 * Assumes that core room can be accessed from any inner ring controller rooms.
	 */
	static isCoreAccessRoom(roomName) {
		if (typeof _isCoreAccessRoom[roomName] !== "undefined") return _isCoreAccessRoom[roomName];
		_isCoreAccessRoom[roomName] = (this.findRoomDistance(roomName, this.getSectorCoreRoom(roomName)) === 2);
		return _isCoreAccessRoom[roomName];
	}

	static isHighwayAccessRoom(roomName) {
		return this.getAccessibleHighways(roomName).length;
	}

	static isDualHighwayAccessRoom(roomName) {
		return this.getAccessibleHighways(roomName).length === 2;
	}

	static isEquatorAccessRoom(roomName) {
		// Not not have access to highway.
		if (!this.isHighwayAccessRoom(roomName)) return false;
		const coords = this.getRoomCoordinates(roomName);
		if ((coords.x === 1) || (coords.y === 1)) return true;
		return false;
	}

	static getAccessibleHighways(roomName) {
		if (typeof _getAccessibleHighways[roomName] !== "undefined") return _getAccessibleHighways[roomName];
		_getAccessibleHighways[roomName] = this.describeExitRooms(roomName).filter(f => this.isHighwayRoom(f));
		return _getAccessibleHighways[roomName];
	}

    /**
	 * Get the name of a room offset from the anchor room
	 */
	static findRelativeRoomName(roomName, xDelta, yDelta) {
		const coords = this.getRoomCoordinates(roomName);
		let xDir = coords.xDir;
		if (xDir === 'W') {
			xDelta = -xDelta;
		}
		let yDir = coords.yDir;
		if (yDir === 'N') {
			yDelta = -yDelta;
		}
		let x = coords.x + xDelta;
		let y = coords.y + yDelta;
		if (x < 0) {
			x = Math.abs(x) - 1;
			xDir = this.oppositeDir(xDir);
		}
		if (y < 0) {
			// noinspection JSSuspiciousNameCombination
			y = Math.abs(y) - 1;
			yDir = this.oppositeDir(yDir);
		}

		return xDir + x + yDir + y;
	}

	/**
	 * Find the relative x and y offsets of two rooms
	 */
	static findRoomCoordDeltas(origin, otherRoom) {
		const originCoords = this.getRoomCoordinates(origin);
		const otherCoords = this.getRoomCoordinates(otherRoom);

		let xDelta = otherCoords.x - originCoords.x;
		if (originCoords.xDir !== otherCoords.xDir) {
			xDelta = otherCoords.x + originCoords.x + 1;
		}

		let yDelta = otherCoords.y - originCoords.y;
		if (originCoords.yDir !== otherCoords.yDir) {
			yDelta = otherCoords.y + originCoords.y + 1;
		}

		// normalize direction
		if (originCoords.xDir === 'W') {
			xDelta = -xDelta;
		}
		if (originCoords.yDir === 'N') {
			yDelta = -yDelta;
		}

		return {x: xDelta, y: yDelta};
    }

	/**
	 * Returns the magnitude (not direction) of a room from an origin room in a straight line.
	 * This is a cached function for performance; results should never change.
	 */
	static findRoomRange(origin, otherRoom) {
		let key1 = origin + '_' + otherRoom;
		let key2 = otherRoom + '_' + origin;

		// We already have found this range, return it.
		if (typeof _findRoomRange[key1] !== "undefined") return _findRoomRange[key1];

		const delta = this.findRoomCoordDeltas(origin, otherRoom);
		let result = Math.max(Math.abs(delta.x), Math.abs(delta.y));

		// Save the calculated result.
		_findRoomRange[key1] = result;
		_findRoomRange[key2] = result;

		// Return our distance.
		return _findRoomRange[key1];
	}

	/**
	 * Returns the distance of a room from an origin room in walking distance.
	 * Note that actual exits are not calculated here, so actual paths may not exist even still.
	 */
	static findRoomDistance(origin, otherRoom) {
		let key = (origin <= otherRoom) ? origin + '_' + otherRoom : otherRoom + '_' + origin;

		// We already have found this range, return it.
		if (typeof _findRoomDistance[key] !== "undefined") return _findRoomDistance[key];

		const delta = this.findRoomCoordDeltas(origin, otherRoom);
		let result =  Math.abs(delta.x) + Math.abs(delta.y);

		// Save the calculated result.
		_findRoomDistance[key] = result;

		// Return our distance.
		return _findRoomDistance[key];
	}

	/**
	 * Returns the direction (not magnitude) of a room from an origin room
	 */
	static findRelativeRoomDir(origin, otherRoom) {
		const coordDeltas = this.findRoomCoordDeltas(origin, otherRoom);
		// noinspection JSSuspiciousNameCombination
		if (Math.abs(coordDeltas.x) == Math.abs(coordDeltas.y)) {
			if (coordDeltas.x > 0) {
				if (coordDeltas.y > 0) {
					return 2;
				} else {
					return 4;
				}
			} else if (coordDeltas.x < 0) {
				if (coordDeltas.y > 0) {
					return 8;
				} else {
					return 6;
				}
			} else {
				return 0;
			}
		} else {
			// noinspection JSSuspiciousNameCombination
			if (Math.abs(coordDeltas.x) > Math.abs(coordDeltas.y)) {
				if (coordDeltas.x > 0) {
					return 3;
				} else {
					return 7;
				}
			} else {
				if (coordDeltas.y > 0) {
					return 1;
				} else {
					return 5;
				}
			}
		}
	}

	/**
	 * Returns the distance of a room from an origin room in walking distance.
	 * Note that actual exits are not calculated here, so actual paths may not exist even still.
	 */
	static findCenterRoom(rooms) {
		let xSum = 0;
		let ySum = 0;
		rooms.forEach(roomName => {
			const coords = this.getRoomCoordinates(roomName);
			let xDir = coords.xDir;
			xSum += (xDir === 'W') ? -coords.x : coords.x;
			let yDir = coords.yDir;
			ySum += (yDir === 'S') ? -coords.y : coords.y;
		})
		// Round towards zero.
		let xAvg = xSum < 0 ? -Math.floor(-xSum / rooms.length) : Math.floor(xSum / rooms.length);
		let yAvg = ySum < 0 ? -Math.floor(-ySum / rooms.length) : Math.floor(ySum / rooms.length);
		// Bias to the North West. Why? Who knows.
		let xDir = (xAvg <= 0) ? 'W' : 'E';
		let yDir = (yAvg < 0) ? 'S' : 'N';
		return xDir + Math.abs(xAvg) + yDir + Math.abs(yAvg);
	}

	/**
	 * Returns the distance of a room from an origin room in walking distance.
	 * Note that actual exits are not calculated here, so actual paths may not exist even still.
	 */
	static getQuadrant(roomName) {
		// We already have found this value, return it.
		if (typeof _getQuadrant[roomName] !== "undefined") return _getQuadrant[roomName];

		const coords = this.getRoomCoordinates(roomName);
		const quadrant = coords.yDir + coords.xDir;

		// Save the calculated result.
		_getQuadrant[roomName] = quadrant;

		// Return our value.
		return _getQuadrant[roomName];
	}

	/**
	 * Return the opposite direction, e.g. "W" => "E"
	 */
	static oppositeDir(dir) {
		switch (dir) {
			case 'W':
				return 'E';
			case 'E':
				return 'W';
			case 'N':
				return 'S';
			case 'S':
				return 'N';
			default:
				return 'error';
		}
    }


	/**
	 * Get the coordinates from a room name
	 */
	static getRoomCoordinates(roomName) {
		const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
		const match = coordinateRegex.exec(roomName);

		const xDir = match[1];
		const x = match[2];
		const yDir = match[3];
		const y = match[4];

		return {
			x   : Number(x),
			y   : Number(y),
			xDir: xDir,
			yDir: yDir,
		};
	}

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(Cartographer, 'Cartographer');

module.exports = Cartographer;
