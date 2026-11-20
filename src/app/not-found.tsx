import Link from 'next/link'
export default function NotFound(){return <main className="container"><div className="empty" style={{margin:'80px auto'}}><div className="eyebrow">404 · PAGE NOT FOUND</div><h1 style={{fontSize:40}}>Nothing here, yet.</h1><p className="muted">The page may have moved or the product is unavailable.</p><Link href="/" className="btn">Back to homepage</Link></div></main>}
