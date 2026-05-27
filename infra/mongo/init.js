// infra/mongo/init.js — runs once on first container start
// Creates a dedicated app user with least-privilege access

db = db.getSiblingDB(process.env['MONGO_INITDB_DATABASE'] || 'cute_bazar');

db.createUser({
  user: 'bazarna_app',
  pwd:  process.env['MONGO_APP_PASS'] || 'changeme_in_prod',
  roles: [{ role: 'readWrite', db: process.env['MONGO_INITDB_DATABASE'] || 'cute_bazar' }],
});
