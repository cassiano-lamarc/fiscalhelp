import { test, expect, Page } from '@playwright/test';
const company={id:'11111111-1111-1111-1111-111111111111',name:'Empresa original',cnpj:null,logoAssetId:null,showHeaderLogo:false,showWatermark:false,confirmedAtUtc:'2026-10-09T12:00:00Z',version:2};
function session(used=0,onboardingComplete=true){return {id:'22222222-2222-2222-2222-222222222222',email:'test@example.com',planTier:'Free',quota:{used,limit:50,remaining:Math.max(0,50-used)},pdfBranding:{showOriginBranding:true,text:'Fiscal Help • Criado por cassianolamarc.com.br',url:'https://cassianolamarc.com.br'},hasGoogleLogin:true,onboardingComplete,company};}
const id='33333333-3333-3333-3333-333333333333';
const quote={id,number:'ORC-000001',issueDate:'2026-10-09',issuedAtUtc:'2026-10-09T13:52:00Z',customerName:'Cliente',items:[{description:'Serviço',quantity:'2',unitPrice:'100.00',lineTotal:'200.00'}],discountAmount:'0.00',subtotal:'200.00',total:'200.00',version:1,snapshot:{name:'Empresa original'},vehicleName:null,vehicleNumber:null,licensePlate:null,subject:null,validityDays:null,commercialConditions:{includePaymentTerms:false,paymentTerms:null,includeWarranty:false,warrantyTerms:null,includeNotes:false,notes:null},includeContactPhone:false,contactPhone:null,includePreparedByName:false,preparedByName:null};
async function mock(page:Page,state:{session:any;quote?:any;profile?:any;delay?:number;requests?:string[]}){
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');state.requests?.push(path);
  const respond=(body:any,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(path==='/me'){if(state.delay)await new Promise(r=>setTimeout(r,state.delay));return respond(state.session||{},state.session?200:401);}
  if(path==='/auth/csrf')return respond({token:'test-token'});
  if(path==='/auth/providers')return respond({google:true});
  if(path==='/me/profile'){if(req.method()==='PATCH'){const body=req.postDataJSON();state.profile={...body,version:body.version+1};}return respond(state.profile||{contactPhone:'+12025550123',preparedByName:'Preparador',version:1});}
  if(path==='/company'){if(req.method()==='PUT'){const body=req.postDataJSON();state.session.company={...company,...body,version:body.version+1};}return respond(state.session.company);}
  if(path==='/quotes'&&req.method()==='GET'){
   const size=Number(url.searchParams.get('pageSize')),index=Number(url.searchParams.get('page'));const count=state.session.quota.used;
   return respond({items:Array.from({length:Math.min(size,Math.max(0,count-(index-1)*size))},(_,i)=>({...quote,id:String(i),number:'ORC-'+String((index-1)*size+i+1).padStart(6,'0')})),totalCount:count,page:index,pageSize:size});
  }
  if(path==='/quotes/calculate')return respond({...quote,...req.postDataJSON()});
  if(path==='/quotes'&&req.method()==='POST'){state.quote={...quote,...req.postDataJSON()};state.session=session(state.session.quota.used+1);return respond(state.quote);}
  if(path===`/quotes/${id}`){if(req.method()==='PUT')state.quote={...state.quote,...req.postDataJSON(),version:2};return respond(state.quote||quote);}
  return respond({detail:'Unexpected test request'},404);
 });
}
for(const mobile of [false,true])test(`editor e empresa editável (${mobile?'celular':'desktop'})`,async({page})=>{
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
 const state={session:session(),quote};await mock(page,state);
 await page.goto('/orcamentos/novo');await expect(page.getByRole('heading',{name:'Novo orçamento',exact:true})).toBeVisible();
 await page.getByLabel('Descrição',{exact:true}).fill('Manutenção');await page.getByLabel('Quantidade',{exact:true}).fill('2');await page.getByLabel('Unitário (R$)',{exact:true}).fill('100');
 await page.getByLabel('Incluir formas de pagamento').check();await page.getByRole('button',{name:'Salvar orçamento',exact:true}).click();
 await expect(page.getByText('Preencha este campo.',{exact:true})).toBeVisible();
 await page.getByLabel('Condições de pagamento').fill('Pix ou cartão');
 await page.getByLabel('Incluir telefone no orçamento').check();await expect(page.getByLabel('Telefone de contato')).toHaveValue('+12025550123');
 await page.getByLabel('Incluir nome de quem realizou o orçamento').check();await expect(page.getByLabel('Orçamento realizado por',{exact:true})).toHaveValue('Preparador');
 await page.getByLabel('Placa opcional').fill('FOREIGN-123');await page.getByRole('button',{name:'Salvar orçamento',exact:true}).click();
 await expect(page.locator('mat-snack-bar-container')).toContainText('Orçamento salvo.');
 await expect(page.locator('mat-snack-bar-container')).toBeHidden({timeout:7000});
 await page.goto('/orcamentos/'+id);await expect(page.getByLabel('Incluir formas de pagamento')).toBeChecked();await expect(page.getByLabel('Condições de pagamento')).toHaveValue('Pix ou cartão');
 await page.goto('/empresa');await expect(page.getByLabel('Nome da empresa')).toBeEnabled();await page.getByLabel('Nome da empresa').fill('Empresa nova');await page.getByRole('button',{name:'Salvar empresa'}).click();await expect(page.getByLabel('Nome da empresa')).toHaveValue('Empresa nova');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/fiscal-help-${mobile?'mobile':'desktop'}.png`,fullPage:true});
});
test('sessão resolvida antes do login e redirecionamento com histórico substituído',async({page})=>{
 const state={session:session(12),delay:250};await mock(page,state);await page.goto('/login');await expect(page).toHaveURL(/\/orcamentos$/);await expect(page.locator('.auth-card')).toHaveCount(0);await page.goto('/');await expect(page.getByRole('link',{name:'Meus orçamentos',exact:true})).toHaveAttribute('href','/orcamentos');
});
test('onboarding incompleto é retomado',async({page})=>{await mock(page,{session:session(0,false)});await page.goto('/register');await expect(page).toHaveURL(/\/empresa$/);});
test('Google exclusivo e marketing gratuito',async({page})=>{const requests:string[]=[];await mock(page,{session:null,requests});await page.goto('/');await expect(page.getByRole('heading',{name:/Comece com orçamentos/})).toBeVisible();await expect(page.getByText(/até 50 orçamentos por conta/)).toBeVisible();await page.goto('/entrar');await expect(page.getByRole('button',{name:'Continuar com Google'})).toBeVisible();await expect(page.getByLabel('E-mail',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Senha',{exact:true})).toHaveCount(0);await expect(page.locator('.google-button img')).toHaveAttribute('src','google-g.png');expect(requests.some(p=>p.includes('password')||p.includes('phone/'))).toBeFalsy();});
test('cota bloqueia criação e paginator usa servidor',async({page})=>{const requests:string[]=[];await mock(page,{session:session(50),requests});await page.goto('/orcamentos');await expect(page.getByRole('button',{name:'Limite gratuito atingido'})).toBeDisabled();await expect(page.locator('mat-paginator')).toContainText('1 – 10 de 50');await page.getByRole('button',{name:'Próxima página'}).click();await expect(page.locator('mat-paginator')).toContainText('11 – 20 de 50');expect(requests.filter(p=>p==='/quotes').length).toBeGreaterThan(1);await page.goto('/orcamentos/'+id);await expect(page.getByRole('button',{name:'Salvar orçamento',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Gerar e baixar PDF ↓'})).toBeEnabled();});
test('erro transitório encerra em 8 s e validação permanece no campo',async({page})=>{
 const state={session:session(1),quote};await mock(page,state);await page.goto('/orcamentos/'+id);
 await page.getByLabel('Incluir formas de pagamento').check();await page.getByLabel('Condições de pagamento').fill('Texto para validar');
 await page.route('**/api/v1/quotes/'+id,route=>route.request().method()==='PUT'?route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({detail:'Revise as condições comerciais.',fieldErrors:{'commercialConditions.paymentTerms':['Texto rejeitado pelo servidor.']}})}):route.fallback());
 await page.getByRole('button',{name:'Salvar orçamento',exact:true}).click();
 await expect(page.locator('mat-snack-bar-container')).toContainText('Revise as condições comerciais.');
 await expect(page.locator('.field-error')).toContainText('Texto rejeitado pelo servidor.');
 await expect(page.locator('mat-snack-bar-container')).toBeHidden({timeout:10000});
 await expect(page.locator('.field-error')).toContainText('Texto rejeitado pelo servidor.');
 await page.getByLabel('Condições de pagamento').fill('Pix');await expect(page.getByText('Texto rejeitado pelo servidor.',{exact:true})).toHaveCount(0);
});
test('CTA mantém contraste e foco no celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mock(page,{session:null});await page.goto('/');
 const button=page.locator('.hero-copy .signup-cta');
 const contrast=async()=>button.evaluate(element=>{const style=getComputedStyle(element);const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);const luminance=(c:number[])=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const a=luminance(rgb(style.color)),b=luminance(rgb(style.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
 expect(await contrast()).toBeGreaterThanOrEqual(4.5);await button.hover();expect(await contrast()).toBeGreaterThanOrEqual(4.5);await button.focus();await expect(button).toBeFocused();expect(await contrast()).toBeGreaterThanOrEqual(4.5);
 await page.route('**/api/v1/auth/providers',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({google:false})}));await page.goto('/entrar');
 const disabled=page.locator('.google-button');await expect(disabled).toBeDisabled();
 const ratio=await disabled.evaluate(element=>{const style=getComputedStyle(element),opacity=Number(style.opacity);const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);const background=rgb(style.backgroundColor),foreground=rgb(style.color).map((v,i)=>v*opacity+255*(1-opacity));const luminance=(c:number[])=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);return (luminance(background)+.05)/(luminance(foreground)+.05);});expect(ratio).toBeGreaterThanOrEqual(4.5);

});
