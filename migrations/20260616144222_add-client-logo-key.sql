-- Store the storage object key alongside logo_url so logos can be deleted/replaced.
ALTER TABLE clients ADD COLUMN logo_key TEXT;
