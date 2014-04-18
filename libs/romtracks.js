(function( TRACKS )
{
	var EventManager = new Class({
		
		$events: null,
		
		init: function()
		{
			this.$events = {};
		},
		
		/**
		 * Add listeners to the map.
		 * 
		 * @param eventName
		 * @param fn
		 * 
		 */
		on: function( eventName, fn )
		{
			this.$events[eventName] = this.$events[eventName] || [];
			
			// @TODO: search function befor push
			this.$events[eventName].push( fn );
		},
		
		/**
		 * Fire an event
		 * 
		 * @param {String} eventName
		 * @param {Object} params
		 */
		fire: function( eventName, params )
		{
			var functions = this.$events[eventName];
			
			if( functions )
			{
				for(var key in functions)
				{
					var fn = functions[key];
					fn.apply( this, [params]);
				}	
			}
		},
		
		detach: function( eventName, fn )
		{
			var events = this.$events[eventName];
			
			for( var i=0; i< events.length; i++ )
			{
				if( events[i] == fn )
				{
					delete events[i];
					return;
				}
			}
			
			return;  
		}
	});	

	
	// Publish
	TRACKS.EventManager = EventManager;
	
}(TRACKS));

(function(TRACKS)
{
	var MsgManager = TRACKS.EventManager.extend({
		
		init: function()
		{
			this._parent();
		},
		
		onMessage: function( msgName, fn )
		{
			TRACKS.dispatcher.on( msgName, TRACKS.bind( fn, this ) );
		},
		
		sendMessage: function( msgName, data )
		{
			TRACKS.dispatcher.fire( msgName, data );
		}
		
	});	

	
	// Publish
	TRACKS.MsgManager = MsgManager;
	
	// Make one instance
	TRACKS.dispatcher = new MsgManager();
	
}(TRACKS));

(function( TRACKS )
{
	// Singleton instance
	var dataManager = null;
	var MASK_ELEMENT = ".page";
	
	var DataManager = TRACKS.EventManager.extend({
		
		tableName: '',
		filters: [],
		rowCount: 20,
		cluster: null,
		showLoading: false,
		
		// stores loaded tables
		tables: [],
		
		init: function( cfg ) 
		{
			if( dataManager )
				throw new Error('You can only create one instance of DataManager!');
			
			this._parent();
			
			this.ajax = TRACKS.AjaxManager.getInstance();
		},
		
		geocode: function( address, multipleResults, options )
		{
			var options = options || {};
		    
			var geocoder = new google.maps.Geocoder();
		    
		    geocoder.geocode({ address: address }, TRACKS.bind( function( results, status ) {
		    	
		    	if (status == google.maps.GeocoderStatus.OK) {
		    		
		    		if( multipleResults )
		    		{
		    			var addresses = [];
		    			var index = -1;
		    			
		    			for( var i=0; i<results.length;i++)
		    			{
							index++;
							
							addresses.push({
		    					index: index,
		    					lat: results[i].geometry.location.lat(),
		    					lon: results[i].geometry.location.lng(),
		    					address: results[i].formatted_address,
		    					bounds: [ 	results[i].geometry.viewport.getSouthWest().lat(), 
											results[i].geometry.viewport.getSouthWest().lng(),
											results[i].geometry.viewport.getNorthEast().lat(),
											results[i].geometry.viewport.getNorthEast().lng() ]
		    				});
		    				
		    			}
		    			
		    			if( options.success )
			    			options.success.apply( this, [addresses]);
		    		} 
		    		else
		    		{
		    			var lat = results[0].geometry.location.lat();
			    		var lon = results[0].geometry.location.lng();
			    		var formatted_address = results[0].formatted_address;
			    		var bounds = [ 	results[0].geometry.viewport.getSouthWest().lat(), 
										results[0].geometry.viewport.getSouthWest().lng(),
										results[0].geometry.viewport.getNorthEast().lat(),
										results[0].geometry.viewport.getNorthEast().lng() ];
			    		
			    		if( options.success )
			    			options.success.apply( this, [lat, lon, formatted_address, bounds]);
		    		}
		    	}
		    }, this));
		},
		
		reverseGeocode: function (lat, lng, options)
		{
			var options = options || {};
		    
			var geocoder = new google.maps.Geocoder();
		    var latLng = new google.maps.LatLng(lat, lng);
		    
		    geocoder.geocode({latLng: latLng}, TRACKS.bind( function( results, status ) {
		    	
		    	if (status == google.maps.GeocoderStatus.OK) {
		    		
		    		var address = results[0].formatted_address;
		    		var bounds = results[0].geometry.viewport;
		    		
		    		if( options.success )
		    			options.success.apply( this, [address, bounds]);
		    	}
		    }, this));
		},
		
		/**
		 * Geolocates user and the using lat/lon makes a revers geocoding to
		 * get his address name. 
		 */
		geolocateUser: function()
		{
			if(navigator.geolocation)
			{
				navigator.geolocation.getCurrentPosition( 
					TRACKS.bind( function( pos ) 
					{
						this.reverseGeocode(
					  		pos.coords.latitude, 
					  		pos.coords.longitude, 
					  		{
					  			success: TRACKS.bind( function( address, googleBounds ) {
					  				
					  				this.geocodeBounds = [ 	googleBounds.getSouthWest().lat(), 
															googleBounds.getSouthWest().lng(),
															googleBounds.getNorthEast().lat(),
															googleBounds.getNorthEast().lng() ];
															
									this.geocodeCenter = [pos.coords.latitude, pos.coords.longitude];
									
									var msg = {
										lat: pos.coords.latitude,
										lon: pos.coords.longitude,
										address: address,
										bounds: this.geocodeBounds
									};

									this.fire('userGeocoded', msg);
									
					  			}, this )
					  		}
					  	);
					}, this), 
					TRACKS.bind( function( error ) {
						this.fire('userNotGeocoded');
					}, this)
				);
			}
		}
		
	});
	
	DataManager.getInstance = function()
	{
		if( dataManager )
			return dataManager;
		
		dataManager = new DataManager();
		return dataManager;
	};
	
	// Publish
	TRACKS.DataManager = DataManager;
	
}(TRACKS));

(function( TRACKS )
{
	/**
	 * Ajax class is used to make XHR requests.
	 * 
	 * @class Ajax
	 * @module core
	 * @version 0.1.0
	 * 
	 * @constructor Ajax
	 */
	var ajaxManager = null;
	var AjaxManager = new Class({
		
		restApiUrl: "http://localhost:1314/",

		getTracks: function( success, error )
		{
			var url = this.geoAdsPlatformUrl + "ads";
			
			jQuery.ajax({
		    	url: url,
		    	type: 'POST',
		    	success: TRACKS.bind(function( data ){
		    		if ( data.GreatSuccess == false )
		    			error.apply( this, [] );
		    		else
		    		{
		    			success.apply( this, [TRACKS.JSON.parse(data)] );
		    		}
		            	
		    	}, this)
		    });
		}

	});
	
	AjaxManager.getInstance = function()
	{
		if( ajaxManager )
			return ajaxManager;
		
		ajaxManager = new AjaxManager();
		return ajaxManager;
	};
	
	// Create & add an instance of ajax to GeoAds namespace
	TRACKS.AjaxManager = AjaxManager;
	
})(TRACKS);


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
        
        getTracksInBounds: function (points, bounds) {
            if (!points || !bounds || points.length == 0) {
                return;
            }
            
            var pointsInBounds = [];
            
            for (var i = 0; i < points.length; i++) {
                if (bounds.contains(points[i].getPosition())) {
                    pointsInBounds.push(points[i].track);
                }
            }
            
            return pointsInBounds;
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


(function( TRACKS )
{
	var View = TRACKS.MsgManager.extend({
		
		app: null,
		mustache: null,
		templates: null,

		init: function( cfg ) {
			
			this.mustache  = TRACKS.mustache;
			
			this.templates = cfg.templates;
			this.container = cfg.container;
			this.renderContainer = cfg.renderContainer;
			this.hideOnStates = cfg.hideOnStates || [];
			this.formatRenderData = cfg.formatRenderData;
			this.dataManager = TRACKS.DataManager.getInstance();
            this.tracksManager = TRACKS.TracksManager.getInstance();
            this.geoOperations = TRACKS.GeoOperations.getInstance();
			this.ajax = TRACKS.AjaxManager.getInstance();
			
			this.events = TRACKS.extend( this.events || {}, cfg.events || {} );
			
			this.parseEvents();
			this.register();
		},
		
		register: function()
		{
		},
		
		render: function()
		{
		},
		
		parseEvents: function()
		{
			var events = this.events || {};
			
			for( var selector in events ) 
				for( var eventType in events[selector] )
				{
					var fn = this[events[selector][eventType]] || events[selector][eventType];
					TRACKS.delegate( this.container, selector, eventType, TRACKS.bind( fn, this));
				}
		},
		
		getDictionary: function()
		{
			return TRACKS.LanguageManager.getInstance().dictionary;
		}
	});
	
	// Publish
	TRACKS.View = View;
	
}(TRACKS));

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
             google.maps.event.addListener(marker, 'click', function () {
                 this.onTrackMarkerClick(marker);
             });

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
                return this.markerCluster.getMarkers();
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
            if (msg.state == TRACKS.App.States.TRACK_INFO) {
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

(function(TRACKS)
{
	var INPUT_SELECTOR = "#search-input";
	
	var SearchView = TRACKS.View.extend({
		
		events: {
			"#search img": {
				click: "onSearchIconClick"
			},
			
			"#search-input": {
				keyup: "onKeyUp"
			},
            
            "#suggestions a": {
				click: "onSuggestionClick"
			}
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
            this.searchRadius = cfg.searchRadius || 100;
            
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
		},
		
		register: function()
		{
			//this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			this.container.innerHTML = this.mustache(this.templates.main, {});
			this.toggleSearchInput();
			return this;
		},
		
		focus: function()
		{
			TRACKS.one(INPUT_SELECTOR, this.container).focus();
		},
		 
		search: function(value)
		{
			this.searchInputText = value || this.getInputValue();
			
			if (!this.searchInputText)
				return;
			
			this.dataManager.geocode( this.searchInputText, true, {
				success: TRACKS.bind( function( addresses ) {
					
					if ( addresses.length == 0 )
						return;
                    
                    var suggestions = [];

                    // Take into consideration first 3 suggestions
                    for (var i = 0; i < 3; i++) {
                        if (addresses[i]) {
                            suggestions.push(addresses[i]);
                        }
                    }

                    this.addSuggestions(suggestions);
					
				}, this)
			})
		},
        
        addSuggestions: function (suggestions) {
            if (!suggestions || suggestions.length == 0) {
                return;
            }
			
            this.suggestions = suggestions;
            var suggestionsContainer = TRACKS.one( "#suggestions", this.container );
            
            suggestionsContainer.innerHTML = this.mustache( this.templates.suggestions, { 
				suggestions: suggestions,
			});
			
            // Make suggestions visible
			TRACKS.css(suggestionsContainer, 'display', 'block');
        },
        
        removeSuggestions: function () {
            var suggestionsContainer = TRACKS.one( "#suggestions", this.container );
            suggestionsContainer.innerHTML = "";
            
            // Hide suggestions
			TRACKS.css(suggestionsContainer, 'display', 'none');
            
            //Clear suggestions
            this.suggestions = [];
        },
		
		setInputValue: function(value)
		{
			TRACKS.one( INPUT_SELECTOR, this.container ).value = value;
		},
		
		getInputValue: function()
		{
				return TRACKS.one( INPUT_SELECTOR, this.container ).value;
		},
        
        toggleSearchInput: function () {
            var isOpen = jQuery("#search input").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                this.removeSuggestions();
                
                // close
                jQuery("#search input").animate({left: "-=258px"}, 200, null);
                jQuery("#search img").animate({left: 0}, 200, null);
            } else {
                // open
                jQuery("#search input").animate({left: 0}, 200, null);
                jQuery("#search img").animate({left: "258px"}, 200, null);
                this.focus();
            }
        },
		
		/*
		 * Events
		 */
		onSearchIconClick: function(evt)
		{
			this.toggleSearchInput();
		},
		
		onKeyUp: function(evt)
		{
            var searchText = this.getInputValue();
            
            if (searchText.length > 2) {
                this.search();
            } else if (searchText.length == 0) {
                this.removeSuggestions();
            }
		},
        
        onSuggestionClick: function (evt) {
            var index = evt.target.id.split('-')[1];
			var suggestion = this.suggestions[index];
			
			this.setInputValue( suggestion.address );
			this.removeSuggestions();
            
            this.sendMessage("changeState", {state: TRACKS.App.States.SEARCH});
            this.sendMessage("searchTracksNearLocation", {
                location: suggestion,
                searchRadius: this.searchRadius
            });
        },
		
		/*
		 * Messages
		 */
		onUserGeocoded: function(msg)
		{
			if ( !msg || !msg.address )
				return;
				
			this.setInputValue( msg.address );
            this.toggleSearchInput();
		}
		
	});
	
	// Publish
	TRACKS.SearchView = SearchView;
	
}(TRACKS));

(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
		events: {
			
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
		},
		
		register: function()
		{
			//this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			this.container.innerHTML = this.mustache(this.templates.main, {});
			
			return this;
		},
		
		/*
		 * Events
		 */
		
		
		/*
		 * Messages
		 */
		
		
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));

(function( TRACKS )
{
	var TracksApp = TRACKS.MsgManager.extend({
		
		views: [],
		state: null,
		lastState: null,
		
		init: function( cfg )
		{
			this._parent();
			
			// Store state & add views
			this.state = cfg.state;
			this.language = cfg.language;
			this.addViews( cfg.views || [] );
			this.appReady = cfg.appReady;
			
			// Register message
			this.register();
			
			TRACKS.DataManager.getInstance().app = this;
		},
		
		addView: function( view )
		{
			//IE8 Fix, Array length is incorrect because of trailing comma
			if (!view)
				return;
			
			view.app = this;
			
			if( this.views.indexOf(view) == -1 )
				this.views.push( view );
		},
		
		addViews: function( views )
		{
			for( var i=0; i< views.length; i++ )
				this.addView( views[i] );
		},
		
		removeView: function( view )
		{
		},
		
		register: function()
		{
			this.onMessage( 'changeState', this.onChangeState );
			this.onMessage( 'reverseState', this.onReverseState );
		},
		
		start: function()
		{
			if( this.language )
			{
				TRACKS.LanguageManager.getInstance().loadLanguage(this.language, TRACKS.bind( function() {
					this._start();
				}, this));
			}
			else
			{
				this._start();	
			}
			
		},
		
		_start: function()
		{
			// Render all views
			for( var i=0; i<this.views.length; i++ )
				this.views[i].render();
			
			// Set default state
			this.changeState( this.state || 'home' );
			
			// dispatch
			if( this.appReady )
				this.appReady.call(this, []);
		},
		
		changeState: function( state, msg )
		{
			//if same state => no good
			if (state == this.state && this.lastState != null)
				return;
				
			this.lastState = this.state;
			this.state = state;
			
			// Render all views
			for( var i=0; i<this.views.length; i++ )
			{
				var view = this.views[i];
				
				if( view.hideOnStates.indexOf( this.state ) != -1 )
					this.hideView( view );
				else
					this.showView( view );
			}
			
			this.sendMessage('stateChanged', {currentState: this.state, lastState: this.lastState});
		},
		
		hideView: function( view )
		{
			TRACKS.addClass( view.container, 'hide-view');
			this.sendMessage('hideView', view.container);
		},
		
		showView: function( view )
		{
			TRACKS.removeClass( view.container, 'hide-view');
			this.sendMessage('showView', view.container);
		},
		
		onChangeState: function( msg )
		{
			this.changeState( msg.state );
		},
		
		onReverseState: function( msg )
		{
			this.changeState( this.lastState );
		}
		
	});	

	
	// Publish
	TRACKS.App = TracksApp;
	
	TRACKS.App.States = {};
    TRACKS.App.States.DEFAULT = 'default';
	TRACKS.App.States.SEARCH = 'search';
	TRACKS.App.States.TRACK_INFO = 'trackinfo';
	
}(TRACKS));

