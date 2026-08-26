import {DataTypes } from "sequelize";
import {Sequelize } from "sequelize";
const db = new Sequelize(process.env.Database_Name,
process.env.Database_User,
process.env.Database_Password,
{
  host: process.env.Database_Host,
  port: process.env.Database_Port,
  dialect: "mysql",
})

export default db;