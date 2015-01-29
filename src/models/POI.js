(function( TRACKS )
 {
    var POI = function (id, name, latitude, longitude, article, preview, index, markerUrl) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.point = new google.maps.LatLng(latitude, longitude);
        this.article = article;
        this.preview = preview;
        this.index = index;
        this.startMarkerUrl = markerUrl || "assets/images/poi-marker.png";
    };

    POI.prototype = {
    };

    TRACKS.POI = POI;

})(TRACKS);