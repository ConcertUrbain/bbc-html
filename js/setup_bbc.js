$(function()
{
	/* BACKBONE */
	
	window.App = {};
	
	App.eventManager = _.extend({}, Backbone.Events);
	
	App.Models = {};
	App.Collections = {};
	App.Views  = {};
	
	App.Views.appView = new BBCAppView();
	
	var appView = App.Views.appView;
	appView.proxy = "proxy/ba-simple-proxy.php?url=";
	appView.serviceURL = "http://ws.chatanoo.org/services";
	appView.mediaCenterURL = "http://mc.chatanoo.org/m/";
	appView.adminParams = ["mazerte","desperados","BBC_qJlCaSsBbYBYypwF9TT8KmCOxhuZ"];
		
	// Emplacement de la carte (modifiable via les meta-données de l'admin Flash, question par question)
	appView.latitudeGMaps = 48.82129;
	appView.longitudeGMaps = 2.366234;
	appView.zoomGMaps = 17;


	// Permet de gérer les click au niveau des "div" parent d'un lien (plutôt qu'au niveau du lien lui-même)
	$(document).delegate("a", "click", function(evt) {
		var href = $(this).attr("href");
		if (href == "#") evt.preventDefault();
	});	

	// XML
	$.get("bbc.xml", function(xml)
	{
		var json = xmlToJson(xml);
		var queries = json.bbc.query;
		
		// console.log(JSON.stringify(json.bbc.query));

		var i, n = queries.length;
		var queryObj, queryId, querySubFolder, queryImages, queryBackgroundSound;
		var queryCarteObj, queryCarteBitmap; 
		
		var queryCarteTopLeftObj, queryCarteTopLeft, queryCarteBottomRightObj, queryCarteBottomRight;
		var queryCarteTop, queryCarteLeft, queryCarteBottom, queryCarteRight;
		
		var queryJSON;
		
		App.Collections.queriesMedias = new QueriesMediasCollection();
		
		for(i=0; i<n; i++)
		{
			queryObj = queries[i];
			
			queryId = queryObj.id;
			
			querySubFolder = queryObj.subfolder;
			queryBackgroundSound = queryObj.backgroundSound;
			queryImages = queryObj.images["#text"].split(",");
			
			queryCarteTop = null;
			queryCarteLeft = null;
			queryCarteBottom = null;
			queryCarteRight = null;
			
			queryCarteObj = queryObj.carte;
			
			if (queryCarteObj)
			{
				queryCarteBitmap = queryCarteObj.image["#text"];
				
				queryCarteTopLeftObj = queryCarteObj.topleft["#text"];
				queryCarteBottomRightObj = queryCarteObj.bottomright["#text"];
				
				
				if (queryCarteTopLeftObj)
				{
					queryCarteTopLeft = queryCarteTopLeftObj.split(" ").join("").split(",");
					queryCarteTop = queryCarteTopLeft[0];
					queryCarteLeft = queryCarteTopLeft[1];
				}
				
				if (queryCarteBottomRightObj)
				{
					queryCarteBottomRight = queryCarteBottomRightObj.split(" ").join("").split(",");
					queryCarteBottom = queryCarteBottomRight[0];
					queryCarteRight = queryCarteBottomRight[1];
				}
			}
			
			queryJSON = {	id:queryId, subfolder:querySubFolder, backgroundSound:queryBackgroundSound, 
							images:queryImages, carte:queryCarteBitmap, 
							carteTop:queryCarteTop, carteLeft:queryCarteLeft, 
							carteBottom:queryCarteBottom, carteRight:queryCarteRight
						};
			
			// On stocke les différentes données associées à chaque Query
			App.Collections.queriesMedias.add( new QueryMediasModel(queryJSON) );
			
			// console.log(App.Collections.queriesMedias.at(0));			
			// console.log(queryId, queryImages, queryCarteBitmap, queryCarteTopLeft, queryCarteBottomRight);
		}
		
		App.Views.appView.connectToWebServices();

	});	
	
});
