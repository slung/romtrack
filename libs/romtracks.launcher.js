//Load browser specific CSS
if (jQuery.browser.version.indexOf("11") !== -1) {
    TRACKS.loadCssFile("style/ie11-fixes.css");
}
else if (jQuery.browser.mozilla == true) {
    TRACKS.loadCssFile("style/mozilla-fixes.css");
}

(function( $j )
 {
    google.load("visualization", "1", {packages:["corechart"]});

    $j(document).ready( function() {

        /** App **/
        var app = new TRACKS.App({
            state: (TRACKS.getUrlHash() && TRACKS.getUrlHash().length > 1) ? TRACKS.App.States.SHARE : TRACKS.App.States.SEARCH,
            views: [
                /*
                 * Search View
                 */
                new TRACKS.SearchView({
                    searchRadius: 40,
                    countryCode: "ro",
                    container: TRACKS.one("#search"),
                    hideOnStates: [TRACKS.App.States.SHARE],
                    templates: {
                        main: $j.trim( TRACKS.one("#search-tpl").innerHTML ),
                        suggestions: $j.trim( TRACKS.one("#suggestions-tpl").innerHTML )
                    },
                    sendAnalytics: function (action, label) {
                        if (!action || !label) {
                            return;
                        }

                        ga('send', 'event', 'Search', action, label);
                    }
                }),
                /*
                 * Map View
                 */
                new TRACKS.MapView({
                    container: TRACKS.one("#map"),
                    renderContainer: TRACKS.one("#map"),
                    hideOnStates: [],
                    zoom: 3,
                    templates: {
                        trackTooltipTemplate: $j.trim(TRACKS.one("#track-tooltip-tpl").innerHTML),
                        poiTooltipTemplate: $j.trim(TRACKS.one("#poi-tooltip-tpl").innerHTML)
                    },
                    sendAnalytics: function (action, label) {
                        if (!action || !label) {
                            return;
                        }

                        ga('send', 'event', 'Map', action, label);
                    }
                }),
                /*
                 * List View
                 */
                new TRACKS.ListView({
                    container: TRACKS.one("#list"),
                    renderContainer: TRACKS.one("#list #container"),
                    hideOnStates: [TRACKS.App.States.SHARE],
                    noTracksMsg: "Din păcate nu am găsit nimic în jurul locației căutate :(",
                    templates: {
                        main: $j.trim( TRACKS.one("#list-tpl").innerHTML ),
                        empty: $j.trim( TRACKS.one("#empty-list-tpl").innerHTML )
                    },
                    onReady: function () {
                        $j("#list #data").mCustomScrollbar({
                            theme: "minimal-dark"
                        });
                    },
                    sendAnalytics: function (action, label) {
                        if (!action || !label) {
                            return;
                        }

                        ga('send', 'event', 'List', action, label);
                    }
                }),
                /*
                 * Elevation Profile view
                 */
                new TRACKS.ElevationProfileView({
                    container: TRACKS.one("#elevation-profile"),
                    renderContainer: TRACKS.one("#elevation-profile #container"),
                    hideOnStates: [TRACKS.App.States.DEFAULT, TRACKS.App.States.SEARCH, TRACKS.App.States.SHARE],
                    xAxisName: "Distanță (km)",
                    yAxisName: "Altitudine (m)",
                    templates: {
                        main: $j.trim( TRACKS.one("#elevation-profile-tpl").innerHTML )
                    }	
                }),
                /*
                 * Filter view
                 */
                new TRACKS.FiltersView({
                    container: TRACKS.one("#filters"),
                    renderContainer: TRACKS.one("#filters #container"),
                    hideOnStates: [TRACKS.App.States.SHARE],
                    templates: {
                        main: $j.trim( TRACKS.one("#filters-tpl").innerHTML )
                    },
                    sendAnalytics: function (action, label) {
                        if (!action || !label) {
                            return;
                        }

                        ga('send', 'event', 'Filters', action, label);
                    }
                })
            ],
            appReady: function () {


                TRACKS.mask(TRACKS.MASK_ELEMENT);
                TRACKS.poisLoaded = false;
                TRACKS.tracksLoaded = false;

                TRACKS.dispatcher.onMessage("poisLoaded", function () {
                    TRACKS.poisLoaded = true;

                    if (TRACKS.tracksLoaded) {
                        if (app.state === TRACKS.App.States.SHARE) {
                            var hashUrl = TRACKS.getUrlHash();

                            if (hashUrl && hashUrl.length > 0) {
                                TRACKS.mask(TRACKS.MASK_ELEMENT);

                                var id = hashUrl.substring(1, hashUrl.length);
                                var track = TRACKS.DataManager.getInstance().getDataById(id);

                                this.sendMessage("selectDataItemOnMap", track);

                                TRACKS.unmask(TRACKS.MASK_ELEMENT);
                            }
                        } else {
                            //GeolocateUser
                            TRACKS.DataManager.getInstance().geolocateUser();
                        }
                    }
                });

                TRACKS.dispatcher.onMessage("tracksLoaded", function () {
                    TRACKS.tracksLoaded = true;

                    if (TRACKS.poisLoaded) {
                        if (app.state === TRACKS.App.States.SHARE) {
                            var hashUrl = TRACKS.getUrlHash();

                            if (hashUrl && hashUrl.length > 0) {
                                TRACKS.mask(TRACKS.MASK_ELEMENT);

                                var id = hashUrl.substring(1, hashUrl.length);
                                var track = TRACKS.DataManager.getInstance().getDataById(id);

                                this.sendMessage("selectDataItemOnMap", track);

                                TRACKS.unmask(TRACKS.MASK_ELEMENT);
                            }
                        } else {
                            //GeolocateUser
                            TRACKS.DataManager.getInstance().geolocateUser();
                        }
                    }
                });
            }
        });

        //Read query string parameters 
        TRACKS.DataManager.getInstance().privateMode = (TRACKS.queryStringParameter("private") == "true") ? true : false;
        
        app.start();
    });

})(jQuery.noConflict());