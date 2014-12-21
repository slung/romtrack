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
		
		geocode: function( address, region, multipleResults, options )
		{
			var options = options || {};
		    
			var geocoder = new google.maps.Geocoder();
		    
		    geocoder.geocode({ address: address, region: region }, TRACKS.bind( function( results, status ) {
		    	
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
                                    
                                    this.geocodedLocation = msg;

                                    this.fire('changeState', {state: TRACKS.App.States.DEFAULT});
									this.fire('userGeocoded', msg);
									
					  			}, this )
					  		}
					  	);
					}, this), 
					TRACKS.bind( function( error ) {
                        this.geocodedLocation = null;
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
        allTracks: [],
        trackCounter: 0,
        expectedNbOfTracks: 0,
        
        // Assume only GPX format tracks
		getTracksFromDataSource: function( success, error )
		{
            this.trackCounter = 0;
            this.expectedNbOfTracks = 0;
            this.tracks = [];
            
			jQuery.ajax({
		    	url: this.tracksRegistrar,
		    	type: 'GET',
                crossDomain: true,
		    	success: TRACKS.bind(function(data){
		    		var parsedData = TRACKS.JSON.parse(data);
                    this.expectedNbOfTracks = parsedData.length;
                    
                    for (var i = 0; i < parsedData.length; i++) {
                        this.extractTrackData(parsedData[i], i);
                    }
		    	}, this)
		    });
		},
        
        getTrackByIndex: function (index) {
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].index == index) {
                    return this.tracks[i];
                }
            }
            
            return null;
        },
        
        extractTrackData: function (parsedData, trackIndex) {
            jQuery.ajax({
                url: parsedData.url,
                type: 'GET',
                dataType: "xml",
                crossDomain: true,
                success: TRACKS.bind(function(gpxData){
                    var trackData = this.trackPointsFromGPX(gpxData);
                    this.saveTrack(parsedData.name, parsedData.url, parsedData.article, parsedData.preview, trackData.trackPoints, trackData.elevationPoints, trackIndex);
                    this.trackCounter++;

                    if (this.trackCounter == this.expectedNbOfTracks) {
                        TRACKS.dispatcher.fire("tracksInitiated", this.tracks);
                    }
                }, this)
            });
        },
        
        saveTrack: function(name, url, article, preview, trackPoints, elevationPoints, trackIndex) {
            var track = new TRACKS.Track(name, url, article, preview,  trackPoints, elevationPoints, trackIndex);
            this.tracks.push(track);
            this.allTracks.push(track);
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
                if (ep != "0") {
                    elevationPoints.push(parseInt(ep));
                }
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
        
        getTracksWithinLocationBounds: function (points, location, radius) {
            var center = null,
                centerBounds = null,
                searchBounds = null,
                pointsInBounds = [],
                ne = null,
                se = null,
                sw = null;
            
            if (!points || !location || points.length == 0) {
                return;
            }
            
            // Establish search location bounds
            center = new google.maps.LatLng(location.lat, location.lon);
            centerBounds = new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3]));
            
            //Establish search area bounds
            ne = this.getPointAtDistanceFromPoint(center, 45, radius);
            se = this.getPointAtDistanceFromPoint(center, 135, radius);
            sw = this.getPointAtDistanceFromPoint(center, 245, radius);
            
            searchBounds = new google.maps.LatLngBounds(sw, ne);
            searchBounds.extend(se);
            
            for (var i = 0; i < points.length; i++) {
                if (searchBounds.contains(points[i].points[0]) || searchBounds.contains(points[i].points[points[i].points.length - 1])) {
                    pointsInBounds.push(points[i]);
                }
            }
            
            return pointsInBounds;
        },
        
        getTracksBounds: function (tracks) {
            var tracksBounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < tracks.length; i++) {
                tracksBounds.union(tracks[i].bounds);
            }
            
            return tracksBounds;
        },
        
        getTracksStartPointBounds: function (tracks) {
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < tracks.length; i++) {
                bounds.extend(tracks[i].getStartTrackPoint());
            }
            
            return bounds;
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
			this._parent(cfg);
			
            this.searchRadius = cfg.searchRadius || 100;
            this.countryCode = cfg.countryCode;
            
            this.sendAnalytics = cfg.sendAnalytics;
            
            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
            
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
            this.dataManager.on('userNotGeocoded', TRACKS.bind( this.onUserNotGeocoded, this));
		},
		
		register: function()
		{
            this.onMessage("openSearch", this.onOpenSearch);
            this.onMessage("closeSearch", this.onCloseSearch);
            this.onMessage("emptySearch", this.onEmptySearch);
            this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			this.container.innerHTML = this.mustache(this.templates.main, {});
			this.toggle();
			return this;
		},
		
		focus: function()
		{
			TRACKS.one(INPUT_SELECTOR, this.container).focus();
		},
		 
		searchLocationData: function(value)
		{
			this.searchInputText = value || this.getInputValue();
			
			if (!this.searchInputText) {
                return;
            }
			
            this.dataManager.geocode( this.searchInputText, this.countryCode, true, {
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
        
        search: function (location) {
            this.sendMessage("changeState", {state: TRACKS.App.States.SEARCH});
            
            // Get tracks near location
            var tracksInBounds = this.geoOperations.getTracksWithinLocationBounds(this.tracksManager.allTracks, location, this.searchRadius);
            
            if (tracksInBounds && tracksInBounds.length > 0) {
                this.tracksManager.tracks = tracksInBounds;
                this.sendMessage("setCenterMarker", location);
                this.sendMessage("showTracks", tracksInBounds);
            } else {
                this.sendMessage("setCenter", location);
                this.sendMessage("noTracksToShow");
                this.sendMessage("fitMapToBounds", new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3])));
            }
            
            // Send to analytics
            this.sendAnalytics("Tracks near - " + location.address, tracksInBounds.length);
        },
        
        addSuggestions: function (suggestions) {
            if (!suggestions || suggestions.length == 0) {
                return;
            }
			
            // Close list before showing suggestions
            this.sendMessage("closeList");
            
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
		
		setInputValue: function (value)
		{
			TRACKS.one( INPUT_SELECTOR, this.container ).value = value;
		},
		
		getInputValue: function()
		{
				return TRACKS.one( INPUT_SELECTOR, this.container ).value;
		},
        
        isOpen: function () {
            return jQuery("#search input").css("left") == "0px" ? true : false;
        },
        
        toggle: function () {
            if (this.isOpen()) {
                // close
                this.close();
            } else {
                // open
                this.open();
                this.focus();
            }
        },
        
        open: function () {
            if (this.isOpen()) {
                return;
            }
            
            jQuery("#search input").animate({left: 0}, 200, null);
            jQuery("#search img").animate({left: "290px"}, 200, null);
            
            // Send to analytics
            this.sendAnalytics("Open Input", "Open Input");
        },
        
        close: function () {
            if (!this.isOpen()) {
                return;
            }
            
            this.removeSuggestions();
            
            jQuery("#search input").animate({left: "-=290px"}, 200, null);
            jQuery("#search img").animate({left: 0}, 200, null);
            
            // Send to analytics
            this.sendAnalytics("Close Input", "Close Input");
        },
		
		/*
		 * Events
		 */
		onSearchIconClick: function(evt)
		{
			this.toggle();
		},
		
		onKeyUp: function(evt)
		{
            var searchText = this.getInputValue();
            
            if (searchText.length > 2) {
                this.searchLocationData();
            }
		},
        
        onSuggestionClick: function (evt) {
            var index = evt.target.id.split('-')[1];
			var suggestion = this.suggestions[index];
			
            this.dataManager.geocodedLocation = suggestion;
            
			this.setInputValue( suggestion.address );
			this.removeSuggestions();
            this.search(suggestion);
            
            this.sendMessage("setCenterMarker", suggestion);
            this.sendMessage("changeState", {state: TRACKS.App.States.SEARCH});
        },
		
		/*
		 * Messages
		 */
		onUserGeocoded: function(location)
		{
			if ( !location || !location.address )
				return;
				
			this.setInputValue(location.address);
            this.search(location);
            this.open();
		},
        
        onUserNotGeocoded: function()
        {
            this.removeSuggestions();
            this.sendMessage("showTracks", this.tracksManager.allTracks);
            this.sendMessage("changeState", {state: TRACKS.App.States.DEFAULT});
        },
        
        onOpenSearch: function () {
            this.open();
            this.focus();
            this.setInputValue("");
        },
        
        onCloseSearch: function () {
            this.close();
        },
        
        onStateChanged: function (msg) {
            if (msg.currentState === TRACKS.App.States.TRACK_INFO) {
                this.close();
            }
        },
        
        onEmptySearch: function () {
            this.setInputValue("");
        }
	});
	
	// Publish
	TRACKS.SearchView = SearchView;
	
}(TRACKS));

(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
        selectedTrackIndex: -1,
        
		events: {
			"#list #list-toggle": {
				click: "onListToggleClick"
			},
            "#list #article": {
                click: "onLinksClick"
            },
            "#list #download": {
                click: "onLinksClick"
            },
            "#list .track": {
                click: "onTrackClick",
				hover: "onTrackHover"
			},
            "#list #search": {
                click: "onOpenSearch"
            },
            "#list #all-tracks": {
                click: "onShowAllTracks"
            }
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
            this.noTracksMsg = cfg.noTracksMsg ? cfg.noTracksMsg : "No tracks found!"
            this.onReady = cfg.onReady;
            this.sendAnalytics = cfg.sendAnalytics;
            
            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
            if (this.onReady) {
                TRACKS.bind(this.onReady, this);
            }
		},
		
		register: function()
		{
			this.onMessage("showTracks", this.onShowTracks);
            this.onMessage("noTracksToShow", this.onNoTracksToShow);
            this.onMessage("closeList", this.onCloseList);
            this.onMessage("selectTrackInList", this.onSelectTrack);
            this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
            if (!this.tracks || this.tracks.length == 0) {
                this.container.innerHTML = this.mustache(this.templates.empty, {
                    message: this.noTracksMsg
                });
            } else {
                this.container.innerHTML = this.mustache(this.templates.main, {
                    tracks: this.tracks,
                    nbTracks: this.tracks.length
                });
            }
            
            if (this.onReady) {
                this.onReady();
            }
            
			return this;
		},
        
        toggleList: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },
        
        toggleTrackDetails: function (index) {
            if (index === -1) {
                return;
            }
            
            // Expand/contract preview image
            if (jQuery("#list #trackitem-" + index + " #track-parameters").css("display") === "none") {
                jQuery("#list #trackitem-" + index + " #preview").css("width", "90px");
                jQuery("#list #trackitem-" + index + " #preview").css("height", "auto");
            } else {
                jQuery("#list #trackitem-" + index + " #preview").css("width", "60px");
                jQuery("#list #trackitem-" + index + " #preview").css("height", "30px");
            }
            
            jQuery("#list #trackitem-" + index + " #track-parameters").toggle("fast");
        },
        
        open: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (!isOpen) {
                jQuery("#list").animate({left: 0}, 200, null);
                
                // Send to analytics
                this.sendAnalytics("Open list", "Open list");
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-=330px"}, 200, null);
                
                // Send to analytics
                this.sendAnalytics("Close list", "Close list");
            }
        },
        
        selectTrack: function (index) {
            if (index !== this.selectedTrackIndex) {
            
                // Deselect previous track first
                this.toggleTrackDetails(this.selectedTrackIndex);

                // Show track details
                this.toggleTrackDetails(index);

                // Save track index
                this.selectedTrackIndex = index;
                
                // Scroll to track
                jQuery("#list #tracks").mCustomScrollbar("scrollTo", "#trackitem-" + index, {scrollInertia: 3000});
                
                var track = this.tracksManager.getTrackByIndex(index);
                
                // Send to analytics
                this.sendAnalytics("Track Selected", "Name: " + track.name + " | URL: " + track.url);
            } else {
                // Deselect track
                this.toggleTrackDetails(index);
                
                // Reset selected track index
                this.selectedTrackIndex = -1;
            }
        },
		
		/*
		 * Events
		 */
        onListToggleClick: function () {
            this.toggleList();
        },
        
        onTrackClick: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]),
                track = this.tracksManager.getTrackByIndex(index);
            
            this.selectTrack(index);
            
            this.sendMessage("selectTrackOnMap", track);
        },
        
        onTrackHover: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]),
                track = this.tracksManager.getTrackByIndex(index);
            
            if (this.app.views[1].map.getZoom() < 9) {
                this.sendMessage("showTrackTooltip", track);
            }
        },
		
		/*
		 * Messages
		 */
		onShowTracks: function (tracks) {
            if (!tracks || tracks.length === 0) {
                return;
            }
            
            // Save tracks
            this.tracks = tracks;
            
            this.render();
            this.open();
        },
        
        onNoTracksToShow: function () {
            this.tracks = [];
            
            this.render();
            this.open();
        },
        
        onSelectTrack: function (track) {
            if (!track) {
                return;
            }
            
            this.selectTrack(track.index);
        },
        
        onCloseList: function () {
            this.close();
        },
        
        onLinksClick: function (evt) {
            evt.stopPropagation();
        },
        
        onStateChanged: function (msg) {
            if (msg.currentState === TRACKS.App.States.TRACK_INFO) {
                this.close();
            }
        },
        
        onOpenSearch: function () {
            this.sendMessage("openSearch");
            this.close();
        },
        
        onShowAllTracks: function () {
            this.tracksManager.tracks = this.tracksManager.allTracks;
            this.sendMessage("changeState", {state: TRACKS.App.States.DEFAULT});
            this.sendMessage("emptySearch");
            this.sendMessage("showTracks", this.tracksManager.allTracks);
            
            // Send to analytics
            this.sendAnalytics("Show all tracks", "Show all tracks");
        }
		
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));

(function(TRACKS)
{
	var ElevationProfileView = TRACKS.View.extend({
		
		events: {
			"#elvation-profile-toggle": {
				click: "onElevationProfileClick"
			}
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
            
            this.xAxisName = cfg.xAxisName ? cfg.xAxisName : 'Distance (km)';
            this.yAxisName = cfg.yAxisName ? cfg.yAxisName : 'Altitude (m)';
		},
		
		register: function()
		{
			this.onMessage("showElevationProfile", this.onShowElevationProfile);
		},
		
		render: function(track)
		{
            if (!track || !track.hasElevationProfile()) {
                return;
            }
            
            var elevationData = this.generateElevationProfileData(track);

            var options = {
                width: 700,
                height: 170,
                hAxis: {title: this.xAxisName,  titleTextStyle: {color: '#333'}},
                vAxis: {title: this.yAxisName, minValue: 0, titleTextStyle: {color: '#333'}},
                legend: 'none'
            };

            this.elevationProfileChart = new google.visualization.AreaChart(this.renderContainer);
            this.elevationProfileChart.draw(elevationData, options);
            
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseover', TRACKS.bind(this.onElevationProfileOver, this));
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseout', TRACKS.bind(this.onElevationProfileOut, this));
            
            this.open();
		},
        
        generateElevationProfileData: function (track) {
            var elevationProfileData = new google.visualization.DataTable();
            
            //Push header
            elevationProfileData.addColumn('number', this.xAxisName);
            elevationProfileData.addColumn('number', this.yAxisName);
            
            for (var i = 0; i < track.elevationPoints.length; i++) {
                elevationProfileData.addRow([track.getDistanceFromStart(i), parseInt(track.elevationPoints[i])]);
            }
            
            return elevationProfileData;
        },
        
        toggle: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (isOpen) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },
        
        open: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (!isOpen) {
                this.sendMessage("panBy", {x: 0, y: 100});
                jQuery("#elevation-profile").animate({bottom: 0}, 200, null);
            }
        },
        
        close: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (isOpen) {
                this.sendMessage("panBy", {x: 0, y: -100});
                jQuery("#elevation-profile").animate({bottom: "-=170px"}, 200, null);
            }
        },
		
		/*
		 * Events
		 */
		onElevationProfileClick: function () {
            if (!this.track || !this.track.hasElevationProfile()) {
                return;
            }
            
            this.toggle();
        },
        
        onElevationProfileOver: function (data) {
            this.sendMessage("showElevationMarker", {
                icon: "assets/images/marker-small.png",
                position: {
                    lat: this.track.points[data.row].lat(),
                    lon: this.track.points[data.row].lng()
                }
            });
        },
        
        onElevationProfileOut: function () {
            this.sendMessage("hideElevationMarker");
        },
		
		/*
		 * Messages
		 */
		onShowElevationProfile: function (track) {
            if (!track) {
                return;
            }
            
            this.track = track;
            
            this.render(track);
        }
		
	});
	
	// Publish
	TRACKS.ElevationProfileView = ElevationProfileView;
	
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

