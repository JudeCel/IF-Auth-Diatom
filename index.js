"use strict";
module.exports = {
	domainToAccountId: require('./handlers/domainToAccountId.js'),
	createSession: require('./handlers/createSession.js'),
	validateSession: require('./handlers/validateSession.js'),
	validUserHelper: require('./handlers/validUserHelper.js'),
	createForgotPasswordRequest: require('./handlers/createForgotPasswordRequest.js')
};
