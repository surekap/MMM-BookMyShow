/* Magic Mirror
 * Module: MMM-BookMyShow
 *
 * By Prateek Sureka (surekap) https://github.com/surekap/MMM-BookMyShow
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
        const wrapper = document.createElement("div");
        if (this.upcoming) {
            if (this.index >= this.upcoming.results.length) {
                this.index = 0;
            }
            wrapper.classList.add('wrapper', 'align-left');

            const movie = this.upcoming.results[this.index];

            const title = document.createElement('div');
            title.classList.add('bright', 'small');
            title.innerHTML = movie.title;
            
            if (movie.language){
                var lang = document.createElement('small');
                lang.innerHTML = "(" + movie.language  + ")";
                title.appendChild(lang);
            }
            wrapper.appendChild(title);

            const whenwhere = document.createElement('div');
            // Play dates
            if (movie.dates){
                var dates = document.createElement('div');
                dates.classList.add('xsmall');
                for(var i = 0; i < movie.dates.length; i++){
                    var datespan = document.createElement('span');
                    datespan.innerHTML = movie.dates[i];
                    dates.appendChild(datespan);
                }
                whenwhere.appendChild(dates);
            }
            
            // Play location
            if (movie.location){
                var loc = document.createElement('div');
                loc.classList.add('xsmall');
                loc.innerHTML = movie.location;
                whenwhere.appendChild(loc);
            }
            
            // Movie showtimes
            if (movie.shows){
                var shows = movie.shows;
                for (var k in shows){
                    if (shows.hasOwnProperty(k)){
                        var theatre = document.createElement('div');
                        theatre.classList.add('xsmall');
                        theatre.innerHTML = k + ": ";
                        for(var i=0; i < shows[k].length; i++){
                            var t = shows[k][i];
                            var showtime = document.createElement('span');
                            showtime.innerHTML = " " + t + " ";
                            theatre.appendChild(showtime);
                        }
                        whenwhere.appendChild(theatre);
                    }
                }
            }
            
            wrapper.appendChild(whenwhere);


            const poster = document.createElement('img');
            poster.classList.add('poster');
            poster.src = movie.poster_path;
            wrapper.appendChild(poster);

            if (this.config.genre){
                const genres = document.createElement('div');
                const genrespan = document.createElement('span');
                genrespan.classList.add('xsmall', 'float-left');
                genres.appendChild(genrespan);
                const max = Math.min(3, movie.genres.length);
                for (let i = 0; i < max; i += 1) {
                    const genre = document.createElement('span');
                    genre.classList.add('xsmall', 'thin', 'badge', 'float-left');
                    genre.innerHTML = movie.genres[i];
                    genres.appendChild(genre);
                }
                wrapper.appendChild(genres);
            }

            if (this.config.rating) {
                const stars = document.createElement('div');
                stars.classList.add('xsmall');
                
                if (movie.rating){
                    const star = document.createElement('i');
                    star.classList.add('fa', 'fa-heart-o');
                    stars.appendChild(star);
                    const starspan = document.createElement('span');
                    starspan.innerHTML = " " + movie.rating[0] + " ";
                    stars.appendChild(starspan);
                }
                
                if (movie.duration && movie.duration.length > 0){
                    const duration = document.createElement('i');
                    duration.classList.add('fa', 'fa-clock-o');
                    stars.appendChild(duration);
                    const timespan = document.createElement('span');
                    timespan.innerHTML = " " + this.upcoming.results[this.index].duration[0];
                    stars.appendChild(timespan);
                }
                
                wrapper.appendChild(stars);
            }

            if (this.config.plot) {
                const plot = document.createElement('div');
                plot.classList.add('xsmall', 'plot');
                const synopsis = movie.synopsis;
                plot.innerHTML = (synopsis.length > 150) ? synopsis.substring(0, 148) + '...' : synopsis;
                wrapper.appendChild(plot);
            }
        }
        return wrapper;
    }
});
