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
        
        getTracksWithinLocationBounds: function (points, location, radius) {
            var center = null,
                centerBounds = null,
                searchBounds = null,
                pointsInBounds = [],
                ne = null,
                se = null,
                sw = null;
            
            if (!points || !location || points.length == 0) {
                return;
            }
            
            // Establish search location bounds
            center = new google.maps.LatLng(location.lat, location.lon);
            centerBounds = new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3]));
            
            //Establish search area bounds
            ne = this.getPointAtDistanceFromPoint(center, 45, radius);
            se = this.getPointAtDistanceFromPoint(center, 135, radius);
            sw = this.getPointAtDistanceFromPoint(center, 245, radius);
            
            searchBounds = new google.maps.LatLngBounds(sw, ne);
            searchBounds.extend(se);
            
            for (var i = 0; i < points.length; i++) {
                if (searchBounds.contains(points[i].points[0]) || searchBounds.contains(points[i].points[points[i].points.length - 1])) {
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

