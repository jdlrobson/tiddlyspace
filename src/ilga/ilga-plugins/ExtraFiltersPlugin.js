/***
|''Name''|ExtraFilters|
|''Author''|Jon Robson|
|''Version''|0.5.9|
|''Status''|@@experimental@@|
|''Requires''|TiddlySpaceFilters ImageMacroPlugin|
|''CodeRepository''|<...>|
|''License''|[[BSD|http://www.opensource.org/licenses/bsd-license.php]]|
!Notes
adds the following filters {{{
[is[image]] - returns only image tiddlers (e.g. png, jpeg, gif etc..)
[is[svg]] - returns only svg tiddlers
[isnot[image]] - filters result of previous filters for ones that are not images
[notag[<tag>]] - filters result of previous filters for ones without a tag
[nofield[<field>]] - check for absence of field or field value in previous filters
[has[<field or attribute>]] - match tiddlers which have a field or attribute set.
[and[<filter expression>]] - e.g.[and[tag:foo]] checks all tiddlers from previous filters for a tag foo.
}}}
***/
//{{{
config.filterHelpers.is.image = config.macros.image.isImageTiddler;
config.filterHelpers.is.svg = config.macros.image.isSVGTiddler;

config.filters.isnot = function(candidates, match) {
	var type = match[3];
	var results = [];
	for (var i = 0; i < candidates.length; i++) {
		var tiddler = candidates[i];
		var helper = config.filterHelpers.is[type];
		if(helper && !helper(tiddler)) {
			results.pushUnique(tiddler);
		}
	}
	return results;
};

config.filters.notag = function(results, match) {
  var tag = match[3];
  var newResults = [];
  for(var i = 0; i < results.length; i++) {
    var tiddler = results[i];
    if(!tiddler.tags.contains(tag)) {
      newResults.push(tiddler);
    }
  }
  return newResults;
};
config.filters.nofield = function(results, match) {
  var fieldname = match[3];
  var newResults = [];
  for(var i = 0; i < results.length; i++) {
    var tiddler = results[i];
    if(!tiddler.fields[fieldname]) {
      newResults.push(tiddler);
    }
  }
  return newResults;
};

config.filters.and = function(results, match) {
	var args = match[3].split(":");
	var negationMode = false;
	var handler = args[0];
	if(handler.indexOf("!") === 0) {
		handler = handler.substr(1);
		negationMode = true;
	}
	var value = args[1];
	if(config.filters[handler]) {
		var titles = [];
		var matches = config.filters[handler].call(this, [], [null, null, handler, value]); // note some filters require second argument :(
		for(var i = 0; i < matches.length; i++) {
			titles.push(matches[i].title);
		}
		var newResults = [];
		for(var i = 0; i < results.length; i++) {
			var tid = results[i];
			if(!negationMode && titles.contains(tid.title)) {
				newResults.push(tid);
			} else if(negationMode && !titles.contains(tid.title)) {
				newResults.push(tid);
			}
		}
		return newResults;
	} else {
		return results;
	}
};

config.filters.has = function(results, match) {
	var field = match[3];
	var results = [];
	store.forEachTiddler(function(title, tid) {
		if(tid[field] || tid.fields[field]) {
			results.push(tid);
		}
	});
	return results;
}
//}}}
