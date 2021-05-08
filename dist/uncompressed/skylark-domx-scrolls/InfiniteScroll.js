define([
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

        pluginName : "domx.infinitescroll",

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
