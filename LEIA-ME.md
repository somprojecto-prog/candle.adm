# Site admin (login + manager + API)

1. Supabase > SQL Editor: cola o conteúdo de supabase.sql e clica em Run.
2. Vercel > Add New Project > importa ESTE repositório (candle-admin).
3. Vercel > Settings > Environment Variables (ver .env.example):
   DATABASE_URL, DIRECT_URL, AUTH_SECRET (32+ caracteres aleatórios),
   ADMIN_EMAIL, ADMIN_PASSWORD, STORE_ORIGIN, ORDER_UNIT_PRICE, CURRENCY.
4. Deploy. Abre /login e entra com ADMIN_EMAIL / ADMIN_PASSWORD
   (o primeiro login cria o administrador). Depois cria gestores em Utilizadores.
5. Na LOJA (projeto da Vercel da loja), acrescenta:
   NEXT_PUBLIC_ADMIN_URL = https://<endereço-do-site-admin>   (sem "/" no fim)
   e faz Redeploy.
