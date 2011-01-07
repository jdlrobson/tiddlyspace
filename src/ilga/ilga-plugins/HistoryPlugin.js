/***
|''Name''|HistoryPlugin|
|''Version''|0.2.0|
|''Description''|Auto generates permaviews as you open and close tiddlers. Back button allows you to flick back to previous stories on modern browsers.|
***/
//{{{
(function() {

var _close = Story.prototype.closeTiddler;
config.extensions.history = {};

Story.prototype.closeTiddler = function(title,animate,unused) {
	_close.apply(this, arguments);
	window.setTimeout(function(){
		if(!config.extensions.history.ignoreChange) {
			story.permaView();
		}
	}, 1000);
};

var _display = Story.prototype.displayTiddler;
Story.prototype.displayTiddler = function(srcElement,tiddler,template,animate,unused,customFields,toggle,animationSrc)
{
	_display.apply(this, arguments);
	if(!config.extensions.history.ignoreChange) {
		story.permaView();
	}
};

var hashchange = function(ev) {
		if(!config.extensions.history.ignoreChange) {
			config.extensions.history.ignoreChange = true;
			story.closeAllTiddlers();
			var p = getParameters();
			if(p) {
				invokeParamifier(p.parseParams("open",null,false), "onstart");
			}
			config.extensions.history.ignoreChange = false;
		}
};

window.onhashchange = hashchange;

})();
//}}}