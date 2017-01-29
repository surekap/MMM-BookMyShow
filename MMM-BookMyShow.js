/* Magic Mirror
 * Module: MMM-BookMyShow
 *
 * By Prateek Sureka <surekap@gmail.com>
 *
 * MIT Licensed.
 */

Module.register("MMM-BookMyShow",{

	index: 0,

	defaults: {
		updateInterval: 180 * 60 * 1000,
		rotateInterval: 3 * 60 * 1000,
		genre: true,
		rating: true,
		plot: true
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.sendSocketNotification('CONFIG', this.config);
		setInterval(() => {
			this.index++;
			this.updateDom(1000);
		}, this.config.rotateInterval);
	},

    getStyles: function() {
        return ['font-awesome.css', 'MMM-BookMyShow.css'];
    },

	socketNotificationReceived: function(notification, payload){
		if(notification === 'DATA'){
			this.upcoming = payload;
			this.updateDom(1000);
		}
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		if(this.upcoming) {
			if (this.index >= this.upcoming.results.length) {
				this.index = 0;
			}
			wrapper.classList.add("wrapper", "align-left");

            var title = document.createElement("div");
			title.classList.add("bright", "small");
			title.innerHTML = this.upcoming.results[this.index].title;
			
			if (this.upcoming.results[this.index].language){
				var lang = document.createElement("small");
				lang.innerHTML = "(" + this.upcoming.results[this.index].language  + ")";
				title.appendChild(lang);
			}
			wrapper.appendChild(title);

			var whenwhere = document.createElement("div");
			// Play dates
			if (this.upcoming.results[this.index].dates){
				var dates = document.createElement("div");
				dates.classList.add('xsmall');
				for(var i = 0; i < this.upcoming.results[this.index].dates.length; i++){
					var datespan = document.createElement('span');
					datespan.innerHTML = this.upcoming.results[this.index].dates[i];
					dates.appendChild(datespan);
				}
				whenwhere.appendChild(dates);
			}
			
			// Play location
			if (this.upcoming.results[this.index].location){
				var loc = document.createElement("div");
				loc.classList.add('xsmall');
				loc.innerHTML = this.upcoming.results[this.index].location;
				whenwhere.appendChild(loc);
			}
			
			// Movie showtimes
			if (this.upcoming.results[this.index].shows){
				var shows = this.upcoming.results[this.index].shows;
				for (var k in shows){
					if (shows.hasOwnProperty(k)){
						var theatre = document.createElement("div");
						theatre.classList.add('xsmall');
						theatre.innerHTML = k + ": ";
						for(var i=0; i < shows[k].length; i++){
							var t = shows[k][i];
							var showtime = document.createElement("span");
							showtime.innerHTML = " " + t + " ";
							theatre.appendChild(showtime);
						}
						whenwhere.appendChild(theatre);
					}
				}
			}
			
			wrapper.appendChild(whenwhere);


            var poster = document.createElement("img");
			poster.classList.add("poster");
			poster.src = this.upcoming.results[this.index].poster_path;
			wrapper.appendChild(poster);

            if(this.config.genre){
				var genres = document.createElement("div");
				var genrespan = document.createElement("span");
				genrespan.classList.add("xsmall", "float-left");
				genres.appendChild(genrespan);
				var max = Math.min(3, this.upcoming.results[this.index].genres.length);
				for (var i = 0; i < max; i++) {
					var genre = document.createElement("span");
					genre.classList.add("xsmall", "thin", "badge", "float-left");
					genre.innerHTML = this.upcoming.results[this.index].genres[i];
					genres.appendChild(genre);
				}
				wrapper.appendChild(genres);
			}

            if(this.config.rating) {
				var stars = document.createElement("div");
				stars.classList.add("xsmall");
				
				if (this.upcoming.results[this.index].rating){
					var star = document.createElement("i");
					star.classList.add("fa", "fa-heart-o");
					stars.appendChild(star);
					var starspan = document.createElement("span");
					starspan.innerHTML = " " + this.upcoming.results[this.index].rating[0] + " ";
					stars.appendChild(starspan);
				}
				
				if (this.upcoming.results[this.index].duration && this.upcoming.results[this.index].duration.length > 0){
					var duration = document.createElement("i");
					duration.classList.add("fa", "fa-clock-o");
					stars.appendChild(duration);
					var timespan = document.createElement("span");
					timespan.innerHTML = " " + this.upcoming.results[this.index].duration[0];
					stars.appendChild(timespan);
				}
				
				wrapper.appendChild(stars);
			}

            if(this.config.plot) {
				var plot = document.createElement("div");
				plot.classList.add("xsmall", "plot");
				var synopsis = this.upcoming.results[this.index].synopsis;
				plot.innerHTML = (synopsis.length > 150) ? synopsis.substring(0, 148) + '...' : synopsis;
				wrapper.appendChild(plot);
			}
		}
		return wrapper;
	}
});