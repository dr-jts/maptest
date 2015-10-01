# MapTest

[MapTest](http://dr-jts.github.io/maptest/maptest.html) is a tool for web map developers and operators.  It is browser-based so can be used from any environment.  It can be used to:

* view web map services and layers, overlaid on a base map
* assess cartography of layer sets
* capture web map request response metrics
* display web map request URLs
* investigate request errors
* share web map configurations

[Try it!](http://dr-jts.github.io/maptest/maptest.html)

#### Sample Configurations

[GeoGratis National Map](http://dr-jts.github.io/maptest/maptest.html?host=http://geogratis.gc.ca/maps/CBMT?service=wms&lyr=National,Sub_national,Sub_regional&extent=-145.288387,41.321972,-96.772762,62.801720)


```
http://webservices.nationalatlas.gov/wms
meta-url: http://nationalmap.gov/small_scale/infodocs/wms_intro.html
timezones
lakesrivers
airports
statecap

http://demo.boundlessgeo.com/geoserver/wms
meta-url: http://demo.boundlessgeo.com/geoserver/web/
topp:states
topp:tasmania

http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi
nexrad-n0r-wmst

http://gis.srh.noaa.gov/arcgis/services/NDFDTemps/MapServer/WMSServer
16

http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs
RAS_RIDGE_NEXRAD
```


## Features

* Display WMS and ArcGIS map services and layers
* Single image or tiled overlays
* Zoom to any map extent
* Selectable base maps
* Records response duration metrics (last request & statistics)
* Query map response to view errors
* Log requests with times
* Manual or Auto Reload

## To Do

* UI
  * Zoom to World, Zoom to Initial Extent buttons
  * Change Overlay order (up/down)
  * Change layer order (up/down)
  * Overlay opacity
  * Clear Log

* Configuration 
  * Specify extent bbox in configuration
  * Parse configuration from WMS URL text
  * Allow layers to be turned on in configuration & URL
  
* URL 
 * Add URL parameters (extent/service/layers), provide permalink
 * Add URL links to log
 
* Map
 * More open base maps (OSM, Google, ESRI, Bing, etc)
 * Display and add layers from WMS capabiities documents
 * WMS GetFeatureInof on mouse click
 
* Analytics 
  * Graph response times
