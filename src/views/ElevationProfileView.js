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
                vAxis: {title: this.yAxisName, minValue: 0, titleTextStyle: {color: '#333'}},
                legend: 'none'
            };

            this.elevationProfileChart = new google.visualization.AreaChart(this.renderContainer);
            this.elevationProfileChart.draw(elevationData, options);
            
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseover', TRACKS.bind(this.onElevationProfileOver, this));
            google.visualization.events.addListener(this.elevationProfileChart, 'onmouseout', TRACKS.bind(this.onElevationProfileOut, this));
            
            this.open();
		},
        
        generateElevationProfileData: function (track) {
            var elevationProfileData = new google.visualization.DataTable();
            
            //Push header
            elevationProfileData.addColumn('number', this.xAxisName);
            elevationProfileData.addColumn('number', this.yAxisName);
            
            for (var i = 0; i < track.elevationPoints.length; i++) {
                elevationProfileData.addRow([track.getDistanceFromStart(i), parseInt(track.elevationPoints[i])]);
            }
            
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
                jQuery("#elevation-profile").animate({bottom: "-=170px"}, 200, null);
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
            
            this.track = track;
            
            this.render(track);
        }
		
	});
	
	// Publish
	TRACKS.ElevationProfileView = ElevationProfileView;
	
}(TRACKS));