/*
 * AddWMSLayerDialog.js define una clase para añadir
 * 'capas' procedentes de un servicio WMS a un objeto
 * Map de OpenLayers
 */

/*
 * constantes
 */
//tamaño ventana
AddWMSLayerDialog.width = 440*2;
AddWMSLayerDialog.height = 170;
AddWMSLayerDialog.aCell = {};
AddWMSLayerDialog.aCell.width = 440;
AddWMSLayerDialog.aCell.height = 170;

//titulo de la ventana
AddWMSLayerDialog.title = 'Add WMS Layer';
//tamaño de etiquetas
AddWMSLayerDialog.labelWidth = 85;
//tooltips
AddWMSLayerDialog.nameTooltip = 'Name of the OpenLayers layer';
AddWMSLayerDialog.urlTooltip = 'URL of the WMS service' ;
AddWMSLayerDialog.layersTooltip = 'List of the WMS service layers to add';
AddWMSLayerDialog.singleTileTooltip = 'a tile per layer or several tiles per layer';
AddWMSLayerDialog.transparentTooltip = 'Images mus be transparent';
//tamaño botones
AddWMSLayerDialog.buttonsWidth = 120;
//mensajes de error
AddWMSLayerDialog.URLValidateItemError = 'URL is empty';
AddWMSLayerDialog.ValidateError = 'One or more fields are empty';

/*
 * Cache valores formulario
 */
AddWMSLayerDialog.layerName;
AddWMSLayerDialog.url;
AddWMSLayerDialog.layers;
AddWMSLayerDialog.singleTile = false;
AddWMSLayerDialog.transparent = true;
AddWMSLayerDialog.examples = [
    { name: 'Catastro de España', url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', singleTile: true, transparent: true},
    { name: 'IGN-BASE', url: 'http://www.ign.es/wms-inspire/ign-base', singleTile: false, transparent: true},
    { name: 'PNOA', url: 'http://www.idee.es/wms/PNOA/PNOA', singleTile: false, transparent: true}
];
AddWMSLayerDialog.examplesIndex = 0;
    
 
/*
 * El primer paso es inicializar el objeto AddWMSLayerDialog
 */
function AddWMSLayerDialog(){
    //empty
}

/*
 * Método para abrir el dialogo en modo modal
 */
AddWMSLayerDialog.showModal = function(map){
    
    var windows = new dhtmlXWindows();

    //create the window
    var addWMSLayer = windows.createWindow('addWMSLayer', 0, 0, AddWMSLayerDialog.width, AddWMSLayerDialog.height);
    //set the title
    addWMSLayer.setText(AddWMSLayerDialog.title);
    //no resize, no park no minmax
    addWMSLayer.denyResize();
    addWMSLayer.button('park').hide();
    addWMSLayer.button('minmax1').hide();
    //enable the help
    addWMSLayer.button('help').show();
    addWMSLayer.button('help').enable();
    //show the window like a modal dialog
    addWMSLayer.setModal(1);
    //center the window on the screen
    addWMSLayer.centerOnScreen();
    
    //attach events to the window
    addWMSLayer.attachEvent('onHelp', 
        function(win){
            var i = AddWMSLayerDialog.examplesIndex;
            addWMSLayerForm.setItemValue('name', AddWMSLayerDialog.examples[i].name);
            addWMSLayerForm.setItemValue('url', AddWMSLayerDialog.examples[i].url);
            addWMSLayerForm.setItemValue('singleTile', AddWMSLayerDialog.examples[i].singleTile);
            addWMSLayerForm.setItemValue('transparent', AddWMSLayerDialog.examples[i].transparent);
            if(++i<AddWMSLayerDialog.examples.length)
            {
                AddWMSLayerDialog.examplesIndex++;
            }else{
                AddWMSLayerDialog.examplesIndex = 0;
            }
	});    
    
    //add a layout
	var addWMSLayerLayout = addWMSLayer.attachLayout('2U');
    addWMSLayerLayout.cells('a').setWidth = AddWMSLayerDialog.aCell.width;
    addWMSLayerLayout.cells('a').setHeight = AddWMSLayerDialog.aCell.height;
    addWMSLayerLayout.cells('a').hideHeader();

    //form structure
    var str = [
        { type:'block' , name:'form_block_1', list:[
        { type:'input' , name:'name', label:'Name:', validate:'NotEmpty', labelWidth:AddWMSLayerDialog.labelWidth, required:true, position:'label-left', tooltip:AddWMSLayerDialog.nameTooltip, value: AddWMSLayerDialog.layerName},
        { type:'input' , name:'url', label:'URL:', validate:'NotEmpty', labelWidth:AddWMSLayerDialog.labelWidth, required:true, tooltip:AddWMSLayerDialog.urlTooltip, value:AddWMSLayerDialog.url},
        { type:'input' , name:'layers', label:'Layers:', validate:'NotEmpty', labelWidth:AddWMSLayerDialog.labelWidth, required:true, tooltip:AddWMSLayerDialog.layersTooltip, value:AddWMSLayerDialog.layers},
        { type:'btn2state' , name:'singleTile', label:'Single tile:', labelWidth:AddWMSLayerDialog.labelWidth, labelAlign:'left', tooltip:AddWMSLayerDialog.singleTileTooltip},
        { type:'btn2state' , name:'transparent', label:'Transparent:', labelWidth:AddWMSLayerDialog.labelWidth, labelAlign:'left', tooltip:AddWMSLayerDialog.transparentTooltip}
        ]  },
        { type:'newcolumn'   },
        { type:'block' , name:'form_block_2', list:[
        { type:'button' , name:'getCapabilities', value:'Get Capabilities', width:AddWMSLayerDialog.buttonsWidth},
        { type:'button' , name:'addLayer', value:'Add Layer', width:AddWMSLayerDialog.buttonsWidth}
        ]  }
    ];
    
    //add the previous form to the a cell of the layout
    var addWMSLayerForm = addWMSLayerLayout.cells('a').attachForm(str);

    //inicializamos a parte los btn2state
    addWMSLayerForm.setItemValue('singleTile', AddWMSLayerDialog.singleTile);
    addWMSLayerForm.setItemValue('transparent', AddWMSLayerDialog.transparent);
    
    //manage the onButtonClick of the form
    addWMSLayerForm.attachEvent('onButtonClick', 
        function(name, command){
            
            //name contains the name of the button clicked
            //command is empty
            
            //useful variables to create an OpenLayers layer
            var url, layers, layerName, singleTile, transparent

            url = addWMSLayerForm.getItemValue('url');
            layers = addWMSLayerForm.getItemValue('layers');
            layerName = addWMSLayerForm.getItemValue('name');
            singleTile = addWMSLayerForm.getItemValue('singleTile')==0? false : true;
            transparent = addWMSLayerForm.getItemValue('transparent')==0? false : true;
            
            //if the user click on GetCapabilities button
            if (name=='getCapabilities') 
            {
                //check if URL is empty
                if(addWMSLayerForm.validateItem('url'))
                {
                    var request;
                    if(proxyHost)
                    {
                        request = proxyHost + encodeURIComponent(url+'?service=WMS&request=GetCapabilities') + proxyHostOptions;
                    }else{
                        request = url+'?service=WMS&request=GetCapabilities';
                    }

                    dhtmlxAjax.get(request,function(loader) 
                                { 
									if(loader.xmlDoc.status == 200 && loader.xmlDoc.responseXML)
									{
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
                                        
                                        var wmsLayers;
                                        if(xmlnsUsed)
                                        {
                                            wmsLayers = loader.doXPath('//na:Layer/na:Name', null, 'http://www.opengis.net/wms');
                                        }else{
                                            wmsLayers = loader.doXPath('//Layer/Name');
                                        }
                                        
										var capabilitiesDialog = new XMLTreeWindow(loader.xmlDoc.responseXML, [10], ['Layer']);
										capabilitiesDialog.showModal('Capabilities from ' + url);
									}
                                }
                    );

                    //var loader = dhtmlxAjax.getSync('ba-simple-proxy.php?url=' + encodeURIComponent(url+'?service=WMS&request=GetCapabilities') + '&mode=native');
                    //var result = loader.doXPath('//na:Layer/na:Name', null, 'http://www.opengis.net/wms');
                    
                }else{
                    alert(AddWMSLayerDialog.URLValidateItemError);
                }

            //if the user click on GetCapabilities button
            }else if (name=='addLayer')
            {
                //check all the validation rules
                if(addWMSLayerForm.validate())
                {
                    map.addLayer(new OpenLayers.Layer.WMS(layerName, url, {layers: layers, transparent:transparent},{singleTile: singleTile}));
                    
                    //cacheamos los valores para mostrarlos la proxima vez
                    //que se abra el dialogo
                    AddWMSLayerDialog.layerName = layerName;
                    AddWMSLayerDialog.url = url;
                    AddWMSLayerDialog.layers = layers;
                    AddWMSLayerDialog.singleTile = singleTile;
                    AddWMSLayerDialog.transparent = transparent;
                    
                }else{
                    alert(AddWMSLayerDialog.ValidateError);
                }
            }
                            
        });

    //enable the autovalidation of the form 
    addWMSLayerForm.enableLiveValidation(true);    
    
    //configure the b cell
    addWMSLayerLayout.cells('b').hideHeader();
    var addWMSLayerGrid = addWMSLayerLayout.cells('b').attachGrid();
//incializar grid etc etc etc
}