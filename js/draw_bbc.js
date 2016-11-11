
var createArcs = function(layer, couleur1, couleur2, couleur3)
{
	var radius = 36;
	
	var arcsGroup = new Kinetic.Group({
	});
	
	var angle0 = 0;
	var angle2PI = 2 * Math.PI;
	
	var strokeWidth = 20;
	
	var circle = new Kinetic.Shape({
		fill: "white",
		strokeWidth: strokeWidth,
		drawFunc: function(context) {
			context.beginPath();
			context.arc(0, 0, radius, angle0, angle2PI, true);
			context.fillShape(this);
		}
	});
	
	arcsGroup.add(circle);


	var angle1Arc1, angle2Arc1;
	var angle1Arc2, angle2Arc2;
	var angle1Arc3, angle2Arc3;

	if (couleur1 == null) return;
	
	if (couleur2 == null)
	{
		angle1Arc1 = angle0;
		angle2Arc1 = angle2PI;
	}
	else if (couleur3 == null)
	{
		angle1Arc1 = angle0;
		angle2Arc1 = angle2PI / 2;
		
		angle1Arc2 = angle2Arc1;
		angle2Arc2 = angle2PI;
	}
	else
	{
		angle1Arc1 = angle0;
		angle2Arc1 = 2 * Math.PI / 3;
		
		angle1Arc2 = angle2Arc1;
		angle2Arc2 = 4 * Math.PI / 3;
		
		angle1Arc3 = angle2Arc2;
		angle2Arc3 = angle2PI;
	}
	
	if ((angle1Arc1 != null) && (angle2Arc1 != null))
	{
		var arc1 = new Kinetic.Shape({
			stroke: couleur1,
			strokeWidth: strokeWidth,
			drawFunc: function(context) {
				context.beginPath();
				context.arc(0, 0, radius, angle1Arc1, angle2Arc1, false);
				context.fillStrokeShape(this);
			}
		});
		
		arcsGroup.add(arc1);
	}
	
	if ((angle1Arc2 != null) && (angle2Arc2 != null))
	{
		var arc2 = new Kinetic.Shape({
			stroke: couleur2,
			strokeWidth: strokeWidth,
			drawFunc: function(context) {
				context.beginPath();
				context.arc(0, 0, radius, angle1Arc2, angle2Arc2, false);
				context.fillStrokeShape(this);
			}
		});
		
		arcsGroup.add(arc2);
	}
	
	if ((angle1Arc3 != null) && (angle2Arc3 != null))
	{
		var arc3 = new Kinetic.Shape({
			stroke: couleur3,
			strokeWidth: strokeWidth,
			drawFunc: function(context) {
				context.beginPath();
				context.arc(0, 0, radius, angle1Arc3, angle2Arc3, false);
				context.fillStrokeShape(this);
			}
		});
	
		arcsGroup.add(arc3);
	}
	
	return arcsGroup;
}

var createMotif = function(motCle, angle)
{
	switch(motCle.type)
	{
		case 1:

			// Motif 1
	
			var motif1Shape = new Kinetic.Path({
				x: -35,
				y: -180 + 20,
				fill: motCle.couleur,
				rotation:15,
				opacity:1,
				data: 'M 83.35 32.2 L 99.45 33.3 Q 117.15 34.15 125.15 33 150.9 29.25 70.35 6.55 44.9 -0.65 29.05 1.1 -0.25 4.35 0.5 35.65 1.25 68.85 16.45 103 30.9 135.35 50.1 151.3 70.5 168.2 84.75 156 101.05 142 103.65 92.55 104.95 67.5 95.15 56.45 87.35 47.7 73.9 48.8 63.05 49.7 55 55.45 51.65 57.85 51.1 59.75 50.5 61.8 53.45 62.35 75.8 66.55 80.6 76.4 84.55 84.4 76.5 94.6 69.65 103.35 58.9 108.65 48.2 113.95 45.5 110.05 22.9 77.55 23.7 58 24.3 42.35 39.8 35.65 50.85 30.9 68.2 31.05 76.9 31.15 83.35 32.2 Z',
			});
			
			var motif1 = new Kinetic.Group({
				id:"motif1",
				rotation:angle
			});
	
			motif1.add(motif1Shape);
			
			return motif1;
			
		break;
		
		case 2:

			// Motif 2
			
			var motif2 = new Kinetic.Group({
				id:"motif2",
				rotation:angle			
			});
	
			var motif2Shape = new Kinetic.Path({
				x: -4,
				y: 20,
				rotation:-130,
				fill: motCle.couleur,
				opacity:1,
				data: 'M 96.4 32.05 Q 102.7 33.5 105.95 40.95 113.9 59.1 125.05 64.4 129.65 66.6 133.85 65.95 137.85 65.4 140.4 62.5 151.25 49.95 139.95 36.65 130.1 25.05 106 15.25 83.75 6.25 59.2 2.45 34.15 -1.4 20.2 2.35 2.85 7.05 0.8 20.65 0.1 25.5 1.15 32.75 1.75 36.85 3.15 44.5 6.7 70.6 22.05 103.15 28.65 117.35 41.25 138.9 46.6 147.95 56.8 147.8 66.15 147.65 72.8 140.65 79.85 133.35 77.35 124.45 74.4 114 58.5 106.1 35 94.35 37.8 80.9 38.85 76.15 43 71.95 46.35 68.55 49.6 67.25 53 65.9 55.05 65.8 58.3 65.65 61.55 67.9 69.7 73.75 79.75 97.55 84 107.75 97.95 109.6 103.85 110.4 109.05 109.05 114.45 107.75 117 104.7 123.05 97.6 123.45 89 123.95 78.8 115.6 72.3 112.2 69.6 104.15 70 99.55 70.2 89.6 71.2 81 71.55 76.7 68.75 71.1 65.1 70.6 55.35 70.3 49.75 74.5 43.6 78.5 37.75 84.6 34.45 90.95 30.85 96.4 32.05 Z',
			});
	
			motif2.add(motif2Shape);
			
			return motif2;
			
		case 3:

			// Motif 3
			
			var motif3 = new Kinetic.Group({
				id:"motif3",
				rotation:angle						
			});
	
			var motif3Shape = new Kinetic.Path({
				x: 18,
				y: -200,
				rotation:65,
				fill: motCle.couleur,
				data: 'M 101.25 81.3 Q 124.15 90.25 154.1 96.15 168.95 99.05 179.25 100.25 L 84.95 50.5 Q 54.25 34.35 25.3 32.35 15.85 31.75 10.35 32.85 8.2 33.25 7.95 33.75 7.65 34.25 9.4 34.45 12.75 34.9 22.95 40.35 27.5 42.75 45.6 53.1 81.85 73.7 101.25 81.3 M 179.45 100.3 L 179.5 100.25 179.45 100.25 Q 157.55 74.45 138.5 49.4 133.15 42.35 130.45 39.45 127.1 35.85 121.7 31.7 115.35 26.85 87.35 13.25 L 60.65 0.65 Q 60.35 0.3 60.6 1.7 60.85 3.25 61.95 5.6 65.4 12.9 74.65 22.9 104.3 54.95 179.35 100.25 179.3 100.25 179.25 100.25 162.75 100.3 142.35 97.85 101.3 93.05 81.65 80.85 69.7 73.45 52.7 68.65 28.55 61.9 0.2 62.55 L 29.6 77.5 Q 61.2 93.4 72.2 98 91.25 106 113.05 108.15 146.1 111.4 179.4 100.3 179.446875 100.3 179.5 100.35 L 179.45 100.3 Z',
			});
	
			motif3.add(motif3Shape);
		
			return motif3;
	}
}

var createMotifs = function(layer, motCle1, motCle2, motCle3)
{
	var radius = 20;
	var scale = 1.2;
	
	var motifsGroup = new Kinetic.Group({
		scaleX:scale,
		scaleY:scale
	});
	
	if (motCle1 != null)
	{
		motifsGroup.add(createMotif(motCle1, 0));
	}
	
	if (motCle2 != null)
	{
		motifsGroup.add(createMotif(motCle2, 120));
	}
	
	if (motCle3 != null)
	{
		motifsGroup.add(createMotif(motCle3, 240));
	}
	
	var circle = new Kinetic.Shape({
		fill: "white",
		drawFunc: function(context) {
			context.beginPath();
			context.arc(0, 0, radius, 0, 2 * Math.PI, true);
			context.fillShape(this);
		}
	});
	
	motifsGroup.add(circle);
	
	return motifsGroup;
}

var createIcon = function(layer, x, y, scale, itemId, motCle1, motCle2, motCle3, titre, pseudo)
{
	var couleur1, couleur2, couleur3;
	
	if (motCle1) couleur1 = motCle1.couleur;
	if (motCle2) couleur2 = motCle2.couleur;
	if (motCle3) couleur3 = motCle3.couleur;
	
	var arcs = createArcs( layer, couleur1, couleur2, couleur3 );
	var motif = createMotifs( layer, motCle1, motCle2, motCle3 );

	var angle0 = 0;
	var angle2PI = 2 * Math.PI;

	var strokeWidth = 20;
	var radius = 50;

	var circle = new Kinetic.Shape({
		name: "iconCircle",
		fill : "white",
		opacity:0,
		strokeWidth: strokeWidth,
		drawFunc: function(context) {
			context.beginPath();
			context.arc(0, 0, radius, angle0, angle2PI, true);
			context.fillShape(this);
		}
	});
	
	var iconGroup = new Kinetic.Group({
		name: "iconGroup",
		x: x,
		y: y,
		scaleX:scale,
		scaleY:scale
	});
	
	var position = { left: x, top: y };
	
	iconGroup.add(arcs);
	iconGroup.add(motif);
	iconGroup.add(circle);

	motif.setVisible(false);
	
	circle.on("mouseover", function() {
		arcs.setVisible(false);
		motif.setVisible(true);
		layer.draw();
		
		document.body.style.cursor = 'pointer';

		var v = App.eventManager;
		if (v) {
			v.trigger("itemRollOver", itemId, titre, pseudo, position);
		}
		
	});
	
	circle.on("mouseout", function() {
		motif.setVisible(false);
		arcs.setVisible(true);
		layer.draw();
		
		document.body.style.cursor = 'default';

		var v = App.eventManager;
		if (v) {
			v.trigger("itemRollOut", itemId, titre, pseudo, position);
		}
	});
	
	circle.on("click", function() {
		var v = App.eventManager;
		if (v) v.trigger("itemSelection", itemId, null, motCle1, motCle2, motCle3, titre, pseudo);
	});
	
	layer.add(iconGroup);
	
	return iconGroup;
}

/* */

var svgArc = function(x, y, startingAngle, endAngle, radius) {

	var departX = Math.floor(x + radius * Math.cos(startingAngle));
	var departY = Math.floor(y + radius * Math.sin(startingAngle));
	
	var arriveX = Math.floor(x + radius * Math.cos(endAngle));
	var arriveY = Math.floor(y + radius * Math.sin(endAngle));
	
	var sweepFlag = 0;
	
	if ((startingAngle != null) && (endAngle != null)) {
		var diff = endAngle - startingAngle;
		sweepFlag = (diff >= Math.PI) ? 1 : 0;
	}
	
	return d = "M" + departX + "," + departY + " A" + radius + "," + radius + " 0 " + sweepFlag + " 1 " + " " + arriveX + "," + arriveY;
}

var svgArcs = function(couleur1, couleur2, couleur3)
{
	var radius = 7;
	var x = 4 + radius;
	var y = 4 + radius;
	
	var angle0 = 0;
	var angle2PI = 2 * Math.PI;
	var strokeWidth = 5;

	var angle1Arc1, angle2Arc1;
	var angle1Arc2, angle2Arc2;
	var angle1Arc3, angle2Arc3;
	var path1, path2, path3;
	
	var result = { arc1:"", arc2:"", arc3:""};

	if (couleur1 == null) return;
	
	if (couleur2 == null)
	{
		angle1Arc1 = angle0;
		angle2Arc1 = angle2PI;
		path1 = svgArc(x, y, angle1Arc1, angle2Arc1, radius);
		result.arc1 = '<g><path class="perso_path" stroke="' + couleur1 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path1 + '"/></g>';
	}
	else if (couleur3 == null)
	{
		angle1Arc1 = angle0;
		angle2Arc1 = angle2PI / 2;
		path1 = svgArc(x, y, angle1Arc1, angle2Arc1, radius);
		result.arc1 = '<g><path class="perso_path" stroke="' + couleur1 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path1 + '"/></g>';
		
		angle1Arc2 = angle2Arc1;
		angle2Arc2 = angle2PI;
		path2 = svgArc(x, y, angle1Arc2, angle2Arc2, radius);
		result.arc2 = '<g><path class="perso_path" stroke="' + couleur2 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path2 + '"/></g>';
	}
	else
	{
		angle1Arc1 = angle0;
		angle2Arc1 = 2 * Math.PI / 3;
		path1 = svgArc(x, y, angle1Arc1, angle2Arc1, radius);
		result.arc1 = '<g><path class="perso_path" stroke="' + couleur1 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path1 + '"/></g>';
		
		angle1Arc2 = angle2Arc1;
		angle2Arc2 = 4 * Math.PI / 3;
		path2 = svgArc(x, y, angle1Arc2, angle2Arc2, radius);
		result.arc2 = '<g><path class="perso_path" stroke="' + couleur2 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path2 + '"/></g>';
		
		angle1Arc3 = angle2Arc2;
		angle2Arc3 = angle2PI;
		path3 = svgArc(x, y, angle1Arc3, angle2Arc3, radius);
		result.arc3 = '<g><path class="perso_path" stroke="' + couleur3 + '" stroke-width="'+ strokeWidth + '" fill="white" d="' + path3 + '"/></g>';
	}
	
	result.circle ='<g><circle cx="' + x + 'px" cy="' + y + 'px" r ="' + radius + 'px" fill ="white" stroke ="none" /></g>';

	
	return result;
}