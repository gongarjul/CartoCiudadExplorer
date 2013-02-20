


var resultsArea = {

    singleton: {
	
        //area de reusltados
        resultsAreaAccordion: null,
        resultsDataView: null,
        map: null,
        
		//funcion para inicializar el Buscador
        initialize: function(container, map) {
        
            this.map = map;
			
			//dependiendo del tipo del par?metro instanciamos el formulario dhtmlx
			switch(typeof container)
			{
				case 'string':
					//container almacena el id de un HTML container
                    //comprobar que existe
					if (document.getElementById(container))
					{
						this.resultsAreaAccordion = new dhtmlxAccordion(container, 'dhx_skyblue');
					}else{
						console.error('The element with Id=' + container + ' doesn\'t exist');
					}
					break;
				
				case 'object':
                    //container alamacena un objeto
                    //comprobar si tiene el metodo attachForm
					if('attachAccordion' in container){
						this.resultsAreaAccordion = container.attachAccordion();
					}else{
						console.error(container + 'doesn\'t have function attachForm');
						console.error(container);
					}
					break;
				
				default:
                    //container desconocido
					console.error(typeof container + ' not supported');
					console.error(container);
					break;
			}
            
			if(!this.resultsAreaAccordion)
			{
                //no se ha conseguido crear el formulario volver
				return;
			}
            
			this.resultsAreaAccordion.addItem('a', 'Resultado');
            
			//definimos los template para el dataview
			dhtmlx.Type.add(dhtmlXDataView, {
				name: 'simpleTemplate',
				template: '#__text#',
                width: 177,
                height: 50
			});
			
            this.resultsDataView = this.resultsAreaAccordion.cells('a').attachDataView( { type:{ template:''} } );
            this.resultsDataView.define('type', 'simpleTemplate');
            
            this.resultsDataView.attachEvent("onItemClick", function (id, ev, html){
                resultsArea.singleton.resultsDataView_onItemClick(id,ev,html);
                return true;
            }); 
            
			this.resultsAreaAccordion.addItem('b', 'Detalle');
			this.resultsAreaAccordion.cells('b').attachObject('detail');
			this.resultsAreaAccordion.openItem('a');

        },

        resultsDataView_onItemClick: function(id,ev,html){
            var feature = this.resultsDataView.get(id);
            this.zoomToFeature(feature);
            this.showDetailedText(feature);
        },
        
        addResults: function(features){
        
            if(!features || features.length == 0)
            {
                var features = [{__text: 'No se han obtenido resultados'}];
            }
            else
            {
                var geojson_format = new OpenLayers.Format.GeoJSON();
                var vector_layer;
                if(features.length == 1)
                {
                    vector_layer = new OpenLayers.Layer.Vector(features[0].__text);
                }
                else
                {
                    vector_layer = new OpenLayers.Layer.Vector('Resultado'); 
                }
                
                map.addLayer(vector_layer);

                var geoJSONfeatureCollection = { type: "FeatureCollection", features: [] };
                var geoJSONfeature;
                
                var srsSrc = 'EPSG:4258', srsDest = this.map.projection;
                
                for(var i = 0; i <features.length; i++)
                {
                    //el buscador se encargo de darnos resultados
                    //con el resumen en __text 
                    //componemos un __detailedText a partir de las 
                    //propiedades del json
                    features[i].__detailedText = '<h3>' + features[i].__tipoWFS + '</h3>';
                    features[i].__detailedText += this.proccesObject(features[i]);
                    
                    if('posicionEspacial' in features[i])
                    {
                        for(var j=0; j<features[i].posicionEspacial.length; j++)
                        {
                            geoJSONfeature = {};
                            geoJSONfeature.type = features[i].__tipoWFS;
                            geoJSONfeature.properties = {};
                            geoJSONfeature.properties.info = features[i].__detailedText;
                            
                            if('app:geom' in features[i].posicionEspacial[j])
                            {
                                if('gml:MultiSurface' in features[i].posicionEspacial[j]['app:geom'][0])
                                {
                                    geoJSONfeature.geometry = {
                                        type: "MultiPolygon", 
                                        coordinates: 
                                            gml_MultiSurface2geoJSON_MultiPolygon(
                                                features[i].posicionEspacial[j]['app:geom'][0]['gml:MultiSurface'][0])
                                    };

                                    geoJSONfeatureCollection.features[geoJSONfeatureCollection.features.length] = geoJSONfeature;                                    
                                }
                                else if('gml:Surface' in features[i].posicionEspacial[j]['app:geom'][0])
                                {
                                    geoJSONfeature.geometry = {
                                        type: "MultiPolygon", 
                                        coordinates: 
                                            gml_Surface2geoJSON_MultiPolygon(
                                                features[i].posicionEspacial[j]['app:geom'][0]['gml:Surface'][0])
                                    };

                                    geoJSONfeatureCollection.features[geoJSONfeatureCollection.features.length] = geoJSONfeature;                                    
                                    
                                }
                                else if('gml:Curve' in features[i].posicionEspacial[j]['app:geom'][0])
                                {
                                    geoJSONfeature.geometry = {
                                        type: "MultiLineString",
                                        coordinates: []
                                    };

                                    for(var k=0; k<features[i].posicionEspacial[j]['app:geom'].length; k++)
                                    {
                                        geoJSONfeature.geometry.coordinates = 
                                            geoJSONfeature.geometry.coordinates.concat(
                                                gml_Curve2geoJSONMultiLineString(features[i].posicionEspacial[j]['app:geom'][k]['gml:Curve'][0]));
                                    }
                                    
                                    geoJSONfeatureCollection.features[geoJSONfeatureCollection.features.length] = geoJSONfeature;                                    
                                }
                            }
                            else if('gml:Point' in features[i].posicionEspacial[j])
                            {
                                geoJSONfeature.geometry = {
                                    type: "Point", 
                                    coordinates: 
                                        gml_Point2geoJSON_Point(features[i].posicionEspacial[j]['gml:Point'][0])
                                };
                                
                                geoJSONfeatureCollection.features[geoJSONfeatureCollection.features.length] = geoJSONfeature;
                            }
                            
                        }
                        
                    }
                    
                    this.resultsDataView.add(features[i]);
                }
                
                vector_layer.addFeatures(geojson_format.read(geoJSONfeatureCollection));
                //los fenomenos de los wfs tienen las coordenadas en EPSG:4258
                //a la capa vectorial se han añadido con esas coordenadas pero
                //esta el mapa en esa proyeccion? si no lo esta transformar.
                if(srsSrc != srsDest)
                {
                    for(var i=0; i<vector_layer.features.length; i++)
                    {
                        var feature = vector_layer.features[i];
                        feature.geometry = feature.geometry.transform(new OpenLayers.Projection(srsSrc), new OpenLayers.Projection(srsDest));
                    }
                }
                
                if(features.length == 1)
                {
                    //al ser solo uno centramos vista
                    //y mostramos el detalle
                    this.zoomToFeature(features[0]);
                    this.showDetailedText(features[0]);
                }
                else
                {
                    this.resultsAreaAccordion.cells('a').open();
                }
            }
            
        },    

        showDetailedText: function(feature){
        
            document.getElementById('detail').innerHTML = 
                '<div class=\'detail\'><a href="javascript:(function(){resultsArea.singleton.resultsAreaAccordion.cells(\'a\').open();})()">Volver a resultados</a><br/>' + 
                feature.__detailedText + 
                '<a href="javascript:(function(){resultsArea.singleton.resultsAreaAccordion.cells(\'a\').open();})()">Volver a resultados</a><br/></div>';
            this.resultsAreaAccordion.cells('b').open();
        },
        
        zoomToFeature: function(feature){
        
            for(var i = 0; i < feature['posicionEspacial'].length; i++)
            {
                if(feature['posicionEspacial'][i]['gml:boundedBy'])
                {
                    var srsName = feature['posicionEspacial'][i]
                                    ['gml:boundedBy'][0]
                                        ['gml:Envelope'][0]
                                            ['srsName'];
                    var gml_pos = feature['posicionEspacial'][i]
                                    ['gml:boundedBy'][0]
                                        ['gml:Envelope'][0]
                                            ['gml:pos'];
					
                    var coorMin = gml_pos[0]._tagvalue.split(" ");
					var coorMax = gml_pos[1]._tagvalue.split(" ");
					var xmin = coorMin[0];
					var ymin = coorMin[1];
					var xmax = coorMax[0];
					var ymax = coorMax[1];
                    zoomToExtentSRS(Buscador.singleton.map, xmin, ymin, xmax, ymax, srsName);
                    break;
				}
            }
        },
        
        proccesObject: function(object){

            var hasChilds = false;
            var tagvalue = '';

            var text = '<ul>';
            
            for(var property in object)
            {
                if(property.search(/^_tagvalue/) >= 0)
                {
                    tagvalue = '<li>' + object[property] + '</li>';
                }
             
                if(property.search(/^_/) < 0 &&
                    property.search(/^posicionEspacial/) <0 &&
                    property.search(/^app:geom/) <0)
                {
                    if(typeof object[property] == 'string')
                    {
                        //atributo de una etiqueta
                        text += '<li>@' + property + ': ' + object[property] + '</li>';
                    }
                    else if(object[property] instanceof Array)
                    {
                        //mas objetos hijo
                        hasChilds = true;
                        text += '<li>' + property + ':</li>';
                        for(var i = 0; i < object[property].length; i++)
                        {
                           text+= this.proccesObject(object[property][i]);
                        }
                    }
                }
            }
            
            if(!hasChilds)
            {
                text += tagvalue;
            }
            
            text += '</ul>';
            
            return text;
        },

        
        clearAll: function(){
            this.resultsDataView.clearAll();
        }
    }
};