/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "fn_custom",
    "max": 200,
    "min": 0,
    "name": "full_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "ph_custom",
    "max": 20,
    "min": 0,
    "name": "phone",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "rl_custom",
    "maxSelect": 1,
    "name": "role",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "managing_director",
      "senior_partner",
      "associate",
      "paralegal",
      "legal_officer",
      "supervising_officer",
      "senior_consultant",
      "consultant",
      "candidate_attorney",
      "hr_manager",
      "finance_manager",
      "office_administrator",
      "systems_admin",
      "receptionist",
      "client",
      "guest"
    ]
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "dp_custom",
    "maxSelect": 1,
    "name": "department",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "management",
      "litigation",
      "conveyancing",
      "family_law",
      "corporate",
      "criminal_law",
      "estate_planning",
      "consulting",
      "hr",
      "finance",
      "it",
      "administration"
    ]
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "bn_custom",
    "max": 50,
    "min": 0,
    "name": "bar_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "hd_custom",
    "max": "",
    "min": "",
    "name": "hire_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "ia_custom",
    "name": "is_active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "pe_custom",
    "max": "",
    "min": "",
    "name": "password_expires_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "lc_custom",
    "max": "",
    "min": "",
    "name": "last_password_change",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "ev_custom",
    "name": "email_verified",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("fn_custom")

  // remove field
  collection.fields.removeById("ph_custom")

  // remove field
  collection.fields.removeById("rl_custom")

  // remove field
  collection.fields.removeById("dp_custom")

  // remove field
  collection.fields.removeById("bn_custom")

  // remove field
  collection.fields.removeById("hd_custom")

  // remove field
  collection.fields.removeById("ia_custom")

  // remove field
  collection.fields.removeById("pe_custom")

  // remove field
  collection.fields.removeById("lc_custom")

  // remove field
  collection.fields.removeById("ev_custom")

  return app.save(collection)
})
