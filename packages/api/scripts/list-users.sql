-- List all registered users
SELECT 
  id,
  name,
  email,
  email_verified,
  username,
  display_username,
  role,
  plan,
  banned,
  ban_reason,
  datetime(created_at/1000, 'unixepoch') as created_at,
  datetime(updated_at/1000, 'unixepoch') as updated_at
FROM user
ORDER BY id;

