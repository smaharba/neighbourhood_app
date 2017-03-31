"use strict";

var fsqrData = [];
var chosen;
var searchFor = '';
var appView;
var myJson = [];
var fsqrElem = $('#fsqr-articles');
fsqrElem.text('');

//only gets triggered if the FQDN is incorrect or if something else goes wrong. But if it's only the key which is incorrect then this function will not be triggered  
function googleError() {
    alert('Google Error!');
    var mapErrorMessage = '<h3>Problem retrieving Map Data. Please reload the page to retry!</h3>';
      $("#map-error").html(mapErrorMessage);
}

//pull the model data from the server
function getAreas() {
    $.getJSON("https://api.myjson.com/bins/r7e1r")
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
    ko.applyBindings(new AppViewModel(myJson));
    initMap(myJson);
    }).fail(function(e){
        alert('Something went wrong! Unable to load data to show the areas list.');
    });
    return false;
}

//store the areas data
var Area = function(data) {
    this.areaId = ko.observable(data.id);
    this.areaId = data.id;
    this.areaName = data.name;
    this.loc = data.loc;
};

//for each new Poi (a single search result) use this data
var Poi = function(data) {
    this.poiId = data.id;
    this.poiName = data.name;
};

function AppViewModel(myAreas) {
    this.searchTerm = ko.observable();
    this.showRightHandList = ko.observable(false);
    this.showResults = ko.observable(true);
    this.submitted = ko.observable(false);
    this.myAreas = ko.observableArray([{'areaId': false, 'areaName': 'Choose an Area:', 'loc': false}]);
    this.myPois = ko.observableArray([]);
    this.chosenArea = ko.observable();
    this.fsqrFailText = ko.observable();
    var self = this;

    // walk through the model and fill the 'myAreas' array with all items in it
    myAreas.forEach(function(index){
        self.myAreas.push( new Area(index) );
    });

    //gets triggered by the submit function after the foursquare response has been handled:
    this.setPois = function(poiListing){
        //clear array
        self.myPois().length = 0;
        //walk through
        poiListing.forEach(function(index){
            self.myPois.push( new Poi(index) );
        });
    };

    //a click on the form makes the result window disappear
    this.clearInfo = function() {
        this.showRightHandList(false);
    };

    //to be able to call the appViewModel later on:
    appView = self;
}//end appViewModel

//fsqr:
this.submit = function() {
    appView.submitted(true);
    appView.showRightHandList(true);
    searchFor = appView.searchTerm();
    chosen = appView.chosenArea();
    // !!empty the fsqrData array, otherwise obsolete markers will pop up
    fsqrData.length = 0;
    fsqrElem.empty();

    // check if a neighborhood has been chosen and a search term entered
    if(chosen.areaId === '' || chosen.areaId === undefined || chosen.areaId === false || searchFor === '' || searchFor === undefined) {
        alert('Please choose a neighborhood and fill in a search term');
        appView.showRightHandList(false);
        return;
    }

    var latLng = chosen.loc.lat + ',' + chosen.loc.lng;

    // store the search data in the url:
    var fsqrUrl = 'https://api.foursquare.com/v2/venues/search?client_id=XV45PHON55RFFRM3GNN1BODO2NWH45LCGBKPVQWLOKGUI4XA&client_secret=YVKQJGWU1G2TH1BGQXHULAGHOYDL443Z3HPQ0JBFCJWM4QPD&v=20130815&ll=' + latLng + '&query=' + searchFor + '&intent=checkin&limit=5&radius=1000';

    //foursquare jquery json request:
    $.getJSON(fsqrUrl, function(data){
        var dataResp = data.response.venues;
        $.each(dataResp, function (i, dataResp) {
            // check if dataResp.categories is present (it will break if it is not!) and fill the array
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
            // if dataResp.categories is not present fill the array and use fixed data to fill the holes (iconPre + iconSuf)
            else if (!dataResp.categories[0]){
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

        // some returned values are 'undefined', replace them with ' '
        $.each(fsqrData, function (index, value) {
            if(value.url === undefined) {
                value.url = ' ';
            }
            if(value.phone === undefined) {
                value.phone = ' ';
            }
            // formattedAddress is an array of three:
            for(var i = 0; i < 3; i++){
                if(value.address[i] === undefined){
                    value.address[i] = ' ';
                }
            }
        });

        // check if there are any results, if not, notify
        var rightHandList = function(fsqrData){
            if(fsqrData.length === 0){
                fsqrElem.append('<span class="article">Sorry, no results found!</span>');
                appView.showResults(false);
            }
            else {appView.showResults(true);}
        };
        appView.setPois(fsqrData);
        rightHandList(fsqrData);
        initMap(fsqrData, appView);
    }).fail(function(e){
        appView.fsqrFailText('Foursquare results could not be loaded');
    });
    return false;
};//end submit()

//the map:
var centerOn = {lat: 52.539722, lng: 13.431667};
var map;
var myMarker;
var myMarkers = [];
var markerFsqr;
var markersFsqr = [];
var iconMarkerFsqr;
var posMarkerFsqr = {};
// Function to initialize the map within the map div:
var initMap = function() {
    var chosenAreaId = false;
    chosenAreaId = appView.chosenArea().areaId;
//     var chosenArea = appView.chosenArea();
    var myJsonLocations = myJson;
    //adjust zoom to match width
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var zoomLevel = 14;
    if(w > 400 && w <= 1000){
        zoomLevel = 13;
    }
    if(w <= 400) {
        zoomLevel = 12;
    }

    // Create a styles array to use with the map.
    var styles = 
[{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.province","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.locality","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.neighborhood","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.land_parcel","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#9dbecb"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#96becd"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.medical","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.place_of_worship","elementType":"geometry.fill","stylers":[{"color":"#ffc540"}]},{"featureType":"poi.school","elementType":"geometry.fill","stylers":[{"color":"#2d7488"}]},{"featureType":"poi.sports_complex","elementType":"geometry.fill","stylers":[{"color":"#9fdbea"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#7da4b3"},{"saturation":"0"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#b5cfd9"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"labels.text.stroke","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#fbffcb"}]},{"featureType":"transit.line","elementType":"geometry.fill","stylers":[{"color":"#c9dbff"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#beddff"}]},{"featureType":"transit.station.bus","elementType":"geometry.fill","stylers":[{"color":"#c0dff4"}]},{"featureType":"transit.station.rail","elementType":"geometry.fill","stylers":[{"color":"#00708b"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#79b7cd"}]}];

    // show the map
    map = new google.maps.Map(document.getElementById('map'), {
     center: centerOn,
     styles: styles,
     zoom: zoomLevel,
     mapTypeControl: false
    });

    //show my markers on the map
    for(var i = 0; i < myJsonLocations.length; i++){
    var infowindow = new google.maps.InfoWindow({maxWidth: 100});
        var img = 'img/pin.png';
        myMarker = new google.maps.Marker({
            position: myJsonLocations[i].loc,
            map: map,
            icon: img
        });
        myMarkers.push(myMarker);

        //make the chosen area bounce on submit
        //TODO: find a way to make the bouncing stop. Why doesn't setTimeout work?
        if(i === chosenAreaId){
            myMarker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ 
                myMarker.setAnimation(null); 
                }, 2100);
        }

        //on submit make the not chosen markers disappear
        if(i !== chosenAreaId && appView.submitted() === true) {
            myMarker.setMap(null);
        }

        // add click listeners to markers
        google.maps.event.addListener(myMarker, 'click', (function(myMarker, i) {
            return function() {
                    myMarker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        myMarker.setAnimation(null);
                    }, 2100);
                var contentString = '<div class="infowindow"><h3 class = "infoWindowHeading">' + myJsonLocations[i].name + '</h3><p><br>Click on the map to show more information</p></div>';
                infowindow.setContent(contentString);
                infowindow.open(map, myMarker);
                map.panTo(myJsonLocations[i].loc);
                };
        })(myMarker, i));
    }/* end first for */

    //the coloured polygons of the areas on the map:
    var poly;
    var polygons = [];
    var infowindow2 = new google.maps.InfoWindow({maxWidth: 150});
    var opacity;
    //make the chosen area stand out and ther not chosen areas lighter
    for(i = 0; i < myJsonLocations.length; i++){
        if(chosenAreaId === false){
            opacity = 0.4;
        }
        else if(chosenAreaId === i){
            opacity = 0.8;
        }
        else if(chosenAreaId !== i){
            opacity = 0.2;
        }

        //make the polygons:
        poly = new google.maps.Polygon({
            paths: myJsonLocations[i].coords,
            strokeColor: 'black',
            strokeOpacity: 0.8,
            strokeWeight: 0.5,
            fillColor: myJsonLocations[i].fill,
            fillOpacity: opacity,
            position: myJsonLocations[i].loc
        });
        polygons.push(poly);
        poly.setMap(map);

        // add click listener to the polygon:
        google.maps.event.addListener(poly, 'click', (function (poly, i){
            return function() {
                //fill the infowindow with the relevant content
                var contentString = '<div><h3 class = "infoWindowHeading">' + myJsonLocations[i].name + '</h3><p><br>' + myJsonLocations[i].info + '<img src = "' + myJsonLocations[i].img + '"></p></div><div id="pano"></div>';
                infowindow2.setContent(contentString);
                infowindow2.open(map, poly);
                map.panTo(myJsonLocations[i].loc);
            };
        })(poly, i));
        poly.setMap(map);
    }//end second for

    //FOURSQUARE on the map:
    //fill in all the data from the foursquare query:
    var nameMarkerFsqr = [];
    var addressMarkerFsqr = [];
    var phoneMarkerFsqr = [];
    var urlMarkerFsqr = [];
    var poiList = document.getElementsByClassName('poiList');

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

        // add click listener to the foursquare markers to show the foursquare info
        markerFsqr.addListener('click', function() {
            var contentString = '<div class="infowindow"><h3 class = "infoWindowHeading">' + nameMarkerFsqr[index] + '</h3><p> ' + addressMarkerFsqr[index][0] + '  <br> ' + addressMarkerFsqr[index][1] + '<br>' + addressMarkerFsqr[index][2] + '<br>' + phoneMarkerFsqr[index] + '   <br><a title="This link will open in a new tab" href = " ' + urlMarkerFsqr[index] + '" target="_blank" >' + urlMarkerFsqr[index] + '</a></p></div>';
            infowindow.setContent(contentString);
            infowindow.open(map, this);
            map.panTo(myJsonLocations[index].loc);
        });
        markersFsqr.push(markerFsqr);

        var thisPoi = poiList[index];

        // add click listener to the fsqrList to show the infowindow filled with the relevant info
        google.maps.event.addDomListener(thisPoi, 'click', (function(markerFsqr, index){
            var contentString = '<div class="infowindow"><h3 class = "infoWindowHeading">' + nameMarkerFsqr[index] + '</h3><p> ' + addressMarkerFsqr[index][0] + '  <br> ' + addressMarkerFsqr[index][1] + '<br>' + addressMarkerFsqr[index][2] + '<br>' + phoneMarkerFsqr[index] + '   <br><a title="This link will open in a new tab" href = " ' + urlMarkerFsqr[index] + '" target="_blank" >' + urlMarkerFsqr[index] + '</a></p></div>';
            return function() { 
                markerFsqr.setAnimation(null);
                markerFsqr.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    markerFsqr.setAnimation(null);
                }, 2100);
                infowindow.setContent(contentString);
                infowindow.open(map, markerFsqr);
                map.panTo(myJsonLocations[index].loc);
            };
        })(markerFsqr, index));
    });
};// end initMap()