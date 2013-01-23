/*
 * XMLTreeWindow.js define una clase para 
 * visualizar en forma de arbol un documento XML
 */

/*
 *constantes
 */
 XMLTreeWindow.width = 500;
 XMLTreeWindow.height = 250;
 
/*
 * 
 */
function XMLTreeWindow(xmlDocument, nodeTypesToExclude, selectableNodeNames)
{
	this.xmlDocument = xmlDocument;
	this.nodeTypesToExclude = nodeTypesToExclude;
    this.selectableNodeNames = selectableNodeNames;
    this.xmlTree = null;
}

/*
 *
 */
XMLTreeWindow.prototype.showModal = function(titulo)
{

	var windows = new dhtmlXWindows();
	var xmlTreeWindow = windows.createWindow('xmlTreeWindow'+titulo, 0, 0, XMLTreeWindow.width, XMLTreeWindow.height);
	//set the title
	xmlTreeWindow.setText(titulo);
	//no park no minmax
	xmlTreeWindow.button('park').hide();
	xmlTreeWindow.button('minmax1').hide();
    xmlTreeWindow.setModal(1);
    
	var tree = xmlTreeWindow.attachTree();
    tree.setImagePath('../api/dhtmlx-3.5/dhtmlxTree/codebase/imgs/csh_dhx_skyblue/');
    tree.enableCheckBoxes(true, false);
    this.xmlTree = new XMLTree(this.xmlDocument, this.nodeTypesToExclude, this.selectableNodeNames, tree);
    this.xmlTree.buildTree();
    
}

