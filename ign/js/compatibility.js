/*
 * For compatibility
 */

//from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/Trim
(function(){

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }
})();

dtmlXMLLoaderObject.prototype.doXPathMB = function(xpathExp, docObj, namespaces, result_type){

    var result;
    
    if(!namespaces) namespaces = null;
    if(!docObj) docObj = null;
    if(!result_type) result_type = null;

    //probamos sin el uso de namespaces
    /*
    result = this.doXPath(xpathExp, docObj, null, result_type);
    if(result.length > 0)
    {
        //xpath devolvio nodos
        return result;
    }
    else
    {
        //xpath no devolvio nodos
        //puede ser que estemos en IE
        if(_isIE )
        {
            //en ese caso es que no habra nodos
            return result;
        }
    }
    */
    //o puede ser que necesitemos hacer el xpath
    //con el uso de namespaces
        
        //si indica namespace ha de hacerse como una matriz de cadenas
        //en la forma [ "namespace1SinPrefijo", "ns2:namespace2conPrefijo" ]
    if(namespaces)
    {
        var nons = 'nons';
        var colonIndex;
        var newXpathExp = [];
        
        //comprobamos que todos los namespaces vienen como
        //prefix:uri al que no se le asigna nons
        for(var i = 0; i < namespaces.length; i++)
        {
            if(!namespaces[i].prefix)
            {
                //como mucho solo deber�a haber un namespace sin prefix
                namespaces[i].prefix = nons;
                break;
            }
        }
                
        var ns = { prefix:null, uri:null };
        
        //1.-- separamos todos los nodos
        var nodeNames = xpathExp.split('/');
        //2.-- a�adimos si fuera necesario un prefijo a los nodos que no lo tengan
        //     y verificamos hasta donde llega el primer prefix
        //     ./nodo1/nodo2/ns3:nodo3
        //     //nodo1
        for(var i = 0; i < nodeNames.length; i++)
        {
            if(nodeNames[i].length > 0 && nodeNames[i] != '.')
            {
                //si en el nombre del nodo no aparece el caracter :
                //no tiene namespace a�adir uno
                colonIndex = nodeNames[i].search(':');
                if(colonIndex < 0)
                {
                    nodeNames[i] = nons + ':' + nodeNames[i];
                    colonIndex = nons.length;
                }
                
                //comprobamos si este es el primer nodo que nos encontramos
                if(!ns.prefix)
                {
                    ns.prefix = nodeNames[i].substring(0, colonIndex);
                    //buscamos en la matriz de namespaces el prefijo
                    //para asignar a ns la uri
                    for(var j = 0; j < namespaces.length; j++)
                    {
                        if(namespaces[j].prefix == ns.prefix)
                        {
                            ns.uri = namespaces[j].uri;
                            break;
                        }
                    }
                }
                else
                {
                    //si no es el primero comprobar que este es como el que
                    //se guardo del primero si no lo es terminar
                    if(nodeNames[i].substring(0, colonIndex) != ns.prefix)
                    {
                        break;
                    }
                }
            }
            newXpathExp[newXpathExp.length] = nodeNames[i];
        }

        //3.-- en el caso de varios namespaces diferentes es necesario
        //     resolver por partes el xpath
        newXpathExp = newXpathExp.join('/');
        var subNewXpathExp;
        if(i<nodeNames.length)
        {
            subNewXpathExp = ['.'].concat(nodeNames.slice[i]);
        }
    }

    result = this.doXPath(newXpathExp, docObj, ns.uri, result_type);
    return result;
};
    