(function( TRACKS )
 {
    // Singleton instance
    var dataManager = null;

    var DataManager = TRACKS.EventManager.extend({

        tableName: '',
        poiFilterActive: true,
        trackFilterActive: true,
        rowCount: 20,
        cluster: null,
        tracksRegistrar: "https://dl.dropboxusercontent.com/u/106013585/amazing%20romania/Registrars/tracks-registrar.txt",
        poisRegistrar: "https://dl.dropboxusercontent.com/u/106013585/amazing%20romania/Registrars/pois-registrar.txt",
        pois: [],
        tracks: [],
        dataIndex: 0,

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
                    dataInBounds.concat(TRACKS.GeoOperations.getInstance().getDataInBounds(this.pois, this.location, this.searchRadius));
                    
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
            this.pois = [];

            jQuery.ajax({
                url: this.poisRegistrar,
                type: 'GET',
                crossDomain: true,
                success: TRACKS.bind(function(data){
                    var pois = TRACKS.JSON.parse(data);

                    // Loop through POIs and save them
                    for (var i = 0; i < pois.length; i++) {
                        var poi = new TRACKS.POI(pois[i].name, pois[i].latitude, pois[i].longitude, pois[i].article, pois[i].preview, this.dataIndex);
                        this.pois.push(poi);
                        this.dataIndex++;
                        
                        if (i === pois.length-1) {
                            TRACKS.dispatcher.fire("poisLoaded");
                        }
                    }
                }, this)
            });
        },

        // Assume only GPX format tracks
        getTracksFromDataSource: function (success, error)
        {
            this.tracks = [];

            jQuery.ajax({
                url: this.tracksRegistrar,
                type: 'GET',
                crossDomain: true,
                success: TRACKS.bind(function(data){
                    var parsedData = TRACKS.JSON.parse(data);

                    this.exepectedNbOfTracks = parsedData.length;
                    
                    for (var i = 0; i < parsedData.length; i++) {
                        this.extractTrackData(parsedData[i], this.dataIndex);
                        this.dataIndex++;
                    }
                }, this)
            });
        },

        getDataByIndex: function (index) {
            for (var i = 0; i < this.tracks.length; i++) {
                if (this.tracks[i].index == index) {
                    return this.tracks[i];
                }
            }
            
            for (var i = 0; i < this.pois.length; i++) {
                if (this.pois[i].index == index) {
                    return this.pois[i];
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
                }, this)
            });
        },
        
        saveTrack: function(name, url, article, preview, trackPoints, elevationPoints, trackIndex) {
            var track = new TRACKS.Track(name, url, article, preview,  trackPoints, elevationPoints, trackIndex);
            this.tracks.push(track);
            
            if (this.tracks.length === this.exepectedNbOfTracks) {
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