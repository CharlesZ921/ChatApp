const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		var token = crypto.randomBytes(100).toString('hex');
        var info = new Object();
        info.username = username;
        info.timeTokenCreated = Date.now();
        info.timeExpired = info.timeTokenCreated + maxAge;
        sessions[token] = info;
        response.cookie('ChatApp', token, { maxAge: maxAge });
        setTimeout(() => delete sessions[token], maxAge);
	};

	this.deleteSession = (request) => {
		/* To be implemented */
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;