(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
		events: {
			"#list #list-toggle": {
				click: "onListToggleClick"
			},
            
            "#list .track": {
                click: "onTrackClick",
				hover: "onTrackHover"
			},
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
		},
		
		register: function()
		{
			this.onMessage("tracksLoaded", this.onTracksLoaded);
		},
		
		render: function()
		{
            if (!this.tracks || this.tracks.length == 0) {
                return;
            }
            
			this.container.innerHTML = this.mustache(this.templates.main, {
                tracks: this.tracks,
                nbTracks: this.tracks.length
            });
			
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
        
        open: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (!isOpen) {
                jQuery("#list").animate({left: 0}, 200, null);
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-=360px"}, 200, null);
            }
        },
        
        selectTrack: function (index) {
            this.deselectTracks();
            
             //Select track on map
            var track = this.tracksManager.getTrackByIndex(index);
            this.sendMessage("selectTrack", track);
            
            if (this.lastIndex == index) {
                return;
            }
                
            this.lastIndex = index;
            
            //Select track in list
            jQuery("#trackitem-" + index).addClass("selected");
        },
        
        deselectTracks: function () {
            jQuery(".track").removeClass("selected");
        },
		
		/*
		 * Events
		 */
        onListToggleClick: function () {
            this.toggleList();
        },
        
        onTrackClick: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]);
            
            this.selectTrack(index);
        },
        
        onTrackHover: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]);
            var track = this.tracksManager.getTrackByIndex(index);
            this.sendMessage("showTrackHoverTooltip", track);
        },
		
		
		/*
		 * Messages
		 */
		onTracksLoaded: function (tracks) {
            if (!tracks || tracks.length == 0) {
                return;
            }
            
            // Save tracks
            this.tracks = tracks;
            
            this.render();
            this.open();
        }
		
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));