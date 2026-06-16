/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.body.consent_given = true && @request.body.popia_consent = true",
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
        "id": "f_ri",
        "max": 50,
        "min": 1,
        "name": "reference_id",
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
        "id": "f_fn",
        "max": 200,
        "min": 2,
        "name": "full_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "f_em",
        "name": "email",
        "onlyDomains": null,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "email"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_ph",
        "max": 20,
        "min": 0,
        "name": "phone",
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
        "id": "f_in",
        "max": 13,
        "min": 0,
        "name": "id_number",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_de",
        "max": 5000,
        "min": 10,
        "name": "description",
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
        "id": "f_op",
        "max": 200,
        "min": 0,
        "name": "opposing_party",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_ur",
        "maxSelect": 1,
        "name": "urgency",
        "presentable": false,
        "required": false,
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
        "id": "f_hd",
        "name": "has_documents",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "f_cg",
        "name": "consent_given",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "f_pc",
        "name": "popia_consent",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
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
        "id": "f_st",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "submitted",
          "under_review",
          "converted",
          "rejected"
        ]
      }
    ],
    "id": "pbc_446561784",
    "indexes": [
      "CREATE INDEX idx_intake_email ON intake_submissions (email)",
      "CREATE INDEX idx_intake_status ON intake_submissions (status)",
      "CREATE INDEX idx_intake_case_type ON intake_submissions (case_type)",
      "CREATE INDEX idx_intake_reference ON intake_submissions (reference_id)"
    ],
    "listRule": "",
    "name": "intake_submissions",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_446561784");

  return app.delete(collection);
})
