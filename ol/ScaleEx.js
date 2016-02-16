/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Lang.js
 */

/**
 * Class: OpenLayers.Control.ScaleEx
 * The Scale control displays the current map scale as a ratio (e.g. Scale =
 * 1:1M). By default it is displayed in the lower right corner of the map.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ScaleEx = OpenLayers.Class( OpenLayers.Control, {

    /**
     * Property: element
     * {DOMElement}
     */
    element: null,

    /**
     * APIProperty: geodesic
     * {Boolean} Use geodesic measurement. Default is false. The recommended
     * setting for maps in EPSG:4326 is false, and true EPSG:900913. If set to
     * true, the scale will be calculated based on the horizontal size of the
     * pixel in the center of the map viewport.
     */
    geodesic: false,

    /**
     * APIProperty: template
     * {String} Template string for the scale label.
     * Scale denominator value is substituted for token ${scaleDenom}.
     * Precise Scale denominator value is substituted for token ${scaleDenomPrecise}.
     * Geodesic Scale denominator value is substituted for token ${scaleDenomGeo}.
     * Precise Geodesic Scale denominator value is substituted for token ${scaleDenomPreciseGeo}.
     * Nominal Scale denominator value is substituted for token ${scaleDenomNom}.
     * Precise Nominal Scale denominator value is substituted for token ${scaleDenomPreciseNom}.
     * Zoom level value is substituted for token ${zoom}.
     */
    template: "Scale = 1 : ${scaleDenom}",

    /**
     * APIProperty: title
     * {String} Template string for the scale title.
     * Scale denominator value is substituted for token ${scaleDenom}.
     * Precise Scale denominator value is substituted for token ${scaleDenomPrecise}.
     * Geodesic Scale denominator value is substituted for token ${scaleDenomGeo}.
     * Precise Geodesic Scale denominator value is substituted for token ${scaleDenomPreciseGeo}.
     * Nominal Scale denominator value is substituted for token ${scaleDenomNom}.
     * Precise Nominal Scale denominator value is substituted for token ${scaleDenomPreciseNom}.
     * Zoom level value is substituted for token ${zoom}.
     */
    title: "Zoom: ${zoom}  Scale-Geo = 1 : ${scaleDenomPreciseGeo}  Scale-Nom = 1 : ${scaleDenomPreciseNom}",

    /**
     * Constructor: OpenLayers.Control.Scale
     *
     * Parameters:
     * element - {DOMElement}
     * options - {Object}
     */
    initialize: function ( element, options ) {
        OpenLayers.Control.prototype.initialize.apply( this, [ options ] );
        this.element = OpenLayers.Util.getElement( element );
    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement}
     */
    draw: function () {
        OpenLayers.Control.prototype.draw.apply( this, arguments );
        if ( !this.element ) {
            this.element = document.createElement( "div" );
            this.div.appendChild( this.element );
        }
        this.map.events.register( 'moveend', this, this.updateScale );
        this.updateScale();
        return this.div;
    },

    /**
     * Method: updateScale
     */
    updateScale: function () {
	   	// Geodesic scale
        var units = this.map.getUnits();
        if ( !units ) {
            return;
        }
        var inches = OpenLayers.INCHES_PER_UNIT;
        var scaleGeo = ( this.map.getGeodesicPixelSize().w || 0.000001 ) *
            inches[ "km" ] * OpenLayers.DOTS_PER_INCH;
		// Nominal scale
        var scaleNom = this.map.getScale();

		var scale = this.geodesic ? scaleGeo : scaleNom;
		
        if ( !scale ) {
            return;
        }
        var zoom = this.map.getZoom();
        var scaleVals = {
            'scaleDenom': 			scaleDisp(scale),
            'scaleDenomPrecise': 	scaleDispPrecise(scale),
            'scaleDenomNom': 		scaleDisp(scaleNom),
            'scaleDenomPreciseNom': scaleDispPrecise(scaleNom),
            'scaleDenomGeo': 		scaleDisp(scaleGeo),
            'scaleDenomPreciseGeo': scaleDispPrecise(scaleGeo),
            'zoom': zoom            
        }
        var scaleStr = OpenLayers.i18n( this.template,  scaleVals);
        var titleStr = OpenLayers.i18n( this.title,     scaleVals );
        
        this.element.innerHTML = scaleStr;
        this.element.title = titleStr;
        
        function scaleDisp(scale) {
	        var scaleDisp = Math.round( scale );
	        if ( scale >= 9500 && scale <= 950000 ) {
	            scaleDisp = Math.round( scale / 1000 ) + "K";
	        } else if ( scale >= 950000 ) {
	            scaleDisp = Math.round( scale / 1000000 ) + "M";
	        }
	        return scaleDisp;
        }
        function scaleDispPrecise(scale) {
	        return Math.round( scale ).toLocaleString();
        }
    },

    CLASS_NAME: "OpenLayers.Control.ScaleEx"
} );
