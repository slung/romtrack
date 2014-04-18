(function(a){var b=new Class({$events:null,init:function(){this.$events={};},on:function(c,d){this.$events[c]=this.$events[c]||[];this.$events[c].push(d);},fire:function(c,g){var f=this.$events[c];if(f){for(var d in f){var e=f[d];e.apply(this,[g]);}}},detach:function(c,f){var e=this.$events[c];for(var d=0;d<e.length;d++){if(e[d]==f){delete e[d];return;}}return;}});a.EventManager=b;}(TRACKS));(function(b){var a=b.EventManager.extend({init:function(){this._parent();},onMessage:function(d,c){b.dispatcher.on(d,b.bind(c,this));},sendMessage:function(d,c){b.dispatcher.fire(d,c);}});b.MsgManager=a;b.dispatcher=new a();}(TRACKS));(function(b){var a=null;var d=".page";var c=b.EventManager.extend({tableName:"",filters:[],rowCount:20,cluster:null,showLoading:false,tables:[],init:function(e){if(a){throw new Error("You can only create one instance of DataManager!");}this._parent();this.ajax=b.AjaxManager.getInstance();},geocode:function(e,h,f){var f=f||{};var g=new google.maps.Geocoder();g.geocode({address:e},b.bind(function(o,n){if(n==google.maps.GeocoderStatus.OK){if(h){var m=[];var q=-1;for(var p=0;p<o.length;p++){q++;m.push({index:q,lat:o[p].geometry.location.lat(),lon:o[p].geometry.location.lng(),address:o[p].formatted_address,bounds:[o[p].geometry.viewport.getSouthWest().lat(),o[p].geometry.viewport.getSouthWest().lng(),o[p].geometry.viewport.getNorthEast().lat(),o[p].geometry.viewport.getNorthEast().lng()]});}if(f.success){f.success.apply(this,[m]);}}else{var r=o[0].geometry.location.lat();var k=o[0].geometry.location.lng();var l=o[0].formatted_address;var j=[o[0].geometry.viewport.getSouthWest().lat(),o[0].geometry.viewport.getSouthWest().lng(),o[0].geometry.viewport.getNorthEast().lat(),o[0].geometry.viewport.getNorthEast().lng()];if(f.success){f.success.apply(this,[r,k,l,j]);}}}},this));},reverseGeocode:function(i,f,e){var e=e||{};var h=new google.maps.Geocoder();var g=new google.maps.LatLng(i,f);h.geocode({latLng:g},b.bind(function(l,k){if(k==google.maps.GeocoderStatus.OK){var j=l[0].formatted_address;var m=l[0].geometry.viewport;if(e.success){e.success.apply(this,[j,m]);}}},this));},geolocateUser:function(){if(navigator.geolocation){navigator.geolocation.getCurrentPosition(b.bind(function(e){this.reverseGeocode(e.coords.latitude,e.coords.longitude,{success:b.bind(function(f,g){this.geocodeBounds=[g.getSouthWest().lat(),g.getSouthWest().lng(),g.getNorthEast().lat(),g.getNorthEast().lng()];this.geocodeCenter=[e.coords.latitude,e.coords.longitude];var h={lat:e.coords.latitude,lon:e.coords.longitude,address:f,bounds:this.geocodeBounds};this.fire("userGeocoded",h);},this)});},this),b.bind(function(e){this.fire("userNotGeocoded");},this));}}});c.getInstance=function(){if(a){return a;}a=new c();return a;};b.DataManager=c;}(TRACKS));(function(a){var b=null;var c=new Class({restApiUrl:"http://localhost:1314/",getTracks:function(f,e){var d=this.geoAdsPlatformUrl+"ads";jQuery.ajax({url:d,type:"POST",success:a.bind(function(g){if(g.GreatSuccess==false){e.apply(this,[]);}else{f.apply(this,[a.JSON.parse(g)]);}},this)});}});c.getInstance=function(){if(b){return b;}b=new c();return b;};a.AjaxManager=c;})(TRACKS);(function(a){var c=null;var b=new Class({tracksRegistrar:"assets/tracks/tracks-registrar.txt",tracks:[],trackCounter:0,expectedNbOfTracks:0,getAllTracks:function(e,d){this.trackCounter=0;this.expectedNbOfTracks=0;this.tracks=[];jQuery.ajax({url:this.tracksRegistrar,type:"GET",success:a.bind(function(g){var h=a.JSON.parse(g);this.expectedNbOfTracks=h.length;for(var f=0;f<h.length;f++){this.extractTrackData(h[f]);}},this)});},getTracksBounds:function(){var d=new google.maps.LatLngBounds();for(var e=0;e<this.tracks.length;e++){d.union(this.tracks[e].bounds);}return d;},extractTrackData:function(d){jQuery.ajax({url:d.url,type:"GET",dataType:"xml",success:a.bind(function(e){var f=this.trackPointsFromGPX(e);this.saveTrack(d.name,f.trackPoints,f.elevationPoints);this.trackCounter++;if(this.trackCounter==this.expectedNbOfTracks){a.dispatcher.fire("tracksLoaded",this.tracks);}},this)});},saveTrack:function(d,f,e){this.tracks.push(new a.Track(d,f,e));},trackPointsFromGPX:function(d){var g=[];var e=[];var f=null;if(jQuery(d).find("rtept").length>0){f="rtept";}else{if(jQuery(d).find("wpt").length>0){f="wpt";}else{if(jQuery(d).find("trkpt").length>0){f="trkpt";}}}jQuery(d).find(f).each(function(){var k=jQuery(this).attr("lat");var i=jQuery(this).attr("lon");var j=new google.maps.LatLng(k,i);var h=jQuery(this).children("ele").text();g.push(j);e.push(h);});return{trackPoints:g,elevationPoints:e};}});b.getInstance=function(){if(c){return c;}c=new b();return c;};a.TracksManager=b;})(TRACKS);(function(a){var b=function(e,f,g,d,c){this.name=e;this.points=f;this.elevationPoints=[]||g;this.color=d||"#D95642";this.startMarkerUrl=c||"assets/images/marker.png";this.bounds=this.getBounds();this.mapTrack=this.getMapTrack();};b.prototype={getBounds:function(){var d=new google.maps.LatLngBounds();for(var c=0;c<this.points.length;c++){d.extend(this.points[c]);}return d;},getStartTrackPoint:function(){return this.points[0];},getMapTrack:function(){return new google.maps.Polyline({path:this.points,strokeColor:this.color,strokeOpacity:0.7,strokeWeight:4});}};a.Track=b;})(TRACKS);(function(a){Number.prototype.toRad=function(){return this*Math.PI/180;};Number.prototype.toDeg=function(){return this*180/Math.PI;};var b=null;var c=new Class({getPointAtDistanceFromPoint:function(d,e,j){j=j/6371;e=e.toRad();var i=d.lat().toRad(),g=d.lng().toRad();var h=Math.asin(Math.sin(i)*Math.cos(j)+Math.cos(i)*Math.sin(j)*Math.cos(e));var f=g+Math.atan2(Math.sin(e)*Math.sin(j)*Math.cos(i),Math.cos(j)-Math.sin(i)*Math.sin(h));if(isNaN(h)||isNaN(f)){return null;}return new google.maps.LatLng(h.toDeg(),f.toDeg());},getTracksInBounds:function(f,g){if(!f||!g||f.length==0){return;}var d=[];for(var e=0;e<f.length;e++){if(g.contains(f[e].getPosition())){d.push(f[e].track);}}return d;}});c.getInstance=function(){if(b){return b;}b=new c();return b;};a.GeoOperations=c;
})(TRACKS);(function(a){var b=a.MsgManager.extend({app:null,mustache:null,templates:null,init:function(c){this.mustache=a.mustache;this.templates=c.templates;this.container=c.container;this.renderContainer=c.renderContainer;this.hideOnStates=c.hideOnStates||[];this.formatRenderData=c.formatRenderData;this.dataManager=a.DataManager.getInstance();this.tracksManager=a.TracksManager.getInstance();this.geoOperations=a.GeoOperations.getInstance();this.ajax=a.AjaxManager.getInstance();this.events=a.extend(this.events||{},c.events||{});this.parseEvents();this.register();},register:function(){},render:function(){},parseEvents:function(){var e=this.events||{};for(var c in e){for(var d in e[c]){var f=this[e[c][d]]||e[c][d];a.delegate(this.container,c,d,a.bind(f,this));}}},getDictionary:function(){return a.LanguageManager.getInstance().dictionary;}});a.View=b;}(TRACKS));(function(b){var a=b.View.extend({map:null,zoom:15,centerMarker:null,markers:[],clusterOptions:{gridSize:50,maxZoom:15,styles:[{url:"assets/images/cluster45x45.png",height:45,width:45,anchor:(b.ie()>8)?[17,0]:[16,0],textColor:"#197EBA",textSize:11},{url:"assets/images/cluster70x70.png",height:70,width:70,anchor:(b.ie()>8)?[29,0]:[28,0],textColor:"#197EBA",textSize:11},{url:"assets/images/cluster90x90.png",height:90,width:90,anchor:[41,0],textColor:"#197EBA",textSize:11}]},events:{},init:function(c){this._parent(c);this.dataManager.on("userGeocoded",b.bind(this.onUserGeocoded,this));this.dataManager.on("userNotGeocoded",b.bind(this.onUserNotGeocoded,this));this.startZoom=c.startZoom||3;},register:function(){this.onMessage("setCenter",this.onSetCenter);this.onMessage("setZoom",this.onSetZoom);this.onMessage("fitMapToBounds",this.onFitMapToBounds);this.onMessage("tracksLoaded",this.onTracksLoaded);this.onMessage("searchTracksNearLocation",this.onSearchTracksNearLocation);this.onMessage("stateChanged",this.onStateChanged);},render:function(){var c={zoom:this.startZoom,center:new google.maps.LatLng(40,-98),mapTypeId:google.maps.MapTypeId.HYBRID,mapTypeControl:true,mapTypeControlOptions:{style:google.maps.MapTypeControlStyle.DEFAULT,position:google.maps.ControlPosition.TOP_RIGHT},panControl:false,zoomControl:false,streetViewControl:false,zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL}};this.map=new google.maps.Map(this.renderContainer,c);var d=google.maps.event.addListener(this.map,"tilesloaded",b.bind(function(e){this.tracksManager.getAllTracks();this.sendMessage("mapReady");google.maps.event.removeListener(d);},this));return this;},setZoom:function(c){if(!c){return;}this.map.setZoom(c);},setCenter:function(d){if(!d||!d.lat||!d.lon){return;}var c=new google.maps.LatLng(d.lat,d.lon);if(this.centerMarker){this.centerMarker.setPosition(c);}else{this.centerMarker=this.createMarker({url:"assets/images/target-icon.png",position:{lat:d.lat,lon:d.lon}});}this.map.setCenter(c);},createMarker:function(c){return new google.maps.Marker({map:this.map,icon:c.url,position:new google.maps.LatLng(c.position.lat,c.position.lon)});},addTracks:function(e){for(var f=0;f<e.length;f++){var d=e[f];var c=new google.maps.Marker({map:this.map,icon:d.startMarkerUrl,position:d.getStartTrackPoint()});c.track=d;this.addStartTrackMarkerListeners(c);this.markers.push(c);}this.enableClustering();},removeTracks:function(){for(var c=0;c<this.markers;c++){this.markers[c].setMap(null);}},addStartTrackMarkerListeners:function(c){google.maps.event.addListener(c,"click",b.bind(function(){this.onTrackMarkerClick(c);},this));google.maps.event.addListener(c,"mouseover",b.bind(function(d){this.onTrackMarkerOver(c);},this));google.maps.event.addListener(c,"mouseout",b.bind(function(d){if(this.hoverTooltip){this.hoverTooltip.close();}},this));},enableClustering:function(){this.disableClustering();this.markerCluster=new MarkerClusterer(this.map,this.markers,{styles:this.clusterOptions.styles,gridSize:this.clusterOptions.gridSize,maxZoom:this.clusterOptions.maxZoom});},disableClustering:function(){if(this.markerCluster){return this.markerCluster.clearMarkers();}},searchTracksNearLocation:function(j,c){var d=new google.maps.LatLng(j.lat,j.lon);var g=new google.maps.LatLngBounds(new google.maps.LatLng(j.bounds[0],j.bounds[1]),new google.maps.LatLng(j.bounds[2],j.bounds[3]));var f=this.geoOperations.getPointAtDistanceFromPoint(d,45,c);var i=this.geoOperations.getPointAtDistanceFromPoint(d,135,c);var k=this.geoOperations.getPointAtDistanceFromPoint(d,245,c);var e=new google.maps.LatLngBounds(k,f);e.extend(i);var h=this.geoOperations.getTracksInBounds(this.markers,e);this.removeTracks();if(h&&h.length>0){this.map.fitBounds(e);this.addTracks(h);}else{this.map.fitBounds(g);}},onUserGeocoded:function(c){if(!c||!c.lat||!c.lon){return;}this.centerAndZoom({lat:c.lat,lon:c.lon},this.zoom);},onUserNotGeocoded:function(c){},onTracksLoaded:function(c){this.addTracks(c);this.map.fitBounds(this.tracksManager.getTracksBounds());},onCenterMap:function(c){this.centerAndZoom({lat:c.lat,lon:c.lon},this.zoom);},onFitMapToBounds:function(c){this.map.fitBounds(c);},onSetCenter:function(c){this.setCenter(c);},onSetZoom:function(c){this.setZoom(c);},onSearchTracksNearLocation:function(c){if(!c||!c.location||!c.searchRadius){return;}this.setCenter(c.location);this.searchTracksNearLocation(c.location,c.searchRadius);},onStateChanged:function(c){if(c.currentState==b.App.States.TRACK_INFO){this.disableClustering();}if(c.lastState==b.App.States.TRACK_INFO){this.enableClustering();}},onTrackMarkerClick:function(c){if(c.track.isVisible){c.track.mapTrack.setMap(null);c.setVisible(true);c.track.isVisible=false;}else{c.track.mapTrack.setMap(this.map);this.map.fitBounds(c.track.bounds);c.track.isVisible=true;this.sendMessage("changeState",{state:b.App.States.TRACK_INFO});}},onTrackMarkerOver:function(c){var d=this.mustache(this.templates.tooltipTemplate,{track:{name:c.track.name}});this.hoverTooltip=new InfoBox({content:d,closeBoxURL:"",pixelOffset:new google.maps.Size(-115,-67)});this.hoverTooltip.open(this.map,c);
}});b.MapView=a;}(TRACKS));(function(a){var b="#search-input";var c=a.View.extend({events:{"#search img":{click:"onSearchIconClick"},"#search-input":{keyup:"onKeyUp"},"#suggestions a":{click:"onSuggestionClick"}},init:function(d){this._parent(d);this.searchRadius=d.searchRadius||100;this.dataManager.on("userGeocoded",a.bind(this.onUserGeocoded,this));},register:function(){},render:function(){this.container.innerHTML=this.mustache(this.templates.main,{});this.toggleSearchInput();return this;},focus:function(){a.one(b,this.container).focus();},search:function(d){this.searchInputText=d||this.getInputValue();if(!this.searchInputText){return;}this.dataManager.geocode(this.searchInputText,true,{success:a.bind(function(g){if(g.length==0){return;}var e=[];for(var f=0;f<3;f++){if(g[f]){e.push(g[f]);}}this.addSuggestions(e);},this)});},addSuggestions:function(d){if(!d||d.length==0){return;}this.suggestions=d;var e=a.one("#suggestions",this.container);e.innerHTML=this.mustache(this.templates.suggestions,{suggestions:d,});a.css(e,"display","block");},removeSuggestions:function(){var d=a.one("#suggestions",this.container);d.innerHTML="";a.css(d,"display","none");this.suggestions=[];},setInputValue:function(d){a.one(b,this.container).value=d;},getInputValue:function(){return a.one(b,this.container).value;},toggleSearchInput:function(){var d=jQuery("#search input").css("left")=="0px"?true:false;if(d){this.removeSuggestions();jQuery("#search input").animate({left:"-=258px"},200,null);jQuery("#search img").animate({left:0},200,null);}else{jQuery("#search input").animate({left:0},200,null);jQuery("#search img").animate({left:"258px"},200,null);this.focus();}},onSearchIconClick:function(d){this.toggleSearchInput();},onKeyUp:function(d){var e=this.getInputValue();if(e.length>2){this.search();}else{if(e.length==0){this.removeSuggestions();}}},onSuggestionClick:function(d){var f=d.target.id.split("-")[1];var e=this.suggestions[f];this.setInputValue(e.address);this.removeSuggestions();this.sendMessage("changeState",{state:a.App.States.SEARCH});this.sendMessage("searchTracksNearLocation",{location:e,searchRadius:this.searchRadius});},onUserGeocoded:function(d){if(!d||!d.address){return;}this.setInputValue(d.address);this.toggleSearchInput();}});a.SearchView=c;}(TRACKS));(function(b){var a=b.View.extend({events:{},init:function(c){this._parent(c);this.dataManager.on("userGeocoded",b.bind(this.onUserGeocoded,this));},register:function(){},render:function(){this.container.innerHTML=this.mustache(this.templates.main,{});return this;},});b.ListView=a;}(TRACKS));(function(a){var b=a.MsgManager.extend({views:[],state:null,lastState:null,init:function(c){this._parent();this.state=c.state;this.language=c.language;this.addViews(c.views||[]);this.appReady=c.appReady;this.register();a.DataManager.getInstance().app=this;},addView:function(c){if(!c){return;}c.app=this;if(this.views.indexOf(c)==-1){this.views.push(c);}},addViews:function(c){for(var d=0;d<c.length;d++){this.addView(c[d]);}},removeView:function(c){},register:function(){this.onMessage("changeState",this.onChangeState);this.onMessage("reverseState",this.onReverseState);},start:function(){if(this.language){a.LanguageManager.getInstance().loadLanguage(this.language,a.bind(function(){this._start();},this));}else{this._start();}},_start:function(){for(var c=0;c<this.views.length;c++){this.views[c].render();}this.changeState(this.state||"home");if(this.appReady){this.appReady.call(this,[]);}},changeState:function(e,f){if(e==this.state&&this.lastState!=null){return;}this.lastState=this.state;this.state=e;for(var d=0;d<this.views.length;d++){var c=this.views[d];if(c.hideOnStates.indexOf(this.state)!=-1){this.hideView(c);}else{this.showView(c);}}this.sendMessage("stateChanged",{currentState:this.state,lastState:this.lastState});},hideView:function(c){a.addClass(c.container,"hide-view");this.sendMessage("hideView",c.container);},showView:function(c){a.removeClass(c.container,"hide-view");this.sendMessage("showView",c.container);},onChangeState:function(c){this.changeState(c.state);},onReverseState:function(c){this.changeState(this.lastState);}});a.App=b;a.App.States={};a.App.States.DEFAULT="default";a.App.States.SEARCH="search";a.App.States.TRACK_INFO="trackinfo";}(TRACKS));