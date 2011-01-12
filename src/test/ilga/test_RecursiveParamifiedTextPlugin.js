(function(module, $) {

var _parseParams, _getTiddlerText;
module("ILGA: getRecursiveTiddlerText", {
	setup: function() {
		_parseParams = String.prototype.parseParams;
		_getTiddlerText = store.getTiddlerText;
		store.getTiddlerText = function() {
			return "hello $1 how are you.";
		};
		String.prototype.parseParams = function() {
			var str = this.toString();
			if(str == "title:foo with:jon") {
				return [{ title: ["foo"], "with": ["jon"] }];
			} else if(str == "foo") {
				return [{ anon: ["foo"] }];
			}
		}
	},
	teardown: function() {
		String.prototype.parseParams = _parseParams;
		store.getTiddlerText = _getTiddlerText;
	}
});

test("store.getRecursiveTiddlerText", function() {
	var text = store.getRecursiveTiddlerText("title:foo with:jon");
	strictEqual(text, "hello jon how are you.");

	var text = store.getRecursiveTiddlerText("foo");
	strictEqual(text, "hello $1 how are you.");
});

})(QUnit.module, jQuery);
