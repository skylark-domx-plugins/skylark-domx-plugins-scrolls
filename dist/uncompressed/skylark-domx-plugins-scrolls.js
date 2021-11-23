/**
 * skylark-domx-plugins-scrolls - The skylark scrolls plugins library for dom api extension
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-domx-plugins/skylark-domx-plugins-scrolls/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-domx-plugins-scrolls/scrolls',[
    "skylark-domx-plugins-base/plugins"
],function (plugins) {
    'use strict';

    return plugins.scrolls = {};

});
define('skylark-domx-plugins-scrolls/affix',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./scrolls"
],function(langx,browser,eventer,noder,geom,$,plugins,scrolls){

  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = plugins.Plugin.inherit({
        klassName: "Affix",

        pluginName : "lark.scrolls.affix",

        options : {
          offset: 0,
          target: window
        },

        _construct : function(elm,options) {
          this.overrided(elm,options);

          this.$target = $(this.options.target)
            .on('scroll.affix.data-api', langx.proxy(this.checkPosition, this))
            .on('click.affix.data-api',  langx.proxy(this.checkPositionWithEventLoop, this))

          this.$element     = this.$()
          this.affixed      = null;
          this.unpin        = null;
          this.pinnedOffset = null;

          this.checkPosition();
        },

        getState : function (scrollHeight, height, offsetTop, offsetBottom) {
          var scrollTop    = this.$target.scrollTop()
          var position     = this.$element.offset()
          var targetHeight = this.$target.height()

          if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

          if (this.affixed == 'bottom') {
            if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
            return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
          }

          var initializing   = this.affixed == null
          var colliderTop    = initializing ? scrollTop : position.top
          var colliderHeight = initializing ? targetHeight : height

          if (offsetTop != null && scrollTop <= offsetTop) return 'top'
          if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

          return false
        },

        getPinnedOffset : function () {
          if (this.pinnedOffset) return this.pinnedOffset
          this.$element.removeClass(Affix.RESET).addClass('affix')
          var scrollTop = this.$target.scrollTop()
          var position  = this.$element.offset()
          return (this.pinnedOffset = position.top - scrollTop)
        },

        checkPositionWithEventLoop : function () {
          setTimeout(langx.proxy(this.checkPosition, this), 1)
        },

        checkPosition : function () {
          if (!this.$element.is(':visible')) return

          var height       = this.$element.height()
          var offset       = this.options.offset
          var offsetTop    = offset.top
          var offsetBottom = offset.bottom
          var scrollHeight = Math.max($(document).height(), $(document.body).height())

          if (typeof offset != 'object')         offsetBottom = offsetTop = offset
          if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
          if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

          var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

          if (this.affixed != affix) {
            if (this.unpin != null) this.$element.css('top', '')

            var affixType = 'affix' + (affix ? '-' + affix : '')
            var e         = eventer.create(affixType + '.affix')

            this.$element.trigger(e)

            if (e.isDefaultPrevented()) return

            this.affixed = affix
            this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

            this.$element
              .removeClass(Affix.RESET)
              .addClass(affixType)
              .trigger(affixType.replace('affix', 'affixed') + '.affix')
          }

          if (affix == 'bottom') {
            this.$element.offset({
              top: scrollHeight - height - offsetBottom
            })
          }
        }
  });

  Affix.RESET    = 'affix affix-top affix-bottom'

  plugins.register(Affix);

  return scrolls.Affix = Affix;
});

define('skylark-domx-plugins-scrolls/auto-scroll',[
  "skylark-langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-finder",
  "skylark-domx-geom",
  "skylark-domx-styler",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./scrolls"
],function(langx,browser,eventer,noder,finder,geom,styler,$,plugins,scrolls){

  'use strict';

	// INFINITE SCROLL CONSTRUCTOR AND PROTOTYPE

  var AutoScroll = plugins.Plugin.inherit({
        klassName: "AutoScroll",

        pluginName : "lark.scrolls.autoscroll",

        options : {
			scrollSensitivity: 30,
			scrollSpeed: 10,
			bubbleScroll: true
        },

        _construct : function(rootEl,options) {
	        this.overrided(rootEl,options);
    		this.autoScrolls = [];


			this._autoScroll = langx.debounce( (x,y) => {
				///var _this = rootEl ? rootEl[expando] : window,
				var	sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					winScroller = noder.scrollingElement();

				this.scrollEl = finder.scrollableParent(rootEl, true);


				var layersOut = 0;
				var currentParent = this.scrollEl;
				var autoScrolls = this.autoScrolls;
				do {
					var	el = currentParent,
						rect = geom.boundingRect(el),

						top = rect.top,
						bottom = rect.bottom,
						left = rect.left,
						right = rect.right,

						width = rect.width,
						height = rect.height,

						scrollWidth,
						scrollHeight,

						css,

						vx,
						vy,

						canScrollX,
						canScrollY,

						scrollPosX,
						scrollPosY;


					scrollWidth = el.scrollWidth;
					scrollHeight = el.scrollHeight;

					css = styler.css(el);

					scrollPosX = el.scrollLeft;
					scrollPosY = el.scrollTop;

					if (el === winScroller) {
						canScrollX = width < scrollWidth && (css.overflowX === 'auto' || css.overflowX === 'scroll' || css.overflowX === 'visible');
						canScrollY = height < scrollHeight && (css.overflowY === 'auto' || css.overflowY === 'scroll' || css.overflowY === 'visible');
					} else {
						canScrollX = width < scrollWidth && (css.overflowX === 'auto' || css.overflowX === 'scroll');
						canScrollY = height < scrollHeight && (css.overflowY === 'auto' || css.overflowY === 'scroll');
					}

					vx = canScrollX && (Math.abs(right - x) <= sens && (scrollPosX + width) < scrollWidth) - (Math.abs(left - x) <= sens && !!scrollPosX);

					vy = canScrollY && (Math.abs(bottom - y) <= sens && (scrollPosY + height) < scrollHeight) - (Math.abs(top - y) <= sens && !!scrollPosY);


					if (!autoScrolls[layersOut]) {
						for (var i = 0; i <= layersOut; i++) {
							if (!autoScrolls[i]) {
								autoScrolls[i] = {};
							}
						}
					}

					if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
						autoScrolls[layersOut].el = el;
						autoScrolls[layersOut].vx = vx;
						autoScrolls[layersOut].vy = vy;

						clearInterval(autoScrolls[layersOut].pid);

						if (el && (vx != 0 || vy != 0)) {
							this.scrollThisInstance = true;
							/* jshint loopfunc:true */
							autoScrolls[layersOut].pid = setInterval((function () {
								var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
								var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
								geom.scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
							}).bind({layer: layersOut}), 24);
						}
					}
					layersOut++;
				} while (options.bubbleScroll && currentParent !== winScroller && (currentParent = finder.scrollableParent(currentParent, false)));
			}, 30);
		},

		destroy: function () {
			this._clearAutoScrolls();
            this._cancelThrottle();
			this._nulling();
		},


		handle : function(x,y) {
			this._throttleTimeout = this._autoScroll(x,y);
		},

		_clearAutoScrolls : function () {
			this.autoScrolls.forEach(function(autoScroll) {
				clearInterval(autoScroll.pid);
			});
			this.autoScrolls = [];
		},

		_cancelThrottle : function () {
			//clearTimeout(_throttleTimeout);
			//_throttleTimeout = void 0;
			if (this._throttleTimeout && this._throttleTimeout.cancel) {
				this._throttleTimeout.cancel();
				this._throttleTimeout = void 0;
			}
		},

	
		_nulling : function () {

			
			this.pointerElemChangedInterval = null;
			this.lastPointerElemX = null;
			this.lastPointerElemY = null;

			this.scrollEl =
			this.scrollParentEl =
			this.autoScrolls.length = null;

		}

  });


  plugins.register(AutoScroll);

  return scrolls.AutoScroll = AutoScroll;	
});

define('skylark-domx-plugins-scrolls/infinite-scroll',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./scrolls"
],function(langx,browser,eventer,noder,geom,$,plugins,scrolls){

  'use strict';

	// INFINITE SCROLL CONSTRUCTOR AND PROTOTYPE

  var InfiniteScroll = plugins.Plugin.inherit({
        klassName: "InfiniteScroll",

        pluginName : "lark.scrolls.infinitescroll",

        options : {
			dataSource: null,
			hybrid: false,//can be true or an object with structure: { 'label': (markup or jQuery obj) }
			percentage: 95//percentage scrolled to the bottom before more is loaded
        },

        _construct : function(elm,options) {
	        this.overrided(elm,options);
			this.$element = this.$();
			this.$element.addClass('infinitescroll');
			//this.options = langx.mixin({}, $.fn.infinitescroll.defaults, options);

			this.curScrollTop = this.$element.scrollTop();
			this.curPercentage = this.getPercentage();
			this.fetchingData = false;

			this.$element.on('scroll.domx.infinitescroll', langx.proxy(this.onScroll, this));
			this.onScroll();
		},

		destroy: function () {
			this.$element.remove();
			// any external bindings
			// [none]

			// empty elements to return to original markup
			this.$element.empty();

			return this.$element[0].outerHTML;
		},

		disable: function () {
			this.$element.off('scroll.domx.infinitescroll');
		},

		enable: function () {
			this.$element.on('scroll.domx.infinitescroll', langx.proxy(this.onScroll, this));
		},

		end: function (content) {
			var end = $('<div class="infinitescroll-end"></div>');
			if (content) {
				end.append(content);
			} else {
				end.append('---------');
			}

			this.$element.append(end);
			this.disable();
		},

		getPercentage: function () {
			var height = (this.$element.css('box-sizing') === 'border-box') ? this.$element.outerHeight() : this.$element.height();
			var scrollHeight = this.$element.get(0).scrollHeight;
			return (scrollHeight > height) ? ((height / (scrollHeight - this.curScrollTop)) * 100) : 0;
		},

		fetchData: function (force) {
			var load = $('<div class="infinitescroll-load"></div>');
			var self = this;
			var moreBtn;

			var fetch = function () {
				var helpers = {
					percentage: self.curPercentage,
					scrollTop: self.curScrollTop
				};
				var $loader = $('<div class="loader"></div>');
				load.append($loader);
				$loader.loader();
				if (self.options.dataSource) {
					self.options.dataSource(helpers, function (resp) {
						var end;
						load.remove();
						if (resp.content) {
							self.$element.append(resp.content);
						}

						if (resp.end) {
							end = (resp.end !== true) ? resp.end : undefined;
							self.end(end);
						}

						self.fetchingData = false;
					});
				}
			};

			this.fetchingData = true;
			this.$element.append(load);
			if (this.options.hybrid && force !== true) {
				moreBtn = $('<button type="button" class="btn btn-primary"></button>');
				if (typeof this.options.hybrid === 'object') {
					moreBtn.append(this.options.hybrid.label);
				} else {
					moreBtn.append('<span class="glyphicon glyphicon-repeat"></span>');
				}

				moreBtn.on('click.domx.infinitescroll', function () {
					moreBtn.remove();
					fetch();
				});
				load.append(moreBtn);
			} else {
				fetch();
			}
		},

		onScroll: function (e) {
			this.curScrollTop = this.$element.scrollTop();
			this.curPercentage = this.getPercentage();
			if (!this.fetchingData && this.curPercentage >= this.options.percentage) {
				this.fetchData();
			}
		}
  });

  plugins.register(InfiniteScroll);

  return scrolls.InfiniteScroll = InfiniteScroll;	
});

define('skylark-domx-plugins-scrolls/scrolling-element',[
	"./scrolls"
],function(scrolls){
	function scrollingElement() {
		return document.scrollingElement || document.documentElement;
	}
	
	return scrolls.scrollingElement = scrollingElement;
});
define('skylark-domx-plugins-scrolls/scroll-spy',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./scrolls"
],function(langx,browser,eventer,noder,geom,$,plugins,scrolls){

  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  var ScrollSpy =  plugins.Plugin.inherit({
    klassName: "ScrollSpy",

    pluginName : "lark.scrolls.scrollspy",

    options: {
      offset: 10
    },

    _construct : function(elm,options) {
      this.overrided(elm,options);
      this.$body          = $(document.body)
      this.$scrollElement = this.$().is(document.body) ? $(window) : this.$();
      //this.options        = langx.mixin({}, ScrollSpy.DEFAULTS, options)
      this.selector       = (this.options.target || '') + ' .nav li > a'
      this.offsets        = []
      this.targets        = []
      this.activeTarget   = null
      this.scrollHeight   = 0

      this.$scrollElement.on('scroll.scrollspy', langx.proxy(this.process, this))
      this.refresh()
      this.process()
    },

    getScrollHeight : function () {
      return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
    },

    refresh : function () {
      var that          = this
      var offsetMethod  = 'offset'
      var offsetBase    = 0

      this.offsets      = []
      this.targets      = []
      this.scrollHeight = this.getScrollHeight()

      if (!langx.isWindow(this.$scrollElement[0])) {
        offsetMethod = 'position'
        offsetBase   = this.$scrollElement.scrollTop()
      }

      this.$body
        .find(this.selector)
        .map(function () {
          var $el   = $(this)
          var href  = $el.data('target') || $el.attr('href')
          var $href = /^#./.test(href) && $(href)

          return ($href
            && $href.length
            && $href.is(':visible')
            && [[$href[offsetMethod]().top + offsetBase, href]]) || null
        })
        .sort(function (a, b) { return a[0] - b[0] })
        .each(function () {
          that.offsets.push(this[0])
          that.targets.push(this[1])
        })
    },

    process : function () {
      var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
      var scrollHeight = this.getScrollHeight()
      var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
      var offsets      = this.offsets
      var targets      = this.targets
      var activeTarget = this.activeTarget
      var i

      if (this.scrollHeight != scrollHeight) {
        this.refresh()
      }

      if (scrollTop >= maxScroll) {
        return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
      }

      if (activeTarget && scrollTop < offsets[0]) {
        this.activeTarget = null
        return this.clear()
      }

      for (i = offsets.length; i--;) {
        activeTarget != targets[i]
          && scrollTop >= offsets[i]
          && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])
          && this.activate(targets[i])
      }
    },

    activate : function (target) {
      this.activeTarget = target

      this.clear()

      var selector = this.selector +
        '[data-target="' + target + '"],' +
        this.selector + '[href="' + target + '"]'

      var active = $(selector)
        .parents('li')
        .addClass('active')

      if (active.parent('.dropdown-menu').length) {
        active = active
          .closest('li.dropdown')
          .addClass('active')
      }

      active.trigger('activate.scrollspy')
    },

    clear : function () {
      $(this.selector)
        .parentsUntil(this.options.target, '.active')
        .removeClass('active')
    }

  });

  plugins.register(ScrollSpy);

  return scrolls.ScrollSpy = ScrollSpy;

});

define('skylark-domx-plugins-scrolls/main',[
    "./scrolls",
    "./affix",
    "./auto-scroll",
    "./infinite-scroll",
    "./scrolling-element",
    "./scroll-spy"
], function(scrolls) {
    return scrolls;
});
define('skylark-domx-plugins-scrolls', ['skylark-domx-plugins-scrolls/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-domx-plugins-scrolls.js.map
