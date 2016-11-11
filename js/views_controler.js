
//
// Contrôleur de l'application
//

var AppView = Backbone.View.extend({

	authentificationID: null,
	
	accueilElement: $(".global .centre .accueil"),
	mosaiqueElement: $(".global .centre .mosaique"),
	
	initialize: function () {
		this.serviceURL = "http://ws.dring93.org/services";
		this.uploadURL = "http://ms.dring93.org/upload";
		this.mediaCenterURL = "http://ms.dring93.org/m/";
		this.awsURL = "http://medias.aws.chatanoo.org/";
		this.mapURL = "medias/cartes/CARTE_DRING13.jpg";
		this.keyApi = "qJlCaSsBbYBYypwF9TT8KmCOxhuZ3wIj";
		this.adminParams = ["mazerte", "desperados", this.keyApi];
	},
	

	// --------------------------------------------------
	//
	// Mosaïque
	//
	// --------------------------------------------------



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
		
	},
	
	authentification: function( params, callback ) {
		
		var t = this;
		var v = App.eventManager;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "login",
			"params" : params || t.adminParams
		}
		
		var success = function(jsonResult) {
			
			t.authentificationID = jsonResult;
			
			if (callback)
			{
				callback();
			}
			else
			{
				v.trigger("authentificationSuccess");
			}
		}
		
		t.ajax("connection", jsonInput, success)
	},
		
	fetchProjects: function() {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getQueries",
			"params" : []
		};
		
		var success = function(jsonResult) {
			
			//
			// Création de la liste des projets (Queries) sur la page d'accueil
			//
			
			App.Views.QueriesView = new Chatanoo.QueriesView(jsonResult);
			
			// console.log("queries", App.Views.QueriesView.collection);
			
			t.fetchProjectsSuccess();
		};
		
		t.ajax("queries", jsonInput, success)
	},

	fetchProjectsSuccess: function() {
	},
	
	selectQueryModel: function(queryModel) {
	},
	
	loadDatasOfQuery: function(queryId) {
		
		var t = this;
		
		// On masque l'accueil et on affiche la mosaique
		t.accueilElement.css("display", "none");
		t.mosaiqueElement.css("display", "block");
		
		// Données de la query (carto)
		t.fetchDatasOfQuery(queryId);
	},

	fetchDatasOfQuery: function(queryId) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getDatasByQueryId",
			"params" : [queryId]
		};
		
		var success = function(jsonResult) {
			
			// console.log("datas", jsonResult.length);
			
			// ... puis des méta-données de la  de la query (mots-clés)
			t.fetchMetasOfQuery(queryId);
		};
		
		t.ajax("datas", jsonInput, success)
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
			
			// Liste des mots-clés de la question en cours
			App.Collections.keyWord = new MetaCollection();
			
			for(i=0; i<n; i++)
			{
				jsonItem = jsonResult[i];
				
				switch(jsonItem.name)
				{
					case "KeyWord":
					App.Collections.keyWord.add( new MetaModel(jsonItem) );
					break;
					
					case "MapZoom":
					break;
					
					case "MapType":
					break;
				}
			}
	
			// console.log("keyWord", App.Collections.keyWord.length);

			// ... et enfin des items de la  de la query
			t.fetchItemsOfQuery(queryId);
		};
		
		t.ajax("search", jsonInput, success)
	},

	fetchItemsOfQuery: function(queryId) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "call",
			"params" : ["GetItemsWithDetailsByQuery", [queryId]]
		};
		
		var success = function(jsonResult) {
			
			var keyWords = App.Collections.keyWord.getContents();
			
			// TODO : Stocker les collections d'items des différentes Query pour ne pas les recharger
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
					
				// console.log(jsonItem);
					
				if (jsonItemVO._isValid != false)
				{
					jsonItemUser = jsonItem.user;
					jsonItemCartos = jsonItem.datas.Carto[0];
					jsonItemVotes = jsonItem.datas.Vote;
					jsonItemMetas = jsonItem.metas;
					jsonItemRate = jsonItem.rate;
					
					// console.log(jsonItemVotes);
					
					var user = new UserModel(jsonItemUser);
					
					var cartos = new DataCartoModel(jsonItemCartos);
					// console.log("cartos", cartos);
					
					var votes = new DataVoteCollection(jsonItemVotes);
					votes.comparator = 'page';
					
					var metas = new MetaCollection(jsonItemMetas);
					metas.comparator = 'name';
					
					var itemModel = new ItemModel(jsonItemVO);
					itemModel.set("rate"  , jsonItemRate);
					itemModel.set("user"  , user);
					itemModel.set("cartos", cartos);
					itemModel.set("votes" , votes);
					itemModel.set("metas" , metas);
					

					itemModel.analyseMetaKeywords();
					
					itemsCollection.add ( itemModel ); 
				}
			}
			
			t.buildView();
		};
		
		t.ajax("plugins", jsonInput, success)
	},

	buildView: function() {
	
		var itemsCollection = App.Collections.itemsCollection;
	
		//
		// Création de la liste des projets (Items) sur la mosaïque
		//
		
		App.Views.MosaiqueItemsView = new Chatanoo.MosaiqueItemsView(itemsCollection);	
	},
		
	fetchMediaOfItem: function(itemId, success) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getMediasByItemId",
			"params" : [itemId]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("medias", jsonInput, success)
	},


	/* Commentaires des items */
	
	fetchCommentsOfItem: function(itemId, success) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getCommentsByItemId",
			"params" : [itemId]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("comments", jsonInput, success)
	},
	
	fetchDataOfCommentOfItem: function(commentId, itemId, success) {

		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getDatasByCommentId",
			"params" : [commentId, itemId]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("datas", jsonInput, success)
		
	},

	addCommentToItem: function(itemId, commentModel, vote, success) {

		// JSON ou model BackBoneJS ?
		var commentJSON = commentModel.toJSON ? commentModel.toJSON() : commentModel;

		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addCommentIntoItem",
			"params" : [ commentJSON, parseInt(itemId), vote]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success)
		
	},

	addVoteToComment: function(voteModel, commentId, voteValue, itemId, success) {

		// JSON ou model BackBoneJS ?
		var voteJSON = voteModel.toJSON ? voteModel.toJSON() : voteModel;
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addDataIntoVo",
			"params" : [ voteJSON, parseInt(commentId), voteValue, parseInt(itemId)]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("comments", jsonInput, success)
		
	},

	getRateOfToItem: function(itemId, success) {

		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getRateOfItem",
			"params" : [ itemId ]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success)
		
	},	


	/* Titres des items (affichés en rollOver) */

	getParentTooltip: function() {
		return $(".global");
	},
	
	openTooltipItem: function(itemId, titre, position) {
		
		var parentToolTip = this.getParentTooltip()
		
		var tooltipEl = $(".tooltip", parentToolTip);
		if (tooltipEl.length == 0) {
			parentToolTip.append("<div class='tooltip'>" + titre + "</div>");
		}
		
		
		var parentWidth = parentToolTip.width();
		var parentHeight = parentToolTip.height();
		
		tooltipEl = $(".tooltip", parentToolTip);
		
		var toolTipWidth  = tooltipEl.width();
		var toolTipHeight = tooltipEl.height();
		
		var positionLeft = Math.floor(position.left - toolTipWidth * 0.5);
		var positionTop = Math.floor(position.top - 110 - toolTipHeight * 0.5);
		
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
	},
	
	closeTooltipItem: function(itemId, titre, position) {
		var parentToolTip = this.getParentTooltip()
		var tooltipEl = $(".tooltip", parentToolTip);
		tooltipEl.remove();
	},
	
	
	
	/* MediaPlayer */
	
	openMediaItem: function(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback) {
		var popupView = this.prepareMediaPlayer();
		this.openMediaItemInPlayer(popupView, itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback);
	},

	openMediaItemIndices: function(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback) {
		this.openMediaItemIndices(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback);
	},
	
	openNextMediaOfItems: function( items ) {
		
		// console.log("openNextMediaOfItems", items.length);
		
		if (items.length > 0) {
			
			var nextItem = items.shift();
			
			var itemId  = nextItem.get("id");
			
			var motCle  = nextItem.get("motCle");
			var motCle1 = nextItem.get("motCle1");
			var motCle2 = nextItem.get("motCle2");
			var motCle3 = nextItem.get("motCle3");
			var title   = nextItem.get("title");
			
			var userPseudo, user = nextItem.get("user");
			if (user) {
				userPseudo = nextItem.get("pseudo"); 
			}
	
			var t = this;
			var endCallaback;
			
			if (items.length > 0) {
				endCallaback = function() {
					// A la fin de la visualisation,
					// on recommencera avec la liste (moins le media en cours)
					t.openNextMediaOfItems(items);
				}
			}
		
			t.openMediaItemIndices(itemId, motCle, motCle1, motCle2, motCle3, title, userPseudo, endCallaback);
		}
		
	},
	
	prepareMediaPlayer: function( playerWidth, playerHeight ) {
			
		// TODO On affiche la popUp avec un Gif de chargement
		
		var popUpElement = $("#popup");
		popUpElement.css("display", "block");
		
		// Taille de la popUp
		var popUpReference = $("#mosaique");
		var popUpWidth = playerWidth || popUpReference.width();
		var popUpHeight = playerHeight || popUpReference.height();
		
		var popUp = new Chatanoo.PopUpView( { el : popUpElement } ).render( { width:popUpWidth, height:popUpHeight });
		
		var mediaWidth = Math.floor(popUpWidth * 0.9);
		var mediaHeight = Math.floor(popUpHeight * 0.9) - 80;
		
		popUp.mediaWidth = mediaWidth;
		popUp.mediaHeight = mediaHeight;
		
		var popUpContentMedia = $(".popupMediaPlayer", popUpElement);
		popUpContentMedia.css("width", mediaWidth + "px");
		popUpContentMedia.css("height", mediaHeight + "px");
		popUpContentMedia.css("margin-left", (popUpWidth * 0.05) + "px");
		popUpContentMedia.css("margin-top", (popUpHeight * 0.05) + "px");
		
		var popUpSliders = $(".popupSliders", popUpElement);
		popUpSliders.css("top", (mediaHeight + 50) + "px");

		return popUp;
	},

	getPictureURL: function(imageURL) {
		if (imageURL.indexOf("P-") == 0) {
			return this.awsURL + imageURL + "/image.png"; 
		}		
		return this.mediaCenterURL + imageURL + ".jpg";
	},

	getImageKey: function( imageID ) {
		return imageID + "/image.png";
	},

	getImagePath: function( imageID ) {
		if (imageID.indexOf('http') == 0) {
			return imageID;
		} else if(imageID.indexOf('P-') == 0) {
			return this.awsURL + this.getImageKey(imageID);
		} else {
			return this.mediaCenterURL + imageID + ".jpg";
		}
	},

	createImageView: function( element, itemId, mediaId, imageID ) {
		var t = this;
		var mediaPath = t.getImagePath(imageID);
		var model = new MediaModel( { itemId: itemId, id: mediaId, url: mediaPath } );
		var imageView = new Chatanoo.ImageView( { el: element, model: model } ).render();

		return { model:model, view:imageView };
	},

	getVideoPath: function(videoID) {
		if (videoID.indexOf('http') == 0) {
			return videoID;
		} else if(videoID.indexOf('M-') == 0) {
			return this.awsURL + this.getVideoKey(videoID);
		} else {
			return this.mediaCenterURL + videoID + ".mp4";
		}
	},
	
	getVideoKey: function( videoID ) {
		return videoID + "/video.mp4";
	},

	createVideoView: function( element, itemId, mediaId, videoID, width, height, endCallback) {

		var t = this;

		var extension = ".mp4";
		var mime = "video/mp4";
		var mediaPath = t.getVideoPath(videoID);

		var model = new MediaModel( { itemId: itemId, id: mediaId, url: mediaPath, mime:mime, width:width, height:height, autoplay: true } );
		var videoView = new Chatanoo.VideoView( { el: element, model: model } ).loadVideo( endCallback );

		return { model:model, view:videoView };
	},

	getAudioKey: function( audioID ) {
		return audioID + "/audio.mp3";
	},

	getSoundPath: function(audioID) {
		if (audioID.indexOf('http') == 0) {
			return audioID;
		} else if(audioID.indexOf('A-') == 0) {
			return this.awsURL + this.getAudioKey(audioID);
		} else {
			return this.mediaCenterURL + audioID + ".mp3";
		}
	},
	
	createAudioView: function( element, itemId, mediaId, audioID, endCallback) {
		var t = this;

		var extension = ".mp3";
		var mime = "audio/mp3";
		var mediaPath = t.getSoundPath(audioID);

		var model = new MediaModel( { itemId: itemId, id: mediaId, url: mediaPath, mime:mime, autoplay: true } );
		var audioView = new Chatanoo.AudioView( { el: element, model: model } ).loadAudio( endCallback );

		return { model:model, view:audioView };
	},
	
	createTextView: function( element, itemId, mediaId, textContent) {
		var t = this;
		
		var model = new TextMediaModel( { itemId: itemId, id: mediaId, content: textContent } );
		var textView = new Chatanoo.TextMediaView( { el: element, model: model } ).render();
		
		return { model:model, view:textView };
	},
	
	openMediaItemInPlayer: function( popupView, itemId, motCle, motCle1, motCle2, motCle3, titre, pseudo, endCallback) {

		// console.log("openMediaItemInPlayer", itemId);

		var t = this;

		if (t.mediaViewAndModel && t.mediaViewAndModel.view) {
			t.mediaViewAndModel.view.close();
			t.mediaViewAndModel = null;
		}

		var popUpElement = popupView.$el;
		var mediaTitle = $(".popupTitle", popUpElement);
		var mediaParent = $(".popupMediaPlayer", popUpElement);
		var mediaWidth = popupView.mediaWidth;
		var mediaHeight = popupView.mediaHeight;
		
		if ((titre == "") || (titre == null)) titre = "(Sans titre)";
		
		mediaTitle.html(titre + "<br/><span class='username'>par " + pseudo + "</span>");
		
		var success = function(jsonResult) {

			// console.log("openMediaItemInPlayer success", itemId);

			if (jsonResult.Picture && (jsonResult.Picture.length > 0))
			{
				var imageObject = jsonResult.Picture[0];
				var imageId = imageObject.id;
				var titreImage = imageObject.title;
				var urlImage = imageObject.url;
				
				// console.log("media", imageId, titreImage, urlImage);

				t.mediaViewAndModel = t.createImageView( mediaParent, itemId, imageId, urlImage );

				popupView.model = t.mediaViewAndModel.model;
				
				if (endCallback) {
					// On affiche l'image 10 secondes
					popupView.createTimeOut( endCallback, 10000 );
				}
			}
			else if (jsonResult.Video && (jsonResult.Video.length > 0))
			{
				var videoObject = jsonResult.Video[0];
				var videoId = videoObject.id;
				var titreVideo = videoObject.title;
				var urlVideo = videoObject.url;
				
				// console.log("media", videoId, titreVideo, urlVideo);

				t.mediaViewAndModel = t.createVideoView( mediaParent, itemId, videoId, urlVideo, mediaWidth, mediaHeight, endCallback );
				
				popupView.model = t.mediaViewAndModel.model;
			}
			else if (jsonResult.Sound && (jsonResult.Sound.length > 0))
			{
				var audioObject = jsonResult.Sound[0];
				var audioId = audioObject.id;
				var titreAudio = audioObject.title;
				var urlAudio = audioObject.url;
				
				// console.log("media", audioId, titreAudio, urlAudio);

				t.mediaViewAndModel = t.createAudioView( mediaParent, itemId, audioId, urlAudio, endCallback );

				popupView.model = t.mediaViewAndModel.model;
			}
			else if (jsonResult.Text && (jsonResult.Text.length > 0))
			{
				console.log("openMediaItem : Text --> TODO : div texte ", jsonResult );
				
				var textObject = jsonResult.Text[0];
				var textId = textObject.id;
				var textContent = textObject.content;

				t.mediaViewAndModel = t.createTextView( mediaParent, itemId, textId, textContent );
				
				popupView.model = t.mediaViewAndModel.model;
				
				if (endCallback) {
					// On affiche le texte 10 secondes
					popupView.createTimeOut( endCallback, 2000 );
				}
			}
			else
			{
				// console.log("openMediaItem : type non prévu", jsonResult );
			}
						
		};
		
		t.fetchMediaOfItem(itemId, success);
	},	



	/* Vote */

	voteMediaItem: function(itemId, voteIc, voteRu) {
		
		// console.log("vote BBC", itemId, voteIc, voteRu);
		
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
					itemModel.updateColor();
					
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
					// console.log("item non trouvé");
				}
			};
			
			t.getDataVoteById(voteId, getDataVoteByIdSuccess);
			
		}
		
		t.addDataVoteToItem(itemId, rate, success);
	},

	addDataVoteToItem: function(itemId, rate, success) {
		
		var t = this;
		
		var userId = t.currentUserId ? t.currentUserId : 0;
		var dataVo = {"users_id":userId, "rate":rate, "__className":"Vo_Data_Vote", "id":0, "setDate":null, "addDate":null};
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addDataIntoVo",
			"params" : [dataVo, itemId]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success)
	},

	getDataVoteById: function(voteId, success) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getDatasById",
			"params" : [voteId, "Vote"]
		};
		
		var success = success || function(jsonResult) {
			// console.log(jsonResult);
		};
		
		t.ajax("datas", jsonInput, success)
	},

	addItemIntoQuery: function(queryId, mediaTitle, mediaFilename, success) {
		
		var t = this;
		
		var userId = t.currentUserId ? t.currentUserId : 0;
		var itemVO = {"users_id":userId, "title": mediaTitle, "rate":0, "__className":"Vo_Item", "isValid":true, "id":0, "rate":0, "description":"", "setDate":null, "addDate":null};
		var mediaVO = {"title": mediaTitle, "fileName": mediaFilename};
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addItemIntoQuery",
			"params" : [itemVO, queryId, mediaVO]
		};
		
		var success = success || function(jsonResult) {
			// Retourne l'id de l'item ajouté
			// console.log(jsonResult);
		};
		
		t.ajax("queries", jsonInput, success)
	},

	addMediaIntoItem: function(itemId, mediaTitle, mediaFilename, textMediaContent, success) {
		
		var t = this;
		var userId = t.currentUserId ? t.currentUserId : 0;
		var mediaVO;
		
		if (textMediaContent != null)
		{
			// a. Envoi d'un témoignage texte		
			mediaVO = {"users_id":userId, "content":textMediaContent, "title":mediaTitle, "__className":"Vo_Media_Text", "isValid":true, "id":0, "description":null, "setDate":null, "addDate":null};
		}
		else
		{
			// b. Envoi d'un témoignage media (image, vidéo, audio)
			var mediaArray = mediaFilename.split("-");
			var mediaType = mediaFilename.charAt(0);

			switch(mediaType)
			{
				case "P":
				mediaVO = {"users_id":userId, "url":mediaFilename, "title":mediaTitle, "__className":"Vo_Media_Picture", "isValid":true, "id":0, "preview":null, "width":null,"height":null, "description":null, "setDate":null, "addDate":null};
				break;
				
				case "M":
				mediaVO = {"users_id":userId, "url":mediaFilename, "title":mediaTitle, "__className":"Vo_Media_Video", "isValid":true, "id":0, "preview":null, "width":null,"height":null, "description":null, "setDate":null, "addDate":null};
				break;
				
				case "A":
				mediaVO = {"users_id":userId, "url":mediaFilename, "title":mediaTitle, "__className":"Vo_Media_Sound", "isValid":true, "id":0, "description":null, "setDate":null, "addDate":null};
				break;
				
				default:
				console.log("Erreur : Envoi d'un media de type non reconnu...");
				return;
			}
			
		}
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addMediaIntoItem",
			"params" : [mediaVO, itemId]
		};
		
		var success = success || function(jsonResult) {
			// Retourne l'id du media ajouté
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success);
	},

	addMetaIntoVo: function(itemId, metaId, metaContent, success) {
		
		var t = this;
		var metaVO = {"content": metaContent, "id":metaId, "name":"KeyWord", "__className":"Vo_Meta"};
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addMetaIntoVo",
			"params" : [metaVO, itemId]
		};
		
		var success = success || function(jsonResult) {
			// Retourne l'id de la meta ajoutée
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success)
	},

	addDataCartoToItem: function(itemId, latitude, longitude, success) {
			
		var t = this;
		
		var userId = t.currentUserId ? t.currentUserId : 0;
		var dataVo = {"x":latitude, "y":longitude, "__className":"Vo_Data_Carto", "id":0, "setDate":null, "addDate":null};

		// {"method":"addDataIntoVo","id":"R7BZ-HISJ-INAM-FNG0-5KB9-7PUH","params":[{"x":48.81390517570364,"addDate":null,"setDate":null,"id":0,"y":2.344161101081081,"__className":"Vo_Data_Carto"},1219]}
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "addDataIntoVo",
			"params" : [dataVo, itemId]
		};
		
		// console.log("addDataCartoToItem", jsonInput);
			
		var success = success || function(jsonResult) {
			// Retourne l'id de la data Carto
			// console.log(jsonResult);
		};
		
		t.ajax("items", jsonInput, success)
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
		popUpElement.css("width", mosaiqueWidth + "px");
		popUpElement.css("height", mosaiqueHeight + "px");


		var options =  {
		};

		t.popupUpload = new Chatanoo.UploadView( { el : popUpElement } );
		t.popupUpload.urlCarte = t.mapURL;
		t.popupUpload.render( options );

		var popUpContent = $(".uploadContent", popUpElement);
		popUpContent.css("width", mosaiqueWidth + "px");
		popUpContent.css("height", mosaiqueHeight + "px");
		
		t.changeLayoutForUpload();
		t.initLoginForm();
	},

	changeLayoutForUpload: function() {
	},
	
	restoreLayoutAfterUpload: function() {
	},
	
	closePopUpWithCloseButton: function() {
		console.log("closePopUpWithCloseButton");
		var t = this;
		t.restoreLayoutAfterUpload();
	},
	
	closeUploadView: function() {
		var t = this;
		if (t.tryToLoadConvertedTimeout) clearInterval(t.tryToLoadConvertedTimeout);
		if (t.popupUpload) t.popupUpload.closePopUp();
	},
	
	initLoginForm: function () {
		
		var t = this;
		t.initUploadQuerySelect();

		// Fomulaire de login
		$("#login-button").on("click", function(event) {
			event.preventDefault();
			t.checkLoginForUpload();
		});

		// Fomulaire d'inscriptiob
		$("#inscription-button").on("click", function(event) {
			event.preventDefault();
			t.addUser();
		});
		
		$("#loginError").empty();
		
		$(".tabLoginInscription .login").off().on("click", function() {
			$(".loginForm").css("display", "block");
			$(".inscriptionForm").css("display", "none");
			$(".tabLoginInscription .login").removeClass("selected").addClass("selected");
			$(".tabLoginInscription .inscription").removeClass("selected");
		});
		
		$(".tabLoginInscription .inscription").off().on("click", function() {
			$(".loginForm").css("display", "none");
			$(".inscriptionForm").css("display", "block");
			$(".tabLoginInscription .login").removeClass("selected");
			$(".tabLoginInscription .inscription").removeClass("selected").addClass("selected");
		});	
	},
	
	checkLoginForUpload: function() {
		
		var t = this;
		
		var pseudo = $("#pseudo").val();
		var password = $("#password").val();
		
		$("#loginError").empty();
		
		// console.log("checkLoginForUpload", pseudo, password);
		
		var success = function(jsonResult) {
			
			if (jsonResult == null)
			{
				// Identifiants non valides
				$("#loginError").html( "Les identifiants proposés ne sont pas reconnus." );
			}
			else
			{
				// Identifiants valides
				// console.log("login : user id = ", jsonResult.id);
				t.uploadUserId = t.currentUserId = jsonResult.id;				
				t.authentification ( [ pseudo, password, t.adminParams[2] ] , function() {
					t.initUploadForm();
				});
			}
		};
		
		t.getUserByLogin( pseudo, password, success );
		
	},

	getUserByLogin: function(pseudo, password, success) {
		
		var t = this;
		
		var jsonInput = {
			"id" : t.generateID(),
			"method" : "getUserByLogin",
			"params" : [pseudo, password]
		};
		
		t.ajax("users", jsonInput, success);	
	},
	
	addUser: function() {
		
		var t = this;
		
		var nom = $("#adduser_nom").val();
		var prenom = $("#adduser_prenom").val();
		var pseudo = $("#adduser_pseudo").val();
		var password = $("#adduser_password").val();
		var email = $("#adduser_email").val();

		if (( pseudo.length == 0 ) || ( password.length == 0 ))
		{
			alert ("Attention le pseudo et le mot de passe doivent être remplis !");
			return;
		}

		var success = function(jsonResult) 
		{
			if ( jsonResult != null )
			{
				alert ("Ce pseudo existe déjà !");
			}
			else
			{
				var userVO = {"email":email, "__className":"Vo_User", "id":0, "pseudo":pseudo, "password":password, "isBan":false, "lastName":nom, "role":null, "firstName":prenom, "addDate":null, "setDate":null};
				
				var jsonInput = {
					"id" : t.generateID(),
					"method" : "addUser",
					"params" : [userVO]
				};
				
				var success = function(jsonResult) {
					
					if (jsonResult == null)
					{
					}
					else
					{
						// Nouvel utilisateur
						// console.log("inscription : user id = ", jsonResult.id);				
						t.uploadUserId = t.currentUserId = jsonResult.id;
						t.authentification ( [ pseudo, password, t.adminParams[2] ] , function() {
							t.initUploadForm();
						});
					}
				};
				
				t.ajax("users", jsonInput, success)
			}
		};
		
		// On vérifie d'abord que le couple n'existe pas déjà :
		t.getUserByLogin( pseudo, password, success );
	},

	initUploadQuerySelect: function() {

		var t = this;

		// Liste des questions :
		var questionSelect = $("#formQueries");
		var queryCollection = App.Collections.queries || App.Views.QueriesView.collection;
		
		// 
		t.uploadQueryId = t.currentQuery ? t.currentQuery : queryCollection.at(0).get("id");
		
		// console.log("initUploadForm", queryCollection.length, questionSelect);
		
		queryCollection.each( function (query)
		{
			var queryId = query.get("id");
			var queryTitle = query.get("content");
			if (queryTitle.length > 0)
			{
				if (queryId == t.currentQuery)
				{
					// Par défaut on sélectionne la question courante de la mosaïque
					questionSelect.append("<option data-id='" + queryId + "' value=' " + queryId + "' selected='selected'>" +  queryTitle +" </option>");
				}
				else
				{
					questionSelect.append("<option data-id='" + queryId + "' value=' " + queryId + "'>" +  queryTitle +" </option>");
				}
			}
		});
		
		questionSelect.off().on("change", function(e) {
			
			var queryId = $(e.target).val();
			// console.log("change", queryId);
			
			t.uploadQueryId = queryId;
		});
		
	},
	
	disableUploadSubmitButton: function( bool ) {
		document.getElementById('uploadButton').disabled = bool;
	},
	
	initUploadForm: function() {
		
		var t = this;
		
		// On affiche le formulaire d'upload
		$("#etape_user").css("display", "none");
		$("#etape_upload").css("display", "block");
		
		// Titre 
		$("#itemTitle").val("");
		
		// Media
		$(".uploadedMedia").html("");
		
		// Texte
		$(".newTextMedia").val("");
		$(".envoiTexte").css("display", "block");
		
		// Champ d'état du téléchargement
		$(".uploadStatus").html("");
		
		$("#toEtape2Button").siblings(".etape").css("display", "none");
		$("#toEtape2Button").css("display", "none");
		

		//
		// a. Envoi d'un simple texte
		//

		var sendTextButton = $("#sendTextMediaButton");
		sendTextButton.off().on("click", function() {
		
			var textTitle = $("#itemTitle").val();
			var textContent = $("#newTextMedia").val();
			
			if (textContent.length > 0) {
				t.validUploadEtape2( "Text", textTitle, null, textContent);
			}
		});
		
		
		//
		// b. Upload d'un media
		//
		
		var form = $("#fileUploadForm");
		var fileSelect = $("#fileSelect");
		
		var uploadButton = $("#uploadButton");
		t.disableUploadSubmitButton(true);

		// http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html
		AWS.config.region = 'eu-west-1';

		AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		  IdentityPoolId: 'eu-west-1:b263aeab-02ae-4268-b338-95e7ea79e255'
		});

		function guid() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		  }
		  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		    s4() + '-' + s4() + s4() + s4();
		}
		
		var s3 = new AWS.S3({apiVersion: '2006-03-01'});

		var files;
		var uploadFiles = function (event)
		{
			event.stopPropagation();
			event.preventDefault();
			
			t.disableUploadSubmitButton(true);
		
			if (files.length == 0) return;
			
			// console.log(t.uploadURL, files.length)
		
			var i, file, data = new FormData();
			
			for (i = 0; i < files.length; i++) {
			  file = files[i];
			  data.append('file', file, file.name);
			  // RQ : On ne prend que le premier
			  break;
			}
		
			// Champ d'état du téléchargement
			$(".uploadStatus").html("Envoi du média en cours...");
		
			var loadingAnimation = t.startLoadingAnimation();

    		var bucketName = 'chatanoo-medias-input';
			var prefix, filenameToSave, filenameForUpload;
			var extension = file.name.split('.').pop();
			
			if ( file.type.indexOf("image/") == 0)
			{
				// L'image sera uploadée dans "input" puis convertie dans "output"
				prefix = "P";
			}
			else if ( file.type.indexOf("video/") == 0)
			{
				// La vidéo sera uploadée dans "input" puis convertie dans "output"
				prefix = "M";
			}
			else if ( file.type.indexOf("audio/") == 0)
			{
				// Le son sera uploadé dans "input" puis converti dans "output"
				prefix = "A";
			}
			else
			{
				return;
			}

			filenameToSave = prefix + "-" + guid();
			filenameForUpload = filenameToSave + "." + extension;

			var params = {
				Bucket: bucketName, 
				Key: filenameForUpload, 
				ContentType: file.type, 
				Body: file
			};
			
			// console.log("s3.upload", params);
			
			s3.upload(params, function (err, data) {
				
				console.log(err ? 'ERROR!' : 'UPLOADED2');
				
				t.stopLoadingAnimation(loadingAnimation);
				
				if (! err)
				{
					$(".uploadStatus").html("Envoi du média réussi");
					t.displayButtonToValidateUploadMedia( filenameToSave );
				}
				else
				{
					$(".uploadStatus").html("Echec de l'envoi du média");
				}
			});
		};
		
		$('input[type=file]').off().on('change', function (event)
		{
			files = event.target.files;
			
			var i, file;
			
			// On vérifie les types MIME des fichiers sélectionnés
			
			// . Sont autorisés : image/jpg, image/png, audio/mpeg (MP3), video/mp4...
			// . Ne sont pas encore autorisés : video/x-flv (FLV), audio/x-m4a (AAC)
			
			for (i = 0; i < files.length; i++) {
			
			  file = files[i];
			  
			  if ((file.type != "image/png") && (file.type != "image/jpeg") 
			  			&& (file.type.indexOf("video/") == -1) && (file.type.indexOf("audio/") == -1)) {
							
				// Type incompatible : on bloque le bouton "Envoyer votre media"
				console.log("Type incompatible", file.type);
				t.disableUploadSubmitButton(true);
				return;
			  }
			  
			  // RQ : On ne prendra que le premier fichier sélectionné
			  break;
			}
			
			t.disableUploadSubmitButton(false);
			
			form.off().on('submit', uploadFiles);
		});
			
	},

	getMediaTypeFromFileName: function( mediaFileName ) {
		
		var filenameArray = mediaFileName.split("-");
		var filenameFirstChar = filenameArray[0];
		
		switch(filenameFirstChar)
		{
			case "P": return "Picture";
			case "M": return "Video";
			case "A": return "Audio";
			case "T": return "Text";
		}
		
		return "Unknown";
	},
	
	//
	
	displayButtonToValidateUploadMedia: function( mediaFileName ) {
		
		var t = this;
		
		// Pas de variable pour le texte
		t.textMediaContent = null;
		
		var mediaTitle = $("#itemTitle").val();
		
		// console.log("displayButtonToValidateUploadMedia", mediaFileName);
		
		var mediaType = t.getMediaTypeFromFileName(mediaFileName);
		
		var uploadButton = $("#uploadButton");
		uploadButton.disabled = true;

		var uploadParent = $(".uploadParent");
		var mediaParent = $(".uploadedMedia", uploadParent);
		
		$(".envoiTexte").css("display", "none");

		var itemId = t.uploadItemId;
		var mediaId = 0;
		var mediaWidth  =  mediaParent.width() || uploadParent.width() * 0.50;
		var mediaHeight = mediaWidth * 2 / 3;

		// console.log("displayButtonToValidateUploadMedia", mediaFileName, mediaType, mediaWidth);

		switch(mediaType)
		{
			case "Picture" :
				// console.log("... createImageView", mediaParent, itemId, mediaId, mediaFileName);
				var callback = function() {
					var image = t.createImageView( mediaParent, itemId, mediaId, mediaFileName );
				};
				t.tryToLoadConvertedMedia( t.getImageKey(mediaFileName), callback);
				break;

			case "Video" :
				// console.log("... createVideoView", mediaParent, itemId, mediaId, mediaFileName, mediaWidth, mediaHeight);
				var callback = function() {
					var video = t.createVideoView( mediaParent, itemId, mediaId, mediaFileName, mediaWidth, mediaHeight );
				};
				t.tryToLoadConvertedMedia( t.getVideoKey(mediaFileName), callback);
				break;

			case "Audio" :
				// console.log("... createAudioView", mediaParent, itemId, mediaId, mediaFileName, mediaWidth, mediaHeight);
				var callback = function() {
					var audio = t.createAudioView( mediaParent, itemId, mediaId, mediaFileName, mediaWidth, mediaHeight );
				};
				t.tryToLoadConvertedMedia( t.getAudioKey(mediaFileName), callback);
				break;
		}

		// Script du bouton suite (pas encore visible, en attente de la conversion)
		$("#toEtape2Button").off().on("click", function(){ t.validUploadEtape2( mediaType, mediaTitle, mediaFileName, null ); } );
	},

	tryToLoadConvertedMedia: function( mediaAWSKey, callback ) {

		var t = this;
		var s3 = new AWS.S3({apiVersion: '2006-03-01'});
		var bucketName = "chatanoo-medias-output";

		var success = function() {
			// Bouton suite visible suite à la conversion
			$("#toEtape2Button").siblings(".etape").css("display", "inline");
			$("#toEtape2Button").css("display", "inline");
		};

		$(".uploadStatus").html("Conversion et chargement du média...");

		// On interroge le bucket "output" pour savoir si le media est disponible

		if (t.tryToLoadConvertedTimeout) clearInterval(t.tryToLoadConvertedTimeout);

		t.tryToLoadConvertedTimeout = setInterval( function() {

			// console.log("**** tryToLoadConvertedTimeout ****", mediaAWSKey);

			s3.getObject({ Bucket: bucketName, Key: mediaAWSKey }, function (err, data) {
				if (err)
				{
					console.log('Pas encore disponible sur S3 output : mediaAWSKey');
				}
				else
				{
					$(".uploadStatus").html("Votre média a bien été ajouté !");
					clearInterval(t.tryToLoadConvertedTimeout);

					// Le bouton Suite est affiché
					success();

					// Callback
					callback();
				}
			});

		}, 5000);
	},

	validUploadEtape2: function( mediaType, mediaTitle, mediaFileName, textMediaContent ) {
		
		var t = this;

		if (t.tryToLoadConvertedTimeout) clearInterval(t.tryToLoadConvertedTimeout);

		// console.log("validUploadEtape2", t.mediaViewAndModel);

		if (t.mediaViewAndModel && t.mediaViewAndModel.view) {
			// console.log("validUploadEtape2 view", t.mediaViewAndModel);
			t.mediaViewAndModel.view.close();
		}

		$(".uploadParent .uploadedMedia").empty();

		t.uploadMediaType = mediaType;
		t.uploadMediaTitle = mediaTitle;
		t.uploadMediaFileName = mediaFileName;
		t.textMediaContent = textMediaContent;
		
		$("#toEtape2Button").off("click");
		$("#toEtape3Button").off().on("click", function(){ t.validUploadEtape3(); } );
		
		$("#etape_vote").css("display", "block");
		$("#etape_upload").css("display", "none");		
	},

	validUploadEtape3: function() {
		
		var t = this;
		
		// Vote : valeur du vote "Cool/Pas cool"
		t.uploadVote = $('input:radio[name=sentiment]:checked').val() == "choix1" ? 1 : -1;
		
		console.log("validUploadEtape3", $('input:radio[name=sentiment]:checked').val());
		
		$("#toEtape3Button").off("click");
		$("#etape_vote").css("display", "none");		
		
		t.displayUploadKeyWordSelectionView();
	},
	
	displayUploadKeyWordSelectionView: function() {

		var t = this;
		
		$("#etape_keyword").css("display", "block");
		
		$("#toEtape4Button").css("display", "none");
		$("#toEtape4Button").siblings(".etape").css("display", "none");
		
		var success = function(jsonResult) {
			
			if (! jsonResult) return;
			
			// console.log("metas", jsonResult.length);
			
			var i, n = jsonResult.length, jsonItem;
			var metas = new MetaCollection();
			
			for(i=0; i<n; i++)
			{
				jsonItem = jsonResult[i];
				switch(jsonItem.name)
				{
					case "KeyWord":
					metas.add( new MetaModel(jsonItem) );
				}
			}
			
			// console.log("fetchMetasOfQuery", metas.length);
			
			t.initUploadKeywordSelect(metas);
		};
	
		// console.log("fetchMetasOfQuery queryId = ", t.uploadQueryId);
	
		// On récupère la liste des mots-clés de la question choisie dans le formulaire
		t.fetchMetasOfQuery(t.uploadQueryId, success);
	},
	
	initUploadKeywordSelect: function( queryKeyWordCollection ) {

		var t = this;
		
		// Liste des mots-clés de la question :
		var keywordsSelect = $("#formKeywords");
		
		keywordsSelect.append("<option value=''>Sélectionnez un mot-clé</option>");
		
		// Mot-clé sélectionné par défaut :
		t.keyWordId = queryKeyWordCollection.at(0).get("id");
		
		queryKeyWordCollection.each( function (keyword)
		{
			var keywordId = keyword.get("id");
			var keywordTitle = keyword.get("content");
			
			keywordsSelect.append("<option value=' " + keywordId + "'>" +  keywordTitle +" </option>");
		});
		
		keywordsSelect.off().on("change", function(e) {
			var keyWordId = $(e.target).val();
			if (keyWordId != "")
			{
				// Mot-clé sélectionné
				t.keyWordId = keyWordId;
				
				var keywordTitle = $("#formKeywords option:selected").text();
				
				// Trim white space
				keywordTitle = keywordTitle.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				
				// console.log("change", keyWordId, keywordTitle);
				
				t.displayButtonToValidateUploadKeyWord(keyWordId, keywordTitle);
			}
		});
	},	
	
	displayButtonToValidateUploadKeyWord: function( keyWordId, keywordTitle ) {
		
		var t = this;
		
		// console.log("displayButtonToValidateUploadKeyWord", keyWordId, keywordTitle);
		
		$(".rubrique.etape4").css("display", "block");
		
		$("#toEtape4Button").siblings(".etape").css("display", "inline");
		$("#toEtape4Button").css("display", "inline");
		$("#toEtape4Button").off().on("click", function(){ t.validUploadEtape4(keyWordId, keywordTitle); } );
	},

	validUploadEtape4: function( keyWordId, keywordTitle ) {
		
		var t = this;	
		t.uploadKeyWordId = keyWordId;
		t.uploadKeyWordContent = keywordTitle;
		
		// console.log("validUploadEtape4", keyWordId, keywordTitle);
		
		$("#toEtape4Button").off("click");
		$("#etape_keyword").css("display", "none");		
		
		t.displayUploadMapView();
	},
	
	getUploadMarker: function() {
		
		var iconTemplate = _.template($("#dringTemplate").html());
		var item = new ItemModel( { id:0, color:"red", left:0, top:0, visitedColor:"rgba(0,0,0,0)" } );
		var iconHtml = iconTemplate(item.toJSON());
		iconHtml = iconHtml.split("position:absolute").join("");
		
		var persoIcon = L.divIcon({ 
			iconSize: new L.Point(50, 50), 
			html: iconHtml
		});
		
		return persoIcon;
	},
	
	displayUploadMapView: function() {
		
		var t = this;
		
		$("#etape_map").css("display", "block");
		$("#toEtape5Button").css("display", "none");
		$("#toEtape5Button").siblings(".etape").css("display", "none");
		
		// Drag and drop du perso sur la carte :
		var mapParent =  $(".global .uploadParent .uploadContent .uploadBody .mapParent");
		
		var uploadForm = $(".uploadParent"); 
		mapParent.css("height", "350px");
		
		var carte_osm = $("#carte_upload_osm");
		if (carte_osm.length == 0) {
			mapParent.html('<div id="carte_upload_osm" style="width:100%;height:100%"></div>');
		}

		// Paramètres de la carte
		var latitude = this.latitudeGMaps;
		var longitude = this.longitudeGMaps;
		var zoom = this.zoomGMaps;
			
		// Si la carte existe déjà, on doit la détruire
		var	map = L.map('carte_upload_osm');
		if (map != undefined) { 
			map.remove();
		};
		
		map = L.map('carte_upload_osm');
			
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		map.setView([latitude, longitude], 12);
		
		// Icône
		var icon = t.getUploadMarker();

		// Position de départ
		var mapX = latitude;
		var mapY = longitude;
		
		var marker = new L.Marker( new L.LatLng(mapX, mapY), { id:"uploadMapPerso", icon:icon, draggable:'true' } );
		marker.on('dragend', function(e)
		{
			var marker = e.target;
			var position = marker.getLatLng();
			mapX = position.lat;
			mapY = position.lng;
			marker.setLatLng( position, { id:"uploadMapPerso", icon:icon, draggable:'true' }).bindPopup(position).update();
			
			// Au premier déplacement, on affiche le bouton de validation :
			$("#toEtape5Button").css("display", "inline");
			$("#toEtape5Button").siblings(".etape").css("display", "inline");
		});
		
    	map.addLayer(marker);
		
		// Bouton de validation de l'étape de la carte :
		$("#toEtape5Button").siblings(".etape").css("display", "inline");
		$("#toEtape5Button").css("display", "inline");
		$("#toEtape5Button").off().on("click", function(){ t.validUploadEtape5( mapX, mapY, map, marker); } );
	},

	displayUploadMapView_BitmapVersion: function() {
		
		var t = this;
		
		$("#etape_map").css("display", "block");
		$("#toEtape5Button").css("display", "none");
		$("#toEtape5Button").siblings(".etape").css("display", "none");
		
		// Drag and drop du perso sur la carte :
		var mapParent =  $(".global .uploadParent .uploadContent .uploadBody .mapParent");
		var item = $(".item", mapParent);
		var map = $(item).siblings(".map");
		var mapWidth = map.width();
		var mapHeight = map.height();
		
		var uploadForm = $(".uploadParent"); 
		mapParent.css("height", uploadForm.height() * 0.5);
		
		var longitudeGauche = t.longitudeGauche;
		var latitudeTop = t.latitudeTop;
		
		var longitudeGaucheDroite = t.longitudeDroite - longitudeGauche;
		var latitudeTopBottom = t.latitudeBottom - latitudeTop;
				
		var mapX = (t.latitudeBottom + latitudeTop) * 0.5;
		var mapY = (t.longitudeDroite + longitudeGauche) * 0.5;
		
		// console.log(mapX, mapY);
		
		var onDragEnd = function(e) {
			
			var itemDragged = e.currentTarget;
			
			var draggableObject = Draggable.get(item);
			var positionX = draggableObject.x;
			var positionY = draggableObject.y;
			var percentX = positionX / mapWidth;
			var percentY = positionY / mapHeight;
			
			var largCarte = t.largeurCarte;
			var hautCarte = t.longueurCarte;
			
			var longitude = longitudeGauche + percentX * longitudeGaucheDroite;
			var latitude  = latitudeTop + percentY * latitudeTopBottom;

			// On récupère la position du marker sur la carte
			mapX = latitude;
			mapY = longitude;
			 
			// console.log(positionX, positionY, mapWidth, mapHeight, "mapX", mapX, "mapY", mapY);

			// Au premier déplacement, on affiche le bouton de validation :
			$("#toEtape5Button").css("display", "inline");
			$("#toEtape5Button").siblings(".etape").css("display", "inline");
		};

		
		var draggable = Draggable.create(item, { onDragEnd:onDragEnd });
		TweenLite.set(item, { x: mapWidth * 0.5, y: mapHeight * 0.5 });
		
		// Bouton de validation de l'étape de la carte :
		$("#toEtape5Button").siblings(".etape").css("display", "inline");
		$("#toEtape5Button").css("display", "inline");
		$("#toEtape5Button").off().on("click", function(){ t.validUploadEtape5( mapX, mapY); } );
	},
	
	validUploadEtape5: function( mapX, mapY, map, marker ) {
		
		// console.log("validUploadEtape5 lat=", mapX, "long=", mapY );
		
		if (map && marker) {
			marker.off("dragend");
			map.removeLayer(marker);
			map.remove();
		}
		
		var t = this;	
		t.uploadMapX = mapX;
		t.uploadMapY = mapY;
		
		var item = $(".global .uploadParent .uploadContent .uploadBody .mapParent .item");
		if (Draggable.get(item)) Draggable.get(item).kill();
		
		$("#toEtape5Button").off("click");
		$("#etape_map").css("display", "none");		
		
		t.displayUploadsendItem();
	},

	displayUploadsendItem: function() {
		
		var t = this;
		
		$("#etape_envoi").css("display", "block");
		$("#envoi-button").on("click", function() {		
			document.getElementById('envoi-button').disabled = true;
			t.envoiItemUpload();
		});
		
		document.getElementById('envoi-button').disabled = false;
	},

	envoiItemUpload: function() {
		
		//
		// 1. Ajout d'un item à la Query
		//
		
		var t = this;
		
		var successAddItemToQuery = function(jsonResult) {
			
			// console.log("successAddItemToQuery jsonResult = ", jsonResult); 
			
			if (! jsonResult) return;
			
			t.uploadItemId = parseInt(jsonResult);
			t.envoiMediaUpload();			
		};
		
		// Envoi de l'item
		t.addItemIntoQuery(t.uploadQueryId, t.uploadMediaTitle, t.uploadMediaFileName, successAddItemToQuery)
	},
	
	envoiMediaUpload: function() {
		
		var t = this;

		//
		// 2. Ajout d'un media à l'item
		//

		var successAddMediaToItem = function(jsonResult) {
			
			// console.log("successAddMediaToItem jsonResult = ", jsonResult); 
		
			if (isNaN(jsonResult)) return;
		
			t.uploadMediaId = jsonResult;
			t.envoiVoteUpload();
		};
	
		// console.log("envoiMediaUpload", t.uploadItemId, t.uploadMediaTitle, t.uploadMediaFileName, t.textMediaContent)
		
		// Envoi du media
		t.addMediaIntoItem(t.uploadItemId, t.uploadMediaTitle, t.uploadMediaFileName, t.textMediaContent, successAddMediaToItem); 
	},
	
	envoiVoteUpload: function() {
		
		var t = this;
		
		//
		// 3. Ajout d'un vote à l'item
		//

		var successAddVoteToItem = function(jsonResult) {
			
			// console.log("successAddVoteToItem jsonResult = ", jsonResult); 
		
			if (! jsonResult) return;
			
			t.uploadDataVoteId = jsonResult;		
			t.envoiMotCleUpload();
		};
	
		// Envoi du vote
		t.addDataVoteToItem(t.uploadItemId, t.uploadVote, successAddVoteToItem);	
	},
	
	envoiMotCleUpload: function() {
		
		var t = this;
		
		//
		// 4. Ajout d'un mot-clé à l'item
		//
		
		var successAddKeyWordToItem = function(jsonResult) {
		
			// console.log("successAddKeyWordToItem jsonResult = ", jsonResult); 
			
			if (! jsonResult) return;
			
			t.envoiCartoUpload()
		};
	
		// Envoi du mot-clé
		t.addMetaIntoVo(t.uploadItemId, t.uploadKeyWordId, t.uploadKeyWordContent, successAddKeyWordToItem);
	},

	envoiCartoUpload: function() {
				
		var t = this;
	
		//
		// 5. Ajout d'une data de position sur la carte à l'item
		//
		
		var successAddDataCartoToItem = function(jsonResult) {
		
			// console.log("successAddDataCartoToItem jsonResult = ", jsonResult); 
		
			if (! jsonResult) return;
			
			t.finUpload();
		};
		
		// console.log("addDataCartoToItem", t.uploadItemId, t.uploadMapX, t.uploadMapY)
		
		t.addDataCartoToItem(t.uploadItemId, t.uploadMapX, t.uploadMapY, successAddDataCartoToItem);

	},
	
	finUpload: function() {
		
		var t = this;
		
		// console.log("finUpload");
		
		$("#etape_envoi").css("display", "none");
		
		// Fin de l'upload
		$("#etape_conclusion").css("display", "block");		
		$("#toEtape6Button").off().on("click", function()
		{ 
			$("#toEtape1Button").off("click");
			$("#toEtape6Button").off("click");
			t.closeUploadView(); 
		} );

		// Nouvel upload
		$("#toEtape1Button").off().on("click", function()
		{ 
			$("#etape_conclusion").css("display", "none");
			$("#toEtape1Button").off("click");
			$("#toEtape6Button").off("click");
			t.initUploadForm(); 
		} );
		
		// On doit ajouter l'item uploadé dans la liste des  items de la query associée
		// et rafraichir les vues :
		
		t.loadQuery( t.uploadQueryId );
	},



	// --------------------------------------------------
	//
	// Général
	//
	// --------------------------------------------------

	startLoadingAnimation: function( target ) {
		
		if (! target) {
			target = $("#attente");
		}
		
		target.css("display", "block");
			
		var opts = { color: '#FFFFFF', left: '60%', top: '40%' };
			
		var spinner = new Spinner( opts ).spin();
		target.append(spinner.el);
		
		return spinner;
	},
	
	stopLoadingAnimation: function( spinner ) {
		
		spinner.el.remove();
		$("#attente").css("display", "none");
		
	},
	
	//
	// Webs Services :
	//
	
	ajax: function (serviceName, data, successCallback) {

		var t = this;
		var loadingAnimation = t.startLoadingAnimation();
		
		var ajaxError = function(jqXHR, textStatus, errorThrown)
		{
			t.stopLoadingAnimation(loadingAnimation);
			
			console.log("error :" + textStatus, jqXHR);
		};
		
		var ajaxSuccess	= function(data, textStatus, jqXHR)
		{
			t.stopLoadingAnimation(loadingAnimation);
		
			// Le Proxy PHP renvoie : {"status":{"http_code":200},"contents":{"result":"...","id":"..."}}
			// console.log("success :" + JSON.stringify(data.contents));
			
			if (successCallback) successCallback(data.contents.result);
		};
		
		if (t.proxy === undefined) t.proxy = "";
		
		var ajaxRequest = {
			type: "POST",
			url: t.proxy + t.serviceURL + "/" + serviceName + "/json",
			data: JSON.stringify(data),
			dataType: "json",
			contentType: "application/json",
		}
		
		if (t.authentificationID)
		{
			ajaxRequest.beforeSend = function(xhr) {
				  xhr.setRequestHeader("Authorization", t.authentificationID);
			};
		}
		
		// console.log(JSON.stringify(ajaxRequest));
		
		jQuery.ajax(ajaxRequest).done(ajaxSuccess).fail(ajaxError);
	},
	
	generateID: function()
	{
		var num = 24;
		var char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
		var uiid = "";
		for(var i = 0; i < num; i++)
		{
			uiid += char[Math.floor(Math.random() * char.length)];
			if (i%4 == 3 && i != 0 && i < num - 1)
				uiid += '-';
		}
		
		return uiid;
	},
	
});
