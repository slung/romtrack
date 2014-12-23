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
                
                if (this.app.state === TRACKS.App.States.TRACK_INFO){
                    this.sendMessage("panBy", {x: -150, y: 0});
                }
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-330px"}, 200, null);
                
                if (this.app.state === TRACKS.App.States.TRACK_INFO){
                    this.sendMessage("panBy", {x: 150, y: 0});
                }
            }
        },
        
        selectTrack: function (index) {
            TRACKS.mask(TRACKS.MASK_ELEMENT);
            
            if (index !== this.selectedTrackIndex) {
            
                // Deselect previous track first
                this.toggleTrackDetails(this.selectedTrackIndex);

                // Show track details
                this.toggleTrackDetails(index);

                // Save track index
                this.selectedTrackIndex = index;
                
                // Scroll to track
                jQuery("#list #tracks").mCustomScrollbar("scrollTo", "#trackitem-" + index);
                
                var track = this.tracksManager.getTrackByIndex(index);
                
                // Send to analytics
                this.sendAnalytics("Track Selected", "Name: " + track.name + " | URL: " + track.url);
            } else {
                // Deselect track
                this.toggleTrackDetails(index);
                
                // Reset selected track index
                this.selectedTrackIndex = -1;
            }
            
            //TRACKS.unmask(TRACKS.MASK_ELEMENT);
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
                this.sendMessage("panBy", {x: -150, y: 0});
            }
        },
        
        onOpenSearch: function () {
            this.sendMessage("openSearch");
            this.close();
        },
        
        onShowAllTracks: function () {
            // Reset selected track index
            this.selectedTrackIndex = -1;
            
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