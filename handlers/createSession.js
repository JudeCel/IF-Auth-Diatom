"use strict";
var _ = require('lodash');
var mtypes = require('if-common').mtypes;
var ifData = require('if-data'), db = ifData.db;

function CreateSession(params, cb) {
	if(!params.accountId || !params.userId)
		return cb(new Error('required parameters not passed to CreateSession'));

	var sess = _.defaults(params, {
		lastActivity: db.utcNow(),
		iPAddress: null,
		salesforceAuthToken: null,
		status: mtypes.sessStatus.valid,
		type: mtypes.sessType.standard,
		expires: null,
		courseId: null,
		sSO: mtypes.singleSignOnType.none,
		deviceType: mtypes.sessDeviceType.none
	});
	db.insert("sess", sess, function (err, res) {
		if (err) return cb(err);
		cb(null, res[0].insertId);
	});
}
module.exports = CreateSession;
