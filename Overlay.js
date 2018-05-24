(function() {

Overlay = function(map, name, param) {
	this.map = map;
	this.name = name;
	this.url = param.url;
	this.metadataURL = param.metadataURL;
	this.param = param.param;
	this.mapLayers = [];
	this.isTiled = param.tile ? true : false;
	this.type = 'wms';
	if (isArcGIS(this.url))
		this.type = 'arcgis';
	this.clearTime();
}
function isArcGIS(url) {
	return url.indexOf('MapServer/export') > 0
} 
	
Overlay.prototype.create = function() { 
	this.remove();
	this.mapOverlay = OVERLAY_CREATOR[this.type](this);
	this.map.addLayers([ this.mapOverlay ]); 
	var self = this;
	this.mapOverlay.events.register('loadstart', this, function () {
		self.initMapTimer();
	});
}

Overlay.prototype.onChange = function( fOnChange ) {
	this.onChange = fOnChange;
}
Overlay.prototype.changed = function( ) {
	this.onChange(this);
}
// Create Overlay Permalink params
Overlay.prototype.urlParam = function()
{
	var param = '?host=' + this.url;
	var lyrName = $.map(this.mapLayers, function(lyr) {
		return layerSpec(lyr, true);
		/*
		var name = lyr.name;
		if (lyr.visibility) name += '+';
		return name;
		*/
	});
	if (this.isTiled) {
		param += '&tile=t';
	}
	param += '&lyr=' + lyrName.join(",");
	return param;
}
Overlay.prototype.clearTime = function()
{
	this.lastTime = 0;
	this.numRequests = 0;
	this.totalTime = 0;
	this.minTime = 0;
	this.maxTime = 0;
}
Overlay.prototype.updateMapTime = function(mapLoadSec)
{
	this.lastTime = mapLoadSec;
	this.totalTime += this.lastTime;
	if (this.numRequests <= 0 || this.lastTime > this.maxTime) this.maxTime = this.lastTime;
	if (this.numRequests <= 0 || this.lastTime < this.minTime) this.minTime = this.lastTime;
	this.numRequests += 1;
}

Overlay.prototype.tooltip = function() { 
	return this.type.toUpperCase() + ': ' + this.url;
}
Overlay.prototype.createOverlayUI = function() {
	var self = this;
	var $overlayBlock = $('<div>').appendTo($('#overlays'));
	this.$root = $('<div class="overlay">').appendTo($overlayBlock);
	
	//----  overlay name
	var $title = $('<div class="overlay-name">').appendTo(this.$root);
	$('<input type="checkbox" >')
            	.prop('checked', true )
            	.click(function () { 
	            	self.findOverlay().setVisibility( $(this).is(':checked') );
	            	//self.reload();
            	} )
            	.appendTo($title);
	$('<a>').text(this.name)
		.attr('title', this.tooltip())
		.attr('href', this.metadataURL)
		.attr('target', '_blank')
		.appendTo($title);

//----- overlay controls 
	var $ctl = $('<div class="overlay-controls">').appendTo(this.$root);
	$('<div class="btn-overlay-controls-toggle">').appendTo($ctl)
		.attr('title','Additional overlay parameters')
		.click(function () { 
			$overlayBlock.find('.overlay-controls-ex').toggle();
		} );
	$('<button class="btn-redraw">').appendTo($ctl)
		.attr('title','Reload overlay')
		.click(function() { self.reload(); });
   	$('<label class="overlay-tiled-title">').text(' Tile ').appendTo($ctl);
	$('<input type="checkbox" class="checkbox-single"/>').appendTo($ctl)
		.attr('name','foo')
		.prop('checked', self.isTiled)
		.click(function () { 
			self.isTiled = $(this).is(':checked');
			self.clearTime();
			self.reload();
		} );
	$('<button class="btn-wms-layer-add">').appendTo($ctl)
		.text('+')
		.attr('title','Add layers from WMS')
       	.click(function () { self.showWMSLayers();	} );
	$('<button class="btn-query">').appendTo($ctl)
		.text('?')
		.attr('title','Query Overlay status')
       	.click(function () { self.showMapStatus();	} );
	$('<button class="">').appendTo($ctl)
		.text('Proof')
		.attr('title','Create Proof Sheet page')
       	.click(function () { self.createProof(); } );

	//---- overlay params
	var $divparam = $('<div class="overlay-controls-ex">').appendTo(this.$root);
	$('<div>').appendTo($divparam)
		.addClass('label')
		.text('Request Parameter');
   	this.$extraParam = $('<textarea type="text" size=35>')
   		.attr('id', 'overlay-param')
   		.attr('title', 'Enter request parameter: name=value')
   		.appendTo($divparam);

	//------ overlay stats
	var $stat = $('<div class="overlay-stats">').appendTo(this.$root);
	var $date = $('<div>').appendTo($stat);
	$('<div class="overlay-time">').appendTo($date)
   		.attr('id', 'overlay-time-last')
		.text('0');
	$('<span class="xx">').text(' s  ').appendTo($date);
	$('<span class="overlay-timestamp">').appendTo($date)
	   	.attr('id', 'overlay-timestamp')
		.text('  ');
	var $time = $('<div>').appendTo($stat);
	$('<span class="xx">').text(' Avg ').appendTo($time);
	$('<div class="overlay-time overlay-time-small">')
   		.attr('id', 'overlay-time-avg')
		.text('0').appendTo($time);
	$('<span class="xx">').text(' Min ').appendTo($time);
	$('<div class="overlay-time overlay-time-small">')
   		.attr('id', 'overlay-time-min')
		.text('0').appendTo($time);
	$('<span class="xx">').text(' Max ').appendTo($time);
	$('<div class="overlay-time overlay-time-small">')
   		.attr('id', 'overlay-time-max')
		.text('0').appendTo($time);
	$('<span class="xx">').text(' N ').appendTo($time);
	$('<div class="overlay-time overlay-count">')
   		.attr('id', 'overlay-time-count')
		.text('0').appendTo($time);

	//------ layer add control
   	var $add = $('<div class="layer-controls">').appendTo($overlayBlock); 
   	var $name = $('<input type="text" size=25>')
   		.attr('id', 'text_layer_name')
   		.attr('title', 'Enter layer names, comma-separated')
   		.appendTo($add);
   	$('<button>').addClass('btn-layer-add').appendTo($add)
   		.text('+')
    	.attr('title', 'Add layer')
  		.click(function() {
   			var txt = $name.val();
   			var lyrs = txt.split(',');
   			self.addLayers( lyrs );
   			$name.val('');
   		});
 
		
	var $lyrctl = $('<div class="layer-controls">').appendTo(this.$root);
	$('<button>').text('All').appendTo($lyrctl)
		.attr('title', 'Make all layers visible')
		.click(function ( event ) { 
			self.setAllMapLayerVisibility(true);
			var $par = $(this).parents('.overlay');
			$par.find('.cb-layer-vis').prop('checked', true);
		} );
    $('<button>').text('None').appendTo($lyrctl)
		.attr('title', 'Make all layers non-visibile')
		.click(function () { 
			self.setAllMapLayerVisibility(false);
			var $par = $(this).parents('.overlay');
			$par.find('.cb-layer-vis').prop('checked', false);
		} );
    $('<button>').text('Legend').appendTo($lyrctl)
		.attr('title', 'Show / Hide Legends')
		.click(function () { 
				var $par = $(this).parents('.overlay');
				var $legendDivs = $par.find('.layer-legend');
				var showState = ! $legendDivs.first().is(':visible');
				$legendDivs.toggle(showState);
		} );
	this.$layers = $('<div>').appendTo(this.$root);
}
Overlay.prototype.createProof = function() {
	new WMSProof( this );
}
Overlay.prototype.displayTime = function(time)
{
	var $mapSec = this.$root.find('#overlay-time-last');
	$mapSec.text(time.toFixed(2));
}
Overlay.prototype.displayTimeStats = function()
{
	this.displayTime(this.lastTime);
	this.$root.find('#overlay-time-count').text(this.numRequests);
	this.$root.find('#overlay-time-max').text(this.maxTime.toFixed(2));
	this.$root.find('#overlay-time-min').text(this.minTime.toFixed(2));
	var avg = this.numRequests == 0 ? 0 : this.totalTime / this.numRequests;
	this.$root.find('#overlay-time-avg').text( avg.toFixed(2) );
	this.$root.find('#overlay-timestamp').text( (new Date()).toLocaleString() );
}
Overlay.prototype.addMapLayerUI = function (lyr)
{
	var self = this;
	var $div = $('<div>').addClass('layer-div').appendTo(this.$layers);
	
	//$div.on('mouseenter', function() {	$tools.show();	});
	//$div.on('mouseleave', function() {	$tools.hide();	});
	
	var $chk = $('<input type="checkbox" class="cb-layer-vis"/>')
				.appendTo($div)
            	.attr('title', 'Change layer visibility')
            	.prop('checked', lyr.visibility)
            	.click(function () { 
	            	var isVisible = $(this).is(':checked');
	            	lyr.visibility = isVisible;
	            	self.updateMapLayer(lyr);
	            	self.clearTime();
            	} );
	var $name = $('<label/>').appendTo($div)
		.addClass('layer-title')
		.attr('title', layerTitle(lyr))
		.append( layerSpec(lyr) )
		.click( function() {
			var show = ! $tools.is(':visible');
			$('.layer-tools').hide();
			if (show) $tools.toggle();
		});

	var $tools = $('<div class="layer-tools">').appendTo($div);
	$('<span>').addClass('layer-remove layer-tool').appendTo($tools)
		.text('x')
		.attr('title', 'Remove Layer')
		.click(function() {
			self.removeLayer(lyr);
			$div.remove();
		});
	$('<span>').addClass('layer-up layer-tool').appendTo( $tools )
		.text('^')
		.attr('title', 'Move Layer up')
		.click(function() {
			self.moveLayer(lyr, -1);
			var $prev = $div.prev();
			if (! $prev.length) return;
			$div.detach();
			$prev.before($div);
			//$tools.hide();
		});
	$('<span>').addClass('layer-down layer-tool').appendTo( $tools )
		.text('V')
		.attr('title', 'Move Layer down')
		.click(function() {
			self.moveLayer(lyr, 1);
			var $nxt = $div.next();
			if (! $nxt.length) return;
			$div.detach();
			$nxt.after($div);
			//$tools.hide();
		});
		
	var urlLegend = UrlParams.addParams(this.url, 
		"SERVICE=WMS&VERSION=1.1.1&REQUEST=getlegendgraphic&FORMAT=image/png&layer=" + lyr.name);
	if (lyr.style) urlLegend += "&STYLE=" + lyr.style;
	
	$divLegend = $('<div>').addClass('layer-legend').appendTo( $div );
	$divLegend.append( $(
		'<img>').attr('src', urlLegend)
			// if legend request fails probably means layer is missing or has bad configuration
			.on('error', function() {
				$name.css('color', 'red')
			})
		);
}

Overlay.prototype.showMapStatus = function() {
	var wmsURL = this.getMapURL();
	var wfsURL = this.getFeatureURL();
	MapTest.showMapStatus(wmsURL, wfsURL);
	//MapTest.state.currOverlay = this;

	MapTest.showStatus('Requesting...');
	$.ajax(wmsURL,
		{ 	type: 'GET',
    		dataType: 'text',
    		error: ajaxError
			 }
	).done(callbackGetMap);			
	
	function callbackGetMap(data, textStatus, jqXHR) {
		var isImage = jqXHR.getResponseHeader('Content-Type').substr(0, 5) == 'image';
		var dispStr = isImage ? jqXHR.getResponseHeader('Content-Type') : data;
		MapTest.showStatus(dispStr);
	}
	function ajaxError(jqXHR, textStatus) {
		MapTest.showStatus(textStatus +": " + jqXHR.status);
	}
}	

Overlay.prototype.reload = function ()
{
	this.create();
	this.updateMap();
}
Overlay.prototype.getMapURL = function () {
	var overlay = this.findOverlay();
	return overlay.getURL(overlay.getTileBounds(new OpenLayers.Pixel(0,0)));
}
Overlay.prototype.getFeatureURL = function () {
	var overlay = this.findOverlay();
	//var lyr = overlay.params.LAYERS;
	var lyr = this.visibleMapLayer();
	return overlay.url + '?service=wfs&version=2.0.0&request=GetFeature&typeNames='+lyr+'&count=10&srsName=EPSG:4326';
}
Overlay.prototype.findOverlay = function() {
	return this.mapOverlay;
}
Overlay.prototype.remove = function() {
	var overlay = this.findOverlay();
	if (overlay) this.map.removeLayer(overlay);
}
Overlay.prototype.hasLayer = function (lyrName)
{		
	for (var i = 0; i < this.mapLayers.length; i++) {
		if (this.mapLayers[i].name == lyrName) {
			return true;
		}
	}
	return false;
}
Overlay.prototype.removeLayer = function (lyr)
{		
	for (var i = 0; i < this.mapLayers.length; i++) {
		if (this.mapLayers[i] == lyr) {
			this.mapLayers.splice(i, 1);
		}
	}
	this.updateMap();
	this.changed();
}
Overlay.prototype.moveLayer = function (lyr, direction)
{	
	var i = this.layerIndex(lyr);
	if ( (direction < 0 && i == 0) || (direction > 0 && i + 1 >= this.mapLayers.length) ) return;
	var ii = i + direction;
	var lyrSib = this.mapLayers[ii];
	this.mapLayers[ii] = lyr;
	this.mapLayers[i] = lyrSib;
	this.updateMap();
}
Overlay.prototype.layerIndex = function(lyr) {
	for (var i = 0; i < this.mapLayers.length; i++) {
		if (this.mapLayers[i] == lyr) {
			return i;
		}
	}
	return null;
}
Overlay.prototype.updateMapLayer = function (lyr)
{		
	this.updateMap();
}
Overlay.prototype.layersParam = function()
{
	var layers = this.visibleMapLayers(this.mapLayers);
	if (this.type == 'arcgis')
		layers = 'show:' + layers;
	return layers;
}
Overlay.prototype.extraParam = function()
{
	var paramStr = this.$extraParam.val();
	return parseParam( paramStr );
}
function parseParam(paramStr) {
	var param = {};
	if (paramStr) {
		var eqIndex = paramStr.indexOf('=');
		var name = paramStr.substr(0, eqIndex);
		var val = paramStr.substr(eqIndex+1);
		param[ name ] = val;
	}
	return param;
}
Overlay.prototype.updateMap = function (map)
{
	var overlay = this.findOverlay();
	var layersList = this.visibleMapLayers(this.mapLayers);
	var hasLayers = layersList.length > 0;
	
	if (hasLayers) {
		overlay.mergeNewParams({ 
			layers: this.layersParam(),
			styles: this.visibleStyles(this.mapLayers)
			 });
		overlay.mergeNewParams( this.extraParam() );
		overlay.setVisibility(true);
		overlay.redraw({ force:true });
	}
	else {
		overlay.setVisibility(false);		
	}
	// DEBUGGING
	//console.log(this.getMapURL());
	//this.initMapTimer();
}

Overlay.prototype.addLayers = function (names)
{
	for (var i = 0; i < names.length; i++) {
		this.addSingleLayer(names[i]);
	}
	this.create();
	this.updateMap();
	this.changed();
}
Overlay.prototype.addSingleLayer = function (name)
{
	var nameStyle = name.split('*');
	// parse name
	var name = nameStyle[0];
	
	var vis = false;
	if ( name.indexOf('+') >= 0 ) {
		vis = true;
	}
	// clean name
	name = name.replace('+', '');
	// parse style
	var style = nameStyle.length > 1 ? nameStyle[1] : ''; 
	
	var lyr = {
			name: name,
			style: style,
			visibility: vis
	};
	this.mapLayers.push(lyr);
	this.addMapLayerUI(lyr);
}
function layerSpec(lyr, showVis) {
	var spec = lyr.name;
	if (showVis) {
		spec += lyr.visibility ? '+' : '';
	}
	if (lyr.style.length > 0) {
		spec += '*' + lyr.style;
	}
	return spec;
}
function layerTitle(lyr) {
	return "Name: " + lyr.name 
		+ "\nStyle: " + (lyr.style.length > 0 ? lyr.style : '<default>');
}

Overlay.prototype.isLoading = function() {
	var overlay = this.findOverlay();
	return overlay.loading === true;
}
//----------------------------------------
Overlay.prototype.initMapTimer = function() {
	if (this.mapRequestTimer != null) return;
	this.displayTimeStats();
	
	var self = this;
	var mapStartTime = (new Date()).getTime();
	this.mapRequestTimer = setInterval(function() {
		var mapLoadDuration = (new Date()).getTime() - mapStartTime;
		var mapLoadSec = mapLoadDuration / 1000;
		if (self.isLoading()) {
			//$('#map-spinner').show();
			self.displayTime(mapLoadSec);
		}
		else {
			//$('#map-spinner').hide();
			clearInterval(self.mapRequestTimer);
			self.mapRequestTimer = null;
			self.updateMapTime(mapLoadSec);
			self.displayTimeStats();
			MapTest.log(mapLoadSec + ' s :  ' + self.getMapURL())
		}
	}, 200);	
}
Overlay.prototype.setAllMapLayerVisibility = function(isVisible)
{
	for (var i = 0; i < this.mapLayers.length; i++) {
		var lyr = this.mapLayers[i]
		lyr.visibility = isVisible;
	}
	this.updateMap();
}
//----------------------------------------
Overlay.prototype.visibleMapLayer = function()
{
	for (var i = 0; i < this.mapLayers.length; i++) {
		var lyr = this.mapLayers[i]
		if (lyr.visibility) {
			return lyr.name;
		}
	}
	return null;
}
Overlay.prototype.visibleMapLayers = function(mapLyrs)
{
	var names = [];
	// use for loop rather than map since not all elements may be used
	// iterate in reverse, to reflect ordering of map layer list UI
	for (var i = mapLyrs.length-1; i >= 0; i--) {
		var lyr = mapLyrs[i]
		if (lyr.visibility) {
			names.push(lyr.name);
		}
	}
	return names.join(",");
}
Overlay.prototype.visibleStyles = function(mapLyrs)
{
	var names = [];
	// use for loop rather than map since not all elements may be used
	// iterate in reverse, to reflect ordering of map layer list UI
	for (var i = mapLyrs.length-1; i >= 0; i--) {
		var lyr = mapLyrs[i]
		if (lyr.visibility) {
			names.push(lyr.style);
		}
	}
	return names.join(",");
}
Overlay.prototype.configuration = function(isVisibleOnly) {
	config = this.url + '\n';
	if (this.isTiled) {
		config += 'tile: true\n';
	}
	$(this.mapLayers).each(function(i, lyr) {
		if (isVisibleOnly && ! lyr.visibility)
			return;
		config += layerSpec(lyr) + '\n';
	});
	return config;
}
var OVERLAY_CREATOR = {
	wms: function(overlay) {
		var params = {
			layers: "",
			transparent: true
		};
		$.extend(params, overlay.param);
		return new OpenLayers.Layer.WMS(overlay.name, overlay.url, params, options(overlay));
	},
	arcgis: function(overlay) {
        var params = {
        	transparent: true,
            format: "png"
        };
        var olLayer = new OpenLayers.Layer.ArcGIS93Rest( overlay.name, overlay.url, params, options(overlay) );
        //olLayer.removeBackBufferDelay = BACK_BUFFER_DELAY;
        return olLayer;		
	}
};
function options(overlay) {
	return 	{
		visibility: false,  // Is layer displayed when loaded? 
		singleTile: ! overlay.isTiled,
		opacity: 0.7,
		visibleInLayerSwitcher: false
	};
}
Overlay.prototype.showWMSLayers = function(  ) {
	var self = this;
	MapTest.show('.wms-panel');
	$('.wms-layers').removeClass('config-wait');
	$('#wms-layer-filter').val('');
	$('#btn-wms-layer-addall').off('click');
	$('#btn-wms-layer-addall').click( function() {
		self.addLayers( self.hostLayers );
		$(".wms-layer").addClass('wms-layer-in-map');
	});
	$('#btn-wms-layer-reload').off('click');
	$('#btn-wms-layer-reload').click( function() {
		self.loadWMSLayers(true);
	});

	$('#wms-host-url').text(this.url);

	this.loadWMSLayers();
}
Overlay.prototype.loadWMSLayers = function(isReload) {
	// force reload
	if (isReload) 
		this.hostLayers = null;
	// don't reload unless needed
	if (this.hostLayers) {
		this.formatWMSLayers();
		return;
	}

	var self = this;
	$('.wms-layers').empty().addClass('config-wait').show();
	var prom = maptest.wmsLayers( this.url )
	prom.done(function( layers ) {
		self.hostLayers = layers;
		$('.wms-layers').removeClass('config-wait');
		self.formatWMSLayers( self.hostLayers, $('.wms-layers') );
	});
}
Overlay.prototype.formatWMSLayers = function( layers, $lyrs ) {
	var self = this;
	var layers = self.hostLayers;
	var $lyrs =  $('.wms-layers');
	$lyrs.empty();
	for (var i = 0; i < layers.length; i++) {
		if (layers[i])
		var $lyr = $('<div>').addClass('wms-layer')
			.text(layers[i])
			.attr('title', 'Click to add layer to layer list.  Ctl-click to add and make visible.')
			.appendTo( $lyrs )
			.click( function( e ) {
				//$(this).toggleClass('wms-layer-selected')
				var lyrName = $(this).text();
				if (e.ctrlKey) {
					lyrName += '+';
				}
				self.addLayers( [ lyrName ] );
				$(this).addClass('wms-layer-in-map');
			})
		if (self.hasLayer(layers[i])) {
			$lyr.addClass('wms-layer-in-map');
		}
	}
}

})();
