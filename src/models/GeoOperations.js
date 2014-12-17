(function(TRACKS)
{
    Number.prototype.toRad = function() {
       return this * Math.PI / 180;
    }

    Number.prototype.toDeg = function() {
       return this * 180 / Math.PI;
    }
    
	var geoOperations = null;
	var GeoOperations = new Class({
		
         getPointAtDistanceFromPoint : function (referencePoint, bearing, distance) {

            distance = distance / 6371;  
            bearing = bearing.toRad();  

            var lat1 = referencePoint.lat().toRad(), lon1 = referencePoint.lng().toRad();

            var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing));

            var lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1), Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2));

            if (isNaN(lat2) || isNaN(lon2)) {
                return null;
            }

            return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
        },
        
        getTracksInBounds: function (points, bounds) {
            if (!points || !bounds || points.length == 0) {
                return;
            }
            
            var pointsInBounds = [];
            
            for (var i = 0; i < points.length; i++) {
                if (bounds.contains(points[i].points[0]) || bounds.contains(points[i].points[points[i].points.length - 1])) {
                    pointsInBounds.push(points[i]);
                }
            }
            
            return pointsInBounds;
        },
        
        getTracksBounds: function (tracks) {
            var tracksBounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < tracks.length; i++) {
                tracksBounds.union(tracks[i].bounds);
            }
            
            return tracksBounds;
        },
        
        getTracksStartPointBounds: function (tracks) {
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < tracks.length; i++) {
                bounds.extend(tracks[i].getStartTrackPoint());
            }
            
            return bounds;
        } 

	});
	
	GeoOperations.getInstance = function () {
		if( geoOperations )
			return geoOperations;
		
		geoOperations = new GeoOperations();
		return geoOperations;
	};
	
	TRACKS.GeoOperations = GeoOperations;
	
})(TRACKS);

