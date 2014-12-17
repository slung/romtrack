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
				//hover: "onTrackHover"
			}
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
            this.noTracksMsg = cfg.noTracksMsg ? cfg.noTracksMsg : "No tracks found!"
		},
		
		register: function()
		{
			this.onMessage("tracksLoaded", this.onTracksLoaded);
            this.onMessage("noTracksLoaded", this.onNoTracksLoaded);
            this.onMessage("closeList", this.onCloseList);
            this.onMessage("selectTrackInList", this.onSelectTrack);
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
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-=360px"}, 200, null);
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
            var index = parseInt(evt.currentTarget.id.split('-')[1]);
            
            this.selectTrack(index);
            
            var track = this.tracksManager.getTrackByIndex(index);
            this.sendMessage("selectTrackOnMap", track);
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
            if (!tracks || tracks.length === 0) {
                return;
            }
            
            // Save tracks
            this.tracks = tracks;
            
            this.render();
            this.open();
        },
        
        onNoTracksLoaded: function () {
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
        }
		
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));