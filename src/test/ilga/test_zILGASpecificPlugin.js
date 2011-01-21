(function(module, $) {

module("zILGASpecificPlugin", {
	setup: function() {
	},
	teardown: function() {
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

})(QUnit.module, jQuery);
