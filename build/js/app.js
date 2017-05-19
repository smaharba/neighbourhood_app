function googleError(){ko.applyBindings(new ErrorViewModel)}function ErrorViewModel(){return this.googleErr=ko.observable("Sorry. Google Maps failed to load. Please try again later."),!1}function getAreas(){return $.getJSON("https://api.myjson.com/bins/11np4h").done(function(e){var t=e;$.each(t,function(e,t){myJson.push({id:t.id,name:t.name,loc:t.loc,info:t.info,coords:t.coords,fill:t.fill,img:t.img})}),goDoStuff(myJson)}).fail(function(e){}),!1}function goDoStuff(e){"use strict";function t(){function t(e){var t='<div class="infoWindow"><p class="infoWindowHeading">'+e.areaName;return t+="</p><p><br>"+e.areaInfo,t+='<img src = "'+e.areaImg,t+='"></p></div>'}this.googleErr=ko.observable(),this.searchTerm=ko.observable(),this.showItemList=ko.observable(!1),this.showResults=ko.observable(!0),this.myAreas=ko.observableArray([]),this.myPois=ko.observableArray([]),this.currentArea=ko.observable(),this.chosenArea=ko.observable(),this.fsqrFailText=ko.observable(),this.fsqrNoResult=ko.observable(""),this.showHideAreaList=ko.observable(!0);var h=this;e.forEach(function(e){h.myAreas.push(new v(e))}),this.setPois=function(e){h.myPois().length=0,e.forEach(function(e){h.myPois.push(new k(e))})};var T=function(e){e.setAnimation(google.maps.Animation.BOUNCE),setTimeout(function(){e.setAnimation(null)},2100)};this.setMapOnAll=function(e){for(var t=0;t<u.length;t++)u[t].setMap(e)},this.removeMarkers=function(){h.setMapOnAll(null),u=[]},this.showAreaList=function(){h.showHideAreaList(!0)},this.hideFsqr=function(){h.showItemList(!1),h.showHideAreaList(!0),o.panTo(p),r.close(r)},this.itemListClick=function(e){T(e.myMarker),h.currentArea(h.myAreas()[e.areaId]),h.chosenArea(h.currentArea().areaName),f=h.currentArea(),l=h.searchTerm(),d.length=0;var t={lat:f.loc.lat,lng:f.loc.lng};if(o.panTo(t),""===l||void 0===l)return h.showItemList(!1),h.removeMarkers(),!1;h.showItemList(!0),g()<=800&&h.showHideAreaList(!1);var r=f.loc.lat+","+f.loc.lng,i="https://api.foursquare.com/v2/venues/search?client_id=XV45PHON55RFFRM3GNN1BODO2NWH45LCGBKPVQWLOKGUI4XA&client_secret=YVKQJGWU1G2TH1BGQXHULAGHOYDL443Z3HPQ0JBFCJWM4QPD&v=20130815&ll="+r+"&query="+l+"&intent=checkin&limit=5&radius=1000";return $.getJSON(i,function(e){function t(){h.removeMarkers(),$.each(d,function(e,t){y.lat=t.lat,y.lng=t.lng,c.push(t.name),f.push(t.address),p.push(t.phone),m.push(t.url),s=t.iconPre+"bg_32"+t.iconSuf,l=new google.maps.Marker({position:y,map:o,icon:s}),a=function(e){var t='<div class="infowindow"><h3 class = "infoWindowHeading">';return t+=c[e]+"</h3><p> ",t+=f[e][0]+"  <br> ",t+=f[e][1]+"<br>",t+=f[e][2]+"<br>",t+=p[e]+'   <br><a title="This link will open in a new tab" href = " ',t+=m[e]+'" target="_blank" >',t+=m[e]+"</a></p></div>"},google.maps.event.addListener(l,"click",function(e,t){var r=a(t);return function(){T(e),n.setContent(r),n.open(o,this)}}(l,e)),u.push(l)}),h.fsqrListClick=function(e){var t=e.poiId,r=a(t);T(u[t]),n.setContent(r),n.open(o,u[t])}}var r=e.response.venues;$.each(r,function(e,t){t.categories[0]?d.push({id:e,name:t.name,lat:t.location.lat,lng:t.location.lng,address:t.location.formattedAddress,phone:t.contact.formattedPhone,url:t.url,iconPre:t.categories[0].icon.prefix,iconSuf:t.categories[0].icon.suffix}):d.push({id:e,name:t.name,lat:t.location.lat,lng:t.location.lng,address:t.location.formattedAddress,phone:t.contact.formattedPhone,url:t.url,iconPre:"https://ss3.4sqi.net/img/categories_v2/arts_entertainment/default_",iconSuf:".png"})}),$.each(d,function(e,t){void 0===t.url&&(t.url=" "),void 0===t.phone&&(t.phone=" ");for(var o=0;o<3;o++)void 0===t.address[o]&&(t.address[o]=" ")});var i=function(e){0===e.length?(h.fsqrNoResult("Sorry, no results found!"),h.showResults(!1)):(h.fsqrNoResult(""),h.showResults(!0))};h.setPois(d),i(d);var l,c=[],f=[],p=[],m=[];t(),h.setMapOnAll(o)}).fail(function(e){h.fsqrFailText("Sorry. Something has gone wrong. The Foursquare server could not be reached")}),!1},$.each(h.myAreas(),function(e,n){var s=new google.maps.Marker({position:n.loc,map:o,icon:c,animation:google.maps.Animation.DROP});m.push(s),n.myMarker=s,i.extend(s.position),s.addListener("click",function(e){T(s),o.panTo(s.position),r.setContent(t(n)),r.open(o,s)})});var b,w=[];this.myAreas().forEach(function(e){b=new google.maps.Polygon({paths:e.areaCoords,strokeColor:"black",strokeOpacity:.8,strokeWeight:.5,fillColor:e.fill,fillOpacity:.4,position:e.loc}),w.push(b),b.setMap(o)}),o.addListener("click",function(){r.close(r)}),$.each(w,function(e,t){google.maps.event.addListener(t,"click",function(){r.close(r)})}),h.filter=ko.observable(""),this.areaList=ko.dependentObservable(function(){var e=this.filter().toLowerCase();return e?ko.utils.arrayFilter(this.myAreas(),function(t){return t.areaName.toLowerCase().indexOf(e)>=0||(t.myMarker.setVisible(!1),!1)}):ko.utils.arrayFilter(h.myAreas(),function(e){return e.myMarker.setVisible(!0),!0})},this)}var o,r,n,i,s,a,l,c="img/pin.png",f=!1,p={lat:52.535722,lng:13.414487},m=[],u=[],y={},d=[],h=function(){var e=Math.max(document.documentElement.clientWidth,window.innerWidth||0);return e},g=function(){var e=Math.max(document.documentElement.clientHeight,window.innerHeight||0);return e},T=function(){var e=h(),t=13;return e<=400&&(t=12),t},b=[{featureType:"administrative.country",elementType:"geometry.fill",stylers:[{color:"#98b9c5"}]},{featureType:"administrative.province",elementType:"geometry.fill",stylers:[{color:"#98b9c5"}]},{featureType:"administrative.locality",elementType:"geometry.fill",stylers:[{color:"#98b9c5"}]},{featureType:"administrative.neighborhood",elementType:"geometry.fill",stylers:[{color:"#98b9c5"}]},{featureType:"administrative.land_parcel",elementType:"geometry.fill",stylers:[{color:"#98b9c5"}]},{featureType:"landscape.man_made",elementType:"geometry.fill",stylers:[{color:"#9dbecb"}]},{featureType:"landscape.natural.landcover",elementType:"geometry.fill",stylers:[{color:"#96becd"}]},{featureType:"landscape.natural.terrain",elementType:"geometry.fill",stylers:[{color:"#ffffff"}]},{featureType:"poi.attraction",elementType:"geometry.fill",stylers:[{color:"#fff7dc"}]},{featureType:"poi.business",elementType:"geometry.fill",stylers:[{color:"#fff7dc"}]},{featureType:"poi.business",elementType:"geometry.stroke",stylers:[{visibility:"off"}]},{featureType:"poi.government",elementType:"geometry.fill",stylers:[{color:"#fff7dc"}]},{featureType:"poi.medical",elementType:"geometry.fill",stylers:[{color:"#fff7dc"}]},{featureType:"poi.park",elementType:"geometry.fill",stylers:[{color:"#fff7dc"}]},{featureType:"poi.place_of_worship",elementType:"geometry.fill",stylers:[{color:"#ffc540"}]},{featureType:"poi.school",elementType:"geometry.fill",stylers:[{color:"#2d7488"}]},{featureType:"poi.sports_complex",elementType:"geometry.fill",stylers:[{color:"#9fdbea"}]},{featureType:"road.arterial",elementType:"geometry.fill",stylers:[{color:"#7da4b3"},{saturation:"0"}]},{featureType:"road.arterial",elementType:"geometry.stroke",stylers:[{color:"#b5cfd9"}]},{featureType:"road.arterial",elementType:"labels.text.fill",stylers:[{color:"#ffffff"}]},{featureType:"road.arterial",elementType:"labels.text.stroke",stylers:[{visibility:"simplified"}]},{featureType:"road.local",elementType:"geometry.fill",stylers:[{color:"#fbffcb"}]},{featureType:"transit.line",elementType:"geometry.fill",stylers:[{color:"#c9dbff"}]},{featureType:"transit.station.airport",elementType:"geometry.fill",stylers:[{color:"#beddff"}]},{featureType:"transit.station.bus",elementType:"geometry.fill",stylers:[{color:"#c0dff4"}]},{featureType:"transit.station.rail",elementType:"geometry.fill",stylers:[{color:"#00708b"}]},{featureType:"water",elementType:"geometry.fill",stylers:[{color:"#79b7cd"}]}];o=new google.maps.Map(document.getElementById("map"),{center:p,styles:b,zoom:T(),mapTypeControl:!1,mapTypeControlOptions:{style:google.maps.MapTypeControlStyle.DROPDOWN_MENU}}),r=new google.maps.InfoWindow({maxWidth:100,content:""}),n=new google.maps.InfoWindow({maxWidth:150,content:""}),i=new google.maps.LatLngBounds,window.onresize=function(){o.fitBounds(i),o.panTo(p)};var v=function(e){this.areaId=e.id,this.areaName=e.name,this.loc=e.loc,this.areaInfo=e.info,this.areaCoords=e.coords,this.fill=e.fill,this.areaImg=e.img,this.myMarker=""},k=function(e){this.poiId=e.id,this.poiName=e.name,this.lat=e.lat,this.lng=e.lng};ko.applyBindings(new t)}var myJson=[];