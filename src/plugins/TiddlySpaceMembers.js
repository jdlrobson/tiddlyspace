/***
|''Name''|TiddlySpaceMembers|
|''Version''|0.6.2|
|''Description''|provides a UI for managing space members|
|''Status''|@@beta@@|
|''Source''|http://github.com/TiddlySpace/tiddlyspace/raw/master/src/plugins/TiddlySpaceMembers.js|
|''Requires''|TiddlySpaceConfig TiddlySpaceAdmin|
!Usage
<<TiddlySpaceMembers list>> provides list of members
<<TiddlySpaceMembers add>> creates a form to add new members.
!Code
***/
//{{{
(function($) {

var admin = config.macros.TiddlySpaceAdmin;
var formMaker = config.extensions.formMaker;
var macro = config.macros.TiddlySpaceMembers = {
	locale: {
		authAddError: "You must be a member to add members to this space.",
		authError: "list of members is only visible to members of space <em>%0</em>",
		listError: "error retrieving members for space <em>%0</em>: %1",
		submit: "Add member",
		delTooltip: "click to remove member",
		delPrompt: "Are you sure you want to remove member %0?",
		// we can also get an auth error when the user has no perms to
		// delete but we wouldn't see the interface
		delAuthError: "error removing %0 from %1: may not remove last member",
		delSpaceError: "error removing %0 from %1: space does not exist",
		sending: "please wait...",
		errors: {
			409: "user <em>%0</em> does not exist"
		}
	},

	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var space = config.extensions.tiddlyspace.currentSpace.name;
		var host = config.extensions.tiddlyweb.host;
		this.space = new tiddlyweb.Space(space, host); // XXX: singleton
		var mode = params[0];
		var args = paramString.parseParams("anon", null, true, false, false);
		var hideErrors = args.hideErrors ? true : false;
		var container;
		if(!readOnly) {
			if(mode == "add") {
				macro.generateForm(place);
			} else {
				admin.listConcept(place, "member");
			}
		} else {
			var msg;
			if(mode == "add") {
				msg = this.locale.authAddError.format(this.space.name);
			} else {
				msg = this.locale.authError.format(this.space.name);
			}
			container = $("<div />").appendTo(place);
			if(!hideErrors) {
				this.notify(msg, container);
			}
		}
	},
	elements: [ admin.locale.username, admin.elements.username() ],
	generateForm: function(container) {
		return formMaker.make(container, macro.elements, macro.onSubmit, { locale: macro.locale });
	},
	onSubmit: function(ev, form) {
		var selector = "[name=username]";
		var input = $(form).find(selector);
		var username = input.val();
		var callback = function(data, status, xhr) {
			admin.collect("member");
			input.val("");
			formMaker.reset();
		};
		var errback = function(xhr, error, exc) {
			var options = {
				format: [ username ],
				selector: selector
			};
			formMaker.displayError(form, xhr.status, macro.locale.errors, options);
		};
		macro.space.members().add(username, callback, errback);
		return false;
	},
	onDelClick: function(ev) {
		var btn = $(this);
		var username = btn.data("space");
		var msg = macro.locale.delPrompt.format(username);
		var callback = function(data, status, xhr) {
			if(username == config.extensions.tiddlyweb.username) { // assumes getStatus has completed
				readOnly = true;
				refreshDisplay();
			}
		};
		var errback = function(xhr, error, exc) {
			var msg = xhr.status == 403 ? "delAuthError" : "delSpaceError";
			displayMessage(macro.locale[msg].format(username, macro.space.name));
		};
		if(confirm(msg)) {
			macro.space.members().remove(username, callback, errback);
		}
	},
	notify: function(msg, container) {
		container.addClass("annotation").html(msg);
	}
};

})(jQuery);
//}}}
