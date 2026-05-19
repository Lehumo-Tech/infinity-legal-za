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
        "id": "f_si",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "sender_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ri",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "recipient_id",
        "presentable": false,
        "required": false,
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
        "id": "f_ir",
        "name": "is_read",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "f_mt",
        "maxSelect": 1,
        "name": "message_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "message",
          "note",
          "system",
          "alert"
        ]
      }
    ],
    "id": "pbc_2605467279",
    "indexes": [
      "CREATE INDEX idx_messages_case ON messages (case_id)",
      "CREATE INDEX idx_messages_sender ON messages (sender_id)",
      "CREATE INDEX idx_messages_recipient ON messages (recipient_id)",
      "CREATE INDEX idx_messages_read ON messages (is_read)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "messages",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = sender_id",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279");

  return app.delete(collection);
})
