'use client'
export default function Error({reset}:{error:Error;reset:()=>void}){return <main className="container"><div className="empty" style={{margin:'75px auto'}}><h2>Something went wrong</h2><p className="muted">If this is a new installation, complete database setup as described in README.md.</p><button className="btn" onClick={()=>reset()}>Try again</button></div></main>}
