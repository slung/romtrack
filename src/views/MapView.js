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
			
			this.startZoom = cfg.startZoom || 7;
            this.startLocation = cfg.startLocation || {
                lat: 46.08371401022221,
                lon: 23.73289867187499
            };
            this.sendAnalytics = cfg.sendAnalytics;
            
            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
		},
		
		register: function()
		{
            this.onMessage("setCenter", this.onSetCenter);
            this.onMessage("setCenterMarker", this.setCenterMarker);
			this.onMessage("setZoom", this.onSetZoom);
            this.onMessage("fitMapToBounds", this.onFitMapToBounds);
            this.onMessage("showTracks", this.onShowTracks);
            this.onMessage("searchTracksNearLocation", this.onSearchTracksNearLocation);
            this.onMessage("stateChanged", this.onStateChanged);
            this.onMessage("showTrackTooltip", this.onShowTrackTooltip);
            this.onMessage("selectTrackOnMap", this.onSelectTrack);
            this.onMessage("showElevationMarker", this.onShowElevationMarker);
            this.onMessage("hideElevationMarker", this.onHideElevationMarker);
            this.onMessage("panBy", this.onPanBy);
            this.onMessage("emptySearch", this.onEmptySearch);
		},
		
		render: function()
		{
			var mapOptions = {
				zoom: this.startZoom,
                center: new google.maps.LatLng(this.startLocation.lat, this.startLocation.lon),
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
				
                this.tracksManager.getTracksFromDataSource();
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
            
            this.setCenterMarker(center);
			this.map.setCenter(theCenter);
        },
        
        setCenterMarker: function (center) {
            if ( !center || !center.lat || !center.lon)
				return;
            
            var theCenter = new google.maps.LatLng( center.lat, center.lon );
            
            // if center marker already exists, change position; if not create it
            if (this.centerMarker) {
                this.centerMarker.setMap(this.map);
                this.centerMarker.setPosition(theCenter);
            } else {
                this.centerMarker = this.createMarker({
                    icon: "assets/images/target-icon.png",
                    position: {
                        lat: center.lat,
                        lon: center.lon
                    }
                });
            }
        },
		
		createMarker: function (markerInfo)
		{
            var map = markerInfo.hideMarker ? null : this.map,
                position = (markerInfo.position && (!markerInfo.position.lat || !markerInfo.position.lon)) ? markerInfo.position : new google.maps.LatLng(markerInfo.position.lat, markerInfo.position.lon);
            
			return new google.maps.Marker({
                map: map,
				//animation: google.maps.Animation.DROP,
				icon: markerInfo.icon,
                position: position
			});
		},
        
        addTracks: function (tracks) {
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                var startMarker =  this.createMarker({
                    icon: track.startMarkerUrl,
                    position: track.getStartTrackPoint()
                });
                
                var endMarker =  this.createMarker({
                    icon: track.endMarkerUrl,
                    position: track.getEndTrackPoint(),
                    hideMarker: true
                });

                // Set track markers
                startMarker.track = track;
                track.startMarker = startMarker;
                
                endMarker.track = track;
                track.endMarker = endMarker;
                
                this.addStartTrackMarkerListeners(startMarker);
                this.markers.push(startMarker);
                this.markers.push(endMarker);
            }
            
            //this.enableClustering();
        },
        
        removeTracks: function () {
            for (var i = 0; i < this.markers.length; i++) {
                this.markers[i].track.mapTrack.setMap(null);
                this.markers[i].setMap(null);
            }
            
            this.removeTooltip();
        },
        
        addStartTrackMarkerListeners: function (marker) {
            // Toggle track visibility on track marker click
             google.maps.event.addListener(marker, 'click', TRACKS.bind(function () {
                 this.onTrackMarkerClick(marker);
             }, this));

            google.maps.event.addListener(marker, 'mouseover', TRACKS.bind(function (evt) {
                if (this.app.state == TRACKS.App.States.TRACK_INFO) {
                    return;
                }
                
                this.onTrackMarkerOver(marker);
            }, this));

            google.maps.event.addListener(marker, 'mouseout', TRACKS.bind(function (evt) {
                if (this.app.state == TRACKS.App.States.TRACK_INFO) {
                    return;
                }
                
                this.removeTooltip();
            }, this));
        },
        
        selectTrack: function (track) {
            if (!track) {
                return;
            }

            this.removeTooltip();
            this.deselectTrack(this.lastTrack);
            
            if (this.lastTrack && this.lastTrack.index == track.index) {
                this.lastTrack = null;
                return;
            }
            
            // Show tooltip
            this.showTooltip(track.startMarker, true);
            
            // show track, change state
            track.mapTrack.setMap(this.map);
            this.map.fitBounds(track.bounds);
            
            // Send mesages
            this.sendMessage("showElevationProfile", track);
            this.sendMessage("changeState", {state: TRACKS.App.States.TRACK_INFO});
            
            // Save track
            this.lastTrack = track;
            
            // Show track end marker
            this.lastTrack.endMarker.setMap(this.map);
        },
        
        deselectTrack: function (track) {
            if (!track) {
                return;
            }
            
            // Remove end track marker
            this.lastTrack.endMarker.setMap(null);
            
            track.mapTrack.setMap(null);
            this.sendMessage("reverseState");
        },
        
        showTooltip: function (marker, fullDetails) {
            this.removeTooltip();

            var content = this.mustache(this.templates.tooltipTemplate, {
                track: marker.track,
                fullDetails: fullDetails
            });

            var closeBoxURL = fullDetails ? "../../assets/images/close.png" : "";
            var offset = fullDetails ? new google.maps.Size(-136, -155) : new google.maps.Size(-136, -125)
            
            this.tooltip = new InfoBox({
                content: content, 
                closeBoxURL: closeBoxURL,
                closeBoxMargin: "5px 5px 0px 0px",
                pixelOffset: offset
            });

            this.tooltip.open(this.map, marker);
        },
        
        removeTooltip: function () {
            if (this.tooltip) {
                this.tooltip.close();
            }
        },
        
//        enableClustering: function()
//		{
//            this.disableClustering();
//            
//			this.markerCluster = new MarkerClusterer(this.map, this.markers, {
//				styles: this.clusterOptions.styles,
//				gridSize: this.clusterOptions.gridSize,
//				maxZoom: this.clusterOptions.maxZoom
//			});
//		},
//        
//        disableClustering: function () {
//            if (this.markerCluster) {
//                return this.markerCluster.clearMarkers();
//            }
//        },
        
		/*
		 * Messages
		 */
		onUserGeocoded: function( msg )
		{
			if (!msg || !msg.lat || !msg.lon) {
				return;
            }
            
            if (this.geoOperations.getTracksWithinLocationBounds(this.tracksManager.tracks, msg, this.app.views[0].searchRadius).length > 0) {
                this.setCenterMarker(msg);
                return;
            } else {
                this.setCenter(msg);
                this.setZoom(this.zoom);
            }
		},
		
		/*
		 * If user was not geocoded set the map to default position
		 */
		onUserNotGeocoded: function( msg )
		{
			//this.zoom = 3;
		},
        
        onShowTracks: function (msg) {
            var boundsToFit = null;
            
            this.removeTracks();
            this.addTracks(msg);
            
            if (this.app.state == TRACKS.App.States.SEARCH || this.app.state == TRACKS.App.States.DEFAULT) {
                boundsToFit = this.geoOperations.getTracksStartPointBounds(msg);
                
                // Included geocoded location to be within bounds to fit
                if (this.dataManager.geocodedLocation) {
                    boundsToFit.extend(new google.maps.LatLng(this.dataManager.geocodedLocation.lat, this.dataManager.geocodedLocation.lon));
                }
                
                this.map.fitBounds(boundsToFit);
            }
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
                //this.disableClustering();
            }
            
            if (msg.lastState == TRACKS.App.States.TRACK_INFO) {
                //Enable clustering
                //this.enableClustering();
            }
        },
        
        onShowTrackTooltip: function (track) {
            this.onTrackMarkerOver(track.startMarker);
        },
        
        onSelectTrack: function (track) {
            this.selectTrack(track);
        },
        
        onShowElevationMarker: function (info) {
            if (!info || !info.position) {
                return;
            }
            
            if (this.elevationMarker) {
                this.elevationMarker.setMap(null);
            }
            
            this.elevationMarker = this.createMarker(info);
        },
        
        onHideElevationMarker: function () {
            if (this.elevationMarker) {
                this.elevationMarker.setMap(null);
            }
        },
        
        onPanBy: function (offset) {
            if (!offset) {
                return;
            }
            
            this.map.panBy(offset.x, offset.y);
        },
        
        onEmptySearch: function () {
            // Hide center marker
            this.centerMarker.setMap(null);
        },
		
		/*
		 * Events
		 */
        
         onTrackMarkerClick: function (marker) {
             this.selectTrack(marker.track);
             this.sendMessage("selectTrackInList", marker.track);
             
             // Send to analytics
            this.sendAnalytics("Marker clicked", "Name: " + marker.track.name + " | URL: " + marker.track.url);
         },
        
        onTrackMarkerOver: function (marker) {
            if (this.app.state == TRACKS.App.States.TRACK_INFO) {
                return;
            }
            
            this.showTooltip(marker, false);
        }

	});
	
	// Publish
	TRACKS.MapView = MapView;
	
}(TRACKS));