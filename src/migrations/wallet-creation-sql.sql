-- SQL statement to insert a wallet with all required fields
INSERT INTO wallets (user_id, balance, currency, wallet_type)
VALUES ('24943464-0ec9-4146-a856-6e97c3a399a2', 1000, 'USD', 'CUSTOMER_HOME');
 
-- If you need to create multiple wallets for different users, you can do:
-- INSERT INTO wallets (user_id, balance, currency, wallet_type)
-- VALUES 
--   ('user-id-1', 1000, 'USD', 'CUSTOMER_HOME'),
--   ('user-id-2', 1000, 'USD', 'CUSTOMER_HOME'); 