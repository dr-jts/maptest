(function() {

Overlay = function(map, name, param) {
	this.map = map;
	this.name = name;
	this.url = param.url;
	this.metadataURL = param.metadataURL;
	this.param = param.param;
	this.mapLayers = [];
	this.isTiled = false;
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
   		
	var $ctl = $('<div class="overlay-controls">').appendTo(this.$root);
	$('<button class="btn-redraw">').appendTo($ctl)
		.click(function() { self.reload(); });
   	$('<label class="overlay-tiled-title">').text(' Tiled ').appendTo($ctl);
	$('<input type="checkbox" class="checkbox-single"/>').appendTo($ctl)
		.attr('name','foo')
		.prop('checked', self.isTiled)
		.click(function () { 
			self.isTiled = $(this).is(':checked');
			self.clearTime();
			self.reload();
		} );
	$('<button class="">').appendTo($ctl)
		.text('+')
		.attr('title','Add layers from WMS')
       	.click(function () { self.showWMSLayers();	} );
	$('<button class="btn-query">').appendTo($ctl)
		.text('?')
		.attr('title','Query Overlay status')
       	.click(function () { self.showGetMapResponse();	} );
	$('<button class="">').appendTo($ctl)
		.text('Proof')
		.attr('title','Create Proof Sheet page')
       	.click(function () { self.createProof(); } );

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
	
	$div.on('mouseenter', function() {	$tools.show();	});
	$div.on('mouseleave', function() {	$tools.hide();	});
	
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
			$tools.hide();
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
			$tools.hide();
		});
	var $chk = $('<input type="checkbox" class="cb-layer-vis"/>')
            	.attr('title', 'Change layer visibility')
            	.prop('checked', lyr.visibility)
            	.click(function () { 
	            	var isVisible = $(this).is(':checked');
	            	lyr.visibility = isVisible;
	            	self.updateMapLayer(lyr);
	            	self.clearTime();
            	} );
	var $name = $('<label/>')
		.append($chk)
		.append( layerSpec(lyr) )
		.addClass('layer-title')
		.attr('title', layerTitle(lyr))
		/*
		.click(function() {
			$('#maplayers').find('.title-selected').removeClass('title-selected'); 
			$(this).toggleClass('title-selected'); })
		//.dblclick(function() { self.loadLayer(lyr.name); })
		*/
		.appendTo($div);
		
	var urlLegend = this.url + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=getlegendgraphic&FORMAT=image/png&layer=" + lyr.name;
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

Overlay.prototype.showGetMapResponse = function() {
	showURL(this.getMapURL());
	$.ajax(this.getMapURL(),
		{ 	type: 'GET',
    		dataType: 'text',
    		error: ajaxError
			 }
	).done(callbackGetMapResponse);			
	
	function callbackGetMapResponse(data, textStatus, jqXHR) {
		var isImage = jqXHR.getResponseHeader('Content-Type').substr(0, 5) == 'image';
		var dispStr = isImage ? jqXHR.getResponseHeader('Content-Type') : data;
		showStatus(dispStr);
	}
	function ajaxError(jqXHR, textStatus) {
		showStatus(textStatus +": " + jqXHR.status);
	}
}	
function showStatus(msg) {
		MapTest.show('.map-status-panel');
		$('#map-status').text(msg);
}
function showURL(url) {
		showStatus('Requesting...');
		$('#map-status-url-href').attr('href', url);
		$('#map-status-url').html(formatUrl(url));
}
function formatUrl(url) {
	var url2 = url
				.replace(/&/g, '<br>&')
				.replace(/\?/g, '<br>?');
	return url2;
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

Overlay.prototype.findOverlay = function() {
	return this.mapOverlay;
	//return this.map.getLayer(this.url);
	//return this.map.getLayersByName(this.name)[0];
}
Overlay.prototype.remove = function() {
	var overlay = this.findOverlay();
	if (overlay) this.map.removeLayer(overlay);
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

Overlay.prototype.formatWMSLayers = function( layers, $lyrs ) {
	var self = this;
	for (var i = 0; i < layers.length; i++) {
		$('<div>').addClass('wms-layer')
			.text(layers[i])
			.appendTo( $lyrs )
			.click( function( lyr) {
				//$(this).toggleClass('wms-layer-selected')
				self.addLayers( [ $(this).text() ] );
			})
	}
}
MapTest.currentOverlay = null;

Overlay.prototype.showWMSLayers = function(  ) {
	var self = this;
	MapTest.show('.wms-panel');

	$('.wms-layers').empty().addClass('config-wait').show();

	var prom = maptest.wmsLayers( this.url )
	prom.done(function( layers ) {
		$('.wms-layers').removeClass('config-wait');
		self.formatWMSLayers( layers, $('.wms-layers') );
	});
}
Overlay.prototype.wmsLayersAdd = function () {
	var lyrsConfig = wmsLayersConfigForSelected();
	wmsLayersUnselect();
	var conf = $('#config-text').val();
	conf += '\n';
	conf += lyrsConfig;
	$('#config-text').val(conf);

}

})();
