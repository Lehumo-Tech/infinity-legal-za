/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "deleteRule": "@request.auth.role = 'managing_director'",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_fn",
        "max": 500,
        "min": 1,
        "name": "filename",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_sb",
        "max": null,
        "min": 0,
        "name": "size_bytes",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "f_bt",
        "maxSelect": 1,
        "name": "backup_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "manual",
          "scheduled",
          "auto"
        ]
      },
      {
        "hidden": false,
        "id": "f_st",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "pending",
          "in_progress",
          "completed",
          "failed"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_er",
        "max": 2000,
        "min": 0,
        "name": "error",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_160104656",
    "indexes": [
      "CREATE INDEX idx_backup_status ON backup_records (status)",
      "CREATE INDEX idx_backup_type ON backup_records (backup_type)"
    ],
    "listRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "name": "backup_records",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "viewRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_160104656");

  return app.delete(collection);
})
