(function( TRACKS )
{
	var Track = function (name, points, elevationPoints, index, color, startMarkerUrl) {
        this.name = name
        this.points = points;
        this.elevationPoints = elevationPoints || [];
        this.index = index;
        this.color = color || "#D95642";
        this.startMarkerUrl = startMarkerUrl || "assets/images/marker.png";
        this.bounds = this.getBounds();
        this.mapTrack = this.getMapTrack();
        this.length = this.getLength();
    }
    
    Track.prototype = {
        hasElevationProfile: function () {
            return (this.elevationPoints.length > 0 && this.elevationPoints.length == this.points.length);
        },
        
        getBounds: function () {
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < this.points.length; i++) {
                bounds.extend(this.points[i]);
            }
            
            return bounds;
        },
        
        getStartTrackPoint: function () {
            return this.points[0];
        },
        
        getMapTrack: function () {
            return new google.maps.Polyline({
              path: this.points,
              strokeColor: this.color,
              strokeOpacity: .7,
              strokeWeight: 4
            });
        },
        
        getLength: function () {
            var trackLength = google.maps.geometry.spherical.computeLength(this.points);
            trackLength = trackLength/1000;
            trackLength = Math.round(trackLength);
            
            return trackLength;
        },
        
        getDistanceFromStart: function (targetPointIndex) {
            var distance = google.maps.geometry.spherical.computeLength(this.points.slice(0, targetPointIndex));
            distance = (distance/1000).toFixed(2);
            
            return parseFloat(distance);
        }
    };
    
    TRACKS.Track = Track;
	
})(TRACKS);