/***
|''Name''|TiddlySpaceInclusion|
|''Version''|0.6.0|
|''Description''|provides user interfaces for managing TiddlySpace inclusions|
|''Status''|@@beta@@|
|''Source''|http://github.com/TiddlySpace/tiddlyspace/raw/master/src/plugins/TiddlySpaceInclusion.js|
|''Requires''|TiddlySpaceConfig TiddlySpaceAdmin chrjs|
!Code
***/
//{{{
(function($) {

var tweb = config.extensions.tiddlyweb;
var tiddlyspace = config.extensions.tiddlyspace;
var currentSpace = tiddlyspace.currentSpace.name;
var formMaker = config.extensions.formMaker;
var admin = config.macros.TiddlySpaceAdmin;

var macro = config.macros.TiddlySpaceInclusion = {
	formTemplate: store.getTiddlerText(tiddler.title + "##HTMLForm"),
	locale: {
		submit: "Include space",
		sending: "Including space...",
		addSuccess: "included %0 in %1",
		delPrompt: "Are you sure you want to exclude %0 from the current space?",
		delTooltip: "click to exclude from the space",
		delError: "error excluding %0: %1",
		listError: "error retrieving spaces included in space %0: %1",
		noInclusions: "no spaces are included",
		recursiveInclusions: "Spaces that were included by the removed space and not part of the core TiddlySpace application are highlighted and can be removed manually if wished.",
		reloadPrompt: "The page must be reloaded for inclusion to take effect. Reload now?",
		errors: {
			403: "unauthorized to modify space <em>%1</em>",
			404: "space <em>%1</em> does not exist", // XXX: only relevant for passive mode
			"409a": "space <em>%0</em> is already included in <em>%1</em>",
			"409b": "space <em>%0</em> does not exist"
		}
	},

	elements: ["Space Name:", { name: "space" }],
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		// passive mode means subscribing given space to current space
		this.name = macroName;
		var mode = params[0] || "list";

		if(mode == "passive") {
			if(!readOnly) {
				formMaker.make(place, macro.elements, macro.onSubmit, { locale: macro.locale });
			}
		} else {
			var container = $("<div />").addClass(this.name).appendTo(place);
			$('<p class="annotation" />').hide().appendTo(container);
			admin.listConcept(container[0], "inclusion");
		}
	},
	onSubmit: function(ev, form) {
		var selector = "[name=space]";
		var space = $(form).find(selector).val();
		var provider = space;
		var subscriber = currentSpace;
		var loc = macro.locale;
		var callback = function(data, status, xhr) {
			displayMessage(loc.addSuccess.format([provider, subscriber]));
			if(confirm(loc.reloadPrompt)) {
				window.location.reload();
			}
			formMaker.reset();
		};
		var errback = function(xhr, error, exc) {
			if(xhr.status == 409) {
				var included = "already subscribed";
				xhr = { // XXX: hacky
					status: xhr.responseText.indexOf(included) != -1 ? "409a" : "409b"
				};
			}
			var options = {
				format: [ provider, subscriber ],
				selector: selector
			};
			formMaker.displayError(form, xhr.status, macro.locale.errors, options);
		};
		macro.inclusion(provider, subscriber, callback, errback, false);
		return false;
	},
	onDelClick: function(ev) { // XXX: too long, needs refactoring
		var btn = $(ev.target);
		var provider = btn.data("space");

		var msg = macro.locale.delPrompt.format([provider]);
		var callback = function(data, status, xhr) {
			admin.collect("inclusion");
		};
		var errback = function(xhr, error, exc) { // XXX: doesn't actually happen
			displayMessage(macro.locale.delError.format([username, error]));
		};
		if(confirm(msg)) {
			macro.inclusion(provider, currentSpace, callback, errback, true);
		}
		return false;
	},
	inclusion: function(provider, subscriber, callback, errback, remove) {
		var data = {};
		var key = remove ? "unsubscriptions" : "subscriptions";
		data[key] = [provider];
		$.ajax({ // TODO: add to model/space.js?
			url: tweb.host + "/spaces/" + subscriber,
			type: "POST",
			contentType: "application/json",
			data: $.toJSON(data),
			success: callback,
			error: errback
		});
	}
};

})(jQuery);
//}}}
