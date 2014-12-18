(function(a){var b=new Class({$events:null,init:function(){this.$events={};},on:function(c,d){this.$events[c]=this.$events[c]||[];this.$events[c].push(d);},fire:function(c,g){var f=this.$events[c];if(f){for(var d in f){var e=f[d];e.apply(this,[g]);}}},detach:function(c,f){var e=this.$events[c];for(var d=0;d<e.length;d++){if(e[d]==f){delete e[d];return;}}return;}});a.EventManager=b;}(TRACKS));(function(b){var a=b.EventManager.extend({init:function(){this._parent();},onMessage:function(d,c){b.dispatcher.on(d,b.bind(c,this));},sendMessage:function(d,c){b.dispatcher.fire(d,c);}});b.MsgManager=a;b.dispatcher=new a();}(TRACKS));(function(b){var a=null;var d=".page";var c=b.EventManager.extend({tableName:"",filters:[],rowCount:20,cluster:null,showLoading:false,tables:[],init:function(e){if(a){throw new Error("You can only create one instance of DataManager!");}this._parent();this.ajax=b.AjaxManager.getInstance();},geocode:function(e,h,i,f){var f=f||{};var g=new google.maps.Geocoder();g.geocode({address:e,region:h},b.bind(function(o,n){if(n==google.maps.GeocoderStatus.OK){if(i){var m=[];var q=-1;for(var p=0;p<o.length;p++){q++;m.push({index:q,lat:o[p].geometry.location.lat(),lon:o[p].geometry.location.lng(),address:o[p].formatted_address,bounds:[o[p].geometry.viewport.getSouthWest().lat(),o[p].geometry.viewport.getSouthWest().lng(),o[p].geometry.viewport.getNorthEast().lat(),o[p].geometry.viewport.getNorthEast().lng()]});}if(f.success){f.success.apply(this,[m]);}}else{var r=o[0].geometry.location.lat();var k=o[0].geometry.location.lng();var l=o[0].formatted_address;var j=[o[0].geometry.viewport.getSouthWest().lat(),o[0].geometry.viewport.getSouthWest().lng(),o[0].geometry.viewport.getNorthEast().lat(),o[0].geometry.viewport.getNorthEast().lng()];if(f.success){f.success.apply(this,[r,k,l,j]);}}}},this));},reverseGeocode:function(i,f,e){var e=e||{};var h=new google.maps.Geocoder();var g=new google.maps.LatLng(i,f);h.geocode({latLng:g},b.bind(function(l,k){if(k==google.maps.GeocoderStatus.OK){var j=l[0].formatted_address;var m=l[0].geometry.viewport;if(e.success){e.success.apply(this,[j,m]);}}},this));},geolocateUser:function(){if(navigator.geolocation){navigator.geolocation.getCurrentPosition(b.bind(function(e){this.reverseGeocode(e.coords.latitude,e.coords.longitude,{success:b.bind(function(f,g){this.geocodeBounds=[g.getSouthWest().lat(),g.getSouthWest().lng(),g.getNorthEast().lat(),g.getNorthEast().lng()];this.geocodeCenter=[e.coords.latitude,e.coords.longitude];var h={lat:e.coords.latitude,lon:e.coords.longitude,address:f,bounds:this.geocodeBounds};this.fire("userGeocoded",h);},this)});},this),b.bind(function(e){this.fire("userNotGeocoded");},this));}}});c.getInstance=function(){if(a){return a;}a=new c();return a;};b.DataManager=c;}(TRACKS));(function(a){var b=null;var c=new Class({restApiUrl:"http://localhost:1314/",getTracks:function(f,e){var d=this.geoAdsPlatformUrl+"ads";jQuery.ajax({url:d,type:"POST",success:a.bind(function(g){if(g.GreatSuccess==false){e.apply(this,[]);}else{f.apply(this,[a.JSON.parse(g)]);}},this)});}});c.getInstance=function(){if(b){return b;}b=new c();return b;};a.AjaxManager=c;})(TRACKS);(function(a){var c=null;var b=new Class({tracksRegistrar:"assets/tracks/tracks-registrar.txt",tracks:[],allTracks:[],trackCounter:0,expectedNbOfTracks:0,getTracksFromDataSource:function(e,d){this.trackCounter=0;this.expectedNbOfTracks=0;this.tracks=[];jQuery.ajax({url:this.tracksRegistrar,type:"GET",crossDomain:true,success:a.bind(function(g){var h=a.JSON.parse(g);this.expectedNbOfTracks=h.length;for(var f=0;f<h.length;f++){this.extractTrackData(h[f],f);}},this)});},getTrackByIndex:function(d){for(var e=0;e<this.tracks.length;e++){if(this.tracks[e].index==d){return this.tracks[e];}}return null;},extractTrackData:function(d,e){jQuery.ajax({url:d.url,type:"GET",dataType:"xml",crossDomain:true,success:a.bind(function(f){var g=this.trackPointsFromGPX(f);this.saveTrack(d.name,d.url,d.article,d.preview,g.trackPoints,g.elevationPoints,e);this.trackCounter++;if(this.trackCounter==this.expectedNbOfTracks){a.dispatcher.fire("tracksInitiated",this.tracks);}},this)});},saveTrack:function(f,e,i,h,k,g,j){var d=new a.Track(f,e,i,h,k,g,j);this.tracks.push(d);this.allTracks.push(d);},trackPointsFromGPX:function(d){var g=[];var e=[];var f=null;if(jQuery(d).find("rtept").length>0){f="rtept";}else{if(jQuery(d).find("wpt").length>0){f="wpt";}else{if(jQuery(d).find("trkpt").length>0){f="trkpt";}}}jQuery(d).find(f).each(function(){var k=jQuery(this).attr("lat");var i=jQuery(this).attr("lon");var j=new google.maps.LatLng(k,i);var h=jQuery(this).children("ele").text();g.push(j);if(h!="0"){e.push(parseInt(h));}});return{trackPoints:g,elevationPoints:e};}});b.getInstance=function(){if(c){return c;}c=new b();return c;};a.TracksManager=b;})(TRACKS);(function(a){var b=function(c,d,i,h,l,j,g,f,e,m){this.name=c;this.url=d;this.article=i;this.preview=h;this.points=l;this.elevationPoints=j||[];this.index=g;this.color=f||"#D95642";this.startMarkerUrl=e||"assets/images/marker.png";this.endMarkerUrl=m||"assets/images/end-marker.png";this.bounds=this.getBounds();this.mapTrack=this.getMapTrack();this.length=this.getLength();var k=this.getTotalAscentDescent();this.ascent=k.ascent;this.descent=k.descent;};b.prototype={hasElevationProfile:function(){return(this.elevationPoints.length>0&&this.elevationPoints.length==this.points.length);},getBounds:function(){var d=new google.maps.LatLngBounds();for(var c=0;c<this.points.length;c++){d.extend(this.points[c]);}return d;},getStartTrackPoint:function(){return this.points[0];},getEndTrackPoint:function(){return this.points[this.points.length-1];},getMapTrack:function(){var c=new google.maps.Polyline({path:this.points,strokeColor:this.color,strokeOpacity:0.7,strokeWeight:4});google.maps.event.addListener(c,"mouseover",function(){this.setOptions({strokeOpacity:1});});google.maps.event.addListener(c,"mouseout",function(){this.setOptions({strokeOpacity:0.7});});return c;},getLength:function(){var c=google.maps.geometry.spherical.computeLength(this.points);
c=c/1000;c=Math.round(c);return c;},getDistanceFromStart:function(c){var d=google.maps.geometry.spherical.computeLength(this.points.slice(0,c));d=(d/1000).toFixed(2);return parseFloat(d);},getTotalAscentDescent:function(){if(!this.hasElevationProfile()){return null;}var c=0;var e=0;for(var d=0;d<this.elevationPoints.length-1;d++){if(this.elevationPoints[d]<this.elevationPoints[d+1]){c+=this.elevationPoints[d+1]-this.elevationPoints[d];}else{if(this.elevationPoints[d]>this.elevationPoints[d+1]){e+=this.elevationPoints[d]-this.elevationPoints[d+1];}}}return{ascent:Math.round(c),descent:Math.round(e)};}};a.Track=b;})(TRACKS);(function(a){Number.prototype.toRad=function(){return this*Math.PI/180;};Number.prototype.toDeg=function(){return this*180/Math.PI;};var b=null;var c=new Class({getPointAtDistanceFromPoint:function(d,e,j){j=j/6371;e=e.toRad();var i=d.lat().toRad(),g=d.lng().toRad();var h=Math.asin(Math.sin(i)*Math.cos(j)+Math.cos(i)*Math.sin(j)*Math.cos(e));var f=g+Math.atan2(Math.sin(e)*Math.sin(j)*Math.cos(i),Math.cos(j)-Math.sin(i)*Math.sin(h));if(isNaN(h)||isNaN(f)){return null;}return new google.maps.LatLng(h.toDeg(),f.toDeg());},getTracksInBounds:function(f,g){if(!f||!g||f.length==0){return;}var d=[];for(var e=0;e<f.length;e++){if(g.contains(f[e].points[0])||g.contains(f[e].points[f[e].points.length-1])){d.push(f[e]);}}return d;},getTracksBounds:function(e){var d=new google.maps.LatLngBounds();for(var f=0;f<e.length;f++){d.union(e[f].bounds);}return d;},getTracksStartPointBounds:function(d){var f=new google.maps.LatLngBounds();for(var e=0;e<d.length;e++){f.extend(d[e].getStartTrackPoint());}return f;}});c.getInstance=function(){if(b){return b;}b=new c();return b;};a.GeoOperations=c;})(TRACKS);(function(a){var b=a.MsgManager.extend({app:null,mustache:null,templates:null,init:function(c){this.mustache=a.mustache;this.templates=c.templates;this.container=c.container;this.renderContainer=c.renderContainer;this.hideOnStates=c.hideOnStates||[];this.formatRenderData=c.formatRenderData;this.dataManager=a.DataManager.getInstance();this.tracksManager=a.TracksManager.getInstance();this.geoOperations=a.GeoOperations.getInstance();this.ajax=a.AjaxManager.getInstance();this.events=a.extend(this.events||{},c.events||{});this.parseEvents();this.register();},register:function(){},render:function(){},parseEvents:function(){var e=this.events||{};for(var c in e){for(var d in e[c]){var f=this[e[c][d]]||e[c][d];a.delegate(this.container,c,d,a.bind(f,this));}}},getDictionary:function(){return a.LanguageManager.getInstance().dictionary;}});a.View=b;}(TRACKS));(function(b){var a=b.View.extend({map:null,zoom:15,centerMarker:null,markers:[],clusterOptions:{gridSize:50,maxZoom:15,styles:[{url:"assets/images/cluster45x45.png",height:45,width:45,anchor:(b.ie()>8)?[17,0]:[16,0],textColor:"#197EBA",textSize:11},{url:"assets/images/cluster70x70.png",height:70,width:70,anchor:(b.ie()>8)?[29,0]:[28,0],textColor:"#197EBA",textSize:11},{url:"assets/images/cluster90x90.png",height:90,width:90,anchor:[41,0],textColor:"#197EBA",textSize:11}]},events:{},init:function(c){this._parent(c);this.dataManager.on("userGeocoded",b.bind(this.onUserGeocoded,this));this.dataManager.on("userNotGeocoded",b.bind(this.onUserNotGeocoded,this));this.startZoom=c.startZoom||7;this.startLocation=c.startLocation||{lat:46.08371401022221,lon:23.73289867187499};},register:function(){this.onMessage("setCenter",this.onSetCenter);this.onMessage("setZoom",this.onSetZoom);this.onMessage("fitMapToBounds",this.onFitMapToBounds);this.onMessage("showTracks",this.onShowTracks);this.onMessage("searchTracksNearLocation",this.onSearchTracksNearLocation);this.onMessage("stateChanged",this.onStateChanged);this.onMessage("showTrackTooltip",this.onShowTrackTooltip);this.onMessage("selectTrackOnMap",this.onSelectTrack);this.onMessage("showElevationMarker",this.onShowElevationMarker);this.onMessage("hideElevationMarker",this.onHideElevationMarker);this.onMessage("panBy",this.onPanBy);},render:function(){var c={zoom:this.startZoom,center:new google.maps.LatLng(this.startLocation.lat,this.startLocation.lon),mapTypeId:google.maps.MapTypeId.HYBRID,mapTypeControl:true,mapTypeControlOptions:{style:google.maps.MapTypeControlStyle.DEFAULT,position:google.maps.ControlPosition.TOP_RIGHT},panControl:false,zoomControl:false,streetViewControl:false,zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL}};this.map=new google.maps.Map(this.renderContainer,c);var d=google.maps.event.addListener(this.map,"tilesloaded",b.bind(function(e){this.tracksManager.getTracksFromDataSource();this.sendMessage("mapReady");google.maps.event.removeListener(d);},this));return this;},setZoom:function(c){if(!c){return;}this.map.setZoom(c);},setCenter:function(d){if(!d||!d.lat||!d.lon){return;}var c=new google.maps.LatLng(d.lat,d.lon);if(this.centerMarker){this.centerMarker.setPosition(c);}else{this.centerMarker=this.createMarker({icon:"assets/images/target-icon.png",position:{lat:d.lat,lon:d.lon}});}this.map.setCenter(c);},createMarker:function(d){var e=d.hideMarker?null:this.map,c=(d.position&&(!d.position.lat||!d.position.lon))?d.position:new google.maps.LatLng(d.position.lat,d.position.lon);return new google.maps.Marker({map:e,icon:d.icon,position:c});},addTracks:function(e){for(var f=0;f<e.length;f++){var c=e[f];var d=this.createMarker({icon:c.startMarkerUrl,position:c.getStartTrackPoint()});var g=this.createMarker({icon:c.endMarkerUrl,position:c.getEndTrackPoint(),hideMarker:true});d.track=c;c.startMarker=d;g.track=c;c.endMarker=g;this.addStartTrackMarkerListeners(d);this.markers.push(d);this.markers.push(g);}},removeTracks:function(){for(var c=0;c<this.markers.length;c++){this.markers[c].track.mapTrack.setMap(null);this.markers[c].setMap(null);}this.removeTooltip();},addStartTrackMarkerListeners:function(c){google.maps.event.addListener(c,"click",b.bind(function(){this.onTrackMarkerClick(c);},this));google.maps.event.addListener(c,"mouseover",b.bind(function(d){if(this.app.state==b.App.States.TRACK_INFO){return;
}this.onTrackMarkerOver(c);},this));google.maps.event.addListener(c,"mouseout",b.bind(function(d){if(this.app.state==b.App.States.TRACK_INFO){return;}this.removeTooltip();},this));},selectTrack:function(c){if(!c){return;}this.removeTooltip();this.deselectTrack(this.lastTrack);if(this.lastTrack&&this.lastTrack.index==c.index){this.lastTrack=null;return;}this.showTooltip(c.startMarker,true);c.mapTrack.setMap(this.map);this.map.fitBounds(c.bounds);this.sendMessage("showElevationProfile",c);this.sendMessage("changeState",{state:b.App.States.TRACK_INFO});this.lastTrack=c;this.lastTrack.endMarker.setMap(this.map);},deselectTrack:function(c){if(!c){return;}this.lastTrack.endMarker.setMap(null);c.mapTrack.setMap(null);this.sendMessage("reverseState");},showTooltip:function(c,d){this.removeTooltip();var e=this.mustache(this.templates.tooltipTemplate,{track:c.track,fullDetails:d});var g=d?"../../assets/images/close.png":"";var f=d?new google.maps.Size(-136,-155):new google.maps.Size(-136,-125);this.tooltip=new InfoBox({content:e,closeBoxURL:g,closeBoxMargin:"5px 5px 0px 0px",pixelOffset:f});this.tooltip.open(this.map,c);},removeTooltip:function(){if(this.tooltip){this.tooltip.close();}},onUserGeocoded:function(c){if(!c||!c.lat||!c.lon){return;}this.setCenter(c);this.setZoom(this.zoom);},onUserNotGeocoded:function(c){},onShowTracks:function(c){this.removeTracks();this.addTracks(c);if(this.app.state==b.App.States.SEARCH||this.app.state==b.App.States.DEFAULT){this.map.fitBounds(this.geoOperations.getTracksStartPointBounds(c));}},onFitMapToBounds:function(c){this.map.fitBounds(c);},onSetCenter:function(c){this.setCenter(c);},onSetZoom:function(c){this.setZoom(c);},onSearchTracksNearLocation:function(c){if(!c||!c.location||!c.searchRadius){return;}this.setCenter(c.location);this.searchTracksNearLocation(c.location,c.searchRadius);},onStateChanged:function(c){if(c.currentState==b.App.States.TRACK_INFO){}if(c.lastState==b.App.States.TRACK_INFO){}},onShowTrackTooltip:function(c){this.onTrackMarkerOver(c.startMarker);},onSelectTrack:function(c){this.selectTrack(c);},onShowElevationMarker:function(c){if(!c||!c.position){return;}if(this.elevationMarker){this.elevationMarker.setMap(null);}this.elevationMarker=this.createMarker(c);},onHideElevationMarker:function(){if(this.elevationMarker){this.elevationMarker.setMap(null);}},onPanBy:function(c){if(!c){return;}this.map.panBy(c.x,c.y);},onTrackMarkerClick:function(c){this.selectTrack(c.track);this.sendMessage("selectTrackInList",c.track);},onTrackMarkerOver:function(c){if(this.app.state==b.App.States.TRACK_INFO||this.map.getZoom()>8){return;}this.showTooltip(c,false);}});b.MapView=a;}(TRACKS));(function(a){var b="#search-input";var c=a.View.extend({events:{"#search img":{click:"onSearchIconClick"},"#search-input":{keyup:"onKeyUp"},"#suggestions a":{click:"onSuggestionClick"}},init:function(d){this._parent(d);this.searchRadius=d.searchRadius||100;this.countryCode=d.countryCode;this.dataManager.on("userGeocoded",a.bind(this.onUserGeocoded,this));this.dataManager.on("userNotGeocoded",a.bind(this.onUserNotGeocoded,this));},register:function(){this.onMessage("openSearch",this.onOpenSearch);this.onMessage("closeSearch",this.onCloseSearch);this.onMessage("stateChanged",this.onStateChanged);},render:function(){this.container.innerHTML=this.mustache(this.templates.main,{});this.toggle();return this;},focus:function(){a.one(b,this.container).focus();},searchLocationData:function(d){this.searchInputText=d||this.getInputValue();if(!this.searchInputText){return;}this.dataManager.geocode(this.searchInputText,this.countryCode,true,{success:a.bind(function(g){if(g.length==0){return;}var e=[];for(var f=0;f<3;f++){if(g[f]){e.push(g[f]);}}this.addSuggestions(e);},this)});},search:function(g){this.sendMessage("changeState",{state:a.App.States.SEARCH});var f=new google.maps.LatLng(g.lat,g.lon);var k=new google.maps.LatLngBounds(new google.maps.LatLng(g.bounds[0],g.bounds[1]),new google.maps.LatLng(g.bounds[2],g.bounds[3]));var j=this.geoOperations.getPointAtDistanceFromPoint(f,45,this.searchRadius);var i=this.geoOperations.getPointAtDistanceFromPoint(f,135,this.searchRadius);var e=this.geoOperations.getPointAtDistanceFromPoint(f,245,this.searchRadius);var h=new google.maps.LatLngBounds(e,j);h.extend(i);var d=this.geoOperations.getTracksInBounds(this.tracksManager.tracks,h);if(d&&d.length>0){this.tracksManager.tracks=d;this.sendMessage("showTracks",d);}else{this.sendMessage("noTracksToShow");this.sendMessage("fitMapToBounds",k);}},addSuggestions:function(d){if(!d||d.length==0){return;}this.sendMessage("closeList");this.suggestions=d;var e=a.one("#suggestions",this.container);e.innerHTML=this.mustache(this.templates.suggestions,{suggestions:d,});a.css(e,"display","block");},removeSuggestions:function(){var d=a.one("#suggestions",this.container);d.innerHTML="";a.css(d,"display","none");this.suggestions=[];},setInputValue:function(d){a.one(b,this.container).value=d;},getInputValue:function(){return a.one(b,this.container).value;},isOpen:function(){return jQuery("#search input").css("left")=="0px"?true:false;},toggle:function(){if(this.isOpen()){this.close();}else{this.open();this.focus();}},open:function(){if(this.isOpen()){return;}jQuery("#search input").animate({left:0},200,null);jQuery("#search img").animate({left:"290px"},200,null);},close:function(){if(!this.isOpen()){return;}this.removeSuggestions();jQuery("#search input").animate({left:"-=290px"},200,null);jQuery("#search img").animate({left:0},200,null);},onSearchIconClick:function(d){this.toggle();},onKeyUp:function(d){var e=this.getInputValue();if(e.length>2){this.searchLocationData();}},onSuggestionClick:function(d){var f=d.target.id.split("-")[1];var e=this.suggestions[f];this.setInputValue(e.address);this.removeSuggestions();this.sendMessage("changeState",{state:a.App.States.SEARCH});this.search(e);},onUserGeocoded:function(d){if(!d||!d.address){return;}this.setInputValue(d.address);this.search(d);this.open();},onUserNotGeocoded:function(){this.removeSuggestions();
this.sendMessage("showTracks",this.tracksManager.allTracks);this.sendMessage("changeState",{state:a.App.States.DEFAULT});},onOpenSearch:function(){this.open();this.focus();this.setInputValue("");},onCloseSearch:function(){this.close();},onStateChanged:function(d){if(d.currentState===a.App.States.TRACK_INFO){this.close();}}});a.SearchView=c;}(TRACKS));(function(b){var a=b.View.extend({selectedTrackIndex:-1,events:{"#list #list-toggle":{click:"onListToggleClick"},"#list #article":{click:"onLinksClick"},"#list #download":{click:"onLinksClick"},"#list .track":{click:"onTrackClick",hover:"onTrackHover"},"#list #search":{click:"onOpenSearch"},"#list #all-tracks":{click:"onShowAllTracks"}},init:function(c){this._parent(c);this.noTracksMsg=c.noTracksMsg?c.noTracksMsg:"No tracks found!";this.onReady=c.onReady;if(this.onReady){b.bind(this.onReady,this);}},register:function(){this.onMessage("showTracks",this.onShowTracks);this.onMessage("noTracksToShow",this.onNoTracksToShow);this.onMessage("closeList",this.onCloseList);this.onMessage("selectTrackInList",this.onSelectTrack);this.onMessage("stateChanged",this.onStateChanged);},render:function(){if(!this.tracks||this.tracks.length==0){this.container.innerHTML=this.mustache(this.templates.empty,{message:this.noTracksMsg});}else{this.container.innerHTML=this.mustache(this.templates.main,{tracks:this.tracks,nbTracks:this.tracks.length});}if(this.onReady){this.onReady();}return this;},toggleList:function(){var c=jQuery("#list").css("left")=="0px"?true:false;if(c){this.close();}else{this.open();}},toggleTrackDetails:function(c){if(c===-1){return;}if(jQuery("#list #trackitem-"+c+" #track-parameters").css("display")==="none"){jQuery("#list #trackitem-"+c+" #preview").css("width","90px");jQuery("#list #trackitem-"+c+" #preview").css("height","auto");}else{jQuery("#list #trackitem-"+c+" #preview").css("width","60px");jQuery("#list #trackitem-"+c+" #preview").css("height","30px");}jQuery("#list #trackitem-"+c+" #track-parameters").toggle("fast");},open:function(){var c=jQuery("#list").css("left")=="0px"?true:false;if(!c){jQuery("#list").animate({left:0},200,null);}},close:function(){var c=jQuery("#list").css("left")=="0px"?true:false;if(c){jQuery("#list").animate({left:"-=330px"},200,null);}},selectTrack:function(c){if(c!==this.selectedTrackIndex){this.toggleTrackDetails(this.selectedTrackIndex);this.toggleTrackDetails(c);this.selectedTrackIndex=c;}else{this.toggleTrackDetails(c);this.selectedTrackIndex=-1;}},onListToggleClick:function(){this.toggleList();},onTrackClick:function(d){var e=parseInt(d.currentTarget.id.split("-")[1]);this.selectTrack(e);var c=this.tracksManager.getTrackByIndex(e);this.sendMessage("selectTrackOnMap",c);},onTrackHover:function(d){var e=parseInt(d.currentTarget.id.split("-")[1]);var c=this.tracksManager.getTrackByIndex(e);this.sendMessage("showTrackTooltip",c);},onShowTracks:function(c){if(!c||c.length===0){return;}this.tracks=c;this.render();this.open();},onNoTracksToShow:function(){this.render();this.open();},onSelectTrack:function(c){if(!c){return;}this.selectTrack(c.index);},onCloseList:function(){this.close();},onLinksClick:function(c){c.stopPropagation();},onStateChanged:function(c){if(c.currentState===b.App.States.TRACK_INFO){this.close();}},onOpenSearch:function(){this.sendMessage("openSearch");this.close();},onShowAllTracks:function(){this.sendMessage("showTracks",this.tracksManager.allTracks);}});b.ListView=a;}(TRACKS));(function(a){var b=a.View.extend({events:{"#elvation-profile-toggle":{click:"onElevationProfileClick"}},init:function(c){this._parent(c);this.xAxisName=c.xAxisName?c.xAxisName:"Distance (km)";this.yAxisName=c.yAxisName?c.yAxisName:"Altitude (m)";},register:function(){this.onMessage("showElevationProfile",this.onShowElevationProfile);},render:function(c){if(!c||!c.hasElevationProfile()){return;}var e=this.generateElevationProfileData(c);var d={width:700,height:170,hAxis:{title:this.xAxisName,titleTextStyle:{color:"#333"}},vAxis:{title:this.yAxisName,minValue:0,titleTextStyle:{color:"#333"}},legend:"none"};this.elevationProfileChart=new google.visualization.AreaChart(this.renderContainer);this.elevationProfileChart.draw(e,d);google.visualization.events.addListener(this.elevationProfileChart,"onmouseover",a.bind(this.onElevationProfileOver,this));google.visualization.events.addListener(this.elevationProfileChart,"onmouseout",a.bind(this.onElevationProfileOut,this));this.open();},generateElevationProfileData:function(c){var e=new google.visualization.DataTable();e.addColumn("number",this.xAxisName);e.addColumn("number",this.yAxisName);for(var d=0;d<c.elevationPoints.length;d++){e.addRow([c.getDistanceFromStart(d),parseInt(c.elevationPoints[d])]);}return e;},toggle:function(){var c=jQuery("#elevation-profile").css("bottom")=="0px"?true:false;if(c){this.close();}else{this.open();}},open:function(){var c=jQuery("#elevation-profile").css("bottom")=="0px"?true:false;if(!c){this.sendMessage("panBy",{x:0,y:100});jQuery("#elevation-profile").animate({bottom:0},200,null);}},close:function(){var c=jQuery("#elevation-profile").css("bottom")=="0px"?true:false;if(c){this.sendMessage("panBy",{x:0,y:-100});jQuery("#elevation-profile").animate({bottom:"-=170px"},200,null);}},onElevationProfileClick:function(){if(!this.track||!this.track.hasElevationProfile()){return;}this.toggle();},onElevationProfileOver:function(c){this.sendMessage("showElevationMarker",{icon:"assets/images/marker-small.png",position:{lat:this.track.points[c.row].lat(),lon:this.track.points[c.row].lng()}});},onElevationProfileOut:function(){this.sendMessage("hideElevationMarker");},onShowElevationProfile:function(c){if(!c){return;}this.track=c;this.render(c);}});a.ElevationProfileView=b;}(TRACKS));(function(a){var b=a.MsgManager.extend({views:[],state:null,lastState:null,init:function(c){this._parent();this.state=c.state;this.language=c.language;this.addViews(c.views||[]);this.appReady=c.appReady;this.register();a.DataManager.getInstance().app=this;},addView:function(c){if(!c){return;
}c.app=this;if(this.views.indexOf(c)==-1){this.views.push(c);}},addViews:function(c){for(var d=0;d<c.length;d++){this.addView(c[d]);}},removeView:function(c){},register:function(){this.onMessage("changeState",this.onChangeState);this.onMessage("reverseState",this.onReverseState);},start:function(){if(this.language){a.LanguageManager.getInstance().loadLanguage(this.language,a.bind(function(){this._start();},this));}else{this._start();}},_start:function(){for(var c=0;c<this.views.length;c++){this.views[c].render();}this.changeState(this.state||"home");if(this.appReady){this.appReady.call(this,[]);}},changeState:function(e,f){if(e==this.state&&this.lastState!=null){return;}this.lastState=this.state;this.state=e;for(var d=0;d<this.views.length;d++){var c=this.views[d];if(c.hideOnStates.indexOf(this.state)!=-1){this.hideView(c);}else{this.showView(c);}}this.sendMessage("stateChanged",{currentState:this.state,lastState:this.lastState});},hideView:function(c){a.addClass(c.container,"hide-view");this.sendMessage("hideView",c.container);},showView:function(c){a.removeClass(c.container,"hide-view");this.sendMessage("showView",c.container);},onChangeState:function(c){this.changeState(c.state);},onReverseState:function(c){this.changeState(this.lastState);}});a.App=b;a.App.States={};a.App.States.DEFAULT="default";a.App.States.SEARCH="search";a.App.States.TRACK_INFO="trackinfo";}(TRACKS));