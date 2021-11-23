define([
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
