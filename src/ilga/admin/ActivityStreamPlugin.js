/***
|''Name''|ActivityStreamPlugin|
|''Version''|0.4.12|
|''Description''|Provides a following macro|
|''Author''|Jon Robson|
|''Requires''|TiddlySpaceFollowingPlugin|
|''License''|[[BSD|http://www.opensource.org/licenses/bsd-license.php]]|
!Usage
{{{<<activity>>}}}
!!Supressing activity
You can supress notifications by  id:
"plugin", "shadow", "standard", "follow", "followYou", "siteInfo", "siteIcon", "ownSiteIcon", "notify", "reply"
e.g. {{{ <<activity supress:siteIcon>> }}} will hide siteIcon activity from you.

!!Supressing people
{{{<<activity ignore:person}}} will ignore all activity where person is the subject of the activity. eg. person followed other-person will not appear in the feed.
!!Controlling displayed dates.
{{{<<activity timestampFormat:"<0hh o' clock>" headingFormat:"0DD/0MM" >>}}} will display date headings as date/month eg.
3rd of January would be displayed as 03/01. This particular timestamp example gives you the hour of the activity.

!!Even more content
{{{<<activity limit:no>>}}} will show you all possible activity in the last X days where X is set at a macro level (advanced developers should see config.macros.activity.RECENTNESS).
!StyleSheet

.activityStream .externalImage, .activityStream .image {
	display: inline;
}

.feedItem .siteIcon {
	display: inline;
}

.activityStream .error {
	background-color: red;
	color: white;
	font-weight: bold;
}

.activityStream .feedItem {
list-style: none;
}

.activityStream .notification {
	background-color: yellow;
	color: black;
}

.activityStream .activityGroupTitle {
	font-weight: bold;
	margin-top: 8px;
}
.activityStream .feedItem {
	margin-left: 8px;
}
!Code
***/
//{{{
(function($) {
var name = "StyleSheetActivityStream";
config.shadowTiddlers[name] = store.getTiddlerText(tiddler.title +
     "##StyleSheet");
store.addNotification(name, refreshStyles);

var followMacro = config.macros.followTiddlers;
var tweb = config.extensions.tiddlyweb;
var tiddlyspace = config.extensions.tiddlyspace;
var scanMacro = config.macros.tsScan;

var modifierSpaceLink = "<<view modifier spaceLink>>";
var spaceTiddlyLink = "<<view server.bag spaceLink server.title>>";
var bagSpaceLink = "<<view server.bag spaceLink>>";
var bagSiteIcon = "<<view server.bag SiteIcon width:24 height:24 label:no preserveAspectRatio:yes>>";
var modifierSiteIcon = "<<view modifier SiteIcon width:24 height:24 label:no preserveAspectRatio:yes>>";
var timestamp = "[<<view modified date '0hh:0mm'>>]";
var replyLink = "<<view server.title replyLink>>";
config.shadowTiddlers.ActivityStreamTemplates = [
	"userSiteIcon:%3 %6 %7 has a new ~SiteIcon.\n",
	"spaceSiteIcon:%3 %6 %7 updated the SiteIcon for the %0 %1 space.\n",
	"image:%3 %6 %7 drew the image %2.\n",
	"plugin:%3 %6 %7 modified a plugin called %2 in the %0 %1 space.\n",
	"shadow:%3 %6 %7 modified a shadow tiddler %2 in the %0 %1 space.\n",
	"geo:%3 %6 %7 modified a geo tiddler called %2 in the %0 %1 space <<view title maplink 'view on map'>>. %8\n",
	"followYou:%3 %0 %1 is now following you.\n",
	"follow:%3 %0 %1 is now following %4 %5 <<view server.title link follow>>\n",
	"siteInfo:%3 %6 %7 <<view server.bag spaceLink server.title label:described>> the %0 %1 space.\n",
	"notify:%3 {{notification{%0 %1 has modified %2 in %0 %1 and flagged it for your attention!}}} %8\n",
	"reply:%3 {{notification{%0 %1 replied with %2 to your %4 %5 post.}}} %8\n",
	"video:%3 %6 %7 modified a video entitled %2 in the %0 %1 space. %8\n",
	"standard:%3 %6 %7 modified %2 in the %0 %1 space. %8\n",
	].join("").format(bagSiteIcon, bagSpaceLink, spaceTiddlyLink, timestamp,
		"<<view server.title SiteIcon width:24 height:24 label:no preserveAspectRatio:yes>>", "<<view server.title spaceLink>>",
		modifierSiteIcon, modifierSpaceLink, replyLink);
story.refreshTiddler("ActivityStreamTemplates", null, true);
config.annotations.ActivityStreamTemplates = "This is a special tiddler used by the ActivityStreamPlugin. It is used for templating notifications. Templates at the top have preference over templates at the bottom.";

var macro = config.macros.activity = {
	default_limit: 50,
	init: function() {
		var templates = [];
		$.each(store.calcAllSlices("ActivityStreamTemplates"), function(i, el) { templates.push(i); })
		macro.templates = templates;
	},
	// order matters - earlier templates override older ones
	RECENTNESS: 2, // in days
	TIMESTAMP_FORMAT: "<0hh:0mm>",
	_status: {},
	locale: {
		pleaseWait: "please wait while we load your stream...",
		errorLoading: "The activity stream failed to load. Please make sure you have an internet connection and try again.",
		userHeading: "Below is the activity stream for spaces you follow with the follow tag.",
		spaceHeading: "Below is the activity stream for this space.",
		emptyStream: "Activity stream currently empty."
	},
	getTimeStamp: function() {
		var today = new Date();
		var previous = new Date(today.setDate(today.getDate() - macro.RECENTNESS));
		return previous.convertToYYYYMMDDHHMM();
	},
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var container = $("<div />").text(macro.locale.pleaseWait).appendTo(place).
			attr("refresh", "macro").attr("macroName", macroName).attr("paramString", paramString);
		var space = tiddlyspace.currentSpace.name;
		var options = macro.getOptions(paramString);
		$(container).attr("activity-limit", options.limit);
		macro._session = Math.random();
		var activityType;
		var sourceActivity = function(user) {
			macro.CURRENT_USER = user.name;
			macro.USER_AT_TAG = "@%0".format(user.name);
			if(macro.CURRENT_USER == space || options.user) {
				activityType = "user";
				followMacro.getFollowers(function(users) {
					macro.getActivity(container, users, activityType, options);
				}, macro.CURRENT_USER);
			} else {
				activityType = "space";
				macro.getActivity(container, [space], activityType, options);
			}
			container.attr("activity-type", activityType);
			macro._renderStream(container, activityType, options);
		};

		if(options.user) {
			sourceActivity({name: options.user});
		} else {
			tweb.getUserInfo(sourceActivity);
		}
	},
	getOptions: function(paramString) {
		var options = {};
		var args = paramString.parseParams("name")[0];
		var toMap = ["timestampFormat", "headingFormat", "limit", "user"];
		var i;
		for(i = 0; i < toMap.length; i++) {
			var map = toMap[i];
			options[map] = args[map] ? args[map][0] : false;
		}
		var supress = args.supress || [];
		var templates = [];
		var show = args.show ? args.show : macro.templates;
		for(i = 0; i < show.length; i++) {
			var template = show[i];
			if(supress.indexOf(template) == -1) {
				templates.push(template);
			}
		}
		options.ignore = args.ignore || [];
		options.templates = templates;
		return options;
	},
	_getActivityQuery: function(user, timestamp) {
		timestamp = timestamp || macro.getTimeStamp();
		if(user) {
			return "/bags/%0_public/tiddlers?select=modified:>%1".format(user, timestamp);
		} else {
			return false;
		}
	},
	refresh: function(container) {
		var type = $(container).attr("activity-type");
		var limit = $(container).attr("activity-limit");
		var options = macro.getOptions($(container).attr("paramString"));
		options.limit = parseInt(limit, 10);
		macro.renderStream(container, type, options);
	},
	getActivity: function(place, users, type, options) {
		var timestamp = macro.activityTimestamp;
		var afterAjax = function(tiddlers) {
			macro.updateStream(tiddlers, type, options);
			macro.renderStream(place, type, options);
		};
		var success = function(tiddlers) {
			afterAjax(tiddlers);
		};
		var error = function() {
			afterAjax([]);
		};

		for(var i = 0; i < users.length; i++) {
			var user = users[i];
			ajaxReq({
				url: macro._getActivityQuery(user, timestamp),
				dataType: "json", success: success, error: error
			});
		}
		macro.activityTimestamp = new Date().convertToYYYYMMDDHHMM();
	},
	reportError: function(place) {
		var error = $("<div />").addClass("error").text(locale.errorLoading);
		$(place).empty().append(error);
	},
	createFeedEntry: function(container, tiddler, options) {
		var status = macro._status;
		var item = $("<li />").addClass("feedItem");
		var content = $("<div />").appendTo(item);
		var wikifyPlace = $("<span />").appendTo(content)[0];
		var author = tiddler.modifier;
		if(author && !options.ignore.contains(author)) {
			$(container).append(item);
			config.macros.view.views.activityItem(null, wikifyPlace, null, null, null, tiddler);
			return item;
		}
		return false;
	},
	renderStream: function(place, type, options) {
		window.clearTimeout(macro._renderTimeout);
		macro._renderTimeout = window.setTimeout(function() {
			macro._renderStream(place, type, options);
		}, 100);
	},
	_renderStream: function(place, type, options) {
		$(place).empty();
		var limit = options.limit;
		var container = $("<ul />").addClass("activityStream").appendTo(place);
		var textHeading;
		if(type == "space") {
			textHeading = macro.locale.spaceHeading;
		} else { // user
			textHeading = macro.locale.userHeading;
		}
		$("<li />").addClass("listTitle").text(textHeading).appendTo(container);
		var tiddlers = store.sortTiddlers(store.filterTiddlers("[server.activity[true]]"), "-modified"); // TODO: sort headings instead if possible (conflicts with limit)
		var headings = [];
		var groups = {};
		var processed = 0, i;
		var atEndOfActivityFeed = true;
		for(i = 0; i < tiddlers.length; i++) {
			var tiddler = tiddlers[i];
			if(options.templates.contains(tiddler.fields["server.activity.type"])) {
				if(!limit || processed < limit) {
					var modified = tiddler.modified;
					if(modified) {
						// format date.
						var modifiedString = modified.formatString(options.headingFormat || config.macros.timeline.dateFormat);
						if(headings.contains(modifiedString)) {
							groups[modifiedString].push(tiddler);
						} else {
							headings.push(modifiedString);
							groups[modifiedString] = [ tiddler ];
						}
					}
					processed += 1;
				} else {
					atEndOfActivityFeed = false;
				}
			}
		}
		var somethingRendered;
		for(i = 0; i < headings.length; i++) {
			var heading = headings[i];
			var _tiddlers = store.sortTiddlers(groups[heading], "-modified");
			var headingEl;
			if(_tiddlers.length > 0) {
				headingEl = $("<li />").addClass("listTitle activityGroupTitle").text(heading).appendTo(container);
			}
			var rendered = [];
			for(var j = 0; j < _tiddlers.length; j++) {
				var item = macro.createFeedEntry(container, _tiddlers[j], options);
				if(item) {
					rendered.push(item);
				}
			}
			if(rendered.length === 0) {
				headingEl.remove();
			} else {
				somethingRendered = true;
			}
		}
		if(!somethingRendered) {
			var msg;
			if(macro.gotActivity) { // it has been run before
				msg = macro.locale.emptyStream;
			} else {
				msg = macro.locale.pleaseWait;
			}
			$(container).text(msg);
		}
		if(!atEndOfActivityFeed) { // show more button
			$("<input />").attr("type", "button").val("more").click(function(ev) {
				var currentLimit = $(place).attr("activity-limit");
				var newLimit = parseInt(currentLimit, 10) + 50;
				macro.default_limit = newLimit;
				$(place).attr("activity-limit", newLimit);
				macro.refresh(place);
			}).appendTo(place);
		}
		this.gotActivity = true;
	},
	updateStream: function(jstiddlers, type, options) {
		// assume already sorted.
		var tiddlers = scanMacro._tiddlerfy(jstiddlers, options);
		var _dirty = store.isDirty();
		$.each(tiddlers, function(i, tid) {
			var info = config.macros.view.activity.getActivityInfo(tid, options);
			tid.fields["server.activity.type"] = info.type;
			tid.fields["server.activity"] = "true";
			if(!tid.tags.contains("excludeLists")) {
				tid.title = "%0 [%1]".format(tid.title, tid.fields["server.space"]);
				tid.tags = tid.tags.concat(["excludeLists", "excludeMissing", "excludeSearch"]);
				tid.fields.doNotSave = "true";
				store.addTiddler(tid); // save caused unsaved changes alert and slowdown
			}
		});
		store.setDirty(_dirty);
	}
};

config.macros.view.views.activityItem = function(value, place, params, wikifier,
	paramString, tiddler) {
	var info = config.macros.view.activity.getActivityInfo(tiddler, {});
	wikify(info.template, place, null, tiddler);
};

var helper = config.macros.view.activity = {
	_isNotification: function(tiddler) {
		return tiddler.tags.contains(macro.USER_AT_TAG) || tiddler.tags.contains("@all");
	},
	_repliesOn: function() {
		return tiddlyspace.currentSpace.name == macro.CURRENT_USER;
	},
	types: {
		video: function(tiddler) {
			return tiddler.tags.contains("video");
		},
		geo: function(tiddler) {
			return tiddler.fields["geo.lat"] && tiddler.fields["geo.long"];
		},
		siteInfo: function(tiddler) {
			var title = tiddler.fields["server.title"];
			return title == "SiteInfo";
		},
		userSiteIcon: function(tiddler) {
			var modifierBag = "%0_public".format(tiddler.modifier);
			var title = tiddler.fields["server.title"];
			return title == "SiteIcon" && modifierBag == tiddler.fields["server.bag"];
		},
		spaceSiteIcon: function(tiddler) {
			var title = tiddler.fields["server.title"];
			return title == "SiteIcon"; // note userSiteIcon above does the bag check
		},
		shadow: function(tiddler) {
			var title = tiddler.fields["server.title"];
			return title in config.shadowTiddlers;
		},
		plugin: function(tiddler) {
			return tiddler.tags.contains("systemConfig");
		},
		followYou: function(tiddler) {
			var title = tiddler.fields["server.title"];
			title = title.indexOf("@") === 0 ? title.substr(1) : title;
			return tiddler.tags.contains("follow") && title == macro.USER_AT_TAG;
		},
		follow: function(tiddler) {
			return tiddler.tags.contains("follow");
		},
		reply: function(tiddler) {
			var title = tiddler.fields["server.title"];
			var myTiddler = store.getTiddler(tiddler.title);
			var myTiddlerIsOlder = myTiddler && myTiddler.modified < tiddler.modified;
			return store.tiddlerExists(title) && myTiddlerIsOlder && helper._repliesOn(tiddler);
		},
		notify: function(tiddler) {
			var title = tiddler.fields["server.title"];
			var myTiddler = store.getTiddler(title);
			var myTiddlerIsNewer = myTiddler && myTiddler.modified > tiddler.modified;
			return helper._isNotification(tiddler) && helper._repliesOn(tiddler) && !myTiddlerIsNewer;
		},
		standard: function(tiddler) {
			return true;
		},
		image: function(tiddler) {
			return config.macros.image.isImageTiddler(tiddler);
		}
	},
	// each type should point to a slice in ActivityStreamTemplates tiddler
	getActivityInfo: function(tiddler, options) {
		var repliesOn = tiddlyspace.currentSpace.name == macro.CURRENT_USER;
		var locale = store.getTiddlerSlices("ActivityStreamTemplates", options.templates || macro.templates);
		var activityType;
		if(tiddler) {
			for(var i = 0; i < macro.templates.length; i++) {
				var type = macro.templates[i];
				if(!activityType && helper.types[type]) {
					if(helper.types[type](tiddler)) {
						activityType = type;
					}
				}
			}
		}
		var template = locale[activityType] || locale.standardTemplate;
		return activityType ? { template: template, type: activityType } : false;
	}
};

config.macros.view.views.link = function(value, place, params, wikifier,
		paramString, tiddler) {
		var el = createTiddlyLink(place,value,true);
		if(params[2]) {
			$(el).text(params[2]);
		}
};

config.macros.view.views.maplink = function(value, place, params, wikifier,
		paramString, tiddler) {
		var lat = tiddler.fields["geo.lat"];
		var lng = tiddler.fields["geo.long"];
		var label  = params[2] || value;
		if(lat && lng) {
			$("<a />").attr("href", "http://maps.google.com/maps?saddr=%0,%1".format(lat, lng)).text(label).appendTo(place);
		}
};

var _display = Story.prototype.displayTiddler;
Story.prototype.displayTiddler = function(srcElement,title,template,animate,unused,customFields,toggle,animationSrc) {
	var tiddler = store.getTiddler(title);
	if(tiddler && tiddler.fields["server.activity"] == "true") {
		return tiddlyspace.displayServerTiddler(srcElement, tiddler.fields["server.title"], tiddler.fields["server.workspace"]);
	} else {
		return _display.apply(this, arguments);
	}
};

})(jQuery);
//}}}