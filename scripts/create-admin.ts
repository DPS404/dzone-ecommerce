import 'dotenv/config'
import {Pool} from 'pg'
import bcrypt from 'bcryptjs'
async function main(){const email=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();const pwd=String(process.env.ADMIN_PASSWORD||'');if(!process.env.DATABASE_URL||!email||!pwd||pwd.length<12||!/[A-Z]/.test(pwd)||!/[0-9]/.test(pwd))throw Error('Set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (at least 12 characters, uppercase and digit) in .env');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});try{const hash=await bcrypt.hash(pwd,12);const r=await pool.query(`INSERT INTO users(full_name,email,phone,password_hash,role) VALUES('DZone Administrator',$1,'',$2,'admin') ON CONFLICT(email) DO NOTHING RETURNING id`,[email,hash]);if(!r.rows.length)throw Error('Account already exists for this email. Admin was not changed.');console.log('✓ Admin account created:',email)}finally{await pool.end()}}
main().catch(e=>{console.error(e.message);process.exit(1)})
