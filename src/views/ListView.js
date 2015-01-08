(function(TRACKS)
{
	var ListView = TRACKS.View.extend({
		
        selectedDataIndex: -1,
        
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
            if (!this.data || this.data.length == 0) {
                this.container.innerHTML = this.mustache(this.templates.empty, {
                    message: this.noTracksMsg
                });
            } else {
                this.container.innerHTML = this.mustache(this.templates.main, {
                    data: this.data
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
        
        toggleDataDetails: function (index) {
            if (index === -1) {
                return;
            }
            
            // Expand/contract preview image
            if (jQuery("#list #dataitem-" + index + " #data-parameters").css("display") === "none") {
                jQuery("#list #dataitem-" + index + " #preview").css("width", "80px");
                jQuery("#list #dataitem-" + index + " #preview").css("height", "auto");
            } else {
                jQuery("#list #dataitem-" + index + " #preview").css("width", "60px");
                jQuery("#list #dataitem-" + index + " #preview").css("height", "30px");
            }
            
            jQuery("#list #dataitem-" + index + " #data-parameters").toggle("fast");
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
        
        selectDataItem: function (index) {
            if (index !== this.selectedDataIndex) {
            
                // Deselect previous track first
                this.toggleDataDetails(this.selectedDataIndex);

                // Show track details
                this.toggleDataDetails(index);

                // Save track index
                this.selectedDataIndex = index;
                
                // Scroll to track
                jQuery("#list #data").mCustomScrollbar("scrollTo", "#dataitem-" + index);
                
                var track = this.dataManager.getDataByIndex(index);
                
                // Send to analytics
                this.sendAnalytics("Track Selected", "Name: " + track.name + " | URL: " + track.url);
            } else {
                // Deselect track
                this.toggleDataDetails(index);
                
                // Reset selected track index
                this.selectedDataIndex = -1;
            }
        },
		
		/*
		 * Events
		 */
        onListToggleClick: function () {
            this.toggleList();
        },
        
        onDataItemClick: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]),
                track = this.dataManager.getDataByIndex(index);
            
            this.selectDataItem(index);
            
            this.sendMessage("selectDataItemOnMap", track);
        },
        
        onDataItemHover: function (evt) {
            var index = parseInt(evt.currentTarget.id.split('-')[1]),
                dataItem = this.dataManager.getDataByIndex(index);
            
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
            
            this.selectDataItem(track.index);
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
            this.selectedDataIndex = -1;
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
	});
	
	// Publish
	TRACKS.ListView = ListView;
	
}(TRACKS));