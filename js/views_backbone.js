	
/* Vues */

//
// Prototype de base des Vue : optimisation de la mémoire
//

Backbone.View.prototype.close = function(){

	this.off();
	this.remove();

	// Méthode à ajouter dans la vue pour supprimer les évènements bind présent dans le "initialize" par exemple
	if (this.onClose)
	{
		this.onClose();
	}
};

Backbone.ChatanooView = Backbone.View.extend({

	render: function(param) {
		Backbone.View.prototype.render.call(this, param);
		this.addRemovedEvent();
		return this;
	},

	addRemovedEvent: function() {
		if (this.$el) {
			var t = this;
			this.$el.on('removed', function() {
				// console.log("view removed !");
				t.close();
			});
		}
	},

	removeRemovedEvent: function() {
		if (this.$el) {
			this.$el.off('removed');
		}
	},

	close: function() {
		// console.log("ChatanooView CLOSE");
		this.removeRemovedEvent();
	}
});

Backbone.CollectionView = Backbone.ChatanooView.extend({

	initialize: function(param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.initSubviews();
	},

	initSubviews: function() {
		this.childViews = [];
	},

	addSubview: function(subview) {
		this.childViews.push(subview);
	},

	removeSubviews: function () {

		_.each(this.childViews, function(childView)
		{
			if (childView.close) {
				// cf prototype.close un peu plus haut
				childView.close();
			}
		});

		this.$el.find("article").remove();
	},

	render: function () {

		this.removeSubviews();

		_.each(this.collection.models, function (item) {
			this.renderItem(item);
		}, this);
		
		return this;
	},

	close: function () {
		this.removeSubviews();
	}
});




//
// Vues de base Chatanoo
// 

// A. Queries

Chatanoo.QueriesView = Backbone.CollectionView.extend({
	
	el: "#queries",
	
	initialize: function (queries) {
		
		this.initSubviews();
		
		var validQueries = _.where (queries, { _isValid : "1" } );
		
		// Liste des questions
		this.collection = new QueriesCollection(validQueries);
		this.render();
	},
	
	render: function () {
		
		this.removeSubviews();
		
		var html =  "";
		var no = 0;
		
		_.each(this.collection.models, function (item) {
			this.renderItem(item, no++);
		}, this);

		return this;
	},

	renderItem: function (item, no)
	{
		var queryView = new Chatanoo.QueryView({
			model: item
		});
		
		// cf CollectionView
		this.addSubview(queryView);
		
		this.$el.append( queryView.render().el );	
	}
});

Chatanoo.QueryView = Backbone.ChatanooView.extend({
	
	tagName: "li",
	className: "query",
	
	initialize: function (param) {
		this.template = _.template($("#queryTemplate").html())
	},
	
	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
	
    events: {
		"click .queryTitre a": "selectQuery",
	},

    selectQuery: function (e)
	{
		var queryId = this.model.get("id");
		App.Views.appView.selectQueryModel(this.model);
		App.Views.appView.loadDatasOfQuery(queryId);
		
		// Activation du bouton
		$(".queryTitre").removeClass("inactive").addClass("inactive");
		this.$el.find(".queryTitre[data-id="+queryId+"]").removeClass("inactive");
	},
});


// B. Items

Chatanoo.MosaiqueItemsView = Backbone.CollectionView.extend({
	
	el: "#items",
	
	initialize: function (itemCollection) {
		
		this.initSubviews();
		
		// Liste des items
		this.collection = itemCollection;
		
		this.render();
	},
	
	render: function () {
		
		this.removeSubviews();
		
		var html =  "";
		var no = 0;
		
		_.each(this.collection.models, function (item) {
			this.renderItem(item, no++);
		}, this);

		return this;
	},

	renderItem: function (item, no)
	{
		var itemView = new Chatanoo.MosaiqueItemView({
			model: item
		});
		
		// cf CollectionView
		this.addSubview(itemView);
		
		this.$el.append( itemView.render().el );	
	}
});

Chatanoo.MosaiqueItemView = Backbone.View.extend({
	
	tagName: "article",
	className: "item",
	
	initialize: function (param) {
		this.template = _.template($("#itemTemplate").html());
	},
	
	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
	
    events: {
		"click .itemTitre a": "selectItem"
	},

    selectItem: function (e)
	{
		var itemId = this.model.get("id");
		
		var motCle  = this.model.get("motCle");
		
		var motCle1 = this.model.get("motCle1");
		var motCle2 = this.model.get("motCle2");
		var motCle3 = this.model.get("motCle3");
		
		var v = App.eventManager;
		if (v) v.trigger("itemSelection", itemId, motCle, motCle1, motCle2, motCle3);
	}
});


// C. Comments

Chatanoo.CommentsView = Backbone.CollectionView.extend({
	
	el: "#comments",
	
	initialize: function (commentCollection) {
		
		this.initSubviews();
		
		// Liste des items
		this.collection = commentCollection;
		
		this.render();
	},
	
	render: function () {
		
		this.removeSubviews();
		
		var no = 0;
		
		_.each(this.collection.models, function (item) {
			var content = item.get("content");
			if (content && (content.length > 0)) {
				this.renderItem(item, no++);
			}
		}, this);

		return this;
	},

	renderItem: function (item, no)
	{
		var itemView = new Chatanoo.CommentView({
			model: item
		});
		
		// cf CollectionView
		this.addSubview(itemView);
		
		this.$el.append( itemView.render().el );	
	}
});

Chatanoo.CommentView = Backbone.ChatanooView.extend({
	
	tagName: "div",
	
	initialize: function (param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.template = _.template($("#commentTemplate").html())
		this.model.on("change:rate", this.updateBackground, this);
	},
	
	updateBackground: function () {
		this.model.set("bgcolor", this.model.get("rate") < 0 ? "rouge" : "vert");
		this.render();
	},
	
	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	close: function() {
		Backbone.ChatanooView.prototype.close.call(this);
		this.model.off("change:rate");
		this.remove();
	}

});



// D. Autres classes de base : PopUp, Image, Vidéo

Chatanoo.PopUpView = Backbone.View.extend({
	
	subview:null,
	
	initialize: function (param) {
		this.template = _.template($("#popUpTemplate").html())
	},

    events: {
		"click .popupClose": "closePopUp",
		"click .popupBg": "closePopUp",
		"click .popupContent": "preventClosePopUp",
		"click .voteButton": "vote",
	},	
	
 	vote: function(e) {
		var t = this;
		
		var itemId = t.model.get("itemId");
		
		var icSlider = $("#sliderIc");
		var ruSlider = $("#sliderRu");
		
		var ic = Math.floor(255 * parseInt(icSlider.val()) / 100);
		var ru = Math.floor(255 * parseInt(ruSlider.val()) / 100);
		
		var v = App.eventManager;
		if (v) v.trigger("voteMedia", itemId, ic, ru);
		
		t.closePopUp();
	},

 	preventClosePopUp: function(e) {
		e.preventDefault();
		e.stopPropagation();
	},
	
 	closePopUp: function(e) {
		
		var t = this;
		
		$(t.el).undelegate('.popupClose', 'click');
		$(t.el).undelegate('.popupBg', 'click');
		$(t.el).undelegate('.popupContent', 'click');
		$(t.el).undelegate('.voteButton', 'click');
		
		t.$el.css("display", "none");
		t.$el.css("width", "");
		t.$el.css("height", "");
		if (t.subview && t.subview.close) subview.close();
		
		t.clearTimeOuts();
		t.close()
	},
	
 	render: function( options ) {
		
		var t = this;
		
		if (options && options.width) t.$el.css("width", options.width);
		if (options && options.height) t.$el.css("height", options.height);
		
		t.$el.css("display", "block");
		t.$el.html(t.template());
		
		return this;
    },
	
	clearTimeOuts: function() {
		if (this.timeout) clearTimeout(this.timeout);
	},
	
	createTimeOut: function( callback, delay ) {
		this.clearTimeOuts();
		this.timeout = setTimeout( callback, delay);
	}
});

Chatanoo.TextMediaView = Backbone.ChatanooView.extend({

	initialize: function (param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.template = _.template($("#textMediaTemplate").html())
	},

	render: function() {
		// console.log(this.model.get("content"));
		this.$el.html(this.template(this.model.toJSON()));
		this.addRemovedEvent();
		return this;
	}
});

Chatanoo.ImageView = Backbone.ChatanooView.extend({
	
	initialize: function (param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.template = _.template($("#imageTemplate").html())
	},
	
 	render: function() {
		
		this.$el.html(this.template(this.model.toJSON()));
		
		return this;
    }
});

Chatanoo.VideoView = Backbone.ChatanooView.extend({

	initialize: function (param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.template = _.template($("#videoTemplate").html())
	},
	
	render: function( options ) {
		
		if (this.model.get("autoplay") == true) {
			this.model.set("html5options", "autoplay='autoplay' controls='controls' preload='auto'");
		}
		else
		{
			this.model.set("html5options", "controls='controls' preload='auto'");
		}
		
		if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) { }
		
		this.$el.html(this.template(this.model.toJSON()));
		
		return this;
    },
	
    loadVideo: function( endCallback ) {
		
		this.render();
		
		var autoPlay = this.model.get("autoPlay");
		
		var success =  function(mediaElement, domObject) {
			
			// Flash : autoplay
			if (autoPlay && (mediaElement.pluginType == 'flash')) {
				mediaElement.addEventListener('canplay', function() {
					mediaElement.play();
				}, false);
			}
			
			mediaElement.addEventListener('ended', function(e) {
				endCallback();
			}, false);
			
		}
	
		var endCallback = endCallback || function() {};
		
		$('video', this.$el).mediaelementplayer({ 
			flashName:'mediaelement/flashmediaelement.swf', 
			success:success, 
			enablePluginDebug:false, 
			features: ['playpause','progress','current'], 
			alwaysShowControls : true,
			plugins: ['flash'] });
	},

	close: function() {

		if (this.mediaElement) {
			this.mediaElement.off("canplay");
			this.mediaElement.off("ended");

			if (this.mediaElement.pause) this.mediaElement.pause();

			this.mediaElement = null;
		}

		Backbone.ChatanooView.prototype.close.call(this);
	}
});

Chatanoo.AudioView = Backbone.ChatanooView.extend({

	initialize: function (param) {
		Backbone.ChatanooView.prototype.initialize.call(this, param);
		this.template = _.template($("#audioTemplate").html())
	},

	render: function( options ) {

		if (this.model.get("autoplay") == true) {
			this.model.set("html5options", "autoplay='autoplay' controls='controls' preload='auto'");
		}
		else
		{
			this.model.set("html5options", "controls='controls' preload='auto'");
		}

		if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) { }

		this.$el.html(this.template(this.model.toJSON()));

		return this;
	},

	loadAudio: function( endCallback ) {

		this.render();

		var autoPlay = this.model.get("autoPlay");

		var success =  function(mediaElement, domObject) {

			// Flash : autoplay
			if (autoPlay && (mediaElement.pluginType == 'flash')) {
				mediaElement.addEventListener('canplay', function() {
					mediaElement.play();
				}, false);
			}

			mediaElement.addEventListener('ended', function(e) {
				endCallback();
			}, false);

		};

		var endCallback = endCallback || function() {};

		var hideControls = false;
		var alwaysShowControls = false;
		var features = ['playpause','progress','current']; // ,'duration','volume'

		this.mediaElement = $('audio', this.$el).mediaelementplayer({ flashName:'mediaelement/flashmediaelement.swf', audioWidth:255, audioHeight:220, autoRewind:true, success:success, enablePluginDebug:false, hideControls:hideControls, alwaysShowControls:alwaysShowControls, features:features, plugins: ['flash'] });

		this.addRemovedEvent();

		return this;
	},

	close: function() {

		console.log("audioView close", this.mediaElement);

		if (this.mediaElement) {
			this.mediaElement.off("canplay");
			this.mediaElement.off("ended");

			if (this.mediaElement.pause) this.mediaElement.pause();

			this.mediaElement = null;
		}

		Backbone.ChatanooView.prototype.close.call(this);
	}
});


// D. Upload

Chatanoo.UploadView = Backbone.View.extend({
	
	urlCarte: "medias/cartes/NON_PRECISEE.jpg",
	
	initialize: function (param) {
		this.template = _.template($("#uploadFormTemplate").html())
	},
	
	render: function( options ) {
		this.$el.html(this.template( { urlCarte: this.urlCarte } ));
		return this;
    },
	
    events: {
		"click .uploadClose": "closePopUp",
		"click .uploadBg": "closePopUp"
	},	
	
	closePopUp: function(e) {
		var t = this;
		
		$(t.el).undelegate('.uploadClose', 'click');
		$(t.el).undelegate('.uploadBg', 'click');
		$(t.el).undelegate('.uploadContent', 'click');
		
		t.$el.css("display", "none");
		t.$el.css("width", "");
		t.$el.css("height", "");
		if (t.subview && t.subview.close) subview.close();
		t.close()
	},	
});

