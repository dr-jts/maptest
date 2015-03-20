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
```
http://webservices.nationalatlas.gov/wms
timezones
lakesrivers
airports
statecap

http://demo.boundlessgeo.com/geoserver/wms
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

* Change Overlay order (up/down)
* Control Overlay opacity
* Change layer order (up/down)
* Specify extent bbox in configuration
* Parse configuration from WMS URL text
* Allow layers to be turned on in configuration & URL
* Add URL parameters (extent/service/layers), provide permalink
* Add URL links to log
* Add Clear Log
* Add more open base maps (OSM, Google, ESRI, Bing, etc)
* Display and add layers from WMS capabiities documents
* Graph response times
