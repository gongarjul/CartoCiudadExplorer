/*
 * AddWMSLayerDialog.js define una clase para añadir
 * 'capas' procedentes de un servicio WMS a un objeto
 * Map de OpenLayers
 */

 
 //TODO transform in a singleton
 //TODO use loader.XPATH para build wmslayerstree
 
/*
 * constantes
 */
 AddLayerDialog.notCheckeableNodeNames = ['Layers', 'Styles'];
/*
 *propiedades de clase
 */
 AddLayerDialog.connectToServerForm = null;
 AddLayerDialog.addLayerForm = null;
 AddLayerDialog.wmsLayersTree = null;
 AddLayerDialog.addLayerStatusBar = null;
 AddLayerDialog.map = null;
 
 
/*
 * Constructora
 */
function AddLayerDialog()
{
    //empty
}

AddLayerDialog.showModal = function(map)
{
    //OpenLayers.map
     AddLayerDialog.map = map;
     
    //instanciamos una fabrica de ventanas
	var windows = new dhtmlXWindows();
    //creamos una ventana
	var addLayer = windows.createWindow('addLayer', 0, 0, 470, 550);
    //añadimos un conjunto de pestañas
	var formats = addLayer.attachTabbar();
	formats.setImagePath('../api/dhtmlx-3.5/dhtmlxTabbar/codebase/imgs/');
    //en cada pestaña habrá un formato
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
            { value:"http://www.idee.es/wms/PNOA/PNOA", text:"http://www.idee.es/wms/PNOA/PNOA" }
			]
        }
	];
    
	AddLayerDialog.connectToServerForm = a.attachForm(str);
    //añadimos el controlador
    AddLayerDialog.connectToServerForm._controller = AddLayerDialog;
    //añadimos el evento onButtonClick para detectar cuando se pulsa el boton conectar
	AddLayerDialog.connectToServerForm.attachEvent('onButtonClick', function(name, command){
		//this se refiere a connectToServerForm
        this._controller.connectToServerForm_onButtonClick(name, command);
	});

    //creamos la celda b
	var b = wmsLayout.cells('b');
    //indicamos titulo, altura y fijamos el tamaño de la celda
	b.setText('Capas & Estilos');
	b.setHeight('210');
	b.fixSize(1,1);
    //añadimos un arbol vacio
	AddLayerDialog.wmsLayersTree = b.attachTree();
	//indicamos la ruta a los gif que utilizara el arbol
    AddLayerDialog.wmsLayersTree.setImagePath('../api/dhtmlx-3.5/dhtmlxTree/codebase/imgs/csh_dhx_skyblue/');
    //añadimos checkboxes en las ramas
    AddLayerDialog.wmsLayersTree.enableCheckBoxes(true, false);
    //añadimos el controlador
    AddLayerDialog.wmsLayersTree._controller = AddLayerDialog;
    //añadimos el evento onBeforeCheck para controlar si dejamos checkear o no esa rama
    //en la version profesional con ocultarlos sería suficiente
    AddLayerDialog.wmsLayersTree.attachEvent('onBeforeCheck', function(id, state){
		//this se refiere a wmsLayersTree
        return this._controller.wmsLayersTree_onBeforeCheck(id, state);
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

	AddLayerDialog.addLayerForm = c.attachForm(str);
    //añadimos el controlador
    AddLayerDialog.addLayerForm._controller = AddLayerDialog;
    //añadimos el evento onButtonClickpara detectar cuando se pulsa el botón añadir
	AddLayerDialog.addLayerForm.attachEvent('onButtonClick', function(name, command){
		//this se refiere a addLayerForm
        this._controller.addLayerForm_onButtonClick(name, command);
	});

    //añadimos un statusbar para mantener al usuario informado
	AddLayerDialog.addLayerStatusBar = addLayer.attachStatusBar();
	AddLayerDialog.addLayerStatusBar.setText('');

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

}

AddLayerDialog.connectToServerForm_onButtonClick = function(name, command){
    
    if(AddLayerDialog.connectToServerForm.validateItem('urlCombo'))
    {
        //se ha pulsado el botón conectar y urlCombo tiene una dirección
        var server = AddLayerDialog.connectToServerForm.getCombo('urlCombo').getComboText()
        AddLayerDialog.addLayerStatusBar.setText('Conectando con: ' + server);
        
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
                /*inicio encapsular en funcion*/
                AddLayerDialog.addLayerStatusBar.setText('Conexión establecida, procesando respuesta');
                //añadir capas comprobar espacios de nombre para hacer doXPath
                var xmlnsUsed = false;
                for(var i=0; i<loader.xmlDoc.responseXML.documentElement.attributes.length; i++)
                {
                    if(loader.xmlDoc.responseXML.documentElement.attributes[i].name == 'xmlns')
                    {
                        xmlnsUsed=true;
                        break;
                    }
                }
                
                var wmsAbstract;
                var wmsLayers;
    
                if(xmlnsUsed)
                {
                    wmsAbstract = loader.doXPath('//na:Service/na:Abstract', null, 'http://www.opengis.net/wms');
                    wmsLayers = loader.doXPath('//na:Capability/na:Layer', null, 'http://www.opengis.net/wms');
                }else{
                    wmsAbstract = loader.doXPath('//Service/Abstract', null, 'http://www.opengis.net/wms');
                    wmsLayers = loader.doXPath('//Capability/Layer');
                }
                
                AddLayerDialog.connectToServerForm.getInput('abstractInput').value = wmsAbstract[0].textContent;
                
                var layerObj = {};
                AddLayerDialog.processLayerNode(loader, wmsLayers[0], layerObj);
                /* fin encapsular en funcion*/
                AddLayerDialog.buildWMSLayersTree(layerObj, '1', null);
                AddLayerDialog.addLayerStatusBar.setText('');
                AddLayerDialog.addLayerForm.unlock()
            }else{
                AddLayerDialog.addLayerStatusBar.setText('No se ha obtenido una respuesta valida');
            }
        }
        );
        
    }else{
        AddLayerDialog.addLayerStatusBar.setText('Por favor introduzca una URL o seleccione una de la lista');
    }
    
}

AddLayerDialog.wmsLayersTree_onBeforeCheck = function(id, state){
    
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
    //de la constante AddLayerDialog.notCheckeableNodeNames
    for(var i=0;i<AddLayerDialog.notCheckeableNodeNames.length;i++)
    {
        if(AddLayerDialog.wmsLayersTree.getItemText(id).search('^' + AddLayerDialog.notCheckeableNodeNames[i])>=0)
        {
            allowsCheck = false;
            break;
        }
    }
    return allowsCheck;

}

AddLayerDialog.addLayerForm_onButtonClick = function(name, command){
    
    if(!AddLayerDialog.connectToServerForm.validateItem('urlCombo'))
    {
        AddLayerDialog.addLayerStatusBar.setText('Por favor introduzca un nombre para la capa');
        return;
    }
    
    var url = AddLayerDialog.connectToServerForm.getCombo('urlCombo').getComboText();
    
    if(!AddLayerDialog.addLayerForm.validateItem('layerName'))
    {
        AddLayerDialog.addLayerStatusBar.setText('Por favor introduzca un nombre para la capa');
        return;
    }
    
    var layerName = AddLayerDialog.addLayerForm.getInput('layerName').value;
    
    //comprobar que existen layers marcados
    var layers = AddLayerDialog.wmsLayersTree.getAllChecked();
    
    if(layers == '')
    {
        AddLayerDialog.addLayerStatusBar.setText('Por favor seleccione alguna capa en el arbol Capas & Estilos');
        return;
    }
    
    layers = layers.split(',');
    for (var i = layers.length-1; i >= 0; i--) {
        //si el checked es hijo de un Layers entonces añadir a layers
        if(AddLayerDialog.wmsLayersTree.getItemText(AddLayerDialog.wmsLayersTree.getParentId(layers[i])).search('^Layers')>=0)
        {
            layers[i] = AddLayerDialog.wmsLayersTree.getItemText(layers[i]);
            layers[i] = layers[i].substring(layers[i].search(/\[/)+1, layers[i].search(/\]/));
        }else{
            layers.splice(i, 1);
        }
    }

    if(layers.length == 0)
    {
        AddLayerDialog.addLayerStatusBar.setText('Por favor seleccione alguna capa en el arbol Capas & Estilos además de los estilos');
        return;
    }
    
    layers=''+layers;
    
    var transparent = AddLayerDialog.addLayerForm.getItemValue('transparentBtn2state')==0? false : true;
    var singleTile = !(AddLayerDialog.addLayerForm.getItemValue('tiledBtn2state')==0? false : true);
    map.addLayer(new OpenLayers.Layer.WMS(layerName, url, {layers: layers, transparent:transparent},{singleTile: singleTile}));
}

AddLayerDialog.processLayerNode = function(loader, node, layer){
    
    for(var i=0; i<node.childNodes.length;i++)
    {
        if(node.childNodes[i].nodeName == 'Title')
        {
            layer.title = node.childNodes[i].textContent;
        }
        if(node.childNodes[i].nodeName == 'Name')
        {
            layer.name = node.childNodes[i].textContent;
        }
        if(node.childNodes[i].nodeName == 'Style')
        {
            if(!layer.styles)
            {
                layer.styles = [];
            }
            layer.styles[layer.styles.length] = {};
            AddLayerDialog.processStyleNode(node.childNodes[i], layer.styles[layer.styles.length-1]);
        }
        if(node.childNodes[i].nodeName == 'Layer')
        {
            if(!layer.layers)
            {
                layer.layers = [];
            }
            layer.layers[layer.layers.length] = {};
            AddLayerDialog.processLayerNode(node.childNodes[i],layer.layers[layer.layers.length-1]);
        }
    }
}

AddLayerDialog.processStyleNode = function(node, style){
    
    for(var i=0; i<node.childNodes.length;i++)
    {
        if(node.childNodes[i].nodeName == 'Title')
        {
            style.title = node.childNodes[i].textContent;
        }
        if(node.childNodes[i].nodeName == 'Name')
        {
            style.name = node.childNodes[i].textContent;
        }
    }
}

AddLayerDialog.buildWMSLayersTree = function(obj, id, parentId){

    var rama = '';
        
    if(obj.title)
    {
        rama = obj.title;
    }
    
    if(obj.name)
    {
        rama = rama + ' [' + obj.name + ']';
    }
    
    if(id=='1')
    {
        AddLayerDialog.wmsLayersTree.deleteChildItems('1');
        AddLayerDialog.wmsLayersTree.deleteItem('1',false);
        AddLayerDialog.wmsLayersTree.loadXMLString('<tree id="0"><item text="' + rama + '" id="1"></item></tree>');
    }else{
        AddLayerDialog.wmsLayersTree.insertNewItem(parentId, id, rama, 0, 0, 0, 0, 'SELECT');
    }
    
    if(obj.styles)
    {
        AddLayerDialog.wmsLayersTree.insertNewItem(id, id + '-1','Styles (' + obj.styles.length + ')', 0, 0, 0, 0, 'SELECT');
        for( var i=0; i<obj.styles.length; i++)
        {
            if(obj.styles[i].title)
            {
                rama = obj.styles[i].title;
            }
            
            if(obj.styles[i].name)
            {
                rama = rama + ' [' + obj.styles[i].name + ']';
            }
            AddLayerDialog.wmsLayersTree.insertNewItem(id + '-1', id + '-1-' + (i+1),rama, 0, 0, 0, 0, 'SELECT');
        }
    }

    if(obj.layers)
    {
        AddLayerDialog.wmsLayersTree.insertNewItem(id, id + '-2','Layers (' + obj.layers.length + ')', 0, 0, 0, 0, 'SELECT');
        for( var i=0; i<obj.layers.length; i++)
        {
            AddLayerDialog.buildWMSLayersTree(obj.layers[i], id + '-2-' + (i+1), id + '-2')
        }
    }
    
}

