/**
 * This object is used to:
 * 	-calculate routes
 * It add to the map a marker layer
 * It needs the dhtmlx menu component
 */

wpsClient = {
		
	singleton: {
		
		map: null,
		lastRightClickAt: null,
		markerLayer: null,
		startPoint: null,
		endPoint: null,
		waypointList: null,
        
		//funcion para inicializar el wpsclient
        initialize: function(map) {

        	this.map = map;
        	
        	//create a dhtmlx context menu
        	//with the options:
        	//	ruta desde aqui
        	//	ruta hasta aqui
            var contextMenu = new dhtmlXMenuObject();
            contextMenu.setIconsPath('img/');
            contextMenu.addContextZone(map.div.id);        	
            contextMenu.renderAsContextMenu();
        	contextMenu.loadXMLString('<menu><item type="item" id="routeOrigin" text="Ruta desde aquí" img="Map-Marker-Flag-1-Left-Azure-icon.png"/><item type="item" id="routeDestination" text="Ruta hasta aquí" img="Map-Marker-Flag-1-Right-Pink-icon.png"/></menu>');
        	contextMenu.attachEvent("onClick", function(id, zoneId, casState){
        		switch(id)
        		{
        			case 'routeOrigin':
        				wpsClient.singleton.addStartToMarkerLayer();
        				break;
        			case 'routeDestination':
        				wpsClient.singleton.addEndToMarkerLayer();
        				break;
        		}
        	});

        	//create a click control to save the xy where the context menu prompts
        	OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
                defaultHandlerOptions: {
                    'single': true,
                    'double': true,
                    'pixelTolerance': 0,
                    'stopSingle': true,
                    'stopDouble': false
                },
                handleRightClicks:true,
                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    ); 
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'rightclick': function(e) {
                            	wpsClient.singleton.lastRightClickAt = {xy: e.xy, xyMap: map.getLonLatFromPixel(e.xy)};
                            }
                        }, this.handlerOptions
                    );
                }, 

            });
            
    		var click = new OpenLayers.Control.Click();            
    		this.map.addControl(click);
    		click.activate();
    		
    		//add a marker layer to put the start and end icon
            this.markerLayer = new OpenLayers.Layer.Markers( "Markers" );
            map.addLayer(this.markerLayer);
    		
        },
        
        addStartToMarkerLayer: function(){
            //start point
            var size = new OpenLayers.Size(24,24);
            var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
            var icon = new OpenLayers.Icon('img/Map-Marker-Flag-1-Left-Azure-icon.png',size,offset);
            var marker = new OpenLayers.Marker(this.lastRightClickAt.xyMap,icon);
            //marker.events.register('mousedown', marker, function(evt) { alert(this.icon.url); OpenLayers.Event.stop(evt); });
            this.markerLayer.addMarker(marker);
            
            this.startPoint = this.lastRightClickAt.xyMap;
            if(this.endPoint !== null)
            {
            	//calculate route!
            	this.calculateRoute();
            }
        	
        },
        
        addEndToMarkerLayer: function(){
        	//end Point
            var size = new OpenLayers.Size(24,24);
            var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
            var icon = new OpenLayers.Icon('img/Map-Marker-Flag-1-Right-Pink-icon.png',size,offset);
            var marker = new OpenLayers.Marker(this.lastRightClickAt.xyMap,icon);
            //marker.events.register('mousedown', marker, function(evt) { alert(this.icon.url); OpenLayers.Event.stop(evt); });
            this.markerLayer.addMarker(marker);

            this.endPoint = this.lastRightClickAt.xyMap;
            if(this.startPoint !== null)
            {
            	//calculate route!
            	this.calculateRoute();
            }
        },
        
        calculateRoute: function(){
        	
        	url = 'http://www.cartociudad.es/wps/WebProcessingService';
        	
        	var wayPointList = [this.startPoint, this.endPoint];
        	//var wayPointList = [new OpenLayers.LonLat(3.1,40.2), new OpenLayers.LonLat(3.105,40.2)];
        	
        	var params = '<?xml version="1.0" encoding="utf-8"?>';
        	params = params + '<Execute service="WPS" version="0.4.0" store="false" status="false" xmlns="http://www.opengeospatial.net/wps" xmlns:pak="http://www.opengis.net/examples/packet" xmlns:ows="http://www.opengeospatial.net/ows" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengeospatial.net/wps ..\wpsExecute.xsd" xmlns:om="http://www.opengis.net/om" xmlns:gml="http://www.opengis.net/gml">';
        	params = params + '<ows:Identifier>com.ign.process.geometry.RouteFinder</ows:Identifier>';
        	params = params + '<DataInputs>';
        	params = params + '<Input>';
        	params = params + '<ows:Identifier>details</ows:Identifier>';
        	params = params + '<ows:Title>Distancia</ows:Title>';
        	params = params + '<LiteralValue dataType="xs:boolean">true</LiteralValue>';
        	params = params + '</Input>';
        	params = params + '<Input>';
        	params = params + '<ows:Identifier>wayPointList</ows:Identifier>';
        	params = params + '<ows:Title>WayPoints</ows:Title>';
        	params = params + '<ComplexValue>';
        	params = params + '<wayPointList>';
        	        	
        	for(var i=0; i<wayPointList.length; i++)
        	{

                params = params + '<wayPoint><gml:Point xmlns:gml="www.opengeospatial.net.gml"><gml:coord>';
                params = params + '<gml:X>' + wayPointList[i].lon + '</gml:X><gml:Y>' + wayPointList[i].lat + '</gml:Y>';
                params = params + '</gml:coord></gml:Point></wayPoint>';
        	}
        	
        	params = params + '</wayPointList>';
        	params = params + '</ComplexValue>';
        	params = params + '</Input>';
        	params = params + '</DataInputs>';
        	params = params + '<ProcessOutputs>';
        	params = params + '<Output>';
        	params = params + '<ows:Identifier>result</ows:Identifier>';
        	params = params + '<ows:Title>LineString</ows:Title>';
        	params = params + '<ows:Abstract>GML describiendo una feature de Linestring.</ows:Abstract>';
        	params = params + '<ComplexOutput defaultFormat="text/XML" defaultSchema="http://geoserver.itc.nl:8080/wps/schemas/gml/2.1.2/gmlpacket.xsd">';
        	params = params + '<SupportedComplexData>';
        	params = params + '<Schema>http://schemas.opengis.net/gml/2.1.2/feature.xsd</Schema>';
        	params = params + '</SupportedComplexData>';
        	params = params + '</ComplexOutput>';
        	params = params + '</Output>';
        	params = params + '<Output>';
        	params = params + '<ows:Identifier>route</ows:Identifier>';
        	params = params + '<ows:Title>Ruta</ows:Title>';
        	params = params + '<ows:Abstract>Ruta</ows:Abstract>';
        	params = params + '<ComplexOutput defaultFormat="text/XML" defaultSchema="http://www.idee.es/complexValues.xsd">';
        	params = params + '<SupportedComplexData>';
        	params = params + '<Schema>http://www.idee.es/complexValues.xsd</Schema>';
        	params = params + '</SupportedComplexData>';
        	params = params + '</ComplexOutput>';
        	params = params + '</Output>';
        	params = params + '<Output>';
        	params = params + '<ows:Identifier>wayPoints</ows:Identifier>';
        	params = params + '<ows:Title>Puntos</ows:Title>';
        	params = params + '<ows:Abstract>Lista de puntos</ows:Abstract>';
        	params = params + '<ComplexOutput defaultFormat="text/XML" defaultSchema="http://www.idee.es/wayPointsValues.xsd">';
        	params = params + '<SupportedComplexData>';
        	params = params + '<Schema>http://www.idee.es/wayPointsValues.xsd</Schema>';
        	params = params + '</SupportedComplexData>';
        	params = params + '</ComplexOutput>';
        	params = params + '</Output>';
        	params = params + '</ProcessOutputs>';
        	params = params + '</Execute>';
        	params = encodeURIComponent(params);
        	params = 'request=' + params;

        	//TODO send the request via post
        	console.log(params);        	
        	request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
        	dhtmlxAjax.post(request,params,function(loader){
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var linestring = loader.xmlNodeToJSON(
                    	loader.doXPathMB('//gml:LineString', null, [{prefix: 'gml', uri:'http://www.opengis.net/gml'}])[0]
                    );

                    var geojson_format = new OpenLayers.Format.GeoJSON();
                    var vector_layer = new OpenLayers.Layer.Vector('Ruta');
                    
                    wpsClient.singleton.map.addLayer(vector_layer);

                    var geoJSONfeatureCollection = { type: "FeatureCollection", features: [] };
                    var geoJSONfeature;
                    geoJSONfeature = {};
                    geoJSONfeature.type = 'Ruta';
                    geoJSONfeature.properties = {};
                    geoJSONfeature.properties.info = 'Ruta';
                    geoJSONfeature.geometry = {
                            type: "LineString",
                            coordinates: []
                        };                    
                    geoJSONfeature.geometry.coordinates =  gml_LineString2geoJSON_LineString(linestring);                 
                    geoJSONfeatureCollection.features[geoJSONfeatureCollection.features.length] = geoJSONfeature;
                    vector_layer.addFeatures(geojson_format.read(geoJSONfeatureCollection));
                    vector_layer.features[0].style = {
                    	strokeColor: '#ee9900',	
                    	strokeWidth: 4
                    };
                }

        	});
        }
		
	}
};