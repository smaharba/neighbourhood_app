# neighbourhood_app
# Udacity Front-end Web Developer Nano Degree - Neighborhood Map Project
The final project of the Neighbourhood Project, part of the Udacity Front-end Web Developer Nano Degree Course.

## The Goals:
- make a neighbourhood map app
- use Ajax to gather data from third party apis.
- applying javascript design patterns (MVC, MVVM etc.) using knockout.js.
- utilize the google maps api

## The app:
- the chosen neighbourhood is Prenzlauerberg in Berlin, Germany
- the page consists of 
	- two input elements, one to enter a search term and one to filter the area list
	- a page wide map that centers by default on Prenzlauerberg
	- the neighbourhood is devided into 14 areas (the data is requested from the myJson api), which are shown on the map as coloured polygons
	- a clickable results list that appears after submitting a search
	
## Usage of the app:
- fill in a search term and select an area, either by clicking on a name in the area list or by filtering the area list using the second input element.
	- a results list will appear (if there are any hits)
	- if the viewport height is limited the area list will be hidden
	- on the map the relevant markers with appear
	- the markers will react to a click in the results list or on the marker itself, showing the relevant Foursquare info.
- change the search area by clicking on the second input element and adjusting the choice
- to change the search term click on the first input element and enter a searchterm and then select an area

## Responsive:
- the app is responsive and can be used on all devices

## How to open the App locally:
- Download the source code at GitHub: https://github.com/smaharba/neighbourhood_app.git and open 'index.html' in your browser.

## this repository uses npm and gulp.js
- how to install and use npm at [github npm](https://github.com/npm/npm)
- how to install and use gulp.js at [gulp.js](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
- this gulp.js package uses jshint, imagemin, minifyHTML, stripDebug, uglify, autoPrefix, minifyCSS.
- after installing npm and gulp.js in the command line navigate to the file where the repository is and run ‘gulp default’ to run them all at once.

## Sample on the web:
Sample the app at [jaapabrahams.com](http://jaapabrahams.com/neighbourhood_app/)