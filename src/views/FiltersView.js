(function(TRACKS)
 {
    var FiltersView = TRACKS.View.extend({

        events: {
            "#filters img": {
                click: "onFilterIconClick"
            },
            
            "#filters #checkboxes input": {
                click: "onFilterClick"
            },
        },

        init: function (cfg) {

            // Call super
            this._parent(cfg);
        },

        register: function () {
            this.onMessage("closeFilters", this.onCloseFilters);
        },

        render: function () {

            this.container.innerHTML = this.mustache(this.templates.main, {
                
            });

            return this;
        },
        
        isOpen: function () {
            return jQuery("#filters #checkboxes").css("left") == "0px" ? true : false;
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

            jQuery("#filters #checkboxes").animate({left: 0}, 200, null);
            jQuery("#filters img").animate({left: "290px"}, 200, null);
        },

        close: function () {
            if (!this.isOpen()) {
                return;
            }

            jQuery("#filters #checkboxes").animate({left: "-=290px"}, 200, null);
            jQuery("#filters img").animate({left: 0}, 200, null);
        },

        /*
		 * Events
		 */
        
        onFilterIconClick: function () {
            this.toggle();
        },
        
        onFilterClick: function (evt) {
            if (jQuery("#filters #checkboxes #pois").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = false;
            }
            
            if (jQuery("#filters #checkboxes #tracks").is(":checked")) {
                this.dataManager.poiFilterActive = false;
                this.dataManager.trackFilterActive = true;
            }
            
            if (jQuery("#filters #checkboxes #pois-and-tracks").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = true;
            }
            
            var data = this.dataManager.search();
            this.sendMessage("showData", data);
        },
        
        /*
		 * Messages
		 */
        onCloseFilters: function () {
            this.close();
        },

    });

    // Publish
    TRACKS.FiltersView = FiltersView;

}(TRACKS));