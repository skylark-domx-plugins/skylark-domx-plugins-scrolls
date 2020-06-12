/**
 * skylark-domx-panels - The skylark spy plugins library for dom api extension
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-domx/skylark-domx-spy/
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

define('skylark-domx-panels/spy',[
  "skylark-langx/skylark",
],function(skylark){


	return skylark.attach("domx.spy",{});

});

define('skylark-domx-panels/Affix',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins",
  "./spy"
],function(langx,browser,eventer,noder,geom,$,plugins,spy){

  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = spy.Affix = plugins.Plugin.inherit({
        klassName: "Affix",

        pluginName : "domx.affix",

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

  return spy.Affix = Affix;
});

define('skylark-domx-panels/ScrollSpy',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins",
  "./spy"
],function(langx,browser,eventer,noder,geom,$,plugins,spy){

  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  var ScrollSpy =  plugins.Plugin.inherit({
    klassName: "ScrollSpy",

    pluginName : "domx.scrollspy",

    options: {
      offset: 10
    },

    _construct : function(elm,options) {
      this.overrided(elm,options);
      this.$body          = $(document.body)
      this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)
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

  return spy.ScrollSpy = ScrollSpy;

});

define('skylark-domx-panels/main',[
    "./spy",
    "./Affix",
    "./ScrollSpy"
], function(spy) {
    return spy;
});
define('skylark-domx-panels', ['skylark-domx-panels/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-domx-panels.js.map
