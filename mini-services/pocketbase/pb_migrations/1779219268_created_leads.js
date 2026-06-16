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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_nm",
        "max": 200,
        "min": 2,
        "name": "name",
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
        "hidden": false,
        "id": "f_sr",
        "maxSelect": 1,
        "name": "source",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "website",
          "referral",
          "walk_in",
          "social_media",
          "advertisement",
          "cold_call",
          "other"
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
          "new",
          "contacted",
          "qualified",
          "consultation_scheduled",
          "retained",
          "lost",
          "disqualified"
        ]
      },
      {
        "hidden": false,
        "id": "f_ct",
        "maxSelect": 1,
        "name": "case_type",
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
          "personal_injury",
          "other"
        ]
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ap",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assigned_paralegal_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "f_ao",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assigned_officer_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "f_ls",
        "max": 100,
        "min": 0,
        "name": "lead_score",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "f_qn",
        "max": 2000,
        "min": 0,
        "name": "qualification_notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "f_evl",
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
        "id": "f_fc",
        "max": "",
        "min": "",
        "name": "first_contact_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "f_sl",
        "max": "",
        "min": "",
        "name": "sla_deadline",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3613244768",
        "hidden": false,
        "id": "f_cc",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "converted_case_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_3705076665",
    "indexes": [
      "CREATE INDEX idx_leads_status ON leads (status)",
      "CREATE INDEX idx_leads_source ON leads (source)",
      "CREATE INDEX idx_leads_email ON leads (email)",
      "CREATE INDEX idx_leads_assigned ON leads (assigned_paralegal_id)",
      "CREATE INDEX idx_leads_sla ON leads (sla_deadline)"
    ],
    "listRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "name": "leads",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    "viewRule": "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076665");

  return app.delete(collection);
})
