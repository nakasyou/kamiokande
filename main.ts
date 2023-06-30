import { Hono } from "https://deno.land/x/hono@v3.2.7/mod.ts"
import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const app = new Hono()

app.get('/realtime', async ctx => {
  //app.header("Access-Control-Allow-Origin", "*")
  return ctx.body('a')//await fetch("https://www-sk.icrr.u-tokyo.ac.jp/realtimemonitor/skev.gif")
})
serve(app.fetch)
