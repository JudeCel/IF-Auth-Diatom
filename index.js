"use strict";
module.exports = {
	login: require('./handlers/login.js'),
	createSession: require('./handlers/createSession.js'),
	validateSession: require('./handlers/validateSession.js'),
	validUserHelper: require('./handlers/validUserHelper.js'),
	createForgotPasswordRequest: require('./handlers/createForgotPasswordRequest.js')
};
