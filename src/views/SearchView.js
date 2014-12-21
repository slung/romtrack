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
            
            // Send to analytics
            this.sendAnalytics("User Geocoded", location.address);
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