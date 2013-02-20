/*
 * XMLTree.js define una clase para 
 * visualizar un documento XML utilizando
 * un dhtmlxtree
 */

/*
 *constantes
 */
 
/*
 * Pasamos al constructor tres parametros:
 * xmlDocument: documento xml a parsear
 * nodeTypesToExclude: nodos que no queremos añadir al arbol
 * selectableNodeNames: nombres de los nodos que se podran 'checkear'
 * tree: arbol que utilizaremos para añadir los nodos
 */
function XMLTree(xmlDocument, nodeTypesToExclude, nodeNamesToInclude, tree)
{
	this.xmlDocument = xmlDocument;
	this.nodeTypesToExclude = nodeTypesToExclude;
    this.nodeNamesToInclude = nodeNamesToInclude;
    this.nodeNamesToInclude[this.nodeNamesToInclude.length] = '#text';
    this.tree = tree;
}

/*
 *
 */
XMLTree.prototype.buildTree = function()
{
    this.tree.deleteChildItems('1');
    this.tree.deleteItem('1',false);
    //procesamos de forma recursiva cada nodo
	this.proccessNode(null, 1, this.xmlDocument);
};

/*
 *
 */
XMLTree.prototype.proccessNode = function(parentId, id, node)
{
    var n=0;
    
	for(var i=0;i<this.nodeTypesToExclude.length;i++) 
    {
		if(node.nodeType == this.nodeTypesToExclude[i])
        {
			return;
		}
    }
    
	for(var i=0;i<this.nodeNamesToInclude.length;i++) 
    {
		if(node.nodeName == this.nodeNamesToInclude[i])
        {
            
            switch(node.nodeType)
            {
                case 1:
                    //node
                    //add the node to the tree
                    id=='1'?this.tree.loadXMLString('<tree id="0"><item text="' + node.nodeName + '" id="1"></item></tree>'):
                    this.tree.insertNewItem(parentId, id, node.nodeName, 0, 0, 0, 0, 'SELECT');
                    break;
                case 3:
                    //text node
                    //add the node to the tree only if they don't have next and previous siblings 
                    if(!node.nextSibling && !node.previousSibling)
                    {
                        id=='1'?this.tree.loadXMLString('<tree id="0"><item text="' + node.nodeName + '" id="1"></item></tree>'):                         
                        this.tree.insertNewItem(parentId, id, node.data, 0, 0, 0, 0, 'SELECT');
                    }
                    //
                    break;
                default:
                    //unknown type!!
                    id=='1'?this.tree.loadXMLString('<tree id="0"><item text="' + node.nodeName + '" id="1"></item></tree>'):
                    this.tree.insertNewItem(parentId, id, node.nodeName + '(nodeType: ' + node.nodeType + ')', 0, 0, 0, 0, 'SELECT');
                    break;
            }
            
            if(node.attributes)
            {            
                for(var j=0;j<node.attributes.length;j++)
                {
                    this.tree.insertNewItem(id, id + '-' + (++n+''), '@' + node.attributes[j].nodeName + '=' + node.attributes[j].nodeValue, 0, 0, 0, 0, 'SELECT');
                }
            }
            
            for(var j=0;j<node.childNodes.length;j++)
            {
                this.proccessNode(id, id + '-' + (++n+''), node.childNodes[j]);
            }
            
        }
    }
};


