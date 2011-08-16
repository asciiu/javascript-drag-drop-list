// Author: Ellyssin Gimhae
// Date: 8/15/11
// License: GPL

var DragDropList = Class.create({
	initialize: function(ul) {
		
		var showMarker = function () {
			var marker = $("marker");
			marker.addClassName(options.markerProperties);
			marker.removeClassName("invisible");
		}
		
		var hideMarker = function() {
			var marker = $("marker");
			marker.addClassName("invisible");
			marker.removeClassName(options.markerProperties);
		}
		
		var handleClick = function () {
			this.parentNode.className = (this.parentNode.className==options.nodeOpenClass) ? options.nodeClosedClass : 
				 																			 options.nodeOpenClass;
			return false;
		};
		
		var handleDrop = function(draggable,droppable,event) {	
				// get the li of this draggable
			var draggablelistItem = draggable.up("li");

			// if the draggable element is being dropped onto a element that is 
			// already a ancestor of the draggable we should ignore it
			// in other words, the draggable should not be an ancestor of the 
			// the droppable
			if (droppable.descendantOf(draggablelistItem)) 
				return;

			// draggable already a direct child of droppable?
			if (draggablelistItem.up("li") == droppable.up("li"))
				return;

			// this happens when the draggable is going to a new parent
			// and it is the last LI element of its parent UL
			if (draggablelistItem.up("ul").childElements().length == 1) {
				// so we want to destroy the tree node at one li above
				destroyTreeNode(draggablelistItem.up("li"));		    
			}

			// if the droppable has a sibling and the next sibling is an UL
			// then the droppable already has children so we
			// need to append the draggable to that list
			if (droppable.nextSibling && droppable.nextSibling.nodeName == "UL") {				

				// append the draggable LI to its new parent
				droppable.nextSibling.appendChild(draggablelistItem);

			} else {
				// need to create a new ul that will be a sibling for droppable
	            // the li that contains droppable does not yet contain li children
				var newUL = document.createElement("ul");
				// add the draggable li to the new ul
				newUL.appendChild(draggablelistItem);
				// add the ul to the droppable li
				droppable.up("li").appendChild(newUL);
				
				droppable.up("li").down("span").onclick = handleClick;
			} 
			// exand the tree so we can see the changes
			openTreeNode(droppable.up("li"));
		};
		
		// The following functions handle drops and hover over the main div
		// the category flag keeps track of whether or not we are hovering over
		// the caterory div
		//var category = false;
		var handleTopHover = function(draggable, droppable, overlap){	
			if(draggable.up("ul") == droppable) 
				return;
					
			// if we are at less than 10px from the left of the ul
			if (draggable.positionedOffset().toArray()[0] < 12) {
				// yes we are hovering over the drop zone of the dropon element
				top = true;
				// set the hover class
				//Element.addClassName(dropon,"over");
				//gutter.addClassName("gutterShow");
				showMarker();
			} else {
				top = false;
				//Element.removeClassName(dropon, "over");
				hideMarker();				
			}
		};

		var handleTopDrop = function(draggable, droppable, event) {

	        // category flag gets set in hover handler it basically keeps track of
			// weather or not we are hovering over the main drop zone
			// the parent node of the elements li must also not be categories
			// otherwise the element would already be under categories
			if(top && draggable.up("ul") != droppable) {
				// draggable li		
				var listItem = draggable.up("li");


				// if this element is the last child element of its parent UL
				if (listItem.up("ul").childElements().length == 1) {
					// the li that is the parent of this list item will no longer 
					// be a tree cause it will not have anymore children
					// that is the last child of this elements parent will be dropped
					// onto the dropon element
					destroyTreeNode(listItem.up("li"));					
				}

				// append li onto drop element	
				//droppable.appendChild(listItem);
				$("marker").insert({before:listItem});
			}
			// remove the hover class
			hideMarker();
		};
		
		var openTreeNode = function(li) {
			li.className = options.nodeOpenClass;
		};

		var destroyTreeNode = function(li) {
			li.className = options.nodeBulletClass;
			li.firstChild.onclick = function() {  return false;};

			// remove the ul list under this list item
			li.down("ul").remove();
		};
	
		var convertToTree = function (uiElement) {
			if(uiElement.nodeName != "UL")
				throw( "DragDroplist requires an element of type 'ul'");

			// must have child nodes
			if (uiElement.childElements().length == 0) 
				return;
			
			uiElement.childElements().each (function (child) {
				if(child.nodeName == 'LI') {

					var isParent = false;
					child.childElements().each(function (descendant) {
						if(descendant.nodeName == 'UL') {
							isParent = true;
							convertToTree(descendant);
						}
					});	

					if(child.firstChild.nodeName == "#text"){
						var text = child.firstChild.nodeValue;

						child.removeChild(child.firstChild);
						child.insert({top:new Element('span',{class:'item_wrapper'})});
						child.firstChild.update(text);
						
						var dragdrop = child.firstChild;
						
						var draggable = new Draggable(dragdrop, {
							ghosting: true,
							revert:true,
							reverteffect: function(element) {
					      		element.style.top  = 0;
					        	element.style.left = 0;}
							});

						Droppables.add(draggable.element, {
							hoverclass: 'over',
							onDrop:handleDrop,
							});

						draggables[draggables.length] = draggable;
						//uids[uids.length] = span1.id;
					}		


					var span= document.createElement("span");
					span.className = options.nodeLinkClass;

					if(isParent){
						// This LI has UL's in it, so it's a +/- node
						if (child.className==null || child.className=="") {
							child.className = options.nodeClosedClass;
						}

						span.onclick = handleClick;

					} else {
						// this child does not have children
						child.className = options.nodeBulletClass;
					}

					span.appendChild(document.createTextNode('\u00A0'));
					child.insertBefore(span,child.firstChild);
				}
			});
		};
			
		var defaults = {
			nodeClosedClass: "liClosed",
			nodeOpenClass:   "liOpen",
			nodeBulletClass: "liBullet",
			nodeLinkClass:   "bullet",
			markerProperties:"marker"
		};
		
		// merage the options
		var options = Object.extend(defaults, arguments[1] || { });
		// keep track of the uids for draggable and droppable
		var uids = new Array();
		var draggables = new Array();
		
		var top = false;
		
		this.element = $(ul);
		this.uids = uids;
		this.draggables = draggables;
		this.options = options;
		this.element.insert({bottom:new Element("span",{id:"marker"}).update("&nbsp")});
		hideMarker();
		
		// the top level ul is droppable
		Droppables.add(this.element, {
				overlap:"horizontal",
				onHover:handleTopHover,
				onDrop:handleTopDrop		
		});
				
		convertToTree(this.element);
	},
	
	destroy: function() {
		Droppables.remove(this.element);
			
		for(var i = 0; i < this.draggables.length; ++i) {
			Droppables.remove(this.draggables[i]);
			this.draggables[i].destroy();
		}
	
		this.element.select('span.bullet').each(function(span){
			span.remove();
		});
		
		this.element.select('span.item_wrapper').each(function(span){
		    var textNode = span.firstChild;
			span.parentNode.insertBefore(textNode,span);
			span.remove();
		});
		
		var options = this.options;
		this.element.select('li.'+options.nodeBulletClass, 
							'li.'+options.nodeClosedClass,
							'li.'+options.nodeOpenClass
							).each(function(li){
			li.removeClassName(options.nodeBulletClass);
			li.removeClassName(options.nodeClosedClass);
			li.removeClassName(options.nodeOpenClass);
		});
		
		$("marker").remove();
	},
});
	
