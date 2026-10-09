import { test, expect, Page } from '@playwright/test';
const company={id:'11111111-1111-1111-1111-111111111111',name:'Empresa original',cnpj:null,logoAssetId:null,showHeaderLogo:false,showWatermark:false,confirmedAtUtc:'2026-10-09T12:00:00Z',version:2};
function session(used=0,onboardingComplete=true){return {id:'22222222-2222-2222-2222-222222222222',email:'test@example.com',planTier:'Free',quota:{used,limit:50,remaining:Math.max(0,50-used)},pdfBranding:{showOriginBranding:true,text:'Fiscal Help • Criado por cassianolamarc.com.br',url:'https://cassianolamarc.com.br'},hasGoogleLogin:true,onboardingComplete,company};}
const id='33333333-3333-3333-3333-333333333333';
const quote={id,number:'ORC-000001',issueDate:'2026-10-09',issuedAtUtc:'2026-10-09T13:52:00Z',customerName:'Cliente',items:[{description:'Serviço',quantity:'2',unitPrice:'100.00',lineTotal:'200.00'}],discountAmount:'0.00',subtotal:'200.00',total:'200.00',version:1,snapshot:{name:'Empresa original'},vehicleName:null,vehicleNumber:null,licensePlate:null,subject:null,validityDays:null,commercialConditions:{includePaymentTerms:false,paymentTerms:null,includeWarranty:false,warrantyTerms:null,includeNotes:false,notes:null},includeContactPhone:false,contactPhone:null,includePreparedByName:false,preparedByName:null};
test('WhatsApp fallback downloads the PDF with its name and opens only a message', async ({page}) => {
 await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', {value: undefined, configurable: true}));
 await mock(page, {session: session(1)});
 await page.route('**/api/v1/quotes/*/pdf', route => route.fulfill({contentType:'application/pdf', body:'%PDF-1.4 fixture'}));
 await page.goto('/orcamentos');
 await page.locator('.desktop-history').getByRole('button', {name:'Compartilhar no WhatsApp'}).click();
 const dialog = page.locator('dialog[open]');
 const download = dialog.getByRole('link', {name:'Baixar PDF'});
 await expect(download).toHaveAttribute('download', 'orc_Cliente_ORC-000001.pdf');
 const event = page.waitForEvent('download'); await download.click();
 expect((await event).suggestedFilename()).toBe('orc_Cliente_ORC-000001.pdf');
 const href = await dialog.getByRole('link', {name:'Abrir WhatsApp'}).getAttribute('href');
 const url = new URL(href!); expect(url.origin).toBe('https://wa.me');
 expect(url.searchParams.get('text')).toContain('ORC-000001');
 expect(href).not.toContain('onrender');
 await dialog.getByRole('button', {name:'Fechar'}).click(); await expect(dialog).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('.mobile-history').getByRole('button', {name:'Compartilhar no WhatsApp'})).toBeVisible();
});

test('WhatsApp native file share saves edits and handles cancellation without errors', async ({page}) => {
 await page.addInitScript(() => {
  Object.defineProperty(navigator, 'canShare', {value: (data: ShareData) => !!data.files?.length, configurable:true});
  Object.defineProperty(navigator, 'share', {value: async (data: ShareData) => {
   (window as any).shared = {name:data.files![0].name, type:data.files![0].type, size:data.files![0].size, active:navigator.userActivation.isActive};
   throw new DOMException('Cancelled', 'AbortError');
  }, configurable:true});
 });
 const state = {session:session(1), quote}; await mock(page,state);
 await page.route('**/api/v1/quotes/*/pdf', route => route.fulfill({contentType:'application/pdf', body:'%PDF-1.4 fixture'}));
 await page.goto('/orcamentos/'+id);
 await page.getByLabel('Nome do cliente').fill('Cliente atualizado');
 await page.getByRole('button', {name:'Compartilhar no WhatsApp'}).click();
 const dialog = page.locator('dialog[open]');
 await dialog.getByRole('button', {name:'Compartilhar PDF', exact:true}).click();
 expect(state.quote.customerName).toBe('Cliente atualizado');
 expect(await page.evaluate(() => (window as any).shared)).toEqual({name:'orc_Cliente atualizado_ORC-000001.pdf',type:'application/pdf',size:16,active:true});
 await expect(dialog.getByRole('alert')).toHaveCount(0);
 await dialog.getByRole('button',{name:'Fechar'}).click();
});

test('WhatsApp PDF failure allows closing and retrying', async ({page}) => {
 await mock(page,{session:session(1),quote});
 await page.route('**/api/v1/quotes/*/pdf', route => route.fulfill({status:500}));
 await page.goto('/orcamentos/'+id);
 await page.getByRole('button',{name:'Compartilhar no WhatsApp'}).click();
 await expect(page.locator('dialog[open]').getByRole('alert')).toContainText('Não foi possível preparar');
 await page.locator('dialog[open]').getByRole('button',{name:'Fechar'}).click();
 await expect(page.getByRole('button',{name:'Compartilhar no WhatsApp'})).toBeEnabled();
});
async function mock(page:Page,state:{session:any;quote?:any;profile?:any;delay?:number;requests?:string[];jwt?:boolean}){
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1','');state.requests?.push(path);
  expect(url.origin).toBe('https://fiscalhelp-backend.onrender.com');
  if(state.jwt){expect(req.headers()['authorization']).toBe('Bearer fixture.jwt.token');expect(req.headers()['cookie']).toBeUndefined();}
  if (!state.jwt && !['GET','HEAD','OPTIONS'].includes(req.method())) expect(req.headers()['x-xsrf-token']).toBe('test-token');
  const respond=(body:any,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(path==='/me'){if(state.delay)await new Promise(r=>setTimeout(r,state.delay));return respond(state.session||{},state.session?200:401);}
  if(path==='/auth/csrf')return respond({token:'test-token'});
  if(path==='/auth/providers')return respond({google:true});
  if(path==='/auth/logout'){state.session=null;state.jwt=false;return route.fulfill({status:204});}
  if(path.startsWith('/assets/'))return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/p8AAAAASUVORK5CYII=','base64')});
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
  const availableButton=page.locator('.google-button');await expect(availableButton).toBeEnabled();
 const ratio=await availableButton.evaluate(element=>{const style=getComputedStyle(element),opacity=Number(style.opacity);const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);const background=rgb(style.backgroundColor),foreground=rgb(style.color).map((v,i)=>v*opacity+255*(1-opacity));const luminance=(c:number[])=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);return (luminance(background)+.05)/(luminance(foreground)+.05);});expect(ratio).toBeGreaterThanOrEqual(4.5);

});

test('Google navigation works without provider availability lookup', async ({page}) => {
 await mock(page, {session:null});
 await page.route('**/api/v1/auth/providers', route => route.fulfill({status:503,body:'Unavailable'}));
 await page.route('**/api/v1/auth/google/start?**', route => route.fulfill({contentType:'text/html',body:'Google redirect fixture'}));
 await page.goto('/entrar');
 const origin = new URL(page.url()).origin;
 const button = page.getByRole('button',{name:'Continuar com Google'});
 await expect(button).toBeEnabled();
 const request = page.waitForRequest(req => new URL(req.url()).pathname === '/api/v1/auth/google/start');
 await button.click();
 const url = new URL((await request).url());
 expect(url.origin).toBe('https://fiscalhelp-backend.onrender.com');
 expect(url.searchParams.get('frontendOrigin')).toBe(origin);
 expect(url.searchParams.get('returnUrl')).toBe('/orcamentos');
});

test('JWT callback exchanges code, persists per tab and authenticates writes and logo without cookies',async({page,context})=>{
 await page.addInitScript(()=>sessionStorage.setItem('fiscalhelp.login-proof','v'.repeat(64)));
 await context.addCookies([{name:'orcefacil.session',value:'legacy-cookie',domain:'fiscalhelp-backend.onrender.com',path:'/',secure:true,sameSite:'None'}]);
 const state={session:{...session(),company:{...company,logoAssetId:'fixture-logo'}},jwt:true,requests:[] as string[]};
 await mock(page,state);
 let exchanges=0;
 await page.route('**/api/v1/auth/token',async route=>{
  exchanges++;
  expect(route.request().postDataJSON()).toEqual({code:'c'.repeat(43),codeVerifier:'v'.repeat(64)});
  expect(route.request().headers()['x-xsrf-token']).toBeUndefined();
  await route.fulfill({contentType:'application/json',body:JSON.stringify({accessToken:'fixture.jwt.token',expiresAtUtc:'2100-01-01T00:00:00Z',returnUrl:'/dados-usuario'})});
 });
 await page.goto('/auth/callback#code='+'c'.repeat(43));
 await expect(page).toHaveURL(url=>url.pathname==='/dados-usuario');
 await page.getByLabel('Nome padrão de quem prepara o orçamento').fill('JWT preparador');
 await page.getByRole('button',{name:'Salvar dados'}).click();
 await expect(page.getByText('Dados do usuário salvos.')).toBeVisible();
 expect(await page.evaluate(()=>sessionStorage.getItem('fiscalhelp.login-proof'))).toBeNull();
 await page.reload();await expect(page.getByRole('heading',{name:'Dados do usuário'})).toBeVisible();
 expect(exchanges).toBe(1);
 await page.getByRole('link',{name:'Minha empresa'}).click();
 await expect(page.getByAltText('Logo da empresa')).toHaveAttribute('src',/^blob:/);
 expect(state.requests.some(p=>p.startsWith('/assets/'))).toBeTruthy();
 await page.getByRole('button',{name:'Sair'}).click();await expect(page.getByRole('link',{name:'Entrar',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>sessionStorage.getItem('fiscalhelp.jwt'))).toBeNull();
});

test('Expired JWT is removed before requesting the API',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('fiscalhelp.jwt',JSON.stringify({accessToken:'expired',expiresAtUtc:'2000-01-01T00:00:00Z'})));
 await mock(page,{session:null});
 await page.route('**/api/v1/me',route=>{expect(route.request().headers()['authorization']).toBeUndefined();return route.fulfill({status:401,contentType:'application/json',body:'{}'});});
 await page.goto('/orcamentos');await expect(page).toHaveURL(url=>url.pathname==='/entrar');
 expect(await page.evaluate(()=>sessionStorage.getItem('fiscalhelp.jwt'))).toBeNull();
});
