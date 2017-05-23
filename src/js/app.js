var myJson = [];
//googleError() only gets triggered if the FQDN is incorrect or if something else goes wrong. But if it's only the key which is incorrect then this function will not be triggered and the default google maps error notification will be shown 
function googleError() {
    ko.applyBindings(new ErrorViewModel());
}

function ErrorViewModel() {
    this.googleErr = ko.observable('Sorry. Google Maps failed to load. Please try again later.');
    return false;
}

//pull THE MODEL data from the server
function getAreas() {
    $.getJSON("https://api.myjson.com/bins/a90g1")
        .done(function(data){
            var dataResp = data;
            $.each(dataResp, function (i, dataResp) {
                myJson.push({
                    id: dataResp.id,
                    name: dataResp.name,
                    loc: dataResp.loc,
                    info: dataResp.info,
                    coords: dataResp.coords,
                    fill: dataResp.fill,
                    img: dataResp.img
                });
            });
            runApplication(myJson);
        }).fail(function(e){
    alert('Something went wrong! Unable to load data to show the areas list.');
    });
    return false;
}

function runApplication(myJson){
    //Note: fsqr = Foursquare
    "use strict";
    var map,
    infowindow,
    fsqrInfowindow,
    bounds,
    iconMarkerFsqr,
    getFsqrContent,
    searchFor;
    var img = 'img/pin.png';
    var chosen = false;
    var centerOn = {lat: 52.535722, lng: 13.414487};
    var myMarkers = [];
    var markersFsqr = [];
    var posMarkerFsqr = {};
    var fsqrData = [];

    //get the viewport width and height
    var vwWidth = function(){
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        return w;
        };

    var vwHeight = function(){
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        return h;
    };

    //adjust the zoomlevel of the map for small devices
    var zoomLevel = function(){
        var width = vwWidth();
        var zoom = 13;
        if(width <= 400) {zoom = 12;}
        return zoom;
    };

    // Create a styles array to use with the map.
    var styles = 
[{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.province","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.locality","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.neighborhood","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.land_parcel","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#9dbecb"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#96becd"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.medical","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.place_of_worship","elementType":"geometry.fill","stylers":[{"color":"#ffc540"}]},{"featureType":"poi.school","elementType":"geometry.fill","stylers":[{"color":"#2d7488"}]},{"featureType":"poi.sports_complex","elementType":"geometry.fill","stylers":[{"color":"#9fdbea"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#7da4b3"},{"saturation":"0"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#b5cfd9"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"labels.text.stroke","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#fbffcb"}]},{"featureType":"transit.line","elementType":"geometry.fill","stylers":[{"color":"#c9dbff"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#beddff"}]},{"featureType":"transit.station.bus","elementType":"geometry.fill","stylers":[{"color":"#c0dff4"}]},{"featureType":"transit.station.rail","elementType":"geometry.fill","stylers":[{"color":"#00708b"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#79b7cd"}]}];

    map = new google.maps.Map(document.getElementById("map"), {
        center: centerOn,
        styles: styles,
        zoom: zoomLevel(),
        mapTypeControl: false,
        mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        }
    });

    infowindow = new google.maps.InfoWindow({
        maxWidth: 100,
        content: ""
    });

    fsqrInfowindow = new google.maps.InfoWindow({
        maxWidth: 150,
        content: ""
    });

    bounds = new google.maps.LatLngBounds();

    // Recenter map upon window resize
    window.onresize = function () {
        map.fitBounds(bounds);
        map.panTo(centerOn);
    };

    //store the areas data
    var Area = function(data) {
        this.areaId = data.id;
        this.areaName = data.name;
        this.loc = data.loc;
        this.areaInfo = data.info;
        this.areaCoords = data.coords;
        this.fill = data.fill;
        this.areaImg = data.img;
        this.myMarker = '';
    };

    //for each new Poi (a single search result) use this data
    var Poi = function(data) {
        this.poiId = data.id;
        this.poiName = data.name;
        this.lat = data.lat;
        this.lng = data.lng;
    };

    function AppViewModel() {
        this.googleErr = ko.observable();
        this.searchTerm = ko.observable();
        this.showItemList = ko.observable(false);
        this.showResults = ko.observable(true);
        this.myAreas = ko.observableArray([]);
        this.myPois = ko.observableArray([]);
        this.currentArea = ko.observable();
        this.chosenArea = ko.observable();
        this.fsqrFailText = ko.observable();
        this.fsqrNoResult = ko.observable('');
        this.showHideAreaList = ko.observable(true);
        this.showForm = ko.observable(true);
        this.infoText1 = ko.observable('First...');
        this.infoText2 = ko.observable('Then...');
        this.showAgainBtn = ko.observable(false);
        var self = this;

        // walk through the model and fill the 'myAreas' array with all items in it
        myJson.forEach(function(index){
            self.myAreas.push( new Area(index) );
        });

        //gets triggered after the foursquare response has been handled:
        this.setPois = function(poiListing){
            //clear array
            self.myPois().length = 0;
            //walk through
            poiListing.forEach(function(index){
                self.myPois.push( new Poi(index) );
            });
        };

        var bounceMarker = function(marker){
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    marker.setAnimation(null);
                }, 2100);
        };

        this.setMapOnAll = function(map) {
            for (var i = 0; i < markersFsqr.length; i++) {
                markersFsqr[i].setMap(map);
            }
        };

        this.removeMarkers = function(){
            self.setMapOnAll(null);
            markersFsqr = [];
        };

        this.showAreaList = function() {
            self.showHideAreaList(true);
        };

        this.hideFsqr = function(){
            self.showItemList(false);
            self.showHideAreaList(true);
            map.panTo(centerOn);
            infowindow.close(infowindow);
        };

        this.itemListClick = function(value) {
            self.showAgainBtn(true);
            self.showForm(false);
            self.infoText1('New search term?');
            self.infoText2('New area?');
            google.maps.event.trigger(value.myMarker, "click");
            //set the chosen area
            self.currentArea(self.myAreas()[value.areaId]);
            self.chosenArea(self.currentArea().areaName);
            chosen = self.currentArea();
            //store the seachterm
            searchFor = self.searchTerm();
            // !!empty the fsqrData array, otherwise obsolete markers will pop up
            fsqrData.length = 0;
            var centerOnItem = {lat: chosen.loc.lat, lng: chosen.loc.lng};
            map.panTo(centerOnItem);

            // check if a search term was entered and show/hide itemList and form
            if(searchFor === '' || searchFor === undefined) {
                self.showItemList(false);
                return false;
            }
            else {
                self.showItemList(true);
                if(vwHeight() <= 800){
                    self.showHideAreaList(false);
                }
            }
            var latLng = chosen.loc.lat + ',' + chosen.loc.lng;

        //store the search data in the url:
        var fsqrUrl = 'https://api.foursquare.com/v2/venues/search?client_id=XV45PHON55RFFRM3GNN1BODO2NWH45LCGBKPVQWLOKGUI4XA&client_secret=YVKQJGWU1G2TH1BGQXHULAGHOYDL443Z3HPQ0JBFCJWM4QPD&v=20130815&ll=' + latLng + '&query=' + searchFor + '&intent=checkin&limit=5&radius=1000';       
            //foursquare jquery json request:
            $.getJSON(fsqrUrl, function(data){
                var dataResp = data.response.venues;
                $.each(dataResp, function (i, dataResp) {
                    //put the foursquare response in the fsqrData array
                    // but check if dataResp.categories is present
                    // (it will break if it is not!)
                    if(dataResp.categories[0]){
                        fsqrData.push({
                            id: i,
                            name: dataResp.name,
                            lat: dataResp.location.lat,
                            lng: dataResp.location.lng,
                            address: dataResp.location.formattedAddress,
                            phone: dataResp.contact.formattedPhone,
                            url: dataResp.url,
                            iconPre: dataResp.categories[0].icon.prefix,
                            iconSuf: dataResp.categories[0].icon.suffix
                        });
                    }
                    // if dataResp.categories is not present fill the array
                    // and use fixed data to fill the holes (iconPre + iconSuf)
                    else {
                        fsqrData.push({
                            id: i,
                            name: dataResp.name,
                            lat: dataResp.location.lat,
                            lng: dataResp.location.lng,
                            address: dataResp.location.formattedAddress,
                            phone: dataResp.contact.formattedPhone,
                            url: dataResp.url,
                            iconPre: 'https://ss3.4sqi.net/img/categories_v2/arts_entertainment/default_',
                            iconSuf: '.png'
                        });
                    }
                });
                
                // check if there are any results, if not, notify
                var checkResult = function(fsqrData){
                    if(fsqrData.length === 0){
                        self.fsqrNoResult('Sorry, no results found!');
                        self.showResults(false);
                    }
                    else {
                        self.fsqrNoResult('');
                        self.showResults(true);
                        }
                };
                self.setPois(fsqrData);
                checkResult(fsqrData);

                // some returned values are 'undefined', replace them with ''
                $.each(fsqrData, function (index, value) {
                    if(value.url === undefined) {
                        value.url = '';
                    }
                    if(value.phone === undefined) {
                        value.phone = '';
                    }
                    // formattedAddress is an array of three:
                    for(var i = 0; i < 3; i++){
                        if(value.address[i] === undefined){
                            value.address[i] = '';
                        }
                    }
                });

                //FOURSQUARE on the map:
                //fill in all the data from the foursquare query:
                var markerFsqr;
                var nameMarkerFsqr = [];
                var addressMarkerFsqr = [];
                var phoneMarkerFsqr = [];
                var urlMarkerFsqr = [];

                function addFsqrMarkers(){
                    //remove the old markers if there are any:
                    self.removeMarkers();

                    //walk through the data
                    $.each(fsqrData, function (index, value) {
                        posMarkerFsqr.lat = value.lat;
                        posMarkerFsqr.lng = value.lng;
                        nameMarkerFsqr.push(value.name);
                        addressMarkerFsqr.push(value.address);
                        phoneMarkerFsqr.push(value.phone);
                        urlMarkerFsqr.push(value.url);
                        iconMarkerFsqr = value.iconPre + 'bg_32' + value.iconSuf;
                        markerFsqr = new google.maps.Marker({
                            position: posMarkerFsqr,
                            map: map,
                            icon: iconMarkerFsqr
                        });

                        //assemble the info for the fsqrInfowindow
                        getFsqrContent = function(index){
                            var contentString = '<div class="infowindow"><h3 class = "infoWindowHeading">';
                            contentString += nameMarkerFsqr[index] + '</h3><p> ' ;
                            contentString += addressMarkerFsqr[index][0] + '  <br> ';
                            contentString += addressMarkerFsqr[index][1] + '<br>';
                            contentString += addressMarkerFsqr[index][2] + '<br>';
                            contentString += phoneMarkerFsqr[index] + '   <br><a title="This link will open in a new tab" href = " ';
                            contentString += urlMarkerFsqr[index] + '" target="_blank" >';
                            contentString += urlMarkerFsqr[index] + '</a></p></div>';
                            return contentString;
                        };

                        // add click listener to the foursquare markers to show the foursquare info
                        google.maps.event.addListener(markerFsqr, 'click', (function(markerFsqr, index) {
                            var content = getFsqrContent(index);
                            return function() {
                            bounceMarker(markerFsqr);
                            fsqrInfowindow.setContent(content);
                            fsqrInfowindow.open(map, this);
                            };
                        })(markerFsqr, index));
                        markersFsqr.push(markerFsqr);
                    });

                    // add click listener to the fsqrItemList to show the fsqrInfowindow filled with the relevant info
                    self.fsqrListClick = function(value) {
                        var index = value.poiId;
                        var content = getFsqrContent(index);
                        bounceMarker(markersFsqr[index]);
                        fsqrInfowindow.setContent(content);
                        fsqrInfowindow.open(map, markersFsqr[index]);
                    };
                }
                addFsqrMarkers();
                self.setMapOnAll(map);
            })
            .fail(function(e){
                self.fsqrFailText('Sorry. Something has gone wrong. The Foursquare server could not be reached');
            });//end getJson
            return false;
        };//end itemListClick()

        //set content for the area infoWindow
        function getContent(area){
            var showImg = '';
            if(vwHeight() >= 500){ var showImg = '<img src = "' + area.areaImg + '">'; }
            var contentString = '<div class="infoWindow"><p class="infoWindowHeading">' + area.areaName;
            contentString += '</p><p><br>' + area.areaInfo;
            contentString += showImg;
            contentString += '</p></div>';
            return contentString;
        }

        //place area markers on the map 
        $.each(self.myAreas(), function(index, area){
            var myMarker = new google.maps.Marker({
                position: area.loc,
                map: map,
                icon: img,
                animation: google.maps.Animation.DROP
            });
            myMarkers.push(myMarker);

            area.myMarker = myMarker;
            bounds.extend(myMarker.position);

            myMarker.addListener("click", function(e) {
                bounceMarker(myMarker);
                map.panTo(myMarker.position);
                infowindow.setContent(getContent(area));
                infowindow.open(map, myMarker);
            });
        });

        //the coloured polygons of the areas on the map:
        var poly;
        var polygons = [];

        this.myAreas().forEach(function(area){
            //make the polygons:
            poly = new google.maps.Polygon({
                paths: area.areaCoords,
                strokeColor: 'black',
                strokeOpacity: 0.8,
                strokeWeight: 0.5,
                fillColor: area.fill,
                fillOpacity: 0.4,
                position: area.loc,
            });
            polygons.push(poly);
            poly.setMap(map);
        });

      // Close infowindow when clicked elsewhere on the map, including the polygons
        map.addListener("click", function(){
            infowindow.close(infowindow);
        });

        $.each(polygons, function (index, value) {
            google.maps.event.addListener(value, 'click', (function(){
                infowindow.close(infowindow);})
            );
        });

        // filter for the areaList
        self.filter = ko.observable("");

        this.areaList = ko.dependentObservable(function() {
          var q = this.filter().toLowerCase();
          if (!q) {
          return ko.utils.arrayFilter(self.myAreas(), function(item) {
            item.myMarker.setVisible(true);
            return true;
          });
          } else {
            return ko.utils.arrayFilter(this.myAreas(), function(item) {
              if (item.areaName.toLowerCase().indexOf(q) >= 0) {
              return true;
              } else {
                item.myMarker.setVisible(false);
              return false;
              }
            });
          }
        }, this);
    }//end appViewModel
    ko.applyBindings(new AppViewModel());
}//end doStuff()