# Database Connection Troubleshooting

## Current .env Configuration

Your `.env` file should have:
```env
PORT=3001
DATABASE_URL=postgresql://postgres.jwztimxuidvqzpulflxk:Rim2025%21%21%23%23@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=super-secret-change-me-in-production
```

## Common Issues & Solutions

### 1. SSL Connection Required
✅ **Fixed**: TypeORM config now includes SSL for Supabase connections.

### 2. Pooler vs Direct Connection
Your URL uses Supabase **pooler** (`pooler.supabase.com`). This is fine, but if you have issues, try:

**Option A: Direct Connection (from Supabase Dashboard)**
- Go to Supabase Dashboard → Project Settings → Database
- Copy the **Connection string** (not the pooler one)
- Replace `DATABASE_URL` in `.env`

**Option B: Add Connection Pooling Parameters**
Add to your connection string:
```
?pgbouncer=true&connection_limit=1
```

### 3. Verify Database URL Format
The format should be:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Your current format looks correct:
- User: `postgres.jwztimxuidvqzpulflxk`
- Password: `Rim2025!!##` (URL encoded as `Rim2025%21%21%23%23`)
- Host: `aws-1-ap-southeast-1.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`

### 4. Test Connection Manually

**Using psql (if installed):**
```bash
psql "postgresql://postgres.jwztimxuidvqzpulflxk:Rim2025!!##@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Using Node.js script:**
Create `test-db.js`:
```javascript
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.jwztimxuidvqzpulflxk:Rim2025!!##@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Database connection successful!');
    client.end();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    client.end();
  });
```

Run: `node test-db.js`

### 5. Check Supabase Dashboard
- Verify your project is **active** (not paused)
- Check if your IP is **allowed** (if IP restrictions are enabled)
- Verify the **password** is correct

### 6. Alternative: Use Connection Parameters Instead of URL

If URL doesn't work, try splitting it into parameters in `app.module.ts`:

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    username: 'postgres.jwztimxuidvqzpulflxk',
    password: 'Rim2025!!##',
    database: 'postgres',
    autoLoadEntities: true,
    synchronize: true,
    ssl: { rejectUnauthorized: false },
  }),
}),
```

### 7. Check Backend Logs
When you run `npm run start:dev`, look for:
- ✅ `TypeORM successfully connected`
- ❌ `Unable to connect to the database`
- ❌ `Connection timeout`
- ❌ `SSL required`

### 8. Firewall / Network Issues
- Ensure your network allows outbound connections to port 5432
- Check if corporate firewall is blocking Supabase
- Try from a different network (mobile hotspot) to test

### 9. Supabase Connection String Types

From Supabase Dashboard, you can get:
1. **Connection Pooling** (Session mode) - Good for serverless
2. **Direct Connection** - Good for long-lived connections
3. **Transaction mode** - For transactions

For NestJS, try **Direct Connection** first.

### 10. Environment Variable Not Loading

Verify `.env` is in the correct location:
- Should be in: `utopia-by-rim/backend/.env`
- Not in: `utopia-by-rim/.env` or root folder

Check if ConfigModule is loading:
```typescript
// In app.module.ts, temporarily add:
console.log('DATABASE_URL:', config.get<string>('DATABASE_URL'));
```

## Quick Test Steps

1. **Verify .env file exists and has correct values**
2. **Restart backend**: Stop and run `npm run start:dev` again
3. **Check console output** for connection errors
4. **Test with psql** or Node.js script (see #4 above)
5. **Try direct connection** from Supabase dashboard
6. **Check Supabase project status** in dashboard

## Expected Backend Startup Output

If everything works, you should see:
```
🚀 Utopia backend running on http://localhost:3001/api
✅ Seeded default owner: owner@utopiabyrim.com / owner123
```

If database connection fails, you'll see:
```
❌ Error: connect ECONNREFUSED
❌ Error: Connection timeout
❌ Error: SSL required
```

## Still Having Issues?

1. **Share the exact error message** from backend console
2. **Check Supabase Dashboard** → Database → Connection Info
3. **Try creating a new connection string** from Supabase dashboard
4. **Verify password** is correct (try resetting in Supabase)





