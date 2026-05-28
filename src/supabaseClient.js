import { createClient } from '@supabase/supabase-js';

// Validamos de forma estricta que las variables existan para evitar fallos silenciosos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "🚨 [Cookies & Mushrooms] Error: Faltan las variables de entorno de Supabase. " +
    "Verifica tu archivo .env en local o las configuraciones en Vercel."
  );
}

// Inicialización dinámica del cliente según el entorno actual (Staging, Prod o Local)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);