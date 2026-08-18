export type PeriodKey = "today"|"yesterday"|"this-week"|"last-week"|"this-month"|"last-month"|"this-fy"|"last-fy"|"calendar-year"|"custom";
const day = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export function dateRange(period: PeriodKey = "this-month", now = new Date(), customFrom?: string, customTo?: string) {
  const today = day(now); let from=today, to=today;
  if(period==="yesterday") from=to=addDays(today,-1);
  if(period==="this-week"){ from=addDays(today,-((today.getUTCDay()+6)%7)); }
  if(period==="last-week"){ to=addDays(today,-((today.getUTCDay()+6)%7)-1); from=addDays(to,-6); }
  if(period==="this-month"){ from=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1)); }
  if(period==="last-month"){ from=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth()-1,1)); to=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),0)); }
  if(period==="calendar-year"){ from=new Date(Date.UTC(today.getUTCFullYear(),0,1)); }
  if(period==="this-fy"||period==="last-fy"){ const y=today.getUTCMonth()>=3?today.getUTCFullYear():today.getUTCFullYear()-1; const fy=period==="last-fy"?y-1:y; from=new Date(Date.UTC(fy,3,1)); to=new Date(Date.UTC(fy+1,2,31)); }
  if(period==="custom"&&customFrom&&customTo){ from=new Date(`${customFrom}T00:00:00.000Z`); to=new Date(`${customTo}T00:00:00.000Z`); }
  return { from, to };
}

export function money(value: unknown){ return Number(value ?? 0); }
