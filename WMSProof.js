(function() {
	
WMSProof = function(overlay) {
	this.overlay = overlay;
	this.createPage();
}
WMSProof.prototype.createPage = function() {
	var self = this;
	
	var config = this.createConfig();
	var toc = this.createTOC();
	var layers = this.createLayers();
	
	var link = window.document.location + this.overlay.urlParam();

	var win = window.open(
				"",
				"_blank" );
	$.get('wms-proof.html', writeProof);
	
	function writeProof( template ) {
		var doc = template.replace("{{TOC}}", toc);
		var doc = doc.replace("{{LAYERS}}", layers);
		var doc = doc.replace("{{MAPTEST_PERMALINK}}", link);
		doc = doc.replace( /{{SERVICE}}/g, self.overlay.url );
		win.document.write( doc );
		win.focus();
	}
}
WMSProof.prototype.createTOC = function() {
	var lyrs = [];
	for (var i = 0; i < this.overlay.mapLayers.length; i++) {
		var lyr = this.overlay.mapLayers[i];
		if (! lyr.visibility) continue;
		
		var text = '<div> <a id="toc-layer-{{INDEX}}" href="#layer-{{INDEX}}">{{LAYER}}</a> </div>';
		text = text.replace(/{{INDEX}}/g, i );
		text = text.replace(/{{LAYER}}/g, lyr.name );
		lyrs.push( text );
	}
	return lines(lyrs);
}
WMSProof.prototype.createLayers = function() {
	var centerOL = this.overlay.map.getCenter();
	centerOL.transform( CRS.PROJ_WEBMERC, CRS.PROJ_GEO );
	var center = [ centerOL.lon, centerOL.lat ];
	var scale = Math.round( this.overlay.map.getScale() );
	var mapParam = {
		center: center,
		scale: scale,
		bbox: bbox(center, scale)
	}
	
	var lyrs = [];
	for (var i = 0; i < this.overlay.mapLayers.length; i++) {
		var lyr = this.overlay.mapLayers[i];
		if (! lyr.visibility) continue;
		lyrs.push( this.createLayer( i, this.overlay.mapLayers[i], mapParam  ));
	}
	var text = lines(lyrs);
	
	text = text.replace(/{{SERVICE}}/g, this.overlay.url );

	return text;
}
WMSProof.prototype.createLayer = function( index, lyr, mapParam ) {
	var mapURL = this.genGetMap( this.overlay.url, lyr, mapParam );
	var legendURL = this.genGetLegendGraphic( this.overlay.url, lyr );
	
	var text = lines([
	'<div class="layer-row">'
	,'  <a id="layer-{{INDEX}}">'
	,'  <h2 class="layer-heading">{{LYR}}</h2>'
	,'  </a>'
	,'  <div>Center: {{CENTER_X}}, {{CENTER_Y}}</div>'
	,'  <div>Scale: {{SCALE}}</div>'
	,'  <a target="_blank" href="{{MAPURL}}"><img class="map" src="{{MAPURL}}"'
	,'    onerror=" document.getElementById(\'toc-layer-{{INDEX}}\').style.color=\'red\' "></a>'
	,'  <img class="legend" src="{{LEGENDURL}}">'
	,'</div>'
	]);
	text = text.replace(/{{INDEX}}/g, index );
	text = text.replace(/{{LYR}}/g, lyr.name );
	text = text.replace(/{{CENTER_X}}/g, mapParam.center[0].toFixed(5) );
	text = text.replace(/{{CENTER_Y}}/g, mapParam.center[1].toFixed(5) );
	text = text.replace(/{{SCALE}}/g, mapParam.scale );
	text = text.replace(/{{MAPURL}}/g, mapURL );
	text = text.replace(/{{LEGENDURL}}/g, legendURL );
	return text;
}
WMSProof.prototype.genGetMap = function( service, lyr, mapParam ) {
	//var extId = lyr.extentId || 'bc';
	var url = "{{SERVICE}}?LAYERS={{LYR}}&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&FORMAT=image%2Fpng&SRS=EPSG%3A3857&BBOX={{BBOX}}&WIDTH={{SIZE}}&HEIGHT={{SIZE}}";
	url = url.replace("{{SERVICE}}", service );
	url = url.replace("{{LYR}}", lyr.name);
	url = url.replace("{{BBOX}}", mapParam.bbox );  //"-15525561.395084849,5670850.735917007,-12526950.280915154,8669461.8500867");  //this.bbox( this.location(lyr), this.scale(lyr) ) );
	url = url.replace(/{{SIZE}}/g, "500"); //this.params.imageSize );
	return url;
}
WMSProof.prototype.genGetLegendGraphic = function( service, lyr ) {
	var url = "{{SERVICE}}?SERVICE=WMS&VERSION=1.1.1&REQUEST=getlegendgraphic&FORMAT=image/png&layer={{LYR}}";
	url = url.replace("{{SERVICE}}", service );
	url = url.replace("{{LYR}}", lyr.name);
	return url;
}

WMSProof.prototype.createConfig = function() {
	var center = this.overlay.map.getCenter();
	center.transform( CRS.PROJ_WEBMERC, CRS.PROJ_GEO );
	
	var lyrs = [];
	for (var i = 0; i < this.overlay.mapLayers.length; i++) {
		var lyrParam = [
			'{'
			,'name: "' + this.overlay.mapLayers[i].name + '",'
			,'location: [ ' + center.lon + ',' + center.lat + ' ],'
			,'scale: 17000000'
			,'}'
		].join(' ');
		lyrs.push(lyrParam)
	}
	var lyrsStr = lyrs.join(',\n');
	
	var conf = [
		'service: "' + this.url + '"'
		,',layers: [ '
		,lyrsStr
		,']'
	].join('\n');
	return conf;
}
function lines(arr) {
	return arr.join('\n');
}
var DPI = 72;
var IN_PER_M = 39.3700787;

function bbox( centreLL, scale ) {
	var centre = toWM( centreLL );
	var size = extentSize(500, scale);
	var size2 = size / 2;
	var bbox = [ centre[0] - size2, centre[1] - size2, centre[0] + size2, centre[1] + size2 ];
	var bboxStr = bbox[0] + ',' + bbox[1] + ',' + bbox[2] + ',' + bbox[3];
	return bboxStr;
}

function extentSize(imageSize, scaleDenom) {
	var size = scaleDenom * imageSize / DPI / IN_PER_M;
	return size;
}
function toWM(pt) {
	if (Math.abs(pt[0]) > 300) return pt;
	return degreesToWM(pt);
}
function degreesToWM(lonlat) {
        var x = lonlat[0] * 20037508.34 / 180;
        var y = 20037508.34 / 180 * Math.log(Math.tan((90 + lonlat[1]) * Math.PI / 360)) / (Math.PI / 180);
        return [x, y]
}
	
})();