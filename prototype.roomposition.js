"use strict";

const EDGE_OFFSET_DEFEND = 3;
const EDGE_OFFSET_REPAIR_5 = 5;
const EDGE_OFFSET_REPAIR_4 = 4;
const EDGE_OFFSET_REPAIR_3 = 3;
const EDGE_OFFSET_REPAIR_2 = 2;
const EDGE_OFFSET_REPAIR_1 = 1;

module.exports = function() {

    Object.defineProperty(RoomPosition.prototype, 'name', {
        get() {
            return this.x + '_' + this.y + '_' + this.roomName;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'coord', {
        get() {
            return { x: this.x, y: this.y };
        },
        configurable: true, enumerable: true,
    });

    RoomPosition.prototype.anyPosInRangeD = function(d) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;

        let lowerRange = 0;
        let upperRange = 49;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    positions.push(pos);
                }
            }
        }
        return positions;
	};

    RoomPosition.prototype.anyPosOfRangeD = function(d) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;

        let lowerRange = 0;
        let upperRange = 49;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    positions.push(pos);
                }
            }
        }
        return positions;
	};

    RoomPosition.prototype.coordInRangeD = function(d, edgeOffset = 0, ring = false) {
        let coords = [];

        // Sanity check.
        if (d < 0) return coords;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        const terrain = new Room.Terrain(this.roomName);

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (ring && (Math.abs(x) === d) && (Math.abs(y) === d)) {
                    // Do not add the corners for rings.
                }
                else {
                    let xy = { x: this.x + x, y: this.y + y };
                    // Exclude wall terrain.
                    if ((terrain.get(xy.x, xy.y) || 0) !== TERRAIN_MASK_WALL) coords.push(xy);
                }
            }
        }
        return coords;
	};

    // ONE TRUE FUNCTION
    RoomPosition.prototype.coordOfRangeD = function(d, edgeOffset = 0, ring = false) {
        let coords = [];

        // Sanity check.
        if (d < 0) return coords;
        if (edgeOffset < 0) return coords;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        const terrain = new Room.Terrain(this.roomName);

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (ring && (Math.abs(x) === d) && (Math.abs(y) === d)) {
                    // Do not add the corners for rings.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let xy = { x: this.x + x, y: this.y + y };
                    // Exclude wall terrain.
                    if ((terrain.get(xy.x, xy.y) || 0) !== TERRAIN_MASK_WALL) coords.push(xy);
                }
            }
        }
        return coords;
	};

    RoomPosition.prototype.posOfRangeDNonTerrainWall = function(d) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;

        const lowerRange = 0;
        const upperRange = 49;
        const terrain = new Room.Terrain(this.roomName);

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let xy = { x: this.x + x, y: this.y + y };
                    // Exclude wall terrain.
                    if ((terrain.get(xy.x, xy.y) || 0) !== TERRAIN_MASK_WALL) positions.push(new RoomPosition(xy.x, xy.y, this.roomName));
                }
            }
        }
        return positions;
	};

    RoomPosition.prototype.posInRangeDNonTerrainWall = function(d) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;

        const lowerRange = 0;
        const upperRange = 49;
        const terrain = new Room.Terrain(this.roomName);

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else {
                    let xy = { x: this.x + x, y: this.y + y };
                    // Exclude wall terrain.
                    if ((terrain.get(xy.x, xy.y) || 0) !== TERRAIN_MASK_WALL) positions.push(new RoomPosition(xy.x, xy.y, this.roomName));
                }
            }
        }
        return positions;
	};

    RoomPosition.prototype.posInRangeDNotBlockedByObject = function(d, edgeOffset = 0, exterier = false) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;
        if (edgeOffset < 0) return positions;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < 0) || ((this.x + x) > 49) || ((this.y + y) < 0) || ((this.y + y) > 49)) continue;

                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    if (exterier) {
                        let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                        if (!pos.isBlockedByObject) positions.push(pos);
                    }
                }
                else {
                    if (!exterier) {
                        let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                        if (!pos.isBlockedByObject) positions.push(pos);
                    }
                }
            }
        }
        return positions;
	};

    RoomPosition.prototype.posOfRangeDNotBlockedByObject = function(d, edgeOffset = 0) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;
        if (edgeOffset < 0) return positions;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    if (!pos.isBlockedByObject) positions.push(pos);
                }
            }
        }
        return positions;
	};

    Room.prototype.posVertical = function(x) {
        let positions = [];

        // Sanity check.
        if ((x < 0) || (x > 49)) return positions;

        // Exclude wall terrain.
        const terrain = new Room.Terrain(this.name);

        for (let y=0; y<=49; y++) {
            if ((terrain.get(x, y) || 0) !== TERRAIN_MASK_WALL) {
                let pos = new RoomPosition(x, y, this.name);
                positions.push(pos);
            }
        }
        return positions;
	};

    Room.prototype.posHorizontal = function(y) {
        let positions = [];

        // Sanity check.
        if ((y < 0) || (y > 49)) return positions;

        // Exclude wall terrain.
        const terrain = new Room.Terrain(this.name);

        for (let x=0; x<=49; x++) {
            if ((terrain.get(x, y) || 0) !== TERRAIN_MASK_WALL) {
                let pos = new RoomPosition(x, y, this.name);
                positions.push(pos);
            }
        }
        return positions;
	};

    RoomPosition.prototype.posOfRangeDEnterable = function(d, edgeOffset = 0) {
        let posisitions = [];

        // Sanity check.
        if (d < 0) return posisitions;
        if (edgeOffset < 0) return posisitions;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    if (pos.isEnterable) posisitions.push(pos);
                }
            }
        }
        return posisitions;
	};

    RoomPosition.prototype.posInRangeDEnterable = function(d, edgeOffset = 0) {
        let posisitions = [];

        // Sanity check.
        if (d < 0) return posisitions;
        if (edgeOffset < 0) return posisitions;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    if (pos.isEnterable) posisitions.push(pos);
                }
            }
        }
        return posisitions;
	};

    RoomPosition.prototype.ringPosOfRangeDNotBlockedByObject = function(d, edgeOffset = 0) {
        let positions = [];

        // Sanity check.
        if (d < 0) return positions;
        if (edgeOffset < 0) return positions;

        let lowerRange = 0 + edgeOffset;
        let upperRange = 49 - edgeOffset;

        for (let x=-d; x<=d; x++) {
            for (let y=-d; y<=d; y++) {
                if (((this.x + x) < lowerRange) || ((this.x + x) > upperRange) || ((this.y + y) < lowerRange) || ((this.y + y) > upperRange)) {
                    // Out of range.
                }
                else if ((Math.abs(x) === d) && (Math.abs(y) === d)) {
                    // Do not add the corners.
                }
                else if (Math.abs(x) === d || Math.abs(y) === d) {
                    let pos = new RoomPosition(this.x + x, this.y + y, this.roomName);
                    if (!pos.isBlockedByObject) positions.push(pos);
                }
            }
        }
        return positions;
	};

    Object.defineProperty(RoomPosition.prototype, 'posInRange1NotBlockedByObject', {
        get() {
			if (this._posInRange1NotBlockedByObject === undefined) {
                this._posInRange1NotBlockedByObject = this.posInRangeDNotBlockedByObject(1);
            }
            return this._posInRange1NotBlockedByObject;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange4', {
        get() {
			if (this._posInRange4 === undefined) {
                this._posInRange4 = this.posInRangeDNotBlockedByObject(4);
            }
            return this._posInRange4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3NotBlockedByObject', {
        get() {
			if (this._posInRange3NotBlockedByObject === undefined) {
                this._posInRange3NotBlockedByObject = this.posInRangeDNotBlockedByObject(3);
            }
            return this._posInRange3NotBlockedByObject;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3EnterableOffsetDefend', {
        get() {
			if (this._posInRange3EnterableOffsetDefend === undefined) {
                this._posInRange3EnterableOffsetDefend = this.posInRangeDEnterable(3, EDGE_OFFSET_DEFEND).filter(f => !f.hasRoad);
            }
            return this._posInRange3EnterableOffsetDefend;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange8EnterableOffsetDefend', {
        get() {
			if (this._posInRange8EnterableOffsetDefend === undefined) {
                this._posInRange8EnterableOffsetDefend = this.posInRangeDEnterable(8, EDGE_OFFSET_DEFEND).filter(f => !f.hasRoad);
            }
            return this._posInRange8EnterableOffsetDefend;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3NotBlockedByObjectOffsetDefend', {
        get() {
			if (this._posInRange3NotBlockedByObjectOffsetDefend === undefined) {
                this._posInRange3NotBlockedByObjectOffsetDefend = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_DEFEND).filter(f => !f.hasRoad);
            }
            return this._posInRange3NotBlockedByObjectOffsetDefend;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange1NotBlockedByObjectOffsetEdge', {
        get() {
			if (this._posInRange1NotBlockedByObjectOffsetEdge === undefined) {
                this._posInRange1NotBlockedByObjectOffsetEdge = this.posInRangeDNotBlockedByObject(1, 1);
            }
            return this._posInRange1NotBlockedByObjectOffsetEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3NotBlockedByObjectOffsetEdge', {
        get() {
			if (this._posInRange3NotBlockedByObjectOffsetEdge === undefined) {
                this._posInRange3NotBlockedByObjectOffsetEdge = this.posInRangeDNotBlockedByObject(3, 1);
            }
            return this._posInRange3NotBlockedByObjectOffsetEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3OffsetRepair5', {
        get() {
			if (this._posInRange3OffsetRepair5 === undefined) {
                this._posInRange3OffsetRepair5 = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_5);
            }
            return this._posInRange3OffsetRepair5;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posOfRange3OffsetRepair5', {
        get() {
			if (this._posOfRange3OffsetRepair5 === undefined) {
                this._posOfRange3OffsetRepair5 = this.posOfRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_5);
            }
            return this._posOfRange3OffsetRepair5;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3OffsetRepair4', {
        get() {
			if (this._posInRange3OffsetRepair4 === undefined) {
                this._posInRange3OffsetRepair4 = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_4);
            }
            return this._posInRange3OffsetRepair4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3OffsetRepair3', {
        get() {
			if (this._posInRange3OffsetRepair3 === undefined) {
                this._posInRange3OffsetRepair3 = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_3);
            }
            return this._posInRange3OffsetRepair3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3Exterier2', {
        get() {
			if (this._posInRange3Exterier2 === undefined) {
                this._posInRange3Exterier2 = this.posInRangeDNotBlockedByObject(3, 2, true);
            }
            return this._posInRange3Exterier2;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posOfRange1OffsetRepair3', {
        get() {
			if (this._posOfRange1OffsetRepair3 === undefined) {
                this._posOfRange1OffsetRepair3 = this.posOfRangeDNotBlockedByObject(1, EDGE_OFFSET_REPAIR_3);
            }
            return this._posOfRange1OffsetRepair3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3OffsetRepair2', {
        get() {
			if (this._posInRange3OffsetRepair2 === undefined) {
                this._posInRange3OffsetRepair2 = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_2);
            }
            return this._posInRange3OffsetRepair2;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3OffsetRepair1', {
        get() {
			if (this._posInRange3OffsetRepair1 === undefined) {
                this._posInRange3OffsetRepair1 = this.posInRangeDNotBlockedByObject(3, EDGE_OFFSET_REPAIR_1);
            }
            return this._posInRange3OffsetRepair1;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange2', {
        get() {
			if (this._posInRange2 === undefined) {
                this._posInRange2 = this.posInRangeDNotBlockedByObject(2);
            }
            return this._posInRange2;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosInRange1', {
        get() {
			if (this._anyInRange1 === undefined) {
                this._anyInRange1 = this.anyPosInRangeD(1);
            }
            return this._anyInRange1;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosInRange3', {
        get() {
			if (this._anyPosInRange3 === undefined) {
                this._anyPosInRange3 = this.anyPosInRangeD(3);
            }
            return this._anyPosInRange3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosOfRange3', {
        get() {
			if (this._anyPosOfRange3 === undefined) {
                this._anyPosOfRange3 = this.anyPosOfRangeD(3);
            }
            return this._anyPosOfRange3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosInRange4', {
        get() {
			if (this._anyPosInRange4 === undefined) {
                this._anyPosInRange4 = this.anyPosInRangeD(4);
            }
            return this._anyPosInRange4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosInRange5', {
        get() {
			if (this._anyPosInRange5 === undefined) {
                this._anyPosInRange5 = this.anyPosInRangeD(5);
            }
            return this._anyPosInRange5;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'anyPosOfRange4', {
        get() {
			if (this._anyPosOfRange4 === undefined) {
                this._anyPosOfRange4 = this.anyPosOfRangeD(4);
            }
            return this._anyPosOfRange4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange1', {
        get() {
			if (this._xyInRange1 === undefined) {
                this._xyInRange1 = this.coordInRangeD(1);
            }
            return this._xyInRange1;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'coordInRange1NotNearEdge', {
        get() {
			if (this._coordInRange1NotNearEdge === undefined) {
                this._coordInRange1NotNearEdge = this.coordInRangeD(1, 2);
            }
            return this._coordInRange1NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange2', {
        get() {
			if (this._xyInRange2 === undefined) {
                this._xyInRange2 = this.coordInRangeD(2);
            }
            return this._xyInRange2;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange2', {
        get() {
			if (this._xyOfRange2 === undefined) {
                this._xyOfRange2 = this.coordOfRangeD(2);
            }
            return this._xyOfRange2;
        },
        configurable: true, enumerable: true,
    });


    Object.defineProperty(RoomPosition.prototype, 'coordOfRing2NotNearEdge', {
        get() {
			if (this._coordOfRing2NotNearEdge === undefined) {
                this._coordOfRing2NotNearEdge = this.coordOfRangeD(2, 2, true);
            }
            return this._coordOfRing2NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posOfRing2NotNearEdge', {
        get() {
			if (this._posOfRing2NotNearEdge === undefined) {
                this._posOfRing2NotNearEdge = this.coordOfRing2NotNearEdge.map(m => utils.posFromCoord(m, this.roomName))
            }
            return this._posOfRing2NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange3', {
        get() {
			if (this._xyInRange3 === undefined) {
                this._xyInRange3 = this.coordInRangeD(3);
            }
            return this._xyInRange3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange3', {
        get() {
			if (this._xyOfRange3 === undefined) {
                this._xyOfRange3 = this.coordOfRangeD(3);
            }
            return this._xyOfRange3;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'coordInRange3NotNearEdge', {
        get() {
			if (this._coordInRange3NotNearEdge === undefined) {
                this._coordInRange3NotNearEdge = this.coordInRangeD(3, 2);
            }
            return this._coordInRange3NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange3NotNearEdge', {
        get() {
			if (this._xyOfRange3NotNearEdge === undefined) {
                this._xyOfRange3NotNearEdge = this.coordOfRangeD(3, 2);
            }
            return this._xyOfRange3NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange4', {
        get() {
			if (this._xyInRange4 === undefined) {
                this._xyInRange4 = this.coordInRangeD(4);
            }
            return this._xyInRange4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange4', {
        get() {
			if (this._xyOfRange4 === undefined) {
                this._xyOfRange4 = this.coordOfRangeD(4);
            }
            return this._xyOfRange4;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange4NotNearEdge', {
        get() {
			if (this._xyInRange4NotNearEdge === undefined) {
                this._xyInRange4NotNearEdge = this.coordInRangeD(4, 2);
            }
            return this._xyInRange4NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'coordOfRange4NotNearEdge', {
        get() {
			if (this._coordOfRange4NotNearEdge === undefined) {
                this._coordOfRange4NotNearEdge = this.coordOfRangeD(4, 2);
            }
            return this._coordOfRange4NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange5', {
        get() {
			if (this._xyInRange5 === undefined) {
                this._xyInRange5 = this.coordInRangeD(5);
            }
            return this._xyInRange5;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange5', {
        get() {
			if (this._xyOfRange5 === undefined) {
                this._xyOfRange5 = this.coordOfRangeD(5);
            }
            return this._xyOfRange5;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange5NotNearEdge', {
        get() {
			if (this._xyInRange5NotNearEdge === undefined) {
                this._xyInRange5NotNearEdge = this.coordInRangeD(5, 2);
            }
            return this._xyInRange5NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange5NotNearEdge', {
        get() {
			if (this._xyOfRange5NotNearEdge === undefined) {
                this._xyOfRange5NotNearEdge = this.coordOfRangeD(5, 2);
            }
            return this._xyOfRange5NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange6', {
        get() {
			if (this._xyInRange6 === undefined) {
                this._xyInRange6 = this.coordInRangeD(6);
            }
            return this._xyInRange6;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange6', {
        get() {
			if (this._xyOfRange6 === undefined) {
                this._xyOfRange6 = this.coordOfRangeD(6);
            }
            return this._xyOfRange6;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyInRange6NotNearEdge', {
        get() {
			if (this._xyInRange6NotNearEdge === undefined) {
                this._xyInRange6NotNearEdge = this.coordInRangeD(6, 2);
            }
            return this._xyInRange6NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange6NotNearEdge', {
        get() {
			if (this._xyOfRange6NotNearEdge === undefined) {
                this._xyOfRange6NotNearEdge = this.coordOfRangeD(6, 2);
            }
            return this._xyOfRange6NotNearEdge;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange22', {
        get() {
			if (this._xyOfRange22 === undefined) {
                this._xyOfRange22 = this.coordOfRangeD(22);
            }
            return this._xyOfRange22;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange23', {
        get() {
			if (this._xyOfRange23 === undefined) {
                this._xyOfRange23 = this.coordOfRangeD(23);
            }
            return this._xyOfRange23;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyOfRange24', {
        get() {
			if (this._xyOfRange24 === undefined) {
                this._xyOfRange24 = this.coordOfRangeD(24);
            }
            return this._xyOfRange24;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange1', {
        get() {
			if (this._posInRange1 === undefined) {
                this._posInRange1 = this.posInRangeDNotBlockedByObject(1);
            }
            return this._posInRange1;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange1Enterable', {
        get() {
            return this.posInRangeDEnterable(1);
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange2Enterable', {
        get() {
            return this.posInRangeDEnterable(2);
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posInRange3Enterable', {
        get() {
            return this.posInRangeDEnterable(3);
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'isEdge', {
        get() {
            const indexes = {
                0: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'inRange1Edge', {
		get() {
            const indexes = {
                0: true
                , 1: true
                , 48: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'isRange1Edge', {
		get() {
            const indexes = {
                1: true
                , 48: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'inRange2Edge', {
		get() {
            const indexes = {
                0: true
                , 1: true
                , 2: true
                , 47: true
                , 48: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'isRange2Edge', {
		get() {
            const indexes = {
                2: true
                , 47: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'isNearEdge', {
		get() {
            const indexes = {
                0: true
                , 1: true
                , 48: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'rangeToCenter', {
        get() {
            return Math.max(Math.abs(25 - this.x), Math.abs(25 - this.y));
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'rangeToEdge', {
        get() {
            return 25 - this.rangeToCenter;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'distanceToCenter', {
        get() {
            return Math.abs(25 - this.x) + Math.abs(25 - this.y);
        },
        configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'inRange3Edge', {
		get() {
            const indexes = {
                0: true
                , 1: true
                , 2: true
                , 3: true
                , 46: true
                , 47: true
                , 48: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'inRange4Edge', {
		get() {
            const indexes = {
                0: true
                , 1: true
                , 2: true
                , 3: true
                , 4: true
                , 45: true
                , 46: true
                , 47: true
                , 48: true
                , 49: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'isInsideOfWall', {
		get() {
            if (this._isInsideOfWall === undefined) {
				this._isInsideOfWall = !this.inRange2Edge;
            }
			return this._isInsideOfWall;
		},
		configurable: true, enumerable: true,
    });

	Object.defineProperty(RoomPosition.prototype, 'isNearExit', {
		get() {
            // TODO: This is the more correct version, however the performance is O(N).
            // TODO: INSTEAD MAKE A HEAP HAS OF ALL POSITIONS NEAR EXITS (TRUE POSITIONS). Then can test if pos.name is in hash!
            //this._isNearExit = !!this.findInRange(Game.rooms[this.roomName].exits, 4)

            const indexes = {
                1: true
                , 48: true
            }
            return indexes[this.x] || indexes[this.y];
		},
		configurable: true, enumerable: true,
    });

    RoomPosition.prototype.inSameRoom = function(target) {
        let pos = target && utils.normalizePos(target);
        return (pos && pos.roomName && (pos.roomName === this.roomName));
	};

    RoomPosition.prototype.getDistanceTo = function(target) {
        let pos = utils.normalizePos(target);
        if (pos.roomName && pos.roomName !== this.roomName) {
            return Infinity;
        }
		return Math.abs(this.x - pos.x) + Math.abs(this.y - pos.y);
	};

    RoomPosition.prototype.getRangeX = function(target) {
        let pos = utils.normalizePos(target);
        if (pos.roomName && pos.roomName !== this.roomName) {
            return Infinity;
        }
		return Math.abs(this.x - pos.x);
	};

    RoomPosition.prototype.getRangeY = function(target) {
        let pos = utils.normalizePos(target);
        if (pos.roomName && pos.roomName !== this.roomName) {
            return Infinity;
        }
		return Math.abs(this.y - pos.y);
	};

    /**
     * Determines if target is in range 1 of this position.
     * Differs from isNearTo in that it excludes this position; must be exactly range 1 away.
     */
    RoomPosition.prototype.isNextTo = function(target) {
		return this.getRangeTo(target) === 1;
	};

    RoomPosition.prototype.inRange1 = function(target) {
		return this.getRangeTo(target) <= 1;
	};
    RoomPosition.prototype.isRange1 = function(target) {
		return this.getRangeTo(target) === 1;
	};
    RoomPosition.prototype.inDistance1 = function(target) {
		return this.getDistanceTo(target) <= 1;
	};
    RoomPosition.prototype.isDistance1 = function(target) {
		return this.getDistanceTo(target) === 1;
	};

    RoomPosition.prototype.inRange2 = function(target) {
		return this.getRangeTo(target) <= 2;
	};
    RoomPosition.prototype.isRange2 = function(target) {
		return this.getRangeTo(target) === 2;
	};
    RoomPosition.prototype.inDistance2 = function(target) {
		return this.getDistanceTo(target) <= 2;
	};
    RoomPosition.prototype.isDistance2 = function(target) {
		return this.getDistanceTo(target) === 2;
	};

    RoomPosition.prototype.inRange3 = function(target) {
		return this.getRangeTo(target) <= 3;
	};
    RoomPosition.prototype.isRange3 = function(target) {
		return this.getRangeTo(target) === 3;
	};
    RoomPosition.prototype.inDistance3 = function(target) {
		return this.getDistanceTo(target) <= 3;
	};
    RoomPosition.prototype.isDistance3 = function(target) {
		return this.getDistanceTo(target) === 3;
	};

    RoomPosition.prototype.inRange4 = function(target) {
		return this.getRangeTo(target) <= 4;
	};
    RoomPosition.prototype.isRange4 = function(target) {
		return this.getRangeTo(target) === 4;
	};
    RoomPosition.prototype.inDistance4 = function(target) {
		return this.getDistanceTo(target) <= 4;
	};
    RoomPosition.prototype.isDistance4 = function(target) {
		return this.getDistanceTo(target) === 4;
	};

    RoomPosition.prototype.inRange5 = function(target) {
		return this.getRangeTo(target) <= 5;
	};
    RoomPosition.prototype.isRange5 = function(target) {
		return this.getRangeTo(target) === 5;
	};
    RoomPosition.prototype.inDistance5 = function(target) {
		return this.getDistanceTo(target) <= 5;
	};
    RoomPosition.prototype.isDistance5 = function(target) {
		return this.getDistanceTo(target) === 5;
	};

    RoomPosition.prototype.inRange6 = function(target) {
		return this.getRangeTo(target) <= 6;
	};
    RoomPosition.prototype.isRange6 = function(target) {
		return this.getRangeTo(target) === 6;
	};
    RoomPosition.prototype.isDistance6 = function(target) {
		return this.getDistanceTo(target) === 6;
	};

    RoomPosition.prototype.inRange7 = function(target) {
		return this.getRangeTo(target) <= 7;
	};
    RoomPosition.prototype.isRange7 = function(target) {
		return this.getRangeTo(target) === 7;
	};
    RoomPosition.prototype.isDistance7 = function(target) {
		return this.getDistanceTo(target) === 7;
	};

    RoomPosition.prototype.inRange8 = function(target) {
		return this.getRangeTo(target) <= 8;
	};
    RoomPosition.prototype.isRange8 = function(target) {
		return this.getRangeTo(target) === 8;
	};
    RoomPosition.prototype.isDistance8 = function(target) {
		return this.getDistanceTo(target) === 8;
	};

    RoomPosition.prototype.inRange9 = function(target) {
		return this.getRangeTo(target) <= 9;
	};
    RoomPosition.prototype.isRange9 = function(target) {
		return this.getRangeTo(target) === 9;
	};
    RoomPosition.prototype.isDistance9 = function(target) {
		return this.getDistanceTo(target) === 9;
	};

    RoomPosition.prototype.inRange10 = function(target) {
		return this.getRangeTo(target) <= 10;
	};
    RoomPosition.prototype.isRange10 = function(target) {
		return this.getRangeTo(target) === 10;
	};
    RoomPosition.prototype.isDistance10 = function(target) {
		return this.getDistanceTo(target) === 10;
	};

    RoomPosition.prototype.lookForCreep = function() {
        //return (this.lookFor(LOOK_CREEPS) || []).find(x => x !== undefined);
        return this.lookFor(LOOK_CREEPS)[0];
    };

    RoomPosition.prototype.lookForMyCreep = function() {
        return this.lookFor(LOOK_CREEPS).find(f => f.my);
        //let creep = this.lookFor(LOOK_CREEPS)[0];
        //return (creep && creep.my) ? creep : null;
    };

    RoomPosition.prototype.lookForStructure = function(structureType) {
        return this.lookFor(LOOK_STRUCTURES).find(f => !structureType || (f.structureType === structureType));
    };

    RoomPosition.prototype.lookForHostileNonDecayStructure = function() {
        return this.lookFor(LOOK_STRUCTURES).find(f =>
            (f.owner && !f.my)
            || (f.structureType === STRUCTURE_WALL)
        );
    };

    RoomPosition.prototype.lookForConstructionSite = function(structureType) {
        return this.lookFor(LOOK_CONSTRUCTION_SITES).find(f => !structureType || (f.structureType === structureType));
    };

    Object.defineProperty(RoomPosition.prototype, 'hasRampartHits', {
        get() {
            let rampart = this.lookForStructure(STRUCTURE_RAMPART);
            return rampart ? rampart.hits : 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasRampart', {
        get() {
            return this.lookForStructure(STRUCTURE_RAMPART);
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasBarrierStructure', {
        get() {
            return this.lookForStructure(STRUCTURE_WALL) || this.lookForStructure(STRUCTURE_RAMPART) || null;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Returns the hit points of hostile-owned and non-public ramparts on this position; zero otherwise.
     */
    Object.defineProperty(RoomPosition.prototype, 'hasHostileRampartHits', {
        get() {
            if (this._hasHostileRampartHits === undefined) {
                let rampart = this.lookForStructure(STRUCTURE_RAMPART);
                this._hasHostileRampartHits = rampart ? ((!rampart.my && !rampart.isPublic) ? rampart.hits : 0) : 0;
            }
            return this._hasHostileRampartHits;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasWallHits', {
        get() {
            let wall = this.lookForStructure(STRUCTURE_WALL);
            return wall ? wall.hits : 0;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasBarrier', {
        get() {
            // if (this._hasBarrier === undefined) {
            //     this._hasBarrier = this.hasRampartHits || this.hasWallHits;
            // }
            // return this._hasBarrier;

            return this.hasRampartHits || this.hasWallHits;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasRampartConstructionSite', {
        get() {
            if (this._hasRampartConstructionSite === undefined) {
                this._hasRampartConstructionSite = this.lookForConstructionSite(STRUCTURE_RAMPART);
            }
            return this._hasRampartConstructionSite;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasStructure', {
        get() {
            if (this._hasStructure === undefined) {
                this._hasStructure = !!(this.lookFor(LOOK_STRUCTURES) || []).length
            }
            return this._hasStructure;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Returns the first structure found at this position.
     * Note there could be several structures in the same spot.
     * Example: road, container, rampart, spawn, storage
     */
    Object.defineProperty(RoomPosition.prototype, 'structures', {
        get() {
            if (this._structures === undefined) {
                this._structures = this.lookFor(LOOK_STRUCTURES);
            }
            return this._structures;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Returns the first hostile structure found at this position.
     * Note there could be several structures in the same spot.
     * Example: rampart, spawn, storage
     */
    Object.defineProperty(RoomPosition.prototype, 'getHostileStructure', {
        get() {
            if (this._getHostileStructure === undefined) {
                this._getHostileStructure = this.lookFor(LOOK_STRUCTURES).find(f => !f.my && f.owner);
            }
            return this._getHostileStructure;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'hasRoad', {
        get() {
            if (this._hasRoad === undefined) {
                this._hasRoad = this.lookForRoad();
            }
            return this._hasRoad;
        },
        configurable: true, enumerable: true,
    });

    RoomPosition.prototype.removeRoad = function() {
        let road = this.lookForStructure(STRUCTURE_ROAD);
        if (road) return road.destroy();
        return ERR_NOT_FOUND;
    }

    RoomPosition.prototype.removeWall = function() {
        let wall = this.lookForStructure(STRUCTURE_WALL);
        if (wall) return wall.destroy();
        return ERR_NOT_FOUND;
    }

    RoomPosition.prototype.lookForHostileWorker = function() {
        let creep = this.lookForCreep();
        // Return "creep" as the last && check as the final return value.
        return creep && !creep.my && creep.workParts && !creep.isLethal && creep;
    };

    RoomPosition.prototype.lookForExtractor = function() {
        return this.lookForStructure(STRUCTURE_EXTRACTOR);
    };

    RoomPosition.prototype.lookForContainerConstructionSite = function() {
        return this.lookForConstructionSite(STRUCTURE_CONTAINER);
    };

    RoomPosition.prototype.lookForRoadConstructionSite = function() {
        return this.lookForConstructionSite(STRUCTURE_ROAD);
    };

    RoomPosition.prototype.lookForWall = function() {
        return this.lookForStructure(STRUCTURE_WALL);
    };

    RoomPosition.prototype.lookForContainer = function() {
        return this.lookForStructure(STRUCTURE_CONTAINER);
    };

    RoomPosition.prototype.lookForLink = function() {
        return this.lookForStructure(STRUCTURE_LINK);
    };

    RoomPosition.prototype.lookForRoad = function() {
        return this.lookForStructure(STRUCTURE_ROAD);
    };

    RoomPosition.prototype.lookForEnergy = function() {
        return (this.lookFor(LOOK_ENERGY) || []).find(x => x !== undefined);
    };

    RoomPosition.prototype.lookForEnergyAmount = function() {
        return _.sum((this.lookFor(LOOK_ENERGY) || []), 'amount');
    };

    RoomPosition.prototype.lookForResource = function() {
        return (this.lookFor(LOOK_RESOURCES) || []).find(x => x !== undefined);
    };

    Object.defineProperty(RoomPosition.prototype, 'isTerrainWall', {
        get() {
            const terrain = new Room.Terrain(this.roomName);
            return (terrain.get(this.x, this.y) === TERRAIN_MASK_WALL)
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'isTerrainSwamp', {
        get() {
            const terrain = new Room.Terrain(this.roomName);
            return (terrain.get(this.x, this.y) === TERRAIN_MASK_SWAMP)
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'isNearTerrainSwamp', {
        get() {
            const terrain = new Room.Terrain(this.roomName);
            for (let x=-1; x<=1; x++) {
                for (let y=-1; y<=1; y++) {
                    if (terrain.get(this.x+x, this.y+y) === TERRAIN_MASK_SWAMP) return true;
                }
            }
            return false;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'isTerrainPlain', {
        get() {
            const terrain = new Room.Terrain(this.roomName);
            return (terrain.get(this.x, this.y) === 0)
        },
        configurable: true, enumerable: true,
    });

    // This method is looking for the best/cheapest walking areas around this spot.
    Object.defineProperty(RoomPosition.prototype, 'isIdealPerimeterRampart', {
        get() {
            if (this._isIdealPerimeterRampart === undefined) {
                // We would be testing whole sections, and no position not near an exit makes sense.
                if (!Game.rooms[this.roomName].exits.find(f => f.inRange2(this))) return;

                // Determine if we are top/bottom/left/right.
                let side1 = [];
                let side2 = [];
                if (this.x === 2 || this.x === 47) {
                    side1.push(new RoomPosition(this.x-1, this.y-1, this.roomName));
                    side1.push(new RoomPosition(this.x-1, this.y, this.roomName));
                    side1.push(new RoomPosition(this.x-1, this.y+1, this.roomName));
                    side2.push(new RoomPosition(this.x+1, this.y-1, this.roomName));
                    side2.push(new RoomPosition(this.x+1, this.y, this.roomName));
                    side2.push(new RoomPosition(this.x+1, this.y+1, this.roomName));
                }
                if (this.y === 2 || this.y === 47) {
                    side1.push(new RoomPosition(this.x-1, this.y-1, this.roomName));
                    side1.push(new RoomPosition(this.x, this.y-1, this.roomName));
                    side1.push(new RoomPosition(this.x+1, this.y-1, this.roomName));
                    side2.push(new RoomPosition(this.x-1, this.y+1, this.roomName));
                    side2.push(new RoomPosition(this.x, this.y+1, this.roomName));
                    side2.push(new RoomPosition(this.x+1, this.y+1, this.roomName));
                }

                this._isIdealPerimeterRampart = !!(this.isTerrainPlain && side1.find(f => f.isTerrainPlain) && side2.find(f => f.isTerrainPlain));
            }
            return this._isIdealPerimeterRampart;
        },
        configurable: true, enumerable: true,
    });

    RoomPosition.prototype.getPosByDirection = function(direction) {
        switch (direction) {
            case TOP:
                return new RoomPosition(this.x, Math.max(0, this.y-1), this.roomName);
            case TOP_RIGHT:
                return new RoomPosition(Math.min(49, this.x+1), Math.max(0, this.y-1), this.roomName);
            case RIGHT:
                return new RoomPosition(Math.min(49, this.x+1), this.y, this.roomName);
            case BOTTOM_RIGHT:
                return new RoomPosition(Math.min(49, this.x+1), Math.min(49, this.y+1), this.roomName);
            case BOTTOM:
                return new RoomPosition(this.x, Math.min(49, this.y+1), this.roomName);
            case BOTTOM_LEFT:
                return new RoomPosition(Math.max(0, this.x-1), Math.min(49, this.y+1), this.roomName);
            case LEFT:
                return new RoomPosition(Math.max(0, this.x-1), this.y, this.roomName);
            case TOP_LEFT:
                return new RoomPosition(Math.max(0, this.x-1), Math.max(0, this.y-1), this.roomName);
        }
        // Error condition, return current position.
        return this;
    }

    Object.defineProperty(RoomPosition.prototype, 'posOfRange1Enterable', {
        get() {
            if (this._posOfRange1Enterable === undefined) {
                this._posOfRange1Enterable = this.posOfRangeDEnterable(1);
            }
            return this._posOfRange1Enterable;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posOfRange2', {
        get() {
            if (this._posOfRange2 === undefined) {
                this._posOfRange2 = this.posOfRangeDEnterable(2);
            }
            return this._posOfRange2;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'posOfRange3', {
        get() {
            if (this._posOfRange3 === undefined) {
                this._posOfRange3 = this.posOfRangeDEnterable(3);
            }
            return this._posOfRange3;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Is this pos enterable by a creep.
     * Other creeps are considered blocking.
     */
    Object.defineProperty(RoomPosition.prototype, 'isEnterable', {
        get() {
            if (this._isEnterable === undefined) {
                let terrain = null;
                let hasRoad = false;
                this._isEnterable = _.every(this.look(), item => {
                    switch (item.type) {
                        case LOOK_TERRAIN:
                            terrain = item.terrain;
                            return true;
                        case LOOK_STRUCTURES:
                            if (item.structure.structureType === STRUCTURE_ROAD) hasRoad = true;
                            if (item.structure.structureType === STRUCTURE_RAMPART && !item.structure.my && !item.structure.isPublic) return false;
                            return !C.OBSTACLE_OBJECT_TYPES_HASH[item.structure.structureType];
                        case LOOK_CONSTRUCTION_SITES: return !C.OBSTACLE_OBJECT_TYPES_HASH[item.constructionSite.structureType];
                        case LOOK_CREEPS: return false;
                        default: return true;
                    }
                });
                // Special case of a wall and a road is allowed.
                if (terrain === 'wall' && !hasRoad) this._isEnterable = false;
            }
            return this._isEnterable;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Is this pos enterable by a creep.
     * Other creeps are NOT considered blocking.
     */
    Object.defineProperty(RoomPosition.prototype, 'isBlockedByObject', {
        get() {
            if (this._isBlockedByObject === undefined) {
                let terrain = null;
                let hasRoad = false;
                this._isBlockedByObject = !_.every(this.look(), item => {
                    switch (item.type) {
                        case LOOK_TERRAIN:
                            terrain = item.terrain;
                            return true;
                        case LOOK_STRUCTURES:
                            if (item.structure.structureType === STRUCTURE_ROAD) hasRoad = true;
                            if (item.structure.structureType === STRUCTURE_RAMPART && !item.structure.my && !item.structure.isPublic) return false;
                            return !C.OBSTACLE_OBJECT_TYPES_HASH[item.structure.structureType];
                        case LOOK_CONSTRUCTION_SITES: return !C.OBSTACLE_OBJECT_TYPES_HASH[item.constructionSite.structureType];
                        case LOOK_CREEPS: return true;
                        default: return true;
                    }
                });
                // Special case of a wall and a road is allowed.
                if (terrain === 'wall' && !hasRoad) this._isBlockedByObject = true;
            }
            return this._isBlockedByObject;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Differs slightly from isBlockedByObject as it will consider enemy creeps to be blocking but not our own creeps.
     */
    Object.defineProperty(RoomPosition.prototype, 'isBlockedByObjectOrHostile', {
        get() {
            if (this._isBlockedByObjectOrHostile === undefined) {
                let terrain = null;
                let hasRoad = false;
                this._isBlockedByObjectOrHostile = !_.every(this.look(), item => {
                    switch (item.type) {
                        case LOOK_TERRAIN:
                            terrain = item.terrain;
                            return true;
                        case LOOK_STRUCTURES:
                            if (item.structure.structureType === STRUCTURE_ROAD) hasRoad = true;
                            if (item.structure.structureType === STRUCTURE_RAMPART && !item.structure.my && !item.structure.isPublic) return false;
                            return !C.OBSTACLE_OBJECT_TYPES_HASH[item.structure.structureType];
                        case LOOK_CONSTRUCTION_SITES: return !C.OBSTACLE_OBJECT_TYPES_HASH[item.constructionSite.structureType];
                        case LOOK_CREEPS: return !item.creep.my;
                        default: return true;
                    }
                });
                // Special case of a wall and a road is allowed.
                if (terrain === 'wall' && !hasRoad) this._isBlockedByObjectOrHostile = true;
            }
            return this._isBlockedByObjectOrHostile;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Structures can't be built on walls, construction sites, or structures excluding ramparts and roads.
     */
    Object.defineProperty(RoomPosition.prototype, 'isStructureBuildable', {
        get() {
            if (this._isStructureBuildable === undefined) {
                const structures = {
                    [STRUCTURE_ROAD]: true
                    , [STRUCTURE_RAMPART]: true
                }
                this._isStructureBuildable = _.every(this.look(), item => {
                    switch (item.type) {
                        case LOOK_TERRAIN: return item.terrain !== 'wall';
                        case LOOK_STRUCTURES: return !!structures[item.structure.structureType];
                        case LOOK_CONSTRUCTION_SITES: return false;
                        default: return true;
                    }
                });
            }
            return this._isStructureBuildable;
        },
        configurable: true, enumerable: true,
    });

    /**
     * Road can't be built on walls, construction sites, or obstacle structures.
     */
    Object.defineProperty(RoomPosition.prototype, 'isTrailRoadBuildable', {
        get() {
            if (this._isTrailRoadBuildable === undefined) {
                this._isTrailRoadBuildable = _.every(this.look(), item => {
                    switch (item.type) {
                        case LOOK_TERRAIN: return item.terrain !== 'wall';
                        case LOOK_STRUCTURES: return !C.OBSTACLE_OBJECT_TYPES_HASH[item.structure.structureType];
                        case LOOK_CONSTRUCTION_SITES: return false;
                        default: return true;
                    }
                });
            }
            return this._isTrailRoadBuildable;
        },
        configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'lookForStructureAtArea1', {
		get() {
            if (this._lookForStructureAtArea1 === undefined) {
                if (Game.rooms[this.roomName]) {
                    const look = Game.rooms[this.roomName].lookForAtArea(
                        LOOK_STRUCTURES
                        , Math.max(0, this.y-1)
                        , Math.max(0, this.x-1)
                        , Math.min(49, this.y+1)
                        , Math.min(49, this.x+1)
                        , true
                    );
                    this._lookForStructureAtArea1 = look.map(m => m.structure);
                }
                else {
                    this._lookForStructureAtArea1 = [];
                }
            }
			return this._lookForStructureAtArea1;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'coordsNonWallNextTo', {
		get() {
            let result = [];
            const terrain = new Room.Terrain(this.roomName);

            for (let x = Math.max(0, this.x-1); x <= Math.min(49, this.x+1); x++) {
                for (let y = Math.max(0, this.y-1); y <= Math.min(49, this.y+1); y++) {
                    if ((x!==this.x) || (y!==this.y)) {
                        if (terrain.get(x, y) !== TERRAIN_MASK_WALL) result.push({x: x, y: y});
                    }
                }
            }

			return result;
		},
		configurable: true, enumerable: true,
    });

    Object.defineProperty(RoomPosition.prototype, 'xyTerrainNonWallRange3', {
		get() {
            let result = [];
            const terrain = new Room.Terrain(this.roomName);

            for (let x = Math.max(0, this.x-3); x <= Math.min(49, this.x+3); x++) {
                for (let y = Math.max(0, this.y-3); y <= Math.min(49, this.y+3); y++) {
                    if ((x!==this.x) || (y!==this.y)) {
                        if (terrain.get(x, y) !== TERRAIN_MASK_WALL) result.push({x: x, y: y});
                    }
                }
            }

			return result;
		},
		configurable: true, enumerable: true,
    });

    /**
     * Note that you should use RoomObject.nips if possible, as terrain information is cached.
     * Calling this method directly off a RoomPosition will need to do lookup each call.
     */
    Object.defineProperty(RoomPosition.prototype, 'nips', {
		get() {
            return this.coordsNonWallNextTo.map(m => new RoomPosition(m.x, m.y, this.roomName));
		},
		configurable: true, enumerable: true,
    });

    /**
     * My implementation of a distance variant of 'findClosestByRange'.
     */
    RoomPosition.prototype.findClosestByDistance = function(targets) {
        return _.sortBy(targets, s => this.getDistanceTo(s))[0];
    }

    /**
     * My implementation of a distance variant of 'findInRange'.
     */
    RoomPosition.prototype.findInDistance = function(type, range, opts) {
        var room = Game.rooms[this.roomName];

        if(!room) {
            throw new Error(`Could not access room ${this.roomName}`);
        }

        opts = _.clone(opts || {});

        var objects = [],
            result = [];

        if(_.isNumber(type)) {
            objects = room.find(type, opts);
        }
        if(_.isArray(type)) {
            objects = opts.filter ? _.filter(type, opts.filter) : type;
        }

        objects.forEach((i) => {
            if(this.getDistanceTo(i) <= range) {
                result.push(i);
            }
        });

        return result;
    }

    global.DIRECTIONS = {
        // [x, y] adders
        1: [0, -1],
        2: [1, -1],
        3: [1, 0],
        4: [1, 1],
        5: [0, 1],
        6: [-1, 1],
        7: [-1, 0],
        8: [-1, -1]
    };

    RoomPosition.prototype.fromDirection = function(direction) {
        // returns a RoomPosition given a RoomPosition and a direction
        return new RoomPosition(
            this.x + DIRECTIONS[direction][0],
            this.y + DIRECTIONS[direction][1],
            this.roomName
        );
    };

}
