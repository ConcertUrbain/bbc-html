
Backbone.BasicCollection = Backbone.Collection.extend({
	
	getModelById:function(id)
	{
		return this.find(function(item){ return (item.get('id') == id) });
	}

});

var Chatanoo = Chatanoo || {};


/* Données */

var QueryModel = Backbone.Model.extend({
	defaults: {
		id:null,
		description:"",
		content : "",
		addDate: null,
		setDate: null,
		_isValid: null
	}
});

var QueriesCollection = Backbone.BasicCollection.extend({	
    model: QueryModel
});


//

var QueryMediasModel = Backbone.Model.extend({
	defaults: {
		id:null,
		subfolder:null,
		backgroundSound : null,
		images: [],
		carte: null,
		carteTop: null,
		carteLeft: null,
		carteBottom: null,
		carteRight: null,
	}
});

var QueriesMediasCollection = Backbone.BasicCollection.extend({	
    model: QueryMediasModel
});


// cf package dans Flash : org.concert_urbain.bbc.data.MosaiqueData

// TODO : séparer les notions propres au BBC des notions générales...

var ItemModel = Backbone.Model.extend({
	
	defaults: {
		id:null,
		user:null,
		title:"",
		description:"",
		addDate:"",
		setDate:"",
		rate:"",
		isValid:"",
		color:"red",
		
		motCle1:null,
		motCle2:null,
		motCle3:null,
		
		left:0,
		top:0,
		
		positionsVotes:null,
		positionsMoyenneVotes:null
	},
	
	getVotes: function() {
		// TODO : trier les votes par "id"
	},
	
	getContentArrayFromMetaArray: function(metasCollection)
	{
		var contentsArray = new Array();
		
		metasCollection.each(function(metaModel) {
			contentsArray.push(metaModel.get("content"));
		});
		
		return contentsArray;
	},
	
	computeRateFromVotes: function(canvasWidth, canvasHeight)
	{
		var t = this;
		
		//
		// Position de chacun des votes (dans l'ordre chronologique)
		//
		
		// TODO mémoriser ces calculs
		var positionVotes = new Array();
		var positionAverageVotes = new Array();

		//
		// Vote Moyen
		//
		
		var t_ic = 0;
		var t_ru = 0;
		
		var moy_ic = 0;
		var moy_ru = 0;

		var n = 0;

		var votesCollection = t.get("votes");
		
		votesCollection.each(function(dataModel) {
			
			// console.log("computeRateFromVotes", dataModel.get("id"));
		
			// contentsArray.push(dataModel.get("content"));
			
			n++;
			
			vote = dataModel.get("rate");
			
			// On déduit du "rate" (codé sur 2 octets) les valeurs entre 0 et 255 des deux axes (individuel/collectif et réaliste/utopique)
			ic = (vote >> 8 & 0xFF);
			ru = (vote & 0xFF);
			
			// Calcul de la position de chaque vote
			positionVotes.push({ 
				x: t.getXFromIndividuelCollectif(ic / 255.0, canvasWidth), 
				y: t.getYFromRealisteUtopique(ru / 255.0, canvasHeight)
			});
		
			// Pour le calcul de la moyenne :
			t_ic += ic;
			t_ru += ru;
			
			moy_ic = t_ic / n;
			moy_ru = t_ru / n;
			
			positionAverageVotes.push({ 
				x: t.getXFromIndividuelCollectif(moy_ic / 255.0, canvasWidth), 
				y: t.getYFromRealisteUtopique(moy_ru / 255.0, canvasHeight) 
			});
			
		});
		
		t.set("positionsVotes", positionVotes);
		t.set("positionsMoyenneVotes", positionAverageVotes);
		
		// Vote moyen (en x et en y)
		// var individuelCollectif = (t_ic / n)  / 255;
		// var realisteUtopique = (t_ru / n) / 255;

		// Position du vote moyen
		// var imageX = t.getXFromIndividuelCollectif(individuelCollectif);
		// var imageY = t.getYFromRealisteUtopique(realisteUtopique);
	},
	
	updateColor: function()
	{	
		
		var percentAbs = this.get("percentTop");
		if ( ! isNaN(percentAbs))
		{
			// Rouge en bas
			var r = Math.floor(255 * (1 - percentAbs));
			if (r > 255)	r = 255;
			
			var g = 255 - r;
			
			// var b = 0;
			// var a = 1;
			
			this.set("color", "rgba(" + r + "," + g + ", 0, 1)" );
		}
	},
	
	updateVisitedAndCurrentColor: function()
	{	
		var isVisited = this.get("visited");
		var isCurrent = this.get("current");
		
		if (isCurrent == true) {
			this.set("visitedColor", "rgba(255,255, 0, 1)" );
		} else if (isVisited == true) {
			this.set("visitedColor", "rgba(200,200,200, 1)" );
		} else {
			this.set("visitedColor", "rgba(0,0,0, 0)" );
		}
	},
	
	getXFromIndividuelCollectif: function(ic, canvasWidth)
	{
		var margin = 20;
		return margin + ic * (canvasWidth - 2 * margin);
	},
	
	getYFromRealisteUtopique: function(ru, canvasHeight)
	{
		var marginTop = 20;
		var marginBottom = 80;
		var imageHeight = 100; // HAUTEUR du CANVAS
		
		return marginTop + (1 - ru) * (canvasHeight - marginBottom - marginTop);
	},
	
	analyseMetaKeywords: function(queryMotsCles1, queryMotsCles2, queryMotsCles3, keyWordColorFunction)
	{
		var t = this;
		
		var nbTypeKeywords = 0;
		var typeKeyword;
		var queryMotsCles;

		var motcleId, motcleStr;
		var motcle1Str, motcle1Id, motcle1No, motcle1Type, motcle1Color;
		var motcle2Str, motcle2Id, motcle2No, motcle2Type, motcle2Color;
		var motcle3Str, motcle3Id, motcle3No, motcle3Type, motcle3Color;

		var metasCollection = t.get("metas");
		
		metasCollection.each(function(metaModel) {
			
			typeKeyword = -1;
			
			var metaId = metaModel.get("id");
			var metaName = metaModel.get("name");
			var metaContent = metaModel.get("content");
		
			switch(metaName)
			{
				case "KeyWord":
				motcleId = metaId;
				motcleStr = metaContent;
				break;
				
				case "Type1KeyWord":
				if (typeKeyword < 0) 
				{
					typeKeyword = 1;
					queryMotsCles = queryMotsCles1;
				}
				
				case "Type2KeyWord":
				if (typeKeyword < 0)
				{
					typeKeyword = 2;
					queryMotsCles = queryMotsCles2;
				}
				
				case "Type3KeyWord":
				if (typeKeyword < 0)
				{
					typeKeyword = 3;
					queryMotsCles = queryMotsCles3;
				}
				
				nbTypeKeywords ++;
				
				if (nbTypeKeywords == 1)
				{
					motcle1Str = metaContent;
					motcle1Id = metaId;
					motcle1No = queryMotsCles.indexOf(metaContent);
					motcle1Type = typeKeyword;
					motcle1Color = keyWordColorFunction(motcle1No, motcle1Type);
					
					t.set("motCle1", { id:motcle1Id, no:motcle1No, texte:motcle1Str, type:motcle1Type, couleur:motcle1Color });
				}
				else if (nbTypeKeywords == 2)
				{
					motcle2Str = metaContent;
					motcle2Id = metaId;
					motcle2No = queryMotsCles.indexOf(metaContent);
					motcle2Type = typeKeyword;
					motcle2Color = keyWordColorFunction(motcle2No, motcle2Type);
					
					t.set("motCle2", { id:motcle2Id, no:motcle2No, texte:motcle2Str, type:motcle2Type, couleur:motcle2Color });
				}
				else if (nbTypeKeywords == 3)
				{
					motcle3Str = metaContent;
					motcle3Id = metaId;
					motcle3No = queryMotsCles.indexOf(metaContent);
					motcle3Type = typeKeyword;
					motcle3Color = keyWordColorFunction(motcle3No, motcle3Type);
					
					t.set("motCle3", { id:motcle3Id, no:motcle3No, texte:motcle3Str, type:motcle3Type, couleur:motcle3Color });
				}
			}
		});
		
		/*
		console.log(" ");
		console.log("motcle1Id", motcle1Id);
		console.log("motcle1Str", motcle1Str);
		console.log("motcle1No", motcle1No);
		console.log("motcle1Type", motcle1Type);
		console.log("motcle1Color", motcle1Color);
		console.log("--");
		console.log("motcle2Id", motcle2Id);
		console.log("motcle2Str", motcle2Str);
		console.log("motcle2No", motcle2No);
		console.log("motcle2Type", motcle2Type);
		console.log("motcle2Color", motcle2Color);
		console.log("--");
		console.log("motcle3Id", motcle3Id);
		console.log("motcle3Str", motcle3Str);
		console.log("motcle3No", motcle3No);
		console.log("motcle3Type", motcle3Type);
		console.log("motcle3Color", motcle3Color);
		*/
	}

});

var ItemsCollection = Backbone.Collection.extend({	
    model: ItemModel
});

//

var UserModel = Backbone.Model.extend({
	defaults: {
		id:null,
		firstName:"",
		lastName:"",
		pseudo:"",
		addDate:"",
		setDate:"",
		items:null
	}
});

var UsersCollection = Backbone.Collection.extend({	
    model: UserModel
});

//

var DataCartoModel = Backbone.Model.extend({
	defaults: {
		id:null,
		x:null,
		y:null,
		addDate:"",
		setDate:""
	}
});

var DataVoteModel = Backbone.Model.extend({
	defaults: {
		id:null,
		user:null,
		rate:null,
		addDate:"",
		setDate:""
	}
});

var DataVoteCollection = Backbone.Collection.extend({	
    model: DataVoteModel
});

//

var MetaModel = Backbone.Model.extend({
	defaults: {
		id:null,
		name:null,
		content:null
	}
});

var MetaCollection = Backbone.Collection.extend({	
    model: MetaModel,
	
	getContents: function() {
		
		var contents = new Array();
		
		this.each(function(model) {
			contents.push( model.get("content") );
		});
		
		return contents;
	}
});

//

var MediaModel = Backbone.Model.extend({
	defaults: {
		id:null,
		width:null,
		height:null,
		url:null,
		description:null,
		preview:null,
		addDate:"",
		setDate:""
	}
});

var TextMediaModel = Backbone.Model.extend({
	defaults: {
		id:null,
		content:null,
		description:null,
		addDate:"",
		setDate:""
	}
});

//

var CommentModel = Backbone.Model.extend({
	defaults: {
		id:null,
		name:null,
		content:null,
		
		_item:null,
		_user:null,
		_isValid:null,
		
		isValid:false,
		addDate:null,
		setDate:null,
		rate:null,
		users_id:0,
		bgcolor:""
	}
});

var CommentCollection = Backbone.Collection.extend({	

    model: CommentModel,
	
});

var VoteModel = Backbone.Model.extend({
	defaults: {
		id:null,
		rate:null,
		user:null,
		users_id:0,
		addDate:"",
		setDate:""
	}
});
