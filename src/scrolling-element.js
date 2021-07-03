define([
	"./scrolls"
],function(scrolls){
	function scrollingElement() {
		return document.scrollingElement || document.documentElement;
	}
	
	return scrolls.scrollingElement = scrollingElement;
});