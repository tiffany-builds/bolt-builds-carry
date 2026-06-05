import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const title = url.searchParams.get('title') || ''
  const date = url.searchParams.get('date') || ''
  const time = url.searchParams.get('time') || ''
  const emoji = url.searchParams.get('emoji') || ''
  if (!title || !date) return new Response('Missing title or date', { status: 400 })
  const pad = (n: number) => String(n).padStart(2, '0')
  const [year, month, day] = date.split('-').map(Number)
  let startStr: string, endStr: string
  if (time) {
    const [hours, minutes] = time.split(':').map(Number)
    startStr = `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`
    endStr = `${year}${pad(month)}${pad(day)}T${pad(hours + 1)}${pad(minutes)}00`
  } else {
    startStr = `${year}${pad(month)}${pad(day)}`
    endStr = `${year}${pad(month)}${pad(day)}`
  }
  const eventTitle = emoji ? `From Carry: ${emoji} ${title}` : `From Carry: ${title}`
  const icsContent = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Carry//Carry App//EN','BEGIN:VEVENT',`DTSTART${time ? '' : ';VALUE=DATE'}:${startStr}`,`DTEND${time ? '' : ';VALUE=DATE'}:${endStr}`,`SUMMARY:${eventTitle}`,'DESCRIPTION:Added by Carry',`UID:carry-${Date.now()}@carry-app`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
  return new Response(icsContent, { headers: { 'Content-Type': 'text/calendar;charset=utf-8', 'Content-Disposition': 'attachment; filename="carry-event.ics"', 'Access-Control-Allow-Origin': '*' } })
})
