(function(module, $) {

var testTiddlers, _tids;
module("ILGA: ExtraFiltersPlugin", {
	setup: function() {
		_tids = [{ title: "foo1", bag: "foo_public", foo: "", tags: ["hello"], creator: "jon" }, 
			{ title: "foo2", tags: ["bar"], foo: "bar", bag: "foo_public"}, { title: "foo3", tags: ["bar"], bag: "foo_private"}];
		testTiddlers = [];
		for(var i = 0; i < _tids.length; i++) {
			var tid = _tids[i];
			var tiddler = new Tiddler(tid.title);
			tiddler.tags = tid.tags;
			tiddler.creator = tid.creator;
			if(tid.foo) {
				tiddler.fields.foo = tid.foo;
			}
			tiddler.fields["server.bag"] = tid.bag;
			testTiddlers.push(tiddler);
			store.saveTiddler(tiddler);
		}
	},
	teardown: function() {
		testTiddlers = null;
		for(var i = 0; i < _tids.length; i++) {
			store.removeTiddler(_tids[i].title);
		}
		_tids = null;
	}
});

test("isnot filter", function() {
	var res = config.filters.isnot(testTiddlers, [null, null, null, "public"]);
	strictEqual(res.length, 1, "only 1 tiddlers is not public");
});

test("notag filter", function() {
	var res = config.filters.notag(testTiddlers, [null, null, null, "bar"]);
	strictEqual(res.length, 1, "only 1 tiddler has not got the tag bar");
	strictEqual(res[0].title, "foo1");
	
	var res2 = config.filters.notag(testTiddlers, [null, null, null, "dontexist"]);
	strictEqual(res2.length, 3, "no tiddlers have this tag");

	var res = config.filters.notag([store.getTiddler("foo2")], [null, null, null, "bar"]);
	strictEqual(res.length, 0, "the tiddler with title foo2 does have the tag bar");
});

test("nofield filter", function() {
	var res = config.filters.nofield(testTiddlers, [null, null, null, "foo"]);
	strictEqual(res.length, 2, "only 2 tiddlers have NOT got the field foo (foo1 with empty string doesnt count)");
});

test("has filter", function() {
	var res = config.filters.has(testTiddlers, [null, null, null, "foo"]);
	strictEqual(res.length, 1, "only 1 tiddler has got the field foo");
	strictEqual(res[0].title, "foo2");
	
	var res = config.filters.has(testTiddlers, [null, null, null, "creator"]);
	strictEqual(res.length, 1, "only 1 tiddler has got a creator attribute");
	strictEqual(res[0].title, "foo1");
});

// TODO: and filter

})(QUnit.module, jQuery);
