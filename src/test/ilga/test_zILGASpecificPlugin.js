(function(module, $) {

var ajaxReqCall, _ajaxReq, place, getUserInfo;
module("zILGASpecificPlugin", {
	setup: function() {
		_getUserInfo = config.extensions.tiddlyweb.getUserInfo;
		config.extensions.tiddlyweb.getUserInfo = function(callback) {
			callback({ name: "bob", anon: false });
		};
		place = $("<div />").appendTo(document.body)[0];
		ajaxReqCall = null;
		_ajaxReq = ajaxReq;
		ajaxReq = function(opts) {
			if(ajaxReqCall === 1) {
				if(opts.url === "/bags/published-articles-fr_public/tiddlers/test_fr") {
					opts.error();
				} else if(opts.url === "spaces/published-articles-fr/members"){
					opts.success(["bob"]);
				}
			} else if(ajaxReqCall === 2) {
				if(opts.url === "/bags/published-articles-fr_public/tiddlers/test_fr") {
					opts.success();
				}
			}
		};
	},
	teardown: function() {
		config.extensions.tiddlyweb.getUserInfo = _getUserInfo;
		$(place).remove();
		ajaxReqCall = null;
		ajaxReq = _ajaxReq;
	}
});

test("config.macros.setPublishBag.update", function() {
	var el = $("<div />")[0];
	var container = $("<div />").appendTo(el)[0];
	var bag = $("<input type='text' edit='server.bag' value='bar' />").appendTo(container)[0];
	var ws = $("<input type='text' edit='server.workspace' value='recipes/bar' />").appendTo(container)[0];
	config.macros.setPublishBag.update(el, "foo");
	strictEqual($(ws).val(), "bags/foo");
	strictEqual($(bag).val(), "foo");
});

test("config.macros.setPublishBag.determineBag", function() {
	var res1 = config.macros.setPublishBag.determineBag("afadadafoo");
	var res2 = config.macros.setPublishBag.determineBag("");
	var res3 = config.macros.setPublishBag.determineBag(undefined);
	var res4 = config.macros.setPublishBag.determineBag("foo_en");
	var res5 = config.macros.setPublishBag.determineBag("foo_fr");
	var res6 = config.macros.setPublishBag.determineBag("foo_jp");
	strictEqual(res1, false);
	strictEqual(res2, false);
	strictEqual(res3, false);
	strictEqual(res4, "published_articles_en");
	strictEqual(res5, "published_articles_fr");
	strictEqual(res6, false);
});


test("config.macros.ilgaClone.translateLink (translate article)", function() {
	config.macros.ilgaClone.translateLink(place, "test_fr", "bags/jon_public", "fr");
	var linkElements = $("a", place);
	var labels = [];
	var links = [];
	linkElements.each(function(i, el) {
		links.push($(el).attr("href"));
		labels.push($(el).text());
	});
	strictEqual(linkElements.length, 3, "3 links were created to translate (no french)");
	strictEqual(links.indexOf("http://bob.tiddlyspace.com?language=es#translate:[[bags/jon_public/tiddlers/test_fr]]") > -1, 
		true, "Link to spanish translation");
	strictEqual(links.indexOf("http://bob.tiddlyspace.com?language=fr#translate:[[bags/jon_public/tiddlers/test_fr]]") > -1, 
		false, "No link to french translation");
});

test("config.macros.ilgaClone.translateLink (publish article - new one)", function() {
	ajaxReqCall = 1;
	config.macros.ilgaClone.publishLink(place, "test_fr", "bags/jon_public", "fr");
	var link = $("a", place);
	strictEqual(link.text(), "publish");
	strictEqual(link.attr("href"), "http://published-articles-fr.tiddlyspace.com#clone:[[bags/jon_public/tiddlers/test_fr]]");
});

test("config.macros.ilgaClone.translateLink (publish article - existing one)", function() {
	ajaxReqCall = 2;
	config.macros.ilgaClone.publishLink(place, "test_fr", "bags/jon_public", "fr");
	var link = $("a", place);
	strictEqual(link.text(), config.macros.ilgaClone.locale.liveLabel);
	strictEqual(link.attr("href"), "http://ilga.org/ilga/fr/article/test");
});

})(QUnit.module, jQuery);
