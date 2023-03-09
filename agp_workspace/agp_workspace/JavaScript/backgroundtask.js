/*
* JQuery WYSIWYG Web Form Designer
*.
* Main component of JQuery Form Builder plugin, the Form Builder container itself
* consists of builder palette contains widgets supported by the form builder and
* builder panel where the constructed form display.
*
* Revision: 0
* Version: 0.1
* Copyright 2013 AgilePoint Inc
*
* Date: Mon Oct 28 22:43:32 GMT+05:30 2013
*/
'use strict';
(function ($) {
    var workerDir = $('script[src*="backgroundtask.js"]').attr('src').replace("backgroundtask.js", '{src}'),
    mapFileName = function (src) {
        return workerDir.replace('{src}', src);
    },
    src = mapFileName('eval.js'),

     asyncEach = function (array, eachcallback, finalcallback, context) {
         var isObject = typeOfExact(array) == 'object';
         var keys = isObject ? Object.keys(array) : "";
         var index = 0;
         var Alength = isObject ? keys.length : array.length;
         var method = function (err) {
             if (Alength <= index || err) {
                 finalcallback.call(context || this, err);
                 return;
             }
             setTimeout(function () {
                 var item = isObject ? array[keys[index]] : array[index];
                 eachcallback.call(context || this, item, method, isObject ? keys[index++] : index++);
             }, 0);
         };
         method();
     },

        jobScopeMethods = {
            asyncEach: asyncEach,

            notifyComplete: function (e) {
                self.postMessage({ type: 'complete', id: context.id, value: e });
            },
            raiseEvent: function (name, eventArgs) {
                self.postMessage({ type: 'event', name: name, id: context.id, value: eventArgs });
            },
            notifyError: function (e) {
                self.postMessage({ type: 'error', id: context.id, value: e });
            }
        };

    var compiledJobScopeMethods = '';
    for (var key in jobScopeMethods) {
        var method = jobScopeMethods[key];
        compiledJobScopeMethods += 'var ' + key + ' = ' + method.toString() + ';';
    }

    //method code for the methods in page that needs to be called from worker
    var methodTemplateSrc = (function (params, callback, methodName) {
        self.methodListeners = self.methodListeners || {};

        var listenerId = self.guid();
        self.methodListeners[listenerId] = function (type, data) {
            if (type == 'methodResult')
                callback(data, null);
            else
                callback(null, data);
        };

        self.postMessage({ type: 'method', name: methodName, value: params, id: context.id, methodId: listenerId });

    }).toString();



    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + s4() + s4();
    };


    var BackgroundTask = function (options) {
        this.options = $.extend(true, {
            autoTerminate: true,
            //environment variable for all the tasks queued on this worker
            env: {

            },
            //WARN:currently loading scripts from worker directory only supported
            require: [],
            //global methods and event handlers for all the tasks queued to make use of
            global: {
                events: {},
                methods: {},
                workerMethods: {}
            }
        }, options);
        this._queue = {};
    }

    BackgroundTask.prototype._require = function (worker, src) {
        //me._required = me._required || '';
        worker.postMessage({ value: src, type: 'require' });

        //.then(function (content) {
        //    me._required += content;
        //});

    };

    BackgroundTask.prototype.getQueueLength = function () {
        return Object.keys(this._queue).length;
    };

    BackgroundTask.prototype._spawnJob = function (callback, data, jobOptions) {
        var jobId = guid();

        this._queue[jobId] = { data: data, deferred: $.Deferred(), options: jobOptions };

        var callbackCode = 'try{(' + callback.toString() + ')(context.data);}catch(e){notifyError({message:e.message, stack: e.stack});}';


        var jobSpecificScopeMethods = '';

        //creating worker couterparts of the methods declared in page
        for (var methodName in jobOptions.methods) {

            var methodSrc = 'function (params, callback) { (' + methodTemplateSrc + ')(params, callback, "' + methodName + '") }';
            jobSpecificScopeMethods += 'var ' + methodName + '=' + methodSrc + ';';
        }

        var jobSpecificScopeWorkerMethods = '';
        if (jobOptions.workerMethods) {
            for (var methodName in jobOptions.workerMethods) {
                jobSpecificScopeWorkerMethods += "var " + methodName + ' = ' + jobOptions.workerMethods[methodName] + ';';
            }
        }

        var required = '';

        this._require(this._worker, jobOptions.require);

        var envVariables = '', envInOptions = $.extend(this.options.env, jobOptions.env);

        for (var variableName in envInOptions) {
            envVariables += 'var $' + variableName + ' = context.env.' + variableName + ';';
        }
        var scriptParts = ['(function(context){ ', (required || ''), envVariables, compiledJobScopeMethods, jobSpecificScopeMethods, jobSpecificScopeWorkerMethods, callbackCode, '})'];
        var script = scriptParts.join(' ');
        this._worker.postMessage({
            type: 'script',
            value: script,
            env: envInOptions, data: data, id: jobId
        });



        return this._queue[jobId].deferred.promise();
    };

    BackgroundTask.prototype.terminate = function () {
        this._worker && this._worker.terminate();
        this._worker = undefined;
    };

    BackgroundTask.prototype._checkAndTerminate = function () {
        var me = this;
        if (me.options.autoTerminate && Object.keys(me._queue).length == 0) {
            me.terminate();
        }
    };

    BackgroundTask.prototype.run = function (callback, data, jobOptions) {

        var me = this, worker = this._worker;

        //import global script dependencies
        if (!worker) {
            worker = this._worker = new Worker(src);
            worker.postMessage = function () {
                try {
                    Worker.prototype.postMessage.apply(worker, arguments);
                }
                catch (e) {
                    var data = arguments[0];
                    Worker.prototype.postMessage.call(worker, data !== undefined && JSON.stringify(data));
                }
            }
            this._require(worker, this.options.require);
        }



        //merging global event handlers and methods with job specific ones
        jobOptions = $.extend(true, this.options.global, jobOptions || { require: [], workerMethods: {} });

        if (!jobOptions.require) jobOptions.require = [];


        worker.onmessage = function (e) {
            var data = e.data;
            typeof data == "string" && (data = JSON.parse(data));
            var jobId = e.data.id;
            if (!me._queue[jobId]) return;
            var job = me._queue[jobId];
            switch (data.type) {
                case 'error':
                    job.deferred.reject(data.value);
                    break;
                case 'complete':
                    job.deferred.resolve(data.value);
                    break;
                case 'event':
                    job.options.events.hasOwnProperty(data.name) && job.options.events[data.name](data.value);
                    return;
                case 'method':
                    job.options.methods.hasOwnProperty(data.name) && job.options.methods[data.name](data.value)
                        .then(function (val) {
                            worker.postMessage({ type: 'methodResult', value: val, id: job.id, methodId: data.methodId });
                        }).fail(function (e) {
                            worker.postMessage({ type: 'methodError', value: e, id: job.id, methodId: data.methodId });
                        });
                    return;
            }
            me._queue[jobId] = undefined;
            delete me._queue[jobId];

            me._checkAndTerminate();
        };
        return me._spawnJob(callback, data, jobOptions);
    }
    window.BackgroundTask = BackgroundTask;
})(jQuery);