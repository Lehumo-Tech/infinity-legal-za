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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ep",
        "max": 200,
        "min": 1,
        "name": "endpoint",
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
        "id": "f_mt",
        "max": 10,
        "min": 1,
        "name": "method",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_sc",
        "max": 599,
        "min": 100,
        "name": "status_code",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "f_rt",
        "max": null,
        "min": 0,
        "name": "response_time_ms",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
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
      }
    ],
    "id": "pbc_2116189826",
    "indexes": [
      "CREATE INDEX idx_analytics_endpoint ON api_analytics (endpoint)",
      "CREATE INDEX idx_analytics_status ON api_analytics (status_code)"
    ],
    "listRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    "name": "api_analytics",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2116189826");

  return app.delete(collection);
})
