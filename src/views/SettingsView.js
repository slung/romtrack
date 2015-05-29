(function(TRACKS)
 {
    var SettingsView = TRACKS.View.extend({

        events: {
            "#settings #settings-toggle": {
                click: "onSettingsToggle"
            },
            
            "#settings #settings-items input": {
                click: "onShowTrailsLayerClick"
            },
        },

        init: function (cfg) {

            // Call super
            this._parent(cfg);

            this.sendAnalytics = cfg.sendAnalytics;

            if (this.sendAnalytics) {
                TRACKS.bind(this.sendAnalytics, this);
            }
        },

        register: function () {
            this.onMessage("closeSettings", this.onCloseSettings);
        },

        render: function () {

            this.container.innerHTML = this.mustache(this.templates.main, {
                language: this.getDictionary()
            });

            return this;
        },

        isOpen: function () {
            return jQuery("#settings #settings-items").css("left") == "0px" ? true : false;
        },

        toggle: function () {
            if (this.isOpen()) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },

        open: function () {
            if (this.isOpen()) {
                return;
            }

            jQuery("#settings #settings-items").animate({left: 0}, 200, null);
            jQuery("#settings img").animate({left: "290px"}, 200, null);
        },

        close: function () {
            if (!this.isOpen()) {
                return;
            }

            jQuery("#settings #settings-items").animate({left: "-=290px"}, 200, null);
            jQuery("#settings img").animate({left: 0}, 200, null);
        },

        /*
		 * Events
		 */

        onSettingsToggle: function () {
            this.toggle();
        },
        
        onShowTrailsLayerClick: function () {
            if (jQuery("#settings #settings-items #trails").is(":checked")) {

                this.sendMessage("showTrailsLayer");
                
                // Send to analytics
                this.sendAnalytics("Show Trails", "Trails");
            } else {
            
                this.sendMessage("hideTrailsLayer");
                
                // Send to analytics
                this.sendAnalytics("Hide Trails", "Trails");
            }
        },

        /*
		 * Messages
		 */
        onCloseSettings: function () {
            this.close();
        },

    });

    // Publish
    TRACKS.SettingsView = SettingsView;

}(TRACKS));