"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var ifCommon = require('if-common');

function CheckResetPasswordToken(params, cb) {

	if (!params.token) return cb(null);

	var sql = "SELECT \
			email, COUNT(id) > 0 tokenValid, \
		  (DATE_ADD(expirationDate, INTERVAL 1 HOUR) <= UTC_TIMESTAMP) as passwordExpired \
		FROM forgotpasswordrequest  \
		WHERE token = ? AND deleted IS NULL ";

		
	db.queryOne(sql, params.token, function(err, res) {
		if(err || !res) return cb(null);
		return cb(res);
	});
}
module.exports = CheckResetPasswordToken;
