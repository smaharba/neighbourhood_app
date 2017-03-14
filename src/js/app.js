"use strict";
//app
//to togle the info text
$(function(){
    $('#info').click(function(){
        if($('.headerSubText').is(':visible')){
            $('.headerSubText').hide();}
        else {
            $('.headerSubText').show();}
    });
});

//store the results from the areas query (https:\//api.myjson.com/bins/90h9l) in here:
var myAreas = [];
//store the results from the foursquare query in here:
var fsqrData = [];

//areas json jquery request
function getAreas() {
    $.getJSON("https://api.myjson.com/bins/90h9l")
        .done(function(data){
        var dataResp = data;
        $.each(dataResp, function (i, dataResp) {
                myAreas.push({
                    id: dataResp.id,
                    name: dataResp.name,
                    loc: dataResp.loc,
                    info: dataResp.info,
                    coords: dataResp.coords,
                    fill: dataResp.fill,
                    img: dataResp.img
                });
        });
        ko.applyBindings(new AppViewModel());
        initMap();
    }).fail(function(e){
        alert('Areas results could Not Be Loaded');
    });
    return false;
}//end of getAreas()
getAreas();

//for each new Poi use this data
var Poi = function(myAreas) {
    this.name = ko.observable(myAreas.name);
    this.id = ko.observable(myAreas.id);
    this.select = ko.observable('0');
};

function AppViewModel() {
    var self = this;
    this.searchTerm = ko.observable('');
    this.poiList = ko.observableArray([]);
    // walk through the model and fill the 'poiList' array with all items in it
    myAreas.forEach(function(poiIndex){
        self.poiList.push( new Poi(poiIndex) );
    });
    // make the first item in it the current choice
    this.currentPoi = ko.observable(this.poiList()[0]);
    // when a liArea item is clicked:
    this.setPoi = function(clickedPoi) {
        //set select value to 0 (for the select functionality)
        for(var i = 0; i < myAreas.length; i++){
            self.poiList()[i].select('0');
        }
    // make the clicked item the current choice
    self.currentPoi(clickedPoi);
    //and set the value of selected to 1
    self.currentPoi().select('1');
    //first remove any 'selected' class, then set the 'selected' class where value === 1
    var areas = document.getElementsByClassName('liArea');
        for(i = 0; i < areas.length; i++){
            var bingo = areas[i];
            $(bingo).removeClass('selected');
            if(areas[i].value === 1){
                $(bingo).addClass('selected');
            }
        }
    };
}//end appViewModel

//fsqr
this.submit = function() {
    //to get myAreas into getFoursquareData:
    getFoursquareData(myAreas);
};

// both the list items as well as the map polygons can be clicked to set the selected class for an item
// the choose function detects the selected class of an item so it can be used in the fsqr query
var choose = function() {
    var names = document.getElementsByClassName("liArea");
    for(var i = 0; i < names.length; i++){
        if(names[i].classList.contains('selected')){
        return i;
        }
    }
};

var getFoursquareData = function(myAreas) {
    var chosen = choose(); // the index of the chosen area
    var fsqrElem = $('#fsqr-articles');
    fsqrElem.text("");
    var centerOn = myAreas[chosen].loc;// center on the chose area
    var searchFor = $("#inputSearch").val();// the search term
    var nameChosen = myAreas[chosen].name;//latitude and longitude for the query
    var latLng = myAreas[chosen].loc.lat + ',' + myAreas[chosen].loc.lng;
    var fsqrHeader = $('#fsqr-header');
    fsqrHeader.html('These are the results for  <span class="standOut">' + searchFor + '</span>  in the  <span class="standOut">' + nameChosen + '</span>  area:');

    // !!empty the fsqrData array, otherwise obsolete markers will pop up
    fsqrData.length = 0;
    fsqrElem.empty();

    // check if a neighborhood has been clicked, in the areaList or on the map
    if(chosen === '' || chosen === undefined) {
        alert('Please choose a neighborhood');
        return;
    }
    // check if a searchterm has been filled in
    if(searchFor === '') {
        alert('Please fill in a search term');
        return;
    }

    // store the search perimeters in the url:
    var fsqrUrl = 'https://api.foursquare.com/v2/venues/search?client_id=XV45PHON55RFFRM3GNN1BODO2NWH45LCGBKPVQWLOKGUI4XA&client_secret=YVKQJGWU1G2TH1BGQXHULAGHOYDL443Z3HPQ0JBFCJWM4QPD&v=20130815&ll=' + latLng + '&query=' + searchFor + '&intent=checkin&limit=15&radius=1000';

    //foursquare jquery json request:
    $.getJSON(fsqrUrl, function(data){
        var dataResp = data.response.venues;
        $.each(dataResp, function (i, dataResp) {
            // check if datResp.categories is present in (it will break if it is not!) and fill the array
            if(dataResp.categories[0]){
                fsqrData.push({
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

        // set the content for the right hand pop up list
        var rightHandList = function(fsqrData){
            var itemName;
            var itemUrl;
            var elemContent;
            // check if there are any results, if not, notify
            if(fsqrData.length === 0){
                fsqrElem.append('<li class="article">No results found</li>');
            }
            // if there are results, make a list item for every result and put it/them on the page:
            else {
                $.each(fsqrData, function (index, value){
                    itemName = value.name;
                    itemUrl = value.url;
                    // if a result has no url then just show the name:
                    if(itemUrl === ' '){
                        elemContent = itemName;
                    }
                    // if it does have a url then add a link to the name:
                    else {
                        elemContent = '<a href="' + itemUrl + '" title="' + itemUrl + ' This link will open in a new tab" target="_blank">' + itemName + '</a>';
                    }
                    fsqrElem.append('<li class="article">'+ elemContent + '</li>');
                });
            }
        };
        rightHandList(fsqrData);
        initMap(fsqrData);
    }).fail(function(e){
        fsqrHeader.text('Foursquare results could Not Be Loaded');
    });
    return false;
};//end getFoursquareData()

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
function initMap() {
    var locations = myAreas;
    var zoomLevel = 14;
    //adjust zoom if width < 1000px
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    if(w <= 1000){
        zoomLevel = 13;
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
    for(var i = 0; i < locations.length; i++){
            var img = 'img/pin.png';
            myMarker = new google.maps.Marker({
                position: locations[i].loc,
                map: map,
                icon: img
            });
    myMarkers.push(myMarker);
    }

    //the coloured polygons of the areas on the map
    //they are clickable
    //on click:
    // - show infoWIndow with streetview
    // - set the clicked area as selected
    // also the click in the areaList is handled here
    var poly;
    var polygons = [];
    var thisItem;
    var infowindow = new google.maps.InfoWindow({maxWidth: 200});
    var areaListNames = document.getElementsByClassName('name');
    
    //for each location/area:
    for(i = 0; i < locations.length; i++){
        //make the polygons:
        poly = new google.maps.Polygon({
            paths: locations[i].coords,
            strokeColor: 'black',
            strokeOpacity: 0.8,
            strokeWeight: 0.5,
            fillColor: locations[i].fill,
            fillOpacity: 0.4,
            position: locations[i].loc
        });
        polygons.push(poly);
        thisItem = areaListNames[i];
        
        // add click listener to the areaList to show the infowindow filled with the relevant info
        google.maps.event.addDomListener(thisItem, 'click', (function(i, poly){
            var contentString = '<div><h3 class = "infoWindowHeading">' + locations[i].name + '</h3><p>' + locations[i].info + '<img src = "' + locations[i].img + '"></p></div>';
            return function() {
                document.getElementsByClassName('name')[i].style.color = 'maroon';
                //back to black for the deserted poly name if one was already selected:
                for(var j = 0; j < areaListNames.length; j++){
                    if(j !== i){
                        areaListNames[j].style.color = 'black';
                    }
                }
                infowindow.setContent(contentString);
                infowindow.open(map, poly);
                map.panTo(locations[i].loc);
            };
        })(i, poly));

        // add click listener to the polygon:
        google.maps.event.addListener(poly, 'click', (function (poly, i){
            return function() {
                //make the clicked polygon stand out in the list
                areaListNames[i].style.color = 'maroon';
                //remove any previous 'selected' classes
                $(".name").removeClass("selected");
                //make the clicked polygon 'selected'
                $(".name").addClass(function(k) {
                    if(i === k){
                        return "selected";
                    }
                });
                //back to black for the deserted area
                for(var j = 0; j < areaListNames.length; j++){
                    if(j !== i){
                        areaListNames[j].style.color = 'black';
                    }
                }

                //fill the infowindow with the relevant content including a streetview window
                var contentString = '<div><h3 class = "infoWindowHeading">' + locations[i].name + '</h3><p><br>' + locations[i].info + '<img src = "' + locations[i].img + '"></p></div><div id="pano"></div>';
                infowindow.setContent(contentString);
                infowindow.open(map, poly);
                map.panTo(locations[i].loc);

                var streetview = function(){
                    var myPosition = locations[i].loc;
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), {
                            position: myPosition,
                            pov: {
                                heading: 34,
                                pitch: 10
                            }
                        }
                    );
                return map.setStreetView(panorama);
                };
                streetview();
            };
        })(poly, i));
        poly.setMap(map);
    }// end for

    // show the markers for the foursquare data
    var nameMarkerFsqr = [];
    var addressMarkerFsqr = [];
    var phoneMarkerFsqr = [];
    var urlMarkerFsqr = [];

    //fill in all the data from the foursquare query:
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
                var contentString = '<div><h3 class = "infoWindowHeading">' + nameMarkerFsqr[index] + '</h3><p> ' + addressMarkerFsqr[index][0] + '  <br> ' + addressMarkerFsqr[index][1] + '<br>' + addressMarkerFsqr[index][2] + '<br>' + phoneMarkerFsqr[index] + '   <br><a title="This link will open in a new tab" href = " ' + urlMarkerFsqr[index] + '" target="_blank" >' + urlMarkerFsqr[index] + '</a></p></div>';
                infowindow.setContent(contentString);
            infowindow.open(map, this);
        });
            markersFsqr.push(markerFsqr);
    });
}// end initMap()
