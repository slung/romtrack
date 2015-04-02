(function( TRACKS )
{
	var TracksApp = TRACKS.MsgManager.extend({
		
		views: [],
		state: null,
		lastState: null,
		
		init: function( cfg )
		{
			this._parent();
			
			// Store state & add views
            this.language = cfg.language;
			this.state = cfg.state;
			this.language = cfg.language;
			this.addViews( cfg.views || [] );
			this.appReady = cfg.appReady;
			
			// Register message
			this.register();
			
			TRACKS.DataManager.getInstance().app = this;
		},
		
		addView: function( view )
		{
			//IE8 Fix, Array length is incorrect because of trailing comma
			if (!view)
				return;
			
			view.app = this;
			
			if( this.views.indexOf(view) == -1 )
				this.views.push( view );
		},
		
		addViews: function( views )
		{
			for( var i=0; i< views.length; i++ )
				this.addView( views[i] );
		},
		
		removeView: function( view )
		{
		},
		
		register: function()
		{
			this.onMessage( 'changeState', this.onChangeState );
			this.onMessage( 'reverseState', this.onReverseState );
		},
		
		start: function()
		{
			if( this.language )
			{
				TRACKS.LanguageManager.getInstance().loadLanguage(this.language, TRACKS.bind( function() {
					this._start();
				}, this));
			}
			else
			{
				this._start();	
			}
			
		},
		
		_start: function()
		{
			// Render all views
			for( var i=0; i<this.views.length; i++ )
				this.views[i].render();
			
			// Set default state
			this.changeState( this.state || 'home' );
			
			// dispatch
			if( this.appReady )
				this.appReady.call(this, []);
		},
		
		changeState: function( state, msg )
		{
			//if same state => no good
			if (state == this.state && this.lastState != null)
				return;
				
			this.lastState = this.state;
			this.state = state;
			
			// Render all views
			for( var i=0; i<this.views.length; i++ )
			{
				var view = this.views[i];
				
				if( view.hideOnStates.indexOf( this.state ) != -1 )
					this.hideView( view );
				else
					this.showView( view );
			}
			
			this.sendMessage('stateChanged', {currentState: this.state, lastState: this.lastState});
		},
		
		hideView: function( view )
		{
			TRACKS.addClass( view.container, 'hide-view');
			this.sendMessage('hideView', view.container);
		},
		
		showView: function( view )
		{
			TRACKS.removeClass( view.container, 'hide-view');
			this.sendMessage('showView', view.container);
		},
		
		onChangeState: function( msg )
		{
			this.changeState( msg.state );
		},
		
		onReverseState: function( msg )
		{
			this.changeState( this.lastState );
		}
		
	});	

	
	// Publish
	TRACKS.App = TracksApp;
	
    // Mask
    TRACKS.MASK_ELEMENT = ".romtrack";
    TRACKS.MASK_MESSAGE = "Lucrăm :)";
    
    // States
	TRACKS.App.States = {};
    TRACKS.App.States.DEFAULT = 'default';
	TRACKS.App.States.SEARCH = 'search';
	TRACKS.App.States.INFO = 'trackinfo';
    TRACKS.App.States.SHARE = 'share';
	
}(TRACKS));