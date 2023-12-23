"use strict";

class CpuManager {

    constructor() {
        if (!Memory.cpu) Memory.cpu = {};
    }

    clear() {
        this.ticksPegged = 0;
        this.ticksMaxed = 0;
        this.ticksBelowNearMaxed = 0;
        this.ticksAboveNormal = 0;
        this.ticksBelowNormal = 0;
        this.ticksHalt = 0;
        this.ticksStop = 0;
    }

    /**
     * Execute when setting reserved rooms.
     */
    startTimer() {
        if (this.timer + Config.params.CPU_RESERVE_ROOM_COOLDOWN < Game.time) {
            this.timer = Game.time;
        }
    }

    /**
     * Execute on every tick of the game.
     */
    record() {
        if (GameManager.isCpuPegged) this.ticksPegged = Game.time;
        if (GameManager.isCpuMaxed) this.ticksMaxed = Game.time;
        if (GameManager.isCpuBelowNearMaxed) this.ticksBelowNearMaxed = Game.time;
        if (GameManager.isCpuAboveNormal) this.ticksAboveNormal = Game.time;
        if (GameManager.isCpuBelowNormal) this.ticksBelowNormal = Game.time;
        if (GameManager.isCpuHalted) this.ticksHalt = Game.time;
        if (GameManager.isCpuStopped) this.ticksStop = Game.time;
    }

    getRecommendedDelta() {

        let isPositiveCpuMovingAvg = (Memory.stats.cpuMovingAvg > 0) ;

        // ONLY when we are pegged and very recently can we add ONE room.
        //if (this.ticksPegged && (this.ticksPegged > this.ticksBelowNearMaxed)) return +1;

        // *** AMAZING CPU ***
        {
            // We are at 100% cpu with no negatives, add a couple of rooms. It's near impossible to stay pegged.
            if (this.ticksPegged && !this.ticksBelowNearMaxed) return +3;

            // We have plenty of cpu to spare still.
            if (this.ticksMaxed && !this.ticksBelowNearMaxed) return +1; //+2;

            // Wild! This is a ~good spot to be. We are hitting our max cpu, but also dipped below halt spawning somepoint earlier.
            if (this.ticksMaxed && !this.ticksBelowNormal) return 0; //+1;

            // Wild! We are trending up more recently, and we were maxed so just stay here.
            if (this.ticksMaxed && this.ticksBelowNormal && (this.ticksMaxed > this.ticksBelowNormal)) return 0;
        }

        // *** BAD CPU ***
        {
            // Worst case first, if we hit stop then remove a lot of rooms.
            if (this.ticksStop) return -GameManager.empireSpawnRooms.length;

            // Had a bad day, but trended up to max so just stay put for now.
            if (this.ticksHalt && this.ticksAboveNormal && (this.ticksAboveNormal > this.ticksHalt)) return isPositiveCpuMovingAvg ? 0 : 0;

            // Never had a positive reading, but halted more recently. Remove a couple of rooms.
            if (this.ticksHalt && this.ticksBelowNormal && (this.ticksBelowNormal > this.ticksHalt)) return isPositiveCpuMovingAvg ? 0 : -2;

            // Never had a positive reading, only negative. Remove several rooms.
            if (this.ticksHalt) return isPositiveCpuMovingAvg ? 0 : -3;

            // Trending down below normal...compensate by removing a room.
            if (this.ticksBelowNormal && this.ticksAboveNormal && (this.ticksBelowNormal > this.ticksAboveNormal)) return isPositiveCpuMovingAvg ? 0 : -1;

            // We spent entire time below normal, and were never in the positive, so remove a couple of rooms.
            if (this.ticksBelowNormal && !this.ticksAboveNormal) return isPositiveCpuMovingAvg ? 0 : -1;
        }

        // Perfect...we are bouncing around near normal.
        if (this.ticksBelowNormal && this.ticksAboveNormal && (this.ticksAboveNormal > this.ticksBelowNormal)) return 0;

        // We are trending down more recently, so remove a room.
        if (this.ticksBelowNormal) return isPositiveCpuMovingAvg ? 0 : -1;

        // We are in the goldielocks zone, and did not hit any limits positive or negative.
        // We want to move slightly to more cpu in this case however, so remove a room.
        return 0;
    }

    get timer() {
        return Memory.cpu.timer || Game.time;
    }
    set timer(value) {
        Memory.cpu.timer = value;
    }

    get ticksPegged() {
        return Memory.cpu.ticksPegged || 0;
    }
    set ticksPegged(value) {
        Memory.cpu.ticksPegged = value;
    }

    get ticksMaxed() {
        return Memory.cpu.ticksMaxed || 0;
    }
    set ticksMaxed(value) {
        Memory.cpu.ticksMaxed = value;
    }

    get ticksBelowNearMaxed() {
        return Memory.cpu.ticksBelowNearMaxed || 0;
    }
    set ticksBelowNearMaxed(value) {
        Memory.cpu.ticksBelowNearMaxed = value;
    }

    get ticksAboveNormal() {
        return Memory.cpu.ticksAboveNormal || 0;
    }
    set ticksAboveNormal(value) {
        Memory.cpu.ticksAboveNormal = value;
    }

    get ticksBelowNormal() {
        return Memory.cpu.ticksBelowNormal || 0;
    }
    set ticksBelowNormal(value) {
        Memory.cpu.ticksBelowNormal = value;
    }

    get ticksHalt() {
        return Memory.cpu.ticksHalt || 0;
    }
    set ticksHalt(value) {
        Memory.cpu.ticksHalt = value;
    }

    get ticksStop() {
        return Memory.cpu.ticksStop || 0;
    }
    set ticksStop(value) {
        Memory.cpu.ticksStop = value;
    }

}

// Each of the functions on this class will be replaced with a profiler wrapper. The second parameter is a required label.
if (profiler) profiler.registerClass(CpuManager, 'CpuManager');

module.exports = CpuManager;
