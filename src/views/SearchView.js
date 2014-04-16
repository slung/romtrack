(function( TRACKS )
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
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
			this.dataManager.on( 'userGeocoded', TRACKS.bind( this.onUserGeocoded, this) );
		},
		
		register: function()
		{
			//this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			this.container.innerHTML = this.mustache( this.templates.main, {});
			
			return this;
		},
		
		focus: function()
		{
			TRACKS.one(INPUT_SELECTOR, this.container).focus();
		},
		 
		search: function( value, multipleResults )
		{
			this.searchInputText = value || this.getInputValue();
			
			if (!this.searchInputText)
				return;
			
			this.dataManager.geocode( this.searchInputText, true, {
				success: TRACKS.bind( function( addresses ) {
					
					if ( addresses.length == 0 )
						return;
					
					var addressName = addresses[0].address;
					var addressLat = addresses[0].lat;
					var addressLon = addresses[0].lon;
					
                     this.tracksManager.getAllTracks();
                    
					this.setInputValue( addressName );
					this.sendMessage("centerMap", {lat: addressLat, lon: addressLon});
				}, this)
			})
		},
		
		setInputValue: function( value )
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
                // close
                jQuery("#search input").animate({left: "-=258px"}, 200, null);
                jQuery("#search img").animate({left: "-5px"}, 200, null);
            } else {
                // open
                jQuery("#search input").animate({left: 0}, 200, null);
                jQuery("#search img").animate({left: "258px"}, 200, null);
            }
        },
		
		/*
		 * Events
		 */
		onSearchIconClick: function(evt)
		{
			this.toggleSearchInput();
		},
		
		onKeyUp: function( evt )
		{
			if( evt.keyCode == 13)
				this.search();
		},
		
		/*
		 * Messages
		 */
		
		onUserGeocoded: function( msg )
		{
			if ( !msg || !msg.address )
				return;
				
			this.setInputValue( msg.address );
		}
		
	});
	
	// Publish
	TRACKS.SearchView = SearchView;
	
}(TRACKS));