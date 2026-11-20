import 'dotenv/config'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {Pool} from 'pg'
async function main(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is missing in .env');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});try{const sql=readFileSync(resolve('db/schema.sql'),'utf8');await pool.query(sql);console.log('✓ DZone Commerce database schema initialized.')}finally{await pool.end()}}
main().catch(e=>{console.error('Database initialization failed:',e);process.exit(1)})
