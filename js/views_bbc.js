	
//
// Contrôleur BBC
//

var BBCAppView = AppView.extend({

	initialize: function () {
		
		var t = this;
		
		$.event.special.removed = {
			remove: function(o) {
				if (o.handler) {
					o.handler();
				}
			}
		};

		var resize = function()
		{
			var bodyHeight = $("body").height();
			var headerHeight = $(".header").height();
			var footerHeight = $(".footer").height();
			var reste = bodyHeight - headerHeight - footerHeight;
			
			$(".ecrans").height( reste );
			$(".accueil").height( reste );
			$(".mosaique").height( reste );
			$(".animationAttente").height( reste );
			$(".carte").height( reste );
			$(".uploadMargin").height( reste );
			
			var paddingTermesVerticaux = Math.floor((reste - 203) * 0.5) + "px";
			
			$(".gauche").css("padding-top", paddingTermesVerticaux);
			$(".droite").css("padding-top", paddingTermesVerticaux);
			
			t.redrawViews();
		};

		window.onresize = function()
		{
			resize();
		};
		
		resize();
		
		this.initHomeAndMenu();
		this.goHome();
	},
	
	initHomeAndMenu: function() {
		var t = this;
		
		// Bouton Retour : vues --> home
		$(".retour").on("click", function() {
			t.goHome();
		});
		
		// Bouton Plein écran
		$(".plein_ecran").on("click", function() {
			toggleFullscreen();
		});
		
		// Envoi
		$(".temoignage").on("click", function() { t.openUploadView() });
		
		// Cartouche d'intro d'une query
		$(".intro").css("display", "none");
		$(".intro").on("click", function() {
			$(".intro").css("display", "none");
			$(".intro .description").html("");
		});
		
		// Boutons du menu : switch entre les vues
		var selectVue = function(motscles, items, carte)
		{
			$(".onglet").removeClass("inactive").addClass("inactive");
			
			$("#indices").css("display", motscles ? "block" : "none");
			$("#votes").css("display", items ? "block" : "none");
			$("#carte").css("opacity", carte ? 1 : 0);
			$(".terme").css("opacity", items ? 1 : 0);
		};
		
		// Onglet des votes par défaut
		selectVue(0, 1, 0);
		$(".onglet.items").removeClass("inactive");
		
		// Scripts des 3 onglets
		$(".onglet.motcles").on("click", function() {
			selectVue(1, 0, 0);
			$(this).removeClass("inactive");
			$(".onglets").attr("class", "onglets motcles");
		});
			
		$(".onglet.items").on("click", function() {
			selectVue(0, 1, 0);
			$(this).removeClass("inactive");
			$(".onglets").attr("class", "onglets items");
		});
		
		$(".onglet.carte").on("click", function() {
			selectVue(0, 0, 1);
			$(this).removeClass("inactive");
			$(".onglets").attr("class", "onglets carte");
		});
	},
	
	goHome: function() {
		
		if (App.Views.MotifItemsView) App.Views.MotifItemsView.close();
		
		this.accueilElement.css("display", "block");
		this.mosaiqueElement.css("display", "none");
		
		// Par défaut, on affiche la vue des items
		$("#carte").css("opacity", 0);
		$("#indices").css("display", "none");
		$("#votes").css("display", "block");
		
		$(".onglets").attr("class", "onglets items");
		$(".onglet").removeClass("inactive").addClass("inactive");
        $(".onglet.items").removeClass("inactive");
			
		$(".terme").css("opacity", 0);
		$(".menu").css("display", "none");
		$(".retour").css("display", "none");
		$(".temoignage").css("display", "none");
		$(".plein_ecran").css("display", "block");
	},
	
	//
	// Webs Services
	//
		
	connectToWebServices: function () {
		
		var t = this;
		var v = App.eventManager;
		
		// Authentification au WebServices
		t.authentification();	
		
		// ... déclenchera le téléchargement de la liste des projets
		v.on("authentificationSuccess", this.fetchProjects, this);
		
		v.on("itemSelection", this.openMediaItem, this);
		v.on("itemsSelection", this.openNextMediaOfItems, this);
		v.on("itemRollOver", this.openTooltipItem, this);
		v.on("itemRollOut", this.closeTooltipItem, this);
		
		v.on("voteMedia", this.voteMediaItem, this);

		// v.on("closePopUpWithCloseButton", this.closePopUpWithCloseButton, this);
	},

	
	//
	// Tooltips
	//
	
	getParentTooltip: function() {
		return $(".ecrans");
	},
	
	openTooltipItem: function(itemId, titre, pseudo, position) {
		
		var itemCollection = App.Collections.itemsCollection;
		var itemModel = itemCollection.findWhere( {id:itemId });
		if (itemModel)
		{
			var t = this;
			
			// Titre
			if ((titre === "") || (titre === null)) titre = "(Sans titre)";
	
			// Titre en majuscule, puis minuscules
			// titre = _.capitalize(title)
			
			// Pseudo
			var userSpan = pseudo.length === 0 ? "" : " <p class='username'>" + pseudo + "</p>";
		
			var parentToolTip = this.getParentTooltip();
			
			var tooltipEl = $(".tooltip", parentToolTip);
			if (tooltipEl.length === 0) {
				parentToolTip.append("<div class='tooltip shadow'><p class='title'>" + titre + "</p>" + userSpan + "</div>");
			}
	
			var parentWidth = parentToolTip.width();
			var parentHeight = parentToolTip.height();
			
			tooltipEl = $(".tooltip", parentToolTip);
			
			var toolTipWidth  = tooltipEl.width();
			var toolTipHeight = tooltipEl.height();
			
			var positionLeft = Math.floor(position.left - toolTipWidth * 0.5);
			var positionTop = Math.floor(position.top - 50 - toolTipHeight * 0.5);
			
			tooltipEl.css("display", "block");
			
			if (positionLeft + toolTipWidth > parentWidth) {
				tooltipEl.css("right", "0px");
			} else {
				tooltipEl.css("left", positionLeft + "px");
			}
			
			if (positionTop + toolTipHeight > parentHeight) {
				tooltipEl.css("bottom", "0px");
			} else {
				tooltipEl.css("top", positionTop + "px");
			}
			
			var motifView = App.Views.MotifItemsView;
			if (!motifView || !motifView.voteLayer) return; 
			
			// Position actuelle (avant le vote)
			var positions = itemModel.get("positionsMoyenneVotes");
		
			// Spline
			var points = getSplinePoints(positions, false);
			var n = points.length;
			
			var i, point, pointsArray = [];
		
			for (i=1; i<n; i++)
			{
				point = points[i];
				pointsArray.push(point.x);
				pointsArray.push(point.y);
			}

			var line = new Kinetic.Line({
				points: pointsArray,
				stroke: 'white',
				strokeWidth: 3,
				lineCap: 'round',
				lineJoin: 'round'
			});			
			
			motifView.line = line;
			motifView.voteLayer.add(line);  
			motifView.voteLayer.draw();
		}
	},

	closeTooltipItem: function(itemId, titre, position) {
		
		var parentToolTip = this.getParentTooltip();
		var tooltipEl = $(".tooltip", parentToolTip);
		
		tooltipEl.css("display", "none");
		tooltipEl.remove();

		var motifView = App.Views.MotifItemsView;
		if (!motifView || !motifView.voteLayer) return; 
		{
			if (motifView.line) motifView.line.remove();
			motifView.voteLayer.draw();
			motifView.line = null;
		}
	},
	

	// --------------------------------------------------
	//
	// Choix d'une question --> Données des Mosaïques
	//
	// --------------------------------------------------
	
	selectQueryModel: function(queryModel) {
		
		// Titre sous les mosaïques
		$(".menuTitle").html(queryModel.get("content"));
		
		// Cartouche de présentation de la question :
		$(".intro .description").html( queryModel.get("description") );
		$(".intro").css("display", "block");
	},

	//
	// Webs Services
	//
		
	loadDatasOfQuery: function(queryId) {
		
		var t = this;
		
		// On masque l'accueil et on affiche la mosaique
		t.accueilElement.css("display", "none");
		t.mosaiqueElement.css("display", "block");
		
		// Chargement de l'image de fond de la mosaique...
		var queryMediasModel = App.Collections.queriesMedias.getModelById(queryId);
		var images = queryMediasModel.get("images");
		var subfolder = queryMediasModel.get("subfolder");
		var randomImages = _.shuffle(images);
		var randomImage = _(randomImages[0]).strip();
		var randomImagePath = "medias/" + (subfolder ? subfolder : "images/") + randomImage;
		t.mosaiqueElement.css("background-image", "url('" + randomImagePath + "')");

		// ... puis des données de la query (carto)
		t.fetchDatasOfQuery(queryId);
	},
		
	fetchMetasOfQuery: function(queryId, success) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getMetasByVo",
			"params" : [queryId,"Query"]
		};
		
		var success = success || function(jsonResult) {
			
			// console.log("metas", jsonResult.length);
			
			//
			var i, n = jsonResult.length, jsonItem;
			
			// 
			App.Collections.Type1KeyWord = new MetaCollection();
			App.Collections.Type2KeyWord = new MetaCollection();
			App.Collections.Type3KeyWord = new MetaCollection();
			
			for(i=0; i<n; i++)
			{
				jsonItem = jsonResult[i];
				
				switch(jsonItem.name)
				{
					case "Type1KeyWord":
					App.Collections.Type1KeyWord.add( new MetaModel(jsonItem) );
					break;
					
					case "Type2KeyWord":
					App.Collections.Type2KeyWord.add( new MetaModel(jsonItem) );
					break;
					
					case "Type3KeyWord":
					App.Collections.Type3KeyWord.add( new MetaModel(jsonItem) );
					break;
					
					case "MapZoom":
					// console.log("MapZoom", jsonItem);
					break;
					
					case "MapType":
					// console.log("MapType", jsonItem);
					break;
				}
			}
			
			i = 0;
			App.Collections.Type1KeyWord.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 1));
			});
			
			i = 0;
			App.Collections.Type2KeyWord.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 2));
			});

			i = 0;
			App.Collections.Type3KeyWord.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 3));
			});
	
			// console.log("Type1KeyWord", App.Collections.Type1KeyWord.length);
			// console.log("Type2KeyWord", App.Collections.Type2KeyWord.length);
			// console.log("Type3KeyWord", App.Collections.Type3KeyWord.length);

			// ... et enfin des items de la  de la query
			t.fetchItemsOfQuery(queryId);
		};
		
		t.ajax("search", jsonInput, success);

	},

	fetchItemsOfQuery: function(queryId) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "call",
			"params" : ["GetItemsWithDetailsByQuery", [queryId]]
		};
		
		var success = function(jsonResult) {
			
			var type1KeyWords = App.Collections.Type1KeyWord.getContents();
			var type2KeyWords = App.Collections.Type2KeyWord.getContents();
			var type3KeyWords = App.Collections.Type3KeyWord.getContents();
			
			// console.log("type1KeyWords", type1KeyWords);
			// console.log("type2KeyWords", type2KeyWords);
			// console.log("type3KeyWords", type3KeyWords);

			var itemsCollection = App.Collections.itemsCollection = new ItemsCollection();
			
			var i, n = jsonResult.length, jsonItem;
			var jsonItemVO, jsonItemUser, jsonItemCartos, jsonItemVotes, jsonItemComments, jsonItemMedias;
			var jsonItemMetas, jsonItemRate;
			
			var centreEl = $(".centre");
			var centreWidth  = centreEl.width();
			var centreHeight = centreEl.height();
			
			// console.log("fetchItemsOfQuery", n);
			
			for(i=0; i<n; i++)
			{
				jsonItem = jsonResult[i];
				
				jsonItemVO = jsonItem.VO;
				if (jsonItemVO._isValid != false)
				{
					jsonItemUser = jsonItem.user;
					jsonItemCartos = jsonItem.datas.Carto[0];
					jsonItemVotes = jsonItem.datas.Vote;
					jsonItemMetas = jsonItem.metas;
					jsonItemRate = jsonItem.rate;
					
					// console.log(jsonItemVotes);
					
					var votes = new DataVoteCollection(jsonItemVotes);
					votes.comparator = 'page';
					
					var metas = new MetaCollection(jsonItemMetas);
					metas.comparator = 'name';
					
					var itemModel = new ItemModel(jsonItemVO);
					itemModel.set("user"  , new UserModel(jsonItemUser));
					itemModel.set("cartos", new DataCartoModel(jsonItemCartos));
					itemModel.set("votes" , votes);
					itemModel.set("metas" , metas);
	
					//
					// Médias (selon type)
					//
					
					jsonItemMedias = jsonItem.medias;
					
					if (jsonItemMedias.Picture && (jsonItemMedias.Picture.length > 0))
					{
						itemModel.set("media", new MediaModel(jsonItemMedias.Picture[0]));
					}
					else if (jsonItemMedias.Video && (jsonItemMedias.Video.length > 0))
					{
						itemModel.set("media", new MediaModel(jsonItemMedias.Video[0]));
					}
					else if (jsonItemMedias.Sound && (jsonItemMedias.Sound.length > 0))
					{
						itemModel.set("media", new MediaModel(jsonItemMedias.Sound[0]));
					}
					else if (jsonItemMedias.Text && (jsonItemMedias.Text.length > 0))
					{
						itemModel.set("media", new MediaModel(jsonItemMedias.Text[0]));
					}
					
					itemModel.analyseMetaKeywords(type1KeyWords, type2KeyWords, type3KeyWords, t.metaStringToColor);
					
					itemsCollection.add ( itemModel ); 
				}
			}

			t.buildView();
		};
		
		t.ajax("plugins", jsonInput, success)
	},
	
	fetchProjectsSuccess: function() {
		/*
		var firstQueryModel = App.Views.QueriesView.collection.at(0);
		if (firstQueryModel)
		{
			var queryId = firstQueryModel.get("id");
			this.loadQuery(queryId);
		}
		*/
	},
	
	loadQuery: function(queryId) {
		
		this.loadDatasOfQuery(queryId);
		
		$(".queryTitre").removeClass("inactive").addClass("inactive");
		$(".queryTitre[data-id=" + queryId + "]").removeClass("inactive");
		
	},

	// Responsive des vues
	redrawViews: function() {
		this.buildView(true);
	},
	
	updateAllViews: function() {
		this.buildView(true);
	},

	// Si updateBool = true, on ne reconstruit pas les vues,
	// on se contente de mettre à jour les modèles (propriétés : left, top, percentTop, color)

	buildView: function( updateBool ) {
		
		var itemsCollection = App.Collections.itemsCollection;
		if (!itemsCollection) return;
		
		// console.log("buildView", itemsCollection.length)
		
		
		// Interface
		$(".menu").css("display", "block");
		$(".terme").css("opacity", 1);
		$(".retour").css("display", "block");
		$(".temoignage").css("display", "block");
		$(".plein_ecran").css("display", "none");
	
		//
		// Préparaton des données utilisées par les vues
		//
		
		itemsCollection.each(function(item)
		{
			if (updateBool != true)
			{
				//
				// Positions sur la carte
				//
				
				var cartos = item.get("cartos");
				if (cartos)
				{
					var sy = cartos.get("y");
					if (sy) {
						var cy = parseFloat(sy);
						if (cy != 0)
						{
							item.set("longitude", cy);
							
							var sx = cartos.get("x");
							var cx = parseFloat(sx);
							if (cx != 0) {
								item.set("latitude", cx);
							}
						}
					}
				}
			}
		});
		
		//
		// Vues
		//
		
		// Vue des items
		if (App.Views.MotifItemsView) App.Views.MotifItemsView.close();
		App.Views.MotifItemsView = new Chatanoo.MotifItemsView(itemsCollection);
		
		// Vue Mots-clés / Indices
		if (App.Views.MosaiqueMotsClesView) App.Views.MosaiqueMotsClesView.close();
		App.Views.MosaiqueMotsClesView = new Chatanoo.MosaiqueMotsClesView(itemsCollection);
		
		// Vue Carte Leaflet
		if (App.Views.MapItemsView) App.Views.MapItemsView.close();
		
		// Paramètres de la carte
		var mapParams = { latitude: this.latitudeGMaps, longitude: this.longitudeGMaps, zoom: this.zoomGMaps };
		
		App.Views.MapItemsView = new Chatanoo.LeafletMapItemsView(itemsCollection, mapParams);
		
		var mapElement = $(App.Views.MapItemsView.$el);
		
	},

	voteMediaItem: function(itemId, voteIc, voteRu) {
		
		// console.log(itemId, voteIc, voteRu);
		
		var t = this;
		var rate = t.getRate(voteIc, voteRu);
		
		var success = function(jsonResult) {
			
			// On veut récupérer les données du vote créées côté serveur (id, dates)
			var voteId = jsonResult;
			
			var getDataVoteByIdSuccess = function(jsonResult) {
				
				var itemCollection = App.Views.MosaiqueItemsView.collection;
				var itemModel = itemCollection.findWhere( {id:itemId });
				if (itemModel)
				{
					// Nouveau vote (données récupérées par "getDataVoteById")
					var newVote = new DataVoteModel( jsonResult );
					
					// On doit ajouter ce vote à la collection des votes de cet item
					var votesCollection = itemModel.get("votes");
					
					// Position actuelle (avant le vote)
					var positions = itemModel.get("positionsMoyenneVotes");
					var lastPosition = positions[positions.length - 1];
					
					// console.log("AVANT", votesCollection.length, positions.length, "position", lastPosition.x, lastPosition.y);
					
					// Ajout du nouveau vote
					votesCollection.add(newVote);
					
					// On doit mettre à jour la nouvelle position de l'item sur la mosaique
					var mosaique = $("#mosaique");
					var mosaiqueWidth  = mosaique.width();
					var mosaiqueHeight = mosaique.height();
					
					itemModel.computeRateFromVotes(mosaiqueWidth, mosaiqueHeight);
					
					// Position nouvelle (après le vote)
					var positions = itemModel.get("positionsMoyenneVotes");
					var lastPosition = positions[positions.length - 1];
					
					// console.log("APRES", votesCollection.length, positions.length, "position", lastPosition.x, lastPosition.y);
					
					// Déplacement de l'icône sur la mosaïque
					var itemIcon = itemModel.get("icon");
					if (itemIcon) itemIcon.move( { x: lastPosition.x, y: lastPosition.y } );
				}
				else
				{
					console.log("item non trouvé");
				}
			};
			
			t.getDataVoteById(voteId, getDataVoteByIdSuccess);
			
		}
		
		t.addDataVoteToItem(itemId, rate, success);
	},

	//
	// MediaPlayer
	//
	
	openMediaItem: function(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback) {
		
		var popupView = this.prepareMediaPlayer();
		
		// Media
		this.openMediaItemInPlayer(popupView, itemId, null, motCle1, motCle2, motCle3, title, userPseudo, endCallaback);
		
		// Titre _.capitalize()
		$(".popupMediaTitle").html( title);
		
		// Motif :
		this.addMotifOfItemInPlayer(popupView, itemId, motCle1, motCle2, motCle3);
	},
	
	openMediaItemIndices: function(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback) {
		
		var popupView = this.prepareMediaPlayer();
		$(".popupSliders").css("display", "none");
		
		// Media
		this.openMediaItemInPlayer(popupView, itemId, null, motCle1, motCle2, motCle3, title, userPseudo, endCallaback);
		
		// Titre _.capitalize()
		$(".popupMediaTitle").html( title);
		
		// Motif :
		this.addMotifOfItemInPlayer(popupView, itemId, motCle1, motCle2, motCle3);
	},
	
	addMotifOfItemInPlayer: function( popupView, itemId, motCle1, motCle2, motCle3 ) {
		
		if (! popupView.stage) {
			
			popupView.stage = new Kinetic.Stage({
				container: 'playerMotifItem',
				width : 400,
				height: 400
			});
			
			popupView.voteLayer = new Kinetic.Layer();
			popupView.stage.add(popupView.voteLayer);
		}
		
		var layer = popupView.voteLayer;
		var motif = createMotifs(layer, motCle1, motCle2, motCle3);
		
		var iconGroup = new Kinetic.Group({
			name: "iconGroup",
			scaleX:0.88,
			scaleY:0.88,
			rotation:20,
			x:180,
			y:200
		});
		
		iconGroup.add(motif);
		layer.add(iconGroup);
		layer.draw();
	},
	
	prepareMediaPlayer: function( playerWidth, playerHeight ) {
			
		var popUpElement = $("#popupPlayer");
		var parentPopUp = $(".global");
		
		if (popUpElement.length === 0)
		{
			parentPopUp.append('<div class="popup player" id="popupPlayer"></div>');
			popUpElement = $("#popupPlayer");
		}
		else
		{
			popUpElement.removeClass("player").addClass("player");
		}
		
		popUpElement.css("display", "block");
		
		// Taille de la popUp
		var popUpReference = $(".global");
		var popUpWidth = playerWidth || popUpReference.width();
		var popUpHeight = playerHeight || popUpReference.height();
		
		var popUp = new Chatanoo.PopUpView( { el : popUpElement } ).render( { width:popUpWidth, height:popUpHeight });
		
		var mediaWidth = 320;
		var mediaHeight = 240;
		
		popUp.mediaWidth = mediaWidth;
		popUp.mediaHeight = mediaHeight;
		
		var popUpSliders = $(".popupSliders", popUpElement);
		popUpSliders.css("top", (mediaHeight + 50) + "px");

		return popUp;
	},
	
	//
	// Vote
	//
	
	getRate: function (individuelCollectif, realisteUtopique)
	{
		var b1 = Math.floor(255 * individuelCollectif);
		var b2 = Math.floor(255 * realisteUtopique);
		var rate = Math.floor( (b1 << 8) | b2 );
		
		return rate;
	},
	
	getVoteFromRate: function (rate)
	{
		var 	ic = (rate >> 8 & 0xFF);
		var ru = (rate & 0xFF);
			
		return { ic:ic, ru:ru };
	},
	
	
	//
	// Mots-clés
	//
	
	metaStringToColor: function (motCleNo, type)
	{
		switch(type)
		{
			case 1:
				switch(motCleNo)
				{
					case 0: return "#1670f9";
					case 1: return "#5105dc";
					case 2: return "#007e91";
					case 3: return "#b8dff7";
					case 4: return "#adbff8";
					case 5: return "#2596cf";
					case 6: return "#c0b4de";
					case 7: return "#4aaece";
					case 8: return "#946cdc";
					
					default:
					return "#FF0000";
				}
			break;
			
			case 2:
				switch(motCleNo)
				{
					case 0: return "#fcff00";
					case 1: return "#5e9d5e";
					case 2: return "#7fe460";
					case 3: return "#d4ff04";
					case 4: return "#ffd62f";
					case 5: return "#dbe847";
					case 6: return "#fffdb5";
					case 7: return "#96bf07";
					case 8: return "#ffe610";
					
					default:
					return "#FF0000";
				}
			break;
			
			case 3:
				switch(motCleNo)
				{
					case 0: return "#c50137";
					case 1: return "#f04f73";
					case 2: return "#ff8700";
					case 3: return "#f62adf";
					case 4: return "#ffbed9";
					case 5: return "#ffad50";
					case 6: return "#f72b9a";
					case 7: return "#ca2bf7";
					case 8: return "#a61b00";
					
					default:
					return "#FF0000";
				}
			break;
		}
			
		return "#FF0000";
	},
		
	// --------------------------------------------------
	//
	// Formulaire d'Upload
	//
	// --------------------------------------------------

	openUploadView: function() {
	
		var t = this;
		
		var mosaique = $("#mosaique");
		var mosaiqueWidth  = mosaique.width();
		var mosaiqueHeight = mosaique.height();
		
		var popUpElement = $(".uploadParent");
		if (popUpElement.length == 0) {
			$(".global").append('<div class="uploadParent"></div>');
			popUpElement = $(".uploadParent");
		}
		
		popUpElement.css("display", "block");

		var options =  {
		};

		t.popupUpload = new Chatanoo.UploadView( { el : popUpElement } );
		t.popupUpload.urlCarte = t.mapURL;
		t.popupUpload.render( options );
		
		$(".uploadMargin", popUpElement).height( $(".ecrans").height() );

		t.changeLayoutForUpload();
		t.initLoginForm();
	},
	
	validUploadEtape3: function() {
		
		var t = this;
		
		var icSlider = $("#uploadSliderIc");
		var ruSlider = $("#uploadSliderRu");
		
		var ic = parseInt(icSlider.val()) / 100;
		var ru = parseInt(ruSlider.val()) / 100;
			
		var rate = t.getRate(ic, ru);

		// console.log("validUploadEtape3", ic, ru, rate);
		
		t.uploadVote = rate;
		
		$("#toEtape3Button").off("click");
		$("#etape_vote").css("display", "none");		
		
		t.displayUploadKeyWordSelectionView();
	},

	// Upload - Sélection des mots-clés :
	
	displayUploadKeyWordSelectionView: function() {
		
		var t = this;
				
		$("#etape_keyword").css("display", "block");
		
		$("#toEtape4Button").css("display", "none");
		$("#toEtape4Button").siblings(".etape").css("display", "none");

		var metas = new MetaCollection();
		var metaModel;

		var success = function(jsonResult) {
			
			// console.log("metas jsonResult", jsonResult);
			
			if (! jsonResult) return;
			
			// console.log("metas", jsonResult.length);
			
			var i, n = jsonResult.length, jsonItem;
			var metas = new MetaCollection();
			
			var type1KeyWords = new MetaCollection();
			var type2KeyWords = new MetaCollection();
			var type3KeyWords = new MetaCollection();
			
			for(i=0; i<n; i++)
			{
				jsonItem = jsonResult[i];
				switch(jsonItem.name)
				{
					case "Type1KeyWord":
					metaModel = new MetaModel(jsonItem);
					metaModel.set("typeMotCle", 1);
					metas.add( metaModel );
					type1KeyWords.add( metaModel );
					break;
					
					case "Type2KeyWord":
					metaModel = new MetaModel(jsonItem);
					metaModel.set("typeMotCle", 2);
					metas.add( metaModel );
					type2KeyWords.add( metaModel );
					break;
					
					case "Type3KeyWord":
					metaModel = new MetaModel(jsonItem);
					metaModel.set("typeMotCle", 3);
					metas.add( metaModel );
					type3KeyWords.add( metaModel );
					break;
					
					case "KeyWord":
					break;
					
					case "MapZoom":
					break;
					
					case "MapType":
					break;
				}
			}

			i = 0;
			type1KeyWords.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 1));
			});
			
			i = 0;
			type2KeyWords.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 2));
			});

			i = 0;
			type3KeyWords.each( function( keyword ) {
				 keyword.set("color", t.metaStringToColor(i++, 3));
			});
			
			t.initUploadKeywordSelect(metas);
		}
	
		// console.log("fetchMetasOfQuery queryId = ", t.uploadQueryId);
	
		// On récupère la liste des mots-clés de la question choisie dans le formulaire
		t.fetchMetasOfQuery(t.uploadQueryId, success);
	},
	
	initUploadKeywordSelect: function( queryKeyWordCollection ) {

		var t = this;
		
		// Tableau associatif des mots-clés selectionnés
		var keywordSelection = [];
		 
		// Liste des mots-clés de la question :
		var keywordsParent = $("#formKeywords");
		$(".keyword", keywordsParent).off();
		keywordsParent.html("");
		
		queryKeyWordCollection.each( function (keyword)
		{
			var keywordId = keyword.get("id");
			var keywordTitle = keyword.get("content");
			
			keywordsParent.append("<div class='keyword' data-id='" + keywordId + "'>" +  keywordTitle +"</div>");
		});

		$(".keyword", keywordsParent).off().on("click", function() {
			
			var keywords = [];
			for (var prop in keywordSelection)
			{
				keywords.push( keywordSelection[prop] );
			}
			
			var keywordElement = $(this);
			var keywordId = keywordElement.data("id");
			var keyword = queryKeyWordCollection.findWhere ( { id : keywordId + "" } );
			
			// console.log(keywordId, keyword);
			
			if (keywordElement.hasClass("selected"))
			{
				keywordElement.removeClass("selected");
				keywordSelection[keywordId] = null;
				delete keywordSelection[keywordId];
				
				keywords = [];
				for (var prop in keywordSelection) {
					keywords.push( keywordSelection[prop] );
				}
			}
			else
			{
				if (keywords.length < 3)
				{
					keywordElement.addClass("selected");
					keywordSelection[keywordId] = keyword;
					keywords.push(keyword);
				}
				else
				{
					// Il  y a déjà trois mots-clés, on n'autorise pas le nouveau mot-clé
					return;
				}
			}
			
			if (keywords.length > 0)
			{
				// On fait apparaître le bouton suite
				t.displayButtonToValidateUploadKeyWord(keywords);
			}
			else
			{
				$("#toEtape4Button").siblings(".etape").css("display", "none");
				$("#toEtape4Button").css("display", "none");
			}
		});
	
	},	
	
	displayButtonToValidateUploadKeyWord: function( keywords ) {
		
		var t = this;
		
		$("#toEtape4Button").siblings(".etape").css("display", "inline");
		$("#toEtape4Button").css("display", "inline");
		$("#toEtape4Button").off("click").on("click", function(){ t.validUploadEtape4( keywords); } );
	},

	validUploadEtape4: function( keywords ) {
		
		var t = this;	
		
		t.uploadKeyWords = keywords; 
		
		// console.log("validUploadEtape4", keywords);
		
		$("#toEtape4Button").off("click");
		$("#etape_keyword").css("display", "none");		
		
		t.displayUploadMapView();
	},
	
	getUploadMarker: function() {

		var t = this;

		// console.log(t.uploadKeyWords);
		
		var n = t.uploadKeyWords.length;
		
		var motCle1 = t.uploadKeyWords[0];
		var couleur1 = motCle1.get("color");
		var couleur2, couleur3;
		
		if (n > 1) {
			var motCle2 = t.uploadKeyWords[1];
			couleur2 = motCle2.get("color");
		}
		
		if (n > 2) {
			var motCle3 = t.uploadKeyWords[2];
			couleur3 = motCle3.get("color");
		}

		var arcJson = svgArcs(couleur1, couleur2, couleur3);
		arcJson.id = 0;
		
		var iconTemplate = _.template($("#bbcTemplate").html());
		var iconHtml = iconTemplate( arcJson );
		iconHtml = iconHtml.split("position:absolute").join("");
		
		var itemMapIcon = L.divIcon({ 
			iconSize: new L.Point(50, 50), 
			html: iconHtml
		});

		return itemMapIcon;	
	},
	
	// Upload - Envoi :
			
	envoiMotCleUpload: function() {

		var t = this;
		
		//
		// 4. Ajout du premier mot-clé à l'item
		//
		
		var successAddKeyWordToItem = function(jsonResult) {
		
			// console.log("successAddKeyWordToItem jsonResult = ", jsonResult); 
			
			if (! jsonResult) return;
			
			if (t.uploadKeyWords.length == 0)
			{
				// S'il n'y a plus de mot-clé à envoyer, on passe à la Carto :
				t.envoiCartoUpload();
			}
			else
			{
				// On passe au mot-clé suivant
				t.envoiMotCleUpload();
			}
		}
	
		// Envoi du mot-clé
		var keywordModel = t.uploadKeyWords.shift();
		var keywordId = keywordModel.get("id");
		var keywordContent = keywordModel.get("content");
		
		t.addMetaIntoVo(t.uploadItemId, keywordId, keywordContent, successAddKeyWordToItem);
	},
		
});


//
// Vues BBC : Items - votes
//

Chatanoo.MotifItemsView = Chatanoo.MosaiqueItemsView.extend({
	
	el: "#mosaique",
	
	initialize: function (itemCollection) {
		Chatanoo.MosaiqueItemsView.prototype.initialize.call(this, itemCollection);
	},
	
	render: function () {
		
		var t = this;
			
		var mosaique = $("#mosaique");
		var mosaiqueWidth  = mosaique.width();
		var mosaiqueHeight = mosaique.height();
		
		t.stage = new Kinetic.Stage({
			container: 'motifsItems',
			width : mosaiqueWidth,
			height: mosaiqueHeight
		});
		
		t.voteLayer = new Kinetic.Layer();
		t.stage.add(t.voteLayer);
		
		t.layer = new Kinetic.Layer();
		t.stage.add(t.layer);
		
		var scale = 0.20;
			
		t.collection.each(function(item)
		{
			var itemId = item.get("id");
			var motCle1 = item.get("motCle1");
			var motCle2 = item.get("motCle2");
			var motCle3 = item.get("motCle3");
			var titre = item.get("title");
			var user = item.get("user").get("pseudo");
			
			item.computeRateFromVotes(mosaiqueWidth, mosaiqueHeight);
			
			var positions = item.get("positionsMoyenneVotes");
			var lastPosition = positions[positions.length - 1];
			if (lastPosition)
			{
				// Création du motif de l'item
				var icon = createIcon(t.layer, lastPosition.x, lastPosition.y, scale, itemId, motCle1, motCle2, motCle3, titre, user);
				
				item.set("icon", icon);
			};
		});
		
		t.layer.draw();
		
	},
	
	removeSubviews: function () {
		
		var t = this;
		var layer = t.layer;
		
		if (layer) 
		{
			this.collection.each(function(item)
			{
				item.unset("icon");
			});
			
			var circles = t.layer.find(".iconCircle"); 
			_.each(circles, function(circle)
			{
				circle.off("mouseover");
				circle.off("mouseout");
				circle.off("click");
				
				layer.remove(circle);
			});
		}
	},
	
	close: function() {
		Chatanoo.MosaiqueItemsView.prototype.close.call(this);
	}	
});


//
// Vues BBC : Items - votes
//

Chatanoo.MosaiqueMotsClesView = Chatanoo.MosaiqueItemsView.extend({
	
	el: "#mosaique",
	
	initialize: function (itemCollection) {
		Chatanoo.MosaiqueItemsView.prototype.initialize.call(this, itemCollection);
	},
	
	render: function () {
		
		var t = this;
		var scale = 0.80;

		var mosaique = $("#mosaique");
		var mosaiqueWidth  = mosaique.width();
		var mosaiqueHeight = mosaique.height();
		
		// console.log( mosaiqueWidth, mosaiqueHeight);
		
		var scaleH = mosaiqueWidth / 600;
		var scaleV = mosaiqueHeight / 600;
		var scaleR = Math.min(scaleH, scaleV);
		
		scale *= scaleR;
		
		t.stage = new Kinetic.Stage({
			container: 'mandala',
			width : mosaiqueWidth,
			height: mosaiqueHeight,
			scaleX:scale,
			scaleY:scale,
			x: mosaiqueWidth / 2,
			y: mosaiqueHeight / 2
		});
		
		t.layer = new Kinetic.Layer();
		t.stage.add(t.layer);

		var motsClesType1 = App.Collections.Type1KeyWord;
		var motsClesType2 = App.Collections.Type2KeyWord;
		var motsClesType3 = App.Collections.Type3KeyWord;

		var meta, titre, motCle, pi = Math.PI, angleStep, radius, radians, degs, degToRad = pi / 180;
		var motif, noMotCle, n;
		var radiusScale = 0.6;
		var circle, colorTransparent = "rgba(0,0,0,0)";
		
		//
		// Type 1
		//
		
		var group1 = new Kinetic.Group({
			name: "group1"
		});
		
		n = motsClesType1.length;
		angleStep = n === 0 ? 0 : 360 / n;
		radius = 96 * radiusScale;
		
		for (noMotCle=0; noMotCle<n; noMotCle++)
		{
			meta = motsClesType1.at(noMotCle);
			motCle = { type:1, couleur: meta.get("color") }; 
			
			degs = noMotCle * angleStep;
			radians = degs * degToRad;
			
			motif = createMotif(motCle, 180 - degs);
			motif.position( { x: radius * Math.sin(radians), y: radius * Math.cos(radians) });
			group1.add(motif);
			
			// Zone circulaire pour contrer l'espace vide du motif
			circle = this.createCircle(50, colorTransparent);
			circle.position( {x: 0, y: -80} );
			motif.add(circle);
			
			circle.meta = meta;
			
			circle.on("mouseover", function() {
				t.showTitreIndice(1, this.meta);
			});
			
			circle.on("mouseout", function() {
				t.showTitreIndice();
			});
			
			circle.on("click", function() {
				t.showVideosIndice(1, this.meta);
			});
		}
		
		//
		// Type 2
		//
		
		var group2 = new Kinetic.Group({
			name: "group2"
		});
		
		n = motsClesType2.length;
		angleStep = n == 0 ? 0 : 360 / n;
		radius = 240 * radiusScale;
		
		for (noMotCle=0; noMotCle<n; noMotCle++)
		{
			meta = motsClesType2.at(noMotCle);
			motCle = { type:2, couleur: meta.get("color") }; 
			
			degs = angleStep / 2 + noMotCle * angleStep;
			radians = degs * degToRad;
			
			motif = createMotif(motCle, 180 - degs);
			motif.position( { x: radius * Math.sin(radians), y: radius * Math.cos(radians) });
			group2.add(motif);
			
			// Zone circulaire pour contrer l'espace vide du motif
			circle = this.createCircle(50, colorTransparent);
			circle.position( {x: 0, y: -80} );
			motif.add(circle);
			
			circle.meta = meta;
			
			circle.on("mouseover", function() {
				t.showTitreIndice(2, this.meta);
			});
			
			circle.on("mouseout", function() {
				t.showTitreIndice();
			});
			
			circle.on("click", function() {
				t.showVideosIndice(2, this.meta);
			});
		}
		
		//
		// Type 3
		//
		
		var group3 = new Kinetic.Group({
			name: "group3"
		});
		
		n = motsClesType3.length;
		angleStep = n == 0 ? 0 : 360 / n;
		radius = 320 * radiusScale;
		
		for (noMotCle=0; noMotCle<n; noMotCle++)
		{
			meta = motsClesType3.at(noMotCle);
			motCle = { type:3, couleur: meta.get("color") }; 
			
			degs = noMotCle * angleStep;
			radians = degs * degToRad;
			
			motif = createMotif(motCle, 180 - degs);
			motif.position( { x: radius * Math.sin(radians), y: radius * Math.cos(radians) });
			
			group3.add(motif);
			
			// Zone circulaire pour contrer l'espace vide du motif
			circle = this.createCircle(50, colorTransparent);
			circle.position( {x: 0, y: -80} );
			motif.add(circle);
			
			circle.meta = meta;
			
			circle.on("mouseover", function() {
				t.showTitreIndice(3, this.meta);
			});
			
			circle.on("mouseout", function() {
				t.showTitreIndice();
			});
			
			circle.on("click", function() {
				t.showVideosIndice(3, this.meta);
			});
		}
		
		// Cercle blanc
		var circle = this.createCircle(70);
		
		t.layer.add(group3);
		t.layer.add(group2);
		t.layer.add(group1);
		t.layer.add(circle);
		t.layer.draw();
		
		var marginTopTitre = Math.floor(mosaiqueHeight * 0.5) - 15;
		$(".titreIndice").css("margin-top", marginTopTitre + "px");
	},
	
	showTitreIndice: function(typeMotCle, meta) {
		if (! meta)
		{
			$(".titreIndice").html("");
			document.body.style.cursor = 'default';
		}
		else
		{
			var titre = meta.get("content");
			var items = this.getVideosIndice(typeMotCle, meta); 
			var nbVideos;
			if (items.length == 0) {
				nbVideos = "<span class='videos'>"+ titre + "</span>"; // titre en gris car pas de vidéos
			} else if (items.length == 1) {
				nbVideos = titre + "<br/><span class='videos'>1 vidéo</span>";
			} else {
				nbVideos = titre + "<br/><span class='videos'>" + items.length + " vidéos</span>";
			}
			
			$(".titreIndice").html(nbVideos);
			
			document.body.style.cursor = items.length == 0 ? 'default' : 'pointer';
		}
	},
	
	getVideosIndice: function(typeMotCle, meta) {

		var metaId = meta.get("id");
		var items = [];
		
		this.collection.each(function(item)
		{
			var motCle1 = item.get("motCle1");
			var motCle2 = item.get("motCle2");
			var motCle3 = item.get("motCle3");
			
			if ((typeMotCle == 1) && motCle1 && (motCle1.id == metaId)) {
				items.push(item);
			} else if ((typeMotCle == 2) && motCle2 && (motCle2.id == metaId)) {
				items.push(item);
			} else if ((typeMotCle == 3) && motCle3 && (motCle3.id == metaId)) {
				items.push(item);
			}
		});

		return items;	
	},
	
	showVideosIndice: function(typeMotCle, meta) {
		var items = this.getVideosIndice(typeMotCle, meta); 
		if (! items) return;
	
		if (items.length > 0) {
			var v = App.eventManager;
			if (v) v.trigger("itemsSelection", items.concat() );
		}
	},
	
	createCircle: function( radius, color ) {
		
		if (! color) color = "white";
		
		var angle0 = 0;
		var angle2PI = 2 * Math.PI;
		var circle = new Kinetic.Shape({
			fill : color,
			drawFunc: function(context) {
				context.beginPath();
				context.arc(0, 0, radius, angle0, angle2PI, true);
				context.fillShape(this);
			}
		});
		
		return circle;
	},
	
	removeSubviews: function () {
	},
	
	close: function() {
		Chatanoo.MosaiqueItemsView.prototype.close.call(this);
	}	
});



//
// Vues BBC : Items - Carte Leaflet / OpenStreetMap
//

Chatanoo.LeafletMapItemsView = Chatanoo.MosaiqueItemsView.extend({
	
	el: "#carte",
	className:"carte",
	
	initialize: function (itemCollection, params) {
		
		this.initSubviews();
		
		// Params
		this.mapParams = params;
		
		// Liste des items
		this.collection = itemCollection;
		
		this.render();
	},
	
	render: function () {
		
		this.removeSubviews();
		
		var carte_osm = $("#carte_osm");
		if (carte_osm.length == 0) {
			this.$el.html('<div id="carte_osm" style="width:100%;height:100%"></div>');
		}
		
		var latitude = this.mapParams.latitude;
		var longitude = this.mapParams.longitude;
		var zoom = this.mapParams.zoom;
		
		var map = App.LeafLetMap;
		if (! map) {
			
			map = L.map('carte_osm');
			
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);
		
			App.LeafLetMap = map;
		}
		
		map.setView([latitude, longitude], 12);
		
		
		// 2. Items de la carte
		
		var markers = this.markers;
		var marker;
		
		if (markers) {
			for(i=0; i<marker.length; i++)
			{
				marker = marker[i];
				marker.off("click"); 
				map.removeLayer(marker);
			}
		}

		this.markers = [];

		var iconTemplate = _.template($("#bbcTemplate").html());
		
		_.each(this.collection.models, function (item) {
	
			var lat = item.get("latitude");
			var long = item.get("longitude");
			var itemId = item.get("id");
			var titre = item.get("title");
			var user = item.get("user").get("pseudo");
			
			if ( ! isNaN(lat) && ! isNaN(long) )
			{
				var couleur1, motCle1 = item.get("motCle1");
				var couleur2, motCle2 = item.get("motCle2");
				var couleur3, motCle3 = item.get("motCle3");
			
				if (motCle1) couleur1 = motCle1.couleur;
				if (motCle2) couleur2 = motCle2.couleur;
				if (motCle3) couleur3 = motCle3.couleur;
				
				var arcJson = svgArcs(couleur1, couleur2, couleur3);
				arcJson.id = itemId;
				
				var iconHtml = iconTemplate( arcJson );
				
				iconHtml = iconHtml.split("position:absolute").join("");
				
				var itemMapIcon = L.divIcon({ 
					iconSize: new L.Point(50, 50), 
					html: iconHtml
				});
		
				marker = new L.Marker( new L.LatLng(lat, long), { icon : itemMapIcon } ).addTo(map);
				
				// Click :
				marker.on("click", function(e)
				{
					var v = App.eventManager;
					if (v) {
						v.trigger("itemSelection", itemId, null, motCle1, motCle2, motCle3, titre, user);
					}
				});
				
				// RollOver
				marker.on("mouseover", function(e)
				{
					var v = App.eventManager;
					if (v)  {
						var el = $(".itemTitre.item" + itemId, ".leaflet-container");
						if (el.length > 0) {
							var position = {left: e.originalEvent.clientX - 80, top: e.originalEvent.clientY - 100};
							v.trigger("itemRollOver", itemId, titre, user, position);
						}
					}
				});
			
				// RollOut
				marker.on("mouseout", function(e)
				{
					var v = App.eventManager;
					if (v)  {
						var el = $(".leaflet-container .itemTitre.item" + itemId);
						if (el.length > 0) {
							var position = {left: e.originalEvent.clientX - 80, top: e.originalEvent.clientY - 100};
							v.trigger("itemRollOut", itemId, titre, user, position);
						}
					}
				});

				this.markers.push(marker);
			}
			
		}, this);
		
	},
	
	removeSubviews: function () {

		_.each(this.childViews, function(childView)
		{
			if (childView.close) {
				// cf prototype.close un peu plus haut
				childView.close();
			}
		});

		this.$el.find(".dringItem").remove();
	},
	
	close: function() {

		var map = App.LeafLetMap;
		if (map && _.isArray(this.markers)) {
			
			var i, n = this.markers.length, marker;
			for(i=0; i<n; i++)
			{
				marker = this.markers[i];
				marker.off("click");
				marker.off("mouseover");
				marker.off("mouseout");
				
				map.removeLayer(marker);
			}
			
			this.markers = null;
		}
		
		Backbone.CollectionView.prototype.close.call(this);
	}	
});