export function money(cents: number | string | null | undefined) { return 'Rs. ' + (Number(cents||0)/100).toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}) }
export function slugify(s:string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,140) }
export function cleanText(value: unknown, max=1000) { return String(value??'').trim().slice(0,max) }
export function validEmail(s:string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) }
export function stringArray(input: unknown): string[] { if(Array.isArray(input)) return input.filter((x):x is string=>typeof x==='string');return [] }
export const districts = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya']
export const statuses = ['pending','confirmed','processing','shipped','delivered','cancelled','returned']
