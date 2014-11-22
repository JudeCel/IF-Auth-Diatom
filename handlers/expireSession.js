"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var Q = require('q');

function expireSession(params) {
	var sql = "UPDATE sess \
			SET expires = NOW(),\
			deleted = NOW(), \
			status = 123000200 \
			WHERE id = ?";

	return Q.nfcall(db.query, sql, [params.sessionId]);
}

module.exports = expireSession;