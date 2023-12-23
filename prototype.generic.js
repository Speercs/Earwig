
"use strict";

module.exports = function() {

    /*** STRINGS ***/

    String.prototype.right = function( qty )
    {
        return this.slice( -( qty ) );
    }

    String.prototype.left = function( qty )
    {
        return this.slice( 0, qty );
    }

    /*** MATH ***/

    Math.isOdd = function(value) {
        return Math.abs(value % 2) == 1;
    }

    Math.isEven = function(value) {
        return value % 2 == 0;
    }

    Math.sum = function(value) {
        return value.reduce((a, b) => a + b);
    }

    /*** ARRAY ***/

    Array.prototype.last = function() {
        return this[this.length - 1];
    }

    // https://stackoverflow.com/questions/27266550/how-to-flatten-nested-array-in-javascript
    Array.prototype.flatten = function() {
        var ret = [];
        for (var i = 0; i < this.length; i++) {
            if (Array.isArray(this[i])) {
                ret = ret.concat(this[i].flatten());
            } else {
                ret.push(this[i]);
            }
        }
        return ret;
    }

    Array.prototype.average = function() {
        return this.reduce((a, b) => a + b) / this.length;
    }

    // https://measurethat.net/Benchmarks/Show/28166/0/set-vs-filter-vs-uniq-for-unique
    Array.prototype.unique = function() {
	    //return array.filter((v, i, a) => a.indexOf(v) === i);
	    //return _.uniq(array);
        return [...new Set(this)];
    }

}
