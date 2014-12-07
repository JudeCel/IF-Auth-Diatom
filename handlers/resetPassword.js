"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var encryptPassword = require('if-common').utils.encryptPassword;

function ResetPassword(params, cb) {
	var accountId, userId;

	if(!params.email || !params.password)
		return cb(new Error('required parameters not passed to ResetPassword'), null);

		var sql = "SELECT id, accountId FROM users	as u WHERE u.email = ?";

		db.queryOne(sql, params.email, function(err, res) {
			if(err || !res) return cb(err, null);

			accountId = res.accountId;
			userId = res.id;

			var passwordCrypt = encryptPassword({
				userId: res.id,
				password:  params.password
			});

			var sql = "UPDATE	users	SET	passwordCrypt = ? WHERE id = "+res.id;

			db.queryOne(sql, passwordCrypt, function(err, res) {
				if(err) return cb(err, null);

				var sql = "UPDATE	forgotpasswordrequest SET	deleted = NOW() WHERE email = ? ";
				db.queryOne(sql, params.email, function(err, res) {
					if(err) return cb(err, null);
					cb(null, {accountId: accountId, userId: userId});
				});
			});
		});
}

module.exports = ResetPassword;
