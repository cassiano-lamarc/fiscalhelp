import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService, Company as CompanyModel } from '../../core/http/api.service';
import { FieldError } from '../../shared/field-error';
import { cnpjValidator } from '../../shared/cnpj-validator';
@Component({selector:'app-company',imports:[ReactiveFormsModule,MatButtonModule,FieldError],templateUrl:'./company.html',styleUrl:'./company.scss'})
export class Company implements OnInit {
  api=inject(ApiService);private fb=inject(FormBuilder);private router=inject(Router);
  private destroyRef=inject(DestroyRef);
  company=signal<CompanyModel|null>(null);busy=signal(true);review=signal(false);selected=signal(false);logo=signal<string|null>(null);
  form=this.fb.nonNullable.group({name:['',[Validators.required,Validators.minLength(2),Validators.maxLength(150)]],cnpj:['',cnpjValidator],showHeaderLogo:[true],showWatermark:[true]});
  get confirmed(){return !!this.company()?.confirmedAtUtc;}
  async ngOnInit(){this.api.fieldErrors.set({});this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.api.fieldErrors.set({}));try{const c=await this.api.request<CompanyModel|null>('GET','/company');this.apply(c);this.selected.set(!!c);}catch{}finally{this.busy.set(false);}}
  apply(c:CompanyModel|null){this.company.set(c);if(c){this.form.patchValue({name:c.name,cnpj:c.cnpj||'',showHeaderLogo:c.showHeaderLogo,showWatermark:c.showWatermark});this.logo.set(c.logoAssetId);}this.form.markAsPristine();}
  hasChanges(){return this.form.dirty;}
  async save(){if(this.form.invalid){this.form.markAllAsTouched();return;}this.busy.set(true);this.api.fieldErrors.set({});try{const c=await this.api.request<CompanyModel>('PUT','/company',{...this.form.getRawValue(),logoAssetId:this.logo(),version:this.company()?.version??null});this.apply(c);if(c.confirmedAtUtc){await this.api.loadSession();this.api.notice.set('Empresa atualizada para novos orçamentos.');}else this.review.set(true);}catch{}finally{this.busy.set(false);}}
  async confirmCompany(){this.busy.set(true);try{await this.api.request('POST','/company/confirm',{version:this.company()!.version});this.form.markAsPristine();await this.api.loadSession();await this.router.navigate(['/orcamentos']);}catch{}finally{this.busy.set(false);}}
  async upload(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;if(file.size>2097152){this.api.error.set('Use uma imagem de até 2 MB.');return;}this.busy.set(true);try{const data=new FormData();data.append('file',file);const r=await this.api.request<{assetId:string;company:CompanyModel|null}>('POST','/company/logo',data);if(r.company)this.company.set(r.company);this.logo.set(r.assetId);this.form.patchValue({showHeaderLogo:true,showWatermark:true});if(!this.confirmed)this.form.markAsDirty();this.api.notice.set('Logo atualizada.');}catch{}finally{this.busy.set(false);input.value='';}}
  async removeLogo(){this.busy.set(true);try{const c=await this.api.request<CompanyModel|null>('DELETE','/company/logo');this.logo.set(null);if(c)this.company.set(c);this.api.notice.set('Logo removida. Documentos anteriores foram preservados.');}catch{}finally{this.busy.set(false);}}
}
