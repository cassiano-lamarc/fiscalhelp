export const defaultTimeZone = 'America/Sao_Paulo';
function calendarDay(date:Date,timeZone:string){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=(type:string)=>Number(parts.find(p=>p.type===type)?.value);
  return Date.UTC(get('year'),get('month')-1,get('day'));
}
export function emissionLabel(issuedAtUtc:string|null,issueDate:string,now=new Date(),timeZone=defaultTimeZone):string {
  if(!issuedAtUtc){const [year,month,day]=issueDate.split('-');return `${day}/${month}/${year}`;}
  const issued=new Date(issuedAtUtc);
  const days=(calendarDay(now,timeZone)-calendarDay(issued,timeZone))/86400000;
  const date=days===0?'Hoje':days===1?'Ontem':new Intl.DateTimeFormat('pt-BR',{timeZone,day:'2-digit',month:'2-digit',year:'numeric'}).format(issued);
  const time=new Intl.DateTimeFormat('pt-BR',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(issued).replace(':','h');
  return `${date} às ${time}`;
}
export function absoluteEmission(issuedAtUtc:string|null,issueDate:string,timeZone=defaultTimeZone){
  return issuedAtUtc?new Intl.DateTimeFormat('pt-BR',{timeZone,dateStyle:'short',timeStyle:'short'}).format(new Date(issuedAtUtc))+' ('+timeZone+')':emissionLabel(null,issueDate);
}
