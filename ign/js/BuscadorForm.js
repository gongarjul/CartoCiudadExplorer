/*
 * singleton: Buscador
 *
 */

 //TODO
 //ordenar municipios por distancia levenstein
 //para ello es necesario pasar a ucase y sustitituir acentos etc?
 
var Buscador = {

    singleton: {

        //referencia a formulario dhtmlx
        searchForm: null,

        //jobs
        jobs: [],

        //featureList
        featureList: [],

        //lastTime user press a key
        lastKeyAt: null,

        //map
        map: null,

        //funcion para inicializar el Buscador
        initialize: function(container, map) {

            this.map = map;

            //estructura del formulario
            var formStructure = [
                        { type:"settings" , labelWidth:0, inputWidth:250, position:"absolute"  },
                        { type:"combo" , name:"searchCombo", labelWidth:0, inputWidth:700, labelLeft:5, labelTop:5, inputLeft:100, inputTop:15  },
                        { type:"button" , name:"searchButton", label:"Buscar", value:"Buscar", width:115, inputWidth:115, inputLeft:805, inputTop:15  }
                    ];

            //dependiendo del tipo del parï¿½metro instanciamos el formulario dhtmlx
            switch(typeof container)
            {
                case 'string':
                    //container almacena el id de un HTML container
                    //comprobar que existe
                    if (document.getElementById(container))
                    {
                        this.searchForm = new dhtmlXForm(container,formStructure);
                    }else{
                        console.error('The element with Id=' + container + ' doesn\'t exist');
                    }
                    break;

                case 'object':
                    //container alamacena un objeto
                    //comprobar si tiene el metodo attachForm
                    if('attachForm' in container){
                        this.searchForm = container.attachForm(formStructure);
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

            if(!this.searchForm)
            {
                //no se ha conseguido crear el formulario volver
                return;
            }

            //se ha conseguido crear el formulario
            //hacemos que la lista tenga 0 de altura
            //se añaden los eventos para el combo:
            var searchCombo = this.searchForm.getCombo('searchCombo');
            searchCombo.setOptionHeight(0);

            /*
            searchCombo.attachEvent("onSelectionChange", function(){
                console.log('onSelectionChange');
                console.log(this.getSelectedValue());
                console.log(this.getSelectedText());
                console.log(this.getComboText());
            });
            */
            
            //-- controlar la longitud de lo que escribe el usuario
            //y que es lo qe escribe para dar sugerencias en la lista desplegable
            searchCombo.attachEvent('onKeyPressed', Buscador.singleton.searchCombo_onKeyPressed);

            //-- controlar si cambia el valor seleccionado por el usuario
            searchCombo.attachEvent('onChange', Buscador.singleton.searchCombo_onChange);
            
            //-- controlar si el usuario pulsa el boton buscar
            this.searchForm.attachEvent('onButtonClick', Buscador.singleton.searchForm_onButtonClick);
            /*
            //creamos el daemon que ejecutara los jobs
            window.setInterval(function(){

                //por cada x tiempo
                //1.-- comprobar si hay que mostrar el 'reloj'

                document.getElementById('inProgress').style.visibility =
                    Buscador.singleton.checkJobs()>0?'visible':'hidden';

                //2.-- si hace mas de 500 ms desde que se pulso la ultima tecla
                //      entonces lanzar los workflows pendientes
                if((new Date()).getTime() - Buscador.singleton.lastKeyAt > 500)
                {

                    for(var i=0; i<Buscador.singleton.jobs.length; i++)
                    {
                        //start workflows with status = 0 (created)
                        if(Buscador.singleton.jobs[i].status == 0)
                        {
                            //change status (1 started)
                            Buscador.singleton.jobs[i].status = 1;
                            //at the end chage status (2 finish)
                            Buscador.singleton.jobs[i].workflow.start(Buscador.singleton.jobs[i].startOptions);
                        }
                    }

                }
            }, 500);
			*/
        },

        searchCombo_onKeyPressed: function(keyCode){
        	
        	//this se refiere a searchCombo

            Buscador.singleton.lastKeyAt = (new Date()).getTime();
            //vamos a analizar el texto que esta escribiendo el usuario
            var texto = this.getComboText();
            //antes de añadir opciones
            //-- cancelamos cualquier peticion en curso
            //-- borramos las anteriores
            //-- la lista de features
            //-- la lista desplegable
            Buscador.singleton.cancelRunningJobs();
            Buscador.singleton.jobs = [];
            Buscador.singleton.featureList = [];
            this.clearAll(false);
            this.setOptionHeight(0);

            var components = texto.split(/[,]/);
            for(var i=0; i<components.length; i++)
            {
                components[i] = components[i].trim();
            }

            switch(components.length)
            {
            case 1:
            	Buscador.singleton.suggestions1componentSearch(components);
            	break;
            case 2:
            	Buscador.singleton.suggestions2componentSearch(components);
            	break;
            case 3:
            	Buscador.singleton.suggestions3componentSearch(components);
            	break;
            }

        },

        searchCombo_onChange: function(){
        	
        	//this se refiere a searchCombo
        		
            var idListOption = this.getSelectedValue();

            if(idListOption)
            {
                //seleccionado un valor
                //la lista se cierra automaticamente
                //borrar el resultsArea
                //mandar el resultado al resultsArea
                if(resultsArea.singleton)
                {
                    //borra el area
                    resultsArea.singleton.clearAll();

                    //mandamos a la ventana de resultados
                    var feature = Buscador.singleton.featureList[this.getSelectedValue()];
                    resultsArea.singleton.addResults([feature]);
                }
            }
            else
            {
                //TODO falta implementar que el usuario no seleccione
                //una opcion si no que pulse enter o Â¿salga del control?
            }
        	
        },
        
        searchForm_onButtonClick: function(name, command){
            
        	var searchCombo = this.getCombo('searchCombo');
            
        	if(name == 'searchButton')
            {
        		//separamos por ' ' y or ,
                var components = searchCombo.getComboText().split(/[, ]/);
                
                //borramos todas las cadenas vacias
                //y quitamos espacios en blnaco
                for(var i=components.length-1; i>=0; i--)
                {
                	if(components[i] == '')
                	{
                		components.splice(i,1);
                	}
                	else
                	{
                		components[i] = components[i].trim();
                	}
                }
                
                for(var i=0; i<components.length; i++)
                {
                	if(components[i].search(/[0-9]{1,}/) < 0 && components[i].length <3)
                	{
                		continue;
                	}
                
                	var job = {
                            startOptions: {
                                initialValue: { text: components[i] },
                                callback: function(review){
                                    //this se refiere al objeto:
                                    //{startOptions, status, workflow}
                                    if(this.forceStop)
                                    {
                                        this.status = -1;
                                    }
                                    else
                                    {
                                        this.status = 2;
                                        console.log(review);
                                    }
                                }
                            },
                            status: 0
                        };
                    job.startOptions.context = job;
                    job.workflow = jWorkflow.order(Buscador.singleton.esmunicipio, job);
                    job.workflow.start(job.startOptions);
                    job.workflow = jWorkflow.order(Buscador.singleton.esprovincia, job);
                    job.workflow.start(job.startOptions);
                    job.workflow = jWorkflow.order(Buscador.singleton.escomunidad, job);
                    job.workflow.start(job.startOptions);
                    job.workflow = jWorkflow.order(Buscador.singleton.esvial, job);
                    job.workflow.start(job.startOptions);
                        
                }
            }
        	
        },
        
        distritoLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }

            //document.getElementById('progressText').innerHTML = 'distritoLiteralSearch';
            
            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-distrito/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '<And>';

                if(data.municipios.length > 1)
                {
                    url += '<Or>';
                }

                for(var i=0; i<data.municipios.length; i++)
                {
                    url += '<PropertyIsEqualTo><PropertyName>entidadLocal/municipio</PropertyName><Literal>' + data.municipios[i]['nombreEntidad'][0]['nombre'][0]._tagvalue + '</Literal></PropertyIsEqualTo>';
                }

                if(data.municipios.length > 1)
                {
                    url += '</Or>';
                }

            }

            url += '<PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.distritoText + '</Literal></PropertyIsEqualTo>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '</And>';
            }

            url += '</Filter>';


            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();;

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var distritos = __buscador.loaderXML2JSON(loader);
                    if(distritos && distritos.length > 0)
                    {
                        if(!data.distritos)
                        {
                            data.distritos = [];
                        }
                        data.distritos = data.distritos.concat(distritos);
                    }
                }
                baton.pass(data);;
            });
        },

        seccionLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'seccionLiteralSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-seccion/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><And>';

            if('municipios' in data && data.municipios.length > 0)
            {
                if(data.municipios.length > 1)
                {
                    url += '<Or>';
                }

                for(var i=0; i<data.municipios.length; i++)
                {
                    url += '<PropertyIsEqualTo><PropertyName>entidadLocal/municipio</PropertyName><Literal>' + data.municipios[i]['nombreEntidad'][0]['nombre'][0]._tagvalue + '</Literal></PropertyIsEqualTo>';
                }

                if(data.municipios.length > 1)
                {
                    url += '</Or>';
                }

            }

            url += '<PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.seccionText.substring(2,5) + '</Literal></PropertyIsEqualTo>' +
                '<PropertyIsEqualTo><PropertyName>atributoEntidad/valorAtributo</PropertyName><Literal>' + data.seccionText.substring(0,2) + '</Literal></PropertyIsEqualTo>' +
                '</And></Filter>';


            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();;

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var secciones = __buscador.loaderXML2JSON(loader);
                    if( secciones && secciones.length > 0)
                    {
                        if(!data.secciones)
                        {
                            data.secciones = [];
                        }
                        data.secciones = data.secciones.concat(secciones);
                    }
                }
                baton.pass(data);;
            });
        },

        codigoLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'codigoLiteralSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-codigo/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.codigoText + '</Literal></PropertyIsEqualTo></Filter>';

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();;

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var codigos = __buscador.loaderXML2JSON(loader);
                    if(codigos && codigos.length > 0)
                    {
                        if(!data.codigos)
                        {
                            data.codigos = [];
                        }
                        data.codigos = data.codigos.concat(codigos);
                    }
                }
                baton.pass(data);;
            });
        },

        vialBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'vialBeginWithSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-vial/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '<And>';

                if(data.municipios.length > 1)
                {
                    url += '<Or>';
                }

                for(var i=0; i<data.municipios.length; i++)
                {
                    url += '<PropertyIsEqualTo><PropertyName>entidadLocal/municipio</PropertyName><Literal>' + data.municipios[i]['nombreEntidad'][0]['nombre'][0]._tagvalue + '</Literal></PropertyIsEqualTo>';
                }

                if(data.municipios.length > 1)
                {
                    url += '</Or>';
                }

            }
            url += '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.vialText + '*</Literal></PropertyIsLike>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '</And>';
            }

            url += '</Filter>';


            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();;

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var viales = __buscador.loaderXML2JSON(loader);
                    if(viales && viales.length > 0)
                    {
                        if(!data.viales)
                        {
                            data.viales = [];
                        }
                        data.viales = data.viales.concat(viales);
                    }
                }
                baton.pass(data);;
            });
        },

        municipioLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'municipioLiteralSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-municipio/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.municipioText + '</Literal></PropertyIsEqualTo></Filter>';

            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var municipios = __buscador.loaderXML2JSON(loader);
                    if(municipios && municipios.length > 0)
                    {
                        if(!data.municipios)
                        {
                            data.municipios = [];
                        }
                        data.municipios = data.municipios.concat(municipios);
                    }
                }
                baton.pass(data);
            });
        },

        municipioBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'municipioBeginWithSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-municipio/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                //'MAXFEATURES=3&' +
                'FILTER=<Filter>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '<And>';

                for(var i=0; i<data.municipios.length; i++)
                {
                    url += '<PropertyIsNotEqualTo><PropertyName>codigoINE</PropertyName><Literal>' + data.municipios[i]['codigoINE'][0]._tagvalue + '</Literal></PropertyIsNotEqualTo>';
                }
            }

            url += '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.municipioText + '*</Literal></PropertyIsLike>';

            if('municipios' in data && data.municipios.length > 0)
            {
                url += '</And>';
            }

            url += '</Filter>';

            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();;

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var municipios = __buscador.loaderXML2JSON(loader);
                    if(municipios && municipios.length > 0)
                    {
                        if(!data.municipios)
                        {
                            data.municipios = [];
                        }
                        data.municipios = data.municipios.concat(municipios);
                    }
                }
                baton.pass(data);;
            });
        },

        provinciaBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            //document.getElementById('progressText').innerHTML = 'provinciaBeginWithSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-provincia/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.provinciaText + '*</Literal></PropertyIsLike></Filter>';

            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var provincias = __buscador.loaderXML2JSON(loader);
                    if(provincias && provincias.length > 0)
                    {
                        if(!data.provincias)
                        {
                            data.provincias = [];
                        }
                        data.provincias = data.provincias.concat(provincias);
                    }
                }
                baton.pass(data);
            });
        },

        comunidadAutonomaBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            //document.getElementById('progressText').innerHTML = 'comunidadAutonomaBeginWithSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-comunidad/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.comunidadText + '*</Literal></PropertyIsLike></Filter>';

            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var comunidades = __buscador.loaderXML2JSON(loader);
                    if(comunidades && comunidades.length > 0)
                    {
                        if(!data.comunidades)
                        {
                            data.comunidades = [];
                        }
                        data.comunidades = data.comunidades.concat(comunidades);
                    }
                }
                baton.pass(data);
            });
        },


        portalLiteralSearch: function(data, baton){
            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            //document.getElementById('progressText').innerHTML = 'comunidadAutonomaBeginWithSearch';

            var __buscador = Buscador.singleton;

            var url = 'http://www.cartociudad.es/wfs-portal/services?' +
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter>';

                if('viales' in data && data.viales.length > 0)
                {
                    url += '<And>';

                    if(data.viales.length > 1)
                    {
                        url += '<Or>';
                    }

                    for(var i=0; i<data.viales.length; i++)
                    {
                        url += '<PropertyIsEqualTo><PropertyName>entidadRelacionada/idEntidad</PropertyName><Literal>' + data.viales[i]['fid'] + '</Literal></PropertyIsEqualTo>';
                    }

                    if(data.viales.length > 1)
                    {
                        url += '</Or>';
                    }

                }
                url += '<PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.portalText + '</Literal></PropertyIsEqualTo>';

                if('viales' in data && data.viales.length > 0)
                {
                    url += '</And>';
                }

                url += '</Filter>';

            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var portales = __buscador.loaderXML2JSON(loader);
                    if(portales && portales.length > 0)
                    {
                        if(!data.portales)
                        {
                            data.portales = [];
                        }
                        data.portales = data.portales.concat(portales);
                    }
                }
                baton.pass(data);
            });
        },
        
        //f() permutacion de un elemento
        //f(f()) permutaciones de dos elementos
        //f(f(f())) permutaciones de tres elementos
        
        //permutaciones de tres elementos
        //for(var i=1; i<=3; i++){ var res = f(res);};console.log(res);
        
        f: function(a){
            if(!a) return [[1]];
            var b = [];
            var c;
            var nelemento = a[0].length + 1;
            for(var j=0; j<nelemento; j++)
            {
                for(var i=0; i<a.length; i++)
                {
                	//copia a[i] en c
                    c = a[i].slice(0);
                    c.splice(j, 0, nelemento);
                    b[b.length] = c;
                }
            }
            //console.log(b);
            return b;
        },

        suggestions1componentSearch: function(components){
            //no es logico buscar con un solo componente:
            //  - distritos
            //  - secciones
            //  - portales

            //si el texto tiene 5 caracteres y son numeros la busqueda serÃ¡ de codigo postal
            if(components[0].length == 5 && components[0].search(/[0-9]{5}/) >= 0)
            {
                //rellenamos combo con codigos postales
                var job = {
                    startOptions: {
                        initialValue: { codigoText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('codigos' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.codigos);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.codigoLiteralSearch, job);
                this.jobs[this.jobs.length] = job;
            }
            //TODO mejorar esto para calles 1 cn numeros?
            else if(components[0].length >= 3)
            {
                //encontrar municipios
                var job = {
                    startOptions: {
                        initialValue: { municipioText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('municipios' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.municipios);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.municipioLiteralSearch, job).andThen(this.municipioBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;

                //encontrar provincias
                job = {
                    startOptions: {
                        initialValue: { provinciaText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto job: 
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('provincias' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.provincias);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.provinciaBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;

                //encontrar comunidades
                job = {
                    startOptions: {
                        initialValue: { comunidadText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('comunidades' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.comunidades);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.comunidadAutonomaBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;

                //encontrar viales
                job = {
                    startOptions: {
                        initialValue: { vialText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('viales' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.viales);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.vialBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;

            }

        },

        suggestions2componentSearch: function(components){
            //si el texto tiene una longitud de 2 y son numeros entonces sera un distrito
            if(components[0].length == 2 && components[0].search(/[0-9]{2}/) >= 0)
            {
                //probamos a buscar el municipio
                //para despues buscar el distrito dentro del municipio
                //encontrar municipios
                var job = {
                    startOptions: {
                        initialValue: { municipioText: components[1], distritoText: components[0] },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{startOptions, status, workflow}
                            if(this.forceStop)
                            {
                                this.status = -1;
                            }
                            else
                            {
                                this.status = 2;
                                if('distritos' in review)
                                {
                                    Buscador.singleton.addSuggestions(review.distritos);
                                }
                            }
                        }
                    },
                    status: 0
                };
                job.startOptions.context = job;
                job.workflow =
                    jWorkflow.order(this.municipioLiteralSearch, job)
                        .andThen(this.municipioBeginWithSearch, job)
                        .andThen(this.distritoLiteralSearch, job);
                this.jobs[this.jobs.length] = job;
            }

            //si el texto tiene 5 caracteres y son numéricos
            //puede que este buscando secciones
            else if(components[0].length == 5 && components[0].search(/[0-9]{3,4}/) >= 0)
            {
                //probamos a buscar el municipio
                //para despues buscar la seccion dentro del municipio
                var job = {
                        startOptions: {
                            initialValue: { municipioText: components[1], seccionText: components[0] },
                            callback: function(review){
                                //this se refiere al objeto:
                                //{startOptions, status, workflow}
                                if(this.forceStop)
                                {
                                    this.status = -1;
                                }
                                else
                                {
                                    this.status = 2;
                                    if('secciones' in review)
                                    {
                                        Buscador.singleton.addSuggestions(review.secciones);
                                    }
                                }
                            }
                        },
                        status: 0
                    };
                    job.startOptions.context = job;
                    job.workflow =
                        jWorkflow.order(this.municipioLiteralSearch, job)
                            .andThen(this.municipioBeginWithSearch, job)
                            .andThen(this.seccionLiteralSearch, job);
                    this.jobs[this.jobs.length] = job;
            }
            else
            {
                //probamos a buscar el municipio
                //para despues buscar el vial dentro del municipio
                var job = {
                        startOptions: {
                            initialValue: { municipioText: components[1], vialText: components[0] },
                            callback: function(review){
                                //this se refiere al objeto:
                                //{startOptions, status, workflow}
                                if(this.forceStop)
                                {
                                    this.status = -1;
                                }
                                else
                                {
                                    this.status = 2;
                                    if('viales' in review)
                                    {
                                        Buscador.singleton.addSuggestions(review.viales);
                                    }
                                }
                            }
                        },
                        status: 0
                    };
                    job.startOptions.context = job;
                    job.workflow =
                        jWorkflow.order(this.municipioLiteralSearch, job)
                            .andThen(this.municipioBeginWithSearch, job)
                            .andThen(this.vialBeginWithSearch, job);
                    this.jobs[this.jobs.length] = job;

            }
        	
        }, 
        
        suggestions3componentSearch: function(components){
        	//probamos a buscar el municipio
        	//para despues buscar el vial dentro del municipio
        	//y despues el portal
        	var job = {
        			startOptions: {
        				initialValue: { municipioText: components[2], vialText: components[0], portalText: components[1] },
        				callback: function(review){
        					//this se refiere al objeto:
        					//{startOptions, status, workflow}
        					if(this.forceStop)
        					{
        						this.status = -1;
        					}
        					else
        					{
        						this.status = 2;
        						if('portales' in review)
        						{
        							Buscador.singleton.addSuggestions(review.portales);
        						}
        					}
        				}
        			},
        			status: 0
        	};
        	job.startOptions.context = job;
        	job.workflow =
        		jWorkflow.order(this.municipioLiteralSearch, job)
        		.andThen(this.municipioBeginWithSearch, job)
        		.andThen(this.vialBeginWithSearch, job)
        		.andThen(this.portalLiteralSearch, job);
        	this.jobs[this.jobs.length] = job;


        	
        }, 
        
        loaderXML2JSON: function(loader){

            var featuresJSON = [];
            var features = loader.doXPathMB('//Entidad', null, [{prefix: null, uri:'http://www.idee.es/mne'}]);
            for(var i=0; i<features.length;i++)
            {

                var feature = loader.xmlNodeToJSON(features[i]);

                feature.__tipoWFS = this.tipoWFS(loader.filePath);
                //generamos el nombre a mostrar para todos los
                //fenomenos a partir de nombreEntidad/nombre
                feature.__beautifulName = feature['nombreEntidad'][0]['nombre'][0]._tagvalue.trim();

                if(feature.__tipoWFS == 'DISTRITO_CENSAL')
                {
                    //queremos que el nombre de la seccion sea como 01
                    //para ello rellenamos a 0 por la izquierda hasta 2,
                    while(feature.__beautifulName.length < 2)
                    {
                        feature.__beautifulName = '0' + feature.__beautifulName;
                    }
                }
                
                if(feature.__tipoWFS == 'SECCION_CENSAL')
                {
                    //queremos que el nombre de la seccion sea como 01001
                    //para ello rellenamos a 0 por la izquierda hasta 3,
                    //el distrito lo obtenemos de atributoEntidad/valorAtributo
                    //lo aÃ±adimos por la izquierda y rellenamos a 0 por
                    //la izquierda hasta 5
                    while(feature.__beautifulName.length < 3)
                    {
                        feature.__beautifulName = '0' + feature.__beautifulName;
                    }

                    feature.__beautifulName =
                        feature['atributoEntidad'][0]['valorAtributo'][0]._tagvalue.trim() +
                        feature.__beautifulName;

                    while(feature.__beautifulName.length < 5)
                    {
                        feature.__beautifulName = '0' + feature.__beautifulName;
                    }
                }
                
                if(feature.__tipoWFS == 'PORTAL,PK')
                {
                	//quitamos del texto de la descripcionRelacionada 'Está en la vía ' y el punto de detras '.'
                	var entidadRelacionada = feature['entidadRelacionada'][0]['descripcionRelacion'][0]._tagvalue.trim();
                	entidadRelacionada = entidadRelacionada.substring('Está en la vía '.length, entidadRelacionada.length - '.'.length);
                	feature.__beautifulName = entidadRelacionada + ', ' + feature.__beautifulName;

                }
                
                //escribimos un resumen
                feature.__text = feature.__beautifulName;

                if(feature.__tipoWFS == 'DISTRITO_CENSAL' ||
                    feature.__tipoWFS == 'SECCION_CENSAL' ||
                    feature.__tipoWFS == 'CODIGO_POSTAL' ||
                    feature.__tipoWFS == 'VIAL' ||
                    feature.__tipoWFS == 'PORTAL,PK')
                {
                    feature.__text = feature.__text + ' en ' + feature['entidadLocal'][0]['municipio'][0]._tagvalue;
                }

                if(feature.__tipoWFS == 'DISTRITO_CENSAL' ||
                    feature.__tipoWFS == 'SECCION_CENSAL' ||
                    feature.__tipoWFS == 'CODIGO_POSTAL' ||
                    feature.__tipoWFS == 'VIAL' ||
                    feature.__tipoWFS == 'PORTAL,PK' ||
                    feature.__tipoWFS == 'MUNICIPIO')
                {
                    feature.__text = feature.__text + ' (' + feature['entidadLocal'][0]['provincia'][0]._tagvalue + ')';
                }

                feature.__text = feature.__text + ' [tipo:' + feature.__tipoWFS + ']';

                featuresJSON[featuresJSON.length] = feature;
            }

            return featuresJSON;
        },

        addSuggestions: function(features){
            
            var searchCombo = this.searchForm.getCombo('searchCombo');
            //AÃ±adir sin sugerencias si no hay features
            if(features === undefined || features == null || features.length == 0)
            {
                if(searchCombo.optionsArr.length == 0)
                {
                    searchCombo.addOption('sinSugerencias', 'Sin sugerencias, pruebe una busqueda completa');
                }
            }
            else
            {
                searchCombo.deleteOption('sinSugerencias');
                for(var i=0; i<features.length; i++)
                {
                    //aï¿½adimos opciones a la lista
                    //-- todos llevaran el nombre
                    //-- distrito, seccion y codigo llevaran el municipio
                    //-- distrito, seccion, codigo y municipio llevaran provincia
                    //-- todos llevaran el tipo

                    //aï¿½adimos feature a la lista desplegable
                    searchCombo.addOption(features[i].__tipoWFS + '.' + i, features[i].__text);
                    this.featureList[features[i].__tipoWFS + '.' + i] = features[i];
                    
                }
            }
            
            //calculo tamaÃ±o de la lista
            //TODO cambiar a tagname div y despues en bucle buscar a.className
            // document.getElementsByTagName('div')[0].className
            
            var dropdown = document.body.getElementsByClassName('dhx_combo_list')[0];
            var dropdownHeight = 0;
            for(var i=0; i< dropdown.childNodes.length; i++)
            {
                dropdownHeight += dropdown.childNodes[i].offsetHeight;
            }
            searchCombo.setOptionHeight(dropdownHeight);
            searchCombo.openSelect();
        },

        //TODO cancelar todas las peticiones en curso
        cancelRunningJobs: function(){

            //cancelar peticiones pendientes
            for(var i=0; i<this.jobs.length; i++)
            {
                this.jobs[i].forceStop = true;
            }


        },

        checkJobs: function(){

            var waitingToStart = 0;
            var running = 0;
            var finished = 0;

            for(var i=0; i<this.jobs.length; i++)
            {
                switch(this.jobs[i].status)
                {
                    case 0:
                        //waitingToStart
                        waitingToStart++;
                        break;
                    case 1:
                        //running
                        running++;
                        break;
                    case 2:
                        //finished
                        finished++;
                        break;
                }
            }

            return running;
        },

        tipoWFS: function(url){
            if(url.search(/wfs-comunidad/) >= 0)
            {
                return 'COMUNIDAD_AUTONOMA';
            }
            else if(url.search(/wfs-provincia/) >= 0)
            {
                return 'PROVINCIA';
            }
            else if(url.search(/wfs-municipio/) >= 0)
            {
                return 'MUNICIPIO';
            }
            else if(url.search(/wfs-distrito/) >= 0)
            {
                return 'DISTRITO_CENSAL';
            }
            else if(url.search(/wfs-seccion/) >= 0)
            {
                return 'SECCION_CENSAL';
            }
            else if(url.search(/wfs-codigo/) >= 0)
            {
                return 'CODIGO_POSTAL';
            }
            else if(url.search(/wfs-vial/) >= 0)
            {
                return 'VIAL';
            }
            else if(url.search(/wfs-portal/) >= 0)
            {
            	return 'PORTAL,PK';
            }
        },

        normalizeString: function(str){

            var tmp;

            tmp = str.toLocaleUpperCase();
            tmp = tmp.replace('À', 'A');
            tmp = tmp.replace('Â', 'A');
            tmp = tmp.replace('Á', 'A');
            tmp = tmp.replace('Ä', 'A');
            tmp = tmp.replace('È', 'E');
            tmp = tmp.replace('Ê', 'E');
            tmp = tmp.replace('É', 'E');
            tmp = tmp.replace('Ë', 'E');
            tmp = tmp.replace('Ì', 'I');
            tmp = tmp.replace('Î', 'I');
            tmp = tmp.replace('Í', 'I');
            tmp = tmp.replace('Ï', 'I');
            tmp = tmp.replace('Ò', 'O');
            tmp = tmp.replace('Ô', 'O');
            tmp = tmp.replace('Ó', 'O');
            tmp = tmp.replace('Ö', 'O');
            tmp = tmp.replace('Ù', 'U');
            tmp = tmp.replace('Û', 'U');
            tmp = tmp.replace('Ú', 'U');
            tmp = tmp.replace('Ü', 'U');

            return tmp;
        },

        levenshteinDistance: function(a, b){

            var i, j, r=[];

            r[0] = [];
            r[0][0] = 0;

            for(i=1; i<=a.length; i++) {
                r[i] = [];
                r[i][0] = i;

                for(j=1; j<=b.length; j++) {
                    r[0][j] = j;
                    r[i][j] = Math.min(
                    r[i-1][j]+1,
                    r[i][j-1]+1,
                    r[i-1][j-1] + (a[i-1]!==b[j-1])
                    );
                }
            }

            return r[a.length][b.length];
        },
        
        esmunicipio: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            var url = 'http://www.cartociudad.es/wfs-municipio/services?' +
            'SERVICE=WFS&' +
            'VERSION=1.1.0&' +
            'REQUEST=GetFeature&' +
            'RESULTTYPE=hits&' +
            'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
            'TYPENAME=app:Entidad&' +
            'FILTER=<Filter>' + 
            	'<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!">' +
            	'<PropertyName>nombreEntidad/nombre</PropertyName>' +
            	'<Literal>*' + data.text + '*</Literal>' +
            	'</PropertyIsLike>' +
            	'</Filter>';
            
            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                	
                    data.municipioHits = loader.doXPathMB('./ResultCollection', null, [{prefix:null, uri:'http://www.idee.es/mne'}])[0].attributes['numberOfFeatures'].value;
                    
                }
                baton.pass(data);
            });
        },
        
        esprovincia: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            var url = 'http://www.cartociudad.es/wfs-provincia/services?' +
            'SERVICE=WFS&' +
            'VERSION=1.1.0&' +
            'REQUEST=GetFeature&' +
            'RESULTTYPE=hits&' +
            'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
            'TYPENAME=app:Entidad&' +
            'FILTER=<Filter>' + 
            	'<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!">' +
            	'<PropertyName>nombreEntidad/nombre</PropertyName>' +
            	'<Literal>*' + data.text + '*</Literal>' +
            	'</PropertyIsLike>' +
            	'</Filter>';
            
            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                	
                    data.provinciaHits = loader.doXPathMB('./ResultCollection', null, [{prefix:null, uri:'http://www.idee.es/mne'}])[0].attributes['numberOfFeatures'].value;
                    
                }
                baton.pass(data);
            });
        },

        escomunidad: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            var url = 'http://www.cartociudad.es/wfs-comunidad/services?' +
            'SERVICE=WFS&' +
            'VERSION=1.1.0&' +
            'REQUEST=GetFeature&' +
            'RESULTTYPE=hits&' +
            'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
            'TYPENAME=app:Entidad&' +
            'FILTER=<Filter>' + 
            	'<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!">' +
            	'<PropertyName>nombreEntidad/nombre</PropertyName>' +
            	'<Literal>*' + data.text + '*</Literal>' +
            	'</PropertyIsLike>' +
            	'</Filter>';
            
            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                	
                    data.comunidadHits = loader.doXPathMB('./ResultCollection', null, [{prefix:null, uri:'http://www.idee.es/mne'}])[0].attributes['numberOfFeatures'].value;
                    
                }
                baton.pass(data);
            });
        },

        esvial: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();
                return;
            }
            
            var url = 'http://www.cartociudad.es/wfs-vial/services?' +
            'SERVICE=WFS&' +
            'VERSION=1.1.0&' +
            'REQUEST=GetFeature&' +
            'RESULTTYPE=hits&' +
            'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
            'TYPENAME=app:Entidad&' +
            'FILTER=<Filter>' + 
            	'<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!">' +
            	'<PropertyName>nombreEntidad/nombre</PropertyName>' +
            	'<Literal>*' + data.text + '*</Literal>' +
            	'</PropertyIsLike>' +
            	'</Filter>';
            
            var request;

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }

            baton.take();

            dhtmlxAjax.get(request,function(loader){

                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                	
                    data.vialHits = loader.doXPathMB('./ResultCollection', null, [{prefix:null, uri:'http://www.idee.es/mne'}])[0].attributes['numberOfFeatures'].value;
                    
                }
                baton.pass(data);
            });
        },

    }
};
