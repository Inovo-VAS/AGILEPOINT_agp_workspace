
(function () {

    /// for typeOfExact - function
    if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
        Object.defineProperty(Function.prototype, 'name', {
            get: function () {
                var funcNameRegex = /function\s([^(]{1,})\(/;
                var results = (funcNameRegex).exec((this).toString().toLowerCase());
                return (results && results.length > 1) ? results[1].trim() : "";
            },
            set: function (value) { }
        });
    }

    /*Array polyfills starts*/

    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            for (var i = 0; i < this.length; i++) {
                var item = this[i];
                if (predicate.call(this, item, i)) {
                    return item;
                }
            }
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function (predicate) {
            var items = [];
            for (var i = 0; i < this.length; i++) {
                var item = this[i];
                if (predicate.call(this, item, i)) {
                    items.push(item);
                }
            }
            return items;
        };
    }

    Array.prototype.filterWithNames = function (names, callBack) {
        var retItems = [], noOfNames = names.length, noOfTrueConditions = 0;
        for (var i = 0; i < this.length; i++) {
            var item = this[i];
            if (callBack.call(this, item, i)) {
                retItems.push(item) && noOfTrueConditions++;
            }
            if (noOfTrueConditions == noOfNames) {
                break;
            }
        }
        return retItems;
    }

    Array.prototype.findRight = function (callBack) {
        for (var i = this.length - 1; i >= 0; i--) {
            var item = this[i];
            if (callBack.call(this, item, i)) {
                return item;
            }
        }
    };

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            var k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +fromIndex || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            if (n >= len) {
                return -1;
            }
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }
    /*Array polyfills ends*/

    /*Element polyfills starts*/
    if (typeof Element !== "undefined" && !Element.prototype.matches) {
        Element.prototype.matches = function (selector) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(selector),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this);
            return i > -1;
        }
    }
    /*Element polyfills ends*/

})();

