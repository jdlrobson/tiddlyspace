/***
|''Name''|InlineEditPlugin|
|''Version''|0.2.0|
!Usage
{{{
<<inlineEdit foo XYZ>>
}}}
edit field foo of tiddler called XYZ.
!Code
***/
//{{{
(function($) {

var macro = config.macros.inlineEdit = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var field = params[0];
		var tiddler = params[1];
		macro.inlineEdit(place, field, tiddler);
	},
	inlineEdit: function(place, field, tiddlerTitle) {
		var isField = ["text", "title", "tags"].contains(field) ? false : true;
		var tiddler = store.getTiddler(tiddlerTitle);
		if(!tiddler) {
			tiddler = new Tiddler(tiddlerTitle);
			merge(tiddler.fields, config.defaultCustomFields);
		}
		var val = isField ? tiddler.fields[field] : tiddler[field];
		var container = $("<input type='text' />").val(val).attr("inline-edit", tiddlerTitle).appendTo(place)[0];

		var updateField = function(ev) {
			var title = $(ev.target).attr("inline-edit");
			var tiddler = store.getTiddler(title);
			var newVal = $(ev.target).val();
			if(val != newVal) {
				if(isField) {
					tiddler.fields[field] = newVal;
				} else {
					tiddler[field] = newVal;
				}
				tiddler = store.saveTiddler(tiddler);
				return tiddler;
			}
		};
		if(!readOnly) {
			$(container).blur(function(ev) {
				var tiddler = updateField(ev);
				if(tiddler) {
					autoSaveChanges(null, [tiddler]);
				}
			});
		} else {
			$(container).attr("disabled", true);
		}
	}
};
}(jQuery));
//}}}
