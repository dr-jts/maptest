CRS = {};
CRS.PROJ_GEO = new OpenLayers.Projection( "EPSG:4326" );
CRS.PROJ_WEBMERC = new OpenLayers.Projection( "EPSG:3857" );
	
(function() {
	
	// Web Mercator
Proj4js.defs["EPSG:3857"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";


MapTest = function(mapDiv) {
	this.overlays = [];
	this.controls = {};
	this.initMap(mapDiv);
};

var log = [];

MapTest.log = function(msg) {
	log.push(msg);
}

MapTest.getLog = function(sep) {
	return log.join(sep + '\n');
}

MapTest.constants = {};
MapTest.constants.META_URL = 'meta-url';
MapTest.constants.PARAM = 'param';

MapTest.prototype.initMap = function(mapDiv) {
	var self = this;
	OpenLayers.DOTS_PER_INCH = 90;
    this.map = new OpenLayers.Map(mapDiv, {        
            theme: null,   // disable OL auto-loading of CSS
    		div: mapDiv, 
			numZoomLevels: 24,
    		projection: 'EPSG:3857',
    		displayProjection: 'EPSG:3857'
    		//controls: []
	});
    //map.addControl(new OpenLayers.Control.LayerSwitcher());
    this.map.removeControl(this.map.getControlsByClass(OpenLayers.Control.ArgParser)[0]);
    this.map.addControl(new OpenLayers.Control.Navigation({
            //id: 'NavigationControl',
            title: 'Zoom / Pan',
            zoomWheelEnabled: true,
            dragPanOptions: {
                enableKinetic: true
            },
            mouseWheelOptions: {
            	interval: 200, maxDelta: 1, cumulative: false
            }
        }));
	var osmLayer = new OpenLayers.Layer.OSM('OSM', null, { projection: 'EPSG:3857' });
    this.map.addLayers([
    	osmLayer,
		new OpenLayers.Layer.OSM("OpenCycleMap",
		  ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
		   "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
		   "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]),
    	new OpenLayers.Layer.TMS('White', 'img/tile-256-white.png',
	        { 
	            getURL: function() { return this.url; }
	        } ),
    	new OpenLayers.Layer.TMS('ESRI Topo', "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg",
	        { 
	            getURL: getTMSUrl
	        } ),
    	new OpenLayers.Layer.TMS('ESRI Streets', "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.jpg",
	        { 
	            getURL: getTMSUrl
	        } ),
    	new OpenLayers.Layer.TMS('ESRI Imagery', "http://services.arcgisonline.com/ArcGIS/rest/services/World_imagery/MapServer/tile/{z}/{y}/{x}.jpg",
	        { 
	            getURL: getTMSUrl
	        } ),
		new OpenLayers.Layer.ArcGISCache('DataBC', 'http://maps.gov.bc.ca/arcserver/rest/services/Province/web_mercator_cache/MapServer', 
			{
	            resolutions: [9783.9400003175, 4891.969998835831, 2445.9849999470835, 1222.9925001058336, 611.4962500529168, 305.74812489416644, 152.8740625, 76.4370312632292, 38.2185156316146, 19.10925781316146, 9.554628905257811, 4.7773144526289055, 2.3886572265790367, 1.1943286131572264],
	            tileSize: new OpenLayers.Size(256, 256),
	            tileOrigin: new OpenLayers.LonLat(-16427500 , 9550000),
	            maxExtent: new OpenLayers.Bounds( [ -19948632.67243053, 1581977.5003146366, -7105731.9866291545, 12472249.280858198 ] ),
	            projection: 'EPSG:3857',
	            opacity: 0.5
	        } )    
 	    ]);
	this.map.addControl(new OpenLayers.Control.LayerSwitcher());
	this.map.addControl(new OpenLayers.Control.ScaleEx(null, { geodesic: true, 
			template: " Zoom: ${zoom} -- Scale Nom: ${scaleDenomPreciseNom} -- Geo: ${scaleDenomPreciseGeo} " } ));
	this.map.addControl(new OpenLayers.Control.MousePosition({ displayProjection: 'EPSG:4326' })); 	    
/*
    var road = new OpenLayers.Layer.Bing({
        name: "Road",
        type: "Road"
    });
    var hybrid = new OpenLayers.Layer.Bing({
        name: "Hybrid",
        type: "AerialWithLabels"
    });
    var aerial = new OpenLayers.Layer.Bing({
        name: "Aerial",
        type: "Aerial"
    });
    this.map.addLayers([road, hybrid, aerial]);
*/    
    
    //map.setCenter(new OpenLayers.LonLat(-126, 54), 3);
    
    var bcCentre = new OpenLayers.Geometry.Point(-126, 54.5)
        .transform('EPSG:4326', 'EPSG:3857');
    this.map.setCenter(bcCentre.getBounds().getCenterLonLat(), 5);
    
    this.map.events.register('movestart', this.map, 
    	function() { 
    		self.clearTime();
    	});
    this.map.events.register('move', this.map, 
    	function() { 
			self.showExtent();
			self.showLink();
    	});
    this.map.events.register('changelayer', this.map, 
    	function() { 
    		self.showLink();
    	});
    this.showExtent();
	
	function getTMSUrl( bounds ) {
            var res = this.map.getResolution();
            var x = Math.round( ( bounds.left - this.maxExtent.left ) / ( res * this.tileSize.w ) );
            // Here is the OGC Y standard
            //var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h));
            var y = Math.round( ( this.maxExtent.top - bounds.top ) / ( res * this.tileSize.h ) );
            var z = this.map.getZoom();
            var url = this.url;
            // If subdomains were specified choose one at random
            if ( this.domains && this.domains.length > 0 ) {
                var n = this.domains[ Math.random() * 4 | 0 ]; // random tile domain.
                url = url.replace( "{n}", n );
            }
            // Substitute values into the url
            url = url.replace( "{x}", x );
            url = url.replace( "{y}", y );
            url = url.replace( "{z}", z );
            return url;
        }

}
MapTest.prototype.initInfoCtl = function(ov) {
	this.controls.infoCtl = new OpenLayers.Control.WMSGetFeatureInfo({
                url: ov.url,
                title: 'Identify features by clicking',
                //layers: [water],
                queryVisible: true,
				vendorParams: {
					buffer: 10
				},
				eventListeners: {
					getfeatureinfo: function(event) {
						var txt = event.text;
						// abort if no data returned
						if (! txt.includes("<table")) return;
						var pop = new OpenLayers.Popup.FramedCloud(
							"identify", 
							this.map.getLonLatFromPixel(event.xy),
							new OpenLayers.Size(400, 200),
							event.text,
							null,
							true
						);
						pop.autoSize = false;
						this.map.addPopup(pop, true);
					}
				}
           });
    //this.controls.infoCtl.events.register("getfeatureinfo", this, function(e) { this.showInfo(e); } );
	this.map.addControl( this.controls.infoCtl );
	this.controls.infoCtl.activate();
}
MapTest.prototype.showInfo = function(evt) {
	console.log(evt);
	MapTest.show('.map-data-panel');
	$('.data-text').html(evt.text);
}
MapTest.prototype.loadConfig = function(configStr) {
	var lines = configStr.split(/[\n]/);
	var ov;
	var ovParam = {};
	for (var i = 0; i < lines.length; i++) {
		var line = shimTrim(lines[i]);
		if (Lexer.isURL(line)) {
			ovParam = {
				url: line,
				metadataURL: ''
			};
			ov = this.addOverlay(ovParam);
			continue;
		}
		if (Lexer.isTag(MapTest.constants.META_URL, line)) {
			ovParam.metadataURL = Lexer.taggedValue(line);
			continue;
		}
		if (Lexer.isTag(MapTest.constants.PARAM, line)) {
			 var nv = Lexer.taggedParam(line);
			 //if (! ovParam.param) ovParam.param = {};
			 //ovParam.param[nv.name] = nv.value;
			 ovParam.param = $.extend({}, ovParam.param, nv);
			continue;
		}
		if (line.length < 1) continue;
		if (Lexer.isComment(line)) continue;
		loadLayers(ov, line);
	}
	this.showLink();

	function loadLayers(ov, line) {
		var layers = line.split(',');
		ov.addLayers(layers);
	}
}
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
		var line = shimTrim(lines[0]);
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

var Lexer = {
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
		return shimTrim( value );
	},
	taggedParam: function (s) {
		var value = s.slice( s.indexOf(':')+1);
		var neqv = shimTrim( value );
		var nvArr = neqv.split('=');
		var nv = {};
		nv[nvArr[0]] = nvArr[1];
		return nv;
	},
	isComment: function (s) {
		if (s.indexOf('//') == 0) return true;
		return false;
	}
}
function shimTrim(x) {
    return x.replace(/^\s+|\s+$/gm,'');
}


MapTest.prototype.urlParam = function() {
	if (this.overlays.length <= 0) return "";
	var param = this.overlays[0].urlParam();
	param += '&extent=' + this.extentStr();
	return param; 
}
MapTest.prototype.clear = function() {
	for (var i = 0; i < this.overlays.length; i++) {
		this.overlays[i].remove();
	}
	this.overlays = [];
	$('#overlays').empty();
}
MapTest.prototype.clearTime = function() {
	for (var i = 0; i < this.overlays.length; i++) {
		this.overlays[i].clearTime();
		this.overlays[i].displayTimeStats();
	}
}
MapTest.prototype.extentStr = function() {
	var extent = this.map.getExtent();
	extent.transform( CRS.PROJ_WEBMERC, CRS.PROJ_GEO );
	return extent.left.toFixed(6)	 + ','
		+ extent.bottom.toFixed(6) + ','
		+ extent.right.toFixed(6) + ','
		+ extent.top.toFixed(6);
}
MapTest.prototype.showExtent = function() {
	var ext = this.extentStr();
	$('#map-extent').val(ext);
}
MapTest.prototype.showLink = function() {
	$('#map-link').attr('href', maptest.urlParam());
}
MapTest.prototype.zoom = function(extentStr) {
	var extent = shimTrim( extentStr );
	//var extcomma = extent.replace(/\s+/g, ',');
	var bds = OpenLayers.Bounds.fromString(extent);
	bds.transform( CRS.PROJ_GEO, CRS.PROJ_WEBMERC );
	this.map.zoomToExtent(bds);
	this.showExtent();
}
MapTest.prototype.autoRedraw = function(doAuto) {
	var self = this;
	if (doAuto) {
		this.redrawTimer = setInterval(function() {		
			self.redrawMap(true);
		}, 2000);	
		
	}
	else {
		clearInterval(this.redrawTimer);
		this.redrawTimer = null;	
	}
}

MapTest.prototype.addOverlay = function(param) { 
	var self = this;
	var name = extractHost(param.url);
	if (! name) name = "UNKNOWN HOST";
	
	var ov = new Overlay(this.map, name, param);
	ov.createOverlayUI();
	ov.onChange( function() { self.showLink(); } );
	
	this.overlays.push(ov);
	if (this.overlays.length == 1) {
		this.initInfoCtl(this.overlays[0]);
	}
	return ov;
}
function extractHost(url) {
	var rx = /\/\/(.+?)\//;
	var arr = rx.exec(url);
	if (! arr) return null;
	return arr[1]; 	
}
MapTest.prototype.redrawMap = function (onlyIfReady)
{
	for (var i = 0; i < this.overlays.length; i++) {
		var ok = true;
		if (onlyIfReady && this.overlays[i].isLoading() ) ok = false;
		if (ok)
			this.overlays[i].reload();
	}
}

MapTest.prototype.configuration = function (isVisibleOnly)
{
	var config = '';
	for (var i = 0; i < this.overlays.length; i++) {
		config += this.overlays[i].configuration(isVisibleOnly);
		config += '\n';
	}
	return config;
}

//=======================================================

MapTest.prototype.wmsLayers = function (wmsHost)
{
	var url = wmsHost + "?service=wms&version=1.1.1&request=GetCapabilities";
	var layers = [ ];
	var prom = $.get(url, null);
	var p2 = prom.then(function(data) {
		var parser = new OpenLayers.Format.WMSCapabilities();
		var caps = parser.read(data);
		if (! caps.capability) return configLines;
		var lyrs = caps.capability.layers;
		for (var ilyr = 0; ilyr < lyrs.length; ilyr++) {
			var lyr = lyrs[ilyr];
			var name = stripPrefix(lyr.name);
			layers.push( name );

			for (var i = 1; i < lyr.styles.length; i++) {
				layers.push( name + "*" + lyr.styles[i].name );
			}
		}
		return layers;
	});
	return p2;
}
function stripPrefix(name) {
	var full = name;
	var colonLoc = full.indexOf(':');
	var noPref = colonLoc > 0 ? full.substring(colonLoc + 1) : full;
	return noPref;
}




})();
