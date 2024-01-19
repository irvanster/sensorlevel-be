import { Pool } from 'pg'

const connectionString = process.env.DB_CONNECTION_STRING
const db = new Pool({ connectionString })

db.connect((err)=> {
    if(err) {
        return console.log(err.message)
    }else {
        console.log(`Database success connected: ${connectionString}`)
    }
})



export default db