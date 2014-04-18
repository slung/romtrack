(function( TRACKS )
{
	var tracksManager = null;
	var TracksManager = new Class({
		
        tracksRegistrar: "assets/tracks/tracks-registrar.txt",
        tracks: [],
        trackCounter: 0,
        expectedNbOfTracks: 0,
        
        // Assume only GPX format tracks
		getAllTracks: function( success, error )
		{
            this.trackCounter = 0;
            this.expectedNbOfTracks = 0;
            this.tracks = [];
            
			jQuery.ajax({
		    	url: this.tracksRegistrar,
		    	type: 'GET',
		    	success: TRACKS.bind(function(data){
		    		var parsedData = TRACKS.JSON.parse(data);
                    this.expectedNbOfTracks = parsedData.length;
                    
                    for (var i = 0; i < parsedData.length; i++) {
                        this.extractTrackData(parsedData[i]);
                    }
		    	}, this)
		    });
		},
        
        getTracksBounds: function () {
            var tracksBounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < this.tracks.length; i++) {
                tracksBounds.union(this.tracks[i].bounds);
            }
            
            return tracksBounds;
        },
        
        extractTrackData: function (parsedData) {
            jQuery.ajax({
                url: parsedData.url,
                type: 'GET',
                dataType: "xml",
                success: TRACKS.bind(function(gpxData){
                    var trackData = this.trackPointsFromGPX(gpxData);
                    this.saveTrack(parsedData.name, trackData.trackPoints, trackData.elevationPoints);
                    this.trackCounter++;

                    if (this.trackCounter == this.expectedNbOfTracks) {
                        TRACKS.dispatcher.fire("tracksLoaded", this.tracks);
                    }
                }, this)
            });
        },
        
        saveTrack: function(name, trackPoints, elevationPoints) {
            this.tracks.push(new TRACKS.Track(name, trackPoints, elevationPoints));
        },
        
        trackPointsFromGPX: function (gpxData) {
            var trackPoints = [];
            var elevationPoints = [];
            var pointNodeName = null;
            
            if (jQuery(gpxData).find("rtept").length > 0) {
                pointNodeName = "rtept";
            } else if (jQuery(gpxData).find("wpt").length > 0) {
                pointNodeName = "wpt";
            } else if (jQuery(gpxData).find("trkpt").length > 0) {
                pointNodeName = "trkpt";
            }
            
            jQuery(gpxData).find(pointNodeName).each(function() {
                var lat = jQuery(this).attr("lat");
                var lng = jQuery(this).attr("lon");
                var p = new google.maps.LatLng(lat, lng);
                var ep = jQuery(this).children("ele").text();

                trackPoints.push(p);
                elevationPoints.push(ep);
            });
            
            return {trackPoints: trackPoints, elevationPoints: elevationPoints};
        }

	});
	
	TracksManager.getInstance = function () {
		if( tracksManager )
			return tracksManager;
		
		tracksManager = new TracksManager();
		return tracksManager;
	};
	
	TRACKS.TracksManager = TracksManager;
	
})(TRACKS);

