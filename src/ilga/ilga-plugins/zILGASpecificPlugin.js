/***
|''Name''|ILGASpecificPlugin|
|''Version''|0.3.4dev|
|''Contributors''|Jon Robson, Ben Gillies, Jon Lister|
|''License:''|[[BSD open source license]]|
|''Requires''|TiddlySpaceConfig TiddlySpaceBackstage|
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
story.oldDisplayTiddler = story.displayTiddler;
story.displayTiddler =function(srcElement,tiddler,template,animate,unused,customFields,toggle,animationSrc){
	this.oldDisplayTiddler(srcElement,tiddler,template,animate,unused,customFields,toggle,animationSrc);
	var tiddlers = $(".tiddler").each(function(i, el) {
		var name = $(el).attr("template");
		$(el).addClass("template_"+name);
	});
};
config.options.chkHttpReadOnly = false;
/*********************************
MACROS
*********************************/
config.macros.templateSection = {
	handler: function(place, macroName, params, wikifier,
		paramString, tiddler) {
		var section = params[0];
		var group = params[1] || "default-group"
		var args = paramString.parseParams("anon")[0];
		var el = story.findContainingTiddler(place);
		$("[section][group=%0]".format(group), el).hide();
		var showSection = function(target) {
			target = $(target).closest(".sectionButton")[0];
			var s = $(target).data("section");
			var g = $(target).data("group");
			var el = story.findContainingTiddler(target);
			console.log("show section", s,g );
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
					showSection(place)
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
		var url = "http://ilga.org/ilga/%0/article/%1".format(language, id);
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
}
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

		$(bagEl).val(bag)
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
}
/* creates links in the correct language */
config.macros.ilga_link = {
	handler:function(place,macroName,params,wikifier,paramString,tiddler){
		var lang = DEFAULT_LANGUAGE;
		var url = "";
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
			var url = "%0://%1".format([sh.scheme, sh.host]);
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
	config.macros.editvideo.enableflash =	translate("cantuploadvideo");
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
config.extensions.ServerSideSavingPlugin.reportSuccess = function(msg, tiddler) {
	var bag = tiddler.fields['server.bag'];
	if(!bag) {
		bag = "general";
	}
	msg = config.translator("savesuccess."+bag);
	if(!msg) {
		msg = config.translator("savesuccess.general");
	}
	if(tiddler.tags.contains("excludeMissing")) {
		msg = config.translator("deletesuccess");
		refreshDisplay();
	}
	msg = msg.replace("%s",tiddler.title);
	displayMessage(msg);
};

if(typeof(config.extensions.chkEditorMode) == "undefined") {
	config.options.chkEditorMode = true;
	saveOptionCookie("chkEditorMode");
}
config.macros.toggleAuthorMode = {
	handler: function(place) {
		var mode = config.options.chkEditorMode;
		if(readOnly) mode = false;
		var toggle = function(btn, firstTime) {
			var newMode;
			if(!firstTime) {
				mode = config.options.chkEditorMode;
				newMode = mode ? false : true;
			} else {
				newMode = mode;
			}
			config.options.chkEditorMode = newMode;
			saveOptionCookie("chkEditorMode");
			$("body").removeClass("isEditor isReader");
			if(newMode) {
				$("body").addClass("isEditor");
				$(btn).text("switch to view mode");
			} else {
				$("body").addClass("isReader");
				$(btn).text("switch to edit mode");
			}
		};
		var btn = $("<a />").click(function(ev) {
			toggle(ev.target);
		}).appendTo(place);
		toggle(btn, true);
		if(readOnly) btn.remove();
	}
}

// update link to take a label
config.macros.view.views.link = function(value,place,params,wikifier,paramString,tiddler) {
	var btn = createTiddlyLink(place,value, true);

	var args = paramString.parseParams("anon")[0];
	var label = args.labelField ? tiddler[args.labelField] || tiddler.fields[args.labelField] : args.anon[2];
	if(params[2]) {
		$(btn).text(label);
	}
}
})(jQuery);
//}}}
