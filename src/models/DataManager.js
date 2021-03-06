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