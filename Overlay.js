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
Overlay.prototype.urlParam = function()
{
	var param = '?host=' + this.url;
	var lyrName = $.map(this.mapLayers, function(lyr) {
		return lyr.name;
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
	
   	var $add = $('<div class="overlay-controls">').appendTo($overlayBlock); 
   	var $name = $('<input type="text" size=25>')
   		.attr('id', 'text_layer_name')
   		.attr('title', 'Enter layer names, comma-separated')
   		.appendTo($add);
   	$('<input type="button">')
   		.attr('value', 'Add')
   		.click(function() {
   			var txt = $name.val();
   			var lyrs = txt.split(',');
   			self.addLayers( lyrs );
   			$name.val('');
   		})
   		.appendTo($add);
   		
	var $ctl = $('<div class="overlay-controls">').appendTo(this.$root);
	$('<input type="button">')
		.addClass( 'btn-redraw' )
		.click(function() { self.reload(); })
		.appendTo($ctl);
	$('<div class="overlay-time">')
   		.attr('id', 'overlay-time-last')
		.text('0').appendTo($ctl);
	$('<span class="xx">').text(' s  ').appendTo($ctl);
   	$('<span class="overlay-tiled-title">').text(' Tiled: ').appendTo($ctl);
	$('<input type="checkbox" class="checkbox-single"/>')
            	.prop('checked', self.isTiled)
            	.click(function () { 
	            	self.isTiled = $(this).is(':checked');
	            	self.clearTime();
	            	self.reload();
            	} )
            	.appendTo($ctl);
	$('<input type="button" />')
            	.prop('value', '?')
            	.click(function () { 
	            	self.showGetMapResponse();
            	} )
            	.appendTo($ctl);

	var $stat = $('<div class="overlay-stats">').appendTo(this.$root);
	var $time = $('<div>').appendTo($stat);
	$('<span class="xx">').text(' N ').appendTo($time);
	$('<div class="overlay-time overlay-count">')
   		.attr('id', 'overlay-time-count')
		.text('0').appendTo($time);
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
	var $date = $('<div>').appendTo($stat);
	$('<span class="xx">')
	   	.attr('id', 'overlay-timestamp')
		.text('  ').appendTo($date);
		
	var $lyrctl = $('<div class="layer-controls">').appendTo(this.$root);
	$('<span class="text-button">').text('All').appendTo($lyrctl)
		.click(function ( event ) { 
			self.setAllMapLayerVisibility(true);
			var $par = $(this).parents('.overlay');
			$par.find('.cb-layer-vis').prop('checked', true);
		} );
    $('<span class="text-button">').text('None').appendTo($lyrctl)
		.click(function () { 
			self.setAllMapLayerVisibility(false);
			var $par = $(this).parents('.overlay');
			$par.find('.cb-layer-vis').prop('checked', false);
		} );
    $('<span class="text-button">').text('Legend').appendTo($lyrctl)
		.click(function () { 
				var $par = $(this).parents('.overlay');
				$par.find('.layer-legend').toggle();
		} );

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
Overlay.prototype.removeMapLayer = function (lyr)
{		
	for (var i = 0; i < this.mapLayers.length; i++) {
		if (this.mapLayers[i] == lyr) {
			this.mapLayers.splice(i, 1);
		}
	}
	this.updateMap();
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
}
Overlay.prototype.addSingleLayer = function (name)
{
	var nameStyle = name.split('*');
	var name = nameStyle[0];
	var style = nameStyle.length > 1 ? nameStyle[1] : ''; 
	var lyr = {
			name: name,
			style: style,
			visibility: false
	};
	this.mapLayers.push(lyr);
	this.addMapLayerUI(lyr);
}
function layerSpec(lyr) {
	var spec = lyr.name;
	if (lyr.style.length > 0) {
		spec += '*' + lyr.style;
	}
	return spec;
}
Overlay.prototype.addMapLayerUI = function (lyr)
{
	var self = this;
	var $div = $('<div>').addClass('gsa-maplayer').appendTo(this.$root);
	$('<span>').addClass('gsa-maplayer-remove').text('x')
		.click(function() {
			self.removeMapLayer(lyr);
			$div.remove();
		})
		.appendTo($div);
	$('<input type="checkbox" class="cb-layer-vis"/>')
            	.attr('title', 'Change layer visibility')
            	.prop('checked', lyr.visibility)
            	.click(function () { 
	            	var isVisible = $(this).is(':checked');
	            	lyr.visibility = isVisible;
	            	self.updateMapLayer(lyr);
	            	self.clearTime();
            	} )
            	.appendTo($div);
	$('<span/>').text( layerSpec(lyr) )
		.addClass('gsa-maplayer-title') //.addClass('gsa-link')
		.click(function() {
			$('#maplayers').find('.title-selected').removeClass('title-selected'); 
			$(this).toggleClass('title-selected'); })
		//.dblclick(function() { self.loadLayer(lyr.name); })
		.appendTo($div);
		
	var urlLegend = this.url + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=getlegendgraphic&FORMAT=image/png&layer=" + lyr.name;
	$divLegend = $('<div>').addClass('layer-legend').appendTo( $div );
	$divLegend.append( $('<img>').attr('src', urlLegend));
	//this.$root.append($div);
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



})();
