# Supabase Edge Function Deployment Instructions

## 1. Deployment Using Supabase Dashboard

Since you're encountering Docker TLS handshake issues with the CLI deployment, you can deploy the function directly through the Supabase dashboard:

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (`yytjguijpbahrltqjdks`)
3. Go to "Edge Functions" in the left sidebar
4. Click on "create-payout-request" function (or create a new one if it doesn't exist)
5. In the editor, copy and paste the code from `supabase/functions/create-payout-request/index.ts`
6. Click "Deploy" to update the function

## 2. Creating a Wallet Manually (Alternative to Automatic Creation)

If you prefer to create a wallet manually instead of having the function create it automatically, you can run the following SQL in the Supabase SQL Editor:

```sql
-- SQL statement to insert a wallet with all required fields
INSERT INTO wallets (user_id, balance, currency, wallet_type)
VALUES ('24943464-0ec9-4146-a856-6e97c3a399a2', 1000, 'USD', 'CUSTOMER_HOME');
```

Make sure to replace the `user_id` with the actual user ID if needed.

## 3. Testing the Function

After deployment, you can test the function using cURL or Postman:

```bash
curl -X POST 'https://yytjguijpbahrltqjdks.supabase.co/functions/v1/create-payout-request' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "amount": 100,
    "currency": "USD",
    "payment_method": "BANK_TRANSFER",
    "payment_method_details": {
      "bank_name": "Example Bank",
      "account_number": "1234567890",
      "account_holder": "John Doe"
    },
    "notes": "Withdrawal test"
  }'
```

Replace `YOUR_JWT_TOKEN` with a valid JWT token for authentication.

## Troubleshooting

If you encounter issues with the wallet creation:

1. Check the Supabase logs in the Dashboard (Edge Functions > create-payout-request > Logs)
2. Verify that the user exists in the authentication system
3. Ensure the `wallets` table has the correct schema with the `wallet_type` column defined as a required field
4. If automatic wallet creation fails, use the SQL above to create the wallet manually 