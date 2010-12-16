/***
|''Name''|NewGUIDTiddlers|
|''Version''|0.2.0|
!Attribution
GUID code written by Mahemoff
 * Copyright (c) <year>, <copyright holder>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *   * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY <copyright holder> ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <copyright holder> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * TODO:
 * - Support for ISO GUID stanard
***/
//{{{
(function($) {

function Guid(options) {
	this.options = options || {};
	this.chars = this.options.chars || Guid.constants.alphanumerics;
	this.epoch = this.options.epoch || Guid.constants.epoch1970;
	this.counterSequenceLength = this.options.counterSequenceLength || 1;
	this.randomSequenceLength = this.options.randomSequenceLength || 2;
}

Guid.prototype.generate = function() {
	var now = (new Date()).getTime() - this.epoch;
	var guid = this.baseN(now);
	this.counterSeq = (now==this.lastTimestampUsed ? this.counterSeq+1 : 1);
	guid += this.counterSeq;
	for (var i=0; i<this.randomSequenceLength; i++) {
		guid += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
	}
	this.lastTimestampUsed = now;
	return guid;
};

Guid.prototype.baseN = function(val) {
	if (val === 0) {
		return "";
	}
	var rightMost = val % this.chars.length;
	var rightMostChar = this.chars.charAt(rightMost);
	var remaining = Math.floor(val / this.chars.length);
	return this.baseN(remaining) + rightMostChar;
};

Guid.constants = {};
Guid.constants.numbers = "0123456789";
Guid.constants.alphas = "abcdefghijklmnopqrstuvwxyz";
Guid.constants.lowerAlphanumerics = "0123456789abcdefghijklmnopqrstuvwxyz";
Guid.constants.alphanumerics = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
// http://tools.ietf.org/html/rfc1924
Guid.constants.base85 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+-;<=>?@^_`{|}~";

Guid.constants.epoch1970 = (new Date(0));
Guid.constants.epoch = function(year) { 
	return (new Date("Jan 1 " + year)).getTime();
};

version.extensions.GuidPlugin = { installed: true };
if (!config.extensions) { 
	config.extensions = {};
}
config.extensions.GuidPlugin = {};

// clients may override these
config.extensions.GuidPlugin.guid = new Guid();
var _createNewTiddlerButton = config.macros.newTiddler.createNewTiddlerButton;
config.macros.newTiddler.createNewTiddlerButton = function(place,title,params,label,prompt,accessKey,newFocus,isJournal) {
	var guid = getParam(params, "guid", false);
	var guid_suffix = getParam(params, "guid_suffix", "");
	var guid_prefix = getParam(params, "guid_prefix", "");
	var btn = _createNewTiddlerButton.apply(this, arguments);
	if(guid) {
		$(btn).attr("guid", "yes");
		$(btn).attr("guid_prefix", guid_prefix);
		$(btn).attr("guid_suffix", guid_suffix);
	}
	return btn;
};
var _onClickNewTiddler = config.macros.newTiddler.onClickNewTiddler;
config.macros.newTiddler.onClickNewTiddler = function() {
	_onClickNewTiddler.apply(this, arguments);
	var title = this.getAttribute("newTitle");
	var guid = this.getAttribute("guid");
	var prefix = this.getAttribute("guid_prefix");
	var suffix = this.getAttribute("guid_suffix");
	if(guid) {
		story.getTiddlerField(title, "title").value = prefix + 
			config.extensions.GuidPlugin.guid.generate() + suffix;
	}
};

})(jQuery);
//}}}
