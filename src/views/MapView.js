(function( TRACKS )
{
	var MapView = TRACKS.View.extend({
		
		map: null,
        zoom: 15,
        centerMarker: null,
        trackLayers: [],
		
		events: {
			
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
			this.dataManager.on('userNotGeocoded', TRACKS.bind( this.onUserNotGeocoded, this));
			
			this.startZoom = cfg.startZoom || 3;
		},
		
		register: function()
		{
			this.onMessage("centerMap", this.onCenterMap);
            this.onMessage("tracksLoaded", this.onTracksLoaded);
		},
		
		render: function()
		{
			var mapOptions = {
				zoom: this.startZoom,
                center: new google.maps.LatLng(40.0000, -98.0000),
				mapTypeId: google.maps.MapTypeId.SATELLITE,
				mapTypeControl: true,
			    mapTypeControlOptions: {
			        style: google.maps.MapTypeControlStyle.DEFAULT,
			        position: google.maps.ControlPosition.TOP_RIGHT
			    },
			    panControl: false,
			    zoomControl: false,
			    streetViewControl: false,
			    zoomControlOptions: {
			        style: google.maps.ZoomControlStyle.SMALL
			    }
			}
			
			this.map = new google.maps.Map( this.renderContainer, mapOptions );
			
			//Add MapReady listener
			var listener = google.maps.event.addListener( this.map, 'tilesloaded', TRACKS.bind( function( evt ) {
				
				this.sendMessage("mapReady");
				
				google.maps.event.removeListener(listener);
			}, this ));
			
			return this;
		},
		
		centerAndZoom: function (center, zoom)
		{
			if ( !center || !center.lat || !center.lon || !zoom)
				return;
            
            var theCenter = new google.maps.LatLng( center.lat, center.lon );
            
            // if center marker already exists, change position; if not create it
            if (this.centerMarker) {
                this.centerMarker.setPosition(theCenter);
            } else {
                this.centerMarker = this.createMarker({
                    url: "assets/images/target-icon.png",
                    position: {
                        lat: center.lat,
                        lon: center.lon
                    }
                });
            }
			
			this.map.setCenter( theCenter );
			this.map.setZoom( zoom );
		},
		
		createMarker: function (markerInfo)
		{
			return new google.maps.Marker({
				map: this.map,
				animation: google.maps.Animation.DROP,
				icon: markerInfo.url,
				position: new google.maps.LatLng( markerInfo.position.lat, markerInfo.position.lon )
			});
		},
        
        addTracks: function (tracks) {
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                var marker = new google.maps.Marker({
                    map: this.map,
                    animation: google.maps.Animation.DROP,
                    icon: track.startMarkerUrl,
                    position: track.getStartTrackPoint()
                });

                marker.track = track;
                
                // Toggle track visibility on track marker click
                 google.maps.event.addListener(marker, 'click', function () {

                     if (this.track.isVisible) {
                        this.setVisible(true);
                        this.track.mapTrack.setMap(null);
                        this.track.isVisible = false;
                     } else {
                        this.track.mapTrack.setMap(this.map);
                        this.map.fitBounds(this.track.bounds);
                        this.track.isVisible = true;
                     }
                 });
                
                google.maps.event.addListener(marker, 'mouseover', TRACKS.bind(function (evt) {
                    this.onTrackMarkerOver(marker);
                }, this));
                
                google.maps.event.addListener(marker, 'mouseout', TRACKS.bind(function (evt) {
                    if (this.hoverTooltip) {
                        this.hoverTooltip.close();
                    }
                }, this));
            }
        },
        
		/*
		 * Messages
		 */
		onUserGeocoded: function( msg )
		{
			if ( !msg || !msg.lat || !msg.lon )
				return;
            
            this.centerAndZoom( {
				lat: msg.lat,
				lon: msg.lon
			}, this.zoom );
		},
		
		/*
		 * If user was not geocoded set the map to default position
		 */
		onUserNotGeocoded: function( msg )
		{
			this.zoom = 3;
		},
        
        onTracksLoaded: function (msg) {
            this.addTracks(msg);
        },
		
		onCenterMap: function( msg )
		{
			//Center and zoom map
			this.centerAndZoom({
				lat: msg.lat,
				lon: msg.lon
			}, this.zoom);
		},
		
		/*
		 * Events
		 */
        
        onTrackMarkerOver: function (marker) {
            var content = this.mustache(this.templates.tooltipTemplate, {
                track: {
                    name: marker.track.name
                }
            });

            this.hoverTooltip = new InfoBox({
                content: content, 
                closeBoxMargin: "11px 10px 0px 0px",
                alignBottom: true,
                //pixelOffset: new google.maps.Size(-152, -25)
            });
            
            this.hoverTooltip.open(this.map, marker);
        }

	});
	
	// Publish
	TRACKS.MapView = MapView;
	
}(TRACKS));