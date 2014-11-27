"use strict";
var _ = require('lodash');
var ifData = require('if-data'), db = ifData.db;
var ifCommon = require('if-common')
var encryptor = ifCommon.utils.dotNetEncryptionHelper;
var Q = require('q');

function expireSession(sessionIdEncrypted) {
	var sessId = encryptor.decryptNumberFromUrl(sessionIdEncrypted);
	var sql = "UPDATE sess \
			SET expires = NOW(),\
			deleted = NOW(), \
			status = 100000100 \
			WHERE id = ?";

	return Q.nfcall(db.query, sql, [sessId]);
}

module.exports = expireSession;