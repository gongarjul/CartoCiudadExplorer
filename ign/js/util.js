
//gml_MultiSurface2geoJSON_MultiPolygon: function(MultiSurface){
function gml_MultiSurface2geoJSON_MultiPolygon(MultiSurface){
    var multiPolygon = [];
    
    //gml:MultiSurface -> [0..1] gml:surfaceMembers -> [0..*] gml:Surface
    for(var i=0; i<MultiSurface['gml:surfaceMembers'][0]['gml:Surface'].length; i++)
    {
        multiPolygon = multiPolygon.concat(
            gml_Surface2geoJSON_MultiPolygon(MultiSurface['gml:surfaceMembers'][0]['gml:Surface'][i]));
    }
    
    return multiPolygon;
    
};

//gml_Surface2geoJSON_MultiPolygon: function(Surface){
function gml_Surface2geoJSON_MultiPolygon(Surface){    

    var multiPolygon = [];
    
    //gml:Surface -> [1..1] gml:patches -> [0..*] gml:PolygonPatch
    for(var i=0; i<Surface['gml:patches'][0]['gml:PolygonPatch'].length; i++)
    {
        multiPolygon[multiPolygon.length] = 
            gml_PolygonPatch2geoJSON_Polygon(Surface['gml:patches'][0]['gml:PolygonPatch'][i]);
    }
    
    return multiPolygon;
};

//gml_PolygonPatch2geoJSON_Polygon: function(PolygonPatch){
function gml_PolygonPatch2geoJSON_Polygon(PolygonPatch){

    var polygon = [];
    
    //gml:PolygonPatch -> [0..1] gml:exterior -> [1..1] gml:LinearRing
    //un poligono sin exterior? asumimos que siempre habra uno
    polygon[polygon.length] = 
        gml_LinearRing2geoJSON_LineString(PolygonPatch['gml:exterior'][0]['gml:LinearRing'][0]);

    //gml:PolygonPatch -> [0..*] gml:interior -> [1..1] gml:LinearRing
    if('gml:interior' in PolygonPatch)
    {
        for(var i=0; i<PolygonPatch['gml:interior'].length; i++)
        {
            polygon[polygon.length] = 
                gml_LinearRing2geoJSON_LineString(PolygonPatch['gml:interior'][i]['gml:LinearRing'][0]);
        }
    }
    return polygon;
};

//gml_Curve2geoJSONMultiLineString: function(Curve)
function gml_Curve2geoJSONMultiLineString(Curve){
    
    var multiLineString = [];
    
    for(var i=0; i<Curve['gml:segments'][0]['gml:LineStringSegment'].length; i++)
    {
        multiLineString[multiLineString.length] = 
            gml_LineStringSegment2geoJSON_LineString(Curve['gml:segments'][0]['gml:LineStringSegment'][i]);
    }
    
    return multiLineString;
};

//gml_LineStringSegment2geoJSON_LineString: function(LineStringSegment)
function gml_LineStringSegment2geoJSON_LineString(LineStringSegment){

    var lineString = [];
    
    //gml:LineStringSegment -> [1..1] gml:posList (list of doubles)
    var arrayCoord = LineStringSegment['gml:posList'][0]._tagvalue.split(' ');
    //suponemos 2d
    for(var i=0; i<arrayCoord.length; i+=2)
    {
        lineString[lineString.length] = [parseFloat(arrayCoord[i]), parseFloat(arrayCoord[i+1])];
    }
    
    return lineString;

};

//gml_LinearRing2geoJSON_LineString: function(linearRing){
function gml_LinearRing2geoJSON_LineString(LinearRing){
    
    var lineString = [];
    
    //gml:LinearRing -> [1..1] gml:posList (list of doubles)
    var arrayCoord = LinearRing['gml:posList'][0]._tagvalue.split(' ');
    //suponemos 2d
    for(var i=0; i<arrayCoord.length; i+=2)
    {
        lineString[lineString.length] = [parseFloat(arrayCoord[i]), parseFloat(arrayCoord[i+1])];
    }
    
    return lineString;
};

//gml_Point2geoJSON_Point: function(Point);
function gml_Point2geoJSON_Point(Point){

    //gml:Point -> [1..1] gml:pos (list of doubles)
    var geoJSONpoint = Point['gml:pos'][0]._tagvalue.split(' ');
    
    //text -> float
    for(var i=0; i<geoJSONpoint.length; i++)
    {
        geoJSONpoint[i] = parseFloat(geoJSONpoint[i]);
    }
    
    return geoJSONpoint
};
