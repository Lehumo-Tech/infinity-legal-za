/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ui",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "f_ct",
        "maxSelect": 1,
        "name": "consent_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "data_processing",
          "marketing",
          "third_party_sharing",
          "automated_decision",
          "popia_general"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_pu",
        "max": 500,
        "min": 1,
        "name": "purpose",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_gr",
        "name": "granted",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ip",
        "max": 45,
        "min": 0,
        "name": "ip_address",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ua",
        "max": 500,
        "min": 0,
        "name": "user_agent",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_236192342",
    "indexes": [
      "CREATE INDEX idx_consent_user ON consent_logs (user_id)",
      "CREATE INDEX idx_consent_type ON consent_logs (consent_type)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "consent_logs",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_236192342");

  return app.delete(collection);
})
