/***
|''Name''|ILGASpecificPlugin|
|''Version''|0.3.5|
|''Contributors''|Jon Robson, Ben Gillies, Jon Lister|
|''License:''|[[BSD open source license]]|
|''Requires''|TiddlySpaceConfig TiddlySpaceBackstage TiddlySpaceInitialization GUID TiddlySpaceCloneTiddlerParamifier|
!Notes
!macros
Provides macros
ilga_translation_message,edittags_ilga,ProfileNameFromTitle,ifTranslation,language_from_article,ilga_link,DEFAULT_LANGUAGE, setPublishBag
* translate_ilga
* ilgaPermalink
{{{
<<translate_ilga foo fr>>
}}}
translates the id foo into french. Note the language parameter is optional.
!commands
backToMyActivism
!Tweaks
* This plugin changes the terminology used eg. tiddler becomes article 
* It also creates a macro articletags which shows tags in a list form separated by commas rather than he norm
* IT also overrides displayTiddler to make templates have a class template_<templatename> for styling purposes
* it creates a macro ilga_translation_message for displaying a message to users
***/
//{{{
(function($) {
var ILGA_HOST = "http://ilga.org";
var LANGUAGES = ["en", "fr", "es", "pt"];
config.options.chkBackstage = false;
var tweb = config.extensions.tiddlyweb;
var tiddlyspace = config.extensions.tiddlyspace;
config.macros.tiddlerOrigin.locale.publishPrivateDeletePrivate = "Are you sure you want to publish this article?";
config.options.txtTemplateTweakFieldname = "tags";
var userIsAdmin = document.cookie.indexOf('admin="') != -1;

/*********************************
TWEAKS
********************************/
/* make displayTiddler add a class template_<templatename> to the tiddler for styling purposes*/
var _oldDisplayTiddler = story.displayTiddler;
story.displayTiddler = function(args){
	var el = _oldDisplayTiddler.apply(this, arguments);
	var name = $(el).attr("template");
	$(el).addClass("template_"+name);
	return el;
};
config.options.chkHttpReadOnly = false;
/*********************************
MACROS
*********************************/
config.macros.templateSection = {
	handler: function(place, macroName, params, wikifier,
		paramString, tiddler) {
		var section = params[0];
		var group = params[1] || "default-group";
		var args = paramString.parseParams("anon")[0];
		var el = story.findContainingTiddler(place);
		$("[section][group=%0]".format(group), el).hide();
		var showSection = function(target) {
			target = $(target).closest(".sectionButton")[0];
			var s = $(target).data("section");
			var g = $(target).data("group");
			var el = story.findContainingTiddler(target);
			$("[section][group=%0]".format(g)).hide();
			var selector = "[section=%0][group=%1]".format(s, g);
			$(selector, el).show();
		};
		$(place).click(function(ev) {
			showSection(ev.target);
			ev.preventDefault();
		});
		$(place).addClass("sectionButton").data("section", section).data("group", group);
		if(params[2]) {
			window.setTimeout(
				function() {
					showSection(place);
				}, 100); // wait for it to load
		}
	}
};

config.macros.view.views.ilgaCountry = function(value, place, params, wikifier,
		paramString, tiddler) {
	var language = ilga.language;
	var url = "http://ilga.org/ilga/" + language + "/country/" + value;
	$("<a />").text(value).attr("href", url).appendTo(place);
};

config.macros.ilgaPermalink = {
	handler: function(place, macroName, params, wikifier,
		paramString, tiddler) {
		var title = tiddler.fields["server.title"] || tiddler.title;
		var split = title.split("_");
		var language = split[1];
		var id = split[0];
		var url = "%0/ilga/%1/article/%2".format(ILGA_HOST, language, id);
		var container = $("<a />").attr("href", url).
			text("on ilga.org").appendTo(place)[0];
	}
};

config.macros.isPublic = {
	handler: function(place,macroName,params,wikifier,paramString,tiddler) {
		var isPublic;
		if(tiddler) {
			isPublic = config.filterHelpers.is["public"](tiddler);
		}
		if(!isPublic) {
			$(place).remove();
		}
	}
};
/* a macro to print the tags being used in a non-standard way */
// todo: KILL
config.macros.articletags = {
	handler: function(place,macroName,params,wikifier,paramString,tiddler){
		params = paramString.parseParams("anon",null,true,false,false);
		var ul = createTiddlyElement(place,"span");
		var title = getParam(params,"anon","");
		if(title && store.tiddlerExists(title)) {
			tiddler = store.getTiddler(title);
		}
		var sep = getParam(params,"sep"," ");
		var lingo = config.views.wikified.tag;
		var prompt = tiddler.tags.length === 0 ? lingo.labelNoTags : lingo.labelTags;
		for(var t=0; t<tiddler.tags.length; t++) {
			createTagButton(createTiddlyElement(ul,"span"),tiddler.tags[t],tiddler.title);
			if(t<tiddler.tags.length-1) {
				createTiddlyText(ul,sep);
			}
		}
	}
};


/* provides a translation message in the correct language */
config.macros.ilga_translation_message = {
	handler: function(place){
		var original = config.options.ilga_profile_original_language;
		var str = translate("translate_profile_explained");
		if(str && original){
			var original_lang_str = config.translator(original);
			var resource =tiddler.title;
			if(resource.charAt(resource.length-3) == "_") {
				resource = resource.substr(0,resource.length-3);
			}
			var original_link = "/ilga/recipes/editprofile/tiddlers.wiki?language="+original+"#[["+resource+"]]";
			str = str.replace(/\%s/gi,'<a href="'+original_link+'">'+ original_lang_str +'</a>');
			$(place).html(str);
		}
	}
};
/* overrides niceTagger to pull in external tags ... see LoadPopularTags*/
config.macros.edittags_ilga= {
	handler:function(place,macroName,params,wikifier,paramString,tiddler){
		var dothis = function(){
			$(place).text("");
			config.macros.niceTagger.handler(place,macroName,params,wikifier,paramString,tiddler);
		};
		if(config.options.loadedExternalTags) {
			dothis();
			return;
		}
		$(place).text(translate("loading"));
		$.get("/ilga/count/tags/published_articles_"+DEFAULT_LANGUAGE, function(response){
			var tags = response.split("\n");
			var txt = "";
			for(t=0; t < tags.length; t++){
				var end = tags[t].lastIndexOf(" ");
				var tag = tags[t].substr(0,end);
				txt += tag+"\n";
			}
			var suggestions = store.getTiddler("SuggestedTags");
			if(suggestions) {
				suggestions.fields._suggestions = txt;
			}
			config.options.loadedExternalTags = true;
			dothis();
		});
	}
};

/* USED in Edit/View Templates for country profiles, displaying country
Gets the profile name from the title eg. JAPANLaw .. get JAPAN */
config.macros.ProfileNameFromTitle = {
	//replace with endswith
	handler:function(place,macroName,params,wikifier,paramString,tiddler){		
		var title = tiddler.title;
		title = title.split("_")[0];
		var lawStartsAt = title.length-3;
		var moodStartsAt = title.length-4;
		var introStartsAt =title.length-5;
		var movementcampaignStartsAt = title.length-8;
		if(title.substr(lawStartsAt) == 'Law'){
			wikify(decodeURI(title.substr(0,lawStartsAt)),place);
		}

		if(title.substr(moodStartsAt) == 'Mood'){
			wikify(decodeURI(title.substr(0,moodStartsAt)),place);
		}
		if(title.substr(introStartsAt) == 'Intro'){
			wikify(decodeURI(title.substr(0,introStartsAt)),place);
		}

		if(title.substr(movementcampaignStartsAt) == 'Movement' ||
			title.substr(movementcampaignStartsAt) == 'Campaign') {
			wikify(decodeURI(title.substr(0,movementcampaignStartsAt)),place);
		}
	}
	
};
/* 
gets the language from the article 
Used to display language on certain templates
*/
config.macros.language_from_article ={
	handler:function(place,macroName,params,wikifier,paramString,tiddler){ 
		window.setTimeout(function() {
			var el = story.findContainingTiddler(place);
			var title = $("[edit=title]", el).val();
			var splitted = title.split("_");
			var print;
			if(splitted && splitted[1]){
				print = title.substr(title.length-2);
			} else {
				print = DEFAULT_LANGUAGE;
			}
			if(params[0]) {
				print = params[0] + print;
			}
			$(place).append(print);
		}, 500);
	}
};

// sets the workspace and bag to be published_articles_x
var setPublish = config.macros.setPublishBag = {
	update: function(place, bag) {
		var el = story.findContainingTiddler(place);
		var wsEl = $("[edit=server.workspace]", el)[0];
		var bagEl = $("[edit=server.bag]", el)[0];
		var workspace = "bags/%0".format(bag);
		if(!bagEl) {
			bagEl = $("<input />").attr("type", "hidden").attr("edit", "server.bag").appendTo(place)[0];
		}
		if(!wsEl) {
			wsEl = $("<input />").attr("type", "hidden").attr("edit", "server.workspace").appendTo(place)[0];
		}

		$(bagEl).val(bag);
		$(wsEl).val(workspace);
	},
	handler: function(place,macroName,params,wikifier,paramString,tiddler){
		var bag = "published_articles_%0";
		var el = story.findContainingTiddler(place);
		window.setTimeout(function() {
			var title = $("[edit=title]", el).val();
			var language = title.split("_")[1];
			if(["en", "fr", "es", "pt"].contains(language)) {
				bag = bag.format(language);
				setPublish.update(place, bag);
			}
		}, 500);
	}
};
/* creates links in the correct language */
config.macros.ilga_link = {
	handler:function(place,macroName,params,wikifier,paramString,tiddler){
		var lang = DEFAULT_LANGUAGE;
		var translate = function(id){
			var t = config.translator(id);
			if(!t) {
				return "{{ translate error id: "+id+"}}";
			} else {
				return t;
			}
		};
		var container = $("<span />").appendTo(place);
		tweb.getStatus(function(s) {
			var sh = s.server_host;
			var url = ILGA_HOST;
			var linkName = params[0];
			if(linkName == "home") {
				content = translate("Home");
				url += "/ilga/"+lang+"/index.html";
			} else if(linkName == "myactivismtab"){
				url += "/ilga/"+lang+"/myactivism";
				content = translate("whatsyouractivism");
			} else if(linkName == "myactivism"){
				url += "/ilga/"+lang+"/myactivism";
				content = translate("My Activism");
			} else if(linkName == "admin"){
				url += "/ilga/"+lang+"/admin";
				content = translate("admin");
			} else if(linkName == "directory") {
				url += "/ilga/"+lang+"/directory";
				content = translate("directory");
			} else if(linkName == "space") {
				url = tiddlyspace.getHost(sh, tiddlyspace.currentSpace.name);
				content = store.getTiddlerText("SiteTitle");
			} else {
				return;
			}
			if(params[1]) {
				content = decodeURI(params[1]);
			}
			$("<a />").text(content).attr("href", url).appendTo(container);
		});
	}
};

config.macros.DEFAULT_LANGUAGE = {
		handler:function(place,macroName,params,wikifier,paramString,tiddler){
			$(place).append(DEFAULT_LANGUAGE);
		}
};

config.translatorErrorMsg = function(id){ return "{{translate error(id:"+id+")}}";};
config.translator = function(id, lang){
	lang = lang || DEFAULT_LANGUAGE;
	if(ilga_lingo){
		if(ilga_lingo[id] && ilga_lingo[id].sameas) {
			return config.translator(ilga_lingo[id].sameas, lang);
		} else if(ilga_lingo[id] && ilga_lingo[id][lang]){
			return ilga_lingo[id][lang];
		} else{
			return false;
		}
	} else{
		throw "No translation file has been provided";
	}
};
config.macros.translate_ilga = {
	handler:function(place,macroName,params,wikifier,paramString,tiddler){
		var id = params[0];
		var language = params[1];
		var translation = config.translator(id, language);
		if(!translation) {
			translation = config.translatorErrorMsg(id);
		}
		$(place).attr("translation-id", id);
		if(params[1] == 'wikified'){
			wikify(translation, place);
		} else{
			$(place).append(translation);		
		}
	}
};

/* ********************************
LANGUAGE config
fun with lingo.. 
*********************************/
if(config.translator("default_text")) {
	config.views.wikified.defaultText = config.translator("default_text");
} else {
	config.views.wikified.defaultText = "";
}
var translate = function(id){
	var t = config.translator(id);
	if(!t) {
		return "{{ translate error id: "+id+"}}";
	} else {
		return t;
	}
};
config.messages.ilga = {};
if(config.defaultCustomFields['server.workspace'] == 'recipes/editprofile'){
	config.messages.ilga.topLeftHeader = config.translator("myactivism_profile_1");
	config.messages.ilga.topLeftText = config.translator("myactivism_profile_3");
	config.messages.ilga.topRightTextSmall ="";
	config.messages.ilga.topRightTextLarge ="";
} else{
	config.messages.ilga.topLeftHeader = config.translator("myactivism_contribution_header");
	config.messages.ilga.topLeftText = config.translator("myactivism_contribution_text");
	config.messages.ilga.topRightTextSmall =config.translator("myactivism_translate_header");
	config.messages.ilga.topRightTextLarge = config.translator("myactivism_translate_text");
}

if(config.macros.remoteviewbutton) {
	if(config.translator("remoteViewButton_text")) {
		config.macros.remoteviewbutton.lingo.text = config.translator("remoteViewButton_text");
	}
	if(config.translator("remoteViewButton_tooltip")) {
		config.macros.remoteviewbutton.lingo.tooltip = config.translator("remoteViewButton_tooltip");
	}
	if(config.translator("remoteViewButton_prefix")) {
		config.macros.remoteviewbutton.lingo.prefix = config.translator("remoteViewButton_prefix");
	}
}
if(config.macros.AdvancedEditTemplate){
	config.macros.AdvancedEditTemplate.translate = config.translator;
}
if(config.macros.niceTagger){
	config.macros.niceTagger.lingo.add = translate("addtag");
}
if(config.macros.editvideo){
	config.macros.editvideo.enableflash = translate("cantuploadvideo");
	config.macros.editvideo.unsupported = translate("addunsupportedvideo");
}
if(config.commands.unpublisharticle){
	config.commands.unpublisharticle.text = translate("unpublish");
	config.commands.unpublisharticle.tooltip=translate("unpublish");
}
if(config.commands.saveTiddlerArticle) {
	config.commands.saveTiddlerArticle.text = translate("save");
}
if(config.commands.saveTiddlerProfile) {
	config.commands.saveTiddlerProfile.tooltip = translate("save");
}
if(config.commands.ILGApublishtiddler) {
	config.commands.publishtiddler.lingo.publishSuccess = translate("publishok");
	config.commands.ILGApublishtiddler.text= translate("publish");
	config.commands.ILGApublishtiddler.tooltip = translate("publish");
	config.commands.ILGApublishtiddler.confirmMsg = translate("publishConfirm");
	config.commands.ILGApublishtiddler.saveFirstMsg = "Please save this first!";
	config.commands.copytiddler.text= translate("publish");
	config.commands.copytiddler.tooltip = translate("publish");
	config.commands.copytiddler.confirmMsg = translate("publishConfirm");
	config.commands.copytiddler.saveFirstMsg = "Please save this first!";
}
if(config.macros.install) {
	config.macros.install.locale.spaceName = "";
}
config.commands.cancelTiddler.text = translate("cancel");
config.commands.cancelTiddler.tooltip = translate("cancel");

config.optionsDesc.unsavedChangesWarning = translate("unsavedchanges");
config.optionsDesc.confirmExit = translate("confirmexit");
config.messages.confirmExit = translate("confirmexit");
config.commands.cancelTiddler.warning = translate("abandonTiddler");
merge(config.commands.deleteTiddler,{warning: translate("deleteTiddlerWarning")});

//language for error/success messages
merge(config.extensions.ServerSideSavingPlugin.locale, {
	saved: config.translator("savesuccess.general")
});

if(typeof(config.extensions.chkEditorMode) == "undefined") {
	config.options.chkEditorMode = true;
	saveOptionCookie("chkEditorMode");
}

// update link to take a label
config.macros.view.views.link = function(value,place,params,wikifier,paramString,tiddler) {
	var btn = createTiddlyLink(place,value, true);

	var args = paramString.parseParams("anon")[0];
	var label = args.labelField ? tiddler[args.labelField] || tiddler.fields[args.labelField] : args.anon[2];
	if(params[2]) {
		$(btn).text(label);
	}
};

//Initialisation stuff
var _firstRun = config.extensions.TiddlySpaceInit.firstRun;
var helloArticle = {
	heading: "My First Article",
	summary: "This example article gives you basic instructions for writing your own articles",
	text: ["<html><p>This is your first article in your new activist space. It is currently <b>private</b>",
	"<img src='/bags/tiddlyspace/tiddlers/privateIcon' alt='private icon' /> so only you are able to see it.</p>",
	"<p>When you have finished editing this article click",
	" on the <img src='/bags/tiddlyspace/tiddlers/privateIcon' alt='private icon' /> to make it public.</p>",
	"<p>The best articles will be published on ilga.org linking back to your space.</p>",
	"</html>"].join("")
};
var contactArticle = {
	heading: "Contact our group",
	text: ["<html><p>You can put contact details for your space here.</p>",
	"<p>You could link to the ",
	"<a href='http://ilga.org/directory/en/'>ILGA directory</a>, ",
	"<a href='http://twitter.com/ILGAWORLD'>twitter</a> or a ",
	"<a href='http://www.facebook.com/pages/ILGA-World/160359780661454'>facebook</a> page.",
	"</p><p>Alternatively don't have one at all! Completely up to you...</p>", "</html>"].join("")
};


merge(config.extensions.TiddlySpaceInit, {
	siteIconTags: ["excludeLists", "image"],
	SiteSubtitle: "Save the world one LGBTI person at a time",
	firstRun: function() {
		var res = _firstRun.apply(this, arguments);
		config.options.chkPrivateMode = true;
		config.defaultCustomFields["server.workspace"] = tiddlyspace.getCurrentWorkspace("private");
		var title = config.extensions.GuidPlugin.guid.generate() + "_" + DEFAULT_LANGUAGE;
		tweb.getUserInfo(function(user) {
			var tiddlers = [];
			var tiddler = new Tiddler(title);
			tiddler.fields.heading = helloArticle.heading;
			tiddler.fields.summary = helloArticle.summary;
			tiddler.tags = ["help"];
			tiddler.fields.region = "WORLD";
			tiddler.creator = user.name;
			tiddler.text = helloArticle.text;
			merge(tiddler.fields, config.defaultCustomFields);
			tiddlers.push(store.saveTiddler(tiddler));
			tiddler = new Tiddler("Contact");
			tiddler.fields.heading = contactArticle.heading;
			tiddler.fields.region = "WORLD";
			tiddler.text = contactArticle.text;
			merge(tiddler.fields, config.defaultCustomFields);
			tiddler.tags = ["contact"];
			tiddler.creator = user.name;
			tiddlers.push(store.saveTiddler(tiddler));
			autoSaveChanges(null, tiddlers);
			story.displayTiddler(null, title);
			story.displayTiddler(null, "Contact");
		});
		window.setTimeout(function() {
			config.options.chkPrivateMode = true;
			saveSystemSetting("chkPrivateMode", true);
		}, 3000);
		return res;
	}
});

tiddlyspace.disableTab(["Backstage##Identities", "Backstage##Password", "Backstage##Tiddlers",
	"Backstage##Options", "Backstage##Export", "AdvancedOptions"]);

config.macros.languageToggler = {
	handler: function(place) {
		var handler = function(ev) {
			$(document.body).removeClass("language-" + DEFAULT_LANGUAGE);
			DEFAULT_LANGUAGE = $(ev.target).text().toLowerCase();
			$(document.body).addClass("language-" + DEFAULT_LANGUAGE);
			refreshAll();
		};
		var languages = ["en", "fr", "es", "pt"];
		for(var i = 0; i < languages.length; i++) {
			var lang = languages[i];
			var val = lang == DEFAULT_LANGUAGE ? false : lang;
			var link = $("<a />").attr("href", "javascript:;").
				text(lang.toUpperCase()).appendTo(place)[0];
			if(val) {
				$(link).click(handler);
			}
		}
		
	}
};

config.paramifiers.translate = {
	onstart: function(url) {
		config.paramifiers.clone.clone(url, function(tiddler) {
			var title = tiddler.title;
			var parts = title.split("_");
			if(parts.length == 2) {
				newTitle = parts[0] + "_" + DEFAULT_LANGUAGE;
				tiddler.title = newTitle
				tiddler.fields["server.title"] = newTitle;
			}
			store.addTiddler(tiddler);
			return tiddler;
		});
	}
};

config.macros.translateLink = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		if(!tiddler || !tiddler.fields["server.bag"] || !config.filterHelpers.is["public"](tiddler)) {
			return;
		}
		var articleLanguage = tiddler.title.split("_")[1];
		if(!articleLanguage) {
			return;
		}
		var container = $("<div />").addClass("translationLinks").appendTo(place)[0];
		var workspace = "bags/%0/tiddlers/%1".format(tiddler.fields["server.bag"], tiddler.title);
		tweb.getUserInfo(function(user) {
			$("<span />").text(translate("translate_articles")).appendTo(container)[0];
			var host = tweb.status.server_host;
			var url = config.extensions.tiddlyspace.getHost(host, user.name);
			for(var i = 0; i < LANGUAGES.length; i++) {
				var lang = LANGUAGES[i];
				if(lang != articleLanguage) {
					var href = "%0?language=%1#translate:[[%2]]".format(url, lang, workspace);
					$("<a />").attr("href", href).text(translate(lang)).appendTo(container);
				}
			}
		});
	}
};

config.macros.SiteIcon = {
	handler: function(place, macroName, params) {
		var width = params[0] || 48;
		var height = params[1] || 48;
		tiddlyspace.renderAvatar(place, tiddlyspace.currentSpace.name,
			{ imageOptions: { imageClass:"spaceSiteIcon", height: height, width: width, preserveAspectRatio: true }});
	}
};

/***
|''Name''|AuthenticationCssPlugin|
|''Version''|0.1.0|
|''Description''|Adds classes for styling purposes based on membership|
|''Requires''|TiddlySpaceConfig|
***/
config.extensions.tiddlyweb.getUserInfo(function(user) {
    if(user.anon) {
        $("body").addClass("anonymousUser");
    } else {
        $("body").addClass("loggedInUser");
    }
});

if(readOnly) {
    $("body").addClass("readOnly");
}


$(document.body).addClass("language-" + DEFAULT_LANGUAGE);
})(jQuery);
//}}}

