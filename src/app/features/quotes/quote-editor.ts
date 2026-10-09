import { WhatsappShare } from '../../shared/whatsapp-share';
import { quotePdfFilename } from '../../shared/quote-pdf-filename';
﻿import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, Subscription } from 'rxjs';
import { ApiService, Quote, QuoteInput, UserProfile } from '../../core/http/api.service';
import { FieldError } from '../../shared/field-error';

@Component({selector:'app-quote-editor',imports:[WhatsappShare,ReactiveFormsModule,RouterLink,CurrencyPipe,MatButtonModule,FieldError],templateUrl:'./quote-editor.html',styleUrl:'./quote-editor.scss'})
export class QuoteEditor implements OnInit,OnDestroy {
  api=inject(ApiService);private fb=inject(FormBuilder);private route=inject(ActivatedRoute);private sanitizer=inject(DomSanitizer);
  saved=signal<Quote|null>(null);calculated=signal<Quote|null>(null);busy=signal(true);calcError=signal('');preview=signal<SafeResourceUrl|null>(null);
  private previewUrl='';private subscriptions=new Subscription();private generation=0;private key=crypto.randomUUID();private keyPayload='';
  optionalFields = [
    {key:'vehicleName',label:'Veículo / modelo',max:150}, {key:'vehicleNumber',label:'Nº do veículo',max:50},
    {key:'licensePlate',label:'Placa',max:20}, {key:'subject',label:'Assunto',max:250},
  ] as const;
  form=this.fb.nonNullable.group({
    issueDate:[this.today(),Validators.required],customerName:['',Validators.maxLength(150)],
    vehicleName:['',Validators.maxLength(150)],vehicleNumber:['',Validators.maxLength(50)],licensePlate:['',Validators.maxLength(20)],subject:['',Validators.maxLength(250)],
    validityDays:this.fb.control<number|null>(null,[Validators.min(1),Validators.max(365),Validators.pattern(/^\d+$/)]),
    includeContactPhone:[false],contactPhone:['',Validators.maxLength(50)],includePreparedByName:[false],preparedByName:['',Validators.maxLength(150)],
    commercialConditions:this.fb.nonNullable.group({includePaymentTerms:[false],paymentTerms:[''],includeWarranty:[false],warrantyTerms:[''],includeNotes:[false],notes:['']}),
    discountEnabled:[false],discountAmount:['0.00'],items:this.fb.array([this.item()]),
  });
  get items(){return this.form.controls.items;}
  get conditions(){return this.form.controls.commercialConditions;}
  get limitReached(){return !this.saved() && this.api.session()?.quota.remaining===0;}
  today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  item(description='',quantity='1',unitPrice='0.00'){return this.fb.nonNullable.group({description:[description,[Validators.required,Validators.maxLength(250)]],quantity:[quantity,[Validators.required,Validators.pattern(/^[0-9]+([.,][0-9]{1,3})?$/)]],unitPrice:[unitPrice,[Validators.required,Validators.pattern(/^[0-9]+([.,][0-9]{1,2})?$/)]]});}
  async ngOnInit(){
    this.api.fieldErrors.set({});
    try {
      const id=this.route.snapshot.paramMap.get('id');
      if(id){
        const q=await this.api.request<Quote>('GET','/quotes/'+id);this.saved.set(q);this.calculated.set(q);
        this.items.clear();q.items.forEach(i=>this.items.push(this.item(i.description,i.quantity,i.unitPrice)));
        this.form.patchValue({issueDate:q.issueDate,customerName:q.customerName||'',vehicleName:q.vehicleName||'',vehicleNumber:q.vehicleNumber||'',licensePlate:q.licensePlate||'',subject:q.subject||'',validityDays:q.validityDays,includeContactPhone:q.includeContactPhone,contactPhone:q.contactPhone||'',includePreparedByName:q.includePreparedByName,preparedByName:q.preparedByName||'',commercialConditions:{...q.commercialConditions,paymentTerms:q.commercialConditions.paymentTerms||'',warrantyTerms:q.commercialConditions.warrantyTerms||'',notes:q.commercialConditions.notes||''},discountEnabled:q.discountAmount!=='0.00',discountAmount:q.discountAmount});
      } else {
        const profile=await this.api.request<UserProfile>('GET','/me/profile');
        this.form.patchValue({contactPhone:profile.contactPhone||'',preparedByName:profile.preparedByName||''});
      }
      this.updateOptionalValidators();this.form.markAsPristine();
      this.subscriptions.add(this.form.valueChanges.subscribe(()=>{this.updateOptionalValidators();this.api.fieldErrors.set({});this.preview.set(null);}));
      this.subscriptions.add(this.form.valueChanges.pipe(debounceTime(400)).subscribe(()=>void this.calculate()));
    }catch{}finally{this.busy.set(false);}
  }
  private updateOptionalValidators(){
    const v=this.form.getRawValue();
    const pairs=[
      [this.conditions.controls.paymentTerms,v.commercialConditions.includePaymentTerms,500],
      [this.conditions.controls.warrantyTerms,v.commercialConditions.includeWarranty,500],
      [this.conditions.controls.notes,v.commercialConditions.includeNotes,2000],
      [this.form.controls.contactPhone,v.includeContactPhone,50],
      [this.form.controls.preparedByName,v.includePreparedByName,150],
    ] as const;
    for(const [control,enabled,max] of pairs){control.setValidators(enabled?[Validators.required,Validators.pattern(/\S/),Validators.maxLength(max)]:[]);control.updateValueAndValidity({emitEvent:false});}
  }
  payload():QuoteInput{
    const v=this.form.getRawValue(),c=v.commercialConditions;
    return {issueDate:v.issueDate,customerName:v.customerName,vehicleName:v.vehicleName||null,vehicleNumber:v.vehicleNumber||null,licensePlate:v.licensePlate||null,subject:v.subject||null,validityDays:v.validityDays,
      commercialConditions:{...c,paymentTerms:c.includePaymentTerms?c.paymentTerms:null,warrantyTerms:c.includeWarranty?c.warrantyTerms:null,notes:c.includeNotes?c.notes:null},
      includeContactPhone:v.includeContactPhone,contactPhone:v.includeContactPhone?v.contactPhone:null,includePreparedByName:v.includePreparedByName,preparedByName:v.includePreparedByName?v.preparedByName:null,
      items:v.items.map(i=>({description:i.description,quantity:i.quantity.replace(',','.'),unitPrice:i.unitPrice.replace(',','.')})),discountAmount:v.discountEnabled?v.discountAmount.replace(',','.'):'0.00',...(this.saved()?{version:this.saved()!.version}:{})};
  }
  add(){if(this.items.length<100){this.items.push(this.item());this.form.markAsDirty();}}
  remove(i:number){if(this.items.length>1){this.items.removeAt(i);this.form.markAsDirty();}}
  async calculate(){const generation=++this.generation;if(this.form.invalid){this.calcError.set('Revise os campos destacados.');return;}try{const q=await this.api.request<Quote>('POST','/quotes/calculate',this.payload());if(generation===this.generation){this.calculated.set(q);this.calcError.set('');}}catch{if(generation===this.generation)this.calcError.set('Revise os valores e os campos informados.');}}
  async save():Promise<Quote|null>{
    if(this.limitReached){this.api.error.set('Você atingiu o limite de 50 orçamentos do plano gratuito. Mais orçamentos estarão disponíveis na versão paga.');return null;}
    if(this.form.invalid){this.form.markAllAsTouched();this.calcError.set('Revise os campos destacados antes de salvar.');return null;}
    this.busy.set(true);this.api.fieldErrors.set({});
    try{const body=this.payload(),payload=JSON.stringify(body);if(payload!==this.keyPayload){this.key=crypto.randomUUID();this.keyPayload=payload;}
      const q=await this.api.request<Quote>(this.saved()?'PUT':'POST',this.saved()?'/quotes/'+this.saved()!.id:'/quotes',body,this.key);
      this.saved.set(q);this.calculated.set(q);this.form.markAsPristine();this.calcError.set('');await this.api.loadSession();this.api.notice.set('Orçamento salvo.');return q;
    }catch{return null;}finally{this.busy.set(false);}
  }
  async pdf(download:boolean){const q=this.form.dirty||!this.saved()?await this.save():this.saved();if(!q)return;this.busy.set(true);try{const blob=await this.api.pdf(q.id);if(download){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=quotePdfFilename(q);a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}else{if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);this.previewUrl=URL.createObjectURL(blob);this.preview.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl));}}catch{this.api.error.set('Não foi possível gerar o PDF. Tente novamente.');}finally{this.busy.set(false);}}
  prepareShare = async (): Promise<Quote | null> => this.form.dirty || !this.saved() ? await this.save() : this.saved();
  hasChanges(){return this.form.dirty;}
  @HostListener('window:beforeunload',['$event']) beforeUnload(event:BeforeUnloadEvent){if(this.hasChanges()){event.preventDefault();event.returnValue='';}}
  ngOnDestroy(){this.subscriptions.unsubscribe();if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);}
}
