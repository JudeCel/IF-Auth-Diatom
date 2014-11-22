"use strict";
var _ = require('lodash');
var ifCommon = require('if-common');
var mtypes = ifCommon.mtypes;
var encryptPassword = ifCommon.utils.encryptPassword;
var ifData = require('if-data'), db = ifData.db;
var validateUser = require('./validUserHelper.js').validateUser;
var handleLoginResult = require('./loginResultHelper.js').handleResult;

function Login(params, cb) {
	var email = params.email;
	var password = params.password;

	var sql = "SELECT \
		u.id userId, \
		u.accountId, \
		u.passwordCrypt, \
		u.permissions, \
		u.email = a.ownerEmail accountOwner, \
		u.email, \
		u.status userStatus, \
		u.deleted userDeleted, \
		(IFNULL(u.passwordExpiration, DATE_ADD(UTC_TIMESTAMP, INTERVAL 1 HOUR)) <= UTC_TIMESTAMP) passwordExpired, \
		a.status accountStatus, \
		a.deleted accountDeleted, \
		a.ownerEmail \
	FROM users u \
	JOIN account a ON u.accountId = a.id \
	WHERE u.email = ?";

	function authFilter(user) {
		return user.passwordCrypt === encryptPassword({
			userId: user.userId,
			password: password
		});
	}

	var queryParams = [email, password];

	db.query(sql, queryParams, function (err, users) {
		_.defaults(params, {users: users, authFilter: authFilter});
		handleLoginResult(users);
		validateUser(params, cb);
	});
}
module.exports = Login;