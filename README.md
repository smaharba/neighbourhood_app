# neighbourhood_app
# Udacity Front-end Web Developer Nano Degree - Neighborhood Map Project
The final project of the Neighborhood Project, part of the Udacity Front-end Web Developer Nano Degree Course.

## The Goals:
- make a neighborhood map app
- use Ajax to gather data from third party apis.
- applying javascript design patterns (MVC, MVVM etc.) and libraries (such as knockout.js)
- utilize the google maps api

## The app:
- the chosen neighborhood is Prenzlauerberg in Berlin, Germany
- the page consists of 
	- a header that includes an info button that toggles a short usage description 
	- a page wide map that centers by default on Prenzlauerberg 
	- the neighborhood is devided into 15 areas (the data is requested from the myJson api) , which are shown on the map as coloured, clickable polygons
	- a left hand clickable list with the names of the areas and a search window and submit button

## Usage:
- a click on one of the names in the list selects the area, as does a click on one of the polygons
- a click on one of the names shows an infowindow on the map with basic information and a picture
- a click on one of the polygons shows an infowindow on the map with a google streetview window added
- when a search term is given (and a neighborhood chosen) a click on the submit button will trigger a search in the Foursquare api.
- results of the query will be displayed by clickable icons and in a right hand pop up list.
- if there is a url available of one of the results there is a clickable link which opens the third party website in a new tab. 

## Responsive:
- the app is responsive though not fully optimized for the smallest screens (e.g. iphone 5)

## Remarks
Emphasize is on implementing the stuff mentioned under the goals, not on UX. 

## Sample:
Sample the app at [jaapabrahams.com](http://jaapabrahams.com/udacity_neighborhood_project)
