"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var ifCommon = require('if-common'), dateHelper = ifCommon.utils.dateHelper, guidHelper = ifCommon.utils.uuidHelper;

function CreateForgotPasswordRequest(params, cb) {
	if(!params.email)
		return cb(new Error('required parameters not passed to CreateForgotPasswordRequest'));

	var request = _.defaults(params, {
		email: params.email,
		expirationDate: dateHelper.getResetPasswordExpirationDate(),
		token: guidHelper.generateUUID()

	});
	db.insert("forgotpasswordrequest", request, function (err, res) {
		if (err) return cb(err);
		cb(null, request.token);
	});
}
module.exports = CreateForgotPasswordRequest;
