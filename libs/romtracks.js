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

(function( TRACKS )
 {
    // Singleton instance
    var languageManager = null;

    var LanguageManager = TRACKS.EventManager.extend({

        dir: "languages",
        extension: ".js",

        init: function( cfg ) 
        {
            if( languageManager )
                throw new Error('You can only create one instance of LanguageManager!');

            this._parent();
        },

        loadLanguage: function( language, success )
        {
            var url = this.dir + "/" + language + this.extension;

            JSONP.get( url, {}, TRACKS.bind( function( data ) {

                this.dictionary = data;

                if( success )
                    success.call(this, [data]);

            }, this));

            return;
        }
    });


    LanguageManager.getInstance = function()
    {
        if( languageManager )
            return languageManager;

        languageManager = new LanguageManager();
        return languageManager;
    };
    // Publish
    TRACKS.LanguageManager = LanguageManager;

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

    var DataManager = TRACKS.EventManager.extend({

        tableName: '',
        poiFilterActive: true,
        trackFilterActive: true,
        privateMode: false,
        rowCount: 20,
        cluster: null,
        googleApiKey: "AIzaSyBR8BAjYqkuL8i1Qzu1SJvaZYuL932NCAg",
        fusionTableId: "1cr4YhI1ZpenusSDOGh20HH0RSbHFT7G5LDH-r94O",
        pois: [],
        tracks: [],

        // stores loaded tables
        tables: [],

        init: function( cfg ) 
        {
            if (dataManager) {
                throw new Error('You can only create one instance of DataManager!');
            }

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

                    if (options.success) {
                        options.success.apply( this, [address, bounds]);
                    }
                }
            }, this));
        },

        /**
		 * Geolocates user and the using lat/lon makes a revers geocoding to
		 * get his address name. 
		 */
        geolocateUser: function()
        {
            if (navigator.geolocation) {
                TRACKS.mask(TRACKS.MASK_ELEMENT);

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

                                    TRACKS.unmask(TRACKS.MASK_ELEMENT);
                                    this.fire('changeState', {state: TRACKS.App.States.DEFAULT});
                                    this.fire('userGeocoded', msg);

                                }, this )
                            }
                        );
                    }, this), 
                    TRACKS.bind( function( error ) {
                        this.geocodedLocation = null;
                        TRACKS.unmask(TRACKS.MASK_ELEMENT);
                        this.fire('userNotGeocoded');
                    }, this)
                );
            }
        },

        search: function (location, searchRadius) {
            var dataInBounds = null;

            this.location = location ? location : this.location;
            this.searchRadius = searchRadius ? searchRadius : this.searchRadius;

            if (!this.location) {
                if (this.poiFilterActive && this.trackFilterActive) {
                    return this.pois.concat(this.tracks);
                } else if (this.trackFilterActive) {
                    return this.tracks;
                } else if (this.poiFilterActive) {
                    return this.pois;
                }
            } else {
                if (this.poiFilterActive && this.trackFilterActive) {
                    dataInBounds = TRACKS.GeoOperations.getInstance().getDataInBounds(this.tracks, this.location, this.searchRadius);
                    dataInBounds = dataInBounds.concat(TRACKS.GeoOperations.getInstance().getDataInBounds(this.pois, this.location, this.searchRadius));

                    return dataInBounds;
                } else if (this.trackFilterActive) {
                    dataInBounds = TRACKS.GeoOperations.getInstance().getDataInBounds(this.tracks, this.location, this.searchRadius);

                    return dataInBounds;
                } else if (this.poiFilterActive) {
                    dataInBounds = TRACKS.GeoOperations.getInstance().getDataInBounds(this.pois, this.location, this.searchRadius);

                    return dataInBounds;
                }
            }

            return null;
        },

        getDataFromDataSource: function () {
            if (this.poiFilterActive && this.trackFilterActive) {
                this.getPoisFromDataSource();
                this.getTracksFromDataSource();
            } else if (this.trackFilterActive) {
                this.getTracksFromDataSource();
            } else if (this.poiFilterActive) {
                this.getPoisFromDataSource();
            }
        },

        getPoisFromDataSource: function () {
            var url = "https://www.googleapis.com/fusiontables/v2/query";
            
            this.pois = [];

            // Add API authorization key
            url += "?key=" + this.googleApiKey;
            
            // Add SQL statement
            url += "&sql=" + this.buildSelectStatement();
            url += this.buildWhereClause([{
                column: "type",
                operator: "=",
                value: "'poi'",
                connective: "AND"
            }, {
                column: "private",
                operator: (this.privateMode === true) ? "=" : "NOT EQUAL TO",
                value: "'true'"
            }]);
            
            jQuery.ajax({
                url: url,
                type: 'GET',
                crossDomain: true,
                success: TRACKS.bind(function(data){
                    var rows = data.rows;
                    
                    if (!rows || rows.length === 0) {
                        TRACKS.dispatcher.fire("poisLoaded");
                        return;
                    }
                    
                    // Loop through POIs and save them
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        var poiName = (this.app.language == "en") ? row[2] : row[1];
                        var poiArticle = (this.app.language == "en") ? row[4] : row[3];
                        var poi = new TRACKS.POI(row[0], poiName, row[8], row[9], poiArticle, row[5]);
                        this.pois.push(poi);

                        if (i === rows.length-1) {
                            TRACKS.dispatcher.fire("poisLoaded");
                        }
                    }
                }, this)
            });
        },

        // Assume only GPX format tracks
        getTracksFromDataSource: function (success, error) {
            var url = "https://www.googleapis.com/fusiontables/v2/query";

            this.tracks = [];

            // Add API authorization key
            url += "?key=" + this.googleApiKey;

            // Add SQL statement
            url += "&sql=" + this.buildSelectStatement();
            url += this.buildWhereClause([{
                column: "type",
                operator: "=",
                value: "'track'",
                connective: "AND"
            }, {
                column: "private",
                operator: (this.privateMode === true) ? "=" : "NOT EQUAL TO",
                value: "'true'"
            }]);
            
            jQuery.ajax({
                url: url,
                type: 'GET',
                crossDomain: true,
                success: TRACKS.bind(function(data){
                    var rows = data.rows;

                    if (!rows || rows.length === 0) {
                        TRACKS.dispatcher.fire("tracksLoaded");
                        return;
                    }
                    
                    this.expectedNbOfTracks = data.rows.length;
                    
                    for (var i = 0; i < rows.length; i++) {
                        this.extractTrackData(rows[i]);
                    }
                }, this)
            });
        },

        getDataById: function (id) {
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].id === id) {
                    return this.tracks[i];
                }
            }

            for (var i = 0; i < this.pois.length; i++) {
                if (this.pois[i].id === id) {
                    return this.pois[i];
                }
            }

            return null;
        },

        extractTrackData: function (trackInfo) {
            jQuery.ajax({
                url: trackInfo[7],
                type: 'GET',
                dataType: "xml",
                crossDomain: true,
                success: TRACKS.bind(function(gpxData){
                    var trackData = this.trackPointsFromGPX(gpxData);
                    var trackName = (this.app.language == "en") ? trackInfo[2] : trackInfo[1];
                    var trackArticle = (this.app.language == "en") ? trackInfo[4] : trackInfo[3];
                    this.saveTrack(trackInfo[0], trackName, trackInfo[7], trackArticle, trackInfo[5], trackData.trackPoints, trackData.elevationPoints);
                }, this)
            });
        },

        saveTrack: function(id, name, url, article, preview, trackPoints, elevationPoints) {
            var track = new TRACKS.Track(id, name, url, article, preview, trackPoints, elevationPoints);
            this.tracks.push(track);

            if (this.tracks.length === this.expectedNbOfTracks) {
                TRACKS.dispatcher.fire("tracksLoaded");
            }
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
        },
        
        buildSelectStatement: function () {
            return "SELECT * FROM "  + this.fusionTableId;
        },
        
        /*
         * Options is an object array an deach object has the following properties: column, operator, value, connective
         */
        buildWhereClause: function (options) {
            var i = 0,
                connective = null,
                whereClause = " WHERE ";
            
            if (!options || options.length === 0) {
                return;
            }
            
            // Parse all object keys and add key-value pair to where clause
            for (i = 0; i < options.length; i++) {
                connective = options[i].connective ? " " + options[i].connective + " " : "";
                whereClause += options[i].column + " " + options[i].operator + " " + options[i].value + connective;
            }
            
            return whereClause;
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
    var Track = function (id, name, url, article, preview, points, elevationPoints, color, startMarkerUrl, endMarkerUrl) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.article = article;
        this.preview = preview;
        this.points = points;
        this.elevationPoints = elevationPoints || [];
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

(function( TRACKS )
 {
    var POI = function (id, name, latitude, longitude, article, preview, index, markerUrl) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.point = new google.maps.LatLng(latitude, longitude);
        this.article = article;
        this.preview = preview;
        this.index = index;
        this.startMarkerUrl = markerUrl || "assets/images/poi-marker.png";
    };

    POI.prototype = {
    };

    TRACKS.POI = POI;

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
        
        getDataInBounds: function (data, location, radius) {
            var center = null,
                centerBounds = null,
                searchBounds = null,
                pointsInBounds = [],
                ne = null,
                se = null,
                sw = null,
                radius = radius ? radius : 0;

            if (!data || !location || data.length == 0) {
                return;
            }

            TRACKS.mask(TRACKS.MASK_ELEMENT);

            // Establish search location bounds
            center = new google.maps.LatLng(location.lat, location.lon);
            centerBounds = new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3]));

            //Establish search area bounds
            ne = this.getPointAtDistanceFromPoint(center, 45, radius);
            se = this.getPointAtDistanceFromPoint(center, 135, radius);
            sw = this.getPointAtDistanceFromPoint(center, 245, radius);

            searchBounds = new google.maps.LatLngBounds(sw, ne);
            searchBounds.extend(se);
            
            for (var i = 0; i < data.length; i++) {
                if (data[i] instanceof TRACKS.Track) {
                    if (searchBounds.contains(data[i].points[0]) || searchBounds.contains(data[i].points[data[i].points.length - 1])) {
                        pointsInBounds.push(data[i]);
                    }
                } else {
                    if (searchBounds.contains(data[i].point)) {
                        pointsInBounds.push(data[i]);
                    }
                }
            }

            TRACKS.unmask(TRACKS.MASK_ELEMENT);

            return pointsInBounds;
        },
        
        getDataBounds: function (data) {
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0; i < data.length; i++) {
                if (data[i] instanceof TRACKS.Track) {
                    bounds.extend(data[i].getStartTrackPoint());
                } else {
                    bounds.extend(data[i].point);
                }
            }
            
            return bounds;
        } 

	});
	
	GeoOperations.getInstance = function () {
		if (geoOperations) {
			return geoOperations;
        }
		
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
			
			this.startZoom = cfg.startZoom || 7;
            this.startLocation = cfg.startLocation || {
                lat: 46.08371401022221,
                lon: 23.73289867187499
            };
            
            // External functions
            this.sendAnalytics = cfg.sendAnalytics;
            this.mapReady = cfg.mapReady;

            // External function context binders
            if (this.mapReady) {
                TRACKS.bind(this.mapReady, this);
            }
            
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
            this.onMessage("showTrailsLayer", this.onShowTrailsLayer);
            this.onMessage("hideTrailsLayer", this.onHideTrailsLayer);
		},
		
		render: function()
		{
            // Create trails map type
            var trailsTypeOptions = {
                getTileUrl: TRACKS.bind(function(coord, zoom) {
                    if (zoom > 16 || zoom < 3) {
                        return null;
                    }
                    
                    var bound = Math.pow(2, zoom);
                    
                    return 'http://tile.waymarkedtrails.org/hiking/' + zoom + '/' + coord.x + '/' + coord.y + '.png';
                }, this),
                tileSize: new google.maps.Size(256, 256),
                maxZoom: 16,
                minZoom: 3,
                radius: 1738000,
                name: 'Trails',
                isPng: true
            };
            
            this.trailsMapType = new google.maps.ImageMapType(trailsTypeOptions);
            
			var mapOptions = {
				zoom: this.startZoom,
                minZoom: 3,
                maxZoom: 16,
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
            this.map.overlayMapTypes.push(this.trailsMapType);
			
			//Add MapReady listener
			var listener = google.maps.event.addListener( this.map, 'tilesloaded', TRACKS.bind(function(evt) {
				
                this.dataManager.getDataFromDataSource();
				this.sendMessage("mapReady");
                
                if (this.mapReady) {
                    this.mapReady.call( this, []);
                }
				
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
                if (this.app.state == TRACKS.App.States.INFO || this.app.state == TRACKS.App.States.SHARE) {
                    return;
                }

                this.onMarkerOver(marker);
            }, this));

            google.maps.event.addListener(marker, 'mouseout', TRACKS.bind(function (evt) {
                if (this.app.state == TRACKS.App.States.INFO || this.app.state == TRACKS.App.States.SHARE) {
                    return;
                }

                this.removeTooltip();
            }, this));
        },
        
        selectDataItem: function (data) {
            if (!data) {
                return;
            }
            
            this.deselectData(this.lastData);
            
            if (this.lastData && this.lastData.id == data.id) {
                if (this.app.state === TRACKS.App.States.SHARE && this.tooltip) {
                    this.removeTooltip();
                    this.lastData = null;
                    return;
                } else if (this.app.state !== TRACKS.App.States.SHARE) {
                    this.removeTooltip();
                    this.lastData = null;
                    return;
                }
            }
            
            TRACKS.setUrlHash(data.id);
            TRACKS.mask(TRACKS.MASK_ELEMENT);
            
            // Save data
            this.lastData = data;
            
            if (this.app.state === TRACKS.App.States.SHARE) {
                this.addData([data]);
            }
            
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
            
            if (this.app.state !== TRACKS.App.States.SHARE) {
                this.sendMessage("changeState", {state: TRACKS.App.States.INFO});
            }
            
            TRACKS.unmask(TRACKS.MASK_ELEMENT);
        },
        
        deselectData: function (data) {
            if (!data) {
                return;
            }
            
            TRACKS.setUrlHash("");
            
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
                    fullDetails: fullDetails,
                    language: this.getDictionary()
                });
                
                offset = fullDetails ? new google.maps.Size(-136, -145) : new google.maps.Size(-136, -125);
            } else {
                content = this.mustache(this.templates.poiTooltipTemplate, {
                    data: marker.data,
                    fullDetails: fullDetails,
                    language: this.getDictionary()
                });
                
                offset = new google.maps.Size(-136, -120);
            }
            
            this.tooltip = new InfoBox({
                content: content, 
                closeBoxURL: closeBoxURL,
                closeBoxMargin: "5px 5px 0px 0px",
                pixelOffset: offset
            });
            
            google.maps.event.addListener(this.tooltip, "closeclick", TRACKS.bind(function () {
                this.tooltip = null;
            }, this));

            this.tooltip.open(this.map, marker);
        },
        
        removeTooltip: function () {
            if (this.tooltip) {
                this.tooltip.close();
                this.tooltip = null;
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
        
        onShowTrailsLayer: function () {
            this.map.overlayMapTypes.push(this.trailsMapType);
        },
        
        onHideTrailsLayer: function () {
            this.map.overlayMapTypes.pop(); 
        },
		
		/*
		 * Events
		 */
         onMarkerClick: function (marker) {
             if (this.app.state === TRACKS.App.States.SHARE) {
                 if (this.tooltip) {
                     this.removeTooltip();
                 } else {
                    this.showTooltip(marker.data.startMarker, true);
                 }
             } else {
                 this.selectDataItem(marker.data);
                 this.sendMessage("selectDataItemInList", marker.data);
             }
             
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
			this.container.innerHTML = this.mustache(this.templates.main, {
                language: this.getDictionary()
            });
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
            var data = this.dataManager.search(location, this.searchRadius);
            
            if (data && data.length > 0) {
                this.sendMessage("setCenterMarker", location);
            } else {
                this.sendMessage("setCenter", location);
                this.sendMessage("fitMapToBounds", new google.maps.LatLngBounds(new google.maps.LatLng(location.bounds[0], location.bounds[1]), new google.maps.LatLng(location.bounds[2], location.bounds[3])));
            }
            
            this.sendMessage("showData", data);
            
            // Send to analytics
            if (this.dataManager.poiFilterActive && this.dataManager.trackFilterActiveFilterActive) {
                this.sendAnalytics("POIs & Tracks near - " + location.address, tracksInBounds.length);
            } else if (this.dataManager.poiFilterActive) {
                this.sendAnalytics("POIs near - " + location.address, data.length);
            } else if (this.dataManager.trackFilterActiveFilterActive) {
                this.sendAnalytics("Tracks near - " + location.address, data.length);
            }
        },
        
        addSuggestions: function (suggestions) {
            if (!suggestions || suggestions.length == 0) {
                return;
            }
			
            // Close list & filters before showing suggestions
            this.sendMessage("closeList");
            this.sendMessage("closeFilters");
            
            this.suggestions = suggestions;
            var suggestionsContainer = TRACKS.one( "#suggestions", this.container );
            
            suggestionsContainer.innerHTML = this.mustache( this.templates.suggestions, { 
				suggestions: suggestions,
                language: this.getDictionary()
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
        },
        
        close: function () {
            if (!this.isOpen()) {
                return;
            }
            
            this.removeSuggestions();
            
            jQuery("#search input").animate({left: "-=290px"}, 200, null);
            jQuery("#search img").animate({left: 0}, 200, null);
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
            var data = this.dataManager.search();
            
            this.removeSuggestions();
            
            this.sendMessage("showData", data);
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
            if (msg.currentState === TRACKS.App.States.INFO) {
                this.close();
            }
        },
        
        onEmptySearch: function () {
            this.setInputValue("");
            this.dataManager.location = null;
        }
	});
	
	// Publish
	TRACKS.SearchView = SearchView;
	
}(TRACKS));

(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
        selectedDataId: -1,
        
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
            "#list .data": {
                click: "onDataItemClick",
				hover: "onDataItemHover"
			},
            "#list #search": {
                click: "onOpenSearch"
            },
            "#list #all-data": {
                click: "onShowAllData"
            }
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
            this.noTracksMsg = cfg.noTracksMsg ? cfg.noTracksMsg : "No data found!"
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
			this.onMessage("showData", this.onShowData);
            this.onMessage("closeList", this.onCloseList);
            this.onMessage("selectDataItemInList", this.onSelectDataItem);
            this.onMessage("stateChanged", this.onStateChanged);
            this.onMessage("emptySearch", this.onEmptySearch);
		},
		
		render: function()
		{
            if (!this.data || this.data.length == 0) {
                this.container.innerHTML = this.mustache(this.templates.empty, {
                    language: this.getDictionary()
                });
            } else {
                this.container.innerHTML = this.mustache(this.templates.main, {
                    data: this.data,
                    language: this.getDictionary()
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
        
        toggleDataDetails: function (id) {
            if (id === -1) {
                return;
            }
            
            // Expand/contract preview image
            if (jQuery("#list #" + id + " #data-parameters").css("display") === "none") {
                jQuery("#list #" + id + " #preview").css("width", "80px");
                jQuery("#list #" + id + " #preview").css("height", "auto");
            } else {
                jQuery("#list #" + id + " #preview").css("width", "60px");
                jQuery("#list #" + id + " #preview").css("height", "30px");
            }
            
            jQuery("#list #" + id + " #data-parameters").toggle("fast");
        },
        
        open: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (!isOpen) {
                jQuery("#list").animate({left: 0}, 200, null);
                
                if (this.app.state === TRACKS.App.States.INFO){
                    this.sendMessage("panBy", {x: -150, y: 0});
                }
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-330px"}, 200, null);
                
                if (this.app.state === TRACKS.App.States.INFO){
                    this.sendMessage("panBy", {x: 150, y: 0});
                }
            }
        },
        
        selectDataItem: function (id) {
            if (id !== this.selectedDataId) {
            
                TRACKS.setUrlHash(id);
                
                // Deselect previous track first
                this.toggleDataDetails(this.selectedDataId);

                // Show track details
                this.toggleDataDetails(id);

                // Save track id
                this.selectedDataId = id;
                
                // Scroll to track
                jQuery("#list #data").mCustomScrollbar("scrollTo", "#" + id);
                
                var track = this.dataManager.getDataById(id);
                
                // Send to analytics
                this.sendAnalytics("Track Selected", "Name: " + track.name + " | URL: " + track.url);
            } else {
                TRACKS.setUrlHash("");
                
                // Deselect track
                this.toggleDataDetails(id);
                
                // Reset selected track id
                this.selectedDataId = -1;
            }
        },
		
		/*
		 * Events
		 */
        onListToggleClick: function () {
            this.toggleList();
        },
        
        onDataItemClick: function (evt) {
            var id = evt.currentTarget.id,
                track = this.dataManager.getDataById(id);
            
            this.selectDataItem(id);
            
            this.sendMessage("selectDataItemOnMap", track);
        },
        
        onDataItemHover: function (evt) {
            var id = evt.currentTarget.id,
                dataItem = this.dataManager.getDataById(id);
            
            if (this.app.views[1].map.getZoom() < 9) {
                this.sendMessage("showDataItemTooltip", dataItem);
            }
        },
		
		/*
		 * Messages
		 */
		onShowData: function (data) {
            // Save tracks
            this.data = data;
            
            this.render();
            this.open();
        },
        
        onSelectDataItem: function (track) {
            if (!track) {
                return;
            }
            
            this.selectDataItem(track.id);
        },
        
        onCloseList: function () {
            this.close();
        },
        
        onLinksClick: function (evt) {
            evt.stopPropagation();
        },
        
        onStateChanged: function (msg) {
            if (msg.currentState === TRACKS.App.States.INFO) {
                this.sendMessage("panBy", {x: -150, y: 0});
            }
        },
        
        onOpenSearch: function () {
            this.sendMessage("openSearch");
            this.close();
        },
        
        onEmptySearch: function () {
            TRACKS.setUrlHash("");
            this.selectedDataId = -1;
        },
        
        onShowAllData: function () {
            TRACKS.setUrlHash("");
            
            // Reset selected filter
            jQuery("#filters #filter-items #pois-and-tracks").prop('checked', true);

            // Reset filters in DataManager
            this.dataManager.poiFilterActive = true;
            this.dataManager.trackFilterActive = true;

            this.sendMessage("changeState", {state: TRACKS.App.States.DEFAULT});
            this.sendMessage("emptySearch");
            this.sendMessage("showData", this.dataManager.search());

            // Send to analytics
            this.sendAnalytics("Show all data", "Show all data");
        },
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
            this.onMessage("hideElevationProfile", this.onHideElevationProfile);
		},
		
		render: function(track)
		{
            if (!track || !track.hasElevationProfile()) {
                return;
            }
            
            var elevationData = this.generateElevationProfileData(track);

            var options = {
                width: 700,
                height: 140,
                hAxis: {title: this.xAxisName,  titleTextStyle: {color: '#333'}},
                vAxis: {title: this.yAxisName, minValue: elevationData.minElevation, titleTextStyle: {color: '#333'}},
                legend: 'none'
            };

            this.elevationProfileChart = new google.visualization.AreaChart(this.renderContainer);
            this.elevationProfileChart.draw(elevationData, options);
            
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseover', TRACKS.bind(this.onElevationProfileOver, this));
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseout', TRACKS.bind(this.onElevationProfileOut, this));
            
            if (this.app.state === TRACKS.App.States.SHARE) {
                this.app.showView(this);
            }
            
            this.open();
		},
        
        generateElevationProfileData: function (track) {
            var elevationProfileData = new google.visualization.DataTable(),
                minElevation = parseInt(track.elevationPoints[0]),
                elevation = null;
            
            //Push header
            elevationProfileData.addColumn('number', this.xAxisName);
            elevationProfileData.addColumn('number', this.yAxisName);
            
            for (var i = 0; i < track.elevationPoints.length; i++) {
                elevation = parseInt(track.elevationPoints[i]);
                elevationProfileData.addRow([track.getDistanceFromStart(i), elevation]);
                
                // Find min elevation to use as Y axis min value
                if (elevation < minElevation) {
                    minElevation = elevation;
                }
            }
            
            elevationProfileData.minElevation = minElevation;
            
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
                this.sendMessage("panBy", {x: 0, y: 130});
                jQuery("#elevation-profile").animate({bottom: 0}, 200, null);
            }
        },
        
        close: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (isOpen) {
                this.sendMessage("panBy", {x: 0, y: -130});
                jQuery("#elevation-profile").animate({bottom: "-140px"}, 200, null);
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
            
            jQuery(this.container).css("display", "block");
            
            this.track = track;
            
            this.render(track);
        },
        
        onHideElevationProfile: function () {
            jQuery(this.container).css("display", "none");
        }
		
	});
	
	// Publish
	TRACKS.ElevationProfileView = ElevationProfileView;
	
}(TRACKS));

(function(TRACKS)
 {
    var FiltersView = TRACKS.View.extend({

        events: {
            "#filters #filter-toggle": {
                click: "onFilterIconClick"
            },
            
            "#filters #filter-items input": {
                click: "onFilterClick"
            },
            "#filters #all-data": {
                click: "onShowAllData"
            }
        },

        init: function (cfg) {

            // Call super
            this._parent(cfg);
            
            this.sendAnalytics = cfg.sendAnalytics;

            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
        },

        register: function () {
            this.onMessage("closeFilters", this.onCloseFilters);
        },

        render: function () {

            this.container.innerHTML = this.mustache(this.templates.main, {
                language: this.getDictionary()
            });

            return this;
        },
        
        isOpen: function () {
            return jQuery("#filters #filter-items").css("left") == "0px" ? true : false;
        },

        toggle: function () {
            if (this.isOpen()) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },

        open: function () {
            if (this.isOpen()) {
                return;
            }

            jQuery("#filters #filter-items").animate({left: 0}, 200, null);
            jQuery("#filters img").animate({left: "290px"}, 200, null);
        },

        close: function () {
            if (!this.isOpen()) {
                return;
            }

            jQuery("#filters #filter-items").animate({left: "-=290px"}, 200, null);
            jQuery("#filters img").animate({left: 0}, 200, null);
        },

        /*
		 * Events
		 */
        
        onFilterIconClick: function () {
            this.toggle();
        },
        
        onFilterClick: function (evt) {
            if (jQuery("#filters #filter-items #pois").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = false;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "POI");
            }
            
            if (jQuery("#filters #filter-items #tracks").is(":checked")) {
                this.dataManager.poiFilterActive = false;
                this.dataManager.trackFilterActive = true;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "Tracks");
            }
            
            if (jQuery("#filters #filter-items #pois-and-tracks").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = true;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "POI + Tracks");
            }
            
            var data = this.dataManager.search();
            this.sendMessage("showData", data);
        },
        
        onShowAllData: function () {
            // Reset selected filter
            jQuery("#filters #filter-items #pois-and-tracks").prop('checked', true);
            
            // Reset filters in DataManager
            this.dataManager.poiFilterActive = true;
            this.dataManager.trackFilterActive = true;
            
            this.sendMessage("changeState", {state: TRACKS.App.States.DEFAULT});
            this.sendMessage("emptySearch");
            this.sendMessage("showData", this.dataManager.search());

            // Send to analytics
            this.sendAnalytics("Show all data", "Show all data");
        },
        
        /*
		 * Messages
		 */
        onCloseFilters: function () {
            this.close();
        },

    });

    // Publish
    TRACKS.FiltersView = FiltersView;

}(TRACKS));

(function(TRACKS)
 {
    var SettingsView = TRACKS.View.extend({

        events: {
            "#settings #settings-toggle": {
                click: "onSettingsToggle"
            },
            
            "#settings #settings-items input": {
                click: "onShowTrailsLayerClick"
            },
        },

        init: function (cfg) {

            // Call super
            this._parent(cfg);

            this.sendAnalytics = cfg.sendAnalytics;

            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
        },

        register: function () {
            this.onMessage("closeSettings", this.onCloseSettings);
        },

        render: function () {

            this.container.innerHTML = this.mustache(this.templates.main, {
                language: this.getDictionary()
            });

            return this;
        },

        isOpen: function () {
            return jQuery("#settings #settings-items").css("left") == "0px" ? true : false;
        },

        toggle: function () {
            if (this.isOpen()) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },

        open: function () {
            if (this.isOpen()) {
                return;
            }

            jQuery("#settings #settings-items").animate({left: 0}, 200, null);
            jQuery("#settings img").animate({left: "290px"}, 200, null);
        },

        close: function () {
            if (!this.isOpen()) {
                return;
            }

            jQuery("#settings #settings-items").animate({left: "-=290px"}, 200, null);
            jQuery("#settings img").animate({left: 0}, 200, null);
        },

        /*
		 * Events
		 */

        onSettingsToggle: function () {
            this.toggle();
        },
        
        onShowTrailsLayerClick: function () {
            if (jQuery("#settings #settings-items #trails").is(":checked")) {

                this.sendMessage("showTrailsLayer");
                
                // Send to analytics
                this.sendAnalytics("Show Trails", "Trails");
            } else {
            
                this.sendMessage("hideTrailsLayer");
                
                // Send to analytics
                this.sendAnalytics("Hide Trails", "Trails");
            }
        },

        /*
		 * Messages
		 */
        onCloseSettings: function () {
            this.close();
        },

    });

    // Publish
    TRACKS.SettingsView = SettingsView;

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
            this.language = cfg.language;
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
	
    // Mask
    TRACKS.MASK_ELEMENT = ".romtrack";
    TRACKS.MASK_MESSAGE = "Lucr�?m :)";
    
    // States
	TRACKS.App.States = {};
    TRACKS.App.States.DEFAULT = 'default';
	TRACKS.App.States.SEARCH = 'search';
	TRACKS.App.States.INFO = 'trackinfo';
    TRACKS.App.States.SHARE = 'share';
	
}(TRACKS));

