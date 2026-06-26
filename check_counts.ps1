$env:PGPASSWORD = '1234'
$exe = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$db = "Ninety_Nine"
$sql = @"
SELECT 'users' AS t, count(*)::int AS n FROM users
UNION ALL SELECT 'stalls', count(*)::int FROM stalls
UNION ALL SELECT 'categories', count(*)::int FROM categories
UNION ALL SELECT 'products', count(*)::int FROM products
UNION ALL SELECT 'reviews', count(*)::int FROM reviews
UNION ALL SELECT 'wishlist', count(*)::int FROM wishlist_items
UNION ALL SELECT 'cart', count(*)::int FROM cart_items
UNION ALL SELECT 'orders', count(*)::int FROM orders
ORDER BY t;
"@
& $exe -U postgres -h localhost -p 5432 -d $db -c $sql
"exit=$LASTEXITCODE"