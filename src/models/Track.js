(function( TRACKS )
{
    var Track = function (name, url, article, preview, points, elevationPoints, index, color, startMarkerUrl, endMarkerUrl) {
        this.name = name;
        this.url = url;
        this.article = article;
        this.preview = preview;
        this.points = points;
        this.elevationPoints = elevationPoints || [];
        this.index = index;
        this.color = color || "#D95642";
        this.startMarkerUrl = startMarkerUrl || "assets/images/marker.png";
        this.endMarkerUrl = endMarkerUrl || "assets/images/end-marker.png";
        this.bounds = this.getBounds();
        this.mapTrack = this.getMapTrack();
        this.length = this.getLength();
        
        var ascentDescent = this.getTotalAscentDescent();
        this.ascent = ascentDescent.ascent;
        this.descent = ascentDescent.descent;
    };
    
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
        
        getEndTrackPoint: function () {
            return this.points[this.points.length - 1];
        },
        
        getMapTrack: function () {
            var polyline = new google.maps.Polyline({
                path: this.points,
                strokeColor: this.color,
                strokeOpacity: 0.7,
                strokeWeight: 4
            });
            
            // Add polyline evnt listener
            google.maps.event.addListener(polyline, 'mouseover', function () {
                this.setOptions({
                    strokeOpacity: 1
                });
            });
            
            google.maps.event.addListener(polyline, 'mouseout', function () {
                this.setOptions({
                    strokeOpacity: 0.7
                });
            });
            
            return polyline; 
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
        },
        
        getTotalAscentDescent: function () {
            if (!this.hasElevationProfile()) {
                return null;
            }
            
            var totalAscent = 0;
            var totalDescent = 0;
            
            for (var i = 0; i < this.elevationPoints.length - 1; i++) {
                if (this.elevationPoints[i] < this.elevationPoints[i+1]) {
                    totalAscent += this.elevationPoints[i+1] - this.elevationPoints[i];
                } else if (this.elevationPoints[i] > this.elevationPoints[i+1]) {
                    totalDescent += this.elevationPoints[i] - this.elevationPoints[i+1]
                }
            }
            
            return {
                ascent: Math.round(totalAscent),
                descent: Math.round(totalDescent)
            };
        }
    };
    
    TRACKS.Track = Track;
	
})(TRACKS);