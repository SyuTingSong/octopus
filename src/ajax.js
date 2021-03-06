/**
 * @file
 * @author oupeng-fe
 * @version 1.1
 * webapp通用组件基础库
 * ajax方法
 * @require lib/class.js
 * @require lib/util.js
 * @require lib/dom.js
 */
;(function (o, undefined) {

    o.ajax = o.ajax || {};

    /**
     * @namespace octopus.ajax
     * @desc ajax请求方法
     */
    o.extend(o.ajax, {

        /**
         * @private
         * @property DEFAULT_CONFIG
         * @type {Object}
         * @desc 配置项
         * type - {String} GET, POST, PUT, DELETE, HEAD, OPTIONS. 默认是GET.
         * url - {String} 请求的地址
         * async - {Boolean} 是否同步请求  默认是true.
         * user - {String} 用户名
         * password - {String} 密码
         * data - {String | Object} POST与PUT提交的数据
         * complete - {Function}
         * success - {Function}
         * error - {Function}
         * scope - {Object}
         * beforeSend   -   {Function} 请求发出前调用
         * timeout  -   {Number} 延时
         */
        DEFAULT_CONFIG: {
            type: "GET",
            url: window.location.href,
            async: true,
            user: undefined,
            password: undefined,
            data: null,
            complete: o.util.empty,
            success: null,
            error: null,
            scope: null,
            beforeSend: null,
            timeout: 0,
            crossDomain: false
        },

        jsonpID: 0,

        jsonType: 'application/json',
        htmlType: 'text/html',

        SCRIPT_REGEX: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        SCRIPT_TYPE_REGEX: /^(?:text|application)\/javascript/i,
        XML_TYPE_REGEX: /^(?:text|application)\/xml/i,
        URL_SPLIT_REGEX: /([^:]*:)\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/,
        BLANK_REGEX: /^\s*$/,
        accepts: {
            script: 'text/javascript, application/javascript',
            json:   this.jsonType,
            xml:    'application/xml, text/xml',
            html:   this.htmlType,
            text:   'text/plain'
        },

        /**
         * @private
         * @property xhr
         * @type {Function}
         */
        xhr: function() { return new window.XMLHttpRequest(); },

        /**
         * @private
         * @method mimeToDataType
         */
        mimeToDataType: function(mime) {
            return mime && ( mime == this.htmlType ? 'html' :
                mime == this.jsonType ? 'json' :
                    this.SCRIPT_TYPE_REGEX.test(mime) ? 'script' :
                        this.XML_TYPE_REGEX.test(mime) && 'xml' ) || 'text'
        },

        /**
         * @private
         * @method request
         * @desc 发出请求 各种
         * @param options {Object} 配置项
         * @return {XMLHttpRequest}
         */
        request: function(options) {
            var defaultConfig = this.DEFAULT_CONFIG,
                config = o.util.applyDefaults(options, defaultConfig),
                dataType = config.dataType,
                url = config.url,
                data = config.data || {},
                headers = config.headers || {},
                urlobj = o.util.createUrlObject(url);
            if(config.type == "jsonp") {
                return o.ajax.ajaxJSONP(options);
            }
            if(!config.crossDomain) {
                config.crossDomain = urlobj.host != window.location.host;
            }
            var customRequestedWithHeader = false,
                headerKey;
            for(headerKey in headers) {
                if (headerKey.toLowerCase() === 'x-requested-with') {
                    customRequestedWithHeader = true;
                }
            }
            if(customRequestedWithHeader === false || !config.crossDomain) {
                headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            data =  o.util.getParameterString(data || {});
            if(config.type != "POST") {
                config.url = o.util.urlAppend(url, data);
            }
            var mime = this.accepts[dataType],
                baseHeaders = {},
                xhr = this.xhr(), abortTimeout;
            if(mime) {
                baseHeaders['Accept'] = mime;
                if(mime.indexOf(',') > -1) {
                    mime = mime.split(',', 2)[0];
                }
                xhr.overrideMimeType && xhr.overrideMimeType(mime)
            }
            headers = o.extend(baseHeaders, headers || {});
            xhr.open(
                config.type, config.url, config.async, config.user, config.password
            );
            for(var header in headers) {
                xhr.setRequestHeader(header, headers[header]);
            }
            var that = this;
            xhr.onreadystatechange = function() {
                if(xhr.readyState == 4) {
                    clearTimeout(abortTimeout);
                    that.runCallbacks(
                        {request: xhr, config: config, requestUrl: config.url}
                    );
                }
            };
            if(config.async === false) {
                xhr.send(data ? data : null);
            } else {
                window.setTimeout(function(){
                    if(xhr.readyState !== 0) { // W3C: 0-UNSENT
                        xhr.send(data ? data : null);
                    }
                }, 0);
            }
            if(config.timeout > 0) {
                abortTimeout = setTimeout(function(){
                    xhr.onreadystatechange = o.util.empty;
                    xhr.abort()
                    var error;
                    if(config.error) {
                        error = (config.scope) ?
                            o.util.bind(config.error, config.scope) :
                            config.error;
                    }
                    error(xhr, "timeout");
                }, config.timeout)
            }
            return xhr;
        },

        /**
         * @private
         * @method runCallbacks
         * @param options {Object}
         */
        runCallbacks: function(options) {
            var request = options.request;
            var config = options.config;
            var complete = (config.scope) ?
                o.util.bind(config.complete, config.scope) :
                config.complete;
            var success;
            if(config.success) {
                success = (config.scope) ?
                    o.util.bind(config.success, config.scope) :
                    config.success;
            }
            var failure;
            if(config.error) {
                failure = (config.scope) ?
                    o.util.bind(config.error, config.scope) :
                    config.error;
            }
            complete(request);
            var result, error = false,
                dataType = config.dataType;
            if((request.status >= 200 && request.status < 300) || request.status == 304 ||
                (request.status == 0 && o.util.createUrlObject(config.url).protocol == "file:")) {
                dataType = dataType || this.mimeToDataType(request.getResponseHeader('content-type'));
                result = request.responseText;
                try {
                    if(dataType == 'script')    (1,eval)(result)
                    else if(dataType == 'xml')  result = request.responseXML
                    else if(dataType == 'json') result = this.BLANK_REGEX.test(result) ? null : JSON.parse(result)
                } catch (e) { error = e }
                options.result = result;
                if(success) {
                    success(request, result);
                }
            } else {
                if(failure) {
                    failure(request, "error");
                }
            }
        },

        /**
         * @public
         * @method octopus.ajax.get
         * @desc 发条get请求
         * @param config {Object}
         * @param config.url {String} 请求地址
         * @param config.async {Boolean} 同异步
         * @param config.complete {Function} 请求结束的callback
         * @param config.success {Function} 请求成功的callback
         * @param config.error {Function} 请求失败的callback
         * @param config.timeout {Number} 超时时间
         * @return {XMLHttpRequest} Request object.
         */
        "get": function(config) {
            config = o.extend(config, {type: "GET"});
            return o.ajax.request(config);
        },

        /**
         * @public
         * @method octopus.ajax.post
         * @desc 发条post请求
         * @param config {Object} 同get
         * @param config.data {Object} 数据
         * @return {XMLHttpRequest} Request object.
         */
        post: function(config) {
            config = o.extend(config, {type: "POST"});
            // set content type to application/xml if it isn't already set
            config.headers = config.headers ? config.headers : {};
            if(!("CONTENT-TYPE" in o.util.upperCaseObject(config.headers))) {
                config.headers["Content-Type"] = "application/xml";
            }
            return o.ajax.request(config);
        },

        /**
         * @public
         * @method octopus.ajax.put
         * @desc 发条put请求
         * @param config {Object} 同post
         * @return {XMLHttpRequest} Request object.
         */
        put: function(config) {
            config = o.extend(config, {type: "PUT"});
            // set content type to application/xml if it isn't already set
            config.headers = config.headers ? config.headers : {};
            if(!("CONTENT-TYPE" in o.util.upperCaseObject(config.headers))) {
                config.headers["Content-Type"] = "application/xml";
            }
            return o.ajax.request(config);
        },

        /**
         * @public
         * @method octopus.ajax.delete
         * @desc 发条delete请求
         * @param config {Object} 同get
         * @return {XMLHttpRequest} Request object.
         */
        "delete": function(config) {
            config = o.extend(config, {type: "DELETE"});
            return o.ajax.request(config);
        },

        /**
         * @public
         * @method octopus.ajax.head
         * @desc 发条head请求
         * @param config {Object} 同get
         * @return {XMLHttpRequest} Request object.
         */
        head: function(config) {
            config = o.extend(config, {type: "HEAD"});
            return o.ajax.request(config);
        },

        /**
         * @public
         * @method octopus.ajax.options
         * @desc 发条options请求.
         * @param config {Object} 同get
         * @return {XMLHttpRequest} Request object.
         */
        options: function(config) {
            config = o.extend(config, {type: "OPTIONS"});
            return o.ajax.request(config);
        },

        /**
         * @private
         * @method _createScriptTag
         */
        _createScriptTag: function(scr, url, charset) {
            scr.setAttribute('type', 'text/javascript');
            charset && scr.setAttribute('charset', charset);
            scr.setAttribute('src', url);
            document.getElementsByTagName('head')[0].appendChild(scr);
        },

        /**
         * @private
         * @Method _removeScriptTag
         */
        _removeScriptTag: function(scr) {
            if (scr.clearAttributes) {
                scr.clearAttributes();
            } else {
                for (var attr in scr) {
                    if (scr.hasOwnProperty(attr)) {
                        delete scr[attr];
                    }
                }
            }
            if(scr && scr.parentNode){
                scr.parentNode.removeChild(scr);
            }
            scr = null;
            delete scr;
        },

        /**
         * @public
         * @method octopus.ajax.ajaxJSONP
         * @param options {Object}
         * @param options.url {String} 请求地址
         * @param options.complete {Function} 成功回调
         * @param options.error {Function} 失败回调
         * @param options.timeout {Number} 超时时长
         */
        ajaxJSONP: function(options) {
            var script = document.createElement('script'),
                defaultConfig = this.DEFAULT_CONFIG,
                prefix = "jsonp",
                callbackName,
                options = o.util.applyDefaults(options, defaultConfig),
                charset = options['charset'],
                data = options["data"] || {},
                timeOut = options['timeout'] || 0,
                timer,
                that = this,
                url = options["url"],
                callback = options["success"] || options["complete"],
                jsonpName = options["jsonp"] || "callback",
                error = options["error"] || o.util.empty;
            if(o.util.isString(callback)) {
                callbackName = callback;
            } else {
                callbackName = prefix + Math.floor(Math.random() * 2147483648).toString(36);
                window[callbackName] = getCallBack(0);
            }
            if(timeOut > 0){
                timer = setTimeout(getCallBack(1), timeOut);
            }
            script.onerror = function() {
                that._removeScriptTag(script);
                if(callbackName in window) {
                    window[callbackName] = function(){};
                }
                error();
            };
            url = o.util.urlAppend(o.util.urlAppend(url,
                o.util.getParameterString(data || {})), jsonpName + "=" + callbackName);
            this._createScriptTag(script, url, charset);
            function getCallBack(onTimeOut) {
                return function() {
                    try {
                        if( onTimeOut ) {
                            error();
                        } else {
                            clearTimeout(timer);
                            callback.apply(window, arguments);
                        }
                        window[callbackName] = o.util.empty;
                    } catch (exception) {}
                    finally {
                        that._removeScriptTag(script);
                    }
                }
            }
            return options["xhr"];
        }
    });
})(octopus);
