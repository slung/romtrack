(function( TRACKS )
{
	var Track = function (name, points, elevationPoints, color, startMarkerUrl) {
        this.name = name
        this.points = points;
        this.elevationPoints = [] || elevationPoints;
        this.color = color || "#D95642";
        this.startMarkerUrl = startMarkerUrl || "assets/images/marker.png";
        this.bounds = this.getBounds();
        this.mapTrack = this.getMapTrack();
    }
    
    Track.prototype = {
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
        }
    };
    
    TRACKS.Track = Track;
	
})(TRACKS);