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
        
        getDataInBounds: function (data, location, radius) {
            var center = null,
                centerBounds = null,
                searchBounds = null,
                pointsInBounds = [],
                ne = null,
                se = null,
                sw = null,
                radius = radius ? radius : 0;

            if (!data || !location || data.length == 0) {
                return;
            }

            TRACKS.mask(TRACKS.MASK_ELEMENT);

            // Establish search location bounds
            center = new google.maps.LatLng(location.lat, location.lon);
            centerBounds = new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3]));

            //Establish search area bounds
            ne = this.getPointAtDistanceFromPoint(center, 45, radius);
            se = this.getPointAtDistanceFromPoint(center, 135, radius);
            sw = this.getPointAtDistanceFromPoint(center, 245, radius);

            searchBounds = new google.maps.LatLngBounds(sw, ne);
            searchBounds.extend(se);
            
            for (var i = 0; i < data.length; i++) {
                if (data[i] instanceof TRACKS.Track) {
                    if (searchBounds.contains(data[i].points[0]) || searchBounds.contains(data[i].points[data[i].points.length - 1])) {
                        pointsInBounds.push(data[i]);
                    }
                } else {
                    if (searchBounds.contains(data[i].point)) {
                        pointsInBounds.push(data[i]);
                    }
                }
            }

            TRACKS.unmask(TRACKS.MASK_ELEMENT);

            return pointsInBounds;
        },
        
        getDataBounds: function (data) {
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < data.length; i++) {
                if (data[i] instanceof TRACKS.Track) {
                    bounds.extend(data[i].getStartTrackPoint());
                } else {
                    bounds.extend(data[i].point);
                }
            }
            
            return bounds;
        } 

	});
	
	GeoOperations.getInstance = function () {
		if (geoOperations) {
			return geoOperations;
        }
		
		geoOperations = new GeoOperations();
		return geoOperations;
	};
	
	TRACKS.GeoOperations = GeoOperations;
	
})(TRACKS);

