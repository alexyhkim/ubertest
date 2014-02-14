$(document).ready(function() {
	$('#search-box').hide();
	$('#loading').show();
	$('#search-results').css('visibility', 'hidden');
	var map;
	var markers = [];
	function initialize() {
		var mapOptions = {
		zoom: 11,
		center: new google.maps.LatLng(37.77493,-122.419416)
		};
		map = new google.maps.Map(document.getElementById('map-container'), mapOptions);
	}
	google.maps.event.addDomListener(window, 'load', initialize);
	$.get( "/data", function( data ) {
		appInit(data);
	});
	
	function appInit(data) {
		$('#loading').hide();
		$('#search-box').show();
		titles = {};
		for (var i = 0; i < data.length; i++) {
			var title = data[i]['title'];
			if (titles[title]) {
				titles[title].push(i);
			} else {
				titles[title] = [i];
			}
		}
			
		var SearchInput = Backbone.Model.extend({
			initialize: function() {
				this.set('input', "");
				this.set('filtered', JSON.parse(JSON.stringify(titles)));
			},
			setInput: function(newinput) {
				newinput = newinput.toLowerCase();
				var input = this.get('input');
				if (newinput.length <= input.length) {
					this.set('filtered', JSON.parse(JSON.stringify(titles)));
				}
				var filtered = this.get('filtered');
				for (var title in filtered) {
					if (title.toLowerCase().indexOf(newinput) < 0) {
						delete filtered[title];
					}
				}
				this.set('input', newinput);
			}
			
		});
		
		var SearchView = Backbone.View.extend({
			initialize: function() {
				this.listenTo(this.model, 'change:input', this.render);
			},
			render: function() {
				if (this.model.get('input') == "") {
					$('#search-results').css('visibility', 'hidden');
				} else {
					$('#search-results').css('visibility', 'visible');
					var filtered = this.model.get('filtered');
					var rawHTML = ""
					for (title in filtered) {
						rawHTML += '<li class="movie">' + title + '</li>';
					}
					$('#search-list').html(rawHTML);
					$('.movie').click(function() {
						for (var m = 0; m < markers.length; m++) {
							markers[m].setMap(null);
						}
						markers = [];
						geocode($(this).html());
					});
				}
			}
		});
		
		function geocode(title) {
			for (var movie in titles) {
				if (title == movie) {
					for (var j = 0; j < titles[title].length; j++) {
						var movieObj = data[titles[title][j]];
						makeInfo(movieObj);
						if (movieObj['latlng']) {
							addToMap(movieObj);
						} else {
							if (movieObj['locations']) {
								$.get( "/geocode?address=" + movieObj['locations'] + "&index=" + titles[title][j], function(latlng) {
									if (latlng['lat']) {
										var usedObj = data[latlng['index']];
										usedObj['latlng'] = latlng;
										addToMap(usedObj);
									}
								});
							}
						}
					}
				}
			}
		}
		
		function makeInfo(movieObj) {
			var html = '';
			html += 'Title: ' + movieObj['title'] + '</br>';
			html += 'Actors: ' + movieObj['actor_1'];
			if (movieObj['actor_2']) {
				html += ', ' + movieObj['actor_2'];
				if (movieObj['actor_3']) {
					html += ', ' + movieObj['actor_3'];
				}
			}
			html += '</br>';
			html += 'Director: ' + movieObj['director'] + '</br>';
			html += 'Writers: ' + movieObj['writer'] + '</br>';
			html += 'Release Year: ' + movieObj['release_year'] + '</br>';
			html += 'Production Company: ' + movieObj['production_company'];
			$('#info-box').html(html);
		}
		
		function addToMap(movieObj) {
			var latlng = new google.maps.LatLng(movieObj['latlng']['lat'], movieObj['latlng']['lng']);
			var marker = new google.maps.Marker({
				position: latlng,
				map: map
			});
			var infowindow = new google.maps.InfoWindow({
				content: movieObj['locations']
			});
			console.log(movieObj['locations']);
			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(map, marker);
			});
			markers.push(marker);
			
		}
			
		
		var search = new SearchInput;
		$('#search-input').bind('input', function() {
			search.setInput($(this).val());
		});
			
		
		var searchv = new SearchView({model: search});
	}
});