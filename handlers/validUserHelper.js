"use strict";
var _ = require('lodash');
var ifCommon = require('if-common');
var mtypes = ifCommon.mtypes;
var encryptPassword = ifCommon.utils.encryptPassword;
var ifData = require('if-data'), db = ifData.db;
var fn = ifCommon.utils.functionHelper;

function ValidUserHelper() {
	function validateUsers(params, cb) {
		var err = null;
		var authFilter = params.authFilter;
		var matchedUsers = (params.users || []).concat();

		// filter sql results based on passed in auth logic
		if(authFilter)
			matchedUsers = _.filter(params.users, authFilter);

		if (matchedUsers.length === 0)
			return cb('login_failed');

		if(matchedUsers.length === 1)
			return userAndAccountAreValid(matchedUsers[0], function(err, user) {
				return cb(err, [user]);
			});

		// multiple accounts found, filter out bad ones
		matchedUsers = _.filter(matchedUsers, fn.unary(userAndAccountAreValid));

		if (matchedUsers.length === 0)
			return cb('login_failed');

		return cb(err, matchedUsers);
	}

	function validateUser(params, cb) {
		validateUsers(params, function(err, matchedUsers) {
			if(!matchedUsers)
				return cb(err);

			if (matchedUsers.length > 1)
				return cb('multiple_accounts_found', matchedUsers);

			return cb(err, matchedUsers);
		});
	}

	function userAndAccountAreValid(user, cb) {
		var inactiveAccountStatuses = [
			mtypes.accountStatus.cancelled,
			mtypes.accountStatus.nonPayment,
			mtypes.accountStatus.trialExpired
		];
		if (user.type == mtypes.userType.accountManager) {
			inactiveAccountStatuses = [
				mtypes.accountStatus.administrativeDisableDEPRECIATED
			];
		}

		if (~inactiveAccountStatuses.indexOf(user.accountStatus) || user.accountDeleted) {
			if (cb) return cb('account_inactive', user);
			return false;
		}

		if (user.userStatus != mtypes.userStatus.active || user.userDeleted) {
			if (cb) return cb('user_inactive', user);
			return false;
		}

		if (cb) return cb(null, user);
		return true;
	}

	return {
		validateUser:validateUser,
		validateUsers:validateUsers
	};
}
module.exports = ValidUserHelper();