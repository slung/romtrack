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
            this.onMessage("showData", this.onShowData);
            this.onMessage("stateChanged", this.onStateChanged);
            this.onMessage("showDataItemTooltip", this.onShowDataItemTooltip);
            this.onMessage("selectDataItemOnMap", this.onSelectDataItem);
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
				
                this.dataManager.getDataFromDataSource();
				this.sendMessage("mapReady");
				
				google.maps.event.removeListener(listener);
			}, this));
            
            google.maps.event.addListener(this.map, 'idle', TRACKS.bind(function(evt) {
                if (this.app.state === TRACKS.App.States.INFO) {
                    TRACKS.unmask(TRACKS.MASK_ELEMENT);
                }
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
        
        addData: function (data) {
            var startMarker, endMarker = null;
            
            for (var i = 0; i < data.length; i++) {
                
                startMarker =  this.createMarker({
                    icon: data[i].startMarkerUrl,
                    position: data[i].point ? data[i].point : data[i].getStartTrackPoint()
                });
                
                startMarker.data = data[i];
                data[i].startMarker = startMarker;
                
                if (data[i] instanceof TRACKS.Track) {
                    endMarker =  this.createMarker({
                        icon: data[i].endMarkerUrl,
                        position: data[i].getEndTrackPoint(),
                        hideMarker: true
                    });
                    
                    endMarker.data = data[i];
                    data[i].endMarker = endMarker;
                }
                
                this.addMarkerListeners(startMarker);
                this.markers.push(startMarker);
                
                if (endMarker) {
                    this.markers.push(endMarker);
                }
            }
            
            //this.enableClustering();
        },
        
        removeData: function () {
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i].data.mapTrack) {
                    this.markers[i].data.mapTrack.setMap(null);
                }
                this.markers[i].setMap(null);
            }
            
            this.removeTooltip();
        },
        
        addMarkerListeners: function (marker) {
            // Toggle track visibility on track marker click
             google.maps.event.addListener(marker, 'click', TRACKS.bind(function () {
                 this.onMarkerClick(marker);
             }, this));

            google.maps.event.addListener(marker, 'mouseover', TRACKS.bind(function (evt) {
                if (this.app.state == TRACKS.App.States.INFO) {
                    return;
                }
                
                this.onMarkerOver(marker);
            }, this));

            google.maps.event.addListener(marker, 'mouseout', TRACKS.bind(function (evt) {
                if (this.app.state == TRACKS.App.States.INFO) {
                    return;
                }
                
                this.removeTooltip();
            }, this));
        },
        
        selectDataItem: function (data) {
            if (!data) {
                return;
            }
            
            this.removeTooltip();
            this.deselectData(this.lastData);
            
            if (this.lastData && this.lastData.index == data.index) {
                this.lastData = null;
                return;
            }
            
            TRACKS.mask(TRACKS.MASK_ELEMENT);
            
            // Save data
            this.lastData = data;
            
            // Show tooltip
            this.showTooltip(data.startMarker, true);
            
            if (data instanceof TRACKS.Track) {
                // show track, change state
                data.mapTrack.setMap(this.map);
                this.map.fitBounds(data.bounds);

                // Show track end marker
                this.lastData.endMarker.setMap(this.map);
                
                // Send mesages
                this.sendMessage("showElevationProfile", data);
            } else {
                this.sendMessage("hideElevationProfile", data);
            }
            
            this.sendMessage("changeState", {state: TRACKS.App.States.INFO});
            
            TRACKS.unmask(TRACKS.MASK_ELEMENT);
        },
        
        deselectData: function (data) {
            if (!data) {
                return;
            }
            
            // Remove end track marker
            if (this.lastData.endMarker) {
                this.lastData.endMarker.setMap(null);
                data.mapTrack.setMap(null);
                this.sendMessage("reverseState");
            }
        },
        
        showTooltip: function (marker, fullDetails) {
            var content = null,
                offset = null,
                closeBoxURL = fullDetails ? "../../assets/images/close.png" : "";
            
            this.removeTooltip();

            if (marker.data instanceof TRACKS.Track) {
                content = this.mustache(this.templates.trackTooltipTemplate, {
                    data: marker.data,
                    fullDetails: fullDetails
                });
                
                offset = fullDetails ? new google.maps.Size(-136, -155) : new google.maps.Size(-136, -125);
            } else {
                content = this.mustache(this.templates.poiTooltipTemplate, {
                    data: marker.data,
                    fullDetails: fullDetails
                });
                
                offset = new google.maps.Size(-136, -120);
            }
            
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
            var data = [];
            
			if (!msg || !msg.lat || !msg.lon) {
				return;
            }
            
            if (this.dataManager.poiFilterActive && this.dataManager.trackFilterActive) {
                data = this.geoOperations.getDataInBounds(this.dataManager.tracks.concat(this.dataManager.pois), msg, this.app.views[0].searchRadius);
            } else if (this.dataManager.trackFilterActive) {
                    data = this.geoOperations.getDataInBounds(this.dataManager.tracks, msg, this.app.views[0].searchRadius);
            } else if (this.dataManager.poiFilterActive) {
                data = this.geoOperations.getDataInBounds(this.dataManager.pois, msg, this.app.views[0].searchRadius);
            }
            
            if (data.length > 0) {
                this.setCenterMarker(msg);
                return;
            } else {
                this.setCenter(msg);
                this.setZoom(this.zoom);
            }
		},
        
        onShowData: function (msg) {
            var boundsToFit = null;
            
            TRACKS.mask(TRACKS.MASK_ELEMENT);
            
            // Reset last saved track when all tracks are displayed
            if (this.dataManager.poiFilterActive && this.dataManager.trackFilterActive) {
                var dataLength = this.dataManager.tracks.length + this.dataManager.pois.length;
                
                if (msg.length === dataLength) {
                    this.lastData = null;
                }
            } else if (this.dataManager.trackFilterActive) {
                if (msg.length === this.dataManager.tracks.length) {
                    this.lastData = null;
                }
            } else if (this.dataManager.poiFilterActive) {
                if (msg.length === this.dataManager.pois.length) {
                    this.lastData = null;
                }
            }
            
            this.removeData();
            this.addData(msg);
            
            if (this.app.state == TRACKS.App.States.SEARCH || this.app.state == TRACKS.App.States.DEFAULT) {
                boundsToFit = this.geoOperations.getDataBounds(msg);
                
                // Included geocoded location to be within bounds to fit
                if (this.dataManager.geocodedLocation) {
                    boundsToFit.extend(new google.maps.LatLng(this.dataManager.geocodedLocation.lat, this.dataManager.geocodedLocation.lon));
                }
                
                this.map.fitBounds(boundsToFit);
            }
            
            TRACKS.unmask(TRACKS.MASK_ELEMENT);
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
        
        onStateChanged: function (msg) {
            if (msg.currentState == TRACKS.App.States.INFO) {
                //Disable clustering
                //this.disableClustering();
            }
            
            if (msg.lastState == TRACKS.App.States.INFO) {
                //Enable clustering
                //this.enableClustering();
            }
        },
        
        onShowDataItemTooltip: function (dataItem) {
            this.onMarkerOver(dataItem.startMarker);
        },
        
        onSelectDataItem: function (dataItem) {
            this.selectDataItem(dataItem);
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
            if (this.centerMarker) {
                this.centerMarker.setMap(null);
            }
        },
		
		/*
		 * Events
		 */
        
         onMarkerClick: function (marker) {
             this.selectDataItem(marker.data);
             this.sendMessage("selectDataItemInList", marker.data);
             
             // Send to analytics
            this.sendAnalytics("Marker clicked", "Name: " + marker.data.name + " | URL: " + marker.data.url);
         },
        
        onMarkerOver: function (marker) {
            if (this.app.state == TRACKS.App.States.INFO) {
                return;
            }
            
            this.showTooltip(marker, false);
        }

	});
	
	// Publish
	TRACKS.MapView = MapView;
	
}(TRACKS));