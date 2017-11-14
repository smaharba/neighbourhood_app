//es6
const myJson = [];
//googleError() only gets triggered if the FQDN is incorrect or if something else goes wrong. 
//But if it's only the key which is incorrect then this function will not be triggered 
//and the default google maps error notification will be shown 
function googleError() {
    ko.applyBindings(new errorViewModel());
}

function errorViewModel() {
    this.googleErr = ko.observable('Sorry. Google Maps failed to load. Please try again later.');
    return false;
}

//pull THE MODEL data from the server
function getAreas() {
    $.getJSON("https://api.myjson.com/bins/a90g1")
        .done(function(myJsonResp){
            const areaData = myJsonResp;
            for(const area of areaData){
                myJson.push({
                    id: area.id,
                    name: area.name,
                    loc: area.loc,
                    info: area.info,
                    coords: area.coords,
                    fill: area.fill,
                    img: area.img
                });
            };
            runApplication(myJson);
        })
        .fail(function(e){
            alert('Something went wrong! Unable to load data to show the areas list.');
        });
    return false;
}

function runApplication(myJson){
    //Note: fsqr = Foursquare
    "use strict";
    let map,
    infowindow,
    fsqrInfowindow,
    bounds,
    iconMarkerFsqr,
    getFsqrContent,
    chosen,
    searchFor;
    let markersFsqr = [];
    const img = 'img/pin.png';
    const center = {lat: 52.535722, lng: 13.414487};
    const myMarkers = [];
    const posMarkerFsqr = {};
    const fsqrData = [];

    //get the viewport width and height
    const vwWidth = () => Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vwHeight = () => Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    //adjust the zoomlevel of the map for small devices
    const zoomLevel = (zoom = 13) => {
        const width = vwWidth();
        if(width <= 400) {zoom = 12;}
        return zoom;
    };

    // Create a styles array to use with the map.
    const styles = 
[{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.province","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.locality","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.neighborhood","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"administrative.land_parcel","elementType":"geometry.fill","stylers":[{"color":"#98b9c5"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#9dbecb"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#96becd"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.business","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.medical","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#fff7dc"}]},{"featureType":"poi.place_of_worship","elementType":"geometry.fill","stylers":[{"color":"#ffc540"}]},{"featureType":"poi.school","elementType":"geometry.fill","stylers":[{"color":"#2d7488"}]},{"featureType":"poi.sports_complex","elementType":"geometry.fill","stylers":[{"color":"#9fdbea"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#7da4b3"},{"saturation":"0"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#b5cfd9"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"labels.text.stroke","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#fbffcb"}]},{"featureType":"transit.line","elementType":"geometry.fill","stylers":[{"color":"#c9dbff"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#beddff"}]},{"featureType":"transit.station.bus","elementType":"geometry.fill","stylers":[{"color":"#c0dff4"}]},{"featureType":"transit.station.rail","elementType":"geometry.fill","stylers":[{"color":"#00708b"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#79b7cd"}]}];

    map = new google.maps.Map(document.getElementById("map"), {
        center,
        styles,
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
    window.onresize = () => {
        map.fitBounds(bounds);
        map.panTo(center);
    };

    //store the areas data
    const Area = function(data) {
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
    const Poi = function(data) {
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
        const self = this;

        // walk through the model and fill the 'myAreas' array with all items in it
        for(const area of myJson) {
            self.myAreas.push( new Area(area) );
        };

        //gets triggered after the foursquare response has been handled:
        this.setPois = (poiListing) => {
            //clear array
            self.myPois().length = 0;
            //walk through
            for(const poi of poiListing){
                self.myPois.push( new Poi(poi) );
            };
        };

        const bounceMarker = (marker) => {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    marker.setAnimation(null);
                }, 2100);
        };

        this.setMapOnAll = (map) => {
                for (let i = 0; i < markersFsqr.length; i++) {
                markersFsqr[i].setMap(map);
            }
            //make iterable
        };

        this.removeMarkers = () => {
            self.setMapOnAll(null);
            markersFsqr = [];
        };

        this.showAreaList = () => {
            self.showHideAreaList(true);
        };

        this.hideFsqr = () => {
            self.showItemList(false);
            self.showHideAreaList(true);
            map.panTo(center);
            infowindow.close(infowindow);
        };

        this.itemListClick = (value) => {
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
            const centerOnItem = {lat: chosen.loc.lat, lng: chosen.loc.lng};
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
            const latLng = chosen.loc.lat + ',' + chosen.loc.lng;

        //store the search data in the url:
        const fsqrUrl = 'https://api.foursquare.com/v2/venues/search?client_id=XV45PHON55RFFRM3GNN1BODO2NWH45LCGBKPVQWLOKGUI4XA&client_secret=YVKQJGWU1G2TH1BGQXHULAGHOYDL443Z3HPQ0JBFCJWM4QPD&v=20130815&ll=' + latLng + '&query=' + searchFor + '&intent=checkin&limit=5&radius=1000';       
            //foursquare jquery json request:
            $.getJSON(fsqrUrl, function(data){
                const dataResp = data.response.venues;
                let i = -1;
                for(const item of dataResp) {
                        i++;
                        fsqrData.push({
                            id: i,
                            name: item.name,
                            lat: item.location.lat,
                            lng: item.location.lng,
                            address: item.location.formattedAddress,
                            phone: item.contact.formattedPhone,
                            url: item.url,
                            iconPre: item.categories[0].icon.prefix,
                            iconSuf: item.categories[0].icon.suffix
                        });
                };

                //check if there are any results, if not, notify
                const checkResult = (fsqrData) => {
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
                for(const value of fsqrData){
                    if(value.url === undefined) {
                        value.url = '';
                    }
                    if(value.phone === undefined) {
                        value.phone = '';
                    }
                    // formattedAddress is an array of three:
                    for(let i = 0; i < 3; i++){
                        if(value.address[i] === undefined){
                            value.address[i] = '';
                        }
                    }                
                };

                //FOURSQUARE on the map:
                //fill in all the data from the foursquare query:
                let markerFsqr;
                const nameMarkerFsqr = [];
                let addressMarkerFsqr= [];
                const phoneMarkerFsqr = [];
                const urlMarkerFsqr = [];

                function addFsqrMarkers(){
                    //remove the old markers if there are any:
                    self.removeMarkers();

                    //walk through the data
                    for(value of fsqrData){
                        let index = value.id;
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
                        getFsqrContent = (index) => {
                            const contentString = `<div class="infowindow"><h3 class = "infoWindowHeading"> ${nameMarkerFsqr[index]}</h3>
                            <p>${addressMarkerFsqr[index][0]}
                            ${addressMarkerFsqr[index][1]}
                            ${addressMarkerFsqr[index][2]}
                            ${phoneMarkerFsqr[index]}
                            <a title="This link will open in a new tab" href = " ${urlMarkerFsqr[index]} " target="_blank" >
                            ${urlMarkerFsqr[index]}</a></p></div>`;                       
                            return contentString;
                        };

                        // add click listener to the foursquare markers to show the foursquare info
                        google.maps.event.addListener(markerFsqr, 'click', (function(markerFsqr, index) {
                            const content = getFsqrContent(index);
                            return function() {
                            bounceMarker(markerFsqr);
                            fsqrInfowindow.setContent(content);
                            fsqrInfowindow.open(map, this);
                            };
                        })(markerFsqr, index));
                        markersFsqr.push(markerFsqr);
                    }//end walk through the data

                    // add click listener to the fsqrItemList to show the fsqrInfowindow filled with the relevant info
                        self.fsqrListClick = (value) => {
                            let index = value.poiId;
                            let content = getFsqrContent(index);
                            bounceMarker(markersFsqr[index]);
                            fsqrInfowindow.setContent(content);
                            fsqrInfowindow.open(map, markersFsqr[index]);
                        };
                }//end addFsqrMarkers
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
            let showImg = '';
            if(vwHeight() >= 500){ showImg = `<img src = "${area.areaImg}">`; }
            const contentString = `<div class="infoWindow"><p class="infoWindowHeading">${area.areaName}</p>
            <p>${area.areaInfo}
            ${showImg}</p></div>`;
            return contentString;
        }
        let poly;
        let polygons = [];

        //place polygons and area markers on the map 
        for(const area of self.myAreas()){
            //make and place the polygons:
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

            //make and place the area markers
            let myMarker = new google.maps.Marker({
                position: area.loc,
                map: map,
                icon: img,
                animation: google.maps.Animation.DROP
            });
            myMarkers.push(myMarker);
            area.myMarker = myMarker;
            bounds.extend(myMarker.position);

            //add event listener to the marker
            myMarker.addListener("click", function(e) {
                bounceMarker(myMarker);
                map.panTo(myMarker.position);
                infowindow.setContent(getContent(area));
                infowindow.open(map, myMarker);
            });
        }


      // Close infowindow when clicked elsewhere on the map, including the polygons
        map.addListener("click", function(){
            infowindow.close(infowindow);
        });

        for(const value of polygons){
            google.maps.event.addListener(value, 'click', (function(){
                infowindow.close(infowindow);})
            );
        }

        // filter for the areaList
        self.filter = ko.observable('');

        this.areaList = ko.computed(function() {
			let q = this.filter().toLowerCase();
			if (!q) {
				return ko.utils.arrayFilter(self.myAreas(), function(item) {
					item.myMarker.setVisible(true);
					return true;
          		});
            } else {
	            return ko.utils.arrayFilter(this.myAreas(), function(item) {
	                if (item.areaName.toLowerCase().indexOf(q) >= 0) {
					item.myMarker.setVisible(true);
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