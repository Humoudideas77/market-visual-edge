
-- Enable real-time for crypto_addresses table
ALTER TABLE crypto_addresses REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE crypto_addresses;
