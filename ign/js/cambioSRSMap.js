/*
 * Estas dos funciones actuan conjutamente para realizar el
 * cambio en el mapa a partir de un cierto zoom de coordenadas
 * geográficas EPSG:4258 a EPSG:258xx o entre EPSG:258xx en 
 * función de las coordenadas geográficas 
 */
 

 
//TODO: Parametrizar el nivel del zoom  partir del cual se empieza
//      a pedir la información en coordenadas proyectadas.

/*
 *función para la gestión automática del SRS de representacion
 */
function zoomPanManage(event) {
    
    var map = event.object;
    var centroMapa = map.getCenter();
    var srsSrc = map.projection, srsDest;
    
	//dependiendo del nivel de zoom lo más adecuado será visualizar
    //la información en coordenadas geogáficas o en coordenadas UTM
    if (map.getZoom() < 9) {

        //mostrar en geograficas
        srsDest = 'EPSG:4258';
    
    } else {

        //mostrar en UTM. El siguiente paso es buscar el mejor huso
        //para representar la información. Se hace consultando la
        //coordenada longitud del centro del mapa
        
        //si el mapa se esta visualizando en coordenadas UTM
        //es necesario calcular las coordenadas geográficas del centro
        //del mapa
        if (srsSrc != 'EPSG:4258') {
            centroMapa.transform(new OpenLayers.Projection(srsSrc),
                new OpenLayers.Projection('EPSG:4258'));
        }
        
        //dependiendo de la coordenada longitud del centro del mapa
        //asignamos el huso en el que mostrar el mapa
        if (centroMapa.lon < -12) {
            //huso 28, todo canarias se proyecta en el huso 28
            srsDest = 'EPSG:25828';
        }else if (centroMapa.lon < -6) {
            //huso 29, oeste de la peninsula
            srsDest = 'EPSG:25829';
        }else if (centroMapa.lon < 0) {
            //huso 30, zona central de la peninsula
            srsDest = 'EPSG:25830';
        }else if (centroMapa.lon < 6) {
            //huso 31, este de la peninsula y baleares
            srsDest = 'EPSG:25831';
        }

    }
    
    //una vez elegido el mejor sistema de representación
    //en función del nivel de zoom y del centro del mapa
    //comprobar si coincide con el actual, en caso de no
    //coincidir cambiarlo
    if (srsSrc != srsDest) {
        changeSRS(map, srsSrc, srsDest);
    }
    
}

/*
 * función para realizar el cambio de SRS del mapa y todas sus layers
 */
function changeSRS(map, srsSrc, srsDest) {

    var punto = map.getCenter();
	var prjSrc = new OpenLayers.Projection(srsSrc);
    var prjDest = new OpenLayers.Projection(srsDest);
    var options;
    var maxResolution, minResolution;
    var vectorLayers = [];
    
    //en función del SRS de destino cambiar las opciones del mapa
    //y de cada una de las layers del mapa
    switch(srsDest){
        case 'EPSG:4258':
        //case 'EPSG:4230':
            //a geograficas siempre se cambiará desde utm al hacer zoom-
            //ATENCION cambio de resolución debido al cambio de unidades
            options = {projection: srsDest, units: 'degrees', maxExtent: new OpenLayers.Bounds(-180,-90,180,90), maxResolution: map.maxResolution / (40000000/360)};
        break;
        case 'EPSG:25828':
        case 'EPSG:25829':
        case 'EPSG:25830':
        case 'EPSG:25831':
        //case 'EPSG:23028':
        //case 'EPSG:23029':
        //case 'EPSG:23030':
        //case 'EPSG:23031':
            //hay que comprobar si el srsSrc es en utm o en geograficas
            //para saber si es necesario el cambio de resolución
            options = srsSrc == 'EPSG:4258'?
                {projection: srsDest, units: 'meters', maxExtent: new OpenLayers.Bounds(0,0,1000000,10000000), maxResolution: map.maxResolution * (40000000/360)} :
                {projection: srsDest, units: 'meters', maxExtent: new OpenLayers.Bounds(0,0,1000000,10000000), maxResolution: map.maxResolution};
        break;
    }
    map.setOptions(options);
    
    //para cada layer se ha de realizar lo mismo que para el mapa
    //teniendo en cuenta que la visualizacion de algunas capas según
    //el nivel de zoom puede estar limitada
    for( i=0; i<map.layers.length; i++){
    
        maxResolution = map.layers[i].maxResolution;
        minResolution = map.layers[i].minResolution;
    
        switch(srsDest){
            case 'EPSG:4258':
            //case 'EPSG:4230':
                options = {projection: prjDest, units: 'degrees', maxExtent: new OpenLayers.Bounds(-180,-90,180,90), maxResolution: map.maxResolution};
                maxResolution = maxResolution / (40000000/360);
                minResolution = minResolution / (40000000/360);
            break;
            case 'EPSG:25828':
            case 'EPSG:25829':
            case 'EPSG:25830':
            case 'EPSG:25831':
            //case 'EPSG:23028':
            //case 'EPSG:23029':
            //case 'EPSG:23030':
            //case 'EPSG:23031':
                options = {projection: prjDest, units: 'meters', maxExtent: new OpenLayers.Bounds(0,0,1000000,10000000), maxResolution: map.maxResolution};
                if (srsSrc == 'EPSG:4258'){ maxResolution = maxResolution * (40000000/360); }
                if (srsSrc == 'EPSG:4258'){ minResolution = minResolution * (40000000/360); }
            break;
        }
        
        map.layers[i].addOptions(options);
        map.layers[i].initResolutions();
        map.layers[i].maxResolution = maxResolution;
        map.layers[i].minResolution = minResolution;
        
        if(map.layers[i] instanceof OpenLayers.Layer.Vector)
        {
            for(j=0; j < map.layers[i].features.length; j++)
            {
                var feature = map.layers[i].features[j];
                feature.geometry = feature.geometry.transform(new OpenLayers.Projection(srsSrc), new OpenLayers.Projection(srsDest));
            }
            vectorLayers[vectorLayers.length] = map.layers[i];
        }
        
    }
    
    punto.transform(prjSrc, prjDest);
	//los dos últimos parámetros de setCenter:
	//dragging	{Boolean} Specifies whether or not to trigger movestart/end events
	//forceZoomChange	{Boolean} Specifies whether or not to trigger zoom change events (needed on baseLayer change)
	//el caso es que parece que si le indicamos true la zoomPanManage se volvería a ejecutar pero resulta
	//que es al revés!!!!
    map.setCenter(punto, map.getZoom(), true, true);
    
    for(var i = 0; i < vectorLayers.length; i++)
    {
        vectorLayers[i].redraw();
    }
    

}

function zoomToExtentSRS(map, xmin, ymin, xmax, ymax, srsCoor){

	var srsMap = map.projection;
    
    //1.- calculamos la resolucion a la que se vería el
    //      bbox con el tamaño del viewport actual
    var resX = (xmax - xmin)/map.getViewport().offsetWidth;
    var resY = (ymax - ymin)/map.getViewport().offsetHeight;

    //2.- los wfs devuelven los bbox en coordenadas geograficas
    //      pasar la resolucion a metros si el mapa se esta dibujando
    //      en UTM
    if(map.projection != 'EPSG:4258')
    {
        //las resoluciones en el mapa van en metros
        resX *=(40000000/360);
        resY *=(40000000/360);
    }
    
    //3.- a partir de la resolucion calculamos el nivel de zoom
    //      nos quedaremos con el menor de los dos
    var zoomX = map.getZoomForResolution(resX,false)
    var zoomY = map.getZoomForResolution(resY,false);
    var zoomLevel = zoomX <= zoomY?zoomX:zoomY;
    
    var srsBBOX;

    if(zoomLevel > 8)
    {
        //4.- el mapa se ha de mostrar en coordenadas utm
        //      calcular con la xMedia en que huso cae el bbox
        //      el calculo asi obliga a transformar a numero
        var xMedia = xmin/2 + xmax/2;

        //dependiendo de la coordenada longitud del centro del mapa
        //asignamos el huso en el que mostrar el mapa
        if (xMedia < -12) {
            //huso 28, todo canarias se proyecta en el huso 28
            srsBBOX = 'EPSG:25828';
        }else if (xMedia < -6) {
            //huso 29, oeste de la peninsula
            srsBBOX = 'EPSG:25829';
        }else if (xMedia < 0) {
            //huso 30, zona central de la peninsula
            srsBBOX = 'EPSG:25830';
        }else if (xMedia < 6) {
            //huso 31, este de la peninsula y baleares
            srsBBOX = 'EPSG:25831';
        }
    }
    else
    {
        //el bbox es tan amplio que es necesario mostrarlo en geograficas
        srsBBOX = 'EPSG:4258';
    }
    
    //5.- comprobamos si es necesario cambiar de SRS
    if(srsBBOX != srsMap)
    {
        changeSRS(map, srsMap, srsBBOX);
    }
    
    //6.- transformamos las coordenadas del BBOX al sistema 

    var lb = new OpenLayers.LonLat(xmin, ymin);
	var ru = new OpenLayers.LonLat(xmax, ymax);
	
	lb.transform(new OpenLayers.Projection(srsCoor), new OpenLayers.Projection(srsBBOX));
	ru.transform(new OpenLayers.Projection(srsCoor), new OpenLayers.Projection(srsBBOX));
    
    //7.- centramos el BBOX en la vista
	map.zoomToExtent(new OpenLayers.Bounds(lb.lon, lb.lat, ru.lon, ru.lat));
	
};



