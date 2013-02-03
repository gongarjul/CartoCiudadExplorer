/*
 * singleton: Buscador
 *
 */
 
var Buscador = {

    singleton: {
    
        //referencia a formulario dhtmlx
        searchForm: null,
   
        //jobs
        jobs: [],
        
        //eventId necesario para activar desactivar el onOpen del combo
        eventId: null,
        
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
                        { type:"combo" , name:"searchCombo", labelWidth:0, inputWidth:700, labelLeft:5, labelTop:5, inputLeft:100, inputTop:15  }
                    ];
            
            //dependiendo del tipo del par�metro instanciamos el formulario dhtmlx
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
            //se a�aden los eventos para el combo:
            var searchCombo = this.searchForm.getCombo('searchCombo');
            
            //-- controlar cuando debe estar abierta y cuando no la lista
            this.eventId = searchCombo.attachEvent('onOpen', function(){
                Buscador.singleton.openCloseList('onOpen');
            });
            
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
            searchCombo.attachEvent('onKeyPressed', function(keyCode){
                Buscador.singleton.searchCombo_onKeyPressed(keyCode);
            });
            
            searchCombo.attachEvent('onChange', function(){

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
                        feature.__text = this.getSelectedText();
                        resultsArea.singleton.addResults([feature]);
                    }
                }
                else
                {
                    //TODO falta implementar que el usuario no seleccione
                    //una opcion si no que pulse enter o ¿salga del control?
                    
                }

            });
            
            window.setInterval(function(){

                //por cada x tiempo
                //1.-- comprobar si hay que mostrar el 'reloj'

                document.getElementById('inProgress').style.visibility =
                    Buscador.singleton.checkJobs()>0?'visible':'hidden';

                //2.-- si hace mas de 500 ms desde que se pulso la ultima tecla
                //      entonces lanzar los workflows
                if((new Date()).getTime() - Buscador.singleton.lastKeyAt > 500)
                {

                    for(i=0; i<Buscador.singleton.jobs.length; i++)
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
            
            
        },

        /*
         * funci�n que gestiona si la lista debe
         * estar desplegada o no
         */
        openCloseList: function(evento){
            
            var searchCombo = this.searchForm.getCombo('searchCombo');
            texto = searchCombo.getComboText();
            
            //comprobar si es necesaria cerrar la lista
            if(texto.length < 3 && texto.search(/[0-9]{2}/) < 0)
            {
                searchCombo.closeAll();
            }
            else if(evento == 'onKeyPressed')
            {
                searchCombo.detachEvent(this.eventId);
                searchCombo.openSelect();
                this.eventId = searchCombo.attachEvent('onOpen', function(){
                Buscador.singleton.openCloseList();
                });
            }
        },
        
        searchCombo_onKeyPressed: function(keyCode){
        
            this.lastKeyAt = (new Date()).getTime();
            //vamos a analizar el texto que esta escribiendo el usuario
            var searchCombo = this.searchForm.getCombo('searchCombo');
            var texto = searchCombo.getComboText();
            //antes de a�adir opciones
            //-- cancelamos cualquier peticion en curso
            //-- borramos las anteriores
            //-- la lista de features
            //-- la lista desplegable
            this.cancelRunningJobs();
            this.jobs = [];
            this.featureList = [];
            searchCombo.clearAll(false);

            this.openCloseList('onKeyPressed');
            
            var components = texto.split(/[,]/);
            
            if(components.length ==1)
            {
                this.singleComponentSearch(components[0].trim());
            }

        },
  
        distritoLiteralSearch: function(data, baton){
        
            if(this.forceStop)
            {
                baton.drop();return;
            }

            var __buscador = Buscador.singleton;
            
            var url = 'http://www.cartociudad.es/wfs-distrito/services?' + 
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.distritoText + '</Literal></PropertyIsEqualTo></Filter>';
            
            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var distritos = __buscador.loaderXML2JSON(loader);
                    if(distritos.length > 0)
                    {
                        if(!data.distritos)
                        {
                            data.distritos = [];
                        }
                        data.distritos = data.distritos.concat(distritos);
                    }
                }
                baton.pass(data)
            });           
        },

        seccionLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();return;
            }
        
            var __buscador = Buscador.singleton;
            
            var url = 'http://www.cartociudad.es/wfs-seccion/services?' + 
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><And>' +
                    '<PropertyIsEqualTo><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.seccionText.substring(2,5) + '</Literal></PropertyIsEqualTo>' +
                    '<PropertyIsEqualTo><PropertyName>atributoEntidad/valorAtributo</PropertyName><Literal>' + data.seccionText.substring(0,2) + '</Literal></PropertyIsEqualTo>' +
                '</And></Filter>';

            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var secciones = __buscador.loaderXML2JSON(loader);
                    if(secciones.length > 0)
                    {
                        if(!data.secciones)
                        {
                            data.secciones = [];
                        }
                        data.secciones = data.secciones.concat(secciones);
                    }
                }
                baton.pass(data)
            });           
        },

        codigoLiteralSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();return;
            }
        
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
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var codigos = __buscador.loaderXML2JSON(loader);
                    if(codigos.length > 0)
                    {
                        if(!data.codigos)
                        {
                            data.codigos = [];
                        }
                        data.codigos = data.codigos.concat(codigos);
                    }
                }
                baton.pass(data)
            });           
        },
        
        vialBeginWithSearch: function(data, baton){
        
            if(this.forceStop)
            {
                baton.drop();return;
            }
        
            var __buscador = Buscador.singleton;
            
            var url = 'http://www.cartociudad.es/wfs-vial/services?' + 
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + data.vialText + '*</Literal></PropertyIsLike></Filter>';

            var request;
            
            if(typeof proxyHost != 'undefined')
            {
                request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(url);
            }else{
                request = url;
            }
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var viales = __buscador.loaderXML2JSON(loader);
                    if(viales.length > 0)
                    {
                        if(!data.viales)
                        {
                            data.viales = [];
                        }
                        data.viales = data.viales.concat(viales);
                    }
                }
                baton.pass(data)
            });           
        },

        municipioLiteralSearch: function(data, baton){
            
            if(this.forceStop)
            {
                baton.drop();return;
            }
            
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
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var municipios = __buscador.loaderXML2JSON(loader);
                    if(municipios.length > 0)
                    {
                        if(!data.municipios)
                        {
                            data.municipios = [];
                        }
                        data.municipios = data.municipios.concat(municipios);
                    }
                }
                baton.pass(data)
            });           
        },

        municipioBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();return;
            }

            var __buscador = Buscador.singleton;
            
            var url = 'http://www.cartociudad.es/wfs-municipio/services?' + 
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
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
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var municipios = __buscador.loaderXML2JSON(loader);
                    if(municipios.length > 0)
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
        
        provinciaBeginWithSearch: function(data, baton){

            if(this.forceStop)
            {
                baton.drop();return;
            }

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
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var provincias = __buscador.loaderXML2JSON(loader);
                    if(provincias.length > 0)
                    {
                        if(!data.provincias)
                        {
                            data.provincias = [];
                        }
                        data.provincias = data.provincias.concat(provincias);
                    }
                }
                baton.pass(data)
            });           
        },
        
        comunidadAutonomaBeginWithSearch: function(data, baton){
            
            if(this.forceStop)
            {
                baton.drop();return;
            }

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
            
            baton.take()

            dhtmlxAjax.get(request,function(loader){
                
                if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                {
                    var comunidades = __buscador.loaderXML2JSON(loader);
                    if(comunidades.length > 0)
                    {
                        if(!data.comunidades)
                        {
                            data.comunidades = [];
                        }
                        data.comunidades = data.comunidades.concat(comunidades);
                    }
                }
                baton.pass(data)
            });           
        },

        componentesDireccion: function(texto){
        
            var direccion = {municipio:null, vial:null, numero:null};
            
            var palabras = texto.split(/[,]/);
            
            for(var i = 0; i < palabras.length; i++)
            {
                palabras[i] = palabras[i].trim();
            }
            
            if(palabras.length == 2)
            {
                //combinación de vial, municipio
                //probamos con busqueda por aproximacion
                var url = 'http://www.cartociudad.es/wfs-vial/services?' + 
                'SERVICE=WFS&' +
                'VERSION=1.1.0&' +
                'REQUEST=GetFeature&' +
                'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                'TYPENAME=app:Entidad&' +
                'FILTER=<Filter><And>' +
                    '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + palabras[0] + '*</Literal></PropertyIsLike>' +
                    '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>entidadLocal/municipio</PropertyName><Literal>' + palabras[1] + '*</Literal></PropertyIsLike>' + 
                    '</And></Filter>';

                this.requests[this.requests.length] = {url: url, callback: Buscador.singleton.addSuggestions, dtmlXMLLoader: null};

                //var url = 'http://www.cartociudad.es/wfs-vial/services?' + 
                //'SERVICE=WFS&' +
                //'VERSION=1.1.0&' +
                //'REQUEST=GetFeature&' +
                //'NAMESPACE=xmlns(app=http://www.deegree.org/app)&' +
                //'TYPENAME=app:Entidad&' +
                //'FILTER=<Filter><And>' +
                //    '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>nombreEntidad/nombre</PropertyName><Literal>' + palabras[0] + '*</Literal></PropertyIsLike>' +
                //    '<PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><PropertyName>entidadLocal/municipio</PropertyName><Literal>' + palabras[1] + '*</Literal></PropertyIsLike>' + 
                //    '</And></Filter>';
                //
                //this.requests[this.requests.length] = {url: url, dtmlXMLLoader: null};
                
            }
            
            if(palabras.length == 3)
            {
            
            }
            
        },
        
        f: function(a){
            if(!a) return [[1]];
            var b = [];
            var c;
            var nelemento = a[0].length + 1;
            for(var j=0; j<nelemento; j++)
            {
                for(var i=0; i<a.length; i++)
                {
                    c = a[i].slice(0);
                    c.splice(j, 0, nelemento);
                    b[b.length] = c;
                }
            }
            //console.log(b);
            return b;
        },
            
        singleComponentSearch: function(text){
            //no es logico buscar con un solo componente:
            //  - distritos
            //  - secciones
            //  - portales
            /*
            //si el texto tiene una longitud de 2 y son numeros entonces sera un distrito
            if(texto.length == 2 && texto.search(/[0-9]{2}/) >= 0)
            {
                //rellenamos combo con distritos
                this.distritoLiteralSearch(texto, Buscador.singleton.addSuggestions);
                
            }
            
            //si el texto tiene 3 o 4 caracteres y son num�ricos
            //puede que este buscando distritos o codigos postales por aproximaci�n
            else if(texto.length >= 3 && texto.length < 5 && texto.search(/[0-9]{3,4}/) >= 0)
            {
                //rellenamos combo por aproximacion con secciones y codigos postales
                this.seccionBeginWithSearch(texto, Buscador.singleton.addSuggestions);
                this.codigoPostalBeginWithSearch(texto, Buscador.singleton.addSuggestions);
            }
            */
            
            //si el texto tiene 5 caracteres y son numeros la busqueda será de codigo postal
            if(texto.length == 5 && texto.search(/[0-9]{5}/) >= 0)
            {
                //rellenamos combo con codigos postales
                var job = { 
                    startOptions: {
                        initialValue: { codigoText: texto },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{initialValue, status, workflow}
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
                        }, 
                    },
                    status: 0 
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.codigoLiteralSearch, job);
                this.jobs[this.jobs.length] = job;
            }
            else if(texto.length >= 3)
            {
                //encontrar municipios
                var job = { 
                    startOptions: {
                        initialValue: { municipioText: texto },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{initialValue, status, workflow}
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
                        }, 
                    },
                    status: 0 
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.municipioLiteralSearch, job).andThen(this.municipioBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;

                //encontrar provincias
                job = { 
                    startOptions: {
                        initialValue: { provinciaText: texto },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{initialValue, status, workflow}
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
                        }, 
                    },
                    status: 0 
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.provinciaBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;
                
                //encontrar comunidades
                job = { 
                    startOptions: {
                        initialValue: { comunidadText: texto },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{initialValue, status, workflow}
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
                        }, 
                    },
                    status: 0 
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.comunidadAutonomaBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;
                
                //encontrar viales
                job = { 
                    startOptions: {
                        initialValue: { vialText: texto },
                        callback: function(review){
                            //this se refiere al objeto:
                            //{initialValue, status, workflow}
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
                        }, 
                    },
                    status: 0 
                };
                job.startOptions.context = job;
                job.workflow = jWorkflow.order(this.vialBeginWithSearch, job);
                this.jobs[this.jobs.length] = job;
                
            }            
        
        },

        loaderXML2JSON: function(loader){
        
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
                    //lo añadimos por la izquierda y rellenamos a 0 por
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

                features[i] = feature;
            }
            
            return features;
        },
        
        addSuggestions: function(features){

            for(var i=0; i<features.length; i++)
            {
                //a�adimos opciones a la lista
                //-- todos llevaran el nombre
                //-- distrito, seccion y codigo llevaran el municipio
                //-- distrito, seccion, codigo y municipio llevaran provincia
                //-- todos llevaran el tipo

                //a�adimos feature a la lista desplegable
                var txtOpcion = features[i].__beautifulName;
                
                if(features[i].__tipoWFS == 'DISTRITO_CENSAL' ||
                    features[i].__tipoWFS == 'SECCION_CENSAL' ||
                    features[i].__tipoWFS == 'CODIGO_POSTAL' ||
                    features[i].__tipoWFS == 'VIAL')
                {
                    txtOpcion = txtOpcion + ' en ' + features[i]['entidadLocal'][0]['municipio'][0]._tagvalue;
                }
                
                if(features[i].__tipoWFS == 'DISTRITO_CENSAL' ||
                    features[i].__tipoWFS == 'SECCION_CENSAL' ||
                    features[i].__tipoWFS == 'CODIGO_POSTAL' ||
                    features[i].__tipoWFS == 'VIAL' ||
                    features[i].__tipoWFS == 'MUNICIPIO')
                {
                    txtOpcion = txtOpcion + ' (' + features[i]['entidadLocal'][0]['provincia'][0]._tagvalue + ')';
                }
                
                txtOpcion = txtOpcion + ' [tipo:' + features[i].__tipoWFS + ']'
            
                var searchCombo = this.searchForm.getCombo('searchCombo');
                searchCombo.addOption(features[i].__tipoWFS + '.' + i, txtOpcion);
                this.featureList[features[i].__tipoWFS + '.' + i] = features[i];
            }
            
        },
        
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
        }
    }
};
