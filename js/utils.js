//
// Fonctions utiles
//


function toggleFullscreen() {
	
	if ( document.fullscreenEnabled ||  document.webkitFullscreenEnabled ||  document.mozFullScreenEnabled || document.msFullscreenEnabled )
	{
		
		// Si la fonction plein écran existe :	
			if ( document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement )
			{
				// Si on est en plein écran : on en sort...
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				}	
			}
			else
			{
				// Passage au plein-écran 
				var i = document.getElementById("global");
				 
				if (i.requestFullscreen) {
					i.requestFullscreen();
				} else if (i.webkitRequestFullscreen) {
					i.webkitRequestFullscreen();
				} else if (i.mozRequestFullScreen) {
					i.mozRequestFullScreen();
				} else if (i.msRequestFullscreen) {
					i.msRequestFullscreen();
				}
			}
	}
}


function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		//obj["attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				//obj["attributes"][attribute.nodeName] = attribute.nodeValue;
				obj[attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue.trim(); // add trim here
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				var tmp = xmlToJson(item);
				if(tmp != "") // if not empty string
					obj[nodeName] = tmp;
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				var tmp = xmlToJson(item);
				if(tmp != "") // if not empty string
					obj[nodeName].push(tmp);
			}
		}
	}
	return obj;
};


function getDefaultDate(itemModel)
{
	return new Date(2009, 04, Number( itemModel.get("id") ) % 29 + 1);
}

function dateToIso8601(date)
{
	var iso = "";
	
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var monthStr = (month < 10 ? "0" : "") + month;
	var day = date.getDate();
	var dayStr = (day < 10 ? "0" : "") + day;
	
	iso += year + "-" + monthStr + "-" + dayStr;
	
	var hour = date.getHours();
	var minutes = date.getMinutes();
	var secondes = date.getSeconds();
	
	var hourStr = (hour < 10 ? "0" : "") + hour;
	var minutesStr = (minutes < 10 ? "0" : "") + minutes;
	var secondesStr = (secondes < 10 ? "0" : "") + secondes;
	
	iso += "T" + hourStr + ":" + minutesStr + ":" + secondesStr;
	
	return iso;
}

function iso8601ToDate(iso)
{
	var separator = iso.indexOf("T") == - 1 ? " " : "T";
	
	var dateSplitArray = dateSplitArray = iso.split(separator);
	
	var dateSplitResult = dateSplitArray[0];
	var timeSplitResult = dateSplitArray[1];
	
	var date = new Date();
	
	// Date
	var separatorDate = iso.indexOf(".") == - 1 ? "-" : ".";
	dateSplitArray = dateSplitResult.split(separatorDate);
	date.setFullYear(dateSplitArray[0], parseInt(dateSplitArray[1]) - 1, dateSplitArray[2]);
	
	// Heure
	dateSplitArray = timeSplitResult.split("Z").join("").split(":");
	date.setHours(dateSplitArray[0], dateSplitArray[1], dateSplitArray[2]);
	
	return date;
}

function trimWhiteSpace(str)
{
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}



//
// CatMull
//

function computeCoord(t, t2, t3, P0, P1, P2, P3) 
{
	return 0.5 *((2 * P1) + (-P0 + P2) * t +(2*P0 - 5*P1 + 4*P2 - P3) * t2 + (-P0 + 3*P1- 3*P2 + P3) * t3)
}

function computePoint(t, P0, P1, P2, P3)
{
	var t2 = t*t;
	var t3 = t*t2;
	
	return { x: computeCoord(t, t2, t3, P0.x, P1.x, P2.x, P3.x), y: computeCoord(t, t2, t3, P0.y, P1.y, P2.y, P3.y) };
}

// RQ : Il faut au moins 4 points (anchorPoints)
function getSplinePoints(anchorPoints, isClosed)
{
	if (isClosed) 
	{
		// On ajoute l'avant dernier point en tête de liste
		anchorPoints.splice(0, 0, anchorPoints[anchorPoints.length - 2]);
		
		// On ajoute le second point en fin de liste (2 car on vient d'ajouter un point en tête de liste)
		anchorPoints.push(anchorPoints[2]);
	}
	else 
	{
		// On double le premier point en tête
		anchorPoints.splice(0, 0, anchorPoints[0]);
		
		// On double le dernier point en fin de liste
		anchorPoints.push(anchorPoints[anchorPoints.length - 1]);
	}
	
	// Liste des points retournés
	var p = new Array();
	var c = 0;
	
	var i, n = anchorPoints.length
	var precision = 1/10;
	
	// Remarque : t n'est pas entier
	var t;
	
	// Boucle sur les segments
	for (i=0; i<n-3; i++)
	{
		// Boucle sur le paramètre t : 0=<t<=1
		for (t=0; t<1; t+=precision)
		{
			p[c++] = computePoint(t, anchorPoints[i], anchorPoints[i+1], anchorPoints[i+2], anchorPoints[i+3]);
		}
	}
		
	return p;
}

function decode_utf8(s) {
	return decodeURIComponent(escape(s));
}
