(function( TRACKS )
 {
    // Singleton instance
    var languageManager = null;

    var LanguageManager = TRACKS.EventManager.extend({

        dir: "languages",
        extension: ".js",

        init: function( cfg ) 
        {
            if( languageManager )
                throw new Error('You can only create one instance of LanguageManager!');

            this._parent();
        },

        loadLanguage: function( language, success )
        {
            var url = this.dir + "/" + language + this.extension;

            JSONP.get( url, {}, TRACKS.bind( function( data ) {

                this.dictionary = data;

                if( success )
                    success.call(this, [data]);

            }, this));

            return;
        }
    });


    LanguageManager.getInstance = function()
    {
        if( languageManager )
            return languageManager;

        languageManager = new LanguageManager();
        return languageManager;
    };
    // Publish
    TRACKS.LanguageManager = LanguageManager;

}(TRACKS));