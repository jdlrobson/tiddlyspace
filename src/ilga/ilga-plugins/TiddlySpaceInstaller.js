/***
|''Name''|TiddlySpaceInstaller|
|''Version''|0.3.6|
!Usage
{{{<<showInstall bar Foo>>}}}
Opens the tiddler Foo to visitors of the bar space. 
In a space that is not bar, nothing happens.

{{{<<install foo bar>>}}}
Provides a ui for installing a space that includes foo and bar taking into account whether the user is new or currently logged in.
optional parameters:
* label - change the label of the button that is clicked to install.
* header - provide alternative text to show for "choose a website address"
***/
//{{{
(function($) {

var tweb = config.extensions.tiddlyweb;
var tspace = config.extensions.tiddlyspace;
config.macros.showInstall = {
	handler: function(place, macroName, params) {
		if(config.extensions.tiddlyspace.currentSpace.name == params[0]) {
			story.displayTiddler(null, params[1] || "Install");
		}
	}
};
var macro = config.macros.install = {
	locale: {
		spaceName: "Choose a website address:",
		password: "Enter a password:",
		passwordAgain: "Enter password again:",
		setup: "create",
		passwordError: "your passwords do not match.. please try entering them again.",
		nameError: "The name %0 is taken. Please try another"
	},
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var args = paramString.parseParams("anon")[0];
		params = args.anon || [];
		var locale = macro.locale;
		var setupLabel = args.label ? args.label[0] : locale.setup;
		var headerTxt = args.header ? args.header[0] : locale.spaceName;

		config.extensions.tiddlyweb.getStatus(function(r) {
			var host = r.server_host.host;
			if(params.length == 0) {
				params = [ tspace.currentSpace.name ]
			}
			var form = $("<form />").appendTo(place);
			tweb.getUserInfo(function(userInfo) {
				$("<div />").text(headerTxt).appendTo(form);
				var user = $("<input />").attr("name", "username").attr("type", "text").appendTo(form);
				$("<span />").text("." + host).appendTo(form);
				if(userInfo.anon) {
					$("<div />").text(locale.password).appendTo(form);
					var pass1 = $("<input />").attr("name", "pass1").attr("type", "password").appendTo(form);
					$("<div />").text(locale.passwordAgain).appendTo(form);
					var pass2 = $("<input />").attr("name", "pass2").attr("type", "password").appendTo(form);
				}
				$("<input />").attr("type", "submit").val(setupLabel).appendTo(form);
				form.submit(function(ev) {
					var user = $("[name=username]", ev.target).val();
					var pass = $("[name=pass1]", ev.target).val();
					var pass2 = $("[name=pass2]", ev.target).val();
					ev.preventDefault();
					if(userInfo.anon && pass != pass2) {
						alert(locale.passwordError);
					} else if(userInfo.anon && user && pass == pass2){
						macro.installNewUser(user, pass, params);
					} else if(!userInfo.anon && user) {
						macro.setup(user, params)
					} else {
						alert("Please enter a website address");
					}
				});
			});
		});
	},
	installNewUser: function(username, password, includes) {
		var user = new tiddlyweb.User(username, password, tweb.host);
		user.create(
			function() {
				config.macros.TiddlySpaceLogin.login(username, password, function() {
					macro.setup(username, includes);
				});
			},
			function() {
				alert(macro.locale.nameError.format(username));
			}
		);
	},
	setup: function(spacename, includes) {
		var space = new tiddlyweb.Space(spacename, tweb.host);
		space.create(function() {
			jQuery.ajax({
				url: tweb.host + "/spaces/"+ spacename,
				type: "POST",
				contentType: "application/json",
				data: jQuery.toJSON({
					"subscriptions": includes
				}),
				success: function() {
					window.location = "http://%0.tiddlyspace.com".format(spacename);
				},
				error: function() {
					window.location = "http://%0.tiddlyspace.com".format(spacename);
				}
			});
		}, function() {
			alert("Failed to create space %0".format(spacename));
		});
	}
};

})(jQuery);
//}}}
