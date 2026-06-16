/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "deleteRule": "@request.auth.id = assigned_to || @request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
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
        "id": "f_ti",
        "max": 300,
        "min": 3,
        "name": "title",
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
        "id": "f_de",
        "max": 3000,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
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
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_at",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assigned_to",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_cb",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "created_by",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "f_pr",
        "maxSelect": 1,
        "name": "priority",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "low",
          "medium",
          "high",
          "urgent"
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
          "overdue",
          "cancelled"
        ]
      },
      {
        "hidden": false,
        "id": "f_dd",
        "max": "",
        "min": "",
        "name": "due_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "f_cd",
        "max": "",
        "min": "",
        "name": "completed_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_2602490748",
    "indexes": [
      "CREATE INDEX idx_tasks_status ON tasks (status)",
      "CREATE INDEX idx_tasks_assigned ON tasks (assigned_to)",
      "CREATE INDEX idx_tasks_case ON tasks (case_id)",
      "CREATE INDEX idx_tasks_due ON tasks (due_date)",
      "CREATE INDEX idx_tasks_priority ON tasks (priority)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "tasks",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2602490748");

  return app.delete(collection);
})
