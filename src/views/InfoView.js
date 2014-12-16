(function(TRACKS)
{
	var InfoView = TRACKS.View.extend({
		
		events: {
			"#list #list-toggle": {
				click: "onListToggleClick"
			},
            
            "#list .track": {
                click: "onTrackClick",
				hover: "onTrackHover"
			}
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
		},
		
		register: function()
		{
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
        
		/*
		 * Messages
		 */
		
		
	});
	
	// Publish
	TRACKS.InfoView = InfoView;
	
}(TRACKS));