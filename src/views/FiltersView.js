(function(TRACKS)
 {
    var FiltersView = TRACKS.View.extend({

        events: {
            "#filters #filter-toggle": {
                click: "onFilterIconClick"
            },
            
            "#filters #filter-items input": {
                click: "onFilterClick"
            },
            "#filters #all-data": {
                click: "onShowAllData"
            }
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
            this.onMessage("closeFilters", this.onCloseFilters);
        },

        render: function () {

            this.container.innerHTML = this.mustache(this.templates.main, {
                
            });

            return this;
        },
        
        isOpen: function () {
            return jQuery("#filters #filter-items").css("left") == "0px" ? true : false;
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

            jQuery("#filters #filter-items").animate({left: 0}, 200, null);
            jQuery("#filters img").animate({left: "290px"}, 200, null);
        },

        close: function () {
            if (!this.isOpen()) {
                return;
            }

            jQuery("#filters #filter-items").animate({left: "-=290px"}, 200, null);
            jQuery("#filters img").animate({left: 0}, 200, null);
        },

        /*
		 * Events
		 */
        
        onFilterIconClick: function () {
            this.toggle();
        },
        
        onFilterClick: function (evt) {
            if (jQuery("#filters #filter-items #pois").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = false;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "POI");
            }
            
            if (jQuery("#filters #filter-items #tracks").is(":checked")) {
                this.dataManager.poiFilterActive = false;
                this.dataManager.trackFilterActive = true;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "Tracks");
            }
            
            if (jQuery("#filters #filter-items #pois-and-tracks").is(":checked")) {
                this.dataManager.poiFilterActive = true;
                this.dataManager.trackFilterActive = true;
                
                // Send to analytics
                this.sendAnalytics("Filter selected", "POI + Tracks");
            }
            
            var data = this.dataManager.search();
            this.sendMessage("showData", data);
        },
        
        onShowAllData: function () {
            // Reset selected filter
            jQuery("#filters #filter-items #pois-and-tracks").prop('checked', true);
            
            // Reset filters in DataManager
            this.dataManager.poiFilterActive = true;
            this.dataManager.trackFilterActive = true;
            
            this.sendMessage("changeState", {state: TRACKS.App.States.DEFAULT});
            this.sendMessage("emptySearch");
            this.sendMessage("showData", this.dataManager.search());

            // Send to analytics
            this.sendAnalytics("Show all data", "Show all data");
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