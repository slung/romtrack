(function( TRACKS )
{
	var MapView = TRACKS.View.extend({
		
		map: null,
        zoom: 15,
        centerMarker: null,
        markers: [],
        clusterOptions: {
            gridSize: 50,
            maxZoom: 15,
            styles: [{
                url: 'assets/images/cluster45x45.png',
                height: 45,
                width: 45,
                anchor: (TRACKS.ie() > 8) ? [17, 0] : [16, 0],
                textColor: '#197EBA',
                textSize: 11
              }, {
                url: 'assets/images/cluster70x70.png',
                height: 70,
                width: 70,
                anchor: (TRACKS.ie() > 8) ? [29, 0] : [28, 0],
                textColor: '#197EBA',
                textSize: 11
              }, {
                url: 'assets/images/cluster90x90.png',
                height: 90,
                width: 90,
                anchor: [41, 0],
                textColor: '#197EBA',
                textSize: 11
              }]
        },
		
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
            this.onMessage("setCenter", this.onSetCenter);
			this.onMessage("setZoom", this.onSetZoom);
            this.onMessage("fitMapToBounds", this.onFitMapToBounds);
            this.onMessage("tracksLoaded", this.onTracksLoaded);
            this.onMessage("searchTracksNearLocation", this.onSearchTracksNearLocation);
            this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			var mapOptions = {
				zoom: this.startZoom,
                center: new google.maps.LatLng(40.0000, -98.0000),
				mapTypeId: google.maps.MapTypeId.HYBRID,
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
			var listener = google.maps.event.addListener( this.map, 'tilesloaded', TRACKS.bind(function(evt) {
				
                this.tracksManager.getAllTracks();
				this.sendMessage("mapReady");
				
				google.maps.event.removeListener(listener);
			}, this));
			
			return this;
		},
		
		setZoom: function (zoom)
		{
			if (!zoom)
				return;
            
			this.map.setZoom( zoom );
		},
        
        setCenter: function (center) {
            
            if ( !center || !center.lat || !center.lon)
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
			
			this.map.setCenter(theCenter);
        },
		
		createMarker: function (markerInfo)
		{
			return new google.maps.Marker({
				map: this.map,
				//animation: google.maps.Animation.DROP,
				icon: markerInfo.url,
				position: new google.maps.LatLng( markerInfo.position.lat, markerInfo.position.lon )
			});
		},
        
        addTracks: function (tracks) {
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                var marker = new google.maps.Marker({
                    map: this.map,
                    //animation: google.maps.Animation.DROP,
                    icon: track.startMarkerUrl,
                    position: track.getStartTrackPoint()
                });

                marker.track = track;
                this.addStartTrackMarkerListeners(marker);
                this.markers.push(marker);
            }
            
            this.enableClustering();
        },
        
        removeTracks: function () {
            for (var i = 0; i < this.markers; i++) {
                this.markers[i].setMap(null);
            }
        },
        
        addStartTrackMarkerListeners: function (marker) {
            // Toggle track visibility on track marker click
             google.maps.event.addListener(marker, 'click', TRACKS.bind(function () {
                 this.onTrackMarkerClick(marker);
             }, this));

            google.maps.event.addListener(marker, 'mouseover', TRACKS.bind(function (evt) {
                this.onTrackMarkerOver(marker);
            }, this));

            google.maps.event.addListener(marker, 'mouseout', TRACKS.bind(function (evt) {
                if (this.hoverTooltip) {
                    this.hoverTooltip.close();
                }
            }, this));
        },
        
        enableClustering: function()
		{
            this.disableClustering();
            
			this.markerCluster = new MarkerClusterer(this.map, this.markers, {
				styles: this.clusterOptions.styles,
				gridSize: this.clusterOptions.gridSize,
				maxZoom: this.clusterOptions.maxZoom
			});
		},
        
        disableClustering: function () {
            if (this.markerCluster) {
                return this.markerCluster.clearMarkers();
            }
        },
        
        searchTracksNearLocation: function (location, searchRadius) {
            // Establish search location bounds
            var center = new google.maps.LatLng(location.lat, location.lon);
            var centerBounds = new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3]));
            
            //Establish search area bounds
            var ne = this.geoOperations.getPointAtDistanceFromPoint(center, 45, searchRadius);
            var se = this.geoOperations.getPointAtDistanceFromPoint(center, 135, searchRadius);
            var sw = this.geoOperations.getPointAtDistanceFromPoint(center, 245, searchRadius);
            
            var searchBounds = new google.maps.LatLngBounds(sw, ne);
            searchBounds.extend(se);
            var tracksInBounds = this.geoOperations.getTracksInBounds(this.markers, searchBounds);
            
            this.removeTracks();
            
            if (tracksInBounds && tracksInBounds.length > 0) {
                this.map.fitBounds(searchBounds);
                this.addTracks(tracksInBounds);
            } else {
                this.map.fitBounds(centerBounds);
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
			//this.zoom = 3;
		},
        
        onTracksLoaded: function (msg) {
            this.addTracks(msg);
            this.map.fitBounds(this.tracksManager.getTracksBounds());
        },
		
		onCenterMap: function( msg )
		{
			//Center and zoom map
			this.centerAndZoom({
				lat: msg.lat,
				lon: msg.lon
			}, this.zoom);
		},
        
        onFitMapToBounds: function (bounds) {
            this.map.fitBounds(bounds);
        },
        
        onSetCenter: function (center) {
            this.setCenter(center);
            
            
        },
        
        onSetZoom: function (zoom) {
            this.setZoom(zoom);
        },
        
        onSearchTracksNearLocation: function (msg) {
            if (!msg || !msg.location || !msg.searchRadius) {
                return;
            }
            
            this.setCenter(msg.location );
            this.searchTracksNearLocation(msg.location, msg.searchRadius);
        },
        
        onStateChanged: function (msg) {
            if (msg.currentState == TRACKS.App.States.TRACK_INFO) {
                //Disable clustering
                this.disableClustering();
            }
            
            if (msg.lastState == TRACKS.App.States.TRACK_INFO) {
                //Enable clustering
                this.enableClustering();
            }
        },
		
		/*
		 * Events
		 */
        
         onTrackMarkerClick: function (marker) {
            if (marker.track.isVisible) {
                //hide track, show marker
                marker.track.mapTrack.setMap(null);
                marker.setVisible(true);
                marker.track.isVisible = false;
             } else {
                // show track, change state
                marker.track.mapTrack.setMap(this.map);
                this.map.fitBounds(marker.track.bounds);
                marker.track.isVisible = true;
                 
                this.sendMessage("changeState", {state: TRACKS.App.States.TRACK_INFO});
             }
         },
        
        onTrackMarkerOver: function (marker) {
            var content = this.mustache(this.templates.tooltipTemplate, {
                track: {
                    name: marker.track.name
                }
            });

            this.hoverTooltip = new InfoBox({
                content: content, 
                closeBoxURL: "",
                pixelOffset: new google.maps.Size(-115, -67)
            });
            
            this.hoverTooltip.open(this.map, marker);
        }

	});
	
	// Publish
	TRACKS.MapView = MapView;
	
}(TRACKS));