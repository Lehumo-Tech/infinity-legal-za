/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
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
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_lp",
        "max": 50,
        "min": 0,
        "name": "lpc_number",
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
        "id": "f_fn",
        "max": 200,
        "min": 0,
        "name": "firm_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_sp",
        "maxSelect": 5,
        "name": "specializations",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "family_law",
          "criminal_defence",
          "civil_litigation",
          "conveyancing",
          "estate_planning",
          "corporate_commercial",
          "debt_collection",
          "immigration",
          "labour_law",
          "personal_injury"
        ]
      },
      {
        "hidden": false,
        "id": "f_ye",
        "max": 60,
        "min": 0,
        "name": "years_experience",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "f_iv",
        "name": "is_verified",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "f_hr",
        "max": null,
        "min": 0,
        "name": "hourly_rate",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_bi",
        "max": 2000,
        "min": 0,
        "name": "bio",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_as",
        "maxSelect": 1,
        "name": "availability_status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "available",
          "busy",
          "on_leave",
          "unavailable"
        ]
      }
    ],
    "id": "pbc_564357473",
    "indexes": [
      "CREATE INDEX idx_attorneys_user ON attorneys (user_id)",
      "CREATE INDEX idx_attorneys_lpc ON attorneys (lpc_number)",
      "CREATE INDEX idx_attorneys_verified ON attorneys (is_verified)"
    ],
    "listRule": "",
    "name": "attorneys",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user_id || @request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_564357473");

  return app.delete(collection);
})
