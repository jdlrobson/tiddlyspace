/***
|''Name''|RecursiveParamifiedTextPlugin|
|''Description''|Extends recursive tiddler text to take parameters when title: keywords is present|
|''Version''|0.2.0|
***/
//{{{
TiddlyWiki.prototype.getRecursiveTiddlerText = function(title,defaultText,depth)
{
	var bracketRegExp = new RegExp("(?:\\[\\[([^\\]]+)\\]\\])","mg");
	// begin new code : should make use of same code as tiddler macro.
	var args = title.parseParams("anon")[0];
	var substitutions = [];
	if(args.title) {
		title = args.title;
		substitutions = args["with"] || [];
	}
	var text = this.getTiddlerText(title,null);
	var n = substitutions ? Math.min(substitutions.length,9) : 0;
	for(var i=0; i<n; i++) {
		var placeholderRE = new RegExp("\\$" + (i + 1),"mg");
		text = text.replace(placeholderRE,substitutions[i]);
	}
	/// end new code.
	if(text == null)
		return defaultText;
	var textOut = [];
	var lastPos = 0;
	do {
		var match = bracketRegExp.exec(text);
		if(match) {
			textOut.push(text.substr(lastPos,match.index-lastPos));
			if(match[1]) {
				if(depth <= 0)
					textOut.push(match[1]);
				else
					textOut.push(this.getRecursiveTiddlerText(match[1],"",depth-1));
			}
			lastPos = match.index + match[0].length;
		} else {
			textOut.push(text.substr(lastPos));
		}
	} while(match);
	return textOut.join("");
};
//}}}

