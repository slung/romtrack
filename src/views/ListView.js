(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
        selectedDataId: -1,
        
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
            "#list .data": {
                click: "onDataItemClick",
				hover: "onDataItemHover"
			},
            "#list #search": {
                click: "onOpenSearch"
            },
            "#list #all-data": {
                click: "onShowAllData"
            }
		},
		
		init: function( cfg ) {
			
			// Call super
			this._parent( cfg );
            this.noTracksMsg = cfg.noTracksMsg ? cfg.noTracksMsg : "No data found!"
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
			this.onMessage("showData", this.onShowData);
            this.onMessage("closeList", this.onCloseList);
            this.onMessage("selectDataItemInList", this.onSelectDataItem);
            this.onMessage("stateChanged", this.onStateChanged);
            this.onMessage("emptySearch", this.onEmptySearch);
		},
		
		render: function()
		{
            if (!this.data || this.data.length === 0) {
                this.container.innerHTML = this.mustache(this.templates.empty, {
                    language: this.getDictionary()
                });
            } else {
                this.container.innerHTML = this.mustache(this.templates.main, {
                    data: this.data,
                    language: this.getDictionary()
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
        
        toggleDataDetails: function (id) {
            if (id === -1) {
                return;
            }
            
            // Expand/contract preview image
            if (jQuery("#list #" + id + " #data-parameters").css("display") === "none") {
                jQuery("#list #" + id + " #preview").css("width", "80px");
                jQuery("#list #" + id + " #preview").css("height", "auto");
            } else {
                jQuery("#list #" + id + " #preview").css("width", "60px");
                jQuery("#list #" + id + " #preview").css("height", "30px");
            }
            
            jQuery("#list #" + id + " #data-parameters").toggle("fast");
        },
        
        open: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (!isOpen) {
                jQuery("#list").animate({left: 0}, 200, null);
                
                if (this.app.state === TRACKS.App.States.INFO){
                    this.sendMessage("panBy", {x: -150, y: 0});
                }
            }
        },
        
        close: function () {
            var isOpen = jQuery("#list").css("left") == "0px" ? true : false;
            
            if (isOpen) {
                jQuery("#list").animate({left: "-330px"}, 200, null);
                
                if (this.app.state === TRACKS.App.States.INFO){
                    this.sendMessage("panBy", {x: 150, y: 0});
                }
            }
        },
        
        selectDataItem: function (id) {
            if (id !== this.selectedDataId) {
            
                TRACKS.setUrlHash(id);
                
                // Deselect previous track first
                this.toggleDataDetails(this.selectedDataId);

                // Show track details
                this.toggleDataDetails(id);

                // Save track id
                this.selectedDataId = id;
                
                // Scroll to track
                jQuery("#list #data").mCustomScrollbar("scrollTo", "#" + id);
                
                var track = this.dataManager.getDataById(id);
                
                // Send to analytics
                this.sendAnalytics("Track Selected", "Name: " + track.name + " | URL: " + track.url);
            } else {
                TRACKS.setUrlHash("");
                
                // Deselect track
                this.toggleDataDetails(id);
                
                // Reset selected track id
                this.selectedDataId = -1;
            }
        },
		
		/*
		 * Events
		 */
        onListToggleClick: function () {
            this.toggleList();
        },
        
        onDataItemClick: function (evt) {
            var id = evt.currentTarget.id,
                track = this.dataManager.getDataById(id);
            
            this.selectDataItem(id);
            
            this.sendMessage("selectDataItemOnMap", track);
        },
        
        onDataItemHover: function (evt) {
            var id = evt.currentTarget.id,
                dataItem = this.dataManager.getDataById(id);
            
            if (this.app.views[1].map.getZoom() < 9) {
                this.sendMessage("showDataItemTooltip", dataItem);
            }
        },
		
		/*
		 * Messages
		 */
		onShowData: function (data) {
            // Save tracks
            this.data = data;
            
            this.render();
            this.open();
        },
        
        onSelectDataItem: function (track) {
            if (!track) {
                return;
            }
            
            this.selectDataItem(track.id);
        },
        
        onCloseList: function () {
            this.close();
        },
        
        onLinksClick: function (evt) {
            evt.stopPropagation();
        },
        
        onStateChanged: function (msg) {
            if (msg.currentState === TRACKS.App.States.INFO) {
                this.sendMessage("panBy", {x: -150, y: 0});
            }
        },
        
        onOpenSearch: function () {
            this.sendMessage("openSearch");
            this.close();
        },
        
        onEmptySearch: function () {
            TRACKS.setUrlHash("");
            this.selectedDataId = -1;
        },
        
        onShowAllData: function () {
            TRACKS.setUrlHash("");
            
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
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));