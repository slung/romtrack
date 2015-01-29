(function(TRACKS)
{
	var ElevationProfileView = TRACKS.View.extend({
		
		events: {
			"#elvation-profile-toggle": {
				click: "onElevationProfileClick"
			}
		},
		
		init: function( cfg ) {
			// Call super
			this._parent( cfg );
            
            this.xAxisName = cfg.xAxisName ? cfg.xAxisName : 'Distance (km)';
            this.yAxisName = cfg.yAxisName ? cfg.yAxisName : 'Altitude (m)';
		},
		
		register: function()
		{
			this.onMessage("showElevationProfile", this.onShowElevationProfile);
            this.onMessage("hideElevationProfile", this.onHideElevationProfile);
		},
		
		render: function(track)
		{
            if (!track || !track.hasElevationProfile()) {
                return;
            }
            
            var elevationData = this.generateElevationProfileData(track);

            var options = {
                width: 700,
                height: 140,
                hAxis: {title: this.xAxisName,  titleTextStyle: {color: '#333'}},
                vAxis: {title: this.yAxisName, minValue: elevationData.minElevation, titleTextStyle: {color: '#333'}},
                legend: 'none'
            };

            this.elevationProfileChart = new google.visualization.AreaChart(this.renderContainer);
            this.elevationProfileChart.draw(elevationData, options);
            
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseover', TRACKS.bind(this.onElevationProfileOver, this));
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseout', TRACKS.bind(this.onElevationProfileOut, this));
            
            if (this.app.state === TRACKS.App.States.SHARE) {
                this.app.showView(this);
            }
            
            this.open();
		},
        
        generateElevationProfileData: function (track) {
            var elevationProfileData = new google.visualization.DataTable(),
                minElevation = parseInt(track.elevationPoints[0]),
                elevation = null;
            
            //Push header
            elevationProfileData.addColumn('number', this.xAxisName);
            elevationProfileData.addColumn('number', this.yAxisName);
            
            for (var i = 0; i < track.elevationPoints.length; i++) {
                elevation = parseInt(track.elevationPoints[i]);
                elevationProfileData.addRow([track.getDistanceFromStart(i), elevation]);
                
                // Find min elevation to use as Y axis min value
                if (elevation < minElevation) {
                    minElevation = elevation;
                }
            }
            
            elevationProfileData.minElevation = minElevation;
            
            return elevationProfileData;
        },
        
        toggle: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (isOpen) {
                // close
                this.close();
            } else {
                // open
                this.open();
            }
        },
        
        open: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (!isOpen) {
                this.sendMessage("panBy", {x: 0, y: 130});
                jQuery("#elevation-profile").animate({bottom: 0}, 200, null);
            }
        },
        
        close: function () {
            var isOpen = jQuery("#elevation-profile").css("bottom") == "0px" ? true : false;
            
            if (isOpen) {
                this.sendMessage("panBy", {x: 0, y: -130});
                jQuery("#elevation-profile").animate({bottom: "-140px"}, 200, null);
            }
        },
		
		/*
		 * Events
		 */
		onElevationProfileClick: function () {
            if (!this.track || !this.track.hasElevationProfile()) {
                return;
            }
            
            this.toggle();
        },
        
        onElevationProfileOver: function (data) {
            this.sendMessage("showElevationMarker", {
                icon: "assets/images/marker-small.png",
                position: {
                    lat: this.track.points[data.row].lat(),
                    lon: this.track.points[data.row].lng()
                }
            });
        },
        
        onElevationProfileOut: function () {
            this.sendMessage("hideElevationMarker");
        },
		
		/*
		 * Messages
		 */
		onShowElevationProfile: function (track) {
            if (!track) {
                return;
            }
            
            jQuery(this.container).css("display", "block");
            
            this.track = track;
            
            this.render(track);
        },
        
        onHideElevationProfile: function () {
            jQuery(this.container).css("display", "none");
        }
		
	});
	
	// Publish
	TRACKS.ElevationProfileView = ElevationProfileView;
	
}(TRACKS));