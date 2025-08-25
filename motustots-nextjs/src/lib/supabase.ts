import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}
Logs for your project will appear below. Press Ctrl+C to exit.
Recrawled this watch 1 time, most recently because:
MustScanSubDirs UserDroppedTo resolve, please review the information on
https://facebook.github.io/watchman/docs/troubleshooting.html#recrawl
To clear this warning, run:
`watchman watch-del '/Users/nero/Documents/MotusTots' ; watchman watch-project '/Users/nero/Documents/MotusTots'`

Recrawled this watch 1 time, most recently because:
MustScanSubDirs UserDroppedTo resolve, please review the information on
https://facebook.github.io/watchman/docs/troubleshooting.html#recrawl
To clear this warning, run:
`watchman watch-del '/Users/nero/Documents/MotusTots' ; watchman watch-project '/Users/nero/Documents/MotusTots'`

Android Bundling failed 2845ms index.ts (32 modules)
Unable to resolve "react-native-safe-area-context" from "node_modules/expo-router/build/ExpoRoot.js"

