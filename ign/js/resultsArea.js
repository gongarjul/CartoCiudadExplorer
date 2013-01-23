


var resultsArea = {

    singleton: {
	
        //area de reusltados
        resultsAreaAccordion: null,
        resultsDataView : null,
        
		//funcion para inicializar el Buscador
        initialize: function(container) {
			
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
            
			this.resultsAreaAccordion.addItem('b', 'Detalle');
			this.resultsAreaAccordion.cells('b').attachObject('detail');
			this.resultsAreaAccordion.openItem('a');		
           
        },
    
        addResults: function(features){
        
            if(!features || features.length == 0)
            {
                var features = [{__text: 'No se han obtenido resultados'}]
            }
            else
            {
                for(var i = 0; i <features.length; i++)
                {
                    //el buscador se encargo de darnos resultados
                    //con el resumen en __text 
                    //componemos un __detailedText a partir de las 
                    //propiedades del json
                    features[i].__detailedText = '<h3>' + features[i].__tipoWFS + '</h3>'
                    features[i].__detailedText += this.proccesObject(features[i]);
                    this.resultsDataView.add(features[i]);
                }
                
                if(features.length == 1)
                {
                    //al ser solo uno centramos vista
                    //y mostramos el detalle
                    this.zoomToFeature(features[0]);
                    this.showDetailedText(features[0]);
                    this.resultsAreaAccordion.cells('b').open();
                }
            }
            
        },    

        showDetailedText: function(feature){
        
            doc = document.getElementById('detail').contentDocument;
			if(doc == undefined || doc == null)
            {
				doc= document.getElementById('detail').contentWindow.document;
            }
			doc.open();
            
            //doc.write('<a href="javascript:(function(){resultsArea.singleton.resultsAreaAccordion.cells(\'b\').open();})()">Volver a resultados</a><br/>');
			doc.write(feature.__detailedText);
            //doc.write('<a href="javascript:(function(){resultsArea.singleton.resultsAreaAccordion.cells(\'b\').open();})()">Volver a resultados</a><br/>');
			doc.close();
            
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

            var text = '<ul>';
            
            for(var property in object)
            {
                if(property.search(/^_tagvalue/) >= 0)
                {
                    var tagvalue = '<li>' + object[property] + '</li>';
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
                        hasChilds = true
                        text += '<li>' + property + ':</li>'
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
            
            text += '</ul>'
            
            return text;
        },

        
        clearAll: function(){
            this.resultsDataView.clearAll();
        }
    }
};