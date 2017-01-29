/* Magic Mirror
 * Module: MMM-BookMyShow
 *
 * By Prateek Sureka <surekap@gmail.com>
 *
 * MIT Licensed.
 */

const exec = require('child_process').exec;
const moment = require('moment');
const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
			this.config = payload;
			setInterval(() => {
				this.getData();
			}, this.config.updateInterval);
            this.getData();
        }
    },

	/**
	 * getData
	 * Request data from the supplied URL and broadcast it to the MagicMirror module if it's received.
	 */
    getData: function() {
		const self = this;
        exec(__dirname + '/bms.py', function(error, stdout, stderr){
        	if (error){
        		console.log(err);
        	}else{
        		self.sendSocketNotification("DATA", JSON.parse(stdout));
        	}
        });
    }
});