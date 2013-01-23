/*
 * AddLayerDialogSINGLETON.js define una clase para añadir
 * 'capas' procedentes de un servicio WMS a un objeto
 * Map de OpenLayers
 */

// TODO
// 0.-- UTILIZAR xmlNodeToJSON
// 1.-- cambiar nombre de AddLayerDialog.singleton a ign.AddLayerDialog?
//      meter un espacio de nombre unico para todo?
// 2.-- implementar la seleccion de estilos, mirar standard
// 3.-- si en el capabilities aparecen las etiquetas layer, etc, etc, con prefijos
//      estariamos jodidos

var AddLayerDialog = {

    singleton: {

        //nodos no seleccionables 
        notCheckeableNodeNames: ['Layers', 'Styles'],
      
        //formulario para la conexion con el servidor
        connectToServerForm: null,
        //arbol con las capas y estilos 
        wmsLayersTree: null,
        //formulario para añadir una capa a nuestro mapa
        addLayerForm: null,
        //barra de estado para informar
        addLayerStatusBar: null,
        
        //mapa al que se le añadira la capa
        map: null,

        showModal: function(map){

            //OpenLayers.map
            this.map = map;
             
            //instanciamos una fabrica de ventanas
            var windows = new dhtmlXWindows();
            //creamos una ventana
            var addLayer = windows.createWindow('addLayer', 0, 0, 470, 550);
            
            //añadimos un conjunto de pestañas, en cada pestaña habrá un formato
            var formats = addLayer.attachTabbar();
            formats.setImagePath('../api/dhtmlx-3.5/dhtmlxTabbar/codebase/imgs/');

            //--formato WMS
            formats.addTab('wmsTab','WMS','40');
            var wmsTab = formats.cells('wmsTab');
            formats.setTabActive('wmsTab');

            //añadimos un layout que contendra:
            //a. el formulario para conectarnos al servidor
            //b. el arbol con las capas
            //c. el formaulario para añadir la capa al mapa
            var wmsLayout = wmsTab.attachLayout('3E');

            //creamos la celda a
            var a = wmsLayout.cells('a');
            //indicamos la altura, ocultamos la cabecera y fijamos el tamaño de la celda
            a.setHeight('185');
            a.hideHeader();
            a.fixSize(1,1);

            //esquema del formulario connectToServerFrom
            var str = [
                { type:"settings" , labelWidth:60, inputWidth:250, position:"absolute"  },
                { type:"button" , name:"connectButton", label:"Conectar", value:"Conectar", width:"85", inputWidth:85, inputLeft:355, inputTop:5  },
                { type:"input" , name:"abstractInput", label:"Resumen", rows:"6", labelWidth:440, inputWidth:440, inputHeight:129, readonly:true, labelLeft:5, labelTop:25, inputLeft:5, inputTop:46  },
                { type:"combo" , name:"urlCombo", label:"Servidor:", validate:"NotEmpty", labelAlign:"left", inputWidth:270, labelLeft:5, labelTop:5, inputLeft:70, inputTop:5, options:[
                    { value:"http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx", text:"http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx" },
                    { value:"http://www.ign.es/wms-inspire/ign-base", text:"http://www.ign.es/wms-inspire/ign-base" },
                    { value:"http://www.idee.es/wms/PNOA/PNOA", text:"http://www.idee.es/wms/PNOA/PNOA" },
                    { value:"http://www.cartociudad.es/wms/CARTOCIUDAD/CARTOCIUDAD", text:"http://www.cartociudad.es/wms/CARTOCIUDAD/CARTOCIUDAD" }
                    ]
                }
            ];
            //instanciamos el formulario
            this.connectToServerForm = a.attachForm(str);
            //añadimos el evento onButtonClick para detectar cuando se pulsa el boton conectar
            this.connectToServerForm.attachEvent('onButtonClick', function(name, command){
                //this se refiere a connectToServerForm
                AddLayerDialog.singleton.connectToServerForm_onButtonClick(name, command);
            });

            //creamos la celda b
            var b = wmsLayout.cells('b');
            //indicamos titulo, altura y fijamos el tamaño de la celda
            b.setText('Capas & Estilos');
            b.setHeight('210');
            b.fixSize(1,1);
            
            //instanciamos un arbol vacio
            this.wmsLayersTree = b.attachTree();
            //indicamos la ruta a los gif que utilizara el arbol
            this.wmsLayersTree.setImagePath('../api/dhtmlx-3.5/dhtmlxTree/codebase/imgs/csh_dhx_skyblue/');
            //añadimos checkboxes en las ramas
            this.wmsLayersTree.enableCheckBoxes(true, false);
            //añadimos el evento onBeforeCheck para controlar si dejamos checkear o no esa rama
            //en la version profesional con ocultarlos sería suficiente
            this.wmsLayersTree.attachEvent('onBeforeCheck', function(id, state){
                //this se refiere a wmsLayersTree
                return AddLayerDialog.singleton.wmsLayersTree_onBeforeCheck(id, state);
            });
            
            //creamos la celda c
            var c = wmsLayout.cells('c');
            //indicamos la altura, ocultamos la cabecera y fijamos el tamaño de la celda
            c.setHeight('80');
            c.hideHeader();
            c.fixSize(1,1);
            
            //esquema del formulario addLayerForm
            var str = [
                { type:"settings" , labelWidth:80, inputWidth:250, position:"absolute"  },
                { type:"input" , name:"layerName", label:"Nombre:", validate:"NotEmpty", inputWidth:270, required:true, labelLeft:5, labelTop:5, inputLeft:70, inputTop:5  },
                { type:"button" , name:"addLayer", label:"Añadir", value:"Añadir", width:"85", inputWidth:85, inputLeft:355, inputTop:5  },
                { type:"btn2state" , name:"tiledBtn2state", label:"Peticiones teseladas:", labelWidth:120, labelAlign:"left", inputWidth:170, labelLeft:150, labelTop:30, inputLeft:275, inputTop:25  },
                { type:"btn2state" , name:"transparentBtn2state", label:"Transparente:", labelAlign:"left", inputWidth:50, labelLeft:5, labelTop:30, inputLeft:90, inputTop:25  }
            ];
            //instanciamos el formulario
            this.addLayerForm = c.attachForm(str);
            //añadimos el evento onButtonClickpara detectar cuando se pulsa el botón añadir
            this.addLayerForm.attachEvent('onButtonClick', function(name, command){
                //this se refiere a addLayerForm
                AddLayerDialog.singleton.addLayerForm_onButtonClick(name, command);
            });

            //añadimos un statusbar para mantener al usuario informado
            this.addLayerStatusBar = addLayer.attachStatusBar();
            this.addLayerStatusBar.setText('');

            //terminamos de configurar el aspecto y el comportamiento de la ventana
            addLayer.setText('Add Layer');
            addLayer.denyResize();
            addLayer.denyMove();
            addLayer.setModal(1);
            addLayer.centerOnScreen();
            addLayer.button('help').show();
            addLayer.button('help').enable();
            addLayer.button('park').hide();
            addLayer.button('minmax1').hide();
        },
    
        connectToServerForm_onButtonClick: function(name, command){
    
            if(this.connectToServerForm.validateItem('urlCombo'))
            {
                //se ha pulsado el botón conectar y urlCombo tiene una dirección
                var server = this.connectToServerForm.getCombo('urlCombo').getComboText()
                this.addLayerStatusBar.setText('Conectando con: ' + server);
                
                //componemos la peticion
                var request;
                        
                if(typeof proxyHost != 'undefined')
                {
                    request = proxyHost + '?' + proxyHostOptions + '&url=' + encodeURIComponent(server+'?service=WMS&request=GetCapabilities');
                }else{
                    request = server+'?service=WMS&request=GetCapabilities';
                }

                dhtmlxAjax.get(request,function(loader){
                
                    if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
                    {   
                        AddLayerDialog.singleton.addLayerStatusBar.setText('Conexión establecida, procesando respuesta');

                        //parseamos el xml devuelto para mostrar en el dialogo
                        //--el abstract del capabilities en el cuadro de texto
                        var wmsAbstract = loader.doXPathMB('//Service/Abstract', null, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
                        AddLayerDialog.singleton.connectToServerForm.getInput('abstractInput').value = 
                            wmsAbstract[0].text? wmsAbstract[0].text: wmsAbstract[0].textContent;
                        //--la estructura de capas y estilos en arbol
                        AddLayerDialog.singleton.buildWMSLayersTree(loader);
                        AddLayerDialog.singleton.addLayerStatusBar.setText('');
                        AddLayerDialog.singleton.addLayerForm.unlock()
                    }else{
                        AddLayerDialog.singleton.addLayerStatusBar.setText('No se ha obtenido una respuesta valida');
                    }
                });
                
            }else{
                this.addLayerStatusBar.setText('Por favor introduzca una URL o seleccione una de la lista');
            }
            
        },
    
        buildWMSLayersTree: function(loader){
        
            //vamos a seleccionar el primer elemento layer de la seccion cacpabilities
            var layer  = loader.doXPathMB('//Capability/Layer', null, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            
            //conformamos un arbol de objetos con los elementos
            //layer y style del documento capabilities
            this.processLayerNode(loader, layer[0]);

        },
        
        processLayerNode: function(loader, layer, id){
        
            if(!id)
            {
                var id = 1;
            }
        
            var title = loader.doXPathMB('./Title', layer, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(title.length > 0)
            {
                title = title[0].text?title[0].text:title[0].textContent;
            }else{
                title = null;
            }
            
            var name = loader.doXPathMB('./Name', layer, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(name.length > 0)
            {
                name = name[0].text?name[0].text:name[0].textContent;
            }else{
                name = null;
            }
            
            //una vez tenemos el title y opcionalmente el name añadimos una rama al arbol
            var rama = '';
            if(title)
            {
                rama = title;
            }
            if(name)
            {
                rama = rama + ' [' + name + ']';
            }
            
            if(id=='1')
            {
                this.wmsLayersTree.deleteChildItems('1');
                this.wmsLayersTree.deleteItem('1',false);
                this.wmsLayersTree.loadXMLString('<tree id="0"><item text="' + rama + '" id="1"></item></tree>');
            }else{
                this.wmsLayersTree.insertNewItem(id.substr(0,id.lastIndexOf('-')), id, rama, 0, 0, 0, 0, 'SELECT');
            }
            
            //añadimos tantas ramas hijas como nodos Style haya
            var styles = loader.doXPathMB('./Style', layer, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(styles.length > 0)
            {
                this.wmsLayersTree.insertNewItem(id, id + '-1','Styles (' + styles.length + ')', 0, 0, 0, 0, 'SELECT');
                for(var i=0; i<styles.length; i++)
                {
                    this.processStyleNode(loader, styles[i], id + '-1-' + i)
                }
                
            }

            var layers = loader.doXPathMB('./Layer', layer, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(layers.length > 0)
            {
                this.wmsLayersTree.insertNewItem(id, id + '-2','Layers (' + layers.length + ')', 0, 0, 0, 0, 'SELECT');
                for(var i=0; i<layers.length; i++)
                {
                    this.processLayerNode(loader, layers[i], id + '-2-' + i)
                }
            }
        },
    
        processStyleNode: function(loader, style, id){
        
            var title = loader.doXPathMB('./Title', style, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(title.length > 0)
            {
                title = title[0].text?title[0].text:title[0].textContent;
            }else{
                title = null;
            }
            
            var name = loader.doXPathMB('./Name', style, [{prefix:null, uri:'http://www.opengis.net/wms'}]);
            if(name.length > 0)
            {
                name = name[0].text?name[0].text:name[0].textContent;
            }else{
                name = null;
            }
            
            var rama = '';
            if(title)
            {
                rama = title;
            }
            if(name)
            {
                rama = rama + ' [' + name + ']';
            }

            this.wmsLayersTree.insertNewItem(id.substr(0,id.lastIndexOf('-')), id,rama, 0, 0, 0, 0, 'SELECT');
        },
    
        wmsLayersTree_onBeforeCheck: function(id, state){
            //al ser la edicion standard de dhtmlx no podemos ocultar los checkboxes
            //lo que hacemos es comprobar antes del check si es un nodo seleccionable

            var allowsCheck = true;
            
            //no se permite checkear la primera rama (primer elemento layer)
            //ni ninguno de sus estilos
            if(id=='1' || id.search('^1-1-')>=0)
            {
                allowsCheck = false;
                return allowsCheck;
            }
            
            //tampoco se permite checkear nada que empiece como las cadenas
            //del atributo notCheckeableNodeNames
            for(var i=0;i<this.notCheckeableNodeNames.length;i++)
            {
                if(this.wmsLayersTree.getItemText(id).search('^' + this.notCheckeableNodeNames[i])>=0)
                {
                    allowsCheck = false;
                    break;
                }
            }
            return allowsCheck;
        },
        
        addLayerForm_onButtonClick: function(name, command){
            //comprobamos que sigue habiendo una url
            if(!this.connectToServerForm.validateItem('urlCombo'))
            {
                this.addLayerStatusBar.setText('Por favor introduzca una URL o seleccione una de la lista');
                return;
            }
            
            var url = this.connectToServerForm.getCombo('urlCombo').getComboText();
            
            //comprobamos que hay un nombre escrito para la capa
            if(!this.addLayerForm.validateItem('layerName'))
            {
                this.addLayerStatusBar.setText('Por favor introduzca un nombre para la capa');
                return;
            }
            
            var layerName = this.addLayerForm.getInput('layerName').value;
            
            //comprobamos que existen layers marcados
            //obtenemo una lista separada por ','
            var layers = this.wmsLayersTree.getAllChecked();
            
            if(layers == '')
            {
                this.addLayerStatusBar.setText('Por favor seleccione alguna capa en el arbol Capas & Estilos');
                return;
            }
            
            layers = layers.split(',');
            for (var i = layers.length-1; i >= 0; i--) {
                //si el checked es hijo de un Layers entonces añadir a layers
                if(this.wmsLayersTree.getItemText(this.wmsLayersTree.getParentId(layers[i])).search('^Layers')>=0)
                {
                    layers[i] = this.wmsLayersTree.getItemText(layers[i]);
                    layers[i] = layers[i].substring(layers[i].search(/\[/)+1, layers[i].search(/\]/));
                }else{
                    layers.splice(i, 1);
                }
            }

            if(layers.length == 0)
            {
                this.addLayerStatusBar.setText('Por favor seleccione alguna capa en el arbol Capas & Estilos además de los estilos');
                return;
            }
            
            //creamos una cadena con los nombre de las capas
            layers=''+layers;
            
            //recopilamos la informacion sobre tranparencia y teselamiento
            var transparent = this.addLayerForm.getItemValue('transparentBtn2state')==0? false : true;
            var singleTile = !(this.addLayerForm.getItemValue('tiledBtn2state')==0? false : true);
            
            //añadimos al mapa
            this.map.addLayer(new OpenLayers.Layer.WMS(layerName, url, {layers: layers, transparent:transparent},{singleTile: singleTile}));
        }

    }
}
