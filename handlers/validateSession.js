"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var ifCommon = require('if-common');
var mtypes = ifCommon.mtypes;
var arrayHelper = ifCommon.utils.arrayHelper;

function ValidateSession(params, mainCb) {
	params = params || {};
	var sessionId = params.sessionId;
	var permissions = params.permissions || [];
	var sessionInactivityExpirationMinutes = params.sessionInactivityExpirationMinutes;
	var domainsWithOneMinuteSessionInactivityExpiration = params.domainsWithOneMinuteSessionInactivityExpiration;

	if (!params || !params.sessionId)
		return mainCb(new Error('You must supply a sessionId'));

	var sql = "SELECT \
		s.ID SessionID, \
		s.UserID, \
		s.AccountID, \
		UNIX_TIMESTAMP(UTC_TIMESTAMP) nowSec, \
		UNIX_TIMESTAMP(s.lastActivity) lastActivitySec, \
		s.modified, \
		s.DeviceType, \
		s.Type, \
		u.FirstName, \
		u.LastName,\
		u.Email, \
		pd.fullName accountSubDomain, \
		cd.fullName customDomain, \
		u.permissions, \
		u.Status userStatus, \
		a.Status accountStatus, \
		(IFNULL(s.expires, DATE_ADD(UTC_TIMESTAMP, INTERVAL 1 HOUR)) <= UTC_TIMESTAMP) sessionExpired, \
		GROUP_CONCAT(af.feature SEPARATOR ',') accountFeatures, \
		IF(a.advancedTierTrialExpiration < UTC_TIMESTAMP, NULL, GROUP_CONCAT(ttf.feature SEPARATOR ',')) accountTrialFeatures \
	FROM sess s \
	JOIN account a ON a.ID = s.AccountID \
	JOIN userrecord u ON u.ID = s.UserID \
	JOIN domain pd ON a.id = pd.accountId AND pd.recordType = 145000100 /*Primary domain*/ AND pd.deleted IS NULL \
	LEFT JOIN domain cd ON a.id = cd.accountId AND cd.recordType = 145000300 /*Custom domain*/ AND cd.deleted IS NULL \
	LEFT JOIN accountFeature af ON a.Id = af.accountId \
		AND af.Deleted IS NULL \
	LEFT JOIN tierFeature ttf ON a.trialTierId = ttf.tierId \
		AND ttf.Deleted IS NULL \
		AND a.AdvancedTierTrialExpiration >= UTC_TIMESTAMP \
	WHERE s.ID = ? \
	AND s.Status = 123000100 /*Valid*/ \
	AND s.Type = 124000100 /*Standard*/ \
	AND s.Deleted IS NULL \
	AND u.Deleted IS NULL \
	AND a.Deleted IS NULL";

	var queryParams = [sessionId];
	if (permissions.length > 0) {
		sql += " AND u.permissions IN (?)";
		queryParams.push(permissions);
	}

	var oneMinute = 60; // seconds

	db.queryOne(sql, queryParams, function (err, result) {
		console.log(err);
		if (err) return mainCb(err);
		if (!result || !result.sessionId)
			return mainCb('not_found');

		var inactivityExpirationDate = result.lastActivitySec;

		if (~domainsWithOneMinuteSessionInactivityExpiration.indexOf(result.accountSubDomain)) {
			//console.log('found in subdomain');
			inactivityExpirationDate += oneMinute;
		} else {
			//console.log('not found in subdomain');
			inactivityExpirationDate += (oneMinute * sessionInactivityExpirationMinutes);
		}

		var sessionExpiredDueToInactivity = result.nowSec > inactivityExpirationDate;
		//console.log('sessionExpiredDueToInactivity:', sessionExpiredDueToInactivity, 'remaining:', inactivityExpirationDate - result.nowSec, 'sec');

		if (result.sessionExpired || (sessionExpiredDueToInactivity && result.deviceType != mtypes.sessDeviceType.ipad &&
			result.type != mtypes.sessType.sME))
			return handleExpiredSession(result.sessionId);

		if (result.userStatus != mtypes.userStatus.active)
			return mainCb('user_inactive');

		var inactiveAccountStatuses = [
			mtypes.accountStatus.administrativeDisableDEPRECIATED,
			mtypes.accountStatus.cancelled,
			mtypes.accountStatus.nonPayment,
			mtypes.accountStatus.trialExpired
		];

		// we return the result as well to allow us to prompt the account holder to pay us
		if (~inactiveAccountStatuses.indexOf(result.accountStatus))
			return mainCb('account_inactive', result);

		result.accountFeatures = result.accountFeatures ? arrayHelper.strArrayToIntArray(result.accountFeatures.split(',')) : [];
		result.accountTrialFeatures = result.accountTrialFeatures ? arrayHelper.strArrayToIntArray(result.accountTrialFeatures.split(',')) : [];

		result.teamMemberDomain = result.accountSubDomain;
		if(result.accountFeatures.indexOf(mtypes.featureEntry.customDomain) != -1 ||
			result.accountTrialFeatures.indexOf(mtypes.featureEntry.customDomain) != -1) {
			result.traineeDomain = result.customDomain ? result.customDomain : result.accountSubDomain;
		} else {
			result.traineeDomain = result.accountSubDomain;
		}
		delete result.accountSubDomain;
		delete result.customDomain;

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
