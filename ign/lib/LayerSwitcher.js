//TODO cancelar las peticiones a los servicios de los que se apaga la visualización

/**
 * @requires OpenLayers/Control/LayerSwitcher.js
 */
var es = {};
es.IGN = {};

/**
 * Class: es.IGN.LayerSwitcher
 * 
 * Inherits from: 
 *  - <OpenLayers.Control.LayerSwitcher>
 */
es.IGN.LayerSwitcher = OpenLayers.Class(OpenLayers.Control.LayerSwitcher, {

    /**
     * APIProperty:
     */

    /**
     * Constructor: es.IGN.LayerSwitcher
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(name, url, params, options) {
        OpenLayers.Control.LayerSwitcher.prototype.initialize.apply(this, arguments);

		//al cambiar el nombre del control el estilo asignado a la clase
		//openlayers.control.layerSwitcher no se aplica, por eso es 
		//necesario introducir un nuevo css en donde se especifican
		//el estilo para esta nueva clase
		var cssNode = document.createElement('link');
		cssNode.setAttribute('rel', 'stylesheet');
		cssNode.setAttribute('type', 'text/css');
		cssNode.setAttribute('href', './ign/theme/default/style.css');
		document.getElementsByTagName('head')[0].appendChild(cssNode);
    },    

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.WMS.Untiled>} An exact clone of this layer
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new es.IGN.LayerSwitcher(this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.control.LayerSwitcher.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    }, 
	
    /** 
	 *
	 * @overrides
	 *
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a 
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */  
    redraw: function() {
        //if the state hasn't changed since last redraw, no need 
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) { 
            return this.div; 
        } 

        //clear out previous layers 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        var containsOverlays = false;
        var containsBaseLayers = false;
        
        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            var layer = this.map.layers[i];
            this.layerStates[i] = {
                'name': layer.name, 
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id
            };
        }    

        /************************************ customization **********************************/

        var buttonAdd = document.createElement("input");
        buttonAdd.id = this.id + "_add";
        buttonAdd.type = "image";
        buttonAdd.name = "add";
        buttonAdd.src = "./ign/img/add.png";
		
        var context = {
            'inputElem': buttonAdd,
            'layer': layer,
            'layerSwitcher': this
        };
        OpenLayers.Event.observe(buttonAdd, "click", 
            OpenLayers.Function.bindAsEventListener(this.onInputClick,context));

		var groupDiv = this.dataLayersDiv;
		groupDiv.appendChild(buttonAdd);

        var labelSpan = document.createElement("span");
        labelSpan.innerHTML = "Add layer";
        labelSpan.style.verticalAlign = "baseline";
        OpenLayers.Event.observe(labelSpan, "click", 
			OpenLayers.Function.bindAsEventListener(this.onInputClick,context));
		groupDiv.appendChild(labelSpan);
		
		var br = document.createElement("br");		
		groupDiv.appendChild(br);

		var hr = document.createElement("hr");		
		groupDiv.appendChild(hr);
        
		var layers = this.map.layers.slice();
        //if (!this.ascending) { layers.reverse(); }
		if (this.ascending) { layers.reverse(); }
        /************************************ customization **********************************/
        for(var i=0, len=layers.length; i<len; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;

            if (layer.displayInLayerSwitcher) {

                if (baseLayer) {
                    containsBaseLayers = true;
                } else {
                    containsOverlays = true;
                }    

                // only check a baselayer if it is *the* baselayer, check data
                //  layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();
    
                /************************************ customization **********************************/

                //create button images to raise sink or remove layer
                var buttonRaise = document.createElement("input");
                buttonRaise.id = this.id + "_raise_" + layer.name;
                buttonRaise.type = "image";
                buttonRaise.name = "raise_" + layer.name;
                buttonRaise.src = "./ign/img/raise.png";

                var context = {
                    'inputElem': buttonRaise,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(buttonRaise, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );

                var buttonSink = document.createElement("input");
                buttonSink.id = this.id + "_sink_" + layer.name;
                buttonSink.type = "image";
                buttonSink.name = "sink_" + layer.name
                buttonSink.src = "./ign/img/sink.png";
 
                var context = {
                    'inputElem': buttonSink,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(buttonSink, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );

                var buttonRemove = document.createElement("input");
                buttonRemove.id = this.id + "_remove_" + layer.name;
                buttonRemove.type = "image";
                buttonRemove.name = "remove_" + layer.name;
                buttonRemove.src = "./ign/img/remove.png";

                var context = {
                    'inputElem': buttonRemove,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(buttonRemove, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );

                /************************************ customization **********************************/
                
                // create input element
                var inputElem = document.createElement("input");
                inputElem.id = this.id + "_input_" + layer.name;
                inputElem.name = (baseLayer) ? "baseLayers" : layer.name;
                inputElem.type = (baseLayer) ? "radio" : "checkbox";
                inputElem.value = layer.name;
                inputElem.checked = checked;
                inputElem.defaultChecked = checked;

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }
                var context = {
                    'inputElem': inputElem,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(inputElem, "mouseup", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );

                // create span
                var labelSpan = document.createElement("span");
                if (!baseLayer && !layer.inRange) {
                    labelSpan.style.color = "gray";
                }
                labelSpan.innerHTML = layer.name;
                labelSpan.style.verticalAlign = (baseLayer) ? "bottom" 
                                                            : "baseline";
                OpenLayers.Event.observe(labelSpan, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                // create line break
                var br = document.createElement("br");
    
                
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                groupArray.push({
                    'layer': layer,
                    'inputElem': inputElem,
                    'labelSpan': labelSpan
                });
                                                     
    
                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;

                /************************************ customization **********************************/
                groupDiv.appendChild(buttonRaise);
                groupDiv.appendChild(buttonSink);
                groupDiv.appendChild(buttonRemove);
                /************************************ customization **********************************/
                groupDiv.appendChild(inputElem);
                groupDiv.appendChild(labelSpan);
                groupDiv.appendChild(br);
            }
        }

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        
        
        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";        

        return this.div;
    },

    /** 
	 *
	 * @overrides
	 *
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     * 
     * Parameters:
     * e - {Event} 
     *
     * Context:  
     *  - {DOMElement} inputElem
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     *  - {<OpenLayers.Layer>} layer
	 *
     */

    onInputClick: function(e) {

        if (!this.inputElem.disabled) {
            /************************************ customization **********************************/
            if (this.inputElem.type == "image") {
				
                if (this.inputElem.name == "add") {
                    //AddWMSLayerDialog.showModal(map);
                    //AddLayerDialog.showModal(map);
                    AddLayerDialog.singleton.showModal(map);
				}
                
                if (this.inputElem.name == "raise_" + this.layer.name) {
                    this.layer.map.raiseLayer(this.layer, 1);
                } else if (this.inputElem.name == "sink_" + this.layer.name) {
                    this.layer.map.raiseLayer(this.layer, -1);
                } else if (this.inputElem.name == "remove_" + this.layer.name) {
                    this.layer.map.removeLayer(this.layer, null);
                }
            }
            /************************************ customization **********************************/
            if (this.inputElem.type == "radio") {
                this.inputElem.checked = true;
                this.layer.map.setBaseLayer(this.layer);
            } else {
                this.inputElem.checked = !this.inputElem.checked;
                this.layerSwitcher.updateMap();
            }
        }
        OpenLayers.Event.stop(e);
    },

    CLASS_NAME: "es.IGN.LayerSwitcher"
});
