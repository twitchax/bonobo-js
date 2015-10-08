(function(factory) {

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(self);
    } else {
        self.Bonobo = self.bN = factory(self);
    }

})(function(s) {
    
    'use strict';

    var _internal_ = {},
        _internal_bonobo, Employee, Promise,
        _internal_employees = {};

    var slice = Array.prototype.slice;

    _internal_.isDefined = function(o) {
        return typeof o !== 'undefined';
    };

    _internal_.isImported = (function() {
        return !_internal_.isDefined(s.document);
    })();

    _internal_.isSupported = true;

    _internal_.noOp = function() {};
    
    _internal_.buildArgs = function(method, data) {
        var args = [{ method: method, userData: data }];
        return args;
    };

    _internal_.stringToArrayBuffer = function(str) {
        var buffer = new ArrayBuffer(str.length * 2);
        var bufferView = new Uint16Array(buffer);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufferView[i] = str.charCodeAt(i);
        }
        return buffer;
    };

    _internal_.arrayBufferToString = function(buffer) {
        var str = '';
        var bytes = new Uint16Array(buffer);
        for (var i = 0, buffLen = (bytes.byteLength / 2); i < buffLen; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return str;
    };

    _internal_.getConstructorName = function(o) {
        return Object.prototype.toString.call(o).match(/\[object (\w*)\]/)[1];
    };

    _internal_.getFunctionName = function(str) {
        return str.match(/function (\w*)/)[1];
    };

    var d = document, w = window;

    _internal_bonobo = function(ref) {
        if (typeof ref === 'undefined') throw '[Bonobo] Your employee needs a reference.';
        return (ref in _internal_employees) ? _internal_employees[ref] : new Employee(ref);
    };

    _internal_.isSupported = (function() {
        return 'Worker' in w &&
            'Blob' in w &&
            ('webkitURL' in w || 'URL' in w) &&
            !!(function() {
                try {
                    _internal_.blobURL = w.URL || w.webkitURL;
                    var test = _internal_.blobURL.createObjectURL(new Blob([';'], { type: 'text/javascript' }));
                    var wrk = new Worker(test);
                    wrk.terminate();
                    _internal_.blobURL.revokeObjectURL(test);
                    return true;
                } catch (e) {
                    return false;
                }
            })();
    })();

    if (_internal_.isSupported) {
        _internal_.location = (function() {
            function cleanPathName() {
                var path = d.location.pathname.replace(/\/(?:.(?!\/))+\.(html?|php|do)$/g, '');
                path = path.slice(-1) === '/' ? path : path + '/';
                return path;
            }

            return d.location.protocol + '//' + d.location.hostname + (d.location.port ? ':' + d.location.port : '') + cleanPathName();
        })();
    } else {
        _internal_.removeScripts = function(ref) {
            var el = d.querySelectorAll('[rel='+ref+']');
            for (var i = 0; i < el.length; i++) {
                el[i].parentNode.removeChild(el[i]);
            }
        };

        _internal_.loadScripts = function() {
            var _internal_this = this;
            var args = slice.call(arguments);
            var _internal_prm = new Promise().bind(_internal_this);

            function source(src) {
                var scripts = d.getElementsByTagName('script');
                for (var i = 0; i < scripts.length; i++) {
                    var s = scripts[i];
                    if (s.getAttribute('src') === 'src') {
                        return true;
                    }
                }
                return false;
            }

            function script(s) {
                var _internal_promise = new Promise();
                var src = s;
                if (source(s.src)) {
                    setTimeout(_internal_promise.resolve, 0);
                    return _internal_promise;
                }
                var p = d.getElementsByTagName('script')[0];
                var f = d.createElement('script');
                var done = false;
                f.async = true;
                f.src = src  + '?' + Math.floor(Math.random() * new Date().getTime());
                f.onload = f.onreadystatechange = function() {
                    if ( !done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') )
                    {
                        done = true;
                        setTimeout(_internal_promise.resolve, 0);
                        f.onload = f.onreadystatechange = null;
                    }
                };
                p.parentNode.insertBefore(f, p);
                f.setAttribute('rel', _internal_this.ref);
                return _internal_promise;
            }

            function loop() {
                if (args.length) {
                    script(args.shift()).then(loop);
                } else {
                    _internal_prm.resolve();
                }
            }

            loop();

            return _internal_prm;
        };
    }

    Promise = function() {
        var _internal_self = this;
        _internal_self.scope = _internal_self;
        _internal_self.stack = [];
        _internal_self.resolve = function(r) {
            while (_internal_self.stack.length) {
                return _internal_self.stack.shift().call(_internal_self.scope, r);
            }
        };
        _internal_self.bind = function(scope) {
            _internal_self.scope = scope;
            return _internal_self;
        };
        _internal_self.then = function(s,e) {
            _internal_self.stack.push(s);
            return _internal_self;
        };
    };

    Employee = function(ref) {
        var _internal_self = this;
        _internal_self.ref = ref;
        _internal_self.scripts = [];
        _internal_self.methods = {};
        _internal_self.scope = '';
        _internal_self.blob = undefined;
        _internal_self.worker = undefined;
        _internal_self.fallback = _internal_.noOp;
        _internal_self.doneHandler = _internal_.noOp;
        _internal_self.errorHandler = _internal_.noOp;
        _internal_self.userHandlers = {};
        _internal_self.messageHandler = function(e) {

            function getData(response) {
                var data = response.userData;
                if ('transferred' in response) {
                    switch (response.transferred) {
                        case 'Object':
                        case 'Array':
                            data = JSON.parse(_internal_.arrayBufferToString(data));
                            break;
                        case 'String':
                            data = _internal_.arrayBufferToString(data);
                            break;
                    }
                }
                return data;
            }

            if (e.type === 'error') {
                _internal_self.errorHandler.call(_internal_self, e.message);
            } else if (_internal_self.userHandlers.hasOwnProperty(e.data.method)) {
                _internal_self.userHandlers[e.data.method].call(_internal_self, getData(e.data));
            } else {
                switch (e.data.method) {
                    case 'log':
                        Function.prototype.apply.call(s.console.log, s.console, ['[Bonobo(\''+_internal_self.ref+'\') : LOG]:'].concat(getData(e.data)));
                    break;
                    case 'response':
                        _internal_self.doneHandler.call(_internal_self, getData(e.data));
                    break;
                }
            }
        };
        _internal_employees[ref] = _internal_self;
    };

    Employee.prototype = {
        hoist : function(fn) {
            if (fn() === void 0) {
                this.scope = fn.toString().replace(/^function\s?(?:\w+)?\(\)\s?\{(.|[\s\S]*)\}/g, function(match, internals) { return internals; });
            } else {
                var obj = fn();
                this.scope = Object.keys(obj).reduce(function(acc, key) {
                    acc += 'var ' + key + ' = ' + (typeof obj[key] === 'function' ? obj[key].toString() : obj[key]) + ';\n';
                    return acc;
                }, '');
            }
            return this;
        },
        require : function() {
            var args = slice.call(arguments);
            if (_internal_.isSupported) {
                this.scripts = this.scripts.concat(args.map(function(scr) {
                    return scr.indexOf('http') > -1 ? scr : scr.slice(0, 1) === '/' ? _internal_.location + scr.slice(1) : _internal_.location + scr;
                }));
            } else {
                this.scripts = args;
            }
            return this;
        },
        define : function(method, fn) {
            var _internal_this = this;
            if (!fn) {
                fn = method;
                method = _internal_.getFunctionName(fn.toString());
                if (method === '') throw '[Bonobo] Please define a function using a named function OR a string and function.';
                if (method in _internal_this) throw '[Bonobo] \'' + method + '\' is reserved or already defined, please use something else.';
            }
            _internal_this.methods[method] = fn;
            _internal_this[method] = function(data, transfer) {
                _internal_this.run(method, data, transfer);
            };
            return _internal_this;
        },
        run : function(method, data, transfer) {
            if (_internal_.isDefined(this.worker)) {
                if (_internal_.isSupported) {
                    this.worker.postMessage.apply(this.worker, _internal_.buildArgs(method, data, transfer));
                } else {
                    this.worker[method](data);
                }
            } else {
                throw '[Bonobo] Please build/compile your worker before attempting to interact with it.';
            }
        },
        done : function(fn) {
            this.doneHandler = fn;
            return this;
        },
        error : function(fn) {
            this.errorHandler = fn;
            return this;
        },
        on : function(ev, fn) {
            this.userHandlers[ev] = fn;
            return this;
        },
        stop : function() {
            if (_internal_.isDefined(this.worker) && _internal_.isSupported) {
                this.worker.terminate();
            }
            return this;
        },
        destroy : function() {
            this.blob = undefined;
            if (_internal_.isDefined(this.worker)) {
                if (_internal_.isSupported) {
                    this.worker.terminate();
                    _internal_.blobURL.revokeObjectURL(this.blobURL);
                } else {
                    _internal_.removeScripts(this.ref);
                }
            }
            this.worker = undefined;
            delete _internal_employees[this.ref];
        },
        build : function() {
            var workerFn = {
                done : function(data, transfer) {
                    self.postMessage.apply(self, _internal_.buildArgs('response', data, transfer));
                },
                emit : function(ev, data, transfer) {
                    self.postMessage.apply(self, _internal_.buildArgs(ev, data, transfer));
                },
                log : function() {
                    self.postMessage.apply(self, _internal_.buildArgs('log', slice.call(arguments)));
                },
                error : function() {
                    self.postMessage.apply(self, _internal_.buildArgs('error', slice.call(arguments)));
                },
                importJS : function() {
                    self.importScripts.apply(self, slice.call(arguments).map(function(scr) {
                        return scr.indexOf('http') > -1 ? scr : scr.slice(0, 1) === '/' ? _internal_.location + scr.slice(1) : _internal_.location + scr;
                    }));
                },
                stop : function() {
                    self.close();
                }
            };
            var build, _internal_promise = new Promise().bind(this);
            if (_internal_.isSupported) {
                build = [
                    this.scripts.length ? 'importScripts(\'' + this.scripts.join('\',\'') + '\');' : '',
                    'var slice = Array.prototype.slice;',
                    'var _internal_ = {',
                    [
                        'buildArgs',
                        'arrayBufferToString',
                        'stringToArrayBuffer',
                        'getConstructorName'
                    ].map(function(fn) {
                        return fn + ': ' + _internal_[fn].toString() + ',';
                    }).join('\n').slice(0, -1),
                    '};',
                    'var Bonobo = {',
                    Object.keys(workerFn).map(function(fn) {
                        return fn + ': ' + workerFn[fn].toString() + ',';
                    }).join('\n').slice(0, -1),
                    '};',
                    'var console = { log : Bonobo.log };',
                    this.scope,
                    'onmessage = function(e) {',
                        'var data = e.data.userData;',
                        'if (\'transferred\' in e.data) {',
                            'switch(e.data.transferred) {',
                                'case \'Object\':',
                                'case \'Array\':',
                                    'data = JSON.parse(_internal_.arrayBufferToString(data));',
                                    'break;',
                                'case \'String\':',
                                    'data = _internal_.arrayBufferToString(data);',
                                    'break;',
                            '}',
                        '}',
                        'switch(e.data.method) {',
                        Object.keys(this.methods).map(function(fn) {
                            return [
                                'case \'' + fn + '\':',
                                    '(' + this.methods[fn].toString().replace(/importScripts/g, 'Bonobo.importJS') + ').apply(self,[data]);',
                                'break;'
                            ].join('\n');
                        }, this).join('\n'),
                        '}',
                    '}'
                ];
                this.blob = new Blob([ build.join('\n') ], { type : 'text/javascript' });
                this.blobURL = _internal_.blobURL.createObjectURL(this.blob);
                this.worker = new Worker(this.blobURL);
                this.worker.onmessage = this.messageHandler;
                this.worker.onerror = this.messageHandler;
                setTimeout(_internal_promise.resolve, 0);
            } else {
                var _internal_self = this;
                var fn = {
                    done : function(data) {
                        _internal_self.doneHandler.call(_internal_self, data);
                    },
                    emit : function(ev, data) {
                        if (_internal_self.userHandlers.hasOwnProperty(ev)) _internal_self.userHandlers[ev].call(_internal_self, data);
                    },
                    log : function() {
                        Function.prototype.apply.call(s.console.log, s.console, ['[Bonobo(\''+_internal_self.ref+'\') : LOG]:'].concat(slice.call(arguments)));
                    },
                    error : function(data) {
                        _internal_self.errorHandler.call(_internal_self, data);
                    },
                    importJS: function() {
                        return _internal_.loadScripts.apply(_internal_self, slice.call(arguments));
                    },
                    stop : function() {
                        _internal_self.stop();
                    }
                };
                _internal_.loadScripts.apply(_internal_self, _internal_self.scripts).then(function() {
                    var m, handleScripts = function(match, args, rest) {
                        return '_internal_scope.importJS(' + args + ').then(function() {' + rest + '); };';
                    };
                    build = [
                        'var _internal_scope = this;',
                        _internal_self.scope
                    ];
                    for (m in _internal_self.methods) {
                        build.push('var ' + m + ' = ' + _internal_self.methods[m].toString()
                            .replace(/Bonobo|bN|console/g, '_internal_scope')
                            .replace(/(?:_internal_scope.importJS|importScripts)+\(([^\)]+)\);?([^]*)/g, handleScripts)
                        );
                    }
                    build.push('return {');
                    for (m in _internal_self.methods) {
                        build.push(m + ' : ' + m + ',');
                    }
                    build[build.length - 1] = build[build.length - 1].slice(0,-1);
                    build.push('}');
                    _internal_self.worker = new Function(build.join('\n')).call(fn);
                    setTimeout(_internal_promise.resolve, 0);
                });
            }
            return _internal_promise;
        },
        compile : function() {
            return this.build();
        }
    };

    return _internal_bonobo;

});
