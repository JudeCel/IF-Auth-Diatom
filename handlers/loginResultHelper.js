"use strict";
var _ = require('lodash');
var ifCommon = require('if-common');
var mtypes = ifCommon.mtypes;
var arrayHelper = ifCommon.utils.arrayHelper;

function LoginResultHelper() {
	function handleResult(users, cb) {
		_.each(users, function (user) {
			user.accountFeatures = user.accountFeatures ? arrayHelper.strArrayToIntArray(user.accountFeatures.split(',')) : [];
			user.accountTrialFeatures = user.accountTrialFeatures ? arrayHelper.strArrayToIntArray(user.accountTrialFeatures.split(',')) : [];
		});
	}

	return {
		handleResult:handleResult
	};
}
module.exports = LoginResultHelper();