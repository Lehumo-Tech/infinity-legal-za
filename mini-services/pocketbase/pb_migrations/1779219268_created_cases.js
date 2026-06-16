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
        "id": "f_mn",
        "max": 50,
        "min": 1,
        "name": "matter_number",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_de",
        "max": 5000,
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
        "hidden": false,
        "id": "f_ct",
        "maxSelect": 1,
        "name": "case_type",
        "presentable": false,
        "required": true,
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
          "personal_injury",
          "other"
        ]
      },
      {
        "hidden": false,
        "id": "f_ur",
        "maxSelect": 1,
        "name": "urgency",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "low",
          "medium",
          "high",
          "critical"
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
          "intake",
          "pending_review",
          "active",
          "on_hold",
          "settled",
          "closed",
          "archived"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ci",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "client_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_la",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lead_attorney_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_sp",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "support_paralegal_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "f_cd",
        "max": "",
        "min": "",
        "name": "court_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "f_fd",
        "max": "",
        "min": "",
        "name": "filing_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "f_cl",
        "max": "",
        "min": "",
        "name": "closing_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "f_ev",
        "max": null,
        "min": 0,
        "name": "estimated_value",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "f_aa",
        "maxSize": 0,
        "name": "ai_analysis",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "f_hr",
        "name": "is_high_risk",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_na",
        "max": 500,
        "min": 0,
        "name": "next_action",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_nd",
        "max": "",
        "min": "",
        "name": "next_action_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_3613244768",
    "indexes": [
      "CREATE INDEX idx_cases_status ON cases (status)",
      "CREATE INDEX idx_cases_case_type ON cases (case_type)",
      "CREATE INDEX idx_cases_client_id ON cases (client_id)",
      "CREATE INDEX idx_cases_lead_attorney ON cases (lead_attorney_id)",
      "CREATE INDEX idx_cases_matter_number ON cases (matter_number)",
      "CREATE INDEX idx_cases_urgency ON cases (urgency)"
    ],
    "listRule": "@request.auth.id != ''",
    "name": "cases",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3613244768");

  return app.delete(collection);
})
