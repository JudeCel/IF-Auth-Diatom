"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var ifCommon = require('if-common');
var mtypes = ifCommon.mtypes;

function ValidateSession(params, mainCb) {
	params = params || {};
	var sessionId = params.sessionId;
	var userRole = params.userRole || [];
	//var sessionInactivityExpirationMinutes = params.sessionInactivityExpirationMinutes;

	if (!params || !params.sessionId)
		return mainCb(new Error('You must supply a sessionId'));

	var sql = "SELECT \
		s.ID SessionID, \
		s.UserID, \
		s.AccountID, \
		UNIX_TIMESTAMP(UTC_TIMESTAMP) nowSec, \
		UNIX_TIMESTAMP(s.lastActivity) lastActivitySec, \
		s.modified, \
		s.Type, \
		u.name_first, \
		u.name_last,\
		u.Status userStatus, \
		u.Email, \
		a.Status accountStatus, \
		(IFNULL(s.expires, DATE_ADD(UTC_TIMESTAMP, INTERVAL 1 HOUR)) <= UTC_TIMESTAMP) sessionExpired \
	FROM sess s \
	JOIN account a ON a.ID = s.AccountID \
	JOIN users u ON u.ID = s.UserID \
	WHERE s.ID = ? \
	AND s.Status = 100000200 /*Valid*/ \
	AND s.Deleted IS NULL \
	AND u.Deleted IS NULL \
	AND a.Deleted IS NULL";

	var queryParams = [sessionId];
//	if (permissions.length > 0) {
//		sql += " AND u.permissions IN (?)";
//		queryParams.push(permissions);
//	}

	db.queryOne(sql, queryParams, function (err, result) {
		console.log(err);
		if (err) return mainCb(err);
		if (!result || !result.sessionId)
			return mainCb('not_found');

		var inactivityExpirationDate = result.lastActivitySec;

		if (result.sessionExpired)
			return handleExpiredSession(result.sessionId);

		if (result.userStatus != mtypes.userStatus.active)
			return mainCb('user_inactive');

		var inactiveAccountStatuses = [
			mtypes.accountStatus.cancelled,
			mtypes.accountStatus.nonPayment,
			mtypes.accountStatus.trialExpired
		];

		// we return the result as well to allow us to prompt the account holder to pay us
		if (~inactiveAccountStatuses.indexOf(result.accountStatus))
			return mainCb('account_inactive', result);

		updateLastActivity(result.sessionId, function(err) {
			mainCb(err, result)
		});
	});

	function handleExpiredSession(sessionId) {
		db.updateById('sess', sessionId, {status: mtypes.sessStatus.invalid}, function(err) {
			err = err || 'session_expired';
			return mainCb(err);
		});
	}

	function updateLastActivity(sessionId, cb) {
		var sql = "UPDATE sess \
		SET lastActivity = UTC_TIMESTAMP \
		WHERE id = ?";

		db.query(sql, [sessionId], cb);
	}
};
module.exports = ValidateSession;
