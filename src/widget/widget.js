/**
 * @file
 * webapp通用组件父类
 * @author oupeng-fe
 * @version 1.1
 * @require lib/class.js
 * @require lib/util.js
 * @require lib/dom.js
 * @require lib/event.js
 */
;(function(o, undefined) {

    "use strict";

    /**
     * @class octopus.Widget
     * @desc octopus-ui的父类
     * @param options {Object}
     * @param options.el {DOMElement} 根节点 如果没有则创建一个div
     * @param options.id {String} widget的id 也会成为根节点的id
     * @param options.eventListeners {Object} 用以批量添加事件
     * @example
     * var widget = new Widget({
     *     id: "widget",
     *     eventListeners: {
     *         "onTouch": function onTouch() {},
     *         "onMove": function onMove() {},
     *         "scope": this
     *     }
     * });
     * @return new Widget
     */
    o.Widget = o.define({

        /**
         * @private
         * @property id
         * @type {String}
         */
        id: null,

        /**
         * @private
         * @property options
         * @type {Object}
         */
        options: null,

        /**
         * @private
         * @property el
         * @desc widget的根节点
         * @type {DOMELement}
         */
        el: null,

        /**
         * @private
         * @property container
         * @desc widget的容器
         * @type {DOMElement}
         */
        container: null,

        /**
         * @private
         * @property autoActivate
         * @desc 是否对像生成完就直接渲染，标志位
         * @type {Boolean}
         */
        autoActivate: false,

        /**
         * @private
         * @property active
         * @desc 是否处于激活状态
         * @type {Boolean}
         */
        active: false,

        /**
         * @private
         * @property events
         * @type {octopus.Events}
         */
        events: null,

        /**
         * @private
         * @property isShow
         * @type {Boolean}
         */
        isShow: false,

        /**
         * @private
         * @property gesture
         * @type {octopus.gesture}
         */
        gesture: null,

        /**
         * @private
         * @property eventListeners
         * @type {Object}
         * @desc 事件监听回调列表
         */
        eventListeners: null,

        /**
         * @private
         * @property widgetManager
         * @type {octopus.WidgetManager}
         * @desc widget管理器
         */
        widgetManager: null,

        /**
         * @private
         * @constructor octopus.Widget.initialize
         * @desc 构造函数
         * @param options  -   {Object}
         */
        initialize: function(options) {
            options = options || {};
            this.addOptions(options);
            this.events = new o.Events(this);
            this.gesture = o.gesture;
            this.id = this.id || o.util.createUniqueID(this.CLASS_NAME + "_");
            if(this.eventListeners instanceof Object) {
                this.events.register(this.eventListeners);
            }
            this.el = this.el || document.createElement("div");
            !!this.el.id ? this.id = this.el.id : this.el.id = this.id;
        },

        /**
         * @public
         * @method octopus.Widget.render
         * @desc 渲染
         * @param container {DOMElement}
         */
        render: function(container) {
            var len = arguments.length;
            if(len == 0) {
                this.container = this.container || document.body;
            } else {
                this.container = o.g(arguments[0]);
            }
            if(this.container.appendChild === undefined) {
                throw new Error("Illegal Dom!")
            } else {
                if(!!arguments[1]) {
                    var clonenode = o.dom.cloneNode(this.container, true);
                    this.appendChild(this.el, clonenode);
                    this.container.parentNode.replaceChild(clonenode, this.container);
                    this.container = clonenode;
                } else {
                    this.appendChild(this.el, this.container);
                }
            }
            if(!this.active) {
                this.activate();
            }
            if(!this.isShow) {
                this.show();
            }
        },

        /**
         * @private
         * @method octopus.Widget.appendChild
         */
        appendChild: function(dom, container) {
            container.appendChild(dom);
        },

        /**
         * @public
         * @method octopus.Widget.activate
         * @desc 激活控件
         */
        activate: function() {
            if(this.active) return;
            o.dom.addClass(this.el, "activate");
            this.active = true;
        },

        /**
         * @public
         * @method octopus.Widget.deactivate
         * @desc 挂起控件
         */
        deactivate: function() {
            if(!this.active)    return;
            o.dom.removeClass(this.el, "activate");
            this.active = false;
        },

        /**
         * @public
         * @method octopus.Widget.destroy
         * @desc 摧毁
         */
        destroy: function() {
            if(this.container) {
                this.container.removeChild(this.el);
                this.container = null;
            }
            this.el = null;
        },

        /**
         * @public
         * @method octopus.Widget.on
         * @desc 监听自定义事件 如果为手势事件 则监听的是根节点触发的
         * @param type {String}
         * @param func {Function}
         * @param opv {Object}
         */
        on: function(type, func, opv) {
            var GESTURES = o.Widget.GESTURES;
            if(GESTURES.indexOf(type) != -1) {
                this.gesture(this.el, opv).on(type, func);
                return;
            }
            this.events.on(type, func);
        },

        /**
         * @public
         * @method octopus.Widget.un
         * @desc 去除监听 与on相对
         * @param type {String}
         * @param func {Function}
         */
        un: function(type, func) {
            this.events.un(type, func);
        },

        /**
         * @public
         * @method octopus.Widget.notify
         * @desc 触发某自定义事件
         * @param type {String}
         * @param evt {Object}
         */
        notify: function(type, evt) {
            this.events.triggerEvent(type, evt);
        },

        /**
         * @private
         * @method addOptions
         * @desc 深度绑定
         * @param newOptions  -   {Object}
         */
        addOptions: function(newOptions) {
            if (this.options == null) {
                this.options = {};
            }
            o.extend(this.options, newOptions);
            o.extend(this, newOptions);
        },

        /**
         * @public
         * @method octopus.Widget.show
         * @desc 显示widget
         */
        show: function() {
            if(this.isShow) return;
            this.isShow = true;
            this.el.style.display = "block";
        },

        /**
         * @public
         * @method octopus.Widget.hidden
         * @desc 隐藏widget
         */
        hidden: function() {
            if(!this.isShow)    return;
            this.isShow = false;
            this.el.style.display = "none";
        },

        /**
         * @public
         * @method octopus.Widget.toggleVisible
         * @desc 切换显示状态
         */
        toggleVisible: function() {
            if(this.isShow) {
                this.hidden();
            } else {
                this.show();
            }
        },

        /**
         * @public
         * @method octopus.Widget.clone
         * @returns {*}
         */
        clone: function() {
            return eval("new " + this.CLASS_NAME + "(o.util.clone(this.options))");
        },

        /**
         * @public
         * @method octopus.Widget.getEl
         * @desc 拿widget的根节点
         */
        getEl: function() {
            return this.el;
        },

        /**
         * @public
         * @method octopus.Widget.getHeight
         * @desc 拿到widget的高度
         */
        getHeight: function() {
            return o.dom.getHeight(this.el) || o.dom.getStyle(this.el, "height");
        },

        /**
         * @public
         * @method octopus.Widget.getWidth
         * @desc 拿到widget的宽度
         */
        getWidth: function() {
            return o.dom.getWidth(this.el) || o.dom.getStyle(this.el, "width");
        },

        /**
         * @public
         * @method octopus.Widget.setManager
         * @desc widget被注册进widgetManager
         * @param m
         */
        setManager: function(m) {
            this.widgetManager = m;
        },

        /**
         * @public
         * @method octopus.Widget.setZIndex
         * @desc 设置控件的zindex值
         * @param z {String}
         */
        setZIndex: function(z) {
            this.el.style.zIndex = z;
        },

        CLASS_NAME: "octopus.Widget"
    });

    o.Widget.GESTURES = ["tap", "lontap", "doubletap", "swipe", "swipeleft",
        "swiperight", "swipeup", "swipedown", "drag", "drapleft", "dragright",
        "dragup", "dragdown", "touch", "release"];

    /**
     * @method octopus.widgetManager
     * @desc 返回一个widget的管理器
     * @param el {DOMElement}
     * @param opts {Object}
     * @returns {o.WidgetManager}
     */
    o.widgetManager = function(el, opts) {
        return new o.WidgetManager(el, opts);
    };

    /**
     * @class octopus.WidgetManager
     * @desc widget管理器
     * @param el {DOMElement} 管理器覆盖的节点 必须有的参数
     * @param opts {Object} 额外参数 非必需
     * @param opts.classFilter {String} 符合条件的节点必需包括这个class 默认为"octopusui-container"
     * @param opts.supportType {Array} 当前这个管理器支持的控件类型 默认为 slider refresh menu mask back2top
     */
    o.WidgetManager = o.define({

        /**
         * @private
         * @property el
         * @type {DOMElement}
         * @desc 管理器覆盖的节点容器
         */
        el: null,

        /**
         * @private
         * @property els
         * @type {Array}
         * @desc 符合条件的节点集合
         */
        els: null,

        /**
         * @private
         * @property opts
         * @desc 参数项
         */
        opts: null,

        /**
         * @private
         * @property classFilter
         * @type {String}
         * @desc 符合条件节点的class
         */
        classFilter: null,

        /**
         * @private
         * @property widgets
         * @desc 管理器里已拿到的控件
         * @type {Array}
         */
        widgets: null,

        /**
         * @private
         * @property supportType
         * @desc 支持的控件类型集合
         */
        supportType: null,

        /**
         * @private
         * @property event
         */
        event: null,

        /**
         * @private
         * @constructor
         * @param el {String | DOMElement} 解析的容器
         * @param opts {Object} 传入的参数
         */
        initialize: function(el, opts) {
            this.opts = o.extend({}, opts || {});
            this.el = o.g(el);
            if(!o.util.isNode(this.el))  throw new Error("require a node to initialize!");
            this.els = [];
            this.event = new o.Events(this);
            this.widgets = [];
            this.supportType = this.opts.supportType || ["slider", "back2top"];
            this.classFilter = this.opts.classFilter || ".octopusui-container";
            return this;
        },

        /**
         * @public
         * @method octopus.WidgetManager.init
         * @desc 开始对指定节点下的符合条件的html片段控件化
         */
        init: function() {
            var els = o.$(this.classFilter, this.el),
                that = this;
            o.util.each(els, function(item) {
                if(o.util.isNode(item)) {
                    that.els.push(item);
                }
            });
            if(this.els.length == 0)    return;
            o.util.each(this.els, o.util.bind(this.initWidgets, this));
        },

        /**
         * @private
         * @method initWidgets
         * @param item 单个widget的html片段的容器
         */
        initWidgets: function(item) {
            var type = o.dom.data(item, "octopusui-type"),
                index = this.supportType.indexOf(type);
            if(index == -1 || o.dom.data(item, "octopusui-loaded"))   return;
            var widget = this[this.supportType[index]](item);
            this.register(widget);
            o.dom.data(widget.el, {
                "octopusui-loaded": "true"
            });
        },

        /**
         * @private
         * @method getWidgetBy
         * @param type {String} 获取类型
         * @param filter {String} 获取节点的选择器
         */
        getWidgetBy: function(type, filter) {
            var widgets = [],
                len = this.widgets.length,
                i = len;
            for(; i--; ) {
                var widget = this.widgets[i];
                if(widget[type] == filter) {
                    if(type == "id") return widget;
                    widgets.push(widget);
                }
            }
            return widgets;
        },

        /**
         * @public
         * @method octopus.WidgetManager.getWidgetById
         * @param id {String}
         * @desc 根据widget的id拿到widget对象
         */
        getWidgetById: function(id) {
            return this.getWidgetBy("id", id);
        },

        /**
         * @public
         * @method octopus.WidgetManager.getWidgetByClass
         * @param c {String}
         * @desc 根据widget的class_name拿widget对象集合
         */
        getWidgetByClass: function(c) {
            return this.getWidgetBy("CLASS_NAME", c);
        },

        /**
         * @public
         * @method octopus.WidgetManager.slider
         * @desc 创建一个轮播图
         * @param el {DOMElement}
         */
        slider: function(el) {
            return o.Widget.slider(el);
        },

        /**
         * @public
         * @method octopus.WidgetManager.back2top
         * @desc 创建一个fixed的元素
         * @param el {DOMElement}
         */
        back2top: function(el) {
            return o.Widget.back2top(el);
        },

        /**
         * @public
         * @method octopus.WidgetManager.register
         */
        register: function(widget) {
            if(this.widgets.indexOf(widget) != -1)  return false;
            this.widgets.push(widget);
            widget.setManager(this);
        },

        /**
         * @public
         * @method octopus.WidgetManager.unregister
         */
        unregister: function(widget) {
            var index = this.widgets.indexOf(widget);
            if(index == -1) return false;
            this.widgets[index].setManager(null);
            this.widgets.splice(index, 1);
        },

        CLASS_NAME: "octopus.WidgetManager"
    });

})(octopus);