(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
		events: {
			
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
			
			this.dataManager.on('userGeocoded', TRACKS.bind( this.onUserGeocoded, this));
		},
		
		register: function()
		{
			//this.onMessage("stateChanged", this.onStateChanged);
		},
		
		render: function()
		{
			this.container.innerHTML = this.mustache(this.templates.main, {});
			
			return this;
		},
		
		/*
		 * Events
		 */
		
		
		/*
		 * Messages
		 */
		
		
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));