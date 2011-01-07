/***
|''Name''|NewGUIDTiddlers|
|''Version''|0.2.1|
|''Requires''|GUID|
!
***/
//{{{
(function($) {
var _createNewTiddlerButton = config.macros.newTiddler.createNewTiddlerButton;
config.macros.newTiddler.createNewTiddlerButton = function(place,title,params,label,prompt,accessKey,newFocus,isJournal) {
	var guid = getParam(params, "guid", false);
	var guid_suffix = getParam(params, "guid_suffix", "");
	var guid_prefix = getParam(params, "guid_prefix", "");
	var btn = _createNewTiddlerButton.apply(this, arguments);
	if(guid) {
		$(btn).attr("guid", "yes");
		$(btn).attr("guid_prefix", guid_prefix);
		$(btn).attr("guid_suffix", guid_suffix);
	}
	return btn;
};
var _onClickNewTiddler = config.macros.newTiddler.onClickNewTiddler;
config.macros.newTiddler.onClickNewTiddler = function() {
	_onClickNewTiddler.apply(this, arguments);
	var title = this.getAttribute("newTitle");
	var guid = this.getAttribute("guid");
	var prefix = this.getAttribute("guid_prefix");
	var suffix = this.getAttribute("guid_suffix");
	if(guid) {
		story.getTiddlerField(title, "title").value = prefix + 
			config.extensions.GuidPlugin.guid.generate() + suffix;
	}
};

})(jQuery);
//}}}
