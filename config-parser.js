(function() {

// recursive descent parser for config
ConfigParser = function( mapTest ) {
	this.mapTest = mapTest;
}
ConfigParser.prototype.parse = function( config ) {
	var lines = configStr.split(/[\n]/);
	while (true) {
		var ov = this.parseOverlay( lines );
		if (ov) {
			this.mapTest.addOverlay( ov );
		}
		else {
			return;
		}
	}
}
ConfigParser.prototype.parseOverlay = function( lines ) {
	if (lines.length == 0) return null;
	var url = lines[0];
	if (! Lexer.isURL( url )) return null;
	lines.shift();
	var ov = {
		url: url,
		metadataURL: ''
	};
	this.parseOverlayParams( lines, ov );
	this.parseLayers( lines, ov );
	return ov;
}
ConfigParser.prototype.parseOverlayParams = function( lines, ov ) {
	while (true) {
		var line = scanLine(lines);
		if (line == null) return;
		var isParam = false;
		if (Lexer.isTag(MapTest.constants.META_URL, line)) {
			ov.metadataURL = Lexer.taggedValue(line);
			isParam = true;
		}
		if (Lexer.isTag(MapTest.constants.PARAM, line)) {
			var nv = Lexer.taggedParam(line);
			ov.param = $.extend({}, ov.param, nv);
			isParam = true;
		}
		if (Lexer.isTag(MapTest.constants.TILE, line)) {
			var nv = Lexer.taggedValue(line);
			ov.param = $.extend({}, ov.param, nv);
			isParam = true;
		}
		// done params
		if (! isParam) return;
		lines.shift();
	}
}
ConfigParser.prototype.parseLayers = function( lines, ov ) {
	while (true) {
		var line = scanLine(lines);
		if (line == null) return;
		if (Lexer.isURL(MapTest.constants.META_URL, line)) {
			ov.metadataURL = Lexer.taggedValue(line);
			isParam = true;
		}
		if (Lexer.isTag(MapTest.constants.PARAM, line)) {
			var nv = Lexer.taggedParam(line);
			ov.param = $.extend({}, ov.param, nv);
			isParam = true;
		}
		// done params
		if (! isParam) return;
		lines.shift();
	}
}
function scanLine( lines ) {
	while (true) {
		if (lines.length <= 0) return null;
		var line = MapTest.Util.shimTrim(lines[0]);
		if (line.length < 1) {
			lines.shift();
			continue;
		}
		if (line.startsWith('#')) {
			lines.shift();
			continue;
		}
		return line;
	}
}

Lexer = {
	isURL: function (s) {
		if (s.indexOf('http:') == 0) return true;
		if (s.indexOf('https:') == 0) return true;
		return false;
	},
	isTag: function (tag, s) {
		if (s.indexOf(tag + ':') == 0) return true;
		return false;
	},
	taggedValue: function (s) {
		var value = s.slice( s.indexOf(':')+1);
		var name = s.slice( 0, s.indexOf(':') );
		var nv = {};
		nv[name] = MapTest.Util.shimTrim( value );
		return nv;
	},
	taggedParam: function (s) {
		var value = s.slice( s.indexOf(':')+1);
		var neqv = MapTest.Util.shimTrim( value );
		var nvArr = neqv.split('=');
		var nv = {};
		nv[nvArr[0]] = nvArr[1];
		return nv;
	},
	isComment: function (s) {
		if (s.indexOf('//') == 0) return true;
		if (s.indexOf('#') == 0) return true;
		return false;
	}
}


})();
