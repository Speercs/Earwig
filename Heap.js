"use strict";

let _rooms = {};
let _creeps = {};

class Heap {

    get rooms() {
        return _rooms;
    }

    get creeps() {
        return _creeps;
    }

    reset() {
        _rooms = {};
        _creeps = {};
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(Heap, 'Heap');

module.exports = Heap;
