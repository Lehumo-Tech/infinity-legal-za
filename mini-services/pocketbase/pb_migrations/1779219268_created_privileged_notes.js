/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "deleteRule": "@request.auth.id = author_id || @request.auth.role = 'managing_director'",
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
        "collectionId": "pbc_3613244768",
        "hidden": false,
        "id": "f_ci",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "case_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ai",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "author_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_co",
        "max": 10000,
        "min": 1,
        "name": "content",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_vi",
        "maxSelect": 1,
        "name": "visibility",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "officer_only",
          "managing_partner_only",
          "attorney_client"
        ]
      }
    ],
    "id": "pbc_2249761377",
    "indexes": [
      "CREATE INDEX idx_privnotes_case ON privileged_notes (case_id)",
      "CREATE INDEX idx_privnotes_author ON privileged_notes (author_id)"
    ],
    "listRule": "@request.auth.id != '' && (@request.auth.role = 'legal_officer' || @request.auth.role = 'supervising_officer' || @request.auth.role = 'managing_director' || @request.auth.role = 'senior_partner')",
    "name": "privileged_notes",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = author_id",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2249761377");

  return app.delete(collection);
})
