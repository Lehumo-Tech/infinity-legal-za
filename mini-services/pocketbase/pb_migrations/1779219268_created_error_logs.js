/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
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
        "hidden": false,
        "id": "f_et",
        "maxSelect": 1,
        "name": "error_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "runtime",
          "api",
          "database",
          "auth",
          "validation",
          "network",
          "unknown"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ms",
        "max": 2000,
        "min": 1,
        "name": "message",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_st",
        "max": 10000,
        "min": 0,
        "name": "stack_trace",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "f_ur",
        "name": "url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "f_rs",
        "name": "resolved",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      }
    ],
    "id": "pbc_1246247920",
    "indexes": [
      "CREATE INDEX idx_errors_type ON error_logs (error_type)",
      "CREATE INDEX idx_errors_resolved ON error_logs (resolved)"
    ],
    "listRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "name": "error_logs",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1246247920");

  return app.delete(collection);
})
