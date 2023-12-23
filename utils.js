"use strict";

/**
 * Obtain the username of the player.
 * Find the first controller we own, or if none found then creep, and its owner username is our name.
 */
let _getUsername = undefined;
function getUsername() {
	if (typeof _getUsername === "undefined") {
		if (typeof _getUsername === "undefined") {
			for (const i in Game.rooms) {
				const room = Game.rooms[i];
				if (room.controller && room.controller.my) {
					_getUsername = room.controller.owner.username;
					console.log('INFO: setting username to', _getUsername);
					break;
				}
			}
		}
		if (typeof _getUsername === "undefined") {
			for (const i in Game.creeps) {
				const creep = Game.creeps[i];
				if (creep.owner) {
					_getUsername = creep.owner.username;
					console.log('INFO: setting username to', _getUsername);
					break;
				}
			}
		}
		if (typeof _getUsername === "undefined") console.log('ERROR: Could not determine username.');
	}
	return _getUsername;
}

/**
 * Beautify numbers with units.
 */
function formatNum(num, digits) {
    let units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    let floor = Math.floor(Math.floor(Math.abs(num)).toString().length / 3);
    let value = (num / Math.pow(1000, floor));
    return value.toFixed(value > 1 ? digits:3) + units[floor];
}

/**
 * Beautify error numbers with code.
 */
function errNumToCode(num) {
	switch (num) {
		case 0: return 'OK';
		case -1: return 'ERR_NOT_OWNER';
		case -2: return 'ERR_NO_PATH';
		case -3: return 'ERR_NAME_EXISTS';
		case -4: return 'ERR_BUSY';
		case -5: return 'ERR_NOT_FOUND';
		case -6: return 'ERR_NOT_ENOUGH_ENERGY';
		case -6: return 'ERR_NOT_ENOUGH_RESOURCES';
		case -6: return 'ERR_NOT_ENOUGH_EXTENSIONS';
		case -7: return 'ERR_INVALID_TARGET';
		case -8: return 'ERR_FULL';
		case -9: return 'ERR_NOT_IN_RANGE';
		case -10: return 'ERR_INVALID_ARGS';
		case -11: return 'ERR_TIRED';
		case -12: return 'ERR_NO_BODYPART';
		case -14: return 'ERR_RCL_NOT_ENOUGH';
		case -15: return 'ERR_GCL_NOT_ENOUGH';
	}
	return '';
}

/**
 * Merges a list of store-like objects, summing overlapping keys. Useful for calculating assets from multiple sources
 * https://github.com/bencbartlett/Overmind/blob/master/src/utilities/utils.ts
 */
function mergeSum(objects) {
	const ret = {};
	for (const object of objects) {
		for (const key in object) {
			// const amount = object[key] || 0;
			// if (!ret[key]) {
			// 	ret[key] = 0;
			// }
			// ret[key] += amount;

			ret[key] = (ret[key] || 0) + object[key];
		}
	}
	return ret;
}

function mergeSubtract(objects) {
	const ret = {};
	for (const object of objects) {
		for (const key in object) {
			ret[key] = (ret[key] || 0) - object[key];
		}
	}
	return ret;
}

/**
 * Pass in an array of stores from any source (terminal, storage, creeps, labs, etc)
 * Will return the merged sum of all stores.
 */
function mergeStores(stores) {
	const ret = {};
	for (const store of stores) {
		for (const resource in store) {
			ret[resource] = (ret[resource] || 0) + store[resource];
		}
	}
	return ret;
}

// https://stackoverflow.com/questions/34392741/best-way-to-get-intersection-of-keys-of-two-objects/34392937#34392937
function intersection(o1, o2) {
	const [k1, k2] = [Object.keys(o1), Object.keys(o2)];
	const [first, next] = k1.length > k2.length ? [k2, o1] : [k1, o2];
	return first.filter(k => k in next);
}

function unique(array) {
	return array.unique();
}

function groupBy(collection, key) {
	return collection.reduce((acc, currentValue) => {
		let groupKey = key ? currentValue[key] : currentValue;
		if (typeof acc[groupKey] === "undefined") {
			acc[groupKey] = [];
		}
		acc[groupKey].push(currentValue);
		return acc;
	}, {});
}

// https://stackoverflow.com/questions/59447415/alternative-to-lodash-omit
const omitSingle = (key, { [key]: _, ...obj }) => obj;
const omitArray = (keys, obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

function calcMovingAverage(data, precision) {
	// Calculate the current and previous average.
	let previousSum = data.slice(0, data.length - 1).reduce((a, b) => a + b, 0);
	let previousAvg = previousSum / (data.length - 1);
	let currentAvg = (previousSum + data[data.length - 1]) / data.length;
	return _.round(currentAvg - previousAvg, precision);
}

function getComponentAmountForProduct(component, product) {
	return Math.min(COMMODITIES[product].components[component] * Math.ceil(POWER_INFO[PWR_OPERATE_FACTORY].duration / COMMODITIES[product].cooldown), Config.params.FACTORY_STORE_TARGET);
}

/**
 * This is NOT called from manageFactory, so adding in OPS does not interfere with determining when to boost/create products. I hope.
 * Note if making changes to this function, also refer to C.factoryComponentsNeeded()
 */
let _getMaxComponentAmountForFactoryLevel = {}
function getMaxComponentAmountForFactoryLevel(component, factoryLevel) {
	let key = component + '_' + factoryLevel;
	if (typeof _getMaxComponentAmountForFactoryLevel[key] === "undefined") {
		// Add in batteries manually. This is to keep our rooms full of emergy energy.
		if (component === RESOURCE_BATTERY) {
			_getMaxComponentAmountForFactoryLevel[key] = Config.params.FACTORY_STORE_TARGET;
		}
		else {
			// Get the max amout needed by any commodity.
			_getMaxComponentAmountForFactoryLevel[key] = Math.min(Object.keys(COMMODITIES).filter(f => (COMMODITIES[f].level || 0) === factoryLevel).reduce((max, product) => {
				let amount = this.getComponentAmountForProduct(component, product) || 0;
				return amount > max ? amount : max
			}, 0), Config.params.FACTORY_STORE_TARGET)
		}

		// Adjust energy up manually to factory minium.
		if (component === RESOURCE_ENERGY) {
			_getMaxComponentAmountForFactoryLevel[key] = Math.max(_getMaxComponentAmountForFactoryLevel[key] || 0, Config.params.FACTORY_STORE_TARGET);
		}
	}
	return _getMaxComponentAmountForFactoryLevel[key];
}

function verboseLog(message) {
	if (!FlagManager.noverboseFlag) {
		console.log(message);
	}
}

function shallowEqual(object1, object2) {
	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);
	if (keys1.length !== keys2.length) {
		return false;
	}
	for (let key of keys1) {
		if (object1[key] !== object2[key]) {
			return false;
		}
	}
	return true;
}

function normalizePos(target) {
	if (!(target instanceof RoomPosition)) {
		return target.pos;
	}
	return target;
}

function newCoord(x, y) {
	return { x: x, y: y };
}

function coordFromPos(pos) {
	return { x: pos.x, y: pos.y };
}

function coordFromTarget(target) {
	let pos = normalizePos(target);
	return { x: pos.x, y: pos.y };
}

// TODO: remove this...should be storing coords and converting into pos using map.
function newPos(target) {
	if (target.pos && target.pos.x && target.pos.y && target.pos.roomName) {
		return new RoomPosition(target.pos.x, target.pos.y, target.pos.roomName);
	}
	return new RoomPosition(target.x, target.y, target.roomName);
}

function posFromName(posName) {
	if (!posName) return null;
	let parts = posName.split('_');
	return new RoomPosition(parts[0], parts[1], parts[2]);
}

function posFromCoord(xy, roomName) {
	if (!xy || !roomName) return null;
	return new RoomPosition(xy.x, xy.y, roomName);
}

// https://github.com/screeps/engine/blob/master/src/utils.js
function getBodyCost(body) {
	return body.reduce(function (cost, part) {
		// Difference between using an array of body parts and the creep.body object.
		return cost + BODYPART_COST[part];
	}, 0);
};

// https://masteringjs.io/tutorials/fundamentals/enum
// { Up: 'Up', Down: 'Down', Left: 'Left', Right: 'Right' }
// createEnum(['Up', 'Down', 'Left', 'Right']);
function createEnum(values) {
	const enumObject = {};
	for (const val of values) {
		enumObject[val] = val;
	}
	return Object.freeze(enumObject);
}

function arrayToHash(array, value = undefined) {
	return array.reduce((map, obj) => (map[obj] = value || obj, map), {});
}

function arrayToHashIndexOne(array) {
	return array.reduce((map, obj, index) => (map[obj] = index + 1, map), {});
}

function printStack(name, message) {
	var e = new Error(message);
	var stack = e.stack
		//.split('\n')[2]
		// " at functionName ( ..." => "functionName"
		//.replace(/^\s+at\s+(.+?)\s.+/g, '$1' );
	console.log(name, stack);
	//return stack
}

function carryPartsNeededForSourceDistance(distance, energyCapacity) {
	return Math.ceil((2 * distance) / (CARRY_CAPACITY / (energyCapacity / ENERGY_REGEN_TIME)));
}

function getRoomHTML(roomName) {
	return '<a href="#!/room/' + Game.shard.name + '/' + roomName + '">' + roomName + '</a>';
}

function getShardRoomHTML(roomName) {
	return '<a href="#!/room/' + Game.shard.name + '/' + roomName + '">' + Game.shard.name + '/' + roomName + '</a>';
}

function roundToMultipleOf(number, multiple) {
	return multiple * Math.ceil(number / multiple);
}

/**
 * @description Taken from https://codereview.stackexchange.com/questions/245533/generic-sort-function
 * Example:
 * let myObjectArray = [{key: "entry1", age:6, name:"John"}, {key: "entry2", ...}]
 * let fnSort = buildObjectSortFunctionFromPropertyList('age desc, name')
 * myObjectArray.sort(fnSort)
 * @param {string} propertyList - property names separated by commas to apply to a list of objects for sorting e.g. "age desc, name"
 * @returns {function} of type (a,b) => n where n is -1, 0, 1
 */
function buildObjectSortFunctionFromPropertyList(propertyList) {

	let fnSort = function (sortProp, x, y) {
		let aSortParts = sortProp.split(',').map(p => p.trim()) // e.g. " age desc, name" => ["age desc", "name"]
		let reIsDesc = /\sdesc$/i // does text end " desc" or " DeSC" etc.
		let aTypeOrder = ['boolean', 'number', 'string', 'object', 'undefined'] // When the pairs don't match will use this precedence order
		try {

			for (let i = 0; i < aSortParts.length; i++) {
				let sortPart = aSortParts[i]
				let sortFactor = 1
				if (reIsDesc.test(sortPart)) {
					sortPart =  sortPart.substr(0, sortPart.length - 5)
					sortFactor = -1
				} else {
					sortFactor = 1
				}
				let xVal = x[sortPart]
				let yVal = y[sortPart]
				let xType = typeof xVal
				let yType = typeof yVal

				let compareResult
				if (xType === yType) {
					switch(xType) {
						case 'string':
							compareResult = xVal.localeCompare(yVal)
							break;
						case 'number':
							compareResult =  xVal === yVal ? 0 : xVal < yVal ? -1 : 1
							break;
						case 'boolean':
							compareResult = xVal === yVal ? 0 : xVal === false ? -1 : 1
							break;
						case 'object':
							if (xVal === null && yVal === null) {
								compareResult = 0
							} else if (xVal === null) {
								compareResult = -1
							} else if (yVal === null) {
								compareResult = 1
							} else {
								xVal = xVal.toString()
								yVal = yVal.toString()
								compareResult = xVal.localeCompare(yVal)
							}
							break;
						default:
							// This is typical of undefined, which will happen a lot if the passed property name is mistyped etc.
							// So, just assume that the items pairs cannot be distinguished and use 0
							compareResult = 0
					}
				} else {
					if (xVal === null && yVal === null) {
						compareResult = 0
					} else if (xVal === null) {
				   		compareResult = 1 // Sort NULL to last
					} else if (yVal === null) {
				   		compareResult = -1 // Sort NULL to last
					} else {
						let xValOrder = aTypeOrder.findIndex(xType)
						let yValOrder = aTypeOrder.findIndex(yType)
						compareResult = xValOrder === yValOrder ? 0 : xValOrder < yValOrder ? -1 : 1
					}
					if (compareResult !== 0) {
				   		return compareResult // a definte sorting decision is available but IGNORE sort factor! This case is precendent
					}
				}
				if (compareResult !== 0) {
					return compareResult * sortFactor// a definte sorting decision is available
				}
			}

		} catch(ex) {

		}
		return 0 // Treat the items as equivalent havingnot found a specific difference in the list of sorting properties

	}
	return fnSort.bind(this, propertyList)
}


module.exports = {
	getUsername
	, formatNum
	, errNumToCode
	, mergeSum
	, mergeSubtract
	, mergeStores
	, verboseLog
	, intersection
	, unique
	, groupBy
	, omitSingle
	, omitArray
	, calcMovingAverage
	, getComponentAmountForProduct
	, getMaxComponentAmountForFactoryLevel
	, shallowEqual
	, normalizePos
	, newCoord
	, coordFromPos
	, coordFromTarget
	, newPos
	, getBodyCost
	, createEnum
	, posFromName
	, posFromCoord
	, arrayToHash
	, arrayToHashIndexOne
	, printStack
	, carryPartsNeededForSourceDistance
	, getRoomHTML
	, getShardRoomHTML
	, roundToMultipleOf
	, buildObjectSortFunctionFromPropertyList
}
