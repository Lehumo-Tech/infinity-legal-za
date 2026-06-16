/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ti",
        "max": 500,
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
        "hidden": false,
        "id": "f_dt",
        "maxSelect": 1,
        "name": "document_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "contract",
          "pleading",
          "correspondence",
          "court_filing",
          "affidavit",
          "opinion",
          "memo",
          "invoice",
          "consent_form",
          "id_document",
          "other"
        ]
      },
      {
        "hidden": false,
        "id": "f_ws",
        "maxSelect": 1,
        "name": "workflow_status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "draft",
          "review",
          "approved",
          "signed",
          "filed",
          "archived"
        ]
      },
      {
        "hidden": false,
        "id": "f_vr",
        "max": null,
        "min": 1,
        "name": "version",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "f_fu",
        "name": "file_url",
        "onlyDomains": null,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "url"
      },
      {
        "hidden": false,
        "id": "f_fl",
        "maxSelect": 1,
        "maxSize": 52428800,
        "mimeTypes": [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/png",
          "image/jpeg",
          "text/plain"
        ],
        "name": "file",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": null,
        "type": "file"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_pb",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "prepared_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ab",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "approved_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_sb",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "signed_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "f_il",
        "name": "is_locked",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_lb",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "locked_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
      }
    ],
    "id": "pbc_3332084752",
    "indexes": [
      "CREATE INDEX idx_documents_case ON documents (case_id)",
      "CREATE INDEX idx_documents_type ON documents (document_type)",
      "CREATE INDEX idx_documents_workflow ON documents (workflow_status)",
      "CREATE INDEX idx_documents_prepared ON documents (prepared_by)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "documents",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3332084752");

  return app.delete(collection);
})
