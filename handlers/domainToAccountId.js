"use strict";
var ifData = require('if-data'), db = ifData.db;

function DomainToAccountId(params, cb) {
	var domain = params.domain;
	if(!domain) return cb();

	var sql = "SELECT \
		d.accountId \
	FROM domain d \
	WHERE d.fullName = ? \
	AND d.deleted IS NULL";

	db.queryOne(sql, [domain], function (err, result) {
		if (err) return cb(err);
		var res = {
			accountId: 0,
			domain: domain,
			deleted: true
		};
		if (result) {
			res.accountId = result.accountId;
			res.deleted = false;
		}
		cb(null, res);
	});
};
module.exports = DomainToAccountId;
