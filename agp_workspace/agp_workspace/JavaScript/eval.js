self.guid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
    }
    return s4() + s4() + s4() + s4();
};

(function () {
    var nativePostMessage = self.postMessage;
    self.postMessage = function () {
        try {
            nativePostMessage.apply(self, arguments);
        }
        catch (e) {
            var data = arguments[0];
            nativePostMessage.call(self, data !== undefined && JSON.stringify(data), arguments[1], arguments[2]);
        }
    }
})();

var msgProcessors = {
    require: function (data) {
        self.importScripts.apply(self, data.value);
    },
    script: function (data) {
        eval(data.value)({ env: data.env, data: data.data, id: data.id });
    },
    methodResult: function (data) {
        var method = self.methodListeners[data.methodId];
        if (!method) return;
        method(data.type, data.value);
    },
    methodError: function () {
        var method = self.methodListeners[data.methodId];
        if (!method) return;
        method(data.type, data.value);
    }
};

self.onmessage = function (e) {
    var data = e.data;
    if (typeof data === "string") {
        data = JSON.parse(data);
    }
    if (!msgProcessors.hasOwnProperty(data.type)) {
        return;
    }
    msgProcessors[data.type](data);
};
